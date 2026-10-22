// OWNER: oradea. Canvas painter for the Calea Republicii facade atlas (not a site module).
//   Atlas(W, H, { maskScale }) -> A    two canvases over one rectangle: `d` the colour (RGBA, ironwork keeps its alpha) and
//     `m` the mask at half size (R: a lit-able window, G: the cell's wall tint, B: its trim tint; both 0: the colour is
//     fixed). The shader (material.js) multiplies a palette colour into the grey wherever the mask says wall / trim.
//     A.cell(name, wM, hM) -> Cx    the next free rectangle wM x hM metres (S px per metre), registered under `name`
//     A.uv(name) -> { u0, v0, u1, v1 }  inset by half a texel, v up (CanvasTexture flipY)
//     A.textures() -> { map, mask }
//   Cx: drawing in metres inside one cell, origin bottom-left, y up. Every shape is painted into both canvases with the
//     current style:  wall(v) / trim(v) tinted greys (v 0..1),  fix('#hex', lit?) a fixed colour (lit: the mask marks it
//     as a window the night light shows through),  dif('rgba(..)') the colour canvas only (shadows, highlights).
//     rect rr poly arch ell ln vine rosette leaf glass ... see below.
import * as THREE from 'three';

export const S = 52;                       // px per metre
const G = 3;                               // gutter px round every cell (filled with the cell's edge colours by the clip)
export const grey = (v) => { const k = Math.round(255 * Math.min(1, Math.max(0, v))); return `rgb(${k},${k},${k})`; };
export const TINT = 0.9;                   // the grey a tinted surface is painted at (shader divides by its linear value)

export class Atlas {
  constructor(W, H, maskScale = 0.5) {
    this.W = W; this.H = H; this.ms = maskScale;
    const mk = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
    this.cvD = mk(W, H); this.cvM = mk(W * maskScale, H * maskScale);
    this.d = this.cvD.getContext('2d'); this.m = this.cvM.getContext('2d');
    this.m.fillStyle = '#000'; this.m.fillRect(0, 0, this.cvM.width, this.cvM.height);
    this.m.scale(maskScale, maskScale);
    this.cells = {}; this.x = G; this.y = G; this.rowH = 0;
  }
  cell(name, wM, hM) {
    const w = Math.round(wM * S), h = Math.round(hM * S);
    if (this.x + w + G > this.W) { this.x = G; this.y += this.rowH + 2 * G; this.rowH = 0; }
    if (this.y + h + G > this.H) throw new Error(`atlas full at ${name} (${this.W}x${this.H})`);
    const c = new Cx(this, this.x, this.y, w, h);
    this.cells[name] = c;
    this.x += w + 2 * G; this.rowH = Math.max(this.rowH, h);
    return c;
  }
  uv(name) {
    const c = this.cells[name]; if (!c) throw new Error('no cell ' + name);
    const e = 0.75; // px inset: bilinear never reaches the gutter
    return { u0: (c.x + e) / this.W, u1: (c.x + c.w - e) / this.W, v0: 1 - (c.y + c.h - e) / this.H, v1: 1 - (c.y + e) / this.H, w: c.w / S, h: c.h / S };
  }
  textures() {
    const map = new THREE.CanvasTexture(this.cvD), mask = new THREE.CanvasTexture(this.cvM);
    map.colorSpace = THREE.SRGBColorSpace; mask.colorSpace = THREE.NoColorSpace;
    for (const t of [map, mask]) { t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; }
    return { map, mask };
  }
}

