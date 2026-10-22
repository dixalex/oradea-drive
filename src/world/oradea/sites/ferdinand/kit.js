// OWNER: oradea. Shared helpers of the Ferdinand site (theatre, square, Darvas house, Zion synagogue): wall frames, arched
// openings, columns, cornices, robed stone figures and the canvas textures. Not a site module.
//   frame(a, b, hint) -> F { a, W, U, N, ang, toMap(s, o), toLocal(x, z), face(s0, s1, o?) }   the wall from a to b with
//     its outward normal toward `hint` (a direction); the ends swap when needed so s runs to the viewer's right
//   poly(D, f, pts, o?, n?)                 planar polygon [[s, y], ...] in the face plane (fan from pts[0])
//   archPts(s0, s1, yS, rise, n?, p?) -> [[s, y]]   arch curve, left springing -> crown -> right springing
//   archOpening(B, f, q)                    an opening with an arched head in a wall face: q { s0, s1, y0, yS, rise, dep, W (wall
//     builder), wcol, frame, glass, lit, mull: [s...], tr (transom y), door, sill, rev, n (arc segments; by width if omitted), p }
//   column(D, x, z, y0, h, r, col)          a colossal Corinthian-ish column: base, slightly swelling shaft, bell, abacus, volutes
//   cornice(D, f, s0, s1, y, h, o0, o1, col, d?)  a stepped cornice; dentils(D, f, s0, s1, y, h, o, col, step?) a row of dentil blocks
//   rake(D, f, p0, p1, th, o0, o1, col)     a sloped moulding (pediment cornice) from [s, y] to [s, y]
//   robed(s, k?) / seated(s) / lying(s) / bust(s)   SG figures in figure units (1.8 tall, +z forward): standing robed
//     woman, seated woman, a reclining figure along +x, a head-and-shoulders bust
//   place(dst, src, x, y, z, yaw, k)        append an SG figure to another SG, transformed
//   renderTex, limeTex, paveTex, castTex, zincTex, leafTex, signTex(text)   textures (uv in metres; the texture covers a few metres)
import * as THREE from 'three';
import { M4 } from '../../../../kit/mesh.js';
import { SG, canvasTex } from '../../../cherkasy/sculpt.js';
import { face as mkFace, at, quad, box, skin } from '../../../cherkasy/slabkit.js';
import { put, mapper } from '../../../cherkasy/bohdan.js';

const PI = Math.PI, TAU = PI * 2;
export const neg = (v) => v.map((q) => -q);

export function frame(a, b, hint) {
  let W = Math.hypot(b[0] - a[0], b[1] - a[1]), U = [(b[0] - a[0]) / W, (b[1] - a[1]) / W], N = [-U[1], U[0]];
  if (N[0] * hint[0] + N[1] * hint[1] < 0) N = [-N[0], -N[1]];
  if (U[0] * N[1] - U[1] * N[0] < 0) { [a, b] = [b, a]; U = [-U[0], -U[1]]; }
  const toMap = (s, o = 0) => [a[0] + U[0] * s + N[0] * o, a[1] + U[1] * s + N[1] * o];
  return {
    a, b, W, U, N, ang: Math.atan2(U[1], U[0]), toMap,
    toLocal: (x, z) => { const dx = x - a[0], dz = z - a[1]; return [dx * U[0] + dz * U[1], dx * N[0] + dz * N[1]]; },
    face: (s0 = 0, s1 = W, o = 0) => mkFace(toMap(s0, o), toMap(s1, o), N[0], N[1]),
  };
}

export const poly = (D, f, pts, o = 0, n = f.N) => D.face(pts.map(([s, y]) => at(f, s, y, o)), n);

export function archPts(s0, s1, yS, rise, n = 10, p = 2) {
  const c = (s0 + s1) / 2, hw = (s1 - s0) / 2, out = [];
  for (let i = 0; i <= n; i++) {
    const t = PI - (PI * i) / n, co = Math.cos(t), si = Math.sin(t);
    // p = 2: an ellipse; a higher p squares it off, a lower one sharpens the crown
    out.push([c + hw * Math.sign(co) * Math.abs(co) ** (2 / p), yS + rise * Math.abs(si) ** (2 / p)]);
  }
  return out;
}

