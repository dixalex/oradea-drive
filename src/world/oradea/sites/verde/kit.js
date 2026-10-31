// OWNER: oradea. Shared helpers of the green and family places (../verde.js): Dealul Ciuperca and the zoo. Not a site module.
//   COL                          the colours (linear-safe hex strings)
//   mats(r)                      -> { wall, roof, det, glass, lit, ground, fence, board } materials for one place (vertex colours; the
//                                   plaster, tile and grain textures of ../bsvo/kit.js; the fence is an alpha-tested bar strip)
//   builders()                   -> { wall, roof, det, glass, lit, ground, fence, board } MeshBuilders
//   fenceRun(F, S, g, pts, o)    a bar fence along a map polyline on the terrain: alpha-bar quads, posts, a top rail, collision
//   railRun(D, S, g, pts, o)     a rail (posts + top bar + a mid bar) in `det`, optionally on a fixed height y
//   stairRun(D, S, g, a, b, o)   a flight of stone steps from map point a down / up to b, following the ground (quantised treads)
//   tuft(D, x, y, z, r, col)     a shrub blob
//   boardTex(lines) -> texture   a sign board: the lines of text on a dark ground
//   pad(ring) / inRing(P, x, z)  small geometry helpers
import * as THREE from 'three';
import { canvasTex, decal } from '../../../cherkasy/sculpt.js';
import { barTex } from '../../../cherkasy/bridgekit.js';
import { MB } from '../../../../kit/mesh.js';
import { solid, quad, face } from '../../../cherkasy/slabkit.js';
import { plasterTex, tileTex, grainTex } from '../bsvo/kit.js';

export const COL = {
  stone: '#8f8a80', stoneL: '#b9b2a2', plinth: '#6d6a64', white: '#f1eee6', cream: '#e6dcc4', glass: '#5d7480', mullion: '#2f3436', roofDark: '#4a4d50', roofSlate: '#51565a',
  timber: '#9a7448', timberD: '#7a5a38', rail: '#c8d2d6', steel: '#3a3f42', gravel: '#bdb29b', paving: '#c9c0ae', lawn: '#6f8a4a', bed: '#5a7a3a', brick: '#a06a4c',
  pond: '#4f7480', iron: '#2c2f30', hay: '#c9ae62', lamp: '#fff1cf', door: '#6b4a32', gold: '#c9a54c', red: '#8f3a2c',
};
export const inRing = (P, x, z) => { let o = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < ((P[j][0] - P[i][0]) * (z - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) o = !o; return o; };
export const KEYS = ['wall', 'roof', 'det', 'glass', 'lit', 'ground', 'fence', 'board'];
export const builders = () => Object.fromEntries(KEYS.map((k) => [k, new MB()]));

export function boardTex(lines, w = 1024, h = 192, bg = '#1f3d2e', fg = '#f1eee6') {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = 5; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((t, i) => { const big = i === 0; g.font = `700 ${big ? 84 : 46}px "Helvetica Neue", Arial, sans-serif`; g.fillText(t, w / 2, lines.length === 1 ? h / 2 : h * (big ? 0.38 : 0.76)); });
  });
}

export function mats(r) {
  const bars = barTex(); bars.wrapS = bars.wrapT = THREE.RepeatWrapping;
  return {
    wall: new THREE.MeshStandardMaterial({ map: plasterTex(r), vertexColors: true, roughness: 0.92 }),
    roof: new THREE.MeshStandardMaterial({ map: tileTex(r), vertexColors: true, roughness: 0.7, side: THREE.DoubleSide }),
    det: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.1, side: THREE.DoubleSide }),
    glass: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.2, metalness: 0.4 }),
    lit: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.15, metalness: 0.35, emissive: 0xffd9a0, emissiveIntensity: 0 }),
    ground: decal(new THREE.MeshStandardMaterial({ map: grainTex(r), vertexColors: true, roughness: 0.95 }), 1),
    fence: new THREE.MeshStandardMaterial({ vertexColors: true, alphaMap: bars, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.3, forceSinglePass: true }),
  };
}

const ok = (h, d = 0) => (Number.isFinite(h) ? h : d);

// a bar fence on the terrain along pts (map metres); o { h (1.6), col, post, solidOn (true), y: a fixed base height | null, pitch (0.14 m a bar) }
export function fenceRun(F, S, g, pts, { h = 1.6, col = COL.iron, post = COL.stone, solidOn = true, y = null, base = 0.0, kind = 'fence' } = {}) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az); if (L < 0.2) continue;
    const n = Math.max(1, Math.round(L / 2.5)), ux = (bx - ax) / L, uz = (bz - az) / L, nx = uz, nz = -ux;
    F.det.setColor(post);
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n, x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0, x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1;
      const y0 = (y ?? ok(g(x0, z0))) + base, y1 = (y ?? ok(g(x1, z1))) + base, len = L / n, bars = len / 0.16;
      F.fence.setColor(col);
      const f0 = F.fence.v;
      for (const [x, yy, z, u, v] of [[x0, y0 - 0.15, z0, 0, 0], [x1, y1 - 0.15, z1, bars, 0], [x1, y1 + h, z1, bars, 1], [x0, y0 + h, z0, 0, 1]]) F.fence.vert(x, yy, z, nx, 0, nz, u, v);
      F.fence.quad(f0, f0 + 1, f0 + 2, f0 + 3);
      F.det.box(x0 - 0.07, y0 - 0.15, z0 - 0.07, x0 + 0.07, y0 + h + 0.08, z0 + 0.07, 63);
      F.det.setColor(col); F.det.tube([x0, y0 + h, z0], [x1, y1 + h, z1], 0.025, 4);
    }
    const [ex, ez] = pts[i + 1], eh = (y ?? ok(g(ex, ez))) + base;
    F.det.setColor(post); F.det.box(ex - 0.07, eh - 0.15, ez - 0.07, ex + 0.07, eh + h + 0.08, ez + 0.07, 63);
    if (solidOn) { const w = 0.12, P = [[ax - nx * w, az - nz * w], [bx - nx * w, bz - nz * w], [bx + nx * w, bz + nz * w], [ax + nx * w, az + nz * w]]; S.prism(P.flat(), Math.min(ok(g(ax, az)), ok(g(bx, bz))) - 0.3, Math.max(ok(g(ax, az)), ok(g(bx, bz))) + h, 0, 0, kind, 0); }
  }
}

