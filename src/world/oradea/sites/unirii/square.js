// Piața Unirii: the furniture of the square, everything that stands or lies on the paving of paving.js.
//   buildSquare(ctx, P) adds to ctx.B (stone, det, glow), ctx.S (solids) and ctx.spots:
//     the tram rails laid flush in the red setts of the bed, with a pale granite edge on both sides;
//     the four fountain basins (low rims of pale limestone round the OSM ponds), stone ball bollards;
//     white kerbs round the lawns;
//     the west promenade wall (a low balustrade in front of the Primăria, the pink house and the palace) with the groups of
//       three lantern columns standing before it;
//     the black street lamps with a curved arm and a flat head, opal globe lamps on stone blocks, benches, young trees.
//   ctx: { g (terrain y), B: { stone, det, glow }, S (collision world), spots (tree spots), r (rng), M4 }
//   Returns { jets: [[x, y, z, k]], lampPts }: the fountain centres and the lit points.
// Kept lean (about 9k vertices): flush things are top faces only, boxes drop the faces nobody sees.
import { toMap, yawOf, E, S as AXS } from './frame.js';
import { ribbon, ringOffset } from './kit.js';
import { LAYOUT } from './paving.js';

const IRON = 0x2b2d30, LIME = 0xe4dfd2, PI = Math.PI;

