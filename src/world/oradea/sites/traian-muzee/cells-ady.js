// OWNER: oradea. Atlas cells of the Ady Endre Memorial Museum (Parcul Traian 1; not a site module): the one-storey pavilion of the
// former «Müller» café (a wooden kiosk of 1869 or 1896, museum since 26 May 1955, renewed 2019–2020). The look is a guess from the
// museum's own photographs: warm cream render, white casings, tall arched-head windows, a glazed double door under a small pediment.
//   adyCells(A, r)   adds ma.g (a window bay), ma.gd (the entrance bay), ma.p (a blank pier), ma.pedi (the tympanum)
//   MA   the colours and measures shared with ady.js
import { render, gwin } from '../unirii-est/paintkit.js';

export const MA = { wall: '#efe4c8', trim: '#f7f3e8', plinth: '#b8ab8c', roof: '#6b5c52', frame: '#f4f1e8', GH: 4.2, AX: 3.5 };

export function adyCells(A, r) {
  const { wall, trim, plinth, frame, GH, AX } = MA;
  const base = (c) => { render(c, wall, r, 170); c.fix(plinth).rect(0, 0, c.W, 0.5); c.dif('rgba(0,0,0,0.12)').rect(0, 0.46, c.W, 0.05); c.fix(trim).rect(0, GH - 0.25, c.W, 0.25); };
  let c = A.cell('ma.g', AX, GH); base(c);
  gwin(c, (AX - 1.5) / 2, 0.85, 1.5, 2.55, { head: 'arch', cols: 2, trans: 0.3, frame, cas: 0.16, casCol: trim, sill: 0.14, sillCol: trim });
  c.end();
  c = A.cell('ma.gd', AX + 0.4, GH); render(c, wall, r, 170); c.fix(plinth).rect(0, 0, c.W, 0.5); c.fix(trim).rect(0, GH - 0.25, c.W, 0.25);
  { const w = 2.0, x = (c.W - w) / 2; c.fix(trim).opening(x - 0.2, 0.5, w + 0.4, 3.2, 'arch', 0); c.fix('#23282e').opening(x, 0.5, w, 3.0, 'arch', 0);
    c.glass(x + 0.08, 0.55, w - 0.16, 2.9, 'arch', 1, 1); c.fix(frame).openingLine(x + 0.04, 0.53, w - 0.08, 2.95, 'arch', 0.07).rect(c.W / 2 - 0.03, 0.55, 0.06, 2.2).rect(x + 0.08, 2.3, w - 0.16, 0.05); }
  c.end();
  c = A.cell('ma.p', 3.2, GH); base(c); c.end();
  c = A.cell('ma.pedi', 5.6, 1.8); render(c, wall, r, 120); c.fix(trim).ell(2.8, 0.85, 0.34, 0.34); c.fix(wall).ell(2.8, 0.85, 0.24, 0.24); c.fix('#23282e').ell(2.8, 0.85, 0.2, 0.2); c.fix(trim).rect(0, 0, 5.6, 0.14); c.end();
}
