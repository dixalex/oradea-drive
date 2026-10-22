// OWNER: oradea. Palatul Vulturul Negru (the Black Eagle Palace, OSM way 19826329), Oradea: the Secession block of
// 1907–1908 by Marcell Komor and Dezső Jakab for the Stern brothers' casino, hotel and offices, on Piața Unirii and
// Strada Independenței. Three asymmetric bodies round a court that opens on the square: the north-west body with its
// two round bays and three scalloped gables, the south body with its round corner tower under a green spire, and the
// court between them – eight metres wide, seventeen deep, balconies of green wrought iron on both walls – ending in the
// big arched stained-glass window of the black eagle (Neumann K., 1909) over the mouth of the covered passage, which
// runs through the block to Strada Independenței and to the south-east. The walls are painted atlas bays (vnpaint.js).
//   buildEagle({ B, S, H, r, wash }) -> { footprints, ring }   B = newSet('vn') builders: B.vn takes the atlas
// Frame (c, d): origin the block's north-west corner on Strada Independenței, c along the north front (ESE), d south.
import { M4 } from '../../../../kit/mesh.js';
import { at, quad, rect, box, fan, strip, poly2uv, roofPoly, clockOn, edgeNormals, edgeFace, ringInset, ringSimple, COL, PI } from './kit.js';
import { face as faceOf } from '../../../cherkasy/slabkit.js';
import { uvOf, RECT, WALL_H, PX, W as AW, H as AH } from './vnpaint.js';

export const VN_ID = 19826329;
const O = [59.9, -10.2], EC = [0.9668, -0.2554], ED = [0.2554, 0.9668];
export const toMapV = (c, d) => [O[0] + c * EC[0] + d * ED[0], O[1] + c * EC[1] + d * ED[1]];
export const toLocalV = (x, z) => [(x - O[0]) * EC[0] + (z - O[1]) * EC[1], (x - O[0]) * ED[0] + (z - O[1]) * ED[1]];
const RING = [[142.3, -31.1], [150.3, 11.9], [171.6, 6.2], [183.6, 50.9], [144.9, 59.2], [141.4, 41.5], [137.1, 14.8], [105.6, 23.2], [90.4, 26.7], [92.3, 37.4],
  [61.4, 42.9], [58.3, 32.8], [58.3, 29.7], [60, 27.3], [80.3, 22.5], [78.1, 14.9], [61.1, 19], [59, 18.6], [54.8, 14.7], [51.7, 3], [51.7, -1.9], [53.9, -6.2],
  [59.9, -10.2], [131.7, -29.2]];
const GREEN = '#4d8c6c', GREEN_D = '#3a7058', TILE = '#74301f', IRON = '#2f3d36';
// floor levels of the bodies (the terrain climbs 4 m across the block) and their eaves, absolute
const F_A = 2.2, F_B = 3.5, F_SE = 4.6, Y_A = F_A + 22.5, Y_B = F_B + 22.5, Y_SE = F_SE + 19.0;
// per ring edge i -> i + 1: [panel, variant, floor, eave]
const SPEC = [
  ['P', 0, 2.9, Y_A], ['P', 1, F_SE, Y_SE], ['P', 0, F_SE, Y_SE], ['P', 1, F_SE, Y_SE], ['P', 0, F_SE, Y_SE], ['P', 1, F_SE, Y_SE], ['P', 0, 3.2, Y_A], ['P', 1, 3.2, Y_A],
  ['P', 0, F_B, Y_B], ['P', 1, F_B, Y_B], ['B', 0, F_B, Y_B], ['B', 0, F_B, Y_B], ['B', 0, F_B, Y_B], ['C', 0, 2.9, Y_B], ['BK', 0, 2.6, 2.6 + WALL_H], ['C', 1, 2.5, Y_A],
  ['A', 0, F_A, Y_A], ['A', 0, F_A, Y_A], ['A', 0, F_A, Y_A], ['A', 0, F_A, Y_A], ['A', 0, F_A, Y_A], ['A', 0, F_A, Y_A], ['N', 0, F_A, Y_A], ['N', 1, F_A, Y_A],
];
const E_BAY = { N: 4.2, P: 4.2, C: 4.4 };
const DEV = { A: [21, 20, 19, 18, 17, 16], B: [12, 11, 10] };
const toM = (pts) => pts.map(([c, d]) => toMapV(c, d));
// the volumes' outlines (c, d)
const AP = [[0, 0], [-6.8, 2.3], [-10, 5.9], [-11.3, 10.7], [-11.3, 22.8], [-8.2, 27.6], [-6.3, 28.5], [11.2, 28.9], [11.3, 0]];
const NP = [[11.3, 0], [74.3, 0], [85, 0.8], [81.8, 44.5], [68.3, 43.9], [35.7, 44], [20.1, 43.5], [11.4, 36.8], [11.2, 28.9]];
const BP = [[-9.5, 36.3], [11.4, 36.8], [20.1, 43.5], [19.2, 54.3], [-12.1, 51.7], [-12.5, 41.2], [-11.7, 38.2]];
const SP = [[81.8, 44.5], [103.8, 44.4], [104, 90.7], [64.5, 88.8], [65.6, 70.8], [68.3, 43.9]];
const TOWER = { c: [-6.0, 41.8], r: 4.3 };

