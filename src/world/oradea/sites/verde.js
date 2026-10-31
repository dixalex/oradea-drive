// OWNER: oradea. Oradea's green and family places, hand-built (the generic park furniture is parks.js, the trams trams.js):
//   Dealul Ciuperca (Str. Graurilor 80): the restaurant on the hilltop (OSM way 331203796) with its glazed terrace ring, a belvedere
//   platform and stone stairs down the slope (./verde/ciuperca.js); no terrain change (a pad raised the road beside the building by ~2 m): the floor sits at the highest corner over a plinth to the lowest;
//   Grădina Zoologică Oradea (Calea Matei Basarab 30): the entrance gate and ticket house on the main alley, the Rhédey chapel in its
//   fenced deer yard (quest card 'zoo-chapel'), a few paddocks with a shelter and a pond (./verde/zoo.js). Light scope: no animals.
// Two groups ('verde-ciuperca', 'verde-zoo') of seven meshes each at most (wall, roof, det, glass, lit, ground, fence, board); the zoo group's
// sign board is its own canvas texture.
//   SITE { id: 'verde', skip: [331203796], places: [], ground: true, build(base) }
//   build(base) -> { update(dt), clear(x, z), footprints, stats }
// The places live in ../places.js (the phone map loads no site); the zoo's there is a small ring at the gate, 16 m in from GATE_FROM.
import * as THREE from 'three';
import { rng } from '../../cherkasy/geo.js';
import { nightK } from '../../../render/daylight.js';
import { finish } from '../../cherkasy/slabkit.js';
import { builders, mats, boardTex } from './verde/kit.js';
import { buildCiuperca, CIUPERCA_ID } from './verde/ciuperca.js';
import { buildZoo } from './verde/zoo.js';

const guard = (label, fn) => { try { return fn(); } catch (e) { console.error(`[oradea] verde ${label} failed`, e); return null; } };

export const SITE = {
  id: 'verde',
  label: 'Dealul Ciuperca și Grădina Zoologică',
  skip: [CIUPERCA_ID],
  places: [], // in ../places.js: the phone map loads no site
  ground: true,
  build(base) {
    const { root, solids: S, map } = base, gnd = base.ground?.heightAt ?? base.heightAt;
    const g = (x, z) => { const h = gnd(x, z); return Number.isFinite(h) ? h : 0; };
    const t0 = performance.now(), n0 = S.count, parts = [], foots = [];

    const one = (name, fn, { board = null } = {}) => {
      const r = rng(name === 'zoo' ? 1960 : 2021), B = builders();
      if (name === 'zoo') { delete B.glass; Object.defineProperty(B, 'glass', { value: B.det, enumerable: false }); } // the zoo's few dark panes go in `det`: one draw call fewer
      const res = guard(name, () => fn({ B, S, g, r, map }));
      if (!res) { for (const D of Object.values(B)) D.free(); return null; }
      const M = mats(r); if (board) M.board = new THREE.MeshStandardMaterial({ map: board, roughness: 0.6, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: board, emissiveIntensity: 0, forceSinglePass: true });
      const out = finish(root, `verde-${name}`, B, M, { shade: ['wall', 'roof', 'det'] });
      foots.push(...res.footprints);
      parts.push({ name, res, M, out });
      return res;
    };
    const cip = one('ciuperca', buildCiuperca);
    const zoo = one('zoo', buildZoo, { board: boardTex(['GRĂDINA ZOOLOGICĂ', 'ORADEA'], 1024, 192) });

    console.log(`[oradea] verde: ${parts.map((p) => `${p.name} ${(p.out.verts / 1000).toFixed(1)}k verts ${p.out.meshes} meshes`).join(', ')}, ${S.count - n0} solids, ${Math.round(performance.now() - t0)} ms`);
    return {
      footprints: foots, // no `spots`: city.js plants a tree at every site spot
      clear: (x, z) => !!(cip?.clear(x, z) || zoo?.clear(x, z)),
      update() {
        const k = nightK.value;
        for (const p of parts) { p.M.lit.emissiveIntensity = 0.85 * k; if (p.M.board?.emissiveIntensity != null) p.M.board.emissiveIntensity = 0.5 * Math.min(1, 3 * k); }
      },
      stats: { verts: parts.reduce((s, p) => s + p.out.verts, 0), meshes: parts.reduce((s, p) => s + p.out.meshes, 0), solids: S.count - n0, ciuperca: cip?.stats, zoo: zoo?.stats, partVerts: Object.fromEntries(parts.map((p) => [p.name, p.out.verts])), partMeshes: Object.fromEntries(parts.map((p) => [p.name, p.out.meshes])) },
    };
  },
};
