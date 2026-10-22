// OWNER: oradea. Șirul Canonicilor, the Canons' Row of Oradea (OSM way 262833611; Hungarian "Kanonok sor"), built 1758-1875 for the
// canons of the Roman Catholic chapter: ten two-storey houses in one 252 m terrace, hipped red-tile roofs, and along the front
// a continuous arcade of 57 round arches on square white piers with stepped cornice caps over grey granite plinths. Above the
// arches a cream string course, the upper floor beige rough-cast with one cream-framed window (and a sill panel) per bay, a
// cream eave cornice. Behind the arches a barrel-roofed gallery with a plain white back wall, small windows and orange-brown
// doors. A short cross wing at the south end. Built from the Commons photos (arcade, front, street side) and the OSM outline.
// The walls above the arches are one painted atlas (4 bays x ground back-wall x upper floor x white gallery wall), the arcade is
// real geometry. The row follows the ground in ten steps, one per house.
//   buildCanons(ctx) -> { footprints, ... }   ctx { B, S, heightAt, atlas }; B needs plaster, wallC, det, tile
//   paintCanons(r) -> atlas { tex, mask, ... }
//   CANONS_SKIP: the OSM way it replaces
import { CAN, gableRoof, localize, PI } from './kit.js';
import { fbox, facePoly, archPts, at, quad, wallFaces, UP } from '../../../cherkasy/civic.js';
import { canvasTex } from '../../../cherkasy/sculpt.js';

export const CANONS_SKIP = [262833611];
const N = 57, P = 4.405, PW = 1.3, PD = 1.6, FV = 50.1, BACK = 31.7, GAL = 4.1;
const c = (j) => 0.7 + j * P;
export const K = { wall: '#c4ac82', white: '#fbf8ee', cream: '#f1e9cf', granite: '#8f8d84', roof: '#b4503a', door: '#8a4a2c', gal: '#e0cba3' };
// heights over a house's floor
const PL = 0.6, SPR = 3.85, RISE = (P - PW) / 2, CROWN = SPR + RISE, STR = 5.55, EAVE = 10.4, RIDGE = 14.4;
const ATLAS = { px: 40, bays: 4, H: 16 };  // metres per atlas row: ground 0-5.5, upper 5.5-10.5, gallery 10.5-16

