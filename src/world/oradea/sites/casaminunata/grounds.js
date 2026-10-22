// OWNER: oradea. The grounds of Casa Minunată, in the building's frame (see ./kit.js): the courtyard south of the sports hall, the
// paths (the diagonal from the reception porch, the Y to Strada Traian Lalescu, the footway east to the church lot), the lawns, the
// playground (a wooden tower with a slide, a plastic playhouse in a yellow picket fence, a sandpit), a bed of tulips in front of the
// reception, benches, the shrubs, and the teal slatted fence on a low concrete plinth along the street and the church side, with the
// street gate (open) and the footway gate. The garden's trees go to the tree generator as `spots`.
//   buildGrounds({ B, S, g, r }) -> { spots, clear(x, z), stats }   B needs det, ground (the ground one is built in map coordinates)
import { PARK_GREENS, PARK_PINE } from '../../../trees.js';
import { ANG, toMap, toLoc, sq, drape, strip, blob, inLot } from './kit.js';

const LAND = 0.15;
export const GATES = { street: [45.0, 48.6], east: [20.4, 23.0] };
const FENCE = { x1: 53, vs: 47.4, vn: 17.5, hall: 50.35 };
const COL = {
  lawn: '#5f8c3e', lawnB: '#6d9847', earth: '#9a8460', plaza: '#bdbab2', path: '#a8a59d', walk: '#b3b0a8', bed: '#4a3a2b', sand: '#d9c58b',
  teal: '#6bb5a1', plinth: '#b9b6ad', post: '#59666a', wood: '#8a6a45', woodD: '#5d4a38', lime: '#b8d238', green: '#7ec24a', red: '#d6342c', yellow: '#f2d230', bench: '#8b5a33',
};
const GREENS = ['#5b8a3a', '#4d7a35', '#78a04a', '#6a9440'], TULIPS = ['#d6342c', '#f2c230', '#e987a8', '#7b4aa8', '#f4f0e6', '#e8742c'];

