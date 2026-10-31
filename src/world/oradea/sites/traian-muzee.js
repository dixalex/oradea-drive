// OWNER: oradea. The memorial museums and bronzes round Parcul Traian, hand-built (Calea Republicii is sites/republicii, Piața Ferdinand and
// its Art Nouveau corners sites/ferdinand and sites/ferdinand-olosig, the civic palaces sites/civic, Holy Trinity sites/orthodox):
//   Muzeul Memorial Ady Endre (Parcul Traian 1, the pavilion of the former «Müller» café) with the Ady statue and the «Holnap» group,
//   Muzeul Memorial Iosif Vulcan (Str. Iosif Vulcan 14, cut out of its block), Casa Memorială Aurel Lazăr (Str. Aurel Lazăr 13),
//   the Orthodox Episcopal Palace (Str. Roman Ciorogariu, 1905), the Okányi-Schwartz villa (Str. Mihai Eminescu 25A, 1912),
//   the Czárán Gyula bust and Mihai Viteazul on horseback in front of the Orthodox cathedral (moved there from Piața Unirii after 2019).
// Modules in ./traian-muzee/: atlas.js + cells-*.js + bays.js (one 2048 x 2048 facade sheet in fixed colours, half size on the phone),
// bronze.js (the bronzes with their plinths), data.js and one file per building; the places live in ../places.js. One group 'traian-muzee-art' for the
// buildings and one 'traian-bronze' for the bronzes, so the far-cull and the proxies treat them alone.
//   SITE { id: 'traian-muzee', skip: [every OSM footprint replaced], places: [],
//          ground: true, build(base) }
//   build(base) -> { update(dt), clear(x, z), footprints, stats }
import * as THREE from 'three';
import { rng } from '../../cherkasy/geo.js';
import { patina } from '../../cherkasy/bohdan.js';
import { Palette, facadeMaterial, roofTex, backAtlas } from './republicii/material.js';
import { makeKit } from './republicii/facade.js';
import { BuildingIndex } from './republicii/ring.js';
import { releaseOnUpload } from '../../../kit/batch.js';
import { buildAtlas } from './traian-muzee/atlas.js';
import { buildBronzes } from './traian-muzee/bronze.js';
import { LIST, SKIP } from './traian-muzee/data.js';

export const SITE = {
  id: 'traian-muzee',
  label: 'Muzeele din Parcul Traian',
  skip: SKIP,
  places: [], // in ../places.js: the phone map loads no site
  ground: true,
  build(base) {
    const { root, solids: S, map, detailMat } = base, t0 = performance.now(), n0 = S.count;
    const g = base.ground?.heightAt ?? base.heightAt, rnd = rng(1955), r2 = rng(1869);
    const index = new BuildingIndex(map.buildings), byId = new Map(map.buildings.map((b) => [b.id, b]));
    const atlas = buildAtlas(r2, 2048, 2048, map.phoneCentre ? 0.5 : 1), pal = new Palette(); // the phone: a half-size sheet on the GPU
    const K = makeKit(atlas, pal);
    const verts = () => K.fac.v + K.bak.v + K.det.v + K.roof.v;
    const foots = [], stats = { buildings: {}, lots: 0 };
    for (const item of LIST) {
      const b = byId.get(item.id); if (!b) continue;
      const ctx = { K, rnd, g, index, isPublic: () => true, S, pal };
      try {
        const v0 = verts(), out = item.build(ctx, b);
        foots.push(...(out.footprints ?? [out.footprint])); stats.lots += out.lots ?? 0;
        stats.buildings[item.key] = verts() - v0;
      } catch (e) { console.error(`[oradea] traian-muzee ${item.key} failed`, e); }
    }

    // ---- meshes: one set of materials
    const back = backAtlas(r2);
    const mats = {
      fac: facadeMaterial(atlas.textures, pal, { key: 'traian-muzee-fac' }),
      bak: Object.assign(facadeMaterial(back, pal, { tiled: true, key: 'traian-muzee-bak' }), { side: THREE.FrontSide, alphaTest: 0 }),
      det: detailMat,
      roof: new THREE.MeshStandardMaterial({ map: roofTex(r2), vertexColors: true, roughness: 0.78 }),
    };
    let total = 0, meshes = 0;
    const grp = Object.assign(new THREE.Group(), { name: 'traian-muzee-art' });
    for (const [k, D] of Object.entries(K)) {
      if (!(D?.v > 0) || !mats[k]) continue;
      total += D.v; meshes++;
      grp.add(Object.assign(new THREE.Mesh(D.build({ part: k === 'det' || k === 'fac' || k === 'bak' }), mats[k]), { name: `traian-muzee-art-${k}`, castShadow: true, receiveShadow: true }));
      D.free();
    }
    if (grp.children.length) root.add(grp);

    // ---- the bronzes: the Ady statue turns to the museum
    const adyF = foots.find((f) => f.id === 3000011176);
    const museum = adyF ? adyF.poly.reduce((a, p) => [a[0] + p[0] / adyF.poly.length, a[1] + p[1] / adyF.poly.length], [0, 0]) : [262, -489];
    let spots = [], bv = 0, bsizes = {};
    try {
      const B = buildBronzes({ g, S, roads: map.roads, museum });
      spots = B.spots; bv = B.verts; bsizes = B.sizes;
      const bg = Object.assign(new THREE.Group(), { name: 'traian-bronze' });
      bg.add(Object.assign(new THREE.Mesh(releaseOnUpload(B.stone.build()), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 })), { name: 'traian-bronze-stone', castShadow: true, receiveShadow: true }));
      bg.add(Object.assign(new THREE.Mesh(releaseOnUpload(patina(B.bronze.build())), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.45 })), { name: 'traian-bronze-metal', castShadow: true, receiveShadow: true }));
      total += B.stone.v + bv; B.stone.free(); meshes += 2; root.add(bg);
    } catch (e) { console.error('[oradea] traian-muzee bronzes failed', e); }

    const rings = foots.map((f) => f.poly);
    const inRing = (P, x, z) => { let o = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < ((P[j][0] - P[i][0]) * (z - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) o = !o; return o; };
    console.log(`[oradea] traian-muzee: ${foots.length} footprints, ${(total / 1000).toFixed(1)}k verts ${JSON.stringify(stats.buildings)}, bronzes ${bv}, ${meshes} meshes, ${S.count - n0} solids, atlas ${(atlas.used * 100).toFixed(0)} % used, ${Math.round(performance.now() - t0)} ms`);
    return {
      footprints: foots,
      clear: (x, z) => rings.some((P) => inRing(P, x, z)) || spots.some((s) => Math.hypot(x - s.x, z - s.z) < s.r),
      update() {},
      stats: { ...stats, verts: total, meshes, atlasUsed: atlas.used, bronzeVerts: bv, bronzeSizes: bsizes },
    };
  },
};
