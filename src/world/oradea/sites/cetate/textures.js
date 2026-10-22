// Canvas textures of the Oradea Fortress site (all procedural, seeded; the vertex colour tints them). Not a site module.
//   wallTex(r)     the curtain's outer face, one tile 8 m wide and WALL_H tall (v runs from the moat floor to the top):
//                  a limestone plinth, red-brown brick with stone patches and gun slits, a pale stone cordon, brick coping
//   rubbleTex(r)   limestone rubble with brick bands (the counterscarp), 4 x 4 m
//   bankTex(r)     grass and earth for the ramparts, 6 x 6 m
//   settTex(r)     granite setts in a diagonal fan bond, 2 x 2 m;  gravelTex(r)  pale gravel, 4 x 4 m
//   tileTex(r)     terracotta roof tiles, 1 x 1 m;  plankTex(r)  timber planks, 1 x 1 m;  stoneTex(r) dressed stone, 2 x 2 m
//   plasterAtlas(r, lit) -> { tex, mask, A }   the palace's bay atlas (see cell kinds in KIND), churchAtlas(r, lit)
import { canvasTex } from '../../../cherkasy/sculpt.js';
import { bayAtlas } from '../../../cherkasy/bayatlas.js';

export const WALL_H = 10.2; // metres: the height of the brick wall in wallTex (moat floor to coping)
export const WALL_TH = 12.75; // metres: the whole tile's height (816 px at 64 px per metre); v = metres up / WALL_TH

const rgb = (r, g, b) => `rgb(${r | 0},${g | 0},${b | 0})`;

export const wallTex = (r) => canvasTex(512, 816, (g, w, h) => {
  const ppm = w / 8; // 64 px per metre both ways (816 = 12.75 m; the face uses the first WALL_H)
  g.fillStyle = '#8a4a36'; g.fillRect(0, 0, w, h);
  const y = (m) => h - m * ppm; // canvas y of a height m over the tile's bottom
  // the plinth: limestone blocks (0 .. 1.3 m), bevelled outward
  const plinth = (y0m, y1m) => {
    for (let m = y0m; m < y1m; m += 0.42) {
      let x = r() * 30;
      while (x < w) {
        const bw = 40 + r() * 70, bh = 0.4 * ppm, v = 150 + r() * 40;
        g.fillStyle = rgb(v + 6, v, v - 18); g.fillRect(x + 1, y(m) - bh + 1, bw - 2, bh - 2);
        g.fillStyle = 'rgba(40,30,20,0.25)'; g.fillRect(x + 1, y(m) - 3, bw - 2, 2);
        x += bw;
      }
    }
  };
  // brick courses (0.075 m) with random tone, mortar shows through
  const bricks = (y0m, y1m, base) => {
    const bh = 0.075 * ppm, bw = 0.23 * ppm;
    for (let m = y0m; m < y1m; m += 0.075) {
      const off = ((m / 0.075) | 0) % 2 ? bw / 2 : 0;
      for (let x = -off; x < w; x += bw) {
        const k = r(), v = base + (r() - 0.5) * 34;
        g.fillStyle = k < 0.08 ? rgb(v * 0.72, v * 0.46, v * 0.38) : k < 0.2 ? rgb(v * 1.02, v * 0.66, v * 0.5) : rgb(v * 0.96, v * 0.56, v * 0.43);
        g.fillRect(x + 0.6, y(m) - bh + 0.6, bw - 1.2, bh - 1.2);
      }
    }
  };
  g.fillStyle = '#b8a890'; g.fillRect(0, y(8.9), w, y(0) - y(8.9));       // mortar under all
  plinth(0, 1.3);
  bricks(1.3, 8.7, 150);
  // patches of rubble stone and of pale repair brick in the brickwork
  for (let k = 0; k < 11; k++) {
    const px = r() * w, pm = 1.8 + r() * 5.6, pw = (0.8 + r() * 1.9) * ppm, ph = (0.5 + r() * 1.3) * ppm, stone = r() < 0.55;
    if (stone) {
      for (let a = 0; a < pw; a += 22) for (let b = 0; b < ph; b += 15) { const v = 140 + r() * 45; g.fillStyle = rgb(v + 8, v, v - 20); g.fillRect(px + a + 1, y(pm) - ph + b + 1, 20 + r() * 4, 13); }
    } else { g.fillStyle = 'rgba(214,150,112,0.3)'; g.fillRect(px, y(pm) - ph, pw, ph); }
  }
  // gun embrasures high in the wall: arched dark recesses in a lighter brick rim
  for (const [px, pm] of [[2.0, 6.6], [5.7, 6.8]]) {
    const cx = px * ppm, bx = 0.5 * ppm, top = y(pm + 1.05);
    g.fillStyle = '#b4795a'; g.fillRect(cx - bx - 5, top, 2 * bx + 10, y(pm) - top + 3);
    g.beginPath(); g.arc(cx, top, bx + 5, Math.PI, 0); g.fill();
    g.fillStyle = '#251a15'; g.fillRect(cx - bx, top, 2 * bx, y(pm) - top);
    g.beginPath(); g.arc(cx, top, bx, Math.PI, 0); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(cx - bx, y(pm) - 6, 2 * bx, 6);
  }
  // gun slits: narrow dark openings with a splayed cream reveal
  for (const [px, pm] of [[1.2, 3.6], [4.2, 4.1], [6.9, 3.4]]) {
    g.fillStyle = '#b9a98c'; g.fillRect(px * ppm - 7, y(pm) - 0.7 * ppm, 14, 0.7 * ppm + 3);
    g.fillStyle = '#1c1612'; g.fillRect(px * ppm - 3, y(pm) - 0.62 * ppm, 6, 0.6 * ppm);
  }
  // weathering streaks down from the top
  for (let k = 0; k < 40; k++) { const sx = r() * w; g.fillStyle = `rgba(40,25,15,${0.04 + r() * 0.06})`; g.fillRect(sx, y(9.2), 2 + r() * 5, 60 + r() * 380); }
  // the cordon (a pale stone string course) at 8.7 .. 9.0 m, brick coping above to the top at WALL_H
  g.fillStyle = '#cdc2ac'; g.fillRect(0, y(9.05), w, 0.35 * ppm);
  g.fillStyle = 'rgba(70,55,40,0.35)'; g.fillRect(0, y(8.7), w, 2);
  bricks(9.05, WALL_H, 165);
  g.fillStyle = '#b79a82'; g.fillRect(0, y(WALL_H), w, 4);
  g.fillStyle = 'rgba(20,12,8,0.16)'; g.fillRect(0, y(0), w, 0.25 * ppm); // damp at the foot
});

