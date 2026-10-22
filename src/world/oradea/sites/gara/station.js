// OWNER: oradea. Gara Oradea (the main railway station, Piața Gării / Piața București; OSM way 242379148), as it stands
// today: the 1868–1870 station of the Nagyvárad–Pest line, extended at both ends and given its central hall in 1901–1902
// (architect Kálmán Rimanóczy Sr., engineer Vilmos Rendes), in the neo-Romanesque style of the Hungarian state railway –
// ochre render over a pink-brown plinth, cream window surrounds, a corbel-arch frieze under every cornice, terracotta tile.
// Built after the Wikimedia Commons photos (2007–2023; the 2023 one by the file name «Gara Centrală din Oradea (April
// 2023)»), the OSM outline and the Esri ortho photo.
// 134 m along the tracks (the frame's u, NW to SE), two storeys, symmetrical about the central block (u 56–77):
//   the two end wings (NW: u 0–42, a full-height front with arched windows, a projecting gabled bay in the middle; SE: a
//   ground floor with a roof terrace and a balustrade, the upper floor set back behind it), the two low connectors with
//   balustraded roof terraces, and the central block: a pavilion with a pyramid roof on the left, three arched entrances
//   (the right one wide), the blue sign «ORADEA / NAGYVÁRAD», a clock, a gabled dormer, and on the right the tower with its
//   balustrade and pyramid roof. The track side has plain ochre walls with arched doors and windows and the platform
//   canopy. The forecourt: a paved apron, the taxi bays on the asphalt, lanterns, benches and bollards; the tram stop on
//   the far side of the street. Platform 1 along the building (the shared railway module draws only the tracks).
// All geometry is built in the local frame (u along the station, v from the track-side wall toward the street), the
// frame's transform baked into the vertices (kit.js).
//   buildStation({ root, S, H, map, onAsphalt }) -> { footprints, clear(x, z), update(dt, camera), stats } | null
import * as THREE from 'three';
import { nightK, getDaylight } from '../../../../render/daylight.js';
import { OVERHANG } from '../../../collision.js';
import { canvasTex, decal } from '../../../cherkasy/sculpt.js';
import { finish, quad } from '../../../cherkasy/slabkit.js';
import { rng } from '../../../cherkasy/geo.js';
import { Atlas, localFrame, newSet, prism, wallQ, hipRoof, gableRoof, balustrade, spire, tileTex, balTex, speckle, PI } from './kit.js';

export const OSM_ID = 242379148;
export const STATION_FRAME = { origin: [-437.9, -1719.3], ang: 33.924336 * PI / 180 };
const COL = { ochre: '#e4c07c', ochreL: '#f0d596', cream: '#f3e9c9', creamWall: '#efe3b8', plinth: '#a58577', dark: '#2a2c2e', steel: '#3d444c', roof: '#ffffff',
  deck: '#6d6862', bitumen: '#57534e', blue: '#1d4f91' };

// ------------------------------------------------------------------------------------------------ the layout (local u, v)
// [u0, u1, v0 (track side), v1 (street side)]
const MASS = {
  w1a: [0, 18.4, 0, 17.9], w1b: [18.4, 25.2, -1.5, 20.7], w1c: [25.2, 34.1, -1.5, 23.5], w1d: [34.1, 42, -1.5, 20.5],
  c1: [42, 56.5, 0.4, 14.3], d: [56.5, 76.5, 0.4, 22.2], c2: [76.5, 91.5, 0.4, 14.3],
  sa: [91.5, 99, 0.4, 21.9], sb: [99, 108.6, 0.4, 24.8], sc: [108.6, 115.2, 0.4, 21.8], sd: [115.2, 133.6, 1, 19.2],
  su1: [91.5, 115.2, 0.4, 17.3], su2: [115.2, 133.6, 1, 14.8],
};
const LEN = 133.7;
const HW = 10.8, HC = 11.7, HL = 6.4, HU = 4.9; // floor to eave: wings, central block, the low masses, the SE upper storey

// ------------------------------------------------------------------------------------------------ painted bays
const archPath = (g, x, y, w, h) => {
  const rr = w / 2;
  g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + rr); g.arc(x + rr, y + rr, rr, PI, 0); g.lineTo(x + w, y + h); g.closePath();
};
// one opening on a bay: win { cx (m from the left), w, h, y0 (m over the floor), door?, lit?, rect? }
function paintWin(g, S, H, mask, win) {
  const cx = win.cx * S, w = win.w * S, h = win.h * S, x = cx - w / 2, y = H - (win.y0 + win.h) * S, t = 0.14 * S;
  if (mask) {
    if (win.lit) { g.fillStyle = '#ffd9a0'; archPath(g, x + 2, y + 2, w - 4, h - 2); g.fill(); }
    return;
  }
  // cream surround and the shadow it casts into the reveal
  g.fillStyle = COL.cream; archPath(g, x - t, y - t, w + 2 * t, h + t + (win.door ? 0 : 0.18 * S)); g.fill();
  g.fillStyle = 'rgba(70,45,20,0.55)'; archPath(g, x - 2, y - 2, w + 4, h + 2); g.fill();
  const gr = g.createLinearGradient(x, y, x + w * 0.6, y + h);
  gr.addColorStop(0, win.door ? '#4a5864' : '#51616e'); gr.addColorStop(0.55, win.door ? '#2b343c' : '#33414c'); gr.addColorStop(1, '#1c242b');
  g.fillStyle = gr; archPath(g, x + 1, y + 1, w - 2, h - 1); g.fill();
  g.strokeStyle = '#6a4a30'; g.lineWidth = Math.max(2.5, 0.07 * S);
  archPath(g, x + 1, y + 1, w - 2, h - 1); g.stroke();
  g.lineWidth = Math.max(1.5, 0.04 * S);
  g.beginPath(); g.moveTo(cx, y + w / 2); g.lineTo(cx, y + h); g.stroke();                     // the mullion
  g.beginPath(); g.moveTo(x, y + w / 2); g.lineTo(x + w, y + w / 2); g.stroke();                // the springing bar
  if (win.h > 2.2) { const ty = y + h * (win.door ? 0.38 : 0.55); g.beginPath(); g.moveTo(x, ty); g.lineTo(x + w, ty); g.stroke(); }
  g.fillStyle = 'rgba(200,225,240,0.13)'; g.beginPath(); g.moveTo(x + 2, y + h); g.lineTo(x + w * 0.45, y + h); g.lineTo(x + w - 2, y + h * 0.3); g.lineTo(x + w - 2, y + w / 2); g.lineTo(x + 2, y + h * 0.7); g.closePath(); g.fill();
  if (!win.door) { g.fillStyle = COL.cream; g.fillRect(x - 0.1 * S, y + h, w + 0.2 * S, 0.13 * S); g.fillStyle = 'rgba(70,45,20,0.4)'; g.fillRect(x - 0.1 * S, y + h + 0.13 * S, w + 0.2 * S, 2); }
}
// the corbel-arch frieze and the cornice's shadow along the top of a bay
function frieze(g, w, S, f, col) {
  g.fillStyle = col; g.fillRect(0, 0, w, f * S);
  g.fillStyle = 'rgba(70,45,20,0.35)'; g.fillRect(0, f * S - 3, w, 3);
  const n = Math.max(2, Math.round(w / (0.42 * S))), cw = w / n;
  for (let i = 0; i < n; i++) {
    g.fillStyle = 'rgba(120,88,50,0.5)'; archPath(g, i * cw + cw * 0.18, 0.26 * S, cw * 0.64, (f - 0.4) * S); g.fill();
    g.fillStyle = col; archPath(g, i * cw + cw * 0.27, 0.3 * S, cw * 0.46, (f - 0.42) * S); g.fill();
  }
  g.fillStyle = 'rgba(70,45,20,0.45)'; g.fillRect(0, 0.26 * S, w, 2);
}
function paintBay(g, w, h, S, mask, o, r) {
  const Y = (m) => h - m * S;
  if (!mask) {
    g.fillStyle = o.wall; g.fillRect(0, 0, w, h);
    speckle(g, w, h, r, 420, 0.07);
    if (o.base) {
      g.fillStyle = o.plinth; g.fillRect(0, Y(o.base), w, o.base * S);
      g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(0, Y(o.base), w, 2);
      speckle(g, w, o.base * S, r, 60, 0.12);
    }
    if (o.rust) {
      const top = o.gF ?? o.Hm - o.frieze;
      for (let y = o.base + 0.55; y < top - 0.25; y += 0.55) { g.fillStyle = 'rgba(85,55,25,0.30)'; g.fillRect(0, Y(y), w, 1.6); g.fillStyle = 'rgba(255,240,205,0.28)'; g.fillRect(0, Y(y) + 1.6, w, 1.2); }
    }
    if (o.gF) { // the string course between the storeys
      g.fillStyle = o.trim ?? COL.cream; g.fillRect(0, Y(o.gF + 0.3), w, 0.5 * S);
      g.fillStyle = 'rgba(70,45,20,0.4)'; g.fillRect(0, Y(o.gF - 0.2), w, 2.5);
    }
    if (o.frieze) frieze(g, w, S, o.frieze, o.trim ?? COL.cream);
    if (o.quoin) { g.fillStyle = o.trim ?? COL.cream; g.fillRect(0, 0, 0.1 * S, h); g.fillRect(w - 0.1 * S, 0, 0.1 * S, h); }
  }
  for (const win of o.wins ?? []) paintWin(g, S, h, mask, win);
  if (o.disc && !mask) { // the clock's bezel: a cream ring on the wall, the dial itself is a mesh
    g.fillStyle = COL.cream; g.beginPath(); g.arc(o.disc.cx * S, Y(o.disc.cy), o.disc.r * S, 0, PI * 2); g.fill();
    g.fillStyle = 'rgba(70,45,20,0.4)'; g.beginPath(); g.arc(o.disc.cx * S, Y(o.disc.cy), (o.disc.r - 0.08) * S, 0, PI * 2); g.fill();
  }
}
function paintGable(g, w, h, S, mask, r) {
  if (!mask) {
    g.fillStyle = COL.ochreL; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 200, 0.07);
    g.fillStyle = COL.cream; g.fillRect(0, h - 0.25 * S, w, 0.25 * S);
    g.beginPath(); g.moveTo(0, h); g.lineTo(w / 2, 0.25 * S); g.lineTo(w, h); g.lineWidth = 0.22 * S; g.strokeStyle = COL.cream; g.stroke();
  }
  for (const cx of [w / S / 2 - 0.5, w / S / 2 + 0.5]) paintWin(g, S, h, mask, { cx, w: 0.65, h: 2.4, y0: 0.5, lit: true });
  if (!mask) { g.fillStyle = COL.cream; g.beginPath(); g.arc(w / 2, h * 0.33, 0.32 * S, 0, PI * 2); g.fill(); g.fillStyle = '#222c35'; g.beginPath(); g.arc(w / 2, h * 0.33, 0.22 * S, 0, PI * 2); g.fill(); }
}

