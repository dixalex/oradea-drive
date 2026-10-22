// OWNER: oradea. The building of Casa Minunată (Strada Traian Lalescu 47; OSM way 436834224, 1,436 m2, an outline square to the street).
// What it looks like, from the foundation's own photographs (casaminunata.org galleries, 2010 and 2018–2024: the courtyard with its
// timber pergola, the reception porch, the one-storey wing in white render, the gym) and the Esri aerial: four volumes round a
// paved courtyard, in the building's own frame (u along the north wall, v toward the street, y absolute):
//   C  the central block, 13.85 x 36 m, two storeys of sand-coloured render with white windows under a steep dark slate gable roof;
//   H  the sports hall on its north-east, 36.5 x 17.5 m, one tall room: ground windows and two glazed doors on the courtyard side, a
//      ribbon of high windows under a low blue-grey sheet gable, with the long brown timber pergola along its south wall;
//   S  the south wing on the street, 26.5 x 10 m, one storey in cream render under a low sky-blue sheet gable, with the name plate;
//   A  the small west annex, 4 x 7 m, under a flat roof.
// And the reception: a dark-brown timber porch on the east wall of C at the courtyard's west end (where OSM's footway ends) with its
// «RECEPȚIE» plate. Guesses, listed in the site module's header: the volumes' heights, the window counts on the faces the photographs
// do not show, the secondary door and the name plate on the street front.
//   buildBuilding({ B, S, g }) -> { yC, yH, footprint (map ring), top, stats }   B needs wall, roof, det, lit, board; all carry the
//   frame transform set by the caller; S the collision world; g(x, z) the terrain height
import { face, at, rect, box, skin, hole, label, quad, DN } from '../../../cherkasy/slabkit.js';
import { O, ANG, CA, SA, toMap, sq, gable, NAME, DESK } from './kit.js';

// the volumes in (u, v)
export const VOL = {
  C: { u0: 0, u1: 13.85, v0: 0, v1: 36.05 },
  H: { u0: 13.85, u1: 50.35, v0: 0, v1: 17.5 },
  S: { u0: -4.15, u1: 22.4, v0: 36.05, v1: 46.1 },
  A: { u0: -4.15, u1: 0, v0: 28.7, v1: 36.05 },
};
// the OSM outline in (u, v), clockwise on the page: what the four volumes add up to
export const RING = [[-4.15, 28.7], [0, 28.7], [0, 0], [50.35, 0], [50.35, 17.5], [13.85, 17.5], [13.85, 36.05], [22.4, 36.05], [22.4, 46.1], [-4.15, 46.1]];
export const PORCH = { u0: 13.85, u1: 16.4, v0: 28.8, v1: 33.2 };
const H = { C: [6.8, 10.9], H: [7.0, 8.7], S: [4.4, 6.1], A: [3.5, 3.5] }; // eave, ridge above each floor
const COL = {
  sand: '#e2c8a6', sandH: '#e6d0b0', cream: '#efe9dd', plinth: '#a39c90', frame: '#f6f4ef', rev: '#ebe6dc', glass: '#4a6478', sill: '#dcd7cb',
  slate: '#3c4046', blue: '#8399aa', sky: '#8fadc0', flat: '#4d5155', timber: '#5a3921', timberL: '#7a5232', door: '#6fa88c', gutter: '#f1efe9', step: '#bdb9b0',
};
const neg = (v) => v.map((q) => -q);

