// OWNER: oradea. Atlas cells of Palatul Moskovits Adolf și Fiii (Str. Vasile Alecsandri 1, the Vágó brothers' Secession palace,
// early 1910s), not a site module. Fixed colours from the 2018 / 2021 photographs of oradeaheritage.ro: white render, golden-oak
// windows, green and yellow ceramic tiles in columns and lattice panels, a black-line sgraffito frieze under the cornice, grey
// ground floor, gold-painted iron balconies.
//   adolfCells(A, r)   adds ma.g / ma.gp / ma.gate (ground), ma.nobile / ma.reg / ma.reg2 / ma.top / ma.pier / ma.blank (storeys),
//     ma.bf (a bow facet), ma.gable, ma.cg / ma.cw / ma.cf0..2 (the round corner), ma.frieze, rail.G
import { render, gwin, tileCol, lattice, frieze, figure, railCell, TY, TG } from './paintkit.js';

export const MA = { wall: '#ecebe5', grey: '#a2a9ac', greyD: '#7d8386', gold: '#b9822a', rail: '#c0902c', slate: '#7a8186', trim: '#e9e6dd' };

export function adolfCells(A, r) {
  const W = MA.wall;
  const wall = (c, col = W) => render(c, col, r);
  // ---- ground floor: grey plaster, a big shopfront in dark brown, a blank fascia (no shop names)
  let c = A.cell('ma.g', 3.6, 4.8); wall(c, MA.grey);
  c.fix(MA.greyD).rect(0, 0, 3.6, 0.5); c.dif('rgba(255,255,255,0.18)').rect(0, 0.5, 3.6, 0.04);
  c.fix('#3e342d').rect(0.18, 0.55, 3.24, 3.35); c.glass(0.28, 0.65, 3.04, 3.15, 'flat', 1, 1);
  c.fix('#3e342d').rect(0.28, 0.65, 3.04, 0.55).rect(1.78, 1.2, 0.06, 2.6).rect(0.28, 2.95, 3.04, 0.06);
  c.fix('#c9cdcf').rect(0, 4.05, 3.6, 0.1).rect(0, 4.7, 3.6, 0.1); c.dif('rgba(0,0,0,0.12)').rect(0, 3.95, 3.6, 0.1);
  c.end();
  c = A.cell('ma.gp', 1.2, 4.8); wall(c, MA.grey);
  c.fix(MA.greyD).rect(0, 0, 1.2, 0.5); c.dif('rgba(0,0,0,0.1)').rect(0, 0.5, 0.05, 3.5).rect(1.15, 0.5, 0.05, 3.5);
  c.fix('#c9cdcf').rect(0, 4.05, 1.2, 0.1).rect(0, 4.7, 1.2, 0.1); c.end();
  c = A.cell('ma.gate', 3.6, 4.8); wall(c, MA.grey); // the courtyard gate: a round arch with an iron grille
  c.fix(MA.greyD).rect(0, 0, 3.6, 0.5);
  c.fix('#d6d9da').opening(0.5, 0.5, 2.6, 2.2, 'arch', 0.14); c.fix('#16181a').opening(0.5, 0.5, 2.6, 2.2, 'arch', 0);
  c.fix('#2b2f31'); for (let i = 0; i <= 12; i++) c.rect(0.55 + i * 0.2, 0.5, 0.03, 2.2 + Math.sqrt(Math.max(0, 1 - Math.pow((0.55 + i * 0.2 - 1.8) / 1.25, 2))) * 1.2);
  c.fix('#2b2f31').rect(0.5, 1.6, 2.6, 0.04); c.glass(0.55, 0.5, 2.5, 0.5, 'flat', 0, 0);
  c.fix('#c9cdcf').rect(0, 4.05, 3.6, 0.1).rect(0, 4.7, 3.6, 0.1); c.end();

  // ---- storeys: one axis (4.8 m) per cell, a golden window each
  const AX = 4.8, wx = (w) => (AX - w) / 2;
  c = A.cell('ma.nobile', AX, 3.9); wall(c); // the first floor: lattice panels at the sill level to both sides of the window
  gwin(c, wx(1.25), 0.95, 1.25, 2.15, { cols: 2, trans: 0.2 }); lattice(c, 0.2, 0.98, 1.4, 0.95); lattice(c, AX - 1.6, 0.98, 1.4, 0.95);
  c.fix(TY).rect(wx(1.6), 3.4, 1.6, 0.04); c.end();
  c = A.cell('ma.nobileB', AX, 3.9); wall(c); // the first floor, a balcony door
  gwin(c, wx(1.9), 0.25, 1.9, 2.6, { cols: 3, trans: 0.2, sill: 0 }); lattice(c, 0.2, 0.98, 0.9, 0.95); lattice(c, AX - 1.1, 0.98, 0.9, 0.95); c.end();
  c = A.cell('ma.reg', AX, 3.9); wall(c); // a window over a small tile apron
  gwin(c, wx(1.15), 0.95, 1.15, 2.1, { cols: 2, trans: 0.22, blind: 0.2 });
  c.fix('#f5f3ec').rect(wx(1.7), 0.16, 1.7, 0.62); c.dif('rgba(0,0,0,0.12)').rect(wx(1.7), 0.16, 1.7, 0.03); lattice(c, wx(1.7) + 0.1, 0.2, 1.5, 0.56);
  tileCol(c, 0.45, 0.2, 3.6, 0.8); tileCol(c, AX - 0.45, 0.2, 3.6, 0.8); c.end();
  c = A.cell('ma.regB', AX, 3.9); wall(c); // a balcony door
  gwin(c, wx(1.3), 0.2, 1.3, 2.55, { cols: 2, trans: 0.2, sill: 0 }); lattice(c, 0.25, 0.2, 0.9, 0.95); lattice(c, AX - 1.15, 0.2, 0.9, 0.95);
  c.fix(TY).rect(wx(1.7), 3.25, 1.7, 0.04); c.end();
  c = A.cell('ma.top', AX, 3.9); wall(c); // the top floor: an arched golden window under the sgraffito frieze
  gwin(c, wx(1.05), 0.5, 1.05, 1.3, { head: 'arch', cols: 2, trans: 0.2, sill: 0.1 }); tileCol(c, 0.45, 0.1, 2.0, 1); tileCol(c, AX - 0.45, 0.1, 2.0, 1); c.end();
  c = A.cell('ma.topB', AX, 3.9); wall(c); // the same, the blind down
  gwin(c, wx(1.05), 0.5, 1.05, 1.3, { head: 'arch', cols: 2, trans: 0.2, blind: 1, sill: 0.1 }); tileCol(c, 0.45, 0.1, 2.0, 1); tileCol(c, AX - 0.45, 0.1, 2.0, 1); c.end();
  c = A.cell('ma.pier', 0.9, 3.9); wall(c); // a pilaster strip with its tile column, between the axes
  c.dif('rgba(0,0,0,0.1)').rect(0, 0, 0.04, 3.9).rect(0.86, 0, 0.04, 3.9); tileCol(c, 0.45, 0.1, 3.8, 1); c.end();
  c = A.cell('ma.blank', 3.6, 3.9); wall(c); c.end();

  // ---- a bow facet: tile strip, a narrow window, a lattice apron
  c = A.cell('ma.bf', 1.3, 3.9); wall(c);
  lattice(c, 0.12, 0.1, 0.78, 1.5); gwin(c, 0.14, 1.75, 0.74, 1.95, { cols: 2, trans: 0.22, sill: 0.1 });
  c.fix('#f5f3ec').rect(0.96, 0, 0.34, 3.9); c.dif('rgba(0,0,0,0.1)').rect(0.96, 0, 0.03, 3.9); tileCol(c, 1.13, 0.1, 3.8, 1); c.end();

  // ---- the gable over a bow: a half-round window in the white triangle, a dotted tile border
  // (7.8 x 4.9 m: the real gable is about 1.8 times as wide as the bow under it, the wings reach over the plain wall beside it)
  c = A.cell('ma.gable', 7.8, 4.9); c.fix(W).rect(0, 0, 7.8, 4.9); c.speckle(r, 160);
  const slopeDots = (side) => { for (let i = 0; i < 15; i++) { const t = (i + 0.5) / 15, x = side ? 7.8 - t * 3.5 - 0.15 : t * 3.5 + 0.15, y = t * 4.0 + 0.4; c.fix(i % 2 ? TG : TY).rect(x - 0.05, y - 0.05, 0.1, 0.1); } };
  slopeDots(0); slopeDots(1);
  c.fix(MA.trim).opening(2.5, 0.5, 2.8, 1.3, 'arch', 0.16); c.fix('#23282e').opening(2.5, 0.5, 2.8, 1.3, 'arch', 0);
  c.glass(2.58, 0.55, 2.64, 1.22, 'arch', 1, 0); c.fix(MA.gold).openingLine(2.54, 0.54, 2.72, 1.24, 'arch', 0.07).rect(3.87, 0.55, 0.06, 2.4).rect(2.6, 1.65, 2.6, 0.06);
  for (let i = 0; i < 11; i++) { const a = Math.PI * (i / 10), x = 3.9 - Math.cos(a) * 1.65, y = 1.8 + Math.sin(a) * 1.65; c.fix(i % 2 ? TG : TY).rect(x - 0.045, y - 0.045, 0.09, 0.09); }
  c.fix(TG).rect(3.82, 3.5, 0.16, 0.16).fix(TY).rect(3.7, 3.34, 0.08, 0.08).rect(4.02, 3.34, 0.08, 0.08).rect(3.7, 3.66, 0.08, 0.08).rect(4.02, 3.66, 0.08, 0.08);
  c.fix(MA.trim).rect(0, 0, 7.8, 0.18); c.end();

  // ---- the round corner: blank grey ground floor, blank white floors, the sgraffito at the top (three variants)
  c = A.cell('ma.cg', 1.5, 4.8); wall(c, MA.grey); c.fix(MA.greyD).rect(0, 0, 1.5, 0.5); c.fix('#c9cdcf').rect(0, 4.05, 1.5, 0.1).rect(0, 4.7, 1.5, 0.1); c.end();
  c = A.cell('ma.cw', 1.5, 3.9); wall(c); c.end();
  for (let k = 0; k < 3; k++) {
    c = A.cell(`ma.cf${k}`, 1.5, 3.9); wall(c);
    figure(c, 0.5, 1.95, 1.7, k === 1 ? 1 : 0); figure(c, 1.15, 1.95, k === 2 ? 1.2 : 1.55, (k + 2) % 3);
    c.fix(TY).rect(0.2, 0.3, 0.1, 0.1).rect(1.2, 0.5, 0.1, 0.1); c.end();
  }
  // ---- the frieze under the cornice of the plain fronts: a procession in line, 7.2 x 1.3 m
  c = A.cell('ma.frieze', 7.2, 1.3); wall(c); frieze(c, 0, 7.2, 0.08, 1.12, 0); c.end();
  railCell(A, 'rail.G', MA.rail, 0);
}
