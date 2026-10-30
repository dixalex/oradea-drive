// OWNER: oradea. The Great Orthodox Synagogue of Oradea (Sinagoga Mare Ortodoxă, Strada Mihai Viteazul 4, OSM way 286239557): built 1890 to
// plans by Bach Nándor, a hall with a women's gallery on three sides, restored 2009–2018 (re-inaugurated 4 September 2018). Built after the
// Wikimedia Commons photographs of April 2023 (front and corner views, IMG 01–03), the 2010 side view and the 1970 view:
//   a cream-rendered block 22.4 x 30 m whose west front looks at the street: three arched doors under a plaque, an ochre string course, a
//   round-arched blind frame holding three horseshoe-headed lancets and three rosettes, a brick gable with a circular window and the two
//   tablets on its apex, two corner towers under silver onion domes on iron-railed platforms, scrolled brick-faced wings with a round
//   window, ball-topped corner piers; the long sides in seven bays of tall arched windows over smaller ones between pilasters, ochre bands;
//   a lower flat-roofed annex at the east end; the front yard behind its iron railing on a low wall.
// No lettering is drawn (the plaque and the tablets are plain), and the only symbol is the six-pointed star in the gable's round window, which
// the photographs show.
//   buildGreatSyn({ B, S, g, ring }) -> { footprints, stats, clear }
import {
  PI, TAU, begin, end, edgeFrame, at, nrm, rect, slab, poly, win, outline, frontFrame, sideFrame, gable, lathe, PROFILES, ball, groundOf,
} from './kit.js';
import { frameOf } from './church.js';

export const GREATSYN_ID = 286239557;
const C = {
  wall: '#f1e8cb', ochre: '#e3a431', white: '#f7f3ea', brick: '#b04a36', roof: '#7b3f32', dome: '#868d95', stone: '#bab5a9', iron: '#25272a',
  door: '#5a3b28', glass: '#2d3b53', rose: '#5c2f34', plinth: '#c9c4b6',
};

