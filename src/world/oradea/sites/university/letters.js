// OWNER: oradea. A stroke font for the lettering on the university buildings (not a site module): capitals with the Romanian and
// Hungarian accents, each stroke a thin quad, so the sign shares the detail material (no texture, no extra draw call).
//   textWidth(str, h, gap?) -> metres          width of the string at cap height h
//   text(D, str, o) -> width                   o { at: [x, y, z] (left end of the baseline, or the middle with align 'c'), dir: [dx, dz] unit
//                                              along the text, n: [nx, nz] unit facing the reader, h (cap height m), t (stroke / h, 0.16),
//                                              col, part (DP.PAINT), align: 'l' | 'c', gap (space between letters / h, 0.22), lift (m off the wall) }
import { DP } from '../../../materials.js';

const W = 0.62;
const G = {
  A: { w: W, s: [[[0, 0], [W / 2, 1], [W, 0]], [[0.12, 0.36], [W - 0.12, 0.36]]] },
  B: { w: W, s: [[[0, 0], [0, 1], [0.4, 1], [0.54, 0.9], [0.54, 0.62], [0.4, 0.52], [0, 0.52]], [[0.4, 0.52], [0.58, 0.42], [0.58, 0.1], [0.44, 0], [0, 0]]] },
  C: { w: W, s: [[[W, 0.86], [0.46, 1], [0.14, 0.86], [0.02, 0.5], [0.14, 0.14], [0.46, 0], [W, 0.14]]] },
  D: { w: W, s: [[[0, 0], [0, 1], [0.36, 1], [0.58, 0.78], [0.58, 0.22], [0.36, 0], [0, 0]]] },
  E: { w: 0.54, s: [[[0.54, 1], [0, 1], [0, 0], [0.54, 0]], [[0, 0.5], [0.44, 0.5]]] },
  F: { w: 0.54, s: [[[0.54, 1], [0, 1], [0, 0]], [[0, 0.5], [0.44, 0.5]]] },
  G: { w: W, s: [[[W, 0.86], [0.46, 1], [0.14, 0.86], [0.02, 0.5], [0.14, 0.14], [0.46, 0], [W, 0.14], [W, 0.46], [0.34, 0.46]]] },
  H: { w: W, s: [[[0, 0], [0, 1]], [[W, 0], [W, 1]], [[0, 0.5], [W, 0.5]]] },
  I: { w: 0.14, s: [[[0.07, 0], [0.07, 1]]] },
  J: { w: 0.5, s: [[[0.5, 1], [0.5, 0.2], [0.34, 0], [0.1, 0.1], [0.02, 0.28]]] },
  K: { w: W, s: [[[0, 0], [0, 1]], [[W, 1], [0, 0.42]], [[0.18, 0.58], [W, 0]]] },
  L: { w: 0.5, s: [[[0, 1], [0, 0], [0.5, 0]]] },
  M: { w: 0.84, s: [[[0, 0], [0, 1], [0.42, 0.38], [0.84, 1], [0.84, 0]]] },
  N: { w: W, s: [[[0, 0], [0, 1], [W, 0], [W, 1]]] },
  O: { w: W, s: [[[0.31, 0], [0.06, 0.2], [0.06, 0.8], [0.31, 1], [0.56, 0.8], [0.56, 0.2], [0.31, 0]]] },
  P: { w: W, s: [[[0, 0], [0, 1], [0.4, 1], [0.56, 0.9], [0.56, 0.62], [0.4, 0.5], [0, 0.5]]] },
  R: { w: W, s: [[[0, 0], [0, 1], [0.4, 1], [0.56, 0.9], [0.56, 0.62], [0.4, 0.5], [0, 0.5]], [[0.28, 0.5], [W, 0]]] },
  S: { w: W, s: [[[0.58, 0.86], [0.4, 1], [0.14, 0.94], [0.04, 0.74], [0.16, 0.56], [0.44, 0.46], [0.58, 0.28], [0.48, 0.06], [0.2, 0], [0.02, 0.14]]] },
  T: { w: W, s: [[[0, 1], [W, 1]], [[W / 2, 1], [W / 2, 0]]] },
  U: { w: W, s: [[[0, 1], [0, 0.2], [0.18, 0], [W - 0.18, 0], [W, 0.2], [W, 1]]] },
  V: { w: W, s: [[[0, 1], [W / 2, 0], [W, 1]]] },
  W: { w: 0.9, s: [[[0, 1], [0.2, 0], [0.45, 0.66], [0.7, 0], [0.9, 1]]] },
  X: { w: W, s: [[[0, 0], [W, 1]], [[0, 1], [W, 0]]] },
  Y: { w: W, s: [[[0, 1], [W / 2, 0.5], [W, 1]], [[W / 2, 0.5], [W / 2, 0]]] },
  Z: { w: W, s: [[[0, 1], [W, 1], [0, 0], [W, 0]]] },
  '-': { w: 0.4, s: [[[0, 0.45], [0.4, 0.45]]] },
  '.': { w: 0.1, s: [[[0.05, 0], [0.05, 0.08]]] },
  ' ': { w: 0.4, s: [] },
};
// accented capitals: a base letter plus marks (above the cap line or below the baseline)
const MARK = {
  'Ă': ['A', [[[0.14, 1.26], [0.31, 1.12], [0.48, 1.26]]]],
  'Â': ['A', [[[0.1, 1.12], [0.31, 1.3], [0.52, 1.12]]]],
  'Î': ['I', [[[-0.05, 1.12], [0.07, 1.28], [0.19, 1.12]]]],
  'Ș': ['S', [[[0.3, -0.04], [0.24, -0.2]]]],
  'Ț': ['T', [[[0.34, -0.04], [0.28, -0.2]]]],
  'É': ['E', [[[0.2, 1.1], [0.4, 1.28]]]],
  'Á': ['A', [[[0.22, 1.12], [0.42, 1.3]]]],
};