export const rubbleTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#7d705f'; g.fillRect(0, 0, w, h);
  let y = 0;
  while (y < h) {
    const bh = 26 + r() * 20;
    let x = -r() * 40;
    while (x < w) {
      const bw = 34 + r() * 60, v = 138 + r() * 52, tint = r();
      g.fillStyle = tint < 0.18 ? rgb(v * 0.92, v * 0.74, v * 0.62) : rgb(v + 10, v + 2, v - 16);
      g.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
      g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(x + 2, y + 2, bw - 5, 3);
      x += bw;
    }
    y += bh;
  }
  // two brick bands
  for (const by of [40, 170]) { for (let x = 0; x < w; x += 22) { const v = 150 + r() * 30; g.fillStyle = rgb(v, v * 0.5, v * 0.38); g.fillRect(x + 1, by, 20, 9); g.fillRect(x + 12, by + 10, 20, 9); } }
});

export const bankTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#56713a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1800; i++) {
    const k = r(), x = r() * w, y = r() * h;
    g.fillStyle = k < 0.35 ? 'rgba(30,50,20,0.5)' : k < 0.7 ? 'rgba(150,170,80,0.4)' : k < 0.9 ? 'rgba(130,100,60,0.35)' : 'rgba(210,205,150,0.35)';
    g.beginPath(); g.ellipse(x, y, 1.5 + r() * 4, 1 + r() * 2.5, r() * 3, 0, 6.3); g.fill();
  }
  for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(120,90,55,0.25)'; g.beginPath(); g.ellipse(r() * w, r() * h, 12 + r() * 20, 6 + r() * 10, r() * 3, 0, 6.3); g.fill(); }
});

export const settTex = (r) => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#55524e'; g.fillRect(0, 0, w, h);
  const s = w / 20; // 0.1 m setts
  for (let j = 0; j < 20; j++) for (let i = 0; i < 20; i++) {
    const v = 96 + r() * 44;
    g.fillStyle = rgb(v, v - 2, v - 6); g.fillRect(i * s + 1, j * s + 1, s - 2, s - 2);
    if (r() < 0.12) { g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(i * s + 2, j * s + 2, s * 0.4, s * 0.4); }
  }
  g.strokeStyle = 'rgba(30,28,26,0.18)'; g.lineWidth = 1;
  for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(w * (0.2 + 0.3 * k), h * 1.1, w * (0.5 + 0.12 * k), 0, 6.3); g.stroke(); }
});

