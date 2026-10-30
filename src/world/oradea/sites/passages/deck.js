// OWNER: oradea. The road overpasses' engine (not a site module: ../passages-*.js use it). An overpass is one carriageway
// of OSM road ways from map.json `levels` (tools/cherkasy/build_map.mjs): its bridge ways (`br`) and the embankments
// beside them, in order. OSM marks the span; the deck climbs to it on ramps that run on along the carriageway's own road
// ways in map.roads, never past a junction.
//
// The profile: over every road, railway or tram line crossing under the bridge ways the deck's beams clear it by CLR, and
// from there the deck falls GRADE per metre (steeper, up to GRADE_MAX, where a junction is near) to the street, with
// eased vertical curves. Where it stands less than SOLID over the ground it is a closed ramp between retaining walls,
// elsewhere an open slab-on-girder deck on pier rows that keep off whatever runs beneath. The terrain is not changed: the
// deck is a mesh over it, and the ground strip OSM draws for the carriageway turns to lawn under the open deck (the roads
// crossing under keep theirs), its lane paint dropped along the whole deck.
//
//   planDeck(map, heightAt, O) -> plan | null   O = { id, name, ways: [OSM ids, in order along the carriageway] }. Null
//     when a way is missing from map.json, nothing crosses under the bridge ways (a stream: not an overpass), or a junction
//     right at a bridge end leaves no room for a ramp (an interchange whose links would have to climb too).
//     plan = { O, L: [[x, z]..] (the carriageway with its ramp ways), cum, y(s), foot: [sA, sB], open(s), under,
//       crossings: [{ s, kind, clr }], stats }
//   buildDecks(base, plans, name) -> { group, deckAt(x, z), clear(x, z), stats } | null   once the ground exists: one
//     structure mesh (detail material), one carriageway mesh (ground material), one paint mesh for all the plans;
//     colliders (closed ramps solid, open decks OVERHANG, parapets, piers); the lawn and paint fix-ups on the ground.
//     deckAt(x, z) -> deck top y | null, for the lane network (npc/lanes.js opts.deckAt: the lanes of a chain with a
//     bridge way ride it).
import * as THREE from 'three';
import { MB } from '../../../../kit/mesh.js';
import { DP } from '../../../materials.js';
import { OVERHANG } from '../../../collision.js';
import { SURF } from '../../../cherkasy/ground.js';
import { resurface, dropPaint, groundMat } from '../../../cherkasy/bridgekit.js';

const GRADE = 0.045, GRADE_MAX = 0.07;   // the ramps' fall, and the steepest a near junction may force
const CLR = { road: 5.2, rail: 6.6, tram: 5.8 }; // under the beams
const DEPTH = 1.35;     // deck top to the girders' underside
const SLAB = 0.32;      // the slab under the carriageway's top
const SOLID = 2.6;      // a deck lower than this over the ground is a closed ramp
const STEP = 6;         // deck pieces (m)
const KERB = 0.75, PAR = 0.95, PAR_T = 0.35, LIFT = 0.03; // the strip beside the carriageway, the parapet, the deck over the ground at the feet
const SPAN = 30;        // pier rows on an open deck
const EXT = 280;        // how far the ramps may run on along the road ways
const LOW_MAX = 1.0;    // a crest that would have to come down more than this for the ramps to fit is not built
const SMOOTH = 18;     // the crest's flat run past the outer crossings: the reach of the profile's easing (2 x 9 m)
const C = { conc: '#a9a69e', dark: '#8a8780', wall: '#9f9c94', cap: '#c3bfb5', rail: '#5b6166', galv: '#b8bcbe', lamp: '#fff2d8' };

const pairs = (p) => { const o = []; for (let i = 0; i + 1 < p.length; i += 2) o.push([p[i], p[i + 1]]); return o; };
const fin = (h, d = 2) => (Number.isFinite(h) ? h : d);
const near2 = (a, b, tol) => Math.hypot(a[0] - b[0], a[1] - b[1]) < tol;
function nearest(P, x, z) {
  let best = { d: Infinity, s: 0, side: 1, i: 0, f: 0 }, run = 0;
  for (let k = 1; k < P.length; k++) {
    const [ax, az] = P[k - 1], ex = P[k][0] - ax, ez = P[k][1] - az, L = Math.hypot(ex, ez) || 1e-9;
    const f = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / (L * L))), d = Math.hypot(x - ax - ex * f, z - az - ez * f);
    if (d < best.d) best = { d, s: run + f * L, side: ex * (z - az) - ez * (x - ax) >= 0 ? 1 : -1, i: k - 1, f };
    run += L;
  }
  return best;
}
// where segment p-q crosses polyline P: [{ s (arc on P), sin (of the angle) }]
function crossings(P, cum, p, q) {
  const out = [];
  for (let k = 1; k < P.length; k++) {
    const a = P[k - 1], b = P[k], ex = b[0] - a[0], ez = b[1] - a[1], fx = q[0] - p[0], fz = q[1] - p[1];
    const den = ex * fz - ez * fx;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((p[0] - a[0]) * fz - (p[1] - a[1]) * fx) / den, u = ((p[0] - a[0]) * ez - (p[1] - a[1]) * ex) / den;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) out.push({ s: cum[k - 1] + t * Math.hypot(ex, ez), sin: Math.abs(den) / (Math.hypot(ex, ez) * Math.hypot(fx, fz) || 1) });
  }
  return out;
}
const cumulate = (L) => { const c = [0]; for (let k = 1; k < L.length; k++) c.push(c[k - 1] + Math.hypot(L[k][0] - L[k - 1][0], L[k][1] - L[k - 1][1])); return c; };
function pointAt(L, cum, s) {
  let k = 1;
  while (k < L.length - 1 && cum[k] < s) k++;
  const l = cum[k] - cum[k - 1] || 1, f = (s - cum[k - 1]) / l;
  return [L[k - 1][0] + (L[k][0] - L[k - 1][0]) * f, L[k - 1][1] + (L[k][1] - L[k - 1][1]) * f, (L[k][0] - L[k - 1][0]) / l, (L[k][1] - L[k - 1][1]) / l, k];
}