// a band of a cone / cylinder with the uv rectangle u0..u1 round it and v0..v1 up it
function cylBand(D, cx, cz, r0, r1, y0, y1, seg, u0, u1, v0, v1, phase = 0) {
  const lo = [], hi = [], dr = r0 - r1, dy = y1 - y0, l = Math.hypot(dr, dy) || 1, nr = dy / l, ny = dr / l;
  for (let k = 0; k <= seg; k++) {
    const a = phase + (k / seg) * PI * 2, c = Math.cos(a), s = Math.sin(a), u = u0 + (u1 - u0) * k / seg;
    lo.push(D.vert(cx + c * r0, y0, cz + s * r0, c * nr, ny, s * nr, u, v0));
    hi.push(D.vert(cx + c * r1, y1, cz + s * r1, c * nr, ny, s * nr, u, v1));
  }
  for (let k = 0; k < seg; k++) D.quad(lo[k], hi[k], hi[k + 1], lo[k + 1]);
}
const uvPx = (name, px, py, k = 0) => { const [x0, y0] = RECT[name][k]; return [(x0 + px) / AW, 1 - (y0 + py) / AH]; };

export function buildEagle({ B, S, H, r, wash }) {
  const N = edgeNormals(RING), V = B.vn;
  const faces = RING.map((p, i) => Object.assign(edgeFace(p, RING[(i + 1) % RING.length], N[i]), { i }));
  const gOf = (f, o = 0.5) => { let g = 1e9; for (let k = 0; k <= 8; k++) { const p = at(f, f.L * k / 8, 0, o); g = Math.min(g, H(p[0], p[2])); } return g; };
  const e0 = {};
  for (const list of Object.values(DEV)) { let e = 0; for (const i of list) { e0[i] = e; e += faces[i].L; } }

  // ---------------------------------------------------------------- walls
  let gMin = 1e9;
  for (const f of faces) {
    const [panel, kv, Ff, top] = SPEC[f.i], L = f.L, gLo = Math.min(gOf(f), Ff) - 0.45;
    gMin = Math.min(gMin, gLo);
    B.stone.setColor('#a77f70'); box(B.stone, f, -0.06, L + 0.06, gLo, Ff, 0, 0.07, 'ftlr', [2, 2]);
    if (panel === 'BK') backWall(B, f, Ff);
    else if (e0[f.i] != null) {
      const ea = f.rev ? e0[f.i] : e0[f.i] + L, eb = f.rev ? e0[f.i] + L : e0[f.i], ua = uvOf(panel, ea, 0), ub = uvOf(panel, eb, WALL_H);
      quad(V, at(f, 0, Ff), at(f, L, Ff), at(f, L, top), at(f, 0, top), f.N, [[ua[0], ua[1]], [ub[0], ua[1]], [ub[0], ub[1]], [ua[0], ub[1]]]);
    } else {
      const n = Math.max(1, Math.round(L / E_BAY[panel])), w = L / n, nv = RECT[panel].length;
      for (let b = 0; b < n; b++) {
        const k = (b + kv) % nv, E = RECT[panel][k][2] / PX, ua = uvOf(panel, 0, 0, k), ub = uvOf(panel, E, WALL_H, k);
        quad(V, at(f, b * w, Ff), at(f, (b + 1) * w, Ff), at(f, (b + 1) * w, top), at(f, b * w, top), f.N, [[ua[0], ua[1]], [ub[0], ua[1]], [ub[0], ub[1]], [ua[0], ub[1]]]);
      }
    }
    B.wall.setColor('#e3c19a'); box(B.wall, f, -0.3, L + 0.3, top - 0.9, top - 0.45, 0, 0.3, 'ftlr', [2.5, 2.5]);
    B.wall.setColor('#eed0ac'); box(B.wall, f, -0.45, L + 0.45, top - 0.45, top, 0, 0.55, 'ftlru', [2.5, 2.5]);
  }

  // ---------------------------------------------------------------- the balcony band along the west bays and the street front
  for (const i of [16, 17, 18, 19, 20, 21, 22, 23]) {
    const f = faces[i], L = f.L, yl = SPEC[i][2] + 17.2;
    B.wall.setColor('#e0bd96'); box(B.wall, f, -0.2, L + 0.2, yl, yl + 0.35, 0, 0.55, 'ftlru', [2.5, 2.5]);
    B.balu.setColor('#eed0ac');
    quad(B.balu, at(f, 0.2, yl + 0.35, 0.5), at(f, L - 0.2, yl + 0.35, 0.5), at(f, L - 0.2, yl + 1.3, 0.5), at(f, 0.2, yl + 1.3, 0.5), f.N, [[0.2 / 1.8, 0], [(L - 0.2) / 1.8, 0], [(L - 0.2) / 1.8, 1], [0.2 / 1.8, 1]]);
    B.wall.setColor('#e0bd96');
    const np = Math.max(1, Math.round(L / 6));
    for (let k = 0; k <= np; k++) { const s = L * k / np; box(B.wall, f, s - 0.22, s + 0.22, yl + 0.35, yl + 1.38, 0.28, 0.72, 'ftlr'); }
    box(B.wall, f, 0, L, yl + 1.3, yl + 1.4, 0.3, 0.7, 'ft');
  }

  // ---------------------------------------------------------------- roofs
  B.clay.setColor(TILE);
  const P3 = (p, y) => [p[0], y, p[1]];
  // a hip over a convex outline: every edge slopes up to one end of the ridge (the ridge end is picked per vertex)
  const hipOver = (cd, r0, r1, assign, eave, rise) => {
    const ps = toM(cd), R = [toMapV(...r0), toMapV(...r1)], top = eave + rise, ye = eave - 0.15;
    ps.forEach((p, i) => { const j = (i + 1) % ps.length, ra = R[assign[i]], rb = R[assign[j]];
      roofPoly(B.clay, assign[i] === assign[j] ? [P3(p, ye), P3(ps[j], ye), P3(ra, top)] : [P3(p, ye), P3(ps[j], ye), P3(rb, top), P3(ra, top)], 1.2); });
  };
  hipOver(AP, [0, 9.5], [0, 19.5], [0, 0, 0, 0, 1, 1, 1, 1, 0], Y_A, 9.0);
  hipOver(BP, [-4, 45.3], [13, 45.3], [0, 1, 1, 1, 0, 0, 0], Y_B, 7.5);
  const truncated = (ringCD, eave, spec) => {
    const ring = toM(ringCD), rings = spec.map(([d]) => { let k = 1, R = ringInset(ring, d); while (!ringSimple(R) && k > 0.3) { k -= 0.12; R = ringInset(ring, d * k); } return R; });
    for (let t = 0; t + 1 < rings.length; t++) rings[t].forEach((p, i) => { const j = (i + 1) % ring.length; roofPoly(B.clay, [P3(p, eave + spec[t][1]), P3(rings[t][j], eave + spec[t][1]), P3(rings[t + 1][j], eave + spec[t + 1][1]), P3(rings[t + 1][i], eave + spec[t + 1][1])], 1.2); });
    B.clay.setColor('#6b3a2c'); B.clay.fill(rings[rings.length - 1], [], eave + spec[spec.length - 1][1], true); B.clay.setColor(TILE);
    return rings;
  };
  truncated(NP, Y_A, [[0.1, -0.1], [7, 5.0], [10, 6.4]]);
  truncated(SP, Y_SE, [[0.1, -0.1], [5, 4.0], [7.5, 5.2]]);
  // the three scalloped gables on the west front, and the iron cresting on the ridge
  gable(B, [-8.2, 3.9], [-11.0, 9.8], Y_A, 5.4);
  gable(B, [-11.3, 11.4], [-11.3, 21.2], Y_A, 8.0);
  gable(B, [-11.2, 21.6], [-8.3, 27.5], Y_A, 4.8);
  { const t = toMapV(0, 12.2), t2 = toMapV(0, 17.6), top = Y_A + 9.0;
    B.det.setColor(GREEN_D);
    for (const p of [t, t2]) { B.det.tube([p[0], top - 0.4, p[1]], [p[0], top + 3.4, p[1]], 0.07, 5); B.det.setColor('#c9a04e'); B.det.ellipsoid([p[0], top + 3.55, p[1]], [0.2, 0.28, 0.2], 6, 4); B.det.setColor(GREEN_D); }
    B.det.tube([t[0], top + 2.4, t[1]], [t2[0], top + 2.4, t2[1]], 0.035, 4);
  }

  // ---------------------------------------------------------------- the round tower of the south body, its band, clock and spire
  const TC = toMapV(...TOWER.c), tr = TOWER.r, yb = Y_B - 1.0, yd = Y_B + 7.4;
  { const [ua, v0] = uvPx('TW', 0, 150), [ub, v1] = uvPx('TW', 640, 0);
    cylBand(V, TC[0], TC[1], tr + 0.2, tr, yb, yd, 20, ua, ub, v0, v1);
    const [, w0] = uvPx('TW', 0, 225), [, w1] = uvPx('TW', 0, 150);
    cylBand(V, TC[0], TC[1], tr + 0.3, tr + 0.3, yd, yd + 2.2, 20, ua, ub, w0, w1);
    // the cornice under the band and the green spire
    B.wall.setColor('#eed0ac'); B.wall.lathe([[tr + 0.2, yd - 0.5], [tr + 0.7, yd - 0.3], [tr + 0.7, yd + 0.05], [tr + 0.4, yd + 0.1]], 20, TC[0], TC[1]);
    const rows = [[tr + 0.8, 0], [tr + 0.95, 0.5], [tr + 0.3, 1.5], [3.5, 3.0], [2.6, 4.8], [1.8, 6.8], [1.2, 8.8], [0.7, 10.6], [0.28, 12.2]], ys = yd + 2.2, [, s0] = uvPx('TW', 0, 330), [, s1] = uvPx('TW', 0, 225);
    for (let i = 0; i + 1 < rows.length; i++) cylBand(V, TC[0], TC[1], rows[i][0], rows[i + 1][0], ys + rows[i][1], ys + rows[i + 1][1], 20, ua, ub, s0 + (s1 - s0) * rows[i][1] / 12.2, s0 + (s1 - s0) * rows[i + 1][1] / 12.2);
    B.det.setColor('#c9a04e'); B.det.ellipsoid([TC[0], ys + 12.5, TC[1]], [0.3, 0.3, 0.3], 6, 4);
    B.det.setColor(GREEN_D); B.det.tube([TC[0], ys + 12.5, TC[1]], [TC[0], ys + 15.6, TC[1]], 0.06, 5);
    B.det.setColor('#c9a04e'); B.det.ellipsoid([TC[0], ys + 14.3, TC[1]], [0.22, 0.1, 0.22], 6, 3);
    // the clock on the band, facing the square
    const toSq = Math.atan2(-TC[1], -TC[0]), n = [Math.cos(toSq), Math.sin(toSq)], u = [n[1], -n[0]], cr = tr + 0.5;
    const cf = faceOf([TC[0] + n[0] * cr - u[0] * 1.5, TC[1] + n[1] * cr - u[1] * 1.5], [TC[0] + n[0] * cr + u[0] * 1.5, TC[1] + n[1] * cr + u[1] * 1.5], n[0], n[1]);
    clockOn(B, cf, 1.5, yd + 1.1, 2.4, 1, '#d7ece4');
  }

  // ---------------------------------------------------------------- iron balconies in the court and on the bays
  const balc = (f, s, y, w) => {
    const dep = 1.2, n = 8, pts = Array.from({ length: n + 1 }, (_, k) => { const a = k / n * PI; return [s + Math.cos(a) * w / 2, Math.sin(a) * dep]; });
    B.det.setColor(GREEN_D); fan(B.det, pts.map(([ss, o]) => at(f, ss, y, o)), [0, 1, 0]);
    B.det.setColor('#e0bd96'); fan(B.det, pts.map(([ss, o]) => at(f, ss, y - 0.18, o)).reverse(), [0, -1, 0]);
    B.rail.setColor('#3f7058');
    for (let k = 0; k < n; k++) {
      const a = at(f, pts[k][0], y + 0.04, pts[k][1] + 0.02), b = at(f, pts[k + 1][0], y + 0.04, pts[k + 1][1] + 0.02), len = Math.hypot(b[0] - a[0], b[2] - a[2]);
      quad(B.rail, a, b, [b[0], y + 1.05, b[2]], [a[0], y + 1.05, a[2]], [(a[2] - b[2]) / len, 0, (b[0] - a[0]) / len], [[0, 0], [len / 1.8, 0], [len / 1.8, 1], [0, 1]]);
    }
  };
  for (const [i, ys] of [[13, [10.2, 14.2]], [15, [10.2, 14.2]]]) { const f = faces[i], F = SPEC[i][2]; for (const k of [0.2, 0.5, 0.8]) ys.forEach((y, j) => balc(f, f.L * (k + (j ? 0.05 : -0.03)), F + y, 2.4)); }
  for (const [i, ss] of [[19, [2.5]], [17, [2.85]], [10, [2.5, 7.5]]]) for (const s of ss) for (const y of [6.3, 10.4]) balc(faces[i], s, SPEC[i][2] + y, 2.4);

  // ---------------------------------------------------------------- bollards across the court's mouth and the passage mouth
  const boll = [];
  const mouth = [[-7.4, 28.9], [-8.0, 30.9], [-8.6, 32.9], [-9.2, 34.9]].map(([c, d]) => toMapV(c, d));
  for (const [x, z] of [...mouth, ...[3.2, 4.2, 5.2].map((dd) => toMapV(10.5, 28.9 + dd * 1.45))]) {
    const y = H(x, z); B.det.setColor('#3b3f3a'); B.det.cyl(x, y, z, 0.13, 0.12, 0.95, 6, true); B.det.setColor('#c9a04e'); B.det.ellipsoid([x, y + 1.0, z], [0.13, 0.1, 0.13], 6, 3);
    boll.push([x, z, y]);
  }

  // ---------------------------------------------------------------- floodlights
  for (const [c, d] of [[-22, 6], [-22, 18], [-18, 27], [-20, 45], [20, -8], [48, -8], [70, -8]]) { const p = toMapV(c, d); wash.push([p[0], H(p[0], p[1]) + 0.8, p[1]]); }

  // ---------------------------------------------------------------- colliders
  const flat = (cd) => toM(cd).flat();
  S.prism(RING.flat(), gMin, Y_SE, 0, 0, 'wall');
  S.prism(flat(AP), Y_SE - 0.2, Y_A, 0, 0, 'wall');
  S.prism(flat(NP), Y_SE - 0.2, Y_A, 0, 0, 'wall');
  S.prism(flat(BP), Y_SE - 0.2, Y_B, 0, 0, 'wall');
  { const ia = ringInset(toM(AP), 3.5), ib = ringInset(toM(BP), 3.5);
    if (ringSimple(ia)) S.prism(ia.flat(), Y_A - 0.2, Y_A + 6.0, 0, 0, 'roof');
    if (ringSimple(ib)) S.prism(ib.flat(), Y_B - 0.2, Y_B + 5.5, 0, 0, 'roof'); }
  S.cyl(TC[0], TC[1], Y_B, Y_B + 9.6, tr + 0.2, tr, 'tower');
  S.cyl(TC[0], TC[1], Y_B + 9.6, Y_B + 22, tr + 0.8, 0.3, 'roof');
  for (const [x, z] of boll) S.cyl(x, z, gMin, H(x, z) + 0.95, 0.16, 0.16, 'post');
  return { footprints: [{ poly: RING, h: Y_A - gMin, kind: 'public', name: 'Palatul Vulturul Negru', id: VN_ID }], ring: RING, top: Y_B + 22 };
}

