// OWNER: oradea. The Reformed church of Olosig (Nagyvárad-Olaszi református templom, Strada Libertății / Aurel Lazăr, OSM way 423125881; a listed
// monument): a cream-rendered hall of 16 x 38 m with a polygonal apse under a hip of orange tile and, on the front, a clock tower under a copper
// cap. Built after the Wikimedia Commons photographs (the front from the street, 2012, and the 2014 view of the roof, apse and tower from the
// hill, and the 1968 Fortepan view):
//   a front of four giant white pilasters on a darker tan base, over arched windows, a round window and a door under a small triangular hood,
//   a plain pediment over the middle two bays and, behind it, two raking shoulders rising to the square tower with urns on their feet; the
//   tower in two stages with an arched louvre window and a pair of arched belfry windows, a clock under a curved gable on every face, and
//   a copper cap: a flared bell, a bulb, a long needle, a ball and the star of the vane.
// The tower height (31 m to the vane) is read from the photographs, not measured.
//   buildOlosig({ B, S, g, ring }) -> { footprints, stats }
import { PI, TAU, edgeFrame, at, nrm, rect, slab, poly, win, outline, frontFrame, lathe, PROFILES, finial, shaft, clockFace, ball } from './kit.js';
import { buildChurch } from './church.js';

export const OLOSIG_ID = 423125881;
const WALL = '#ecd9a6', TAN = '#cdbd90', TRIM = '#f7f2e2', COPPER = '#9a5c3d', DARK = '#33384a';

