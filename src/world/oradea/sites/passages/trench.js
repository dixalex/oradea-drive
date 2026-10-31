// OWNER: oradea. The road underpasses' engine (not a site module: ../passages-*.js use it). A passage group is a set of
// OSM road ways from map.json `levels` (tools/cherkasy/build_map.mjs): its tunnels (`tn`) and the cuttings / ramps that
// lead down to them. The group becomes a box trench: an asphalt floor, vertical retaining walls with a parapet, and over
// the tunnels a slab, so the street, tram or square above keeps its level.
//
// The two levels at one spot: hf.heightAt (the ground mesh, the lanes, the trams, people, trees) is lowered only in the
// open cuts; over the tunnels it keeps the street above, so the surface traffic and the trams ride it. The car's own
// ground is the collision world's terrain: build() overlays it with the floor under the tunnels too, and the slab (a
// prism, its top the street) carries the car over them. Collision ground queries with a height hint (the car) then
// find the floor below the slab or the slab's top; the ones without (spawn points) find the slab.
// The floor never goes below FLOOR_Y: game/car/car.js takes a floor under y = -1.0 for open water (the car skims it), and
// the water disc (world/water.js) at y = -1.6 would show through a deeper trench. Oradea's centre lies 0–2 m over that,
// so shape() lifts the 16 m terrain lattice round a passage where its street is too low for the depth (at most GRADE
// rise per metre outward, never at a bridge, the river or the fortress' platform), as the real ramps' approaches do.
//
//   shapeGroup(hf, map, geo, G) -> st | null   before the ground is built. G = { id, name, ways: [OSM ids], depth?, clear?,
//     centre: [x, z] } (depth: floor under the street at the tunnels, clear: floor to ceiling). Null when a way is missing
//     from map.json (a changed map, or the phone tier's centre leaving the group out, ?phone).
//     st = { G, ways, pieces, floorAt(x, z) (Infinity off the trench), openAt(x, z) (Infinity off the open cuts),
//       box, stats: { lifted, maxLift, depth, clearMin, ramps } }
//   buildGroup(base, st) -> { group, clear(x, z), stats } | null   once the ground exists: the ground triangles in the open
//     cuts cut out (and the lane paint over them), the floor in the ground material with its lane paint, walls, parapets,
//     headwalls, the tunnel ceiling and lamps (one detail mesh, one ground-material mesh, one paint mesh), colliders
//     (walls, parapets, the slab), the collision terrain overlay. base.ground null (tests): no ground work.
// pieces: [{ pts: [[x, z]..] (convex, counter-clockwise), open, way, a: [x, z], b: [x, z], f0, f1 (floor at a / b),
//   c0, c1 (clear), box }]: one per way segment (<= STEP m), a quad between the miter lines at its ends.
import * as THREE from 'three';
import { MB } from '../../../../kit/mesh.js';
import { DP } from '../../../materials.js';
import { SURF } from '../../../cherkasy/ground.js';
import { WATER_Y } from '../../../water.js';
import { moatState } from '../cetate/moat.js';

export const FLOOR_Y = -0.92;     // the lowest floor (car.js water datum -1.0, less a margin)
const DEPTH = 4.7, CLEAR = 4.1;   // defaults: street to floor at a tunnel, floor to ceiling
const SLAB_MIN = 0.45;            // the thinnest roof over a tunnel
const GRADE = 0.03, GRADE_NEAR = 0.05; // the lift's fall outward, and its cap by the distance to a protected spot
const MARGIN = 0.8;               // corridor half width past the carriageway's (kerb, gutter)
const MERGE = 3.5;                // corridors closer than this merge (no sliver of ground between two walls)
const ALONG_IN = 1.0;             // a corridor beside a surface road may narrow to the carriageway's half less this (>= 2 m;
                                  // a one-way road with lanes to 3.1 m a lane)
const STEP = 5;                   // way segments are cut to at most this (m)
const PAR = 1.0, PAR_T = 0.3;     // parapet over the street, its thickness
const WALL_MIN = 0.3;             // shallower than this an edge is only a kerb
const SEAL_DROP = 0.7;            // the seal guards an edge that drops more than this (a car falls further than its kerb step)
const CELL = 16;
const TRAFFIC = /^(primary|secondary|tertiary|residential|unclassified|living_street)(_link)?$/; // the classes npc/lanes.js drives
const C = { wall: '#b7b3a9', wallDark: '#9d998f', cap: '#cfcbc1', soffit: '#77756f', lamp: '#fff4dc', rail: '#4d5358' };

const pairs = (p) => { const out = []; for (let i = 0; i + 1 < p.length; i += 2) out.push([p[i], p[i + 1]]); return out; };
const fin = (h, d = 2) => (Number.isFinite(h) ? h : d);
const cross = (ax, az, bx, bz) => ax * bz - az * bx;

// nearest point of polyline P to (x, z): { d, s (arc), side (+1 left of the direction), i, f }
function nearest(P, x, z) {
  let best = { d: Infinity, s: 0, side: 1, i: 0, f: 0 }, run = 0;
  for (let k = 1; k < P.length; k++) {
    const [ax, az] = P[k - 1], ex = P[k][0] - ax, ez = P[k][1] - az, L = Math.hypot(ex, ez) || 1e-9;
    const f = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / (L * L))), px = ax + ex * f, pz = az + ez * f, d = Math.hypot(x - px, z - pz);
    if (d < best.d) best = { d, s: run + f * L, side: cross(ex, ez, x - ax, z - az) >= 0 ? 1 : -1, i: k - 1, f };
    run += L;
  }
  return best;
}
const atEnd = (P, q) => (q.i === 0 && q.f <= 1e-6) || (q.i === P.length - 2 && q.f >= 1 - 1e-6); // projects onto an end of P
// convex polygon helpers on [x, z] points
// (indexed, not destructured: it runs for every hf.heightAt in a passage's box, and the destructuring made garbage)
const inConvex = (pts, x, z, eps = 0) => { for (let i = 0, n = pts.length; i < n; i++) { const a = pts[i], b = pts[i + 1 < n ? i + 1 : 0]; if (cross(b[0] - a[0], b[1] - a[1], x - a[0], z - a[1]) < -eps) return false; } return true; };
const area2 = (pts) => { let s = 0; for (let i = 0, n = pts.length; i < n; i++) { const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % n]; s += ax * bz - bx * az; } return s; };
const convex = (pts) => { let sg = 0; for (let i = 0, n = pts.length; i < n; i++) { const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % n], [cx, cz] = pts[(i + 2) % n]; const c = cross(bx - ax, bz - az, cx - bx, cz - bz); if (Math.abs(c) < 1e-9) continue; if (sg && Math.sign(c) !== sg) return false; sg = Math.sign(c); } return true; };
const boxOf = (pts) => { let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity; for (const [x, z] of pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; } return [x0, z0, x1, z1]; };

// Sutherland–Hodgman on vertex records { x, z, ... } against the line a->b: keep the left (in) or the right side.
// lerp(p, q, f) makes the new vertex
function half(poly, ax, az, bx, bz, keepLeft, lerp) {
  const out = [], n = poly.length, side = (p) => (keepLeft ? 1 : -1) * cross(bx - ax, bz - az, p.x - ax, p.z - az);
  for (let i = 0; i < n; i++) {
    const p = poly[i], q = poly[(i + 1) % n], sp = side(p), sq = side(q);
    if (sp >= 0) out.push(p);
    if ((sp >= 0) !== (sq >= 0)) out.push(lerp(p, q, sp / (sp - sq)));
  }
  return out;
}
// poly minus a convex piece -> { pieces, touched }: convex parts outside it (poly convex, any vertex records)
export function minus(poly, pts, lerp) {
  const n = pts.length;
  let allIn = true;
  for (let e = 0; e < n; e++) {
    const [ax, az] = pts[e], [bx, bz] = pts[(e + 1) % n];
    let outAll = true;
    for (const p of poly) { const s = cross(bx - ax, bz - az, p.x - ax, p.z - az); if (s > 1e-7) outAll = false; if (s < -1e-7) allIn = false; }
    if (outAll) return { pieces: [poly], touched: false };
  }
  if (allIn) return { pieces: [], touched: true };
  const pieces = [];
  let cur = poly;
  for (let e = 0; e < n && cur.length >= 3; e++) {
    const [ax, az] = pts[e], [bx, bz] = pts[(e + 1) % n];
    const out = half(cur, ax, az, bx, bz, false, lerp);
    if (out.length >= 3 && Math.abs(area2(out.map((p) => [p.x, p.z]))) > 1e-6) pieces.push(out);
    else if (out.length >= 3 && out.some((p, i) => i && (p.y !== undefined) && Math.abs(p.y - out[0].y) > 1e-4)) pieces.push(out); // a vertical face (kerb): no area in plan
    cur = half(cur, ax, az, bx, bz, true, lerp);
  }
  return { pieces, touched: true };
}
const lerpXZ = (p, q, f) => ({ x: p.x + (q.x - p.x) * f, z: p.z + (q.z - p.z) * f });

