// OWNER: oradea. Shared helpers of the Baptist churches site (../baptist.js): curved wall bands with smooth normals, quads
// with their own normals, ground-draped polygons, small street furniture and the canvas textures. Not a site module.
//   sq(D, P, N, uv?)                    quad of four 3D points P with a normal (or four normals); winding follows the normals
//   arcPts(c, r, a0, a1, n)             [[x, z]] along a circle, angles in radians (map frame: 0 -> +x, pi/2 -> +z)
//   band(D, pts, y0, y1, o?)            vertical wall band along a polyline [[x, z]]: o { out (+1: outside on the right of
//                                       travel), closed, uvM [mx, my], smooth, col, s0 } -> arc length
//   fan(D, pts, y, up?, uvM?)           flat polygon at height y (earcut), uv in metres / uvM
//   annulus(D, c, r0, r1, a0, a1, y, n, up?, uvM?)   a flat ring sector at height y
//   drape(M, gy, poly, lift, cell, rep) polygon laid on the ground (clipped to cells of `cell` m), uv in metres / rep
//   strip(M, gy, pts, w, lift, rep)     a ribbon of width w along a polyline, draped
//   disc(cx, cz, r, n), ellipse(...)    polygons
//   lamp(D, x, y, z, o?)                a pole with a dome lamp (the mushroom lamps of the boulevard)
//   shrub(D, x, y, z, r, col)           a clipped bush (ellipsoid)
//   post(D, x, y, z, w, h, col)         a square post with a cap
//   cross3d(D, x, y, z, yaw, h, w, col) a steel lattice cross
//   textures: panelTex, plasterTex, tileTex, gravelTex, lawnTex, leafTex, payTex, zincTex, perfTex, boardTex, standTex, signTex
import * as THREE from 'three';
import { canvasTex } from '../../../cherkasy/sculpt.js';

export const PI = Math.PI, TAU = PI * 2;
export const rad = (d) => d * PI / 180;

// ------------------------------------------------------------------------------------------------ geometry
export function sq(D, P, N, uv) {
  const first = D.v, one = typeof N[0] === 'number';
  for (let k = 0; k < 4; k++) { const n = one ? N : N[k]; D.vert(P[k][0], P[k][1], P[k][2], n[0], n[1], n[2], uv ? uv[k][0] : 0, uv ? uv[k][1] : 0); }
  const e1 = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]], e2 = [P[2][0] - P[0][0], P[2][1] - P[0][1], P[2][2] - P[0][2]];
  let cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
  if (Math.hypot(...cr) < 1e-9) { const e3 = [P[3][0] - P[0][0], P[3][1] - P[0][1], P[3][2] - P[0][2]]; cr = [e2[1] * e3[2] - e2[2] * e3[1], e2[2] * e3[0] - e2[0] * e3[2], e2[0] * e3[1] - e2[1] * e3[0]]; }
  const avg = one ? N : [0, 1, 2].map((i) => N[0][i] + N[1][i] + N[2][i] + N[3][i]);
  if (cr[0] * avg[0] + cr[1] * avg[1] + cr[2] * avg[2] >= 0) D.quad(first, first + 1, first + 2, first + 3);
  else D.quad(first, first + 3, first + 2, first + 1);
}

export const arcPts = (c, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]; });
export const disc = (cx, cz, r, n = 28) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * TAU) * r, cz + Math.sin(i / n * TAU) * r]);
export const ellipse = (cx, cz, rx, rz, n = 28, rot = 0) => Array.from({ length: n }, (_, i) => { const a = i / n * TAU, x = Math.cos(a) * rx, z = Math.sin(a) * rz; return [cx + x * Math.cos(rot) - z * Math.sin(rot), cz + x * Math.sin(rot) + z * Math.cos(rot)]; });

