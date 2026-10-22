// OWNER: oradea. Shared helpers of the BSVO site (../bsvo.js): the church's frame, quads and triangles with their own normals, the hipped
// roof, ground-draped polygons, small furniture and the canvas textures. Not a site module.
//   O, ANG, CA, SA, toMap(u, v), toLoc(x, z)   the frame: origin the OSM outline's north-west corner, u east along the long north wall,
//                                              v south into the building (the outline is 3 degrees off the map's x axis)
//   sq(D, P, N, uv?)                           quad of four 3D points with a normal (or four normals); winding follows the normals
//   hip(R, o)                                  a hipped roof on a rectangle: two long slopes and two hip triangles, uv in metres
//   drape(M, gy, poly, lift, cell, rep)        polygon (map metres) laid on the ground, clipped to cells so it follows the terrain
//   strip(M, gy, pts, w, lift, rep)            a ribbon along a map polyline, draped
//   blob(D, x, y, z, r, col, k?)               a small ellipsoid (a shrub)
//   textures: plasterTex, tileTex, grainTex, boardAtlas (+ NAME / MESH / PSIGN regions and the emissive twin)
import * as THREE from 'three';
import { canvasTex } from '../../../cherkasy/sculpt.js';

export const PI = Math.PI, TAU = PI * 2;

export const O = [-2836.7, -952.6], ANG = Math.atan2(-2.3, 43.4), CA = Math.cos(ANG), SA = Math.sin(ANG);
export const toMap = (u, v) => [O[0] + u * CA - v * SA, O[1] + u * SA + v * CA];
export const toLoc = (x, z) => { const dx = x - O[0], dz = z - O[1]; return [dx * CA + dz * SA, -dx * SA + dz * CA]; };

export function sq(D, P, N, uv) {
  const first = D.v, one = typeof N[0] === 'number';
  for (let k = 0; k < 4; k++) { const n = one ? N : N[k]; D.vert(P[k][0], P[k][1], P[k][2], n[0], n[1], n[2], uv ? uv[k][0] : 0, uv ? uv[k][1] : 0); }
  const e1 = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]], e2 = [P[2][0] - P[0][0], P[2][1] - P[0][1], P[2][2] - P[0][2]];
  const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
  const avg = one ? N : [0, 1, 2].map((i) => N[0][i] + N[1][i] + N[2][i] + N[3][i]);
  if (cr[0] * avg[0] + cr[1] * avg[1] + cr[2] * avg[2] >= 0) D.quad(first, first + 1, first + 2, first + 3);
  else D.quad(first, first + 3, first + 2, first + 1);
}
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const unit = (v) => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

// a flat triangle, the normal from its corners, flipped to face up (or out: `up` false gives the opposite)
function tri3(D, a, b, c, uv) {
  let n = unit(cross(sub(b, a), sub(c, a)));
  const flip = n[1] < 0;
  if (flip) n = n.map((q) => -q);
  const first = D.v;
  [a, b, c].forEach((p, k) => D.vert(p[0], p[1], p[2], n[0], n[1], n[2], uv?.[k][0] ?? 0, uv?.[k][1] ?? 0));
  if (flip) D.tri(first, first + 2, first + 1); else D.tri(first, first + 1, first + 2);
}

