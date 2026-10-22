// Palatul Episcopal Greco-Catolic (the Greek Catholic Episcopal Palace), Piața Unirii, Oradea (OSM way 41415055): Kálmán
// Rimanóczy Jr., 1903–1905, an eclectic mix of neo-Romanian, Moorish and Gothic motifs; the fire of 25–26 August 2018 took
// the roof and the corner tower, which were rebuilt (slate-blue mansard, a conical copper tower, July 2019). Built after the
// Commons photos of 2022–2023: the east front on the square – pink granite plinth, cream-peach ground floor with shuttered
// arched windows and the carved wooden portal in a rope-moulded arch, white string course, the coral piano nobile with the
// triple round-arched loggia on paired colonnettes under white zig-zag gables and medallions, two projecting coral towers on
// balconies with white pinnacled turrets, the attic balustrade with the arms cartouche and cross, the steep mansard with
// dormers, the lower north wing with its pierced parapet – and the round corner tower with its crenellated belt, cone, iron
// gallery, open lantern and spire; plainer coral walls with arched windows on the other sides.
//   buildPalace({ B, S, g, wash }) -> { footprints, top }
//   Local frame (a, d): a along the east front from its south end northward, d into the building (westward);
//   toMap(a, d) -> [x, z]. Heights over the floor F.
import { M4 } from '../../../../kit/mesh.js';
import { planFace, fan, windowA, roofPoly, slopeSolid, archFill, archRing, pilaster, at, quad, rect, box, PI } from './facekit.js';
import { COL } from './set.js';

export const PALACE_ID = 41415055;
const O = [-52.5, 100.2], Av = [-10.6 / 37.53, -36 / 37.53], D = [-0.9593, 0.2824];
export const toMap = (a, d) => [O[0] + Av[0] * a + D[0] * d, O[1] + Av[1] * a + D[1] * d];
const YAW = Math.atan2(-Av[1], Av[0]);                           // M4 yaw that sends local +x to the front's run (south to north); local +z is then outward (east)
const mT = M4(O[0], 0, O[1], YAW);                               // local (a, y, z = -d)
const PLAN = [[0, 0], [37.56, 0], [37.9, 27.5], [19.8, 26.3], [19.3, 37.4], [24.4, 37.8], [24.0, 47.3], [-0.5, 48.8]];
const UVM = [2.5, 2.5];
const K = { cream: '#f6dfae', coral: '#ee8c6a', white: '#f4eee0', plinth: '#b5877b', slate: '#4a5058', copper: '#5a493d', shutter: '#6d4b34', wood: '#8a5a30' };
const H = { plinth: 1.1, ground: 6.4, wing: 14.5, mid: 16.7 };

