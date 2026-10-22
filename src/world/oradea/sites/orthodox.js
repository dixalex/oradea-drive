// OWNER: oradea. The Orthodox churches of Oradea (Romanian Orthodox Diocese), as they look today. Two tiers, one shared material
// set (ten meshes for the whole site, the root group `landmark-orthodox`):
//   (a) hand-built from photos: the Episcopal Cathedral «Învierea Domnului» (OSM 286245390, Piața Emanuil Gojdu, 1995–2012, consecrated
//       2020: cream limestone with mauve stone bands, a central drum and two west drums under flared slate spires, 67 m); Holy Trinity
//       (ex-St Brigitta, Parcul Traian 13, 1722: a baroque front with a volute gable and a silver onion ridge turret – the OSM way is the
//       untagged 423125889); the wooden church from Corbești (OSM 914060058, 17th c., moved to the Holy Cross Monastery in 1994: dark
//       shingles, a tall shingled spire); the church of St Andrew (OSM 420844002, banded red and yellow brick, a bell tower over a broad
//       stair); the church of Sts Michael and Gabriel in Velența (OSM 286239556, baroque, a west tower with a silver spire)
//   (b) the parametric kit (./orthodox/church.js, specs in ./orthodox/specs.js): every other Orthodox church of the play area, built
//       on its OSM footprint with a nave, cross arms, an apse, domes, a west tower, roof colour and material set per church
// Not built: n2011414125 «Sf. Trei Ierarhi» (a church on the ground floor of an apartment block, no building of its own), the unnamed OSM
// churches whose denomination is not tagged. Biserica cu Lună is in unirii.js.
//   SITE.skip: the OSM buildings replaced; the tier-(a) churches are sights in places.js (catedralaortodoxa, sftreime, sfandrei, sfmihailgavriil, bisericalemn)
//   build(base) -> { update, clear, footprints, stats }
import * as THREE from 'three';
import { Group } from 'three';
import { rng, inPoly } from '../../cherkasy/geo.js';
import { nightK } from '../../../render/daylight.js';
import { newSet, makeMats, finishSet } from './orthodox/kit.js';
import { buildChurch } from './orthodox/church.js';
import { buildCathedral, CATHEDRAL_ID } from './orthodox/cathedral.js';
import { buildTrinity, TRINITY_ID } from './orthodox/trinity.js';
import { buildWooden, WOODEN_ID } from './orthodox/wooden.js';
import { buildAndrei, ANDREI_ID } from './orthodox/andrei.js';
import { buildMihail, MIHAIL_ID } from './orthodox/mihail.js';
import { KIT, SKIP as KIT_SKIP } from './orthodox/specs.js';

const ringOf = (map, id) => { const b = map.buildings.find((o) => o.id === id); if (!b) return null; const P = []; for (let i = 0; i < b.p.length; i += 2) P.push([b.p[i], b.p[i + 1]]); return P; };


export const SITE = {
  id: 'orthodox',
  label: 'Bisericile ortodoxe',
  skip: [...KIT_SKIP, CATHEDRAL_ID, TRINITY_ID, WOODEN_ID, ANDREI_ID, MIHAIL_ID],
  places: [], // the five hand-built churches are sights in places.js
  ground: true,
  build(base) {
    const { root, map, solids: S, geo } = base, t0 = performance.now();
    const heightAt = base.ground?.heightAt ?? base.heightAt, r = rng(1722);
    const g = (x, z) => { const h = heightAt(x, z); return Number.isFinite(h) ? h : 3; };
    const group = Object.assign(new Group(), { name: 'landmark-orthodox' });
    root.add(group);
    const B = newSet(), M = makeMats(r), footprints = [], lots = [], stats = { churches: 0, windows: 0, domes: 0, towers: 0, skipped: [] };

    const built = (res) => { footprints.push(...res.footprints); lots.push(res.footprints[0].poly); stats.churches++; stats.windows += res.stats.windows ?? 0; stats.domes += res.stats.domes ?? 0; stats.towers += res.stats.towers ?? 0; };
    for (const spec of KIT) {
      let ring = null;
      if (spec.node) { const [x, z] = geo.toXZ(...spec.node); ring = typeof spec.ring === 'function' ? spec.ring(x, z) : null; }
      else if (typeof spec.ring === 'function') ring = spec.ring();
      else ring = ringOf(map, spec.id);
      if (!ring) { stats.skipped.push(spec.key); continue; }
      try { built(buildChurch({ B, S, g, spec, ring })); } catch (e) { console.error(`[oradea] church ${spec.key} failed`, e); stats.skipped.push(spec.key); }
    }

    // tier (a): the hand-built churches
    const hand = [['catedrala', CATHEDRAL_ID, (ring) => buildCathedral({ B, S, g, ring })], ['treime', TRINITY_ID, (ring) => buildTrinity({ B, S, g, ring })], ['lemn', WOODEN_ID, (ring) => buildWooden({ B, S, g, ring })], ['andrei', ANDREI_ID, (ring) => buildAndrei({ B, S, g, ring })], ['mihail', MIHAIL_ID, (ring) => buildMihail({ B, S, g, ring })]];
    for (const [key, id, fn] of hand) {
      const ring = ringOf(map, id);
      if (!ring) { stats.skipped.push(key); continue; }
      try { built(fn(ring)); } catch (e) { console.error(`[oradea] church ${key} failed`, e); stats.skipped.push(key); }
    }

    const out = finishSet(group, B, M);
    console.log(`[oradea] Orthodox churches: ${stats.churches} churches, ${(out.verts / 1000).toFixed(1)}k verts, ${out.meshes} meshes in ${(performance.now() - t0).toFixed(0)} ms${stats.skipped.length ? ', skipped ' + stats.skipped.join(',') : ''}`);

    const near = (poly, x, z, m) => {
      if (inPoly(poly, x, z)) return true;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const ax = poly[j][0], az = poly[j][1], dx = poly[i][0] - ax, dz = poly[i][1] - az, L2 = dx * dx + dz * dz || 1;
        const f = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2));
        if (Math.hypot(x - ax - dx * f, z - az - dz * f) < m) return true;
      }
      return false;
    };
    return {
      footprints, stats,
      clear: (x, z) => lots.some((q) => near(q, x, z, 4)),
      update() {
        const k = nightK.value, e = Math.min(1, 3 * k);
        M.lit.emissiveIntensity = 0.9 * k; M.wall.emissiveIntensity = 0.1 * e; M.stone.emissiveIntensity = 0;
      },
    };
  },
};
void THREE;
