// OWNER: oradea. Oradea's Reformed, Lutheran and Unitarian churches and its synagogues (the generic OSM boxes replaced), in two tiers, one shared
// material set (seven meshes for the central churches in the root group `landmark-reformed`, and one more set for Seleuș, which lies outside
// the phone tier's 1800 m disc and so stays in a group of its own, `landmark-reformed-seleus`):
//   (a) hand-built from photographs (./reformed/*.js, one builder each): the Reformed church of the Orașul Nou on Strada Jean Calvin (OSM 286245387,
//       1835–1853, a Neoclassical hall with a pedimented front between two towers under silver domes), the Reformed church of Olosig (OSM 423125881,
//       a cream front with giant pilasters and a clock tower under a copper cap), the Lutheran church (OSM 1455869295, Tudor Vladimirescu 26, a
//       yellow-brick neo-Gothic front with a tall spire and a stair turret), the Great Orthodox Synagogue (OSM 286239557, Mihai Viteazul 4, 1890,
//       restored 2009–2018: brick and ochre front, two onion-domed towers, the tablets over the gable) and the Aachvas Rein synagogue, now the
//       Museum of Jewish History (OSM 286245386, Primăriei 25, 1926: yellow render, twisted corner columns, a Star-of-David gable)
//   (b) the parametric kit (./reformed/church.js, specs in ./reformed/specs.js): the other churches (Unitarian, Reformed Seleuș, Csillagváros,
//       Rogerius, Rét) and synagogues (the Small Orthodox, Poale Cedek, Visznitz), each on its OSM footprint, dressed per building from the aerial
//       view; those without a photograph are marked as guesses in specs.js
// Not built here: the Zion Neolog synagogue (sites/ferdinand), churches of other denominations (sites/orthodox, baptist, catholic), the Reformed
// churches outside the play area (Sântion, the node at 7141, -2771).
//   SITE.skip: the OSM buildings replaced;  SITE.places: empty, the tier-(a) sights live in places.js
//   build(base) -> { update, clear, footprints, stats }   stats.verts: vertices per building
import { Group } from 'three';
import { rng, inPoly } from '../../cherkasy/geo.js';
import { nightK } from '../../../render/daylight.js';
import { newSet, makeMats, finishSet, end } from './reformed/kit.js';
import { buildChurch } from './reformed/church.js';
import { KIT, SKIP as KIT_SKIP } from './reformed/specs.js';
import { buildRogerius } from './reformed/rogerius.js';
import { buildOrasulNou, ORASULNOU_ID } from './reformed/orasulnou.js';
import { buildOlosig, OLOSIG_ID } from './reformed/olosig.js';
import { buildLutheran, LUTHERAN_ID } from './reformed/lutheran.js';
import { buildGreatSyn, GREATSYN_ID } from './reformed/greatsyn.js';
import { buildAachvas, AACHVAS_ID } from './reformed/aachvas.js';

const ringOf = (map, id) => { const b = map.buildings.find((o) => o.id === id); if (!b) return null; const P = []; for (let i = 0; i < b.p.length; i += 2) P.push([b.p[i], b.p[i + 1]]); return P; };
const SELEUS_ID = 421767355;   // the one church outside the phone tier's disc: its own mesh set

export const SITE = {
  id: 'reformed',
  label: 'Bisericile reformate, luterane, unitariene și sinagogile',
  skip: [...KIT_SKIP, ORASULNOU_ID, OLOSIG_ID, LUTHERAN_ID, GREATSYN_ID, AACHVAS_ID],
  places: [], // the sights live in places.js (the phone map loads no site)
  ground: true,
  build(base) {
    const { root, map, solids: S, geo } = base, t0 = performance.now();
    const heightAt = base.ground?.heightAt ?? base.heightAt, r = rng(1784);
    const g = (x, z) => { const h = heightAt(x, z); return Number.isFinite(h) ? h : 3; };
    const M = makeMats(r);
    const layer = (name) => ({ name, B: newSet(), group: Object.assign(new Group(), { name }) });
    const main = layer('landmark-reformed'), far = layer('landmark-reformed-seleus');
    root.add(main.group, far.group);
    const footprints = [], lots = [], stats = { churches: 0, windows: 0, towers: 0, skipped: [], verts: {} };
    const nv = () => [main, far].reduce((n, L) => n + Object.values(L.B).reduce((m, D) => m + D.v, 0), 0);
    const built = (res) => { footprints.push(...res.footprints); lots.push(...res.footprints.map((f) => f.poly)); stats.churches++; stats.windows += res.stats?.windows ?? 0; stats.towers += res.stats?.towers ?? 0; };
    const run = (key, fn, L) => { const v0 = nv(); try { built(fn()); stats.verts[key] = nv() - v0; } catch (e) { console.error(`[oradea] reformed ${key} failed`, e); end(L.B); stats.skipped.push(key); } };

    for (const spec of KIT) {
      let ring = null;
      if (spec.node) { const [x, z] = geo.toXZ(...spec.node); ring = spec.ring(x, z); }
      else ring = ringOf(map, spec.id);
      if (!ring) { stats.skipped.push(spec.key); continue; }
      const L = spec.id === SELEUS_ID ? far : main, B = L.B;
      if (spec.custom === 'rogerius') run(spec.key, () => buildRogerius({ B, S, g, spec, ring }), L);
      else run(spec.key, () => buildChurch({ B, S, g, spec, ring }), L);
    }
    const hand = [   // the hand-built buildings: the OSM way each one stands on, and the builder
      ['orasulnou', ORASULNOU_ID, (ring) => buildOrasulNou({ B: main.B, S, g, ring })],
      ['olosig', OLOSIG_ID, (ring) => buildOlosig({ B: main.B, S, g, ring })],
      ['lutheran', LUTHERAN_ID, (ring) => buildLutheran({ B: main.B, S, g, ring })],
      ['greatsyn', GREATSYN_ID, (ring) => buildGreatSyn({ B: main.B, S, g, ring })],
      ['aachvas', AACHVAS_ID, (ring) => buildAachvas({ B: main.B, S, g, ring })],
    ];
    for (const [key, id, fn] of hand) {
      const ring = ringOf(map, id);
      if (!ring) { stats.skipped.push(key); continue; }
      run(key, () => fn(ring), main);
    }

    const a = finishSet(main.group, main.B, M, 'reformed'), b = finishSet(far.group, far.B, M, 'reformed-seleus');
    stats.meshes = a.meshes + b.meshes; stats.verts.total = a.verts + b.verts; stats.callsPhone = a.meshes;
    console.log(`[oradea] Reformed / Lutheran / Jewish: ${stats.churches} buildings, ${((a.verts + b.verts) / 1000).toFixed(1)}k verts, ${a.meshes} + ${b.meshes} meshes in ${(performance.now() - t0).toFixed(0)} ms${stats.skipped.length ? ', skipped ' + stats.skipped.join(',') : ''}`);

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
        M.lit.emissiveIntensity = 0.9 * k; M.wall.emissiveIntensity = 0.08 * e; M.brick.emissiveIntensity = 0.06 * e;
      },
    };
  },
};
