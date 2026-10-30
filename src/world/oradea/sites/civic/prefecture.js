// OWNER: oradea. The Prefecture of Bihor county (Palatul Administrativ / Instituția Prefectului), Piața Independenței / Parcul Traian side of
// Calea Republicii's north end, Oradea (OSM way 1534596497; a Classicist office block of the 19th century, two tall storeys). Built after
// the Wikimedia Commons photo "Prefectura Oradea" and the Google Street View panoramas of 2020–2025 on the park street and the side street:
//   a U round a car park open to the south: pale-yellow render over a grey-pink plinth, a white string course between the storeys, a
//   white cornice, windows in white frames with brown sashes (upper ones under flat hoods on brackets, over sills), white pilaster pairs
//   at the corners and at the entrance, the arched entrance doorway on the park front beside a narrow stepped gable with the clock, and
//   low red hipped roofs. The yard sides and the west wing's outer wall are painted bays too (a guess: no photo of them).
//   buildPrefecture(ctx) -> { footprints, ring, clear(x, z), yT, stats }
//   ctx: { B (shared builders), S (collision), g (ground height), r, bays }      PREF_ROWS: the atlas strips (rg ground, r1 upper)
import { M4 } from '../../../../kit/mesh.js';
import { ringFaces } from '../../../cherkasy/slabkit.js';
import { box, poly, frame, archPts, rake, roofRect, cap, band, PI } from './kit.js';
import { plaster, glassRect, sashWin } from './bays.js';
import { bayWall, pilasters } from './walls.js';
import { rectOf, inside } from './rects.js';

export const PREF_ID = 1534596497;
export const PREF_RING = [[293.2, -403.4], [293.2, -408.0], [289.3, -409.0], [291.8, -436.5], [280.8, -437.1], [272.1, -436.9], [270.3, -416.7], [263.3, -414.9], [265.4, -438.6], [264.3, -438.7], [267.8, -460.3], [311.8, -455.3], [306.8, -402.6]];
const COL = { wall: '#ecdba9', white: '#f4f0e6', plinth: '#c9a99c', roof: '#b4502e', roofD: '#a34628', door: '#4b3426', stone: '#d6d0c2' };
const PL = 0.9, G1 = 4.9, S1 = 5.3, T1 = 10.0, COR = 11.2;

function paintG(g, x, y, w, h, i, r) {
  plaster(g, x, y, w, h, COL.wall, r);
  const ww = 44, wh = 82, wx = x + (w - ww) / 2, wy = y + 26;
  sashWin(g, wx, wy, ww, wh, { frame: COL.white, fw: 6, transom: 0.28 });
  g.fillStyle = COL.white; g.fillRect(wx - 9, wy + wh, ww + 18, 5);
  return [[wx, wy, ww, wh]];
}
function paintU(g, x, y, w, h, i, r) {
  plaster(g, x, y, w, h, COL.wall, r);
  const ww = 46, wh = 102, wx = x + (w - ww) / 2, wy = y + 36;
  sashWin(g, wx, wy, ww, wh, { frame: COL.white, fw: 6, transom: 0.26 });
  g.fillStyle = COL.white; g.fillRect(wx - 10, wy - 16, ww + 20, 7); g.fillRect(wx - 8, wy - 9, ww + 16, 3);           // the hood
  g.fillRect(wx - 6, wy - 9, 4, 9); g.fillRect(wx + ww + 2, wy - 9, 4, 9);                                              // its brackets
  g.fillRect(wx - 10, wy + wh, ww + 20, 6); g.fillRect(wx - 3, wy + wh + 6, 5, 8); g.fillRect(wx + ww - 2, wy + wh + 6, 5, 8);  // the sill on brackets
  return [[wx, wy, ww, wh]];
}
export const PREF_ROWS = [{ name: 'rg', h: G1 - PL, paint: paintG }, { name: 'r1', h: T1 - S1, paint: paintU }];

