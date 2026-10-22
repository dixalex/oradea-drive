// OWNER: oradea. Calea Republicii, Oradea's pedestrian main street (the Corso), from Piața Regele Ferdinand north to Strada
// Dunării, as it looks restored today: a continuous row of late-19th / early-20th-century fronts in pastel stucco, many of
// them Secession, over shopfronts, with cornices, balconies and steep tiled roofs; its granite-sett paving, lamps, benches
// and planters; and two of the palaces in detail: Palatul Moskovits Miksa (1904–1905, the turquoise corner with its tower)
// and Palatul Ullmann (1913, by Parcul 1 Decembrie).
// Sources: Wikimedia Commons photographs of the Moskovits (2021, 2023), Stern, Apollo, Ullmann palaces and of the street
// (2022), hu.wikipedia Ullmann-palota, visitoradea.com/republicii-avenue, OpenStreetMap footprints (ODbL).
// The modules are in ./republicii/ (paint, styles, herocells: the facade atlas; material; ring, building, facade, herokit: the
// kit; table: the per-building data; street: paving and furniture; moskovits, ullmann: the two palaces). Two groups go into the
// world: 'republicii' (the street and Moskovits, one root ~550 m long, so never proxied) and 'ullmann' (its own root by the park,
// so the far-cull and the proxies treat it alone). Budget: ~40k vertices, 10 draw calls.
//   SITE { id: 'republicii', skip: [every OSM footprint it replaces], places: [the street], ground: true, build(base) }
//   build(base) -> { update(dt), clear(x, z), footprints, spots }
import * as THREE from 'three';
import { rng } from '../../cherkasy/geo.js';
import { decal } from '../../cherkasy/sculpt.js';
import { t } from '../../../i18n.js';
import { buildAtlas } from './republicii/styles.js';
import { Palette, facadeMaterial, roofTex, backAtlas } from './republicii/material.js';
import { makeKit } from './republicii/facade.js';
import { assembleBuilding } from './republicii/building.js';
import { BuildingIndex, nearOnLine, ringOf } from './republicii/ring.js';
import { TABLE, HERO } from './republicii/table.js';
import { buildStreet } from './republicii/street.js';
import { MB } from '../../../kit/mesh.js';
import { pavingTex } from './republicii/material.js';
import { moskovits } from './republicii/moskovits.js';
import { ullmann } from './republicii/ullmann.js';

// the street's axis (the OSM pedestrian "Strada Republicii"), south end at the Ferdinand square to the Strada Dunării end
export const CL = [80, -209, 83, -231, 99, -333, 112, -379, 142, -460, 182, -566, 246, -753];

export const SITE = {
  id: 'republicii',
  label: 'Calea Republicii',
  skip: [...TABLE.map((b) => b.id), HERO.moskovits, HERO.ullmann],
  places: [], // its places are in ../places.js, so the phone map lists them too
  ground: true,
  build(base) {
    const { root, solids: S, map, detailMat } = base, t0 = performance.now(), n0 = S.count;
    const g = base.ground?.heightAt ?? base.heightAt, rnd = rng(1904), r2 = rng(33);
    const index = new BuildingIndex(map.buildings), byId = new Map(map.buildings.map((b) => [b.id, b]));
    const roads = map.roads.filter((rd) => nearOnLine(CL, rd.p[0], rd.p[1]).d < 160 || nearOnLine(CL, rd.p[rd.p.length - 2], rd.p[rd.p.length - 1]).d < 160);
    const isPublic = (x, z) => {
      if (nearOnLine(CL, x, z).d < 22) return true;
      for (const rd of roads) if (nearOnLine(rd.p, x, z).d < rd.w / 2 + 8) return true;
      return false;
    };
    const atlas = buildAtlas(r2), pal = new Palette(), K = makeKit(atlas, pal);
    const ctx = { K, rnd, g, index, isPublic, S, pal };
    const foots = [];
    let lots = 0;
    for (const spec of TABLE) {
      const b = byId.get(spec.id); if (!b) continue;
      const out = assembleBuilding(ctx, { id: b.id, ring: ringOf(b.p), holes: (b.holes ?? []).map(ringOf), spec });
      foots.push(out.footprint); lots += out.lots;
    }

    // ---- the two palaces (Moskovits on the street's kit, Ullmann in its own group by the park)
    const bM = byId.get(HERO.moskovits), bU = byId.get(HERO.ullmann), KU = makeKit(atlas, pal);
    const heroOf = (b) => ({ id: b.id, ring: ringOf(b.p), holes: (b.holes ?? []).map(ringOf) });
    if (bM) { const out = moskovits(ctx, heroOf(bM)); foots.push(out.footprint); lots += out.lots; }
    if (bU) { const out = ullmann({ ...ctx, K: KU, isPublic: () => true }, heroOf(bU)); foots.push(out.footprint); lots += out.lots; }

    const detB = K.det.v;
    // ---- the street itself
    const sett = new MB(), slab = new MB();
    const street = buildStreet({ CL, g, onAsphalt: (x, z) => base.ground?.onAsphalt?.(x, z) ?? false, index, S, rnd, det: K.det, sett, slab });

    // ---- meshes
    const group = Object.assign(new THREE.Group(), { name: 'republicii' });
    root.add(group);
    const back = backAtlas(r2);
    const mats = {
      fac: facadeMaterial(atlas.textures, pal, { key: 'republicii-fac' }),
      bak: Object.assign(facadeMaterial(back, pal, { tiled: true, key: 'republicii-bak' }), { side: THREE.FrontSide, alphaTest: 0 }),
      det: detailMat,
      roof: new THREE.MeshStandardMaterial({ map: roofTex(r2), vertexColors: true, roughness: 0.78 }),
      sett: decal(new THREE.MeshStandardMaterial({ map: pavingTex(r2, 'sett'), roughness: 0.88, polygonOffset: true, polygonOffsetFactor: -4 })),
      slab: decal(new THREE.MeshStandardMaterial({ map: pavingTex(r2, 'slab'), roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -4 }), 2),
    };
    K.sett = sett; K.slab = slab;
    let verts = 0, meshes = 0;
    const emit = (grp, kit, tag) => {
      for (const [k, D] of Object.entries(kit)) {
        if (!(D?.v > 0) || !mats[k]) continue;
        verts += D.v; meshes++;
        grp.add(Object.assign(new THREE.Mesh(D.build({ part: k === 'det' || k === 'fac' || k === 'bak' }), mats[k]), { name: `${tag}-${k}`, castShadow: k !== 'sett' && k !== 'slab', receiveShadow: true }));
      }
    };
    emit(group, K, 'republicii');
    const vStreet = verts, groupU = Object.assign(new THREE.Group(), { name: 'ullmann' });
    emit(groupU, KU, 'ullmann'); root.add(groupU);
    console.log(`[oradea] republicii: ${foots.length} buildings, ${lots} lots, ${(verts / 1000).toFixed(1)}k verts (street group ${vStreet}, Ullmann ${verts - vStreet}; det: houses ${detB}, street ${K.det.v - detB}), ${meshes} meshes, ${S.count - n0} solids, ${Math.round(performance.now() - t0)} ms`);
    return {
      footprints: foots,
      spots: street.spots,
      clear: (x, z) => nearOnLine(CL, x, z).d < 9,
      update() {},
    };
  },
};