export function buildBuilding({ B, S, g }) {
  const W = B.wall, D = B.det;
  const gmin = (pts) => Math.min(...pts.map(([u, v]) => g(...toMap(u, v))));
  const gmax = (pts) => Math.max(...pts.map(([u, v]) => g(...toMap(u, v))));
  const corners = (r) => { const m = [(r.u0 + r.u1) / 2, (r.v0 + r.v1) / 2]; return [[r.u0, r.v0], [r.u1, r.v0], [r.u1, r.v1], [r.u0, r.v1], [m[0], r.v0], [m[0], r.v1], [r.u0, m[1]], [r.u1, m[1]], m]; };
  const low = [...corners(VOL.C), ...corners(VOL.S), ...corners(VOL.A)];
  const yL = gmax(low) + 0.25, yH = gmax(corners(VOL.H)) + 0.25;           // the floors (a hand over the land surface, which is 0.15 m over the height field): the hall stands a step higher
  const gLo = Math.min(gmin(low), gmin(corners(VOL.H))) - 0.4;
  const Fy = { C: yL, S: yL, A: yL, H: yH };
  const stats = { openings: 0, doors: 0 };

  // ---- one wall: its plinth, its skin round the openings, the openings (glazed ones light up at night)
  const open = (f, q) => { f.cuts.push(q); hole(B, f, q); stats.openings++; };
  const solidDoor = (f, q) => { // an opaque leaf in a shallow reveal
    f.cuts.push(q); stats.doors++;
    const d = 0.14;
    D.setColor(COL.rev);
    quad(D, at(f, q.s0, q.y0), at(f, q.s0, q.y0, -d), at(f, q.s0, q.y1, -d), at(f, q.s0, q.y1), f.U);
    quad(D, at(f, q.s1, q.y0), at(f, q.s1, q.y0, -d), at(f, q.s1, q.y1, -d), at(f, q.s1, q.y1), neg(f.U));
    quad(D, at(f, q.s0, q.y1), at(f, q.s1, q.y1), at(f, q.s1, q.y1, -d), at(f, q.s0, q.y1, -d), DN);
    D.setColor(q.col ?? COL.door); rect(D, f, q.s0, q.s1, q.y0, q.y1, -d + 0.02);
    D.setColor('#d4d6d8'); rect(D, f, q.s1 - 0.22, q.s1 - 0.14, (q.y0 + q.y1) / 2 - 0.1, (q.y0 + q.y1) / 2 + 0.1, -d + 0.04);
  };
  // wall(vol, a, b, n, { top, col, wins, doors, from? }): the face a -> b (local u, v) with outward normal n, from the ground to `top`
  const wall = (vol, a, b, n, { top, col, wins = [], doors = [], from = null, plinth = true, sills = false }) => {
    const f = face(a, b, n[0], n[1]), y = Fy[vol], y0 = from ?? gLo;
    for (const q of wins) open(f, { dep: 0.2, rev: COL.rev, frame: COL.frame, glass: COL.glass, lit: true, pitch: 1.1, sill: sills ? COL.sill : undefined, ...q, y0: y + q.y0, y1: y + q.y1 });
    for (const q of doors) solidDoor(f, { ...q, y0: y + q.y0, y1: y + q.y1 });
    if (plinth && from === null) skin(W, f, y0, y + 0.5, COL.plinth, [2.5, 2.5]);
    skin(W, f, plinth && from === null ? y + 0.5 : y0, y + top, col, [2.5, 2.5]);
    return f;
  };
  // a row of windows at the given centres along a face
  const row = (cs, w, y0, y1, extra = {}) => cs.map((c) => ({ s0: c - w / 2, s1: c + w / 2, y0, y1, ...extra }));
  const pitchRow = (n, s0, pitch) => Array.from({ length: n }, (_, i) => s0 + i * pitch);

  // ================================================================================================ C: the central block
  const [eC, tC] = H.C, Cv = VOL.C;
  const cWall = (a, b, n, o) => wall('C', a, b, n, { top: eC, col: COL.sand, ...o });
  // west: 12 bays, two rows; above the annex a window of the upper row
  cWall([0, 0], [0, 28.7], [-1, 0], { wins: [...row(pitchRow(12, 1.5, 2.3), 1.3, 0.95, 2.35), ...row(pitchRow(12, 1.5, 2.3), 1.1, 4.0, 5.4)], sills: true });
  cWall([0, 28.7], [0, 36.05], [-1, 0], { from: yL + 3.5, wins: row([3.7], 1.1, 4.0, 5.4) });
  // east: the courtyard front, eight bays; the glazed door under the porch
  const bayE = pitchRow(8, 1.15, 2.3);
  const fCE = cWall([13.85, 17.5], [13.85, 36.05], [1, 0], {
    wins: [...row(bayE.filter((c) => c < 11.3 || c > 16), 1.3, 0.95, 2.35), ...row(bayE, 1.1, 4.0, 5.4), { s0: 12.6, s1: 14.4, y0: 0.05, y1: 2.3, door: true, dep: 0.25, pitch: 0.9 }], sills: true,
  });
  // north gable end, south end above the south wing's roof
  cWall([0, 0], [13.85, 0], [0, -1], { wins: [...row([3.5, 10.35], 1.3, 0.95, 2.35), ...row([3.5, 10.35], 1.1, 4.0, 5.4)], sills: true });
  cWall([13.85, 36.05], [0, 36.05], [0, 1], { from: yL + 3.9, plinth: false });
  gable(W, B.roof, { u0: Cv.u0, u1: Cv.u1, v0: Cv.v0, v1: Cv.v1, ridge: 'v', eave: yL + eC, top: yL + tC, over: [0.35, 0.45], colR: COL.slate, colW: COL.sand, ends: [true, true] });
  D.setColor('#8b4a3a'); D.box(6.575, yL + tC - 0.9, 13.65, 7.275, yL + tC + 1.3, 14.35, 63); // the brick chimney on the slate ridge
  D.setColor('#4a4a4c'); D.box(6.5, yL + tC + 1.3, 13.55, 7.35, yL + tC + 1.4, 14.45, 63);

  // ================================================================================================ H: the sports hall
  const [eH] = H.H, Hv = VOL.H;
  const hWall = (a, b, n, o) => wall('H', a, b, n, { top: eH, col: COL.sandH, ...o });
  const hb = pitchRow(12, 1.5, 3.0);
  // south, onto the courtyard: ground windows, two glazed doors, the high ribbon
  hWall([13.85, 17.5], [50.35, 17.5], [0, 1], {
    wins: [...row(hb.filter((_, i) => i !== 3 && i !== 8), 2.0, 0.9, 2.6, { pitch: 1.0 }), ...row(hb.filter((_, i) => i !== 4 && i !== 5), 2.4, 4.3, 5.7, { pitch: 1.2 }),
      // six tall narrow niches between two of the high windows, as the courtyard photograph shows (deep reveals)
      ...row([12.7, 13.7, 14.7, 15.7, 16.7, 17.7], 0.6, 3.9, 5.8, { pitch: 5, dep: 0.32, glass: '#a38f78', frame: '#e6d0b0', rev: '#e0c6a4' }),
      ...[10.5, 25.5].map((c) => ({ s0: c - 0.9, s1: c + 0.9, y0: 0.05, y1: 2.35, door: true, dep: 0.25, pitch: 0.9 }))], sills: true,
  });
  // north, toward Simion Mehedinți: the ribbon, two high windows, a service door
  const fHN = hWall([13.85, 0], [50.35, 0], [0, -1], { wins: [...row(pitchRow(8, 2.25, 4.5), 3.0, 4.3, 5.7, { pitch: 1.0 }), ...row([6, 18], 1.0, 2.4, 3.3)], doors: [{ s0: 32.4, s1: 33.5, y0: 0, y1: 2.1 }] });
  // east end: a gable, a service door, windows
  const fHE = hWall([50.35, 0], [50.35, 17.5], [1, 0], { wins: [...row([4, 9], 1.6, 0.9, 2.4), ...row([8.75], 3.0, 4.3, 5.7)], doors: [{ s0: 13.9, s1: 15.0, y0: 0, y1: 2.1 }] });
  // west end above the central block's eave
  hWall([13.85, 0], [13.85, 17.5], [-1, 0], { from: yL + eC - 0.5, plinth: false });
  gable(W, B.roof, { u0: Hv.u0, u1: Hv.u1, v0: Hv.v0, v1: Hv.v1, ridge: 'u', eave: yH + eH, top: yH + H.H[1], over: [0.35, 0.45], colR: COL.blue, colW: COL.sandH, ends: [true, true] });

  // ================================================================================================ S: the south wing, on the street
  const [eS] = H.S, Sv = VOL.S;
  const sWall = (a, b, n, o) => wall('S', a, b, n, { top: eS, col: COL.cream, ...o });
  const fSouth = sWall([-4.15, 46.1], [22.4, 46.1], [0, 1], { wins: row([5.5, 9.2, 12.9, 16.6, 20.3, 24.0], 1.8, 0.95, 2.55), doors: [{ s0: 1.35, s1: 2.5, y0: 0, y1: 2.15 }], sills: true });
  const fSN = sWall([22.4, 36.05], [13.85, 36.05], [0, -1], { wins: row([2.1, 6.4], 1.4, 0.95, 2.45), sills: true });
  sWall([22.4, 36.05], [22.4, 46.1], [1, 0], { wins: row([2.5, 7.5], 1.4, 0.95, 2.45), sills: true });
  sWall([-4.15, 46.1], [-4.15, 36.05], [-1, 0], { wins: row([3, 7], 1.4, 0.95, 2.45), sills: true });
  gable(W, B.roof, { u0: Sv.u0, u1: Sv.u1, v0: Sv.v0, v1: Sv.v1, ridge: 'u', eave: yL + eS, top: yL + H.S[1], over: [0.35, 0.45], colR: COL.sky, colW: COL.cream, ends: [true, true] });

  // ================================================================================================ A: the annex
  const aT = yL + H.A[0], Av = VOL.A;
  wall('A', [-4.15, 36.05], [-4.15, 28.7], [-1, 0], { top: H.A[0], col: COL.cream, wins: row([3.7], 1.1, 0.95, 2.35) });
  wall('A', [-4.15, 28.7], [0, 28.7], [0, -1], { top: H.A[0], col: COL.cream, wins: row([2.07], 1.0, 0.95, 2.35) });
  B.roof.setColor(COL.flat);
  sq(B.roof, [[Av.u0 - 0.25, aT + 0.1, Av.v0 - 0.3], [Av.u1, aT + 0.1, Av.v0 - 0.3], [Av.u1, aT + 0.05, Av.v1], [Av.u0 - 0.25, aT + 0.05, Av.v1]], [0, 1, 0], [[0, 0], [2, 0], [2, 4], [0, 4]]);
  D.setColor(COL.gutter);
  box(D, face([-4.15, 28.7], [0, 28.7], 0, -1), -0.25, 4.15, aT, aT + 0.14, -0.3, 0, 'fl');

  // split air conditioners on the walls, white boxes as in the courtyard photograph
  D.setColor('#eceae6');
  for (const [f, s, y] of [[fSN, 4.25, yL + 1.55], [fCE, 9.2, yL + 1.1], [fHN, 24, yH + 1.7], [fHE, 11.5, yH + 1.7]]) box(D, f, s - 0.4, s + 0.4, y, y + 0.46, 0, 0.27, 'ftlrb');

  // ================================================================================================ gutters and downpipes (white, as in the photographs)
  const HALF = { C: 6.925, H: 8.75, S: 5.025 };
  const gut = (a, b, n, vol) => {
    const f = face(a, b, n[0], n[1]), [e, t] = H[vol], ya = Fy[vol] + e - (t - e) * 0.45 / HALF[vol];
    D.setColor(COL.gutter); box(D, f, -0.35, f.L + 0.35, ya - 0.12, ya + 0.02, 0.42, 0.55, 'fltrb');
  };
  gut([0, 0], [0, 28.7], [-1, 0], 'C'); gut([13.85, 17.5], [13.85, 36.05], [1, 0], 'C');
  gut([13.85, 17.5], [50.35, 17.5], [0, 1], 'H'); gut([13.85, 0], [50.35, 0], [0, -1], 'H');
  gut([-4.15, 46.1], [22.4, 46.1], [0, 1], 'S'); gut([22.4, 36.05], [13.85, 36.05], [0, -1], 'S');
  D.setColor(COL.gutter);
  for (const [u, v, vol, nx, nz] of [[13.85, 35.9, 'C', 1, 0], [0, 27.6, 'C', -1, 0], [50.1, 17.5, 'H', 0, 1], [14.0, 0, 'H', 0, -1], [22.4, 45.9, 'S', 1, 0], [-4.0, 46.1, 'S', 0, 1]]) {
    const y = Fy[vol], hgt = H[vol][0] - 0.15, x0 = u + nx * 0.14, z0 = v + nz * 0.14;
    D.box(x0 - 0.065, y, z0 - 0.065, x0 + 0.065, y + hgt, z0 + 0.065, 63 & ~8);
  }

  // ================================================================================================ the reception porch, dark timber
  {
    const P = PORCH, y = yL, h = 3.0, d = P.u1 - P.u0;
    const fr = face([P.u1, P.v0], [P.u1, P.v1], 1, 0), fn = face([P.u1, P.v0], [P.u0, P.v0], 0, -1), fs = face([P.u0, P.v1], [P.u1, P.v1], 0, 1);
    // the front: a glazed double door between timber, the desk plate over it
    const door = { s0: 1.2, s1: 3.2, y0: y + 0.05, y1: y + 2.3, dep: 0.2, door: true, pitch: 1.0, lit: true, glass: COL.glass, frame: '#e7e2d6', rev: COL.timberL };
    fr.cuts.push(door); hole(B, fr, door); stats.openings++;
    skin(D, fr, gLo, y + h, COL.timber);
    D.setColor(COL.timberL); for (let s = 0.4; s < fr.L; s += 0.9) rect(D, fr, s, s + 0.05, y + 2.35, y + h - 0.35, 0.012);
    for (const f of [fn, fs]) { skin(D, f, gLo, y + h, COL.timber); D.setColor(COL.timberL); for (let s = 0.35; s < f.L; s += 0.7) rect(D, f, s, s + 0.05, y + 0.05, y + h - 0.35, 0.012); }
    label(B.board, fr, 0.7, fr.L - 0.7, y + 2.42, y + 2.95, 0.03, DESK);
    // the roof slab: a thin sheet with a fascia, a little overhang; two lamps over the door
    D.setColor('#3b2a20'); box(D, fr, -0.2, fr.L + 0.2, y + h - 0.02, y + h + 0.1, -d, 0.2, 'fltrb'); // the fascia band
    gable(W, B.roof, { u0: P.u0, u1: P.u1 + 0.2, v0: P.v0 - 0.2, v1: P.v1 + 0.2, ridge: 'u', eave: y + h + 0.1, top: y + h + 0.85, over: [0.05, 0.3], colR: '#46301f', colW: COL.timber, ends: [false, true] });
    B.lit.setColor('#fff1cf'); for (const s of [0.45, fr.L - 0.45]) { const p = at(fr, s, y + 2.5, 0.08); B.lit.box(p[0] - 0.03, p[1], p[2] - 0.12, p[0] + 0.07, p[1] + 0.22, p[2] + 0.12, 63); }
    D.setColor(COL.step); box(D, fr, 0.2, fr.L - 0.2, gLo + 0.2, y - 0.02, 0.02, 1.4, 'ftlr'); // the step
    stats.porch = 1;
  }

  // ================================================================================================ the pergola along the hall's courtyard front
  const pergola = { u0: 13.95, u1: 49.95, v0: 17.5, v1: 20.9, n: 12 };
  {
    const post = 0.14, vp = pergola.v1 - 0.25, fS = face([13.85, vp], [50.35, vp], 0, 1);
    D.setColor(COL.timber);
    for (let i = 1; i <= pergola.n; i++) box(D, fS, 3 * i - post / 2, 3 * i + post / 2, gLo + 0.4, yH + 2.8, -post / 2, post / 2, 'fblrt');
    box(D, fS, 2.9, 3 * pergola.n + 0.1, yH + 2.8, yH + 3.0, -0.1, 0.1, 'fblrtu');
    // the canopy slopes down away from the wall: a sheet over a plate, one slab
    const yw = yH + 3.55, yp = yH + 3.0, pv1 = pergola.v1 + 0.3, u0 = pergola.u0, u1 = pergola.u1;
    D.setColor('#4a3020');
    sq(D, [[u0, yw, 17.5], [u1, yw, 17.5], [u1, yp, pv1], [u0, yp, pv1]], [0, 0.97, 0.24]);
    sq(D, [[u0, yw - 0.1, 17.5], [u1, yw - 0.1, 17.5], [u1, yp - 0.1, pv1], [u0, yp - 0.1, pv1]], [0, -0.97, -0.24]);
    sq(D, [[u0, yp, pv1], [u1, yp, pv1], [u1, yp - 0.1, pv1], [u0, yp - 0.1, pv1]], [0, 0, 1]);
    for (const u of [u0, u1]) sq(D, [[u, yw, 17.5], [u, yw - 0.1, 17.5], [u, yp - 0.1, pv1], [u, yp, pv1]], [u < 30 ? -1 : 1, 0, 0]);
    // rafters under the sheet, every 1.5 m, and a deeper front beam
    D.setColor('#6a4528');
    const yb = (v) => yw + (yp - yw) * (v - 17.5) / (pv1 - 17.5) - 0.1, dr = 0.17;
    for (let u = u0 + 0.75; u < u1; u += 1.5) {
      const a = u - 0.05, b = u + 0.05;
      sq(D, [[a, yb(17.5), 17.5], [a, yb(pv1), pv1], [a, yb(pv1) - dr, pv1], [a, yb(17.5) - dr, 17.5]], [-1, 0, 0]);
      sq(D, [[b, yb(17.5), 17.5], [b, yb(pv1), pv1], [b, yb(pv1) - dr, pv1], [b, yb(17.5) - dr, 17.5]], [1, 0, 0]);
      sq(D, [[a, yb(17.5) - dr, 17.5], [b, yb(17.5) - dr, 17.5], [b, yb(pv1) - dr, pv1], [a, yb(pv1) - dr, pv1]], [0, -0.97, -0.24]);
    }
    D.setColor('#4a3020'); box(D, fS, 2.9, 3 * pergola.n + 0.1, yH + 2.62, yH + 2.82, -0.12, 0.12, 'fblrtu');
    // a knee brace from each post up to the beam (one slanted board, both faces)
    D.setColor(COL.timber);
    for (let i = 1; i <= pergola.n; i++) {
      const u = 13.85 + 3 * i - 0.07, vp = pergola.v1 - 0.25;
      for (const dv of [-0.055, 0.055]) sq(D, [[u, yH + 1.95, vp + dv], [u - 0.95, yH + 2.7, vp + dv], [u - 0.95, yH + 2.84, vp + dv], [u, yH + 2.09, vp + dv]], [0, 0, dv < 0 ? -1 : 1]);
    }
    stats.posts = pergola.n;
  }
  // steps at the two glazed doors of the hall, onto the courtyard; the south door's step
  {
    const f = face([13.85, 17.5], [50.35, 17.5], 0, 1);
    D.setColor(COL.step);
    for (const c of [10.5, 25.5]) { box(D, f, c - 1.2, c + 1.2, gLo, yH, 0.0, 1.3, 'ftlr'); box(D, f, c - 1.2, c + 1.2, gLo, yH - 0.25, 1.3, 1.9, 'ftlr'); }
    box(D, face([-4.15, 46.1], [22.4, 46.1], 0, 1), 1.0, 2.9, gLo, yL, 0.0, 0.9, 'ftlr');
  }

  // ================================================================================================ the name plate on the street front
  const plate = { s0: 10.4, s1: 16.3, y0: yL + 2.95, y1: yL + 4.07 };
  D.setColor('#e9e6df'); box(D, fSouth, plate.s0 - 0.1, plate.s1 + 0.1, plate.y0 - 0.1, plate.y1 + 0.1, 0, 0.07, 'lrtubf');
  label(B.board, fSouth, plate.s0, plate.s1, plate.y0, plate.y1, 0.085, NAME);

  // ================================================================================================ collision: the volumes and their sloped roofs
  const cAxis = { u: [CA, SA, -(O[0] * CA + O[1] * SA)], v: [-SA, CA, O[0] * SA - O[1] * CA] }; // local u / v as a plane of (x, z): [dx, dz, constant]
  const place = (r, vol, ridge) => {
    const [e, t] = H[vol], y1 = Fy[vol] + e, [mx, mz] = toMap((r.u0 + r.u1) / 2, (r.v0 + r.v1) / 2);
    S.obox(mx, mz, (r.u1 - r.u0) / 2, (r.v1 - r.v0) / 2, ANG, gLo - 0.5, y1, 'wall');
    if (t === e) return;
    const along = ridge === 'u', c0 = along ? r.v0 : r.u0, c1 = along ? r.v1 : r.u1, cm = (c0 + c1) / 2, gr = (t - e) / ((c1 - c0) / 2), [gx, gz, k] = cAxis[along ? 'v' : 'u'];
    for (const side of [-1, 1]) {
      const ca = side < 0 ? c0 : cm, cb = side < 0 ? cm : c1, ref = side < 0 ? c0 : c1, sg = side < 0 ? 1 : -1;
      const q = along ? [[r.u0, ca], [r.u1, ca], [r.u1, cb], [r.u0, cb]] : [[ca, r.v0], [cb, r.v0], [cb, r.v1], [ca, r.v1]];
      S.prism(q.map(([u, v]) => toMap(u, v)).flat(), y1 - 0.3, y1 + sg * gr * (k - ref), sg * gr * gx, sg * gr * gz, 'wall');
    }
  };
  place(VOL.C, 'C', 'v'); place(VOL.H, 'H', 'u'); place(VOL.S, 'S', 'u'); place(VOL.A, 'A', 'u');
  { // the porch, and the pergola's posts and canopy (a car passes under it)
    const P = PORCH, [mx, mz] = toMap((P.u0 + P.u1) / 2 + 0.1, (P.v0 + P.v1) / 2);
    S.obox(mx, mz, (P.u1 - P.u0) / 2 + 0.2, (P.v1 - P.v0) / 2, ANG, gLo - 0.5, yL + 3.2, 'wall');
    for (let i = 1; i <= pergola.n; i++) { const [x, z] = toMap(13.85 + 3 * i, pergola.v1 - 0.25); S.cyl(x, z, yH - 0.3, yH + 2.8, 0.09, 0.09, 'pole'); }
    const q = [[pergola.u0, 17.5], [pergola.u1, 17.5], [pergola.u1, pergola.v1 + 0.3], [pergola.u0, pergola.v1 + 0.3]].map(([u, v]) => toMap(u, v)).flat();
    S.prism(q, yH + 2.9, yH + 3.5, 0, 0, 'awning', 1);
  }
  return { yC: yL, yH, gLo, stats, pergola, plate, top: yL + H.C[1] };
}
