// OWNER: oradea. Shared geometry of the corner buildings (not a site module): where a ring has its tip, which cleaned-ring edge joins
// two points, round towers' centres, bulbous cupolas, conical and mansard roofs.
//   tipOf(R, hint) -> index of the vertex of ring R nearest the point hint
//   edgeBetween(R, P, Q) -> the index i of the ring edge R[i] -> R[i + 1] whose ends are P and Q (either order), or -1
//   circumcentre(a, b, c) -> [x, z] the centre of the circle through three points
//   bulb(D, cx, cz, y0, Rb, H, col)        an onion cupola of base radius Rb and height H (the herokit onion's profile), with a finial
//   cone(D, cx, cz, y0, r0, r1, h, col, seg?, part?)   a cone or frustum (a round tower's roof) in the detail builder (roof colour col)
//   drum(K, cx, cz, r, n, y0, y1, cell, seed, palId)   an n-gon drum from atlas quads (herokit facets with the right facing)
import { DP } from '../../../materials.js';
import { facets } from '../republicii/herokit.js';

export const tipOf = (R, hint) => { let b = 0, bd = Infinity; R.forEach((p, i) => { const d = Math.hypot(p[0] - hint[0], p[1] - hint[1]); if (d < bd) { bd = d; b = i; } }); return b; };

export function edgeBetween(R, P, Q) {
  const n = R.length, eq = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-4;
  for (let i = 0; i < n; i++) { const A = R[i], B = R[(i + 1) % n]; if ((eq(A, P) && eq(B, Q)) || (eq(A, Q) && eq(B, P))) return i; }
  return -1;
}

export function circumcentre(a, b, c) {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1])) || 1e-9;
  const a2 = a[0] ** 2 + a[1] ** 2, b2 = b[0] ** 2 + b[1] ** 2, c2 = c[0] ** 2 + c[1] ** 2;
  return [(a2 * (b[1] - c[1]) + b2 * (c[1] - a[1]) + c2 * (a[1] - b[1])) / d, (a2 * (c[0] - b[0]) + b2 * (a[0] - c[0]) + c2 * (b[0] - a[0])) / d];
}

const ONION = [[1, 0], [1.2, 0.065], [1.32, 0.195], [1.27, 0.33], [1.06, 0.48], [0.76, 0.62], [0.47, 0.74], [0.26, 0.84], [0.14, 0.93], [0.09, 1]];
export function bulb(D, cx, cz, y0, Rb, H, col, finial = '#aab2b8') {
  D.setPart(DP.GALV).setColor(col).lathe(ONION.map(([r, y]) => [r * Rb, y0 + y * H]), 14, cx, cz);
  D.setColor('#9ea7ae').cyl(cx, y0 + H * 0.97, cz, Rb * 0.2, Rb * 0.16, 0.18, 8, true);
  D.setPart(DP.STEEL).setColor(finial).cyl(cx, y0 + H, cz, 0.07, 0.025, Rb * 1.1, 6, false);
}

export function cone(D, cx, cz, y0, r0, r1, h, col, seg = 12, part = DP.PAINT) {
  D.setPart(part).setColor(col).lathe([[r0, y0], [r1, y0 + h]], seg, cx, cz);
}

export function drum(K, cx, cz, r, n, y0, y1, cell, seed, palId) { facets(K, cx, cz, r, n, 0, y0, y1, cell, seed, palId); }
