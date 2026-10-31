// OWNER: oradea. Grădina Zoologică Oradea (Calea Matei Basarab 30, the zoo area is OSM way 290565675 with no building footprint), the light
// scope: the entrance gate and ticket house on the main alley, the Rhédey chapel with its fenced deer yard (the chapel the zoo's manager
// fenced in to save it from demolition, quest card 'zoo-chapel'), a few fenced paddocks with a shelter and a pond. No animals. Not a site module.
//   buildZoo({ B, S, g, r, map }) -> { footprints, clear(x, z), stats }   B: the builders of ./kit.js
//   GATE_FROM, GATE_DIR   where the main alley leaves the road and its direction (the OSM footway from (-382, 818));  CHAPEL_AT  the card's spot
// Guesses: the gate, ticket house, paddocks and their furniture are typical of a small city zoo (no photograph was read); the chapel's
// shape is a small neoclassical single-nave chapel with a porch, a bell turret and a gable roof, built from its description (the count's
// early-19th-century chapel); its exact place is searched round the quest card's spot clear of the OSM buildings.
import { M4 } from '../../../../kit/mesh.js';
import { ringFaces, skin, hole, quad } from '../../../cherkasy/slabkit.js';
import { COL, fenceRun, tuft, inRing } from './kit.js';

export const GATE_FROM = [-382, 818], GATE_DIR = [-0.906, 0.423], CHAPEL_AT = [-578.3, 935.6];
const ok = (h, d = 0) => (Number.isFinite(h) ? h : d);

// local frame: origin c, u along (cos a, -sin a) as M4(yaw = a) maps it; toMap(u, v) for collision and fences
const frame = (cx, cz, a) => ({ cx, cz, a, toMap: (u, v) => [cx + u * Math.cos(a) + v * Math.sin(a), cz - u * Math.sin(a) + v * Math.cos(a)], xf: M4(cx, 0, cz, a) });
const withFrame = (B, fr, keys, fn) => { for (const k of keys) B[k].setXf(fr.xf); try { fn(); } finally { for (const k of keys) B[k].setXf(null); } };
const FR = ['wall', 'roof', 'det', 'glass', 'lit', 'board'];

// a gable roof on the local rectangle u0..u1 x v0..v1, ridge along u (x2 to turn it), eave height ye, rise, overhang
function gable(B, { u0, u1, v0, v1, ye, rise, over = 0.5, col = COL.roofSlate, gcol = COL.cream, open = false }) {
  const vm = (v0 + v1) / 2, half = (v1 - v0) / 2, yr = ye + rise, ya = ye - rise * over / half, ov = half + over;
  B.roof.setColor(col);
  B.roof.face([[u0 - over, ya, v0 - over], [u1 + over, ya, v0 - over], [u1 + over, yr, vm], [u0 - over, yr, vm]], [0, ov, -rise - rise * over / half].map((q, i, a) => q / Math.hypot(...a)));
  B.roof.face([[u0 - over, ya, v1 + over], [u1 + over, ya, v1 + over], [u1 + over, yr, vm], [u0 - over, yr, vm]], [0, ov, rise + rise * over / half].map((q, i, a) => q / Math.hypot(...a)));
  if (!open) { B.wall.setColor(gcol); B.wall.face([[u0, ye, v0], [u0, ye, v1], [u0, yr, vm]], [-1, 0, 0]); B.wall.face([[u1, ye, v0], [u1, ye, v1], [u1, yr, vm]], [1, 0, 0]); }
  B.roof.setColor(COL.roofDark); B.roof.tube([u0 - over, yr, vm], [u1 + over, yr, vm], 0.09, 4);
}

