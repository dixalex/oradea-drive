// Piața Unirii: the canvas textures of the square and the three buildings. All tile (repeat) unless noted; the hue of the
// walls and the stone comes from the vertex colour, so those textures are near white.
//   limeTex(r)    the central slab field: irregular hexagonal limestone slabs ~4 x 3 m with thin dark joints; one tile = 12 m
//   fanTex(r)     porphyry setts laid in segmental fans (the 'pavaj in evantai' of the lanes and the edges); tile = 3.2 m
//   settTex(r)    red-brown rectangular setts of the tram bed (20 x 10 cm in running bond); tile = 2.4 m
//   grassTex(r)   short lawn; tile = 2 m
//   renderTex(r)  fine render grain for the church and palace walls; the tile is 2.5 m at the usual uv scale
//   stoneTex(r)   dressed granite / limestone for plinths, columns, kerbs; tile = 1.2 m
//   paneTex(mask) one storey of glazing (the glass material; `mask` for its emissive twin)
//   seamTex(r)    standing-seam sheet roof, near white (tinted by the vertex colour); tile = 2 m across
//   slateTex(r)   slate shingles in scalloped courses (the palace mansard), near white; tile = 1.2 m
//   signAtlas()   the decals of the site in one 2 x 1 atlas: cell 0 the clock dial (redrawn per game minute), cell 1 the statue's inscription
// Every painter is guarded for the headless tests: a fake 2D context returns nothing for getImageData.
import { canvasTex } from '../../../cherkasy/sculpt.js';

const PI = Math.PI;
const px = (c, w, h, f) => {
  const id = c.createImageData?.(w, h);
  if (!id || !id.data) return false;
  f(id.data); c.putImageData(id, 0, 0); return true;
};

// Voronoi over a jittered, wrapped lattice of elongated cells (hexagon-like slabs ~3 x 1.5 m): the cell's tone, a thin joint
// where the nearest and the second nearest seed are almost equally far, a few small diamond fillers on the joints
export const limeTex = (r) => canvasTex(512, 512, (c, w, h) => {
  c.fillStyle = '#bdbab2'; c.fillRect(0, 0, w, h);
  const cols = 4, rows = 8, seeds = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = ((i + 0.5 + (j & 1) * 0.5 + (r() - 0.5) * 0.3) / cols) * w, y = ((j + 0.5 + (r() - 0.5) * 0.25) / rows) * h;
    seeds[j * cols + i] = [x, y, 0.94 + r() * 0.1, (r() - 0.5) * 0.03];
  }
  const cw = w / cols, ch = h / rows;
  px(c, w, h, (d) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let d1 = 1e9, d2 = 1e9, best = null;
      const ci = Math.floor(x / cw), cj = Math.floor(y / ch);
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const i = ci + di, j = cj + dj, s = seeds[((j % rows + rows) % rows) * cols + ((i % cols + cols) % cols)];
        const sx = s[0] + Math.floor(i / cols) * w, sy = s[1] + Math.floor(j / rows) * h, e = Math.hypot((sx - x) * 0.6, sy - y);
        if (e < d1) { d2 = d1; d1 = e; best = s; } else if (e < d2) d2 = e;
      }
      const t = Math.min(1, Math.max(0, (d2 - d1 - 0.8) / 1.6)), o = (y * w + x) * 4, v = (190 * best[2]) * (0.5 + 0.5 * t);
      d[o] = v + 3 + best[3] * 255; d[o + 1] = v + 1; d[o + 2] = v - 4; d[o + 3] = 255;
    }
  });
  for (let q = 0; q < 3200; q++) { c.fillStyle = `rgba(${r() < 0.5 ? '70,66,60' : '240,236,228'},${0.03 + r() * 0.05})`; c.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
});