function makeAtlas(r) {
  const S = 48, A = new Atlas(2304, 896, S);
  const lit = (p) => r() < p;
  const wing = { wall: COL.ochre, plinth: COL.plinth, base: 0.95, rust: true, gF: 5.4, frieze: 1.35, Hm: HW };
  const cen = { wall: COL.ochre, plinth: COL.plinth, base: 0.95, rust: true, gF: 5.6, frieze: 1.4, Hm: HC };
  const low = { wall: COL.ochre, plinth: COL.plinth, base: 0.95, rust: true, frieze: 1.25, Hm: HL };
  const up = (o, x, wd = 1.15, y0 = 6.5, hh = 2.6) => ({ cx: x, w: wd, h: hh, y0, lit: lit(0.4) });
  const gr = (x, wd = 1.45, hh = 3.75, y0 = 0.95, extra = {}) => ({ cx: x, w: wd, h: hh, y0, lit: lit(0.75), ...extra });
  const defs = [
    // the central block (11.7 to the eave)
    ['cWin', 3.3, HC, { ...cen, wins: [gr(1.65, 1.4, 3.8, 1.0), up(0, 1.05, 0.85, 6.6, 2.8), up(0, 2.25, 0.85, 6.6, 2.8)] }],
    ['cDoor', 3.3, HC, { ...cen, wins: [gr(1.65, 1.9, 4.3, 0.05, { door: true, lit: true }), up(0, 1.05, 0.85, 6.6, 2.8), up(0, 2.25, 0.85, 6.6, 2.8)] }],
    ['cClock', 3.3, HC, { ...cen, wins: [gr(1.65, 1.9, 4.3, 0.05, { door: true, lit: true })], disc: { cx: 1.65, cy: 8.0, r: 0.72 } }],
    ['cBig', 4.4, HC, { ...cen, wins: [gr(2.2, 2.9, 4.7, 0.05, { door: true, lit: true }), up(0, 1.45, 1.0, 6.6, 2.8), up(0, 2.95, 1.0, 6.6, 2.8)] }],
    ['cTower', 3.5, HC, { ...cen, wins: [gr(1.75, 1.4, 3.8, 1.0), up(0, 1.1, 0.85, 6.6, 2.8), up(0, 2.4, 0.85, 6.6, 2.8)] }],
    ['cWall', 2.2, HC, { ...cen, quoin: true, wins: [up(0, 1.1, 0.95, 6.6, 2.8)] }],
    // the wings (10.8)
    ['wA', 3.6, HW, { ...wing, wins: [gr(1.8), up(0, 1.8)] }],
    ['wB', 3.6, HW, { ...wing, wins: [gr(1.8), up(0, 1.25, 0.85), up(0, 2.4, 0.85)] }],
    ['wE', 3.6, HW, { ...wing, wins: [gr(1.8, 1.2, 3.2, 1.1), up(0, 1.8, 1.0)] }],
    ['wBl', 3.6, HW, { ...wing, wins: [gr(1.8, 0.9, 1.7, 1.9), up(0, 1.8, 0.95)] }],
    ['wP', 4.5, HW, { ...wing, wins: [gr(2.25, 2.2, 4.0), up(0, 1.2, 0.8), up(0, 2.25, 0.8), up(0, 3.3, 0.8)] }],
    ['bK', 3.6, HW, { ...wing, base: 0.8, wins: [gr(1.8, 1.5, 3.9, 0.5), up(0, 1.8, 1.2)] }],
    ['bKd', 3.6, HW, { ...wing, base: 0.8, wins: [gr(1.8, 1.9, 4.3, 0.1, { door: true, lit: true }), up(0, 1.8, 1.2)] }],
    // the low masses (6.4) and the SE upper storey (4.9, cream)
    ['kW', 3.6, HL, { ...low, wins: [gr(1.8, 1.45, 3.8, 0.95)] }],
    ['kBack', 3.6, HL, { ...low, base: 0.8, wins: [gr(1.8, 1.5, 3.9, 0.5)] }],
    ['sG', 3.95, HL, { ...low, wins: [gr(1.98, 2.3, 3.9, 1.0)] }],
    ['sU', 3.95, HU, { ...wing, wall: COL.creamWall, base: 0, rust: false, gF: 0, Hm: HU, frieze: 1.05, wins: [{ cx: 1.98, w: 1.3, h: 2.7, y0: 1.0, lit: lit(0.4) }] }],
  ];
  for (const [name, wm, hm, o] of defs) A.add(name, wm, hm, (g, w, h, s, mask) => paintBay(g, w, h, s, mask, o, r));
  A.add('gab', 5.2, 5.4, (g, w, h, s, mask) => paintGable(g, w, h, s, mask, r));
  A.add('flat', 1, 1, (g, w, h, s, mask) => { if (!mask) { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); } });
  return A;
}

