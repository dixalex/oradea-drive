// OWNER: oradea. The wooden church of the Holy Cross Monastery (OSM way 914060058, Mănăstirea Sfintei Cruci, Oradea): a 17th-century
// church from Corbești, Bihor, moved here in 1994 (LMI BH-II-m-B-01047). After the Commons photo «Biserica mănăstirii Oradea»: squared
// logs on a low cobble plinth, a deep eave carried on posts round the nave (a gallery), one broad shingled roof hipped at the west
// with a lower altar roof stepping down at the east end (a silver cross on a box at each ridge end), and over the west bay a tall
// slim shingled tower: a square shaft, an open belfry, a flared hood and a concave spire with a cross.
//   buildWooden({ B, S, g, ring }) -> { footprints, stats, top }
import {
  PI, begin, end, edgeFrame, at, nrm, rect, slab, poly, gable, cross, rectFrames,
} from './kit.js';
import { frameOf } from './church.js';

export const WOODEN_ID = 914060058;
const C = { log: '#a99983', logDark: '#85755f', end: '#6f604d', plinth: '#8d8679', shingle: '#928e88', shingleDk: '#7f7b76', door: '#4a3424', glass: '#1f1a16', metal: '#b4babe', post: '#bba88c' };

// the spire's half-width / height rings, bottom to top: a flared hood, then a long concave rise to a thin point
const SPIRE = [[1.3, 0], [1.2, 0.3], [0.9, 0.62], [0.65, 1.4], [0.5, 2.6], [0.34, 4.0], [0.2, 5.2], [0.11, 6.0], [0.07, 6.5]];

