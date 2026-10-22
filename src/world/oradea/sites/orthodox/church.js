// OWNER: oradea. The parametric Orthodox church: one function that turns an OSM footprint and a short spec into a church
// (nave under a gabled roof, cross arms as cross gables, a polygonal apse under a half cone, a west bell tower, domes on drums,
// a porch, windows and doors), so every church in the city reads as one.
//   frameOf(ring, o) -> { cx, cz, yaw, U, V, loc(x, z), toMap(u, v), ring: local positive-area ring, minU, maxU, ... }
//   analyse(ring, spec) -> { slabs, core, uApse, arms, narthex, ... }   the plan read off the footprint
//   buildChurch({ B, S, g, spec, ring }) -> { footprints, stats, top }     B: the kit's builder set (kit.js newSet), S: collision world,
//     g(x, z) ground height, ring: map-space footprint [[x, z], ...]; spec: see specs.js (all lengths in metres)
import { M4 } from '../../../../kit/mesh.js';
import {
  PI, begin, end, edgeFrame, at, nrm, rect, slab, poly, archWin, archDoor, gable, pyramid, fanRoof, PROFILES, spire, cross, ball, drum, clockFace, GOLD,
} from './kit.js';

const EAST = -30.5 * PI / 180; // the map direction of true east (the frame's rotation): altars point there
const ringArea = (R) => R.reduce((s, p, i) => { const q = R[(i + 1) % R.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// the local frame of a footprint: +u along the long axis toward the side nearest to true east (the apse), centred on the bounding box
export function frameOf(ring, o = {}) {
  let best = null;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], c = ring[(i + 1) % ring.length], ang = Math.atan2(c[1] - a[1], c[0] - a[0]), ca = Math.cos(-ang), sa = Math.sin(-ang);
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const p of ring) { const u = p[0] * ca - p[1] * sa, v = p[0] * sa + p[1] * ca; x0 = Math.min(x0, u); x1 = Math.max(x1, u); z0 = Math.min(z0, v); z1 = Math.max(z1, v); }
    const A = (x1 - x0) * (z1 - z0);
    if (!best || A < best.A) best = { A, ang, L: x1 - x0, W: z1 - z0 };
  }
  let yaw = best.ang + (best.W > best.L + 0.5 ? PI / 2 : 0);
  if (Math.cos(yaw - EAST) < 0) yaw += PI;
  if (o.yaw != null) yaw = o.yaw * PI / 180;
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

// v values where the vertical line at u crosses the ring, sorted
function crossings(ring, u) {
  const vs = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    if ((a[0] <= u && b[0] > u) || (b[0] <= u && a[0] > u)) vs.push(a[1] + ((u - a[0]) / (b[0] - a[0])) * (b[1] - a[1]));
  }
  return vs.sort((p, q) => p - q);
}

