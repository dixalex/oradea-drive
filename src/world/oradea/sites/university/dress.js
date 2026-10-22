// OWNER: oradea. Facade dressing laid over the facade shader's walls (not a site module): window surrounds that line up with the
// shader's bays, pilasters, balustrades and string courses, all in the detail material.
//   edgeFrame(A, B) -> { A, B, L, ux, uz, nx, nz }                an edge a -> b of a positive ring (outward normal (uz, -ux))
//   obox(D, e, s0, s1, o0, o1, y0, y1, col, part?, mask?)        a box in the edge frame: s along the edge from A, o outward, y up
//   bays(e, bay) -> { nb, bw }                                    the shader's bay split of an edge (it rounds L / bay)
//   dressBays(D, e, { bay, rows: [{ y0, F, winW, winH, head, sill, jamb, col, glassCol? }], from?, to? })
//       rows: y0 floor line of the row, F its height (the shader's floorH), head: 'flat' | 'pediment' | 'segment' | 'lunette' | null
//   balustrade(D, e, y, h, o, col, { from, to, pier? })           a low parapet wall with piers every `pier` m
//   pilasters(D, e, { s: [..], w, o, y0, y1, col, cap? })         flat pilasters at the given distances from A
import { DP } from '../../../materials.js';

export function edgeFrame(A, B) {
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1e-6, ux = (B[0] - A[0]) / L, uz = (B[1] - A[1]) / L;
  return { A, B, L, ux, uz, nx: uz, nz: -ux };
}

const P = (e, s, o, y) => [e.A[0] + e.ux * s + e.nx * o, y, e.A[1] + e.uz * s + e.nz * o];

export function obox(D, e, s0, s1, o0, o1, y0, y1, col, part = DP.PAINT, mask = 0b011111) {
  D.setPart(part).setColor(col);
  const n = [e.nx, 0, e.nz], u = [e.ux, 0, e.uz];
  if (mask & 1) D.face([P(e, s0, o1, y0), P(e, s1, o1, y0), P(e, s1, o1, y1), P(e, s0, o1, y1)], n); // front
  if (mask & 2) D.face([P(e, s0, o0, y1), P(e, s1, o0, y1), P(e, s1, o1, y1), P(e, s0, o1, y1)], [0, 1, 0]); // top
  if (mask & 4) D.face([P(e, s0, o0, y0), P(e, s0, o1, y0), P(e, s1, o1, y0), P(e, s1, o0, y0)], [0, -1, 0]); // underside
  if (mask & 8) D.face([P(e, s0, o0, y0), P(e, s0, o1, y0), P(e, s0, o1, y1), P(e, s0, o0, y1)], [-u[0], 0, -u[2]]); // end a
  if (mask & 16) D.face([P(e, s1, o0, y0), P(e, s1, o1, y0), P(e, s1, o1, y1), P(e, s1, o0, y1)], u); // end b
}

export function bays(e, bay) {
  const nb = e.L >= bay * 0.62 ? Math.max(1, Math.round(e.L / bay)) : 0;
  return { nb, bw: nb ? e.L / nb : bay };
}

const arcPts = (cx, cy, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });

