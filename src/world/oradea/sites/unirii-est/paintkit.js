// OWNER: oradea. Painting helpers for the east side's atlas cells (not a site module): window casings, ceramic tile motifs,
// sgraffito figures, balcony rails, plaster texture. All colours are fixed (no wall / trim tint roles), so a building keeps
// its own palette whatever the material's palette lookup holds.
//   gwin(c, x, y, w, h, o)   window: dark reveal, glass (lit at night), frame bars, optional blind, sill   o: { head, cols, trans, blind, sill, frame, cas, casCol, tone, lit, rows }
//   tileCol(c, x, y0, y1, k) a column of alternating green squares and yellow diamonds;  lattice(c, x0, y0, w, h) a panel of the
//     tile motif (a green square with yellow squares round it)
//   figure(c, x, y, h, kind, ink) / frieze(c, x0, x1, y0, h, seed)   sgraffito line figures
//   render(c, col, r)        plaster: a flat fill with speckle and a faint dirt gradient
import { S } from '../republicii/paint.js';

export const TY = '#e9cd5a', TG = '#4aa644';

export function render(c, col, r, n = 150) { c.fix(col).rect(0, 0, c.W, c.H); c.speckle(r, n); c.shadeV(0, c.W, 0, c.H, 0.07, 0); return c; }

export function gwin(c, x, y, w, h, o = {}) {
  const { head = 'flat', cols = 2, trans = 0.22, blind = 0, sill = 0.13, lit = 1, tone = 0, frame = '#b9822a', cas = 0, casCol = '#f6f3ec', rows = 0, blindCol = '#8c6b3f', sillCol = '#e6e3da' } = o;
  const t = 0.07;
  if (cas > 0) c.fix(casCol).opening(x, y, w, h, head, cas);
  c.fix('#23282e').opening(x, y, w, h, head);
  c.glass(x + t, y + t, w - 2 * t, h - 2 * t, head, lit, tone);
  c.dif('rgba(0,0,0,0.28)').rect(x + t, y + t, 0.06, h - 2 * t).rect(x + t, y + h - 0.16, w - 2 * t, 0.09);
  if (blind > 0) {
    const bh = Math.min(h - 2 * t, h * blind);
    if (blind >= 1) c.fix(blindCol).opening(x + t, y + t, w - 2 * t, h - 2 * t, head); else c.fix(blindCol).rect(x + t, y + h - t - bh, w - 2 * t, bh);
    c.dif('rgba(0,0,0,0.22)'); for (let yy = y + t; yy < y + h - t; yy += 0.075) c.rect(x + t, yy, w - 2 * t, 0.012);
  }
  c.fix(frame).openingLine(x + t / 2, y + t / 2, w - t, h - t, head, t);
  for (let i = 1; i < cols; i++) c.rect(x + (w * i) / cols - 0.03, y + t, 0.06, h - 2 * t);
  if (trans) c.rect(x + t, y + h * (1 - trans) - 0.03, w - 2 * t, 0.06);
  for (let i = 1; i <= rows; i++) c.rect(x + t, y + ((h * (1 - trans)) * i) / (rows + 1), w - 2 * t, 0.025);
  if (sill) {
    c.fix(sillCol).rect(x - 0.08, y - sill, w + 0.16, sill);
    c.dif('rgba(0,0,0,0.3)').rect(x - 0.08, y - sill - 0.07, w + 0.16, 0.07);
  }
}

export function tileCol(c, x, y0, y1, k = 1) {
  let i = 0;
  for (let y = y0 + 0.08 * k; y < y1; y += 0.15 * k, i++) {
    if (i % 2) c.fix(TG).rect(x - 0.05 * k, y - 0.05 * k, 0.1 * k, 0.1 * k);
    else c.fix(TY).poly([[x, y - 0.075 * k], [x + 0.06 * k, y], [x, y + 0.075 * k], [x - 0.06 * k, y]]);
  }
}
export function lattice(c, x0, y0, w, h) {
  const st = 0.5;
  for (let yy = y0 + st / 2; yy < y0 + h - 0.08; yy += st) for (let xx = x0 + st / 2; xx < x0 + w - 0.08; xx += st) {
    c.fix(TG).rect(xx - 0.065, yy - 0.065, 0.13, 0.13);
    c.fix(TY);
    for (const [dx, dy] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) c.rect(xx + dx - 0.04, yy + dy - 0.04, 0.08, 0.08);
  }
}