export class Cx {
  constructor(A, x, y, w, h) {
    this.A = A; this.x = x; this.y = y; this.w = w; this.h = h; this.ctx = [A.d, A.m];
    this.s = { d: '#fff', m: 'rgb(0,0,0)' };
    this.W = w / S; this.H = h / S;
    for (const g of this.ctx) { g.save(); g.beginPath(); g.rect(x - G, y - G, w + 2 * G, h + 2 * G); g.clip(); }
  }
  end() { for (const g of this.ctx) g.restore(); }
  // metres -> cell px (y flips)
  X(x) { return this.x + x * S; }
  Y(y) { return this.y + this.h - y * S; }
  // ---- styles
  wall(v = 0.9) { this.s = { d: grey(v), m: 'rgb(0,255,0)' }; return this; }
  trim(v = 0.9) { this.s = { d: grey(v), m: 'rgb(0,0,255)' }; return this; }
  fix(col, lit = 0) { this.s = { d: col, m: lit ? 'rgb(255,0,0)' : 'rgb(0,0,0)' }; return this; }
  dif(col) { this.s = { d: col, m: null }; return this; }
  // ---- raw painting: fn(ctx, c) builds a path (px), then it is filled / stroked per canvas
  _p(fn, op, lw) {
    const [g, m] = this.ctx, [sd, sm] = [this.s.d, this.s.m];
    g.beginPath(); fn(g, this); if (op === 'fill') { g.fillStyle = sd; g.fill(); } else { g.strokeStyle = sd; g.lineWidth = lw * S; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
    if (sm) { m.beginPath(); fn(m, this); if (op === 'fill') { m.fillStyle = sm; m.fill(); } else { m.strokeStyle = sm; m.lineWidth = lw * S; m.lineJoin = 'round'; m.lineCap = 'round'; m.stroke(); } }
    return this;
  }
  fillP(fn) { return this._p(fn, 'fill'); }
  strokeP(fn, lw) { return this._p(fn, 'stroke', lw); }
  rect(x, y, w, h) { return this.fillP((g, c) => g.rect(c.X(x), c.Y(y + h), w * S, h * S)); }
  rr(x, y, w, h, r) { return this.fillP((g, c) => (g.roundRect ? g.roundRect(c.X(x), c.Y(y + h), w * S, h * S, r * S) : g.rect(c.X(x), c.Y(y + h), w * S, h * S))); }
  poly(pts) { return this.fillP((g, c) => { pts.forEach(([x, y], i) => (i ? g.lineTo(c.X(x), c.Y(y)) : g.moveTo(c.X(x), c.Y(y)))); g.closePath(); }); }
  ell(cx, cy, rx, ry, rot = 0) { return this.fillP((g, c) => g.ellipse(c.X(cx), c.Y(cy), rx * S, ry * S, -rot, 0, Math.PI * 2)); }
  ln(pts, lw) { return this.strokeP((g, c) => pts.forEach(([x, y], i) => (i ? g.lineTo(c.X(x), c.Y(y)) : g.moveTo(c.X(x), c.Y(y)))), lw); }
  // a window-like opening: bottom-left (x, y), w x h, head 'flat' | 'arch' | 'seg' | 'cut' | 'ogee'; grown by g metres all round
  opening(x, y, w, h, head = 'flat', g = 0) { return this.fillP((ctx, c) => headPath(ctx, c, x - g, y - g, w + 2 * g, h + 2 * g, head)); }
  openingLine(x, y, w, h, head, lw, g = 0) { return this.strokeP((ctx, c) => headPath(ctx, c, x - g, y - g, w + 2 * g, h + 2 * g, head), lw); }
  // glass over an opening: a sky / interior gradient (colour canvas), `lit` marks it for the night light
  glass(x, y, w, h, head = 'flat', lit = 1, tone = 0) {
    const [g, m] = this.ctx;
    const grd = g.createLinearGradient?.(this.X(x), this.Y(y + h), this.X(x + w * 0.7), this.Y(y)) ?? '#334';
    const cols = [['#8fa3b4', '#3d4a58', '#232b34'], ['#7f95a6', '#34414e', '#1e252d'], ['#a7b6c0', '#4a5a68', '#2a333c']][tone % 3];
    if (grd.addColorStop) { grd.addColorStop(0, cols[0]); grd.addColorStop(0.45, cols[1]); grd.addColorStop(1, cols[2]); }
    g.beginPath(); headPath(g, this, x, y, w, h, head); g.fillStyle = grd; g.fill();
    m.beginPath(); headPath(m, this, x, y, w, h, head); m.fillStyle = lit ? 'rgb(255,0,0)' : 'rgb(0,0,0)'; m.fill();
    return this;
  }
  // ---- noise and relief
  speckle(r, n = 160) {
    const g = this.A.d;
    for (let i = 0; i < n; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(40,30,20,0.045)';
      g.fillRect(this.x + r() * this.w, this.y + r() * this.h, 1 + r() * 3, 1 + r() * 3);
    }
    return this;
  }
  shadeV(x0, x1, y0, y1, a0, a1) { // vertical gradient of black (a0 at the top, a1 at the bottom), colour canvas only
    const g = this.A.d, grd = g.createLinearGradient?.(0, this.Y(y1), 0, this.Y(y0));
    if (!grd?.addColorStop) return this;
    grd.addColorStop(0, `rgba(0,0,0,${a0})`); grd.addColorStop(1, `rgba(0,0,0,${a1})`);
    g.fillStyle = grd; g.fillRect(this.X(x0), this.Y(y1), (x1 - x0) * S, (y1 - y0) * S);
    return this;
  }
  // ---- ornaments (all trim-styled by the caller)
  rosette(cx, cy, r, petals = 8) {
    for (let k = 0; k < petals; k++) { const a = (k / petals) * Math.PI * 2; this.ell(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.34, r * 0.16, a); }
    return this.ell(cx, cy, r * 0.28, r * 0.28);
  }
  leaf(x, y, l, w, a) { return this.ell(x + Math.cos(a) * l / 2, y + Math.sin(a) * l / 2, l / 2, w / 2, a); }
  // a sinuous stem from (x0, y0) to (x1, y1) with leaves, `amp` the sway, `lw` the stem width (m)
  vine(x0, y0, x1, y1, amp, leaves, lw = 0.035, leaf = 0.16) {
    const pts = [], n = 24, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    for (let i = 0; i <= n; i++) { const t = i / n, s = Math.sin(t * Math.PI * leaves * 0.5) * amp; pts.push([x0 + dx * t + nx * s, y0 + dy * t + ny * s]); }
    this.ln(pts, lw);
    for (let i = 2; i < n; i += 2) {
      const [px, py] = pts[i], [qx, qy] = pts[i + 1], a = Math.atan2(qy - py, qx - px), sd = (i / 2) % 2 ? 1 : -1;
      this.leaf(px, py, leaf, leaf * 0.5, a + sd * 0.9);
    }
    return this;
  }
  garland(x0, x1, y, sag, n = 9, lw = 0.04) { // a swag between two points with small blobs
    const pts = [];
    for (let i = 0; i <= 18; i++) { const t = i / 18; pts.push([x0 + (x1 - x0) * t, y - Math.sin(t * Math.PI) * sag]); }
    this.ln(pts, lw);
    for (let i = 1; i < n; i++) { const [px, py] = pts[Math.round((i / n) * 18)]; this.ell(px, py - 0.02, 0.05, 0.07); }
    return this;
  }
  face(cx, cy, r) { // a stucco mask: oval face, brow, closed eyes, nose, mouth
    this.ell(cx, cy, r * 0.8, r);
    this.dif('rgba(0,0,0,0.38)');
    this.ell(cx - r * 0.32, cy + r * 0.2, r * 0.17, r * 0.06); this.ell(cx + r * 0.32, cy + r * 0.2, r * 0.17, r * 0.06);
    this.ln([[cx, cy + r * 0.15], [cx - r * 0.06, cy - r * 0.2], [cx + r * 0.04, cy - r * 0.22]], r * 0.07);
    this.ell(cx, cy - r * 0.55, r * 0.2, r * 0.07);
    return this;
  }
}

// the outline of an opening, px path in ctx
function headPath(ctx, c, x, y, w, h, head) {
  const L = c.X(x), R = c.X(x + w), B = c.Y(y), T = c.Y(y + h), hw = (R - L) / 2;
  if (head === 'arch') {
    const sp = T + hw;
    ctx.moveTo(L, B); ctx.lineTo(L, sp); ctx.arc(L + hw, sp, hw, Math.PI, 0, false); ctx.lineTo(R, B); ctx.closePath();
  } else if (head === 'seg') {
    const sp = T + hw * 0.42;
    ctx.moveTo(L, B); ctx.lineTo(L, sp); ctx.quadraticCurveTo(L + hw, T - hw * 0.42, R, sp); ctx.lineTo(R, B); ctx.closePath();
  } else if (head === 'cut') {
    const k = hw * 0.55;
    ctx.moveTo(L, B); ctx.lineTo(L, T + k); ctx.lineTo(L + k, T); ctx.lineTo(R - k, T); ctx.lineTo(R, T + k); ctx.lineTo(R, B); ctx.closePath();
  } else if (head === 'ogee') {
    ctx.moveTo(L, B); ctx.lineTo(L, T + hw * 0.5); ctx.bezierCurveTo(L, T + hw * 0.1, L + hw * 0.7, T + hw * 0.4, L + hw, T); ctx.bezierCurveTo(R - hw * 0.7, T + hw * 0.4, R, T + hw * 0.1, R, T + hw * 0.5); ctx.lineTo(R, B); ctx.closePath();
  } else {
    ctx.rect(L, T, R - L, B - T);
  }
}