// a handrail on posts along pts; o { h (1.0), col, y (fixed base) | null, glass (a pane under the top bar) }
export function railRun(D, G, g, pts, { h = 1.0, col = COL.steel, y = null, glass = false } = {}) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az); if (L < 0.2) continue;
    const n = Math.max(1, Math.round(L / 2)), nx = (bz - az) / L, nz = -(bx - ax) / L;
    for (let k = 0; k <= n; k++) {
      const x = ax + (bx - ax) * k / n, z = az + (bz - az) * k / n, b = y ?? ok(g(x, z));
      D.setColor(col); D.box(x - 0.04, b, z - 0.04, x + 0.04, b + h, z + 0.04, 63);
      if (k < n) {
        const x1 = ax + (bx - ax) * (k + 1) / n, z1 = az + (bz - az) * (k + 1) / n, b1 = y ?? ok(g(x1, z1));
        D.tube([x, b + h, z], [x1, b1 + h, z1], 0.03, 4); D.tube([x, b + h * 0.5, z], [x1, b1 + h * 0.5, z1], 0.015, 3);
        if (glass && G) { G.setColor(COL.rail); quad(G, [x, b + 0.12, z], [x1, b1 + 0.12, z1], [x1, b1 + h - 0.05, z1], [x, b + h - 0.05, z], [nx, 0, nz]); }
      }
    }
  }
}

// steps from a to b: width w, rise ~0.16, tread 0.38; tread tops are the ground quantised to the rise, each a stone block down to the ground
export function stairRun(D, g, a, b, { w = 2.6, col = COL.stoneL, side = COL.stone, rise = 0.16, run = 0.4 } = {}) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.floor(L / run)), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, nx = -uz, nz = ux;
  const ang = Math.atan2(uz, ux);
  let n0 = 0;
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) * run, cx = a[0] + ux * t, cz = a[1] + uz * t, gy = ok(g(cx, cz)), gl = ok(g(cx + nx * w / 2, cz + nz * w / 2)), gr = ok(g(cx - nx * w / 2, cz - nz * w / 2));
    const top = Math.ceil((Math.max(gy, gl, gr) + 0.15) / rise) * rise + 0.02; // the land is drawn 0.15 m over heightAt; a tread never sinks into the slope
    const lo = Math.min(gl, gr, gy) - 0.15;
    D.setColor(col);
    D.with(new THREE.Matrix4().makeRotationY(-ang).setPosition(cx, 0, cz), (s) => s.box(-run / 2, lo, -w / 2, run / 2, top, w / 2, 63));
    n0++;
  }
  return n0;
}

export const tuft = (D, x, y, z, r, col, k = 0.8) => { D.setColor(col); D.ellipsoid([x, y + r * k * 0.7, z], [r, r * k, r], 6, 4); };
export { solid, quad, face };

// a ring moved outward by d (d < 0: inward) with mitred corners (the miter length is capped); any winding in, positive out
export function grow(P, d) {
  let a = 0; P.forEach((p, i) => { const q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; });
  const R = a < 0 ? P.slice().reverse() : P, n = R.length;
  return R.map((p, i) => {
    const q = R[(i + n - 1) % n], s = R[(i + 1) % n];
    const e0 = [p[0] - q[0], p[1] - q[1]], e1 = [s[0] - p[0], s[1] - p[1]], l0 = Math.hypot(...e0) || 1, l1 = Math.hypot(...e1) || 1;
    const n0 = [e0[1] / l0, -e0[0] / l0], n1 = [e1[1] / l1, -e1[0] / l1], k = 1 + n0[0] * n1[0] + n0[1] * n1[1];
    let m = [(n0[0] + n1[0]) / k, (n0[1] + n1[1]) / k]; const ml = Math.hypot(...m);
    if (ml > 2.2) m = [m[0] * 2.2 / ml, m[1] * 2.2 / ml];
    return [p[0] + m[0] * d, p[1] + m[1] * d];
  });
}
export const positiveRing = (P) => { let a = 0; P.forEach((p, i) => { const q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; }); return a < 0 ? P.slice().reverse() : P; };
// thin collision walls along a polyline (railings, low walls)
export function thinSolid(S, g, pts, h, w = 0.1, kind = 'fence') {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az); if (L < 0.2) continue;
    const nx = (bz - az) / L * w, nz = -(bx - ax) / L * w, y0 = Math.min(ok(g(ax, az)), ok(g(bx, bz))) - 0.3;
    S.prism([[ax - nx, az - nz], [bx - nx, bz - nz], [bx + nx, bz + nz], [ax + nx, az + nz]].flat(), y0, Math.max(ok(g(ax, az)), ok(g(bx, bz))) + h, 0, 0, kind, 0);
  }
}
