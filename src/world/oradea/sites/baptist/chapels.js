// OWNER: oradea. Six smaller Baptist churches of Oradea, built from their OSM outlines and the Esri aerial only (no street photos
// were found for any of them, so the walls, windows and doors are the usual ones for the type, not copies):
//   providenta  Biserica Providența (way 421285030): a D-shaped drum under a shallow dark dome, with the low annex wrapped round its east;
//   rogeriusz   Biserica Baptistă Rogériusz (way 436834235): a 27.6 x 21.8 m hall under a low blue-grey gable roof, porch on the tram-line side;
//   conventia   the Hungarian Baptist convention's chapel (way 544503067): a low 17.6 x 7 m gabled hall among the trees;
//   rogerius    Biserica Baptistă on the Rogerius side (way 883258099): a flat-roofed central hall in a brown tiled skirt, stepped gable fronts;
//   nord        Biserica Baptistă in the north (node 2000492192, building 3000010737): a ten-sided hall under a red tiled pyramid roof with a lantern;
//   betlehem    Betlehem Hungarian Baptist church (node 13476045110, house 422590402): a small gabled house church.
//   buildChapel(def, { g, S }) -> { B: { wall, roof, det }, res: { footprints, clear(x, z), stats } }; CHAPELS lists the defs, CHAPEL_SKIP their ids
// Each church is its own three meshes (wall plaster, roof tile, details), so a far church is frustum-culled alone.
import { MB, M4 } from '../../../../kit/mesh.js';
import { inPoly, area2, hull } from '../../../cherkasy/geo.js';
import { PI, sq } from './kit.js';

const PROV = [[2629.2, 1772.9], [2621.2, 1773.3], [2617.1, 1771.2], [2613.6, 1767.2], [2611.5, 1762.1], [2611.1, 1759], [2611.9, 1755.6], [2614.8, 1751.6], [2618.7, 1748.8], [2623.1, 1747], [2630.4, 1745.5], [2634.5, 1746.3], [2638, 1747.7], [2641.1, 1750.4], [2647, 1746.9], [2648.7, 1749.4], [2663.2, 1748.8], [2659.7, 1770.3], [2636.1, 1780]];
const B883 = [[-1761.2, -1335.6], [-1761.3, -1367.5], [-1742.8, -1368.2], [-1734.3, -1366], [-1733.3, -1334.7], [-1740.5, -1329], [-1757, -1328.5], [-1757, -1334.1], [-1759.3, -1334.5]];
const N200 = [[-1782.9, -2826.3], [-1782, -2827.2], [-1791.6, -2822.8], [-1799.3, -2831.3], [-1805.1, -2844], [-1804, -2844.5], [-1793.4, -2854.2], [-1781.7, -2859.5], [-1772.4, -2849.3], [-1767.6, -2838.7], [-1779.6, -2827.8]];

export const CHAPELS = [
  { slug: 'providenta', id: 421285030, name: 'Biserica Providența', kind: 'drum', ring: PROV },
  { slug: 'rogeriusz', id: 436834235, name: 'Biserica Baptistă Rogériusz', kind: 'hall', ring: [[-2536.2, -1550.2], [-2508.7, -1550.1], [-2508.8, -1528.4], [-2536.3, -1528.5]], eave: 7.4, ridge: 9.8, wall: '#e3dccd', roof: '#6f7e8a', bays: 6, win: [1.6, 5.4, 1.5], porch: { side: 'W', w: 6, d: 3.2 }, cross: true },
  { slug: 'conventia', id: 544503067, name: 'Convenția Bisericilor Creștine Baptiste Maghiare', kind: 'hall', ring: [[788.9, -565.6], [790.8, -558.9], [773.9, -554], [772, -560.8]], eave: 3.3, ridge: 5.9, wall: '#d9cdb5', roof: '#7c4a3a', bays: 4, win: [1.0, 2.7, 1.1], porch: { side: 'S', w: 3.2, d: 1.8 }, cross: true },
  { slug: 'rogerius', id: 883258099, name: 'Biserica Baptistă', kind: 'tiered', ring: B883 },
  { slug: 'nord', id: 3000010737, name: 'Biserica Baptistă', kind: 'pyramid', ring: N200 },
  { slug: 'betlehem', id: 422590402, name: 'Biserica Baptistă Betlehem', kind: 'hall', ring: [[1217.9, 494.3], [1228.7, 486.7], [1233.1, 493], [1222.3, 500.6]], eave: 3.5, ridge: 6.3, wall: '#eae1cc', roof: '#a54c36', bays: 3, win: [1.0, 2.7, 1.1], porch: { side: 'E', w: 3, d: 1.6 }, cross: true },
];
export const CHAPEL_SKIP = CHAPELS.map((c) => c.id);