function front(ctx) {
  const { B, S, Y, gLo, eaveY, ridgeY, core, A, toW, st } = ctx;
  const uF = A.uC0, vt = core.vt, vb = core.vb, vc = (vt + vb) / 2;
  const WL = B.wall, CP = B.cap, DT = B.det;
  const ff = frontFrame(uF, vt, vb, -1);
  WL.setColor(WALL); ff.rect(WL, vt, vb, gLo, eaveY);
  WL.setColor(TAN); ff.slab(WL, vt - 0.05, vb + 0.05, gLo, Y(1.6), 0, 0.12, 'ft');                   // the darker base
  WL.setColor(TRIM); ff.slab(WL, vt - 0.1, vb + 0.1, Y(1.6), Y(1.8), 0, 0.2, 'ft');
  WL.setColor(TRIM); ff.slab(WL, vt - 0.25, vb + 0.25, eaveY - 1.0, eaveY + 0.2, 0, 0.55, 'ftb');   // the cornice
  // four giant pilasters
  for (const dx of [-6.7, -2.7, 2.7, 6.7]) {
    const w = vc + dx, pw = Math.abs(dx) > 5 ? 0.9 : 0.8;
    WL.setColor(TRIM); ff.slab(WL, w - pw / 2, w + pw / 2, Y(1.8), eaveY - 1.0, 0, 0.22, 'flr');
    ff.slab(WL, w - pw * 0.62, w + pw * 0.62, eaveY - 1.35, eaveY - 1.0, 0, 0.3, 'ftlr'); ff.slab(WL, w - pw * 0.62, w + pw * 0.62, Y(1.8), Y(2.2), 0, 0.3, 'ftlr');
    for (const k of [-0.18, 0, 0.18]) { WL.setColor('#e3dcc6'); ff.slab(WL, w + pw * k - 0.02, w + pw * k + 0.02, Y(2.2), eaveY - 1.35, 0.2, 0.25, 'f'); }
  }
  // the door under a hood, the round window, the two tall windows
  ff.door(B, vc, Y(1.6), 1.7, 3.1, { kind: 'flat', trim: TRIM, col: '#5a3a24', sur: 0.18, d: 0.08 });
  { const yt = Y(1.6) + 3.1 + 0.2; WL.setColor(TRIM); poly(WL, [ff.pt(vc - 1.3, yt, 0.3), ff.pt(vc + 1.3, yt, 0.3), ff.pt(vc, yt + 0.75, 0.3)], [-1, 0, 0]); ff.slab(WL, vc - 1.3, vc + 1.3, yt - 0.18, yt, 0, 0.3, 'ft'); }
  ff.oculus(B, vc, Y(6.95), 0.85, { trim: TRIM, glass: DARK, d: 0.1, ring: 0.2, n: 16 });
  for (const dx of [-4.7, 4.7]) ff.win(B, vc + dx, Y(2.7), 1.35, 3.7, { kind: 'round', trim: TRIM, glass: DARK, sur: 0.2, d: 0.1, bars: true });
  st.windows += 4;
  // the middle pediment over the two inner bays
  { const w0 = vc - 3.5, w1 = vc + 3.5, yb = eaveY + 0.2, ya = yb + 1.4;
    WL.setColor(TRIM); poly(WL, [ff.pt(w0, yb, 0.5), ff.pt(w1, yb, 0.5), ff.pt(vc, ya, 0.5)], [-1, 0, 0]);
    WL.setColor(WALL); poly(WL, [ff.pt(w0 + 0.5, yb + 0.08, 0.55), ff.pt(w1 - 0.5, yb + 0.08, 0.55), ff.pt(vc, ya - 0.4, 0.55)], [-1, 0, 0]); }
  // the raking shoulders up to the tower, an urn on each foot
  for (const k of [-1, 1]) {
    const wo = vc + k * 7.2, wi = vc + k * 3.05, yo = eaveY + 0.3, yi = Y(15.2);
    WL.setColor(WALL); poly(WL, [ff.pt(wo, yo, 0.05), ff.pt(wi, yo, 0.05), ff.pt(wi, yi, 0.05)], [-1, 0, 0]);
    WL.setColor(TRIM); WL.face([ff.pt(wo, yo, 0.18), ff.pt(wi, yi, 0.18), ff.pt(wi - k * 0.0, yi - 0.55, 0.18), ff.pt(wo, yo - 0.55, 0.18)], [-1, 0, 0]);
    const [ux, , uz] = ff.pt(wo, yo, 0.1);
    WL.setColor(TRIM); WL.box(ux - 0.4, yo, uz - 0.4, ux + 0.4, yo + 0.8, uz + 0.4, 63 & ~8);
    WL.lathe([[0.2, yo + 0.8], [0.42, yo + 1.0], [0.46, yo + 1.5], [0.3, yo + 1.9], [0.15, yo + 2.05], [0.0, yo + 2.1]], 8, ux, uz);
  }
  // the tower
  const u0 = uF, u1 = uF + 5.6, v0 = vc - 3.1, v1 = vc + 3.1, cu = (u0 + u1) / 2, yC = Y(24.0);
  const sh = shaft(B, { u0, u1, v0, v1, y0: Y(9.0), y1: yC, wall: WALL, trim: TRIM, glass: '#302a24', pil: 0.55, bands: [Y(16.2)], wins: [{ y: Y(11.3), w: 1.4, h: 3.1, kind: 'round' }], bel: null, cornice: 0.9, clock: { y: Y(21.2), r: 0.95 } });
  sh.faces.forEach((f) => {
    for (const k of [-1, 1]) win(B, f, f.L / 2 + k * 0.85, Y(17.6), 0.6, 2.7, { kind: 'round', trim: TRIM, glass: '#302a24', sur: 0.1, d: 0.06, sill: false });
    WL.setColor(TRIM); slab(WL, f, f.L / 2 - 1.6, f.L / 2 + 1.6, Y(16.9) - 0.1, Y(17.0) + 0.25, 0, 0.25, 'ft');
    // the curved gable over the clock: a segment above the cornice
    const seg = Array.from({ length: 9 }, (_, i) => { const a = PI * i / 8; return [f.L / 2 - Math.cos(a) * 1.5, yC - 0.2 + Math.sin(a) * 1.0]; });
    poly(WL, seg.map(([s, y]) => at(f, s, y, 0.18)), nrm(f));
  });
  // the copper cap
  CP.setColor(COPPER); CP.cyl(cu, yC - 0.05, vc, 3.5, 3.5, 0.3, 8, true);
  lathe(CP, PROFILES.copper, 14, cu, vc, yC + 0.25, 3.3, 9.2);
  finial(CP, cu, yC + 9.45, vc, 'star', 2.0, 0);
  S.prism([[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => toW(u, v)).flat(), gLo, yC, 0, 0, 'tower');
  S.cyl(...toW(cu, vc), yC, yC + 8, 3.0, 0.3, 'tower');
  st.towers++;
  void rect; void edgeFrame; void outline; void clockFace; void ball; void TAU; void DT;
}

export const SPEC = {
  id: OLOSIG_ID, key: 'olosig', name: 'Biserica reformată din Olosig', frame: { faceTo: [436, -348] }, H: 9.4, rise: 5.3, wall: WALL, trim: TRIM, plinth: TAN,
  roofMat: 'tile', roofCol: '#c7653d', win: { w: 1.25, h: 4.6, y: 2.6, kind: 'round', bay: 4.4, pil: true, sur: 0.18 }, apse: 'auto', front, towers: [], roofStart: 0.4, finial: 'star',
};

export function buildOlosig({ B, S, g, ring }) { return buildChurch({ B, S, g, spec: SPEC, ring }); }