// ------------------------------------------------------------------------------------------------ plan
export function planDeck(map, heightAt, O) {
  if (!map?.levels || !map.roads) return null;
  const byId = new Map(map.levels.map((w) => [w.id, w]));
  const src = O.ways.map((id) => byId.get(id));
  if (src.some((w) => !w) || !src.some((w) => w.br)) return null;
  // the chain: each way turned to continue the previous one
  let L = [], segW = [], brS = [];
  for (const w of src) {
    let P = pairs(w.p);
    if (L.length) {
      const e = L[L.length - 1];
      if (near2(P[P.length - 1], e, 1.5) && !near2(P[0], e, 1.5)) P = P.reverse();
      else if (!near2(P[0], e, 1.5) && L.length === pairs(src[0].p).length && (near2(P[0], L[0], 1.5) || near2(P[P.length - 1], L[0], 1.5))) { // the first way was the wrong way round
        L = L.reverse(); segW = segW.reverse();
        if (near2(P[P.length - 1], L[L.length - 1], 1.5)) P = P.reverse();
      }
      if (!near2(P[0], L[L.length - 1], 2.5)) return null; // not one carriageway
      P = P.slice(1);
    }
    const s0 = cumulate(L).at(-1) ?? 0;
    for (const p of P) { if (L.length) segW.push(w.w ?? 8); L.push(p); }
    if (w.br) brS.push([s0, cumulate(L).at(-1)]);
  }
  const own = (P) => P.every(([x, z]) => nearest(L, x, z).d < 0.8);
  // only what lies near: the carriageway's box grown by the ramps' reach
  let bx0 = Infinity, bz0 = Infinity, bx1 = -Infinity, bz1 = -Infinity;
  for (const [x, z] of L) { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); bz0 = Math.min(bz0, z); bz1 = Math.max(bz1, z); }
  const PAD = EXT + 40, nearBox = (p) => { for (let i = 0; i + 1 < p.length; i += 2) if (p[i] > bx0 - PAD && p[i] < bx1 + PAD && p[i + 1] > bz0 - PAD && p[i + 1] < bz1 + PAD) return true; return false; };
  const motor = map.roads.filter((r) => r.k === 'm' && r.p?.length >= 4 && nearBox(r.p));
  const nodeRoads = (pt, skip) => motor.filter((r) => r !== skip && pairs(r.p).some((q) => near2(q, pt, 0.8)));
  const minor = (r) => r.c === 'service' || r.c === 'track'; // a driveway at a ramp's foot is no junction
  // ramps: run on along the road ways from each end, up to EXT m or the first junction
  const used = new Set(); // the road ways the ramps run on
  const extend = (end, prev) => {
    const out = [], ws = [];
    let junction = true;
    let E = end, dir = [end[0] - prev[0], end[1] - prev[1]], len = 0, lastRoad = null, guard = 0;
    { const l = Math.hypot(dir[0], dir[1]) || 1; dir = [dir[0] / l, dir[1] / l]; }
    let limit = Infinity;
    while (len < EXT && guard++ < 20) {
      const cands = [];
      for (const r of nodeRoads(E, lastRoad)) {
        const P = pairs(r.p);
        if (own(P)) continue;
        const i = P.findIndex((q) => near2(q, E, 0.8));
        for (const sg of [1, -1]) { // the road leaving E either way along it
          const j = i + sg;
          if (j < 0 || j >= P.length) continue;
          const d = [P[j][0] - E[0], P[j][1] - E[1]], l = Math.hypot(d[0], d[1]) || 1, c = (d[0] * dir[0] + d[1] * dir[1]) / l;
          cands.push({ r, P, i, sg, c });
        }
      }
      const fwd = cands.filter((q) => q.c > 0.85 && !minor(q.r)), others = cands.filter((q) => q.c <= 0.85 && q.c > -0.95 && !minor(q.r));
      if (fwd.length !== 1 || others.length) { limit = len; break; } // a junction (or the road ends): the ramp stops short of it
      const { r, P, i, sg } = fwd[0];
      used.add(r);
      const run = sg > 0 ? P.slice(i + 1) : P.slice(0, i).reverse();
      let stop = false;
      for (const [qi, q] of run.entries()) {
        const l = Math.hypot(q[0] - E[0], q[1] - E[1]);
        // a side road joining in the middle of this way is a junction too (its last point: the next round looks)
        if (qi < run.length - 1 && nodeRoads(q, r).some((o) => !minor(o) && !own(pairs(o.p)))) { out.push(q); ws.push(r.w ?? 8); len += l; limit = len; stop = true; break; }
        out.push(q); ws.push(r.w ?? 8); len += l;
        dir = [(q[0] - E[0]) / (l || 1), (q[1] - E[1]) / (l || 1)];
        E = q;
        if (len >= EXT) break;
      }
      if (stop) break;
      lastRoad = r;
    }
    if (limit === Infinity) junction = false; // EXT reached on a plain road
    return { pts: out, ws, limit: Math.min(limit, len), junction };
  };
  const eB = extend(L[L.length - 1], L[L.length - 2]), eA = extend(L[0], L[1]);
  const full = [...eA.pts.slice().reverse(), ...L, ...eB.pts], fullW = [...eA.ws.slice().reverse(), ...segW, ...eB.ws];
  const cum = cumulate(full), sOff = cum[eA.pts.length], total = cum.at(-1);
  const br = brS.map(([a, b]) => [a + sOff, b + sOff]);
  const sBr0 = Math.min(...br.map((b) => b[0])), sBr1 = Math.max(...br.map((b) => b[1]));
  const limA = sOff - eA.limit + (eA.junction ? 8 : 0), limB = cum[eA.pts.length + L.length - 1] + eB.limit - (eB.junction ? 8 : 0);
  const g = (s) => { const [x, z] = pointAt(full, cum, s); return fin(heightAt(x, z)); };

  // what runs beneath: roads (not this carriageway, not its ramp ways, not other bridges), rails, trams, tunnels
  const under = [];
  const addU = (P, hw, kind) => under.push({ P, hw, kind });
  const ownFull = (P) => P.every(([x, z]) => nearest(full, x, z).d < 0.8);
  // (under the deck itself only: its box, a little grown)
  let ux0 = Infinity, uz0 = Infinity, ux1 = -Infinity, uz1 = -Infinity;
  for (const [x, z] of full) { ux0 = Math.min(ux0, x); ux1 = Math.max(ux1, x); uz0 = Math.min(uz0, z); uz1 = Math.max(uz1, z); }
  const nearDeck = (p) => { for (let i = 0; i + 1 < p.length; i += 2) if (p[i] > ux0 - 20 && p[i] < ux1 + 20 && p[i + 1] > uz0 - 20 && p[i + 1] < uz1 + 20) return true; return false; };
  for (const r of motor) { if (r.br || used.has(r) || !nearDeck(r.p)) continue; const P = pairs(r.p); if (!ownFull(P)) addU(P, (r.w ?? 6) / 2, 'road'); }
  for (const r of map.rails ?? []) if (nearDeck(r.p)) addU(pairs(r.p), 2.4, 'rail');
  for (const r of map.trams ?? []) if (nearDeck(r.p)) addU(pairs(r.p), 1.6, 'tram');
  for (const w of map.levels) if (w.tn && w.k === 'm' && nearDeck(w.p)) addU(pairs(w.p), (w.w ?? 7) / 2, 'road');
  const xs = [];
  for (const u of under) {
    if (u.kind === 'walk') continue;
    for (let k = 1; k < u.P.length; k++) for (const c of crossings(full, cum, u.P[k - 1], u.P[k])) {
      if (c.s < sBr0 - 6 || c.s > sBr1 + 6) continue;
      xs.push({ s: c.s, kind: u.kind, clr: CLR[u.kind], half: u.hw / Math.max(0.35, c.sin) + 2, g: g(c.s) });
    }
  }
  if (!xs.length) return null;
  xs.sort((a, b) => a.s - b.s);
  // the crest: one level over every crossing, held SMOOTH m past the first and the last, so easing the profile below
  // never eats into a clearance
  const req = xs.map((c) => c.g + c.clr + DEPTH), top = Math.max(...req);
  const a0 = xs[0].s - xs[0].half - SMOOTH, b0 = xs[xs.length - 1].s + xs[xs.length - 1].half + SMOOTH;
  const yA = top, yB = top;
  // each side's grade: GRADE, steeper where the junction is near, the crest lowered if even GRADE_MAX is short
  const side = (y0, from, lim, dirn) => {
    const room = Math.max(1, (from - lim) * dirn), gEnd = g(lim);
    let G = Math.max(GRADE, (y0 - gEnd) / room), low = 0;
    if (G > GRADE_MAX) { low = y0 - (gEnd + GRADE_MAX * room); G = GRADE_MAX; }
    return { G, low };
  };
  const low = Math.max(side(yA, a0, Math.max(0, limA), 1).low, side(yB, b0, Math.min(total, limB), -1).low);
  if (low > LOW_MAX) { console.warn(`[oradea] passages: ${O.id} – no room for its ramps before the junctions (${Math.round(eA.limit)} / ${Math.round(eB.limit)} m): left on the ground`); return null; }
  const SA = side(yA - low, a0, Math.max(0, limA), 1), SB = side(yB - low, b0, Math.min(total, limB), -1);
  const raw = (s) => {
    let y;
    if (s < a0) y = yA - low - SA.G * (a0 - s);
    else if (s > b0) y = yB - low - SB.G * (s - b0);
    else y = top - low;
    return Math.max(g(s), y);
  };
  // eased: the height over the ground smoothed (two box passes, 2 x 9 m), so the crest and the feet have vertical curves
  const N = Math.ceil(total), dS = total / N, u0 = new Float64Array(N + 1);
  for (let i = 0; i <= N; i++) u0[i] = raw(i * dS) - g(i * dS);
  const box = (a, r) => { const o = new Float64Array(a.length); for (let i = 0; i < a.length; i++) { let s = 0, n = 0; for (let j = Math.max(0, i - r); j <= Math.min(a.length - 1, i + r); j++) { s += a[j]; n++; } o[i] = s / n; } return o; };
  const R = Math.round(9 / dS), u1 = box(box(u0, R), R);
  let iA = 0, iB = N;
  while (iA < N && u1[iA] < 0.05) iA++;
  while (iB > 0 && u1[iB] < 0.05) iB--;
  const foot = [Math.max(0, (iA - 1) * dS), Math.min(total, (iB + 1) * dS)];
  const uAt = (s) => { const t = Math.max(0, Math.min(N, s / dS)), i = Math.min(N - 1, Math.floor(t)), f = t - i; return u1[i] + (u1[i + 1] - u1[i]) * f; };
  const y = (s) => g(s) + uAt(s) + LIFT;
  const wAt = (s) => { const [, , , , k] = pointAt(full, cum, s); return fullW[Math.min(fullW.length - 1, k - 1)] ?? 8; };
  const open = (s) => uAt(s) >= SOLID || xs.some((c) => Math.abs(s - c.s) <= c.half);
  const minClr = Math.min(...xs.map((c) => y(c.s) - DEPTH - c.g - c.clr));
  const brWay = src.find((w) => w.br), ow = !!brWay.ow, lanes = brWay.ln || (ow ? Math.max(1, Math.round((brWay.w ?? 7) / 3.5)) : 2);
  return { O, L: full, cum, y, g, uAt, wAt, foot, open, under, crossings: xs, ow, lanes,
    stats: { length: Math.round(foot[1] - foot[0]), bridge: Math.round(sBr1 - sBr0), crest: +Math.max(...xs.map((c) => uAt(c.s))).toFixed(1),
      grades: [+SA.G.toFixed(3), +SB.G.toFixed(3)], room: [Math.round(eA.limit), Math.round(eB.limit)], lowered: +low.toFixed(2), clrSpare: +minClr.toFixed(2), crossings: xs.map((c) => c.kind) } };
}

