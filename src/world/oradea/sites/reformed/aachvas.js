// OWNER: oradea. The Aachvas Rein synagogue, now the Museum of Jewish History in Oradea (Strada Primăriei 25, OSM way 286245386): the Orthodox
// prayer house of 1870 rebuilt in 1926 (architect Pintér István, builder Weimann Béla), restored with city and community funds, the museum
// opened on 5 December 2018. Built after the Wikimedia Commons photographs of April 2023 (the street front and the interior, img 01, 11–13) and
// the 2006 view of the unrestored building:
//   a 24 x 16 m hall in warm yellow render, its street front (south-east, on Primăriei) in six bays between pilasters: arched windows over
//   smaller ones, oval windows in moulded cartouches, a round-arched door; two big twisted corner columns that stand clear of the wall and
//   end in a bulb finial above the cornice; a hip roof of red tile; at the east end a curved gable with a six-pointed star (the photograph
//   shows it) and a round bay with a red cone, and a second round bay at the west end.
// No lettering is drawn. The interior is not modelled.
//   buildAachvas({ B, S, g, ring }) -> { footprints, stats }
import {
  PI, TAU, begin, end, at, nrm, poly, outline, frontFrame, sideFrame, gable, pyramid, ball, twistColumn, groundOf, gableSolid,
} from './kit.js';
import { frameOf } from './church.js';

export const AACHVAS_ID = 286245386;
const C = { wall: '#ebce8c', trim: '#f4e8c4', cornice: '#d2b676', plinth: '#b9a888', roof: '#9a392e', glass: '#3a4252', door: '#5a3a26', star: '#c9b27c', col: '#e5c98a' };

