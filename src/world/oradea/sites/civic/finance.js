// OWNER: oradea. The Palace of Finance (Palatul Finanțelor, now Policlinica nr. 2), Oradea (OSM way 423100516; Rimanóczy Kálmán jr., 1899–1900,
// a Secession-touched Neo-Baroque palace, empty and wrapped in scaffold nets since the 2010s). Built after the Wikimedia Commons photo
// "No. 2 Policlinics, former Palace of Finance" (the corner view with the three domes) and Brigitte Tohm's close-up of the pedimented centre
// (Unsplash, 2016), as the building looked before the nets (the plaster is drawn whole, no scaffolding):
//   a rusticated ground floor of grey ashlar with arched windows, two storeys of cream render over it – arched windows with
//   balustrades and cartouches on the first, square ones in moulded frames on the second –, a heavy cornice; the west front's centre
//   is a pedimented risalit of three bays with two big columns between arched windows and square ones; a big red hipped roof and three
//   grey zinc domes with red bands (over the south end, the hall behind the pediment, the north end). The east side and the ends are the
//   same painted bays (a guess: the photos show only the west front and the south end).
//   buildFinance(ctx) -> { footprints, ring, clear(x, z), yT, stats }      FIN_ROWS: the atlas strips (fg, f1, f2)
import { M4 } from '../../../../kit/mesh.js';
import { ringFaces } from '../../../cherkasy/slabkit.js';
import { box, skin, hole, poly, frame, archPts, archOpening, rake, column, cap, band, cornice, mansard, PI } from './kit.js';
import { stone, plaster, glassRect, archPath } from './bays.js';
import { bayWall } from './walls.js';
import { inside, corners } from './rects.js';

export const FIN_ID = 423100516;
export const FIN_RING = [[947.1, 125.2], [936.7, 95.6], [942.6, 81.2], [940.4, 74.5], [960.2, 67.3], [975.2, 116.4]];
const COL = { wall: '#e6dcc2', white: '#efe9dc', stone: '#bfb39c', plinth: '#a59b88', roof: '#9c3b2d', roofD: '#8d3328', zinc: '#a3aaaf', band: '#8a3a30', col: '#ece4d2', glass: '#5a6b73' };
const PL = 1.0, G = 5.2, S1 = 5.6, T1 = 10.6, S2 = 10.9, T2 = 15.0, COR = 16.6;

