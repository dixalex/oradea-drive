// The terrain of the Oradea Fortress: the platform inside the star and the dry moat round it. Not a site module:
// ../cetate.js calls it. The pattern is cherkasy/railcut.js: the 16 m terrain lattice is far too coarse for a moat, so the
// moat is its own 2 m height raster that hf.heightAt takes the minimum with (hf.latticeAt keeps the lattice, which the
// ground workers build from), and the ground triangles it touches are re-laid onto it after the ground exists.
//
//   PROFILE                      the cross-section, metres: WALL (thickness of the wall's earth-and-brick block, sd -WALL..0),
//                                D (depth of the moat floor below the platform at the wall), SLOPE (how much the floor
//                                rises toward the counterscarp), CS (thickness of the counterscarp block), CREST (the wall's
//                                top over the platform), CS_TOP (the counterscarp's top over the ground), WMAX / WMIN (moat
//                                width, wide where there is room, narrower where a street runs close), MR (the room the moat
//                                leaves to a street: CS + 1)
//   shapeMoat(hf, map) -> st     before the ground is built: levels the platform and its surroundings, makes the moat raster
//                                and patches hf.heightAt. st = { G, loops: { face, outer, inner }, sd, g, Wloc, floorAt(x, z),
//                                carved, box }; face: the counterscarp's face line (the moat's outer edge), outer: the outer
//                                edge of its block, inner: the inner edge of the wall's block (all closed, counter-clockwise
//                                on the map, simplified to 0.15 m)
//   moatState() -> st | null     the last shapeMoat result
//   buildMoatGround({ ground }) -> { clear(x, z), stats }   re-lays the ground tiles the moat touches (grass on the floor)
import * as THREE from 'three';
import { SURF } from '../../../cherkasy/ground.js';
import { WATER_Y } from '../../../water.js';
import { polyTools, isoLoops, simplify, area2, orient } from './field.js';
import { OUTLINE, GATES } from './data.js';

export const PROFILE = { WALL: 6.0, D: 5.0, SLOPE: 1.3, CS: 4.0, CREST: 5.0, FLAT: 1.6, CS_TOP: 1.0, WMAX: 17, WMIN: 4, MR: 5.0 };
const WALL_TOTAL = 9.8; // metres from the moat floor to the wall's top
const STEP = 2, MESH = 2, COARSE = 8;   // the raster (m), the re-laid cell size where the moat is, elsewhere
const CARVE_IN = 5.0, CARVE_OUT = 3.0;  // carved from sd = -CARVE_IN to g = +CARVE_OUT, a little way inside the two blocks, so no ground vertex beside a wall face is left at the lattice height (a spike)
let shaped = null;
export const moatState = () => shaped;

const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

// the streets the moat leaves room for: motor roads, service roads and the wide pedestrian streets, but not their last
// stretch at a gate (the bridge crosses the moat there)
function streetSegs(map, gates) {
  const out = [], near = (x, z) => gates.some((g) => Math.hypot(x - g.at[0], z - g.at[1]) < 26);
  for (const r of map.roads ?? []) {
    if (!(r.k === 'm' || (r.k === 'p' && r.c === 'pedestrian' && (r.w ?? 0) >= 6))) continue;
    if (r.br) continue;
    for (let i = 0; i + 3 < r.p.length; i += 2) {
      const ax = r.p[i], az = r.p[i + 1], bx = r.p[i + 2], bz = r.p[i + 3];
      if (near(ax, az) || near(bx, bz) || near((ax + bx) / 2, (az + bz) / 2)) continue;
      out.push([ax, az, bx, bz, (r.w ?? 6) / 2]);
    }
  }
  return out;
}

