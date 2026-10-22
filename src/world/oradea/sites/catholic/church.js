// OWNER: oradea. The parametric Western church of the Catholic site: one function that turns an OSM footprint and a short spec into a
// church – a nave under a gabled roof with a front, cross arms as cross gables, a polygonal apse under a half cone, a front tower
// or twin towers with a pyramid, spire, helm or bell cap, arched windows, a plinth and cornice, a cross on the ridge – and hands
// the front to a hook, so a hand-built church can draw its own.
//   frameOf(ring, o) -> { cx, cz, yaw, U, V, ring (local, positive area), minU, maxU, minV, maxV, toMap(u, v), loc(x, z) }
//     +u runs from the front to the altar. o: faceTo [x, z] (the street the front looks at), yaw (deg, the map angle of +u), flip, nave
//     ('short': the nave runs along the short side of the footprint)
//   analyse(R, spec) -> { slabs, core { vt, vb }, uC0, uC1, uApse, uEnd, arms, narthex, annex, minU, maxU }   the plan read off the footprint
//   buildChurch({ B, S, g, spec, ring }) -> { footprints, stats, top, ctx }
//     B: the kit's builder set (kit.js newSet), S: collision world, g(x, z): ground height, ring: map-space footprint [[x, z], ...]
//     spec fields (lengths in metres): id, name, H eave height over the floor, pitch (rise = pitch x half the span) or rise, wall / trim /
//       plinth / glass colours, roofMat ('tile' | 'sheet'), roofCol, win { w, h, y, kind, bay, pil, sur }, cornice, apse (false | u | auto),
//       hip (hip the east end when there is no apse), core [vt, vb], front ('plain' | 'pediment' | fn(ctx)), towers [{ at: 'ring' | 'front',
//       side: 'left' | 'right' | 'centre', w, d, h, proj, cap: 'pyramid' | 'tent' | 'spire' | 'helm' | 'bell' | 'dome', capH, capCol, capMat,
//       clock, bel, wins, bands, pil, wall }], roofs [explicit roof blocks, replacing the analysed ones], extra(ctx), crossH, door { w, h, kind }
import {
  PI, begin, end, edgeFrame, at, nrm, rect, slab, poly, win, door, oculus, gable, pyramid, fanRoof, PROFILES, lathe, cross, ball, shaft, frontFrame, GOLD,
} from './kit.js';
import { M4 } from '../../../../kit/mesh.js';

const EAST = -30.5 * PI / 180; // the map direction of true east (the frame's rotation)
export const ringArea = (R) => R.reduce((s, p, i) => { const q = R[(i + 1) % R.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// the local frame of a footprint: +u along the long axis, away from the side that looks at `faceTo`, centred on the bounding box
export function frameOf(ring, o = {}) {
  let best = null;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], c = ring[(i + 1) % ring.length], ang = Math.atan2(c[1] - a[1], c[0] - a[0]), ca = Math.cos(-ang), sa = Math.sin(-ang);
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const p of ring) { const u = p[0] * ca - p[1] * sa, v = p[0] * sa + p[1] * ca; x0 = Math.min(x0, u); x1 = Math.max(x1, u); z0 = Math.min(z0, v); z1 = Math.max(z1, v); }
    const A = (x1 - x0) * (z1 - z0);
    if (!best || A < best.A) best = { A, ang, L: x1 - x0, W: z1 - z0 };
  }
  const wide = best.W > best.L + 0.5;
  let yaw = best.ang + ((o.nave === 'short' ? !wide : wide) ? PI / 2 : 0);
  const mid = ring.reduce((s, p) => [s[0] + p[0] / ring.length, s[1] + p[1] / ring.length], [0, 0]);
  if (o.yaw != null) yaw = o.yaw * PI / 180;
  else if (o.faceTo) { if ((o.faceTo[0] - mid[0]) * Math.cos(yaw) + (o.faceTo[1] - mid[1]) * Math.sin(yaw) > 0) yaw += PI; }
  else if (Math.cos(yaw - EAST) < 0) yaw += PI;
  if (o.flip) yaw += PI;
  const U = [Math.cos(yaw), Math.sin(yaw)], V = [-U[1], U[0]];
  const loc0 = ring.map((p) => [p[0] * U[0] + p[1] * U[1], p[0] * V[0] + p[1] * V[1]]);
  const u0 = Math.min(...loc0.map((q) => q[0])), u1 = Math.max(...loc0.map((q) => q[0])), v0 = Math.min(...loc0.map((q) => q[1])), v1 = Math.max(...loc0.map((q) => q[1]));
  const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, cx = U[0] * cu + V[0] * cv, cz = U[1] * cu + V[1] * cv;
  let lr = loc0.map(([u, v]) => [u - cu, v - cv]);
  if (ringArea(lr) < 0) lr = lr.reverse();
  return {
    cx, cz, yaw, U, V, ring: lr, minU: u0 - cu, maxU: u1 - cu, minV: v0 - cv, maxV: v1 - cv,
    toMap: (u, v) => [cx + U[0] * u + V[0] * v, cz + U[1] * u + V[1] * v],
    loc: (x, z) => [(x - cx) * U[0] + (z - cz) * U[1], (x - cx) * V[0] + (z - cz) * V[1]],
  };
}

