// OWNER: oradea. Shared helpers of the civic site (../civic.js): the Ferdinand site's wall kit re-exported, the textures of the shared
// materials, and a few small builders used by several buildings. Not a site module.
//   frame, poly, archPts, archOpening, spandrels, skinRange, cornice, dentils, rake, column, mansard, inset, neg   (../ferdinand/kit.js)
//   at, quad, box, skin, hole, solid, rect, UP, DN                                                                   (cherkasy/slabkit.js)
//   plasterTex(r) / ashlarTex(r) / tileTex(r) / slateTex()    tiling textures, uv in metres; the vertex colour tints them
//   atlasTex(r) -> { map, emissiveMap, R }    lettering and ironwork on one alpha-tested canvas; R names the uv rectangles
//   iron(D, f, s0, s1, y0, y1, o, k?)         a wrought-iron panel (atlas quad) on a face
//   lerp3, shade(hex, k), mix(a, b, t), hexRgb(hex)
//   ringArea(P), clipHalf(P, nx, nz, d), clipRing(P, ring)   2D polygon helpers (area, clip to a half plane n . p <= d, clip to a convex ring)
import * as THREE from 'three';
import { canvasTex } from '../../../cherkasy/sculpt.js';
import { archPts } from '../ferdinand/kit.js';
import { at, quad } from '../../../cherkasy/slabkit.js';
export { frame, poly, archPts, archOpening, spandrels, skinRange, cornice, dentils, rake, column, mansard, inset, neg } from '../ferdinand/kit.js';
export { at, quad, box, skin, hole, solid, rect, UP, DN, face as faceOf } from '../../../cherkasy/slabkit.js';

export const PI = Math.PI, TAU = PI * 2;
const scaled = (t, m, mh = m) => { t.repeat.set(1 / m, 1 / mh); return t; };

export const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
export const shade = (hex, k) => '#' + hexRgb(hex).map((c) => Math.max(0, Math.min(255, Math.round(c * k))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((c, i) => Math.round(c + (B[i] - c) * t).toString(16).padStart(2, '0')).join(''); };
export const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ------------------------------------------------------------------------------------------------ textures
// fine render with a faint grain (2.5 m a repeat), white base: the vertex colour carries the paint
export const plasterTex = (r) => scaled(canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#f4f2ee'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1800; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.3)' : 'rgba(90,72,56,0.07)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(100,84,66,0.045)'; g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 14, 3 + r() * 8, r() * PI, 0, TAU); g.fill(); }
}), 2.5);
// ashlar: courses of 0.45 m with 0.9 m stones, deep joints; 3.6 m x 3.6 m a repeat (stone colour from the vertices)
export const ashlarTex = (r) => scaled(canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#e9e6df'; g.fillRect(0, 0, w, h);
  const ch = h / 8, cw = w / 4;
  for (let j = 0; j < 8; j++) for (let i = -1; i < 5; i++) {
    const x = i * cw + (j & 1) * cw / 2, v = 232 + (r() - 0.5) * 22;
    g.fillStyle = `rgb(${v},${v - 2},${v - 8})`; g.fillRect(x + 2, j * ch + 2, cw - 4, ch - 4);
    g.fillStyle = 'rgba(70,64,56,0.35)'; g.fillRect(x, j * ch, cw, 2); g.fillRect(x, j * ch, 2, ch);
  }
  for (let q = 0; q < 4000; q++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(60,54,46,0.08)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
}), 3.6);
// clay tile: 0.36 m courses with lapped edges; 2.88 m a repeat (so 8 courses)
export const tileTex = (r) => scaled(canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#d9d4cc'; g.fillRect(0, 0, w, h);
  const ch = h / 8;
  for (let j = 0; j < 8; j++) {
    for (let i = 0; i < 12; i++) { const v = 222 + (r() - 0.5) * 26; g.fillStyle = `rgb(${v},${v - 4},${v - 10})`; g.fillRect(i * w / 12 + 1, j * ch + 1, w / 12 - 2, ch - 2); }
    g.fillStyle = 'rgba(40,24,16,0.4)'; g.fillRect(0, j * ch + ch - 3, w, 3);
  }
  for (let q = 0; q < 1200; q++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(30,20,12,0.1)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
}), 2.88);
export const slateTex = () => scaled(canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#d0d3d6'; g.fillRect(0, 0, w, h);
  for (let j = 0; j < 8; j++) { g.fillStyle = 'rgba(30,34,40,0.35)'; g.fillRect(0, j * h / 8, w, 2); for (let i = 0; i < 6; i++) { g.fillRect(i * w / 6 + (j & 1) * w / 12, j * h / 8, 1, h / 8); } }
}), 2);