export const gravelTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#b3a995'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4200; i++) { const v = 140 + r() * 80; g.fillStyle = rgb(v, v - 6, v - 22); g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2); }
  for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(90,80,60,0.12)'; g.beginPath(); g.ellipse(r() * w, r() * h, 8 + r() * 18, 4 + r() * 8, r() * 3, 0, 6.3); g.fill(); }
});

export const tileTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#7a3a2a'; g.fillRect(0, 0, w, h);
  const th = h / 10, tw = w / 8;
  for (let j = 0; j < 10; j++) for (let i = 0; i < 9; i++) {
    const x = i * tw - (j & 1 ? tw / 2 : 0), v = 150 + r() * 46, k = r();
    g.fillStyle = k < 0.1 ? rgb(v * 0.7, v * 0.4, v * 0.34) : rgb(v, v * 0.46, v * 0.34);
    g.fillRect(x + 1, j * th + 1, tw - 2, th - 1);
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(x + 1, j * th + th - 3, tw - 2, 2);
    g.fillStyle = 'rgba(255,200,170,0.09)'; g.fillRect(x + 1, j * th + 1, tw - 2, 2);
  }
});

export const plankTex = (r) => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#5a3d27'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 6; i++) {
    const v = 92 + r() * 36;
    g.fillStyle = rgb(v + 20, v - 6, v - 34); g.fillRect(0, i * (h / 6) + 1, w, h / 6 - 2);
    for (let k = 0; k < 7; k++) { g.fillStyle = 'rgba(40,22,10,0.25)'; g.fillRect(r() * w, i * (h / 6) + 2 + r() * (h / 6 - 4), 8 + r() * 30, 1); }
  }
});

export const stoneTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#c9bfa7'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const v = 170 + r() * 50; g.fillStyle = `rgba(${v | 0},${(v - 8) | 0},${(v - 30) | 0},0.5)`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2); }
  g.fillStyle = 'rgba(80,70,50,0.18)'; for (let y = 0; y < h; y += 64) g.fillRect(0, y, w, 1.5);
});

// ----------------------------------------------------------------------------------------- the palace's bay atlas
// one bay is 4.4 m wide, one storey 3.8 m; each kind is a block of rows (top down); a window is [x, y, w, h] in the cell
export const FH = 3.8, BAY = 4.4, KIND = {
  arcade3: { r0: 0, nk: 3 },  // arched openings on all three storeys (the courtyard side of the long wings)
  arcade1: { r0: 3, nk: 3 },  // an arcade on the ground storey, square windows above
  plain: { r0: 6, nk: 3 },    // three storeys of square windows (the outside of the ring)
  low: { r0: 9, nk: 2 },      // two storeys (the outbuildings), pale cream
};
const WALL = '#f0e6d2', CREAM = '#e3d2b0', FRAME = '#5b3a29', GLASS = '#3d4a52';