export function buildPrefecture(ctx) {
  const { B, S, g, bays } = ctx, P = PREF_RING, faces = ringFaces(P);
  const gs = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; for (let k = 0; k < 6; k++) gs.push(g(a[0] + (b[0] - a[0]) * k / 6, a[1] + (b[1] - a[1]) * k / 6)); }
  const yT = Math.max(...gs) + 0.1, gLow = Math.min(...gs) - 0.5 - yT;
  for (const b of Object.values(B)) b.setXf(M4(0, yT, 0));
  const spec = { rows: [['rg', PL, G1], ['r1', S1, T1]], gaps: [[G1, S1], [T1, COR]], wall: COL.wall, plinth: [PL, COL.plinth], trim: COL.white, strings: [[G1 - 0.06, S1 + 0.1, 0.16]], cornice: [T1 + 0.25, COR - T1 - 0.25, 0.8, 0.55] };
  const stats = { bays: 0 }, F = P.map((a, i) => { const b = P[(i + 1) % P.length], fc = faces[i]; return frame(a, b, [fc.nx, fc.nz]); });
  F.forEach((Fi, i) => {
    stats.bays += bayWall({ B, bays, gLow }, Fi, spec, true);
    const f = Fi.face(), L = Fi.W;
    // pilaster pairs at the ends of the long street fronts and between sections
    if (i === 10 || i === 11) {
      const zones = i === 10 ? [0.5, L - 3.0] : [0.5, L - 3.0, L / 2 - 1.3];
      for (const s of zones) pilasters(B, f, s, s + 2.5, PL, T1 + 0.2, 0.62, 0.14, COL.white);
    }
    if (i === 10) frontFeatures(Fi, f);
  });
  // the entrance doorway and the clock gable on the park front (face 10, running west to east)
  function frontFeatures(Fi, f) {
    const c = 17.5, hw = 1.05;
    // the doorway: a dark arched leaf in a white archivolt between two pilasters, a step
    const arc = archPts(c - hw, c + hw, 2.7, 1.05, 8, 2), outer = archPts(c - hw - 0.3, c + hw + 0.3, 2.7, 1.3, 8, 2);
    B.det.setColor(COL.white); box(B.det, f, c - hw - 0.55, c + hw + 0.55, 0, 0.2, 0.0, 1.0, 'ftlr');
    B.det.setColor(COL.door); poly(B.det, f, [[c - hw, 0.2], ...arc, [c + hw, 0.2]], 0.07);
    band(B.det, f, [[c - hw - 0.3, 0.2], ...outer, [c + hw + 0.3, 0.2]], [[c - hw, 0.2], ...arc, [c + hw, 0.2]], 0.1, COL.white, false);
    for (const sg of [-1, 1]) { B.det.setColor(COL.white); box(B.det, f, c + sg * (hw + 0.55) - 0.2, c + sg * (hw + 0.55) + 0.2, PL, 4.3, 0, 0.3, 'ftlr'); }
    B.det.setColor(COL.white); box(B.det, f, c - hw - 0.8, c + hw + 0.8, 4.2, 4.5, 0, 0.55, 'ftu');
    // the clock gable, a little west of the doorway: stepped sides, the clock in the middle
    const k = 9.0, pts = [[k - 1.9, COR], [k + 1.9, COR], [k + 1.9, COR + 1.8], [k + 1.15, COR + 2.5], [k, COR + 3.3], [k - 1.15, COR + 2.5], [k - 1.9, COR + 1.8]];
    B.wall.setColor(COL.wall); poly(B.wall, f, pts, 0.15);
    for (const i of [2, 3, 4, 5]) rake(B.det, f, pts[i], pts[i + 1], 0.16, 0, 0.3, COL.white);
    B.det.setColor(COL.white); box(B.det, f, k - 2.0, k + 2.0, COR - 0.02, COR + 0.22, 0, 0.55, 'ftu');
    const ro = [], ri = [];
    for (let j = 0; j < 18; j++) { const a = j / 18 * PI * 2; ro.push([k + Math.cos(a) * 0.95, COR + 1.45 + Math.sin(a) * 0.95]); ri.push([k + Math.cos(a) * 0.72, COR + 1.45 + Math.sin(a) * 0.72]); }
    B.lit.setColor('#efe9d8'); poly(B.lit, f, ri, 0.2); band(B.det, f, ro, ri, 0.22, '#2b2a28', true);
    B.det.setColor('#2b2a28'); box(B.det, f, k - 0.04, k + 0.04, COR + 1.45, COR + 2.05, 0.2, 0.24, 'f'); box(B.det, f, k, k + 0.45, COR + 1.41, COR + 1.49, 0.2, 0.24, 'f');
  }

  // roofs: low red hips over the north front wing, the east wing and the west wing
  const yE = COR - 0.1;
  const Rn = rectOf(P[10], P[11], 10.8, [0, 1]), Re = rectOf(P[11], P[12], 8.4, [-1, 0]), Rw = rectOf(P[7], P[8], 4.5, [1, 0]);
  roofRect(B.roof, { ...Rn, yE, rise: 5.4, col: COL.roof, col2: COL.roofD, ov: 0.5 });
  roofRect(B.roof, { ...Re, yE, rise: 4.4, col: COL.roof, col2: COL.roofD, ov: 0.5 });
  roofRect(B.roof, { ...Rw, yE, rise: 2.6, col: COL.roof, col2: COL.roofD, ov: 0.45 });
  // a chimney on each wing
  B.wall.setColor('#b9a58c');
  for (const [x, z] of [[285, -450], [302, -430], [268, -428]]) B.wall.box(x - 0.45, yE + 2.0, z - 0.45, x + 0.45, yE + 5.6, z + 0.45);

  S.prism(P.flat(), yT + gLow, yT + COR + 5.0, 0, 0, 'wall', 0);
  for (const b of Object.values(B)) b.setXf(null);
  stats.yT = yT;
  void glassRect; void cap;
  return { footprints: [{ poly: P, h: COR + 4, kind: 'office', name: 'Prefectura Bihor', id: PREF_ID }], ring: P, yT, stats, clear: (x, z) => inside(P, x, z) };
}
