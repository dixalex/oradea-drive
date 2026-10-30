// OWNER: oradea. The Evangelical-Lutheran church of Oradea (Biserica Evanghelică, Strada Tudor Vladimirescu 26, OSM way 1455869295, a listed
// monument BH-II-m-B-01089; a neo-Gothic church of the later 19th century): built after the Wikimedia Commons photographs (the 2006 view of
// the front corner from below, the 2012 view from the fortress hill across the roofs):
//   a plain nave 11.8 x 22 m with narrow pointed windows between buff pilasters under a steep orange tile roof, a polygonal apse at the far
//   end; at the street end a tall square tower in buff clinker brick with string courses and an arcade frieze, four gablets (a clock in the
//   front one) and an eight-sided spire of brown-orange tile, beside it a lower octagonal stair turret under a red and green tile cone, a
//   round window in the grey-green front gable, a small porch with a pointed door.
// The red-brown wall panels under the eaves seen from the hill are drawn as plain tablets between the windows.
//   buildLutheran({ B, S, g, ring }) -> { footprints, stats }
import { PI, edgeFrame, at, nrm, rect, slab, poly, win, door, frontFrame, sideFrame, gable, lathe, PROFILES, finial, shaft, clockFace, ball, TAU } from './kit.js';
import { buildChurch } from './church.js';

export const LUTHERAN_ID = 1455869295;
const GREEN = '#a6b2a0', BUFF = '#d2bf86', BUFF2 = '#e0d09a', TILE = '#c4603a', SPIRE = '#b3643c', PANEL = '#a4573f';

