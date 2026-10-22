// OWNER: oradea. Campusul BBSO, Biserica Baptistă «Speranța» Oradea (Strada Thurzó Sándor 19; opened 6 October 2024; Todor Studio,
// design concept Cosmin Todor, 7,130 m²). OSM draws the lot as one 'indus' box (way 1264556370); this builds what stands there from
// the architect's renders, the October 2024 night photograph (myoradea.ro), the Esri aerial and the OSM outline:
//   a glazed ground floor under a graphite zinc volume that overhangs it (dark mullions, a warm lobby with a wood-clad core, a
//   stair and ring lights behind the glass), a board-marked concrete entrance block with the engraved lettering, the zinc
//   volume (its top edge rolling inward into a low crown) wrapped on the south front and the east end in white perforated ribbons –
//   two tiers round a rounded south-east corner, one zigzag tier on the lower west wing – between thin black rails, the taller hall
//   box behind it, a slim light slab at the south-west with a low porch beside it, lit BBSO lettering on the wing and the hall, a dark
//   paved forecourt with bollards, lamps and young trees.
// Local frame (u, v, y): u along the long axis (ANG off map +x), v toward the front (south-south-east), origin the OSM ring's
// north-west corner, y above the lot's floor (yF). Every builder but pave carries this transform.
//   buildBbso({ B, S, g, r, lampsOut }) -> { footprints, clear(x, z), spots, stats, yF, ring (the lot hull) }
//   BBSO_ID: the OSM way it replaces;  BBSO_RING: its outline (map metres);  BBSO_LOT: what the terrain hook levels
// B needs: zinc, fin, conc, glass, lit, det, roof, pave, sign, engr
import { M4 } from '../../../../kit/mesh.js';
import { hull, inPoly } from '../../../cherkasy/geo.js';
import { PARK_GREENS } from '../../../trees.js';
import { PI, sq, band, fan, annulus, drape, lamp, shrub } from './kit.js';

export const BBSO_ID = 1264556370;
export const BBSO_RING = [[1219.4, 1662.9], [1218.5, 1658.8], [1228.8, 1656.4], [1229.4, 1658.9], [1239.2, 1656.6], [1248, 1694.8], [1247.2, 1697.4], [1246, 1698.6], [1177.7, 1714.7], [1179.6, 1722.8], [1166.5, 1725.8], [1162.2, 1707.6], [1164.4, 1707.1], [1157.4, 1677.3]];
const O = [1157.4, 1677.3], ANG = Math.atan2(-0.23005, 0.97318), CA = Math.cos(ANG), SA = Math.sin(ANG);
export const bbsoToMap = (u, v) => [O[0] + u * CA - v * SA, O[1] + u * SA + v * CA];
const toMap = bbsoToMap;
const W = 84.4, DP = 41.1, RC = 8, EV = 26, NA = 14, R0 = W - RC, VC = DP - RC;     // the main block, the rounded south-east corner
const H_W = 12.6, H_E = 15.2, H_C = 21.5, H_L = 13.8, SL = 3.8, PH = 5.4, CR = 3.2, CRH = 1.8;              // west wing, east volume, hall, the south-west block
const GL = 6.0, GV = DP - 1.2, GD = 3.6;                           // ground-floor height, glass line, lobby recess depth
export const BBSO_LOT = [[-4, 56], [-4, -4], [90, -4], [90, 56]].map(([u, v]) => toMap(u, v));
const COL = {
  zinc: '#f0f0f0', conc: '#f4f4f2', concL: '#c9ccce', mull: '#1c1f22', glass: '#9db8c6', wood: '#c4924e', woodD: '#9d6d38', white: '#f4f4f1',
  black: '#17191b', roof: '#a3a6a8', soffit: '#26292c', floor: '#6a5442', warm: '#f3e3c2', sign: '#ffffff', engr: '#6c7073', para: '#5d6368',
};

