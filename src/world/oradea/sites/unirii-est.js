// OWNER: oradea. The east side of Piața Unirii and Strada Vasile Alecsandri, Oradea, hand-built (the square itself, the churches and
// the bishop's palace are sites/unirii, City Hall and the Black Eagle Palace sites/primaria, Calea Republicii sites/republicii):
//   Palatul Moskovits Adolf și Fiii (Vasile Alecsandri 1, the Vágó brothers' Secession corner palace, early 1910s),
//   Casa Deutsch (Vasile Alecsandri 4, the 1900s folk-floral Secession front of the glass shop),
//   Casa Kováts (Piața Unirii 5, neoclassical, its present look from 1836),
//   Liceul Greco-Catolic «Iuliu Maniu» (1925, neo-Romanian),
//   and the rest of the street as facade lots: Casa Roth, Casa Munk, Casa Rendes Vilmos, Casa Amant, the Green Tree Inn (Arcadia).
// Modules in ./unirii-est/: atlas + cells-*.js + paintkit.js (one 2048 x 2048 facade sheet in fixed colours), assemble.js (the
// footprint -> walls / roof assembler, from republicii/building.js), kit.js, and one file per building. Two groups go into the world
// ('unirii-est' east of the square, 'unirii-vest' for Kováts and the lyceum) so the far-cull and the proxies treat them alone.
//   SITE { id: 'unirii-est', skip: [every OSM footprint replaced], places: [...], ground: true, build(base) }
//   build(base) -> { update(dt), clear(x, z), footprints, stats }
import * as THREE from 'three';
import { rng } from '../../cherkasy/geo.js';
import { decal } from '../../cherkasy/sculpt.js';
import { t } from '../../../i18n.js';
import { Palette, facadeMaterial, roofTex, backAtlas } from './republicii/material.js';
import { makeKit } from './republicii/facade.js';
import { BuildingIndex, nearOnLine, ringOf } from './republicii/ring.js';
import { buildAtlas } from './unirii-est/atlas.js';
import { LIST, SKIP, AXIS } from './unirii-est/data.js';

export const SITE = {
  id: 'unirii-est',
  label: 'Piața Unirii est, Strada Vasile Alecsandri',
  skip: SKIP,
  places: [], // its places are in ../places.js, so the phone map lists them too
  ground: true,
  build(base) {
    const { root, solids: S, map, detailMat } = base, t0 = performance.now(), n0 = S.count;
    const g = base.ground?.heightAt ?? base.heightAt, rnd = rng(1912), r2 = rng(77);
    const index = new BuildingIndex(map.buildings), byId = new Map(map.buildings.map((b) => [b.id, b]));
    const roads = map.roads.filter((rd) => { for (let i = 0; i < rd.p.length; i += 2) if (rd.p[i] > -220 && rd.p[i] < 420 && rd.p[i + 1] > -40 && rd.p[i + 1] < 300) return true; return false; });
    const isPublic = (x, z) => {
      if (nearOnLine(AXIS, x, z).d < 22) return true;
      for (const rd of roads) if (nearOnLine(rd.p, x, z).d < rd.w / 2 + 8) return true;
      return false;
    };
    const atlas = buildAtlas(r2, 2048, 2048, base.map.phoneCentre ? 0.5 : 1), pal = new Palette(); // the phone: a half-size sheet on the GPU
    const kits = { est: makeKit(atlas, pal), vest: makeKit(atlas, pal) };
    const foots = [], stats = { buildings: {}, lots: 0 };
    for (const item of LIST) {
      const b = byId.get(item.id); if (!b) continue;
      const ctx = { K: kits[item.group], rnd, g, index, isPublic, S, pal };
      try {
        const v0 = kits[item.group].fac.v + kits[item.group].bak.v + kits[item.group].det.v + kits[item.group].roof.v;
        const out = item.build(ctx, b);
        foots.push(out.footprint); stats.lots += out.lots ?? 0;
        stats.buildings[item.key] = kits[item.group].fac.v + kits[item.group].bak.v + kits[item.group].det.v + kits[item.group].roof.v - v0;
      } catch (e) { console.error(`[oradea] unirii-est ${item.key} failed`, e); }
    }

    // ---- meshes: one set of materials, one group per kit
    const back = backAtlas(r2);
    const mats = {
      fac: facadeMaterial(atlas.textures, pal, { key: 'unirii-est-fac' }),
      bak: Object.assign(facadeMaterial(back, pal, { tiled: true, key: 'unirii-est-bak' }), { side: THREE.FrontSide, alphaTest: 0 }),
      det: detailMat,
      roof: new THREE.MeshStandardMaterial({ map: roofTex(r2), vertexColors: true, roughness: 0.78 }),
    };
    let verts = 0, meshes = 0;
    const groups = {};
    for (const [name, kit] of Object.entries(kits)) {
      const grp = Object.assign(new THREE.Group(), { name: `unirii-${name}` });
      for (const [k, D] of Object.entries(kit)) {
        if (!(D?.v > 0) || !mats[k]) continue;
        verts += D.v; meshes++;
        grp.add(Object.assign(new THREE.Mesh(D.build({ part: k === 'det' || k === 'fac' || k === 'bak' }), mats[k]), { name: `unirii-${name}-${k}`, castShadow: true, receiveShadow: true }));
        D.free();
      }
      if (grp.children.length) { root.add(grp); groups[name] = grp; }
    }
    const rings = foots.map((f) => f.poly);
    const inRing = (P, x, z) => { let o = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < ((P[j][0] - P[i][0]) * (z - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) o = !o; return o; };
    console.log(`[oradea] unirii-est: ${foots.length} buildings, ${stats.lots} lots, ${(verts / 1000).toFixed(1)}k verts ${JSON.stringify(stats.buildings)}, ${meshes} meshes, ${S.count - n0} solids, ${Math.round(performance.now() - t0)} ms`);
    return {
      footprints: foots,
      clear: (x, z) => rings.some((P) => inRing(P, x, z)) || nearOnLine(AXIS, x, z).d < 7,
      update() {},
      stats: { ...stats, verts, meshes },
    };
  },
};
