// OWNER: oradea. The north bank of the Ferdinand / Sf. Ladislau bridge in Oradea, as it looks today (the generic OSM boxes
// replaced): the Queen Mary Theatre (Teatrul de Stat, 1899–1900) with Piața Regele Ferdinand I in front of it, Casa Darvas–La
// Roche (1909–1912) and the Zion Neolog Synagogue (1877–1878). The modules are in ./ferdinand/ (kit, theatre, square,
// darvas, synagogue); they draw into one shared set of mesh builders, so the whole site is 13 meshes and ~31k vertices.
//   SITE { id, label, skip: [7211172, 1534596515, 423122948], places: [the square], ground: true, build(base) }
//   build(base) -> { update(dt), clear(x, z), spots, footprints }
// Not in the game, on purpose: a fountain (the square has none today) and tram rails (OSM's tram lines stop at Piața Unirii;
// there is no track in the square).
import * as THREE from 'three';
import { MB } from '../../../kit/mesh.js';
import { nightK } from '../../../render/daylight.js';
import { SG, decal } from '../../cherkasy/sculpt.js';
import { rng } from '../../cherkasy/geo.js';
import { floodlit, patina } from '../../cherkasy/bohdan.js';
import { t } from '../../../i18n.js';
import { renderTex, limeTex, paveTex, castTex, zincTex, leafTex, signTex } from './ferdinand/kit.js';
import { buildTheatre, THEATRE_ID } from './ferdinand/theatre.js';
import { buildSquare } from './ferdinand/square.js';
import { buildDarvas, DARVAS_ID } from './ferdinand/darvas.js';
import { buildSynagogue, SYNAGOGUE_ID } from './ferdinand/synagogue.js';

