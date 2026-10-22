// OWNER: oradea. The central pavilion of Primăria Oradea on Piața Unirii (hall.js builds the rest): a rusticated ground
// floor with three arched entrances and their steps, the balustraded balcony, six giant Corinthian columns (a pair at
// each end, a single one between), three tall arched windows and two oculi in the loggia behind them, the entablature,
// the attic with the town's coat of arms, the segmental pediment with two seated figures and the eagle, statues on the
// corner pedestals, and the tall hipped copper roof behind with its lantern and flagpole.
//   buildPortico(ctx, pf) -> { collide(S), top }   ctx from hall.js; pf = the face of the pavilion's front edge
// Face frame: s from the south end of the front (0 .. pf.L = 21.9 m) to the north, o out of the front, y up.
import { at, quad, rect, box, fan, strip, poly2, outline, windowA, roofPoly, statue, eagle3d, reveal, steps, COL, PI, DN } from './kit.js';
import { ringInset } from './kit.js';
import { Y_COR, PAV_UP, toMap } from './frame.js';
import { M4 } from '../../../../kit/mesh.js';
const mat4 = (x, z, ang) => M4(x, 0, z, ang);

const CS = [1.65, 3.95, 8.4, 13.5, 17.95, 20.25];   // column centres along the front
const OC = -1.15;                                   // the columns' offset from the front plane
const OB = -2.9;                                    // the loggia's back wall
const IVORY = '#f2ecd8', STONE = '#e2d2a0';