export const fanTex = (r) => canvasTex(512, 512, (c, w, h) => {
  c.fillStyle = '#3b3639'; c.fillRect(0, 0, w, h);
  const cols = 4, rows = 8, FW = w / cols, RH = h / rows, R = FW * 0.5, st = 11;
  const tones = [[112, 104, 108], [128, 118, 120], [94, 88, 94], [120, 110, 112], [104, 96, 98]];
  for (let j = -1; j <= rows; j++) for (let i = -1; i <= cols; i++) {
    const cx = (i + 0.5 + (j & 1) * 0.5) * FW, cy = j * RH;
    for (let rr = R; rr > 5; rr -= st) {
      const n = Math.max(3, Math.round(PI * rr / (st * 1.15))), da = PI / n;
      for (let k = 0; k < n; k++) {
        const a0 = k * da, t = tones[(r() * tones.length) | 0], v = 0.9 + r() * 0.2;
        c.strokeStyle = `rgb(${t[0] * v | 0},${t[1] * v | 0},${t[2] * v | 0})`;
        c.lineWidth = st - 2.2; c.lineCap = 'butt';
        c.beginPath(); c.arc(cx, cy, rr - st / 2, a0 + 0.012, a0 + da - 0.012); c.stroke();
      }
    }
  }
  for (let q = 0; q < 2600; q++) { c.fillStyle = `rgba(${r() < 0.5 ? '40,34,30' : '230,215,200'},${0.05 + r() * 0.07})`; c.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
});

export const settTex = (r) => canvasTex(512, 512, (c, w, h) => {
  c.fillStyle = '#3d3532'; c.fillRect(0, 0, w, h);
  const sw = w / 12, sh = h / 24;
  for (let j = 0; j < 24; j++) for (let i = -1; i < 12; i++) {
    const v = 0.82 + r() * 0.36, x = (i + (j & 1) * 0.5) * sw, red = r() < 0.7;
    c.fillStyle = red ? `rgb(${150 * v | 0},${92 * v | 0},${78 * v | 0})` : `rgb(${128 * v | 0},${108 * v | 0},${100 * v | 0})`;
    c.fillRect(x + 1.2, j * sh + 1, sw - 2.4, sh - 2);
  }
  for (let q = 0; q < 1800; q++) { c.fillStyle = `rgba(${r() < 0.5 ? '30,24,22' : '240,225,210'},${0.05 + r() * 0.06})`; c.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
});

export const grassTex = (r) => canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = '#5b9238'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 3600; i++) {
    const v = r();
    c.fillStyle = v < 0.4 ? 'rgba(30,70,20,0.35)' : v < 0.8 ? 'rgba(160,205,100,0.32)' : 'rgba(210,225,150,0.2)';
    c.fillRect(r() * w, r() * h, 1 + r() * 2, 2 + r() * 4);
  }
});

export const renderTex = (r) => canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = '#f4f2ee'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 1600; i++) { c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(90,76,60,0.055)'; c.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
});

export const stoneTex = (r) => canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = '#e4e0d8'; c.fillRect(0, 0, w, h);
  for (let q = 0; q < 6000; q++) {
    const k = r();
    c.fillStyle = k < 0.4 ? `rgba(70,66,62,${0.12 + r() * 0.2})` : k < 0.8 ? `rgba(255,252,246,${0.18 + r() * 0.25})` : `rgba(160,150,140,${0.1 + r() * 0.16})`;
    c.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
});

// one storey of glazing: frame, a transom, a sky-reflecting gradient (the emissive twin is white where it is glass)
export const paneTex = (mask) => canvasTex(64, 128, (g, w, h) => {
  const gl = g.createLinearGradient(0, 0, w * 0.5, h);
  gl.addColorStop(0, mask ? '#fff' : '#cfd9df'); gl.addColorStop(0.5, mask ? '#fff' : '#8c9aa4'); gl.addColorStop(1, mask ? '#fff' : '#4a5660');
  g.fillStyle = gl; g.fillRect(0, 0, w, h);
  g.fillStyle = mask ? '#000' : '#26282a';
  g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h); g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3);
  g.fillRect(w / 2 - 1.5, 0, 3, h); g.fillRect(0, Math.round(h * 0.36), w, 3);
});

