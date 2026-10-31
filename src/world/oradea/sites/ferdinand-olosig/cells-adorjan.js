// OWNER: oradea. Atlas cells of Casele Adorján I and II (Strada Patrioților 4–6 / Strada Moscovei, Olosig; Marcell Komor and Dezső
// Jakab for the lawyer Emil Adorján, I in 1902–1903, II in 1904–1905), not a site module. Fixed colours from the Commons photographs
// (pre-restoration for II, the 2013 view of I): I a dusty-pink ground floor under pale grey-cream upper floors, both with cream stucco frames, II grey with the same relief, wavy
// parapets, arched ground floors. (The shop lettering of II's tenant is left off.)
//   adorjanCells(A, r)   adds ad.g1 / ad.f1 / ad.f2 / ad.gable (house I) and ad2.g / ad2.f1 / ad2.f2 / ad2.wave (house II), rail.A
//   AD   the colours and measures shared with adorjan.js
import { render, gwin, ironCell, gableWave, shade } from './paint.js';

export const AD = { pink: '#d3a79b', upper: '#dcd3c3', grey: '#a9a8a4', orn: '#f0e6d4', ornG: '#e7e1d3', frame: '#6a4b35', roof: '#b4502f', roofG: '#585b5e', A1: 3.7, A2: 4.4, GH1: 4.4, SH1: 3.7, GH2: 4.3, SH2: 3.9 };

