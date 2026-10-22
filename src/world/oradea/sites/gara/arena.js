// OWNER: oradea. Sala Polivalentă Oradea Arena (Oradea Arena, str. Traian Blajovici 24; OSM way 998980470), the 5,300-seat hall
// opened on 20 April 2022 (Adest Architecture, built by Construcții Erbașu; not the old Arena Antonio Alexe on Calea Cazaban).
// Built after the Wikimedia Commons photos, the sport.ro gallery, the OSM outline and the Esri ortho photo; the heights are
// estimates read off those photos:
//   a 101.5 x 83.3 m box on a grey concrete podium (5.7 m, a row of small windows), clad in a random chequerboard of four
//   greys (1.5 x 0.6 m panels) under a flat roof, a dark louvred ribbon window along the long walls, a glazed foyer band by
//   the east end of the south wall. The front faces west: a 11 m tall glass curtain wall under a huge black canopy that
//   cantilevers 11 m over the terrace, wide concrete stairs down to the plaza (painted «ORadea», dark pavers), and a glazed
//   wedge in each side wall under the cladding. The lower east annex holds the services; a teal generator stands at the foot of
//   the south stair wall.
// The frame: u west to east along the long walls (the OSM ring's first edge), v north to south; y is metres over the ground.
//   buildArena({ root, S, H, map, onAsphalt }) -> { footprints, clear(x, z), update(dt, camera), stats } | null
import * as THREE from 'three';
import { nightK } from '../../../../render/daylight.js';
import { OVERHANG } from '../../../collision.js';
import { M4 } from '../../../../kit/mesh.js';
import { canvasTex, decal } from '../../../cherkasy/sculpt.js';
import { finish, quad } from '../../../cherkasy/slabkit.js';
import { rng } from '../../../cherkasy/geo.js';
import { localFrame, newSet, prism, speckle } from './kit.js';

export const OSM_ID = 998980470;
export const ARENA_FRAME = { origin: [-540.7, 1447.7], ang: Math.atan2(-33.1, 95.9) };

const LX = 101.5, LV = 83.3;                       // the main box (the OSM ring, local u x v)
const AX0 = LX, AX1 = 126.2, AV0 = 18.7, AV1 = 64.7; // the east annex
const HP = 5.7, HT = 24.4, HA = 12.4;              // podium (the concourse deck), the roof, the annex roof
const GU = 11, GY = 17.3, TY = 23.5;               // the glass line, its top, the canopy's lower edge at the tip
const STAIR = { v0: 28, v1: 80, p: [[7, HP], [-0.5, 2.9], [-3.5, 2.9], [-11, 0]] }; // the stair's profile in (u, y), the landing in the middle
const TONES = ['#ecebe5', '#c4c2bc', '#9b9a96', '#6e6d6a'], TONE_P = [0.40, 0.30, 0.20, 0.10];

