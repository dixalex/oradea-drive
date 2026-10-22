// OWNER: oradea. Small helpers of the university site (not a site module): colours, draped ground patches, fences, planting.
//   tint(hex, base?) -> [r, g, b]   the facade shader's wall tint (a multiplier of the layer's albedo, 0..2) that turns a layer into hex
//   shade(hex, k) -> hex            darker / lighter
//   clipRect(poly, x0, x1, z0, z1)  Sutherland-Hodgman clip of a polygon to a rectangle
//   drape(G, gy, poly, col, lift?, cell?, holes?)   a polygon laid on the ground (cut into cells, vertex colour col; uv in metres / rep)
//   ribbon(G, gy, pts, w, col, lift?)               a ribbon of width w along a polyline, draped
//   rectPoly(cx, cz, ux, uz, hl, hw) -> [[x, z]..]   an oriented rectangle
//   lamp(D, x, y, z, o?), thuja(D, x, y, z, h, w?), shrub(D, x, y, z, r, col), urn(D, x, y, z), bench(D, x, y, z, yaw)
//   hedge(D, gy, pts, h, w, col, closed?)           a clipped hedge along a polyline (boxes, follows the ground in 3 m steps)
//   ironFence(D, S, gy, pts, o?)                    a black iron fence on stone piers along a polyline, with a low collider
import { DP } from '../../../materials.js';
import { hexLin } from '../../../../kit/mesh.js';

export const rad = (d) => (d * Math.PI) / 180;
export const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
export const shade = (hex, k) => '#' + rgb(hex).map((c) => Math.max(0, Math.min(255, Math.round(c * k * 255))).toString(16).padStart(2, '0')).join('');
export const mixHex = (a, b, t) => { const A = rgb(a), B = rgb(b); return '#' + A.map((c, i) => Math.round((c + (B[i] - c) * t) * 255).toString(16).padStart(2, '0')).join(''); };

// the layers' mean albedo as stored (kit/textures.js, an sRGB texture): the shader multiplies the decoded colour by the tint
const BASE = {
  0: [0.82, 0.81, 0.79], 1: [0.87, 0.86, 0.82], 2: [0.86, 0.76, 0.56], 3: [0.62, 0.34, 0.26], 4: [0.66, 0.66, 0.64], 5: [0.62, 0.64, 0.66],
  6: [0.57, 0.5, 0.47], 7: [0.72, 0.46, 0.33], 8: [0.83, 0.8, 0.72],
};
const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
export function tint(hex, layer = 0, gain = 1.06) {
  const b = BASE[layer] ?? BASE[0];
  return rgb(hex).map((c, i) => Math.max(0.05, Math.min(1.98, (lin(c) / lin(b[i])) * gain)));
}

export const rectPoly = (cx, cz, ux, uz, hl, hw) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [cx + ux * hl * a - uz * hw * b, cz + uz * hl * a + ux * hw * b]);

// ------------------------------------------------------------------------------------------------ draped ground
function clipEdge(P, inside, cut) {
  const out = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], ia = inside(a), ib = inside(b);
    if (ia) out.push(a);
    if (ia !== ib) out.push(cut(a, b));
  }
  return out;
}
export function clipRect(P, x0, x1, z0, z1) {
  let o = P;
  const at = (a, b, k, v) => { const t = (v - a[k]) / (b[k] - a[k]); return k === 0 ? [v, a[1] + (b[1] - a[1]) * t] : [a[0] + (b[0] - a[0]) * t, v]; };
  o = clipEdge(o, (p) => p[0] >= x0, (a, b) => at(a, b, 0, x0)); if (o.length < 3) return [];
  o = clipEdge(o, (p) => p[0] <= x1, (a, b) => at(a, b, 0, x1)); if (o.length < 3) return [];
  o = clipEdge(o, (p) => p[1] >= z0, (a, b) => at(a, b, 1, z0)); if (o.length < 3) return [];
  o = clipEdge(o, (p) => p[1] <= z1, (a, b) => at(a, b, 1, z1));
  return o.length < 3 ? [] : o;
}

export function drape(G, gy, poly, col, lift = 0.06, cell = 8, holes = [], rep = 5) {
  G.setColor(col);
  const xs = poly.map((p) => p[0]), zs = poly.map((p) => p[1]);
  for (let x0 = Math.floor(Math.min(...xs) / cell) * cell; x0 < Math.max(...xs); x0 += cell) {
    for (let z0 = Math.floor(Math.min(...zs) / cell) * cell; z0 < Math.max(...zs); z0 += cell) {
      const c = clipRect(poly, x0, x0 + cell, z0, z0 + cell);
      if (c.length < 3) continue;
      const hs = holes.map((h) => clipRect(h, x0 - 1, x0 + cell + 1, z0 - 1, z0 + cell + 1)).filter((h) => h.length >= 3);
      const first = G.v;
      G.fill(c, hs.length ? hs.filter((h) => h.every((p) => p[0] > x0 && p[0] < x0 + cell && p[1] > z0 && p[1] < z0 + cell)) : [], 0, true);
      const a = G.buf.a;
      for (let v = first; v < G.v; v++) { const o = v * 11; a[o + 1] = gy(a[o], a[o + 2]) + lift; a[o + 6] = a[o] / rep; a[o + 7] = a[o + 2] / rep; }
    }
  }
}