// v values where the line at u crosses the ring, sorted
function crossings(ring, u) {
  const vs = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    if ((a[0] <= u && b[0] > u) || (b[0] <= u && a[0] > u)) vs.push(a[1] + ((u - a[0]) / (b[0] - a[0])) * (b[1] - a[1]));
  }
  return vs.sort((p, q) => p - q);
}

// the plan read off the footprint: u-slabs with their v extent, the nave band (the most common width), the narrow front part
// (a tower stub), where the apse starts, the cross arms (slabs wider than the nave) and a narrow east annex
export function analyse(R, spec = {}) {
  const us = [...new Set(R.map((p) => Math.round(p[0] * 20) / 20))].sort((a, b) => a - b), slabs = [];
  for (let i = 0; i + 1 < us.length; i++) {
    if (us[i + 1] - us[i] < 0.3) continue;
    const vs = crossings(R, (us[i] + us[i + 1]) / 2);
    if (vs.length >= 2) slabs.push({ u0: us[i], u1: us[i + 1], vt: vs[0], vb: vs[vs.length - 1] });
  }
  const minU = Math.min(...R.map((p) => p[0])), maxU = Math.max(...R.map((p) => p[0]));
  let uApse = Infinity;
  if (spec.apse === false) uApse = Infinity;
  else if (typeof spec.apse === 'number') uApse = spec.apse;
  else {
    for (let i = 0; i < R.length; i++) {
      const a = R[i], b = R[(i + 1) % R.length], du = Math.abs(b[0] - a[0]), dv = Math.abs(b[1] - a[1]);
      if (du > 0.25 && dv > 0.25 && (a[0] + b[0]) / 2 > (minU + maxU) / 2 && Math.min(du, dv) / Math.max(du, dv) > 0.1) uApse = Math.min(uApse, a[0], b[0]);
    }
    if (uApse > maxU - 0.5) uApse = Infinity;
  }
  const body = slabs.filter((s) => s.u1 <= (Number.isFinite(uApse) ? uApse + 0.2 : 1e9));
  let core = spec.core ? { vt: spec.core[0], vb: spec.core[1] } : null;
  if (!core) {
    const bins = new Map();
    for (const s of body) { const k = Math.round((s.vb - s.vt) * 2) / 2, e = bins.get(k) ?? { len: 0, vt: 0, vb: 0 }, l = s.u1 - s.u0; e.len += l; e.vt += s.vt * l; e.vb += s.vb * l; bins.set(k, e); }
    let best = null;
    for (const e of bins.values()) if (!best || e.len > best.len) best = e;
    core = best ? { vt: best.vt / best.len, vb: best.vb / best.len } : { vt: Math.min(...R.map((p) => p[1])), vb: Math.max(...R.map((p) => p[1])) };
  }
  const tol = 0.8, spans = (s) => s.vt <= core.vt + tol && s.vb >= core.vb - tol;
  let uC0 = minU;
  for (const s of body) if (spans(s)) { uC0 = s.u0; break; }
  let uC1 = maxU;
  if (!Number.isFinite(uApse)) for (let i = body.length - 1; i >= 0; i--) if (spans(body[i])) { uC1 = body[i].u1; break; }
  const arms = [];
  for (const side of [-1, 1]) {
    let run = null;
    for (const s of body) {
      if (s.u0 < uC0 - 0.01 || s.u1 > uC1 + 0.01) continue;
      const out = side < 0 ? s.vt < core.vt - tol : s.vb > core.vb + tol, edge = side < 0 ? s.vt : s.vb;
      if (out && run && Math.abs(run.edge - edge) < 0.5) run.u1 = s.u1;
      else { if (run) arms.push(run); run = out ? { side, u0: s.u0, u1: s.u1, edge } : null; }
    }
    if (run) arms.push(run);
  }
  const ext = (list) => ({ vt: Math.min(...list.map((s) => s.vt)), vb: Math.max(...list.map((s) => s.vb)) });
  const front = slabs.filter((s) => s.u1 <= uC0 + 0.01), back = slabs.filter((s) => s.u0 >= uC1 - 0.01);
  const narthex = uC0 - minU > 1.2 && front.length ? { u0: minU, u1: uC0, ...ext(front) } : null;
  const annex = !Number.isFinite(uApse) && maxU - uC1 > 1.2 && back.length ? { u0: uC1, u1: maxU, ...ext(back) } : null;
  return { slabs, core, uApse, arms, narthex, annex, uC0: narthex ? uC0 : minU, uC1, minU, maxU, uEnd: Number.isFinite(uApse) ? uApse : uC1 };
}