// A hipped roof on the rectangle u0..u1 x v0..v1 (local frame, y absolute), the ridge along u: the ridge runs from u0 + half to u1 - half
// (the hips are 45 degrees). o { eave, top (heights), over (eave overhang), col }. uv: metres along the eave x metres up the slope.
export function hip(R, { u0, u1, v0, v1, eave, top, over = 0.45, col }) {
  const half = (v1 - v0) / 2, cm = (v0 + v1) / 2, rise = top - eave, g = rise / half, ya = eave - g * over, o = over;
  const slope = Math.hypot(half + o, top - ya), hp = half + o;
  R.setColor(col);
  const a = [u0 - o, ya, v0 - o], b = [u1 + o, ya, v0 - o], c = [u1 + o, ya, v1 + o], d = [u0 - o, ya, v1 + o];
  const r0 = [u0 + half, top, cm], r1 = [u1 - half, top, cm], L = u1 - u0 + 2 * o;
  sq(R, [a, b, r1, r0], unit([0, hp, -rise - g * o]).map((q, i) => (i === 2 ? -Math.abs(q) : q)), [[0, 0], [L, 0], [L - half - o, slope], [half + o, slope]]);
  sq(R, [d, c, r1, r0], unit([0, hp, rise + g * o]).map((q, i) => (i === 2 ? Math.abs(q) : q)), [[0, 0], [L, 0], [L - half - o, slope], [half + o, slope]]);
  tri3(R, a, d, r0, [[0, 0], [2 * hp, 0], [hp, slope]]);
  tri3(R, b, c, r1, [[0, 0], [2 * hp, 0], [hp, slope]]);
  return { ya, ridge: [r0, r1], half };
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
export const blob = (D, x, y, z, r, col, k = 0.8) => { D.setColor(col); D.ellipsoid([x, y + r * k * 0.7, z], [r, r * k, r], 6, 4); };

// ------------------------------------------------------------------------------------------------ textures
const noise = (g, r, w, h, n, a = 0.05, hi = '255,255,255', lo = '60,55,50') => {
  for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(${hi},${a})` : `rgba(${lo},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5); }
};
// weathered render, the hue comes from the vertex colour (2.5 m a repeat): fine speckle and a few damp streaks
export const plasterTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#f4f4f2'; g.fillRect(0, 0, w, h); noise(g, r, w, h, 2600, 0.08);
  for (let i = 0; i < 16; i++) { g.fillStyle = `rgba(90,85,75,${0.02 + r() * 0.035})`; g.fillRect(r() * w, r() * h * 0.4, 4 + r() * 22, 20 + r() * 90); }
});
// profiled metal tile, three ribs across a metre and three courses (uv in metres along the eave x up the slope); the rust-brown hue
// comes from the vertex colour, each sheet varies a little in tone
export const tileTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#d9cdc6'; g.fillRect(0, 0, w, h);
  const cw = w / 3, ch = h / 3;
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
    const x = i * cw, y = j * ch, v = 205 + r() * 50;
    g.fillStyle = `rgb(${v | 0},${(v - 6) | 0},${(v - 10) | 0})`; g.fillRect(x, y, cw, ch);
    g.fillStyle = 'rgba(255,235,220,0.22)'; g.fillRect(x + 4, y, cw * 0.32, ch);           // the rib's lit flank
    g.fillStyle = 'rgba(30,10,4,0.34)'; g.fillRect(x + cw * 0.62, y, cw * 0.34, ch);       // and its shaded one
    g.fillStyle = 'rgba(30,10,4,0.4)'; g.fillRect(x, y + ch - 7, cw, 7);                    // the step down to the next course
    g.fillStyle = 'rgba(255,235,220,0.18)'; g.fillRect(x, y, cw, 3);
  }
  noise(g, r, w, h, 500, 0.08, '255,240,225', '30,10,0');
});
// concrete slab, paving, gravel and lawn share it: fine noise, a few cracks; the hue comes from the vertex colour (4 m a repeat)
export const grainTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, h); noise(g, r, w, h, 5200, 0.15, '255,255,255', '60,60,60');
  g.strokeStyle = 'rgba(70,70,70,0.16)'; g.lineWidth = 1;
  for (let i = 0; i < 5; i++) { g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); }
});