// the atlas: four bays side by side, wall colour under the speckle (the vertex colour is white)
export function paintCanons(r) {
  const PX = ATLAS.px, BW = Math.round(P * PX), W = BW * ATLAS.bays, Hh = ATLAS.H * PX, wins = [];
  const Yp = (m) => m * PX;                       // atlas y (down) of a height m measured from the top row down to row start; below we use rows
  const row = (r0, r1) => ({ y0: r0 * PX, y1: r1 * PX });
  const tex = canvasTex(W, Hh, (g) => {
    // a row's base: 0 = ground (top of the canvas is the top of the atlas: v = 1)
    const top = (m) => Hh - m * PX;               // canvas y of height m (m runs 0..16 upward)
    g.fillStyle = K.wall; g.fillRect(0, top(10.5), W, 10.5 * PX);
    g.fillStyle = K.gal; g.fillRect(0, top(16), W, 5.5 * PX);
    for (let i = 0; i < 16000; i++) { const y = r() * Hh; g.fillStyle = y > top(10.5) ? (r() < 0.5 ? 'rgba(255,248,225,0.16)' : 'rgba(95,75,40,0.10)') : (r() < 0.5 ? 'rgba(255,255,255,0.4)' : 'rgba(110,100,80,0.06)'); g.fillRect(r() * W, y, 1 + r() * 2.5, 1 + r() * 2.5); }
    for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(110,85,45,${0.04 + r() * 0.05})`; g.beginPath(); g.ellipse(r() * W, top(10.5) + r() * 10.5 * PX, 14 + r() * 50, 8 + r() * 30, r() * 3, 0, PI * 2); g.fill(); }
    const pane = (x, y, w, h, lit, nx, ny, frame, arch = false) => {
      g.fillStyle = frame; g.fillRect(x - 0.1 * PX, y - 0.1 * PX, w + 0.2 * PX, h + 0.2 * PX);
      const gr = g.createLinearGradient(x, y, x + w * 0.6, y + h); gr.addColorStop(0, '#7b8c97'); gr.addColorStop(0.5, '#41525e'); gr.addColorStop(1, '#2b3640');
      g.fillStyle = gr; g.fillRect(x, y, w, h);
      g.fillStyle = frame; for (let i = 1; i < nx; i++) g.fillRect(x + (w * i) / nx - 1.5, y, 3, h); for (let j = 1; j < ny; j++) g.fillRect(x, y + (h * j) / ny - 1.5, w, 3);
      wins.push([x, y, w, h, lit]);
    };
    for (let b = 0; b < ATLAS.bays; b++) {
      const cx = b * BW + BW / 2, lit = () => r() < 0.28;
      // the upper floor (5.5 .. 10.5): a cream-framed window on a sill panel, a frieze under the cornice
      { const w = 1.45 * PX, h = 2.3 * PX, x = cx - w / 2, y = top(9.4); pane(x, y, w, h, lit(), 3, 3, K.cream);
        g.fillStyle = K.cream; g.fillRect(x - 0.28 * PX, y + h + 0.1 * PX, w + 0.56 * PX, 0.12 * PX);
        g.fillStyle = K.cream; g.fillRect(x - 0.1 * PX, top(6.7), w + 0.2 * PX, 0.5 * PX); g.fillStyle = '#c4b184'; g.fillRect(x + 0.1 * PX, top(6.7) + 0.1 * PX, w - 0.2 * PX, 0.3 * PX);
        g.fillStyle = K.cream; g.fillRect(x - 0.3 * PX, y - 0.28 * PX, w + 0.6 * PX, 0.12 * PX); }
      // the ground floor at the back and ends (0 .. 5.5): small barred windows, a door every other bay
      { const w = 1.0 * PX, h = 1.5 * PX, x = cx - w / 2, y = top(2.9); if (b === 1) { g.fillStyle = K.cream; g.fillRect(cx - 0.9 * PX, top(3.1), 1.8 * PX, 3.1 * PX); g.fillStyle = K.door; g.fillRect(cx - 0.75 * PX, top(2.95), 1.5 * PX, 2.95 * PX); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(cx - 0.02 * PX, top(2.95), 0.04 * PX, 2.95 * PX); }
        else pane(x, y, w, h, false, 2, 2, K.cream);
        g.fillStyle = '#8c8470'; g.fillRect(b * BW, top(0.7), BW, 0.7 * PX); }
      // the gallery wall (10.5 .. 16): a dark band, a barred window, a door in the other bays
      { g.fillStyle = '#46423d'; g.fillRect(b * BW, top(10.95), BW, 0.45 * PX);
        if (b === 1) { g.fillStyle = K.door; g.fillRect(cx - 0.75 * PX, top(13.7), 1.5 * PX, 2.8 * PX); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(cx - 0.02 * PX, top(13.7), 0.04 * PX, 2.8 * PX); }
        else pane(cx - 0.65 * PX, top(14.0), 1.3 * PX, 2.4 * PX, r() < 0.3, 2, 3, '#f6f0dc'); }
    }
  });
  const mask = canvasTex(W, Hh, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, W, Hh); for (const [x, y, w, h, lit] of wins) if (lit) { g.fillStyle = '#fff'; g.fillRect(x + 2, y + 2, w - 4, h - 4); } });
  return { tex, mask, tileW: P * ATLAS.bays, H: ATLAS.H };
}

export function buildCanons({ B, S, heightAt, atlas }) {
  const D = B.plaster, W = B.wallC, DET = B.det, T = B.tile;
  const fl = (a, b) => CAN.xz(a, b);
  // ten houses: group boundaries in bays; each has a floor (the highest ground under it plus a step)
  const cuts = Array.from({ length: 11 }, (_, k) => Math.round((k * N) / 10));
  const groups = [];
  for (let k = 0; k < 10; k++) {
    const j0 = cuts[k], j1 = cuts[k + 1], u0 = k === 0 ? 0 : c(j0), u1 = k === 9 ? 252.5 : c(j1);
    let hi = -1e9, lo = 1e9;
    for (let u = u0; u <= u1 + 0.01; u += 3) for (const v of [BACK, 40, FV + 1.5]) { const [x, z] = fl(u, v), h = heightAt(x, z); hi = Math.max(hi, h); lo = Math.min(lo, h); }
    groups.push({ k, j0, j1, u0, u1, yF: hi + 0.12, yB: lo - 0.9 });
  }
  // the houses step with the street, but never more than 0.3 m from one to the next (a house floor may stand a little over its ground)
  for (let pass = 0; pass < 2; pass++) {
    for (let k = 1; k < 10; k++) groups[k].yF = Math.min(groups[k - 1].yF + 0.3, Math.max(groups[k - 1].yF - 0.3, groups[k].yF));
    for (let k = 8; k >= 0; k--) groups[k].yF = Math.min(groups[k + 1].yF + 0.3, Math.max(groups[k + 1].yF - 0.3, groups[k].yF));
  }
  const groupOf = (u) => groups.find((g) => u <= g.u1 + 1e-6) ?? groups[9];
  // the front face frame: s along +u, o outward (+v)
  const F = (() => { const p = CAN.xz(0, FV), q = CAN.xz(252.5, FV), n = [CAN.V[0], CAN.V[1]]; return localize(CAN, mk(p, q, n)); })();
  function mk(p, q, n) { const rx = n[1], rz = -n[0], sp = p[0] * rx + p[1] * rz, sq = q[0] * rx + q[1] * rz, o = sp <= sq ? p : q; return { ax: o[0], az: o[1], rx, rz, nx: n[0], nz: n[1], w: Math.abs(sq - sp), N: [n[0], 0, n[1]], R: [rx, 0, rz], L: [-rx, 0, -rz], open: [] }; }
  let arches = 0;

  // atlas quad on a face: s0..s1, heights y0..y1 over the floor yF, tile row range (m from the atlas bottom: rowBase)
  const aq = (f, s0, s1, y0, y1, yF, rowBase = 0, o = 0) => {
    const u = (s) => (f.tOf(s) - 0.7) / atlas.tileW, v = (y) => (rowBase + (y - yF)) / atlas.H;
    quad(W, at(f, s0, y0, o), at(f, s1, y0, o), at(f, s1, y1, o), at(f, s0, y1, o), f.N, [[u(s0), v(y0)], [u(s1), v(y0)], [u(s1), v(y1)], [u(s0), v(y1)]]);
  };
  const sU = (u) => F.sOf(u);

  for (const g of groups) {
    const { yF, yB } = g, y = (h) => yF + h;
    // --- the front wall above the arches: atlas upper floor, from the crown to the eave
    const sa = sU(g.u0), sb = sU(g.u1);
    W.setColor('#ffffff');
    aq(F, Math.min(sa, sb), Math.max(sa, sb), y(CROWN), y(EAVE), yF, 0);
    // below the crown the wall is the pier tops and the spandrels (plain plaster)
    D.setColor(K.wall);
    for (let j = g.j0; j <= g.j1; j++) {
      if (j < g.j0 || j > g.j1) continue;
      // the pier head (from the cap to the crown) at pier j, only once per pier (the boundary pier belongs to the lower group)
      const cj = c(j); if (j === g.j1 && g.k < 9) continue;
      const sL = sU(cj - PW / 2), sR = sU(cj + PW / 2);
      // a pier between two houses reaches down to the lower floor and up to the higher crown, so the step leaves no hole
      const pv = j === g.j0 && g.k > 0 ? groups[g.k - 1].yF : yF, yb = Math.min(yF, pv) + SPR, yt = Math.max(yF, pv) + CROWN;
      quad(D, at(F, Math.min(sL, sR), yb, 0), at(F, Math.max(sL, sR), yb, 0), at(F, Math.max(sL, sR), yt, 0), at(F, Math.min(sL, sR), yt, 0), F.N, [[0, 0], [PW / 2.5, 0], [PW / 2.5, (yt - yb) / 2.5], [0, (yt - yb) / 2.5]]);
    }
    for (let j = g.j0; j < g.j1; j++) {
      const cm = c(j) + P / 2, uL = c(j) + PW / 2, uR = c(j + 1) - PW / 2, sL = sU(uL), sR = sU(uR), sM = sU(cm), n = 5;
      const arc = archPts(Math.min(sL, sR), Math.max(sL, sR), y(SPR), 'round', 0, n);   // from the lower-s spring over the apex
      const lo = Math.min(sL, sR), hi = Math.max(sL, sR);
      D.setColor(K.wall);
      facePoly(D, F, [[lo, y(CROWN)], ...arc.slice(0, n + 1)], 0, [2.5, 2.5]); facePoly(D, F, [[hi, y(CROWN)], ...arc.slice(n)], 0, [2.5, 2.5]);
      // the soffit: the arch's thickness back to the gallery, lit from inside (a darker plaster)
      D.setColor('#ddd6c0');
      for (let i = 0; i < arc.length - 1; i++) {
        const p = arc[i], q = arc[i + 1], mx = (p[0] + q[0]) / 2 - sM, my = (p[1] + q[1]) / 2 - y(SPR), l = Math.hypot(mx, my) || 1, ns = -mx / l, ny = -my / l;
        quad(D, at(F, p[0], p[1], 0), at(F, q[0], q[1], 0), at(F, q[0], q[1], -0.6), at(F, p[0], p[1], -0.6), [F.rx * ns, ny, F.rz * ns], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      }
      // a small keystone at the crown
      D.setColor(K.cream); fbox(D, F, sM - 0.2, sM + 0.2, y(CROWN - 0.7), y(CROWN + 0.02), 0, 0.07, 1 | 4 | 8 | 16);
      arches++;
    }
    // --- the string course over the arches and the eave cornice (stepped), along the front
    D.setColor(K.cream);
    fbox(D, F, Math.min(sa, sb), Math.max(sa, sb), y(STR), y(STR + 0.4), 0, 0.22, 1 | 16 | 32);
    fbox(D, F, Math.min(sa, sb), Math.max(sa, sb), y(EAVE - 1.0), y(EAVE - 0.7), 0, 0.15, 1 | 16 | 32);
    fbox(D, F, Math.min(sa, sb), Math.max(sa, sb), y(EAVE - 0.7), y(EAVE - 0.3), 0, 0.45, 1 | 16 | 32);
    fbox(D, F, Math.min(sa, sb), Math.max(sa, sb), y(EAVE - 0.3), y(EAVE), 0, 0.7, 1 | 16 | 32);
    // --- the gallery: floor, ceiling, back wall (atlas, white row)
    // the back wall faces the front (+v): its normal is +V, at v = FV - GAL
    const bw = (() => { const p = CAN.xz(g.u0, FV - GAL), q = CAN.xz(g.u1, FV - GAL); return localize(CAN, mk(p, q, [CAN.V[0], CAN.V[1]])); })();
    W.setColor('#ffffff'); aq(bw, 0, bw.w, y(0), y(CROWN + 0.05), yF, 10.5);
    // the ceiling (one flat slab) and the floor
    const ce = [at(bw, 0, y(CROWN - 0.1), 0), at(bw, bw.w, y(CROWN - 0.1), 0), at(bw, bw.w, y(CROWN - 0.1), GAL), at(bw, 0, y(CROWN - 0.1), GAL)];
    D.setColor('#e9e2cf'); quad(D, ce[0], ce[1], ce[2], ce[3], [0, -1, 0], [[0, 0], [bw.w / 2.5, 0], [bw.w / 2.5, GAL / 2.5], [0, GAL / 2.5]]);
    DET.setColor('#8b7a62'); quad(DET, at(bw, 0, yF + 0.03, 0), at(bw, bw.w, yF + 0.03, 0), at(bw, bw.w, yF + 0.03, GAL), at(bw, 0, yF + 0.03, GAL), UP);
  }
  // --- the piers: granite plinth, white shaft, stepped cap
  for (let j = 0; j <= N; j++) {
    const cj = c(j), g = groupOf(cj + (j === 0 ? 0.01 : -0.01));
    const yF = j === g.j1 && groups[g.k + 1] ? Math.max(g.yF, groups[g.k + 1].yF) : g.yF, y = (h) => yF + h;
    const x0 = cj - PW / 2, x1 = cj + PW / 2, v1 = FV, v0 = FV - PD;
    const box = (B_, ax, bx, y0, y1, o0, o1, mask) => B_.with(CAN.m(0), (q) => q.box(ax, y0, v1 - o1, bx, y1, v1 - o0, mask));
    DET.setColor(K.granite); box(DET, cj - 0.72, cj + 0.72, g.yB, y(PL), -0.05, PD + 0.05, 63 & ~32);
    D.setColor(K.white); box(D, x0, x1, y(PL), y(SPR - 0.3), 0, PD, 63 & ~32);
    box(D, cj - 0.72, cj + 0.72, y(SPR - 0.3), y(SPR - 0.2), -0.06, PD + 0.06, 63 & ~32); box(D, cj - 0.82, cj + 0.82, y(SPR - 0.2), y(SPR), -0.16, PD + 0.16, 63);
  }
  // --- the back wall of the row (v = 31.7), the ends, and the cross wing: atlas walls, floor to eave, per house
  const ring = [[0, BACK], [227.2, BACK], [227.2, 0.05], [237, 0.05], [237, BACK], [252.5, BACK], [252.5, FV], [0, FV]];
  const world = CAN.ring(ring);
  for (const f of wallFaces(world).map((f) => localize(CAN, f))) {
    if (f.nv === 1 && f.w > 100) continue; // the arcade front
    const along = Math.abs(f.nu) ? 'v' : 'u';
    // split by house where it runs along u; one piece otherwise
    const pieces = along === 'u' ? groups.map((g) => [g, Math.min(f.sOf(g.u0), f.sOf(g.u1)), Math.max(f.sOf(g.u0), f.sOf(g.u1))]) : [[groupOf(f.fixed), 0, f.w]];
    for (const [g, s0, s1] of pieces) {
      const clip0 = Math.max(0, s0), clip1 = Math.min(f.w, s1); if (clip1 - clip0 < 0.05) continue;
      W.setColor('#ffffff'); aq(f, clip0, clip1, g.yB, g.yF + EAVE, g.yF, 0);
      D.setColor(K.granite); fbox(D, f, clip0, clip1, g.yB, g.yF + 0.8, 0, 0.1, 1 | 16);
      D.setColor(K.cream); fbox(D, f, clip0, clip1, g.yF + EAVE - 1.0, g.yF + EAVE - 0.7, 0, 0.15, 1 | 16 | 32); fbox(D, f, clip0, clip1, g.yF + EAVE - 0.7, g.yF + EAVE - 0.3, 0, 0.45, 1 | 16 | 32); fbox(D, f, clip0, clip1, g.yF + EAVE - 0.3, g.yF + EAVE, 0, 0.7, 1 | 16 | 32);
    }
  }

  // --- roofs: a gable per house along the row (hips at the two ends), the wing's gable across
  let chimneys = 0;
  T.with(CAN.m(0), (q) => {
    q.setColor(K.roof);
    for (const g of groups) gableRoof(q, g.u0 - (g.k ? 0.4 : 0), g.u1 + (g.k < 9 ? 0.4 : 0), BACK, FV, g.yF + EAVE, g.yF + RIDGE, { ax: 'u', ov: 0.6, hip0: g.k === 0, hip1: g.k === 9 });
    const wg = groups[9];
    gableRoof(q, 0.05, BACK + 6, 227.2, 237, wg.yF + EAVE, wg.yF + EAVE + 2.4, { ax: 'v', ov: 0.55, hip0: true, hip1: false });
  });
  for (const g of groups) for (const f of [0.3, 0.7]) {
    const u = g.u0 + (g.u1 - g.u0) * f, yR = g.yF + RIDGE, v = (BACK + FV) / 2;
    D.with(CAN.m(0), (q) => { q.setColor(K.white); q.box(u - 0.55, yR - 1.2, v - 0.55, u + 0.55, yR + 1.6, v + 0.55); q.setColor(K.cream); q.box(u - 0.7, yR + 1.6, v - 0.7, u + 0.7, yR + 1.9, v + 0.7); q.setColor('#2b2724'); q.box(u - 0.5, yR + 1.9, v - 0.5, u + 0.5, yR + 1.94, v + 0.5, 4); });
    chimneys++;
  }

  // --- collision: the piers, the back wall of the gallery and the rooms behind it
  for (let j = 0; j <= N; j++) { const g = groupOf(c(j) - 0.01); const [x, z] = CAN.xz(c(j), FV - PD / 2); S.obox(x, z, PW / 2, PD / 2, Math.atan2(CAN.U[1], CAN.U[0]), g.yB, g.yF + CROWN + 0.2, 'wall'); }
  for (const g of groups) {
    const rr = [[g.u0, BACK], [g.u1, BACK], [g.u1, FV - GAL], [g.u0, FV - GAL]];
    S.prism(CAN.ring(rr).flat(), g.yB, g.yF + EAVE + 3, 0, 0, 'wall');
    const rf = [[g.u0, FV - GAL - 0.1], [g.u1, FV - GAL - 0.1], [g.u1, FV], [g.u0, FV]];
    S.prism(CAN.ring(rf).flat(), g.yF + CROWN, g.yF + EAVE + 3, 0, 0, 'wall');
  }
  S.prism(CAN.ring([[227.2, 0.05], [237, 0.05], [237, BACK], [227.2, BACK]]).flat(), groups[9].yB, groups[9].yF + EAVE + 2, 0, 0, 'wall');
  return { arches, chimneys, groups, footprints: [{ poly: world, h: EAVE + 3.5, kind: 'public', name: 'Șirul Canonicilor', id: CANONS_SKIP[0] }] };
}
