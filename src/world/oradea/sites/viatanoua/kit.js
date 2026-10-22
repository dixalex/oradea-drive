// OWNER: oradea. Canvas textures and small emitters of the Viața Nouă / BCUO site (../viatanoua.js). Not a site module.
//   plasterTex(r)  fine speckled render, one repeat a metre   brickTex(r)  English-bond clay brick, one repeat 0.5 m
//   tileTex(r)     flat clay tiles, one repeat a metre         plateTex()    the enamel name plate (a red drop, the name)
//   tri(D, a, b, c, n)  one triangle whose winding follows the normal n     arch(cx, spring, r, n)  [[x, y]] along a semicircle, left to right
//   cellDrape(D, gy, poly, lift, cell)  a flat polygon laid on the ground in `cell` m pieces (local frame of the builder)
import * as THREE from 'three';
import { canvasTex } from '../../../cherkasy/sculpt.js';

const speck = (g, r, w, h, n, a, hi, lo) => {
  for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(${hi},${a})` : `rgba(${lo},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2.2, 1 + r() * 2.2); }
};

export const plasterTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#f6f4ee'; g.fillRect(0, 0, w, h);
  speck(g, r, w, h, 2400, 0.07, '255,255,255', '90,80,60');
  for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(120,105,80,${0.025 + r() * 0.03})`; g.fillRect(r() * w, r() * h, 8 + r() * 36, 6 + r() * 22); }
});

export const brickTex = (r) => {
  const t = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#bdb6a6'; g.fillRect(0, 0, w, h); // mortar
    const rows = 7, ch = h / rows;
    for (let j = 0; j < rows; j++) for (let i = -1; i < 3; i++) {
      const x = i * 128 + (j & 1 ? 64 : 0), v = r();
      const R = 158 + v * 48, G = 88 + v * 30, Bc = 66 + v * 22;
      g.fillStyle = `rgb(${R | 0},${G | 0},${Bc | 0})`; g.fillRect(x + 2, j * ch + 2, 124, ch - 3.5);
      g.fillStyle = 'rgba(255,230,200,0.10)'; g.fillRect(x + 2, j * ch + 2, 124, 3);
    }
    speck(g, r, w, h, 900, 0.1, '255,230,200', '40,20,12');
  });
  t.repeat.set(2, 2); // uv is in metres: one repeat is 0.5 m, two bricks a side
  return t;
};

export const tileTex = (r) => canvasTex(256, 256, (g, w, h) => { // 5 tiles across, 6 courses to the metre
  g.fillStyle = '#d9cfc6'; g.fillRect(0, 0, w, h);
  const cw = w / 5, ch = h / 6;
  for (let j = 0; j < 6; j++) for (let i = -1; i < 6; i++) {
    const x = i * cw + (j & 1 ? cw / 2 : 0), v = 205 + r() * 48;
    g.fillStyle = `rgb(${v | 0},${(v - 9) | 0},${(v - 14) | 0})`; g.fillRect(x + 1.5, j * ch + 1, cw - 3, ch - 1);
    g.fillStyle = 'rgba(40,16,8,0.30)'; g.fillRect(x + 1.5, j * ch + ch - 8, cw - 3, 7);
    g.fillStyle = 'rgba(255,235,220,0.12)'; g.fillRect(x + 1.5, j * ch + 1, cw - 3, 3);
  }
});

// the enamel plate on the east pier: white field, the church's red drop, the name in red, a grey second line
export const plateTex = (name, second) => canvasTex(512, 160, (g, w, h) => {
  g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#c7242b'; g.lineWidth = 5; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = '#d9252b'; // the drop
  g.beginPath(); g.moveTo(62, 22); g.bezierCurveTo(84, 54, 100, 76, 100, 98); g.bezierCurveTo(100, 122, 82, 138, 62, 138); g.bezierCurveTo(42, 138, 24, 122, 24, 98); g.bezierCurveTo(24, 76, 40, 54, 62, 22); g.fill();
  g.fillStyle = '#f4f1ea'; g.beginPath(); g.moveTo(62, 78); g.bezierCurveTo(70, 92, 76, 100, 76, 108); g.bezierCurveTo(76, 118, 70, 124, 62, 124); g.bezierCurveTo(54, 124, 48, 118, 48, 108); g.bezierCurveTo(48, 100, 54, 92, 62, 78); g.fill();
  g.fillStyle = '#d9252b'; g.font = '700 58px Arial, Helvetica, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText(name, 126, 62, w - 150);
  g.fillStyle = '#4d5159'; g.font = '600 31px Arial, Helvetica, sans-serif';
  g.fillText(second, 128, 116, w - 150);
}, { repeat: false });

// ------------------------------------------------------------------------------------------------ emitters
export function tri(D, a, b, c, n, uv) {
  const first = D.v;
  [a, b, c].forEach((p, k) => D.vert(p[0], p[1], p[2], n[0], n[1], n[2], uv ? uv[k][0] : 0, uv ? uv[k][1] : 0));
  const e = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], f = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const cr = [e[1] * f[2] - e[2] * f[1], e[2] * f[0] - e[0] * f[2], e[0] * f[1] - e[1] * f[0]];
  if (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] >= 0) D.tri(first, first + 1, first + 2); else D.tri(first, first + 2, first + 1);
}

export const arch = (cx, spring, r, n) => Array.from({ length: n + 1 }, (_, i) => { const a = Math.PI * (1 - i / n); return [cx + r * Math.cos(a), spring + r * Math.sin(a)]; });

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
// gy(x, z) is the local height of the ground under the local point (the caller folds the frame in)
export function cellDrape(D, gy, poly, lift, cell = 2) {
  const xs = poly.map((p) => p[0]), zs = poly.map((p) => p[1]);
  for (let x0 = Math.floor(Math.min(...xs) / cell) * cell; x0 < Math.max(...xs); x0 += cell) {
    for (let z0 = Math.floor(Math.min(...zs) / cell) * cell; z0 < Math.max(...zs); z0 += cell) {
      const c = clipRect(poly, x0, x0 + cell, z0, z0 + cell);
      if (c.length < 3) continue;
      const first = D.v; D.fill(c, [], 0, true);
      for (let v = first; v < D.v; v++) { const o = v * 11, a = D.buf.a; a[o + 1] = gy(a[o], a[o + 2]) + lift; }
    }
  }
}
export const mat = (o) => new THREE.MeshStandardMaterial(o);