const pil = (g, x, y, w, h) => { g.fillStyle = 'rgba(246,240,226,0.55)'; g.fillRect(x, y, 5, h); g.fillRect(x + w - 5, y, 5, h); };
function paintG(g, x, y, w, h, i, r) {
  stone(g, x, y, w, h, COL.stone, r);
  const ww = 50, wx = x + (w - ww) / 2, wy = y + 22, wb = y + h - 40;
  g.fillStyle = '#e2d9c6'; archPath(g, wx - 8, wy - 8, ww + 16, wb - wy + 8 + 5); g.fill();
  g.save(); archPath(g, wx, wy, ww, wb - wy); g.clip(); glassRect(g, wx, wy, ww, wb - wy);
  g.fillStyle = '#e8e0cf'; g.fillRect(wx + ww / 2 - 1.5, wy, 3, wb - wy); g.fillRect(wx, wy + ww * 0.6, ww, 3); g.restore();
  g.fillStyle = '#ece4d2'; g.fillRect(wx + ww / 2 - 5, wy - 14, 10, 10); g.fillRect(wx - 10, wb, ww + 20, 5);
  return [[wx, wy, ww, wb - wy]];
}
function paintF1(g, x, y, w, h, i, r) {
  plaster(g, x, y, w, h, COL.wall, r);
  pil(g, x, y, w, h);
  const ww = 54, wx = x + (w - ww) / 2, wy = y + 40, wb = y + h - 42;
  g.fillStyle = COL.white; archPath(g, wx - 9, wy - 9, ww + 18, wb - wy + 9 + 6); g.fill();
  g.save(); archPath(g, wx, wy, ww, wb - wy); g.clip(); glassRect(g, wx, wy, ww, wb - wy);
  g.fillStyle = COL.white; g.fillRect(wx + ww / 2 - 1.5, wy, 3, wb - wy); g.fillRect(wx, wy + ww * 0.55, ww, 3); g.restore();
  // the cartouche over the arch: a shield between two scrolls
  g.fillStyle = COL.white; g.beginPath(); g.ellipse(wx + ww / 2, wy - 22, 11, 8, 0, 0, PI * 2); g.fill(); g.fillRect(wx + ww / 2 - 20, wy - 17, 40, 4);
  g.fillRect(wx - 12, wb - 26, ww + 24, 4); g.fillRect(wx - 12, wb - 3, ww + 24, 4);
  for (let k = 0; k < 9; k++) g.fillRect(wx - 10 + k * ((ww + 20) / 8.2), wb - 22, 3, 19);
  g.fillRect(wx - 15, wb + 1, ww + 30, 6);
  return [[wx, wy, ww, wb - wy]];
}
function paintF2(g, x, y, w, h, i, r) {
  plaster(g, x, y, w, h, COL.wall, r);
  pil(g, x, y, w, h);
  const ww = 46, wh = 78, wx = x + (w - ww) / 2, wy = y + 50;
  g.fillStyle = COL.white; g.fillRect(wx - 8, wy - 8, ww + 16, wh + 8 + 6);
  glassRect(g, wx, wy, ww, wh);
  g.fillStyle = COL.white; g.fillRect(wx + ww / 2 - 1.5, wy, 3, wh); g.fillRect(wx, wy + wh * 0.3, ww, 3);
  g.fillRect(wx - 12, wy - 14, ww + 24, 6); g.beginPath(); g.ellipse(wx + ww / 2, wy - 20, 9, 5, 0, Math.PI, 0); g.fill();
  g.fillRect(wx - 12, wy + wh + 6, ww + 24, 5); g.fillStyle = 'rgba(100,88,64,0.18)'; g.fillRect(wx - 6, wy + wh + 11, ww + 12, 14);   // the apron
  return [[wx, wy, ww, wh]];
}
export const FIN_ROWS = [{ name: 'fg', h: G - PL, paint: paintG }, { name: 'f1', h: T1 - S1, paint: paintF1 }, { name: 'f2', h: T2 - S2, paint: paintF2 }];

