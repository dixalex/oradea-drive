// OWNER: oradea. Shared helpers of the Casa Minunată site (../casaminunata.js): the building's own frame, quads with their own
// normals, gable roofs, ground-draped polygons, small furniture and the canvas textures. Not a site module.
//   O, ANG, toMap(u, v), toLoc(x, z)   the frame: origin the OSM outline's north corner, u along its long north wall, v toward Strada
//                                       Traian Lalescu (the outline is square to the street: 13.3 degrees off the map's x axis)
//   LOT                                 the fenced garden and the yard, in (u, v)
//   sq(D, P, N, uv?)                    quad of four 3D points with a normal (or four normals); winding follows the normals
//   gable(W, R, o)                      a gabled roof on a rectangle: two slopes (R), the end triangles (W), soffits
//   drape(M, gy, poly, lift, cell, rep) polygon laid on the ground, clipped to cells so it follows the terrain
//   strip(M, gy, pts, w, lift, rep)     a ribbon along a polyline, draped
//   blob(D, x, y, z, r, col)            a small ellipsoid (a shrub, a flower head)
//   textures: plasterTex, roofTex, grainTex, signAtlas
import * as THREE from 'three';
import { canvasTex } from '../../../cherkasy/sculpt.js';

export const PI = Math.PI, TAU = PI * 2;

export const O = [-2208.9, -2132.4], ANG = 13.3187 * PI / 180, CA = Math.cos(ANG), SA = Math.sin(ANG);
export const toMap = (u, v) => [O[0] + u * CA - v * SA, O[1] + u * SA + v * CA];
export const toLoc = (x, z) => { const dx = x - O[0], dz = z - O[1]; return [dx * CA + dz * SA, -dx * SA + dz * CA]; };
// the garden between the building's east wall and the church's lawn, the plaza and the yard: what generated trees keep off
export const LOT = [[-6, -3], [54, -3], [54, 50], [-6, 50]];
export const inLot = (u, v) => u > LOT[0][0] && u < LOT[1][0] && v > LOT[0][1] && v < LOT[2][1];

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
const norm = (v) => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

// A gabled roof on the rectangle u0..u1 x v0..v1 (local frame, y absolute). o { ridge: 'u' | 'v' (the ridge runs along that axis),
// eave, top (heights), over: [along the ridge, across it] eave overhang, colR, colW, ends: [low end, high end] get a gable triangle }.
// The slopes and their soffits go to R (uv: metres along the ridge x metres up the slope; the seams run down the slope), the triangles
// above the eave to W; the wall under each triangle is the caller's.
export function gable(W, R, { u0, u1, v0, v1, ridge = 'u', eave, top, over = [0.3, 0.4], colR, colW, ends = [true, true] }) {
  const along = ridge === 'u', a0 = along ? u0 : v0, a1 = along ? u1 : v1, cm = (along ? v0 + v1 : u0 + u1) / 2;
  const half = along ? (v1 - v0) / 2 : (u1 - u0) / 2, rise = top - eave, ov = over[1], ya = eave - rise * ov / half;
  const P = (s, c, y) => (along ? [s, y, c] : [c, y, s]); // s along the ridge, c across it
  const s0 = a0 - over[0], s1 = a1 + over[0], len = s1 - s0, L = Math.hypot(half + ov, top - ya), g = rise / half;
  R.setColor(colR);
  for (const side of [-1, 1]) {
    const cE = cm + side * (half + ov), n2 = norm([-side * g, 1]), N = along ? [0, n2[1], n2[0]] : [n2[0], n2[1], 0];
    const uvs = [[0, 0], [len / 2, 0], [len / 2, L / 2], [0, L / 2]];
    sq(R, [P(s0, cE, ya), P(s1, cE, ya), P(s1, cm, top), P(s0, cm, top)], N, uvs);
    sq(R, [P(s0, cE, ya - 0.05), P(s1, cE, ya - 0.05), P(s1, cm, top - 0.05), P(s0, cm, top - 0.05)], N.map((n) => -n), uvs);
  }
  W.setColor(colW);
  ends.forEach((on, i) => {
    if (!on) return;
    const s = i ? a1 : a0, nrm = along ? [i ? 1 : -1, 0, 0] : [0, 0, i ? 1 : -1];
    sq(W, [P(s, cm - half, eave), P(s, cm + half, eave), P(s, cm, top), P(s, cm, top)], nrm, [[0, eave / 3], [2 * half / 3, eave / 3], [half / 3, top / 3], [half / 3, top / 3]]);
  });
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
// a polygon (map metres) laid on the terrain: cut into cells of `cell` m, each vertex lifted onto gy(x, z); uv in metres / rep
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
export const blob = (D, x, y, z, r, col, k = 0.8) => { D.setColor(col); D.ellipsoid([x, y + r * k * 0.7, z], [r, r * k, r], 6, 3); };

// ------------------------------------------------------------------------------------------------ textures
const noise = (g, r, w, h, n, a = 0.05, hi = '255,255,255', lo = '60,55,50') => {
  for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(${hi},${a})` : `rgba(${lo},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5); }
};
// rendered wall, the hue comes from the vertex colour (2.5 m a repeat)
export const plasterTex = (r) => canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f6f4ef'; g.fillRect(0, 0, w, h); noise(g, r, w, h, 2200, 0.08); });
// standing-seam sheet, seams every 0.5 m across the slope (u across, v along; 2 m a repeat)
export const roofTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#e9ebec'; g.fillRect(0, 0, w, h); noise(g, r, w, h, 1200, 0.06, '255,255,255', '40,50,60');
  for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(40,52,64,0.5)'; g.fillRect(i * 64, 0, 3, h); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(i * 64 + 3, 0, 2, h); }
});
// lawn and paving share it: fine noise, the hue comes from the vertex colour (4 m a repeat)
export const grainTex = (r) => canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, h); noise(g, r, w, h, 5200, 0.15, '255,255,255', '60,60,60'); });

