// OWNER: oradea. Atlas cells of the Hotel Transilvania (opened 1904 as the «Pannonia», Piața Regele Ferdinand I / Strada Teatrului 2),
// not a site module. Fixed colours read from the Commons photographs: a rusticated terracotta-red ground storey with round arches in
// cream surrounds, a cream relief frieze over it, cream upper walls with red-framed arched windows and narrow red pilaster strips,
// paired small arched windows under the cornice, a white balustrade along the roof.
//   transilvaniaCells(A, r)   adds tr.g (ground bay), tr.f1 / tr.f2 / tr.f3 (the three upper floors), tr.cg / tr.c1 / tr.c2 / tr.c3 (the
//     chamfered corner, 5.2 m), tr.bal (the balustrade, 3 m), rail.D (the corner balcony's iron rail)
import { render, gwin, ironCell, shade } from './paint.js';

export const TR = { wall: '#eee3cb', red: '#b5522f', redD: '#8f3d24', trim: '#f4ecd9', frame: '#6b4a32', roof: '#7e3a28', AX: 5.2, CW: 6.4, GH: 5.2, SH: 3.9 };

export function transilvaniaCells(A, r) {
  const { wall, red, redD, trim, frame, AX, CW, GH, SH } = TR;
  const plaster = (c, col = wall) => render(c, col, r, 150);
  // the rusticated terracotta ground storey: courses of 0.55 m with shadow joints
  const rustic = (c, w, h) => { render(c, red, r, 220); for (let y = 0.6; y < h - 1.2; y += 0.6) c.dif('rgba(60,20,10,0.34)').rect(0, y, w, 0.04); c.dif('rgba(255,235,210,0.10)').rect(0, 0, w, 0.18); };
  const frieze = (c, w, y0, y1) => { // the cream relief band over the ground storey: a vine with leaves and rosettes
    c.fix(trim).rect(0, y0, w, y1 - y0); c.dif('rgba(90,70,50,0.22)').rect(0, y0, w, 0.04);
    c.fix('#cfc2a6').vine(0.1, (y0 + y1) / 2, w - 0.1, (y0 + y1) / 2, (y1 - y0) * 0.28, 5, 0.03, 0.22);
    for (let x = 0.5; x < w; x += 0.98) c.fix('#d9ccb0').rosette(x, (y0 + y1) / 2, 0.13, 6);
    c.fix(trim).rect(0, y1 - 0.06, w, 0.1);
  };
  const win = (c, x, y, w, h, o = {}) => {
    c.fix(red).opening(x, y, w, h, 'arch', 0.2); c.fix(trim).opening(x, y, w, h, 'arch', 0.1);
    gwin(c, x, y, w, h, { head: 'arch', cols: w > 1.1 ? 2 : 1, trans: 0.3, frame, sill: o.sill ?? 0.12, sillCol: trim, tone: 1, ...o });
  };
  const strips = (c, w, h) => { c.fix(red).rect(0, 0, 0.17, h).rect(w - 0.17, 0, 0.17, h); c.dif('rgba(255,235,210,0.18)').rect(0.17, 0, 0.03, h); };
  // ---- the ground storey: a round arch (door or shop) in a cream surround, the relief frieze over the red
  let c = A.cell('tr.g', AX, GH); rustic(c, AX, GH);
  c.fix(trim).opening(1.0, 0.35, AX - 2.0, 3.6, 'arch', 0.2); c.fix('#23282e').opening(1.0, 0.35, AX - 2.0, 3.6, 'arch', 0);
  c.glass(1.1, 0.4, AX - 2.2, 3.5, 'arch', 1, 1); c.fix(frame).openingLine(1.05, 0.38, AX - 2.1, 3.55, 'arch', 0.05).rect(AX / 2 - 0.03, 0.4, 0.06, 2.4).rect(1.1, 2.5, AX - 2.2, 0.05);
  c.fix(trim).rect(0.7, 3.6, 0.28, 0.12).rect(AX - 0.98, 3.6, 0.28, 0.12); c.fix(red).rect(0, 0, 0.2, 4.5).rect(AX - 0.2, 0, 0.2, 4.5);
  frieze(c, AX, 4.5, GH - 0.02); c.end();
  // ---- the first floor: a tall window with a red archivolt
  c = A.cell('tr.f1', AX, SH); plaster(c); strips(c, AX, SH); win(c, (AX - 1.7) / 2, 0.55, 1.7, 2.65);
  c.fix(trim).rect(0.2, SH - 0.14, AX - 0.4, 0.14); c.end();
  c = A.cell('tr.f2', AX, SH); plaster(c); strips(c, AX, SH); win(c, (AX - 1.5) / 2, 0.65, 1.5, 2.35);
  c.fix(trim).rect(0.2, SH - 0.14, AX - 0.4, 0.14); c.end();
  // ---- the top floor: two small arched windows side by side under the cornice
  c = A.cell('tr.f3', AX, SH); plaster(c); strips(c, AX, SH); win(c, 0.85, 0.7, 1.0, 1.7, { cols: 1, sill: 0.08 }); win(c, AX - 1.85, 0.7, 1.0, 1.7, { cols: 1, sill: 0.08 });
  c.fix(red).rect(0.17, SH - 0.5, AX - 0.34, 0.1); c.end();
  // ---- the chamfered corner, 5.2 m: the arched door, a pedimented tall window with the balcony, and the same stacked up
  c = A.cell('tr.cg', CW, GH); rustic(c, CW, GH);
  c.fix(red).rect(0, 0, 0.35, 4.5).rect(CW - 0.35, 0, 0.35, 4.5); c.fix(trim).rect(0.35, 0, 0.1, 4.5).rect(CW - 0.45, 0, 0.1, 4.5);
  c.fix(trim).opening(1.2, 0.35, CW - 2.4, 3.7, 'arch', 0.24); c.fix('#23282e').opening(1.2, 0.35, CW - 2.4, 3.7, 'arch', 0);
  c.glass(1.3, 0.4, CW - 2.6, 3.6, 'arch', 1, 1); c.fix(frame).openingLine(1.25, 0.38, CW - 2.5, 3.65, 'arch', 0.06).rect(CW / 2 - 0.03, 0.4, 0.06, 2.4).rect(1.3, 2.5, CW - 2.6, 0.05);
  frieze(c, CW, 4.5, GH - 0.02); c.end();
  c = A.cell('tr.c1', CW, SH); plaster(c); c.fix(red).rect(0, 0, 0.4, SH).rect(CW - 0.4, 0, 0.4, SH); c.fix(trim).rect(0.4, 0, 0.1, SH).rect(CW - 0.5, 0, 0.1, SH); win(c, (CW - 2.0) / 2, 0.15, 2.0, 2.9, { sill: 0, cols: 2 });
  c.fix(trim).poly([[CW / 2 - 1.6, 3.15], [CW / 2 + 1.6, 3.15], [CW / 2, 3.9]]); c.fix(red).poly([[CW / 2 - 1.1, 3.22], [CW / 2 + 1.1, 3.22], [CW / 2, 3.68]]); c.fix(trim).ell(CW / 2, 3.42, 0.2, 0.17); c.end();
  c = A.cell('tr.c2', CW, SH); plaster(c); c.fix(red).rect(0, 0, 0.4, SH).rect(CW - 0.4, 0, 0.4, SH); c.fix(trim).rect(0.4, 0, 0.1, SH).rect(CW - 0.5, 0, 0.1, SH); win(c, (CW - 1.7) / 2, 0.55, 1.7, 2.55); c.end();
  c = A.cell('tr.c3', CW, SH); plaster(c); c.fix(red).rect(0, 0, 0.4, SH).rect(CW - 0.4, 0, 0.4, SH); c.fix(trim).rect(0.4, 0, 0.1, SH).rect(CW - 0.5, 0, 0.1, SH); for (let k = 0; k < 2; k++) win(c, CW / 2 - 1.3 + k * 1.6, 0.7, 1.0, 1.7, { cols: 1, sill: 0.08 });
  c.fix(red).rect(0.17, SH - 0.5, CW - 0.34, 0.1); c.end();
  // ---- the balustrade along the roof: turned white balusters between a coping and a plinth
  c = A.cell('tr.bal', 3.0, 1.1); c.fix(trim).rect(0, 0, 3, 0.16).rect(0, 0.92, 3, 0.18);
  for (let x = 0.15; x < 3; x += 0.3) c.fix('#e6ddc8').ell(x, 0.34, 0.07, 0.1).rect(x - 0.025, 0.4, 0.05, 0.4).ell(x, 0.62, 0.065, 0.09);
  c.fix(shade(trim, 0.9)).rect(0, 0, 0.12, 1.1).rect(2.88, 0, 0.12, 1.1).end();
  ironCell(A, 'rail.D', '#2c2926', 'wave', 3.6);
}