const circle = (x, y, r, n = 12) => Array.from({ length: n + 1 }, (_, i) => [x + Math.cos((i / n) * Math.PI * 2) * r, y + Math.sin((i / n) * Math.PI * 2) * r]);
// one sgraffito figure in black line: kind 0 a woman with a bowl, 1 a man with a sack on the shoulder, 2 a figure with a basket, 3 a barrel
export function figure(c, x, y, h, kind, ink = '#26262a') {
  const lw = Math.max(0.018, 0.02 * h), u = h;
  c.fix(ink);
  if (kind === 3) { // a barrel with hoops
    c.ln([[x - 0.2 * u, y], [x - 0.25 * u, y + 0.4 * u], [x - 0.2 * u, y + 0.8 * u], [x + 0.2 * u, y + 0.8 * u], [x + 0.25 * u, y + 0.4 * u], [x + 0.2 * u, y], [x - 0.2 * u, y]], lw);
    c.ln([[x - 0.24 * u, y + 0.2 * u], [x + 0.24 * u, y + 0.2 * u]], lw * 0.8).ln([[x - 0.24 * u, y + 0.6 * u], [x + 0.24 * u, y + 0.6 * u]], lw * 0.8);
    return;
  }
  c.ln(circle(x, y + 0.9 * u, 0.075 * u), lw);                                                   // head
  c.ln([[x - 0.11 * u, y + 0.82 * u], [x - 0.16 * u, y + 0.45 * u], [x - 0.2 * u, y], [x + 0.2 * u, y], [x + 0.16 * u, y + 0.45 * u], [x + 0.11 * u, y + 0.82 * u], [x - 0.11 * u, y + 0.82 * u]], lw); // robe
  c.ln([[x - 0.02 * u, y + 0.82 * u], [x - 0.04 * u, y + 0.3 * u]], lw * 0.7);                   // a fold
  if (kind === 0) { // arms forward, a bowl
    c.ln([[x + 0.11 * u, y + 0.75 * u], [x + 0.3 * u, y + 0.62 * u]], lw).ln([[x + 0.24 * u, y + 0.6 * u], [x + 0.5 * u, y + 0.6 * u], [x + 0.44 * u, y + 0.5 * u], [x + 0.28 * u, y + 0.5 * u], [x + 0.24 * u, y + 0.6 * u]], lw);
  } else if (kind === 1) { // a sack on the shoulder
    c.ln([[x - 0.1 * u, y + 0.8 * u], [x - 0.3 * u, y + 0.86 * u], [x - 0.34 * u, y + 1.0 * u], [x - 0.12 * u, y + 1.06 * u], [x + 0.06 * u, y + 0.97 * u]], lw);
    c.ln([[x + 0.1 * u, y + 0.72 * u], [x + 0.28 * u, y + 0.5 * u]], lw);
  } else { // a basket on the arm
    c.ln([[x + 0.12 * u, y + 0.75 * u], [x + 0.3 * u, y + 0.55 * u]], lw).ln([[x + 0.22 * u, y + 0.55 * u], [x + 0.46 * u, y + 0.55 * u], [x + 0.42 * u, y + 0.38 * u], [x + 0.26 * u, y + 0.38 * u], [x + 0.22 * u, y + 0.55 * u]], lw);
    c.ln([[x + 0.24 * u, y + 0.55 * u], [x + 0.34 * u, y + 0.68 * u], [x + 0.44 * u, y + 0.55 * u]], lw * 0.7);
  }
}
// a procession of figures along x0..x1 (the standing height h), kinds picked from a seed
export function frieze(c, x0, x1, y0, h, seed = 0, ink) {
  let k = seed;
  for (let x = x0 + 0.4 * h; x < x1 - 0.3 * h; x += 0.85 * h) { const kind = (k++ * 7 + 1) % 4; figure(c, x, y0, kind === 3 ? h * 0.7 : h, kind, ink); }
}

// a wrought-iron rail cell of 3.6 x 1.0 m in the given colour: bars, a mid band of small tulips
export function railCell(A, name, col, style = 0) {
  const c = A.cell(name, 3.6, 1.0);
  c.fix(col).rect(0, 0.92, c.W, 0.05).rect(0, 0.08, c.W, 0.04);
  if (style === 0) {
    for (let i = 0; i <= 28; i++) c.rect(0.05 + i * 0.125, 0.1, 0.018, 0.83);
    c.rect(0, 0.5, c.W, 0.03);
    for (let i = 0; i < 12; i++) c.ell(0.2 + i * 0.3, 0.64, 0.05, 0.08).rect(0.19 + i * 0.3, 0.56, 0.02, 0.07);
  } else {
    for (let i = 0; i <= 14; i++) c.rect(0.08 + i * 0.25, 0.1, 0.018, 0.85);
    for (let i = 0; i < 14; i++) c.ln([[0.1 + i * 0.25, 0.9], [0.24 + i * 0.25, 0.62], [0.37 + i * 0.25, 0.9]], 0.018);
  }
  c.end();
  return c;
}
export { S };