// ------------------------------------------------------------------------------------------------ build
export function buildDecks(base, plans, name) {
  plans = plans.filter(Boolean);
  if (!plans.length) return null;
  const { root, solids: S, ground, detailMat } = base;
  const t0 = performance.now();
  const group = Object.assign(new THREE.Group(), { name: `passage-${name}` });
  root.add(group);
  const det = new MB(), paint = new MB(), col = (c, part = DP.CONC) => det.setColor(c).setPart(part);
  const top = { p: [], n: [], s: [], i: [] };
  const quad = (pts, surf) => { // ground-material quad, facing up (or along its own normal for a vertical face)
    const b = top.p.length / 3, [p0, p1, p2] = pts, e1 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], e2 = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
    let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const l = Math.hypot(...n) || 1; n = n.map((v) => v / l);
    const flip = n[1] < -0.3;
    for (const q of pts) { top.p.push(...q); top.n.push(...(flip ? n.map((v) => -v) : n)); top.s.push(surf); }
    top.i.push(...(flip ? [b, b + 2, b + 1, b, b + 3, b + 2] : [b, b + 1, b + 2, b, b + 2, b + 3]));
  };
  const stats = { decks: plans.length, pieces: 0, open: 0, closed: 0, piers: 0, lamps: 0, colliders: 0, lawned: 0, unpainted: 0 };
  const index = []; // [{ plan, box }] for deckAt / clear

  for (const pl of plans) {
    const { L, cum, y, g, uAt, wAt, foot, open, under } = pl;
    const blocked = (x, z, pad) => under.some((u) => { if (u.kind === 'walk') return false; const q = nearest(u.P, x, z); return q.d < u.hw + pad; });
    const frame = (s) => { const [x, z, dx, dz] = pointAt(L, cum, s); return { x, z, nx: -dz, nz: dx, dx, dz }; };
    // knots: every <= STEP m, plus the open / closed changes, so a piece is one kind
    const knots = [foot[0]];
    for (let s = foot[0] + 0.5; s < foot[1]; s += 0.5) if (open(s) !== open(s - 0.5)) knots.push(s);
    knots.push(foot[1]);
    const ks = [];
    for (let k = 1; k < knots.length; k++) { const a = knots[k - 1], b = knots[k], n = Math.max(1, Math.ceil((b - a) / STEP)); for (let j = 0; j < n; j++) ks.push(a + (b - a) * j / n); }
    ks.push(foot[1]);
    // miter frames at the knots: the mean of the tangents just before and after
    const F = ks.map((s) => { const a = frame(Math.max(0, s - 0.5)), b = frame(Math.min(cum.at(-1), s + 0.5)), m = frame(s); let nx = a.nx + b.nx, nz = a.nz + b.nz; const l = Math.hypot(nx, nz) || 1; return { ...m, nx: nx / l, nz: nz / l, s }; });
    const P3 = (k, o, dy = 0) => [F[k].x + F[k].nx * o, y(F[k].s) + dy, F[k].z + F[k].nz * o];
    const P2 = (k, o) => [F[k].x + F[k].nx * o, F[k].z + F[k].nz * o];
    let bb = [Infinity, Infinity, -Infinity, -Infinity];
    // a twin carriageway alongside (a dual road's other deck): the facing sides meet at the middle between the two, a
    // median barrier there instead of two parapets (the deck that comes first in `plans` builds it)
    const twin = F.map((f) => {
      const out = { 1: null, '-1': null };
      for (const [j, o] of plans.entries()) {
        if (o === pl) continue;
        const q = nearest(o.L, f.x, f.z);
        if (q.s < o.foot[0] || q.s > o.foot[1]) continue;
        const reach = wAt(f.s) / 2 + o.wAt(q.s) / 2 + 2 * (KERB + PAR_T) + 0.6;
        if (q.d > reach) continue;
        const [ox, oz, odx, odz] = pointAt(o.L, o.cum, q.s);
        if (Math.abs(odx * f.dx + odz * f.dz) < 0.8) continue;
        const sg = (ox - f.x) * f.nx + (oz - f.z) * f.nz >= 0 ? 1 : -1;
        if (!out[sg] || q.d < out[sg].d) out[sg] = { d: q.d, mid: q.d / 2, first: plans.indexOf(pl) < j, oy: o.y(q.s) };
      }
      return out;
    });
    for (let k = 0; k + 1 < ks.length; k++) {
      const sa = ks[k], sb = ks[k + 1], sm = (sa + sb) / 2, isOpen = open(sm), hw = wAt(sm) / 2, edge = hw + KERB + PAR_T, inner = hw + KERB;
      stats.pieces++; if (isOpen) stats.open++; else stats.closed++;
      const tw = (kk, sg) => twin[kk][sg];
      const isTwin = (sg) => !!(tw(k, sg) && tw(k + 1, sg));
      const ext = (kk, sg) => (isTwin(sg) ? tw(kk, sg).mid : edge); // the deck's reach to that side at knot kk
      const cw2 = (kk, sg) => Math.min(hw, ext(kk, sg)); // the carriageway's
      for (const sg of [-1, 1]) for (const kk of [k, k + 1]) { const [x, z] = P2(kk, sg * ext(kk, sg)); bb = [Math.min(bb[0], x), Math.min(bb[1], z), Math.max(bb[2], x), Math.max(bb[3], z)]; }
      // carriageway and the kerb strips (ground material: joins the streets at the feet)
      quad([P3(k, -cw2(k, -1)), P3(k + 1, -cw2(k + 1, -1)), P3(k + 1, cw2(k + 1, 1)), P3(k, cw2(k, 1))], SURF.ASPHALT);
      for (const sg of [-1, 1]) {
        if (isTwin(sg)) { // a flat strip on to the middle
          if (ext(k, sg) > hw + 0.02 || ext(k + 1, sg) > hw + 0.02) quad([P3(k, sg * hw), P3(k + 1, sg * hw), P3(k + 1, sg * Math.max(hw, ext(k + 1, sg))), P3(k, sg * Math.max(hw, ext(k, sg)))], SURF.CONCRETE);
          continue;
        }
        const [oa, ob] = sg > 0 ? [hw, inner] : [-inner, -hw];
        quad([P3(k, oa, 0.15), P3(k + 1, oa, 0.15), P3(k + 1, ob, 0.15), P3(k, ob, 0.15)], SURF.CONCRETE);
        quad([P3(k, sg * hw), P3(k + 1, sg * hw), P3(k + 1, sg * hw, 0.15), P3(k, sg * hw, 0.15)], SURF.CURB);
      }
      // parapets (and below them the retaining wall of a closed ramp, or the fascia of an open deck); a median barrier
      // on a twin side
      for (const sg of [-1, 1]) {
        const ya = y(sa), yb = y(sb);
        if (isTwin(sg)) {
          if (!tw(k, sg).first) continue;
          const m0 = tw(k, sg).mid, m1 = tw(k + 1, sg).mid, lo0 = Math.min(ya, tw(k, sg).oy) - (isOpen ? DEPTH : 0.4), lo1 = Math.min(yb, tw(k + 1, sg).oy) - (isOpen ? DEPTH : 0.4);
          const hi0 = Math.max(ya, tw(k, sg).oy) + 0.85, hi1 = Math.max(yb, tw(k + 1, sg).oy) + 0.85;
          const at = (kk, o, yy) => { const [x, z] = P2(kk, sg * o); return [x, yy, z]; };
          col(C.wall);
          for (const d of [-0.22, 0.22]) det.face([at(k, m0 + d, lo0), at(k + 1, m1 + d, lo1), at(k + 1, m1 + d, hi1), at(k, m0 + d, hi0)], [F[k].nx * sg * Math.sign(d), 0, F[k].nz * sg * Math.sign(d)]);
          col(C.cap);
          det.face([at(k, m0 - 0.22, hi0), at(k + 1, m1 - 0.22, hi1), at(k + 1, m1 + 0.22, hi1), at(k, m0 + 0.22, hi0)], [0, 1, 0]);
          const [ax, az] = P2(k, sg * m0), [bx, bz] = P2(k + 1, sg * m1), ln = Math.hypot(bx - ax, bz - az);
          if (S?.obox && ln > 0.05) { S.obox((ax + bx) / 2, (az + bz) / 2, ln / 2 + 0.03, 0.22, Math.atan2(bz - az, bx - ax), Math.min(lo0, lo1), Math.max(hi0, hi1), 'rail'); stats.colliders++; }
          continue;
        }
        const io = sg * inner, eo = sg * edge;
        const gOut = (kk) => { const [x, z] = P2(kk, eo); return fin(base.heightAt(x, z)) - 0.5; };
        const low = (kk) => (isOpen ? y(F[kk].s) - DEPTH : Math.min(gOut(kk), y(F[kk].s) - 0.3));
        col(C.wall);
        det.face([P3(k, io, 0.15), P3(k + 1, io, 0.15), P3(k + 1, io, PAR), P3(k, io, PAR)], [-F[k].nx * sg, 0, -F[k].nz * sg]); // the parapet's inner face
        col(C.cap);
        det.face([P3(k, io, PAR), P3(k + 1, io, PAR), P3(k + 1, eo, PAR), P3(k, eo, PAR)], [0, 1, 0]);
        col(isOpen ? C.conc : C.wall);
        const outer = (kk, yy) => { const [x, z] = P2(kk, eo); return [x, yy, z]; };
        det.face([outer(k, low(k)), outer(k + 1, low(k + 1)), outer(k + 1, yb + PAR), outer(k, ya + PAR)], [F[k].nx * sg, 0, F[k].nz * sg]);
        if (isOpen) { // the fascia's underside
          col(C.dark);
          det.face([outer(k, low(k)), outer(k + 1, low(k + 1)), [P2(k + 1, io)[0], low(k + 1), P2(k + 1, io)[1]], [P2(k, io)[0], low(k), P2(k, io)[1]]], [0, -1, 0]);
        }
        // collider: the parapet (and wall) as an oriented box along the piece
        const [ax, az] = P2(k, sg * (edge - PAR_T / 2)), [bx, bz] = P2(k + 1, sg * (edge - PAR_T / 2)), ln = Math.hypot(bx - ax, bz - az);
        if (S?.obox && ln > 0.05) { S.obox((ax + bx) / 2, (az + bz) / 2, ln / 2 + 0.03, PAR_T / 2, Math.atan2(bz - az, bx - ax), Math.min(low(k), low(k + 1)), Math.max(ya, yb) + PAR, 'rail'); stats.colliders++; }
      }
      if (isOpen) { // slab soffit and girders
        col(C.conc);
        const so = (kk, sg) => (isTwin(sg) ? ext(kk, sg) : inner);
        det.face([P3(k, -so(k, -1), -SLAB), P3(k, so(k, 1), -SLAB), P3(k + 1, so(k + 1, 1), -SLAB), P3(k + 1, -so(k + 1, -1), -SLAB)], [0, -1, 0]);
        col(C.dark);
        const gN = hw > 6 ? 4 : 3;
        for (let q = 0; q < gN; q++) {
          const o = -hw * 0.8 + (1.6 * hw) * q / (gN - 1), w2 = 0.32;
          for (const sgn of [-1, 1]) det.face([P3(k, o + sgn * w2, -DEPTH + 0.05), P3(k + 1, o + sgn * w2, -DEPTH + 0.05), P3(k + 1, o + sgn * w2, -SLAB), P3(k, o + sgn * w2, -SLAB)], [F[k].nx * sgn, 0, F[k].nz * sgn]);
          det.face([P3(k, o - w2, -DEPTH + 0.05), P3(k, o + w2, -DEPTH + 0.05), P3(k + 1, o + w2, -DEPTH + 0.05), P3(k + 1, o - w2, -DEPTH + 0.05)], [0, -1, 0]);
        }
      }
      // the deck's collider: a closed ramp solid to the ground, an open deck an OVERHANG slab
      if (S?.prism) {
        const pts = [P2(k, -ext(k, -1)), P2(k + 1, -ext(k + 1, -1)), P2(k + 1, ext(k + 1, 1)), P2(k, ext(k, 1))], ys = [y(sa), y(sb), y(sb), y(sa)];
        const [[bx, bz], a] = planeFit(pts, ys);
        if (isOpen) S.prism(pts, Math.min(y(sa), y(sb)) - DEPTH, a, bx, bz, 'bridge', OVERHANG);
        else S.prism(pts, Math.min(g(sa), g(sb)) - 1.5, a, bx, bz, 'bridge');
        stats.colliders++;
      }
      // lane paint: edge lines, the centre line of a two-way road, dashed lane lines
      const strip = (o, w2, s0 = sa, s1 = sb) => {
        const at = (s, oo) => { const t = (s - sa) / Math.max(1e-6, sb - sa), x = F[k].x + (F[k + 1].x - F[k].x) * t, z = F[k].z + (F[k + 1].z - F[k].z) * t, nx = F[k].nx + (F[k + 1].nx - F[k].nx) * t, nz = F[k].nz + (F[k + 1].nz - F[k].nz) * t; return [x + nx * oo, y(s) + 0.012, z + nz * oo]; };
        paint.face([at(s0, o - w2), at(s1, o - w2), at(s1, o + w2), at(s0, o + w2)], [0, 1, 0]);
      };
      strip(-Math.min(cw2(k, -1), cw2(k + 1, -1)) + 0.3, 0.07); strip(Math.min(cw2(k, 1), cw2(k + 1, 1)) - 0.3, 0.07);
      const ow = pl.ow, lanes = pl.lanes;
      if (!ow) strip(0, 0.08);
      const per = ow ? lanes : Math.max(1, lanes / 2), lw = (ow ? 2 * hw : hw) / per;
      for (const sg of ow ? [1] : [1, -1]) for (let q = 1; q < per; q++) {
        const o = ow ? -hw + q * lw : sg * q * lw;
        for (let s = Math.ceil(sa / 9) * 9; s < sb; s += 9) strip(o, 0.06, Math.max(sa, s), Math.min(sb, s + 3));
      }
    }
    // abutments where an open stretch meets a closed one, and the end walls under an open deck's ends
    for (let k = 1; k + 1 < ks.length; k++) {
      const s = ks[k], a = open(s - 0.25), b = open(s + 0.25);
      if (a === b) continue;
      const hw = wAt(s) / 2, edge = hw + KERB + PAR_T, f = F[k];
      col(C.conc);
      const yy = y(s) - SLAB, gg = fin(g(s)) - 0.5, sg = b ? 1 : -1; // facing the open side
      const A = [f.x - f.nx * edge, f.z - f.nz * edge], B = [f.x + f.nx * edge, f.z + f.nz * edge];
      const q = [[A[0], gg, A[1]], [B[0], gg, B[1]], [B[0], yy, B[1]], [A[0], yy, A[1]]];
      det.face(sg > 0 ? q : [q[1], q[0], q[3], q[2]], [f.dx * sg, 0, f.dz * sg]);
    }
    // pier rows on the open stretches: a cap beam on round columns, a column standing on a road or a track left out
    const opens = [];
    for (let k = 0; k + 1 < ks.length; k++) { const isO = open((ks[k] + ks[k + 1]) / 2); if (isO) { if (opens.length && Math.abs(opens.at(-1)[1] - ks[k]) < 1e-6) opens.at(-1)[1] = ks[k + 1]; else opens.push([ks[k], ks[k + 1]]); } }
    for (const [o0, o1] of opens) {
      if (o1 - o0 < 14) continue;
      const n = Math.max(1, Math.round((o1 - o0) / SPAN)), at = n > 1 ? Array.from({ length: n - 1 }, (_, r) => (r + 1) / n) : o1 - o0 > 24 ? [0.5] : [];
      for (const fr of at) {
        let placed = false;
        for (const dt of [0, 2, -2, 4, -4, 6, -6, 8, -8, 10]) {
          const s = o0 + (o1 - o0) * fr + dt;
          if (s < o0 + 6 || s > o1 - 6) continue;
          const f = frame(s), hw = wAt(s) / 2, yy = y(s) - DEPTH;
          const offs = hw > 6 ? [-hw * 0.65, 0, hw * 0.65] : [-hw * 0.5, hw * 0.5];
          const cols = offs.filter((o) => !blocked(f.x + f.nx * o, f.z + f.nz * o, 1.3));
          if (cols.length < 2) continue;
          col(C.conc);
          const half = 0.55, ox = f.dx * half, oz = f.dz * half, ex = hw + KERB - 0.3;
          // cap beam as four faces
          const c4 = (o, yv) => [[f.x + f.nx * o - ox, yv, f.z + f.nz * o - oz], [f.x + f.nx * o + ox, yv, f.z + f.nz * o + oz]];
          const [l0, l1] = c4(-ex, yy - 0.9), [r0, r1] = c4(ex, yy - 0.9), [L0, L1] = c4(-ex, yy), [R0, R1] = c4(ex, yy);
          det.face([l0, r0, R0, L0], [-f.dx, 0, -f.dz]); det.face([r1, l1, L1, R1], [f.dx, 0, f.dz]);
          det.face([l1, r1, r0, l0], [0, -1, 0]);
          if (S?.obox) { S.obox(f.x, f.z, half, ex, Math.atan2(f.dz, f.dx), yy - 0.9, yy, 'pier'); stats.colliders++; }
          for (const o of cols) {
            const x = f.x + f.nx * o, z = f.z + f.nz * o, gy = fin(base.heightAt(x, z)) - 0.3, h = yy - 0.9 - gy;
            if (h < 0.4) continue;
            det.setColor(C.conc).setPart(DP.CONC).cyl(x, gy, z, 0.55, 0.55, h + 0.05, 12, false);
            if (S?.cyl) { S.cyl(x, z, gy, yy - 0.9, 0.55, 0.55, 'pier'); stats.colliders++; }
          }
          stats.piers++; placed = true; break;
        }
        if (!placed) continue;
      }
    }
    // lamp posts on the parapet every ~36 m, alternating sides; the lantern glows at night
    for (let s = foot[0] + 18, sg = 1; s < foot[1] - 10; s += 36, sg = -sg) {
      const f = frame(s), hw = wAt(s) / 2, o = sg * (hw + KERB + PAR_T * 0.5), x = f.x + f.nx * o, z = f.z + f.nz * o, y0 = y(s) + PAR;
      det.setColor(C.galv).setPart(DP.GALV).cyl(x, y0, z, 0.1, 0.07, 8.4, 8);
      const arm = (oo, yv) => [f.x + f.nx * oo, yv, f.z + f.nz * oo];
      const o2 = sg * (hw + KERB - 1.8);
      col(C.galv, DP.GALV);
      det.face([arm(o, y0 + 8.25), arm(o2, y0 + 8.25), arm(o2, y0 + 8.35), arm(o, y0 + 8.35)], [f.dx, 0, f.dz]);
      col(C.lamp, DP.LIGHT);
      const lx = f.x + f.nx * o2, lz = f.z + f.nz * o2;
      det.face([[lx - f.dx * 0.25 - f.nx * 0.18, y0 + 8.2, lz - f.dz * 0.25 - f.nz * 0.18], [lx - f.dx * 0.25 + f.nx * 0.18, y0 + 8.2, lz - f.dz * 0.25 + f.nz * 0.18], [lx + f.dx * 0.25 + f.nx * 0.18, y0 + 8.2, lz + f.dz * 0.25 + f.nz * 0.18], [lx + f.dx * 0.25 - f.nx * 0.18, y0 + 8.2, lz + f.dz * 0.25 - f.nz * 0.18]], [0, -1, 0]);
      if (S?.cyl) { S.cyl(x, z, y0 - PAR, y0 + 8.4, 0.11, 0.07, 'pole'); stats.colliders++; }
      stats.lamps++;
    }
    // the ground: the carriageway's strip under the open deck turns to lawn (roads crossing under keep theirs), and its
    // lane paint goes along the whole deck
    const ROADS = new Set([SURF.ASPHALT, SURF.PAVERS, SURF.CURB]);
    const sOf = (x, z) => nearest(L, x, z);
    if (ground?.root) {
      stats.lawned += resurface(ground, bb, (x, z, s0, P, a, b, c) => {
        if (!ROADS.has(s0)) return null;
        const q = sOf(x, z);
        if (q.s < foot[0] || q.s > foot[1] || !open(q.s) || q.d > wAt(q.s) / 2 + KERB + PAR_T + 0.4) return null;
        for (const v of [a, b, c]) if (blocked(P[3 * v], P[3 * v + 2], 0.6)) return null;
        return SURF.GRASS;
      });
    }
    index.push({ pl, box: bb, sOf, paintAt: (x, z, lx, lz) => { // the ground's lane paint along the deck (one pass for all, below)
      const q = sOf(x, z);
      if (q.s < foot[0] - 0.5 || q.s > foot[1] + 0.5 || q.d > wAt(q.s) / 2 + 0.5) return false;
      const f = frame(q.s);
      return Math.abs(lx * f.dx + lz * f.dz) >= 0.85 * Math.hypot(lx, lz);
    } });
  }

  if (ground?.root) stats.unpainted += dropPaint(ground, (x, z, lx, lz) => index.some((e) => x >= e.box[0] && x <= e.box[2] && z >= e.box[1] && z <= e.box[3] && e.paintAt(x, z, lx, lz)));

  // ---- meshes
  const mat = detailMat ?? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
  if (det.v) group.add(Object.assign(new THREE.Mesh(det.build({ part: true }), mat), { name: `passage-${name}-structure`, castShadow: true, receiveShadow: true }));
  const gm = groundMat(ground);
  if (gm && top.i.length) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(top.p, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(top.n, 3));
    geo.setAttribute('aSurf', new THREE.Float32BufferAttribute(top.s, 1));
    geo.setIndex(top.i); geo.computeBoundingSphere();
    group.add(Object.assign(new THREE.Mesh(geo, gm), { name: `passage-${name}-road`, receiveShadow: true }));
  }
  const pmat = ground?.root?.children?.find((m) => m.name === 'markings')?.material ?? new THREE.MeshStandardMaterial({ color: 0xc7c7bd, roughness: 0.7 });
  if (paint.v) group.add(Object.assign(new THREE.Mesh(paint.build({ uv: false }), pmat), { name: `passage-${name}-paint`, receiveShadow: true }));
  Object.assign(stats, { verts: det.v + top.p.length / 3 + paint.v, ms: Math.round(performance.now() - t0) });
  det.free(); paint.free();

  const inBox = (b, x, z, pad) => x >= b[0] - pad && x <= b[2] + pad && z >= b[1] - pad && z <= b[3] + pad;
  const deckAt = (x, z) => {
    for (const { pl, box, sOf } of index) {
      if (!inBox(box, x, z, 0.5)) continue;
      const q = sOf(x, z);
      if (q.s < pl.foot[0] || q.s > pl.foot[1] || q.d > pl.wAt(q.s) / 2 + KERB + PAR_T) continue;
      return pl.y(q.s);
    }
    return null;
  };
  const clear = (x, z) => {
    for (const { pl, box, sOf } of index) {
      if (!inBox(box, x, z, 3)) continue;
      const q = sOf(x, z);
      if (q.s >= pl.foot[0] - 2 && q.s <= pl.foot[1] + 2 && q.d < pl.wAt(q.s) / 2 + KERB + PAR_T + 2.5) return true;
    }
    return false;
  };
  return { group, deckAt, clear, stats };
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

// ------------------------------------------------------------------------------------------------ a site of overpasses
// deckSite({ id, label, decks: [{ id, name, ways, centre: [x, z], opened? }] }) -> SITE: no terrain hook; build() plans
// every deck (the ones outside the phone tier's centre left out), builds them as one set of meshes and hands deckAt to
// the lanes. build(base) -> { clear, deckAt, update, stats, plans } | null
export function deckSite({ id, label, decks }) {
  return {
    id, label, ground: true,
    build(base) {
      const pc = base.map.phoneCentre;
      const live = decks.filter((O) => !pc || !O.centre || Math.hypot(O.centre[0] - pc.x, O.centre[1] - pc.z) <= pc.r + 150);
      const plans = live.map((O) => planDeck(base.map, base.heightAt, O));
      const d = buildDecks(base, plans, id);
      if (!d) return null;
      console.log(`[oradea] passages: ${label} built – ${JSON.stringify(d.stats)}; ${plans.map((p, i) => `${live[i].id} ${JSON.stringify(p?.stats ?? null)}`).join('; ')}`);
      return { clear: d.clear, deckAt: d.deckAt, update() {}, stats: d.stats, plans };
    },
  };
}