export function shapeMoat(hf, map, gates = Object.values(GATES)) {
  if (hf?.latticeAt) { hf.heightAt = hf.latticeAt; delete hf.latticeAt; } // a re-run starts from the lattice
  shaped = null;
  const F = PROFILE, star = polyTools(OUTLINE);
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  for (const [x, z] of OUTLINE) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  const M = F.WMAX + F.CS + 16;
  x0 = Math.floor(x0 - M); z0 = Math.floor(z0 - M); x1 = Math.ceil(x1 + M); z1 = Math.ceil(z1 + M);
  // streets within reach, as segments with their half widths (the segment list is small: a few dozen)
  const segs = streetSegs(map, gates).filter(([ax, az, bx, bz]) => Math.max(ax, bx) > x0 - 30 && Math.min(ax, bx) < x1 + 30 && Math.max(az, bz) > z0 - 30 && Math.min(az, bz) < z1 + 30);
  const ns = segs.length, SA = new Float64Array(ns * 7);
  segs.forEach(([ax, az, bx, bz, w], k) => { const dx = bx - ax, dz = bz - az; SA.set([ax, az, dx, dz, 1 / (dx * dx + dz * dz || 1), w], k * 7); });
  const rd = (x, z) => { // distance to the nearest street's edge
    let b = 1e6;
    for (let k = 0; k < ns; k++) {
      const o = k * 7;
      let f = ((x - SA[o]) * SA[o + 2] + (z - SA[o + 1]) * SA[o + 3]) * SA[o + 4];
      f = f < 0 ? 0 : f > 1 ? 1 : f;
      const dx = x - SA[o] - SA[o + 2] * f, dz = z - SA[o + 1] - SA[o + 3] * f, d = Math.sqrt(dx * dx + dz * dz) - SA[o + 5];
      if (d < b) b = d;
    }
    return b < 0 ? 0 : b;
  };
  const Wloc = (s, r) => Math.min(F.WMAX, Math.max(F.WMIN, s + r - F.MR));
  const FAR = F.WMAX + F.CS + 10; // beyond it no street can limit the moat
  const field = (x, z) => { const s = star.sd(x, z), r = s > FAR || s < -2 ? 1e3 : rd(x, z), W = Wloc(s, r); return { s, g: s - W, W }; };

  // the field on the raster's 2 m nodes: loops of the moat's outer edge, the counterscarp block's outer edge and the wall block's inner edge
  const h = STEP, nx = Math.floor((x1 - x0) / h) + 1, nz = Math.floor((z1 - z0) / h) + 1;
  const gArr = new Float32Array(nx * nz), sArr = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const q = field(x0 + i * h, z0 + j * h); gArr[j * nx + i] = q.g; sArr[j * nx + i] = q.s; }
  const biggest = (loops) => loops.map((l) => ({ l, a: Math.abs(area2(l)) })).sort((p, q) => q.a - p.a)[0]?.l;
  const clean = (l, positive) => orient(simplify(l, 0.15), positive);
  const face = clean(biggest(isoLoops(gArr, x0, z0, nx, nz, h, 0)), true);
  const outer = clean(biggest(isoLoops(gArr, x0, z0, nx, nz, h, F.CS)), true);
  const inner = clean(biggest(isoLoops(sArr, x0, z0, nx, nz, h, -F.WALL)), true);
  const crest = clean(biggest(isoLoops(sArr, x0, z0, nx, nz, h, -F.FLAT)), true);
  const pad = clean(biggest(isoLoops(gArr, x0, z0, nx, nz, h, F.CS + 5)), true);

  // the platform: level the star, the moat and a band round them to one height (the median of the lattice there)
  const G = hf.pad(pad, 40);
  if (G == null) return null;
  // a dry moat: the floor stays above the river's plane (the water mesh would show through it), the wall's total height from
  // the floor to its top stays ~9.8 m
  F.D = Math.max(2.6, Math.min(5.0, G - WATER_Y - 0.55));
  F.SLOPE = F.D * 0.6;
  F.CREST = WALL_TOTAL - F.D - 0.2;

  // the raster
  const rx = Math.floor((x1 - x0) / STEP) + 1, rz = Math.floor((z1 - z0) / STEP) + 1;
  const T = new Float32Array(rx * rz).fill(Infinity);
  let carved = 0;
  for (let j = 0; j < rz; j++) {
    for (let i = 0; i < rx; i++) {
      const k = j * nx + i, s = sArr[k], g = gArr[k];
      if (s < -CARVE_IN || g > CARVE_OUT) continue;
      T[j * rx + i] = G - floorDepth(F, s, s - g);
      carved++;
    }
  }
  const L = hf.heightAt;
  const Tq = (x, z) => {
    const u = (x - x0) / STEP, v = (z - z0) / STEP, i = Math.floor(u), j = Math.floor(v);
    if (i < 0 || j < 0 || i >= rx - 1 || j >= rz - 1) return Infinity;
    const s = u - i, t = v - j, k = j * rx + i, a = T[k], b = T[k + 1], c = T[k + rx], d = T[k + rx + 1];
    if (a === Infinity || b === Infinity || c === Infinity || d === Infinity) return Infinity;
    return (1 - t) * ((1 - s) * a + s * b) + t * ((1 - s) * c + s * d);
  };
  hf.latticeAt = L; // the ground mesh is built from the lattice alone (workers too), then re-laid by buildMoatGround
  hf.heightAt = (x, z) => {
    const y = L(x, z);
    if (x < x0 || x > x1 || z < z0 || z > z1) return y;
    const t = Tq(x, z);
    return t < y ? t : y;
  };
  shaped = { G, loops: { face, outer, inner, crest, pad }, sd: star.sd, g: (x, z) => field(x, z).g, field, rd, Wloc,
    floorAt: (x, z) => { const q = field(x, z); return G - floorDepth(F, q.s, q.W); },
    T, Tq, rx, rz, box: [x0, z0, x1, z1], L, carved, streets: segs.length };
  return shaped;
}