// the blue name plates and the clock's dial
const signTex = () => canvasTex(1024, 512, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  // the station's name, as on the front: white on blue, a tricolour stripe along the bottom
  g.fillStyle = '#17458a'; g.fillRect(0, 0, w, 240);
  g.strokeStyle = '#fff'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, 224);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = 'bold 100px "Arial", "Helvetica", sans-serif'; g.fillText('ORADEA', w / 2, 70);
  g.font = 'bold 84px "Arial", "Helvetica", sans-serif'; g.fillText('NAGYVÁRAD', w / 2, 158);
  g.fillStyle = '#1f3b9a'; g.fillRect(24, 205, (w - 48) / 3, 18); g.fillStyle = '#f2c81c'; g.fillRect(24 + (w - 48) / 3, 205, (w - 48) / 3, 18); g.fillStyle = '#c8202c'; g.fillRect(24 + 2 * (w - 48) / 3, 205, (w - 48) / 3, 18);
  // the platform sign
  g.fillStyle = '#17458a'; g.fillRect(0, 262, w, 130); g.strokeStyle = '#fff'; g.lineWidth = 6; g.strokeRect(8, 270, w - 16, 114);
  g.fillStyle = '#fff'; g.font = 'bold 110px "Arial", "Helvetica", sans-serif'; g.fillText('ORADEA', w / 2, 330);
  // a blue panel with a white arrow for the tram stop
  g.fillStyle = '#17458a'; g.fillRect(0, 410, 200, 100); g.fillStyle = '#fff'; g.font = 'bold 56px "Arial"'; g.fillText('TRAM', 100, 460);
  g.fillStyle = '#f2c81c'; g.fillRect(220, 410, 200, 100); g.fillStyle = '#111'; g.font = 'bold 56px "Arial"'; g.fillText('TAXI', 320, 460);
  g.fillStyle = '#17458a'; g.fillRect(440, 410, 100, 100); g.fillStyle = '#fff'; g.font = 'bold 80px "Arial"'; g.fillText('P', 490, 462);
}, { repeat: false });
const SIGN = { front: [0, 0, 1, 240 / 512], plat: [0, 262 / 512, 1, 392 / 512], tram: [0, 410 / 512, 200 / 1024, 1], taxi: [220 / 1024, 410 / 512, 420 / 1024, 1], park: [440 / 1024, 410 / 512, 540 / 1024, 1] };
// canvas rectangle (fractions, v down) -> uv corners (left bottom, right bottom, right top, left top)
const sUV = ([u0, v0, u1, v1]) => [[u0, 1 - v1], [u1, 1 - v1], [u1, 1 - v0], [u0, 1 - v0]];

function paintClock(g, hours) {
  const c = 128;
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = '#f4f0e2'; g.beginPath(); g.arc(c, c, 124, 0, PI * 2); g.fill();
  g.strokeStyle = '#2a2a2a'; g.lineWidth = 10; g.beginPath(); g.arc(c, c, 118, 0, PI * 2); g.stroke();
  g.fillStyle = '#1d1d1d';
  for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; g.save(); g.translate(c + Math.sin(a) * 96, c - Math.cos(a) * 96); g.rotate(a); g.fillRect(-4, -12, 8, 24); g.restore(); }
  const hr = hours % 12, mn = (hours * 60) % 60;
  g.strokeStyle = '#151515'; g.lineCap = 'round';
  const hand = (a, len, wd) => { g.lineWidth = wd; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(a) * len, c - Math.cos(a) * len); g.stroke(); };
  hand((hr + mn / 60) / 12 * PI * 2, 58, 12); hand(mn / 60 * PI * 2, 88, 8);
  g.fillStyle = '#151515'; g.beginPath(); g.arc(c, c, 8, 0, PI * 2); g.fill();
}

const paveTex = (r) => canvasTex(256, 256, (g, w, h) => { // concrete paving slabs, 1.2 m a repeat in 2 x 2
  g.fillStyle = '#b5b2aa'; g.fillRect(0, 0, w, h);
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const v = 176 + (r() - 0.5) * 20; g.fillStyle = `rgb(${v | 0},${(v - 2) | 0},${(v - 8) | 0})`; g.fillRect(i * 128 + 2, j * 128 + 2, 124, 124); }
  speckle(g, w, h, r, 900, 0.1);
});
const platTex = (r) => canvasTex(256, 256, (g, w, h) => { // stamped concrete flags, 2.4 m a repeat
  g.fillStyle = '#9d9a94'; g.fillRect(0, 0, w, h);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const v = 158 + (r() - 0.5) * 24; g.fillStyle = `rgb(${v | 0},${(v - 3) | 0},${(v - 9) | 0})`; g.fillRect(i * 64 + 2.5, j * 64 + 2.5, 59, 59); }
  speckle(g, w, h, r, 1200, 0.1);
});
const glassTex = () => canvasTex(64, 128, (g, w, h) => {
  const gl = g.createLinearGradient(0, 0, w * 0.5, h);
  gl.addColorStop(0, '#dfe6ea'); gl.addColorStop(0.5, '#a3b0b8'); gl.addColorStop(1, '#66737c');
  g.fillStyle = gl; g.fillRect(0, 0, w, h);
  g.fillStyle = '#2a2b2e'; g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h); g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3);
});