// ironwork and lettering atlas (alpha-tested, double sided): the first row is two railing panels (scroll lattice, 2:1), the second
// row the lettering strips. R[name] = [u0, v0, u1, v1] canvas fractions (v down)
export function atlasTex(r) {
  const W = 2048, Hh = 1024, R = {};
  const draw = (emissive) => (g, w, h) => {
    g.clearRect(0, 0, w, h);
    if (!emissive) {
      // wrought iron (dark on transparent, read at a distance, so bold): rails, bars, rings and scrolls; a panel is 1.05 m wide
      const IR = '#1d1c1b';
      const panel = (x0, y0, pw, ph, kind) => {
        g.strokeStyle = IR; g.fillStyle = IR; g.lineWidth = 12;
        g.fillRect(x0, y0 + 2, pw, 18); g.fillRect(x0, y0 + ph - 20, pw, 18);
        if (kind === 0) {
          const n = 8;
          for (let i = 0; i <= n; i++) { const x = x0 + i * pw / n; g.fillRect(x - 6, y0, 12, ph); }
          g.lineWidth = 12;
          for (let i = 0; i < n; i++) {
            const x = x0 + i * pw / n, cw = pw / n;
            g.beginPath(); g.arc(x + cw / 2, y0 + ph * 0.5, cw * 0.36, 0, TAU); g.stroke();
          }
        } else {
          g.lineWidth = 12;
          const cells = 4;
          for (let i = 0; i < cells; i++) {
            const x = x0 + i * pw / cells, cw = pw / cells;
            g.beginPath(); g.moveTo(x, y0 + ph - 20); g.bezierCurveTo(x + cw * 0.05, y0 + ph * 0.15, x + cw * 0.95, y0 + ph * 0.15, x + cw, y0 + ph - 20); g.stroke();
            g.beginPath(); g.moveTo(x, y0 + 20); g.bezierCurveTo(x + cw * 0.05, y0 + ph * 0.85, x + cw * 0.95, y0 + ph * 0.85, x + cw, y0 + 20); g.stroke();
            g.fillRect(x - 6, y0, 12, ph);
          }
        }
      };
      panel(8, 8, 1000, 240, 0); panel(1032, 8, 1000, 240, 1);
      R.ironA = [8 / W, 8 / Hh, 1008 / W, 248 / Hh]; R.ironB = [1032 / W, 8 / Hh, 2032 / W, 248 / Hh];
      // plain bars (grilles)
      g.fillStyle = IR;
      for (let i = 0; i <= 10; i++) g.fillRect(8 + i * 100, 280, 12, 240);
      g.fillRect(8, 280, 1000, 18); g.fillRect(8, 502, 1000, 18);
      R.bars = [8 / W, 280 / Hh, 1008 / W, 520 / Hh];
    }
    // lettering strips
    const strip = (name, text, y0, ph, font, col, em) => {
      g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = emissive ? em : col; g.fillText(text, 1536, y0 + ph / 2 + 4);
      R[name] = [1024 / W, y0 / Hh, 2048 / W, (y0 + ph) / Hh];
    };
    strip('grandhotel', 'GRAND HOTEL', 560, 140, '700 96px Georgia, "Times New Roman", serif', '#2a1a14', '#ffe0a8');
    strip('astoria', 'ASTORIA', 710, 160, '700 124px Georgia, "Times New Roman", serif', '#2a1a14', '#ffe0a8');
    strip('justitia', 'PALATUL DE JUSTIȚIE', 880, 120, '700 80px Georgia, "Times New Roman", serif', '#1c1c1c', '#ffe0a8');
  };
  const cv = (em) => canvasTex(W, Hh, draw(em), { srgb: true, repeat: false });
  return { map: cv(false), emissiveMap: cv(true), R };
}
// a wrought-iron panel on a face: s0..s1 along it, y0..y1 up, o out; k: 'ironA' | 'ironB' | 'bars'; the panel is tiled by length
export function iron(D, f, s0, s1, y0, y1, o, uvR, tile = 1.05) {
  const [u0, v0, u1, v1] = uvR, n = Math.max(1, Math.round((s1 - s0) / tile)), du = (u1 - u0);
  const A = (s, y) => [f.ax + f.ux * s + f.nx * o, y, f.az + f.uz * s + f.nz * o];
  for (let i = 0; i < n; i++) {
    const a = s0 + (s1 - s0) * i / n, b = s0 + (s1 - s0) * (i + 1) / n;
    const first = D.v;
    for (const [p, uu, vv] of [[A(a, y0), u0, v1], [A(b, y0), u0 + du, v1], [A(b, y1), u0 + du, v0], [A(a, y1), u0, v0]]) D.vert(p[0], p[1], p[2], f.N[0], 0, f.N[2], uu, 1 - vv);
    D.quad(first, first + 1, first + 2, first + 3);
  }
}