export function ribbon(G, gy, pts, w, col, lift = 0.07, rep = 5) {
  G.setColor(col);
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az) || 1e-9, n = Math.max(1, Math.ceil(L / 4));
    const nx = -(bz - az) / L * w / 2, nz = (bx - ax) / L * w / 2;
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n, x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0, x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1;
      const first = G.v;
      G.fill([[x0 - nx, z0 - nz], [x1 - nx, z1 - nz], [x1 + nx, z1 + nz], [x0 + nx, z0 + nz]], [], 0, true);
      const a = G.buf.a;
      for (let v = first; v < G.v; v++) { const o = v * 11; a[o + 1] = gy(a[o], a[o + 2]) + lift; a[o + 6] = a[o] / rep; a[o + 7] = a[o + 2] / rep; }
    }
  }
}

// ------------------------------------------------------------------------------------------------ furniture and planting
export function lamp(D, x, y, z, { h = 4.4, pole = '#25282b', lampCol = '#fff0cf' } = {}) {
  D.setPart(DP.STEEL).setColor(pole).cyl(x, y, z, 0.09, 0.06, h, 6, false);
  D.cyl(x, y, z, 0.15, 0.15, 0.22, 6, true);
  D.setPart(DP.PAINT).setColor(pole).cyl(x, y + h - 0.04, z, 0.3, 0.09, 0.16, 8, true);
  D.setPart(DP.LIGHT).setColor(lampCol).cyl(x, y + h + 0.1, z, 0.2, 0.16, 0.3, 8, true);
  D.setPart(DP.PAINT).setColor(pole).cyl(x, y + h + 0.4, z, 0.24, 0.02, 0.12, 8, true);
}

export function shrub(D, x, y, z, r, col, k = 0.8) { D.setPart(DP.PAINT).setColor(col).ellipsoid([x, y + r * k * 0.7, z], [r, r * k, r], 7, 4); }

// a clipped thuja / cypress column
export function thuja(D, x, y, z, h = 3.2, w = 0.5, col = '#27452a') {
  D.setPart(DP.PAINT).setColor('#4b3a2a').cyl(x, y, z, 0.07, 0.07, 0.4, 5, false);
  D.setColor(col).lathe([[0.01, y + 0.3], [w, y + 0.5], [w * 0.95, y + h * 0.35], [w * 0.62, y + h * 0.75], [0.02, y + h]], 7, x, z);
}

export function urn(D, x, y, z, col = '#ebe7dc') {
  D.setPart(DP.CONC).setColor(col).lathe([[0.01, y], [0.26, y], [0.2, y + 0.18], [0.32, y + 0.52], [0.28, y + 0.62], [0.01, y + 0.62]], 8, x, z);
  D.box(x - 0.3, y - 0.45, z - 0.3, x + 0.3, y, z + 0.3, 1 | 2 | 16 | 32);
}

export function bench(D, x, y, z, yaw) {
  const c = Math.cos(yaw), s = Math.sin(yaw), P = (u, v, h) => [x + c * u - s * v, y + h, z + s * u + c * v];
  D.setPart(DP.WOOD).setColor('#7a5a3a');
  for (const [h, v] of [[0.46, 0], [0.46, 0.13], [0.46, -0.13], [0.74, -0.22], [0.9, -0.24]]) D.tube(P(-0.8, v, h), P(0.8, v, h), 0.05, 4);
  D.setPart(DP.STEEL).setColor('#2c2e30');
  for (const u of [-0.62, 0.62]) { D.tube(P(u, 0, 0), P(u, 0, 0.46), 0.03, 4); D.tube(P(u, -0.2, 0.46), P(u, -0.24, 0.92), 0.03, 4); }
}

