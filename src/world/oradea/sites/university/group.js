// OWNER: oradea. One root group of the university site (not a site module): the three builders every part draws into and the
// meshes they become – the facade walls (shared facade material), the detail pieces (shared detail material: roofs, trims, glass,
// lettering, furniture) and the draped ground patches (an own decal material) – so a group costs three draw calls.
//   makeGroup(name, base, groundMat) -> ctx { F, D, G, S, g, bld, rnd, foot, spots, name, finish() -> { group, verts, meshes } }
//     bld(id) -> { id, ring: [[x, z]..], rec } | null    the OSM footprint of a building, looked up in map.buildings
import * as THREE from 'three';
import { MB } from '../../../../kit/mesh.js';
import { FacadeBuilder } from '../../../facade.js';
import { rng } from '../../../cherkasy/geo.js';
import { ringOf } from './geom.js';

export function buildingIndex(map) {
  const idx = new Map();
  for (const b of map.buildings ?? []) idx.set(b.id, b);
  return idx;
}

export function makeGroup(name, base, groundMat, index, seed = 7) {
  const { solids: S, facadeMat, detailMat } = base, gnd = base.ground?.heightAt ?? base.heightAt;
  const g = (x, z) => { const h = gnd(x, z); return Number.isFinite(h) ? h : 2; };
  const ctx = {
    name, S, g, rnd: rng(seed), foot: [], spots: [], F: new FacadeBuilder(), D: new MB(), G: new MB(),
    bld(id) { const rec = index.get(id); return rec ? { id, rec, ring: ringOf(rec.p) } : null; },
    finish() {
      const group = Object.assign(new THREE.Group(), { name });
      let verts = 0, meshes = 0;
      const add = (geo, mat, nm, cast, v) => { if (!geo) return; group.add(Object.assign(new THREE.Mesh(geo, mat), { name: `${name}-${nm}`, castShadow: cast, receiveShadow: true })); verts += v; meshes++; };
      if (ctx.F.v) add(ctx.F.build(), facadeMat, 'fac', true, ctx.F.v);
      if (ctx.D.v) add(ctx.D.build({ part: true }), detailMat, 'det', true, ctx.D.v);
      if (ctx.G.v) add(ctx.G.build(), groundMat, 'ground', false, ctx.G.v);
      base.root.add(group);
      return { group, verts, meshes };
    },
  };
  return ctx;
}