// the two corners between an arch and its enclosing rectangle, filled in the builder W with colour col
export function spandrels(W, f, s0, s1, yS, rise, n = 10, p = 2, col = '#ffffff') {
  const crown = yS + rise, arc = archPts(s0, s1, yS, rise, n, p), K = n >> 1;
  W.setColor(col);
  poly(W, f, [[s0, crown], ...arc.slice(0, K + 1)]);
  poly(W, f, [[s1, crown], ...arc.slice(K)]);
}
// slabkit.skin over the part s0..s1 of a face only (the cuts inside it are honoured)
export function skinRange(D, f, s0, s1, y0, y1, col, uvM = null) {
  const sub = Object.assign({}, f, { ax: f.ax + f.ux * s0, az: f.az + f.uz * s0, L: s1 - s0,
    cuts: f.cuts.filter((c) => c.s1 > s0 + 1e-3 && c.s0 < s1 - 1e-3).map((c) => ({ ...c, s0: Math.max(0, c.s0 - s0), s1: Math.min(s1 - s0, c.s1 - s0) })) });
  skin(D, sub, y0, y1, col, uvM);
}

// an opening with an arched head: the wall rectangle up to the crown is cut away (f.cuts), the spandrels are filled in
// the wall's own builder, then reveals, glass and frame
export function archOpening(B, f, q) {
  const { s0, s1, y0, yS, rise, dep = 0.3 } = q, n = q.n ?? ((s1 - s0) > 2.2 ? 8 : (s1 - s0) > 1.3 ? 6 : 4), c = (s0 + s1) / 2, crown = yS + rise;
  const D = B.det, arc = archPts(s0, s1, yS, rise, n, q.p ?? 2);
  f.cuts.push({ s0, s1, y0, y1: crown });
  if (q.W) spandrels(q.W, f, s0, s1, yS, rise, n, q.p ?? 2, q.wcol);
  D.setColor(q.rev ?? '#e9e2d2');
  const rv = (a, b, nrm) => quad(D, at(f, a[0], a[1]), at(f, a[0], a[1], -dep), at(f, b[0], b[1], -dep), at(f, b[0], b[1]), nrm);
  rv([s0, y0], [s0, yS], f.U);
  rv([s1, yS], [s1, y0], neg(f.U));
  for (let i = 0; i < n; i++) {
    const a = arc[i], b = arc[i + 1], mx = (a[0] + b[0]) / 2 - c, my = (a[1] + b[1]) / 2 - yS, l = Math.hypot(mx, my) || 1;
    rv(a, b, [f.U[0] * (-mx / l), -my / l, f.U[2] * (-mx / l)]);
  }
  if (!q.door) quad(D, at(f, s0, y0), at(f, s1, y0), at(f, s1, y0, -dep), at(f, s0, y0, -dep), [0, 1, 0]);
  const G = q.lit ? B.lit : B.glass, g = -dep + 0.05;
  G.setColor(q.glass ?? '#4d5a63');
  G.face([[s0, y0], [s1, y0], ...arc.slice().reverse().map(([s, y]) => [s, y])].map(([s, y]) => at(f, s, y, g)), f.N);
  // frame: the outline of the arch as a thin band, bars
  D.setColor(q.frame ?? '#3b2a22');
  const t = 0.07, o = g + 0.03, hw = (s1 - s0) / 2, inn = archPts(s0 + t, s1 - t, yS, rise - t, n, q.p ?? 2);
  for (let i = 0; i < n; i++) quad(D, at(f, arc[i][0], arc[i][1], o), at(f, arc[i + 1][0], arc[i + 1][1], o), at(f, inn[i + 1][0], inn[i + 1][1], o), at(f, inn[i][0], inn[i][1], o), f.N);
  const bar = (a, b, ya, yb) => quad(D, at(f, a, ya, o), at(f, b, ya, o), at(f, b, yb, o), at(f, a, yb, o), f.N);
  bar(s0, s0 + t, y0, yS); bar(s1 - t, s1, y0, yS);
  if (!q.door) bar(s0, s1, y0, y0 + t);
  for (const m of q.mull ?? []) bar(m - t / 2, m + t / 2, y0, yS + rise * Math.sqrt(Math.max(0, 1 - ((m - c) / hw) ** 2)) - t);
  if (q.tr != null) bar(s0, s1, q.tr - t / 2, q.tr + t / 2);
  if (q.sill) { D.setColor(q.sill); box(D, f, s0 - 0.12, s1 + 0.12, y0 - 0.1, y0, 0, 0.1, 'ftlr'); }
}

