// OWNER: oradea. The Baroque ensemble in the north of Oradea's centre, as it looks today: the Roman Catholic Basilica
// (Catedrala Bazilică «Adormirea Maicii Domnului», 1752-1780), the Baroque Palace (the former bishop's palace, 1762-1777),
// Șirul Canonicilor (the Canons' Row, 57 arches, 1758-1875) and the plaza and park between them: the largest Baroque complex in
// Romania. Sources: Wikipedia (ro / hu / en), Wikimedia Commons photos of all three, the Esri aerial (the plaza, the bed and the
// garden are traced from it) and OSM.
//   SITE.skip: the three OSM buildings it replaces (262832955 Basilica, 262832527 Palace, 262833611 Canons' Row)
//   SITE.places: the Canons' Row as a sight (the Basilica and the Palace are in places.js; its `palatulbaroc` entry points at
//     OSM 81495785, another heritage palace far to the south: the Baroque Palace is 262832527)
//   SITE.shape: levels the terrain under the Palace and the Basilica (hf.pad)
//   build(base) -> { update, clear, footprints, spots, stats }
// Helpers live in ./baroc/: kit.js (frames, roofs, textures), basilica.js, palace.js, canons.js, park.js. One root group
// `landmark-baroc` (kept by proxies.js on the lower levels), ~15 meshes, one per material.
import * as THREE from 'three';
import { MB } from '../../../kit/mesh.js';
import { nightK } from '../../../render/daylight.js';
import { finish } from '../../cherkasy/slabkit.js';
import { rng } from '../../cherkasy/geo.js';
import { decal } from '../../cherkasy/sculpt.js';
import { barTex } from '../../cherkasy/bridgekit.js';
import { t } from '../../../i18n.js';
import { plasterTex, rustTex, tileTex, sheetTex, cobbleTex, gravelTex, lawnTex, bedTex } from './baroc/kit.js';
import { buildPalace, paintAtlas, PALACE_SKIP } from './baroc/palace.js';
import { buildBasilica, BASILICA_SKIP } from './baroc/basilica.js';
import { buildCanons, paintCanons, CANONS_SKIP } from './baroc/canons.js';
import { buildPark } from './baroc/park.js';

const IDS = { basilica: BASILICA_SKIP[0], palace: PALACE_SKIP[0], canons: CANONS_SKIP[0] };
const ringOf = (map, id) => { const b = map.buildings.find((o) => o.id === id); if (!b) return null; const P = []; for (let i = 0; i < b.p.length; i += 2) P.push([b.p[i], b.p[i + 1]]); return P; };

export const SITE = {
  id: 'baroc',
  label: 'Ansamblul baroc',
  skip: [IDS.basilica, IDS.palace, IDS.canons],
  places: [], // its places are in ../places.js, so the phone map lists them too
  shape(hf, map) {
    for (const id of [IDS.palace, IDS.basilica]) { const R = ringOf(map, id); if (R) hf.pad(R, 16); }
  },
  ground: true,
  build(base) {
    const { root, map, solids: S } = base;
    const heightAt = base.ground?.heightAt ?? base.heightAt;
    const t0 = performance.now(), r = rng(1752);
    const B = {};
    for (const k of ['plaster', 'wallP', 'wallC', 'rust', 'glass', 'lit', 'tile', 'metal', 'det', 'glow', 'rail', 'cobble', 'gravel', 'lawn', 'bed']) B[k] = new MB();
    const palAtlas = paintAtlas(r), canAtlas = paintCanons(r);
    const M = {
      plaster: new THREE.MeshStandardMaterial({ map: plasterTex(r), vertexColors: true, roughness: 0.9, emissive: 0xffc070, emissiveIntensity: 0 }),
      rust: new THREE.MeshStandardMaterial({ map: rustTex(r), vertexColors: true, roughness: 0.92, emissive: 0xffc070, emissiveIntensity: 0 }),
      wallP: new THREE.MeshStandardMaterial({ map: palAtlas.tex, emissiveMap: palAtlas.mask, emissive: 0xffd9a8, emissiveIntensity: 0, vertexColors: true, roughness: 0.9 }),
      wallC: new THREE.MeshStandardMaterial({ map: canAtlas.tex, emissiveMap: canAtlas.mask, emissive: 0xffd9a8, emissiveIntensity: 0, vertexColors: true, roughness: 0.92 }),
      glass: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.15, metalness: 0.35 }),
      lit: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.15, metalness: 0.35, emissive: 0xffd9a8, emissiveIntensity: 0 }),
      tile: new THREE.MeshStandardMaterial({ map: tileTex(r), vertexColors: true, roughness: 0.82, side: THREE.DoubleSide }),
      metal: new THREE.MeshStandardMaterial({ map: sheetTex(), vertexColors: true, roughness: 0.45, metalness: 0.3, side: THREE.DoubleSide }),
      det: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.1 }),
      glow: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, emissive: 0xfff0d0, emissiveIntensity: 0 }),
      rail: new THREE.MeshStandardMaterial({ vertexColors: true, alphaMap: barTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.2 }),
      cobble: decal(new THREE.MeshStandardMaterial({ map: cobbleTex(r), vertexColors: true, roughness: 0.93 }), 2),
      gravel: decal(new THREE.MeshStandardMaterial({ map: gravelTex(r), vertexColors: true, roughness: 0.95 }), 3),
      lawn: decal(new THREE.MeshStandardMaterial({ map: lawnTex(r), vertexColors: true, roughness: 0.96 }), 1),
      bed: decal(new THREE.MeshStandardMaterial({ map: bedTex(r), vertexColors: true, roughness: 0.96 }), 4),
    };
    B.wallP.setColor('#ffffff'); B.wallC.setColor('#ffffff');
    const ctx = { B, S, heightAt, r, map };
    const pal = buildPalace({ ...ctx, atlas: palAtlas });
    const bas = buildBasilica(ctx);
    const can = buildCanons({ ...ctx, atlas: canAtlas });
    const park = buildPark({ ...ctx, pal, bas, can });
    const out = finish(root, 'landmark-baroc', B, M, { shade: ['plaster', 'wallP', 'wallC', 'rust', 'tile', 'metal', 'det'] });
    const stats = { verts: out.verts, meshes: out.meshes, ms: Math.round(performance.now() - t0), windows: bas.windows, arches: can.arches, lamps: park.lamps, benches: park.benches, trees: park.spots.length };
    console.log(`[oradea] baroc: ${(out.verts / 1000).toFixed(1)}k verts, ${out.meshes} meshes, ${can.arches} arches, ${park.lamps} lamps, ${park.benches} benches, ${stats.ms} ms`);
    return {
      footprints: [...pal.footprints, ...bas.footprints, ...can.footprints],
      clear: park.clear,
      spots: park.spots,
      update() { const k = nightK.value; M.plaster.emissiveIntensity = M.rust.emissiveIntensity = 0.1 * k; M.lit.emissiveIntensity = 0.6 * k; M.wallP.emissiveIntensity = 0.7 * k; M.wallC.emissiveIntensity = 0.6 * k; M.glow.emissiveIntensity = 1.8 * k; },
      stats,
    };
  },
};
