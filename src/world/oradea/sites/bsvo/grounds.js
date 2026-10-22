// OWNER: oradea. The grounds of the BSVO site (../bsvo.js), in the church's frame (./kit.js; u east along the north front, v south, y absolute):
// the cracked concrete yard of the old trading hall between the lane and the church's front, entered by a two-leaf steel-and-mesh gate
// between the cream shop and the neighbour's fence (here swung open: the real leaves stand shut, and the ring needs a way in), the
// diagonal mesh fence down to the church's north-east corner, the white precast concrete wall along the west side with its vines, the
// mesh fence and gravel bed with yellow globe shrubs along the south wall, the lawn behind the shop, a parking plate on the gate post.
//   GATE { u0, u1, v }   the opening between the hinge posts (local);  EAST   the diagonal fence's end points (local)
//   buildGrounds({ B, S, g, r }) -> { clear(x, z), stats }   B needs det, board, ground (ground is built in map coordinates)
// Guesses (no photograph shows them): the fence's exact line in front of the yard's south-east, the white wall's north end and what
// closes the yard on the west, the lawn's outline (from the aerial), and the gravel bed's width.
import { inPoly } from '../../../cherkasy/geo.js';
import { ANG, toMap, toLoc, sq, drape, blob, MESH, PSIGN } from './kit.js';
import { M4 } from '../../../../kit/mesh.js';

const LAND = 0.15;
export const GATE = { u0: 24.45, u1: 30.8, v: -31.5 };
export const EAST = [[30.8, -31.5], [43.15, -0.35]];
export const SOUTH_V = 12.0;
const COL = { slab: '#9f9d96', apron: '#aeaca5', lawn: '#6f9446', weed: '#7f8c52', gravel: '#c4bfaa', steel: '#a2a8ac', wall: '#dedcd5', cap: '#c8c6bf', shrubY: '#c9b53a', shrubG: '#5d8a3c', vine: '#4f7a37' };