// a colossal column standing on (x, y0, z): base, swelling shaft, bell capital with an abacus and four volutes
export function column(D, x, z, y0, h, r, col, ang = 0) {
  D.setColor(col);
  const bh = r * 0.55, ch = r * 1.15, sh = h - bh - ch;
  D.lathe([[r * 1.25, y0], [r * 1.25, y0 + bh * 0.4], [r * 1.12, y0 + bh * 0.55], [r * 1.12, y0 + bh * 0.75], [r * 1.0, y0 + bh]], 10, x, z);
  const y1 = y0 + bh;
  D.lathe([[r, y1], [r * 1.02, y1 + sh * 0.3], [r * 1.0, y1 + sh * 0.6], [r * 0.9, y1 + sh]], 10, x, z);
  const y2 = y1 + sh;
  D.lathe([[r * 0.9, y2], [r * 1.0, y2 + ch * 0.2], [r * 1.18, y2 + ch * 0.55], [r * 1.3, y2 + ch * 0.85]], 10, x, z);
  D.with(M4(x, y2 + ch * 0.85, z, ang), (b) => {
    b.box(-r * 1.42, 0, -r * 1.42, r * 1.42, ch * 0.18, r * 1.42, 63);
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) b.box(sx * r * 1.0 - 0.14, -ch * 0.4, sz * r * 1.0 - 0.14, sx * r * 1.0 + 0.14, 0.0, sz * r * 1.0 + 0.14, 63);
  });
}

// a stepped cornice over s0..s1 at y..y+h: the back at o0, the top tier's front at o1, the lower tiers stepping back
export function cornice(D, f, s0, s1, y, h, o0, o1, col, d = 0.7) {
  D.setColor(col);
  box(D, f, s0, s1, y, y + h * 0.28, o0, o1 - d * 0.65, 'ftu');
  box(D, f, s0, s1, y + h * 0.28, y + h * 0.5, o0, o1 - d * 0.4, 'ftu');
  box(D, f, s0, s1, y + h * 0.5, y + h * 0.8, o0, o1 - d * 0.1, 'ftu');
  box(D, f, s0 - 0.04, s1 + 0.04, y + h * 0.8, y + h, o0, o1, 'ftu');
}
export function dentils(D, f, s0, s1, y, h, o, col, step = 0.42) {
  D.setColor(col);
  const n = Math.max(1, Math.round((s1 - s0) / step)), w = (s1 - s0) / n;
  for (let i = 0; i < n; i++) box(D, f, s0 + i * w + w * 0.2, s0 + (i + 1) * w - w * 0.2, y, y + h, o - 0.12, o, 'fu');
}