// walls of a local rectangle by ringFaces; wins(f, i) adds the openings of each face before the skin is laid
function room(B, { u0, u1, v0, v1, y0, ye, wall, plinth = COL.plinth, ph = 0.55 }, wins) {
  const fs = ringFaces([[u0, v0], [u1, v0], [u1, v1], [u0, v1]].reverse()); // positive ring: (u, v) with v = z; reverse so the normals face out in the local frame
  fs.forEach((f, i) => { wins?.(f, i); skin(B.wall, f, y0, y0 + ph, plinth, [2.5, 2.5]); skin(B.wall, f, y0 + ph, ye, wall, [2.5, 2.5]); });
  return fs;
}
const open = (B, f, q, yF) => { const o = { dep: 0.2, rev: COL.white, frame: COL.white, glass: COL.glass, lit: true, pitch: 1.0, ...q, y0: yF + q.y0, y1: yF + q.y1 }; f.cuts.push(o); hole(B, f, o); };

// rectangles in map space (centre, half sizes, angle) are free when no OSM building, road or footway touches them
function freeRect(ctx, cx, cz, hu, hv, a, pad = 1.5) {
  const fr = frame(cx, cz, a), P = [];
  for (let iu = -hu - pad; iu <= hu + pad + 0.01; iu += 2) for (let iv = -hv - pad; iv <= hv + pad + 0.01; iv += 2) P.push(fr.toMap(Math.max(-hu - pad, Math.min(hu + pad, iu)), Math.max(-hv - pad, Math.min(hv + pad, iv))));
  for (const b of ctx.bld) { if (P.some(([x, z]) => inRing(b.ring, x, z))) return false; if (b.ring.some(([x, z]) => { const [u, v] = [(x - cx) * Math.cos(a) - (z - cz) * Math.sin(a), (x - cx) * Math.sin(a) + (z - cz) * Math.cos(a)]; return Math.abs(u) < hu + pad && Math.abs(v) < hv + pad; })) return false; }
  for (const L of ctx.lines) for (const [x, z] of P) if (L.d(x, z) < L.w / 2 + 1.0) return false;
  return true;
}
function lineDist(p) { // distance from (x, z) to a polyline [x0, z0, x1, z1, ...]
  return (x, z) => { let best = 1e9; for (let i = 0; i + 3 < p.length; i += 2) { const ax = p[i], az = p[i + 1], ex = p[i + 2] - ax, ez = p[i + 3] - az, L2 = ex * ex + ez * ez || 1, f = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / L2)); best = Math.min(best, Math.hypot(x - ax - ex * f, z - az - ez * f)); } return best; };
}

