// OWNER: oradea. The main campus of the Universitatea din Oradea (not a site module).
//   buildCampus(ctx, kit) -> { res, clear(x, z) }    draws every campus building of data.js CAMPUS into ctx: the kit blocks, and on top
//     of them the hand-built dressing of the heroes – Corpul A (the rectorate: round stair tower with its slit windows and shallow
//     conical cap, the stone porch with the lettering «UNIVERSITATEA DIN ORADEA», the iron fence, the clipped-hedge parterre, thujas,
//     urns and lamps) and the others as they are added.
import { CAMPUS, IDS } from './data.js';
import { STYLE, LAYER } from '../../../facade.js';
import { DP } from '../../../materials.js';
import { ringOf, positive } from './geom.js';
import { roofRect, cone } from './roofs.js';
import { text } from './letters.js';
import { tint, shade, ironFence, hedge, thuja, urn, lamp, drape } from './util.js';

const SPEC = (id) => CAMPUS.find((s) => s.id === id);
const STONE = '#b9b2a2', TILE = '#b5482c', TILE2 = '#a63f26';

// ------------------------------------------------------------------------------------------------ Corpul A, the rectorate
function heroA(ctx, kit) {
  const { D, F, g } = ctx, spec = SPEC(IDS.A), got = ctx.bld(IDS.A);
  if (!got) return null;
  const C = [73.0, 1340.05], R = 4.35;
  // the OSM ring has the tower as a boxy bump: replace it by the half circle
  const ring = [];
  let done = false;
  for (const p of got.ring) {
    const inBump = p[0] > 72 && p[0] < 79 && p[1] > 1335.5 && p[1] < 1344.5;
    if (!inBump) { ring.push(p); continue; }
    if (done) continue;
    done = true;
    for (let k = 0; k <= 10; k++) { const a = (-90 + 18 * k) * Math.PI / 180; ring.push([C[0] + R * Math.cos(a), C[1] + R * Math.sin(a)]); }
  }
  const onArc = (e) => Math.abs(Math.hypot(e.A[0] - C[0], e.A[1] - C[1]) - R) < 0.25 && Math.abs(Math.hypot(e.B[0] - C[0], e.B[1] - C[1]) - R) < 0.25 && e.A[0] > C[0] - 0.5;
  const res = kit.block({ ...spec, ring, door: null, blank: onArc, stone: null, baseLayer: LAYER.GRANITE, plinth: 0.9, rects: [
      { rect: { cx: 65.15, cz: 1328.3, ux: 1, uz: 0, hl: 7.75, hw: 7.3 }, roof: { maxRise: 4.0, pitch: 0.6 } },
      { rect: { cx: 65.15, cz: 1342.9, ux: 0, uz: 1, hl: 8.6, hw: 7.75 }, roof: { maxRise: 5.4, pitch: 0.75 } },
      { rect: { cx: 65.15, cz: 1356.3, ux: 1, uz: 0, hl: 7.75, hw: 7.1 }, roof: { maxRise: 4.0, pitch: 0.6 } }], chimneys: 2, bay: 2.0, winW: 0.62, winH: 0.56, gwinW: 0.55, gain: 1.22 });
  const { fl, He } = res, wall = spec.wall;

  // ---- the tower above the eave: walls, slit windows, collar, shallow cone
  const HeT = He + 3.0;
  for (const e of res.E) if (onArc(e)) F.wall(e.A[0], e.A[1], e.B[0], e.B[1], He, HeT, { floorH: 6, bayW: 3, layer: LAYER.STUCCO, base: LAYER.STUCCO, tint: tint(wall, 0, 1.14), plinth: 0, baseY: He, topY: HeT }, STYLE.BLANK, -6);
  const slit = (a, y0, y1) => {
    const r = R + 0.035, cx = C[0] + r * Math.cos(a), cz = C[1] + r * Math.sin(a), nx = Math.cos(a), nz = Math.sin(a), tx = -nz, tz = nx, w = 0.3;
    D.setPart(DP.GLASS).setColor('#222a2e');
    D.face([[cx - tx * w, y0, cz - tz * w], [cx + tx * w, y0, cz + tz * w], [cx + tx * w, y1, cz + tz * w], [cx - tx * w, y1, cz - tz * w]], [nx, 0, nz]);
    D.setPart(DP.PAINT).setColor('#e8e3d6');
    for (const s of [-1, 1]) D.face([[cx + s * tx * (w + 0.1), y0, cz + s * tz * (w + 0.1)], [cx + s * tx * w, y0, cz + s * tz * w], [cx + s * tx * w, y1, cz + s * tz * w], [cx + s * tx * (w + 0.1), y1, cz + s * tz * (w + 0.1)]], [nx, 0, nz]);
  };
  for (const deg of [-54, -18, 18, 54]) { const a = deg * Math.PI / 180; slit(a, He - 0.9, He + 2.9); slit(a, He - 4.7, He - 1.6); }
  D.setPart(DP.PAINT).setColor('#4a3f38').cyl(C[0], HeT - 0.22, C[1], R + 0.38, R + 0.38, 0.22, 18, true);
  {
    const rr = R + 0.38, prof = [[rr, 0], [rr - 0.25, 0.45], [rr - 1.1, 1.0], [rr - 2.4, 1.65], [rr - 3.4, 2.1], [0.25, 2.5]];
    D.setPart(DP.PAINT);
    for (let k = 0; k < prof.length - 1; k++) { D.setColor(k % 2 ? TILE2 : TILE); D.lathe([prof[k], prof[k + 1]], 20, C[0], C[1], 1, 1); }
    void cone;
  }

  // ---- the stone porch in front of the tower
  const cz = C[1], x0 = 76.9, x1 = 81.3, hwP = 3.7, Hp = fl + 4.5;
  D.setPart(DP.CONC).setColor(STONE);
  for (const s of [-1, 1]) {
    const za = cz + s * 2.4, zb = cz + s * 3.5;
    D.box(x0, fl - 0.1, Math.min(za, zb), x1, Hp - 0.5, Math.max(za, zb), 1 | 4 | 16 | 32 | 2);
    D.setColor(shade(STONE, 1.08)).box(x1 - 0.1, fl - 0.1, Math.min(za, zb) - 0.0, x1 + 0.12, Hp - 0.5, Math.max(za, zb), 1 | 4);
    D.setColor(STONE);
  }
  D.setColor(shade(STONE, 1.05)).box(x1 - 1.0, Hp - 0.9, cz - hwP, x1 + 0.12, Hp, cz + hwP, 63 & ~2);
  D.setColor(shade(STONE, 0.85)).box(x0, Hp - 0.5, cz - 2.4, x1 - 1.0, Hp - 0.38, cz + 2.4, 4 | 8);
  const yR = roofRect(D, { cx: (x0 + x1) / 2, cz, ux: 1, uz: 0, hl: (x1 - x0) / 2, hw: hwP }, Hp, { gable: true, pitch: 0.7, ov: 0.3, col: TILE, col2: TILE2, wallCol: STONE, course: 0.9, gOv: 0 });
  D.setPart(DP.WOOD).setColor('#5a4129');
  D.face([[77.5, fl, cz - 1.25], [77.5, fl, cz + 1.25], [77.5, fl + 2.7, cz + 1.25], [77.5, fl + 2.7, cz - 1.25]], [1, 0, 0]);
  D.setPart(DP.CONC).setColor('#b3ada0').box(x1 - 0.4, fl - 0.1, cz - 3.0, x1 + 1.3, fl + 0.16, cz + 3.0, 63 & ~8);
  D.box(x1 + 1.3, fl - 0.1, cz - 2.6, x1 + 2.2, fl + 0.08, cz + 2.6, 63 & ~8);
  const gx = x1 + 0.12 + 0.03;
  const lt = { dir: [0, -1], n: [1, 0], col: '#26231f', align: 'c', lift: 0.03 };
  text(D, 'UNIVERSITATEA', { ...lt, at: [gx, Hp + 1.55, cz], h: 0.34, t: 0.15 });
  text(D, 'DIN ORADEA', { ...lt, at: [gx, Hp + 1.05, cz], h: 0.34, t: 0.15 });
  D.setPart(DP.PAINT).setColor('#f2eee3').face([[gx, Hp + 0.15, cz - 0.55], [gx, Hp + 0.15, cz + 0.55], [gx, Hp + 0.85, cz + 0.55], [gx, Hp + 0.85, cz - 0.55]], [1, 0, 0]);
  D.setColor('#d6ad34').face([[gx + 0.01, Hp + 0.28, cz - 0.3], [gx + 0.01, Hp + 0.28, cz + 0.3], [gx + 0.01, Hp + 0.72, cz + 0.3], [gx + 0.01, Hp + 0.72, cz - 0.3]], [1, 0, 0]);
  void yR;

  // ---- the forecourt: the iron fence along the gatehouses with the two drive gates open, the clipped-hedge parterre, thujas, urns, lamps
  const fx = 88.4;
  for (const [za, zb] of [[1316.6, 1319.2], [1325.6, 1352.8], [1359.4, 1369.2]]) ironFence(D, ctx.S, g, [[fx, za], [fx, zb]], { pier: 8.2, h: 2.0, stone: '#c4beb0' });
  const HG = '#2f4a2c';
  hedge(D, g, [[85.6, 1326.4], [86.8, 1326.4], [86.8, 1353.6], [85.6, 1353.6]], 0.7, 0.55, HG, false);
  for (const s of [-1, 1]) hedge(D, g, [[82.4, cz + s * 1.6], [85.0, cz + s * 1.6], [85.0, cz + s * 5.4], [82.4, cz + s * 5.4]], 0.55, 0.5, HG, true);
  hedge(D, g, [[83.4, 1329], [83.4, 1332.6]], 0.55, 0.5, HG);
  hedge(D, g, [[83.4, 1347.6], [83.4, 1351.2]], 0.55, 0.5, HG);
  for (let z = 1327.4; z <= 1352.8; z += 2.3) if (Math.abs(z - cz) > 0.9 || true) thuja(D, 87.5, g(87.5, z), z, 3.1 + (Math.round(z * 3) % 3) * 0.12, 0.5);
  for (let z = 1327; z <= 1353.2; z += 3.7) urn(D, 89.9, g(89.9, z) + 0.45, z);
  for (const z of [cz - 7.2, cz + 7.2]) { lamp(D, 83.8, g(83.8, z), z, { h: 3.9 }); }
  // paved apron before the porch
  drape(ctx.G, g, [[x1 + 0.2, cz - 3.3], [x1 + 3.3, cz - 3.3], [x1 + 3.3, cz + 3.3], [x1 + 0.2, cz + 3.3]], '#bdb5a4', 0.09, 4);

  return { res, clear: (x, z) => x > 78 && x < 90.5 && z > 1316 && z < 1370 };
}