// ------------------------------------------------------------------------------------------------ default fronts
// the front of the nave at u = A.uC0: the wall to the eave and the gable triangle, a portal and a window or oculus, corner pilasters
// and a cornice; 'pediment' adds the raking cornice of a classical front
function plainFront(ctx, style) {
  const { B, A, spec, Y, gLo, eaveY, ridgeY, core, vc, uF, cWall, cTrim, cGlass, cPlinth, F } = ctx;
  const vt = core.vt, vb = core.vb, W = vb - vt, FF = frontFrame(uF, vt, vb, -1);
  B.wall.setColor(cWall); FF.rect(B.wall, vt, vb, gLo, eaveY);
  poly(B.wall, [FF.pt(vt, eaveY), FF.pt(vb, eaveY), FF.pt(vc, ridgeY)], [-1, 0, 0]);
  B.wall.setColor(cPlinth); FF.slab(B.wall, vt - 0.06, vb + 0.06, gLo, Y(0.75), 0, 0.12, 'ft');
  B.wall.setColor(cTrim); FF.slab(B.wall, vt - 0.2, vb + 0.2, eaveY - 0.34, eaveY + 0.02, 0, 0.3, 'ftb');
  const pw = clamp(W * 0.07, 0.4, 0.8);
  for (const v of [vt + pw / 2, vb - pw / 2]) { B.wall.setColor(cTrim); FF.slab(B.wall, v - pw / 2, v + pw / 2, Y(0.75), eaveY - 0.34, 0, 0.1, 'flr'); }
  if (style === 'pediment') {   // the raking cornice of a classical front
    const slope = (ridgeY - eaveY) / (vc - vt);
    B.wall.setColor(cTrim);
    for (const side of [-1, 1]) {
      const vEdge = side < 0 ? vt - 0.2 : vb + 0.2, yEdge = eaveY - slope * 0.2;
      B.wall.face([FF.pt(vEdge, yEdge, 0.12), FF.pt(vc, ridgeY + 0.02, 0.12), FF.pt(vc, ridgeY - 0.32, 0.12), FF.pt(vEdge, yEdge - 0.34, 0.12)], [-1, 0, 0]);
    }
  }
  const dw = spec.door?.w ?? clamp(W * 0.2, 1.4, 2.2), dh = spec.door?.h ?? dw * 1.9, dk = spec.door?.kind ?? 'round';
  FF.door(B, vc, Y(0.2), dw, dh, { kind: dk, trim: cTrim, col: spec.doorCol ?? '#5a3a26' });
  const ww = clamp(W * 0.17, 1.0, 1.8), wy = Y(0.2) + dh + 0.9;
  if (ridgeY - wy > 2.2 || eaveY - wy > 1.6) FF.win(B, vc, wy, ww, Math.min(eaveY - wy - 0.5, ww * 1.8), { kind: 'round', trim: cTrim, glass: cGlass, sur: 0.16 });
  const cr = spec.crossH ?? 1.6;
  cross(B.cap, ...ctx.toLocalCross(uF + 0.1, ridgeY + 0.05, vc), cr, GOLD, F.yawLocal);
  ctx.st.windows++;
}