export function buildSquare(ctx, P) {
  const { g, B, S, r, M4 } = ctx, LP = P.lift;
  const top = (x, z) => g(x, z) + LP;
  const jets = [], lampPts = [];

  // ---------------------------------------------------------------- the tram: flush rails, a pale kerb each side
  for (const [A, side] of [[LAYOUT.tramA, 1], [LAYOUT.tramB, -1]]) {
    ribbon(B.stone, A.map(([e, s]) => [e, s + side * 2.25]), { g, w: 0.3, lift: LP, h: 0.03, col: 0xd9d4c6, sides: false });
    for (const off of [-0.7175, 0.7175]) {
      ribbon(B.det, A.map(([e, s]) => [e, s + off]), { g, w: 0.2, lift: LP, h: 0.012, col: 0x2e2a28, sides: false });
      ribbon(B.det, A.map(([e, s]) => [e, s + off]), { g, w: 0.075, lift: LP, h: 0.04, col: 0x7a7e82, sides: false });
    }
  }

  // ---------------------------------------------------------------- the four fountain basins
  P.ponds.forEach((pond, k) => {
    ribbon(B.stone, ringOffset(pond, 0.32), { g, w: 0.62, lift: LP, h: 0.42, drop: 0.62, col: LIME, colSide: 0xd8d3c5, closed: true, uvm: 1.2 });
    let cx = 0, cz = 0; for (const p of pond) { cx += p[0] / pond.length; cz += p[1] / pond.length; }
    const [x, z] = toMap(cx, cz);
    jets.push([x, g(x, z) + LP, z, k]);
    const out = ringOffset(pond, 0.65).map(([e, s]) => toMap(e, s)), inner = pond.map(([e, s]) => toMap(e, s));
    S.prism(out.flat(), g(x, z) - 0.3, g(x, z) + LP + 0.42, 0, 0, 'ledge', 0, [inner.flat()]);
  });
  // stone ball bollards round the basins (the spheres of the photos: a little over half a metre)
  for (const [e, s] of [[19.5, 5.5], [31.5, 33], [53, 38], [66, -10], [33, -39], [57.5, -37], [28.5, 2], [51, 10]]) {
    const [x, z] = toMap(e, s), y = top(x, z);
    B.stone.setColor(0xc9c4b6).cyl(x, y - 0.1, z, 0.2, 0.17, 0.22, 6, false);
    B.stone.setColor(0xdcd7ca).ellipsoid([x, y + 0.34, z], [0.32, 0.32, 0.32], 8, 5);
    S.cyl(x, z, y - 0.3, y + 0.66, 0.3, 0.3, 'bollard');
  }

  // ---------------------------------------------------------------- kerbs round the lawns
  for (const L of P.lawns) ribbon(B.stone, ringOffset(L, 0.12), { g, w: 0.26, lift: LP, h: 0.08, drop: 0.12, col: 0xdcd8cc, closed: true, uvm: 1.2, sides: false });

  // ---------------------------------------------------------------- the west wall and the lantern columns
  const wallE = -24.8, gaps = [[-12.2, -7.8], [0.8, 5.2], [-27.5, -25.0]], segs = [];
  { let a = -37; for (const [g0, g1] of [...gaps].sort((p, q) => p[0] - q[0])) { if (g0 > a) segs.push([a, g0]); a = Math.max(a, g1); } if (a < 45) segs.push([a, 45]); }
  for (const [s0, s1] of segs) {
    const [xa, za] = toMap(wallE, s0), [xb, zb] = toMap(wallE, s1), Lw = s1 - s0, ux = AXS[0], uz = AXS[1];
    const yaw = Math.atan2(-uz, ux), nB = Math.max(1, Math.round(Lw / 2.6)), bay = Lw / nB;
    for (let k = 0; k < nB; k++) {
      const x0 = xa + ux * bay * k, z0 = za + uz * bay * k, x1 = x0 + ux * bay, z1 = z0 + uz * bay;
      const yb = Math.max(g(x0, z0), g(x1, z1)) + 0.1, yl = Math.min(g(x0, z0), g(x1, z1)) - 0.4;
      B.stone.with(M4(x0, 0, z0, yaw), (q) => {
        q.setColor(0xd3cdbf).box(0.2, yl, -0.2, bay - 0.2, yb + 0.62, 0.2, 4 | 16 | 32);                      // the panel course
        q.setColor(0xece8dc).box(0.2, yb + 0.62, -0.3, bay - 0.2, yb + 0.74, 0.3, 4 | 16 | 32 | 1 | 2);        // the coping
        q.setColor(0xb6af9f).box(0.5, yb + 0.15, -0.205, bay - 0.5, yb + 0.5, 0.205, 16 | 32);                // the carved panel, both sides
        q.setColor(LIME).box(0.0, yl, -0.27, 0.34, yb + 0.98, 0.27, 4 | 16 | 32 | 1 | 2);                      // a post
      });
    }
    { const y1 = g(xb, zb) + 0.1; B.stone.setColor(LIME).box(xb - 0.2, y1 - 0.4, zb - 0.2, xb + 0.2, y1 + 1.0, zb + 0.2, 4 | 1 | 2 | 16 | 32); }
    S.obox((xa + xb) / 2, (za + zb) / 2, Lw / 2, 0.3, Math.atan2(zb - za, xb - xa), Math.min(g(xa, za), g(xb, zb)) - 0.4, Math.max(g(xa, za), g(xb, zb)) + 1.05, 'wall');
  }

  // groups of three lantern columns on plinths in front of the wall
  const trio = (e, s) => {
    const [x0, z0] = toMap(e, s), y = top(x0, z0), ux = AXS[0], uz = AXS[1];
    for (const [k, H] of [[-1, 4.3], [0, 5.5], [1, 4.3]]) {
      const x = x0 + ux * 2.1 * k, z = z0 + uz * 2.1 * k;
      B.stone.setColor(0xcfc9bb).box(x - 0.4, y - 0.3, z - 0.4, x + 0.4, y + 0.55, z + 0.4, 4 | 1 | 2 | 16 | 32);
      B.stone.setColor(0xd7d1c3).cyl(x, y + 0.55, z, 0.2, 0.17, H - 1.1, 8, false);                                 // the shaft
      B.stone.setColor(0xc4bead).cyl(x, y + 1.3, z, 0.235, 0.235, 0.1, 8, false); B.stone.cyl(x, y + 2.6, z, 0.235, 0.235, 0.1, 8, false); // carved bands
      B.stone.setColor(0xe3ded0).cyl(x, y + H - 0.62, z, 0.2, 0.34, 0.3, 8, true);                                  // the capital
      // the iron candelabrum: one lantern on a stalk and three small ones on arms
      B.det.setColor(IRON).cyl(x, y + H - 0.32, z, 0.22, 0.16, 0.1, 6, true);
      B.glow.setColor(0xfff0cf).cyl(x, y + H - 0.2, z, 0.14, 0.16, 0.42, 6, false);
      B.det.cyl(x, y + H + 0.22, z, 0.19, 0.03, 0.2, 6, false);
      for (let q = 0; q < 3; q++) {
        const a = q * PI * 2 / 3 + k, ax = Math.cos(a), az = Math.sin(a);
        B.det.tube([x, y + H - 0.2, z], [x + ax * 0.42, y + H - 0.05, z + az * 0.42], 0.02, 3);
        B.glow.setColor(0xfff0cf).cyl(x + ax * 0.46, y + H - 0.34, z + az * 0.46, 0.075, 0.09, 0.26, 4, false);
      }
      S.cyl(x, z, y - 0.3, y + H, 0.38, 0.22, 'column');
      lampPts.push([x, y + H + 0.1, z]);
    }
  };
  for (const s of [-30, -14.5, 10.5, 27, 41]) trio(-23.4, s);

  // ---------------------------------------------------------------- street lamps: black, a curved arm, a flat head
  const lamp = (e, s, faceE, faceS) => {
    const [x, z] = toMap(e, s), y = top(x, z), dl = Math.hypot(faceE, faceS) || 1;
    const dx = (faceE * E[0] + faceS * AXS[0]) / dl, dz = (faceE * E[1] + faceS * AXS[1]) / dl;
    B.stone.setColor(0xe6e2d8).box(x - 0.22, y - 0.2, z - 0.22, x + 0.22, y + 0.7, z + 0.22, 4 | 1 | 2 | 16 | 32);
    B.det.setColor(IRON).cyl(x, y + 0.7, z, 0.1, 0.07, 4.95, 6, false);
    const H = y + 5.65, p = [[0, 0], [0.3, 0.42], [0.95, 0.5], [1.32, 0.32]].map(([a, b]) => [x + dx * a, H + b, z + dz * a]);
    for (let i = 0; i + 1 < p.length; i++) B.det.tube(p[i], p[i + 1], 0.045, 4);
    const [hx, hy, hz] = p[3];
    B.det.cyl(hx, hy - 0.14, hz, 0.42, 0.38, 0.1, 8, true);
    B.glow.setColor(0xfff0d0).cyl(hx, hy - 0.17, hz, 0.34, 0.34, 0.03, 8, false);
    S.cyl(x, z, y - 0.3, y + 5.7, 0.14, 0.09, 'pole');
    lampPts.push([hx, hy - 0.2, hz]);
  };
  for (const [e, s, fe, fs] of [[-8, -28, 1, 0], [-8, 19, 1, 0], [20, -30, -1, 0], [20, 32, -1, 0], [42, -37, 0, 1], [42, 38.5, 0, -1], [64.5, -32, -1, 0], [64.5, 0, -1, 0], [64.5, 31, -1, 0],
    [-20, -52, 1, 0], [10, -53.5, 0, 1], [40, -53.5, 0, 1], [-33.5, 6, -1, 0], [-33.5, 20, -1, 0], [-33.5, 34, -1, 0], [31, 70, 1, 0], [64, 90, -1, 0], [31, 108, 1, 0], [64, 124, -1, 0]]) lamp(e, s, fe, fs);

  // opal globe lamps on stone blocks (as at the south-west lawn)
  for (const [e, s] of [[6.5, 36], [24.5, 37.5], [66.5, 36], [9.5, -41]]) {
    const [x, z] = toMap(e, s), y = top(x, z);
    B.stone.setColor(0xe6e2d8).box(x - 0.42, y - 0.2, z - 0.42, x + 0.42, y + 0.95, z + 0.42, 4 | 1 | 2 | 16 | 32);
    B.glow.setColor(0xfff2d8).ellipsoid([x, y + 1.4, z], [0.4, 0.4, 0.4], 10, 6);
    S.cyl(x, z, y - 0.3, y + 1.05, 0.5, 0.5, 'block');
    lampPts.push([x, y + 1.4, z]);
  }

  // ---------------------------------------------------------------- benches: two timber boards and a back on iron legs
  const bench = (e, s, faceE, faceS) => {
    const [x, z] = toMap(e, s), y = top(x, z), yaw = yawOf(faceE, faceS);
    B.det.with(M4(x, y, z, yaw), (q) => {
      q.setColor(0x8a6a4a).box(-0.85, 0.43, -0.22, 0.85, 0.47, 0.2, 4 | 16 | 32).box(-0.85, 0.6, -0.27, 0.85, 0.9, -0.23, 16 | 32 | 4);
      q.setColor(IRON);
      for (const a of [-0.75, 0.75]) q.box(a - 0.035, 0, -0.27, a + 0.035, 0.9, 0.22, 1 | 2 | 16);
    });
    S.obox(x, z, 0.9, 0.35, -yaw, y, y + 0.5, 'bench');
  };
  for (const [e, s, fe, fs] of [[29, -19, 1, 0], [29, 17, 1, 0], [54, -5, -1, 0], [54, 5, -1, 0], [-9, -5, 1, 0], [-9, 8, 1, 0], [19, -5, -1, 0], [19, 8, -1, 0],
    [27, 84, 1, 0], [66, 84, -1, 0], [35, 52, 0, 1], [48, 52, 0, 1], [-41, 14, -1, 0], [-41, 28, -1, 0]]) bench(e, s, fe, fs);

  // ---------------------------------------------------------------- young trees (staked saplings and clipped crowns)
  const trees = [];
  for (let s = -30; s <= 34; s += 12) trees.push([66.8, s]);                            // the east edge, before the Black Eagle
  for (let e = -4; e <= 62; e += 11) trees.push([e, -56]);                               // the forecourt of Sf. Ladislau
  for (const s of [-34, -18, 14, 30]) trees.push([-14, s]);                              // west of the plaza
  for (const s of [5, 13, 21, 29, 37]) trees.push([-36.5, s]);                           // the pavement before the palace
  for (let s = 66; s <= 124; s += 13) { trees.push([28.8, s]); trees.push([66.2, s + 6]); } // the promenade
  for (const [e, s] of trees) { const [x, z] = toMap(e, s); ctx.spots.push({ x, z, kind: 'street', variant: r() < 0.5 ? 'sapling' : 'linden', sc: 0.62 + r() * 0.35 }); }

  return { jets, lampPts };
}
