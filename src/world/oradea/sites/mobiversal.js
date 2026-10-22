// OWNER: oradea. The house of Mobiversal, the Oradea software company that supports the Drumul Vieții association (Strada Thurzó Sándor 40,
// Oradea; a game partner). OSM has no outline there: the city generator's building 3000001278 (an Overture footprint, drawn as a one-storey
// house) is this building, so the generator's box is replaced by what stands there today, from the Google Street View panoramas of 2019 –
// 2024 (the 2024 and 2023 ones carry the facade; panoramas fk33cr6p…, i4GxKtCo…, wfVZ6jFP…, Y_nUsC3b…, 0TW-HJ8W…), the owner's photos on
// the company's Google Maps entry and the Bing aerial:
//   – a flat-roofed office of two blocks on a dark-grey ground floor: the low block (a first floor, 9 m) with the yellow band of dark-framed
//     windows and the company's name and mark, the tall block (two upper floors, 11.6 m) with the recessed yellow niche and the second window
//     band with its lowered roller shutter; thin black copings, black downpipes on the south wall; on the ground floor four narrow high
//     windows, the glazed shop door and the dark panel with the yellow «Goldie» script (the company's app; in 2023 it read APPOINTFIX);
//   – the concrete car park in front of it (open to the street for its southern 11 m, a wire fence on a plinth with the number plate «40» on the
//     north 12 m), the green-screened boundary fences, the neighbour's cypress hedge, two electricity cabinets and a waste bin on the pavement,
//     a young tree, five cars parked on its slabs.
// Guesses (no photograph shows them): the north, back (east) and south-east bay walls – their windows and counts – and the ground-floor
// windows on those walls, the roof fittings, the east fence, the lawn strips, the tree's spot, which slabs hold cars. The heights come from
// the panoramas by the camera geometry (±0.4 m); the length of the front wall (20.1 m) is from them too, the rest from the Overture outline.
// The company's own name and mark are on the facade as they are in the photographs (the owner's rule: allowed), so are «Goldie» and the «40».
// The generator's 3000001284 north of the hedge (a three-storey block in the data) is the neighbour's white-panelled shed, not this house.
//   SITE { id, label, skip: [3000001278], places: [], ground: true, build(base) -> { update, clear, footprints, parked, stats } }  (no `partners`)
//   MOBIVERSAL_RING: the outline as [x, z] pairs (sites/partners.js TABLE); places.js carries the same numbers flat. The test checks that
//   every id in `skip` has its footprint inside (or within 3 m of) the outline, since Overture ids (3e9 and up) can shift on a data refresh.
//   Six draw calls (wall, det, lit, sign, pave, fence), one root group `landmark-mobiversal`.
import * as THREE from 'three';
import { MB, M4 } from '../../../kit/mesh.js';
import { nightK } from '../../../render/daylight.js';
import { finish } from '../../cherkasy/slabkit.js';
import { decal } from '../../cherkasy/sculpt.js';
import { rng } from '../../cherkasy/geo.js';
import { plasterTex, concreteTex, fenceAtlas, signAtlas, mat } from './mobiversal/kit.js';
import { buildBuilding } from './mobiversal/building.js';
import { buildYard } from './mobiversal/yard.js';
import { FR, O, L, D1, D2, XB, XS, H_LOW, H_TALL, MOBIVERSAL_RING, toWorld } from './mobiversal/plan.js';

export { MOBIVERSAL_RING };
const LAND = 0.15;
export const OSM_ID = 3000001278; // the generator's id (Overture, numbered in file order: not stable across data refreshes)

