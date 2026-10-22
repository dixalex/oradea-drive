// OWNER: oradea. Casa Minunată, the inclusive nursery, kindergarten and after-school of the Fundația Casa Minunată (Strada Traian Lalescu 47,
// open since 1994; OSM way 436834224, building=kindergarten; a game partner, its door and card are in sites/partners.js and places.js).
// OSM draws it as one 1,436 m2 public block; the outline is right (checked against the Esri aerial: four volumes round a paved courtyard)
// and this builds what stands on it, from the foundation's own photographs (casaminunata.org galleries 2010 and 2018–2024) and that aerial:
//   – the central block of two storeys in sand-coloured render with white windows under a steep dark slate gable roof, the sports hall
//     on its north-east (a tall room: ground windows and two glazed doors onto the courtyard, a ribbon of high windows, a low blue-grey
//     sheet roof) with the long brown timber pergola along its courtyard front, the south wing on the street in cream render under a
//     low sky-blue sheet roof, a small west annex; white gutters and downpipes;
//   – the reception: a dark-brown timber porch on the courtyard side with its «RECEPȚIE» plate, a tulip bed and a blue spruce;
//   – the grounds: the paved courtyard, the paths, lawns, the wooden playground tower with its slide, the plastic playhouse, benches, the teal
//     slatted fence on a plinth along the street and the church side, the street gate (open) and the footway gate.
// Guesses (no street photograph of the building was found): the volumes' heights (the shadows in the aerial give about 6–7 m to the eaves
// of the two-storey block, the photographs two storeys), the window counts on the faces the photographs do not show, the secondary door
// and the name plate on the street front (the foundation's mark and name from its website; whether the plate hangs there is not known), the
// fence's line and the reception's exact spot (OSM's footway ends at the east wall of the central block).
//   SITE { id, label, skip: [436834224], places: [], ground: true, build(base) -> { update, clear, footprints, spots, stats } }
// The partner's door ring and pitch card are not built here (sites/partners.js, places.js); the OSM id stays in `skip` so the generic block
// is not drawn. Frame, volumes and heights: ./casaminunata/building.js; fence, paving, playground, planting: ./casaminunata/grounds.js.
// Draw calls: six meshes (wall, roof, det, lit, board, ground).
import * as THREE from 'three';
import { MB, M4 } from '../../../kit/mesh.js';
import { nightK } from '../../../render/daylight.js';
import { finish } from '../../cherkasy/slabkit.js';
import { decal } from '../../cherkasy/sculpt.js';
import { rng } from '../../cherkasy/geo.js';
import { O, ANG, toMap, plasterTex, roofTex, grainTex, signAtlas } from './casaminunata/kit.js';
import { buildBuilding, RING } from './casaminunata/building.js';
import { buildGrounds } from './casaminunata/grounds.js';

export const OSM_ID = 436834224;

export const SITE = {
  id: 'casaminunata',
  label: 'Casa Minunată',
  skip: [OSM_ID],
  places: [], // the partner entry is in places.js
  ground: true,
  build(base) {
    const { root, solids: S } = base, gnd = base.ground?.heightAt ?? base.heightAt;
    const g = (x, z) => { const h = gnd(x, z); return Number.isFinite(h) ? h : 2; };
    const t0 = performance.now(), n0 = S.count, r = rng(1994);
    const B = Object.fromEntries(['wall', 'roof', 'det', 'lit', 'board', 'ground'].map((k) => [k, new MB()]));
    for (const k of ['wall', 'roof', 'det', 'lit', 'board']) B[k].setXf(M4(O[0], 0, O[1], -ANG)); // local (u, y, v) -> map; y stays absolute
    const bld = buildBuilding({ B, S, g });
    const grounds = buildGrounds({ B, S, g, r });
    for (const k of ['wall', 'roof', 'det', 'lit', 'board']) B[k].setXf(null);

    const sign = signAtlas(r);
    const M = {
      wall: new THREE.MeshStandardMaterial({ map: plasterTex(r), vertexColors: true, roughness: 0.92 }),
      roof: new THREE.MeshStandardMaterial({ map: roofTex(r), vertexColors: true, roughness: 0.55, metalness: 0.2 }),
      det: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide }),
      lit: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.15, metalness: 0.35, emissive: 0xffd9a0, emissiveIntensity: 0 }),
      board: new THREE.MeshStandardMaterial({ map: sign, emissiveMap: sign, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.5 }),
      ground: decal(new THREE.MeshStandardMaterial({ map: grainTex(r), vertexColors: true, roughness: 0.95 }), 1),
    };
    const out = finish(root, 'landmark-casaminunata', B, M, { shade: ['wall', 'roof', 'det'] });
    const ring = RING.map(([u, v]) => toMap(u, v));
    console.log(`[oradea] Casa Minunată: ${(out.verts / 1000).toFixed(1)}k verts, ${out.meshes} meshes, ${bld.stats.openings} openings, ${S.count - n0} solids, ${Math.round(performance.now() - t0)} ms`);
    return {
      footprints: [{ poly: ring, h: bld.top - bld.gLo + 0.5, kind: 'public', name: 'Casa Minunată', id: OSM_ID }],
      spots: grounds.spots,
      clear: grounds.clear,
      update() {
        const k = nightK.value, e = Math.min(1, 3 * k);
        M.lit.emissiveIntensity = 0.85 * k; M.board.emissiveIntensity = 0.05 + 0.85 * e;
      },
      stats: { verts: out.verts, tris: out.tris, meshes: out.meshes, solids: S.count - n0, ...bld.stats, ...grounds.stats, floors: [bld.yC, bld.yH] },
    };
  },
};