export function buildPalace({ B, S, g, wash }) {
  const ring = PLAN.map(([a, d]) => toMap(a, d)), P = B.plaster, ST = B.stone, inside = toMap(18, 12);
  const hs = [...ring, toMap(18, 12)].map(([x, z]) => g(x, z));
  const F = Math.max(...hs.slice(0, ring.length)) + 0.3, gLo = Math.min(...hs) - 0.4, Y = (h) => F + h;
  const mk = (p, q) => planFace(toMap, p, q, inside);

  // ---- walls of the plainer sides: cream ground floor, coral upper floor, windows in a steady rhythm
  const wall = (p, q, o = {}) => {
    const f = mk(p, q), L = f.L, nb = Math.max(1, Math.round(L / 4.0));
    P.setColor(K.cream); rect(P, f, 0, L, gLo, Y(H.ground), 0, UVM);
    P.setColor(K.coral); rect(P, f, 0, L, Y(H.ground), Y(H.wing), 0, UVM);
    ST.setColor(K.plinth); box(ST, f, -0.1, L + 0.1, gLo, Y(H.plinth), 0, 0.12, 'ftlr', [1.2, 1.2]);
    P.setColor(K.white); box(P, f, -0.2, L + 0.2, Y(H.ground) - 0.4, Y(H.ground) + 0.2, 0, 0.4, 'ftlru'); box(P, f, -0.25, L + 0.25, Y(H.wing) - 0.6, Y(H.wing), 0, 0.6, 'ftlru');
    for (let k = 0; k < nb; k++) {
      const s = (k + 0.5) * L / nb;
      windowA(B, f, { s, y0: Y(2.0), w: 1.7, h: 2.1, rise: 0.85, sur: 0.26, surCol: K.white, glass: K.shutter, sill: true });
      windowA(B, f, { s, y0: Y(7.4), w: 1.7, h: 2.8, rise: 0.85, sur: 0.34, surCol: K.white, glass: '#3d3430', lit: true, sill: true });
    }
    return f;
  };
  const sw = [wall([0, 0], [-0.5, 48.8]), wall([-0.5, 48.8], [24.0, 47.3]), wall([24.0, 47.3], [24.4, 37.8]), wall([24.4, 37.8], [19.3, 37.4]), wall([19.3, 37.4], [19.8, 26.3]), wall([19.8, 26.3], [37.9, 27.5]), wall([37.9, 27.5], [37.56, 0])];

  // ================================================================ the east front
  const f = mk([0, 0], [37.56, 0]), L = f.L, sc = 14.0;
  P.setColor(K.cream); rect(P, f, 0, L, gLo, Y(H.ground), 0, UVM);
  P.setColor(K.coral); rect(P, f, 0, L, Y(H.ground), Y(H.wing), 0, UVM);
  ST.setColor(K.plinth); box(ST, f, -0.1, L + 0.1, gLo, Y(H.plinth), 0, 0.14, 'ftlr', [1.2, 1.2]);
  P.setColor(K.white);
  box(P, f, -0.2, L + 0.2, Y(5.6), Y(6.0), 0, 0.5, 'ftlru'); box(P, f, -0.2, L + 0.2, Y(6.0), Y(6.4), 0, 0.3, 'ftlru');
  // ground floor: shuttered arched windows and the portal
  for (const s of [3.5, 9.9, 18.5, 24.0, 28.6, 33.2]) windowA(B, f, { s, y0: Y(2.0), w: 1.75, h: 2.1, rise: 0.85, sur: 0.28, surCol: K.white, glass: K.shutter, sill: true });
  { const c = sc;
    archFill(P, f, c, Y(1.4), 3.7, 2.2, 1.85, 0.03, '#f6e6bc'); archRing(P, f, c, Y(1.4), 3.7, 2.2, 1.85, 0.3, 0.05, K.white); archRing(P, f, c, Y(1.4), 4.4, 2.2, 2.2, 0.16, 0.08, '#e9dcc0');
    windowA(B, f, { s: c, y0: Y(1.4), w: 2.9, h: 2.0, rise: 1.45, sur: 0.0, glass: K.wood, off: 0.1 });
    for (const sg of [-1, 1]) for (const dx of [2.0, 2.4]) { const [x, , z] = at(f, c + sg * dx, 0, 0.18); B.stone.setColor(K.white).cyl(x, F, z, 0.1, 0.1, 3.4, 6, false); }
    for (let i = 0; i < 3; i++) { ST.setColor('#b5ad9d'); box(ST, f, c - 2.6 + i * 0.3, c + 2.6 - i * 0.3, gLo, F - 0.1, 0, 0.6 + (2 - i) * 0.4, 'ftlr'); }
  }
  // ---- the piano nobile: the loggia, gables, medallions, the attic balustrade, the cartouche
  const arches = [10.9, 14.0, 17.1];
  for (const s of arches) {
    archRing(P, f, s, Y(7.5), 2.3, 3.9, 1.15, 0.32, 0.07, K.white); archRing(P, f, s, Y(7.5), 3.0, 3.9, 1.5, 0.12, 0.09, '#eadfc4');
    windowA(B, f, { s, y0: Y(7.5), w: 2.3, h: 3.9, rise: 1.15, sur: 0.0, glass: '#3a322e', lit: true, off: 0.05, rows: 2, cols: 3 });
    // zig-zag gable over each arch
    P.setColor(K.white); fan(P, [at(f, s - 1.9, Y(12.9), 0.08), at(f, s + 1.9, Y(12.9), 0.08), at(f, s, Y(15.0), 0.08)], f.N);
    P.setColor(K.coral); fan(P, [at(f, s - 1.45, Y(12.9), 0.12), at(f, s + 1.45, Y(12.9), 0.12), at(f, s, Y(14.45), 0.12)], f.N);
    P.setColor(K.white); fan(P, Array.from({ length: 12 }, (_, k) => at(f, s + Math.cos(k / 12 * PI * 2) * 0.4, Y(13.35) + Math.sin(k / 12 * PI * 2) * 0.4, 0.15)), f.N);
  }
  for (const s of [9.35, 12.45, 15.55, 18.65]) { // paired colonnettes with capitals, and the balcony band under the arches
    for (const dx of [-0.2, 0.2]) { B.stone.setColor(K.white); const [x, , z] = at(f, s + dx, 0, 0.28), y0 = Y(7.5); B.stone.cyl(x, y0, z, 0.1, 0.1, 3.4, 6, false); B.stone.box(x - 0.17, y0 + 3.4, z - 0.17, x + 0.17, y0 + 3.65, z + 0.17); B.stone.box(x - 0.15, y0 - 0.1, z - 0.15, x + 0.15, y0, z + 0.15); }
  }
  P.setColor(K.white); box(P, f, 9.0, 19.0, Y(6.4), Y(7.5), 0, 0.5, 'ftlru'); box(P, f, 9.0, 19.0, Y(14.9), Y(15.5), 0, 0.5, 'ftlru');
  P.setColor('#e9dcc0'); box(P, f, 9.0, 19.0, Y(12.9), Y(13.0), 0, 0.2, 'ft');
  // the attic balustrade (dark slots in a white band) and the arms cartouche with the cross
  P.setColor(K.white); box(P, f, 9.0, 19.0, Y(15.5), Y(15.9), 0, 0.3, 'ftlru'); box(P, f, 9.0, 19.0, Y(16.7), Y(17.0), 0, 0.4, 'ftlru');
  for (let s = 9.4; s < 18.8; s += 0.8) if (Math.abs(s - sc) > 1.8) { P.setColor('#c9bfa6'); box(P, f, s, s + 0.4, Y(15.9), Y(16.7), 0, 0.3, 'ftlr'); }
  { P.setColor(K.white); const pts = []; for (let k = 0; k <= 12; k++) { const a = PI - k / 12 * PI; pts.push(at(f, sc + Math.cos(a) * 1.5, Y(16.5) + Math.sin(a) * 2.5, 0.2)); }
    fan(P, [at(f, sc - 1.5, Y(15.9), 0.2), ...pts, at(f, sc + 1.5, Y(15.9), 0.2)], f.N);
    P.setColor(K.coral); fan(P, Array.from({ length: 14 }, (_, k) => at(f, sc + Math.cos(k / 14 * PI * 2) * 0.85, Y(17.4) + Math.sin(k / 14 * PI * 2) * 1.0, 0.25)), f.N);
    P.setColor(K.white); fan(P, Array.from({ length: 12 }, (_, k) => at(f, sc + Math.cos(k / 12 * PI * 2) * 0.55, Y(17.4) + Math.sin(k / 12 * PI * 2) * 0.7, 0.3)), f.N);
    const [cx, , cz] = at(f, sc, 0, 0.1); B.stone.setColor(K.white); B.stone.box(cx - 0.05, Y(19.0), cz - 0.05, cx + 0.05, Y(20.6), cz + 0.05); B.stone.box(cx - 0.4, Y(19.9), cz - 0.05, cx + 0.4, Y(20.0), cz + 0.05); }
  // ---- the two towers on their balconies, with the white pinnacled turrets
  for (const [s0, s1] of [[6.4, 9.0], [19.0, 21.6]]) {
    const sm = (s0 + s1) / 2;
    P.setColor(K.coral); box(P, f, s0, s1, Y(H.ground), Y(17.9), 0, 0.55, 'ftlr', UVM);
    P.setColor(K.white); box(P, f, s0 - 0.12, s1 + 0.12, Y(17.9), Y(18.4), 0, 0.85, 'ftlru');
    P.setColor('#2a2523'); box(P, f, sm - 0.14, sm + 0.14, Y(11.4), Y(13.0), 0.55, 0.58, 'f');                          // the slit
    for (const dx of [-0.75, 0, 0.75]) windowA(B, f, { s: sm + dx, y0: Y(15.7), w: 0.5, h: 1.0, rise: 0.25, sur: 0.1, surCol: K.white, glass: '#3a332f', off: 0.58 });
    P.setColor(K.white); fan(P, Array.from({ length: 12 }, (_, k) => at(f, sm + Math.cos(k / 12 * PI * 2) * 0.33, Y(14.1) + Math.sin(k / 12 * PI * 2) * 0.33, 0.6)), f.N);
    const [tx, , tz] = at(f, sm, 0, 0.27);
    B.stone.setColor(K.white); B.stone.lathe([[1.45, 0], [1.35, 0.5], [1.15, 0.6], [1.15, 2.2], [1.45, 2.4], [1.45, 2.6], [1.2, 2.7], [0.9, 3.5], [0.35, 4.6], [0.08, 5.1]].map(([r, h]) => [r, Y(18.4) + h]), 8, tx, tz);
    B.stone.ellipsoid([tx, Y(18.4) + 5.2, tz], [0.14, 0.14, 0.14], 6, 4);
    // the balcony: a bracketed slab with a pierced balustrade
    P.setColor(K.white); box(P, f, s0 - 0.15, s1 + 0.15, Y(6.1), Y(6.5), 0, 1.15, 'ftlru'); box(P, f, s0 + 0.2, s1 - 0.2, Y(4.9), Y(6.1), 0, 0.7, 'ftlru'); box(P, f, s0 + 0.55, s1 - 0.55, Y(4.5), Y(4.9), 0, 0.4, 'ftlru');
    box(P, f, s0 - 0.15, s1 + 0.15, Y(7.3), Y(7.5), 0.95, 1.15, 'ftlru');
    for (let s = s0 - 0.05; s < s1; s += 0.45) box(P, f, s, s + 0.2, Y(6.5), Y(7.3), 0.97, 1.13, 'ftlru');
    windowA(B, f, { s: sm, y0: Y(8.0), w: 1.0, h: 2.0, rise: 0.0, sur: 0.2, surCol: K.white, glass: '#3a332f', off: 0.58 });
  }
  // ---- the wings: windows, the pierced parapets, the string course
  for (const s of [24.6, 29.0, 33.4]) { windowA(B, f, { s, y0: Y(7.4), w: 1.7, h: 2.8, rise: 0.85, sur: 0.38, surCol: K.white, glass: '#3d3430', lit: true, sill: true }); }
  fan(P, [at(f, 31.5, Y(11.8), 0.1), at(f, 35.3, Y(11.8), 0.1), at(f, 33.4, Y(13.5), 0.1)], f.N);
  P.setColor(K.white); box(P, f, 21.6, L + 0.3, Y(H.wing) - 0.5, Y(H.wing), 0, 0.5, 'ftlru'); box(P, f, 21.6, L, Y(H.wing), Y(H.wing) + 1.2, 0, 0.3, 'ftlru');
  for (let s = 22.2; s < L - 0.6; s += 1.1) { P.setColor('#c4b79b'); box(P, f, s, s + 0.4, Y(H.wing) + 0.3, Y(H.wing) + 0.95, 0.3, 0.34, 'f'); }
  P.setColor('#e9dcc0'); box(P, f, 21.6, L, Y(10.9), Y(11.25), 0, 0.12, 'ftlr');
  // the south bay: a coral window with a gable hood, a cream attic over it, the corner turret
  { P.setColor(K.cream); box(P, f, 0.0, 6.4, Y(11.2), Y(H.wing), 0, 0.1, 'ft', UVM);
    windowA(B, f, { s: 3.5, y0: Y(7.4), w: 1.7, h: 2.8, rise: 0.85, sur: 0.38, surCol: K.white, glass: '#3d3430', lit: true, sill: true });
    P.setColor(K.white); fan(P, [at(f, 1.6, Y(11.7), 0.1), at(f, 5.4, Y(11.7), 0.1), at(f, 3.5, Y(13.4), 0.1)], f.N);
    for (const dx of [-0.55, 0, 0.55]) windowA(B, f, { s: 3.5 + dx, y0: Y(12.6), w: 0.4, h: 0.7, rise: 0.2, sur: 0.08, surCol: K.white, glass: '#3a332f', off: 0.12 });
    P.setColor(K.white); box(P, f, -0.2, 6.4, Y(H.wing) - 0.3, Y(H.wing), 0, 0.6, 'ftlru'); }

  // ---- the round corner tower
  { const [cx, cz] = toMap(4.4, 3.6), y0 = Y(11.5);
    P.setColor(K.cream); P.lathe([[3.05, 0], [3.05, 3.4]].map(([r, h]) => [r, y0 + h]), 16, cx, cz);
    P.setColor(K.white); P.lathe([[3.1, -0.3], [3.55, 0.0], [3.55, 0.5], [3.2, 0.6]].map(([r, h]) => [r, y0 + h]), 16, cx, cz);
    for (let k = 0; k < 14; k++) { const a = k / 14 * PI * 2; P.box(cx + Math.cos(a) * 3.35 - 0.16, y0 + 0.6, cz + Math.sin(a) * 3.35 - 0.16, cx + Math.cos(a) * 3.35 + 0.16, y0 + 1.1, cz + Math.sin(a) * 3.35 + 0.16); }
    P.lathe([[3.1, 3.0], [3.4, 3.2], [3.4, 3.7], [3.1, 3.9]].map(([r, h]) => [r, y0 + h]), 16, cx, cz);
    const yc = y0 + 3.9;
    B.copper.setColor(K.copper); B.copper.lathe([[3.45, yc], [3.0, yc + 1.0], [2.4, yc + 2.8], [1.95, yc + 4.7], [1.8, yc + 5.0]], 14, cx, cz);
    B.det.setColor('#2d2926'); B.det.lathe([[2.2, yc + 4.8], [2.25, yc + 5.1], [2.0, yc + 5.3], [1.9, yc + 6.3]], 12, cx, cz);
    for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2; B.det.tube([cx + Math.cos(a) * 2.15, yc + 5.3, cz + Math.sin(a) * 2.15], [cx + Math.cos(a) * 2.15, yc + 6.3, cz + Math.sin(a) * 2.15], 0.03, 4); }
    B.det.lathe([[1.15, yc + 5.3], [1.15, yc + 7.4]], 6, cx, cz);
    B.copper.lathe([[1.55, yc + 7.4], [1.35, yc + 8.0], [0.9, yc + 10.4], [0.45, yc + 12.4], [0.12, yc + 14.4]], 8, cx, cz);
    B.det.setColor('#4a3a32'); B.det.ellipsoid([cx, yc + 14.5, cz], [0.16, 0.16, 0.16], 6, 4); B.det.cyl(cx, yc + 14.6, cz, 0.04, 0.02, 2.2, 4, true);
    // the small turret on the corner
    const [kx, kz] = toMap(1.0, 0.9);
    P.setColor(K.white); P.lathe([[0.9, 0], [0.95, 0.4], [0.75, 0.5], [0.75, 1.6], [0.95, 1.7], [0.95, 2.0]].map(([r, h]) => [r, Y(11.4) + h]), 10, kx, kz);
  }

  // ================================================================ roofs
  const slate = K.slate, p3 = ([a, d], y) => { const [x, z] = toMap(a, d); return [x, y, z]; };
  const frustum = (a0, a1, d0, d1, ya, a2, a3, d2, d3, yb, over = 0.3) => {
    const base = [[a0 - over, d0 - over], [a1 + over, d0 - over], [a1 + over, d1 + over], [a0 - over, d1 + over]], top = [[a2, d2], [a3, d2], [a3, d3], [a2, d3]];
    B.slate.setColor(slate);
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; roofPoly(B.slate, [p3(base[i], ya), p3(base[j], ya), p3(top[j], yb), p3(top[i], yb)], 1.5); }
    roofPoly(B.slate, top.map((q) => p3(q, yb)), 2);
  };
  frustum(9.0, 19.0, 0.4, 16.0, Y(H.mid), 11.6, 16.4, 4.4, 10.5, Y(20.4), 0.3);
  frustum(21.6, 37.7, 0.0, 27.6, Y(H.wing + 0.2), 25.0, 35.0, 8.0, 20.5, Y(18.8), 0.3);
  frustum(0.0, 6.4, 0.0, 8.0, Y(H.wing - 0.1), 1.5, 4.5, 2.0, 5.0, Y(16.2), 0.3);
  // the dormers on the mansard's front: copper-clad boxes with a hipped cap and a dark window
  for (const a of [11.8, 16.2]) {
    const y = Y(17.5);
    B.copper.setColor('#6a5a4c'); B.copper.with(mT, (q) => q.box(a - 0.75, y, -2.5, a + 0.75, y + 1.5, -1.3, 1 | 2 | 16 | 32));
    const c4 = [[a - 0.85, 1.2], [a + 0.85, 1.2], [a + 0.85, 2.6], [a - 0.85, 2.6]].map((q) => p3(q, y + 1.5)), ap = p3([a, 1.9], y + 2.3);
    for (let i = 0; i < 4; i++) roofPoly(B.copper, [c4[i], c4[(i + 1) % 4], ap], 1);
    B.glass.setColor('#2a2523'); rect(B.glass, f, a - 0.4, a + 0.4, y + 0.25, y + 1.2, -1.28);
  }
  // the flat roof under all of it, and the cross wing's gable (ridge along d)
  B.slate.setColor(slate); roofPoly(B.slate, [[0, 0], [37.8, 0], [37.8, 27.6], [0, 27.6]].map((q) => p3(q, Y(H.wing + 0.15))), 2);
  roofPoly(B.slate, [[19.0, 36.8], [24.8, 36.8], [24.8, 48.4], [19.0, 48.4]].map((q) => p3(q, Y(H.wing + 0.15))), 2);
  { const R = Y(17.6), E = Y(14.4), a0 = -0.9, a1 = 20.6, am = 9.85, d0 = 26.8, d1 = 49.2;
    roofPoly(B.slate, [p3([a0, d0], E), p3([a0, d1], E), p3([am, d1], R), p3([am, d0], R)], 1.5);
    roofPoly(B.slate, [p3([a1, d1], E), p3([a1, d0], E), p3([am, d0], R), p3([am, d1], R)], 1.5);
    roofPoly(B.slate, [p3([a0, d1], E), p3([a1, d1], E), p3([am, d1], R)], 1.5); }
  // ---- floodlights and colliders
  wash.push(at(f, 6, Y(0.6), 7), at(f, 14, Y(0.6), 7), at(f, 22, Y(0.6), 7), at(f, 31, Y(0.6), 7));
  S.prism(ring.flat(), gLo, Y(H.wing + 1.5), 0, 0, 'wall');
  S.cyl(...toMap(4.4, 3.6), Y(H.wing), Y(26.5), 3.3, 1.5, 'roof');
  return { footprints: [{ poly: ring, h: Y(H.wing + 6) - gLo, kind: 'public', name: 'Palatul Episcopal Greco-Catolic', id: PALACE_ID }], top: Y(33) };
}