export const SITE = {
  id: 'mobiversal',
  label: 'Mobiversal, Strada Thurzó Sándor 40',
  skip: [OSM_ID],
  places: [], // the partner is in places.js
  ground: true,
  build(base) {
    const { root, solids: S } = base, gnd = base.ground?.heightAt ?? base.heightAt;
    // the ground mesh stands 0.15 m over ground.heightAt (GY.LAND in cherkasy/ground.js): g is the surface the player sees
    const g = (x, z) => { const h = gnd(x, z); return (Number.isFinite(h) ? h : 3.1) + LAND; };
    const t0 = performance.now(), n0 = S.count, r = rng(40);
    // the floor line: the mean ground along the front wall, and a 12 cm threshold
    let yF = 0; for (let i = 0; i <= 10; i++) { const [x, z] = toWorld(L * i / 10, 0.3); yF += g(x, z) / 11; }
    yF += 0.12;

    const B = Object.fromEntries(['wall', 'det', 'lit', 'sign', 'pave', 'fence'].map((k) => [k, new MB()]));
    const xf = M4(O[0], yF, O[1], FR.th);
    for (const k of ['wall', 'det', 'lit', 'sign', 'fence']) B[k].setXf(xf);
    B.fence.setColor('#ffffff'); B.sign.setColor('#ffffff');
    const bld = buildBuilding(B);
    const yard = buildYard({ B, S, g, yF, r });
    for (const k of ['wall', 'det', 'lit', 'sign', 'fence']) B[k].setXf(null);

    const atlas = signAtlas();
    const M = {
      wall: mat({ map: plasterTex(r), vertexColors: true, roughness: 0.93 }),
      det: mat({ vertexColors: true, roughness: 0.72, metalness: 0.1, side: THREE.DoubleSide }),
      lit: mat({ vertexColors: true, roughness: 0.2, metalness: 0.3, emissive: 0xffd9a0, emissiveIntensity: 0 }),
      sign: mat({ map: atlas, emissiveMap: atlas, roughness: 0.5, alphaTest: 0.4, emissive: 0xffffff, emissiveIntensity: 0, side: THREE.DoubleSide }),
      pave: decal(mat({ map: concreteTex(r), vertexColors: true, roughness: 0.96 }), 1),
      fence: mat({ map: fenceAtlas(), vertexColors: true, roughness: 0.7, metalness: 0.25, alphaTest: 0.5, side: THREE.DoubleSide }),
    };
    const out = finish(root, 'landmark-mobiversal', B, M, { shade: ['wall', 'det'] });

    // ---- colliders: the two blocks (the roofs are flat, so plain prisms), the yard's own are made in yard.js
    const W = (X, Z) => toWorld(X, Z), poly = (pts) => pts.map(([X, Z]) => W(X, Z)).flat();
    S.prism(poly([[0, 0], [XS, 0], [XS, -D1], [0, -D1]]), yF - 1, yF + H_LOW, 0, 0, 'wall', 0);
    S.prism(poly([[XS, 0], [L, 0], [L, -D2], [XB, -D2], [XB, -D1], [XS, -D1]]), yF - 1, yF + H_TALL, 0, 0, 'wall', 0);

    const verts = out.verts, meshes = out.meshes;
    console.log(`[oradea] mobiversal: ${(verts / 1000).toFixed(1)}k verts, ${meshes} meshes, ${bld.openings} openings, ${S.count - n0} solids, ${yard.parked.length} cars, ${Math.round(performance.now() - t0)} ms`);
    const ring = MOBIVERSAL_RING.map((p) => [p[0], p[1]]);
    const inLot = (x, z) => yard.clear(x, z);
    return {
      footprints: [{ poly: ring, h: H_TALL, kind: 'public', name: 'Mobiversal', id: OSM_ID }],
      clear: inLot,
      parked: yard.parked,
      update() {
        const k = nightK.value, e = Math.min(1, 3 * k);
        M.lit.emissiveIntensity = 0.85 * k;
        M.sign.emissiveIntensity = 0.9 * e;
      },
      stats: { verts, tris: out.tris, meshes, solids: S.count - n0, openings: bld.openings, cars: yard.parked.length, yF: +yF.toFixed(2) },
    };
  },
};
