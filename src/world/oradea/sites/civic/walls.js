// OWNER: oradea. A wall face of painted bays with its plinth, string courses and cornice (the part the civic buildings share; the
// Palace of Justice draws its own, with more detail). Not a site module.
//   bayWall(ctx, F, spec, rich?) -> n bays
//     ctx  { B, bays, gLow }   the shared builders, the atlas kit (./bays.js), the plinth depth under the floor line
//     F    a wall frame (kit.frame): the face with its outward normal
//     spec { rows: [[strip, y0, y1], ...] the atlas strips and their storeys, gaps: [[y0, y1], ...] wall quads between them,
//            wall (colour of the gaps), plinth: [y1, colour], strings: [[y0, y1, out], ...] white courses, cornice: [y, h, out, step] }
//     rich false: the courtyard sides, with the strings thinner and no cornice
//   pilasters(B, f, s0, s1, y0, y1, w, o, col): a pair of flat strips (the Classicist pilaster pairs) standing out by o
import { box, skin, cornice } from './kit.js';

export function bayWall(ctx, F, spec, rich = true) {
  const { B, bays, gLow = -0.6 } = ctx, f = F.face(), L = F.W;
  let n = 0;
  for (const [name, y0, y1] of spec.rows) n = Math.max(n, bays.band(B.bay, f, name, y0, y1));
  for (const [y0, y1] of spec.gaps ?? []) skin(B.wall, f, y0, y1, spec.wall, [1, 1]);
  const [py, pc] = spec.plinth;
  B.stone.setColor(pc); box(B.stone, f, -0.05, L + 0.05, gLow, py, -0.1, 0.14, 'ftlr');
  B.det.setColor(spec.trim ?? '#f1ebdc');
  for (const [y0, y1, o] of spec.strings ?? []) box(B.det, f, -0.04, L + 0.04, y0, y1, 0, rich ? o : o * 0.6, 'ftu');
  if (rich && spec.cornice) { const [y, h, o, d] = spec.cornice; cornice(B.det, f, -0.1, L + 0.1, y, h, 0, o, spec.trim ?? '#f1ebdc', d); }
  else if (spec.cornice) { const [y, h] = spec.cornice; box(B.det, f, -0.08, L + 0.08, y, y + h, 0, 0.4, 'ftu'); }
  return n;
}
export function pilasters(B, f, s0, s1, y0, y1, w, o, col) {
  B.det.setColor(col);
  box(B.det, f, s0, s0 + w, y0, y1, 0, o, 'ftlr'); box(B.det, f, s1 - w, s1, y0, y1, 0, o, 'ftlr');
}
