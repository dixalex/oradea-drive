// OWNER: oradea. The Premonstratensian church «Maica Îndurerată» (Biserica Mănăstirii Premonstratense, Strada Roman Ciorogariu 14; OSM way
// 1525803458), as it looks today: the Baroque church of the Paulines, built 1740–1772 and given to the Premonstratensians in 1808. A single nave with
// a two-tower front in two orders – grey-green stucco under cream giant pilasters and half-columns, a portal with a triangular pediment and a
// bell-shaped window over it, a small pediment on the centre bay, and square towers with a Baroque scroll parapet and a flat tent roof behind it.
// Sources: Wikimedia Commons photographs of the front (2013), the Hungarian Wikipedia entry (BH-II-m-A-01040: «a két homlokzati tornyot lapos
// sátortető borítja»), miserend.hu, the Esri aerial of 2025 (a red-brown tile roof).
//   premonSpec: the church.js spec;  premonFront(ctx): the front hook (draws the front, both towers and their colliders)
import {
  PI, frontFrame, sideFrame, win, oval, column, entab, pilaster, shaft, pyramid, cross, ball, GOLD, poly, slab, at, nrm, edgeFrame,
} from './kit.js';

export const PREMON_ID = 1525803458;
const GREYS = '#a09d8c', DARK = '#6b4a42';