export function buildPortico(ctx, pf) {
  const { B, F, Y, H, wash, gOf } = ctx, L = pf.L, mid = L / 2;
  const g = gOf(pf, 0, L, 1.5), gLo = Math.min(g, F) - 0.45;
  const sh = (o) => ({ ...pf, ax: pf.ax + pf.nx * o, az: pf.az + pf.nz * o });   // the face moved by o
  const yBal = Y(5.5), yDeck = Y(5.9), yEnt = Y(17.3), yTop = Y(Y_COR + PAV_UP);
  const surround = (D, f, ol, ol2, s, y0, off, N) => {
    const ni = ol.length - 1, I = ol.map(([a, b]) => at(f, s + a, y0 + b, off)), O = ol2.map(([a, b]) => at(f, s + a, y0 + b, off));
    strip(D, I.slice(1), O.slice(1), N); quad(D, I[ni], I[0], O[0], O[ni], N);
  };

  // ---------------------------------------------------------------- ground floor: rusticated, three arched entrances
  const sill = Y(0.15), EW = 3.0, ESP = 3.4, ERISE = 1.45;
  const ents = [mid - 4.8, mid, mid + 4.8], olE = outline(EW, ESP, ERISE, 0, 8), olE2 = outline(EW, ESP, ERISE, 0.42, 8);
  B.stone.setColor(STONE);
  poly2(B.stone, pf, [[-0.1, gLo], [L + 0.1, gLo], [L + 0.1, yBal], [-0.1, yBal]], ents.map((c) => olE.map(([a, b]) => [c + a, sill + b])), 0, 2);
  const front = sh(-1.1);
  for (const c of ents) {
    B.stone.setColor(STONE); reveal(B.stone, pf, olE, c, sill, 0, -1.1);
    B.det.setColor('#2b1f18'); fan(B.det, olE.map(([a, b]) => at(pf, c + a, sill + b, -1.12)), pf.N);
    windowA(B, front, { s: c, y0: sill + 0.3, w: EW - 0.5, h: ESP - 0.3, rise: ERISE - 0.3, sur: 0.1, surCol: '#3a2a20', lit: true, glass: '#3b3f3f', off: 0.04 });
    B.wall.setColor(COL.white); surround(B.wall, pf, olE, olE2, c, sill, 0.05, pf.N);
    box(B.wall, pf, c - 0.3, c + 0.3, sill + ESP + ERISE + 0.05, sill + ESP + ERISE + 0.95, 0.04, 0.22, 'ftlr');
    const gp = at(pf, c, 0, 2.6);
    steps(B.stone, pf, c - 2.1, c + 2.1, sill, H(gp[0], gp[2]), gLo, 0.9, 0.42, '#bdb6a6');
  }
  // the end piers: a plain niche panel in each
  for (const c of [2.35, L - 2.35]) windowA(B, pf, { s: c, y0: Y(1.8), w: 1.3, h: 2.5, rise: 0, sur: 0.16, surCol: COL.white, cap: 0.25, sill: true, glass: '#2e3338', off: 0.04 });

  // ---------------------------------------------------------------- balcony
  B.stone.setColor(COL.white);
  box(B.stone, pf, -0.3, L + 0.3, yBal, yDeck, OB, 0.45, 'ftlru', [2, 2]);
  B.wall.setColor(COL.white);
  box(B.wall, pf, -0.2, L + 0.2, yBal - 0.35, yBal, -0.4, 0.55, 'flru');
  B.balu.setColor(COL.white);
  for (const [s0, s1] of [[0.35, CS[1] - 0.6], [CS[1] + 0.6, CS[2] - 0.6], [CS[2] + 0.6, CS[3] - 0.6], [CS[3] + 0.6, CS[4] - 0.6], [CS[4] + 0.6, L - 0.35]]) {
    quad(B.balu, at(pf, s0, yDeck, 0.2), at(pf, s1, yDeck, 0.2), at(pf, s1, yDeck + 0.98, 0.2), at(pf, s0, yDeck + 0.98, 0.2), pf.N, [[s0 / 1.8, 0], [s1 / 1.8, 0], [s1 / 1.8, 1], [s0 / 1.8, 1]]);
  }
  B.wall.setColor(COL.white);
  for (const s of [0.25, L - 0.25]) box(B.wall, pf, s - 0.25, s + 0.25, yDeck, yDeck + 1.1, -0.05, 0.45, 'ftlr');

  // ---------------------------------------------------------------- loggia: back wall, pilasters, three tall windows, two oculi
  const bk = sh(OB);
  B.wall.setColor('#e9d9a6'); rect(B.wall, bk, 0, L, yDeck, yEnt, 0, [2.5, 2.5]);
  const wins = [(CS[1] + CS[2]) / 2, (CS[2] + CS[3]) / 2, (CS[3] + CS[4]) / 2];
  for (const c of wins) {
    windowA(B, bk, { s: c, y0: Y(7.9), w: 3.0, h: 5.5, rise: 1.5, sur: 0.3, surCol: COL.white, lit: true, glass: '#43505a', sill: true, off: 0.03 });
    B.rail.setColor(COL.iron); quad(B.rail, at(bk, c - 1.75, Y(7.4), 0.18), at(bk, c + 1.75, Y(7.4), 0.18), at(bk, c + 1.75, Y(8.3), 0.18), at(bk, c - 1.75, Y(8.3), 0.18), pf.N, [[0, 0], [1.9, 0], [1.9, 1], [0, 1]]);
  }
  for (const s of [...CS, 0.5, L - 0.5]) {
    B.wall.setColor(COL.white); box(B.wall, bk, s - 0.32, s + 0.32, yDeck, yEnt - 0.4, 0, 0.2, 'ftlr');
    box(B.wall, bk, s - 0.42, s + 0.42, yEnt - 0.8, yEnt - 0.4, 0, 0.28, 'ftlr');
  }
  for (const c of [(CS[0] + CS[1]) / 2, (CS[4] + CS[5]) / 2]) {   // the oculi
    const ring = Array.from({ length: 16 }, (_, i) => at(bk, c + Math.cos(i / 16 * PI * 2) * 1.25, Y(11.5) + Math.sin(i / 16 * PI * 2) * 1.25, 0.04));
    B.wall.setColor(COL.white); fan(B.wall, ring, pf.N);
    B.lit.setColor('#43505a'); fan(B.lit, Array.from({ length: 16 }, (_, i) => at(bk, c + Math.cos(i / 16 * PI * 2) * 0.95, Y(11.5) + Math.sin(i / 16 * PI * 2) * 0.95, 0.07)), pf.N, Array.from({ length: 16 }, (_, i) => [0.5 + Math.cos(i / 16 * PI * 2) * 0.5, 0.5 + Math.sin(i / 16 * PI * 2) * 0.5]));
  }
  B.wall.setColor('#e4d6a8'); quad(B.wall, at(pf, 0, yEnt - 0.03, OB), at(pf, L, yEnt - 0.03, OB), at(pf, L, yEnt - 0.03, 0), at(pf, 0, yEnt - 0.03, 0), DN);

  // ---------------------------------------------------------------- the six columns
  for (const c of CS) {
    const P = at(pf, c, 0, OC), x = P[0], z = P[2];
    B.wall.setColor(IVORY);
    B.wall.box(x - 0.8, yDeck, z - 0.8, x + 0.8, yDeck + 0.6, z + 0.8, 63);
    B.wall.cyl(x, yDeck + 0.6, z, 0.76, 0.66, 0.22, 14);
    B.wall.cyl(x, yDeck + 0.82, z, 0.62, 0.55, 8.6, 14, false);
    B.wall.cyl(x, yDeck + 9.42, z, 0.64, 0.64, 0.14, 14);
    B.wall.lathe([[0.52, yDeck + 9.56], [0.66, yDeck + 9.9], [0.84, yDeck + 10.4], [1.0, yDeck + 10.95], [1.04, yDeck + 11.1]], 14, x, z);
    B.wall.setColor(COL.white);
    B.wall.box(x - 1.12, yDeck + 11.1, z - 1.12, x + 1.12, yDeck + 11.4, z + 1.12, 63);
  }

  // ---------------------------------------------------------------- entablature
  B.wall.setColor(IVORY);
  box(B.wall, pf, -0.3, L + 0.3, yEnt, Y(18.05), OB, 0.25, 'ftlru', [2.5, 2.5]);
  B.wall.setColor('#e6d8ab'); box(B.wall, pf, -0.3, L + 0.3, Y(18.05), Y(18.55), OB, 0.12, 'ftlru', [2.5, 2.5]);
  B.wall.setColor(IVORY); box(B.wall, pf, -0.4, L + 0.4, Y(18.55), yTop, OB, 0.85, 'ftlru', [2.5, 2.5]);
  for (const c of CS) { B.wall.setColor(COL.white); box(B.wall, pf, c - 0.6, c + 0.6, yEnt, Y(18.55), 0.1, 0.4, 'ftlr'); }
  // the deck over the loggia and the balustrades at the ends
  B.roof.setColor(COL.copper); quad(B.roof, at(pf, 0, yTop + 0.04, -8.0), at(pf, L, yTop + 0.04, -8.0), at(pf, L, yTop + 0.04, 0), at(pf, 0, yTop + 0.04, 0), [0, 1, 0]);
  B.balu.setColor(IVORY);
  for (const [s0, s1] of [[0.6, 4.3], [L - 4.3, L - 0.6]]) {
    quad(B.balu, at(pf, s0, yTop, 0.45), at(pf, s1, yTop, 0.45), at(pf, s1, yTop + 0.98, 0.45), at(pf, s0, yTop + 0.98, 0.45), pf.N, [[s0 / 1.8, 0], [s1 / 1.8, 0], [s1 / 1.8, 1], [s0 / 1.8, 1]]);
  }
  B.wall.setColor(IVORY);
  for (const s of [0.45, 4.45, L - 4.45, L - 0.45]) box(B.wall, pf, s - 0.45, s + 0.45, yTop, yTop + 1.25, 0.0, 0.9, 'ftlrt');

  // ---------------------------------------------------------------- attic with the coat of arms, the pediment, the figures
  const yAt = Y(23.4), af = sh(-1.0), s0A = 4.4, s1A = L - 4.4;
  B.wall.setColor('#e9d9a6'); box(B.wall, pf, s0A, s1A, yTop, yAt, -4.2, -1.0, 'ftlr', [2.5, 2.5]);
  B.wall.setColor(COL.white);
  for (const s of [s0A + 0.4, s1A - 0.4]) box(B.wall, pf, s - 0.4, s + 0.4, yTop, yAt, -1.0, -0.82, 'ftlr');
  B.wall.setColor(IVORY); box(B.wall, pf, s0A - 0.4, s1A + 0.4, yAt, yAt + 0.8, -4.2, -0.15, 'ftlru', [2.5, 2.5]);
  const shield = (sc, o, col) => [[-0.95, 1.15], [0.95, 1.15], [0.95, -0.2], [0.6, -0.75], [0, -1.15], [-0.6, -0.75], [-0.95, -0.2]].map(([a, b]) => at(af, mid + a * sc, Y(21.3) + b * sc, o));
  B.det.setColor('#c9a04e'); fan(B.det, shield(1.14, 0.05), pf.N);
  B.det.setColor('#1f3f7a'); fan(B.det, shield(1.0, 0.08), pf.N);
  B.det.setColor('#a3262a'); fan(B.det, [[-0.95, -0.1], [0.95, -0.1], [0.95, -0.2], [0.6, -0.75], [0, -1.15], [-0.6, -0.75], [-0.95, -0.2]].map(([a, b]) => at(af, mid + a, Y(21.3) + b, 0.1)), pf.N);
  B.det.setColor('#d9b866'); box(B.det, af, mid - 0.3, mid + 0.3, Y(21.3) - 0.2, Y(21.3) + 0.8, 0.1, 0.16, 'f');
  for (const s of [mid - 5.3, mid - 3.7, mid + 3.7, mid + 5.3]) windowA(B, af, { s, y0: Y(20.1), w: 0.9, h: 1.7, rise: 0.45, sur: 0.14, surCol: COL.white, lit: true, glass: '#43505a' });
  // the segmental pediment: a thin slab with a moulded arc and the eagle on the crown
  const pb = yAt + 0.8, pr = 2.6, ps0 = 5.2, ps1 = L - 5.2, pw = (ps1 - ps0) / 2, arc = Array.from({ length: 17 }, (_, i) => { const t = i / 16 * 2 - 1; return [mid + t * pw, pb + pr * (1 - t * t)]; });
  B.wall.setColor('#e9d9a6'); poly2(B.wall, sh(-0.9), [[ps0, pb], [ps1, pb], ...arc.slice().reverse()], [], 0, 2.5);
  B.wall.setColor(COL.white);
  strip(B.wall, arc.map(([s, y]) => at(pf, s, y, -0.8)), arc.map(([s, y]) => at(pf, s, y + 0.45, -0.8)), pf.N);
  for (let i = 0; i + 1 < arc.length; i++) quad(B.wall, at(pf, arc[i][0], arc[i][1] + 0.45, -0.8), at(pf, arc[i + 1][0], arc[i + 1][1] + 0.45, -0.8), at(pf, arc[i + 1][0], arc[i + 1][1] + 0.45, -1.6), at(pf, arc[i][0], arc[i][1] + 0.45, -1.6), [0, 1, 0]);
  B.wall.setColor(IVORY); box(B.wall, pf, ps0 - 0.3, ps1 + 0.3, pb - 0.05, pb + 0.18, -1.2, -0.45, 'ftlr');
  for (const s of [ps0 + 1.8, ps1 - 1.8]) { const p = at(pf, s, pb + 0.18, -0.8); statue(B.wall, p[0], p[1], p[2], 1.9, '#ece6d4'); }
  { const p = at(pf, mid, pb + pr + 0.5, -1.0); eagle3d(B.det, p[0], p[1], p[2], [pf.nx, pf.nz], 2.6, '#3b3a35'); }
  // statues on the corner pedestals
  for (const s of [0.45, 4.45, L - 4.45, L - 0.45]) {
    const p = at(pf, s, yTop + 1.25, 0.45); statue(B.wall, p[0], p[1], p[2], 2.3, '#ece6d4');
  }

  // ---------------------------------------------------------------- the tall hipped roof behind the pediment, its lantern and flagpole
  const base = [[-3.3, 16.4], [21.0, 16.4], [21.0, 36.4], [-3.3, 36.4]].map(([a, b]) => toMap(a, b));
  const rings = [[0, 20.5], [3.0, 27.2], [5.6, 29.0]].map(([d, y]) => ({ R: d ? ringInset(base, d) : base, y: Y(y) }));
  B.roof.setColor(COL.copper);
  const P3 = (p, y) => [p[0], y, p[1]];
  for (let t = 0; t + 1 < rings.length; t++) {
    const A = rings[t], C = rings[t + 1];
    A.R.forEach((p, i) => { const j = (i + 1) % 4; roofPoly(B.roof, [P3(p, A.y), P3(A.R[j], A.y), P3(C.R[j], C.y), P3(C.R[i], C.y)], 2); });
  }
  const top = rings[2], deckPts = top.R;
  B.roof.fill(deckPts, [], top.y, true);
  const cx = deckPts.reduce((q, p) => q + p[0], 0) / 4, cz = deckPts.reduce((q, p) => q + p[1], 0) / 4;
  // lantern: a square drum with arched louvres, a small copper cap, a ball and the flagpole
  const ang = Math.atan2(-pf.nz, pf.nx);
  B.wall.setColor('#e9d9a6'); B.wall.with(mat4(cx, cz, ang), (q) => {
    q.box(-1.7, top.y + 0.35, -1.7, 1.7, top.y + 3.2, 1.7, 63);
    q.setColor(COL.white); q.box(-1.95, top.y + 3.2, -1.95, 1.95, top.y + 3.6, 1.95, 63); q.box(-1.95, top.y, -1.95, 1.95, top.y + 0.35, 1.95, 63);
  });
  for (let k = 0; k < 4; k++) {   // an arched louvre on each side of the drum
    const n = [[pf.nx, pf.nz], [-pf.nz, pf.nx], [-pf.nx, -pf.nz], [pf.nz, -pf.nx]][k], u = [n[1], -n[0]];
    const lf = { ax: cx + n[0] * 1.72 - u[0], az: cz + n[1] * 1.72 - u[1], ux: u[0], uz: u[1], nx: n[0], nz: n[1], N: [n[0], 0, n[1]], U: [u[0], 0, u[1]], L: 2.0, cuts: [] };
    windowA(B, lf, { s: 1.0, y0: top.y + 0.7, w: 1.3, h: 1.3, rise: 0.55, sur: 0.12, surCol: COL.white, glass: '#2a2d30', off: 0.03 });
  }
  B.roof.setColor(COL.copper);
  B.roof.lathe([[2.2, top.y + 3.6], [2.0, top.y + 3.9], [1.2, top.y + 5.0], [0.7, top.y + 5.8], [0.12, top.y + 6.6]], 8, cx, cz);
  B.det.setColor(COL.gold); B.det.ellipsoid([cx, top.y + 6.75, cz], [0.22, 0.22, 0.22], 6, 4);
  B.det.setColor('#cfcfca'); B.det.tube([cx, top.y + 6.8, cz], [cx, top.y + 11.0, cz], 0.05, 5);

  const lantern = { x: cx, z: cz, y: top.y };
  return {
    top: top.y + 11,
    collide(S) {
      S.prism(rings[1].R.flat(), rings[0].y, rings[1].y, 0, 0, 'roof');
      S.prism(rings[2].R.flat(), rings[1].y - 0.2, rings[2].y, 0, 0, 'roof');
      S.cyl(lantern.x, lantern.z, lantern.y, lantern.y + 6.6, 2.4, 0.2, 'roof');
    },
  };
}
