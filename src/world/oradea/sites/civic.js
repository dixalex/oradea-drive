// OWNER: oradea. Civic landmarks of Oradea that were generic OSM boxes (the Stern and Apollo palaces are in sites/republicii, the City Hall
// and the Black Eagle in sites/primaria, the theatre in sites/ferdinand); each building's notes (what it is, which photos it follows, what
// is a guess) are at the head of its file in ./civic/.
//   old town and the Finance palace   Hotel Astoria ./civic/astoria.js, Palace of Justice ./civic/justice.js, the Prefecture ./civic/prefecture.js,
//                                     Palace of Finance ./civic/finance.js, the Postal Palace ./civic/post.js
//   outskirts                         Lotus Center ./civic/lotus.js, Aquapark Nymphaea ./civic/nymphaea.js, four water towers ./civic/towers.js
// Two root groups share their seven-eight materials (wall stone roof det glass lit atlas bay): `landmark-civic-centre` and `landmark-civic-out`.
// The long repeated walls are painted bays of one atlas (./civic/bays.js); the neighbours the replaced Astoria footprint leaves behind are
// dressed blocks of the city's own facade shader (./civic/fill.js, two more draw calls).
//   SITE { id, label, skip, places, ground: true, build(base) -> { update, clear, footprints, stats } }
import * as THREE from 'three';
import { MB } from '../../../kit/mesh.js';
import { nightK } from '../../../render/daylight.js';
import { finish } from '../../cherkasy/slabkit.js';
import { rng } from '../../cherkasy/geo.js';
import { plasterTex, ashlarTex, tileTex, atlasTex, ringArea } from './civic/kit.js';
import { buildAstoria, ASTORIA_ID, ASTORIA_RECTS } from './civic/astoria.js';
import { makeFill, pieces } from './civic/fill.js';
import { makeBays } from './civic/bays.js';
import { buildJustice, JUSTICE_ID, JUSTICE_ROWS } from './civic/justice.js';
import { buildPrefecture, PREF_ID, PREF_ROWS } from './civic/prefecture.js';
import { buildFinance, FIN_ID, FIN_ROWS } from './civic/finance.js';
import { buildPost, POST_ID, POST_ROWS } from './civic/post.js';
import { buildLotus, LOTUS_ID, LOTUS_ROWS } from './civic/lotus.js';
import { buildNymphaea, NYMPH_ID, NYMPH_ROWS } from './civic/nymphaea.js';
import { buildTowers, TOWER_WAY } from './civic/towers.js';

const KEYS = ['wall', 'stone', 'roof', 'det', 'glass', 'lit', 'atlas', 'bay', 'deck'];
const guard = (label, fn, fb = null) => { try { return fn() ?? fb; } catch (e) { console.error(`[oradea] civic ${label} failed`, e); return fb; } };
const ringOf = (flat) => { const o = []; for (let i = 0; i < flat.length; i += 2) o.push([flat[i], flat[i + 1]]); return o; };