export function buildGrounds({ B, S, g, r }) {
  const D = B.det, G = B.ground, stats = { slats: 0, posts: 0, blobs: 0 };
  const gl = (u, v) => g(...toMap(u, v)) + LAND; // where things stand: the land surface sits 0.15 m over the height field (ground.js GY)
  const map = (pts) => pts.map(([u, v]) => toMap(u, v));
  const solid = (u0, u1, v0, v1, y0, y1, kind = 'wall') => { const [mx, mz] = toMap((u0 + u1) / 2, (v0 + v1) / 2); S.obox(mx, mz, (u1 - u0) / 2, (v1 - v0) / 2, ANG, y0, y1, kind); };

  // ---------------------------------------------------------------------------------------------------- the ground: lawns, earth, paving
  G.setColor(COL.lawn);
  drape(G, g, map([[13.85, 26.5], [53, 26.5], [53, 47.4], [22.4, 47.4], [22.4, 36.05], [13.85, 36.05]]), 0.168, 8, 4);
  G.setColor(COL.lawnB); drape(G, g, map([[26, 38], [34, 36.5], [41, 40], [38, 46], [28, 46]]), 0.17, 8, 4);
  G.setColor(COL.earth);
  for (const [u, v, rx, rz] of [[29.5, 33.5, 3.6, 2.6], [35.6, 34.4, 2.0, 1.6], [44, 38, 1.4, 2.2]]) drape(G, g, map(Array.from({ length: 14 }, (_, i) => [u + Math.cos(i / 14 * Math.PI * 2) * rx, v + Math.sin(i / 14 * Math.PI * 2) * rz])), 0.173, 8, 3);
  G.setColor(COL.sand); drape(G, g, map([[26.2, 29], [28.4, 29], [28.4, 31], [26.2, 31]]), 0.176, 8, 3);
  G.setColor(COL.plaza); drape(G, g, map([[13.85, 17.5], [53, 17.5], [53, 26.5], [14.4, 26.5]]), 0.2, 8, 4);
  G.setColor(COL.path); strip(G, g, map([[16.4, 31.2], [28, 26.4], [39, 22]]), 2.4, 0.2, 3); strip(G, g, map([[39, 22], [45.6, 44], [48.6, 53.6]]), 2.6, 0.2, 3);
  strip(G, g, map([[39, 22], [53, 21.7]]), 2.2, 0.2, 3);
  G.setColor(COL.walk); drape(G, g, map([[-6, 46.1], [54, 46.1], [54, 49.3], [-6, 49.3]]), 0.2, 8, 4);
  G.setColor(COL.bed); drape(G, g, map(Array.from({ length: 16 }, (_, i) => [21.5 + Math.cos(i / 16 * Math.PI * 2) * 3.0, 31.6 + Math.sin(i / 16 * Math.PI * 2) * 1.5])), 0.205, 8, 3);

  // ---------------------------------------------------------------------------------------------------- the tulip bed and the shrubs
  for (let i = 0; i < 18; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()), u = 21.5 + Math.cos(a) * 2.7 * d, v = 31.6 + Math.sin(a) * 1.3 * d;
    blob(D, u, gl(u, v) + 0.03, v, 0.22 + r() * 0.12, TULIPS[i % TULIPS.length], 0.7); stats.blobs++;
  }
  for (const [u, v, rr] of [[15.4, 35.2, 0.7], [17.2, 35.4, 0.85], [19.2, 35.3, 0.7], [20.9, 35.3, 0.6], [24.4, 36.8, 0.8], [24.0, 34.2, 0.55], [15.0, 26.9, 0.6], [17.8, 36.5, 0.5]]) {
    blob(D, u, gl(u, v) - 0.05, v, rr, GREENS[stats.blobs++ % GREENS.length], 0.85);
  }

  // ---------------------------------------------------------------------------------------------------- the playground
  const wood = (u0, u1, v0, v1, y0, y1, col = COL.wood, mask = 63) => { D.setColor(col); D.box(u0, y0, v0, u1, y1, v1, mask); };
  { // the tower: four posts, a deck, guard boards, a pitched roof, a lime-green slide down the east side, a ladder on the west
    const cu = 29.5, cv = 33.5, y0 = gl(cu, cv), hp = 1.25;
    for (const [du, dv] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) wood(cu + du - 0.06, cu + du + 0.06, cv + dv - 0.06, cv + dv + 0.06, y0 - 0.1, y0 + 2.7, COL.wood, 63 & ~8);
    wood(cu - 0.85, cu + 0.85, cv - 0.85, cv + 0.85, y0 + hp - 0.06, y0 + hp + 0.03);
    wood(cu - 0.82, cu + 0.82, cv - 0.84, cv - 0.78, y0 + hp, y0 + hp + 0.7, COL.woodD, 63 & ~8); wood(cu - 0.82, cu + 0.82, cv + 0.78, cv + 0.84, y0 + hp, y0 + hp + 0.7, COL.woodD, 63 & ~8);
    wood(cu - 0.84, cu - 0.78, cv - 0.8, cv + 0.8, y0 + hp, y0 + hp + 0.7, COL.woodD, 63 & ~8);
    D.setColor('#5f4e3f');
    sq(D, [[cu - 1.0, y0 + 2.35, cv - 1.0], [cu + 1.0, y0 + 2.35, cv - 1.0], [cu + 1.0, y0 + 3.0, cv], [cu - 1.0, y0 + 3.0, cv]], [0, 0.85, -0.52]);
    sq(D, [[cu - 1.0, y0 + 2.35, cv + 1.0], [cu + 1.0, y0 + 2.35, cv + 1.0], [cu + 1.0, y0 + 3.0, cv], [cu - 1.0, y0 + 3.0, cv]], [0, 0.85, 0.52]);
    sq(D, [[cu - 0.9, y0 + 2.4, cv - 0.9], [cu - 0.9, y0 + 2.4, cv + 0.9], [cu - 0.9, y0 + 2.9, cv], [cu - 0.9, y0 + 2.9, cv]], [-1, 0, 0]);
    sq(D, [[cu + 0.9, y0 + 2.4, cv - 0.9], [cu + 0.9, y0 + 2.4, cv + 0.9], [cu + 0.9, y0 + 2.9, cv], [cu + 0.9, y0 + 2.9, cv]], [1, 0, 0]);
    // the slide: a bed 0.5 m wide from the deck to the ground, with low sides
    const a = [cu + 0.85, y0 + hp - 0.02], b = [cu + 3.4, y0 + 0.12], len = Math.hypot(b[0] - a[0], b[1] - a[1]), nu = (b[1] - a[1]) / len, nyy = (b[0] - a[0]) / len;
    D.setColor(COL.lime);
    sq(D, [[a[0], a[1], cv - 0.25], [b[0], b[1], cv - 0.25], [b[0], b[1], cv + 0.25], [a[0], a[1], cv + 0.25]], [-nu, nyy, 0]);
    for (const s of [-0.25, 0.25]) sq(D, [[a[0], a[1], cv + s], [b[0], b[1], cv + s], [b[0], b[1] + 0.12, cv + s], [a[0], a[1] + 0.12, cv + s]], [0, 0, s < 0 ? -1 : 1]);
    wood(cu - 1.0, cu - 0.94, cv - 0.3, cv + 0.3, y0, y0 + hp, COL.woodD, 63 & ~8); // the ladder: a board with rungs
    for (let y = 0.25; y < hp; y += 0.3) wood(cu - 1.08, cu - 0.92, cv - 0.3, cv + 0.3, y0 + y, y0 + y + 0.04, COL.wood, 63 & ~8);
    solid(cu - 1.1, cu + 1.0, cv - 1.0, cv + 1.0, y0 - 0.5, y0 + 2.9, 'wall');
  }
  { // the plastic playhouse: green walls, a red roof, a yellow picket fence round its front
    const cu = 35.6, cv = 34.4, y0 = gl(cu, cv);
    wood(cu - 0.6, cu + 0.6, cv - 0.48, cv + 0.48, y0, y0 + 1.0, COL.green);
    D.setColor(COL.red);
    sq(D, [[cu - 0.72, y0 + 0.98, cv - 0.6], [cu + 0.72, y0 + 0.98, cv - 0.6], [cu + 0.72, y0 + 1.45, cv], [cu - 0.72, y0 + 1.45, cv]], [0, 0.75, -0.66]);
    sq(D, [[cu - 0.72, y0 + 0.98, cv + 0.6], [cu + 0.72, y0 + 0.98, cv + 0.6], [cu + 0.72, y0 + 1.45, cv], [cu - 0.72, y0 + 1.45, cv]], [0, 0.75, 0.66]);
    sq(D, [[cu - 0.6, y0 + 1.0, cv - 0.48], [cu - 0.6, y0 + 1.0, cv + 0.48], [cu - 0.6, y0 + 1.42, cv], [cu - 0.6, y0 + 1.42, cv]], [-1, 0, 0], null);
    sq(D, [[cu + 0.6, y0 + 1.0, cv - 0.48], [cu + 0.6, y0 + 1.0, cv + 0.48], [cu + 0.6, y0 + 1.42, cv], [cu + 0.6, y0 + 1.42, cv]], [1, 0, 0], null);
    for (const [a0, a1, b0, b1] of [[cu - 0.9, cu + 0.9, cv + 0.62, cv + 0.67], [cu - 0.9, cu - 0.85, cv - 0.5, cv + 0.67], [cu + 0.85, cu + 0.9, cv - 0.5, cv + 0.67]]) wood(a0, a1, b0, b1, y0, y0 + 0.5, COL.yellow, 63 & ~8);
    solid(cu - 0.95, cu + 0.95, cv - 0.7, cv + 0.7, y0 - 0.3, y0 + 1.45, 'wall');
  }
  for (const [u, v] of [[27.4, 25.1], [42.0, 25.1]]) { // two benches on the courtyard's edge, facing the hall
    const y0 = gl(u, v);
    wood(u - 0.85, u + 0.85, v - 0.2, v + 0.2, y0 + 0.42, y0 + 0.48, COL.bench, 63 & ~8);
    wood(u - 0.85, u + 0.85, v - 0.22, v - 0.17, y0 + 0.48, y0 + 0.85, COL.bench, 63 & ~8);
    for (const s of [-0.7, 0.7]) wood(u + s - 0.04, u + s + 0.04, v - 0.2, v + 0.2, y0, y0 + 0.42, COL.post, 63 & ~8);
    solid(u - 0.9, u + 0.9, v - 0.25, v + 0.25, y0 - 0.2, y0 + 0.9, 'wall');
  }

  // ---------------------------------------------------------------------------------------------------- the fence: teal slats on a plinth
  const run = (a, b, gap = null) => { // a -> b along u or v in modules of about 3 m; a gap [t0, t1] (coordinates along the run) stays open
    const along = a[1] === b[1], c = along ? a[1] : a[0], t0 = Math.min(a[along ? 0 : 1], b[along ? 0 : 1]), t1 = Math.max(a[along ? 0 : 1], b[along ? 0 : 1]);
    const spans = gap ? [[t0, gap[0]], [gap[1], t1]] : [[t0, t1]];
    for (const [s0, s1] of spans) {
      if (s1 - s0 < 0.3) continue;
      const n = Math.max(1, Math.round((s1 - s0) / 3));
      for (let i = 0; i < n; i++) {
        const x0 = s0 + (s1 - s0) * i / n, x1 = s0 + (s1 - s0) * (i + 1) / n, pt = (t) => (along ? [t, c] : [c, t]), [mu, mv] = pt((x0 + x1) / 2), yb = gl(mu, mv);
        const box = (ta, tb, ca, cb, ya, yc, col, mask = 63 & ~8) => { D.setColor(col); const [p, q] = along ? [[ta, ca], [tb, cb]] : [[ca, ta], [cb, tb]]; D.box(p[0], ya, p[1], q[0], yc, q[1], mask); };
        box(x0, x1, c - 0.11, c + 0.11, yb - 0.3, yb + 0.45, COL.plinth);
        box(x0, x1, c - 0.03, c + 0.03, yb + 1.55, yb + 1.62, COL.post, 63);
        box(x0 - 0.06, x0 + 0.06, c - 0.06, c + 0.06, yb + 0.45, yb + 1.75, COL.post); stats.posts++;
        D.setColor(COL.teal);
        const k = Math.round((x1 - x0) / 0.18), w = 0.07;
        for (let j = 0; j < k; j++) {
          const t = x0 + 0.1 + (x1 - x0 - 0.2) * (j + 0.5) / k, ya = yb + 0.45, yc = yb + 1.55, nrm = along ? [0, 0, 1] : [1, 0, 0];
          const P = along ? [[t - w, ya, c], [t + w, ya, c], [t + w, yc, c], [t - w, yc, c]] : [[c, ya, t - w], [c, ya, t + w], [c, yc, t + w], [c, yc, t - w]];
          sq(D, P, nrm); stats.slats++;
        }
      }
      const e = (t) => (along ? [t, c] : [c, t]);
      { const [pu, pv] = e(s1), yb = gl(pu, pv); D.setColor(COL.post); D.box(pu - 0.09, yb + 0.45, pv - 0.09, pu + 0.09, yb + 1.85, pv + 0.09, 63 & ~8); stats.posts++; }
      const [mu, mv] = e((s0 + s1) / 2), yb = gl(mu, mv);
      if (along) solid(s0, s1, c - 0.12, c + 0.12, yb - 0.5, yb + 1.7, 'fence'); else solid(c - 0.12, c + 0.12, s0, s1, yb - 0.5, yb + 1.7, 'fence');
    }
  };
  run([22.4, FENCE.vs], [FENCE.x1, FENCE.vs], GATES.street);
  run([FENCE.x1, FENCE.vs], [FENCE.x1, FENCE.vn], GATES.east);
  run([FENCE.hall, FENCE.vn], [FENCE.x1, FENCE.vn]);
  // the street gate, both leaves swung open against the fence's inner side
  for (const u of GATES.street) {
    const yb = gl(u, FENCE.vs), dir = u < 47 ? 1 : -1;
    D.setColor(COL.plinth); D.box(u - 0.17, yb - 0.3, FENCE.vs - 0.17, u + 0.17, yb + 2.0, FENCE.vs + 0.17, 63 & ~8); D.box(u - 0.22, yb + 2.0, FENCE.vs - 0.22, u + 0.22, yb + 2.1, FENCE.vs + 0.22, 63 & ~8);
    solid(u - 0.2, u + 0.2, FENCE.vs - 0.2, FENCE.vs + 0.2, yb - 0.5, yb + 2.1, 'wall');
    D.setColor(COL.teal);
    for (let j = 0; j < 8; j++) { const v = FENCE.vs - 0.25 - j * 0.2, uu = u + dir * 0.3; sq(D, [[uu, yb + 0.1, v - 0.07], [uu, yb + 0.1, v + 0.07], [uu, yb + 1.5, v + 0.07], [uu, yb + 1.5, v - 0.07]], [1, 0, 0]); stats.slats++; }
    D.setColor(COL.post); D.box(u + dir * 0.28 - 0.03, yb + 0.1, FENCE.vs - 1.8, u + dir * 0.32 + 0.03, yb + 1.55, FENCE.vs - 0.2, 63 & ~8);
  }

  // ---------------------------------------------------------------------------------------------------- the trees: a blue spruce by the reception, broadleaves along the fence
  const blue = [PARK_PINE[0].map(([a, b, c]) => [a * 0.8, b * 0.95, c * 1.25])];
  const spots = [];
  const add = (u, v, o) => { const [x, z] = toMap(u, v); spots.push({ x, z, y: g(x, z) + LAND, ...o }); };
  add(25.4, 41.2, { kind: 'conifer', variant: 'spruce', sc: 0.95, pal: blue });
  for (const [u, v, sc] of [[37.5, 44.6, 0.62], [51.0, 31.5, 0.7], [51.0, 43.8, 0.72]]) add(u, v, { kind: 'park', sc, pal: PARK_GREENS });
  const clear = (x, z) => inLot(...toLoc(x, z));
  return { spots, clear, stats };
}