export function band(D, pts, y0, y1, { out = 1, closed = false, uvM = [2.5, 2.5], smooth = true, col = null, s0 = 0, soft = 0.64 } = {}) {
  if (col) D.setColor(col);
  const n = pts.length, m = closed ? n : n - 1, seg = [];
  for (let i = 0; i < m; i++) {
    const a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1e-9;
    seg.push({ a, b, L, nx: out * dz / L, nz: -out * dx / L });
  }
  const vn = (i, end) => {
    const s = seg[i];
    if (!smooth) return [s.nx, s.nz];
    if (!closed && ((end && i === seg.length - 1) || (!end && i === 0))) return [s.nx, s.nz];
    const o = seg[end ? (i + 1) % seg.length : (i + seg.length - 1) % seg.length];
    if (s.nx * o.nx + s.nz * o.nz < soft) return [s.nx, s.nz];
    const x = s.nx + o.nx, z = s.nz + o.nz, l = Math.hypot(x, z) || 1;
    return [x / l, z / l];
  };
  let s = s0;
  seg.forEach((g, i) => {
    const na = vn(i, 0), nb = vn(i, 1);
    sq(D, [[g.a[0], y0, g.a[1]], [g.b[0], y0, g.b[1]], [g.b[0], y1, g.b[1]], [g.a[0], y1, g.a[1]]],
      [[na[0], 0, na[1]], [nb[0], 0, nb[1]], [nb[0], 0, nb[1]], [na[0], 0, na[1]]],
      [[s / uvM[0], y0 / uvM[1]], [(s + g.L) / uvM[0], y0 / uvM[1]], [(s + g.L) / uvM[0], y1 / uvM[1]], [s / uvM[0], y1 / uvM[1]]]);
    s += g.L;
  });
  return s - s0;
}

export function fan(D, pts, y, up = true, uvM = [2.5, 2.5]) {
  const first = D.v;
  D.fill(pts, [], y, up);
  const a = D.buf.a;
  for (let v = first; v < D.v; v++) { const o = v * 11; a[o + 6] = a[o] / uvM[0]; a[o + 7] = a[o + 2] / uvM[1]; }
}

export function annulus(D, c, r0, r1, a0, a1, y, n, up = true, uvM = [2.5, 2.5]) {
  for (let i = 0; i < n; i++) {
    const s = a0 + (a1 - a0) * i / n, e = a0 + (a1 - a0) * (i + 1) / n;
    const P = [[Math.cos(s) * r0, Math.sin(s) * r0], [Math.cos(e) * r0, Math.sin(e) * r0], [Math.cos(e) * r1, Math.sin(e) * r1], [Math.cos(s) * r1, Math.sin(s) * r1]].map(([x, z]) => [c[0] + x, y, c[1] + z]);
    sq(D, P, [0, up ? 1 : -1, 0], P.map((p) => [p[0] / uvM[0], p[2] / uvM[1]]));
  }
}

// Sutherland-Hodgman against an axis-aligned cell
function clipRect(poly, x0, x1, z0, z1) {
  let out = poly;
  for (const [ax, sg, c] of [[0, 1, x0], [0, -1, x1], [1, 1, z0], [1, -1, z1]]) {
    const inp = out; out = [];
    inp.forEach((a, i) => {
      const b = inp[(i + 1) % inp.length], da = sg * (a[ax] - c), db = sg * (b[ax] - c);
      if (da >= 0) out.push(a);
      if ((da >= 0) !== (db >= 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    });
    if (!out.length) break;
  }
  return out;
}
export function drape(M, gy, poly, lift, cell = 8, rep = 4) {
  const xs = poly.map((p) => p[0]), zs = poly.map((p) => p[1]);
  for (let x0 = Math.floor(Math.min(...xs) / cell) * cell; x0 < Math.max(...xs); x0 += cell) {
    for (let z0 = Math.floor(Math.min(...zs) / cell) * cell; z0 < Math.max(...zs); z0 += cell) {
      const c = clipRect(poly, x0, x0 + cell, z0, z0 + cell);
      if (c.length < 3) continue;
      const first = M.v; M.fill(c, [], 0, true);
      for (let v = first; v < M.v; v++) { const o = v * 11, a = M.buf.a; a[o + 1] = gy(a[o], a[o + 2]) + lift; a[o + 6] = a[o] / rep; a[o + 7] = a[o + 2] / rep; }
    }
  }
}
export function strip(M, gy, pts, w, lift, rep = 3) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az) || 1e-9, n = Math.max(1, Math.ceil(L / 4)), nx = -(bz - az) / L * w / 2, nz = (bx - ax) / L * w / 2;
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n, x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0, x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1;
      const first = M.v; M.fill([[x0 - nx, z0 - nz], [x1 - nx, z1 - nz], [x1 + nx, z1 + nz], [x0 + nx, z0 + nz]], [], 0, true);
      for (let v = first; v < M.v; v++) { const o = v * 11, a = M.buf.a; a[o + 1] = gy(a[o], a[o + 2]) + lift; a[o + 6] = a[o] / rep; a[o + 7] = a[o + 2] / rep; }
    }
  }
}