// ------------------------------------------------------------------------------------------------ textures
function chequerTex(r) { // 48 x 24 m of random panels: 32 x 32 cells of 1.5 x 0.75 m, runs of one to four cells
  const CW = 48, CH = 24, N = 32;
  const tone = (avoid) => { for (let k = 0; k < 8; k++) { let x = r(), t = 0; while (t < 3 && x > TONE_P[t]) { x -= TONE_P[t]; t++; } if (!avoid.includes(t)) return t; } return (avoid[0] + 1) % 4; };
  const grid = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let j = 0; j < N; j++) {
    let i = 0, prev = -1;
    while (i < N) {
      const run = Math.min(N - i, [1, 1, 2, 2, 3, 3, 4][(r() * 7) | 0]);
      const t = tone([prev, j > 0 ? grid[j - 1][i] : -1]);
      for (let k = 0; k < run; k++) grid[j][i + k] = t;
      prev = t; i += run;
    }
  }
  return canvasTex(CW * N, CH * N, (g) => {
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const jv = (r() - 0.5) * 7; g.fillStyle = TONES[grid[j][i]]; g.fillRect(i * CW, (N - 1 - j) * CH, CW, CH);
      g.fillStyle = `rgba(${jv > 0 ? '255,255,255' : '0,0,0'},${Math.abs(jv) / 60})`; g.fillRect(i * CW, (N - 1 - j) * CH, CW, CH);
      g.fillStyle = 'rgba(30,30,30,0.28)'; g.fillRect(i * CW, (N - 1 - j) * CH, CW, 1.5); g.fillRect(i * CW, (N - 1 - j) * CH, 1.5, CH);
    }
  });
}
const podiumTex = (r) => canvasTex(256, 352, (g, w, h) => { // 4.2 x 5.8 m of board-marked concrete with one small window, a row of them on the long walls
  g.fillStyle = '#9b9c9a'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 26) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},0.035)`; g.fillRect(0, y, w, 26); g.fillStyle = 'rgba(0,0,0,0.07)'; g.fillRect(0, y, w, 1); }
  speckle(g, w, h, r, 700, 0.08);
  g.fillStyle = 'rgba(20,20,20,0.35)'; g.fillRect(0, 0, 2, h); g.fillRect(0, h * 0.5, w, 2);
  const wx = w * 0.3, wy = h - 3.9 / 5.8 * h, ww = w * 0.4, wh = 1.3 / 5.8 * h;
  g.fillStyle = '#1b2127'; g.fillRect(wx, wy, ww, wh); g.fillStyle = 'rgba(160,190,205,0.22)'; g.fillRect(wx, wy, ww * 0.5, wh * 0.5);
  g.strokeStyle = '#74777a'; g.lineWidth = 3; g.strokeRect(wx, wy, ww, wh);
});
const glassTex = (mask) => canvasTex(192, 372, (g, w, h) => { // 6 x 11.6 m: four 1.5 m bays, transoms at 3.2 and every 2.8 m, doors in two bays of the bottom row
  const PX = 32, lines = [0, 3.2, 6.0, 8.8, 11.6];
  g.fillStyle = mask ? '#000' : '#4a606c'; g.fillRect(0, 0, w, h);
  if (!mask) {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#5b7584'); gr.addColorStop(0.5, '#a3bac6'); gr.addColorStop(1, '#46606e'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(230,240,245,0.10)'; g.beginPath(); g.moveTo(0, h); g.lineTo(w * 0.4, h); g.lineTo(w, h * 0.2); g.lineTo(w, 0); g.lineTo(w * 0.6, 0); g.lineTo(0, h * 0.7); g.closePath(); g.fill();
  } else {
    const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#ffe0a8'); gr.addColorStop(1, '#8a6a4a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }
  const Y = (m) => h - m * PX;
  for (const i of [0, 2]) { // doors in bays 0 and 2
    if (mask) continue;
    g.fillStyle = '#141b20'; g.fillRect(i * 48 + 5, Y(3.1), 38, 3.1 * PX); g.strokeStyle = '#d9dcdd'; g.lineWidth = 3; g.strokeRect(i * 48 + 5, Y(3.1), 38, 3.1 * PX);
    g.beginPath(); g.moveTo(i * 48 + 24, Y(3.1)); g.lineTo(i * 48 + 24, h); g.stroke();
  }
  g.fillStyle = mask ? '#000' : '#cfd3d5';
  for (const y of lines) g.fillRect(0, Y(y) - 2, w, 4);
  for (let k = 0; k <= 4; k++) g.fillRect(k * 48 - 2, 0, 4, h);
});
const louvreTex = () => canvasTex(288, 166, (g, w, h) => { // 4.5 x 2.6 m: dark slats between pale frames
  g.fillStyle = '#26292c'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 10) { g.fillStyle = '#3c4044'; g.fillRect(6, y, w - 12, 4); g.fillStyle = '#16181a'; g.fillRect(6, y + 4, w - 12, 3); }
  g.fillStyle = '#8c9094'; g.fillRect(0, 0, 6, h); g.fillRect(w - 6, 0, 6, h); g.fillRect(0, 0, w, 5); g.fillRect(0, h - 5, w, 5);
});
const roofTex = (r) => canvasTex(128, 128, (g, w, h) => { // 4 m of beige membrane with seams every metre
  g.fillStyle = '#d3c6ab'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(120,105,80,0.38)'; for (let i = 0; i < 4; i++) g.fillRect(i * 32, 0, 1.5, h);
  speckle(g, w, h, r, 500, 0.06);
});
const paveTex = (r) => canvasTex(256, 256, (g, w, h) => { // 2.4 m of 0.6 x 1.2 m slabs in running bond; the vertex colour sets the tone
  g.fillStyle = '#cfcfcf'; g.fillRect(0, 0, w, h);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) { const v = 232 + (r() - 0.5) * 22, o = (j % 2) * 64; g.fillStyle = `rgb(${v | 0},${v | 0},${(v + 2) | 0})`; g.fillRect(((i * 128 + o) % 256) + 1.5, j * 64 + 1.5, 125, 61); }
  speckle(g, w, h, r, 700, 0.07);
});
const stairTex = () => canvasTex(64, 64, (g, w, h) => { // one step: a pale nosing, the tread, a shadow under the next riser
  g.fillStyle = '#b9bab7'; g.fillRect(0, 0, w, h); g.fillStyle = '#d9d9d6'; g.fillRect(0, 0, w, 9); g.fillStyle = '#8c8d8b'; g.fillRect(0, h - 12, w, 12); g.fillStyle = '#6f706e'; g.fillRect(0, h - 3, w, 3);
});
const lettersTex = () => canvasTex(1024, 512, (g, w) => { // the plaza's white graphics: «ORadea» over 26 x 8.2 m (the top 320 px), a swoosh under it
  g.clearRect(0, 0, w, 512);
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = 'bold 250px "Arial", "Helvetica", sans-serif'; g.fillText('ORadea', w / 2, 166);
  g.beginPath(); g.moveTo(10, 440); g.bezierCurveTo(w * 0.2, 340, w * 0.45, 500, w * 0.62, 410); g.bezierCurveTo(w * 0.75, 345, w * 0.88, 380, w - 10, 420);
  g.bezierCurveTo(w * 0.85, 440, w * 0.78, 455, w * 0.66, 470); g.bezierCurveTo(w * 0.5, 505, w * 0.28, 420, w * 0.12, 490); g.closePath(); g.fill();
}, { repeat: false });

// a polygon (a fan) with a flat normal and uv from a function of the point; the winding follows n
function poly(D, pts, n, uvf) {
  let nx = 0, ny = 0, nz = 0;
  pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; nx += (p[1] - q[1]) * (p[2] + q[2]); ny += (p[2] - q[2]) * (p[0] + q[0]); nz += (p[0] - q[0]) * (p[1] + q[1]); });
  const back = nx * n[0] + ny * n[1] + nz * n[2] < 0, ids = pts.map((p) => D.vert(p[0], p[1], p[2], n[0], n[1], n[2], ...uvf(p)));
  for (let i = 2; i < pts.length; i++) back ? D.tri(ids[0], ids[i], ids[i - 1]) : D.tri(ids[0], ids[i - 1], ids[i]);
}

// ------------------------------------------------------------------------------------------------ the build
export function buildArena({ root, S, H, map, onAsphalt = null }) {
  const ring0 = map?.buildings?.find((b) => b.id === OSM_ID);
  if (map?.buildings && !ring0) return null;
  const t0 = performance.now(), r = rng(2022), n0 = S.count;
  const F0 = localFrame(ARENA_FRAME.origin, ARENA_FRAME.ang);
  const Y0 = (() => { const [x, z] = F0.toMap(LX / 2, LV / 2); const h = H(x, z); return Number.isFinite(h) ? h : 0; })();
  const F = { ...F0, xf: () => M4(F0.origin[0], Y0, F0.origin[1], -F0.ang) }; // local y is metres over the ground
  const B = newSet(F, 'clad', 'conc', 'glass', 'blk', 'det', 'roof', 'lou', 'stair', 'dec', 'lett', 'glow');
  const { clad: CL, conc: CO, glass: GL, blk: BK, det: D, roof: RF, lou: LO, stair: ST, dec: DC, glow: GW } = B;
  const pr = (ringUV, y0, y1, kind, flags, bx = 0, bz = 0) => prism(S, F, ringUV, Y0 + y0, Y0 + y1, kind, flags, bx, bz);
  const rect = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  const [cu, su] = [Math.cos(F.ang), Math.sin(F.ang)];
  // a sloped top in local u: y(u) = yA + k (u - uA); the prism wants a map-plane gradient and an intercept (the frame's y is Y0)
  const slopedPrism = (u0, u1, v0, v1, uA, yA, k) => { const bx = k * cu, bz = k * su; pr(rect(u0, u1, v0, v1), -1.2, Y0 + yA - bx * F.origin[0] - bz * F.origin[1] - k * uA - Y0, 'wall', 0, bx, bz); };
  // a wall quad with the uv in metres: ks across, ky up, an offset
  const sq = (D2, side, a, b, c, y0, y1, ks, ky, off = 0, yo = 0) => quad(D2, ...(side === 'f' || side === 'b' ? [[a, y0, c], [b, y0, c], [b, y1, c], [a, y1, c]] : [[c, y0, a], [c, y0, b], [c, y1, b], [c, y1, a]]),
    side === 'f' ? [0, 0, 1] : side === 'b' ? [0, 0, -1] : side === 'l' ? [-1, 0, 0] : [1, 0, 0], [[a / ks + off, (y0 - yo) / ky], [b / ks + off, (y0 - yo) / ky], [b / ks + off, (y1 - yo) / ky], [a / ks + off, (y1 - yo) / ky]]);

  // ---- the podium: concrete walls to the deck
  CO.setColor('#ffffff');
  sq(CO, 'f', 0, LX, LV, -0.3, HP, 4.2, 5.8, 0, -0.3); sq(CO, 'b', LX, 0, 0, -0.3, HP, 4.2, 5.8, 0.2, -0.3);
  sq(CO, 'r', 0, 18.7, LX, -0.3, HP, 4.2, 5.8, 0.4, -0.3); sq(CO, 'r', AV1, LV, LX, -0.3, HP, 4.2, 5.8, 0.4, -0.3);
  sq(CO, 'l', LV, STAIR.v1, 0, -0.3, HP, 4.2, 5.8, 0, -0.3);
  // the north bay of the front is an open concrete frame: round columns, a slab at mid height, a dark wall set back under the deck
  D.setColor('#383b3f'); D.face([[8, -0.3, 0.1], [8, -0.3, STAIR.v0], [8, HP - 0.5, STAIR.v0], [8, HP - 0.5, 0.1]], [-1, 0, 0]);
  D.setColor('#a9abaa'); D.box(0.6, HP - 0.5, 0.1, 9, HP, STAIR.v0); D.box(1.4, 2.7, 0.1, 8, 3.2, STAIR.v0);
  for (const v of [1.6, 7.6, 13.6, 19.6, 25.6, STAIR.v0 - 0.6]) { D.cyl(1.2, -0.3, v, 0.42, 0.42, HP - 0.2, 10, false); D.cyl(1.2, 2.7, v, 0.5, 0.5, 0.5, 10, true); }
  // the annex: concrete to the deck, cladding above it
  sq(CO, 'b', AX1, AX0, AV0, -0.3, HP, 4.2, 5.8, 0.1, -0.3); sq(CO, 'f', AX0, AX1, AV1, -0.3, HP, 4.2, 5.8, 0.6, -0.3); sq(CO, 'r', AV0, AV1, AX1, -0.3, HP, 4.2, 5.8, 0.3, -0.3);
  // the deck's fascia line, a dark band along the foot of the cladding
  D.setColor('#4a4d51'); D.box(-0.02, HP - 0.2, -0.12, LX, HP + 0.15, 0.02); D.box(-0.02, HP - 0.2, LV - 0.02, LX, HP + 0.15, LV + 0.12);

  // ---- the cladding: the long walls (a glazed wedge cut into the front end), the east wall, the annex
  const CLW = 48, CLH = 24;
  const cladPoly = (side, pts, off) => poly(CL, pts, side === 'f' ? [0, 0, 1] : [0, 0, -1], (p) => [p[0] / CLW + off, (p[1] - HP) / CLH]);
  CL.setColor('#ffffff');
  for (const [side, c, off] of [['f', LV, 0], ['b', 0, 0.29]]) cladPoly(side, [[GU, GY, c], [26, HP, c], [LX, HP, c], [LX, HT, c], [GU, HT, c]], off);
  sq(CL, 'r', 0, AV0, LX, HP, HT, CLW, CLH, 0.6, HP); sq(CL, 'r', AV1, LV, LX, HP, HT, CLW, CLH, 0.15, HP); sq(CL, 'r', AV0, AV1, LX, HA, HT, CLW, CLH, 0.35, HP);
  sq(CL, 'b', AX1, AX0, AV0, HP, HA, CLW, CLH, 0.5, HP); sq(CL, 'f', AX0, AX1, AV1, HP, HA, CLW, CLH, 0.2, HP); sq(CL, 'r', AV0, AV1, AX1, HP, HA, CLW, CLH, 0.7, HP);
  // louvred ribbon windows and the small squares by the east end
  for (const [side, c, sgn] of [['f', LV, 1], ['b', 0, -1]]) {
    const cc = c + sgn * 0.07, a = side === 'f' ? 36 : 86, b = side === 'f' ? 86 : 36;
    quad(LO, [a, HP + 8.6, cc], [b, HP + 8.6, cc], [b, HP + 10.8, cc], [a, HP + 10.8, cc], [0, 0, sgn], [[a / 4.5, 0], [b / 4.5, 0], [b / 4.5, 0.85], [a / 4.5, 0.85]]);
    for (const y of [3.2, 6.2, 9.2]) { const x0 = side === 'f' ? 95.5 : 97.4, x1 = x0 + 1.9; quad(LO, [x0, HP + y, cc], [x1, HP + y, cc], [x1, HP + y + 1.5, cc], [x0, HP + y + 1.5, cc], [0, 0, sgn], [[0, 0], [0.4, 0], [0.4, 0.6], [0, 0.6]]); }
  }
  // the foyer band by the east end of the north wall (the long wall seen from the Piața roundabout in the photos): glass on the cladding
  GL.setColor('#ffffff');
  quad(GL, [66, HP + 0.4, -0.1], [97, HP + 0.4, -0.1], [97, HP + 3.2, -0.1], [66, HP + 3.2, -0.1], [0, 0, -1], [[66 / 6, 0.276], [97 / 6, 0.276], [97 / 6, 0.517], [66 / 6, 0.517]]);

  // ---- the roof: one flat membrane over the box and the canopy, a coping line, plant on the annex roof
  quad(RF, [0, HT, 0], [LX, HT, 0], [LX, HT, LV], [0, HT, LV], [0, 1, 0], [[0, 0], [LX / 4, 0], [LX / 4, LV / 4], [0, LV / 4]]);
  RF.setColor('#ffffff'); quad(RF, [AX0, HA, AV0], [AX1, HA, AV0], [AX1, HA, AV1], [AX0, HA, AV1], [0, 1, 0], [[0, 0], [25 / 4, 0], [25 / 4, 12], [0, 12]]);
  D.setColor('#6c6e72'); D.box(-0.05, HT - 0.02, -0.12, LX + 0.1, HT + 0.4, 0.1); D.box(-0.05, HT - 0.02, LV - 0.1, LX + 0.1, HT + 0.4, LV + 0.12); D.box(LX - 0.1, HT - 0.02, 0, LX + 0.12, HT + 0.4, LV);
  D.box(AX0, HA - 0.02, AV0 - 0.1, AX1 + 0.1, HA + 0.5, AV0 + 0.1); D.box(AX0, HA - 0.02, AV1 - 0.1, AX1 + 0.1, HA + 0.5, AV1 + 0.1); D.box(AX1 - 0.1, HA - 0.02, AV0, AX1 + 0.12, HA + 0.5, AV1);
  D.setColor('#a9adb1'); for (const [x, z, w, d, h] of [[108, 30, 5, 3, 1.6], [114, 44, 6, 3.2, 2.0], [118, 54, 4, 3, 1.3], [22, 12, 4, 2.2, 1.2], [40, 70, 5, 2.4, 1.4], [78, 18, 4.4, 2.2, 1.3]]) D.box(x, (x > 100 ? HA : HT), z, x + w, (x > 100 ? HA : HT) + h, z + d);
  D.setColor('#2a2c2f'); D.box(26, HT, 16, 70, HT + 0.5, 19); // the louvre strip on the roof

  // ---- the front: the glass wall, the interior behind it, the canopy
  GL.setColor('#ffffff');
  quad(GL, [GU, HP, LV], [GU, HP, 0], [GU, GY, 0], [GU, GY, LV], [-1, 0, 0], [[LV / 6, 0], [0, 0], [0, 1], [LV / 6, 1]]);
  for (const [c, n] of [[0, [0, 0, -1]], [LV, [0, 0, 1]]]) poly(GL, [[GU, HP, c], [26, HP, c], [GU, GY, c]], n, (p) => [p[0] / 6, (p[1] - HP) / 11.6]);
  // inside: polished floor, white columns, a dark back wall with red panels, a lit ceiling
  D.setColor('#c1b19b'); D.face([[GU, HP + 0.01, 0.2], [27, HP + 0.01, 0.2], [27, HP + 0.01, LV - 0.2], [GU, HP + 0.01, LV - 0.2]], [0, 1, 0]);
  D.setColor('#2f3236'); D.face([[27, HP, 0.2], [27, HP, LV - 0.2], [27, GY, LV - 0.2], [27, GY, 0.2]], [-1, 0, 0]);
  D.setColor('#a8242b'); for (let v = 8; v < LV - 12; v += 18) D.face([[26.95, HP + 0.2, v], [26.95, HP + 0.2, v + 9], [26.95, HP + 6, v + 9], [26.95, HP + 6, v]], [-1, 0, 0]);
  D.setColor('#f0efec'); for (let v = 4; v < LV - 2; v += 6.9) D.box(16, HP, v, 17, GY, v + 1);
  D.setColor('#e6e6e3'); D.face([[GU, GY - 0.02, 0.2], [GU, GY - 0.02, LV - 0.2], [27, GY - 0.02, LV - 0.2], [27, GY - 0.02, 0.2]], [0, -1, 0]);
  GW.setColor('#fff2d6'); for (const u of [14, 20, 25]) GW.face([[u - 0.3, GY - 0.05, 3], [u + 0.3, GY - 0.05, 3], [u + 0.3, GY - 0.05, LV - 3], [u - 0.3, GY - 0.05, LV - 3]], [0, -1, 0]);
  // the canopy: a black wedge, its soffit rising from the glass top to the tip, closed at both ends
  BK.setColor('#1d1e21');
  quad(BK, [GU, GY, 0], [GU, GY, LV], [0, TY, LV], [0, TY, 0], [-0.4, -1, 0], null);
  quad(BK, [0, TY, 0], [0, TY, LV], [0, HT, LV], [0, HT, 0], [-1, 0, 0], null);
  for (const [c, n] of [[0, [0, 0, -1]], [LV, [0, 0, 1]]]) poly(BK, [[0, TY, c], [0, HT, c], [GU, HT, c], [GU, GY, c]], n, () => [0, 0]);
  BK.setColor('#26282b'); BK.tube([0.55, (TY + HT) / 2, 0], [0.55, (TY + HT) / 2, LV], (HT - TY) / 2 + 0.05, 10, false); // the rounded lip at the tip

  // ---- the terrace, the stairs and their cheek walls
  const { v0: SV0, v1: SV1, p: SP } = STAIR;
  D.setColor('#a6a7a5');
  D.face([[0, HP, 0], [GU, HP, 0], [GU, HP, SV0], [0, HP, SV0]], [0, 1, 0]); D.face([[0, HP, SV1], [GU, HP, SV1], [GU, HP, LV], [0, HP, LV]], [0, 1, 0]); D.face([[SP[0][0], HP, SV0], [GU, HP, SV0], [GU, HP, SV1], [SP[0][0], HP, SV1]], [0, 1, 0]);
  // the cheek walls: the profile polygon down to the ground, an outside and an inside face at each side
  D.setColor('#9fa09e');
  for (const [v, n] of [[SV0, [0, 0, -1]], [SV0 + 0.4, [0, 0, 1]], [SV1, [0, 0, 1]], [SV1 - 0.4, [0, 0, -1]]]) poly(D, [[SP[0][0], -0.3, v], ...SP.map(([u, y]) => [u, y, v]), [SP[3][0], -0.3, v]], n, () => [0, 0]);
  for (const [v0, v1] of [[SV0, SV0 + 0.4], [SV1 - 0.4, SV1]]) for (let i = 0; i < 3; i++) { const [ua, ya] = SP[i], [ub, yb] = SP[i + 1]; D.face([[ua, ya, v0], [ub, yb, v0], [ub, yb, v1], [ua, ya, v1]], [0, 1, 0]); }
  D.face([[SP[0][0], HP, SV0], [SP[0][0], HP, SV1], [SP[0][0], HP - 0.5, SV1], [SP[0][0], HP - 0.5, SV0]], [-1, 0, 0]);
  // the flights and the landing: textured strips on the profile (the nosing falls at the low end of each tread)
  for (let i = 0; i < 3; i++) {
    const [ua, ya] = SP[i], [ub, yb] = SP[i + 1], k = i === 1 ? 0.5 : Math.abs(ua - ub) / 0.35, w = (SV1 - SV0) / 6, sl = (yb - ya) / (ub - ua), q = Math.hypot(1, sl);
    quad(ST, [ua, ya, SV0 + 0.4], [ub, yb, SV0 + 0.4], [ub, yb, SV1 - 0.4], [ua, ya, SV1 - 0.4], [-sl / q, 1 / q, 0], [[0, 0], [0, k], [w, k], [w, 0]]);
  }
  // the colliders: the flights as sloped prisms, the landing, the terrace and the two blocks beside the stairs
  slopedPrism(SP[1][0], SP[0][0], SV0, SV1, SP[1][0], SP[1][1], (SP[0][1] - SP[1][1]) / (SP[0][0] - SP[1][0]));
  pr(rect(SP[2][0], SP[1][0], SV0, SV1), -1.2, SP[1][1], 'wall', 0);
  slopedPrism(SP[3][0], SP[2][0], SV0, SV1, SP[3][0], SP[3][1], (SP[2][1] - SP[3][1]) / (SP[2][0] - SP[3][0]));
  pr(rect(SP[0][0], GU, SV0, SV1), -1.2, HP, 'wall', 0);
  pr(rect(0, GU, 0, SV0), -1.2, HP, 'wall', 0); pr(rect(0, GU, SV1, LV), -1.2, HP, 'wall', 0);
  pr(rect(GU, LX, 0, LV), -1.2, HT, 'wall', 0);
  pr(rect(0, GU, 0, LV), GY, HT, 'awning', OVERHANG);
  pr(rect(AX0, AX1, AV0, AV1), -1.2, HA, 'wall', 0);

  // ---- the terrace's glass balustrade, the stair rails
  const rail = (p0, p1, h = 1.0) => { D.setColor('#33373b'); D.tube([p0[0], p0[1] + h, p0[2]], [p1[0], p1[1] + h, p1[2]], 0.045, 5); };
  const post = (p, h = 1.0) => { D.setColor('#33373b'); D.tube([p[0], p[1], p[2]], [p[0], p[1] + h, p[2]], 0.035, 4); };
  { // the terrace edge: glass panels between posts
    const u = SP[0][0], y = HP;
    rail([u, y, SV0], [u, y, SV1]);
    GL.setColor('#ffffff'); quad(GL, [u, y + 0.15, SV0], [u, y + 0.15, SV1], [u, y + 0.95, SV1], [u, y + 0.95, SV0], [-1, 0, 0], [[0, 0.3], [(SV1 - SV0) / 6, 0.3], [(SV1 - SV0) / 6, 0.4], [0, 0.4]]);
    for (let v = SV0; v <= SV1 + 0.01; v += 4) post([u, y, v]);
  }
  for (const v of [SV0 + 0.2, SV0 + (SV1 - SV0) / 6, SV0 + 2 * (SV1 - SV0) / 6, SV0 + 3 * (SV1 - SV0) / 6, SV0 + 4 * (SV1 - SV0) / 6, SV0 + 5 * (SV1 - SV0) / 6, SV1 - 0.2]) {
    for (let i = 0; i < 3; i++) {
      const [ua, ya] = SP[i], [ub, yb] = SP[i + 1]; rail([ua, ya, v], [ub, yb, v]);
      const n = Math.max(1, Math.round(Math.abs(ua - ub) / 2.5)); for (let k = 0; k <= n; k++) post([ua + (ub - ua) * k / n, ya + (yb - ya) * k / n, v]);
    }
  }
  // the second deck's railing along the foot of the cladding: none; the dark railing line on the podium's long edges
  D.setColor('#33373b'); for (const c of [0.12, LV - 0.12]) { D.box(26, HP + 0.95, c - 0.03, 97, HP + 1.0, c + 0.03); for (let u = 26; u <= 97; u += 3.5) D.box(u - 0.025, HP, c - 0.025, u + 0.025, HP + 1.0, c + 0.025); }

  // ---- the generator at the foot of the south wall, lamps
  D.setColor('#1f9d8f'); D.box(-7.6, 0, 25.0, -1.6, 2.6, 27.4); D.setColor('#16766d'); for (let u = -7.2; u < -2; u += 0.9) D.box(u, 0.1, 27.4, u + 0.06, 2.5, 27.52);
  { const [x, z] = F.toMap(-4.6, 26.2); S.obox(x, z, 3, 1.2, F.ang, Y0, Y0 + 2.6, 'bench'); }
  const lamp = (u, v) => {
    D.setColor('#5a5f66'); D.cyl(u, 0, v, 0.2, 0.12, 11, 8, true);
    D.setColor('#4a4f55'); D.box(u - 0.08, 10.8, v - 2.2, u + 0.08, 10.95, v + 2.2);
    GW.setColor('#fff2d0'); GW.box(u - 0.2, 10.62, v - 2.5, u + 0.2, 10.76, v - 1.6); GW.box(u - 0.2, 10.62, v + 1.6, u + 0.2, 10.76, v + 2.5);
    const [x, z] = F.toMap(u, v); S.cyl(x, z, Y0 - 0.2, Y0 + 11, 0.2, 0.12, 'pole');
  };
  for (const [u, v] of [[-15, 8], [-15, 28], [-15, 48], [-15, 62], [-15, 78], [20, -7], [55, -7], [90, -7], [30, 91], [66, 91], [100, 91], [132, 40]]) lamp(u, v);

  // ---- the plaza: dark pavers in front of the stairs, grey slabs on the bare ground round the building, the lettering
  const gd = 0.05;
  const run = (D2, u0, u1, v0, v1, col) => { D2.setColor(col); quad(D2, [u0, gd, v0], [u1, gd, v0], [u1, gd, v1], [u0, gd, v1], [0, 1, 0], [[u0 / 2.4, v0 / 2.4], [u1 / 2.4, v0 / 2.4], [u1 / 2.4, v1 / 2.4], [u0 / 2.4, v1 / 2.4]]); };
  for (let u = -42; u < -0.4; u += 6) for (let v = 2; v < 82; v += 8) run(DC, u, Math.min(u + 6, -0.4), v, Math.min(v + 8, 82), '#5f6670');
  { const inside = (u, v) => (u > -0.5 && u < LX + 0.3 && v > -0.3 && v < LV + 0.3) || (u >= AX0 && u < AX1 + 0.3 && v > AV0 - 0.3 && v < AV1 + 0.3) || (u < 0 && u > -11.5 && v > SV0 - 0.5 && v < SV1 + 0.5) || (u <= -0.4 && u > -42.5 && v > 1.5 && v < 82.5);
    const toA = (u, v) => (onAsphalt ? onAsphalt(...F.toMap(u, v)) : false);
    for (let v = -12; v < 96; v += 4) {
      let u0 = null;
      for (let u = -14; u <= 142; u += 4) {
        const ok = u < 138 && !inside(u + 2, v + 2) && !toA(u + 2, v + 2);
        if (ok && u0 == null) u0 = u;
        if (!ok && u0 != null) { run(DC, u0, u, v, v + 4, '#9a9c9e'); u0 = null; }
      }
    }
  }
  // the lettering and a white swoosh: one decal texture, the text's top toward the building
  quad(B.lett, [-29, 0.07, 29], [-29, 0.07, 55], [-21, 0.07, 55], [-21, 0.07, 29], [0, 1, 0], [[0, 0.375], [1, 0.375], [1, 1], [0, 1]]);
  quad(B.lett, [-38, 0.07, 22], [-38, 0.07, 58], [-31.6, 0.07, 58], [-31.6, 0.07, 22], [0, 1, 0], [[0, 0], [1, 0], [1, 0.355], [0, 0.355]]);

  // ---- materials and meshes
  const warm = new THREE.Color('#ffd9a8'), cwMask = glassTex(true);
  const M = {
    clad: new THREE.MeshStandardMaterial({ map: chequerTex(r), roughness: 0.72, metalness: 0.08 }),
    conc: new THREE.MeshStandardMaterial({ map: podiumTex(r), roughness: 0.92 }),
    glass: new THREE.MeshStandardMaterial({ map: glassTex(false), vertexColors: true, roughness: 0.12, metalness: 0.45, transparent: true, opacity: 0.7, side: THREE.DoubleSide, emissive: warm, emissiveMap: cwMask, emissiveIntensity: 0 }),
    blk: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.35, side: THREE.DoubleSide }),
    det: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.15, side: THREE.DoubleSide }),
    roof: new THREE.MeshStandardMaterial({ map: roofTex(r), vertexColors: true, roughness: 0.9 }),
    lou: new THREE.MeshStandardMaterial({ map: louvreTex(), roughness: 0.6, metalness: 0.3 }),
    stair: new THREE.MeshStandardMaterial({ map: stairTex(), roughness: 0.93 }),
    dec: decal(new THREE.MeshStandardMaterial({ map: paveTex(r), vertexColors: true, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -4 })),
    lett: decal(new THREE.MeshStandardMaterial({ map: lettersTex(), transparent: true, alphaTest: 0.4, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -6 })),
    glow: new THREE.MeshStandardMaterial({ color: 0xf6f0e2, roughness: 0.3, emissive: 0xffe2b0, emissiveIntensity: 0.05 }),
  };
  const out = finish(root, 'arena', B, M, { shade: ['clad', 'conc', 'blk', 'det', 'roof', 'stair'] });

  // ---- footprints, clear, update
  const ring = []; for (let i = 0; i < ring0.p.length; i += 2) ring.push([ring0.p[i], ring0.p[i + 1]]);
  const clearRects = [[-46, 134, -14, 98]];
  console.log(`[oradea] Oradea Arena: ground ${Y0.toFixed(2)} m, ${(out.verts / 1000).toFixed(1)}k verts, ${out.meshes} meshes, ${S.count - n0} solids in ${(performance.now() - t0).toFixed(0)} ms`);
  return {
    footprints: [{ poly: ring, h: 24, kind: 'public', name: 'Oradea Arena', id: OSM_ID }],
    clear(x, z) { const [u, v] = F.toLocal(x, z); return clearRects.some(([a, b, c, d]) => u > a && u < b && v > c && v < d); },
    update() {
      const k = nightK.value, e = Math.min(1, 3 * k);
      M.glass.emissiveIntensity = 0.85 * k; M.glow.emissiveIntensity = 0.05 + 2.4 * e;
    },
    stats: { verts: out.verts, meshes: out.meshes, ground: Y0 },
  };
}
