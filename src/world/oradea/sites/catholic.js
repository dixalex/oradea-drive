// OWNER: oradea. The Roman and Greek Catholic churches of Oradea (the generic OSM boxes replaced), in two tiers, one shared material
// set (six meshes for the whole site, the root group `landmark-catholic`):
//   (a) hand-built from photographs (./catholic/*.js, one builder each): the Premonstratensian church «Maica Îndurerată» (OSM 1525803458, the
//       Baroque twin-tower front of 1740–1772), the Ursuline church «Sfânta Ana» (a node in Calea Republicii, 1774, a stepped neo-Gothic front and
//       a slate-spired tower set on the street edge of the Ady school's ring, which sites/republicii draws), the Greek Catholic Seminary church
//       «Sfântul Gheorghe» (OSM 312206820, 1858, pink and white neo-Romanesque with a blue spire), the Franciscan church of Olosig «Coborârea
//       Sfântului Duh» (OSM 286245391, the three-tower front of 1903–05), the Misericordians' church «Îngerii păzitori» (a node, c. 1754, two
//       slender spires and a volute gable, with the hospital wings of its ring OSM 41416354 rebuilt around it) and «Adormirea Maicii Domnului»
//       (OSM 1540255477, the Lazarists' three-tower church of the 1930s)
//   (b) the parametric kit (./catholic/church.js, specs in ./catholic/specs.js): every other Catholic church of the play area, built on its OSM
//       footprint with a nave, apse, front towers, roof colour and material set per church
// Not built here: the garrison church in the fortress (OSM 190653989, sites/cetate), the basilica (sites/baroc), St Ladislaus (sites/primaria),
// the Greek Catholic cathedral (sites/unirii); the chapel of St Elisabeth (OSM way 489535792) is part of the Posticum building (OSM 489535790)
// and has no footprint of its own in the compiled map.
//   SITE.skip: the OSM buildings replaced;  SITE.places: the tier-(a) churches as sights (the orchestrator moves them into places.js)
//   build(base) -> { update, clear, footprints, stats }   stats.verts: vertices per church
import { Group } from 'three';
import { rng, inPoly } from '../../cherkasy/geo.js';
import { nightK } from '../../../render/daylight.js';
import { t } from '../../../i18n.js';
import { newSet, makeMats, finishSet, end } from './catholic/kit.js';
import { buildChurch } from './catholic/church.js';
import { KIT, ADORMIREA, SKIP as KIT_SKIP } from './catholic/specs.js';
import { premonSpec } from './catholic/premon.js';
import { buildUrsuline } from './catholic/ursuline.js';
import { buildSeminar, SEMINAR_ID } from './catholic/seminar.js';
import { buildDuh, DUH_ID } from './catholic/duh.js';
import { buildMiseri, HOSPITAL_ID } from './catholic/miseri.js';
import { buildAdormirea, ADORMIREA_ID } from './catholic/adormirea.js';

const ringOf = (map, id) => { const b = map.buildings.find((o) => o.id === id); if (!b) return null; const P = []; for (let i = 0; i < b.p.length; i += 2) P.push([b.p[i], b.p[i + 1]]); return P; };

export const SITE = {
  id: 'catholic',
  label: 'Bisericile catolice',
  skip: [...KIT_SKIP, premonSpec.id, SEMINAR_ID, DUH_ID, HOSPITAL_ID],
  places: [], // the sights live in places.js (the phone map loads no site)
  ground: true,
  build(base) {
    const { root, map, solids: S, geo } = base, t0 = performance.now();
    const heightAt = base.ground?.heightAt ?? base.heightAt, r = rng(1754);
    const g = (x, z) => { const h = heightAt(x, z); return Number.isFinite(h) ? h : 3; };
    const group = Object.assign(new Group(), { name: 'landmark-catholic' });
    root.add(group);
    const B = newSet(), M = makeMats(r), footprints = [], lots = [], stats = { churches: 0, windows: 0, towers: 0, skipped: [], verts: {} };
    const nv = () => Object.values(B).reduce((n, D) => n + D.v, 0);
    const built = (res) => { footprints.push(...res.footprints); lots.push(...res.footprints.map((f) => f.poly)); stats.churches++; stats.windows += res.stats.windows ?? 0; stats.towers += res.stats.towers ?? 0; };
    const run = (key, fn) => { const v0 = nv(); try { built(fn()); stats.verts[key] = nv() - v0; } catch (e) { console.error(`[oradea] catholic ${key} failed`, e); end(B); stats.skipped.push(key); } };

    const hand = [   // the hand-built churches: the OSM way they stand on (a ring) or none, and the builder
      ['ursuline', null, () => buildUrsuline({ B, S, g })],
      ['seminar', SEMINAR_ID, (ring) => buildSeminar({ B, S, g, ring })],
      ['duh', DUH_ID, () => buildDuh({ B, S, g })],
      ['miseri', HOSPITAL_ID, () => buildMiseri({ B, S, g })],
      ['adormirea', ADORMIREA_ID, (ring) => buildAdormirea({ B, S, g, ring })],
    ];
    for (const spec of [...KIT, premonSpec]) {
      const ring = ringOf(map, spec.id);
      if (!ring) { stats.skipped.push(spec.key); continue; }
      run(spec.key, () => buildChurch({ B, S, g, spec, ring }));
    }
    for (const [key, id, fn] of hand) {
      const ring = id == null ? null : ringOf(map, id);
      if (id != null && !ring) { stats.skipped.push(key); continue; }
      run(key, () => fn(ring));
    }
    void ADORMIREA; void geo;

    const out = finishSet(group, B, M, 'catholic');
    console.log(`[oradea] Catholic churches: ${stats.churches} churches, ${(out.verts / 1000).toFixed(1)}k verts, ${out.meshes} meshes in ${(performance.now() - t0).toFixed(0)} ms${stats.skipped.length ? ', skipped ' + stats.skipped.join(',') : ''}`);

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
        M.lit.emissiveIntensity = 0.9 * k; M.wall.emissiveIntensity = 0.08 * e;
      },
    };
  },
};
void t;