// a sloped moulding of thickness th, outer face at o1 (the front), from [s, y] to [s, y]
export function rake(D, f, p0, p1, th, o0, o1, col) {
  D.setColor(col);
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l; // up-left normal of the run
  const up = ny < 0 ? -1 : 1, ax = nx * up, ay = ny * up; // the upper side's normal (in s, y)
  const A = (s, y, o) => at(f, s, y, o), P0 = [p0[0], p0[1]], P1 = [p1[0], p1[1]], Q0 = [p0[0] + ax * th, p0[1] + ay * th], Q1 = [p1[0] + ax * th, p1[1] + ay * th];
  quad(D, A(...P0, o1), A(...P1, o1), A(...Q1, o1), A(...Q0, o1), f.N);
  const nTop = [f.U[0] * ax, ay, f.U[2] * ax];
  quad(D, A(...Q0, o0), A(...Q1, o0), A(...Q1, o1), A(...Q0, o1), nTop);
  quad(D, A(...P0, o0), A(...P1, o0), A(...P1, o1), A(...P0, o1), neg(nTop));
}

// ------------------------------------------------------------------------------------------------ figures
const ring = (y, rx, rz, n = 12, dz = 0) => Array.from({ length: n }, (_, k) => { const a = (-k / n) * TAU; return [Math.cos(a) * rx, y, Math.sin(a) * rz + dz]; });
export const place = (dst, src, x, y, z, yaw = 0, k = 1) => put(dst, src, mapper(M4(x, y, z, yaw, k)));

// a standing robed woman, soles at y 0, crown at 1.8, facing +z; arms: hand positions are tubes, `pose` 0 down, 1 raised
export function robed(s, { pose = 0, crown = false } = {}) {
  const prof = [[0, 0.3, 0.26], [0.35, 0.27, 0.23], [0.8, 0.21, 0.18], [1.1, 0.19, 0.15], [1.28, 0.22, 0.14], [1.42, 0.18, 0.12], [1.5, 0.08, 0.08]];
  s.loft(prof.map(([y, rx, rz]) => ring(y, rx, rz, 12)), { cap0: true, cap1: false });
  s.ellipsoid([0, 1.64, 0.01], [0.1, 0.13, 0.11], 10, 7);
  if (crown) s.loft([ring(1.74, 0.1, 0.1, 8), ring(1.84, 0.12, 0.12, 8)], { cap0: true, cap1: true });
  for (const sx of [-1, 1]) {
    const hand = pose && sx > 0 ? [0.34, 1.75, 0.18] : [0.2 * sx, 0.95, 0.12];
    s.tube([[0.2 * sx, 1.4, 0], [0.27 * sx, 1.2, 0.04], hand], [0.045, 0.04, 0.035], 6, { caps: true });
  }
  return s;
}
export function seated(s) {
  s.loft([ring(0, 0.3, 0.36, 10, 0.1), ring(0.38, 0.27, 0.34, 10, 0.1), ring(0.52, 0.24, 0.3, 10, 0.05)], { cap0: true });
  s.loft([ring(0.5, 0.22, 0.15, 10), ring(0.85, 0.2, 0.13, 10), ring(1.0, 0.1, 0.08, 10)], { cap0: true });
  s.ellipsoid([0, 1.1, 0.01], [0.09, 0.115, 0.1], 8, 6);
  s.tube([[0.2, 0.9, 0], [0.26, 0.7, 0.18], [0.1, 0.62, 0.34]], [0.04, 0.036, 0.032], 6, { caps: true });
  s.tube([[-0.2, 0.9, 0], [-0.26, 0.7, 0.18], [-0.1, 0.62, 0.34]], [0.04, 0.036, 0.032], 6, { caps: true });
  return s;
}
export function lying(s) {
  // a draped reclining figure along +x: the legs and drapery low, the torso propped up at the far end, a head, an arm
  const ringX = (x, ry, rz, yc, n = 10) => Array.from({ length: n }, (_, k) => { const a = (-k / n) * TAU; return [x, yc + Math.sin(a) * ry, Math.cos(a) * rz]; });
  s.loft([ringX(0, 0.1, 0.14, 0.1), ringX(0.5, 0.2, 0.3, 0.2), ringX(1.1, 0.24, 0.36, 0.24), ringX(1.7, 0.26, 0.32, 0.26)], { cap0: true, cap1: false });
  s.ellipsoid([1.85, 0.5, 0], [0.26, 0.3, 0.24], 9, 6);
  s.ellipsoid([2.1, 0.88, 0.02], [0.1, 0.12, 0.1], 8, 6);
  s.tube([[1.95, 0.7, 0.18], [1.7, 0.5, 0.34], [1.45, 0.38, 0.3]], [0.045, 0.04, 0.036], 6, { caps: true });
  return s;
}
export function bust(s) {
  s.loft([ring(0, 0.2, 0.12, 10), ring(0.18, 0.21, 0.13, 10), ring(0.3, 0.12, 0.09, 10), ring(0.34, 0.06, 0.06, 10)], { cap0: true, cap1: true });
  s.ellipsoid([0, 0.5, 0.01], [0.085, 0.11, 0.095], 10, 7);
  return s;
}