// The signs, one atlas (1024 x 512): the name plate «Casa Minunată» on the top 5:1 band (a rainbow over a flowered house, the
// handwriting of the foundation's own mark), and the «RECEPȚIE» plate on the lower band; each with a gutter, so no mip bleeds.
//   regions: NAME = [u0, v0, u1, v1] in canvas fractions (v down), DESK likewise
export const NAME = [0, 0, 1, 0.38], DESK = [0, 0.5, 0.5, 0.676];
export const signAtlas = (r) => canvasTex(1024, 512, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  // ---- the name plate: 1024 x 194 px, white, a thin teal frame
  const ph = Math.round(h * NAME[3]);
  g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, w, ph);
  g.strokeStyle = '#2f8f86'; g.lineWidth = 8; g.strokeRect(5, 5, w - 10, ph - 10);
  // the mark: a rainbow over a small house covered in flowers
  const cx = 150, base = ph - 22;
  [['#2745a5', 98], ['#d93a3a', 84], ['#f2a23a', 70], ['#f6d842', 56]].forEach(([c, rr]) => { g.strokeStyle = c; g.lineWidth = 12; g.beginPath(); g.arc(cx, base + 4, rr, PI, TAU); g.stroke(); });
  g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(cx - 34, base); g.lineTo(cx - 34, base - 44); g.lineTo(cx, base - 76); g.lineTo(cx + 34, base - 44); g.lineTo(cx + 34, base); g.closePath(); g.fill();
  g.strokeStyle = '#33383d'; g.lineWidth = 3; g.stroke();
  [[-18, -48, '#2b4fb8'], [12, -56, '#d93a3a'], [-6, -30, '#f6d842'], [20, -34, '#2b4fb8'], [-22, -14, '#d93a3a'], [10, -12, '#f2a23a']].forEach(([dx, dy, c]) => {
    g.fillStyle = c; g.beginPath(); g.arc(cx + dx, base + dy, 8, 0, TAU); g.fill(); g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(cx + dx, base + dy, 2.6, 0, TAU); g.fill();
  });
  g.fillStyle = '#ffffff'; g.strokeStyle = '#33383d'; g.beginPath(); g.arc(cx + 2, base - 14, 11, PI, TAU); g.lineTo(cx + 13, base); g.lineTo(cx - 9, base); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#4f9a3b'; g.fillRect(cx - 52, base, 106, 6);
  // the name in a handwritten face
  g.fillStyle = '#26303a'; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.font = '700 96px "Chalkboard SE", "Comic Sans MS", "Comic Neue", "Marker Felt", cursive, sans-serif';
  g.fillText('Casa', 292, ph * 0.5 - 4); g.fillText('Minunată', 292 + g.measureText('Casa ').width, ph * 0.5 + 6);
  // ---- the desk plate: 512 x 62 px, a white plate with dark capitals in a timber edge, as in the courtyard photograph
  const y0 = Math.round(h * DESK[1]), pw = Math.round(w * DESK[2]), pH = Math.round(h * (DESK[3] - DESK[1]));
  g.fillStyle = '#3a271b'; g.fillRect(0, y0, pw, pH); g.fillStyle = '#f4f2ec'; g.fillRect(6, y0 + 6, pw - 12, pH - 12);
  g.fillStyle = '#2a2420'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 50px Helvetica, Arial, sans-serif';
  g.fillText('RECEPȚIE', pw / 2, y0 + pH / 2 + 3);
  void r;
}, { repeat: false, aniso: 8 });

export const mat = (o) => new THREE.MeshStandardMaterial(o);