// ------------------------------------------------------------------------------------------------ 2D polygons
export const ringArea = (P) => { let a = 0; P.forEach((p, i) => { const q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; }); return a / 2; };
// the part of P with n . p <= d (Sutherland-Hodgman against one half plane)
export function clipHalf(P, nx, nz, d) {
  const out = [];
  P.forEach((a, i) => {
    const b = P[(i + 1) % P.length], da = nx * a[0] + nz * a[1] - d, db = nx * b[0] + nz * b[1] - d;
    if (da <= 0) out.push(a);
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  });
  return out;
}
// P clipped to a convex ring (any winding)
export function clipRing(P, ring) {
  const sg = Math.sign(ringArea(ring)) || 1;
  let out = P;
  ring.forEach((a, i) => {
    if (out.length < 3) return;
    const b = ring[(i + 1) % ring.length], ex = b[0] - a[0], ez = b[1] - a[1], l = Math.hypot(ex, ez) || 1;
    // the inside of a positive ring is on the left of each edge: outward normal (ez, -ex)
    const nx = sg * ez / l, nz = -sg * ex / l;
    out = clipHalf(out, nx, nz, nx * a[0] + nz * a[1]);
  });
  return out.length >= 3 ? out : [];
}
export const THREEv = THREE;

// a closed or open strip of quads between two same-length (s, y) paths on a face plane, at offset o
export function band(D, f, outer, inner, o, col, closed = true) {
  D.setColor(col);
  const n = outer.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const j = (i + 1) % n;
    quad(D, at(f, ...outer[i], o), at(f, ...outer[j], o), at(f, ...inner[j], o), at(f, ...inner[i], o), f.N);
  }
}
// a lancet / arch-headed outline: bottom left up to the springing, the arch (n segments, p = squareness), down to bottom right
export function lancet(s0, s1, y0, yS, rise, n, p) {
  const arc = archPts(s0, s1, yS, rise, n, p);
  return [[s0, y0], ...arc, [s1, y0]];
}


// ------------------------------------------------------------------------------------------------ roofs
// A pitched roof over an oriented rectangle: centre (cx, cz), long axis (ux, uz), half length hl, half width hw measured at the
// eave line, eave height yE, ridge `rise` above it; ov overhangs every side (the slope continues down to yE - ov * slope). A hip
// roof by default (the ridge shortens by the half width); gable: true gives two slopes and flat gable ends (colour gcol, drawn
// into the same builder), mono: true a single slope falling to the +v side. Returns the ridge height.
export function roofRect(R, { cx, cz, ux, uz, hl, hw, yE, rise, col, col2 = null, gable = false, ov = 0.45, gcol = '#e9e2d2', gov = 0.15, soffit = '#8f887c' }) {
  const vx = -uz, vz = ux, slope = rise / hw, yO = yE - ov * slope, yR = yE + rise;
  const P = (s, q, y) => [cx + ux * s + vx * q, y, cz + uz * s + vz * q];
  const up = (pts) => R.face(pts, undefined);
  const nrm = (a, b, c) => { const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]; let n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]; const l = Math.hypot(...n) || 1; n = n.map((q) => q / l); return n[1] < 0 ? n.map((q) => -q) : n; };
  const poly3 = (pts, c) => { R.setColor(c); R.face(pts, nrm(pts[0], pts[1], pts[2])); };
  void up;
  const W = hw + ov, L = gable ? hl + gov : hl + ov;
  if (gable) {
    poly3([P(-L, W, yO), P(L, W, yO), P(L, 0, yR), P(-L, 0, yR)], col);
    poly3([P(L, -W, yO), P(-L, -W, yO), P(-L, 0, yR), P(L, 0, yR)], col2 ?? col);
    R.setColor(gcol);
    for (const sg of [-1, 1]) R.face([P(sg * hl, -hw, yE - 0.02), P(sg * hl, hw, yE - 0.02), P(sg * hl, 0, yR - 0.03)], [sg * ux, 0, sg * uz]);
  } else {
    const rl = Math.max(0, hl - hw);
    poly3([P(-L, W, yO), P(L, W, yO), P(rl, 0, yR), P(-rl, 0, yR)], col);
    poly3([P(L, -W, yO), P(-L, -W, yO), P(-rl, 0, yR), P(rl, 0, yR)], col2 ?? col);
    poly3([P(L, W, yO), P(L, -W, yO), P(rl, 0, yR)], col2 ?? col);
    poly3([P(-L, -W, yO), P(-L, W, yO), P(-rl, 0, yR)], col2 ?? col);
  }
  R.setColor(soffit); R.face([P(-L, -W, yO - 0.02), P(L, -W, yO - 0.02), P(L, W, yO - 0.02), P(-L, W, yO - 0.02)], [0, -1, 0]);
  return yR;
}
// a cone / bell cap of revolution on the roof builder: profile [[r, y]] bottom to top (r at least 0.02 on top)
export const cap = (R, x, z, prof, seg, col) => { R.setColor(col); R.lathe(prof, seg, x, z); };
