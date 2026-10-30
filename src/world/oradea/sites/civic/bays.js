// OWNER: oradea. Bay atlas of the civic site (../civic.js): the long repeated walls (the sides of the Palace of Justice, the
// courtyards, the plain fronts of the old-town houses) are painted, so a hundred windows cost four vertices. One canvas holds a
// strip per storey kind; a strip is VARS bays wide (the variants differ in which windows are lit at night: the emissive mask)
// and is tiled along a wall face, bay after bay. The atlas is one material, `bay`, shared by every building of the group.
//   makeBays(r, specs) -> { tex, mask, rows, band(D, f, name, y0, y1, o?, bay?) -> n }
//     specs [{ name, h (metres of the storey the strip paints), paint(g, x, y, w, h, i, r) -> [[x, y, w, h], ...] windows (px in the cell) }]
//     band: one quad over the face f from y0 to y1 (y1 - y0 = the strip's h) with the strip tiled n = round(L / bay) times
//   painters: stone(g, x, y, w, h, col, r) courses of rusticated ashlar; plaster(g, x, y, w, h, col, r); glassRect(g, x, y, w, h); arch(g, ...)
import * as THREE from 'three';
import { canvasTex } from '../../../cherkasy/sculpt.js';
import { at, quad } from './kit.js';

export const PXM = 38, CW = 128, VARS = 4, BAY = CW / PXM, PAD = 3;
const TAU = Math.PI * 2;

export function makeBays(r, specs, { lit = 0.34 } = {}) {
  const rows = {}; let y = 0;
  for (const s of specs) { const ph = Math.round(s.h * PXM); rows[s.name] = { ...s, py: y + PAD, ph }; y += ph + 2 * PAD; }
  const H = Math.max(16, y), W = CW * VARS, wins = [];
  const tex = canvasTex(W, H, (g) => {
    g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, W, H);
    for (const R of Object.values(rows)) for (let i = 0; i < VARS; i++) {
      const w = R.paint(g, i * CW, R.py, CW, R.ph, i, r) || [];
      for (const q of w) wins.push([i * CW + q[0], R.py + q[1], q[2], q[3]]);
    }
  }, { repeat: false });
  tex.wrapS = THREE.RepeatWrapping;                                       // tiled along the wall only
  const mask = canvasTex(W, H, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff';
    for (const [x, yy, w, h] of wins) if (r() < lit) g.fillRect(x + 2, yy + 2, w - 4, h - 4);
  }, { repeat: false });
  mask.wrapS = THREE.RepeatWrapping;
  const band = (D, f, name, y0, y1, o = 0, bay = BAY) => {
    const R = rows[name]; if (!R) throw new Error(`no bay strip ${name}`);
    const n = Math.max(1, Math.round(f.L / bay)), U = (f.L / n) * VARS, flip = f.ux * f.nz - f.uz * f.nx < 0;
    const u = (s) => (flip ? -s : s) / U, vb = 1 - (R.py + R.ph) / H, vt = 1 - R.py / H;
    D.setColor('#ffffff');
    quad(D, at(f, 0, y0, o), at(f, f.L, y0, o), at(f, f.L, y1, o), at(f, 0, y1, o), f.N, [[u(0), vb], [u(f.L), vb], [u(f.L), vt], [u(0), vt]]);
    return n;
  };
  return { tex, mask, rows, band, H };
}

// ------------------------------------------------------------------------------------------------ painters
export function plaster(g, x, y, w, h, col, r) {
  g.fillStyle = col; g.fillRect(x, y, w, h);
  for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(96,78,52,0.06)'; g.fillRect(x + r() * w, y + r() * h, 1 + r() * 3, 1 + r() * 3); }
}
// rusticated ashlar: courses of 0.6 m, stones of a third of the bay, every other course shifted by half a stone, bossed faces
export function stone(g, x, y, w, h, col, r, { joint = 'rgba(70,50,30,0.6)' } = {}) {
  g.fillStyle = col; g.fillRect(x, y, w, h);
  const ch = 0.6 * PXM, sw = w / 3;
  let j = 0;
  for (let yy = y + h; yy > y - 1; yy -= ch, j++) {
    const top = Math.max(y, yy - ch), hh = yy - top, off = (j & 1) * sw / 2;
    for (let xx = x - off - sw; xx < x + w + sw; xx += sw) {
      const v = r();
      g.fillStyle = `rgba(255,246,222,${0.06 + v * 0.14})`; g.fillRect(Math.max(x, xx + 2), top + 2, Math.min(sw - 4, x + w - xx - 2), Math.max(1, hh - 4));
      g.fillStyle = `rgba(60,42,24,${0.05 + r() * 0.08})`; g.fillRect(Math.max(x, xx + 3), yy - 5, Math.min(sw - 6, x + w - xx - 3), 3);
      g.fillStyle = joint; if (xx >= x && xx < x + w) g.fillRect(xx, top, 2, hh);
    }
    g.fillStyle = joint; g.fillRect(x, yy - 2, w, 2.5);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x, yy - ch, w, 1.5);
  }
  for (let i = 0; i < 120; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(60,42,24,0.10)'; g.fillRect(x + r() * w, y + r() * h, 1 + r() * 2.5, 1 + r() * 2.5); }
}
// window glass: sky reflected high up, dark below; a lit twin comes from the emissive mask
export function glassRect(g, x, y, w, h, top = '#a3b3bc', bot = '#3a4850') {
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, top); gr.addColorStop(1, bot);
  g.fillStyle = gr; g.fillRect(x, y, w, h);
}
// an arched window shape (a rectangle with a half-round head) as a path
export function archPath(g, x, y, w, h) {
  const rr = w / 2;
  g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + rr); g.arc(x + rr, y + rr, rr, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath();
}
export const ring = (g, cx, cy, r0, r1, col) => { g.fillStyle = col; g.beginPath(); g.arc(cx, cy, r1, 0, TAU); g.arc(cx, cy, r0, 0, TAU, true); g.fill(); };
// a casement window painted in a cell: a white frame, glass, brown sashes (a mullion and a transom at `transom` of the height)
export function sashWin(g, x, y, w, h, { frame = '#f1ebdc', sash = '#5a3b28', fw = 5, mull = true, transom = 0.3 } = {}) {
  g.fillStyle = frame; g.fillRect(x - fw, y - fw, w + 2 * fw, h + fw);
  glassRect(g, x, y, w, h);
  g.fillStyle = sash; g.fillRect(x, y, 3, h); g.fillRect(x + w - 3, y, 3, h); g.fillRect(x, y, w, 3); g.fillRect(x, y + h - 3, w, 3);
  if (mull) g.fillRect(x + w / 2 - 1.5, y, 3, h);
  if (transom) g.fillRect(x, y + h * transom, w, 3);
}