export const SITE = {
  id: 'ferdinand',
  label: 'Piața Regele Ferdinand',
  skip: [THEATRE_ID, DARVAS_ID, SYNAGOGUE_ID],
  places: [], // its places are in ../places.js, so the phone map lists them too
  ground: true,
  build(base) {
    const { root, solids: S, heightAt } = base, t0 = performance.now(), n0 = S.count, r = rng(1900);
    const g = (x, z) => { const h = heightAt(x, z); return Number.isFinite(h) ? h : 2; };
    const B = { wall: new MB(), stone: new MB(), cast: new MB(), det: new MB(), roof: new MB(), glass: new MB(), lit: new MB(), glow: new MB(), sign: new MB(), pave: new MB(), plant: new MB() };
    const stone = new SG(), bronze = new SG(), wash = [], flood = [];
    const ctx = { B, S, g, r, wash, flood, stone, bronze };
    const tot = () => Object.values(B).reduce((n, b) => n + b.v, 0) + stone.v + bronze.v, part = {};
    let m0 = tot();
    const th = buildTheatre(ctx); part.theatre = tot() - m0; m0 = tot();
    const sq = buildSquare(ctx, th); part.square = tot() - m0; m0 = tot();
    const dv = buildDarvas(ctx); part.darvas = tot() - m0; m0 = tot();
    const sy = buildSynagogue(ctx); part.synagogue = tot() - m0;
    if (!wash.length) wash.push([0, 0, 0]);
    if (!flood.length) flood.push([0, 0, 0]);

    const gTex = limeTex(r), wTex = renderTex(r), warm = new THREE.Color('#ffd9a8'), signT = signTex('TEATRUL DE STAT · ÁLLAMI SZÍNHÁZ');
    const wallMat = floodlit(new THREE.MeshStandardMaterial({ map: wTex, vertexColors: true, roughness: 0.86, emissive: 0xffe2b8, emissiveIntensity: 0 }), wash, 16, 'ferdinand-wall');
    wallMat.emissiveMap = wTex;
    const stoneMat = floodlit(new THREE.MeshStandardMaterial({ map: gTex, vertexColors: true, roughness: 0.7, emissive: 0xffe2b8, emissiveIntensity: 0 }), wash, 16, 'ferdinand-stone');
    stoneMat.emissiveMap = gTex;
    const signMat = new THREE.MeshStandardMaterial({ map: signT, roughness: 0.55, emissive: 0xffd9a0, emissiveMap: signT, emissiveIntensity: 0 });
    const M = {
      wall: wallMat, stone: stoneMat, sign: signMat,
      cast: new THREE.MeshStandardMaterial({ map: castTex(r), vertexColors: true, roughness: 0.82 }),
      det: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.2 }),
      roof: new THREE.MeshStandardMaterial({ map: zincTex(), vertexColors: true, roughness: 0.45, metalness: 0.4, side: THREE.DoubleSide }),
      glass: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.1, metalness: 0.45, envMapIntensity: 1.2 }),
      lit: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.14, metalness: 0.3, emissive: warm, emissiveIntensity: 0 }),
      glow: new THREE.MeshStandardMaterial({ color: 0xf6f0e2, roughness: 0.3, emissive: 0xffe2b0, emissiveIntensity: 0.05 }),
      pave: decal(new THREE.MeshStandardMaterial({ map: paveTex(r), vertexColors: true, roughness: 0.82, polygonOffset: true, polygonOffsetFactor: -4 })),
      plant: new THREE.MeshStandardMaterial({ map: leafTex(r), vertexColors: true, roughness: 0.95 }),
    };
    const group = Object.assign(new THREE.Group(), { name: 'ferdinand' });
    root.add(group);
    let verts = 0, meshes = 0;
    const shade = new Set(['wall', 'stone', 'cast', 'roof']);
    for (const [k, D] of Object.entries(B)) {
      if (!D.v) continue;
      verts += D.v; meshes++;
      group.add(Object.assign(new THREE.Mesh(D.build(), M[k]), { name: `ferdinand-${k}`, castShadow: shade.has(k), receiveShadow: true }));
    }
    const bronzeMat = floodlit(new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.55, roughness: 0.55, emissive: 0xc99a62, emissiveIntensity: 0 }), flood, 12, 'ferdinand-bronze');
    const figMat = floodlit(new THREE.MeshStandardMaterial({ color: 0xe8e3d6, roughness: 0.75, emissive: 0xffe6c8, emissiveIntensity: 0 }), wash, 14, 'ferdinand-fig');
    for (const [name, s, mat] of [['bronze', bronze, bronzeMat], ['figures', stone, figMat]]) {
      if (!s.v) continue;
      verts += s.v; meshes++;
      group.add(Object.assign(new THREE.Mesh(s === bronze ? patina(s.build()) : s.build(), mat), { name: `ferdinand-${name}`, castShadow: true, receiveShadow: true }));
    }
    console.log(`[oradea] ferdinand: ${(verts / 1000).toFixed(1)}k verts (${Object.entries(part).map(([k, v]) => `${k} ${(v / 1000).toFixed(1)}k`).join(', ')}), ${meshes} meshes, ${S.count - n0} solids, ${Math.round(performance.now() - t0)} ms`);
    const subs = [th, sq, dv, sy];
    return {
      spots: sq.spots,
      footprints: [th.footprint, dv.footprint, sy.footprint],
      clear: (x, z) => subs.some((q) => q.clear?.(x, z)),
      update() {
        const k = nightK.value, e = Math.min(1, 3 * k);
        M.lit.emissiveIntensity = 0.95 * k;
        wallMat.emissiveIntensity = 0.3 * e; stoneMat.emissiveIntensity = 0.22 * e; signMat.emissiveIntensity = 0.45 * e;
        M.glow.emissiveIntensity = 0.05 + 2.4 * e; bronzeMat.emissiveIntensity = 0.08 * e; figMat.emissiveIntensity = 0.1 * e;
      },
      stats: () => ({ verts, meshes }),
    };
  },
};