// the moat floor's depth below the platform at signed distance s from the wall, in a moat W wide: level by the wall, rising
// toward the counterscarp
function floorDepth(F, s, W) {
  if (s <= 0) return F.D;
  return F.D - F.SLOPE * smooth(0.3 * W, W, s);
}

export function buildMoatGround({ ground } = {}) {
  if (!shaped) return null;
  const { T, Tq, rx, rz, box: [bx0, bz0, bx1, bz1], L } = shaped, box = [bx0, bz0, bx1, bz1];
  const depth = (x, z) => { const t = Tq(x, z); return t === Infinity ? 0 : Math.max(0, L(x, z) - t); };
  const clear = (x, z) => x >= bx0 && x <= bx1 && z >= bz0 && z <= bz1 && shaped.g(x, z) < PROFILE.CS + 3;
  const stats = { dropped: 0, verts: 0 };
  const site = { clear, update() {}, stats };
  const tiles = (ground?.root?.children ?? []).filter((m) => m.material?.name === 'cherkasy-ground' && m.geometry?.index);
  if (!tiles.length) return site;

  // nodes where the moat is below the lattice: a ground triangle near one is re-tessellated (a generous test, an extra
  // triangle is rebuilt as it was), so every triangle kept has the moat clear of all its edges: no cracks
  const active = new Uint8Array(rx * rz);
  for (let j = 0; j < rz; j++) for (let i = 0; i < rx; i++) { const k = j * rx + i; if (T[k] !== Infinity && T[k] < L(bx0 + i * STEP, bz0 + j * STEP) - 0.005) active[k] = 1; }
  const near = (x0, z0, x1, z1, m = 3) => {
    const i0 = Math.max(0, Math.floor((x0 - m - bx0) / STEP)), i1 = Math.min(rx - 1, Math.ceil((x1 + m - bx0) / STEP));
    const j0 = Math.max(0, Math.floor((z0 - m - bz0) / STEP)), j1 = Math.min(rz - 1, Math.ceil((z1 + m - bz0) / STEP));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (active[j * rx + i]) return true;
    return false;
  };
  const out = { p: [], n: [], s: [], i: [] }, keys = new Map();
  const clip = (poly, ax, az, bx, bz, sgn) => { // keep the part of a convex polygon left of a->b (sgn: winding)
    const res = [], side = ([x, z]) => sgn * ((bx - ax) * (z - az) - (bz - az) * (x - ax));
    for (let k = 0; k < poly.length; k++) {
      const p = poly[k], q = poly[(k + 1) % poly.length], sp = side(p), sq = side(q);
      if (sp >= 0) res.push(p);
      if ((sp >= 0) !== (sq >= 0)) { const f = sp / (sp - sq); res.push([p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]); }
    }
    return res;
  };
  for (const m of tiles) {
    const geo = m.geometry;
    if (!geo.boundingBox) geo.computeBoundingBox();
    const bb = geo.boundingBox;
    if (bb.max.x < bx0 || bb.min.x > bx1 || bb.max.z < bz0 || bb.min.z > bz1) continue;
    const Pp = geo.attributes.position.array, Nn = geo.attributes.normal.array, Sf = geo.attributes.aSurf.array, I = geo.index.array;
    let hit = 0;
    for (let k = 0; k < I.length; k += 3) {
      const a = I[k], b = I[k + 1], c = I[k + 2];
      if (a === b && b === c) continue;
      const A = [Pp[3 * a], Pp[3 * a + 2]], B = [Pp[3 * b], Pp[3 * b + 2]], C = [Pp[3 * c], Pp[3 * c + 2]];
      const x0 = Math.min(A[0], B[0], C[0]), x1 = Math.max(A[0], B[0], C[0]), z0 = Math.min(A[1], B[1], C[1]), z1 = Math.max(A[1], B[1], C[1]);
      if (x1 < bx0 || x0 > bx1 || z1 < bz0 || z0 > bz1 || !near(x0, z0, x1, z1)) continue;
      const det = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1]);
      if (Math.abs(det) < 1e-9) continue;
      const bary = (x, z) => { const u = ((B[1] - C[1]) * (x - C[0]) + (C[0] - B[0]) * (z - C[1])) / det, v = ((C[1] - A[1]) * (x - C[0]) + (A[0] - C[0]) * (z - C[1])) / det; return [u, v, 1 - u - v]; };
      const sgn = det > 0 ? 1 : -1, s0 = Sf[a];
      const vert = (x, z, surf) => {
        const [u, v, w] = bary(x, z), plane = u * Pp[3 * a + 1] + v * Pp[3 * b + 1] + w * Pp[3 * c + 1];
        const t = Tq(x, z), off = t === Infinity ? 0 : Math.min(0, t - L(x, z));
        const key = `${Math.round(x * 1000)},${Math.round(z * 1000)},${Math.round((plane + off) * 1000)},${surf}`;
        let id = keys.get(key);
        if (id !== undefined) return id;
        let nx, ny, nz;
        if (off < -0.01) { nx = Tq(x - 0.5, z) - Tq(x + 0.5, z); ny = 1; nz = Tq(x, z - 0.5) - Tq(x, z + 0.5); }
        else { nx = u * Nn[3 * a] + v * Nn[3 * b] + w * Nn[3 * c]; ny = u * Nn[3 * a + 1] + v * Nn[3 * b + 1] + w * Nn[3 * c + 1]; nz = u * Nn[3 * a + 2] + v * Nn[3 * b + 2] + w * Nn[3 * c + 2]; }
        if (!Number.isFinite(nx) || !Number.isFinite(nz)) { nx = 0; ny = 1; nz = 0; }
        const l = Math.hypot(nx, ny, nz) || 1;
        id = out.p.length / 3;
        out.p.push(x, plane + off, z); out.n.push(nx / l, ny / l, nz / l); out.s.push(surf);
        keys.set(key, id);
        return id;
      };
      const cell = (qx, qz, size) => {
        let poly = [[qx, qz], [qx + size, qz], [qx + size, qz + size], [qx, qz + size]];
        poly = clip(poly, ...A, ...B, sgn); if (poly.length < 3) return;
        poly = clip(poly, ...B, ...C, sgn); if (poly.length < 3) return;
        poly = clip(poly, ...C, ...A, sgn); if (poly.length < 3) return;
        let deep = 0;
        for (const [x, z] of poly) deep = Math.max(deep, depth(x, z));
        const surf = deep > 0.6 ? SURF.GRASS : s0;     // the moat is a grass ditch: no path or pavement runs down into it
        const ids = poly.map(([x, z]) => vert(x, z, surf));
        for (let q = 1; q + 1 < ids.length; q++) out.i.push(...(sgn > 0 ? [ids[0], ids[q], ids[q + 1]] : [ids[0], ids[q + 1], ids[q]]));
      };
      const i0 = Math.floor((x0 - bx0) / COARSE), i1 = Math.ceil((x1 - bx0) / COARSE), j0 = Math.floor((z0 - bz0) / COARSE), j1 = Math.ceil((z1 - bz0) / COARSE);
      for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
        const qx = bx0 + i * COARSE, qz = bz0 + j * COARSE;
        if (!near(qx, qz, qx + COARSE, qz + COARSE, MESH)) { cell(qx, qz, COARSE); continue; }
        for (let b2 = 0; b2 < COARSE; b2 += MESH) for (let a2 = 0; a2 < COARSE; a2 += MESH) cell(qx + a2, qz + b2, MESH);
      }
      I[k + 1] = I[k + 2] = a; hit++; // the original triangle collapses: the fine copy replaces it
    }
    if (hit) { geo.index.needsUpdate = true; stats.dropped += hit; }
  }
  if (!out.i.length) return site;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(out.p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(out.n, 3));
  g.setAttribute('aSurf', new THREE.Float32BufferAttribute(out.s, 1));
  g.setIndex(out.i);
  g.computeBoundingSphere();
  const mesh = Object.assign(new THREE.Mesh(g, tiles[0].material), { name: 'ground cetate-moat', receiveShadow: true, castShadow: tiles[0].castShadow });
  ground.root.add(mesh);
  stats.verts = out.p.length / 3;
  console.log(`[oradea] fortress moat: ${stats.dropped} ground triangles re-laid, ${stats.verts} verts`);
  return site;
}