export function buildWooden({ B, S, g, ring }) {
  const F = frameOf(ring), toW = F.toMap, st = { windows: 0, solids: 0, towers: 1 };
  let hi = -1e9, lo = 1e9;
  for (const [u, v] of F.ring.concat([[0, 0], [-6, 0], [6, 0]])) { const [x, z] = toW(u, v), h = g(x, z); if (Number.isFinite(h)) { hi = Math.max(hi, h); lo = Math.min(lo, h); } }
  if (!Number.isFinite(hi)) { hi = 3; lo = 3; }
  const Fy = hi + 0.1, gLo = lo - 0.5, Y = (h) => Fy + h;
  const pl = 0.55;                                              // plinth top
  const eave = 3.4, nHalf = 2.8, aHalf = 2.1, ov = 1.5;       // eave height (above Fy), half widths of the nave / altar walls, overhang
  const ridgeN = 6.4, k = (ridgeN - eave) / nHalf, ridgeA = eave + aHalf * k;
  const uw0 = F.minU + 1.3, un = 1.8, ue = F.maxU - 1.7;        // west wall, nave / altar joint, east wall
  begin(B, F.cx, F.cz, F.yaw);
  const WD = B.wood, SH = B.shingle, ST = B.stone, DT = B.det;

  // ---- plinth: a low cobble platform under the whole church and its gallery
  ST.setColor(C.plinth); ST.box(uw0 - 0.9, gLo, -3.95, ue + 0.8, Y(pl), 3.95);

  // ---- log walls: nave and altar, with a rope band, small barred windows, corner log ends, the door on the south
  const nave = rectFrames(uw0, un, -nHalf, nHalf), alt = rectFrames(un, ue, -aHalf, aHalf);
  const wall = (f, y1) => {
    WD.setColor(C.log); rect(WD, f, 0, f.L, Y(pl), Y(y1));
    WD.setColor(C.logDark); slab(WD, f, 0, f.L, Y(2.25), Y(2.4), 0, 0.05, 'ft');
    WD.setColor(C.logDark); slab(WD, f, -0.05, f.L + 0.05, Y(y1) - 0.42, Y(y1) - 0.24, 0, 0.08, 'f');
  };
  wall(nave.N, eave); wall(nave.S, eave); wall(nave.W, eave); wall(alt.N, eave); wall(alt.S, eave); wall(alt.E, eave);
  // the nave's east face above the altar roof and the west face are plain logs; log ends at the corners
  WD.setColor(C.log); rect(WD, nave.E, 0, nave.E.L, Y(pl), Y(eave));
  WD.setColor(C.end);
  for (const [u, v] of [[uw0, -nHalf], [uw0, nHalf], [un, -nHalf], [un, nHalf], [ue, -aHalf], [ue, aHalf]]) {
    for (let y = pl + 0.25; y < eave - 0.1; y += 0.5) WD.box(u - 0.17, Y(y), v - 0.17, u + 0.17, Y(y) + 0.22, v + 0.17);
  }
  const winAt = (f, s, y) => { DT.setColor(C.glass); slab(DT, f, s - 0.2, s + 0.2, Y(y), Y(y) + 0.5, 0, 0.05, 'f'); WD.setColor(C.logDark); slab(WD, f, s - 0.26, s + 0.26, Y(y) - 0.06, Y(y) + 0.56, 0, 0.03, 'f'); st.windows++; };
  for (const s of [3.4, 5.6]) { winAt(nave.S, s, 1.45); winAt(nave.N, s, 1.45); }
  winAt(alt.S, 1.5, 1.45); winAt(alt.N, 1.5, 1.45); winAt(alt.E, alt.E.L / 2, 1.45);
  // the door in the south wall near the west end: a plank door under a plain lintel
  { const f = nave.S, s = 1.1;
    DT.setColor(C.door); slab(DT, f, s - 0.45, s + 0.45, Y(pl), Y(pl) + 1.85, 0, 0.06, 'f');
    WD.setColor(C.logDark); slab(WD, f, s - 0.6, s + 0.6, Y(pl) + 1.85, Y(pl) + 2.05, 0, 0.1, 'ft'); slab(WD, f, s - 0.6, s - 0.45, Y(pl), Y(pl) + 1.85, 0, 0.08, 'f'); slab(WD, f, s + 0.45, s + 0.6, Y(pl), Y(pl) + 1.85, 0, 0.08, 'f'); }

  // ---- roofs: the nave hipped at the west, gabled at the east over the lower altar roof, both on the same pitch
  gable(SH, { a0: uw0, a1: un + 0.1, b0: -nHalf, b1: nHalf, yE: Y(eave), yR: Y(ridgeN), ridge: 'u', ov, rake: 0.1, hip0: true, col: C.shingle, G: SH, gcol: C.shingleDk });
  gable(SH, { a0: un, a1: ue, b0: -aHalf, b1: aHalf, yE: Y(eave), yR: Y(ridgeA), ridge: 'u', ov, rake: 0.1, hip1: true, col: C.shingle });

  // ---- the gallery posts under the eave, with a beam on top
  { const under = (v, half) => eave - k * (Math.abs(v) - half) - 0.14;
    WD.setColor(C.post);
    for (const sg of [-1, 1]) {
      for (const u of [uw0 + 0.4, -3.4, -0.9, 1.4]) { const v = sg * 3.65, y1 = Y(under(v, nHalf)); WD.box(u - 0.11, Y(pl), v - 0.11, u + 0.11, y1, v + 0.11); }
      WD.box(uw0 + 0.3, Y(under(sg * 3.65, nHalf)) - 0.02, sg * 3.65 - 0.1, 1.5, Y(under(sg * 3.65, nHalf)) + 0.16, sg * 3.65 + 0.1);
      for (const u of [un + 1.4, ue - 0.5]) { const v = sg * 3.15, y1 = Y(under(v, aHalf)); WD.box(u - 0.11, Y(pl), v - 0.11, u + 0.11, y1, v + 0.11); }
    }
    for (const u of [ue + 0.1]) for (const v of [-3.15, 0, 3.15]) { const y1 = Y(under(v, aHalf)); if (Math.abs(v) < 0.1) continue; WD.box(u - 0.11, Y(pl), v - 0.11, u + 0.11, y1, v + 0.11); }
  }

  // ---- the tower over the west bay: a shingled shaft, an open belfry, the flared hood and the spire
  { const tu0 = uw0 + 0.4, tu1 = tu0 + 1.9, hw = 0.95, tcx = (tu0 + tu1) / 2, y0 = Y(eave + 0.5), y1 = Y(8.9), y2 = Y(10.0);
    Object.values(rectFrames(tu0, tu1, -hw, hw)).forEach((f) => { SH.setColor(C.shingleDk); rect(SH, f, 0, f.L, y0, y1); });
    // the belfry: four corner posts round a dark opening, a floor and a top beam
    WD.setColor(C.post);
    for (const [u, v] of [[tu0 + 0.1, -hw + 0.1], [tu0 + 0.1, hw - 0.1], [tu1 - 0.1, -hw + 0.1], [tu1 - 0.1, hw - 0.1]]) WD.box(u - 0.11, y1, v - 0.11, u + 0.11, y2, v + 0.11);
    WD.box(tu0 - 0.06, y1 - 0.12, -hw - 0.06, tu1 + 0.06, y1 + 0.08, hw + 0.06);
    WD.box(tu0 - 0.06, y2 - 0.1, -hw - 0.06, tu1 + 0.06, y2 + 0.06, hw + 0.06);
    DT.setColor('#1d1713'); DT.box(tu0 + 0.2, y1 + 0.08, -hw + 0.2, tu1 - 0.2, y2 - 0.1, hw - 0.2);
    DT.setColor('#a8794a'); DT.cyl(tcx, y1 + 0.5, 0, 0.32, 0.12, 0.45, 8, true);                 // a bell
    // the spire: square rings (half-widths from SPIRE) joined by planar quads
    const y3 = y2 + 0.06, ringAt = ([h, y]) => [[tcx - h, y3 + y, -h], [tcx + h, y3 + y, -h], [tcx + h, y3 + y, h], [tcx - h, y3 + y, h]];
    SH.setColor(C.shingleDk);
    for (let i = 0; i + 1 < SPIRE.length; i++) {
      const a = ringAt(SPIRE[i]), b = ringAt(SPIRE[i + 1]);
      for (let j = 0; j < 4; j++) { const q = (j + 1) % 4, m = [(a[j][0] + a[q][0]) / 2 - tcx, 0.3, (a[j][2] + a[q][2]) / 2]; poly(SH, [a[j], a[q], b[q], b[j]], m); }
    }
    SH.setColor(C.shingle); SH.face([[tcx - 1.3, y3, -1.3], [tcx + 1.3, y3, -1.3], [tcx + 1.3, y3, 1.3], [tcx - 1.3, y3, 1.3]], [0, -1, 0]);
    const ty = y3 + SPIRE[SPIRE.length - 1][1];
    B.dome.setColor(C.metal); B.dome.box(tcx - 0.2, ty - 0.05, -0.2, tcx + 0.2, ty + 0.4, 0.2);
    cross(B.dome, tcx, ty + 0.4, 0, 1.7, C.metal);
    var top = ty + 2.1;
    S.obox(...toW(tcx, 0), 1.0, 1.0, F.yaw, gLo, Y(10.1), 'tower'); st.solids++;
  }

  // ---- a silver cross on a box at the end of each ridge
  { const bx = (u, y) => { B.dome.setColor(C.metal); B.dome.box(u - 0.28, y - 0.04, -0.28, u + 0.28, y + 0.55, 0.28); cross(B.dome, u, y + 0.55, 0, 1.9, C.metal); };
    bx(un + 0.1, Y(ridgeN) - 0.0); bx(ue - aHalf, Y(ridgeA) - 0.0);
  }
  end(B);

  // ---- colliders: the plinth and logs, the roof slopes (a half each side of the ridge)
  const R = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => toW(u, v)).flat();
  S.prism(R(uw0 - 0.9, ue + 0.8, -3.95, 3.95), gLo, Y(eave), 0, 0, 'wall'); st.solids++;
  const V = F.V, cV = F.cx * V[0] + F.cz * V[1];
  const roof = (u0, u1, half, ridgeH) => {
    const e = half + ov;
    S.prism(R(u0, u1, 0, e), gLo, Y(ridgeH) + k * cV, -k * V[0], -k * V[1], 'roof');
    S.prism(R(u0, u1, -e, 0), gLo, Y(ridgeH) - k * cV, k * V[0], k * V[1], 'roof'); st.solids += 2;
  };
  roof(uw0, un + 0.1, nHalf, ridgeN); roof(un + 0.1, ue + 0.2, aHalf, ridgeA);
  const wr = F.ring.map(([u, v]) => toW(u, v));
  return { footprints: [{ poly: wr, h: top - gLo, kind: 'church', name: 'Biserica de lemn din Corbești', id: WOODEN_ID }], stats: st, top, F, Fy, gLo };
}
void PI; void edgeFrame; void at; void nrm;