// the court's back wall: the wall with the scalloped gable on top and the arched mouth of the passage cut into it, in one
// polygon over its panel; behind the mouth a short hall (its far end lit: the passage runs on to the street and the
// south-east, 60 m of shops under a glass roof, not modelled)
function backWall(B, f, Ff) {
  const V = B.vn, L = f.L, top = Ff + WALL_H, half = [[0, 0], [0.5, 0.7], [1.3, 1.6], [2.2, 2.4], [3.0, 3.1]], mid = 4.2;
  const pts = [[0, Ff], [L, Ff], [L, top]];
  for (const [x, y] of half.slice(1)) pts.push([L - x, top + y]);
  pts.push([L / 2, top + mid]);
  for (const [x, y] of half.slice(1).reverse()) pts.push([x, top + y]);
  const sc = 3.95, hw = 1.8, hs = 4.1, rise = 1.0;
  const mouth = [[sc - hw, Ff], [sc + hw, Ff], [sc + hw, Ff + hs], ...Array.from({ length: 7 }, (_, k) => { const a = (k + 1) / 8 * PI; return [sc + Math.cos(a) * hw, Ff + hs + Math.sin(a) * rise]; }), [sc - hw, Ff + hs]];
  poly2uv(V, f, pts, [mouth], 0, (s, y) => uvOf('BK', s, y - Ff));
  // the hall: floor, two walls, a ceiling, the lit far end and two lamps
  const D = 7.0, yc = Ff + hs + rise, x0 = sc - hw, x1 = sc + hw;
  B.stone.setColor('#b9b2a4'); quad(B.stone, at(f, x0, Ff + 0.03, 0), at(f, x1, Ff + 0.03, 0), at(f, x1, Ff + 0.03, -D), at(f, x0, Ff + 0.03, -D), [0, 1, 0]);
  B.wall.setColor('#e9d6a8');
  quad(B.wall, at(f, x0, Ff, 0), at(f, x0, Ff, -D), at(f, x0, yc, -D), at(f, x0, yc, 0), f.U);
  quad(B.wall, at(f, x1, Ff, 0), at(f, x1, Ff, -D), at(f, x1, yc, -D), at(f, x1, yc, 0), f.U.map((v) => -v));
  B.wall.setColor('#d9c697'); quad(B.wall, at(f, x0, yc, 0), at(f, x1, yc, 0), at(f, x1, yc, -D), at(f, x0, yc, -D), [0, -1, 0]);
  B.glow.setColor('#fff3d8'); quad(B.glow, at(f, x0, Ff, -D), at(f, x1, Ff, -D), at(f, x1, yc, -D), at(f, x0, yc, -D), f.N);
  for (const o of [-2.2, -5.0]) for (const s of [x0 + 0.5, x1 - 0.5]) box(B.glow, f, s - 0.12, s + 0.12, yc - 0.55, yc - 0.15, o - 0.12, o + 0.12, 'fblrtu');
}