// ------------------------------------------------------------------------------------------------ textures
const scaled = (t, m) => { t.repeat.set(1 / m, 1 / m); return t; }; // uv are in metres: the texture covers m metres
export const renderTex = (r, base = '#f3f0ea', n = 1400) => scaled(canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.28)' : 'rgba(80,66,52,0.07)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
}), 2.5);
// the plaza, 5 m a repeat: a 4 m field of light granite setts in running bond inside a 0.5 m band of darker ones
export const paveTex = (r) => canvasTex(512, 512, (c, w, h) => {
  const k = w / 5;
  c.fillStyle = '#6b665c'; c.fillRect(0, 0, w, h);
  const set = (x0, y0, x1, y1, base, sw, sh) => {
    for (let j = 0; y0 + j * sh < y1 - 1; j++) for (let i = -1; x0 + i * sw < x1; i++) {
      const x = x0 + i * sw + (j & 1) * sw / 2, v = base + (r() - 0.5) * 18;
      c.save(); c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip();
      c.fillStyle = `rgb(${v + 6 | 0},${v + 1 | 0},${v - 8 | 0})`; c.fillRect(x + 1, y0 + j * sh + 1, sw - 2, sh - 2); c.restore();
    }
  };
  set(0, 0, w, h, 104, k * 0.25, k * 0.125);
  set(k * 0.3, k * 0.3, w - k * 0.3, h - k * 0.3, 128, k * 0.5, k * 0.25);
  for (let q = 0; q < 5000; q++) { c.fillStyle = `rgba(${r() < 0.5 ? '70,64,58' : '255,250,240'},${0.05 + r() * 0.07})`; c.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
});
// Darvas house: cast stone in 0.9 x 1.0 m panels with joints, a green-blue ceramic button at the corners and a diamond
// motif in the middle of some; 2.7 m a repeat in both ways
export const castTex = (r) => scaled(canvasTex(512, 512, (c, w, h) => {
  c.fillStyle = '#c9c8c0'; c.fillRect(0, 0, w, h);
  for (let q = 0; q < 9000; q++) { c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(70,70,64,0.1)'; c.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  const cw = w / 3, ch = h / 3;
  c.strokeStyle = 'rgba(70,72,68,0.5)'; c.lineWidth = 2;
  for (let i = 0; i <= 3; i++) { c.beginPath(); c.moveTo(i * cw, 0); c.lineTo(i * cw, h); c.stroke(); c.beginPath(); c.moveTo(0, i * ch); c.lineTo(w, i * ch); c.stroke(); }
  const dot = (x, y, rr, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.arc(x - rr * 0.3, y - rr * 0.3, rr * 0.3, 0, TAU); c.fill(); };
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    dot(i * cw, j * ch, 7, r() < 0.5 ? '#3f8c82' : '#5aa398');
    if ((i + j) % 2 === 0) { // diamond motif at the panel centre
      const x = i * cw + cw / 2, y = j * ch + ch / 2;
      c.fillStyle = '#397f73'; c.beginPath(); c.moveTo(x, y - 20); c.lineTo(x + 9, y); c.lineTo(x, y + 20); c.lineTo(x - 9, y); c.closePath(); c.fill();
      dot(x, y, 4, '#d6c27a');
    }
  }
}), 2.7);
// pale limestone for the portico, cornices and plinths (the vertex colour tints it): a fine speckle, no joints
export const limeTex = (r) => scaled(canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = '#efebe1'; c.fillRect(0, 0, w, h);
  for (let q = 0; q < 2600; q++) { c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(110,100,84,0.08)'; c.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
}), 2.5);
export const zincTex = () => scaled(canvasTex(256, 64, (g, w, h) => {
  g.fillStyle = '#d9dbdc'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) { const x = i * 64; g.fillStyle = '#8f9396'; g.fillRect(x, 0, 3, h); g.fillStyle = '#f4f5f5'; g.fillRect(x + 3, 0, 2, h); }
}), 2);
export const leafTex = (r) => scaled(canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = '#5f7550'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    const v = r(); c.fillStyle = v < 0.4 ? 'rgba(25,40,20,0.55)' : v < 0.8 ? 'rgba(160,185,125,0.5)' : 'rgba(240,240,220,0.3)';
    c.beginPath(); c.ellipse(r() * w, r() * h, 2 + r() * 4, 1.5 + r() * 2.5, r() * PI, 0, TAU); c.fill();
  }
}), 1.5);
export const signTex = (text) => canvasTex(2048, 128, (c, w, h) => {
  c.fillStyle = '#efe6d4'; c.fillRect(0, 0, w, h);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = '600 82px "Georgia", "Times New Roman", serif';
  const sc = Math.min(1, (w - 60) / (c.measureText(text).width || w));
  c.save(); c.translate(w / 2, h / 2 + 4); c.scale(sc, 1);
  c.fillStyle = '#3c3228'; c.fillText(text, 0, 0); c.restore();
}, { repeat: false });