// a square turret rising out of a roof: walls from y0 to y1 (blank render, slit windows on each face), a pyramid roof
function turret(ctx, c, side, ang, y0, y1, wallHex, o = {}) {
  const { F, D } = ctx, a = (ang * Math.PI) / 180, ux = Math.cos(a), uz = Math.sin(a), h = side / 2;
  const P = (s, t) => [c[0] + ux * s - uz * t, c[1] + uz * s + ux * t];
  const corners = [P(-h, -h), P(h, -h), P(h, h), P(-h, h)];
  const wt = tint(wallHex, 0, 1.15);
  for (let i = 0; i < 4; i++) {
    const A = corners[i], B = corners[(i + 1) % 4];
    F.wall(A[0], A[1], B[0], B[1], y0, y1, { floorH: 12, bayW: 3, layer: LAYER.STUCCO, base: LAYER.STUCCO, tint: wt, plinth: 0, baseY: y0, topY: y1, seed: 9 }, STYLE.BLANK, -12);
    // slits on the face: nx, nz outward
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]), dx = (B[0] - A[0]) / L, dz = (B[1] - A[1]) / L, nx = dz, nz = -dx;
    D.setPart(DP.GLASS).setColor('#222a2e');
    for (let k = 0; k < (o.slits ?? 3); k++) {
      const s = L * (0.5 + (k - ((o.slits ?? 3) - 1) / 2) * 0.24), w = 0.22, x = A[0] + dx * s + nx * 0.03, z = A[1] + dz * s + nz * 0.03;
      D.face([[x - dx * w, y1 - 3.2, z - dz * w], [x + dx * w, y1 - 3.2, z + dz * w], [x + dx * w, y1 - 0.7, z + dz * w], [x - dx * w, y1 - 0.7, z - dz * w]], [nx, 0, nz]);
    }
  }
  const col = o.col ?? TILE, col2 = o.col2 ?? TILE2;
  roofRect(D, { cx: c[0], cz: c[1], ux, uz, hl: h, hw: h }, y1, { pitch: o.pitch ?? 1.5, maxRise: o.rise ?? 4.4, ov: o.ov ?? 0.5, col, col2, course: 0.9, fascia: false });
}

function heroB(ctx, kit) {
  const spec = SPEC(IDS.B), res = kit.block(spec);
  if (!res) return null;
  const { He } = res;
  // the stair turret at the entrance bay on the south side, its small pyramid roof taller than the eaves
  turret(ctx, [-13.8, 1421.4], 6.2, 18, He - 1.0, He + 3.8, spec.wall, { col: '#8c3f31', col2: '#7e382c', rise: 4.8 });
  return { res };
}

export function buildCampus(ctx, kit) {
  const res = {}, clears = [];
  const heroes = { [IDS.A]: heroA, [IDS.B]: heroB };
  for (const spec of CAMPUS) {
    const h = heroes[spec.id];
    if (h) { const o = h(ctx, kit); if (o) { res[spec.id] = o.res; if (o.clear) clears.push(o.clear); } continue; }
    const r = kit.block(spec);
    if (r) res[spec.id] = r;
  }
  return { res, clear: (x, z) => clears.some((c) => c(x, z)) };
}

export { ringOf, positive };
