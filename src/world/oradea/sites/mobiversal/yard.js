// OWNER: oradea. The yard of the Mobiversal house (Strada Thurzó Sándor 40, Oradea): the concrete car park, the street fence, the green-screened
// boundary fences, the neighbour's cypress hedge, the waste bin and the electricity cabinets on the pavement, a young tree, the parked cars. Not a
// site module; ../mobiversal.js calls buildYard once the building is made.
// From the Street View panoramas (2019, 2023, 2024): the lot is a plain concrete slab car park open to the street for the south 11 m of its
// frontage (the entrance); a concrete plinth with a welded-wire fence runs along the north 12 m, ending in the post that carries the number plate «40»;
// the south boundary is a low concrete wall with a green screen on wire panels; the neighbour's cypress hedge (about 4 m) stands on the north
// boundary. Guesses: the east fence behind the building, the lawn strips, the young tree's spot, where the cars stand.
//   buildYard({ B, S, g, yF, r }) -> { solids, parked, clear(x, z), stats }
//     B = { det, pave, fence, sign } builders (MB; det / fence / sign carry the local frame's transform, pave is draped in world metres);
//     S the collision world; g(x, z) world ground height; yF the floor line; r the seeded rng
import { MB } from '../../../../kit/mesh.js';
import { quad } from '../../../cherkasy/slabkit.js';
import { FR, LOT, GATE_X, L, D1, D2, XB, toWorld } from './plan.js';
import { FENCE_UV, SIGN, cellDrape, uvOf } from './kit.js';

const GALV = '#a9aeb2', PLINTH = '#b7b4ac';

