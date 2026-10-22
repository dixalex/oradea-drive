// OWNER: oradea. Shared helpers of the Gara Oradea + Oradea Arena site (../gara.js): a rotated site frame whose local
// (u, y, v) is baked into every vertex, wall quads that pick a cell of a painted atlas, hip / gable roofs over
// axis-aligned rectangles, balustrades, and the canvas textures. Not a site module.
//   localFrame(origin, ang) -> F { U, V, toMap(u, v), toLocal(x, z), xf() }   local +u -> (cos ang, sin ang) in map x / z,
//     local +v 90 degrees on; xf() is the Matrix4 for MB.setXf, so a builder emits local boxes and quads and holds map
//     coordinates; prism(S, F, ring [[u, v]..], y0, y1, kind?, flags?, bx?, bz?) registers a collision prism over a
//     local ring (slope bx, bz in map x / z)
//   newSet(F, ...keys) -> { key: MB } builders (every one with the frame transform set)
//   Atlas(W, H, S) .add(name, wMetres, hMetres, paint(g, w, h, S, mask)) .uv(name, s0, s1, t0, t1) .tex() .maskTex()
//     cells packed in rows, a painter draws one bay (mask = true: only the lit part, white on black), uv() gives the four
//     corners [[u, v] x 4] (left bottom, right bottom, right top, left top) for the fractions s (across) and t (up)
//   wallQ(D, side, a, b, c, y0, y1, uv?, n?)   a vertical quad on a local face: side 'f' (+v), 'b' (-v), 'l' (-u), 'r' (+u);
//     c is the face's constant coordinate, a and b the along-coordinates of its left and right edge seen from outside
//   hipRoof(R, u0, v0, u1, v1, y, rise, opt) -> top y;  gableRoof(R, W, u0, v0, u1, v1, y, rise, opt)
//   balustrade(B, axis, a0, a1, c, y, opt)    rails, posts and an alpha-tested baluster strip (B.det, B.bal)
//   textures: tileTex(r), balTex(), flatCell(g, w, h), speckle(g, w, h, r, n, a)
import { MB, M4 } from '../../../../kit/mesh.js';
import { canvasTex } from '../../../cherkasy/sculpt.js';
import { quad } from '../../../cherkasy/slabkit.js';
import { area2 } from '../../../cherkasy/geo.js';

export { quad };
export const PI = Math.PI;

export function localFrame(origin, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  return {
    origin, ang, U: [c, s], V: [-s, c],
    toMap: (u, v) => [origin[0] + u * c - v * s, origin[1] + u * s + v * c],
    toLocal: (x, z) => { const dx = x - origin[0], dz = z - origin[1]; return [dx * c + dz * s, -dx * s + dz * c]; },
    xf: () => M4(origin[0], 0, origin[1], -ang),
  };
}
export function prism(S, F, ring, y0, y1, kind = 'wall', flags = 0, bx = 0, bz = 0) {
  const P = ring.map(([u, v]) => F.toMap(u, v));
  return S.prism((area2(P) < 0 ? P.slice().reverse() : P).flat(), y0, y1, bx, bz, kind, flags);
}
export const newSet = (F, ...keys) => Object.fromEntries(keys.map((k) => [k, new MB().setXf(F.xf())]));

// ------------------------------------------------------------------------------------------------ the atlas
export class Atlas {
  constructor(W, H, S) { this.W = W; this.H = H; this.S = S; this.items = []; this.rect = {}; this.x = 0; this.y = 0; this.rowH = 0; }
  add(name, wm, hm, paint) {
    const w = Math.round(wm * this.S), h = Math.round(hm * this.S);
    if (this.x + w > this.W) { this.x = 0; this.y += this.rowH; this.rowH = 0; }
    if (this.y + h > this.H) throw new Error(`atlas full at ${name}`);
    this.rect[name] = [this.x, this.y, w, h];
    this.items.push({ name, paint, x: this.x, y: this.y, w, h });
    this.x += w; this.rowH = Math.max(this.rowH, h);
    return this;
  }
  // corners for the fractions s0..s1 (across, left to right) and t0..t1 (up from the cell's bottom)
  uv(name, s0 = 0, s1 = 1, t0 = 0, t1 = 1) {
    const [x, y, w, h] = this.rect[name], ix = 0.5 / this.W, iy = 0.5 / this.H;
    const U = (s) => (x + s * w) / this.W, Vv = (t) => 1 - (y + (1 - t) * h) / this.H;
    return [[U(s0) + ix, Vv(t0) + iy], [U(s1) - ix, Vv(t0) + iy], [U(s1) - ix, Vv(t1) - iy], [U(s0) + ix, Vv(t1) - iy]];
  }
  draw(g, mask) {
    if (mask) { g.fillStyle = '#000'; g.fillRect(0, 0, this.W, this.H); }
    for (const it of this.items) {
      g.save(); g.beginPath(); g.rect(it.x, it.y, it.w, it.h); g.clip(); g.translate(it.x, it.y);
      it.paint(g, it.w, it.h, this.S, mask); g.restore();
    }
  }
  tex() { return canvasTex(this.W, this.H, (g) => this.draw(g, false), { repeat: false }); }
  maskTex() { return canvasTex(this.W, this.H, (g) => this.draw(g, true), { repeat: false }); }
}

