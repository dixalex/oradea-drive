// OWNER: oradea. BSVO, Biserica Baptistă Stânca Veacurilor Oradea (https://bsvo.ro), a Baptist church at Calea Borșului 3, Oradea; a game
// partner (its door ring and pitch card are in sites/partners.js and places.js). The church is OSM way 717082633 (433 m2, an untagged
// box the city generator drew as a plain public block), not the 87 m2 house 717082635 beside the lane, where the listings' pins fall:
// Google's own place pin (47.075491, 21.9033157) lies inside the long building, and the church's name is painted on it.
// Rebuilt from what stands there today – the Google Street View panoramas of April 2025 and May 2024 (the lane side, the Kaufland car
// park behind), the church's logo (its Facebook mark), the Bing aerial and the OSM outlines (the aerial agrees with them within 1.5 m):
//   – the church: the old trading hall the congregation took over (consecrated 11 December 2022), one storey, 43.45 x 9.96 m, grey-white
//     render over a dark blue-grey plinth under a low hipped roof of ribbed rust-brown metal tile; the north front onto the yard with its window rhythm, the
//     glazed doors, the mustard fascia of the old shop on the east third and the church's own lettering painted on the wall (the BSVO
//     mountain and cross, «BISERICA BAPTISTĂ / STÂNCA VEACURILOR»); the weathered south wall with a wide window, a barred one and three small vents;
//   – the cream shop at the lane (OSM 717082635), which stands in front of the yard beside the gate and is not the church's;
//   – the grounds (./bsvo/grounds.js): the concrete yard, the mesh gate (shown open) and the diagonal fence, the white precast wall on the
//     west, the mesh fence and gravel bed along the south wall, the lawn behind the shop.
// Guesses, listed with the code: the window counts and positions on the west third of the north front (a shed abuts it there and the
// panoramas do not show it), the east and west ends, the south wall's window spacing, the entrance (the glazed double door at u 24.6 –
// 26.6 is chosen as the way in), the gate standing open, the shop's side walls. Window positions along the north front were measured
// off the April 2025 panorama (a projection fitted to the building's ends), to about half a metre. The OSM Overture box 3000008664
// (two white trailers in the 2022 aerial, gone in the 2025 panoramas) is skipped: the yard is open concrete.
//   SITE { id, label, skip, places: [], ground: true, build(base) -> { update, clear, footprints, stats } }   (no `partners`)
//   Six draw calls (wall, roof, det, lit, board, ground), one root group `landmark-bsvo`. Frame, volumes: ./bsvo/church.js, ./bsvo/kit.js.
import * as THREE from 'three';
import { MB, M4 } from '../../../kit/mesh.js';
import { nightK } from '../../../render/daylight.js';
import { finish } from '../../cherkasy/slabkit.js';
import { decal } from '../../cherkasy/sculpt.js';
import { rng } from '../../cherkasy/geo.js';
import { O, ANG, toMap, plasterTex, tileTex, grainTex, boardAtlas } from './bsvo/kit.js';
import { buildChurch, buildShop, RING, SHOP } from './bsvo/church.js';
import { buildGrounds } from './bsvo/grounds.js';

export const CHURCH_ID = 717082633, SHOP_ID = 717082635, TRAILERS_ID = 3000008664;

export const SITE = {
  id: 'bsvo',
  label: 'BSVO, Calea Borșului 3',
  skip: [CHURCH_ID, SHOP_ID, TRAILERS_ID],
  places: [], // the partner entry is in places.js
  ground: true,
  build(base) {
    const { root, solids: S } = base, gnd = base.ground?.heightAt ?? base.heightAt;
    const g = (x, z) => { const h = gnd(x, z); return Number.isFinite(h) ? h : 0; };
    const t0 = performance.now(), n0 = S.count, r = rng(2022);
    const B = Object.fromEntries(['wall', 'roof', 'det', 'lit', 'board', 'ground'].map((k) => [k, new MB()]));
    const framed = ['wall', 'roof', 'det', 'lit', 'board'];
    for (const k of framed) B[k].setXf(M4(O[0], 0, O[1], -ANG)); // local (u, y, v) -> map; y stays absolute
    const church = buildChurch({ B, S, g });
    const shop = buildShop({ B, S, g });
    const grounds = buildGrounds({ B, S, g, r });
    for (const k of framed) B[k].setXf(null);

    const atlas = boardAtlas();
    const M = {
      wall: new THREE.MeshStandardMaterial({ map: plasterTex(r), vertexColors: true, roughness: 0.93 }),
      roof: new THREE.MeshStandardMaterial({ map: tileTex(r), vertexColors: true, roughness: 0.62, side: THREE.DoubleSide }),
      det: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.1, side: THREE.DoubleSide }),
      lit: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.15, metalness: 0.35, emissive: 0xffd9a0, emissiveIntensity: 0 }),
      board: new THREE.MeshStandardMaterial({ map: atlas.map, emissiveMap: atlas.emissiveMap, emissive: 0xffffff, emissiveIntensity: 0, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6 }),
      ground: decal(new THREE.MeshStandardMaterial({ map: grainTex(r), vertexColors: true, roughness: 0.95 }), 1),
    };
    const out = finish(root, 'landmark-bsvo', B, M, { shade: ['wall', 'roof', 'det'] });
    console.log(`[oradea] BSVO: ${(out.verts / 1000).toFixed(1)}k verts, ${out.meshes} meshes, ${church.stats.openings + church.stats.doors} openings, ${S.count - n0} solids, ${Math.round(performance.now() - t0)} ms`);
    const ring = (P, h, kind, name, id) => ({ poly: P.map(([u, v]) => toMap(u, v)), h, kind, name, id });
    return {
      footprints: [ring(RING, church.top - church.gLo + 0.5, 'church', 'BSVO', CHURCH_ID), ring(SHOP, shop.top - church.gLo + 0.5, 'shop', 'Calea Borșului 3', SHOP_ID)],
      clear: grounds.clear,
      update() {
        const k = nightK.value, e = Math.min(1, 3 * k);
        M.lit.emissiveIntensity = 0.85 * k; M.board.emissiveIntensity = 0.95 * e;
      },
      stats: { verts: out.verts, tris: out.tris, meshes: out.meshes, solids: S.count - n0, ...church.stats, ...grounds.stats, floor: +church.yF.toFixed(2) },
    };
  },
};