export const SITE = {
  id: 'civic',
  label: 'Civic landmarks: Astoria, Justice, Prefecture, Finance, Lotus, Nymphaea, water towers',
  skip: [ASTORIA_ID, JUSTICE_ID, PREF_ID, FIN_ID, POST_ID, LOTUS_ID, NYMPH_ID, TOWER_WAY],
  places: [], // in places.js (rings inlined there)
  ground: true,
  build(base) {
    const { root, solids: S } = base, gnd = base.ground?.heightAt ?? base.heightAt;
    const g = (x, z) => { const h = gnd(x, z); return Number.isFinite(h) ? h : 3; };
    const t0 = performance.now(), n0 = S.count, r = rng(1902);
    const mk = () => Object.fromEntries(KEYS.map((k) => [k, new MB()]));
    const atlas = atlasTex(r), byId = new Map(base.map.buildings.map((b) => [b.id, b]));
    const bays = makeBays(r, [...JUSTICE_ROWS, ...PREF_ROWS, ...FIN_ROWS, ...POST_ROWS, ...LOTUS_ROWS, ...NYMPH_ROWS]);
    const M = {
      wall: new THREE.MeshStandardMaterial({ map: plasterTex(r), vertexColors: true, roughness: 0.9 }),
      stone: new THREE.MeshStandardMaterial({ map: ashlarTex(r), vertexColors: true, roughness: 0.82 }),
      roof: new THREE.MeshStandardMaterial({ map: tileTex(r), vertexColors: true, roughness: 0.74, side: THREE.DoubleSide }),
      det: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.68, metalness: 0.12, side: THREE.DoubleSide }),
      glass: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.1, metalness: 0.45, envMapIntensity: 1.2 }),
      lit: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.14, metalness: 0.3, emissive: new THREE.Color('#ffd9a0'), emissiveIntensity: 0 }),
      deck: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 }),
      bay: new THREE.MeshStandardMaterial({ map: bays.tex, emissiveMap: bays.mask, emissive: new THREE.Color('#ffd9a0'), emissiveIntensity: 0, roughness: 0.88 }),
      atlas: new THREE.MeshStandardMaterial({ map: atlas.map, emissiveMap: atlas.emissiveMap, emissive: 0xffffff, emissiveIntensity: 0, alphaTest: 0.25, side: THREE.DoubleSide, roughness: 0.6 }),
    };
    const foot = [], clears = [], stats = {};
    let verts = 0, meshes = 0;

    // ============================================================================================ the old town and the Finance palace
    const C = mk(), ctx = { B: C, S, g, r, A: atlas.R, bays };
    for (const [key, fn] of [['astoria', buildAstoria], ['justice', buildJustice], ['prefecture', buildPrefecture], ['post', buildPost], ['finance', buildFinance]]) {
      const b = guard(key, () => fn(ctx));
      if (b) { foot.push(...b.footprints); clears.push(b.clear); stats[key] = b.stats; }
    }
    // the rest of the Astoria block: the old houses west of it, the cream house on the square, the rear annex
    const fill = makeFill(base, 'civic-fill-centre', 7);
    guard('Astoria block', () => {
      const rec = byId.get(ASTORIA_ID), P = pieces(ringOf(rec.p), ASTORIA_RECTS);
      for (const q of P) {
        const a = Math.abs(ringArea(q)), c = q.reduce((s, p) => [s[0] + p[0] / q.length, s[1] + p[1] / q.length], [0, 0]);
        if (a < 30) continue;
        if (c[0] < -60) fill.block({ ring: q, n: 2, gh: 3.6, sh: 3.4, wall: '#ece3d0', stone: null, roof: { col: '#8d4a35', col2: '#80422f', pitch: 0.55 }, door: null, name: 'Strada Teatrului', fid: 9100001 });
        else if (c[0] > -30) fill.block({ ring: q, n: 3, gh: 4.0, sh: 3.7, wall: '#ecd9a2', stone: null, bay: 3.0, roof: { col: '#74797d', col2: '#6a6f73', pitch: 0.45 }, door: null, name: 'Piața Ferdinand', fid: 9100002 });
        else fill.block({ ring: q, n: 2, gh: 3.6, sh: 3.4, wall: '#e6dcc6', stone: null, eave: 'flat', door: null, name: 'Strada Teatrului', fid: 9100003 });
      }
    });
    const fc = fill.finish();
    foot.push(...fill.ctx.foot);
    const centre = finish(root, 'landmark-civic-centre', C, M, { shade: ['wall', 'stone', 'roof', 'det', 'bay'] });
    verts += centre.verts + (fc?.verts ?? 0); meshes += centre.meshes + (fc?.meshes ?? 0);

    // ============================================================================================ the outskirts: the mall, the aquapark, the towers
    // the outskirts need only detail, glass and bay meshes: plaster, stone and roof pieces go into the detail builder (flat colours, no texture)
    const O = mk(), octx = { B: { ...O, wall: O.det, stone: O.det, roof: O.det }, S, g, r, A: atlas.R, bays };
    for (const [key, fn] of [['lotus', buildLotus], ['nymphaea', buildNymphaea], ['towers', buildTowers]]) {
      const b = guard(key, () => fn(octx));
      if (b) { foot.push(...b.footprints); clears.push(b.clear); stats[key] = b.stats; }
    }
    const out = finish(root, 'landmark-civic-out', O, M, { shade: ['wall', 'stone', 'roof', 'det', 'bay'] });
    // the mall's roof deck is a plain plane 250 m across: no shadows on it (a flat, nearly sun-parallel plane shows acne)
    for (const m of out.group.children) if (m.name.endsWith('-deck')) { m.receiveShadow = false; m.castShadow = false; }
    verts += out.verts; meshes += out.meshes;
    console.log(`[oradea] civic: ${(verts / 1000).toFixed(1)}k verts, ${meshes} meshes, ${S.count - n0} solids, ${Math.round(performance.now() - t0)} ms`);
    return {
      footprints: foot,
      clear: (x, z) => clears.some((c) => c(x, z)),
      update() {
        const k = nightK.value, e = Math.min(1, 3 * k);
        M.lit.emissiveIntensity = 0.9 * k; M.atlas.emissiveIntensity = 0.9 * e; M.bay.emissiveIntensity = 0.9 * k;
      },
      stats: { verts, meshes, solids: S.count - n0, ...stats },
    };
  },
};