// ------------------------------------------------------------------------------------------------ the church
export function buildChurch({ B, S, g, spec, ring }) {
  const F = frameOf(ring, spec.frame), R = F.ring, A = analyse(R, spec), toW = F.toMap;
  const st = { windows: 0, towers: 0, solids: 0, domes: 0 };
  // ground: the floor stands on the highest corner, the plinth reaches the lowest
  let hi = -1e9, lo = 1e9;
  for (let i = 0; i < R.length; i++) {
    for (const [u, v] of [R[i], [(R[i][0] + R[(i + 1) % R.length][0]) / 2, (R[i][1] + R[(i + 1) % R.length][1]) / 2]]) { const [x, z] = toW(u, v), h = g(x, z); if (Number.isFinite(h)) { hi = Math.max(hi, h); lo = Math.min(lo, h); } }
  }
  if (!Number.isFinite(hi)) { hi = 3; lo = 3; }
  const Fy = hi + 0.15, gLo = lo - 0.5, Y = (h) => Fy + h;
  const H = spec.H ?? 7.2, coreW = A.core.vb - A.core.vt, vc = (A.core.vt + A.core.vb) / 2;
  const rise = clamp(spec.rise ?? (spec.pitch ?? 0.62) * coreW / 2, 1.0, spec.maxRise ?? 7.5);
  const cWall = spec.wall ?? '#efe3c2', cTrim = spec.trim ?? '#f8f3e6', cPlinth = spec.plinth ?? '#a8a090', cGlass = spec.glass ?? '#34465a';
  const roofKey = spec.roofMat ?? 'tile', cRoof = spec.roofCol ?? '#9a4a36';
  const eaveY = Y(H), ridgeY = eaveY + rise, uF = A.uC0;
  const ctx = {
    B, S, g, F, R, A, spec, Y, Fy, gLo, H, eaveY, ridgeY, rise, core: A.core, vc, uF, cWall, cTrim, cPlinth, cGlass, cRoof, st, toW,
    toLocalCross: (u, y, v) => [u, y, v], roofKey,
  };
  F.yawLocal = 0;
  begin(B, F.cx, F.cz, F.yaw);
  const Wm = B.wall, Rm = B[roofKey];
  const edges = R.map((a, i) => edgeFrame(a, R[(i + 1) % R.length]));
  const towers = (spec.towers ?? []).map((t) => ({ ...t }));
  const win0 = { w: 1.0, h: Math.max(1.8, H - 3.2), y: 1.6, kind: 'round', bay: 3.6, pil: false, sur: 0.15, ...spec.win };

  // ---- walls on the ring edges (the front edges and the narthex stub are the front's and the tower's)
  const inNarthex = (e) => A.narthex && e.a[0] < A.uC0 + 0.05 && e.b[0] < A.uC0 + 0.05;
  edges.forEach((f) => {
    if (f.L < 0.2) return;
    const frontEdge = f.n[0] < -0.7 && (f.a[0] + f.b[0]) / 2 < A.minU + 0.9;
    if (frontEdge || inNarthex(f)) return;
    Wm.setColor(cWall); rect(Wm, f, 0, f.L, gLo, eaveY);
    Wm.setColor(cPlinth); slab(Wm, f, -0.06, f.L + 0.06, gLo, Y(0.75), 0, 0.12, 'ft');
    if (spec.cornice !== false) { Wm.setColor(cTrim); slab(Wm, f, -0.2, f.L + 0.2, eaveY - 0.36, eaveY + 0.04, 0, 0.3, 'ftb'); }
    if (spec.windows === false || f.L < 1.7) return;
    const apseFacet = Number.isFinite(A.uApse) && f.a[0] >= A.uApse - 0.2 && f.b[0] >= A.uApse - 0.2;
    const n = apseFacet || (Math.abs(f.n[0]) > 0.7 && f.L < 5.5) ? 1 : Math.max(1, Math.round((f.L - 1.0) / win0.bay)), bay = f.L / n;
    for (let k = 0; k < n; k++) {
      win(B, f, (k + 0.5) * bay, Y(win0.y), win0.w, win0.h, { kind: win0.kind, trim: cTrim, glass: cGlass, sur: win0.sur, bars: win0.bars });
      st.windows++;
    }
    if (win0.pil && n > 1) for (let k = 0; k <= n; k++) { const s = k * bay; Wm.setColor(cTrim); slab(Wm, f, s - 0.22, s + 0.22, Y(0.75), eaveY - 0.36, 0, 0.1, 'flr'); }
  });

  // ---- the roofs
  const hipE = spec.hip && !Number.isFinite(A.uApse) && !A.annex;
  const rOpts = (o) => ({ ...o, G: Wm, gcol: cWall, col: cRoof });
  if (spec.roofs) {
    for (const r of spec.roofs) gable(Rm, rOpts({ a0: r.a0, a1: r.a1, b0: r.b0, b1: r.b1, yE: eaveY + (r.dy ?? 0), yR: eaveY + (r.dy ?? 0) + (r.rise ?? rise), ridge: r.ridge ?? 'u', hip0: !!r.hip0, hip1: !!r.hip1, ov: r.ov, col: r.col ?? cRoof }));
  } else {
    gable(Rm, rOpts({ a0: A.uC0 + (spec.roofStart ?? 0), a1: A.uEnd, b0: A.core.vt, b1: A.core.vb, yE: eaveY, yR: ridgeY, ridge: 'u', hip1: hipE, hip0: false, rake: 0.3 }));
    if (A.annex) {
      const n = A.annex, w = n.vb - n.vt, rs = Math.min(rise * 0.8, (spec.pitch ?? 0.62) * w / 2), yE = eaveY - 0.3;
      gable(Rm, rOpts({ a0: n.u0 - 0.2, a1: n.u1, b0: n.vt, b1: n.vb, yE, yR: yE + rs, ridge: 'u', hip1: !!spec.hip }));
    }
    for (const arm of A.arms) {
      const span = arm.u1 - arm.u0, rs = Math.min(rise, (spec.pitch ?? 0.62) * span / 2);
      const b0 = arm.side < 0 ? arm.edge : vc, b1 = arm.side < 0 ? vc : arm.edge;
      gable(Rm, rOpts({ a0: b0, a1: b1, b0: arm.u0, b1: arm.u1, yE: eaveY, yR: eaveY + rs, ridge: 'v' }));
    }
  }
  // the apse: a half cone from the end of the nave ridge over the polygon
  let apsePts = null;
  if (Number.isFinite(A.uApse)) {
    const idx = R.map((p, i) => (p[0] >= A.uApse - 0.2 ? i : -1)).filter((i) => i >= 0);
    let start = idx.find((i) => !idx.includes((i + R.length - 1) % R.length));
    if (start == null) start = idx[0];
    const chain = [];
    for (let k = 0; k < R.length; k++) { const i = (start + k) % R.length; if (!idx.includes(i)) break; chain.push(R[i]); }
    if (chain.length >= 3) {
      const apex = [A.uApse - 0.1, ridgeY - rise * 0.32, vc], ov = 0.35;
      const eave = chain.map(([u, v]) => { const dx = u - apex[0], dz = v - apex[2], d = Math.hypot(dx, dz) || 1; return [u + dx / d * ov, eaveY - 0.18, v + dz / d * ov]; });
      fanRoof(Rm, apex, eave, cRoof);
      apsePts = chain;
      if (spec.apseCross !== false) cross(B.cap, A.uApse + 0.1, apex[1] + 0.05, vc, 1.3, GOLD);
    }
  }

  // ---- the front, then the towers
  ctx.frontTowers = [];
  let top = ridgeY;
  const frontFn = typeof spec.front === 'function' ? spec.front : (c) => plainFront(c, spec.front);
  const tw = [];
  const faceW = A.core.vb - A.core.vt;
  for (const t of towers) {
    const d = t.d ?? t.w, w = t.w, proj = t.proj ?? 0.3;
    let u0, u1, v0, v1;
    if (t.at === 'ring' && A.narthex) { u0 = A.narthex.u0 - 0.05; u1 = A.narthex.u1 + 0.1; v0 = A.narthex.vt; v1 = A.narthex.vb; }
    else {
      const side = t.side ?? 'centre', off = t.off ?? 0;
      const vm = side === 'left' ? A.core.vt + w / 2 + off : side === 'right' ? A.core.vb - w / 2 - off : vc + off;
      u0 = A.uC0 - proj; u1 = A.uC0 + d - proj; v0 = vm - w / 2; v1 = vm + w / 2;
    }
    tw.push({ t, u0, u1, v0, v1 });
    ctx.frontTowers.push([v0, v1]);
  }
  frontFn(ctx);
  for (const { t, u0, u1, v0, v1 } of tw) {
    const yT = Y(t.h), w = Math.min(u1 - u0, v1 - v0);
    shaft(B, { u0, u1, v0, v1, y0: gLo, y1: yT, wall: t.wall ?? cWall, trim: cTrim, glass: t.glass ?? '#2a2a2c', pil: t.pil ?? 0.45, bands: (t.bands ?? []).map(Y),
      wins: (t.wins ?? []).map((q) => ({ ...q, y: Y(q.y) })), bel: t.bel === null ? null : { y: yT - (t.bel?.up ?? 4.2), h: t.bel?.h ?? 2.4, w: t.bel?.w, kind: t.bel?.kind ?? 'round' },
      cornice: t.cornice ?? 0.5, clock: t.clock ? { y: yT - (t.clockUp ?? 6.5), r: Math.min(0.95, w * 0.16) } : null });
    const cx = (u0 + u1) / 2, cz = (v0 + v1) / 2, capCol = t.capCol ?? '#6f757b', mat = B[t.capMat ?? (t.cap === 'pyramid' || t.cap === 'tent' ? roofKey : 'sheet')] ?? B.sheet;
    const ch = t.capH ?? (t.cap === 'tent' ? w * 0.45 : t.cap === 'pyramid' ? w * 1.1 : w * 1.9);
    let tip = yT;
    mat.setColor(capCol);
    if (t.cap === 'pyramid' || t.cap === 'tent' || !t.cap) { pyramid(mat, { x0: u0, x1: u1, z0: v0, z1: v1, yE: yT, yR: yT + ch, ov: t.ov ?? 0.45, col: capCol }); tip = yT + ch; }
    else if (t.cap === 'spire') {
      B.wall.setColor(cTrim); B.wall.box(u0 - 0.1, yT, v0 - 0.1, u1 + 0.1, yT + 0.18, v1 + 0.1);
      B.sheet.setColor(capCol); lathe(B.sheet, PROFILES.needle, 8, cx, cz, yT + 0.15, w * 0.64, ch, PI / 8); tip = yT + 0.15 + ch;
    } else if (t.cap === 'helm') { B.cap.setColor(capCol); B.cap.cyl(cx, yT - 0.05, cz, w * 0.62, w * 0.62, 0.35, 8, true); lathe(B.cap, PROFILES.helm, 12, cx, cz, yT + 0.3, w * 0.62, ch); tip = yT + 0.3 + ch; }
    else if (t.cap === 'bell') { B.cap.setColor(capCol); B.cap.cyl(cx, yT - 0.05, cz, w * 0.6, w * 0.6, 0.3, 8, true); lathe(B.cap, PROFILES.bell, 12, cx, cz, yT + 0.25, w * 0.6, ch); tip = yT + 0.25 + ch; }
    else if (t.cap === 'dome') { B.cap.setColor(capCol); B.cap.cyl(cx, yT - 0.05, cz, w * 0.62, w * 0.62, 0.3, 8, true); lathe(B.cap, PROFILES.dome, 12, cx, cz, yT + 0.25, w * 0.6, ch); tip = yT + 0.25 + ch; }
    if (t.cross !== false) { ball(B.cap, cx, tip + 0.08, cz, 0.2); cross(B.cap, cx, tip + 0.15, cz, t.crossH ?? 1.8, GOLD, 0); }
    top = Math.max(top, tip + 2);
    st.towers++;
    const wm = [toW(u0, v0), toW(u1, v0), toW(u1, v1), toW(u0, v1)];
    S.prism(wm.flat(), gLo, yT, 0, 0, 'tower');
    S.cyl(...toW(cx, cz), yT, tip, w * 0.5, 0.2, 'tower');
    ctx.tower = { cx, cz, yT, tip };
  }
  spec.extra?.(ctx);
  end(B);

  // ---- colliders and the map footprint
  const wr = R.map(([u, v]) => toW(u, v));
  S.prism(wr.flat(), gLo, eaveY, 0, 0, 'wall'); st.solids++;
  if (!spec.roofs || spec.roofSolid) {
    const k = rise / (coreW / 2), V = F.V, u0 = A.uC0, u1 = A.uEnd;
    const slope = (v0, v1, sgn) => {
      const pts = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => toW(u, v)).flat();
      // y = eave + k (v - vt) on the top side, y = eave + k (vb - v) on the bottom one; v = V0 (x - cx) + V1 (z - cz)
      const off = V[0] * F.cx + V[1] * F.cz;
      const a = sgn > 0 ? eaveY - k * (A.core.vt + off) : eaveY + k * (A.core.vb + off);
      S.prism(pts, eaveY, a, sgn * k * V[0], sgn * k * V[1], 'roof'); st.solids++;
    };
    slope(A.core.vt, vc, 1); slope(vc, A.core.vb, -1);
  }
  const footprints = [{ poly: wr, h: top - gLo, kind: 'church', name: spec.name, id: spec.id }];
  return { footprints, stats: st, top, F, A, gLo, Fy, ctx };
}
void nrm; void oculus; void door; void M4;