export function buildGreatSyn({ B, S, g, ring }) {
  const F = frameOf(ring, { yaw: -13.3 }), toW = F.toMap, st = { windows: 0, towers: 2 };
  const { Fy, gLo } = groundOf(ring, g), Y = (h) => Fy + h;
  const { minU, maxU, minV, maxV } = F, W = maxV - minV, vc = (minV + maxV) / 2, X = (sw) => minV + sw;   // sw: metres from the left edge, seen from outside
  const EAVE = 12.2, uAnnex = maxU - 4.8;
  begin(B, F.cx, F.cz, F.yaw);
  const WL = B.wall, BR = B.brick, DT = B.det, LT = B.lit, CP = B.cap;
  const ff = frontFrame(minU, minV, maxV, -1);

  // ---------------------------------------------------------------- the main block: walls, plinth, bands
  const long = [sideFrame(maxV, minU, uAnnex, 1), sideFrame(minV, minU, uAnnex, -1)];
  WL.setColor(C.wall); ff.rect(WL, minV, maxV, gLo, Y(EAVE));
  WL.setColor(C.plinth); ff.slab(WL, minV - 0.05, maxV + 0.05, gLo, Y(0.7), 0, 0.14, 'ft');
  for (const sf of long) { WL.setColor(C.wall); sf.rect(WL, minU, uAnnex, gLo, Y(EAVE)); WL.setColor(C.plinth); sf.slab(WL, minU, uAnnex, gLo, Y(0.7), 0, 0.14, 'ft'); }
  // string course (ochre between white mouldings) and the cornice band, round all three sides
  const bands = (F2, w0, w1) => {
    WL.setColor(C.ochre); F2.slab(WL, w0, w1, Y(5.35), Y(6.1), 0, 0.12, 'ft');
    WL.setColor(C.white); F2.slab(WL, w0, w1, Y(6.1), Y(6.3), 0, 0.2, 'ftb'); F2.slab(WL, w0, w1, Y(5.2), Y(5.35), 0, 0.2, 'ftb');
    WL.setColor(C.ochre); F2.slab(WL, w0, w1, Y(11.4), Y(12.0), 0, 0.14, 'f');
    WL.setColor(C.white); F2.slab(WL, w0 - 0.2, w1 + 0.2, Y(12.0), Y(12.45), 0, 0.5, 'ftb');
  };
  bands(ff, minV, maxV); for (const sf of long) bands(sf, minU, uAnnex);

  // ---------------------------------------------------------------- the front
  // corner piers with a ball on a plinth, and the two wings: a brick panel under a scrolled brick gable with a round window
  for (const side of [0, 1]) {
    const x0 = side ? X(W - 1.25) : X(0), x1 = side ? X(W) : X(1.25);
    WL.setColor(C.wall); ff.slab(WL, x0 - 0.1, x1 + 0.1, gLo, Y(13.7), 0, 0.3, 'ftlr');
    for (const y of [5.35, 11.4]) { WL.setColor(C.ochre); ff.slab(WL, x0 - 0.1, x1 + 0.1, Y(y), Y(y + (y < 6 ? 0.75 : 0.6)), 0, 0.32, 'f'); }
    WL.setColor(C.white); ff.slab(WL, x0 - 0.2, x1 + 0.2, Y(13.7), Y(14.0), 0, 0.46, 'ftlr');
    const cx = (x0 + x1) / 2, [px, , pz] = ff.pt(cx, Y(14.0), 0.2);
    WL.setColor(C.white); WL.cyl(px, Y(14.0), pz, 0.45, 0.35, 0.35, 8, true);
    ball(CP, px, Y(14.35) + 0.55, pz, 0.55, '#c6c9cc', 10);
    const wa = side ? X(W - 4.55) : X(1.25), wb = side ? X(W - 1.25) : X(4.55), wm = (wa + wb) / 2;
    BR.setColor(C.brick); ff.rect(BR, wa + 0.12, wb - 0.12, Y(6.5), Y(11.3), 0.03);   // below the window trim's plane (0.6 d)
    WL.setColor(C.white); ff.slab(WL, wa, wa + 0.14, Y(6.4), Y(11.45), 0, 0.12, 'f'); ff.slab(WL, wb - 0.14, wb, Y(6.4), Y(11.45), 0, 0.12, 'f');
    ff.win(B, wm, Y(6.9), 1.6, 3.5, { kind: 'round', trim: C.white, glass: C.glass, sur: 0.2, d: 0.1 });
    // the scrolled wing gable: brick with a cream edge, a round window, a palmette finial
    const gH = 14.6, y0 = EAVE + 0.3;
    BR.setColor(C.brick);
    const P = (w, h, d = 0.04) => ff.pt(w, Y(h), d);
    BR.face([P(wa, y0), P(wb, y0), P(wb, y0 + 1.5), P(wm + 0.4, gH - 0.3), P(wm - 0.5, gH), P(wa + 0.35, y0 + 1.5)], [-1, 0, 0]);
    WL.setColor(C.white); ff.slab(WL, wa - 0.05, wb + 0.05, Y(y0 - 0.1), Y(y0 + 0.14), 0, 0.3, 'ftb');
    for (const h of [0, 1]) { // the cream rake of the gable
      const wA = h ? wm - 0.5 : wa, hA = h ? gH : y0 + 1.5, wB = h ? wb : wm + 0.4, hB = h ? y0 + 1.5 : gH - 0.3;
      WL.face([P(wA, hA - 0.05, 0.1), P(wB, hB - 0.05, 0.1), P(wB, hB + 0.3, 0.1), P(wA, hA + 0.3, 0.1)], [-1, 0, 0]);
    }
    LT.setColor(C.rose); ff.oculus(B, wm, Y(y0 + 1.55), 0.42, { trim: C.white, glass: C.rose, d: 0.1, ring: 0.14, n: 14 });
    { const [fx, fy, fz] = ff.pt(wm, Y(gH), 0.15); CP.setColor('#b9bcbe'); CP.cyl(fx, fy, fz, 0.2, 0.04, 0.9, 6, true); }
  }
  // the three doors (centre 2.2 wide, sides 1.8) with fanlights, two side windows each, the narrow tower-base windows
  const door = (sw, w, h) => { ff.door(B, X(sw), Y(0.2), w, h, { kind: 'round', trim: C.white, col: C.door, sur: 0.22, d: 0.08 }); LT.setColor(C.rose); ff.win(B, X(sw), Y(0.2) + h * 0.62, w * 0.78, h * 0.34, { kind: 'round', trim: C.white, glass: C.rose, sur: 0, d: 0.11, sill: false }); st.windows += 2; };
  door(2.95, 1.8, 3.9); door(W - 2.95, 1.8, 3.9); door(W / 2, 2.2, 4.1);
  for (const sw of [W / 2 - 2.35, W / 2 + 2.35]) ff.win(B, X(sw), Y(1.1), 1.0, 2.7, { kind: 'round', trim: C.white, glass: '#3a2f45', sur: 0.15, d: 0.08 });
  WL.setColor(C.white); ff.rect(WL, X(W / 2 - 1.6), X(W / 2 + 1.6), Y(4.75), Y(5.2), 0.14);    // the plain plaque over the centre door
  // the central frame: a round arch, three horseshoe lancets with a rosette over each, a brick gable with a round window and the tablets
  const aw = 6.6, ay0 = 6.7, ah = 7.9;
  const arch = outline(vc, Y(ay0), aw, ah, 'round', 10);
  WL.setColor('#f6efd8'); WL.face(arch.map(([s, y]) => at(ff, ff.sOf(s), y, 0.07)), nrm(ff));
  WL.setColor(C.white);
  const ao = outline(vc, Y(ay0) - 0.05, aw + 0.9, ah + 0.45, 'round', 10);
  for (let i = 0; i < arch.length; i++) { const j = (i + 1) % arch.length; if (i === 0) continue; WL.face([at(ff, ff.sOf(ao[i][0]), ao[i][1], 0.1), at(ff, ff.sOf(ao[j][0]), ao[j][1], 0.1), at(ff, ff.sOf(arch[j][0]), arch[j][1], 0.1), at(ff, ff.sOf(arch[i][0]), arch[i][1], 0.1)], nrm(ff)); }
  for (const dx of [-1.9, 0, 1.9]) {
    const sw = vc + dx;
    LT.setColor(C.glass);
    const o = outline(sw, Y(6.9), 1.25, 4.9, 'pointed', 8, 1.5);
    LT.face(o.map(([s, y]) => at(ff, ff.sOf(s), y, 0.12)), nrm(ff));
    WL.setColor(C.white);
    const o2 = outline(sw, Y(6.8), 1.55, 5.2, 'pointed', 8, 1.65);
    for (let i = 1; i < o.length; i++) { const j = (i + 1) % o.length; if (o2.length !== o.length) break; WL.face([at(ff, ff.sOf(o2[i][0]), o2[i][1], 0.1), at(ff, ff.sOf(o2[j][0]), o2[j][1], 0.1), at(ff, ff.sOf(o[j][0]), o[j][1], 0.1), at(ff, ff.sOf(o[i][0]), o[i][1], 0.1)], nrm(ff)); }
    ff.slab(WL, sw - 0.035, sw + 0.035, Y(6.9), Y(10.4), 0, 0.16, 'f');   // one thin mullion up the lancet
  }
  for (const [dx, y, r] of [[-1.9, 12.45, 0.4], [0, 12.7, 0.55], [1.9, 12.45, 0.4]]) { ff.oculus(B, vc + dx, Y(y), r, { trim: C.white, glass: C.rose, d: 0.12, ring: 0.14, n: 14 }); st.windows++; }
  // the brick gable between the towers
  const gx0 = X(W / 2 - 3.3), gx1 = X(W / 2 + 3.3), gB = 13.7, gA = 19.3, P2 = (w, h, d = 0.05) => ff.pt(w, Y(h), d);
  BR.setColor(C.brick); BR.face([P2(gx0, gB), P2(gx1, gB), P2(vc, gA)], [-1, 0, 0]);
  WL.setColor(C.wall); WL.face([P2(gx0 + 0.5, gB, 0.08), P2(gx1 - 0.5, gB, 0.08), P2(gx1 - 0.5, 14.2, 0.08), P2(gx0 + 0.5, 14.2, 0.08)], [-1, 0, 0]);
  for (const k of [-1, 1]) {   // the cream rake and its saw teeth
    const wEdge = vc + k * 3.3, nT = 7;
    WL.face([P2(wEdge, gB, 0.12), P2(vc, gA, 0.12), P2(vc, gA + 0.38, 0.12), P2(wEdge, gB + 0.38, 0.12)], [-1, 0, 0]);
    for (let i = 0; i < nT; i++) {
      const t0 = (i + 0.15) / nT, t1 = (i + 0.85) / nT, tm = (t0 + t1) / 2, ww = (t) => wEdge + (vc - wEdge) * t, hh = (t) => gB + (gA - gB) * t;
      WL.face([P2(ww(t0), hh(t0), 0.1), P2(ww(t1), hh(t1), 0.1), P2(ww(tm) + (k > 0 ? 0.05 : -0.05), hh(tm) - 0.55, 0.1)], [-1, 0, 0]);
    }
  }
  const [sx, sy] = [vc, 15.3];
  ff.oculus(B, sx, Y(sy), 0.52, { trim: C.white, glass: C.rose, d: 0.1, ring: 0.14, n: 16 });
  // the six-pointed star in the round window (the photographs show it): two triangles in light metal
  { DT.setColor('#c9c6bd'); const rr = 0.4;
    for (const rot of [PI / 2, -PI / 2]) DT.face([0, 1, 2].map((i) => { const a = rot + i * TAU / 3; return ff.pt(sx - Math.cos(a) * rr, Y(sy) + Math.sin(a) * rr, 0.16); }), [-1, 0, 0]); }
  // the tablets on the apex: two arched grey stone slabs side by side, plain
  for (const k of [-1, 1]) {
    const w0 = vc + k * 0.1 - (k < 0 ? 0.72 : 0), w1 = w0 + 0.72, TH = 1.4, y0 = gA + 0.35;
    const pts = [[w0, y0], [w1, y0], [w1, y0 + TH * 0.78], [(w0 + w1) / 2 + 0.2, y0 + TH * 0.96], [(w0 + w1) / 2 - 0.2, y0 + TH * 0.96], [w0, y0 + TH * 0.78]];
    CP.setColor('#b7b4ab'); CP.face(pts.map(([w, y]) => ff.pt(w, Y(y), 0.22)), [-1, 0, 0]); CP.face(pts.map(([w, y]) => ff.pt(w, Y(y), 0.12)), [1, 0, 0]);
  }

  // ---------------------------------------------------------------- the towers: shaft, turret, railed platform, a silver onion dome
  const towers = [];
  for (const side of [0, 1]) {
    const x0 = side ? X(W - 7.9) : X(4.5), x1 = side ? X(W - 4.5) : X(7.9), cx = (x0 + x1) / 2, u0 = minU - 0.5, u1 = minU + 3.0;
    towers.push({ u0, u1, x0, x1 });
    const ft = frontFrame(u0, x0, x1, -1), st2 = [sideFrame(x0, u0, u1, -1), sideFrame(x1, u0, u1, 1)];
    WL.setColor(C.wall); WL.box(u0, gLo, x0, u1, Y(12.4), x1, 63 & ~8 & ~1);
    for (const f of [ft, ...st2]) { bands(f, f === ft ? x0 : u0, f === ft ? x1 : u1); }
    WL.setColor(C.white); for (const wv of [x0, x1 - 0.5]) ft.slab(WL, wv, wv + 0.5, gLo, Y(11.4), 0, 0.12, 'f');
    ft.win(B, cx, Y(1.3), 0.7, 2.3, { kind: 'round', trim: C.white, glass: '#3a2f45', sur: 0.12, d: 0.06 });
    ft.win(B, cx, Y(7.4), 0.8, 2.9, { kind: 'round', trim: C.white, glass: C.glass, sur: 0.14, d: 0.06 });
    BR.setColor(C.brick); ft.rect(BR, cx - 0.6, cx + 0.6, Y(10.1), Y(11.0), 0.05);
    // the turret above the cornice: cream with an ochre frieze of white ribs, a cornice and an iron railing
    const tw = 0.35, ta = [u0 + tw, x0 + tw], tb = [u1 - tw, x1 - tw], tf = frontFrame(ta[0], ta[1], tb[1], -1);
    WL.setColor(C.wall); WL.box(ta[0], Y(12.4), ta[1], tb[0], Y(15.5), tb[1], 63 & ~8 & ~1);
    WL.setColor(C.ochre); WL.box(ta[0] - 0.05, Y(14.1), ta[1] - 0.05, tb[0], Y(15.2), tb[1] + 0.05, 63 & ~8 & ~4 & ~1);
    WL.setColor(C.white); for (let k = 0; k < 5; k++) { const wv = ta[1] + 0.25 + k * (tb[1] - ta[1] - 0.5) / 4; tf.slab(WL, wv - 0.09, wv + 0.09, Y(14.1), Y(15.2), -0.05, 0.1, 'f'); }
    WL.setColor(C.white); WL.box(u0 - 0.1, Y(15.5), x0 - 0.1, u1 + 0.1, Y(16.0), x1 + 0.1, 63 & ~8);
    DT.setColor(C.iron);                   // the railing round the platform
    const ru0 = u0 - 0.05, ru1 = u1 + 0.05, rv0 = x0 - 0.05, rv1 = x1 + 0.05;
    const run = [[ru0, rv0, ru1, rv0], [ru1, rv0, ru1, rv1], [ru1, rv1, ru0, rv1], [ru0, rv1, ru0, rv0]];
    for (const [ax, az, bx, bz] of run) {
      DT.tube([ax, Y(16.9), az], [bx, Y(16.9), bz], 0.025, 4);
      const n = Math.max(2, Math.round(Math.hypot(bx - ax, bz - az) / 0.3));
      for (let k = 0; k < n; k++) { const t = k / n; DT.tube([ax + (bx - ax) * t, Y(16.0), az + (bz - az) * t], [ax + (bx - ax) * t, Y(16.9), az + (bz - az) * t], 0.015, 3); }
    }
    const dcx = (u0 + u1) / 2;
    WL.setColor(C.wall); WL.cyl(dcx, Y(16.0), cx, 1.0, 1.0, 1.1, 10, true);
    CP.setColor(C.dome); lathe(CP, PROFILES.onion, 14, dcx, cx, Y(17.0), 1.45, 3.7);
    CP.setColor('#8a8f94'); CP.tube([dcx, Y(20.65), cx], [dcx, Y(22.3), cx], 0.04, 4); ball(CP, dcx, Y(20.7), cx, 0.2, '#cfd2d4');
    S.prism([[u0, x0], [u1, x0], [u1, x1], [u0, x1]].map(([u, v]) => toW(u, v)).flat(), gLo, Y(16.0), 0, 0, 'tower');
    S.cyl(...toW(dcx, cx), Y(16.0), Y(20.6), 1.1, 0.3, 'tower');
  }
  // the roof behind: a low gable of dark red tile over the hall, the annex flat
  gable(B.tile, { a0: minU + 0.3, a1: uAnnex, b0: minV, b1: maxV, yE: Y(EAVE), yR: Y(15.7), ridge: 'u', ov: 0.2, rake: 0.15, hip0: false, hip1: false, col: C.roof, G: WL, gcol: C.wall });
  WL.setColor(C.wall); WL.box(uAnnex, gLo, minV + 1.2, maxU, Y(8.0), maxV - 1.2, 63 & ~8 & ~2);
  WL.setColor(C.white); WL.box(uAnnex, Y(7.7), minV + 1.1, maxU + 0.1, Y(8.2), maxV - 1.1, 63 & ~8 & ~2);
  // the rear gable end of the hall above the annex

  // ---------------------------------------------------------------- the long sides: seven bays of tall arched windows over smaller ones
  const bays = 7, bu0 = minU + 4.6, step = (uAnnex - 1.2 - bu0) / (bays - 1);
  for (const [sf, dirv] of [[long[0], 1], [long[1], -1]]) {
    for (let k = 0; k < bays; k++) {
      const u = bu0 + k * step;
      sf.win(B, u, Y(6.4), 1.5, 4.7, { kind: 'round', trim: C.white, glass: C.glass, sur: 0.2, d: 0.08 });
      sf.win(B, u, Y(1.3), 0.95, 2.6, { kind: 'round', trim: C.white, glass: '#3a3040', sur: 0.15, d: 0.06 });
      if (k < 2) { BR.setColor(C.brick); sf.rect(BR, u - 1.05, u + 1.05, Y(6.15), Y(11.2), 0.05); sf.win(B, u, Y(6.4), 1.5, 4.7, { kind: 'round', trim: C.white, glass: C.glass, sur: 0.2, d: 0.12 }); }
      st.windows += 2;
      if (k < bays - 1) { WL.setColor(C.white); sf.slab(WL, u + step / 2 - 0.3, u + step / 2 + 0.3, gLo, Y(11.4), 0, 0.2, 'flr'); }
    }
    WL.setColor(C.white); sf.slab(WL, minU, minU + 0.7, gLo, Y(11.4), 0, 0.2, 'flr');
    sf.slab(WL, uAnnex - 0.7, uAnnex, gLo, Y(11.4), 0, 0.2, 'flr');
  }
  // the east end of the hall above the annex roof: a plain pediment wall
  { const rf = frontFrame(uAnnex, minV, maxV, 1); WL.setColor(C.wall); rf.rect(WL, minV, maxV, gLo, Y(EAVE)); poly(WL, [rf.pt(minV, Y(EAVE)), rf.pt(maxV, Y(EAVE)), rf.pt(vc, Y(15.7))], [1, 0, 0]); }

  // ---------------------------------------------------------------- the iron railing and its low wall along the street
  { const d = 3.2, w0 = minV - 0.4, w1 = maxV + 0.4;
    WL.setColor(C.plinth); ff.slab(WL, w0, w1, gLo, Y(0.55), d - 0.18, d + 0.18, 'ftlr');
    DT.setColor(C.iron);
    const nbar = Math.round((w1 - w0) / 0.42);
    for (let k = 0; k <= nbar; k++) {
      const w = w0 + (w1 - w0) * k / nbar, [x, , z] = ff.pt(w, 0, d);
      DT.tube([x, Y(0.55), z], [x, Y(1.95), z], 0.016, 3);
      if (k % 4 === 0) DT.cyl(x, Y(1.95), z, 0.05, 0.0, 0.2, 4, false);
    }
    const [x0, , z0] = ff.pt(w0, 0, d), [x1, , z1] = ff.pt(w1, 0, d);
    DT.tube([x0, Y(1.9), z0], [x1, Y(1.9), z1], 0.02, 4); DT.tube([x0, Y(0.75), z0], [x1, Y(0.75), z1], 0.02, 4);
    const fu = minU - d;
    S.prism([toW(fu - 0.2, w0), toW(fu + 0.2, w0), toW(fu + 0.2, w1), toW(fu - 0.2, w1)].flat(), gLo, Y(1.9), 0, 0, 'fence');
  }
  end(B);

  // ---------------------------------------------------------------- colliders and the footprint
  S.prism(ring.flat(), gLo, Y(EAVE + 0.4), 0, 0, 'wall');
  const poly2 = ring.map((p) => [p[0], p[1]]);
  return { footprints: [{ poly: poly2, h: 21.5, kind: 'church', name: 'Sinagoga Mare Ortodoxă', id: GREATSYN_ID }], stats: st };
}
void edgeFrame; void rect; void slab; void win;