// ------------------------------------------------------------------------------------------------ wall quads
// side: 'f' faces +v, 'b' -v, 'l' -u, 'r' +u (the local axes of the frame). a, b: the along-coordinates of the left and the
// right edge as seen from outside (u for f and b, v for l and r); c: the constant coordinate
export function wallQ(D, side, a, b, c, y0, y1, uv = null, n = null) {
  const P = (s, y) => (side === 'f' || side === 'b' ? [s, y, c] : [c, y, s]);
  const N = n ?? (side === 'f' ? [0, 0, 1] : side === 'b' ? [0, 0, -1] : side === 'l' ? [-1, 0, 0] : [1, 0, 0]);
  quad(D, P(a, y0), P(b, y0), P(b, y1), P(a, y1), N, uv);
}
// across-coordinates for a face seen from outside: the left edge of the stretch [lo, hi] of the local axis
export const leftOf = (side, lo, hi) => (side === 'f' || side === 'r' ? [lo, hi] : [hi, lo]);

// ------------------------------------------------------------------------------------------------ roofs
const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((q) => q / l); };
const crossV = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub = (a, b) => a.map((v, i) => v - b[i]);
function slope(R, a, b, c, d, k) { // a quad of a roof face, normal up, uv in metres along the eave and up the slope
  let n = norm(crossV(sub(b, a), sub(d, a)));
  if (n[1] < 0) n = n.map((q) => -q);
  const ex = norm(sub(b, a)), ey = norm(crossV(n, ex)), uv = [a, b, c, d].map((p) => { const q = sub(p, a); return [(q[0] * ex[0] + q[1] * ex[1] + q[2] * ex[2]) / k, Math.abs(q[0] * ey[0] + q[1] * ey[1] + q[2] * ey[2]) / k]; });
  quad(R, a, b, c, d, n, uv);
}
// a hipped roof over the rectangle, the eaves at y, the ridge (or, when tw > 0, a flat top 2 tw narrower than the span) `rise`
// over them; returns the top's y
export function hipRoof(R, u0, v0, u1, v1, y, rise, { ov = 0.45, tw = 0, col = null, k = 1.4, topCol = null } = {}) {
  const w = Math.min(u1 - u0, v1 - v0) / 2, d = w - Math.min(tw, w * 0.95), pitch = rise / d, yt = y + rise, ye = y - ov * pitch;
  if (col) R.setColor(col);
  const E = [[u0 - ov, v0 - ov], [u1 + ov, v0 - ov], [u1 + ov, v1 + ov], [u0 - ov, v1 + ov]];
  const T = [[u0 + d, v0 + d], [u1 - d, v0 + d], [u1 - d, v1 - d], [u0 + d, v1 - d]];
  for (let i = 0; i < 4; i++) {
    const e0 = E[i], e1 = E[(i + 1) % 4], t1 = T[(i + 1) % 4], t0 = T[i];
    slope(R, [e0[0], ye, e0[1]], [e1[0], ye, e1[1]], [t1[0], yt, t1[1]], [t0[0], yt, t0[1]], k);
  }
  if (tw > 0) {
    if (topCol) R.setColor(topCol);
    R.face(T.map(([u, v]) => [u, yt, v]), [0, 1, 0]);
    if (topCol && col) R.setColor(col);
  }
  return yt;
}
// a gabled roof, the ridge along 'u' or 'v': R gets the slopes, W the two gable triangles (wall material, uv from `tri`)
export function gableRoof(R, W, u0, v0, u1, v1, y, rise, { axis = 'v', ov = 0.4, col = null, k = 1.4, wallCol = null, tri = null } = {}) {
  if (col) R.setColor(col);
  const alongU = axis === 'u', half = (alongU ? v1 - v0 : u1 - u0) / 2, pitch = rise / half, ye = y - ov * pitch;
  if (alongU) {
    const vm = (v0 + v1) / 2, yt = y + rise;
    slope(R, [u0 - ov, ye, v0 - ov], [u1 + ov, ye, v0 - ov], [u1 + ov, yt, vm], [u0 - ov, yt, vm], k);
    slope(R, [u1 + ov, ye, v1 + ov], [u0 - ov, ye, v1 + ov], [u0 - ov, yt, vm], [u1 + ov, yt, vm], k);
    if (W) {
      if (wallCol) W.setColor(wallCol);
      W.face([[u0, y, v0], [u0, y, v1], [u0, yt, vm]], [-1, 0, 0]); W.face([[u1, y, v1], [u1, y, v0], [u1, yt, vm]], [1, 0, 0]);
    }
  } else {
    const um = (u0 + u1) / 2, yt = y + rise;
    slope(R, [u0 - ov, ye, v1 + ov], [u0 - ov, ye, v0 - ov], [um, yt, v0 - ov], [um, yt, v1 + ov], k);
    slope(R, [u1 + ov, ye, v0 - ov], [u1 + ov, ye, v1 + ov], [um, yt, v1 + ov], [um, yt, v0 - ov], k);
    if (W) {
      if (wallCol) W.setColor(wallCol);
      const tf = (a, b, c, n, uv) => { const i = W.v; [a, b, c].forEach((p, j) => W.vert(...p, ...n, ...(uv ? uv[j] : [0, 0]))); W.tri(i, i + 1, i + 2); };
      // front (+v) and back (-v) triangles; uv: three corners (left, right, apex)
      tf([u1, y, v1], [u0, y, v1], [um, yt, v1], [0, 0, 1], tri?.f);
      tf([u0, y, v0], [u1, y, v0], [um, yt, v0], [0, 0, -1], tri?.b);
    }
  }
  return y + rise;
}
// a thin cylinder finial / mast (a few sides)
export const spire = (D, u, y, v, h, r0 = 0.12, r1 = 0.02) => D.cyl(u, y, v, r0, r1, h, 6, false);