// The board atlas (1024 x 1024, RGBA, drawn once): the church's lettering, a panel of welded mesh, the blue «P» plate.
//   NAME = [u0, v0, u1, v1] canvas fractions (v down): the mountain with its cross over «BISERICA BAPTISTĂ» / «STÂNCA VEACURILOR», dark
//   navy letters on a clear ground (the wall shows through: the lettering is painted on it); MESH: one 2.5 x 2.0 m panel of 5 x 10 cm wire
//   (clear gaps; an alpha test cuts them); PSIGN: the parking plate. The emissive twin carries only the lettering, for the night.
export const NAME = [0, 0, 1, 0.3], MESH = [0, 0.34, 0.5, 0.74], PSIGN = [0.52, 0.34, 0.72, 0.54];
const navy = '#1f2b4a';
function mountain(g, x, y, w, h, fill) { // the BSVO mark: a range of peaks with a cross on the left-centre summit, facets cut clear
  const P = (a, b) => [x + a * w, y + b * h];
  g.fillStyle = fill; g.beginPath();
  [P(0, 1), P(0.06, 0.88), P(0.17, 0.78), P(0.31, 0.62), P(0.40, 0.45), P(0.44, 0.40), P(0.50, 0.34), P(0.60, 0.5), P(0.69, 0.58), P(0.76, 0.52), P(0.84, 0.66), P(0.94, 0.8), P(1, 1)].forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p)));
  g.closePath(); g.fill();
  g.globalCompositeOperation = 'destination-out';
  for (const t of [[[0.34, 0.66], [0.41, 0.52], [0.42, 0.72]], [[0.5, 0.52], [0.55, 0.42], [0.62, 0.72]], [[0.72, 0.62], [0.76, 0.58], [0.8, 0.74]], [[0.14, 0.84], [0.19, 0.78], [0.2, 0.9]], [[0.88, 0.8], [0.9, 0.74], [0.94, 0.88]]]) {
    g.beginPath(); t.forEach((p, i) => (i ? g.lineTo(...P(...p)) : g.moveTo(...P(...p)))); g.closePath(); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = fill; g.fillRect(x + 0.41 * w, y + 0.0 * h, 0.03 * w, 0.4 * h); g.fillRect(x + 0.35 * w, y + 0.1 * h, 0.15 * w, 0.03 * h); // the cross
}
function lettering(g, w, h, fill) {
  const nh = Math.round(h * NAME[3]);
  mountain(g, w * 0.375, nh * 0.012, w * 0.25, nh * 0.4, fill);
  g.fillStyle = fill; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `800 ${Math.round(nh * 0.3)}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  g.fillText('BISERICA BAPTISTĂ', w / 2, nh * 0.64, w * 0.96);
  g.fillText('STÂNCA VEACURILOR', w / 2, nh * 0.885, w * 0.98);
}
export function boardAtlas() {
  const draw = (emissive) => (g, w, h) => {
    g.clearRect(0, 0, w, h);
    lettering(g, w, h, emissive ? '#cfe2ff' : navy);
    if (emissive) return;
    // the mesh panel: a bright galvanised wire grid, two thin wires per 10 cm, nothing between
    const [mu0, mv0, mu1, mv1] = MESH, x0 = mu0 * w, y0 = mv0 * h, mw = (mu1 - mu0) * w, mh = (mv1 - mv0) * h;
    g.fillStyle = 'rgba(176,182,186,0.07)'; g.fillRect(x0, y0, mw, mh); // a clear tint keeps the wire's colour in the gaps (no dark fringes when filtered)
    g.fillStyle = 'rgba(118,126,132,1)';
    for (let i = 0; i <= 20; i++) g.fillRect(x0 + (mw - 3) * i / 20, y0, 3, mh);           // verticals every 12.5 cm
    for (let j = 0; j <= 11; j++) g.fillRect(x0, y0 + (mh - 3) * j / 11, mw, 3);            // horizontals every 18 cm
    // the plate: blue, white «P»
    const [pu0, pv0, pu1, pv1] = PSIGN, pw = (pu1 - pu0) * w, ph = (pv1 - pv0) * h;
    g.fillStyle = '#1f5aa6'; g.fillRect(pu0 * w, pv0 * h, pw, ph);
    g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.strokeRect(pu0 * w + 8, pv0 * h + 8, pw - 16, ph - 16);
    g.fillStyle = '#ffffff'; g.font = `700 ${Math.round(ph * 0.72)}px Arial, Helvetica, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('P', pu0 * w + pw / 2, pv0 * h + ph * 0.54);
  };
  return { map: canvasTex(1024, 1024, draw(false), { repeat: false, aniso: 8 }), emissiveMap: canvasTex(1024, 1024, draw(true), { repeat: false, aniso: 8 }) };
}

export const mat = (o) => new THREE.MeshStandardMaterial(o);