const glyph = (c) => {
  if (G[c]) return G[c];
  const m = MARK[c];
  return m ? { w: G[m[0]].w, s: [...G[m[0]].s, ...m[1]] } : G[' '];
};

export function textWidth(str, h, gap = 0.22) {
  let w = 0;
  for (const c of str) w += (glyph(c).w + gap) * h;
  return w - gap * h;
}

export function text(D, str, { at, dir, n, h = 0.5, t = 0.16, col = '#2a2a2a', part = DP.PAINT, align = 'l', gap = 0.22, lift = 0.03 } = {}) {
  const total = textWidth(str, h, gap), dx = dir[0], dz = dir[1];
  let u = align === 'c' ? -total / 2 : 0;
  D.setPart(part).setColor(col);
  const half = (t * h) / 2;
  for (const c of str) {
    const g = glyph(c);
    for (const line of g.s) {
      for (let i = 0; i + 1 < line.length; i++) {
        const a = line[i], b = line[i + 1];
        const ax = u + a[0] * h, ay = a[1] * h, bx = u + b[0] * h, by = b[1] * h;
        const L = Math.hypot(bx - ax, by - ay) || 1e-6, px = -(by - ay) / L * half, py = (bx - ax) / L * half;
        // extend the stroke by half its width at each end so joints close
        const ex = (bx - ax) / L * half, ey = (by - ay) / L * half;
        const P = [[ax - ex - px, ay - ey - py], [bx + ex - px, by + ey - py], [bx + ex + px, by + ey + py], [ax - ex + px, ay - ey + py]];
        D.face(P.map(([q, r]) => [at[0] + dx * q + n[0] * lift, at[1] + r, at[2] + dz * q + n[1] * lift]), [n[0], 0, n[1]]);
      }
    }
    u += (g.w + gap) * h;
  }
  return total;
}

// lines of text on an edge frame e { A, ux, uz, nx, nz } of a wall: s from A to the middle of the first line, y baseline of the first line,
// each next line `lead` m lower; o = how far the glyphs stand off the wall
export function textOnEdge(D, e, s, y, lines, { h = 0.3, lead = null, o = 0.05, ...rest } = {}) {
  const ld = lead ?? h * 1.7;
  lines.forEach((ln, i) => {
    const at = [e.A[0] + e.ux * s + e.nx * o, y - i * ld, e.A[1] + e.uz * s + e.nz * o];
    text(D, ln, { at, dir: [-e.ux, -e.uz], n: [e.nx, e.nz], h, align: 'c', lift: 0, ...rest });
  });
}