const COL = { frame: '#ece8dd', glass: '#2a343d', door: '#4a3426', plinth: '#8d8f90', trim: '#f1eee6', metal: '#5a5d62', lantern: '#3a3d42', step: '#b9b6ae' };
const cen = (R) => [R.reduce((s, p) => s + p[0], 0) / R.length, R.reduce((s, p) => s + p[1], 0) / R.length];
const norm3 = (v) => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

// walls along every edge of a ring, from a per-vertex bottom to a flat top; outward normals; skips edges [from, to) when `only` is given
function ringWalls(D, ring, yb, yt, col, { closed = true, uvK = 3 } = {}) {
  D.setColor(col);
  const out = area2(ring) > 0 ? 1 : -1, n = ring.length, m = closed ? n : n - 1;
  let s = 0;
  for (let i = 0; i < m; i++) {
    const a = ring[i], b = ring[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1e-9, nx = out * dz / L, nz = -out * dx / L;
    const ya = yb(a[0], a[1]), yb2 = yb(b[0], b[1]);
    sq(D, [[a[0], ya, a[1]], [b[0], yb2, b[1]], [b[0], yt, b[1]], [a[0], yt, a[1]]], [nx, 0, nz], [[s / uvK, ya / uvK], [(s + L) / uvK, yb2 / uvK], [(s + L) / uvK, yt / uvK], [s / uvK, yt / uvK]]);
    s += L;
  }
}
// windows (a dark pane in a pale frame) along an edge a -> b, `bays` of them at `pitch`, y0 .. y1 above the floor
function edgeWindows(D, a, b, out, y0, y1, w, pitch, { frame = COL.frame, glass = COL.glass, arch = false } = {}) {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, nx = out * uz, nz = -out * ux;
  const n = Math.floor((L - 1.6) / pitch);
  for (let k = 0; k < n; k++) {
    const t = L / 2 + (k - (n - 1) / 2) * pitch;
    for (const [hw, h0, h1, off, col] of [[w / 2 + 0.12, y0 - 0.1, y1 + 0.14, 0.02, frame], [w / 2, y0, y1, 0.045, glass]]) {
      const p = (u, y, o) => [a[0] + ux * (t + u) + nx * o, y, a[1] + uz * (t + u) + nz * o];
      D.setColor(col);
      sq(D, [p(-hw, h0, off), p(hw, h0, off), p(hw, h1, off), p(-hw, h1, off)], [nx, 0, nz]);
      if (arch && col === glass) { D.setColor(col); const ym = y1 + w * 0.3; sq(D, [p(-hw, y1, off), p(hw, y1, off), p(0.05, ym, off), p(-0.05, ym, off)], [nx, 0, nz]); }
    }
  }
}

// a flat roof polygon at y; uv in metres
function flatRoof(R, ring, y, col) {
  R.setColor(col);
  const first = R.v; R.fill(ring, [], y, true);
  const a = R.buf.a; for (let v = first; v < R.v; v++) { const o = v * 11; a[o + 6] = a[o] / 2; a[o + 7] = a[o + 2] / 2; }
}
// a shallow dome over a polygon: scaled copies of the ring, smooth normals
function domeRoof(R, ring, y0, rise, steps, col) {
  R.setColor(col);
  const [cx, cz] = cen(ring), at = (s, k) => {
    const p = ring[k % ring.length], dx = p[0] - cx, dz = p[1] - cz, rho = Math.hypot(dx, dz) || 1, t = 2 * rise * s / rho;
    return { P: [cx + dx * s, y0 + rise * (1 - s * s), cz + dz * s], N: norm3([dx / rho * t, 1, dz / rho * t]), uv: [(cx + dx * s) / 2, (cz + dz * s) / 2] };
  };
  for (let j = 0; j < steps; j++) {
    const s0 = 1 - j / steps, s1 = 1 - (j + 1) / steps;
    for (let k = 0; k < ring.length; k++) {
      const a = at(s0, k), b = at(s0, k + 1), c = at(s1, k + 1), d = at(s1, k);
      sq(R, [a.P, b.P, c.P, d.P], [a.N, b.N, c.N, d.N], [a.uv, b.uv, c.uv, d.uv]);
    }
  }
}
// a pyramid roof over a polygon with its apex over the centroid
function pyramidRoof(R, ring, y0, apexY, col, over = 0.5) {
  R.setColor(col);
  const [cx, cz] = cen(ring), n = ring.length;
  for (let k = 0; k < n; k++) {
    const grow = (p) => { const dx = p[0] - cx, dz = p[1] - cz, l = Math.hypot(dx, dz) || 1; return [p[0] + dx / l * over, p[1] + dz / l * over]; };
    const a = grow(ring[k]), b = grow(ring[(k + 1) % n]), ya = y0 - 0.25;
    const e = [b[0] - a[0], 0, b[1] - a[1]], up = [cx - a[0], apexY - ya, cz - a[1]];
    const nn = norm3([e[1] * up[2] - e[2] * up[1], e[2] * up[0] - e[0] * up[2], e[0] * up[1] - e[1] * up[0]]);
    const N = nn[1] < 0 ? nn.map((v) => -v) : nn, L = Math.hypot(e[0], e[2]);
    sq(R, [[a[0], ya, a[1]], [b[0], ya, b[1]], [cx, apexY, cz], [cx, apexY, cz]], N, [[0, 0], [L / 2, 0], [L / 4, 4], [L / 4, 4]]);
  }
}
const crossAt = (D, x, y, z, h = 1.7) => {
  D.setColor(COL.trim); D.box(x - 0.06, y, z - 0.06, x + 0.06, y + h, z + 0.06, 63 & ~8); D.box(x - 0.4, y + h * 0.64, z - 0.05, x + 0.4, y + h * 0.64 + 0.12, z + 0.05, 63 & ~8);
};

// a gabled box in its own frame: front +z, door in the front wall; walls W, roof R, details D, all in the caller's transform
function porch(W, R, D, { w, d, h, ridge, wall, roof }) {
  const hw = w / 2;
  W.setColor(wall);
  W.face([[-hw, -1, d], [hw, -1, d], [hw, h, d], [0, ridge, d], [-hw, h, d]], [0, 0, 1]);
  for (const s of [-1, 1]) sq(W, [[s * hw, -1, 0], [s * hw, -1, d], [s * hw, h, d], [s * hw, h, 0]], [s, 0, 0], [[0, -1], [d, -1], [d, h], [0, h]]);
  const oh = 0.35, run = hw + oh, rise = ridge - (h - (ridge - h) * oh / hw), ye = h - (ridge - h) * oh / hw;
  R.setColor(roof);
  for (const s of [-1, 1]) sq(R, [[s * run, ye, -0.1], [s * run, ye, d + oh], [0, ridge, d + oh], [0, ridge, -0.1]], norm3([s * rise, run, 0]), [[0, 0], [d / 2, 0], [d / 2, 2], [0, 2]]);
  D.setColor(COL.frame); sq(D, [[-0.95, 0, d + 0.02], [0.95, 0, d + 0.02], [0.95, 2.75, d + 0.02], [-0.95, 2.75, d + 0.02]], [0, 0, 1]);
  D.setColor(COL.door); sq(D, [[-0.8, 0, d + 0.045], [0.8, 0, d + 0.045], [0.8, 2.55, d + 0.045], [-0.8, 2.55, d + 0.045]], [0, 0, 1]);
  D.setColor(COL.step); D.box(-1.2, -0.3, d, 1.2, 0.18, d + 0.9, 63 & ~8);
}

export function buildChapel(def, { g, S }) {
  const W = new MB(), R = new MB(), D = new MB(), ring = def.ring, [cx, cz] = cen(ring);
  const gs = [...ring, [cx, cz]].map(([x, z]) => g(x, z)), gMax = Math.max(...gs), gMin = Math.min(...gs);
  const stats = { windows: 0 };
  let top = 0, yF;
  if (def.kind === 'hall') {
    yF = gMax + 0.12;
    // the frame: u along the longest edge
    let bi = 0, bl = 0; ring.forEach((p, i) => { const q = ring[(i + 1) % ring.length], l = Math.hypot(q[0] - p[0], q[1] - p[1]); if (l > bl) { bl = l; bi = i; } });
    const p0 = ring[bi], p1 = ring[(bi + 1) % ring.length], ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    const L = bl, Wd = Math.hypot(ring[(bi + 2) % ring.length][0] - p1[0], ring[(bi + 2) % ring.length][1] - p1[1]);
    const xf = M4(cx, yF, cz, -ang);
    for (const b of [W, R, D]) b.setXf(xf);
    const { eave, ridge } = def, hl = L / 2, hd = Wd / 2, oh = 0.45, ye = eave - (ridge - eave) * oh / hd;
    // walls: the long ones and the gable ends (pentagons)
    W.setColor(def.wall);
    for (const s of [-1, 1]) sq(W, [[-hl, -1.2, s * hd], [hl, -1.2, s * hd], [hl, eave, s * hd], [-hl, eave, s * hd]], [0, 0, s], [[0, -0.4], [L / 3, -0.4], [L / 3, eave / 3], [0, eave / 3]]);
    for (const s of [-1, 1]) W.face([[s * hl, -1.2, -hd], [s * hl, -1.2, hd], [s * hl, eave, hd], [s * hl, ridge, 0], [s * hl, eave, -hd]], [s, 0, 0]);
    // the roof, with an eave overhang and a gable overhang
    R.setColor(def.roof);
    const rise = ridge - ye, run = hd + oh;
    for (const s of [-1, 1]) sq(R, [[-hl - 0.3, ye, s * run], [hl + 0.3, ye, s * run], [hl + 0.3, ridge, 0], [-hl - 0.3, ridge, 0]], norm3([0, run, -s * rise]), [[0, 0], [L / 2, 0], [L / 2, run / 1.5], [0, run / 1.5]]);
    // plinth, eave band, windows and doors
    D.setColor(COL.plinth); D.box(-hl - 0.06, -1.2, -hd - 0.06, hl + 0.06, 0.45, hd + 0.06, 63 & ~8);
    D.setColor(COL.trim); D.box(-hl - 0.08, eave - 0.22, -hd - 0.08, hl + 0.08, eave, hd + 0.08, 63 & ~8);
    const [wy0, wy1, ww] = def.win, pitch = (L - 3) / def.bays;
    for (const s of [-1, 1]) {
      // windows are quads on the long walls in the local frame
      for (let k = 0; k < def.bays; k++) {
        const u = -hl + 1.5 + pitch * (k + 0.5);
        if (def.porch && ((def.porch.side === 'S' && s > 0) || (def.porch.side === 'N' && s < 0)) && Math.abs(u) < def.porch.w / 2 + 1) continue;
        for (const [hw, y0, y1, off, col] of [[ww / 2 + 0.12, wy0 - 0.1, wy1 + 0.14, 0.02, COL.frame], [ww / 2, wy0, wy1, 0.045, COL.glass]]) {
          D.setColor(col); sq(D, [[u - hw, y0, s * (hd + off)], [u + hw, y0, s * (hd + off)], [u + hw, y1, s * (hd + off)], [u - hw, y1, s * (hd + off)]], [0, 0, s]);
        }
        stats.windows++;
      }
    }
    // two tall windows flank the porch on its end wall
    if (def.porch && (def.porch.side === 'E' || def.porch.side === 'W')) {
      const s = def.porch.side === 'E' ? 1 : -1;
      for (const v of [-hd * 0.58, hd * 0.58]) for (const [hw, y0, y1, off, col] of [[ww / 2 + 0.12, wy0 - 0.1, wy1 + 0.14, 0.02, COL.frame], [ww / 2, wy0, wy1, 0.045, COL.glass]]) {
        D.setColor(col); sq(D, [[s * (hl + off), y0, v - hw], [s * (hl + off), y0, v + hw], [s * (hl + off), y1, v + hw], [s * (hl + off), y1, v - hw]], [s, 0, 0]);
      }
      stats.windows += 2;
    }
    // a round window in each gable end
    for (const s of [-1, 1]) {
      const ring8 = (rr, y, col, off) => { D.setColor(col); for (let k = 0; k < 10; k++) { const a0 = k / 10 * 2 * PI, a1 = (k + 1) / 10 * 2 * PI; sq(D, [[s * (hl + off), y, 0], [s * (hl + off), y + Math.sin(a0) * rr, Math.cos(a0) * rr], [s * (hl + off), y + Math.sin(a1) * rr, Math.cos(a1) * rr], [s * (hl + off), y, 0]], [s, 0, 0]); } };
      ring8(0.62, ridge - 1.9, COL.frame, 0.02); ring8(0.46, ridge - 1.9, COL.glass, 0.045);
    }
    if (def.porch) {
      const { side, w, d } = def.porch, yaw = { S: 0, N: PI, E: PI / 2, W: -PI / 2 }[side], off = { S: hd, N: hd, E: hl, W: hl }[side];
      for (const b of [W, R, D]) b.setXf(xf.clone().multiply(M4(0, 0, 0, yaw)).multiply(M4(0, 0, off, 0)));
      porch(W, R, D, { w, d, h: Math.min(eave - 0.4, 3.6), ridge: Math.min(eave + 0.9, 5.3), wall: def.wall, roof: def.roof });
      for (const b of [W, R, D]) b.setXf(xf);
    }
    if (def.cross) crossAt(D, -hl + 0.7, ridge - 0.3, 0, 1.8);
    top = ridge + 1.5;
    for (const b of [W, R, D]) b.setXf(null);
  } else if (def.kind === 'drum') {
    yF = gMax + 0.12;
    const xf = M4(0, yF, 0);
    for (const b of [W, R, D]) b.setXf(xf);
    const yb = (x, z) => Math.min(g(x, z) - yF, 0) - 0.5, arcN = 14, drum = ring.slice(0, arcN), HD = 9.4, HA = 5.8;
    // the drum: walls on the arc, a cornice, slit windows, the dome
    ringWalls(W, drum, yb, HD, '#d8d4cb');
    D.setColor(COL.trim); { const o = area2(drum) > 0 ? 1 : -1; for (let i = 0; i < drum.length; i++) { const a = drum[i], b = drum[(i + 1) % drum.length]; if (i === drum.length - 1) break; const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), nx = o * dz / L * 0.14, nz = -o * dx / L * 0.14; sq(D, [[a[0] + nx, HD - 0.3, a[1] + nz], [b[0] + nx, HD - 0.3, b[1] + nz], [b[0] + nx, HD + 0.05, b[1] + nz], [a[0] + nx, HD + 0.05, a[1] + nz]], [nx, 0, nz]); } }
    for (let i = 0; i < drum.length - 1; i++) { edgeWindows(D, drum[i], drum[i + 1], area2(drum) > 0 ? 1 : -1, 2.0, 6.6, 0.9, 2.4); stats.windows++; }
    domeRoof(R, drum, HD, 3.0, 4, '#575a5f');
    { const [dx0, dz0] = cen(drum); D.setColor(COL.lantern); D.cyl(dx0, HD + 2.9, dz0, 0.9, 0.7, 0.9, 10, true); }
    crossAt(D, cen(drum)[0], HD + 3.7, cen(drum)[1], 1.9);
    // the annex round the east: the OSM tail of the ring, one low storey with a ribbon of windows, flat roof
    const tail = ring.slice(arcN - 1).concat([ring[0]]);
    ringWalls(W, tail, yb, HA, '#cfcac0', { closed: false });
    for (let i = 0; i < tail.length - 1; i++) { edgeWindows(D, tail[i], tail[i + 1], area2(ring) > 0 ? 1 : -1, 1.4, 3.4, 1.4, 3.0); stats.windows++; }
    D.setColor(COL.trim); { const o = area2(ring) > 0 ? 1 : -1; for (let i = 0; i < tail.length - 1; i++) { const a = tail[i], b = tail[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), nx = o * dz / L * 0.12, nz = -o * dx / L * 0.12; sq(D, [[a[0] + nx, HA - 0.25, a[1] + nz], [b[0] + nx, HA - 0.25, b[1] + nz], [b[0] + nx, HA + 0.1, b[1] + nz], [a[0] + nx, HA + 0.1, a[1] + nz]], [nx, 0, nz]); } }
    flatRoof(R, ring, HA, '#6d7075');
    top = HD + 3;
    for (const b of [W, R, D]) b.setXf(null);
  } else if (def.kind === 'tiered') {
    yF = gMax + 0.12;
    const xf = M4(0, yF, 0);
    for (const b of [W, R, D]) b.setXf(xf);
    const yb = (x, z) => Math.min(g(x, z) - yF, 0) - 0.5, HS = 4.4, HC = 11.8;
    ringWalls(W, ring, yb, HS, '#b79d82');
    for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 5) { edgeWindows(D, a, b, area2(ring) > 0 ? 1 : -1, 1.2, 3.1, 1.2, 3.2); stats.windows++; } }
    // the tiled skirt: a low pitched surround running up to the central hall (a squeezed copy of the outline)
    const [x0, z0] = cen(ring), inner = ring.map(([x, z]) => [x0 + (x - x0) * 0.56, z0 + (z - z0) * 0.7]);
    const rx = [Math.min(...inner.map((p) => p[0])), Math.max(...inner.map((p) => p[0]))], rz = [Math.min(...inner.map((p) => p[1])), Math.max(...inner.map((p) => p[1]))];
    R.setColor('#8a5640');
    for (let i = 0; i < ring.length; i++) {
      const j = (i + 1) % ring.length, oa = ring[i], ob = ring[j], ia = inner[i], ib = inner[j], ya = HS + 0.35, yi = HS + 3.3;
      const e = [ob[0] - oa[0], 0, ob[1] - oa[1]], up = [ia[0] - oa[0], yi - ya, ia[1] - oa[1]];
      let nn = norm3([e[1] * up[2] - e[2] * up[1], e[2] * up[0] - e[0] * up[2], e[0] * up[1] - e[1] * up[0]]); if (nn[1] < 0) nn = nn.map((v) => -v);
      sq(R, [[oa[0], ya, oa[1]], [ob[0], ya, ob[1]], [ib[0], yi, ib[1]], [ia[0], yi, ia[1]]], nn, [[0, 0], [6, 0], [6, 2], [0, 2]]);
    }
    // the central hall: plastered walls, a flat grey roof, tall windows, a parapet, a cross
    ringWalls(W, inner, () => HS + 2.9, HC, '#d4cdbf');
    for (let i = 0; i < inner.length; i++) { const a = inner[i], b = inner[(i + 1) % inner.length]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 4) { edgeWindows(D, a, b, area2(inner) > 0 ? 1 : -1, HS + 3.7, HC - 1.0, 1.0, 3.4); stats.windows++; } }
    flatRoof(R, inner, HC, '#6d7075');
    D.setColor(COL.trim);
    for (let i = 0; i < inner.length; i++) { const a = inner[i], b = inner[(i + 1) % inner.length], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, o = area2(inner) > 0 ? 1 : -1, nx = o * dz / L * 0.12, nz = -o * dx / L * 0.12; sq(D, [[a[0] + nx, HC - 0.1, a[1] + nz], [b[0] + nx, HC - 0.1, b[1] + nz], [b[0] + nx, HC + 0.45, b[1] + nz], [a[0] + nx, HC + 0.45, a[1] + nz]], [nx, 0, nz]); }
    crossAt(D, (rx[0] + rx[1]) / 2, HC, rz[0] + 2.0, 2.2);
    top = HC + 2;
    for (const b of [W, R, D]) b.setXf(null);
  } else { // pyramid
    yF = (gMax + gMin) / 2 + 0.1;
    const xf = M4(0, yF, 0);
    for (const b of [W, R, D]) b.setXf(xf);
    const yb = (x, z) => Math.min(g(x, z) - yF, 0) - 0.5, HW = 7.2, [x0, z0] = cen(ring), APEX = HW + 6.8;
    ringWalls(W, ring, yb, HW, '#dcd3bf');
    for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 4) { edgeWindows(D, a, b, area2(ring) > 0 ? 1 : -1, 1.5, 5.2, 1.3, 3.6, { arch: true }); stats.windows++; } }
    pyramidRoof(R, ring, HW, APEX, '#9a3f2d', 0.55);
    // the lantern on the apex
    D.setColor(COL.lantern); D.cyl(x0, APEX - 0.2, z0, 1.5, 1.2, 2.6, 8, true);
    D.setColor('#c9c2b0'); D.cyl(x0, APEX + 2.4, z0, 1.4, 0.0, 1.6, 8, true);
    crossAt(D, x0, APEX + 3.9, z0, 2.0);
    top = APEX + 6;
    for (const b of [W, R, D]) b.setXf(null);
  }
  const poly = ring.map((p) => [p[0], p[1]]), hl = hull(poly);
  S.prism(poly.flat(), yF - 1, yF + (def.kind === 'hall' ? def.eave : def.kind === 'drum' ? 9.4 : def.kind === 'tiered' ? 11.8 : 7.2), 0, 0, 'wall', 0);
  return {
    B: { wall: W, roof: R, det: D },
    res: {
      footprints: [{ poly, h: top, kind: 'church', name: def.name, id: def.id }],
      clear: (x, z) => inPoly(hl, x, z),
      stats: { ...stats, yF: +yF.toFixed(2) },
    },
  };
}

