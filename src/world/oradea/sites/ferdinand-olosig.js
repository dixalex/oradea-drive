// OWNER: oradea. Oradea's Art Nouveau corners round Piața Regele Ferdinand and in Olosig, hand-built (the theatre and the square are
// sites/ferdinand, City Hall and the Black Eagle Palace sites/primaria, Calea Republicii sites/republicii, the east side of Piața Unirii
// sites/unirii-est):
//   Casa Poynár (1907–1911), Palatul Füchsl (1902–1903), Hotel Transilvania (the «Pannonia», 1903–1904), Casele Adorján I and II
//   (Olosig, 1902–1905), the Rimanóczy Hotel with its baths wing and the Royal café (1880s).
// Modules in ./ferdinand-olosig/: atlas.js + cells-*.js + paint.js (one 2048 x 2048 facade sheet in fixed colours, half size on the
// phone), dress.js (the run dresser), towers.js (corner helpers), and one file per building. Two groups go into the world: 'ferdinand-art'
// (round the square and in Olosig) and 'fuchsl-art' (the Füchsl palace, 250 m east), so the far-cull and the proxies treat them alone.
//   SITE { id: 'ferdinand-olosig', skip: [every OSM footprint replaced], places: [] (in ../places.js), ground: true, build(base) }
//   build(base) -> { update(dt), clear(x, z), footprints, stats }
import * as THREE from 'three';
import { rng } from '../../cherkasy/geo.js';
import { t } from '../../../i18n.js';
import { Palette, facadeMaterial, roofTex, backAtlas } from './republicii/material.js';
import { makeKit } from './republicii/facade.js';
import { BuildingIndex } from './republicii/ring.js';
import { buildAtlas } from './ferdinand-olosig/atlas.js';
import { LIST, SKIP } from './ferdinand-olosig/data.js';

export const SITE = {
  id: 'ferdinand-olosig',
  label: 'Colțuri Art Nouveau: Piața Ferdinand, Olosig',
  skip: SKIP,
  places: [], // its places are in ../places.js, so the phone map lists them too
  ground: true,
  build(base) {
    const { root, solids: S, map, detailMat } = base, t0 = performance.now(), n0 = S.count;
    const g = base.ground?.heightAt ?? base.heightAt, rnd = rng(1907), r2 = rng(1902);
    const index = new BuildingIndex(map.buildings), byId = new Map(map.buildings.map((b) => [b.id, b]));
    const atlas = buildAtlas(r2, 2048, 2048, map.phoneCentre ? 0.5 : 1), pal = new Palette(); // the phone: a half-size sheet on the GPU
    const kits = { ferdinand: makeKit(atlas, pal), fuchsl: makeKit(atlas, pal) };
    const verts = (K) => K.fac.v + K.bak.v + K.det.v + K.roof.v;
    const foots = [], stats = { buildings: {}, lots: 0 };
    for (const item of LIST) {
      const b = byId.get(item.id); if (!b) continue;
      const K = kits[item.group], ctx = { K, rnd, g, index, isPublic: () => true, S, pal };
      try {
        const v0 = verts(K), out = item.build(ctx, b);
        foots.push(...(out.footprints ?? [out.footprint])); stats.lots += out.lots ?? 0;
        stats.buildings[item.key] = verts(K) - v0;
      } catch (e) { console.error(`[oradea] ferdinand-olosig ${item.key} failed`, e); }
    }

    // ---- meshes: one set of materials, one group per kit
    const back = backAtlas(r2);
    const mats = {
      fac: facadeMaterial(atlas.textures, pal, { key: 'ferdinand-olosig-fac' }),
      bak: Object.assign(facadeMaterial(back, pal, { tiled: true, key: 'ferdinand-olosig-bak' }), { side: THREE.FrontSide, alphaTest: 0 }),
      det: detailMat,
      roof: new THREE.MeshStandardMaterial({ map: roofTex(r2), vertexColors: true, roughness: 0.78 }),
    };
    let total = 0, meshes = 0;
    for (const [name, kit] of Object.entries(kits)) {
      const grp = Object.assign(new THREE.Group(), { name: `${name}-art` });
      for (const [k, D] of Object.entries(kit)) {
        if (!(D?.v > 0) || !mats[k]) continue;
        total += D.v; meshes++;
        grp.add(Object.assign(new THREE.Mesh(D.build({ part: k === 'det' || k === 'fac' || k === 'bak' }), mats[k]), { name: `${name}-art-${k}`, castShadow: true, receiveShadow: true }));
        D.free();
      }
      if (grp.children.length) root.add(grp);
    }
    const rings = foots.map((f) => f.poly);
    const inRing = (P, x, z) => { let o = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < ((P[j][0] - P[i][0]) * (z - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) o = !o; return o; };
    console.log(`[oradea] ferdinand-olosig: ${foots.length} footprints, ${stats.lots} lots, ${(total / 1000).toFixed(1)}k verts ${JSON.stringify(stats.buildings)}, ${meshes} meshes, ${S.count - n0} solids, atlas ${(atlas.used * 100).toFixed(0)} % used, ${Math.round(performance.now() - t0)} ms`);
    return {
      footprints: foots,
      clear: (x, z) => rings.some((P) => inRing(P, x, z)),
      update() {},
      stats: { ...stats, verts: total, meshes, atlasUsed: atlas.used },
    };
  },
};