export function buildAachvas({ B, S, g, ring }) {
  const F = frameOf(ring, { yaw: -112 }), toW = F.toMap, st = { windows: 0, towers: 0 };
  const { Fy, gLo } = groundOf(ring, g), Y = (h) => Fy + h;
  const { minU, maxU, minV, maxV } = F, W = maxV - minV, D = maxU - minU, vc = (minV + maxV) / 2, X = (sw) => minV + sw;
  const EAVE = 8.4, RIDGE = 12.3;
  begin(B, F.cx, F.cz, F.yaw);
  const WL = B.wall, DT = B.det, LT = B.lit, TL = B.tile;
  const ff = frontFrame(minU, minV, maxV, -1), bf = frontFrame(maxU, minV, maxV, 1);
  const west = sideFrame(minV, minU, maxU, -1), east = sideFrame(maxV, minU, maxU, 1);

  // ---- walls on the four faces, plinth, cornice
  for (const f of [ff, bf, west, east]) {
    const [w0, w1] = f === ff || f === bf ? [minV, maxV] : [minU, maxU];
    WL.setColor(C.wall); f.rect(WL, w0, w1, gLo, Y(EAVE));
    WL.setColor(C.plinth); f.slab(WL, w0 - 0.05, w1 + 0.05, gLo, Y(0.8), 0, 0.12, 'ft');
    WL.setColor(C.cornice); f.slab(WL, w0 - 0.3, w1 + 0.3, Y(EAVE - 0.55), Y(EAVE), 0, 0.55, 'ftb');
    WL.setColor(C.trim); f.slab(WL, w0 - 0.4, w1 + 0.4, Y(EAVE), Y(EAVE + 0.25), 0, 0.72, 'ft');
  }
  // ---- the street front: six bays between pilasters
  const bay = W / 6, bc = (k) => X(bay * (k + 0.5));
  WL.setColor(C.trim);
  for (let k = 1; k < 6; k++) { const w = X(bay * k); ff.slab(WL, w - 0.3, w + 0.3, Y(0.8), Y(EAVE - 0.55), 0, 0.14, 'flr'); ff.slab(WL, w - 0.42, w + 0.42, Y(EAVE - 1.0), Y(EAVE - 0.55), 0, 0.2, 'ftlr'); }
  const arch = (w, y0, ww, h) => { ff.win(B, w, y0, ww, h, { kind: 'round', trim: C.trim, glass: C.glass, sur: 0.2, d: 0.08 }); st.windows++; };
  for (let k = 0; k < 6; k++) {
    const w = bc(k);
    if (k === 4) { // the oval window in a moulded cartouche
      ff.oval(B, w, Y(5.5), 0.85, 1.35, { trim: C.trim, glass: C.glass, d: 0.1, ring: 0.3, n: 18 }); st.windows++;
    } else arch(w, Y(3.9), 1.5, 3.7);
    if (k === 1) ff.door(B, w, Y(0.8), 1.7, 3.1, { kind: 'round', trim: C.trim, col: C.door, sur: 0.25, d: 0.08 });
    else arch(w, Y(1.2), 1.2, 2.3);
  }
  WL.setColor(C.cornice); ff.slab(WL, minV, maxV, Y(3.55), Y(3.8), 0, 0.14, 'ft');     // the string course between the two rows
  // ---- the twisted corner columns, clear of the wall, a bulb above the cornice
  for (const v of [minV + 0.2, maxV - 0.2]) {
    const u = minU - 0.55;
    WL.setColor(C.plinth); WL.box(u - 0.9, gLo, v - 0.9, u + 0.9, Y(0.75), v + 0.9, 63 & ~8);
    twistColumn(WL, { x: u, z: v, y0: Y(0.75), y1: Y(EAVE - 0.4), R: 0.78, lobes: 3, turns: 2.2, rows: 16, seg: 18, col: C.col });
    WL.setColor(C.cornice); WL.cyl(u, Y(EAVE - 0.4), v, 0.85, 1.12, 0.5, 14, true); WL.box(u - 1.05, Y(EAVE + 0.1), v - 1.05, u + 1.05, Y(EAVE + 0.5), v + 1.05, 63 & ~8);
    WL.setColor(C.col); WL.cyl(u, Y(EAVE + 0.5), v, 0.55, 0.45, 0.45, 12, true);
    WL.lathe([[0.45, Y(EAVE + 0.95)], [0.78, Y(EAVE + 1.35)], [0.82, Y(EAVE + 1.75)], [0.6, Y(EAVE + 2.15)], [0.24, Y(EAVE + 2.4)], [0.0, Y(EAVE + 2.5)]], 12, u, v);
    S.cyl(...toW(u, v), gLo, Y(EAVE + 0.6), 0.95, 0.95, 'column');
  }
  // ---- the back (north-west) face and the two ends
  for (let k = 0; k < 5; k++) { const w = X(bay * (k + 0.5) * 6 / 5); bf.win(B, w, Y(3.9), 1.5, 3.7, { kind: 'round', trim: C.trim, glass: C.glass, sur: 0.2, d: 0.08 }); bf.win(B, w, Y(1.2), 1.1, 2.1, { kind: 'round', trim: C.trim, glass: C.glass, sur: 0.2, d: 0.08 }); st.windows += 2; }
  for (const [f, wd] of [[west, 0], [east, 1]]) {
    for (const k of [0, 1]) { const w = minU + D * (k ? 0.74 : 0.26); f.win(B, w, Y(3.9), 1.4, 3.6, { kind: 'round', trim: C.trim, glass: C.glass, sur: 0.2, d: 0.08 }); st.windows++; }
    void wd;
  }
  // ---- the east end: a curved gable with the six-pointed star the photograph shows
  { const gw = 8.4, y0 = EAVE + 0.25, sf = east;
    const o = outline(minU + D / 2, Y(y0), gw, 4.0, 'round', 12);
    WL.setColor(C.wall); poly(WL, o.map(([s, y]) => at(sf, sf.sOf(s), y, 0.0)), nrm(sf));
    WL.setColor(C.cornice);
    const oo = outline(minU + D / 2, Y(y0), gw + 0.7, 4.35, 'round', 12);
    for (let i = 1; i < o.length; i++) { const j = (i + 1) % o.length; WL.face([at(sf, sf.sOf(oo[i][0]), oo[i][1], 0.18), at(sf, sf.sOf(oo[j][0]), oo[j][1], 0.18), at(sf, sf.sOf(o[j][0]), o[j][1], 0.06), at(sf, sf.sOf(o[i][0]), o[i][1], 0.06)], nrm(sf)); }
    DT.setColor(C.star);
    const sx = minU + D / 2, sy = Y(y0) + 1.5, rr = 0.95;
    for (const rot of [PI / 2, -PI / 2]) DT.face([0, 1, 2].map((i) => { const a = rot + i * TAU / 3; return at(sf, sf.sOf(sx + Math.cos(a) * rr), sy + Math.sin(a) * rr, 0.12); }), nrm(sf));
  }
  // ---- the round bays at the two ends, red cones
  for (const [vv, sgn, u] of [[maxV, 1, minU + 4.4], [minV, -1, minU + 2.4]]) {
    const R = 1.9, hh = 4.5;
    WL.setColor(C.wall); WL.cyl(u, gLo, vv + sgn * 0.4, R, R, hh + Fy - gLo, 14, true);
    WL.setColor(C.cornice); WL.cyl(u, Fy + hh - 0.1, vv + sgn * 0.4, R + 0.25, R + 0.25, 0.35, 14, true);
    TL.setColor(C.roof); TL.cyl(u, Fy + hh + 0.25, vv + sgn * 0.4, R + 0.45, 0.0, 2.1, 14, false);
    const [px, , pz] = [u, 0, vv + sgn * (0.4 + R * 0.95)];
    const yaw = sgn > 0 ? 0 : 0;
    void yaw; void px; void pz;
    S.cyl(...toW(u, vv + sgn * 0.4), gLo, Y(hh + 1.5), R, R, 'bay');
  }
  // ---- the hip roof
  gable(TL, { a0: minV, a1: maxV, b0: minU, b1: maxU, yE: Y(EAVE + 0.25), yR: Y(RIDGE), ridge: 'v', ov: 0.55, hip0: true, hip1: true, col: C.roof });
  // ---- the street fence the photographs show: grey stone piers with a cap, between them iron bars on a low plinth; it runs along the front and
  // returns a few metres along both ends
  { const FD = 3.3, fr = [[ff, minV - FD, maxV + FD, FD], [west, minU - FD, minU + 7.5, FD], [east, minU - FD, minU + 7.5, FD]];
    for (const [f, w0, w1, d] of fr) {
      const L = w1 - w0, np = Math.max(1, Math.round(L / 3.2));
      WL.setColor(C.plinth); f.slab(WL, w0, w1, gLo, Y(0.5), d - 0.12, d + 0.12, 'ftlr');
      DT.setColor('#26282b');
      const nb = Math.round(L / 0.34);
      for (let k = 1; k < nb; k++) { const [x, , z] = f.pt(w0 + L * k / nb, 0, d); DT.tube([x, Y(0.5), z], [x, Y(1.6), z], 0.014, 3); }
      for (const yy of [0.7, 1.55]) { const [xa, , za] = f.pt(w0, 0, d), [xb, , zb] = f.pt(w1, 0, d); DT.tube([xa, Y(yy), za], [xb, Y(yy), zb], 0.018, 3); }
      for (let k = 0; k <= np; k++) {
        const [x, , z] = f.pt(w0 + L * k / np, 0, d);
        WL.setColor('#a39d8f'); WL.box(x - 0.26, gLo, z - 0.26, x + 0.26, Y(1.75), z + 0.26, 63 & ~8);
        WL.setColor('#b8b2a3'); WL.box(x - 0.34, Y(1.75), z - 0.34, x + 0.34, Y(1.95), z + 0.34, 63 & ~8);
      }
    }
    for (const [f, w0, w1, d] of fr) {
      const [xa, , za] = f.pt(w0, 0, d), [xb, , zb] = f.pt(w1, 0, d);
      S.prism([toW(xa, za), toW(xb, zb), toW(xb + (f === ff ? 0.2 : 0), zb + (f === ff ? 0 : 0.2)), toW(xa + (f === ff ? 0.2 : 0), za + (f === ff ? 0 : 0.2))].flat(), gLo, Y(1.7), 0, 0, 'fence');
    }
  }
  end(B);

  S.prism(ring.flat(), gLo, Y(EAVE + 0.4), 0, 0, 'wall');
  gableSolid(S, { cx: F.cx, cz: F.cz, U: F.U, V: F.V }, toW, { u0: minV, u1: maxV, vt: minU, vb: maxU, eaveY: Y(EAVE + 0.25), rise: RIDGE - EAVE - 0.25, across: true });
  return { footprints: [{ poly: ring.map((p) => [p[0], p[1]]), h: 12.4, kind: 'public', name: 'Sinagoga Aachvas Rein', id: AACHVAS_ID }], stats: st };
}
void pyramid; void ball;
