// OWNER: oradea. Palatul Moskovits Miksa (Calea Republicii 13, 1904–1905, Rimanóczy Kálmán jr.), not a site module: the
// turquoise Secession corner palace on the Corso at the cross street, as restored: lilac piers and white stucco ornament, dark wine
// arched shopfronts, wrought-iron whiplash balconies, the round corner tower with its stone turret and silver onion dome, shaped
// gables on both wings, red hipped tile roofs with dormers and white chimneys.
//   MOSK_ID = 21056815;  moskovits(ctx, b) -> { footprint, top, floor, lots }   ctx as assembleBuilding's, b: { id, ring, holes }
// Sources: Wikimedia Commons photographs of the palace (2021, 2023). The back (north) and the courtyard are plain guesses; the
// tower's facets are 1.5 m cells (herocells.js) round the OSM arc of the corner.
import { assembleBuilding } from './building.js';
import { gable, onion, chimney, facets, dormer } from './herokit.js';
import { face, at } from '../../../cherkasy/slabkit.js';
import { DP } from '../../../materials.js';

export const MOSK_ID = 21056815;

// least-squares circle through points [[x, z]] (Kåsa): [cx, cz, r]
function fitCircle(P) {
  let sx = 0, sz = 0, sxx = 0, szz = 0, sxz = 0, sr = 0, srx = 0, srz = 0;
  for (const [x, z] of P) { const r = x * x + z * z; sx += x; sz += z; sxx += x * x; szz += z * z; sxz += x * z; sr += r; srx += r * x; srz += r * z; }
  const n = P.length, M = [[sxx, sxz, sx], [sxz, szz, sz], [sx, sz, n]], b = [-srx, -srz, -sr];
  const det = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const d = det(M), col = (k) => det(M.map((row, i) => row.map((v, j) => (j === k ? b[i] : v))));
  const D = col(0) / d, E = col(1) / d, F = col(2) / d, cx = -D / 2, cz = -E / 2;
  return [cx, cz, Math.sqrt(Math.max(0.1, cx * cx + cz * cz - F))];
}

const SPEC = {
  name: 'Palatul Moskovits Miksa', n: 4, styles: ['mosk'], cols: [['#38b6c8', '#f1efe8']], roof: '#a63f2b', rise: 3.9, depth: 3.7,
  allPublic: true, kind: 'apt',
  lotDefaults: { style: 'mosk', n: 4, gate: -1, entry: -1, balc: null, gcell: 'g.mosk', gpier: 'g.moskPier' },
  tower: [4, 5, 6, 7, 8, 9], towerSpec: { style: 'mosk', n: 4, gate: -1, entry: -1, balc: null },
  edgeLots: { 3: { balc: { j: 2, bays: 'all', rail: 'B' } }, 10: { balc: { j: 2, bays: 'all', rail: 'B' } } },
  after({ K, E, R, Ro, Hcap, depth, gAt, rnd, pal }) {
    // ---- the tower above the cornice: the stone turret, its corbels and balustrade, the onion dome
    const [cx, cz, rr] = fitCircle([4, 5, 6, 7, 8, 9, 10].map((i) => R[i]));
    const He = E[4].lots[0].He, y0 = He + 0.1, palId = E[4].lots[0].spec.pal;
    facets(K, cx, cz, 2.0, 8, 0.3, y0, y0 + 3.4, 'mosk.drum', 0.3, palId);
    facets(K, cx, cz, 2.28, 8, 0.3, y0 + 3.4, y0 + 4.1, 'mosk.corbel', 0.6, palId);
    const D = K.det;
    D.setPart(DP.PAINT).setColor('#f1efe8').cyl(cx, y0 + 4.1, cz, 2.3, 2.3, 0.7, 12, true);
    D.setPart(DP.PAINT).setColor('#e3e0d6').cyl(cx, y0 + 4.78, cz, 2.38, 2.38, 0.08, 12, true);
    onion(D, cx, cz, y0 + 4.85, 0.92, 12);
    // ---- the shaped gables on the two wings, and the dormers on their roofs
    const grow = (pts, k, j) => pts.map(([u, y]) => [u * k, y * j]); // the outlines are drawn on the cell's own size, then enlarged
    const wings = [[10, 'gable.mosk1', 4.0, 3.4, [[0, 0], [4, 0], [4, 1.0], [3.55, 1.35], [3.75, 1.9], [3.2, 2.2], [2.75, 2.75], [2.3, 3.15], [2.0, 3.4], [1.7, 3.15], [1.25, 2.75], [0.8, 2.2], [0.25, 1.9], [0.45, 1.35], [0, 1.0]], 0.56],
      [3, 'gable.mosk2', 3.2, 2.6, [[0, 0], [3.2, 0], [3.2, 0.8], [2.8, 1.1], [2.95, 1.55], [2.4, 1.85], [2.0, 2.25], [1.6, 2.6], [1.2, 2.25], [0.8, 1.85], [0.25, 1.55], [0.4, 1.1], [0, 0.8]], 0.5]];
    for (const [ei, cell, w0, h0, outline0, fr] of wings) {
      const k = ei === 10 ? 1.4 : 1.35, w = w0 * k, h = h0 * k, outline = grow(outline0, k, k);
      const e = E[ei], l = e.lots[0], f = face(e.B, e.A, e.nx, e.nz), sc = e.L * fr, surf = (o) => l.He + 0.12 + (l.Hl - l.He - 0.12) * Math.min(1, o / depth);
      gable(K, f, sc, l.He + 0.12, w, h, outline, cell, rnd(), palId, 0.04);
      for (const s of [e.L * 0.15, e.L * 0.85]) {
        if (Math.abs(s - sc) < 3.2) continue;
        dormer(K, f, s, 1.4, 1.5, 1.2, surf(1.2) - 0.25, 'dorm.mosk', rnd(), palId, surf, '#a63f2b', '#44bfd0');
      }
    }
    // ---- white chimneys on the roof ridge
    const mx = Ro.reduce((s, p) => s + p[0], 0) / Ro.length, mz = Ro.reduce((s, p) => s + p[1], 0) / Ro.length;
    for (const i of [0, 3, 10, 14]) { const p = Ro[i % Ro.length]; chimney(D, p[0] + (mx - p[0]) * 0.25, p[1] + (mz - p[1]) * 0.25, Hcap - 0.1, 2.5); }
  },
};

export function moskovits(ctx, b) { return assembleBuilding(ctx, { ...b, spec: SPEC }); }