// ------------------------------------------------------------------------------------------------ roofs
// a convex ring [[x, z], ...] moved in by d along every edge (corners at the offset lines' intersections)
export function inset(P, d) {
  const n = P.length;
  let A = 0; for (let i = 0; i < n; i++) { const q = P[(i + 1) % n]; A += P[i][0] * q[1] - q[0] * P[i][1]; }
  const sg = A > 0 ? 1 : -1;
  const lines = P.map((p, i) => { // offset line i: through P[i] moved toward the inside, along the edge
    const q = P[(i + 1) % n], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, ex = (q[0] - p[0]) / l, ez = (q[1] - p[1]) / l;
    return { x: p[0] - sg * ez * d, z: p[1] + sg * ex * d, ex, ez };
  });
  return P.map((_, i) => {
    const a = lines[(i + n - 1) % n], b = lines[i], den = a.ex * b.ez - a.ez * b.ex;
    if (Math.abs(den) < 1e-6) return [b.x, b.z];
    const t = ((b.x - a.x) * b.ez - (b.z - a.z) * b.ex) / den;
    return [a.x + a.ex * t, a.z + a.ez * t];
  });
}
// an up-facing planar quad / polygon in the roof builder R
export function planeUp(R, pts) {
  const [a, b, c] = pts, u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  let n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
  const l = Math.hypot(...n) || 1; n = n.map((v) => v / l);
  if (n[1] < 0) n = n.map((v) => -v);
  return R.face(pts, n);
}
// a roof over the convex ring: tiers [[inset, y], ...] from the eaves up; the last tier is closed by a flat cap
export function mansard(R, ring, tiers, col) {
  R.setColor(col);
  const rings = tiers.map(([d, y]) => ({ y, P: d ? inset(ring, d) : ring }));
  for (let t = 0; t + 1 < rings.length; t++) {
    const a = rings[t], b = rings[t + 1], n = ring.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      planeUp(R, [[a.P[i][0], a.y, a.P[i][1]], [a.P[j][0], a.y, a.P[j][1]], [b.P[j][0], b.y, b.P[j][1]], [b.P[i][0], b.y, b.P[i][1]]]);
    }
  }
  const top = rings.at(-1);
  R.fill(top.P, [], top.y, true);
  return top;
}
