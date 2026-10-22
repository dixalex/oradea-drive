// OWNER: oradea. Palatul Baroc, the former Roman Catholic bishop's palace of Oradea (Bd. Dacia 1-3; OSM way 262832527), built
// 1762-1777 to Franz Anton Hillebrandt's plans: a U of three wings (105.7 x 63.7 m, the courtyard open to the west) of three
// floors under a terracotta mansard roof, the main front to the east, towards the plaza and the Basilica.
// Built from the 2022-2025 Wikimedia Commons photos and the Esri aerial: the walls are one painted bay atlas (bays 3 m wide, the
// rusticated ground floor, the piano nobile's framed windows under alternating pediments, the plain top floor) laid as one
// quad per face; on the east front the bowed risalit is real geometry: three tall arched windows over a balcony, four round
// shuttered oculi, the arched portal, the triangular pediment with the bishop's arms, a domed roof apron with a spire; belt
// courses, the eave cornice, corner pilasters, hipped dormers and cream chimney stacks complete it.
//   buildPalace(ctx) -> { footprints, floor, windows }   ctx { B, S, heightAt, r, M? }
//   PALACE_SKIP: the OSM way it replaces
import { PAL, offsetRing, frustumRoof, lathe2, PI } from './kit.js';
import { wallFaces, fbox, facePoly, archPts, at, quad, UP } from '../../../cherkasy/civic.js';
import { canvasTex } from '../../../cherkasy/sculpt.js';

export const PALACE_SKIP = [262832527];

export const LOCAL = { L: 105.7, WD: 63.7, BASE: 21.6, W1: 16.4, S0: 88.1, RIS: [41.85, 63.85] };
const { L, WD, BASE, W1, S0 } = LOCAL;
const RING = [[0, 0], [L, 0], [L, WD], [S0, WD], [S0, BASE], [W1, BASE], [W1, WD], [0, WD]];
const H1 = 4.8, H2 = 11.2, HC = 15.4, HE = 16.6;          // ground floor top, piano nobile top, the cornice's foot, the eave
export const COL = { wall: '#f4e093', cream: '#f8f0d8', stone: '#b9ad98', roof: '#b85a3c', dark: '#2c3034', tymp: '#bfd0d2', gold: '#d9b53e' };

