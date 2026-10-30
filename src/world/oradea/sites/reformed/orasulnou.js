// OWNER: oradea. The Reformed church of the Orașul Nou (Újvárosi református templom, Strada Jean Calvin 1, OSM way 286245387; built 1835–1853,
// a listed monument BH-II-m-B-01035 by its Commons number): a Neoclassical hall of 39 x 22 m whose east front, on Strada Jean Calvin, is a
// four-pilaster portico with a plain pediment between two towers. Built after the Wikimedia Commons photographs of October 2012 (the front
// from the street, and the south tower from a side street):
//   pale mint-green render with white pilasters and cornices, the portico of four pilasters over arched windows and a central door, a
//   balustraded attic on either side of the pediment, a grey zinc roof hipped at both ends; each tower a square base with a round window,
//   a belfry stage with a pair of arched louvres and a clock, a curved cornice, an iron-railed balcony, a small octagonal drum with an arched
//   door and a silver dome with a ball and a vane; the long sides in tall arched windows between pilasters.
// The tower heights are read from the photographs, not measured.
//   buildOrasulNou({ B, S, g, ring }) -> { footprints, stats }
import { PI, TAU, edgeFrame, at, nrm, rect, slab, poly, win, frontFrame, sideFrame, gable, lathe, PROFILES, finial, shaft, clockFace, ball } from './kit.js';
import { buildChurch } from './church.js';

export const ORASULNOU_ID = 286245387;
const WALL = '#b7d1be', TRIM = '#eaf0e6', STONE = '#c9cdc4', ZINC = '#8f979c', DOME = '#b9c0c5', DARK = '#2f3b4a', IRON = '#26292c';