// ------------------------------------------------------------------------------------------------ shape
export function shapeGroup(hf, map, geo, G) {
  if (!hf?.data || !map?.levels) return null;
  const pc = map.phoneCentre; // ?phone: only the groups inside the centre's disc (phone.js clipToCentre)
  if (pc && G.centre && Math.hypot(G.centre[0] - pc.x, G.centre[1] - pc.z) > pc.r + 150) return null;
  const byId = new Map(map.levels.map((w) => [w.id, w]));
  const src = G.ways.map((id) => byId.get(id));
  if (src.some((w) => !w)) return null;
  const D = G.depth ?? DEPTH, CL = G.clear ?? CLEAR;
  const ways = src.map((w) => ({ id: w.id, P: pairs(w.p), w: w.w ?? 7, tn: !!w.tn, ow: !!w.ow, ln: w.ln ?? 0, n: w.n ?? '', c: w.c ?? '' }));
  // T-junctions: an end that lands on another way's segment (OSM's node dropped by the 0.3 m simplification) becomes a
  // vertex of that way, so the depth graph is connected there
  for (const w of ways) for (const e of [w.P[0], w.P[w.P.length - 1]]) for (const o of ways) {
    if (o === w) continue;
    const q = nearest(o.P, e[0], e[1]);
    if (q.d > 1.2) continue;
    const A = o.P[q.i], B = o.P[q.i + 1];
    if (Math.hypot(e[0] - A[0], e[1] - A[1]) < 0.3 || Math.hypot(e[0] - B[0], e[1] - B[1]) < 0.3) { const V = Math.hypot(e[0] - A[0], e[1] - A[1]) < 0.3 ? A : B; e[0] = V[0]; e[1] = V[1]; continue; }
    o.P.splice(q.i + 1, 0, [e[0], e[1]]);
  }
  // densify
  for (const w of ways) {
    const out = [w.P[0]];
    for (let k = 1; k < w.P.length; k++) {
      const [ax, az] = w.P[k - 1], [bx, bz] = w.P[k], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / STEP));
      for (let j = 1; j <= m; j++) out.push(j === m ? w.P[k] : [ax + (bx - ax) * j / m, az + (bz - az) * j / m]);
    }
    w.P = out.filter((p, i) => i === 0 || Math.hypot(p[0] - out[i - 1][0], p[1] - out[i - 1][1]) > 0.05);
  }
  // the graph: shared points are one node
  const key = (p) => `${Math.round(p[0] * 10)},${Math.round(p[1] * 10)}`, nodes = new Map(), adj = [];
  const nodeOf = (p) => { const k = key(p); let id = nodes.get(k); if (id === undefined) { nodes.set(k, id = adj.length); adj.push([]); } return id; };
  for (const w of ways) {
    w.ids = w.P.map(nodeOf);
    for (let k = 1; k < w.ids.length; k++) { const l = Math.hypot(w.P[k][0] - w.P[k - 1][0], w.P[k][1] - w.P[k - 1][1]); adj[w.ids[k]].push([w.ids[k - 1], l]); adj[w.ids[k - 1]].push([w.ids[k], l]); }
  }
  const N = adj.length, inTunnel = new Uint8Array(N), deg = new Uint16Array(N);
  for (const w of ways) { deg[w.ids[0]]++; deg[w.ids[w.ids.length - 1]]++; }
  // a tunnel with a loose end has no ramp there: OSM's tunnel is the passage under a raised road or a bridge's abutment,
  // which the game has at grade, so it is an open ramp from that end (the lane check below roofs it where a street crosses)
  let opened = 0;
  for (const w of ways) if (w.tn && (deg[w.ids[0]] === 1 || deg[w.ids[w.ids.length - 1]] === 1)) { w.tn = false; opened++; }
  for (const w of ways) if (w.tn) for (const id of w.ids) inTunnel[id] = 1;
  const surface = [];
  for (const w of ways) if (!w.tn) for (const id of [w.ids[0], w.ids[w.ids.length - 1]]) if (deg[id] === 1 && !inTunnel[id]) surface.push(id);
  // distances along the graph from the nearest seed, carrying that seed's value
  const dijkstra = (seeds) => {
    const d = new Float64Array(N).fill(Infinity), val = new Float64Array(N), done = new Uint8Array(N);
    for (const [s, v] of seeds) { d[s] = 0; val[s] = v; }
    for (;;) { // the graphs are a few hundred nodes: a plain scan is enough
      let u = -1, best = Infinity;
      for (let i = 0; i < N; i++) if (!done[i] && d[i] < best) { best = d[i]; u = i; }
      if (u < 0) break;
      done[u] = 1;
      for (const [v, l] of adj[u]) if (d[u] + l < d[v]) { d[v] = d[u] + l; val[v] = val[u]; }
    }
    return { d, val };
  };
  const pos = new Array(N);
  for (const w of ways) w.ids.forEach((id, k) => { pos[id] = w.P[k]; });
  const dS0 = dijkstra(surface.map((i) => [i, 0])).d, dT0 = dijkstra([...Array(N).keys()].filter((i) => inTunnel[i]).map((i) => [i, 0])).d;
  const ramps = surface.map((i) => Math.round(dT0[i]));

  // ---- the lift: the street over a tunnel at least FLOOR_Y + depth (+ 5 cm), falling GRADE per metre outward, capped by
  // GRADE_NEAR x the distance to a protected spot (a bridge's deck or its road, the river, the fortress' platform)
  const { meta: { x0, z0, cell, nx, nz }, grid: g } = hf.data;
  const req = [];
  for (let i = 0; i < N; i++) if (inTunnel[i]) req.push([pos[i][0], pos[i][1], FLOOR_Y + D + 0.05]);
  let rx0 = Infinity, rz0 = Infinity, rx1 = -Infinity, rz1 = -Infinity, reqMax = -Infinity;
  for (const [x, z, r] of req) { rx0 = Math.min(rx0, x); rx1 = Math.max(rx1, x); rz0 = Math.min(rz0, z); rz1 = Math.max(rz1, z); reqMax = Math.max(reqMax, r); }
  const H0 = hf.heightAt;
  let lifted = 0, maxLift = 0;
  if (req.length) {
    const R = Math.max(0, (reqMax - FLOOR_Y) / GRADE) + cell;
    const prot = [];
    for (const r of map.roads ?? []) if (r.br) for (const [x, z] of pairs(r.p)) if (x > rx0 - R - 60 && x < rx1 + R + 60 && z > rz0 - R - 60 && z < rz1 + R + 60) prot.push([x, z, (r.w ?? 8) / 2 + 2]);
    const moat = moatState()?.box; // the fortress' platform and moat (sites/cetate): levelled before this runs
    const i0 = Math.max(0, Math.floor((rx0 - R - x0) / cell)), i1 = Math.min(nx - 1, Math.ceil((rx1 + R - x0) / cell));
    const j0 = Math.max(0, Math.floor((rz0 - R - z0) / cell)), j1 = Math.min(nz - 1, Math.ceil((rz1 + R - z0) / cell));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (g[j * nx + i] < WATER_Y + 0.6) prot.push([x0 + i * cell, z0 + j * cell, 0]); // the river
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const k = j * nx + i, x = x0 + i * cell, z = z0 + j * cell;
      let want = -Infinity;
      for (const [rx, rz, r] of req) { const v = r - GRADE * Math.max(0, Math.hypot(x - rx, z - rz) - 6); if (v > want) want = v; }
      if (want <= g[k]) continue;
      let dp = Infinity;
      for (const [px, pz, pr] of prot) { const d = Math.hypot(x - px, z - pz) - pr; if (d < dp) dp = d; }
      if (moat) { const dx = Math.max(moat[0] - x, 0, x - moat[2]), dz = Math.max(moat[1] - z, 0, z - moat[3]); dp = Math.min(dp, Math.hypot(dx, dz)); }
      const v = Math.min(want, g[k] + GRADE_NEAR * Math.max(0, dp));
      if (v > g[k] + 0.005) { maxLift = Math.max(maxLift, v - g[k]); g[k] = v; lifted++; }
    }
  }

  // ---- floors. A tunnel: under the (lifted) street by the depth, never under FLOOR_Y, the ceiling at least SLAB_MIN under
  // the street. A cut: from the floor at the nearest portal to the street at its own surface end, eased (no kinks at the
  // ends), never over the street
  const Lnode = new Float64Array(N);
  for (let i = 0; i < N; i++) Lnode[i] = fin(H0(pos[i][0], pos[i][1]));
  const fT = new Float64Array(N).fill(NaN);
  for (const w of ways) if (w.tn) { // along the tunnel, smoothed over its neighbours
    const raw = w.ids.map((id) => Math.max(FLOOR_Y, Lnode[id] - D));
    w.ids.forEach((id, k) => { let s = 0, n = 0; for (let q = Math.max(0, k - 2); q <= Math.min(raw.length - 1, k + 2); q++) { s += raw[q]; n++; } const v = Math.max(FLOOR_Y, s / n); fT[id] = Number.isNaN(fT[id]) ? v : Math.min(fT[id], v); });
  }
  // harmonic fields on the graph (each node the length-weighted mean of its neighbours, the given nodes fixed): w 0 at the
  // surface ends and 1 at the tunnels; the portal floor spread from the tunnels; the street at the surface ends spread
  // from them. floor = street + (portal - street) * ease(w): linear in arc length along a plain ramp, eased at both ends,
  // and continuous where a ramp splits (no nearest-end switch)
  const harmonic = (fixed) => {
    const v = new Float64Array(N), isF = new Uint8Array(N);
    let mean = 0, nF = 0;
    for (const [i, x] of fixed) { v[i] = x; isF[i] = 1; mean += x; nF++; }
    if (!nF) return v;
    for (let i = 0; i < N; i++) if (!isF[i]) v[i] = mean / nF;
    for (let it = 0; it < 4000; it++) {
      let delta = 0;
      for (let i = 0; i < N; i++) {
        if (isF[i] || !adj[i].length) continue;
        let sw = 0, sv = 0;
        for (const [j, l] of adj[i]) { const wt = 1 / Math.max(0.1, l); sw += wt; sv += wt * v[j]; }
        const nv = v[i] + 1.7 * (sv / sw - v[i]);
        delta = Math.max(delta, Math.abs(nv - v[i])); v[i] = nv;
      }
      if (delta < 1e-5) break;
    }
    return v;
  };
  const tunnels = [...Array(N).keys()].filter((i) => inTunnel[i]);
  const Wf = harmonic([...surface.map((i) => [i, 0]), ...tunnels.map((i) => [i, 1])]);
  const Ft = harmonic(tunnels.map((i) => [i, fT[i]])), Fs = harmonic(surface.map((i) => [i, Lnode[i]]));
  const ease = (w) => 0.5 * w + 0.5 * w * w * (3 - 2 * w);
  const floorN = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    if (inTunnel[i]) { floorN[i] = fT[i]; continue; }
    const w = Math.max(0, Math.min(1, tunnels.length ? (surface.length ? Wf[i] : 1) : 0));
    floorN[i] = Math.min(Lnode[i], (surface.length ? Fs[i] : Ft[i]) + ((tunnels.length ? Ft[i] : Fs[i]) - (surface.length ? Fs[i] : Ft[i])) * ease(w));
  }
  for (const w of ways) {
    w.L = w.ids.map((id) => Lnode[id]);
    w.f = w.ids.map((id) => floorN[id]);
    w.c = w.ids.map((id, k) => Math.max(2.6, Math.min(CL, w.L[k] - SLAB_MIN - w.f[k])));
    w.d = w.ids.map((id, k) => w.L[k] - w.f[k]);
  }
  // corridors side by side with nearly the same floor share the lower one (a dual carriageway in one box), easing out as
  // the floors part (a ramp climbing away beside a deeper road), so neither floor steps along its way
  const share = ways.map((w) => w.f.slice());
  for (const w of ways) w.P.forEach(([x, z], k) => {
    for (const o of ways) {
      if (o === w) continue;
      const q = nearest(o.P, x, z), reach = w.w / 2 + o.w / 2 + 2 * MARGIN + MERGE;
      if (q.d > reach || atEnd(o.P, q)) continue; // alongside, not end to end
      const f = o.f[q.i] + (o.f[q.i + 1] - o.f[q.i]) * q.f, dlt = w.f[k] - f;
      if (dlt <= 0) continue;
      const clamp = (v) => Math.max(0, Math.min(1, v)); // every factor soft, so no floor steps along its way
      const sig = clamp((1.0 - dlt) / 0.7) * clamp((reach - q.d) / 3) * clamp((w.L[k] - w.f[k] - 0.3) / 0.8);
      share[ways.indexOf(w)][k] = Math.min(share[ways.indexOf(w)][k], w.f[k] - dlt * sig);
    }
  });
  ways.forEach((w, i) => { w.f = share[i]; w.c = w.c.map((c, k) => Math.max(2.6, Math.min(CL, w.L[k] - SLAB_MIN - w.f[k]))); });

  // ---- corridors: per-vertex half widths each side, widened to meet a neighbour closer than MERGE
  for (const w of ways) {
    const n = w.P.length, hw = w.w / 2 + MARGIN;
    w.wl = new Float64Array(n).fill(hw); w.wr = new Float64Array(n).fill(hw);
    for (let k = 0; k < n; k++) {
      const [x, z] = w.P[k];
      for (const o of ways) {
        if (o === w) continue;
        const q = nearest(o.P, x, z), ho = o.w / 2 + MARGIN, gap = q.d - hw - ho;
        if (gap <= 0 || gap >= MERGE || atEnd(o.P, q)) continue;
        const a = k > 0 ? w.P[k - 1] : w.P[k], b = k < n - 1 ? w.P[k + 1] : w.P[k], [px, pz] = o.P[q.i];
        const ox = px + (o.P[q.i + 1][0] - px) * q.f, oz = pz + (o.P[q.i + 1][1] - pz) * q.f;
        const left = cross(b[0] - a[0], b[1] - a[1], ox - x, oz - z) >= 0;
        const need = q.d - ho + 0.3;
        if (left) w.wl[k] = Math.max(w.wl[k], need); else w.wr[k] = Math.max(w.wr[k], need);
      }
    }
  }
  // ... and narrowed, down to the carriageway less ALONG_IN, where a surface road runs alongside (a frontage lane beside
  // the ramp's wall: OSM's widths are estimates, and the surface lane must stay on the street)
  const own = (P) => P.every(([x, z]) => ways.some((w) => nearest(w.P, x, z).d < 1.0));
  const alongside = (map.roads ?? []).filter((r) => r.k === 'm' && r.p?.length >= 4).map((r) => ({ P: pairs(r.p), r }))
    .filter(({ P }) => P.some(([x, z]) => ways.some((w) => nearest(w.P, x, z).d < 25)) && !own(P));
  let narrowed = 0;
  for (const w of ways) {
    const n = w.P.length, lo = Math.max(2.0, Math.min(w.w / 2 - ALONG_IN, w.ow && w.ln >= 2 ? w.ln * 1.55 + 0.25 : Infinity)); // a one-way road: its lanes at 3.1 m
    for (let k = 0; k < n; k++) {
      const [x, z] = w.P[k], a = w.P[Math.max(0, k - 1)], b = w.P[Math.min(n - 1, k + 1)], dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      for (const { P, r } of alongside) {
        const q = nearest(P, x, z);
        if (q.d > 20 || atEnd(P, q)) continue;
        const A = P[q.i], B = P[q.i + 1], el = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1;
        if (Math.abs(((B[0] - A[0]) * (b[0] - a[0]) + (B[1] - A[1]) * (b[1] - a[1])) / (el * dl)) < 0.6) continue; // a crossing, not alongside
        const hw = (r.w ?? 6) / 2, occ = r.ow && (r.ln ?? 1) <= 1 ? Math.min(hw, 2.0) : Math.max(1.8, hw - 0.4);
        const need = Math.max(lo, q.d - occ - 0.15);
        const ox = A[0] + (B[0] - A[0]) * q.f, oz = A[1] + (B[1] - A[1]) * q.f;
        const left = cross(b[0] - a[0], b[1] - a[1], ox - x, oz - z) >= 0;
        if (left && need < w.wl[k]) { w.wl[k] = need; narrowed++; }
        if (!left && need < w.wr[k]) { w.wr[k] = need; narrowed++; }
      }
    }
  }
  const pieces = [];
  for (const w of ways) {
    const n = w.P.length, M = [];
    for (let k = 0; k < n; k++) { // miter direction (unit, to the left) and its scale
      const a = w.P[Math.max(0, k - 1)], b = w.P[k], c = w.P[Math.min(n - 1, k + 1)];
      const n1 = k > 0 ? [-(b[1] - a[1]), b[0] - a[0]] : null, n2 = k < n - 1 ? [-(c[1] - b[1]), c[0] - b[0]] : null;
      const u = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
      const A = n1 ? u(n1) : u(n2), B = n2 ? u(n2) : u(n1), m = u([A[0] + B[0], A[1] + B[1]]);
      M.push([m[0], m[1], Math.min(2, 1 / Math.max(0.5, m[0] * A[0] + m[1] * A[1]))]);
    }
    for (let k = 0; k + 1 < n; k++) {
      const P0 = w.P[k], P1 = w.P[k + 1], m0 = M[k], m1 = M[k + 1];
      const L0 = [P0[0] + m0[0] * w.wl[k] * m0[2], P0[1] + m0[1] * w.wl[k] * m0[2]], R0 = [P0[0] - m0[0] * w.wr[k] * m0[2], P0[1] - m0[1] * w.wr[k] * m0[2]];
      const L1 = [P1[0] + m1[0] * w.wl[k + 1] * m1[2], P1[1] + m1[1] * w.wl[k + 1] * m1[2]], R1 = [P1[0] - m1[0] * w.wr[k + 1] * m1[2], P1[1] - m1[1] * w.wr[k + 1] * m1[2]];
      let pts = [R0, R1, L1, L0];
      if (area2(pts) < 0) pts = pts.reverse();
      const rec = { open: !w.tn, way: w, k, a: P0, b: P1, f0: w.f[k], f1: w.f[k + 1], c0: w.c[k], c1: w.c[k + 1] };
      if (convex(pts)) pieces.push({ ...rec, pts, box: boxOf(pts) });
      else for (const tri of [[pts[0], pts[1], pts[2]], [pts[0], pts[2], pts[3]]]) if (Math.abs(area2(tri)) > 1e-6) { const t = area2(tri) < 0 ? tri.reverse() : tri; pieces.push({ ...rec, pts: t, box: boxOf(t) }); }
    }
  }
  // grid of pieces
  const box = boxOf(pieces.flatMap((p) => p.pts)), gw = Math.max(1, Math.ceil((box[2] - box[0]) / CELL) + 1), gh = Math.max(1, Math.ceil((box[3] - box[1]) / CELL) + 1);
  const grid = Array.from({ length: gw * gh }, () => []);
  pieces.forEach((p, idx) => {
    for (let j = Math.floor((p.box[1] - box[1]) / CELL); j <= Math.floor((p.box[3] - box[1]) / CELL); j++)
      for (let i = Math.floor((p.box[0] - box[0]) / CELL); i <= Math.floor((p.box[2] - box[0]) / CELL); i++) grid[j * gw + i].push(idx);
  });
  const near = (x, z) => { if (x < box[0] || x > box[2] || z < box[1] || z > box[3]) return null; return grid[Math.floor((z - box[1]) / CELL) * gw + Math.floor((x - box[0]) / CELL)]; };
  const along = (p, x, z) => { const ex = p.b[0] - p.a[0], ez = p.b[1] - p.a[1], L2 = ex * ex + ez * ez || 1; return Math.max(0, Math.min(1, ((x - p.a[0]) * ex + (z - p.a[1]) * ez) / L2)); };
  const fOf = (p, x, z) => { const t = along(p, x, z); return p.f0 + (p.f1 - p.f0) * t; };
  const cOf = (p, x, z) => { const t = along(p, x, z); return p.c0 + (p.c1 - p.c0) * t; };
  const query = (x, z, which) => { // min floor of the pieces holding (x, z): which 0 all, 1 open, 2 covered, 3 a cut's roofed piece
    const L = near(x, z);
    if (!L) return Infinity;
    let f = Infinity;
    for (const idx of L) { const p = pieces[idx]; if ((which === 1 && !p.open) || (which === 2 && p.open) || (which === 3 && (p.open || p.way.tn))) continue; if (inConvex(p.pts, x, z, 1e-6)) { const v = fOf(p, x, z); if (v < f) f = v; } }
    return f;
  };
  const floorAt = (x, z) => query(x, z, 0), openAt = (x, z) => query(x, z, 1), coveredAt = (x, z) => query(x, z, 2);
  const inOpen = (x, z) => openAt(x, z) < Infinity;

  // ---- surface lanes over an open cut (OSM's frontage carriageways can lie over a ramp): where the cut is deep enough
  // for a roof the piece is covered (the tunnel runs on under the street), elsewhere the lane keeps the street's height
  // (`keep`, 1 m cells), so surface traffic and the trams never drop into the cut
  const KC = 1, kw = Math.ceil((box[2] - box[0]) / KC) + 1, kh = Math.ceil((box[3] - box[1]) / KC) + 1, keep = new Uint8Array(kw * kh);
  let covered = 0, kept = 0;
  // the cut's own lanes (its traffic, the lane graph has the cuts but not the tunnels) always follow the floor, also under
  // a roof added here: where a surface lane crosses them the cut's traffic wins
  const ownLane = new Uint8Array(kw * kh), cellOf = (x, z) => { const i = Math.floor((x - box[0]) / KC), j = Math.floor((z - box[1]) / KC); return i >= 0 && j >= 0 && i < kw && j < kh ? j * kw + i : -1; };
  for (const w of ways) if (!w.tn && TRAFFIC.test(w.c)) for (const o of laneOffsets({ w: w.w, ln: w.ln, ow: w.ow })) {
    const Ln = offsetLine(w.P, o);
    for (let k = 1; k < Ln.length; k++) {
      const [ax, az] = Ln[k - 1], [bx, bz] = Ln[k], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.5));
      for (let j = 0; j <= n; j++) for (let dz = -1.2; dz <= 1.2; dz += 0.6) for (let dx = -1.2; dx <= 1.2; dx += 0.6) { const c = cellOf(ax + (bx - ax) * j / n + dx, az + (bz - az) * j / n + dz); if (c >= 0) ownLane[c] = 1; }
    }
  }
  const laneLines = [];
  for (const r of map.roads ?? []) {
    if (r.k !== 'm' || !r.p || r.p.length < 4) continue;
    const P = pairs(r.p);
    if (!P.some(([x, z]) => x > box[0] - 30 && x < box[2] + 30 && z > box[1] - 30 && z < box[3] + 30) || own(P)) continue;
    for (const o of laneOffsets(r)) laneLines.push(offsetLine(P, o));
  }
  const walkLines = []; // the footways people walk: kept at the street (never a roof for them)
  for (const r of map.roads ?? []) {
    if (r.k === 'm' || !r.p || r.p.length < 4) continue;
    const P = pairs(r.p);
    if (P.some(([x, z]) => x > box[0] - 30 && x < box[2] + 30 && z > box[1] - 30 && z < box[3] + 30) && !own(P)) walkLines.push(P);
  }
  for (const r of map.trams ?? []) { // the trams ride hf.heightAt too
    if (!r.p || r.p.length < 4) continue;
    const P = pairs(r.p);
    if (P.some(([x, z]) => x > box[0] - 30 && x < box[2] + 30 && z > box[1] - 30 && z < box[3] + 30)) laneLines.push(P, offsetLine(P, 1.2), offsetLine(P, -1.2));
  }
  const conflictAt = (x, z) => { const f = openAt(x, z); return f < Infinity ? H0(x, z) - f : 0; };
  for (let pass = 0; pass < 3; pass++) for (const Ln of pass < 2 ? laneLines : walkLines) for (let k = 1; k < Ln.length; k++) {
    const [ax, az] = Ln[k - 1], [bx, bz] = Ln[k], l = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(l / 0.5)), nx = -(bz - az) / (l || 1), nz = (bx - ax) / (l || 1);
    for (let j = 0; j <= n; j++) for (const o of [-0.9, 0, 0.9]) {
      const x = ax + (bx - ax) * j / n + nx * o, z = az + (bz - az) * j / n + nz * o;
      if (conflictAt(x, z) <= 0.3) continue;
      const L = near(x, z) ?? [];
      for (const idx of L) {
        const p = pieces[idx];
        if (!p.open || !inConvex(p.pts, x, z, 1e-6)) continue;
        const room = (k2) => (k2 ? p.way.L[p.k + 1] - p.f1 : p.way.L[p.k] - p.f0) - SLAB_MIN;
        if (pass === 0 && Math.min(room(0), room(1)) >= 2.6) { p.open = false; p.c0 = Math.min(CL, room(0)); p.c1 = Math.min(CL, room(1)); covered++; }
        else if (pass >= 1) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const i = Math.floor((x - box[0]) / KC) + dx, jj = Math.floor((z - box[1]) / KC) + dz; if (i >= 0 && jj >= 0 && i < kw && jj < kh && !keep[jj * kw + i]) { keep[jj * kw + i] = 1; kept++; } }
      }
    }
  }

  // ---- heightAt: the open cuts' floor; the ground meshes are built from the lattice (latticeAt) and cut in build()
  hf.latticeAt ??= H0;
  hf.heightAt = (x, z) => {
    const h = H0(x, z);
    if (x < box[0] || x > box[2] || z < box[1] || z > box[3]) return h;
    const c = Math.floor((z - box[1]) / KC) * kw + Math.floor((x - box[0]) / KC);
    if (ownLane[c]) { const f = Math.min(openAt(x, z), query(x, z, 3)); return f < h ? f : h; }
    if (keep[c]) return h;
    const f = openAt(x, z);
    return f < h ? f : h;
  };
  const clearMin = Math.min(...ways.filter((w) => w.tn).flatMap((w) => w.c), Infinity);
  return { G, ways, pieces, near, floorAt, openAt, coveredAt, inOpen, fOf, cOf, surfaceAt: H0, box,
    stats: { lifted, maxLift: +maxLift.toFixed(2), depth: D, clearMin: +clearMin.toFixed(2), ramps, pieces: pieces.length, narrowed, covered, kept, opened } };
}

