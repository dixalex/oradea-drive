// OWNER: oradea. Painting helpers for the atlas cells of the five Art Nouveau buildings (not a site module). Fixed colours only
// (no wall / trim tint roles), on top of ../unirii-est/paintkit.js (gwin windows, render plaster).
//   studs(c, x, y, w, h, head, col, step)    a ring of small round relief studs round an opening (the rosette buttons of Casa Poynár)
//   butterfly(c, x, y, s, col)               a butterfly (two wing pairs, a body, two feelers), s its span in metres
//   ironCell(A, name, col, kind, w?)         a wrought-iron rail cell, kind 'butterfly' | 'wave' | 'bars'
//   gableWave(w, h, k)                       a curved pediment outline [[u, y]] 0..w x 0..h (concave shoulders, a rounded crown)
//   waveTop(w, h0, amp, n)                   a wavy top edge outline [[u, y]] (n bumps): the parapet of a front
//   shade(hex, k)                            a hex colour scaled by k
export { render, gwin, tileCol, lattice, frieze, figure, railCell, TY, TG } from '../unirii-est/paintkit.js';

export const shade = (hex, k) => '#' + [1, 3, 5].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * k))).toString(16).padStart(2, '0')).join('');

export function studs(c, x, y, w, h, head, col, step = 0.3, r = 0.035) {
  c.fix(col);
  const pts = [];
  for (let yy = y; yy <= y + h + 1e-6; yy += step) { pts.push([x - 0.12, yy]); pts.push([x + w + 0.12, yy]); }
  for (let xx = x; xx <= x + w + 1e-6; xx += step) pts.push([xx, y + h + 0.12]);
  if (head === 'arch') { pts.length = 0; const hh = h - w / 2; for (let yy = y; yy <= y + hh; yy += step) { pts.push([x - 0.12, yy]); pts.push([x + w + 0.12, yy]); }
    for (let a = 0; a <= Math.PI + 1e-6; a += step / (w / 2 + 0.12)) pts.push([x + w / 2 - Math.cos(a) * (w / 2 + 0.12), y + hh + Math.sin(a) * (w / 2 + 0.12)]); }
  for (const [px, py] of pts) c.ell(px, py, r, r);
  return c;
}

export function butterfly(c, x, y, s, col) {
  c.fix(col);
  c.ell(x - s * 0.22, y + s * 0.12, s * 0.2, s * 0.12, 0.5).ell(x + s * 0.22, y + s * 0.12, s * 0.2, s * 0.12, -0.5);
  c.ell(x - s * 0.16, y - s * 0.1, s * 0.14, s * 0.09, -0.5).ell(x + s * 0.16, y - s * 0.1, s * 0.14, s * 0.09, 0.5);
  c.rect(x - s * 0.02, y - s * 0.2, s * 0.04, s * 0.4);
  c.ln([[x, y + s * 0.2], [x - s * 0.1, y + s * 0.32]], 0.012).ln([[x, y + s * 0.2], [x + s * 0.1, y + s * 0.32]], 0.012);
  return c;
}

export function ironCell(A, name, col, kind = 'bars', w = 3.6) {
  const c = A.cell(name, w, 1.0);
  c.fix(col).rect(0, 0.93, c.W, 0.05).rect(0, 0.08, c.W, 0.04);
  const n = Math.round(c.W / 0.13);
  if (kind === 'butterfly') {
    for (let i = 0; i <= n; i++) c.rect(0.04 + i * (c.W - 0.08) / n, 0.1, 0.028, 0.83);
    c.rect(0, 0.5, c.W, 0.04);
    for (let x = c.W > 2 ? 0.45 : c.W / 2; x < c.W - 0.2; x += 0.9) butterfly(c, x, 0.5, 0.62, col);
  } else if (kind === 'wave') {
    for (let i = 0; i <= n; i++) c.rect(0.04 + i * (c.W - 0.08) / n, 0.1, 0.016, 0.83);
    c.ln(Array.from({ length: 41 }, (_, k) => [(k / 40) * c.W, 0.5 + Math.sin((k / 40) * c.W * 5) * 0.13]), 0.022);
  } else { for (let i = 0; i <= n; i++) c.rect(0.04 + i * (c.W - 0.08) / n, 0.1, 0.018, 0.83); c.rect(0, 0.5, c.W, 0.03); }
  c.end();
  return c;
}

// a curved pediment: concave shoulders rising to a rounded crown, 0..w x 0..h, left to right
export function gableWave(w, h, k = 14) {
  const half = [];
  for (let i = 0; i <= k; i++) { const u = i / k, y = h * (1 - Math.pow(u, 1.55)) * (1 + 0.1 * Math.sin(u * Math.PI)); half.push([u, Math.max(0, y)]); }
  const left = half.map(([u, y]) => [(w / 2) * (1 - u), y]).reverse(), right = half.slice(1).map(([u, y]) => [(w / 2) * (1 + u), y]);
  return [...left, ...right]; // from the left foot up over the crown and down to the right foot; the base closes it
}

export function waveTop(w, h0, amp, n = 3, m = 10) {
  const pts = [];
  for (let i = 0; i <= n * m; i++) { const u = i / (n * m); pts.push([u * w, h0 + amp * (0.5 - 0.5 * Math.cos(u * n * Math.PI * 2))]); }
  return [[0, 0], [w, 0], ...pts.reverse()];
}