export function buildZoo({ B, S, g, r, map }) {
  const stats = { gate: 0, paddocks: 0, chapel: 0 }, foots = [], keep = [];
  // what is already on the ground round the zoo
  const near = (x, z, R) => Math.hypot(x - CHAPEL_AT[0], z - CHAPEL_AT[1]) < R || Math.hypot(x - GATE_FROM[0], z - GATE_FROM[1]) < R;
  const ctx = {
    bld: (map.buildings ?? []).filter((b) => { for (let i = 0; i < b.p.length; i += 2) if (near(b.p[i], b.p[i + 1], 330)) return true; return false; }).map((b) => ({ ring: Array.from({ length: b.p.length / 2 }, (_, i) => [b.p[2 * i], b.p[2 * i + 1]]) })),
    lines: (map.roads ?? []).filter((rd) => { for (let i = 0; i < rd.p.length; i += 2) if (near(rd.p[i], rd.p[i + 1], 330)) return true; return false; }).map((rd) => ({ d: lineDist(rd.p), w: rd.w ?? 3 })),
  };
  const place = (cx0, cz0, hu, hv, a, R = 36) => { // the free spot nearest the wish
    let best = null;
    for (let dx = -R; dx <= R; dx += 4) for (let dz = -R; dz <= R; dz += 4) { const d = Math.hypot(dx, dz); if ((!best || d < best.d) && freeRect(ctx, cx0 + dx, cz0 + dz, hu, hv, a)) best = { x: cx0 + dx, z: cz0 + dz, d }; }
    return best;
  };

  // ---- the gate and ticket house on the main alley
  {
    const [gx, gz] = [GATE_FROM[0] + GATE_DIR[0] * 16, GATE_FROM[1] + GATE_DIR[1] * 16], a = Math.atan2(-GATE_DIR[1], GATE_DIR[0]) , fr = frame(gx, gz, a), gy = ok(g(gx, gz)) + 0.02;
    // local u runs the way the path runs (into the zoo), v across it
    withFrame(B, fr, FR, () => {
      const D = B.det, W = B.wall;
      for (const s of [-1, 1]) { // the two pylons: a brick shaft on a stone plinth with a cap and a lamp
        const v = s * 3.45;
        W.setColor(COL.stone); W.box(-0.65, gy - 0.3, v - 0.65, 0.65, gy + 0.7, v + 0.65, 63);
        W.setColor(COL.brick); W.box(-0.5, gy + 0.7, v - 0.5, 0.5, gy + 4.1, v + 0.5, 63);
        W.setColor(COL.stoneL); W.box(-0.68, gy + 4.1, v - 0.68, 0.68, gy + 4.35, v + 0.68, 63); W.box(-0.4, gy + 4.35, v - 0.4, 0.4, gy + 4.6, v + 0.4, 63);
        B.lit.setColor(COL.lamp); B.lit.ellipsoid([0, gy + 4.85, v], [0.28, 0.32, 0.28], 6, 4);
      }
      // the name board between the pylons, on a steel frame, readable from the street and from inside
      const bw = 5.3, bh = 1.0, bYc = gy + 3.55;
      D.setColor(COL.steel); D.box(-0.12, bYc - bh / 2 - 0.12, -bw / 2 - 0.1, 0.12, bYc - bh / 2, bw / 2 + 0.1, 63); D.box(-0.12, bYc + bh / 2, -bw / 2 - 0.1, 0.12, bYc + bh / 2 + 0.12, bw / 2 + 0.1, 63);
      for (const s of [-1, 1]) { D.box(-0.12, bYc - bh / 2, s * (bw / 2 + 0.02) - 0.06, 0.12, bYc + bh / 2, s * (bw / 2 + 0.02) + 0.06, 63); }
      // front (towards the street, -u) and back (+u): u of the quad runs along v as seen by the viewer
      quad(B.board, [-0.13, bYc - bh / 2, bw / 2], [-0.13, bYc - bh / 2, -bw / 2], [-0.13, bYc + bh / 2, -bw / 2], [-0.13, bYc + bh / 2, bw / 2], [-1, 0, 0], [[1, 0], [0, 0], [0, 1], [1, 1]]);
      quad(B.board, [0.13, bYc - bh / 2, -bw / 2], [0.13, bYc - bh / 2, bw / 2], [0.13, bYc + bh / 2, bw / 2], [0.13, bYc + bh / 2, -bw / 2], [1, 0, 0], [[1, 0], [0, 0], [0, 1], [1, 1]]);
      // brick wing walls (a low plinth wall each side, the iron bars are fences on top)
      for (const s of [-1, 1]) { W.setColor(COL.brick); W.box(-0.2, gy - 0.3, s * 4.1, 0.2, gy + 0.65, s * 15, 63); }
    });
    for (const s of [-1, 1]) {
      const p0 = fr.toMap(0, s * 4.1), p1 = fr.toMap(0, s * 15);
      fenceRun(B, S, g, [p0, p1], { h: 1.5, base: 0.65, col: COL.iron, post: COL.brick });
      const c = fr.toMap(0, s * 3.45); S.cyl(c[0], c[1], gy - 0.5, gy + 4.8, 0.85, 0.85, 'pole', 0);
    }
    stats.gate = 1;
    // the ticket house, 6 m before the gate on the left of the path, its window on the path side
    const th = fr.toMap(-7.5, -7.4), tfr = frame(th[0], th[1], a), ty = ok(g(th[0], th[1])) + 0.05;
    withFrame(B, tfr, FR, () => {
      const R = { u0: -2.6, u1: 2.6, v0: -1.8, v1: 1.8, y0: ty - 0.3, ye: ty + 2.8, wall: COL.white };
      room(B, R, (f, i) => { // faces: the ring is reversed, find the +v side (towards the path) by its normal in the local frame
        if (f.nz > 0.5) { open(B, f, { s0: f.L / 2 - 1.3, s1: f.L / 2 + 1.3, y0: 1.0, y1: 2.3, pitch: 1.3, dep: 0.15 }, ty); }
        else if (f.nx < -0.5) { open(B, f, { s0: f.L / 2 - 0.5, s1: f.L / 2 + 0.5, y0: 0.05, y1: 2.15, door: true, pitch: 1.0, rev: COL.white, frame: COL.door }, ty); }
      }, ty);
      gable(B, { u0: -2.6, u1: 2.6, v0: -1.8, v1: 1.8, ye: ty + 2.8, rise: 1.3, over: 0.55, col: '#3f6a4d', gcol: COL.white });
      B.det.setColor(COL.timberD); B.det.box(-1.6, ty + 0.9, 1.8, 1.6, ty + 0.98, 2.15, 63); // the counter shelf
    });
    S.obox(th[0], th[1], 2.6, 1.8, -a, ty - 0.3, ty + 3.2, 'wall', 0);
    foots.push({ poly: [[-2.6, -1.8], [2.6, -1.8], [2.6, 1.8], [-2.6, 1.8]].map(([u, v]) => tfr.toMap(u, v)), h: 4.2, kind: 'shop', name: 'Casa de bilete', id: 'verde:ticket' });
    keep.push([[-3, -2.2], [3, -2.2], [3, 2.2], [-3, 2.2]].map(([u, v]) => tfr.toMap(u, v)));
    keep.push([[-13, -16], [5, -16], [5, 16], [-13, 16]].map(([u, v]) => fr.toMap(u, v))); // the plaza: no generated tree in the way of the path
    stats.gateAt = [Math.round(gx), Math.round(gz)];
  }

  // ---- the Rhédey chapel in its fenced deer yard
  {
    const walk = (map.roads ?? []).filter((rd) => rd.c === 'footway' || rd.c === 'path').map((rd) => rd.p);
    let aim = null, ad = 1e9; // the nearest footway point: the chapel turns its porch to it
    for (const p of walk) for (let i = 0; i < p.length; i += 2) { const d = Math.hypot(p[i] - CHAPEL_AT[0], p[i + 1] - CHAPEL_AT[1]); if (d < ad) { ad = d; aim = [p[i], p[i + 1]]; } }
    const to = aim ?? [CHAPEL_AT[0] + 20, CHAPEL_AT[1] + 20];
    // local u runs from the porch to the apse; the porch points at the footway: u = away from it
    const ang = Math.atan2(CHAPEL_AT[1] - to[1], CHAPEL_AT[0] - to[0]); // direction of +u in map space
    const a = -ang;                                                      // M4(yaw) maps local +u to (cos a, -sin a)
    const HU = 12.5, HV = 9.5; // the yard
    const sp = place(CHAPEL_AT[0], CHAPEL_AT[1], HU, HV, a, 40) ?? { x: CHAPEL_AT[0], z: CHAPEL_AT[1] };
    const fr = frame(sp.x, sp.z, a), cy = ok(g(sp.x, sp.z)) + 0.05;
    withFrame(B, fr, FR, () => {
      const L = 11.5, Wd = 6.8, hl = L / 2, hw = Wd / 2, ye = cy + 4.6, u0 = -hl, u1 = hl;
      room(B, { u0, u1, v0: -hw, v1: hw, y0: cy - 0.4, ye, wall: COL.cream, plinth: COL.stone, ph: 0.7 }, (f) => {
        const along = Math.abs(f.nz) > 0.5; // the long walls: three tall windows; the porch end carries the door; the apse end a round window
        if (along) for (let k = 0; k < 3; k++) { const c = f.L * (k + 1) / 4; open(B, f, { s0: c - 0.6, s1: c + 0.6, y0: 1.4, y1: 3.9, pitch: 1.2, dep: 0.25 }, cy); }
        else if (f.nx < -0.5) open(B, f, { s0: f.L / 2 - 0.85, s1: f.L / 2 + 0.85, y0: 0.7, y1: 3.4, door: true, pitch: 1.7, rev: COL.white, frame: COL.door, glass: '#3a2c22', lit: false, dep: 0.3 }, cy);
      });
      // corner pilasters and the cornice
      B.det.setColor(COL.white);
      for (const [u, v] of [[u0, -hw], [u0, hw], [u1, -hw], [u1, hw]]) B.det.box(u - (u < 0 ? 0.05 : 0.25), cy - 0.3, v - (v < 0 ? 0.05 : 0.25), u + (u < 0 ? 0.25 : 0.05), ye, v + (v < 0 ? 0.25 : 0.05), 63);
      B.det.box(u0 - 0.2, ye - 0.35, -hw - 0.2, u1 + 0.2, ye, hw + 0.2, 63);
      gable(B, { u0, u1, v0: -hw, v1: hw, ye, rise: 2.5, over: 0.45, col: COL.roofSlate, gcol: COL.cream });
      // the porch: two columns under a small pediment, three steps
      B.det.setColor(COL.stoneL); B.det.box(u0 - 2.2, cy - 0.5, -2.0, u0, cy - 0.04, 2.0, 63); B.det.box(u0 - 2.6, cy - 0.5, -2.3, u0 - 2.2, cy - 0.2, 2.3, 63);
      for (const v of [-1.5, 1.5]) { B.det.setColor(COL.white); B.det.cyl(u0 - 1.7, cy - 0.04, v, 0.2, 0.17, 3.9, 8); }
      B.det.setColor(COL.white); B.det.box(u0 - 2.1, cy + 3.84, -1.95, u0 + 0.05, cy + 4.1, 1.95, 63);
      B.wall.setColor(COL.cream); B.wall.face([[u0 - 2.0, cy + 4.1, -2.0], [u0 - 2.0, cy + 4.1, 2.0], [u0 - 2.0, cy + 5.1, 0]], [-1, 0, 0]);
      B.roof.setColor(COL.roofSlate);
      B.roof.face([[u0 - 2.15, cy + 4.1, -2.1], [u0 + 0.05, cy + 4.1, -2.1], [u0 + 0.05, cy + 5.2, 0], [u0 - 2.15, cy + 5.2, 0]], [0, 0.9, -0.45].map((q, i, aa) => q / Math.hypot(...aa)));
      B.roof.face([[u0 - 2.15, cy + 4.1, 2.1], [u0 + 0.05, cy + 4.1, 2.1], [u0 + 0.05, cy + 5.2, 0], [u0 - 2.15, cy + 5.2, 0]], [0, 0.9, 0.45].map((q, i, aa) => q / Math.hypot(...aa)));
      // the bell turret on the porch end of the ridge
      B.wall.setColor(COL.white); B.wall.box(u0 + 0.5, cy + 6.6, -0.7, u0 + 1.9, cy + 8.2, 0.7, 63);
      B.det.setColor(COL.steel); B.det.box(u0 + 0.9, cy + 7.0, -0.72, u0 + 1.5, cy + 7.9, 0.72, 63);
      B.roof.setColor(COL.roofDark);
      { const ub = [u0 + 0.4, u0 + 2.0], vb = [-0.8, 0.8], ap = [u0 + 1.2, cy + 9.8, 0], yb = cy + 8.2;
        B.roof.face([[ub[0], yb, vb[0]], [ub[1], yb, vb[0]], ap], [0, 0.5, -1]); B.roof.face([[ub[0], yb, vb[1]], [ub[1], yb, vb[1]], ap], [0, 0.5, 1]);
        B.roof.face([[ub[0], yb, vb[0]], [ub[0], yb, vb[1]], ap], [-1, 0.5, 0]); B.roof.face([[ub[1], yb, vb[0]], [ub[1], yb, vb[1]], ap], [1, 0.5, 0]); }
      B.det.setColor(COL.gold); B.det.box(u0 + 1.17, cy + 9.8, -0.03, u0 + 1.23, cy + 10.4, 0.03, 63); B.det.box(u0 + 1.17, cy + 10.1, -0.2, u0 + 1.23, cy + 10.17, 0.2, 63);
      // a small apse-end round window above the altar is left blank; a lamp by the door
      B.lit.setColor(COL.lamp); B.lit.ellipsoid([u0 - 0.05, cy + 3.7, 1.35], [0.12, 0.16, 0.12], 6, 4);
    });
    S.obox(sp.x, sp.z, 5.75, 3.4, -a, cy - 0.4, cy + 7.2, 'wall', 0);
    const ring = [[-5.75, -3.4], [5.75, -3.4], [5.75, 3.4], [-5.75, 3.4]].map(([u, v]) => fr.toMap(u, v));
    foots.push({ poly: ring, h: 12, kind: 'church', name: t0('Capela Rhédey'), id: 'verde:chapel' });
    // the yard: iron bar fence, a gate gap on the porch side, gravel in front of the porch, a timber shelter in the back corner, a hay rack
    const C = (u, v) => fr.toMap(u, v), fy = (p) => p;
    const gapU = -HU, corners = [C(-HU, -HV), C(HU, -HV), C(HU, HV), C(-HU, HV)];
    fenceRun(B, S, g, [corners[0], corners[1], corners[2], corners[3], C(-HU, 1.5)], { h: 1.7, col: COL.iron, post: COL.stone });
    fenceRun(B, S, g, [C(-HU, -1.5), corners[0]], { h: 1.7, col: COL.iron, post: COL.stone });
    void gapU; void fy;
    // gate leaves swung open
    B.det.setColor(COL.iron);
    stats.chapel = 1;
    withFrame(B, fr, FR, () => {
      // the shelter: a lean-to on four posts in the back corner (deer shelter), hay under it
      const su = HU - 4.2, sv = HV - 2.6, sy = ok(g(...C(su, sv))) + 0.05;
      B.det.setColor(COL.timberD);
      for (const [u, v] of [[su - 1.8, sv - 1.2], [su + 1.8, sv - 1.2], [su - 1.8, sv + 1.2], [su + 1.8, sv + 1.2]]) B.det.box(u - 0.08, sy, v - 0.08, u + 0.08, sy + 2.2, v + 0.08, 63);
      gable(B, { u0: su - 1.8, u1: su + 1.8, v0: sv - 1.2, v1: sv + 1.2, ye: sy + 2.2, rise: 0.7, over: 0.4, col: COL.timberD, open: true });
      B.det.setColor(COL.hay); B.det.box(su - 1.2, sy, sv - 0.4, su + 0.2, sy + 0.45, sv + 0.5, 63);
      S.obox(...C(su, sv), 1.8, 1.2, -a, sy, sy + 2.2, 'wall', 0);
    });
    keep.push([[-HU - 1.5, -HV - 1.5], [HU + 1.5, -HV - 1.5], [HU + 1.5, HV + 1.5], [-HU - 1.5, HV + 1.5]].map(([u, v]) => fr.toMap(u, v)));
    stats.chapelAt = [Math.round(sp.x), Math.round(sp.z)];
    // a gravel path from the footway to the yard gate
    const gate0 = C(-HU, 0), path = [gate0, to];
    for (let i = 0; i < path.length - 1; i++) { const [ax, az] = path[i], [bx, bz] = path[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / 3)), nx = -(bz - az) / L * 0.9, nz = (bx - ax) / L * 0.9; B.ground.setColor(COL.gravel); for (let k = 0; k < n; k++) { const x0 = ax + (bx - ax) * k / n, z0 = az + (bz - az) * k / n, x1 = ax + (bx - ax) * (k + 1) / n, z1 = az + (bz - az) * (k + 1) / n; const f0 = B.ground.v; B.ground.fill([[x0 - nx, z0 - nz], [x1 - nx, z1 - nz], [x1 + nx, z1 + nz], [x0 + nx, z0 + nz]], [], 0, true); for (let v = f0; v < B.ground.v; v++) { const o = v * 11, A = B.ground.buf.a; A[o + 1] = ok(g(A[o], A[o + 2])) + 0.17; A[o + 6] = A[o] / 3; A[o + 7] = A[o + 2] / 3; } } }
    stats.yardRect = [HU, HV];
  }

  // ---- paddocks along the main alley: a fence, a shelter and a pond each, where the ground is free
  {
    const ALLEY = [[-410, 831], [-431, 845], [-479, 880], [-532, 928], [-557, 957]];
    let placed = 0;
    for (const [t, side] of [[0.35, 1], [0.55, -1], [0.75, 1], [0.2, -1], [0.62, 1]]) {
      if (placed >= 3) break;
      const i = Math.min(ALLEY.length - 2, Math.floor(t * (ALLEY.length - 1))), f = t * (ALLEY.length - 1) - i, [ax, az] = ALLEY[i], [bx, bz] = ALLEY[i + 1];
      const ux = bx - ax, uz = bz - az, L = Math.hypot(ux, uz), nx = -uz / L * side, nz = ux / L * side, px = ax + ux * f, pz = az + uz * f, a = Math.atan2(-(uz / L), ux / L);
      const hu = 9, hv = 7, s = place(px + nx * (hv + 5), pz + nz * (hv + 5), hu, hv, a, 14);
      if (!s) continue;
      const fr = frame(s.x, s.z, a), C = (u, v) => fr.toMap(u, v), y0 = ok(g(s.x, s.z)) + 0.05;
      fenceRun(B, S, g, [C(-hu, -hv), C(hu, -hv), C(hu, hv), C(-hu, hv), C(-hu, -hv + 0.01)], { h: 1.7, col: COL.iron, post: COL.stone });
      withFrame(B, fr, FR, () => { // a shelter on posts against the back fence, a rounded rock-edged pond
        const su = 0, sv = side > 0 ? hv - 1.8 : -(hv - 1.8);
        B.det.setColor(COL.timberD);
        for (const [u, v] of [[su - 2, sv - 1.2], [su + 2, sv - 1.2], [su - 2, sv + 1.2], [su + 2, sv + 1.2]]) B.det.box(u - 0.09, y0, v - 0.09, u + 0.09, y0 + 2.3, v + 0.09, 63);
        gable(B, { u0: su - 2, u1: su + 2, v0: sv - 1.2, v1: sv + 1.2, ye: y0 + 2.3, rise: 0.8, over: 0.4, col: '#6a5a3e', open: true });
      });
      const px2 = C(-3.5, -sv(side, hv)), pr = 2.8;
      const pond = Array.from({ length: 14 }, (_, k) => [px2[0] + Math.cos(k / 14 * Math.PI * 2) * pr * (1 + 0.25 * Math.sin(k * 1.7)), px2[1] + Math.sin(k / 14 * Math.PI * 2) * pr * 0.7 * (1 + 0.2 * Math.cos(k * 2.3))]);
      B.ground.setColor(COL.pond); { const f0 = B.ground.v; B.ground.fill(pond, [], 0, true); for (let v = f0; v < B.ground.v; v++) { const o = v * 11, A = B.ground.buf.a; A[o + 1] = ok(g(px2[0], px2[1])) + 0.172; A[o + 6] = 0.5; A[o + 7] = 0.5; } }
      for (let k = 0; k < pond.length; k++) tuft(B.det, pond[k][0], ok(g(pond[k][0], pond[k][1])), pond[k][1], 0.28 + r() * 0.15, COL.stone, 0.7);
      S.obox(...C(0, side > 0 ? hv - 1.8 : -(hv - 1.8)), 2, 1.2, -a, y0, y0 + 2.4, 'wall', 0);
      keep.push([[-hu - 1.5, -hv - 1.5], [hu + 1.5, -hv - 1.5], [hu + 1.5, hv + 1.5], [-hu - 1.5, hv + 1.5]].map(([u, v]) => fr.toMap(u, v)));
      placed++; stats.paddocks++; (stats.paddockAt ??= []).push([Math.round(s.x), Math.round(s.z)]);
    }
  }
  return { footprints: foots, clear: (x, z) => keep.some((P) => inRing(P, x, z)), stats };
}
const sv = (side, hv) => (side > 0 ? hv - 1.8 : -(hv - 1.8));
const t0 = (s) => s;