// ------------------------------------------------------------------------------------------------ street furniture
export function lamp(D, x, y, z, { h = 4.6, pole = '#2b2d30', head = '#33363a', lampCol = '#fff2d2', glow = null } = {}) {
  D.setColor(pole); D.cyl(x, y, z, 0.1, 0.07, h, 6, false); D.cyl(x, y, z, 0.16, 0.16, 0.25, 6, true);
  D.setColor(head); D.lathe([[0.05, y + h - 0.05], [0.42, y + h - 0.02], [0.52, y + h + 0.12], [0.34, y + h + 0.3], [0.05, y + h + 0.34]], 10, x, z);
  if (glow) { glow.setColor(lampCol); glow.lathe([[0.04, y + h - 0.07], [0.36, y + h - 0.07], [0.04, y + h - 0.03]], 8, x, z); }
}
export function shrub(D, x, y, z, r, col, { k = 0.8, seg = 7, rings = 4 } = {}) { D.setColor(col); D.ellipsoid([x, y + r * k * 0.7, z], [r, r * k, r], seg, rings); }
export function post(D, x, y, z, w, h, col, cap = col) {
  D.setColor(col); D.box(x - w / 2, y, z - w / 2, x + w / 2, y + h, z + w / 2, 63 & ~8);
  D.setColor(cap); D.box(x - w * 0.62, y + h, z - w * 0.62, x + w * 0.62, y + h + 0.07, z + w * 0.62, 63 & ~8);
}
// a steel lattice cross standing at (x, y, z), its arms in the plane facing yaw
export function cross3d(D, x, y, z, yaw, h, w, col = '#d8dadb') {
  const c = Math.cos(yaw), s = Math.sin(yaw), P = (u, v) => [x + c * u, y + v, z + s * u];
  D.setColor(col);
  const T = (a, b, r) => D.tube(a, b, r, 4);
  const v0 = h * 0.28, v1 = h, vm = h * 0.72, a = w / 2, t = 0.26;
  for (const u of [-t / 2, t / 2]) T(P(u, v0), P(u, v1), 0.045);
  for (const k of [-1, 1]) for (const dv of [0, -t]) T(P(-a, vm + dv), P(a, vm + dv), 0.045);
  // diagonals along the long arm
  const n = 6;
  for (let i = 0; i < n; i++) { const va = v0 + (v1 - v0) * i / n, vb = v0 + (v1 - v0) * (i + 1) / n; T(P(i % 2 ? -t / 2 : t / 2, va), P(i % 2 ? t / 2 : -t / 2, vb), 0.025); }
  for (let i = 0; i < 4; i++) { const ua = -a + 2 * a * i / 4, ub = -a + 2 * a * (i + 1) / 4; T(P(ua, i % 2 ? vm : vm - t), P(ub, i % 2 ? vm - t : vm), 0.025); }
  T(P(0, v0 - 0.9), P(0, v0), 0.07);
}