function front(ctx) {
  const { B, S, Y, gLo, eaveY, ridgeY, core, A, toW, st } = ctx;
  const uF = A.uC0, vt = core.vt, vb = core.vb, vc = (vt + vb) / 2;
  const WL = B.wall, BR = B.brick, TL = B.tile, CP = B.cap, DT = B.det;
  const ff = frontFrame(uF, vt, vb, -1);
  // the front wall and its gable
  WL.setColor(GREEN); ff.rect(WL, vt, vb, gLo, eaveY); poly(WL, [ff.pt(vt, eaveY), ff.pt(vb, eaveY), ff.pt(vc, ridgeY)], [-1, 0, 0]);
  WL.setColor('#9a9484'); ff.slab(WL, vt - 0.05, vb + 0.05, gLo, Y(0.8), 0, 0.12, 'ft');
  WL.setColor(BUFF); ff.slab(WL, vt - 0.1, vb + 0.1, eaveY - 0.4, eaveY, 0, 0.25, 'ftb');
  // the cream rake of the gable
  for (const k of [-1, 1]) { const ve = k < 0 ? vt : vb; WL.setColor(BUFF2); WL.face([ff.pt(ve, eaveY, 0.06), ff.pt(vc, ridgeY, 0.06), ff.pt(vc, ridgeY - 0.35, 0.06), ff.pt(ve, eaveY - 0.35, 0.06)], [-1, 0, 0]); }
  // the tower at the left, the stair turret at the right, a porch between
  const tw = 4.6, tu0 = uF - 0.4, tu1 = uF + 4.2, tv0 = vt, tv1 = vt + tw, tcx = (tu0 + tu1) / 2, tcz = (tv0 + tv1) / 2, yT = Y(19.5);
  shaft(B, { u0: tu0, u1: tu1, v0: tv0, v1: tv1, y0: gLo, y1: yT, wall: BUFF, trim: BUFF2, glass: '#2c3040', pil: 0.55, mat: 'brick',
    bands: [Y(7.6), Y(11.4), Y(14.8)].map((y) => y), wins: [{ y: Y(2.2), w: 1.3, h: 4.2, kind: 'pointed' }], bel: { y: Y(15.6), h: 3.0, w: 0.9, kind: 'pointed' }, cornice: 0.7 });
  for (const f of [frontFrame(tu0, tv0, tv1, -1)]) { // the arcade frieze and the big front window
    f.win(B, tcz, Y(2.2), 1.8, 5.0, { kind: 'pointed', trim: BUFF2, glass: '#2c3040', sur: 0.3, d: 0.1, bars: true });
    for (let k = 0; k < 5; k++) f.win(B, tv0 + 0.5 + k * 0.9, Y(11.9), 0.55, 1.0, { kind: 'round', trim: BUFF2, glass: '#2c3040', sur: 0, d: 0.06, sill: false });
  }
  // four gablets over the cornice, a clock in the front one
  const gl = [frontFrame(tu0, tv0, tv1, -1), frontFrame(tu1, tv0, tv1, 1), sideFrame(tv0, tu0, tu1, -1), sideFrame(tv1, tu0, tu1, 1)];
  gl.forEach((f, i) => {
    const [w0, w1] = i < 2 ? [tv0, tv1] : [tu0, tu1], wc = (w0 + w1) / 2;
    WL.setColor(BUFF); poly(WL, [f.pt(w0, yT), f.pt(w1, yT), f.pt(wc, yT + 3.7)], nrm(f));
    WL.setColor(BUFF2); for (const w of [w0, w1]) WL.face([f.pt(w, yT, 0.05), f.pt(wc, yT + 3.7, 0.05), f.pt(wc, yT + 3.35, 0.05), f.pt(w, yT - 0.35, 0.05)].slice(0, 4), nrm(f));
    if (i === 0) clockFace(B, f, f.sOf(wc), yT + 1.35, 0.95, 0.08);
    else f.win(B, wc, yT + 0.4, 0.5, 1.5, { kind: 'pointed', trim: BUFF2, glass: '#2c3040', sur: 0.08, d: 0.05, sill: false });
  });
  TL.setColor(SPIRE); lathe(TL, PROFILES.needle, 8, tcx, tcz, yT + 0.3, 2.55, 17.0, PI / 8);
  finial(CP, tcx, yT + 17.3, tcz, 'cross', 2.4, 0);
  S.prism([[tu0, tv0], [tu1, tv0], [tu1, tv1], [tu0, tv1]].map(([u, v]) => toW(u, v)).flat(), gLo, yT, 0, 0, 'tower');
  S.cyl(...toW(tcx, tcz), yT, yT + 12, 1.4, 0.3, 'tower');
  // the octagonal turret
  { const R = 1.75, cu = uF + 1.35, cv = vb - 1.75, y1 = Y(13.2), P = Array.from({ length: 8 }, (_, k) => [cu + Math.cos(PI / 8 + k * PI / 4) * R, cv + Math.sin(PI / 8 + k * PI / 4) * R]);
    P.forEach((a, k) => {
      const f = edgeFrame(a, P[(k + 1) % 8]);
      WL.setColor(BUFF); rect(WL, f, 0, f.L, gLo, y1);
      WL.setColor(BUFF2); slab(WL, f, -0.05, f.L + 0.05, Y(9.4), Y(9.65), 0, 0.12, 'ftb'); slab(WL, f, -0.1, f.L + 0.1, y1 - 0.3, y1, 0, 0.22, 'ftb');
      for (let j = 0; j < 4; j++) win(B, f, 0.3 + j * (f.L - 0.6) / 3, Y(10.1), 0.4, 0.9, { kind: 'round', trim: BUFF2, glass: '#2c3040', sur: 0, d: 0.05, sill: false });
      win(B, f, f.L / 2, Y(3.2), 0.5, 1.9, { kind: 'pointed', trim: BUFF2, glass: '#2c3040', sur: 0.1, d: 0.05 });
    });
    TL.setColor('#6e8a5a'); lathe(TL, [[1.06, 0], [0.9, 0.5], [0.0, 0.5]].slice(0, 2), 8, cu, cv, y1, R, 1.2, PI / 8);
    TL.setColor('#b44a30'); lathe(TL, PROFILES.cone, 8, cu, cv, y1 + 1.2, R * 0.9, 4.6, PI / 8);
    finial(CP, cu, y1 + 5.8, cv, 'cross', 1.3, 0);
    S.cyl(...toW(cu, cv), gLo, y1 + 3, R, R * 0.9, 'turret');
  }
  // the porch: a small gable on two walls with a pointed door
  { const pw = 1.6, pu = uF - 1.7;
    WL.setColor(GREEN); WL.box(pu, gLo, vc - pw + 0.3, uF, Y(3.1), vc + pw + 0.3, 63 & ~8 & ~1);
    gable(TL, { a0: pu, a1: uF + 0.1, b0: vc - pw + 0.1, b1: vc + pw + 0.5, yE: Y(3.1), yR: Y(4.9), ridge: 'u', ov: 0.25, rake: 0.2, col: TILE, G: WL, gcol: GREEN });
    const pf = frontFrame(pu, vc - pw + 0.3, vc + pw + 0.3, -1);
    pf.door(B, vc + 0.3, Y(0.15), 1.5, 2.6, { kind: 'pointed', trim: BUFF2, col: '#4a3222', sur: 0.2, d: 0.06, rise: 1.0 });
    ff.oculus(B, vc + 0.3, Y(7.9), 0.85, { trim: BUFF2, glass: '#2c3040', d: 0.08, ring: 0.2, n: 14 });
    S.prism([[pu, vc - pw + 0.3], [uF, vc - pw + 0.3], [uF, vc + pw + 0.3], [pu, vc + pw + 0.3]].map(([u, v]) => toW(u, v)).flat(), gLo, Y(3.2), 0, 0, 'porch');
  }
  st.windows += 6; st.towers++;
  void BR; void DT; void door; void ball; void TAU;
}

export const SPEC = {
  id: LUTHERAN_ID, key: 'lutheran', name: 'Biserica Evanghelică-Luterană', frame: { yaw: 93.4 }, H: 7.4, rise: 6.4, wall: GREEN, trim: BUFF, plinth: '#9a9484', roofMat: 'tile', roofCol: TILE,
  win: { w: 0.85, h: 4.3, y: 1.8, kind: 'pointed', bay: 3.5, pil: true, sur: 0.14 }, apse: 'auto', front: front, towers: [], roofStart: 0.25, cornice: true, finial: 'cross',
  apseFinial: 'cross', extra(ctx) {
    // red-brown tablets between the windows under the eaves, on the two long walls
    const { B, A, R, eaveY } = ctx;
    const edges = R.map((a, i) => edgeFrame(a, R[(i + 1) % R.length]));
    for (const f of edges) {
      if (f.L < 8 || Math.abs(f.n[0]) > 0.5) continue;
      const n = Math.max(1, Math.round((f.L - 1.0) / 3.5));
      B.brick.setColor(PANEL);
      for (let k = 1; k < n; k++) { const s = k * f.L / n; slab(B.brick, f, s - 0.5, s + 0.5, eaveY - 1.9, eaveY - 0.7, 0, 0.05, 'f'); }
    }
    void A;
  },
};

export function buildLutheran({ B, S, g, ring }) { return buildChurch({ B, S, g, spec: SPEC, ring }); }