export function dressBays(D, e, { bay, rows, from = 0, to = e.L, skip = null }) {
  const { nb, bw } = bays(e, bay);
  for (let i = 0; i < nb; i++) {
    const s = (i + 0.5) * bw;
    if (s < from || s > to || skip?.(i, s)) continue;
    for (const r of rows) {
      const ww = r.winW * bw, yb = r.y0 + (1 - r.winH) * 0.62 * r.F, yt = yb + r.winH * r.F, col = r.col ?? '#f1ede2';
      if (r.sill !== false) obox(D, e, s - ww / 2 - 0.14, s + ww / 2 + 0.14, 0, 0.2, yb - 0.16, yb, col, DP.PAINT, 0b011111);
      if (r.jamb !== false) for (const sg of [-1, 1]) obox(D, e, s + sg * (ww / 2 + 0.02) - (sg > 0 ? 0 : 0.3), s + sg * (ww / 2 + 0.02) + (sg > 0 ? 0.3 : 0), 0, 0.1, yb, yt, col, DP.PAINT, 0b000011);
      const head = r.head;
      if (head === 'flat') obox(D, e, s - ww / 2 - 0.2, s + ww / 2 + 0.2, 0, 0.16, yt, yt + 0.26, col, DP.PAINT, 0b011111);
      else if (head === 'pediment') {
        obox(D, e, s - ww / 2 - 0.34, s + ww / 2 + 0.34, 0, 0.24, yt, yt + 0.3, col, DP.PAINT, 0b011111);
        const hw = ww / 2 + 0.34, top = yt + 0.3 + hw * 0.55;
        D.setPart(DP.PAINT).setColor(col);
        D.face([P(e, s - hw, 0.24, yt + 0.3), P(e, s + hw, 0.24, yt + 0.3), P(e, s, 0.24, top)], [e.nx, 0, e.nz]);
        const nl = [-(top - yt - 0.2), 0, hw].map((v) => v / Math.hypot(top - yt - 0.2, hw)); // slope normals in (s, y)
        D.face([P(e, s - hw, 0.0, yt + 0.3), P(e, s - hw, 0.24, yt + 0.3), P(e, s, 0.24, top), P(e, s, 0.0, top)], [e.nx * 0.4 + e.ux * nl[0] + 0, 0.9, e.nz * 0.4 + e.uz * nl[0]]);
        D.face([P(e, s + hw, 0.24, yt + 0.3), P(e, s + hw, 0.0, yt + 0.3), P(e, s, 0.0, top), P(e, s, 0.24, top)], [e.nx * 0.4 - e.ux * nl[0] + 0, 0.9, e.nz * 0.4 - e.uz * nl[0]]);
      } else if (head === 'segment') {
        const hw = ww / 2 + 0.3, rise = Math.min(0.8, hw * 0.55), pts = arcPts(0, 0, 1, Math.PI, 0, 8).map(([x, y]) => [s + x * hw, yt + 0.02 + y * rise]);
        D.setPart(DP.PAINT).setColor(col);
        D.face([P(e, s - hw, 0.12, yt + 0.02), ...pts.map(([ps, py]) => P(e, ps, 0.12, py)), P(e, s + hw, 0.12, yt + 0.02)].slice(0, 12), [e.nx, 0, e.nz]);
      } else if (head === 'lunette') {
        const hw = ww / 2 + 0.02, rr = hw + 0.16;
        D.setPart(DP.PAINT).setColor(col);
        D.face([...arcPts(s, yt, rr, 0, Math.PI, 10).map(([ps, py]) => P(e, ps, 0.1, py))], [e.nx, 0, e.nz]);
        D.setPart(DP.GLASS).setColor(r.glassCol ?? '#232b30');
        D.face([...arcPts(s, yt, hw, 0, Math.PI, 10).map(([ps, py]) => P(e, ps, 0.13, py))], [e.nx, 0, e.nz]);
      }
    }
  }
}

export function balustrade(D, e, y, h, o, col, { from = 0, to = e.L, pier = 4.5, pierW = 0.5, rail = col } = {}) {
  obox(D, e, from, to, o - 0.14, o, y, y + h - 0.12, col, DP.PAINT, 0b000011);
  obox(D, e, from, to, o - 0.2, o + 0.05, y + h - 0.12, y + h, rail, DP.PAINT, 0b011111);
  obox(D, e, from, to, o - 0.2, o + 0.05, y, y + 0.14, rail, DP.PAINT, 0b000011);
  const n = Math.max(1, Math.round((to - from) / pier));
  for (let k = 0; k <= n; k++) { const s = from + (to - from) * k / n; obox(D, e, s - pierW / 2, s + pierW / 2, o - 0.2, o + 0.1, y, y + h + 0.25, col, DP.PAINT, 0b011111); }
}

export function pilasters(D, e, { s, w = 0.7, o = 0.16, y0, y1, col = '#f1ede2', cap = null }) {
  for (const q of s) {
    obox(D, e, q - w / 2, q + w / 2, 0, o, y0, y1, col, DP.PAINT, 0b001111);
    if (cap) { obox(D, e, q - w / 2 - 0.08, q + w / 2 + 0.08, 0, o + 0.08, y1 - 0.4, y1, cap, DP.PAINT, 0b011111); obox(D, e, q - w / 2 - 0.08, q + w / 2 + 0.08, 0, o + 0.08, y0, y0 + 0.3, cap, DP.PAINT, 0b001111); }
  }
}