// ------------------------------------------------------------------------------------------------ textures
const noise = (g, r, w, h, n, a = 0.05, hi = '255,255,255', lo = '60,55,50') => {
  for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(${hi},${a})` : `rgba(${lo},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5); }
};
// light grey rainscreen panels, 1.25 m wide by 2.5 m (one 2.5 m repeat holds two columns): hairline joints
export const panelTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#f1f2f2'; g.fillRect(0, 0, w, h);
  noise(g, r, w, h, 1200, 0.035);
  g.fillStyle = 'rgba(70,78,84,0.55)'; g.fillRect(0, 0, 2, h); g.fillRect(w / 2, 0, 2, h); g.fillRect(0, 0, w, 2);
  g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(2, 0, 1, h); g.fillRect(w / 2 + 2, 0, 1, h);
});
export const plasterTex = (r) => canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f3f1ec'; g.fillRect(0, 0, w, h); noise(g, r, w, h, 1800, 0.07); });
export const tileTex = (r) => canvasTex(256, 256, (g, w, h) => { // clay tiles, 1 m a repeat
  g.fillStyle = '#e9e0d8'; g.fillRect(0, 0, w, h);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) {
    const v = 214 + r() * 40, x = i * 43 + (j & 1 ? 21 : 0);
    g.fillStyle = `rgb(${v | 0},${(v - 8) | 0},${(v - 12) | 0})`; g.fillRect(x + 2, j * 64 + 2, 39, 60);
    g.fillStyle = 'rgba(50,20,10,0.28)'; g.fillRect(x + 2, j * 64 + 54, 39, 8);
  }
});
export const gravelTex = (r) => canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#d5cfc2'; g.fillRect(0, 0, w, h); noise(g, r, w, h, 4500, 0.16, '255,250,240', '70,64,56'); });
export const lawnTex = (r) => canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#6f9e4a'; g.fillRect(0, 0, w, h); noise(g, r, w, h, 4000, 0.16, '190,225,120', '30,70,24'); });
export const leafTex = (r) => canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#9ab87d'; g.fillRect(0, 0, w, h); noise(g, r, w, h, 1400, 0.22, '230,255,190', '20,50,20'); });
// pinkish pavers with cream bands (the Emanuel forecourt), 4 m a repeat
export const payTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#cdb8a8'; g.fillRect(0, 0, w, h);
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const v = r() * 22 - 11; g.fillStyle = `rgba(${v > 0 ? '255,235,215' : '90,60,45'},${Math.abs(v) / 90})`; g.fillRect(i * 16, j * 16, 16, 16); }
  g.fillStyle = 'rgba(70,50,40,0.18)'; for (let k = 0; k <= 16; k++) { g.fillRect(k * 16, 0, 1, h); g.fillRect(0, k * 16, w, 1); }
  g.fillStyle = 'rgba(226,212,170,0.6)'; g.fillRect(0, 96, w, 14); g.fillRect(0, 208, w, 8);
});
// dark graphite zinc with diagonal standing seams (BBSO), 3 m a repeat
export const zincTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#585d63'; g.fillRect(0, 0, w, h);
  noise(g, r, w, h, 1500, 0.06, '210,215,220', '10,12,14');
  g.strokeStyle = 'rgba(210,216,222,0.55)'; g.lineWidth = 1.6;
  for (let k = -2; k < 5; k++) { g.beginPath(); g.moveTo(k * 64, h); g.lineTo(k * 64 + h * 0.34, 0); g.stroke(); }
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1.4;
  for (let k = -2; k < 5; k++) { g.beginPath(); g.moveTo(k * 64 + 3, h); g.lineTo(k * 64 + 3 + h * 0.34, 0); g.stroke(); }
});
// white perforated sheet (the BBSO ribbons)
export const perfTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#f2f3f2'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(95,102,108,0.55)';
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { g.beginPath(); g.arc(i * 8 + (j & 1 ? 4 : 0) + 2, j * 8 + 2, 1.7, 0, TAU); g.fill(); }
});
// board-marked grey concrete, 3 m a repeat
export const boardTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#b3b5b4'; g.fillRect(0, 0, w, h); noise(g, r, w, h, 2200, 0.09);
  for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(40,44,46,${0.07 + r() * 0.07})`; g.fillRect(0, k * 18 + r() * 4, w, 1.5); }
});
// dark graphite paving slabs (the BBSO forecourt), 4 m a repeat: 0.5 m slabs with tonal variation
export const slabTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#7b7f84'; g.fillRect(0, 0, w, h);
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { const v = r() * 30 - 15; g.fillStyle = `rgba(${v > 0 ? '210,215,220' : '20,24,28'},${Math.abs(v) / 100})`; g.fillRect(i * 32, j * 32, 32, 32); }
  g.fillStyle = 'rgba(25,28,32,0.35)'; for (let k = 0; k <= 8; k++) { g.fillRect(k * 32, 0, 1, h); g.fillRect(0, k * 32, w, 1); }
});
// standing-seam sheet roof, 2 m a repeat
export const standTex = () => canvasTex(256, 64, (g, w, h) => {
  g.fillStyle = '#e4e6e8'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) { g.fillStyle = '#8f9498'; g.fillRect(i * 64, 0, 3, h); g.fillStyle = '#fff'; g.fillRect(i * 64 + 3, 0, 2, h); }
});
// the lettering: white letters on transparent, alpha-tested (a 4:1 plate)
export const signTex = (text, { font = 'bold 150px Helvetica, Arial, sans-serif', w = 1024, h = 256 } = {}) => canvasTex(w, h, (g) => {
  g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 8);
}, { repeat: false });

export const mat = (o) => new THREE.MeshStandardMaterial(o);