export function premonFront(ctx) {
  const { B, S, Y, gLo, eaveY, ridgeY, core, vc, uF, cWall, cTrim, cGlass, toW, st } = ctx;
  const vt = core.vt, vb = core.vb, tw = 3.9, cL = vt + tw, cR = vb - tw, E = 0.25;   // E: how far the towers stand proud of the centre bay
  const F0 = frontFrame(uF, cL, cR, -1), Ft = frontFrame(uF - E, vt, vb, -1);
  const Y1 = 7.2, Y2 = 11.4;                       // the first entablature, the main cornice (below the eave)
  // the centre bay: wall, plinth, portal, bell window, columns, second storey, pediment
  B.wall.setColor(cWall); F0.rect(B.wall, cL, cR, gLo, eaveY + 0.0);
  B.wall.setColor('#9d9786'); F0.slab(B.wall, cL, cR, gLo, Y(1.0), 0, 0.14, 'ft');
  F0.door(B, vc, Y(0.25), 2.0, 3.7, { kind: 'round', trim: cTrim, col: '#4b5a52', sur: 0.28 });
  const [pu, , pv] = F0.pt(vc, 0, 0);
  void pu; void pv;
  B.wall.setColor(cTrim);
  poly(B.wall, [F0.pt(vc - 1.55, Y(4.4), 0.14), F0.pt(vc + 1.55, Y(4.4), 0.14), F0.pt(vc, Y(5.35), 0.14)], [-1, 0, 0]);
  F0.slab(B.wall, vc - 1.65, vc + 1.65, Y(4.3), Y(4.5), 0, 0.2, 'ftlr');
  F0.oval(B, vc, Y(5.7), 0.95, 1.05, { trim: cTrim, glass: cGlass, ring: 0.24, d: 0.05 });
  for (const s of [-1, 1]) { column(B, F0, vc + s * 2.1, 0.4, Y(0.3), Y(Y1 - 0.1), 0.42, { col: cTrim }); pilaster(B, F0, vc + s * 2.85, 0.5, Y(0.3), Y(Y1 - 0.1), 0.12, { col: cTrim }); }
  entab(B, F0, cL, cR, Y(Y1), 1.0, { col: cTrim, frieze: cWall, d0: -0.1, proj: 0.4 });
  F0.win(B, vc, Y(8.7), 1.2, 2.0, { kind: 'flat', ped: 'tri', trim: cTrim, glass: cGlass, sur: 0.2, bars: true });
  for (const s of [-1, 1]) { column(B, F0, vc + s * 2.1, 0.32, Y(8.3), Y(Y2), 0.36, { col: cTrim }); pilaster(B, F0, vc + s * 2.85, 0.45, Y(8.3), Y(Y2), 0.12, { col: cTrim }); }
  entab(B, F0, cL, cR, Y(Y2), 1.0, { col: cTrim, frieze: cWall, d0: -0.1, proj: 0.45 });
  // the small pediment over the centre bay, its tympanum in wall colour
  B.wall.setColor(cWall); poly(B.wall, [F0.pt(cL - 0.15, eaveY, 0.1), F0.pt(cR + 0.15, eaveY, 0.1), F0.pt(vc, eaveY + 1.5, 0.1)], [-1, 0, 0]);
  B.wall.setColor(cTrim);
  for (const s of [-1, 1]) {
    const ve = vc + s * (cR - vc + 0.2);
    B.wall.face([F0.pt(ve, eaveY - 0.05, 0.3), F0.pt(vc, eaveY + 1.58, 0.3), F0.pt(vc, eaveY + 1.28, 0.3), F0.pt(ve, eaveY - 0.35, 0.3)], [-1, 0, 0]);
  }
  // a flat roof behind the pediment, between the towers, up to where the nave roof starts
  B.tile.setColor(ctx.cRoof); const rA = uF, rB = ctx.uF + 4.0;
  poly(B.tile, [[rA, eaveY + 0.2, cL], [rB, eaveY + 1.8, cL], [rB, eaveY + 1.8, cR], [rA, eaveY + 0.2, cR]], [0, 1, 0]);

  // the two towers: a shaft with cream corner pilasters, windows on the front and the outer side, a belfry stage, a parapet and a tent roof
  const yT = Y(19.6);
  for (const s of [-1, 1]) {
    const v0 = s < 0 ? vt - 0.06 : cR, v1 = s < 0 ? cL : vb + 0.06, u0 = uF - E, u1 = uF + 4.3, vm = (v0 + v1) / 2;
    shaft(B, { u0, u1, v0, v1, y0: gLo, y1: yT, wall: GREYS, trim: cTrim, pil: 0.55, bands: [], openings: false, cornice: 0.7 });
    const Ft1 = frontFrame(u0, v0, v1, -1), Fs = sideFrame(s < 0 ? v0 : v1, u0, u1, s);
    for (const FA of [Ft1, Fs]) {
      const m = FA === Ft1 ? vm : (u0 + u1) / 2;
      // first storey: an oval window with shutters; second: a pedimented window; belfry: a round-headed opening with a medallion over it
      FA.oval(B, m, Y(3.8), 0.55, 0.8, { trim: cTrim, glass: '#4b4036', ring: 0.18, d: 0.05 });
      FA.win(B, m, Y(8.5), 1.05, 2.1, { kind: 'flat', ped: 'tri', trim: cTrim, glass: '#4b4036', sur: 0.18, bars: false });
      FA.win(B, m, Y(14.0), 1.5, 3.7, { kind: 'round', trim: cTrim, glass: '#5a4a3c', sur: 0.22, d: 0.05 });
      FA.oval(B, m, Y(18.0), 0.6, 0.45, { trim: cTrim, glass: GREYS, ring: 0.2, d: 0.05 });
    }
    // string courses carried across the towers
    B.wall.setColor(cTrim);
    for (const yy of [Y1, Y2]) { Ft1.slab(B.wall, v0, v1, Y(yy), Y(yy) + 0.9, 0, 0.34, 'ftb'); Fs.slab(B.wall, u0, u1, Y(yy), Y(yy) + 0.9, 0, 0.34, 'ftb'); }
    // the shaped parapet: a scrolled bump on every side over a flat tent roof, a ball on each corner
    const cx = (u0 + u1) / 2, cz = vm;
    const R4 = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
    for (let i = 0; i < 4; i++) {
      const a = R4[i], b = R4[(i + 1) % 4], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const ex = edgeFrame(s < 0 ? a : a, b);
      const prof = [[0, 0.8], [0.17, 1.3], [0.33, 1.7], [0.5, 1.9], [0.67, 1.7], [0.83, 1.3], [1, 0.8]];
      B.wall.setColor(cTrim);
      B.wall.face([at(ex, 0, yT, 0.04), at(ex, L, yT, 0.04), ...prof.slice().reverse().map(([f, h]) => at(ex, f * L, yT + h, 0.04))], nrm(ex));
      B.wall.face([at(ex, 0.25, yT, -0.45), at(ex, L - 0.25, yT, -0.45), ...prof.slice().reverse().map(([f, h]) => at(ex, 0.25 + f * (L - 0.5), yT + h * 0.9, -0.45))].reverse(), [-nrm(ex)[0], 0, -nrm(ex)[2]]);
    }
    for (const [du, dv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const x = cx + du * (u1 - u0) / 2 * 0.93, z = cz + dv * (v1 - v0) / 2 * 0.93;
      B.wall.setColor(cTrim); B.wall.cyl(x, yT, z, 0.38, 0.3, 0.9, 8, true); ball(B.cap, x, yT + 1.15, z, 0.24, '#cfc6ae');
    }
    B.tile.setColor(DARK); pyramid(B.tile, { x0: u0 + 0.3, x1: u1 - 0.3, z0: v0 + 0.3, z1: v1 - 0.3, yE: yT, yR: yT + 0.9, ov: 0.1, col: DARK });
    cross(B.cap, cx, yT + 0.9, cz, 1.7, '#5a5f66', 0);
    S.prism([[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([a, b]) => toW(a, b)).flat(), gLo, yT, 0, 0, 'tower');
    st.towers++;
  }
  ctx.st.windows += 14;
  // the nave's roof starts behind the towers: its gable end between them in wall colour is drawn by gable() at a0
  void ridgeY; void win; void oval; void PI; void GOLD; void slab; void at; void nrm;
}

export const premonSpec = {
  id: PREMON_ID, key: 'premon', name: 'Biserica Premonstratensă «Maica Îndurerată»', frame: { faceTo: [-95, -585] },
  H: 12.4, rise: 4.4, wall: GREYS, trim: '#d9d3c0', plinth: '#9d9786', roofCol: '#86463a', hip: true, roofStart: 4.0,
  win: { w: 1.35, h: 5.8, y: 3.8, kind: 'round', bay: 4.1, pil: true, sur: 0.2 }, front: premonFront, crossH: 0,
};
