// OWNER: oradea. Pitched roofs of the university site (not a site module): a hip or gable roof over an oriented rectangle
// (geom.js rectCover / growRect), the courses of its tiles painted as alternating strips, chimneys and a cone.
//   roofRect(D, r, He, o) -> ridgeY      D: a MeshBuilder (detail material, PAINT part); r { cx, cz, ux, uz, hl, hw }, He the eave
//     o { pitch = 0.62, maxRise = 6.5, ov = 0.5, col, col2 (the second course tone), course = 0.95 (m, 0 = flat colour),
//         gable = false, wallCol (gable end triangles), gOv (gable-end overhang, 0.25), soffit (true), ridge (colour of the ridge cap, or null) }
//   Where two rectangles cross, the roofs of both are drawn: the valleys come out of the intersection.
//   chimney(D, x, y, z, w, h, col, cap?)    a square flue with a darker cap (round green caps on the old campus)
//   cone(D, x, z, y0, r, h, col, seg?, courses?)   a conical roof (a turret's cap)
import { DP } from '../../../materials.js';

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (v) => { const l = Math.hypot(...v) || 1; return v.map((q) => q / l); };
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// a facet whose first two points are on the eave and the last two on the ridge (equal when it is a triangle), as courses
function facet(D, e0, e1, r1, r0, up, o) {
  const slope = Math.hypot(...sub(lerp(r0, r1, 0.5), lerp(e0, e1, 0.5)));
  const n = o.course > 0 ? Math.max(1, Math.round(slope / o.course)) : 1;
  const nrm = unit(cross(sub(e1, e0), sub(r0, e0)));
  if (nrm[1] < 0) nrm.forEach((_, i) => { nrm[i] = -nrm[i]; });
  void up;
  for (let k = 0; k < n; k++) {
    const t0 = k / n, t1 = (k + 1) / n;
    const a = lerp(e0, r0, t0), b = lerp(e1, r1, t0), c = lerp(e1, r1, t1), d = lerp(e0, r0, t1);
    D.setColor(k & 1 ? o.col2 : o.col);
    const same = Math.hypot(c[0] - d[0], c[1] - d[1], c[2] - d[2]) < 1e-3;
    D.face(same ? [a, b, c] : [a, b, c, d], nrm);
  }
}

export function roofRect(D, r, He, o = {}) {
  const { pitch = 0.62, maxRise = 6.5, ov = 0.5, col = '#b8452b', gable = false } = o;
  const col2 = o.col2 ?? col, course = o.course ?? 0.95;
  const { cx, cz, ux, uz } = r, vx = -uz, vz = ux;
  const hl = r.hl, hw = r.hw;
  const rise = Math.min(hw * pitch, maxRise), slope = rise / hw;
  const yE = He - ov * slope, yR = He + rise;
  const P = (s, q, y) => [cx + ux * s + vx * q, y, cz + uz * s + vz * q];
  D.setPart(DP.PAINT);
  const oo = { col, col2, course };
  if (gable) {
    const gOv = o.gOv ?? 0.25, L = hl + gOv, W = hw + ov;
    facet(D, P(-L, W, yE), P(L, W, yE), P(L, 0, yR), P(-L, 0, yR), true, oo);
    facet(D, P(L, -W, yE), P(-L, -W, yE), P(-L, 0, yR), P(L, 0, yR), true, oo);
    D.setColor(o.wallCol ?? '#e9e2cf');
    for (const sg of [-1, 1]) D.face([P(sg * hl, -hw, He - 0.02), P(sg * hl, hw, He - 0.02), P(sg * hl, 0, yR - 0.04)], [sg * ux, 0, sg * uz]);
  } else {
    const L = hl + ov, W = hw + ov, rl = Math.max(0, hl - hw);
    facet(D, P(-L, W, yE), P(L, W, yE), P(rl, 0, yR), P(-rl, 0, yR), true, oo);
    facet(D, P(L, -W, yE), P(-L, -W, yE), P(-rl, 0, yR), P(rl, 0, yR), true, oo);
    facet(D, P(L, W, yE), P(L, -W, yE), P(rl, 0, yR), P(rl, 0, yR), true, oo);
    facet(D, P(-L, -W, yE), P(-L, W, yE), P(-rl, 0, yR), P(-rl, 0, yR), true, oo);
  }
  if (o.soffit !== false) { // the underside of the eaves, so a low camera does not see through them
    const L2 = gable ? hl + (o.gOv ?? 0.25) : hl + ov, W2 = hw + ov;
    D.setColor(o.soffitCol ?? '#9a9488');
    D.face([P(-L2, -W2, yE - 0.01), P(L2, -W2, yE - 0.01), P(L2, W2, yE - 0.01), P(-L2, W2, yE - 0.01)], [0, -1, 0]);
  }
  if (o.ridge && rl0(hl, hw) > 0.5) {
    const a = P(-(gable ? hl : hl - hw), 0, yR), b = P((gable ? hl : hl - hw), 0, yR);
    D.setColor(o.ridge).setPart(DP.PAINT);
    D.tube(a, b, 0.14, 4, false);
  }
  return yR;
}
const rl0 = (hl, hw) => hl - hw;

export function chimney(D, x, y, z, w, h, col = '#d9d1bd', cap = '#6c6a66', round = false) {
  D.setPart(DP.PAINT).setColor(col).box(x - w / 2, y, z - w / 2, x + w / 2, y + h, z + w / 2, 1 | 2 | 16 | 32);
  D.setColor(cap);
  if (round) D.cyl(x, y + h, z, w * 0.46, w * 0.46, 0.22, 8, true).cyl(x, y + h + 0.22, z, w * 0.36, w * 0.36, 0.3, 8, true);
  else D.box(x - w * 0.58, y + h, z - w * 0.58, x + w * 0.58, y + h + 0.18, z + w * 0.58);
}

export function cone(D, x, z, y0, r, h, col, seg = 12, col2 = null, course = 0.9) {
  D.setPart(DP.PAINT);
  const n = col2 ? Math.max(2, Math.round(Math.hypot(r, h) / course)) : 1;
  for (let k = 0; k < n; k++) {
    D.setColor(k & 1 ? (col2 ?? col) : col);
    const t0 = k / n, t1 = (k + 1) / n, r0 = r * (1 - t0), r1 = r * (1 - t1);
    D.cyl(x, y0 + h * t0, z, r0, Math.max(r1, 0.001), h / n, seg, false);
  }
}