// ------------------------------------------------------------------------------------------------ the build
export function buildStation({ root, S, H, map, onAsphalt = null }) {
  const ring0 = map?.buildings?.find((b) => b.id === OSM_ID);
  if (map?.buildings && !ring0) return null;
  const t0 = performance.now(), r = rng(1902), n0 = S.count;
  const F = localFrame(STATION_FRAME.origin, STATION_FRAME.ang);
  const g = (u, v) => { const h = H(...F.toMap(u, v)); return Number.isFinite(h) ? h : 17; };
  const B = newSet(F, 'wall', 'roof', 'trim', 'bal', 'det', 'glass', 'sign', 'clock', 'plat', 'glow', 'dec');
  const A = makeAtlas(r), W = B.wall, D = B.det, T = B.trim, BT = { det: B.trim, bal: B.bal };
  const FLAT = A.uv('flat', 0.2, 0.8, 0.2, 0.8);

  // the floor: a line fitted to the ground along the building, lifted 0.58 m (the steps up from the street)
  const samples = []; for (let u = 0; u <= LEN; u += 8) samples.push([u, g(u, 12)]);
  const mu = samples.reduce((s, p) => s + p[0], 0) / samples.length, mg = samples.reduce((s, p) => s + p[1], 0) / samples.length;
  const slopeU = samples.reduce((s, p) => s + (p[0] - mu) * (p[1] - mg), 0) / samples.reduce((s, p) => s + (p[0] - mu) ** 2, 0);
  const fl0 = mg - slopeU * mu + 0.58, floorAt = (u) => fl0 + slopeU * u;
  const q05 = (v) => Math.round(v * 20) / 20;
  const floorOf = (m) => q05(floorAt((m[0] + m[1]) / 2));
  const lowest = (m) => Math.min(...[[m[0], m[2]], [m[1], m[2]], [m[0], m[3]], [m[1], m[3]], [(m[0] + m[1]) / 2, m[3]]].map(([u, v]) => g(u, v))) - 0.45;

  // ---- a wall: `cells` spread over the stretch a..b (left to right as seen from outside) of a face
  const wall = (side, a, b, c, y0, y1, cells) => {
    const n = cells.length;
    for (let i = 0; i < n; i++) {
      const s0 = a + (b - a) * i / n, s1 = a + (b - a) * (i + 1) / n;
      wallQ(W, side, s0, s1, c, y0, y1, A.uv(cells[i]));
    }
  };
  const rep = (name, n, alt) => Array.from({ length: n }, (_, i) => (alt && i % 2 ? alt : name));
  const plinthSkirt = (side, a, b, c, y0, ylow) => { W.setColor(COL.plinth); wallQ(W, side, a, b, c, ylow, y0 + 0.02, FLAT); W.setColor('#ffffff'); };
  const cornice = (m, y, d = 0.46, hh = 0.34, col = COL.cream) => {
    T.setColor(col);
    const [u0, u1, v0, v1] = m;
    T.box(u0 - d, y, v1, u1 + d, y + hh, v1 + d);       // street side
    T.box(u0 - d, y, v0 - d, u1 + d, y + hh, v0);       // track side
    T.box(u0 - d, y, v0, u0, y + hh, v1);               // NW end
    T.box(u1, y, v0, u1 + d, y + hh, v1);               // SE end
  };
  const prismFor = (m, y0, y1) => prism(S, F, [[m[0], m[2]], [m[1], m[2]], [m[1], m[3]], [m[0], m[3]]], y0, y1);
  const floors = {}, skirts = {};

  // a whole mass: the four faces, the skirt, the cornice, the collider; cells per face
  function mass(key, o) {
    const m = MASS[key], [u0, u1, v0, v1] = m;
    const yb = o.y0 ?? floorOf(m), Hm = o.H, ye = yb + Hm, low = o.skirt ?? lowest(m);
    floors[key] = yb; skirts[key] = low;
    W.setColor('#ffffff');
    if (o.f) wall('f', u0, u1, v1, yb, ye, o.f);
    if (o.b) wall('b', u1, u0, v0, yb, ye, o.b);
    if (o.l) wall('l', v1, v0, u0, yb, ye, o.l);
    if (o.r) wall('r', v0, v1, u1, yb, ye, o.r);
    if (!o.noSkirt) { plinthSkirt('f', u0, u1, v1, yb, low); plinthSkirt('b', u1, u0, v0, yb, low); plinthSkirt('l', v1, v0, u0, yb, low); plinthSkirt('r', v0, v1, u1, yb, low); }
    if (o.cornice !== false) cornice(m, ye, 0.6, 0.5);
    prismFor(m, low, ye + (o.rise ?? 0));
    return { yb, ye };
  }
  // the flat roof of a low mass: a bitumen deck
  const deck = (m, y) => { D.setColor(COL.deck); D.face([[m[0], y, m[2]], [m[1], y, m[2]], [m[1], y, m[3]], [m[0], y, m[3]]], [0, 1, 0]); };

  // ---------------------------------------------------------------- the NW wing
  const cellsF = {
    w1a: ['wB', 'wA', 'wB', 'wA', 'wB'], w1b: ['wA', 'wA'], w1c: ['wP', 'wP'], w1d: ['wA', 'wB'],
  };
  const back = (key, n, nm = 'bK') => Array.from({ length: n }, (_, i) => (nm === 'bK' && i % 4 === 2 ? 'bKd' : nm));
  const lens = (key) => { const m = MASS[key]; return [m[1] - m[0], m[3] - m[2]]; };
  const nb = (key) => Math.max(1, Math.round(lens(key)[0] / 3.6));
  const nv = (key) => Math.max(1, Math.round(lens(key)[1] / 3.6));
  const W1 = {};
  W1.a = mass('w1a', { H: HW, f: cellsF.w1a, b: back('w1a', nb('w1a')), l: rep('wE', nv('w1a'), 'wA'), r: rep('wBl', nv('w1a')) });
  W1.b = mass('w1b', { H: HW, f: cellsF.w1b, b: back('w1b', nb('w1b')), l: rep('wBl', nv('w1b')), r: rep('wBl', nv('w1b')) });
  W1.c = mass('w1c', { H: HW, f: cellsF.w1c, b: back('w1c', nb('w1c')), l: ['wE'], r: ['wE'] });
  W1.d = mass('w1d', { H: HW, f: cellsF.w1d, b: back('w1d', nb('w1d')), l: rep('wBl', nv('w1d')), r: rep('wBl', nv('w1d')) });
  // roofs: the end block, the long hip over the middle part, the front gable of the projecting bay
  const yW = (k) => W1[k].ye;
  hipRoof(B.roof, 0, 0, 18.4, 17.9, yW('a'), 6.0, { tw: 1.6, ov: 0.5 });
  hipRoof(B.roof, 18.4, -1.5, 42, 20.6, yW('b'), 6.8, { tw: 3.2, ov: 0.5 });
  gableRoof(B.roof, W, 25.2, 20.6, 34.1, 23.5, yW('c'), 3.6, { axis: 'v', ov: 0.5, tri: { f: [A.uv('gab')[0], A.uv('gab')[1], [(A.uv('gab')[2][0] + A.uv('gab')[3][0]) / 2, A.uv('gab')[2][1]]], b: [A.uv('flat')[0], A.uv('flat')[1], A.uv('flat')[2]] } });

  // ---------------------------------------------------------------- the connectors (flat roofs with balustrades)
  const C1 = mass('c1', { H: HL, f: rep('kW', nb('c1')), b: rep('kBack', nb('c1')), l: rep('kW', 4), r: rep('kW', 4), cornice: false });
  const C2 = mass('c2', { H: HL, f: rep('kW', nb('c2')), b: rep('kBack', nb('c2')), l: rep('kW', 4), r: rep('kW', 4), cornice: false });
  for (const [key, c] of [['c1', C1], ['c2', C2]]) {
    const m = MASS[key]; cornice(m, c.ye - 0.5, 0.4, 0.5); deck(m, c.ye + 0.02);
  }
  balustrade(BT, 'u', 42.4, 56.5, 14.3 + 0.12, C1.ye, { h: 1.0 });
  balustrade(BT, 'u', 76.5, 91.5, 14.3 + 0.12, C2.ye, { h: 1.0 });

  // ---------------------------------------------------------------- the central block
  const Dm = mass('d', {
    H: HC,
    f: ['cWin', 'cDoor', 'cClock', 'cBig', 'cTower', 'cWall'],
    b: back('d', nb('d')), l: rep('wBl', 2), r: rep('wBl', 2), rise: 3,
  });
  const yD = Dm.ye;
  hipRoof(B.roof, 56.5, 0.4, 76.5, 22.2, yD, 5.8, { tw: 3.2, ov: 0.4, topCol: '#7d7a76' });
  // the lantern over the hall: a low glazed box on the flat top
  { const lu = 66.5, lv = 11.2; D.setColor('#cfc8b6'); D.box(lu - 1.8, yD + 5.8, lv - 2.2, lu + 1.8, yD + 6.5, lv + 2.2);
    hipRoof(B.roof, lu - 1.8, lv - 2.2, lu + 1.8, lv + 2.2, yD + 6.5, 0.9, { tw: 0.4, ov: 0.15, topCol: '#7d7a76' }); }
  // pavilion (left) and tower (right): balustrade ring, pyramid roof
  balustrade(BT, 'u', 56.5, 76.5, 22.2 - 0.2, yD + 0.34, { h: 1.0 });
  balustrade(BT, 'v', 14.0, 22.2, 56.5 + 0.2, yD + 0.34, { h: 1.0 });
  balustrade(BT, 'v', 12.0, 22.2, 76.5 - 0.2, yD + 0.34, { h: 1.0 });
  hipRoof(B.roof, 56.9, 14.0, 62.2, 21.8, yD + 0.6, 4.8, { ov: 0.1, k: 1.2 });
  hipRoof(B.roof, 69.6, 12.0, 76.1, 21.8, yD + 0.6, 7.6, { ov: 0.1, k: 1.2 });
  D.setColor('#2e2f31'); spire(D, 59.55, yD + 5.4, 17.9, 1.3, 0.1, 0.02); spire(D, 72.85, yD + 8.2, 16.9, 1.8, 0.12, 0.02);
  // the dormer over the entrance: a gabled front with two lancets
  { const um = 64.5, hw = 2.6, y = yD + 0.34;
    W.setColor('#ffffff');
    wallQ(W, 'l', 21.2, 15.6, um - hw, y, y + 4.0, FLAT); wallQ(W, 'r', 15.6, 21.2, um + hw, y, y + 4.0, FLAT);
    const gu = A.uv('gab');
    gableRoof(B.roof, W, um - hw, 15.6, um + hw, 21.2, y + 4.0, 2.6, { axis: 'v', ov: 0.35, tri: { f: [gu[0], gu[1], [(gu[2][0] + gu[3][0]) / 2, gu[2][1]]], b: [A.uv('flat')[0], A.uv('flat')[1], A.uv('flat')[2]] } });
    wallQ(W, 'f', um - hw, um + hw, 21.2, y, y + 4.0, A.uv('gab', 0.0, 1, 0.0, 0.74));
  }

  // ---------------------------------------------------------------- the SE wing: ground floor + terrace, the upper floor set back
  const sGa = ['sa', 'sb', 'sc', 'sd'];
  const SG = {};
  const fcell = (key) => rep('sG', Math.max(1, Math.round(lens(key)[0] / 3.95)));
  for (const k of sGa) {
    SG[k] = mass(k, { H: HL, f: fcell(k), b: rep('kBack', nb(k)), l: rep('kW', Math.max(1, Math.round(lens(k)[1] / 3.6))), r: rep('kW', Math.max(1, Math.round(lens(k)[1] / 3.6))), cornice: false });
    cornice(MASS[k], SG[k].ye - 0.5, 0.4, 0.5); deck(MASS[k], SG[k].ye + 0.02);
  }
  const yS = SG.sa.ye;
  const SU = {};
  for (const k of ['su1', 'su2']) {
    const m = MASS[k], key = k === 'su1' ? 'sa' : 'sd';
    SU[k] = mass(k, { H: HU, y0: SG[key].ye, f: rep('sU', Math.max(1, Math.round(lens(k)[0] / 3.95))), b: rep('sU', nb(k)), l: rep('sU', 4), r: rep('sU', 4), skirt: SG[key].ye - 0.2, noSkirt: true });
    hipRoof(B.roof, m[0], m[2], m[1], m[3], SU[k].ye, 5.2, { tw: 2.4, ov: 0.45 });
  }
  const yT = yS + 0.02;
  balustrade(BT, 'u', 91.5, 99, 21.9 - 0.15, SG.sa.ye, { h: 1.0 });
  balustrade(BT, 'u', 99, 108.6, 24.8 - 0.15, SG.sb.ye, { h: 1.0 });
  balustrade(BT, 'v', 21.9, 24.8, 99 + 0.15, SG.sb.ye, { h: 1.0 });
  balustrade(BT, 'v', 21.8, 24.8, 108.6 - 0.15, SG.sb.ye, { h: 1.0 });
  balustrade(BT, 'u', 108.6, 115.2, 21.8 - 0.15, SG.sc.ye, { h: 1.0 });
  balustrade(BT, 'u', 115.2, 133.6, 19.2 - 0.15, SG.sd.ye, { h: 1.0 });
  balustrade(BT, 'v', 1.0, 19.2, 133.6 - 0.15, SG.sd.ye, { h: 1.0 });

  // ---------------------------------------------------------------- steps, sign, clock
  T.setColor('#b9b5ab');
  for (const [a, b] of [[60.2, 63.1], [63.2, 66.2], [66.9, 70.3]]) {
    const y = floors.d;
    T.box(a, y - 0.2, 22.2, b, y - 0.02, 23.0); T.box(a - 0.15, y - 0.5, 23.0, b + 0.15, y - 0.2, 23.6);
  }
  // the first-floor balconies: a projecting shelf along the string course and a balustrade under the windows
  { const y = floors.d + 5.55;
    T.setColor(COL.cream); T.box(57.0, y, 22.2, 76.0, y + 0.25, 22.7);
    balustrade(BT, 'u', 57.3, 75.7, 22.5, y + 0.25, { h: 0.8, post: 2.2, th: 0.2 }); }
  // the sign: a plate on the front over the left doors
  const yd = floors.d;
  D.setColor('#12306a'); D.box(59.1, yd + 8.7, 22.2, 65.7, yd + 10.35, 22.32);
  quad(B.sign, [59.15, yd + 8.75, 22.34], [65.65, yd + 8.75, 22.34], [65.65, yd + 10.3, 22.34], [59.15, yd + 10.3, 22.34], [0, 0, 1], sUV(SIGN.front));
  // the clock: a dial over the middle door, redrawn each game minute
  const cx0 = 64.75, cy0 = yd + 8.0, cr = 0.62;
  quad(B.clock, [cx0 - cr, cy0 - cr, 22.31], [cx0 + cr, cy0 - cr, 22.31], [cx0 + cr, cy0 + cr, 22.31], [cx0 - cr, cy0 + cr, 22.31], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);

  // ---------------------------------------------------------------- the track side: platform 1 and its canopy
  const yp = (u) => floorAt(u) - 0.04;
  const PU0 = -9, PU1 = 146, PV0 = -13.4, PV1 = 0.4;
  const platSet = [];
  for (let u = PU0; u < PU1; u += 8) platSet.push(u);
  const pushPlat = (u0, u1) => {
    const y0 = yp(u0), y1 = yp(u1), g0 = g(u0, PV0) - 0.3, g1 = g(u1, PV0) - 0.3;
    B.plat.setColor('#ffffff');
    quad(B.plat, [u0, y0, PV0], [u1, y1, PV0], [u1, y1, PV1], [u0, y0, PV1], [0, 1, 0], [[u0 / 2.4, PV0 / 2.4], [u1 / 2.4, PV0 / 2.4], [u1 / 2.4, PV1 / 2.4], [u0 / 2.4, PV1 / 2.4]]);
    // the edge, down to the ground
    B.plat.setColor('#c9c6bd');
    quad(B.plat, [u1, y1, PV0], [u0, y0, PV0], [u0, g0, PV0], [u1, g1, PV0], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]].map(([a, b]) => [a + u0 / 2.4, b * 0.4]));
    // the safety line
    D.setColor('#e6c21f'); quad(D, [u0, y0 + 0.012, PV0 + 1.15], [u1, y1 + 0.012, PV0 + 1.15], [u1, y1 + 0.012, PV0 + 1.3], [u0, y0 + 0.012, PV0 + 1.3], [0, 1, 0]);
  };
  for (let i = 0; i < platSet.length; i++) pushPlat(platSet[i], Math.min(PU1, platSet[i] + 8));
  { // the ends: ramps down to the ground
    B.plat.setColor('#bdbab1');
    for (const [uE, dir] of [[PU0, -1], [PU1, 1]]) {
      const y = yp(uE), gg = g(uE + dir * 6, -6);
      quad(B.plat, [uE, y, PV0], [uE, y, PV1], [uE + dir * 8, gg + 0.02, PV1], [uE + dir * 8, gg + 0.02, PV0], [dir * 0.2, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]].map(([a, b]) => [a * 3, b * 4]));
      quad(B.plat, [uE, y, PV0], [uE + dir * 8, gg, PV0], [uE + dir * 8, gg - 0.3, PV0], [uE, g(uE, PV0) - 0.3, PV0], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
  }
  { // the stair well down to the subway: a dark opening with railings, in the platform's middle
    const u = 71, y = yp(u);
    D.setColor('#101214'); D.box(u - 1.6, y + 0.005, -9.8, u + 1.6, y + 0.02, -5.4);
    D.setColor('#3d444c');
    for (const [a, b, c, d2] of [[u - 1.65, -9.8, u - 1.65, -5.3], [u + 1.65, -9.8, u + 1.65, -5.3], [u - 1.65, -9.85, u + 1.65, -9.85]]) {
      const len = Math.hypot(c - a, d2 - b), nP = Math.max(1, Math.round(len / 1.6)), x0 = Math.min(a, c) - 0.03, x1 = Math.max(a, c) + 0.03, z0 = Math.min(b, d2) - 0.03, z1 = Math.max(b, d2) + 0.03;
      D.box(x0, y + 0.95, z0, x1, y + 1.0, z1); D.box(x0, y + 0.5, z0, x1, y + 0.54, z1);
      for (let i = 0; i <= nP; i++) { const px = a + (c - a) * i / nP, pz = b + (d2 - b) * i / nP; D.box(px - 0.03, y, pz - 0.03, px + 0.03, y + 1.0, pz + 0.03); }
    }
  }
  // fence beyond the building's ends, on the city side of the platform
  D.setColor('#3d444c');
  for (const [a, b] of [[PU0 + 1, -0.1], [LEN + 0.5, PU1 - 1]]) {
    D.box(a, yp(a) + 0.95, PV1 - 0.04, b, yp(a) + 1.0, PV1 + 0.04);
    for (let u = a; u <= b; u += 2.4) D.box(u - 0.04, yp(u), PV1 - 0.04, u + 0.04, yp(u) + 1.0, PV1 + 0.04);
  }
  // the canopy: a sloping sheet roof from the wall over the platform on steel columns
  const CU0 = 6, CU1 = 128, CV = -7.4, nC = 16;
  {
    const yAt = (u) => yp(u) + 4.9, yEnd = (u) => yp(u) + 3.9;
    D.setColor('#4b5360');
    for (let i = 0; i < nC; i++) { // one panel between two columns
      const u0 = CU0 + (CU1 - CU0) * i / nC, u1 = CU0 + (CU1 - CU0) * (i + 1) / nC;
      const a = [u0, yAt(u0), 0.1], b = [u1, yAt(u1), 0.1], c = [u1, yEnd(u1), CV], d = [u0, yEnd(u0), CV];
      D.setColor('#5d6672'); quad(D, a, b, c, d, [0, 1, 0.12]);                       // the top
      D.setColor('#6a727c'); quad(D, a, d, c, b, [0, -1, -0.12]);                      // the underside
      D.setColor('#3b424a'); D.box(u0 - 0.05, yEnd(u0) - 0.45, CV - 0.02, u1 + 0.05, yEnd(u0) + 0.04, CV + 0.1); // fascia
    }
    const nCol = nC + 1;
    for (let i = 0; i < nCol; i++) {
      const u = CU0 + (CU1 - CU0) * i / nC, y = yp(u);
      D.setColor('#343b43'); D.box(u - 0.13, y, CV + 0.1 - 0.13, u + 0.13, yEnd(u) - 0.1, CV + 0.1 + 0.13);
      D.setColor('#4b5360'); D.box(u - 0.25, y, CV - 0.15, u + 0.25, y + 0.35, CV + 0.35);
      // the beam back to the wall
      D.setColor('#3b424a'); D.box(u - 0.07, yEnd(u) - 0.35, CV, u + 0.07, yEnd(u) - 0.05, 0.1);
    }
    // the big «ORADEA» sign on posts over the canopy
    const us = 57, ys = yEnd(us) + 0.25;
    D.setColor('#343b43'); D.box(us - 2.6, ys, CV + 0.4, us - 2.5, ys + 1.9, CV + 0.5); D.box(us + 2.5, ys, CV + 0.4, us + 2.6, ys + 1.9, CV + 0.5);
    D.setColor('#12306a'); D.box(us - 2.7, ys + 1.9, CV + 0.35, us + 2.7, ys + 3.05, CV + 0.46);
    quad(B.sign, [us + 2.65, ys + 1.95, CV + 0.34], [us - 2.65, ys + 1.95, CV + 0.34], [us - 2.65, ys + 3.0, CV + 0.34], [us + 2.65, ys + 3.0, CV + 0.34], [0, 0, -1], sUV(SIGN.plat));
  }
  S_canopy();
  function S_canopy() {
    const y0 = yp(CU0) + 3.4, y1 = yp(CU1) + 5.2;
    prism(S, F, [[CU0, -7.5], [CU1, -7.5], [CU1, 0.2], [CU0, 0.2]], y0, y1, 'awning', OVERHANG);
    for (let i = 0; i < nC + 1; i++) { const u = CU0 + (CU1 - CU0) * i / nC, [x, z] = F.toMap(u, CV + 0.1); S.cyl(x, z, yp(u) - 0.5, yp(u) + 3.9, 0.14, 0.14, 'pole'); }
  }
  // the platform itself: a sloped prism (the floor line)
  { const bx = slopeU * F.U[0], bz = slopeU * F.U[1], a = fl0 - 0.04 - bx * F.origin[0] - bz * F.origin[1];
    prism(S, F, [[PU0, PV0], [PU1, PV0], [PU1, PV1], [PU0, PV1]], Math.min(g(PU0, -6), g(PU1, -6)) - 0.6, a, 'wall', 0, bx, bz); }

  // ---------------------------------------------------------------- the forecourt
  const FRONT = [[0, 18.4, 17.9], [18.4, 25.2, 20.7], [25.2, 34.1, 23.5], [34.1, 42, 20.5], [42, 56.5, 14.3], [56.5, 76.5, 22.2], [76.5, 91.5, 14.3], [91.5, 99, 21.9], [99, 108.6, 24.8], [108.6, 115.2, 21.8], [115.2, 133.6, 19.2]];
  const gd = (u, v) => g(u, v) + 0.045;
  const strip = (D2, u0, u1, v0, v1, sc, col) => { // a draped quad, 2 x 2 samples
    const nu = Math.max(1, Math.ceil((u1 - u0) / 4)), nvv = Math.max(1, Math.ceil((v1 - v0) / 4));
    for (let i = 0; i < nu; i++) for (let j = 0; j < nvv; j++) {
      const a0 = u0 + (u1 - u0) * i / nu, a1 = u0 + (u1 - u0) * (i + 1) / nu, b0 = v0 + (v1 - v0) * j / nvv, b1 = v0 + (v1 - v0) * (j + 1) / nvv;
      if (col) D2.setColor(col);
      quad(D2, [a0, gd(a0, b0), b0], [a1, gd(a1, b0), b0], [a1, gd(a1, b1), b1], [a0, gd(a0, b1), b1], [0, 1, 0], [[a0 / sc, b0 / sc], [a1 / sc, b0 / sc], [a1 / sc, b1 / sc], [a0 / sc, b1 / sc]]);
    }
  };
  // the paved apron: 2.6 m along the wings, deeper in front of the entrance block, stopping at the street's asphalt
  { const toA = (u, v) => (onAsphalt ? onAsphalt(...F.toMap(u, v)) : false);
    const depthAt = (u) => (u >= 52 && u < 81 ? 5.2 : u >= 38 && u < 96 ? 3.4 : 2.6);
    for (const [u0, u1, v1] of FRONT) {
      const n = Math.max(1, Math.ceil((u1 - u0) / 2));
      for (let i = 0; i < n; i++) {
        const a0 = u0 + (u1 - u0) * i / n, a1 = u0 + (u1 - u0) * (i + 1) / n, uc = (a0 + a1) / 2, cap = depthAt(uc);
        let d = 0; while (d < cap && !toA(uc, v1 + d + 0.3)) d += 0.4;
        if (d > 0.5) strip(B.dec, a0, a1, v1 - 0.1, v1 + d, 2.4, '#ffffff');
      }
    }
  }

  // ---------------------------------------------------------------- lamps, benches, bollards
  const lamps = [];
  const post = (u, v, hgt = 7.5) => {
    const y = g(u, v);
    D.setColor('#4b5159'); D.cyl(u, y, v, 0.17, 0.11, hgt, 8, true);
    D.setColor('#3a3f45'); D.box(u - 0.08, y + hgt - 0.1, v - 1.0, u + 0.08, y + hgt + 0.02, v + 0.0);
    D.box(u - 0.08, y + hgt - 0.1, v, u + 0.08, y + hgt + 0.02, v + 1.0);
    B.glow.setColor('#fff2d0'); B.glow.box(u - 0.2, y + hgt - 0.16, v - 1.4, u + 0.2, y + hgt - 0.08, v - 0.8); B.glow.box(u - 0.2, y + hgt - 0.16, v + 0.8, u + 0.2, y + hgt - 0.08, v + 1.4);
    const [x, z] = F.toMap(u, v); S.cyl(x, z, y - 0.2, y + hgt, 0.16, 0.11, 'pole');
  };
  for (const u of [8, 26, 46, 82, 100, 118, 130]) { const f = FRONT.find(([a, b]) => u >= a && u < b); post(u, f[2] + 1.9, 7.8); }
  // old-style lanterns by the entrance: a cast-iron post with two glass globes
  const lantern = (u, v) => {
    const y = g(u, v);
    D.setColor('#26282a'); D.cyl(u, y, v, 0.16, 0.1, 0.5, 8).cyl(u, y + 0.5, v, 0.07, 0.05, 3.1, 8);
    D.box(u - 0.55, y + 3.45, v - 0.04, u + 0.55, y + 3.52, v + 0.04);
    for (const s of [-0.5, 0.5]) { D.cyl(u + s, y + 3.52, v, 0.06, 0.1, 0.2, 8); B.glow.setColor('#fff0cc'); B.glow.ellipsoid([u + s, y + 3.85, v], [0.2, 0.26, 0.2], 8, 5); }
    const [x, z] = F.toMap(u, v); S.cyl(x, z, y - 0.2, y + 3.6, 0.15, 0.09, 'pole');
  };
  lantern(63.7, 24.6); lantern(70.8, 24.6); lantern(57.5, 23.9);
  const bench = (u, v, rev = 1) => {
    const y = g(u, v);
    D.setColor('#6b4a2c'); for (let k = 0; k < 3; k++) D.box(u - 0.9, y + 0.43, v + rev * (0.04 + k * 0.14), u + 0.9, y + 0.47, v + rev * (0.15 + k * 0.14));
    D.box(u - 0.9, y + 0.62, v - rev * 0.02, u + 0.9, y + 0.88, v + rev * 0.02);
    D.setColor('#2a2d30'); for (const s of [-0.75, 0.75]) D.box(u + s - 0.04, y, v - 0.04, u + s + 0.04, y + 0.45, v + rev * 0.5);
    const [x, z] = F.toMap(u, v); S.obox(x, z, 1.0, 0.4, -F.ang, y, y + 0.5, 'bench');
  };
  for (const u of [10, 28, 38, 100, 124]) { const f = FRONT.find(([a, b]) => u >= a && u < b); bench(u, f[2] + 1.0, 1); }
  // bollards along the apron edge in front of the entrance
  D.setColor('#2d2f31');
  for (let u = 57; u <= 76; u += 2.9) { const y = g(u, 25.6); D.cyl(u, y, 25.6, 0.1, 0.1, 0.8, 8); const [x, z] = F.toMap(u, 25.6); S.cyl(x, z, y, y + 0.8, 0.1, 0.1, 'pole'); }
  // the taxi and parking signs
  { const sgn = (u, v, key) => { const y = g(u, v); D.setColor('#767b80'); D.cyl(u, y, v, 0.05, 0.05, 2.5, 6);
      quad(B.sign, [u + 0.4, y + 1.7, v - 0.04], [u - 0.4, y + 1.7, v - 0.04], [u - 0.4, y + 2.5, v - 0.04], [u + 0.4, y + 2.5, v - 0.04], [0, 0, -1], sUV(SIGN[key]));
      quad(B.sign, [u - 0.4, y + 1.7, v + 0.04], [u + 0.4, y + 1.7, v + 0.04], [u + 0.4, y + 2.5, v + 0.04], [u - 0.4, y + 2.5, v + 0.04], [0, 0, 1], sUV(SIGN[key])); };
    sgn(46.5, 17.4, 'taxi'); sgn(86.5, 17.4, 'park'); }

  // ---------------------------------------------------------------- the tram stop across the street
  const tram = tramStop();
  function tramStop() {
    // the pair of tracks in front: the platform on the far (city) side of the nearer one, 2.6 m wide
    const ways = (map?.trams ?? []).filter((w) => { for (let i = 0; i < w.p.length; i += 2) { const [u, v] = F.toLocal(w.p[i], w.p[i + 1]); if (u > -55 && u < 15 && v > 25 && v < 60) return true; } return false; });
    if (!ways.length) return null;
    let best = null;
    for (const w of ways) for (let i = 2; i < w.p.length; i += 2) {
      const [ua, va] = F.toLocal(w.p[i - 2], w.p[i - 1]), [ub, vb] = F.toLocal(w.p[i], w.p[i + 1]);
      if (Math.max(ua, ub) < -55 || Math.min(ua, ub) > 15 || Math.abs(ub - ua) < 3) continue;
      const vm = (va + vb) / 2; if (!best || vm > best.vm) best = { ua, va, ub, vb, vm };
    }
    if (!best) return null;
    const { ua, va, ub, vb } = best, du = ub - ua, dv = vb - va, L = Math.hypot(du, dv), tu = du / L, tv = dv / L, nu = -tv, nv_ = tu; // normal toward +v
    const off0 = 1.55, off1 = 4.2;
    const s0 = (-46 - ua) / (du || 1) * L, s1 = Math.min(L, s0 + 36);
    const P = (s, o) => [ua + tu * s + nu * o, va + tv * s + nv_ * o];
    const out = [];
    const n = Math.ceil((s1 - Math.max(0, s0)) / 6);
    for (let i = 0; i < n; i++) {
      const sa = Math.max(0, s0) + (s1 - Math.max(0, s0)) * i / n, sb = Math.max(0, s0) + (s1 - Math.max(0, s0)) * (i + 1) / n;
      const a0 = P(sa, off0), a1 = P(sb, off0), b1 = P(sb, off1), b0 = P(sa, off1);
      const yy = (p) => g(p[0], p[1]) + 0.22;
      B.plat.setColor('#ffffff');
      quad(B.plat, [a0[0], yy(a0), a0[1]], [a1[0], yy(a1), a1[1]], [b1[0], yy(b1), b1[1]], [b0[0], yy(b0), b0[1]], [0, 1, 0], [[sa / 2.4, 0], [sb / 2.4, 0], [sb / 2.4, 1], [sa / 2.4, 1]]);
      B.plat.setColor('#bdbab1');
      quad(B.plat, [a1[0], yy(a1), a1[1]], [a0[0], yy(a0), a0[1]], [a0[0], g(a0[0], a0[1]) - 0.1, a0[1]], [a1[0], g(a1[0], a1[1]) - 0.1, a1[1]], [-nu, 0, -nv_], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      D.setColor('#e6c21f'); const c0 = P(sa, off0 + 0.15), c1 = P(sb, off0 + 0.15), c2 = P(sb, off0 + 0.45), c3 = P(sa, off0 + 0.45);
      quad(D, [c0[0], yy(c0) + 0.012, c0[1]], [c1[0], yy(c1) + 0.012, c1[1]], [c2[0], yy(c2) + 0.012, c2[1]], [c3[0], yy(c3) + 0.012, c3[1]], [0, 1, 0]);
      out.push([a0, a1, b1, b0]);
    }
    // a glass shelter in the middle of the platform, a bench and a lamp
    const mid = Math.max(0, s0) + (s1 - Math.max(0, s0)) / 2, [mu, mv] = P(mid, 3.2), ym = g(mu, mv) + 0.22, ang = Math.atan2(tv, tu);
    const rot = (du2, dv2) => [mu + du2 * Math.cos(ang) - dv2 * Math.sin(ang), mv + du2 * Math.sin(ang) + dv2 * Math.cos(ang)];
    D.setColor('#3d444c');
    for (const [a, b] of [[-2.8, -0.9], [2.8, -0.9], [-2.8, 0.9], [2.8, 0.9]]) { const [pu, pv] = rot(a, b); D.cyl(pu, ym, pv, 0.06, 0.06, 2.6, 6); }
    const poly = [[-3.1, -1.2], [3.1, -1.2], [3.1, 1.2], [-3.1, 1.2]].map(([a, b]) => rot(a, b));
    D.setColor('#6f757c'); D.face(poly.map(([a, b]) => [a, ym + 2.62, b]), [0, 1, 0]); D.face(poly.slice().reverse().map(([a, b]) => [a, ym + 2.58, b]), [0, -1, 0]);
    const gb = [[-2.8, 1.0], [2.8, 1.0]].map(([a, b]) => rot(a, b));
    B.glass.setColor('#aebfca');
    quad(B.glass, [gb[0][0], ym + 0.1, gb[0][1]], [gb[1][0], ym + 0.1, gb[1][1]], [gb[1][0], ym + 2.5, gb[1][1]], [gb[0][0], ym + 2.5, gb[0][1]], [-nu, 0, -nv_], [[0, 0], [4, 0], [4, 2], [0, 2]]);
    B.glass.setColor('#aebfca');
    quad(B.glass, [gb[1][0], ym + 0.1, gb[1][1]], [gb[0][0], ym + 0.1, gb[0][1]], [gb[0][0], ym + 2.5, gb[0][1]], [gb[1][0], ym + 2.5, gb[1][1]], [nu, 0, nv_], [[0, 0], [4, 0], [4, 2], [0, 2]]);
    return out.length ? { mu, mv } : null;
  }

  // ---------------------------------------------------------------- materials and meshes
  const wallMap = A.tex(), wallMask = A.maskTex();
  const warm = new THREE.Color('#ffd9a8');
  const pane = glassTex();
  const clockTex = canvasTex(256, 256, (g2) => paintClock(g2, 10 + 10 / 60), { repeat: false });
  const sTex = signTex();
  const M = {
    wall: new THREE.MeshStandardMaterial({ map: wallMap, vertexColors: true, roughness: 0.9, emissive: warm, emissiveMap: wallMask, emissiveIntensity: 0 }),
    trim: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }),
    roof: new THREE.MeshStandardMaterial({ map: tileTex(r), vertexColors: true, roughness: 0.82, side: THREE.DoubleSide }),
    bal: new THREE.MeshStandardMaterial({ map: balTex(), vertexColors: true, roughness: 0.85, alphaTest: 0.5, side: THREE.DoubleSide }),
    det: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.25, side: THREE.DoubleSide }),
    glass: new THREE.MeshStandardMaterial({ map: pane, vertexColors: true, roughness: 0.1, metalness: 0.4, transparent: true, opacity: 0.55, side: THREE.DoubleSide, emissive: warm, emissiveIntensity: 0 }),
    sign: new THREE.MeshStandardMaterial({ map: sTex, roughness: 0.5, metalness: 0.2, emissive: 0xffffff, emissiveMap: sTex, emissiveIntensity: 0, side: THREE.DoubleSide }),
    clock: new THREE.MeshStandardMaterial({ map: clockTex, roughness: 0.4, emissive: 0xfff2d0, emissiveMap: clockTex, emissiveIntensity: 0, transparent: true, alphaTest: 0.3 }),
    plat: new THREE.MeshStandardMaterial({ map: platTex(r), vertexColors: true, roughness: 0.93 }),
    glow: new THREE.MeshStandardMaterial({ color: 0xf6f0e2, roughness: 0.3, emissive: 0xffe2b0, emissiveIntensity: 0.05 }),
    dec: decal(new THREE.MeshStandardMaterial({ map: paveTex(r), vertexColors: true, roughness: 0.88, polygonOffset: true, polygonOffsetFactor: -4 })),
  };
  const out = finish(root, 'gara', B, M, { shade: ['wall', 'roof', 'trim', 'det', 'plat', 'bal'] });
  out.group.traverse((o) => { if (o.isMesh && (o.name === 'gara-dec')) o.receiveShadow = true; });

  // ---------------------------------------------------------------- footprints, clear, update
  const ring = []; for (let i = 0; i < ring0.p.length; i += 2) ring.push([ring0.p[i], ring0.p[i + 1]]);
  const clearRects = [[-14, 150, -16, 31]];
  const cam = new THREE.Vector3();
  let lastMin = -1;
  console.log(`[oradea] Gara Oradea: floor ${fl0.toFixed(2)} m + ${slopeU.toFixed(4)}/m, ${(out.verts / 1000).toFixed(1)}k verts, ${out.meshes} meshes, ${S.count - n0} solids in ${(performance.now() - t0).toFixed(0)} ms`);
  return {
    footprints: [{ poly: ring, h: 16, kind: 'public', name: 'Gara Oradea', id: OSM_ID }],
    clear(x, z) { const [u, v] = F.toLocal(x, z); return clearRects.some(([a, b, c, d]) => u > a && u < b && v > c && v < d) || (tram != null && Math.hypot(x - F.toMap(tram.mu, tram.mv)[0], z - F.toMap(tram.mu, tram.mv)[1]) < 14); },
    update(dt, camera) {
      const k = nightK.value, e = Math.min(1, 3 * k);
      M.wall.emissiveIntensity = 0.95 * k;
      M.glass.emissiveIntensity = 0.7 * k; M.sign.emissiveIntensity = 0.55 * e; M.clock.emissiveIntensity = 0.5 * e;
      M.glow.emissiveIntensity = 0.05 + 2.4 * e;
      if (camera) {
        camera.getWorldPosition(cam);
        const [cu, cv] = F.toLocal(cam.x, cam.z);
        if (cu > -150 && cu < 300 && cv > -120 && cv < 150) {
          const d = getDaylight(); const min = d ? Math.floor(d.state.hours * 60) : -1;
          if (d && min !== lastMin) { lastMin = min; const cv2 = clockTex.image; paintClock(cv2.getContext('2d'), d.state.hours); clockTex.needsUpdate = true; }
        }
      }
    },
    stats: { verts: out.verts, meshes: out.meshes, floor: fl0, slope: slopeU },
  };
}