export function buildFinance(ctx) {
  const { B, S, g, r, bays } = ctx, P = FIN_RING, faces = ringFaces(P);
  const gs = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; for (let k = 0; k < 6; k++) gs.push(g(a[0] + (b[0] - a[0]) * k / 6, a[1] + (b[1] - a[1]) * k / 6)); }
  const yT = Math.max(...gs) + 0.1, gLow = Math.min(...gs) - 0.5 - yT;
  for (const b of Object.values(B)) b.setXf(M4(0, yT, 0));
  const spec = { rows: [['fg', PL, G], ['f1', S1, T1], ['f2', S2, T2]], gaps: [[G, S1], [T1, S2], [T2, COR]], wall: COL.wall, plinth: [PL, COL.plinth], trim: COL.white, strings: [[G - 0.08, S1 + 0.12, 0.2], [T1 - 0.05, S2 + 0.07, 0.12]], cornice: [T2 - 0.1, COR - T2 + 0.1, 1.15, 0.8] };
  const stats = { bays: 0, columns: 2 };
  P.forEach((a, i) => {
    const b = P[(i + 1) % P.length], fc = faces[i], F = frame(a, b, [fc.nx, fc.nz]);
    if (i === 1) { risalit(F); return; }
    stats.bays += bayWall({ B, bays, gLow }, F, spec, true);
  });
  // the pedimented risalit of the west front: three bays, two big columns, a pediment over the cornice
  function risalit(F) {
    const f = F.face(), W = F.W, cs = [W / 2 - 4.3, W / 2, W / 2 + 4.3];
    bays.band(B.bay, f, 'fg', PL, G);
    skin(B.wall, f, G, S1, COL.wall, [1, 1]);
    B.stone.setColor(COL.plinth); box(B.stone, f, -0.05, W + 0.05, gLow, PL, -0.1, 0.14, 'ftlr');
    B.det.setColor(COL.white); box(B.det, f, -0.06, W + 0.06, G - 0.08, S1 + 0.14, 0, 0.3, 'ftu');
    for (const c of cs) {
      archOpening(B, f, { s0: c - 0.95, s1: c + 0.95, y0: 6.9, yS: 9.3, rise: 0.95, dep: 0.4, W: B.wall, wcol: COL.wall, frame: COL.white, glass: COL.glass, lit: r() < 0.5, mull: [c], tr: 9.05, rev: COL.white, n: 8 });
      band(B.det, f, [[c - 1.3, 6.8], ...archPts(c - 1.3, c + 1.3, 9.3, 1.3, 8, 2), [c + 1.3, 6.8]], [[c - 0.95, 6.9], ...archPts(c - 0.95, c + 0.95, 9.3, 0.95, 8, 2), [c + 0.95, 6.9]], 0.07, COL.white, false);
      // the balcony: a bellied slab with a stone balustrade
      B.det.setColor(COL.white); box(B.det, f, c - 1.5, c + 1.5, 6.35, 6.9, 0, 0.9, 'ftlru'); box(B.det, f, c - 1.5, c + 1.5, 7.75, 7.9, 0.75, 0.9, 'ftlr');
      for (let k = 0; k < 9; k++) { const s = c - 1.4 + k * 0.35; box(B.det, f, s - 0.05, s + 0.05, 6.9, 7.75, 0.78, 0.86, 'f'); }
      box(B.det, f, c - 0.35, c + 0.35, 10.0, 10.5, 0, 0.16, 'f');                          // the keystone
      // the second floor
      f.cuts.push({ s0: c - 0.8, s1: c + 0.8, y0: 11.6, y1: 14.0 });
      hole(B, f, { s0: c - 0.8, s1: c + 0.8, y0: 11.6, y1: 14.0, dep: 0.4, frame: COL.white, glass: COL.glass, lit: r() < 0.5, pitch: 0.8, tr: 13.1, rev: COL.white, sill: COL.wall });
      B.det.setColor(COL.white); box(B.det, f, c - 1.15, c + 1.15, 14.1, 14.4, 0, 0.3, 'ftu'); box(B.det, f, c - 1.1, c + 1.1, 11.45, 11.6, 0, 0.3, 'ftlr');
    }
    skin(B.wall, f, G, T2 - 0.4, COL.wall, [1, 1]);
    for (const s of [W / 2 - 2.15, W / 2 + 2.15]) { const [x, z] = F.toMap(s, 0.65); column(B.det, x, z, S1 + 0.1, 9.2, 0.52, COL.col); B.det.setColor(COL.white); box(B.det, f, s - 0.65, s + 0.65, S1 + 0.1, S1 + 0.35, 0, 1.3, 'ftlr'); }
    // the end piers: a pilaster stack under a console
    B.det.setColor(COL.white); box(B.det, f, 0, 1.4, S1, T2, 0, 0.35, 'ftlr'); box(B.det, f, W - 1.4, W, S1, T2, 0, 0.35, 'ftlr');
    cornice(B.det, f, -0.3, W + 0.3, T2 - 0.6, COR - T2 + 0.6, 0, 1.5, COL.white, 1.0);
    // the pediment over the cornice with its round window
    const mid = W / 2, pp = [[mid - 6.3, COR], [mid + 6.3, COR], [mid, COR + 2.9]];
    B.wall.setColor(COL.wall); poly(B.wall, f, pp, 0.2);
    rake(B.det, f, pp[0], pp[2], 0.32, 0, 0.45, COL.white); rake(B.det, f, pp[2], pp[1], 0.32, 0, 0.45, COL.white);
    const ro = [], ri = [];
    for (let j = 0; j < 16; j++) { const a = j / 16 * PI * 2; ro.push([mid + Math.cos(a) * 0.9, COR + 1.0 + Math.sin(a) * 0.9]); ri.push([mid + Math.cos(a) * 0.6, COR + 1.0 + Math.sin(a) * 0.6]); }
    B.lit.setColor('#3a4a52'); poly(B.lit, f, ri, 0.25); band(B.det, f, ro, ri, 0.28, COL.white, true);
  }

  // the roof: one big red hip over the plan's convex hull (the notch at P2 is roofed over), flat-topped; three zinc domes on it
  const yE = COR - 0.2, hull = [P[0], P[1], P[3], P[4], P[5]];
  B.roof.setColor(COL.roof); mansard(B.roof, hull, [[-0.55, yE - 0.2], [0, yE], [13, yE + 5.6]], COL.roof);
  const dome = (x, z, y0, R, tall, lantern) => {
    B.det.setColor(COL.col); B.det.cyl(x, y0, z, R * 0.92, R * 0.92, 1.4, 14, true);
    B.det.setColor(COL.white); B.det.cyl(x, y0 + 1.3, z, R * 1.04, R * 1.04, 0.3, 14, true);
    B.det.setColor(COL.zinc);
    B.det.lathe([[R, y0 + 1.6], [R * 1.08, y0 + 2.0], [R * 1.0, y0 + 2.9], [R * 0.78, y0 + 4.0], [R * 0.5, y0 + 5.2 * tall], [R * 0.24, y0 + 6.2 * tall], [R * 0.12, y0 + 6.8 * tall]], 14, x, z);
    B.det.setColor(COL.band); B.det.lathe([[R * 1.015, y0 + 2.5], [R * 1.07, y0 + 2.7], [R * 1.07, y0 + 3.2], [R * 1.0, y0 + 3.4]], 14, x, z);
    if (lantern) { B.det.setColor(COL.white); B.det.cyl(x, y0 + 6.7 * tall, z, R * 0.14, R * 0.12, 1.4, 8, true); B.det.setColor(COL.zinc); B.det.lathe([[R * 0.18, y0 + 8.1 * tall], [R * 0.1, y0 + 8.7 * tall], [R * 0.03, y0 + 10.0 * tall]], 8, x, z); }
    else { B.det.setColor('#8a8f94'); B.det.lathe([[0.1, y0 + 6.8 * tall], [0.06, y0 + 7.4 * tall], [0.02, y0 + 8.8 * tall]], 6, x, z); }
  };
  const toward = (m, d) => { const c = [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length], dx = c[0] - m[0], dz = c[1] - m[1], l = Math.hypot(dx, dz); return [m[0] + dx / l * d, m[1] + dz / l * d]; };
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const dS = toward(mid(P[0], P[5]), 6.5), dN = toward(mid(P[3], P[4]), 6.0), dC = toward(mid(P[1], P[2]), 12.5);
  dome(dS[0], dS[1], COR + 2.4, 3.0, 1.0, false); dome(dN[0], dN[1], COR + 2.4, 2.8, 1.0, false); dome(dC[0], dC[1], COR + 4.8, 4.0, 1.0, true);

  S.prism(P.flat(), yT + gLow, yT + COR + 6.5, 0, 0, 'wall', 0);
  for (const b of Object.values(B)) b.setXf(null);
  stats.yT = yT; void corners;
  return { footprints: [{ poly: P, h: COR + 8, kind: 'office', name: 'Palatul Finanțelor', id: FIN_ID }], ring: P, yT, stats, clear: (x, z) => inside(P, x, z) };
}