export function buildBbso({ B, S, g, r, lampsOut = [] }) {
  const corners = [[0, 0], [W, 0], [0, DP], [W, DP], [W / 2, DP / 2], [W / 2, DP + 8], [20, DP + 8], [60, DP + 8]];
  const yF = Math.max(...corners.map(([u, v]) => g(...toMap(u, v)))) + 0.12;
  const Y = (h) => yF + h;
  const loc = ['zinc', 'fin', 'conc', 'glass', 'lit', 'det', 'roof', 'sign', 'engr'];
  for (const k of loc) B[k].setXf(M4(O[0], yF, O[1], -ANG));
  const Z = B.zinc, F = B.fin, C = B.conc, G = B.glass, L = B.lit, T = B.det, Rf = B.roof, Sg = B.sign, E = B.engr;
  const stats = { fins: 0, mullions: 0, lamps: 0, trees: 0 };
  const gl = (u, v) => g(...toMap(u, v)) - yF;   // ground height in the local frame
  const NG = 63 & ~8;                            // a box without its underside

  const wallV = (D, u0, u1, v, y0, y1, dir = 1, k = 3) => sq(D, [[u0, y0, v], [u1, y0, v], [u1, y1, v], [u0, y1, v]], [0, 0, dir], [[u0 / k, y0 / k], [u1 / k, y0 / k], [u1 / k, y1 / k], [u0 / k, y1 / k]]);
  const wallU = (D, v0, v1, u, y0, y1, dir = 1, k = 3) => sq(D, [[u, y0, v0], [u, y0, v1], [u, y1, v1], [u, y1, v0]], [dir, 0, 0], [[v0 / k, y0 / k], [v1 / k, y0 / k], [v1 / k, y1 / k], [v0 / k, y1 / k]]);
  const flat = (D, u0, u1, v0, v1, y, up = 1, k = 3) => sq(D, [[u0, y, v0], [u1, y, v0], [u1, y, v1], [u0, y, v1]], [0, up, 0], [[u0 / k, v0 / k], [u1 / k, v0 / k], [u1 / k, v1 / k], [u0 / k, v1 / k]]);
  const bx = (D, u0, u1, v0, v1, y0, y1, mask = 63) => D.box(u0, y0, v0, u1, y1, v1, mask);
  const arc = (rad, n, a0 = PI / 2, a1 = 0) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [R0 + Math.cos(a) * rad, VC + Math.sin(a) * rad]; });
  const both = (D, pts, y0, y1, col) => { band(D, pts, y0, y1, { out: -1, uvM: [3, 3], col }); band(D, pts, y0, y1, { out: 1, uvM: [3, 3], col }); };

  // ------------------------------------------------------------------------------------------ the zinc volumes
  Z.setColor(COL.zinc);
  wallV(Z, 0, 14, 0, -0.8, H_W, -1); wallV(Z, 14, 70, 0, -0.8, H_C, -1); wallV(Z, 70, W, 0, -0.8, H_E + 0.5 + CRH, -1);
  wallU(Z, 0, 30.6, 0, -0.8, H_W, -1);                                   // the west end
  wallU(Z, 0, 28, 14, H_W, H_C, -1);                                       // the hall's west face above the wing
  wallU(Z, 0, 28, 70, H_E, H_C, 1);                                        // and its east face above the east volume
  wallV(Z, 14, EV, 28, H_W, H_C, 1); wallV(Z, EV, 70, 28, H_E, H_C, 1);    // the hall's south face above the lower roofs
  wallU(Z, 28, DP, EV, H_W, H_E, -1);                                      // the east volume's west face above the wing
  // the wing's south face over its glass, the volume's south face over the entrance block and the lobby, the rounded corner, the east face
  wallV(Z, 11.2, EV, DP, GL, H_W, 1); wallV(Z, EV, R0, DP, GL, H_E, 1);
  band(Z, arc(RC, NA), GL, H_E, { out: -1, uvM: [3, 3], col: COL.zinc });
  wallU(Z, 0, VC, W, GL, H_E, 1); wallU(Z, 0, 6, W, -0.8, GL, 1);
  // the soffits under the overhangs (dark)
  T.setColor(COL.soffit);
  flat(T, 11.2, 36, GV, DP, GL, -1); flat(T, 46, 70, DP - GD, DP, GL, -1); flat(T, 70, R0, GV, DP, GL, -1);
  annulus(T, [R0, VC], RC - 1.2, RC, 0, PI / 2, GL, 8, false); flat(T, W - 1.2, W, 6, VC, GL, -1);

  // the roofs: flat gravel, a low zinc parapet round the edge
  Rf.setColor(COL.roof);
  flat(Rf, 0, 14, 0, 30.6, H_W, 1); flat(Rf, SL, 14, 30.6, DP, H_W, 1); flat(Rf, 14, EV, 28, DP, H_W, 1);
  flat(Rf, 14, 70, 0, 28, H_C, 1);
  // the crown of the east volume: a fascia, then the zinc rolls inward and up round the south front, the corner and the east end
  { const edge = [[EV, DP], [R0, DP], ...arc(RC, NA).slice(1), [W, 0]], f0 = H_E, f1 = H_E + 0.5, y2 = f1 + CRH;
    band(Z, edge, f0, f1, { out: -1, uvM: [3, 3], col: COL.zinc });
    const r1 = RC - CR, inner = [[EV, DP - CR], [R0, DP - CR], ...arc(r1, NA).slice(1), [W - CR, 0]];
    const nrm = [[0, 1], [0, 1], ...Array.from({ length: NA }, (_, i) => { const a = PI / 2 - (PI / 2) * (i + 1) / NA; return [Math.cos(a), Math.sin(a)]; }), [1, 0]];
    for (let i = 0; i < edge.length - 1; i++) {
      const a = edge[i], b = edge[i + 1], c = inner[i + 1], d = inner[i], na = nrm[i], nb = nrm[i + 1];
      const N = (n) => { const l = Math.hypot(CR, CRH); return [n[0] * CRH / l, CR / l, n[1] * CRH / l]; };
      sq(Z, [[a[0], f1, a[1]], [b[0], f1, b[1]], [c[0], y2, c[1]], [d[0], y2, d[1]]], [N(na), N(nb), N(nb), N(na)], [[a[0] / 3, 0], [b[0] / 3, 0], [c[0] / 3, 2], [d[0] / 3, 2]]);
    }
    Rf.setColor('#9a9ea1'); fan(Rf, [[EV, 28], [EV, DP - CR], [R0, DP - CR], ...arc(r1, NA).slice(1), [W - CR, 0], [70, 0], [70, 28]], y2, true, [3, 3]);
  }
  T.setColor(COL.para);
  bx(T, 0, EV, DP - 0.3, DP, H_W, H_W + 0.45, NG); bx(T, 0, 0.3, 0, 30.6, H_W, H_W + 0.45, NG); bx(T, 0, 14, 0, 0.3, H_W, H_W + 0.45, NG);
  bx(T, 70, W, 0, 0.3, H_E + CRH + 0.5, H_E + CRH + 0.9, NG);
  bx(T, 14, 70, 0, 0.3, H_C, H_C + 0.5, NG); bx(T, 14, 70, 27.7, 28, H_C, H_C + 0.5, NG); bx(T, 14, 14.3, 0, 28, H_C, H_C + 0.5, NG); bx(T, 69.7, 70, 0, 28, H_C, H_C + 0.5, NG);
  T.setColor('#7b8186');
  for (const [u, v, w, d, h] of [[20, 6, 4, 2.6, 1.7], [34, 14, 5, 3, 2.0], [52, 19, 4.4, 2.6, 1.6], [60, 8, 3, 3, 1.4]]) bx(T, u, u + w, v, v + d, H_C, H_C + h, NG);

  // the south-west block: a tall slab of light board-marked concrete with slim lit slits, and a low glazed porch beside it
  C.setColor(COL.concL);
  wallU(C, 30.6, 49.3, -2.3, -0.8, H_L, -1); wallV(C, -2.3, 0, 30.6, -0.8, H_L, -1); wallV(C, 0, SL, 30.6, H_W, H_L, -1); wallV(C, -2.3, SL, 49.3, -0.8, H_L, 1);
  wallU(C, 41.1, 49.3, SL, PH, H_L, 1); wallU(C, 30.6, 41.1, SL, H_W, H_L, 1);
  Rf.setColor(COL.roof); flat(Rf, -2.3, SL, 30.6, 49.3, H_L, 1);
  T.setColor(COL.para); bx(T, -2.3, SL, 48.9, 49.3, H_L, H_L + 0.45, NG); bx(T, SL - 0.4, SL, 30.6, 49.3, H_L, H_L + 0.45, NG); bx(T, -2.3, -1.9, 30.6, 49.3, H_L, H_L + 0.45, NG); bx(T, -2.3, SL, 30.6, 31, H_L, H_L + 0.45, NG);
  L.setColor('#9fb4c0');
  for (const u of [-0.9, 1.1, 3.1]) wallV(L, u - 0.22, u + 0.22, 49.34, 1.4, H_L - 1.6, 1);
  // the porch: concrete walls, a flat roof, a glazed front
  C.setColor(COL.concL);
  wallU(C, 41.1, 49.3, 11.2, -0.8, PH, 1); wallV(C, SL, 11.2, 49.3, -0.8, PH, 1);
  Rf.setColor(COL.roof); flat(Rf, SL, 11.2, 41.1, 49.3, PH, 1);
  wallV(Z, SL, 11.2, DP, PH, H_W, 1);
  L.setColor('#9fb4c0'); for (const u of [6.4, 8.8]) wallV(L, u - 0.6, u + 0.6, 49.34, 0.6, PH - 0.8, 1);
  // the service tab on the north side
  C.setColor(COL.concL);
  wallV(C, 63.7, 74.3, -3.9, -0.8, 4.6, -1); wallU(C, -3.9, 0, 63.7, -0.8, 4.6, -1); wallU(C, -3.9, 0, 74.3, -0.8, 4.6, 1);
  Rf.setColor(COL.roof); flat(Rf, 63.7, 74.3, -3.9, 0, 4.6, 1);
  T.setColor(COL.mull); bx(T, 66, 68.4, -3.95, -3.8, 0, 3.2, NG);

  // ------------------------------------------------------------------------------------------ the glazed ground floor
  // A curtain wall: a translucent pane, dark mullions every `pitch`, a transom, and behind it a lit back wall, floor and ceiling,
  // so the lobby and the halls read through the glass.
  const along = (pts, pitch) => {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [a, b] = [pts[i], pts[i + 1]], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(len / pitch));
      for (let k = 0; k < n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
    }
    out.push(pts[pts.length - 1]);
    return out;
  };
  const curtain = (pts, y0, y1, pitch = 1.5) => {
    band(G, pts, y0, y1, { out: -1, uvM: [3, 3], col: COL.glass });
    T.setColor(COL.mull);
    for (const [u, v] of along(pts, pitch)) { bx(T, u - 0.045, u + 0.045, v - 0.06, v + 0.14, y0, y1, NG); stats.mullions++; }
    for (let i = 0; i < pts.length - 1; i++) {
      const [a, b] = [pts[i], pts[i + 1]], x0 = Math.min(a[0], b[0]) - 0.05, x1 = Math.max(a[0], b[0]) + 0.05, z0 = Math.min(a[1], b[1]) - 0.06, z1 = Math.max(a[1], b[1]) + 0.14;
      bx(T, x0, x1, z0, z1, y1 - 0.14, y1, NG); bx(T, x0, x1, z0, z1, y0, y0 + 0.14, NG); bx(T, x0, x1, z0, z1, 3.3, 3.4, NG);
    }
  };
  const room = (poly, back) => {   // floor and ceiling of a hall behind the glass, and its back wall (facing the glass)
    T.setColor(COL.floor); fan(T, poly, 0.12, true, [3, 3]);
    L.setColor(COL.warm); fan(L, poly, GL - 0.4, false, [3, 3]);
    for (const [a, b] of back) wallV(L, Math.min(a[0], b[0]), Math.max(a[0], b[0]), a[1], 0.12, GL - 0.4, 1);
  };
  // the forecourt under the overhang
  T.setColor('#6a6e72'); flat(T, 11.2, R0, GV, 41.9, 0.05, 1); flat(T, 46, 70, DP - GD, GV, 0.05, 1);
  curtain([[11.2, GV], [36, GV]], 0.12, GL - 0.4);                           // the long west front
  room([[11.2, GV], [36, GV], [36, GV - 7], [11.2, GV - 7]], [[[11.2, GV - 7], [36, GV - 7]]]);
  wallU(T, GV - 7, GV, 11.2, 0.12, GL - 0.4, 1); wallU(T, GV - 7, GV, 36, 0.12, GL - 0.4, -1);
  const eastPts = [[70, GV], [R0, GV], ...arc(RC - 1.2, NA).slice(1), [W - 1.2, 6]];
  curtain(eastPts, 0.12, GL - 0.4, 1.5);                                     // the east front, round the corner and along the east end
  room([[70, GV], [R0, GV], ...arc(RC - 1.2, NA).slice(1), [W - 1.2, 6], [W - 7.2, 6], [W - 7.2, GV - 6], [70, GV - 6]], [[[70, GV - 6], [W - 7.2, GV - 6]]]);
  L.setColor(COL.warm); wallU(L, 6, GV - 6, W - 7.2, 0.12, GL - 0.4, 1);
  T.setColor(COL.soffit); wallU(T, GV - 6, GV, 70, 0.12, GL - 0.4, 1);
  // the lobby, set 2.4 m deeper under the overhang
  curtain([[46, DP - GD], [70, DP - GD]], 0.12, GL - 0.4, 1.6);
  T.setColor(COL.soffit); wallU(T, DP - GD, GV, 70, 0.12, GL, -1);           // its east cheek, seen from outside
  room([[46, DP - GD], [70, DP - GD], [70, 18], [46, 18]], []);
  L.setColor(COL.woodD); wallV(L, 46, 70, 18.05, 0.12, GL - 0.4, 1); wallU(L, 18, DP - GD, 70, 0.12, GL - 0.4, -1); wallU(L, 18, DP - GD, 46, 0.12, GL - 0.4, 1);
  // inside the lobby: the wood-clad core with its slats, a stair, ring lights hung from the ceiling
  for (let k = 0; k < 14; k++) { L.setColor(k % 2 ? COL.wood : COL.woodD); bx(L, 59 + k * 0.5, 59.4 + k * 0.5, 22, 31, 0.12, GL - 0.4, NG); }
  L.setColor(COL.wood); bx(L, 58.6, 66.4, 31, 31.3, 0.12, GL - 0.4, NG);
  for (let k = 0; k < 10; k++) { L.setColor(k % 2 ? '#ddd0b4' : '#c9b78f'); bx(L, 47 + k * 1.05, 48.1 + k * 1.05, 20.2, 24.2, 0.12, 0.3 + k * 0.38, NG); }
  L.setColor('#fff3d8');
  for (const [u, v, rr] of [[52, 31, 1.9], [56, 34.4, 1.3], [49.5, 35.2, 1.0]]) { annulus(L, [u, v], rr - 0.14, rr, 0, 2 * PI, GL - 0.9, 16, true); annulus(L, [u, v], rr - 0.14, rr, 0, 2 * PI, GL - 0.9, 16, false); }

  // the entrance block: board-marked concrete, as high as the ground floor, the lettering engraved in it
  C.setColor(COL.conc);
  wallV(C, 36, 46, DP, -0.8, GL, 1, 3); wallU(C, 33, DP, 36, -0.8, GL, -1, 3); wallU(C, 33, DP, 46, -0.8, GL, 1, 3);
  C.setColor('#d6d8d7'); bx(C, 35.4, 46.6, DP, DP + 1.1, -0.8, 0.28, NG);   // the apron step in front of it

  // ------------------------------------------------------------------------------------------ the white perforated ribbons
  const path = [];
  for (let u = EV + 1; u < R0; u += 1) path.push({ u, v: DP, nu: 0, nv: 1 });
  for (let k = 0; k <= 16; k++) { const a = PI / 2 - (PI / 2) * k / 16; path.push({ u: R0 + Math.cos(a) * RC, v: VC + Math.sin(a) * RC, nu: Math.cos(a), nv: Math.sin(a) }); }
  for (let v = VC - 1; v >= 7; v -= 1) path.push({ u: W, v, nu: 1, nv: 0 });
  let tot = 0; path.forEach((p, i) => { p.s = i ? (tot += Math.hypot(p.u - path[i - 1].u, p.v - path[i - 1].v)) : 0; });
  const on = (s, o) => {
    s = Math.max(0, Math.min(tot, s));
    let i = 1; while (i < path.length - 1 && path[i].s < s) i++;
    const a = path[i - 1], b = path[i], f = (s - a.s) / ((b.s - a.s) || 1);
    const nu = a.nu + (b.nu - a.nu) * f, nv = a.nv + (b.nv - a.nv) * f, l = Math.hypot(nu, nv) || 1;
    return [a.u + (b.u - a.u) * f + nu / l * o, a.v + (b.v - a.v) * f + nv / l * o, nu / l, nv / l];
  };
  const blade = (s0, s1, y0, y1, lean, o) => {
    const P = [on(s0, o), on(s1, o), on(s1 + lean, o), on(s0 + lean, o)], ys = [y0, y0, y1, y1], m = on((s0 + s1) / 2 + lean / 2, o), w = Math.abs(s1 - s0);
    sq(F, P.map((p, k) => [p[0], ys[k], p[1]]), [m[2], 0, m[3]], [[0, y0], [w, y0], [w, y1], [0, y1]]);
    stats.fins++;
  };
  F.setColor(COL.white);
  for (const [ti, [y0, y1]] of [[GL + 0.5, 10.1], [10.3, 13.9]].entries()) {
    const lean = (y1 - y0) * 0.5;
    for (let s = -lean; s < tot + lean; s += 1.5) blade(s, s + 0.9, y0, y1, lean * (((Math.floor((s + 4) / 10) + ti) & 1) ? -1 : 1), 0.55);
    // the thin black rails above and below each tier and the brackets that hold the ribbons off the wall
    const pts = path.map((p) => [p.u + p.nu * 0.6, p.v + p.nv * 0.6]);
    both(T, pts, y0 - 0.12, y0 + 0.02, COL.black); both(T, pts, y1, y1 + 0.12, COL.black);
    T.setColor(COL.black);
    for (let s = 0; s <= tot; s += 3.2) { const a = on(s, 0.05), b = on(s, 0.6); bx(T, Math.min(a[0], b[0]) - 0.03, Math.max(a[0], b[0]) + 0.03, Math.min(a[1], b[1]) - 0.03, Math.max(a[1], b[1]) + 0.03, y0 - 0.12, y0, NG); }
  }
  // the west wing: one tier of blades that lean in groups of four, so the top edge zigzags as in the photographs
  { const y0 = GL + 0.5, y1 = 10.2, o = 0.6, lean = 1.9;
    for (let k = 0, u = 11.6; u < EV - 0.6; u += 1.45, k++) {
      const sgn = k < 5 ? -1 : 1, ua = u, ub = u + 0.9;
      sq(F, [[ua, y0, DP + o], [ub, y0, DP + o], [ub + sgn * lean, y1, DP + o], [ua + sgn * lean, y1, DP + o]].map(([a, b, c]) => [Math.max(11.4, Math.min(EV - 0.4, a)), b, c]), [0, 0, 1], [[0, y0], [0.9, y0], [0.9, y1], [0, y1]]);
      stats.fins++;
    }
    T.setColor(COL.black); bx(T, 11.4, EV - 0.4, DP + o - 0.04, DP + o + 0.06, y0 - 0.12, y0, NG); bx(T, 11.4, EV - 0.4, DP + o - 0.04, DP + o + 0.06, y1, y1 + 0.12, NG);
    for (let u = 12; u < EV - 0.4; u += 3.2) bx(T, u - 0.03, u + 0.03, DP, DP + o, y0 - 0.12, y0, NG);
  }

  // ------------------------------------------------------------------------------------------ the lettering
  // a 4:1 plate centred on (pos, y): plane 'v' on a +v / -v face, plane 'u' on a +u / -u face (pos then runs along v)
  const sign = (D, pos, y, at, w, dir, plane) => {
    const h = w / 4, uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
    if (plane === 'v') sq(D, [[pos - w / 2, y - h / 2, at], [pos + w / 2, y - h / 2, at], [pos + w / 2, y + h / 2, at], [pos - w / 2, y + h / 2, at]], [0, 0, dir], uv);
    else sq(D, [[at, y - h / 2, pos + w / 2], [at, y - h / 2, pos - w / 2], [at, y + h / 2, pos - w / 2], [at, y + h / 2, pos + w / 2]], [dir, 0, 0], uv);
  };
  Sg.setColor(COL.sign); E.setColor(COL.engr);
  sign(Sg, 17.6, 11.4, DP + 0.07, 12, 1, 'v');             // over the west wing's ribbons
  sign(Sg, 57, 19.7, 28.07, 12, 1, 'v');                 // on the hall, toward the car park
  sign(Sg, 14, 19.7, 70.07, 12, 1, 'u');                 // and toward the street, on the hall's east face
  sign(E, 41, 3.5, DP + 0.04, 6.4, 1, 'v');              // engraved in the concrete block

  // ------------------------------------------------------------------------------------------ the forecourt, planting, light
  B.pave.setColor('#ffffff');
  const apron = [[-4, 57], [-4, 50.6], [11.6, 50.6], [11.6, 41.9], [82.6, 41.9], [86.6, 38.4], [86.6, 3], [89, 3], [89, 57]];
  drape(B.pave, g, apron.map(([u, v]) => toMap(u, v)), 0.1, 8, 4);
  // bollards along the glass, planters with grasses and shrubs
  T.setColor('#3a3d40');
  for (let u = 13; u <= 82; u += 4.5) { if (u > 34 && u < 49) continue; const v = u > 69 ? DP + 1.5 : DP + 1.2; T.cyl(u, gl(u, v) - 0.05, v, 0.1, 0.1, 0.9, 6, true); }
  for (const [u0, u1, v] of [[14, 34, 44.2], [50, 78, 44.2]]) {
    T.setColor('#454a4f'); bx(T, u0, u1, v - 0.4, v + 0.4, -0.1, 0.45, NG);
    for (let u = u0 + 1; u < u1; u += 2.4) shrub(T, u, 0.35, v, 0.55, u % 4.8 < 2.4 ? '#7a8f55' : '#55743f', { k: 0.7 });
  }
  const spots = [];
  for (const [u, v] of [[16, 47.5], [27, 47.5], [53, 47.5], [66, 47.5], [79, 46], [88, 30], [88, 14], [4, 54]]) {
    const [x, z] = toMap(u, v);
    spots.push({ x, z, y: g(x, z) + 0.17, kind: 'park', sc: 0.38 + (spots.length % 3) * 0.05, pal: PARK_GREENS });
    stats.trees++;
  }
  for (const [u, v] of [[10, 52.5], [32, 53], [50, 53], [72, 53], [87.8, 41], [87.8, 10]]) {
    const [x, z] = toMap(u, v), y = gl(u, v);
    lamp(T, u, y, v, { h: 6.0, glow: L });
    lampsOut.push([x, g(x, z) + 6.0, z]); S.cyl(x, z, yF - 0.3, Y(6), 0.14, 0.12, 'pole'); stats.lamps++;
  }

  // ------------------------------------------------------------------------------------------ collision
  const solid = (poly, y0, y1) => S.prism(poly.map(([u, v]) => toMap(u, v)).flat(), Y(y0), Y(y1), 0, 0, 'wall', 0);
  solid([[0, 0], [EV, 0], [EV, DP], [0, DP]], -0.6, H_W + 0.4);                                            // the west wing
  solid([[EV, 0], [W, 0], [W, VC], ...arc(RC, 8, 0, PI / 2), [EV, DP]], -0.6, H_E + 0.5 + CRH);            // the east volume with its crown
  solid([[14, 0], [70, 0], [70, 28], [14, 28]], H_E, H_C + 0.5);                                            // the hall box over both
  solid([[-2.3, 30.6], [SL, 30.6], [SL, 49.3], [-2.3, 49.3]], -0.6, H_L + 0.5);                             // the tall slab
  solid([[SL, 41.1], [11.2, 41.1], [11.2, 49.3], [SL, 49.3]], -0.6, PH + 0.2);                              // the porch
  solid([[63.7, -3.9], [74.3, -3.9], [74.3, 0], [63.7, 0]], -0.6, 4.8);                                     // the service tab
  for (const k of loc) B[k].setXf(null);

  const ring = hull([...BBSO_RING, ...BBSO_LOT]);
  return {
    footprints: [{ poly: BBSO_RING.map((p) => [p[0], p[1]]), h: H_C, kind: 'church', name: 'Campusul BBSO', id: BBSO_ID }],
    spots, stats, yF, ring,
    clear: (x, z) => inPoly(ring, x, z),
  };
}