export function plasterAtlas(r, lit = 0.25) {
  const cell = (g, x, y, w, h, i, j) => {
    const kind = j < 3 ? 'arcade3' : j < 6 ? 'arcade1' : j < 9 ? 'plain' : 'low', row = kind === 'low' ? j - 9 : (j % 3); // row 0 top storey .. nk-1 ground
    const ground = kind === 'low' ? row === 1 : row === 2;
    g.fillStyle = ground && kind !== 'low' ? CREAM : (kind === 'low' ? '#ecdfc4' : WALL); g.fillRect(x, y, w, h);
    for (let k = 0; k < 40; k++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(90,80,60,0.05)'; g.fillRect(x + r() * w, y + r() * h, 3 + r() * 6, 2); }
    // pilaster strips at the bay edges, a cornice line under the eaves on the top row
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x, y, 3, h); g.fillRect(x + w - 3, y, 3, h);
    g.fillStyle = 'rgba(120,110,90,0.28)'; g.fillRect(x, y + h - 2, w, 2);
    const wins = [];
    const arch = (kind === 'arcade3') || (kind === 'arcade1' && ground);
    if (arch) {
      const aw = w * 0.74, ax = x + (w - aw) / 2, top = y + h * 0.08, spring = top + aw / 2, bottom = ground ? y + h : y + h * 0.9;
      g.fillStyle = '#d5cdb5'; g.beginPath(); g.arc(ax + aw / 2, spring, aw / 2 + 3, Math.PI, 0); g.lineTo(ax + aw + 3, bottom); g.lineTo(ax - 3, bottom); g.closePath(); g.fill(); // the surround
      g.fillStyle = ground ? '#2c2824' : GLASS; g.beginPath(); g.arc(ax + aw / 2, spring, aw / 2, Math.PI, 0); g.lineTo(ax + aw, bottom); g.lineTo(ax, bottom); g.closePath(); g.fill();
      g.fillStyle = 'rgba(220,235,245,0.18)'; g.fillRect(ax + 3, spring - 4, aw - 6, 10);
      if (!ground) { g.fillStyle = FRAME; g.fillRect(ax + aw / 2 - 1.5, top + 2, 3, bottom - top); g.fillRect(ax, spring + 4, aw, 3); }
      wins.push([ax + 3, top + 4, aw - 6, bottom - top - 8]);
    } else {
      const ww = w * 0.34, wh = h * (ground ? 0.42 : 0.52), wx = x + (w - ww) / 2, wy = y + h * (ground ? 0.2 : 0.2);
      g.fillStyle = '#d5cdb5'; g.fillRect(wx - 4, wy - 4, ww + 8, wh + 8);
      g.fillStyle = FRAME; g.fillRect(wx, wy, ww, wh);
      g.fillStyle = GLASS; g.fillRect(wx + 3, wy + 3, ww - 6, wh - 6);
      g.fillStyle = 'rgba(220,235,245,0.2)'; g.fillRect(wx + 3, wy + 3, ww - 6, (wh - 6) * 0.35);
      g.fillStyle = FRAME; g.fillRect(wx + ww / 2 - 1.5, wy, 3, wh); g.fillRect(wx, wy + wh * 0.42, ww, 3);
      g.fillStyle = '#cfc6ad'; g.fillRect(wx - 6, wy + wh + 4, ww + 12, 4);
      wins.push([wx + 3, wy + 3, ww - 6, wh - 6]);
    }
    return wins;
  };
  const at = bayAtlas({ cols: 1, rows: 11, cw: 128, ch: 112, r, lit, cell });
  return { ...at, A: { fh: FH, cols: 1, rows: 11, bay: BAY, base: 0 } };
}

// the garrison church: one tall wall, a plain base, three tall round-arched windows between pilasters
export function churchAtlas(r, lit = 0.35) {
  const cell = (g, x, y, w, h) => {
    g.fillStyle = '#f1d25e'; g.fillRect(x, y, w, h);
    for (let k = 0; k < 90; k++) { g.fillStyle = r() < 0.5 ? 'rgba(255,245,170,0.28)' : 'rgba(120,90,10,0.06)'; g.fillRect(x + r() * w, y + r() * h, 4 + r() * 8, 3); }
    g.fillStyle = '#f7e8a8'; g.fillRect(x, y, w * 0.05, h); g.fillRect(x + w * 0.95, y, w * 0.05, h);   // pilasters
    g.fillStyle = '#f7e8a8'; g.fillRect(x, y + h * 0.06, w, h * 0.03); g.fillRect(x, y + h * 0.9, w, h * 0.1);   // cornice, plinth
    const aw = w * 0.31, ax = x + (w - aw) / 2, top = y + h * 0.2, spring = top + aw / 2, bottom = y + h * 0.78;
    g.fillStyle = '#f7ecc0'; g.beginPath(); g.arc(ax + aw / 2, spring, aw / 2 + 5, Math.PI, 0); g.lineTo(ax + aw + 5, bottom + 4); g.lineTo(ax - 5, bottom + 4); g.closePath(); g.fill();
    g.fillStyle = '#3b4750'; g.beginPath(); g.arc(ax + aw / 2, spring, aw / 2, Math.PI, 0); g.lineTo(ax + aw, bottom); g.lineTo(ax, bottom); g.closePath(); g.fill();
    g.fillStyle = 'rgba(225,238,245,0.2)'; g.fillRect(ax + 4, spring - 6, aw - 8, 14);
    g.fillStyle = '#ece4c8'; g.fillRect(ax + aw / 2 - 1.5, top, 3, bottom - top); g.fillRect(ax, spring + 8, aw, 3); g.fillRect(ax, spring + 70, aw, 3);
    return [[ax + 4, top + 4, aw - 8, bottom - top - 8]];
  };
  const at = bayAtlas({ cols: 1, rows: 1, cw: 245, ch: 384, r, lit, cell });
  return { ...at, A: { fh: 11.5, cols: 1, rows: 1, bay: 7.4, base: 0 } };
}