export function adorjanCells(A, r) {
  const { pink, upper, grey, orn, ornG, frame, A1, A2, GH1, SH1, GH2, SH2 } = AD;
  const plaster = (c, col) => render(c, col, r, 210);
  // a stucco frame round an opening: a cream band with scalloped bumps along it (the whiplash look)
  const stucco = (c, x, y, w, h, head, col, g = 0.2) => {
    c.fix(col).opening(x, y, w, h, head, g);
    c.dif('rgba(60,40,30,0.18)').openingLine(x, y, w, h, head, 0.03, g);
    for (let yy = y + 0.2; yy < y + h - 0.2; yy += 0.42) { c.fix(col).ell(x - g, yy, 0.09, 0.14).ell(x + w + g, yy, 0.09, 0.14); }
    for (let xx = x + 0.2; xx < x + w - 0.1; xx += 0.42) c.fix(col).ell(xx, y + h + g * 0.9 + (head === 'arch' ? Math.sin(Math.PI * (xx - x) / w) * w * 0.5 : 0), 0.14, 0.08);
  };
  const win = (c, x, y, w, h, head, col, o = {}) => { stucco(c, x, y, w, h, head, col); gwin(c, x, y, w, h, { head, cols: w > 1.0 ? 2 : 1, trans: 0.28, frame, sill: 0.1, sillCol: col, tone: 1, blind: 0.3, blindCol: '#7b4a30', ...o }); };
  const panel = (c, x, y, w, h, col, wall) => { c.fix(col).rr(x, y, w, h, 0.12); c.fix(wall).rr(x + 0.07, y + 0.07, w - 0.14, h - 0.14, 0.08); c.fix(col).ell(x + w / 2, y + h / 2, 0.1, 0.1); };
  // ---- house I: pink
  let c = A.cell('ad.g1', A1, GH1); plaster(c, pink); c.fix(shade(pink, 0.84)).rect(0, 0, A1, 0.5);
  for (let y = 0.7; y < 3.8; y += 0.5) c.dif('rgba(80,40,30,0.18)').rect(0, y, A1, 0.025);
  { const x = 0.45, w = A1 - 0.9; c.fix(orn).opening(x - 0.1, 0.5, w + 0.2, 2.9, 'arch', 0.2); c.fix('#23282e').opening(x, 0.55, w, 2.75, 'arch', 0); c.glass(x + 0.07, 0.6, w - 0.14, 2.65, 'arch', 1, 1); c.fix(frame).openingLine(x + 0.03, 0.58, w - 0.06, 2.7, 'arch', 0.06).rect(A1 / 2 - 0.03, 0.6, 0.06, 1.7).rect(x + 0.07, 1.7, w - 0.14, 0.05); }
  panel(c, 0.6, 3.75, A1 - 1.2, 0.5, orn, pink); c.end();
  c = A.cell('ad.g1b', A1, GH1); plaster(c, pink); c.fix(shade(pink, 0.84)).rect(0, 0, A1, 0.5); // a narrow entrance bay: a tall arched door and a small arched light beside it
  for (let y = 0.7; y < 3.8; y += 0.5) c.dif('rgba(80,40,30,0.18)').rect(0, y, A1, 0.025);
  c.fix(orn).opening(0.4, 0.5, 1.3, 3.1, 'arch', 0.18); c.fix('#23282e').opening(0.45, 0.55, 1.2, 2.95, 'arch', 0); c.glass(0.5, 0.6, 1.1, 2.85, 'arch', 1, 1); c.fix('#5b3a2c').rect(0.5, 0.6, 1.1, 1.5); c.fix(frame).rect(1.02, 0.6, 0.06, 2.8);
  c.fix(orn).opening(2.35, 1.1, 0.85, 1.7, 'arch', 0.14); c.fix('#23282e').opening(2.4, 1.15, 0.75, 1.6, 'arch', 0); c.glass(2.44, 1.2, 0.67, 1.5, 'arch', 1, 1); c.end();
  c = A.cell('ad.f1', A1, SH1); plaster(c, upper); win(c, (A1 - 1.15) / 2, 0.85, 1.15, 2.2, 'flat', orn); panel(c, (A1 - 1.3) / 2, 0.1, 1.3, 0.5, orn, upper); c.fix(orn).rect(0, SH1 - 0.12, A1, 0.12); c.end();
  c = A.cell('ad.f2', A1, SH1); plaster(c, upper);
  for (let k = 0; k < 3; k++) win(c, 0.45 + k * 1.0, 1.2, 0.6, 1.1, 'arch', orn, { cols: 1, blind: 0 });
  c.fix(orn).rect(0, 0.15, A1, 0.12); c.end();
  c = A.cell('ad.gable', 5.4, 4.2); plaster(c, upper); c.fix(orn).ell(2.7, 1.5, 0.8, 1.0); c.fix(upper).ell(2.7, 1.5, 0.65, 0.85); c.fix(orn).ell(2.7, 1.55, 0.26, 0.4).rect(2.56, 0.85, 0.28, 0.3);
  for (const sg of [-1, 1]) c.fix(orn).ln([[2.7 + sg * 1.3, 1.2], [2.7 + sg * 1.6, 1.9], [2.7 + sg * 1.2, 2.6], [2.7 + sg * 0.6, 2.9]], 0.07);
  c.fix(orn).ln(gableWave(5.4, 4.2).map(([x, y]) => [x, Math.max(0.1, y - 0.1)]), 0.17); c.fix(orn).rect(0, 0, 5.4, 0.16); c.end();
  // ---- house II: grey
  c = A.cell('ad2.g', A2, GH2); plaster(c, grey); c.fix(shade(grey, 0.82)).rect(0, 0, A2, 0.5);
  c.fix(ornG).opening(0.7, 0.4, A2 - 1.4, 2.95, 'arch', 0.2); c.fix('#23282e').opening(0.7, 0.4, A2 - 1.4, 2.95, 'arch', 0);
  c.glass(0.82, 0.45, A2 - 1.64, 2.85, 'arch', 1, 1); c.fix(frame).openingLine(0.76, 0.43, A2 - 1.52, 2.9, 'arch', 0.06).rect(A2 / 2 - 0.03, 0.45, 0.06, 1.9).rect(0.82, 1.9, A2 - 1.64, 0.05);
  c.fix(ornG); for (let k = 0; k < 5; k++) c.ell(0.35 + k * (A2 - 0.7) / 4, 3.78, 0.12, 0.09); c.end();
  c = A.cell('ad2.gb', A2, GH2); plaster(c, grey); c.fix(shade(grey, 0.82)).rect(0, 0, A2, 0.5); // a narrow arched door and a small window
  c.fix(ornG).opening(0.5, 0.45, 1.5, 3.2, 'arch', 0.2); c.fix('#23282e').opening(0.5, 0.45, 1.5, 3.2, 'arch', 0); c.glass(0.58, 0.5, 1.34, 3.1, 'arch', 1, 1); c.fix('#5b3a2c').rect(0.58, 0.5, 1.34, 1.6); c.fix(frame).rect(1.22, 0.5, 0.06, 3.0);
  c.fix(ornG).opening(2.7, 1.2, 1.1, 1.7, 'arch', 0.16); c.fix('#23282e').opening(2.75, 1.25, 1.0, 1.6, 'arch', 0); c.glass(2.8, 1.3, 0.9, 1.5, 'arch', 1, 1); c.end();
  c = A.cell('ad2.f1', A2, SH2); plaster(c, grey); win(c, (A2 - 1.3) / 2, 0.85, 1.3, 2.2, 'flat', ornG, { blind: 0.2 }); c.fix(ornG).rr(A2 / 2 - 0.6, 0.15, 1.2, 0.4, 0.1); c.fix(ornG).poly([[A2 / 2 - 0.85, 3.2], [A2 / 2 + 0.85, 3.2], [A2 / 2, 3.65]]); c.end();
  c = A.cell('ad2.f2', A2, SH2); plaster(c, grey); for (let k = 0; k < 3; k++) win(c, A2 / 2 - 1.2 + k * 0.85, 1.0, 0.55, 1.4, 'arch', ornG, { cols: 1, blind: 0 }); c.fix(ornG).ell(A2 / 2, 3.4, 0.3, 0.2).rect(A2 / 2 - 0.02, 3.4, 0.04, 0.3); c.end();
  c = A.cell('ad2.wave', 7.8, 2.0); plaster(c, grey); c.fix(ornG);
  for (let k = 0; k < 2; k++) { const x = 1.9 + k * 4.0; c.ell(x, 0.7, 0.34, 0.34); c.fix(grey).ell(x, 0.7, 0.24, 0.24); c.fix('#23282e').ell(x, 0.7, 0.2, 0.2); c.fix(ornG); }
  c.ln(Array.from({ length: 41 }, (_, k) => [(k / 40) * 7.8, 0.15 + Math.sin((k / 40) * 7.8 * 1.6) * 0.1]), 0.1); c.end();
  ironCell(A, 'rail.A', '#2c2926', 'wave', 3.6);
}