// painted bay atlas: 8 bays of 3 m, 16 m high (32 px a metre); the ground floor, the piano nobile, the top floor
export function paintAtlas(r) {
  const PX = 32, COLS = 8, BW = 3 * PX, W = COLS * BW, Hh = 16 * PX, wins = [];
  const Y = (m) => Hh - m * PX;
  const tex = canvasTex(W, Hh, (g) => {
    g.fillStyle = COL.wall; g.fillRect(0, 0, W, Hh);
    for (let i = 0; i < 9000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,248,215,0.12)' : 'rgba(120,90,30,0.07)'; g.fillRect(r() * W, r() * Hh, 1 + r() * 2.5, 1 + r() * 2.5); }
    // the ground floor: a deeper yellow with rusticated joints
    g.fillStyle = '#ebcc6c'; g.fillRect(0, Y(H1), W, H1 * PX);
    for (let y = 0.75; y < H1; y += 0.75) { g.fillStyle = 'rgba(110,80,20,0.35)'; g.fillRect(0, Y(y), W, 2); g.fillStyle = 'rgba(255,245,200,0.35)'; g.fillRect(0, Y(y) + 2, W, 1); }
    // belt courses
    for (const y of [H1, H2]) { g.fillStyle = COL.cream; g.fillRect(0, Y(y) - 4, W, 8); g.fillStyle = 'rgba(80,60,20,0.3)'; g.fillRect(0, Y(y) + 4, W, 2); }
    const glass = (x, y, w, h, lit, arch) => {
      const gr = g.createLinearGradient(x, y, x + w * 0.6, y + h); gr.addColorStop(0, '#6c808c'); gr.addColorStop(0.55, '#34424d'); gr.addColorStop(1, '#222c34');
      g.fillStyle = gr; g.beginPath();
      if (arch) { g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, PI, 0); g.lineTo(x + w, y + h); } else g.rect(x, y, w, h);
      g.closePath(); g.fill();
      g.strokeStyle = 'rgba(245,238,215,0.9)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + w / 2, y + (arch ? 0 : 0)); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h * 0.4); g.lineTo(x + w, y + h * 0.4); g.stroke();
      wins.push([x, y, w, h, lit]);
    };
    const frame = (x, y, w, h, t, arch) => {
      g.fillStyle = COL.cream; g.beginPath();
      if (arch) { g.moveTo(x - t, y + h); g.lineTo(x - t, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2 + t, PI, 0); g.lineTo(x + w + t, y + h); } else g.rect(x - t, y - t, w + 2 * t, h + 2 * t);
      g.closePath(); g.fill();
    };
    for (let i = 0; i < COLS; i++) {
      const x0 = i * BW, cx = x0 + BW / 2;
      // ground floor window: small, arched
      { const w = 1.1 * PX, h = 2.1 * PX, x = cx - w / 2, y = Y(3.4); frame(x, y, w, h, 3, true); glass(x, y, w, h, r() < 0.25, true); }
      // piano nobile: a tall framed window under a pediment, a balustrade panel below
      { const w = 1.45 * PX, h = 3.5 * PX, x = cx - w / 2, y = Y(9.8);
        frame(x, y, w, h, 5, false); glass(x, y, w, h, r() < 0.3, false);
        g.fillStyle = COL.cream; g.beginPath();
        if (i & 1) { g.moveTo(x - 9, y - 5); g.quadraticCurveTo(cx, y - 30, x + w + 9, y - 5); g.lineTo(x + w + 9, y - 1); g.lineTo(x - 9, y - 1); } else { g.moveTo(x - 9, y - 5); g.lineTo(cx, y - 24); g.lineTo(x + w + 9, y - 5); g.lineTo(x + w + 9, y - 1); g.lineTo(x - 9, y - 1); }
        g.closePath(); g.fill();
        g.fillStyle = 'rgba(120,90,30,0.12)'; g.fillRect(x, y - 4, w, 2);
        g.fillStyle = COL.cream; g.fillRect(x - 8, y + h + 5, w + 16, 5);
        g.fillStyle = 'rgba(190,160,80,0.45)'; g.fillRect(x, y + h + 14, w, 0.8 * PX); g.strokeStyle = COL.cream; g.lineWidth = 2; g.strokeRect(x, y + h + 14, w, 0.8 * PX);
      }
      // top floor: a plain framed window
      { const w = 1.15 * PX, h = 1.95 * PX, x = cx - w / 2, y = Y(14.45); frame(x, y, w, h, 3, false); glass(x, y, w, h, r() < 0.3, false); g.fillStyle = COL.cream; g.fillRect(x - 6, y + h + 3, w + 12, 4); }
      // pilaster strips at the bay edges of the piano nobile
      for (const xx of [x0, x0 + BW]) { g.fillStyle = COL.cream; g.fillRect(xx - 5, Y(H2) + 4, 10, (H2 - H1) * PX - 8); g.fillStyle = 'rgba(120,90,30,0.2)'; g.fillRect(xx + 5, Y(H2) + 4, 2, (H2 - H1) * PX - 8); }
    }
  });
  const mask = canvasTex(W, Hh, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, Hh);
    for (const [x, y, w, h, lit] of wins) if (lit) { g.fillStyle = '#fff'; g.fillRect(x + 2, y + 2, w - 4, h - 4); }
  });
  return { tex, mask, wins, bay: 3, cols: COLS, H: 16 };
}

const mkFace = (p, q, nx, nz) => { const rx = nz, rz = -nx, sp = p[0] * rx + p[1] * rz, sq = q[0] * rx + q[1] * rz, o = sp <= sq ? p : q; return { ax: o[0], az: o[1], rx, rz, nx, nz, w: Math.abs(sq - sp), N: [nx, 0, nz], R: [rx, 0, rz], L: [-rx, 0, -rz], open: [] }; };
const sOn = (f, [x, z]) => (x - f.ax) * f.rx + (z - f.az) * f.rz;