function front(ctx) {
  const { B, S, Y, gLo, eaveY, ridgeY, core, A, toW, st } = ctx;
  const uF = A.uC0, vt = core.vt, vb = core.vb, vc = (vt + vb) / 2, W = vb - vt;
  const WL = B.wall, CP = B.cap, DT = B.det;
  const ff = frontFrame(uF, vt, vb, -1);
  WL.setColor(WALL); ff.rect(WL, vt, vb, gLo, eaveY);
  WL.setColor('#aeb4a8'); ff.slab(WL, vt - 0.05, vb + 0.05, gLo, Y(0.9), 0, 0.14, 'ft');
  // the attic behind the pediment and the balustrades either side of it
  WL.setColor(WALL); ff.rect(WL, vt, vb, eaveY, Y(9.3));
  WL.setColor(TRIM); ff.slab(WL, vt - 0.15, vb + 0.15, Y(6.7), eaveY + 0.35, 0, 0.45, 'ftb');           // the entablature
  for (const k of [-1, 1]) {
    const w0 = k < 0 ? vt + 5.0 : vc + 4.6, w1 = k < 0 ? vc - 4.6 : vb - 5.0;
    WL.setColor(TRIM); ff.slab(WL, w0, w1, eaveY + 0.35, Y(8.2), 0.12, 0.5, 'ftlr'); ff.slab(WL, w0 - 0.1, w1 + 0.1, Y(8.2), Y(8.5), 0.1, 0.6, 'ftb');
    for (let w = w0 + 0.4; w < w1 - 0.2; w += 0.8) ff.slab(WL, w - 0.14, w + 0.14, eaveY + 0.35, Y(8.2), 0.2, 0.42, 'f');  // baluster posts read as ribs
    ff.rect(DT, w0, w1, eaveY + 0.35, Y(8.2), 0.52);
  }
  // the portico: four pilasters, a pediment
  for (const dx of [-3.45, -1.15, 1.15, 3.45]) {
    WL.setColor(TRIM); ff.slab(WL, vc + dx - 0.3, vc + dx + 0.3, Y(0.9), Y(6.5), 0, 0.3, 'flr');
    ff.slab(WL, vc + dx - 0.42, vc + dx + 0.42, Y(6.3), Y(6.7), 0, 0.38, 'ftlr'); ff.slab(WL, vc + dx - 0.4, vc + dx + 0.4, Y(0.9), Y(1.4), 0, 0.36, 'ftlr');
  }
  { const w0 = vc - 4.2, w1 = vc + 4.2, yb = eaveY + 0.35, ya = yb + 1.9;
    WL.setColor(TRIM); poly(WL, [ff.pt(w0, yb, 0.35), ff.pt(w1, yb, 0.35), ff.pt(vc, ya, 0.35)], [-1, 0, 0]);
    WL.setColor(WALL); poly(WL, [ff.pt(w0 + 0.45, yb + 0.12, 0.4), ff.pt(w1 - 0.45, yb + 0.12, 0.4), ff.pt(vc, ya - 0.5, 0.4)], [-1, 0, 0]);
    for (const k of [-1, 1]) { WL.setColor(TRIM); const e = vc + k * 4.2; WL.face([ff.pt(e, yb, 0.5), ff.pt(vc, ya, 0.5), ff.pt(vc, ya - 0.3, 0.5), ff.pt(e, yb - 0.3, 0.5)], [-1, 0, 0]); } }
  for (const dx of [-2.3, 2.3]) ff.win(B, vc + dx, Y(2.5), 1.0, 2.7, { kind: 'round', trim: TRIM, glass: DARK, sur: 0.16, d: 0.1, bars: true });
  ff.door(B, vc, Y(0.9), 1.7, 3.1, { kind: 'round', trim: TRIM, col: '#4a3626', sur: 0.2, d: 0.1 });
  ff.win(B, vc, Y(4.3), 1.5, 1.2, { kind: 'seg', trim: TRIM, glass: DARK, sur: 0.12, d: 0.08 });
  for (const dx of [-5.0, 5.0]) ff.win(B, vc + dx, Y(2.7), 0.95, 2.5, { kind: 'round', trim: TRIM, glass: DARK, sur: 0.14, d: 0.06 });
  for (const dx of [-5.7, 5.7]) { WL.setColor(TRIM); ff.slab(WL, vc + dx - 0.45, vc + dx + 0.45, Y(0.9), Y(6.9), 0, 0.2, 'flr'); }
  st.windows += 8;
  // the two towers
  for (const side of [-1, 1]) {
    const v0 = side < 0 ? vt : vb - 4.8, v1 = v0 + 4.8, cv = (v0 + v1) / 2, u0 = uF - 0.45, u1 = uF + 4.3, cu = (u0 + u1) / 2;
    const top = Y(16.6);
    const sh = shaft(B, { u0, u1, v0, v1, y0: gLo, y1: Y(10.2), wall: WALL, trim: TRIM, glass: DARK, pil: 0.55, bands: [], wins: [], bel: null, cornice: 0.6 });
    sh.faces.forEach((f) => {
      slab(WL, f, -0.12, f.L + 0.12, Y(10.2) - 0.1, Y(10.2) + 0.35, 0, 0.26, 'ft');
      win(B, f, f.L / 2, Y(8.0), 0.95, 0.95, { kind: 'round', trim: TRIM, glass: DARK, sur: 0.12, d: 0.05, sill: false });
    });
    const ft = frontFrame(u0, v0, v1, -1);
    ft.door(B, cv, Y(0.9), 1.1, 2.3, { kind: 'round', trim: TRIM, col: '#4a3626', sur: 0.15, d: 0.06 });
    ft.win(B, cv, Y(4.2), 1.0, 2.4, { kind: 'round', trim: TRIM, glass: DARK, sur: 0.16, d: 0.06 });
    const wi = 0.3, b = shaft(B, { u0: u0 + wi, u1: u1 - wi, v0: v0 + wi, v1: v1 - wi, y0: Y(10.5), y1: top, wall: WALL, trim: TRIM, glass: '#403428', pil: 0.4, bands: [Y(13.2)], wins: [], bel: null, cornice: 0.7, clock: { y: Y(15.0), r: 0.8 } });
    b.faces.forEach((f) => { for (const k of [-1, 1]) win(B, f, f.L / 2 + k * 0.75, Y(11.0), 0.7, 1.9, { kind: 'round', trim: TRIM, glass: '#403428', sur: 0.1, d: 0.05, sill: false }); });
    // the balcony: an iron rail round the top, then the drum, the dome, the ball and the vane
    const R0 = 2.1;
    DT.setColor(IRON);
    for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, x = cu + Math.cos(a) * R0, z = cv + Math.sin(a) * R0; DT.tube([x, top, z], [x, top + 0.95, z], 0.018, 3); }
    DT.tube([cu + R0, top + 0.95, cv], [cu + R0 * Math.cos(TAU / 16), top + 0.95, cv + R0 * Math.sin(TAU / 16)], 0.03, 3);
    for (let k = 0; k < 16; k++) { const a0 = k / 16 * TAU, a1 = (k + 1) / 16 * TAU; DT.tube([cu + Math.cos(a0) * R0, top + 0.95, cv + Math.sin(a0) * R0], [cu + Math.cos(a1) * R0, top + 0.95, cv + Math.sin(a1) * R0], 0.025, 3); }
    WL.setColor(WALL); WL.cyl(cu, top, cv, 1.85, 1.75, 2.0, 8, true);
    const df = edgeFrame([cu - 0.7, cv - 1.8], [cu - 0.7, cv + 1.8]);   // the arched opening on the front face of the drum
    void df;
    CP.setColor(DOME); lathe(CP, PROFILES.capdome, 14, cu, cv, top + 1.9, 2.0, 1.9);
    finial(CP, cu, top + 3.75, cv, 'star', 1.8, 0, '#cfd3d6');
    S.prism([[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => toW(u, v)).flat(), gLo, top, 0, 0, 'tower');
    S.cyl(...toW(cu, cv), top, top + 4.2, 1.8, 0.3, 'tower');
    st.towers++;
  }
  // the drum's arched door: a dark arch on the front face of each tower's drum
  void sideFrame; void rect; void clockFace;
}

export const SPEC = {
  id: ORASULNOU_ID, key: 'orasulnou', name: 'Biserica reformată din Orașul Nou', frame: { faceTo: [-386, 67] }, H: 7.4, rise: 5.0, wall: WALL, trim: TRIM, plinth: '#aeb4a8',
  roofMat: 'sheet', roofCol: ZINC, win: { w: 1.15, h: 3.9, y: 1.9, kind: 'round', bay: 4.6, pil: true, sur: 0.18 }, front, towers: [], roofs: [], roofSolid: true, finial: 'star',
  extra(ctx) {
    const { B, A, core, eaveY, ridgeY, cRoof } = ctx;
    gable(B.sheet, { a0: A.uC0 + 0.3, a1: A.uEnd, b0: core.vt, b1: core.vb, yE: eaveY, yR: ridgeY, ridge: 'u', hip0: true, hip1: true, ov: 0.35, col: cRoof });
  },
};

export function buildOrasulNou({ B, S, g, ring }) { return buildChurch({ B, S, g, spec: SPEC, ring }); }
void PI; void at; void nrm;