// the plan read off the footprint: u-slabs with their v interval, the nave band (the most common width), where the apse starts,
// the cross arms (slabs wider than the nave) and the narrow west part
export function analyse(ring, spec = {}) {
  const us = [...new Set(ring.map((p) => Math.round(p[0] * 20) / 20))].sort((a, b) => a - b), slabs = [];
  for (let i = 0; i + 1 < us.length; i++) {
    if (us[i + 1] - us[i] < 0.35) continue;
    const vs = crossings(ring, (us[i] + us[i + 1]) / 2);
    if (vs.length >= 2) slabs.push({ u0: us[i], u1: us[i + 1], vt: vs[0], vb: vs[vs.length - 1] });
  }
  // the apse: slanted edges in the eastern half
  let uApse = Infinity;
  if (spec.apse === false) uApse = Infinity;
  else if (typeof spec.apse === 'number') uApse = spec.apse;
  else {
    const maxU = Math.max(...ring.map((p) => p[0]));
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length], du = Math.abs(b[0] - a[0]), dv = Math.abs(b[1] - a[1]);
      if (du > 0.25 && dv > 0.25 && (a[0] + b[0]) / 2 > 0 && Math.min(du, dv) / Math.max(du, dv) > 0.1) uApse = Math.min(uApse, a[0], b[0]);
    }
    if (uApse > maxU - 0.5) uApse = Infinity;
  }
  const body = slabs.filter((s) => s.u1 <= (Number.isFinite(uApse) ? uApse + 0.2 : 1e9));
  let core = spec.core ? { vt: spec.core[0], vb: spec.core[1] } : null;
  if (!core) {
    const bins = new Map();
    for (const s of body) { const k = Math.round((s.vb - s.vt) * 2) / 2, e = bins.get(k) ?? { len: 0, vt: 0, vb: 0 }; const l = s.u1 - s.u0; e.len += l; e.vt += s.vt * l; e.vb += s.vb * l; bins.set(k, e); }
    let best = null;
    for (const e of bins.values()) if (!best || e.len > best.len) best = e;
    core = best ? { vt: best.vt / best.len, vb: best.vb / best.len } : { vt: Math.min(...ring.map((p) => p[1])), vb: Math.max(...ring.map((p) => p[1])) };
  }
  const tol = 0.8, minU = Math.min(...ring.map((p) => p[0])), maxU = Math.max(...ring.map((p) => p[0]));
  // the narrow west part: leading slabs narrower than the nave band
  let uC0 = minU;
  for (const s of body) { if (s.vt <= core.vt + tol && s.vb >= core.vb - tol) { uC0 = s.u0; break; } }
  let uC1b = maxU;
  if (!Number.isFinite(uApse)) for (let i = body.length - 1; i >= 0; i--) { const s = body[i]; if (s.vt <= core.vt + tol && s.vb >= core.vb - tol) { uC1b = s.u1; break; } }
  // arms: runs of slabs that stick out of the nave band on the top (-v) or bottom (+v) side
  const arms = [];
  for (const side of [-1, 1]) {
    let run = null;
    for (const s of body) {
      if (s.u0 < uC0 - 0.01 || s.u1 > uC1b + 0.01) continue;
      const out = side < 0 ? s.vt < core.vt - tol : s.vb > core.vb + tol, edge = side < 0 ? s.vt : s.vb;
      if (out && run && Math.abs(run.edge - edge) < 0.5) { run.u1 = s.u1; }
      else { if (run) arms.push(run); run = out ? { side, u0: s.u0, u1: s.u1, edge } : null; }
    }
    if (run) arms.push(run);
  }
  const narthex = uC0 - minU > 1.2 ? { u0: minU, u1: uC0, vt: Math.min(...slabs.filter((s) => s.u1 <= uC0 + 0.01).map((s) => s.vt)), vb: Math.max(...slabs.filter((s) => s.u1 <= uC0 + 0.01).map((s) => s.vb)) } : null;
  // the narrow east end (a square altar): trailing slabs narrower than the nave band, when there is no polygonal apse
  let uC1 = maxU;
  if (!Number.isFinite(uApse)) for (let i = body.length - 1; i >= 0; i--) { const s = body[i]; if (s.vt <= core.vt + tol && s.vb >= core.vb - tol) { uC1 = s.u1; break; } }
  const annex = !Number.isFinite(uApse) && maxU - uC1 > 1.2 ? { u0: uC1, u1: maxU, vt: Math.min(...slabs.filter((s) => s.u0 >= uC1 - 0.01).map((s) => s.vt)), vb: Math.max(...slabs.filter((s) => s.u0 >= uC1 - 0.01).map((s) => s.vb)) } : null;
  return { slabs, core, uApse, arms, narthex, annex, uC0: narthex ? uC0 : minU, uC1, minU, maxU, uEnd: Number.isFinite(uApse) ? uApse : uC1 };
}

// roof collider: a sloped prism over a local polygon; `slopeV` / `slopeU` give the plane through (vEdge | uEdge) at yE rising k per metre
const world = (F, pts) => pts.flatMap(([u, v]) => F.toMap(u, v));