// a road's lane centre offsets, as npc/lanes.js lays them (to the right of travel; both ways on a two-way road)
function laneOffsets(r) {
  const w = r.w || 6, out = [];
  if (r.ow) {
    const n = Math.max(1, Math.min(2, r.ln || (w >= 9 ? 2 : 1))), tot = Math.max(n, r.ln || n), lw = w / tot, sh = tot > n ? lw * (tot - n) / 2 : 0;
    for (let k = 0; k < n; k++) out.push(-(lw * (k + 0.5) - w / 2 + sh)); // right of travel = -left
  } else {
    const n = Math.max(1, Math.min(2, r.ln ? Math.floor(r.ln / 2) : (w >= 13 ? 2 : 1))), lw = w / (r.ln ? Math.max(2, r.ln) : 2 * n);
    for (let k = 0; k < n; k++) { const o = Math.max(1.65, lw * (k + 0.5)); out.push(o, -o); }
  }
  return out;
}
// polyline P offset by o to its left (miter joins, capped)
function offsetLine(P, o) {
  return P.map((p, k) => {
    const a = P[Math.max(0, k - 1)], b = P[Math.min(P.length - 1, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [p[0] - (b[1] - a[1]) / l * o, p[1] + (b[0] - a[0]) / l * o];
  });
}

// ------------------------------------------------------------------------------------------------ build
// cut every ground / paint triangle of `meshes` out of the convex pieces; the kept parts go to new meshes beside them
function cutGround(meshes, pieces, box, parent, name) {
  let cut = 0, made = 0;
  for (const m of meshes) {
    const geo = m.geometry;
    if (!geo?.index || !geo.attributes.position?.array) continue;
    if (!geo.boundingBox) geo.computeBoundingBox();
    const bb = geo.boundingBox;
    if (bb.max.x < box[0] || bb.min.x > box[2] || bb.max.z < box[1] || bb.min.z > box[3]) continue;
    const names = Object.keys(geo.attributes), A = names.map((k) => geo.attributes[k]), I = geo.index.array, P = geo.attributes.position.array;
    const out = names.map(() => []), idx = [];
    let nv = 0;
    const rec = (v) => { const r = { x: P[3 * v], z: P[3 * v + 2], y: P[3 * v + 1], a: A.map((at) => Array.from({ length: at.itemSize }, (_, c) => at.array[v * at.itemSize + c])) }; return r; };
    const lerp = (p, q, f) => ({ x: p.x + (q.x - p.x) * f, z: p.z + (q.z - p.z) * f, y: p.y + (q.y - p.y) * f, a: p.a.map((arr, i) => arr.map((v, c) => v + (q.a[i][c] - v) * f)) });
    for (let k = 0; k < I.length; k += 3) {
      const a = I[k], b = I[k + 1], c = I[k + 2];
      if (a === b && b === c) continue;
      const tx0 = Math.min(P[3 * a], P[3 * b], P[3 * c]), tx1 = Math.max(P[3 * a], P[3 * b], P[3 * c]);
      const tz0 = Math.min(P[3 * a + 2], P[3 * b + 2], P[3 * c + 2]), tz1 = Math.max(P[3 * a + 2], P[3 * b + 2], P[3 * c + 2]);
      if (tx1 < box[0] || tx0 > box[2] || tz1 < box[1] || tz0 > box[3]) continue;
      const cand = pieces.filter((p) => !(p.box[2] < tx0 || p.box[0] > tx1 || p.box[3] < tz0 || p.box[1] > tz1));
      if (!cand.length) continue;
      let polys = [[rec(a), rec(b), rec(c)]], touched = false;
      for (const p of cand) {
        const next = [];
        for (const poly of polys) { const r = minus(poly, p.pts, lerp); if (r.touched) touched = true; next.push(...r.pieces); }
        polys = next;
        if (!polys.length) break;
      }
      if (!touched) continue;
      I[k + 1] = I[k + 2] = a; cut++;
      for (const poly of polys) {
        const base = nv;
        for (const v of poly) { v.a.forEach((arr, i) => out[i].push(...arr)); nv++; }
        for (let q = 1; q + 1 < poly.length; q++) idx.push(base, base + q, base + q + 1);
      }
    }
    if (!cut) continue;
    geo.index.needsUpdate = true;
    if (!idx.length) continue;
    const g = new THREE.BufferGeometry();
    names.forEach((k, i) => {
      const arr = new Float32Array(out[i]);
      if (k === 'normal') for (let q = 0; q < arr.length; q += 3) { const l = Math.hypot(arr[q], arr[q + 1], arr[q + 2]) || 1; arr[q] /= l; arr[q + 1] /= l; arr[q + 2] /= l; }
      g.setAttribute(k, new THREE.BufferAttribute(arr, A[i].itemSize));
    });
    g.setIndex(nv > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
    g.computeBoundingSphere();
    parent.add(Object.assign(new THREE.Mesh(g, m.material), { name: `${name} ${m.name}`, receiveShadow: true, matrixAutoUpdate: false }));
    made++;
  }
  return { cut, made };
}

// a mesh in the ground material: polygons with a surface id (fan), normals from the plane
function groundBuilder() {
  const p = [], n = [], s = [], i = [];
  return {
    get v() { return p.length / 3; },
    poly(pts, surf, up = 1) { // pts [[x, y, z]..] counter-clockwise seen from above when up = 1
      if (pts.length < 3) return;
      const [a, b, c] = pts, e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      let nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0];
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const flip = up * ny < 0 && Math.abs(ny) > 0.3;
      const b0 = p.length / 3;
      for (const q of pts) { p.push(q[0], q[1], q[2]); n.push(flip ? -nx : nx, flip ? -ny : ny, flip ? -nz : nz); s.push(surf); }
      for (let q = 1; q + 1 < pts.length; q++) i.push(...(flip ? [b0, b0 + q + 1, b0 + q] : [b0, b0 + q, b0 + q + 1]));
    },
    quad(a, b, c, d, nrm, surf) { // a vertical face, wound to face nrm
      const b0 = p.length / 3;
      for (const q of [a, b, c, d]) { p.push(q[0], q[1], q[2]); n.push(nrm[0], nrm[1], nrm[2]); s.push(surf); }
      const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const f = nrm[0] * (e1[1] * e2[2] - e1[2] * e2[1]) + nrm[1] * (e1[2] * e2[0] - e1[0] * e2[2]) + nrm[2] * (e1[0] * e2[1] - e1[1] * e2[0]);
      i.push(...(f > 0 ? [b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3] : [b0, b0 + 2, b0 + 1, b0, b0 + 3, b0 + 2]));
    },
    mesh(mat, name) {
      if (!mat || !i.length) return null;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
      g.setAttribute('aSurf', new THREE.Float32BufferAttribute(s, 1));
      g.setIndex(i); g.computeBoundingSphere();
      return Object.assign(new THREE.Mesh(g, mat), { name, receiveShadow: true, matrixAutoUpdate: false });
    },
  };
}

export function buildGroup(base, st) {
  if (!st) return null;
  const { root, solids: S, ground, detailMat } = base;
  const t0 = performance.now(), { pieces, near, floorAt, openAt, coveredAt, fOf, cOf, box } = st;
  const surf = (x, z) => fin(st.surfaceAt(x, z)); // the street (the lattice, lifted)
  const group = Object.assign(new THREE.Group(), { name: `passage-${st.G.id}` });
  root.add(group);
  const stats = { cut: 0, walls: 0, headwalls: 0, kerbs: 0, seals: 0, slab: 0, colliders: 0, lamps: 0 };
  const lerp = lerpXZ;

  // ---- the ground in the open cuts and the paint over them go; the floor and its paint are drawn here
  const gmat = (ground?.root?.children ?? []).find((m) => m.material?.name === 'cherkasy-ground')?.material ?? null;
  const markings = ground?.root?.children?.find((m) => m.name === 'markings') ?? null;
  const open = pieces.filter((p) => p.open);
  if (ground?.root) {
    const tiles = ground.root.children.filter((m) => m.material?.name === 'cherkasy-ground' && m.geometry?.index);
    stats.cut = cutGround(tiles, open, box, ground.root, `passage ${st.G.id}`).cut;
    if (markings) cutGround([markings], open, box, ground.root, `passage ${st.G.id}`);
  }
  // disjoint floor pieces: each piece less the ones before it
  const disjoint = (list) => {
    const out = [];
    list.forEach((p, k) => {
      let polys = [p.pts.map(([x, z]) => ({ x, z }))];
      for (let q = 0; q < k && polys.length; q++) {
        const o = list[q];
        if (o.box[2] < p.box[0] || o.box[0] > p.box[2] || o.box[3] < p.box[1] || o.box[1] > p.box[3]) continue;
        const next = [];
        for (const poly of polys) next.push(...minus(poly, o.pts, lerp).pieces);
        polys = next;
      }
      for (const poly of polys) out.push({ p, poly });
    });
    return out;
  };
  const top = groundBuilder();
  const flo = disjoint(pieces);
  for (const { poly } of flo) top.poly(poly.map((v) => [v.x, floorAt(v.x, v.z) === Infinity ? surf(v.x, v.z) : floorAt(v.x, v.z), v.z]), SURF.ASPHALT);

  // ---- lane paint on the floor, along each way
  const paint = new MB();
  const strip = (w, s0, s1, o, hw) => { // o: an offset, or (k) -> the offset at vertex k (linear between)
    const P = w.P, oAt = typeof o === 'function' ? o : () => o;
    let run = 0;
    for (let k = 1; k < P.length; k++) {
      const [ax, az] = P[k - 1], [bx, bz] = P[k], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, nx = -uz, nz = ux;
      const a = Math.max(s0, run), b = Math.min(s1, run + L), o0 = oAt(k - 1), o1 = oAt(k);
      if (b > a + 0.05) {
        const q = (s, off) => { const oo = off + o0 + (o1 - o0) * (s - run) / L, x = ax + ux * (s - run) + nx * oo, z = az + uz * (s - run) + nz * oo; const f = floorAt(x, z); return [x, (f === Infinity ? surf(x, z) : f) + 0.02, z]; };
        paint.face([q(a, -hw), q(b, -hw), q(b, hw), q(a, hw)], [0, 1, 0]);
      }
      run += L;
    }
    return run;
  };
  for (const w of st.ways) {
    let len = 0; for (let k = 1; k < w.P.length; k++) len += Math.hypot(w.P[k][0] - w.P[k - 1][0], w.P[k][1] - w.P[k - 1][1]);
    const hw = w.w / 2, lanes = w.ln || (w.ow ? Math.max(1, Math.round(w.w / 3.5)) : 2);
    // edge lines, inside a corridor narrowed beside a surface road
    strip(w, 0, len, (k) => -Math.min(hw, w.wr[k] - MARGIN + 0.3) + 0.3, 0.07);
    strip(w, 0, len, (k) => Math.min(hw, w.wl[k] - MARGIN + 0.3) - 0.3, 0.07);
    if (!w.ow) strip(w, 0, len, 0, 0.08); // a two-way road's centre line
    const per = w.ow ? lanes : lanes / 2, lw = (w.ow ? w.w : w.w / 2) / Math.max(1, per);
    for (const sg of w.ow ? [1] : [1, -1]) for (let q = 1; q < per; q++) {
      const o = w.ow ? -hw + q * lw : sg * q * lw;
      for (let s = 2; s < len - 2; s += 9) strip(w, s, Math.min(len - 1, s + 3), o, 0.06);
    }
  }

  // ---- walls along every piece edge, by what lies outside it
  const det = new MB(), col = (c, part = DP.CONC) => det.setColor(c).setPart(part);
  const SUB = 1.0;
  const runs = []; // [{ kind, pts: [[x, z]..], nrm: [x, z] (into the piece), piece }]
  const mine = []; // this group's wall boxes [cx, cz, hx, hz, ang, lo, hi], for the seal below
  for (const p of pieces) {
    const n = p.pts.length;
    for (let e = 0; e < n; e++) {
      const [ax, az] = p.pts[e], [bx, bz] = p.pts[(e + 1) % n], L = Math.hypot(bx - ax, bz - az);
      if (L < 0.05) continue;
      const ux = (bx - ax) / L, uz = (bz - az) / L, inx = -uz, inz = ux; // counter-clockwise: the inside is to the left
      const m = Math.max(1, Math.round(L / SUB));
      let cur = null;
      for (let j = 0; j < m; j++) {
        const s0 = (j / m) * L, s1 = ((j + 1) / m) * L, sm = (s0 + s1) / 2, mx = ax + ux * sm, mz = az + uz * sm;
        const qx = mx - inx * 0.15, qz = mz - inz * 0.15, ix = mx + inx * 0.15, iz = mz + inz * 0.15;
        const fo = openAt(qx, qz), fc = coveredAt(qx, qz), fin_ = floorAt(ix, iz);
        let kind = null;
        if (p.open) {
          if (fo === Infinity && fc === Infinity) kind = 'retain';
          else if (fo < Infinity && fo - fin_ > WALL_MIN) kind = 'step';
        } else if (fo === Infinity && fc === Infinity) kind = 'tunnel';
        else if (fo < Infinity) kind = 'head';
        if (kind && cur && cur.kind === kind) cur.pts.push([ax + ux * s1, az + uz * s1]);
        else { cur = kind ? { kind, pts: [[ax + ux * s0, az + uz * s0], [ax + ux * s1, az + uz * s1]], nrm: [inx, inz], piece: p } : null; if (cur) runs.push(cur); }
      }
    }
  }
  const top3 = (x, z) => surf(x, z); // the street at the wall's outer side
  for (const r of runs) {
    const { kind, pts, nrm: [inx, inz], piece } = r;
    for (let k = 1; k < pts.length; k++) {
      const [ax, az] = pts[k - 1], [bx, bz] = pts[k];
      const fa = fOf(piece, ax, az), fb = fOf(piece, bx, bz);
      const oa = [ax - inx * 0.2, az - inz * 0.2], ob = [bx - inx * 0.2, bz - inz * 0.2];
      if (kind === 'retain') {
        const sa = top3(...oa), sb = top3(...ob);
        if (Math.max(sa - fa, sb - fb) < WALL_MIN) { // a kerb face up to the walk beside it
          top.quad([ax, fa, az], [bx, fb, bz], [bx, sb + 0.2, bz], [ax, sa + 0.2, az], [inx, 0, inz], SURF.CURB); stats.kerbs++;
          continue;
        }
        const ya = sa + PAR, yb = sb + PAR, ox = -inx * PAR_T, oz = -inz * PAR_T;
        col(C.wall).face([[ax, fa, az], [bx, fb, bz], [bx, yb, bz], [ax, ya, az]], [inx, 0, inz]);
        col(C.cap).face([[ax, ya, az], [bx, yb, bz], [bx + ox, yb, bz + oz], [ax + ox, ya, az + oz]], [0, 1, 0]);
        col(C.wall).face([[ax + ox, sa - 0.2, az + oz], [bx + ox, sb - 0.2, bz + oz], [bx + ox, yb, bz + oz], [ax + ox, ya, az + oz]], [-inx, 0, -inz]);
        stats.walls++;
      } else if (kind === 'step') { // a median wall where a deeper cut runs beside a shallower one
        const ua = fOf(piece, ax - inx * 0.3, az - inz * 0.3), ub = fOf(piece, bx - inx * 0.3, bz - inz * 0.3);
        const ta = Math.max(openAt(ax - inx * 0.3, az - inz * 0.3), fa) , tb = Math.max(openAt(bx - inx * 0.3, bz - inz * 0.3), fb);
        const ya = (Number.isFinite(ta) ? ta : ua) + PAR, yb = (Number.isFinite(tb) ? tb : ub) + PAR;
        col(C.wall).face([[ax, fa, az], [bx, fb, bz], [bx, yb, bz], [ax, ya, az]], [inx, 0, inz]);
        col(C.cap).face([[ax, ya, az], [bx, yb, bz], [bx - inx * 0.25, yb, bz - inz * 0.25], [ax - inx * 0.25, ya, az - inz * 0.25]], [0, 1, 0]);
        col(C.wall).face([[ax - inx * 0.25, ya - PAR - 0.1, az - inz * 0.25], [bx - inx * 0.25, yb - PAR - 0.1, bz - inz * 0.25], [bx - inx * 0.25, yb, bz - inz * 0.25], [ax - inx * 0.25, ya, az - inz * 0.25]], [-inx, 0, -inz]);
        stats.walls++;
      } else if (kind === 'tunnel') {
        const ca = fa + cOf(piece, ax, az), cb = fb + cOf(piece, bx, bz);
        col(C.wallDark).face([[ax, fa, az], [bx, fb, bz], [bx, cb, bz], [ax, ca, az]], [inx, 0, inz]);
        col('#c9c5bb').face([[ax, fa, az], [bx, fb, bz], [bx, fb + 0.6, bz], [ax, fa + 0.6, az]].map(([x, y, z]) => [x + inx * 0.01, y, z + inz * 0.01]), [inx, 0, inz]); // a pale dado
      } else if (kind === 'head') { // the portal: from the ceiling up into the parapet, facing the open cut
        const ca = fa + cOf(piece, ax, az), cb = fb + cOf(piece, bx, bz), sa = surf(ax, az), sb = surf(bx, bz), ox = inx * PAR_T, oz = inz * PAR_T;
        col(C.wall).face([[ax, ca, az], [bx, cb, bz], [bx, sb + PAR, bz], [ax, sa + PAR, az]], [-inx, 0, -inz]);
        col(C.cap).face([[ax, sa + PAR, az], [bx, sb + PAR, bz], [bx + ox, sb + PAR, bz + oz], [ax + ox, sa + PAR, az + oz]], [0, 1, 0]);
        col(C.wall).face([[ax + ox, sa, az + oz], [bx + ox, sb, bz + oz], [bx + ox, sb + PAR, bz + oz], [ax + ox, sa + PAR, az + oz]], [inx, 0, inz]);
        col(C.wallDark).face([[ax, ca, az], [bx, cb, bz], [bx + ox * 2, cb, bz + oz * 2], [ax + ox * 2, ca, az + oz * 2]], [0, -1, 0]); // the lintel's underside
        stats.headwalls++;
      }
    }
    // colliders: one oriented box per stretch of <= 8 m. A retaining wall's stretch covers the segments drawn as a wall
    // (either end deeper than WALL_MIN) and stops at a kerb: one shallow sample used to drop the whole 8 m box, which
    // left the street open over drops of up to 4.5 m (Magheru, Parcul Traian)
    const walled = (x, z) => kind !== 'retain' || surf(x - inx * 0.2, z - inz * 0.2) - fOf(piece, x, z) >= WALL_MIN;
    const total = [];
    let acc = null, len = 0;
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1], b = pts[k];
      if (!walled(...a) && !walled(...b)) { if (acc) total.push(acc); acc = null; continue; }
      if (!acc) { acc = [a]; len = 0; }
      len += Math.hypot(b[0] - a[0], b[1] - a[1]); acc.push(b);
      if (len >= 8) { total.push(acc); acc = null; }
    }
    if (acc) total.push(acc);
    for (const seg of total) {
      const [ax, az] = seg[0], [bx, bz] = seg[seg.length - 1], L = Math.hypot(bx - ax, bz - az);
      if (L < 0.2) continue;
      let lo = Infinity, hi = -Infinity;
      for (const [x, z] of seg) {
        const f = fOf(piece, x, z), s = surf(x - inx * 0.2, z - inz * 0.2);
        if (kind === 'retain') { if (s - f < WALL_MIN) continue; lo = Math.min(lo, f - 0.5); hi = Math.max(hi, s + PAR); }
        else if (kind === 'step') { lo = Math.min(lo, f - 0.5); hi = Math.max(hi, (openAt(x - inx * 0.3, z - inz * 0.3) || f) + PAR); }
        else if (kind === 'tunnel') { lo = Math.min(lo, f - 0.5); hi = Math.max(hi, f + cOf(piece, x, z)); }
        else if (kind === 'head') { lo = Math.min(lo, f + cOf(piece, x, z)); hi = Math.max(hi, surf(x, z) + PAR); }
      }
      if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) continue;
      const t = kind === 'head' ? PAR_T : 0.3, sg = kind === 'head' ? 1 : -1; // the box lies outside the piece (inside, for a headwall's lintel)
      const cx = (ax + bx) / 2 + sg * inx * t / 2, cz = (az + bz) / 2 + sg * inz * t / 2, ang = Math.atan2(bz - az, bx - ax);
      mine.push([cx, cz, L / 2 + 0.05, t / 2, ang, lo, hi]);
      if (S?.obox) { S.obox(cx, cz, L / 2 + 0.05, t / 2, ang, lo, hi, kind === 'head' ? 'bridge' : 'wall'); stats.colliders++; }
    }
  }

  // ---- the seal: an open cut's edge that drops over SEAL_DROP from the street (or from the slab over a tunnel) and that
  // no wall above guards at a car's height gets a parapet wall and its collider. The runs miss corners where the street,
  // a covered piece and the cut meet: a car could drop 4.7 m there (Gojdu, Decebal, Cantemir; tests/oradea-passages)
  const crosses = (ax, az, bx, bz, y) => mine.some(([cx, cz, hx, hz, ang, lo, hi]) => { // segment a-b vs a box, at height y
    if (y < lo || y > hi || Math.abs(ax - cx) + Math.abs(az - cz) > hx + hz + 4) return false;
    const c = Math.cos(ang), s = Math.sin(ang), px = (ax - cx) * c + (az - cz) * s, pz = -(ax - cx) * s + (az - cz) * c;
    const dx = (bx - cx) * c + (bz - cz) * s - px, dz = -(bx - cx) * s + (bz - cz) * c - pz;
    let t0 = 0, t1 = 1;
    for (const [p, q] of [[-dx, px + hx], [dx, hx - px], [-dz, pz + hz], [dz, hz - pz]]) { // Liang–Barsky
      if (p === 0) { if (q < 0) return false; continue; }
      const r = q / p;
      if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
    }
    return true;
  });
  for (const p of open) {
    const n = p.pts.length;
    for (let e = 0; e < n; e++) {
      const [ax, az] = p.pts[e], [bx, bz] = p.pts[(e + 1) % n], L = Math.hypot(bx - ax, bz - az);
      if (L < 0.3) continue;
      const ux = (bx - ax) / L, uz = (bz - az) / L, inx = -uz, inz = ux, m = Math.max(1, Math.round(L / 0.5));
      const need = []; // per sample: null, or { s, f, top, lo }
      for (let j = 0; j <= m; j++) {
        const s = (j / m) * L, x = ax + ux * s, z = az + uz * s, ox = x - inx * 0.3, oz = z - inz * 0.3;
        if (openAt(ox, oz) !== Infinity || openAt(x + inx * 0.3, z + inz * 0.3) === Infinity) { need.push(null); continue; } // between two cuts, or not an edge of the cut
        const f = fOf(p, x, z), top = surf(ox, oz);
        // over a tunnel the wall starts above its ceiling (the slab is ~1 m deep), and a tunnel mouth stays open
        const lo = coveredAt(ox, oz) !== Infinity ? top - 0.5 : f - 0.5;
        if (!(top - f > SEAL_DROP) || lo < f + (coveredAt(ox, oz) !== Infinity ? 3.4 : -1)) { need.push(null); continue; }
        need.push(crosses(x - inx * 1.2, z - inz * 1.2, x + inx * 0.3, z + inz * 0.3, top + 0.5) ? null : { s, f, top, lo });
      }
      for (let j = 0; j <= m; j++) {
        if (!need[j]) continue;
        let k = j; while (k + 1 <= m && need[k + 1] && need[k + 1].s - need[j].s < 8) k++;
        const run = need.slice(j, k + 1), s0 = Math.max(0, run[0].s - 0.25), s1 = Math.min(L, run[run.length - 1].s + 0.25);
        const x0 = ax + ux * s0, z0 = az + uz * s0, x1 = ax + ux * s1, z1 = az + uz * s1;
        const f0 = run[0].f, f1 = run[run.length - 1].f, t0 = run[0].top, t1 = run[run.length - 1].top;
        const b0 = run[0].lo + 0.5, b1 = run[run.length - 1].lo + 0.5, ox = -inx * PAR_T, oz = -inz * PAR_T;
        col(C.wall).face([[x0, b0, z0], [x1, b1, z1], [x1, t1 + PAR, z1], [x0, t0 + PAR, z0]], [inx, 0, inz]);
        col(C.cap).face([[x0, t0 + PAR, z0], [x1, t1 + PAR, z1], [x1 + ox, t1 + PAR, z1 + oz], [x0 + ox, t0 + PAR, z0 + oz]], [0, 1, 0]);
        col(C.wall).face([[x0 + ox, t0 - 0.2, z0 + oz], [x1 + ox, t1 - 0.2, z1 + oz], [x1 + ox, t1 + PAR, z1 + oz], [x0 + ox, t0 + PAR, z0 + oz]], [-inx, 0, -inz]);
        const lo = Math.min(...run.map((q) => q.lo)), hi = Math.max(...run.map((q) => q.top)) + PAR, cx = (x0 + x1) / 2 - inx * 0.15, cz = (z0 + z1) / 2 - inz * 0.15;
        mine.push([cx, cz, (s1 - s0) / 2 + 0.05, 0.15, Math.atan2(uz, ux), lo, hi]);
        if (S?.obox) { S.obox(cx, cz, (s1 - s0) / 2 + 0.05, 0.15, Math.atan2(uz, ux), lo, hi, 'wall'); stats.colliders++; }
        stats.seals++;
        j = k;
      }
    }
  }

  // ---- over the tunnels: the ceiling, lamps and the slab the street rides (the covered pieces less the open cuts)
  const covered = pieces.filter((p) => !p.open);
  const roofs = disjoint(covered).flatMap(({ p, poly }) => {
    let polys = [poly];
    for (const o of open) {
      if (o.box[2] < p.box[0] || o.box[0] > p.box[2] || o.box[3] < p.box[1] || o.box[1] > p.box[3]) continue;
      const next = []; for (const q of polys) next.push(...minus(q, o.pts, lerp).pieces); polys = next;
    }
    return polys.map((q) => ({ p, poly: q }));
  });
  for (const { p, poly } of roofs) {
    col(C.soffit).face(poly.map((v) => [v.x, fOf(p, v.x, v.z) + cOf(p, v.x, v.z), v.z]).reverse(), [0, -1, 0]);
    if (S?.prism) { // the slab: from the ceiling to the street; its top a plane through the street at the corners
      const P = poly.map((v) => [v.x, v.z]), ys = P.map(([x, z]) => surf(x, z));
      const [bxz, a0] = planeFit(P, ys);
      const lo = Math.min(...P.map(([x, z]) => fOf(p, x, z) + cOf(p, x, z)));
      S.prism(P, lo, a0, bxz[0], bxz[1], 'bridge'); stats.slab++; stats.colliders++;
    }
  }
  for (const w of st.ways) if (w.tn) {
    let run = 0;
    for (let k = 1; k < w.P.length; k++) {
      const [ax, az] = w.P[k - 1], [bx, bz] = w.P[k], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
      for (let s = Math.ceil(run / 7) * 7 + 3.5 - run; s < L; s += 7) {
        const x = ax + ux * s, z = az + uz * s, f = floorAt(x, z), p = pieces.find((q) => q.way === w && q.k === k - 1);
        if (!p || !Number.isFinite(f)) continue;
        const y = f + cOf(p, x, z) - 0.02;
        for (const o of [-w.w / 4, w.w / 4]) {
          const cx = x - uz * o, cz = z + ux * o;
          col(C.lamp, DP.LIGHT).face([[cx - ux * 0.9 - uz * 0.12, y, cz - uz * 0.9 + ux * 0.12], [cx + ux * 0.9 - uz * 0.12, y, cz + uz * 0.9 + ux * 0.12], [cx + ux * 0.9 + uz * 0.12, y, cz + uz * 0.9 - ux * 0.12], [cx - ux * 0.9 + uz * 0.12, y, cz - uz * 0.9 - ux * 0.12]], [0, -1, 0]);
          stats.lamps++;
        }
      }
      run += L;
    }
  }

  // ---- meshes
  const mat = detailMat ?? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
  if (det.v) group.add(Object.assign(new THREE.Mesh(det.build({ part: true }), mat), { name: `passage-${st.G.id}-walls`, castShadow: true, receiveShadow: true }));
  const vDet = det.v; det.free();
  const floorMesh = top.mesh(gmat, `passage-${st.G.id}-floor`);
  if (floorMesh) (ground?.root ?? group).add(floorMesh); // with the ground: never culled away as a small far site mesh
  const pmat = markings?.material ?? new THREE.MeshStandardMaterial({ color: 0xc7c7bd, roughness: 0.7 });
  if (paint.v) (ground?.root ?? group).add(Object.assign(new THREE.Mesh(paint.build({ uv: false }), pmat), { name: `passage-${st.G.id}-paint`, receiveShadow: true, matrixAutoUpdate: false }));
  const vPaint = paint.v; paint.free();

  // ---- the car's ground: the floor under the tunnels too (hf.heightAt keeps the street there for everything else)
  if (S?.setTerrain && S.terrain?.height) {
    const T0 = S.terrain, h0 = T0.height;
    S.setTerrain({ ...T0, height: (x, z) => { if (x < box[0] || x > box[2] || z < box[1] || z > box[3]) return h0(x, z); const f = floorAt(x, z); return f < Infinity ? f : h0(x, z); } });
  }
  Object.assign(stats, { verts: vDet + top.v + vPaint, ms: Math.round(performance.now() - t0) });
  const clear = (x, z) => {
    if (x < box[0] - 4 || x > box[2] + 4 || z < box[1] - 4 || z > box[3] + 4) return false;
    for (const dx of [0, 3, -3]) for (const dz of [0, 3, -3]) if (floorAt(x + dx, z + dz) < Infinity) return true;
    return false;
  };
  return { group, clear, stats };
}

// least-squares plane y = a + bx x + bz z through points P [[x, z]..] with heights ys -> [[bx, bz], a]
function planeFit(P, ys) {
  const n = P.length, mx = P.reduce((s, p) => s + p[0], 0) / n, mz = P.reduce((s, p) => s + p[1], 0) / n, my = ys.reduce((s, v) => s + v, 0) / n;
  let sxx = 0, sxz = 0, szz = 0, sxy = 0, szy = 0;
  P.forEach(([x, z], i) => { const dx = x - mx, dz = z - mz, dy = ys[i] - my; sxx += dx * dx; sxz += dx * dz; szz += dz * dz; sxy += dx * dy; szy += dz * dy; });
  const det = sxx * szz - sxz * sxz;
  if (Math.abs(det) < 1e-9) return [[0, 0], my];
  const bx = (sxy * szz - szy * sxz) / det, bz = (szy * sxx - sxy * sxz) / det;
  return [[bx, bz], my - bx * mx - bz * mz];
}
