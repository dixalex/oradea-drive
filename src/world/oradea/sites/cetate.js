// OWNER: oradea. Cetatea Oradea, the star fortress on the Crișul Repede (16th-17th c., restored in the 2010s): five bastions
// and the curtains between them in brick over a limestone plinth, a dry moat round them with a stone counterscarp, the
// Poarta de Vest and Poarta de Est with their timber bridges, the pentagonal princely palace round its courtyard (the car
// drives in by the vaulted passage of the west wing), the yellow garrison church with its clock tower, the long casemates
// along the north curtain and at the gates. Sources: OSM (the outline way 190653999, the ring 190653953, the church 190653989),
// the plan "Oradea Citadel map RO.svg" (ArnoldPlaton, CC BY-SA 3.0, Wikimedia Commons) fitted to the outline, Wikimedia Commons
// photographs of 2012 and 2025.
//   SITE.skip: the OSM buildings it replaces (data.js SKIP)
//   SITE.shape: levels the platform and cuts the moat (cetate/moat.js);  build(base) -> { update, clear, footprints, spots, stats }
// Helpers live in ./cetate/: data.js (survey), field.js, moat.js, ringcut.js (the geometry of the earthworks), walls.js (curtains,
// counterscarp, gates, bridges), palace.js, church.js, outbuild.js, court.js (the ground inside), textures.js.
import * as THREE from 'three';
import { MB } from '../../../kit/mesh.js';
import { nightK } from '../../../render/daylight.js';
import { finish } from '../../cherkasy/slabkit.js';
import { rng } from '../../cherkasy/geo.js';
import { decal } from '../../cherkasy/sculpt.js';
import { SKIP } from './cetate/data.js';
import { shapeMoat, buildMoatGround, moatState } from './cetate/moat.js';
import { buildWalls } from './cetate/walls.js';
import { buildPalace } from './cetate/palace.js';
import { buildChurch } from './cetate/church.js';
import { buildOutbuildings } from './cetate/outbuild.js';
import { buildCourt } from './cetate/court.js';
import { wallTex, rubbleTex, bankTex, settTex, gravelTex, tileTex, plankTex, stoneTex, plasterAtlas, churchAtlas } from './cetate/textures.js';

const tile = (tex, m) => { tex.repeat.set(1 / m, 1 / m); return tex; };

export const SITE = {
  id: 'cetate',
  label: 'Cetatea Oradea',
  skip: SKIP,
  places: [],
  shape(hf, map) { shapeMoat(hf, map); },
  ground: true,
  build(base) {
    const { root, solids: S } = base, st = moatState();
    if (!st) return null;
    const t0 = performance.now(), r = rng(1618), G = st.G;
    const moat = buildMoatGround({ ground: base.ground });
    const B = {};
    for (const k of ['wall', 'rubble', 'bank', 'stone', 'timber', 'plaster', 'church', 'tile', 'plain', 'det', 'glow', 'sett', 'gravel']) B[k] = new MB();
    const pal = plasterAtlas(r, 0.28), chu = churchAtlas(r, 0.35);
    const M = {
      wall: new THREE.MeshStandardMaterial({ map: wallTex(r), vertexColors: true, roughness: 0.93 }),
      rubble: new THREE.MeshStandardMaterial({ map: tile(rubbleTex(r), 4), vertexColors: true, roughness: 0.95 }),
      bank: new THREE.MeshStandardMaterial({ map: tile(bankTex(r), 6), vertexColors: true, roughness: 0.98 }),
      stone: new THREE.MeshStandardMaterial({ map: tile(stoneTex(r), 2), vertexColors: true, roughness: 0.88 }),
      timber: new THREE.MeshStandardMaterial({ map: plankTex(r), vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }),
      plaster: new THREE.MeshStandardMaterial({ map: pal.tex, emissiveMap: pal.mask, emissive: 0xffd9a8, emissiveIntensity: 0, vertexColors: true, roughness: 0.9 }),
      church: new THREE.MeshStandardMaterial({ map: chu.tex, emissiveMap: chu.mask, emissive: 0xffd9a8, emissiveIntensity: 0, vertexColors: true, roughness: 0.9 }),
      tile: new THREE.MeshStandardMaterial({ map: tileTex(r), vertexColors: true, roughness: 0.82, side: THREE.DoubleSide }),
      plain: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, side: THREE.DoubleSide }),
      det: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.1, side: THREE.DoubleSide }),
      glow: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, emissive: 0xfff0d0, emissiveIntensity: 0 }),
      sett: decal(new THREE.MeshStandardMaterial({ map: tile(settTex(r), 2), vertexColors: true, roughness: 0.92 }), 4),
      gravel: decal(new THREE.MeshStandardMaterial({ map: tile(gravelTex(r), 4), vertexColors: true, roughness: 0.96 }), 2),
    };
    const walls = buildWalls({ st, S, B });
    const ctx = { G, B, S, r };
    const palace = buildPalace({ ...ctx, A: pal.A });
    const church = buildChurch({ ...ctx, A: chu.A });
    const out = buildOutbuildings({ ...ctx, A: pal.A, st, walls });
    const court = buildCourt({ G, st, B, r, palace });
    const fin = finish(root, 'landmark-cetate', B, M, { shade: ['wall', 'rubble', 'plaster', 'church', 'tile', 'stone', 'timber', 'plain'] });
    console.log(`[oradea] Cetatea: ${(fin.verts / 1000).toFixed(1)}k verts, ${fin.meshes} meshes, ${S.count} solids total, ${(performance.now() - t0).toFixed(0)} ms`);
    return {
      footprints: [...palace.footprints, ...church.footprints, ...out.footprints],
      spots: court.spots,
      clear: moat.clear,
      update() {
        const k = nightK.value;
        M.plaster.emissiveIntensity = 0.7 * k; M.church.emissiveIntensity = 0.7 * k; M.glow.emissiveIntensity = 1.6 * k;
      },
      deckAt: null,
      info: { st, walls, palace, church, out, court, verts: fin.verts, meshes: fin.meshes },
      stats: { verts: fin.verts, meshes: fin.meshes },
    };
  },
};