export function buildChurch({ B, S, g, spec, ring }) {
  const F = frameOf(ring, spec.frame), R = F.ring, A = analyse(R, spec), toW = F.toMap;
  const st = { windows: 0, domes: 0, towers: 0, solids: 0 };
  // ground: the floor stands on the highest corner, the plinth reaches the lowest
  let hi = -1e9, lo = 1e9;
  for (let i = 0; i < R.length; i++) {
    for (const [u, v] of [R[i], [(R[i][0] + R[(i + 1) % R.length][0]) / 2, (R[i][1] + R[(i + 1) % R.length][1]) / 2]]) { const [x, z] = toW(u, v), h = g(x, z); if (Number.isFinite(h)) { hi = Math.max(hi, h); lo = Math.min(lo, h); } }
  }
  if (!Number.isFinite(hi)) { hi = 3; lo = 3; }
  const Fy = hi + 0.18, gLo = lo - 0.5, Y = (h) => Fy + h;
  const H = spec.H ?? 6.2, pitch = spec.pitch ?? 0.5, coreW = A.core.vb - A.core.vt, vc = (A.core.vt + A.core.vb) / 2;
  const riseC = clamp(spec.rise ?? pitch * coreW / 2, 1.2, spec.maxRise ?? 6.5);
  const cWall = spec.wall ?? '#efe3c2', cTrim = spec.trim ?? '#f8f3e6', cPlinth = spec.plinth ?? '#a8a090', cGlass = spec.glass ?? '#232d3a';
  const roofKey = spec.roofMat ?? 'roof', cRoof = spec.roofCol ?? '#7d8288', cDome = spec.domeCol ?? '#8c9298';
  const wallKey = spec.wallMat ?? 'wall';
  begin(B, F.cx, F.cz, F.yaw);
  const Wm = B[wallKey], Rm = B[roofKey];
  const edges = R.map((a, i) => edgeFrame(a, R[(i + 1) % R.length]));
  const fx = F.minU, towers = (spec.towers ?? []).map((t) => ({ ...t }));
  const westTower = towers.find((t) => t.at === 'west');

  // ---- walls
  edges.forEach((f, ei) => {
    const L = f.L; if (L < 0.2) return;
    const alongV = Math.abs(f.n[0]) > 0.7;                     // faces east or west
    const west = f.n[0] < -0.7 && f.a[0] < fx + 0.8, eastEnd = f.n[0] > 0.7;
    Wm.setColor(cWall); rect(Wm, f, 0, L, gLo, Y(H));
    B.stone.setColor(cPlinth); slab(B.stone, f, -0.06, L + 0.06, gLo, Y(0.75), 0, 0.12, 'ft');
    B.stone.setColor(cTrim); slab(B.stone, f, -0.2, L + 0.2, Y(H) - 0.36, Y(H) + 0.04, 0, 0.3, 'ftb');
    if (spec.band) { B.stone.setColor(spec.band.col ?? cTrim); slab(B.stone, f, -0.04, L + 0.04, Y(spec.band.y0), Y(spec.band.y1), 0, 0.07, 'f'); }
    // windows: tall arches on the long sides and the apse facets
    const ww = spec.winW ?? 1.0, wh = clamp(spec.winH ?? (H - 3.1), 1.6, 5.5), wy = spec.winY ?? 1.5;
    if (spec.windows === false) return;
    if (west) {
      const dw = spec.doorW ?? 1.7, dh = spec.doorH ?? 3.0;
      if (L > dw + 1.2 && !spec.noDoor) {
        archDoor(B, f, L / 2, Y(0.2), dw, dh, { col: spec.doorCol ?? '#4a2e1f', tcol: cTrim });
        if (L > 5 && spec.rose !== false && !westTower) { B.stone.setColor(cTrim); const cx0 = at(f, L / 2, Y(H - 1.4), 0.05); void cx0; archWin(B, f, L / 2, Y(H - 2.2), 0.9, 1.1, { rise: 0.45, sur: 0.14, tcol: cTrim, gcol: cGlass, n: 3 }); st.windows++; }
      }
      return;
    }
    if (eastEnd && L > 4 && !(f.a[0] > A.uEnd)) return;
    if (L < 1.6) return;
    const n = alongV && L < 5 ? 1 : Math.max(1, Math.round((L - 1.2) / (spec.bay ?? 3.4)));
    const bays = f.L / n;
    for (let k = 0; k < n; k++) {
      const s = (k + 0.5) * bays;
      archWin(B, f, s, Y(wy), ww, wh, { sur: 0.17, tcol: cTrim, gcol: cGlass, n: 3, rise: ww / 2 }); st.windows++;
    }
  });

  // ---- roofs: nave, narthex, arms, apse
  const eaveY = Y(H), ridgeY = eaveY + riseC, uA = A.uEnd;
  const hipAll = spec.roofStyle === 'hip', tw = westTower;
  const roofOpts = (o) => ({ ...o, G: Wm, gcol: cWall, col: cRoof });
  if (spec.round) {
    const apex = [0, ridgeY, 0], eave = R.concat([R[0]]).map(([u, v]) => { const d = Math.hypot(u, v) || 1; return [u + u / d * 0.35, eaveY - 0.2, v + v / d * 0.35]; });
    Rm.setColor(cRoof); fanRoof(Rm, apex, eave);
  } else {
    gable(Rm, roofOpts({ a0: A.uC0, a1: uA, b0: A.core.vt, b1: A.core.vb, yE: eaveY, yR: ridgeY, ridge: 'u', hip1: hipAll && !Number.isFinite(A.uApse), hip0: hipAll && !A.narthex }));
    if (A.narthex) {
      const n = A.narthex, w = n.vb - n.vt, rise = Math.min(riseC * 0.8, pitch * w / 2);
      gable(Rm, roofOpts({ a0: n.u0, a1: n.u1 + 0.3, b0: n.vt, b1: n.vb, yE: eaveY, yR: eaveY + rise, ridge: 'u' }));
    }
    if (A.annex) {
      const n = A.annex, w = n.vb - n.vt, rise = Math.min(riseC * 0.7, pitch * w / 2);
      gable(Rm, roofOpts({ a0: n.u0 - 0.3, a1: n.u1, b0: n.vt, b1: n.vb, yE: eaveY, yR: eaveY + rise, ridge: 'u', hip1: hipAll }));
    }
    for (const arm of A.arms) {
      const span = arm.u1 - arm.u0, rise = Math.min(riseC, pitch * span / 2);
      const b0 = arm.side < 0 ? arm.edge : vc, b1 = arm.side < 0 ? vc : arm.edge;
      gable(Rm, roofOpts({ a0: b0, a1: b1, b0: arm.u0, b1: arm.u1, yE: eaveY, yR: eaveY + rise, ridge: 'v' }));
    }
  }
  // the apse: a half cone from the end of the nave ridge over the polygon
  let apsePts = null;
  if (Number.isFinite(A.uApse)) {
    const idx = R.map((p, i) => (p[0] >= A.uApse - 0.2 ? i : -1)).filter((i) => i >= 0);
    // contiguous run round the ring (it may wrap)
    let start = idx.find((i) => !idx.includes((i + R.length - 1) % R.length));
    if (start == null) start = idx[0];
    const chain = [];
    for (let k = 0; k < R.length; k++) { const i = (start + k) % R.length; if (!idx.includes(i)) break; chain.push(R[i]); }
    if (chain.length >= 3) {
      const apex = [A.uApse - 0.1, Y(H) + riseC * (spec.apseRise ?? 0.62), vc], ov = 0.35;
      const eave = chain.map(([u, v]) => { const dx = u - apex[0], dz = v - apex[2], d = Math.hypot(dx, dz) || 1; return [u + dx / d * ov, eaveY - 0.18, v + dz / d * ov]; });
      Rm.setColor(cRoof); fanRoof(Rm, apex, eave);
      apsePts = chain;
      // the cross on the apse ridge
      cross(B.dome, A.uApse + 0.1, apex[1] + 0.05, vc, spec.apseCross ?? 1.5, GOLD);
    }
  }

  // ---- west tower
  let top = ridgeY;
  if (tw) {
    const d = tw.d ?? tw.w, w = tw.w, u0 = fx - 0.12, u1 = u0 + d, v0 = (tw.v ?? vc) - w / 2, v1 = v0 + w, yT = Y(tw.h), y0 = Y(H) - 0.05;
    const tcol = tw.col ?? cWall;
    const quadR = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
    const ringT = ringArea(quadR) > 0 ? quadR : quadR.slice().reverse();
    const ef = ringT.map((p, i) => edgeFrame(p, ringT[(i + 1) % 4]));
    ef.forEach((f) => {
      Wm.setColor(tcol); rect(Wm, f, 0, f.L, y0, yT);
      B.stone.setColor(cTrim);
      // corner strips and the cornice of the shaft
      slab(B.stone, f, -0.05, 0.5, y0, yT - 0.4, 0, 0.1, 'f'); slab(B.stone, f, f.L - 0.5, f.L + 0.05, y0, yT - 0.4, 0, 0.1, 'f');
      slab(B.stone, f, -0.22, f.L + 0.22, yT - 0.5, yT, 0, 0.3, 'ftb');
      slab(B.stone, f, -0.12, f.L + 0.12, Y(H) + 0.4, Y(H) + 0.6, 0, 0.14, 'ft');
      // a belfry arch with louvres near the top, a small window lower down
      const bw = Math.min(1.5, f.L * 0.42), by = yT - Math.min(5.5, (tw.h - H) * 0.52);
      archWin(B, f, f.L / 2, by, bw, Math.min(3.2, yT - by - 1.0), { sur: 0.2, tcol: cTrim, gcol: '#2a2a2c', n: 4 });
    });
    if (tw.clock) for (const f of ef) clockFace(B, f, f.L / 2, Y(tw.h) - Math.min(8.5, (tw.h - H) * 0.8), Math.min(0.95, f.L * 0.17));
    // the tower's roof
    const pk = tw.roof ?? 'pyramid', rh = tw.rh ?? 5, cxT = (u0 + u1) / 2, czT = (v0 + v1) / 2;
    if (pk === 'pyramid') pyramid(Rm, { x0: u0, x1: u1, z0: v0, z1: v1, yE: yT, yR: yT + rh, ov: 0.5, col: tw.roofCol ?? cRoof });
    else if (pk === 'spire') {
      B.dome.setColor(tw.roofCol ?? cDome);
      spire(B.dome, PROFILES.needle, 8, cxT, czT, yT, w * 0.62, rh);
      B.dome.setColor(tw.roofCol ?? cDome); B.dome.cyl(cxT, yT - 0.05, czT, w * 0.7, w * 0.62, 0.4, 8, true);
    } else if (pk === 'onion') {
      B.dome.setColor(tw.roofCol ?? cDome); B.dome.cyl(cxT, yT - 0.05, czT, w * 0.7, w * 0.55, 0.5, 8, true);
      spire(B.dome, PROFILES.onion, 12, cxT, czT, yT + 0.45, w * 0.52, rh);
    } else if (pk === 'bell') { B.dome.setColor(tw.roofCol ?? cDome); spire(B.dome, PROFILES.bell, 8, cxT, czT, yT, w * 0.5, rh); }
    else if (pk === 'dome') { B.dome.setColor(tw.roofCol ?? cDome); spire(B.dome, PROFILES.byz, 12, cxT, czT, yT, w * 0.5, rh); }
    const tipY = yT + (pk === 'pyramid' ? rh : pk === 'onion' ? rh + 0.45 : rh);
    if (tw.cross !== false) { ball(B.dome, cxT, tipY + 0.1, czT, 0.22); cross(B.dome, cxT, tipY + 0.2, czT, tw.crossH ?? 2.4); }
    top = tipY + 2.6;
    st.towers++;
    S.obox(...toW(cxT, czT), d / 2, w / 2, F.yaw, gLo, yT, 'tower');
    S.cyl(...toW(cxT, czT), yT, tipY, w * 0.5, 0.15, 'tower');
  }

  // ---- domes
  const domeList = (spec.domes ?? []).map((d) => ({ ...d }));
  for (const d of domeList) {
    let u = d.u, v = d.v ?? vc;
    if (d.at === 'cross') {
      const a = A.arms[0]; u = a ? (a.u0 + a.u1) / 2 : (A.uC0 + uA) / 2;
    } else if (d.at === 'mid') u = (A.uC0 + uA) / 2;
    else if (d.at === 'centre') { u = 0; v = 0; }
    const Rr = d.R ?? 2.2, drumH = d.drumH ?? 2.6, kind = d.kind ?? 'byz', n = d.n ?? 8;
    const yBase = d.base != null ? Y(d.base) : eaveY + riseC - 0.4;
    const yDrum = yBase + drumH;
    drum(B, u, v, yBase, Rr, drumH, { n, col: d.wall ?? cWall, trim: cTrim, gcol: cGlass, rot: PI / n * 0 });
    const cd = d.col ?? cDome;
    B.dome.setColor(cd);
    let yTop;
    if (kind === 'onion') { B.dome.cyl(u, yDrum - 0.02, v, Rr * 1.08, Rr * 0.85, 0.3, n, true); spire(B.dome, PROFILES.onion, 12, u, v, yDrum + 0.25, Rr * 1.05, d.H ?? Rr * 1.9); yTop = yDrum + 0.25 + (d.H ?? Rr * 1.9); }
    else if (kind === 'bell') { spire(B.dome, PROFILES.bell, n, u, v, yDrum, Rr, d.H ?? Rr * 2.1); yTop = yDrum + (d.H ?? Rr * 2.1); }
    else { B.dome.cyl(u, yDrum - 0.02, v, Rr * 1.1, Rr * 1.0, 0.3, n, true); spire(B.dome, PROFILES.byz, 14, u, v, yDrum + 0.25, Rr * 1.0, d.H ?? Rr * 0.8); yTop = yDrum + 0.25 + (d.H ?? Rr * 0.8); }
    if (d.lantern) { B.stone.setColor(cTrim); B.stone.cyl(u, yTop - 0.05, v, 0.55, 0.45, 0.9, 8, true); B.dome.setColor(cd); spire(B.dome, PROFILES.onion, 8, u, v, yTop + 0.85, 0.5, 0.9); yTop += 1.75; }
    ball(B.dome, u, yTop + 0.12, v, 0.2); cross(B.dome, u, yTop + 0.2, v, d.crossH ?? 2.2);
    top = Math.max(top, yTop + 2.5);
    S.cyl(...toW(u, v), yBase, yDrum, Rr, Rr, 'drum'); S.cyl(...toW(u, v), yDrum, yTop, Rr, 0.2, 'dome');
    st.domes++;
  }

  // ---- porch on the west face
  if (spec.porch) {
    const p = spec.porch, f = edges.find((q) => q.n[0] < -0.7 && q.a[0] < fx + 0.8 && q.L > 3);
    if (f) {
      const pw = Math.min(p.w ?? 5, f.L - 0.4), pd = p.d ?? 2.4, ph = p.h ?? 3.4, s0 = f.L / 2 - pw / 2;
      B.stone.setColor(cTrim);
      const cols = p.cols ?? 2, dd = pd - 0.2;
      for (let k = 0; k < cols; k++) {
        const s = s0 + 0.25 + (pw - 0.5) * (cols === 1 ? 0.5 : k / (cols - 1)), P = at(f, s, 0, dd);
        B.stone.setColor(cTrim); B.stone.cyl(P[0], Y(0), P[2], 0.22, 0.2, ph, 8, true);
      }
      B.stone.setColor(cTrim); slab(B.stone, f, s0, s0 + pw, Y(ph), Y(ph) + 0.35, 0, pd, 'ftlrb');
      Rm.setColor(p.roof ?? cRoof);
      const a = at(f, s0 - 0.2, Y(ph) + 0.35, pd + 0.25), b = at(f, s0 + pw + 0.2, Y(ph) + 0.35, pd + 0.25), c = at(f, s0 + pw + 0.2, Y(ph) + 1.2, -0.05), d2 = at(f, s0 - 0.2, Y(ph) + 1.2, -0.05);
      poly(Rm, [a, b, c, d2], [f.n[0] * 0.5, 1, f.n[1] * 0.5]);
      B.stone.setColor(cPlinth); slab(B.stone, f, s0 - 0.3, s0 + pw + 0.3, gLo, Y(0.0), 0, pd + 0.5, 'ft');
    }
  }

  end(B);
  // ---- colliders and map footprint
  const wr = R.map(([u, v]) => toW(u, v));
  S.prism(wr.flat(), gLo, Y(H), 0, 0, 'wall'); st.solids++;
  const k = riseC / (coreW / 2), V = F.V;
  const slope = (v0, v1, side) => {
    // plane y = eave + k (v - vEdge) on the top side, mirrored on the bottom one: y = a + bx x + bz z in world coordinates
    const pts = [[A.uC0, v0], [uA, v0], [uA, v1], [A.uC0, v1]].map(([u, v]) => toW(u, v)).flat();
    const sg = side;
    const bx = sg * k * V[0], bz = sg * k * V[1], edgeV = sg > 0 ? A.core.vt : A.core.vb;
    const a = eaveY - sg * k * (edgeV + F.cx * V[0] + F.cz * V[1]) * 1 + (sg > 0 ? 0 : 0);
    // y(v) = eave + sg * k * (v - edgeV); v = V0 (x - cx) + V1 (z - cz)  ->  a = eave - sg k (edgeV + V0 cx + V1 cz)
    S.prism(pts, Y(H), a, bx, bz, 'roof');
  };
  if (spec.round) S.cyl(F.cx, F.cz, Y(H), ridgeY, Math.max(F.maxU, F.maxV) * 0.95, 0.4, 'roof');
  else { slope(A.core.vt, vc, 1); slope(vc, A.core.vb, -1); st.solids += 2; }
  const footprints = [{ poly: wr, h: top - gLo, kind: 'church', name: spec.name, id: spec.id }];
  return { footprints, stats: st, top, F, A, gLo, Fy };
}