// a quad of the atlas on face f: s0..s1, y0..y1, bays fitted to the span
function atlasBand(D, f, A, s0, s1, y0, y1, yF, o = 0, u0 = 0) {
  const n = Math.max(1, Math.round((s1 - s0) / A.bay)), tile = ((s1 - s0) / n) * A.cols, v0 = (y0 - yF) / A.H, v1 = (y1 - yF) / A.H;
  quad(D, at(f, s0, y0, o), at(f, s1, y0, o), at(f, s1, y1, o), at(f, s0, y1, o), f.N, [[u0, v0], [u0 + (s1 - s0) / tile, v0], [u0 + (s1 - s0) / tile, v1], [u0, v1]]);
  return n;
}

export function buildPalace({ B, S, heightAt, atlas, footprintsOut }) {
  const world = PAL.ring(RING);
  // floor: the highest ground under the footprint plus a step
  let hi = -1e9, lo = 1e9;
  for (let a = 0; a <= L; a += 5) for (let d = 0; d <= WD; d += 5) { const inside = d <= BASE || a <= W1 || a >= S0; if (!inside) continue; const [x, z] = PAL.xz(a, d), h = heightAt(x, z); hi = Math.max(hi, h); lo = Math.min(lo, h); }
  const yF = hi + 0.3, yB = lo - 0.8;
  const D = B.plaster, W = B.wallP, T = B.tile;
  const fs = wallFaces(world);
  const classify = (f) => { const n = [f.nx * PAL.U[0] + f.nz * PAL.U[1], f.nx * PAL.V[0] + f.nz * PAL.V[1]].map(Math.round); return n.join(','); };
  let windows = 0;
  const RIS = LOCAL.RIS, riscx = (RIS[0] + RIS[1]) / 2;
  for (const f of fs) {
    const k = classify(f); // '0,-1' east front, '1,0' south wing outer, ...
    let spans = [[0, f.w]];
    if (k === '0,-1') { // the east front: the bowed risalit takes the middle
      const sa = sOn(f, PAL.xz(RIS[1], 0)), sb = sOn(f, PAL.xz(RIS[0], 0));
      spans = [[0, Math.min(sa, sb)], [Math.max(sa, sb), f.w]];
    }
    for (const [s0, s1] of spans) {
      if (s1 - s0 < 0.5) continue;
      const n = atlasBand(W, f, atlas, s0, s1, yF, yF + HC, yF, 0, ((f.ax * 7.3 + f.az * 3.1) % 1 + 1) % 1);
      windows += n * 3;
    }
    // the stone plinth under every wall
    D.setColor(COL.stone); fbox(D, f, -0.05, f.w + 0.05, yB, yF + 0.9, 0, 0.12, 1 | 16);
  }
  // belt courses and the eave cornice as stepped rings
  const ringExtrude = (k, y0, y1, col, hole = world) => { D.setColor(col); D.extrude(offsetRing(world, k), [hole], y0, y1, { top: true, bottom: false, sides: true }); };
  ringExtrude(0.16, yF + H1 - 0.16, yF + H1 + 0.16, COL.cream); ringExtrude(0.2, yF + H2 - 0.14, yF + H2 + 0.14, COL.cream);
  ringExtrude(0.15, yF + HC, yF + HC + 0.45, COL.cream); ringExtrude(0.42, yF + HC + 0.45, yF + HC + 0.8, COL.cream); ringExtrude(0.75, yF + HC + 0.8, yF + HE - 0.15, COL.cream);
  ringExtrude(0.6, yF + HE - 0.15, yF + HE, '#cdbf9c');
  // corner pilasters (the wing ends and the base's corners)
  for (const f of fs) { for (const s of [0.45, f.w - 0.45]) { D.setColor(COL.cream); fbox(D, f, s - 0.45, s + 0.45, yF + 0.9, yF + HC, 0, 0.14, 1 | 4 | 8); } }

  // ---------------------------------------------------------------- the bowed risalit on the east front
  const Rw = RIS[1] - RIS[0], bulge = 3.1, Rr = ((Rw / 2) ** 2 + bulge ** 2) / (2 * bulge), NS = 8;
  const arc = (t) => { const x = (t - 0.5) * Rw; return [riscx + x, -(Math.sqrt(Rr * Rr - x * x) - (Rr - bulge))]; };
  const segs = [];
  for (let i = 0; i < NS; i++) {
    const p = PAL.xz(...arc(i / NS)), q = PAL.xz(...arc((i + 1) / NS)), dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz);
    // outward = -V (east): choose the sign of the normal that has a negative V component
    let nx = dz / l, nz = -dx / l; if (nx * PAL.V[0] + nz * PAL.V[1] > 0) { nx = -nx; nz = -nz; }
    segs.push(mkFace(p, q, nx, nz));
  }
  const yTop = yF + HC;
  for (const f of segs) {
    D.setColor(COL.wall); quad(D, at(f, 0, yF, 0), at(f, f.w, yF, 0), at(f, f.w, yTop, 0), at(f, 0, yTop, 0), f.N, [[0, 0], [f.w / 2.5, 0], [f.w / 2.5, HC / 2.5], [0, HC / 2.5]]);
    D.setColor(COL.stone); fbox(D, f, -0.02, f.w + 0.02, yB, yF + 0.9, 0, 0.12, 1 | 16);
    D.setColor('#e8c764'); quad(D, at(f, 0, yF + 0.9, 0.01), at(f, f.w, yF + 0.9, 0.01), at(f, f.w, yF + H1 - 0.2, 0.01), at(f, 0, yF + H1 - 0.2, 0.01), f.N, [[0, 0], [f.w / 2.5, 0], [f.w / 2.5, 1], [0, 1]]);
    D.setColor(COL.cream); fbox(D, f, -0.02, f.w + 0.02, yF + H1 - 0.16, yF + H1 + 0.16, 0, 0.22, 1 | 16); fbox(D, f, -0.02, f.w + 0.02, yF + H2 - 0.14, yF + H2 + 0.14, 0, 0.22, 1 | 16);
    fbox(D, f, -0.02, f.w + 0.02, yF + HC, yF + HC + 0.45, 0, 0.3, 1 | 16); fbox(D, f, -0.02, f.w + 0.02, yF + HC + 0.45, yF + HC + 0.8, 0, 0.6, 1 | 16); fbox(D, f, -0.02, f.w + 0.02, yF + HC + 0.8, yF + HE - 0.15, 0, 0.95, 1 | 16);
  }
  // which segment, and where on it, holds the arc parameter t -> a face and its s
  const onArc = (t) => { const p = PAL.xz(...arc(t)); let best = segs[0], bs = 1e9; for (const f of segs) { const s = sOn(f, p), off = Math.max(0, -s, s - f.w); if (off < bs) { bs = off; best = f; } } return { f: best, s: sOn(best, p) }; };
  const arcElement = (t, fn) => { const { f, s } = onArc(t); fn(f, s); };
  const winCol = '#35424c';
  // three tall arched windows over a balcony, four round oculi, the portal
  const tall = (f, s, w, y0, h) => {
    const rise = h - w / 2;
    const out = archPts(s - w / 2, s + w / 2, yF + y0 + rise, 'round', 0, 5), body = [[s - w / 2, yF + y0], ...out, [s + w / 2, yF + y0]];
    const frm = archPts(s - w / 2 - 0.28, s + w / 2 + 0.28, yF + y0 + rise, 'round', 0, 5);
    D.setColor(COL.cream); facePoly(D, f, [[s - w / 2 - 0.28, yF + y0 - 0.1], ...frm, [s + w / 2 + 0.28, yF + y0 - 0.1]], 0.04);
    B.lit.setColor('#46535d'); facePoly(B.lit, f, body, 0.07);
    D.setColor(COL.cream); fbox(D, f, s - 0.04, s + 0.04, yF + y0, yF + y0 + h - 0.1, 0.04, 0.1, 1 | 4 | 8); fbox(D, f, s - w / 2, s + w / 2, yF + y0 + h * 0.55, yF + y0 + h * 0.55 + 0.08, 0.04, 0.1, 1 | 16);
    D.setColor('#e8d9a8'); fbox(D, f, s - 0.2, s + 0.2, yF + y0 + h + 0.35, yF + y0 + h + 0.95, 0.04, 0.2, 1 | 16 | 4 | 8);
    windows++;
  };
  for (const t of [0.5 - 0.2, 0.5, 0.5 + 0.2]) arcElement(t, (f, s) => tall(f, s, 1.9, H1 + 1.3, 4.7));
  const oculus = (f, s, y, rad) => {
    const ring = Array.from({ length: 12 }, (_, i) => [s + Math.cos((i / 12) * PI * 2) * rad, y + Math.sin((i / 12) * PI * 2) * rad]), rim = ring.map(([a, b]) => [s + (a - s) * 1.28, y + (b - y) * 1.28]);
    D.setColor(COL.cream); facePoly(D, f, rim, 0.04); D.setColor('#6a4a34'); facePoly(D, f, ring, 0.09);
    D.setColor('#4b3322'); for (let k = -3; k <= 3; k++) fbox(D, f, s - rad * 0.9, s + rad * 0.9, y + k * rad * 0.27 - 0.025, y + k * rad * 0.27 + 0.025, 0.09, 0.12, 1);
    windows++;
  };
  for (const t of [0.5 - 0.3, 0.5 - 0.1, 0.5 + 0.1, 0.5 + 0.3]) arcElement(t, (f, s) => oculus(f, s, yF + H2 + 2.2, 1.0));
  arcElement(0.5, (f, s) => { // the arched portal: a stone frame and double leaves
    const w = 2.6, h = 3.9, rise = h - w / 2, out = archPts(s - w / 2, s + w / 2, yF + 0.9 + rise, 'round', 0, 5);
    D.setColor(COL.stone); facePoly(D, f, [[s - w / 2 - 0.4, yF + 0.5], ...archPts(s - w / 2 - 0.4, s + w / 2 + 0.4, yF + 0.9 + rise, 'round', 0, 5), [s + w / 2 + 0.4, yF + 0.5]], 0.05);
    D.setColor('#5a3a26'); facePoly(D, f, [[s - w / 2, yF + 0.5], ...out, [s + w / 2, yF + 0.5]], 0.1);
    D.setColor('#3e281a'); fbox(D, f, s - 0.03, s + 0.03, yF + 0.5, yF + 0.9 + h - 0.3, 0.1, 0.13, 1 | 4 | 8);
    D.setColor(COL.stone); fbox(D, f, s - 1.6, s + 1.6, yF + 0.0, yF + 0.5, 0.0, 1.6, 1 | 4 | 8 | 16); fbox(D, f, s - 2.2, s + 2.2, yF - 0.3, yF + 0.0, 0.0, 2.2, 1 | 4 | 8 | 16);
  });
  for (const t of [0.5 - 0.31, 0.5 + 0.31]) arcElement(t, (f, s) => { // side windows on the ground floor
    const w = 1.2, y0 = 1.3, h = 2.4, out = archPts(s - w / 2, s + w / 2, yF + y0 + h - w / 2, 'round', 0, 4);
    D.setColor(COL.cream); facePoly(D, f, [[s - w / 2 - 0.2, yF + y0 - 0.1], ...archPts(s - w / 2 - 0.2, s + w / 2 + 0.2, yF + y0 + h - w / 2, 'round', 0, 4), [s + w / 2 + 0.2, yF + y0 - 0.1]], 0.04);
    facePoly(B.glass, f, [[s - w / 2, yF + y0], ...out, [s + w / 2, yF + y0]], 0.07); windows++;
  });
  // coupled pilasters at the risalit's ends and between the windows
  for (const t of [0.03, 0.12, 0.34, 0.5 - 0.1, 0.5 + 0.1, 0.66, 0.88, 0.97]) arcElement(t, (f, s) => { D.setColor(COL.cream); fbox(D, f, s - 0.36, s + 0.36, yF + 0.9, yF + HC, 0, 0.2, 1 | 4 | 8); fbox(D, f, s - 0.5, s + 0.5, yF + H2 - 0.5, yF + H2 - 0.3, 0, 0.26, 1 | 16 | 4 | 8); });
  // the balcony over the portal: a slab and a balustrade
  { const t0 = 0.5 - 0.27, t1 = 0.5 + 0.27, P = Array.from({ length: 9 }, (_, i) => arc(t0 + (t1 - t0) * i / 8)), n = P.length;
    for (let i = 0; i < n - 1; i++) {
      const p = PAL.xz(...P[i]), q = PAL.xz(...P[i + 1]), dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz); let nx = dz / l, nz = -dx / l; if (nx * PAL.V[0] + nz * PAL.V[1] > 0) { nx = -nx; nz = -nz; }
      const f = mkFace(p, q, nx, nz);
      D.setColor(COL.cream); fbox(D, f, 0, f.w, yF + H1 - 0.05, yF + H1 + 0.3, 0, 1.0, 1 | 16 | 32);
      D.setColor('#efe3bf'); fbox(D, f, 0, f.w, yF + H1 + 0.3, yF + H1 + 1.2, 0.8, 0.95, 1 | 16); fbox(D, f, 0, f.w, yF + H1 + 1.2, yF + H1 + 1.3, 0.76, 1.0, 1 | 16 | 32);
    } }
  // the pediment over the risalit: a triangle on the cornice, the bishop's arms in the tympanum
  { const f = onArc(0.5).f, s = onArc(0.5).s, hw = 9.6, base = yF + HE, rise = 3.2, o = 0.7;
    D.setColor(COL.cream); facePoly(D, f, [[s - hw - 0.5, base], [s + hw + 0.5, base], [s, base + rise + 0.45]], o);
    fbox(D, f, s - hw - 0.5, s + hw + 0.5, base - 0.05, base + 0.25, 0, o + 0.35, 1 | 16 | 4 | 8);
    D.setColor(COL.tymp); facePoly(D, f, [[s - hw + 0.8, base + 0.35], [s + hw - 0.8, base + 0.35], [s, base + rise - 0.55]], o + 0.05);
    D.setColor(COL.cream); for (const sg of [-1, 1]) { const x0 = s + sg * (hw + 0.5); quad(D, at(f, s, base + rise + 0.45, o), at(f, x0, base, o), at(f, x0, base, o + 0.35), at(f, s, base + rise + 0.45, o + 0.35), [0, 1, 0]); }
    D.setColor(COL.gold); const g = [[s - 0.9, base + 0.7], [s + 0.9, base + 0.7], [s + 0.9, base + 1.7], [s, base + 2.2], [s - 0.9, base + 1.7]]; facePoly(D, f, g, o + 0.1);
    D.setColor('#8b2a22'); facePoly(D, f, [[s - 0.6, base + 0.85], [s + 0.6, base + 0.85], [s + 0.6, base + 1.55], [s, base + 1.9], [s - 0.6, base + 1.55]], o + 0.12);
  }

  // ---------------------------------------------------------------- roofs, dormers, chimneys, the dome (local frame)
  const yE = yF + HE, K0 = 1.45;
  const lvl = (w) => [[0, yE], [4.0, yE + 4.4], [w / 2 + 0.55, yE + 4.4 + (w / 2 + 0.55 - 4.0) * 0.368]];
  T.with(PAL.m(0), (q) => {
    frustumRoof(q, [0, 0, L, BASE], lvl(BASE), { over: 0.55, col: COL.roof });
    frustumRoof(q, [0, 0, W1, WD], lvl(W1), { over: 0.55, col: COL.roof });
    frustumRoof(q, [S0, 0, L, WD], lvl(L - S0), { over: 0.55, col: COL.roof });
  });
  // hipped dormers on the lower slopes, one every ~6.5 m, front plane `o` of the slope at inset K0
  let nDorm = 0;
  const dormer = (a, d, fx, fz) => {
    const hy = yE + K0 * 1.1, w = 1.5, h = 1.5, u = [-fz, fx];
    const P = (s, y, o) => [a + u[0] * s + fx * o, y, d + u[1] * s + fz * o];
    D.with(PAL.m(0), (q) => {
      q.setColor(COL.cream); quad(q, P(-w / 2, hy, 0), P(w / 2, hy, 0), P(w / 2, hy + h, 0), P(-w / 2, hy + h, 0), [fx, 0, fz]);
      q.setColor('#41342c'); quad(q, P(-w / 2 + 0.2, hy + 0.2, 0.02), P(w / 2 - 0.2, hy + 0.2, 0.02), P(w / 2 - 0.2, hy + h - 0.2, 0.02), P(-w / 2 + 0.2, hy + h - 0.2, 0.02), [fx, 0, fz]);
      q.setColor(COL.cream); for (const sg of [-1, 1]) quad(q, P(sg * w / 2, hy, 0), P(sg * w / 2, hy, -1.7), P(sg * w / 2, hy + h * 0.6, -1.7), P(sg * w / 2, hy + h, 0), [u[0] * sg, 0, u[1] * sg]);
    });
    T.with(PAL.m(0), (q) => {
      q.setColor(COL.roof);
      const w2 = w / 2 + 0.2, y0 = hy + h, apex = P(0, y0 + 0.8, -0.9), c = [P(-w2, y0, 0.2), P(w2, y0, 0.2), P(w2, y0, -1.7), P(-w2, y0, -1.7)];
      for (let i = 0; i < 4; i++) {
        const A = c[i], Bq = c[(i + 1) % 4], e = [Bq[0] - A[0], Bq[1] - A[1], Bq[2] - A[2]], g = [apex[0] - A[0], apex[1] - A[1], apex[2] - A[2]];
        let n = [e[1] * g[2] - e[2] * g[1], e[2] * g[0] - e[0] * g[2], e[0] * g[1] - e[1] * g[0]]; const l = Math.hypot(...n) || 1; n = n.map((v) => v / l); if (n[1] < 0) n = n.map((v) => -v);
        const i0 = q.vert(...A, ...n, 0, 0), i1 = q.vert(...Bq, ...n, 1.5, 0), i2 = q.vert(...apex, ...n, 0.75, 1.2); q.tri(i0, i1, i2);
      }
    });
    nDorm++;
  };
  const row = (from, to, step, fn) => { const n = Math.max(1, Math.round((to - from) / step)); for (let i = 0; i < n; i++) fn(from + ((i + 0.5) * (to - from)) / n); };
  const [ra, rb] = RIS;
  row(2.5, ra - 2, 6.5, (a) => dormer(a, -0.55 + K0, 0, -1)); row(rb + 2, L - 2.5, 6.5, (a) => dormer(a, -0.55 + K0, 0, -1));            // east front
  row(W1 + 3, S0 - 3, 6.5, (a) => dormer(a, BASE + 0.55 - K0, 0, 1));                                                                       // courtyard side of the base
  row(8, WD - 3, 6.5, (d) => { dormer(-0.55 + K0, d, -1, 0); dormer(L + 0.55 - K0, d, 1, 0); });                                              // the wings' outer sides
  row(BASE + 3, WD - 3, 6.5, (d) => { dormer(W1 + 0.55 - K0, d, 1, 0); dormer(S0 - 0.55 + K0, d, -1, 0); });                                 // the courtyard sides
  for (const a of [W1 / 2, L - (L - S0) / 2]) dormer(a, WD + 0.55 - K0, 0, 1);                                                              // the wing ends
  // chimney stacks on the ridges
  let nChim = 0;
  const stack = (a, d, ry) => {
    D.with(PAL.m(0), (q) => { q.setColor(COL.cream); q.box(a - 0.65, ry - 0.4, d - 0.65, a + 0.65, ry + 2.4, d + 0.65); q.box(a - 0.8, ry + 2.4, d - 0.8, a + 0.8, ry + 2.7, d + 0.8); q.setColor('#2a2623'); q.box(a - 0.55, ry + 2.7, d - 0.55, a + 0.55, ry + 2.74, d + 0.55, 4); });
    nChim++;
  };
  const rb0 = yE + 4.4 + (BASE / 2 + 0.55 - 4.0) * 0.368 - 0.1, rw = (w) => yE + 4.4 + (w / 2 + 0.55 - 4.0) * 0.368 - 0.1;
  for (const a of [14, 30, 76, 92]) stack(a, BASE / 2, rb0); for (const d of [28, 46]) { stack(W1 / 2, d, rw(W1)); stack(L - (L - S0) / 2, d, rw(L - S0)); }
  // the roof over the risalit: a steep skirt, a ledge, an upright drum with a round window, a low cap and a spire
  const ac = riscx, dc = 4.4, sx = 11.6, sz = 8.2;
  T.with(PAL.m(0), (q) => lathe2(q, [[1, yE - 0.2], [0.99, yE + 0.2], [0.94, yE + 2.0], [0.9, yE + 3.4], [0.87, yE + 4.1], [0.86, yE + 4.3], [0.62, yE + 4.5], [0.6, yE + 4.8], [0.6, yE + 7.0], [0.57, yE + 7.2], [0.44, yE + 7.9], [0.25, yE + 8.5], [0.08, yE + 8.9], [0, yE + 9.0]], 24, ac, dc, sx, sz, 2, COL.roof));
  { const fo = mkFace(PAL.xz(ac - 6, -0.55), PAL.xz(ac + 6, -0.55), -PAL.V[0], -PAL.V[1]), so = sOn(fo, PAL.xz(ac, -0.55)), y0 = yE + 5.9, rad = 1.15;
    const ring = Array.from({ length: 16 }, (_, i) => [so + Math.cos((i / 16) * PI * 2) * rad * 0.85, y0 + Math.sin((i / 16) * PI * 2) * rad]), rim = ring.map(([a, b]) => [so + (a - so) * 1.25, y0 + (b - y0) * 1.25]);
    D.setColor(COL.cream); facePoly(D, fo, rim, 0.02); D.setColor('#4a3b32'); facePoly(D, fo, ring, 0.06); }
  D.with(PAL.m(0), (q) => { q.setColor('#56606a'); q.cyl(ac, yE + 8.9, dc, 0.1, 0.07, 4.8, 6); q.setColor(COL.gold); q.ellipsoid([ac, yE + 10.3, dc], [0.22, 0.22, 0.22], 8, 5); });
  // collision and the footprint
  const wallTop = yF + HC;
  S.prism(world.flat(), yB, wallTop, 0, 0, 'wall');
  S.prism(offsetRing(world, -4.0).flat(), wallTop - 0.5, yE + 4.4, 0, 0, 'wall');
  S.prism(PAL.ring([[8, 6.5], [L - 8, 6.5], [L - 8, BASE - 6.5], [8, BASE - 6.5]]).flat(), yE + 4.0, yE + 6.9, 0, 0, 'wall');
  S.cyl(...PAL.xz(ac, dc), yE + 3.5, yE + 8.4, 6.6, 2.5, 'wall');
  return { world, yF, yE, yB, windows, dormers: nDorm, chimneys: nChim, footprints: [{ poly: world, h: HE + 7.5, kind: 'public', name: 'Palatul Baroc', id: PALACE_SKIP[0] }] };
}