export function buildYard({ B, S, g, yF, r }) {
  const { det, pave, fence, sign } = B;
  const gl = (X, Z) => { const [x, z] = toWorld(X, Z); return g(x, z) - yF; };
  const solids = [];
  const col = (Xc, Zc, hX, hZ, y0, y1) => { const [cx, cz] = toWorld(Xc, Zc); S.obox(cx, cz, hX, hZ, FR.ang, yF + y0, yF + y1, 'wall', 0); solids.push([Xc, Zc]); };

  // ---- paving (world metres), 3 cm over the ground surface g (heightAt + 0.18). The partner's flat ring is drawn at heightAt + 0.12, under the
  // ground mesh (heightAt + 0.15) everywhere, so only its low light wall shows: over this slab as over bare ground
  const W = (X, Z) => toWorld(X, Z), lay = (D, x0, z0, x1, z1, lift) => cellDrape(D, g, W, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], lift, 2);
  pave.setColor('#d3d1cb');
  lay(pave, -0.6, -1, LOT.x1 - 0.05, LOT.z1 - 0.1, 0.03);          // the car park
  lay(pave, -0.6, -D1, 0, -1, 0.03); lay(pave, L, -D2, LOT.x1 - 0.05, -1, 0.03); // the passages along the north and south walls
  // lawn: the strip behind the street fence, the strip along the north fence, the back
  const dg = new MB(); // draped lawn pieces are built in world metres, so away from the local frame's transform
  const grass = (x0, z0, x1, z1, base) => {
    for (let X = x0; X < x1 - 1e-6; X += 2) for (let Z = z0; Z < z1 - 1e-6; Z += 2) {
      const v = 0.9 + r() * 0.2; dg.setColor([base[0] * v, base[1] * v, base[2] * v]);
      cellDrape(dg, g, W, [[X, Z], [Math.min(X + 2, x1), Z], [Math.min(X + 2, x1), Math.min(Z + 2, z1)], [X, Math.min(Z + 2, z1)]], 0.02, 4);
    }
  };
  const G0 = [0.1, 0.19, 0.05]; // linear sRGB of a mid green
  grass(-1.5, LOT.z1 - 1.15, GATE_X - 0.1, LOT.z1 - 0.15, G0);
  grass(-1.5, -D1, -0.62, LOT.z1 - 1.15, G0);
  grass(-0.6, LOT.z0 + 0.1, LOT.x1 - 0.1, -D1 - 0.02, [0.08, 0.15, 0.04]);

  // ---- fences: wire panels on posts (2.5 m), a concrete plinth under the street one and the south one
  const post = (X, Z, h, rad = 0.03) => { const y = gl(X, Z); det.setColor(GALV); det.tube([X, y - 0.15, Z], [X, y + h, Z], rad, 5); };
  // a panel from (xa, za) to (xb, zb) standing on `yb` over the ground, `h` tall; tile = 'wire' | 'green'
  const panel = (xa, za, xb, zb, yb, h, tile, n) => {
    const ya = gl(xa, za) + yb, yz = gl(xb, zb) + yb, [u0, v0, u1, v1] = FENCE_UV[tile];
    quad(fence, [xa, ya, za], [xb, yz, zb], [xb, yz + h, zb], [xa, ya + h, za], n, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
  };
  const run = (X0, Z0, X1, Z1, o) => { // a straight fence: posts every ~2.5 m, panels between
    const len = Math.hypot(X1 - X0, Z1 - Z0), n = Math.max(1, Math.round(len / 2.5)), ux = (X1 - X0) / len, uz = (Z1 - Z0) / len, nrm = [-uz, 0, ux];
    for (let i = 0; i < n; i++) {
      const a = [X0 + (X1 - X0) * i / n, Z0 + (Z1 - Z0) * i / n], b = [X0 + (X1 - X0) * (i + 1) / n, Z0 + (Z1 - Z0) * (i + 1) / n];
      panel(a[0], a[1], b[0], b[1], o.y0, o.h, o.tile, nrm);
      post(a[0], a[1], o.y0 + o.h + 0.05);
    }
    post(X1, Z1, o.y0 + o.h + 0.05 + (o.endH ?? 0));
    if (o.plinth) { det.setColor(PLINTH); const y = gl((X0 + X1) / 2, (Z0 + Z1) / 2); det.box(Math.min(X0, X1) - 0.09, y - 0.25, Math.min(Z0, Z1) - 0.09, Math.max(X0, X1) + 0.09, y + o.plinth, Math.max(Z0, Z1) + 0.09, 63); }
  };
  const zS = LOT.z1 - 0.05; // the street fence's line
  run(-1.6, zS, GATE_X, zS, { tile: 'wire', y0: 0.4, h: 1.5, plinth: 0.4, endH: 0.3 });        // the lot's street fence (ends in the number-plate post)
  run(-13.2, zS, -1.6, zS, { tile: 'wire', y0: 0.4, h: 1.5, plinth: 0.4 });                    // the neighbour's, running on
  run(-1.6, LOT.z0, -1.6, LOT.z1, { tile: 'green', y0: 0.15, h: 1.7 });                       // north boundary, green screening
  run(LOT.x1, LOT.z0, LOT.x1, LOT.z1, { tile: 'green', y0: 0.4, h: 1.65, plinth: 0.4 });      // south boundary on its low concrete wall
  run(-1.6, LOT.z0, LOT.x1, LOT.z0, { tile: 'green', y0: 0.15, h: 1.7 });                      // east boundary (a guess)
  col((-1.6 + GATE_X) / 2, zS, (GATE_X + 1.6) / 2, 0.12, -0.4, 1.9);
  col(-7.4, zS, 5.8, 0.12, -0.4, 1.9);
  col(-1.6, (LOT.z0 + LOT.z1) / 2, 0.1, (LOT.z1 - LOT.z0) / 2, -0.4, 1.85);
  col(LOT.x1, (LOT.z0 + LOT.z1) / 2, 0.14, (LOT.z1 - LOT.z0) / 2, -0.4, 2.05);
  col((-1.6 + LOT.x1) / 2, LOT.z0, (LOT.x1 + 1.6) / 2, 0.1, -0.4, 1.85);

  // the number plate «40» on the end post, facing the street
  { const y = gl(GATE_X, zS) + 1.55; sign.setColor('#ffffff');
    quad(sign, [GATE_X - 0.14, y, zS + 0.045], [GATE_X + 0.14, y, zS + 0.045], [GATE_X + 0.14, y + 0.35, zS + 0.045], [GATE_X - 0.14, y + 0.35, zS + 0.045], [0, 0, 1], uvOf(SIGN.plate)); }

  // ---- the neighbour's cypress hedge along the north boundary: dark, ragged, 3.4–4.6 m
  const greens = ['#2d5a35', '#33653b', '#27502f', '#3a6b3d', '#2f5e38'];
  for (let Z = LOT.z0 - 1.5; Z < LOT.z1 + 0.5; Z += 2.1) {
    const h = 3.4 + r() * 1.2, y = gl(-2.75, Z);
    for (let k = 0; k < 2; k++) {
      det.setColor(greens[(r() * greens.length) | 0]);
      det.ellipsoid([-2.75 + (r() - 0.5) * 0.5, y + h * (0.5 + 0.18 * k), Z + (r() - 0.5) * 0.8], [0.95 + r() * 0.25, h * (0.5 - 0.1 * k), 1.35 + r() * 0.3], 7, 4);
    }
  }
  col(-2.75, (LOT.z0 + LOT.z1) / 2, 0.95, (LOT.z1 - LOT.z0) / 2 + 1.0, -0.4, 3.8);

  // ---- the pavement at the entrance: two grey electricity cabinets, the yellow waste bin
  const zc = LOT.z1 + 0.9;
  det.setColor('#b9bcbf'); det.box(20.35, gl(20.7, zc) - 0.05, zc - 0.2, 21.0, gl(20.7, zc) + 1.6, zc + 0.2, 63); det.box(21.05, gl(21.4, zc) - 0.05, zc - 0.2, 21.7, gl(21.4, zc) + 1.6, zc + 0.2, 63);
  det.setColor('#8d9195'); det.box(20.35, gl(20.7, zc) + 1.6, zc - 0.22, 21.7, gl(20.7, zc) + 1.66, zc + 0.22, 63);
  col(21.03, zc, 0.7, 0.22, -0.2, 1.65);
  { const x0 = 22.1, x1 = 23.2, z0 = zc - 0.4, z1 = zc + 0.45, y = gl(22.6, zc); det.setColor('#e5b61a'); det.box(x0, y + 0.1, z0, x1, y + 1.12, z1, 63); det.setColor('#2c2e31'); det.box(x0 - 0.02, y + 1.12, z0 - 0.02, x1 + 0.02, y + 1.2, z1 + 0.02, 63);
    det.setColor('#222'); for (const [a, b] of [[x0 + 0.1, z0 + 0.08], [x1 - 0.1, z0 + 0.08], [x0 + 0.1, z1 - 0.08], [x1 - 0.1, z1 - 0.08]]) det.ellipsoid([a, y + 0.08, b], [0.07, 0.07, 0.07], 5, 3);
    col((x0 + x1) / 2, (z0 + z1) / 2, 0.55, 0.43, -0.2, 1.2); }

  // ---- a young tree with two stakes, in the grass behind the street fence
  { const X = 1.2, Z = zS - 0.75, y = gl(X, Z);
    det.setColor('#5b4a3a'); det.tube([X, y, Z], [X, y + 2.1, Z], 0.025, 5);
    det.setColor('#8a6a3c'); det.tube([X - 0.35, y, Z], [X - 0.35, y + 1.7, Z], 0.02, 4); det.tube([X + 0.35, y, Z], [X + 0.35, y + 1.7, Z], 0.02, 4); det.tube([X - 0.35, y + 1.6, Z], [X + 0.35, y + 1.6, Z], 0.015, 4);
    for (const [dx, dy, dz, c] of [[0, 2.35, 0, '#8ea23f'], [0.28, 2.05, 0.1, '#6f9238'], [-0.26, 2.15, -0.12, '#a8a63c'], [0.05, 2.65, -0.05, '#b98a35']]) { det.setColor(c); det.ellipsoid([X + dx, y + dy, Z + dz], [0.32, 0.26, 0.3], 6, 4); }
    col(X, Z, 0.2, 0.2, -0.2, 2.2); }

  // ---- parked cars: nose-in along the front's north part, a row against the south fence; the ring (X 10, Z 3.2, radius 4.5) stays free
  const parked = [], car = (X, Z, fx, fz) => { const [x, z] = toWorld(X, Z); parked.push([x, z, Math.atan2(-fz, fx)]); };
  const fwd = [FR.uz, -FR.ux]; // toward the building (minus the street normal, in the map frame)
  for (const X of [1.5, 3.95]) car(X, 2.8, fwd[0], fwd[1]);
  for (const Z of [4.4, 7.0, 9.6]) car(19.0, Z, FR.ux, FR.uz);

  det.merge(dg);
  const clear = (x, z) => { const dx = x - FR.O[0], dz = z - FR.O[1], X = dx * FR.ux + dz * FR.uz, Z = -dx * FR.uz + dz * FR.ux; return X > -4.4 && X < LOT.x1 + 2 && Z > LOT.z0 - 1.5 && Z < LOT.z1 + 2; };
  return { solids, parked, clear, stats: { cars: parked.length, fenceColliders: solids.length } };
}