export const seamTex = (r) => canvasTex(256, 64, (c, w, h) => {
  c.fillStyle = '#e6e6e4'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) { c.fillStyle = '#9a9a98'; c.fillRect(i * 64, 0, 3, h); c.fillStyle = '#fafafa'; c.fillRect(i * 64 + 3, 0, 2, h); }
  for (let q = 0; q < 500; q++) { c.fillStyle = `rgba(60,60,60,${0.03 + r() * 0.05})`; c.fillRect(r() * w, r() * h, 2 + r() * 6, 1); }
});

export const slateTex = (r) => canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = '#c6c8cc'; c.fillRect(0, 0, w, h);
  const cols = 8, rows = 10, cw = w / cols, rh = h / rows;
  for (let j = 0; j < rows; j++) for (let i = -1; i < cols; i++) {
    const x = (i + (j & 1) * 0.5) * cw, y = j * rh, v = 0.86 + r() * 0.2;
    c.fillStyle = `rgb(${232 * v | 0},${234 * v | 0},${238 * v | 0})`;
    c.beginPath(); c.moveTo(x + 1, y); c.lineTo(x + cw - 1, y); c.lineTo(x + cw - 1, y + rh * 1.5 - 2); c.arc(x + cw / 2, y + rh * 1.5 - 2, cw / 2 - 1, 0, PI); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(30,34,40,0.45)'; c.lineWidth = 1.2; c.stroke();
  }
});

// the decals: cell 0 (left) the clock dial, cell 1 (right) the plinth's inscription. hours / minutes redraw the dial.
export function signAtlas() {
  const W = 1024, H = 512, tex = canvasTex(W, H, () => {}, { repeat: false });
  const g = tex.image.getContext('2d');
  const dial = (hours) => {
    g.clearRect(0, 0, W / 2, H);
    const cx = W / 4, cy = H / 2, R = 244;
    g.fillStyle = '#d9d2bc'; g.beginPath(); g.arc(cx, cy, R, 0, PI * 2); g.fill();
    g.fillStyle = '#1f2124'; g.beginPath(); g.arc(cx, cy, R - 20, 0, PI * 2); g.fill();
    g.fillStyle = '#ece6d2'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 44px "Times New Roman", serif';
    ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((t, i) => { const a = i / 12 * PI * 2 - PI / 2; g.fillText(t, cx + Math.cos(a) * 168, cy + Math.sin(a) * 168); });
    g.strokeStyle = '#ece6d2'; g.lineCap = 'round';
    const hr = hours % 12, mn = (hours * 60) % 60, hand = (a, len, wd) => { g.lineWidth = wd; g.beginPath(); g.moveTo(cx - Math.sin(a) * 26, cy + Math.cos(a) * 26); g.lineTo(cx + Math.sin(a) * len, cy - Math.cos(a) * len); g.stroke(); };
    hand((hr + mn / 60) / 12 * PI * 2, 112, 15); hand(mn / 60 * PI * 2, 176, 9);
  };
  const lines = [{ text: 'FERDINAND I', y: 0.18, size: 70 }, { text: 'ÎNTREGITORUL', y: 0.38, size: 56 }, { text: 'REGE AL ROMÂNIEI', y: 0.6, size: 46 }, { text: '1914 – 1927', y: 0.8, size: 46 }];
  g.clearRect(W / 2, 0, W / 2, H);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const L of lines) {
    g.font = `600 ${L.size}px "Georgia", "Times New Roman", serif`;
    g.fillStyle = '#2b2926'; g.fillText(L.text, W * 0.75, L.y * H, W * 0.46);
  }
  dial(10 + 10 / 60);
  let last = -1;
  return { tex, tick(hours) { const m = Math.floor(hours * 60); if (m !== last) { last = m; dial(hours); tex.needsUpdate = true; } }, dial: [0, 0, 0.5, 1], plate: [0.5, 0, 1, 1] };
}