// ------------------------------------------------------------------------------------------------ balustrades
// axis 'u': the run goes along u at v = c; axis 'v': along v at u = c. B.det takes the rails and posts, B.bal the pierced
// baluster strip (double sided, alpha tested, one repeat per 1.2 m). col: the stone's colour
export function balustrade(B, axis, a0, a1, c, y, { h = 0.95, col = '#eadfc4', post = 2.4, th = 0.34 } = {}) {
  const D = B.det, lo = Math.min(a0, a1), hi = Math.max(a0, a1), len = hi - lo;
  D.setColor(col);
  const bx = (s0, s1, y0, y1, t) => (axis === 'u' ? D.box(s0, y0, c - t, s1, y1, c + t) : D.box(c - t, y0, s0, c + t, y1, s1));
  bx(lo - 0.05, hi + 0.05, y, y + 0.22, th / 2);                // plinth
  bx(lo - 0.08, hi + 0.08, y + h - 0.13, y + h, th / 2 + 0.03); // handrail
  const n = Math.max(1, Math.round(len / post));
  for (let i = 0; i <= n; i++) { const s = lo + (len * i) / n; bx(s - 0.15, s + 0.15, y, y + h + 0.05, 0.17); }
  const P = (s, yy) => (axis === 'u' ? [s, yy, c] : [c, yy, s]);
  B.bal.setColor(col);
  const nrm = axis === 'u' ? [0, 0, 1] : [1, 0, 0], r = len / 1.2;
  quad(B.bal, P(lo, y + 0.22), P(hi, y + 0.22), P(hi, y + h - 0.13), P(lo, y + h - 0.13), nrm, [[0, 0], [r, 0], [r, 1], [0, 1]]);
}

// ------------------------------------------------------------------------------------------------ textures
export function speckle(g, w, h, r, n = 900, a = 0.07) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = r() < 0.5 ? `rgba(255,248,230,${a * (0.5 + r())})` : `rgba(60,45,30,${a * (0.5 + r())})`;
    g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
}
export const flatCell = (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); };

// terracotta roof tiles, 1.4 m a repeat (8 courses); the vertex colour tints
export const tileTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#b35a3c'; g.fillRect(0, 0, w, h);
  const rows = 8, rh = h / rows;
  for (let j = 0; j < rows; j++) {
    const off = (j % 2) * 16;
    for (let i = -1; i < 9; i++) {
      const x = i * 32 + off, v = 0.86 + r() * 0.26;
      g.fillStyle = `rgb(${Math.min(255, 190 * v) | 0},${Math.min(255, 96 * v) | 0},${Math.min(255, 62 * v) | 0})`; g.fillRect(x + 1, j * rh + 1, 30, rh - 1);
      g.fillStyle = 'rgba(60,20,10,0.35)'; g.fillRect(x, j * rh, 1.5, rh);
    }
    g.fillStyle = 'rgba(40,12,6,0.45)'; g.fillRect(0, j * rh + rh - 2, w, 2);
    g.fillStyle = 'rgba(255,200,160,0.18)'; g.fillRect(0, j * rh, w, 1.5);
  }
  speckle(g, w, h, r, 600, 0.12);
});

// a pierced balustrade strip: 1.2 m a repeat, six bottle balusters between two solid bands (alpha tested)
export const balTex = () => canvasTex(256, 64, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#fff';
  g.fillRect(0, 0, w, 4); g.fillRect(0, h - 5, w, 5);
  const n = 6, pw = w / n;
  for (let i = 0; i < n; i++) {
    const cx = pw * (i + 0.5);
    g.beginPath(); g.moveTo(cx - 3, 4); g.lineTo(cx + 3, 4); g.lineTo(cx + 6, 16); g.lineTo(cx + 3, 24); g.lineTo(cx + 9, 36); g.lineTo(cx + 4, 50); g.lineTo(cx + 7, h - 5);
    g.lineTo(cx - 7, h - 5); g.lineTo(cx - 4, 50); g.lineTo(cx - 9, 36); g.lineTo(cx - 3, 24); g.lineTo(cx - 6, 16); g.closePath(); g.fill();
  }
}, { aniso: 4 });

