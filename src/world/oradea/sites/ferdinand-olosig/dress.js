// OWNER: oradea. The run dresser the five buildings share (not a site module): one run of a front between two wall positions of a
// frame f, laid out from a token string read left to right as the viewer stands in the street, one atlas quad per token and storey.
//   dressRun(K, f, s0, s1, floorY, spec, rnd, l)      for assemble.js `spec.dress`; the lot's def is l.def:
//     { layout: 'P a a G a P' (or axW: the axis width, as many 'a' as fit; alt: a token that takes every second place), cells: { a: { g, f: [j1, j2, ..] }, P: { w, g, f }, G: { w, g, f, bal } ... }, n, gh, sh, mould }
//     token widths: a token with `w` keeps it, the others share what is left; a token's cell list `f` gives the cell of storey j
//     (1-based, the last one repeats); `bal: { j, w?, rail }` puts an iron balcony on the token at storey j
//     mould: { plinth, band (the ground floor's cap), strings (between storeys), cornice (colour), fascia, depth }
//   l.info = { toks: [{ t, a, b }], He }   what the `after` hooks of the buildings read (gables over tokens, ...)
//   railCell(A, name, col, style) lives in ../unirii-est/paintkit.js
import { aq, dbox } from '../republicii/facade.js';
import { DP } from '../../../materials.js';

export function layoutTokens(def, L) {
  const toks = def.layout ? def.layout.split(' ') : def.axW ? Array.from({ length: Math.max(1, Math.round(L / def.axW)) }, (_, i) => (def.alt && i % 2 ? def.alt : 'a')) : ['a'], cells = def.cells ?? {};
  const fixed = toks.reduce((s, t) => s + (cells[t]?.w ?? 0), 0), free = toks.filter((t) => !(cells[t]?.w)).length;
  const aw = free ? Math.max(0.5, (L - fixed) / free) : 0;
  return toks.map((t) => ({ t, w: cells[t]?.w ?? aw }));
}

export function dressRun(K, f, s0, s1, floorY, spec, rnd, l) {
  const def = l.def ?? {}, n = spec.n, palId = spec.pal, gh = spec.gh ?? 4.6, sh = spec.sh ?? 3.9, He = floorY + gh + (n - 1) * sh;
  const cells = def.cells ?? {}, M = { plinth: '#8d8878', band: '#e6dfd0', string: '#e6dfd0', cornice: '#e6dfd0', depth: 0.45, ...def.mould };
  const toks = layoutTokens(def, s1 - s0), info = { toks: [], He };
  l.info = info;
  let s = s0;
  for (const { t, w } of toks) {
    const a = s, b = s + w; s = b;
    const C = cells[t] ?? cells.a; info.toks.push({ t, a, b });
    if (C.g) aq(K, f, a, b, floorY, floorY + gh, 0, C.g, rnd(), palId);
    for (let j = 1; j < n; j++) {
      const y0 = floorY + gh + (j - 1) * sh, cell = C.f?.[Math.min(j - 1, C.f.length - 1)];
      if (cell) aq(K, f, a, b, y0, y0 + sh, 0, cell, rnd(), palId);
      const bal = C.bal;
      if (bal && bal.j === j) { // an iron balcony on a thin slab
        const yb = y0 + 0.02, bw = Math.min(bal.w ?? 2.4, b - a - 0.4), ba = (a + b) / 2 - bw / 2, bb = ba + bw, out = bal.out ?? 0.8;
        dbox(K, f, ba, bb, yb - 0.22, yb + 0.02, 0, out, 'ftulr', bal.col ?? M.band);
        aq(K, f, ba, bb, yb + 0.02, yb + 0.98, out - 0.04, bal.rail ?? 'rail.D', 0.9, palId, 1);
      }
    }
  }
  const a = s0, b = s1;
  if (M.plinth) dbox(K, f, a, b, floorY - 1.1, floorY + 0.02, 0, 0.06, 'f', M.plinth, DP.CONC);
  if (M.band) dbox(K, f, a, b, floorY + gh - 0.1, floorY + gh + 0.22, 0, M.bandOut ?? 0.14, 'ft', M.band);
  if (M.string) for (let j = 2; j < n; j++) { const y = floorY + gh + (j - 1) * sh; dbox(K, f, a, b, y - 0.06, y + 0.06, 0, 0.06, 'f', M.string); }
  if (M.cornice) {
    dbox(K, f, a, b, He - 0.58, He - 0.32, 0, 0.14, 'f', M.fascia ?? M.cornice);
    dbox(K, f, a - 0.02, b + 0.02, He - 0.32, He - 0.05, 0, M.depth, 'fu', M.cornice);
    dbox(K, f, a - 0.04, b + 0.04, He - 0.05, He + 0.14, 0, M.depth + 0.12, 'ftu', M.cornice);
  }
}
export { aq, dbox };