export function hedge(D, gy, pts, h, w, col, closed = false, step = 3) {
  D.setPart(DP.PAINT).setColor(col);
  const m = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / step));
    const ux = (b[0] - a[0]) / (L || 1), uz = (b[1] - a[1]) / (L || 1);
    for (let k = 0; k < n; k++) {
      const t0 = L * k / n, t1 = L * (k + 1) / n, x0 = a[0] + ux * t0, z0 = a[1] + uz * t0, x1 = a[0] + ux * t1, z1 = a[1] + uz * t1;
      const y = Math.min(gy(x0, z0), gy(x1, z1)) - 0.05, nx = -uz * w / 2, nz = ux * w / 2;
      // a prism: the four long faces and the top (the ends are hidden by the next piece)
      const P = [[x0 - nx, z0 - nz], [x1 - nx, z1 - nz], [x1 + nx, z1 + nz], [x0 + nx, z0 + nz]];
      D.face([[P[0][0], y + h, P[0][1]], [P[1][0], y + h, P[1][1]], [P[2][0], y + h, P[2][1]], [P[3][0], y + h, P[3][1]]], [0, 1, 0]);
      D.face([[P[0][0], y, P[0][1]], [P[1][0], y, P[1][1]], [P[1][0], y + h, P[1][1]], [P[0][0], y + h, P[0][1]]], [-nz * 2 / w, 0, nx * 2 / w]);
      D.face([[P[2][0], y, P[2][1]], [P[3][0], y, P[3][1]], [P[3][0], y + h, P[3][1]], [P[2][0], y + h, P[2][1]]], [nz * 2 / w, 0, -nx * 2 / w]);
    }
  }
}

// a black iron fence of vertical bars between stone piers; poles every `pier` m. A thin collider along it keeps cars out.
export function ironFence(D, S, gy, pts, { h = 1.7, pier = 6, closed = false, stone = '#b9b3a6', iron = '#1d1f21', collide = true, gaps = [] } = {}) {
  const m = closed ? pts.length : pts.length - 1;
  const inGap = (x, z) => gaps.some(([gx, gz, r]) => Math.hypot(x - gx, z - gz) < r);
  for (let i = 0; i < m; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 0.3) continue;
    const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, n = Math.max(1, Math.round(L / pier));
    for (let k = 0; k <= n; k++) {
      const x = a[0] + ux * L * k / n, z = a[1] + uz * L * k / n;
      if (inGap(x, z)) continue;
      const y = gy(x, z);
      D.setPart(DP.CONC).setColor(stone).box(x - 0.24, y - 0.1, z - 0.24, x + 0.24, y + h + 0.1, z + 0.24, 1 | 2 | 4 | 16 | 32);
      D.setColor(shade(stone, 0.9)).box(x - 0.31, y + h + 0.1, z - 0.31, x + 0.31, y + h + 0.22, z + 0.31, 63 & ~8);
    }
    for (let k = 0; k < n; k++) {
      const x0 = a[0] + ux * L * k / n, z0 = a[1] + uz * L * k / n, x1 = a[0] + ux * L * (k + 1) / n, z1 = a[1] + uz * L * (k + 1) / n;
      if (inGap((x0 + x1) / 2, (z0 + z1) / 2)) continue;
      const y0 = gy(x0, z0), y1 = gy(x1, z1), sl = Math.max(y0, y1);
      D.setPart(DP.STEEL).setColor(iron);
      // two rails and a barred panel drawn as a single vertical-bar strip: the rails are tubes, the bars are thin boxes every 0.28 m
      D.tube([x0 + ux * 0.24, y0 + 0.28, z0 + uz * 0.24], [x1 - ux * 0.24, y1 + 0.28, z1 - uz * 0.24], 0.025, 4);
      D.tube([x0 + ux * 0.24, y0 + h - 0.12, z0 + uz * 0.24], [x1 - ux * 0.24, y1 + h - 0.12, z1 - uz * 0.24], 0.025, 4);
      const len = Math.hypot(x1 - x0, z1 - z0) - 0.48, nb = Math.max(2, Math.round(len / 0.3));
      for (let q = 0; q <= nb; q++) {
        const t = 0.24 + (len * q) / nb, x = x0 + ux * t, z = z0 + uz * t, y = y0 + (y1 - y0) * (t / (len + 0.48));
        D.cyl(x, y, z, 0.018, 0.018, h - 0.02, 3, false); // a three-sided bar: 8 vertices
      }
      void sl;
    }
    if (collide) {
      const nx = -uz * 0.2, nz = ux * 0.2;
      const quad = [[a[0] - nx, a[1] - nz], [b[0] - nx, b[1] - nz], [b[0] + nx, b[1] + nz], [a[0] + nx, a[1] + nz]];
      const ar = quad.reduce((s, p, q) => { const r = quad[(q + 1) % 4]; return s + p[0] * r[1] - r[0] * p[1]; }, 0);
      const ring = (ar < 0 ? quad.slice().reverse() : quad).flat();
      const gl = Math.min(gy(a[0], a[1]), gy(b[0], b[1]));
      if (!gaps.length) S.prism(ring, gl - 0.3, gl + 1.2, 0, 0, 'wall', 0);
    }
  }
}

export { hexLin };