export function buildGrounds({ B, S, g, r }) {
  const D = B.det, G = B.ground, stats = { panels: 0, posts: 0, shrubs: 0 };
  const gl = (u, v) => g(...toMap(u, v)) + LAND;
  const map = (pts) => pts.map(([u, v]) => toMap(u, v));

  // ---- a box along a local segment (rails, wall sections): a box in the segment's own axes
  const along = (a, b, y0, y1, w, col) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), phi = Math.atan2(b[1] - a[1], b[0] - a[0]);
    D.setColor(col);
    D.with(M4((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2, -phi), (d) => d.box(-L / 2, y0, -w / 2, L / 2, y1, w / 2, 63));
  };
  const solid = (a, b, y0, y1, w, kind) => { // collision box along the same segment
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), phi = Math.atan2(b[1] - a[1], b[0] - a[0]), [mx, mz] = toMap((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    S.obox(mx, mz, L / 2, w / 2, ANG + phi, y0, y1, kind);
  };
  const post = (u, v, h, col = COL.steel, w = 0.08) => { const y = gl(u, v); D.setColor(col); D.box(u - w, y - 0.15, v - w, u + w, y + h, v + w, 63 & ~8); stats.posts++; };

  // ---- the concrete yard and the apron before the gate, the lawn behind the shop, the weeds before the lettering, the gravel along the south wall
  G.setColor(COL.slab);
  drape(G, g, map([[10.2, 0.2], [42.5, 0.2], [42.2, -0.6], [30.4, -31.4], [24.1, -31.4], [24.1, -29.2], [10.2, -29.2]]), 0.168, 8, 4);
  G.setColor(COL.apron); drape(G, g, map([[24.3, -38.2], [31.6, -38.2], [30.9, -31.4], [24.3, -31.4]]), 0.168, 8, 4);
  const lawn = [[-2825.5, -981.5], [-2815.5, -981.2], [-2815.2, -972], [-2825.3, -972.3]].map(([x, z]) => toLoc(x, z));
  G.setColor(COL.lawn); drape(G, g, map(lawn), 0.172, 8, 4);
  G.setColor(COL.weed); drape(G, g, map([[10.6, -1.6], [19.0, -1.8], [19.2, -6.2], [10.8, -6.8]]), 0.171, 8, 3);
  G.setColor(COL.gravel); drape(G, g, map([[-1.2, 10.15], [44.6, 10.15], [44.6, SOUTH_V - 0.2], [-1.2, SOUTH_V - 0.2]]), 0.172, 8, 3);

  // ---- mesh fence: panels of about 2.5 m between square posts, a rail top and bottom, the wire in the board atlas
  const meshQ = (a, b, y0, y1) => {
    const [u0, v0, u1, v1] = MESH, L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, n = [-(b[1] - a[1]) / L, 0, (b[0] - a[0]) / L];
    sq(B.board, [[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]], n, [[u0, 1 - v1], [u1, 1 - v1], [u1, 1 - v0], [u0, 1 - v0]]);
    stats.panels++;
  };
  const fence = (a, b, { h = 2.0, solidOn = true } = {}) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 2.5)), dir = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    for (let i = 0; i < n; i++) {
      const p = [a[0] + dir[0] * L * i / n, a[1] + dir[1] * L * i / n], q = [a[0] + dir[0] * L * (i + 1) / n, a[1] + dir[1] * L * (i + 1) / n];
      const y = Math.max(gl(...p), gl(...q), gl((p[0] + q[0]) / 2, (p[1] + q[1]) / 2)) - 0.06;
      meshQ(p, q, y + 0.08, y + h - 0.08);
      along(p, q, y + h - 0.08, y + h, 0.05, COL.steel); along(p, q, y, y + 0.08, 0.05, COL.steel);
      post(p[0], p[1], h, COL.steel, 0.035);
      if (solidOn) solid(p, q, y - 0.3, y + h, 0.12, 'fence');
    }
    post(b[0], b[1], h, COL.steel, 0.035);
  };

  // the east diagonal, from the gate's east post to the church's north-east corner
  fence(EAST[0], EAST[1]);
  // the gate, both leaves swung open inward against the shop's east wall and against the fence; heavy hinge posts
  {
    const hinge = (u, v) => { post(u, v, 2.3, '#6e757b', 0.13); const [x, z] = toMap(u, v); S.cyl(x, z, gl(u, v) - 0.4, gl(u, v) + 2.3, 0.14, 0.14, 'pole'); };
    hinge(GATE.u0, GATE.v); hinge(GATE.u1, GATE.v);
    const leaf = (p, q) => { // a frame with its mesh, standing on its own bottom rail
      const y = gl(...p) - 0.06, h = 1.95;
      meshQ(p, q, y + 0.1, y + h - 0.08); along(p, q, y + h - 0.08, y + h, 0.05, COL.steel); along(p, q, y + 0.02, y + 0.1, 0.05, COL.steel);
      post(q[0], q[1], h, COL.steel, 0.05);
    };
    leaf([GATE.u0 + 0.25, GATE.v + 0.15], [GATE.u0 + 0.35, GATE.v + 3.2]);
    leaf([GATE.u1 - 0.55, GATE.v + 0.2], [GATE.u1 + 0.45, GATE.v + 3.2]);
  }
  // the parking plate on a pole beside the gate's west post, facing the lane
  {
    const u = GATE.u0 + 0.6, v = GATE.v - 0.9, y = gl(u, v), [pu0, pv0, pu1, pv1] = PSIGN;
    D.setColor('#6e757b'); D.box(u - 0.04, y - 0.1, v - 0.04, u + 0.04, y + 2.45, v + 0.04, 63);
    sq(B.board, [[u - 0.3, y + 1.9, v - 0.06], [u + 0.3, y + 1.9, v - 0.06], [u + 0.3, y + 2.5, v - 0.06], [u - 0.3, y + 2.5, v - 0.06]], [0, 0, -1], [[pu1, 1 - pv1], [pu0, 1 - pv1], [pu0, 1 - pv0], [pu1, 1 - pv0]]);
    const [x, z] = toMap(u, v); S.cyl(x, z, y - 0.2, y + 2.4, 0.06, 0.06, 'pole');
  }

  // ---- the south fence and its gravel bed with yellow globe shrubs between wall and wire
  fence([-1.2, SOUTH_V], [44.6, SOUTH_V], { h: 1.9 });
  for (let i = 0; i < 22; i++) { const u = 1 + i * 2.05 + (r() - 0.5) * 1.4, v = 11.1 + r() * 0.8; blob(D, u, gl(u, v) - 0.04, v, 0.12 + r() * 0.14, r() < 0.5 ? COL.vine : COL.weed, 0.75); } // weed tufts along the fence foot
  for (let i = 0; i < 7; i++) { const u = 3 + i * 6.4 + (r() - 0.5) * 1.2, v = 11.0; blob(D, u, gl(u, v) - 0.02, v, 0.38 + r() * 0.1, i % 3 === 1 ? COL.shrubG : COL.shrubY, 0.85); stats.shrubs++; }

  // ---- the white precast wall along the west side, 2.6 m, posts every 2.5 m, vines over its top
  {
    const a = toLoc(-2838.8, -984.5), b = toLoc(-2838.9, -942.4), L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 2.5);
    for (let i = 0; i < n; i++) {
      const p = [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n], q = [a[0] + (b[0] - a[0]) * (i + 1) / n, a[1] + (b[1] - a[1]) * (i + 1) / n];
      const y = Math.max(gl(...p), gl(...q)) - 0.2;
      along(p, q, y, y + 2.6, 0.16, COL.wall); along(p, q, y + 2.6, y + 2.68, 0.22, COL.cap); post(q[0], q[1], 2.7, COL.wall, 0.15);
      solid(p, q, y - 0.3, y + 2.7, 0.2, 'wall');
      if (r() < 0.7) { const m = [(p[0] + q[0]) / 2 + (r() - 0.5), (p[1] + q[1]) / 2]; D.setColor(COL.vine); D.ellipsoid([m[0], y + 2.62, m[1]], [0.9 + r() * 0.6, 0.38 + r() * 0.2, 0.55], 6, 4); }
    }
  }

  // ---- what generated trees keep off: the church and its south strip, the yard (inside the fence) and the shop
  const polys = [
    [[-3.5, -1.2], [45.5, -1.2], [45.5, 13.2], [-3.5, 13.2]],
    [[9.0, -1.2], [41.6, -1.2], [29.2, -33.2], [23.2, -33.2], [23.2, -29.0], [9.0, -29.0]],
    [[10.0, -39.5], [26.0, -39.5], [26.0, -28.0], [10.0, -28.0]],
  ];
  const clear = (x, z) => { const [u, v] = toLoc(x, z); return polys.some((P) => inPoly(P, u, v)); };
  return { clear, stats };
}