// a scalloped gable standing on the west front: an ogee outline over the chord p -> q (c, d), peak h above the eave
function gable(B, p, q, y, h) {
  const a = toMapV(...p), b = toMapV(...q), dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
  let n = [dz / L, -dx / L]; if (n[0] * EC[0] + n[1] * EC[1] > 0) n = [-n[0], -n[1]];
  const f = edgeFace(a, b, n), w = L, prof = [[0, 0], [0, 0.18], [0.07, 0.32], [0.17, 0.42], [0.28, 0.47], [0.36, 0.56], [0.43, 0.72], [0.48, 0.9], [0.5, 1.0]];
  const half = prof.map(([u, v]) => [u * w, v * h]), pts = [[0, y - 0.4], ...half.map(([s, v]) => [s, y + v]), ...half.slice(0, -1).reverse().map(([s, v]) => [w - s, y + v]), [w, y - 0.4]];
  poly2uv(B.vn, f, pts, [], 0.06, (s, yy) => uvOf('G', Math.min(10.4, s / w * 10.4), Math.max(0, (yy - y) / h * 8.0 + 0.2)));
  // the green roll along the edge
  const edge = pts.slice(1, -1), off = edge.map(([s, yy], i) => { const a2 = edge[Math.max(0, i - 1)], b2 = edge[Math.min(edge.length - 1, i + 1)]; let tx = b2[0] - a2[0], ty = b2[1] - a2[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l; const sg = s < w / 2 ? 1 : 1; return [s - ty * 0.5 * sg, yy + tx * 0.5 * sg]; });
  B.det.setColor(GREEN);
  strip(B.det, edge.map(([s, yy]) => at(f, s, yy, 0.12)), off.map(([s, yy]) => at(f, s, yy, 0.12)), f.N);
  B.det.setColor('#e0bd96'); box(B.det, f, 0, w, y - 0.5, y + 0.1, 0.04, 0.4, 'ftlr');
}
