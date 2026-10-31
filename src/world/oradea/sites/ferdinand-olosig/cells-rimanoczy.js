// OWNER: oradea. Atlas cells of the Rimanóczy Hotel (Strada Libertății / Strada Iosif Vulcan, built by Kálmán Rimanóczy senior, no firm year
// found, with the baths along the Crișul Repede and the Royal café in its yard), not a site module. The hotel is wrapped in scaffold nets
// until about December 2026: these are the restored look as the older photographs and postcards (Commons, Fortepan) show it – ochre
// render with cream stone dressings, rusticated quoins on the corner, first-floor windows in cream aediculae with pediments, plainer
// second-floor windows, a rusticated ground floor with arched and square openings.
//   rimanoczyCells(A, r)   adds ri.g / ri.f1 / ri.f2 (a bay, 4.2 m), ri.cg / ri.c1 / ri.c2 (the chamfered corner, 3.6 m), ri.lant (the
//     turret's lantern), rail.R (the iron rails)
//   RI   the colours and measures shared with rimanoczy.js
import { render, gwin, ironCell, shade } from './paint.js';

export const RI = { wall: '#e3cc92', stone: '#f4ecd6', stoneD: '#c2b48f', frame: '#5a3a24', slate: '#4b535d', slateCap: '#424950', AX: 4.2, CW: 3.6, GH: 4.8, SH: 4.2 };

export function rimanoczyCells(A, r) {
  const { wall, stone, stoneD, frame, AX, CW, GH, SH } = RI;
  const plaster = (c, col = wall) => render(c, col, r, 180);
  const rusticate = (c, w, h, col = wall) => { render(c, col, r, 200); for (let y = 0.6; y < h; y += 0.6) c.dif('rgba(70,55,20,0.22)').rect(0, y, w, 0.025); c.fix(shade(col, 0.82)).rect(0, 0, w, 0.45); };
  const quoins = (c, w, h) => { for (let y = 0; y < h - 0.3; y += 0.62) { const k = Math.floor(y / 0.62) % 2; c.fix(k ? stoneD : stone).rect(0, y, 0.5 + 0.18 * k, 0.56).rect(w - 0.5 - 0.18 * k, y, 0.5 + 0.18 * k, 0.56); } };
  // ---- ground floor: rusticated, an arched window in a stone arch with a keystone
  let c = A.cell('ri.g', AX, GH); rusticate(c, AX, GH);
  c.fix(stone).opening(0.7, 0.6, AX - 1.4, 2.9, 'arch', 0.16); c.fix('#23282e').opening(0.7, 0.6, AX - 1.4, 2.9, 'arch', 0);
  c.glass(0.78, 0.65, AX - 1.56, 2.8, 'arch', 1, 1); c.fix(frame).openingLine(0.74, 0.63, AX - 1.48, 2.85, 'arch', 0.05).rect(AX / 2 - 0.03, 0.65, 0.06, 1.9).rect(0.78, 1.9, AX - 1.56, 0.05);
  c.fix(stone).poly([[AX / 2 - 0.18, 3.45], [AX / 2 + 0.18, 3.45], [AX / 2 + 0.12, 3.95], [AX / 2 - 0.12, 3.95]]);
  c.fix(stone).rect(0, GH - 0.16, AX, 0.16); c.end();
  // a ground-floor bay with a rectangular shop window under a stone lintel and a mezzanine light above it
  c = A.cell('ri.g2', AX, GH); rusticate(c, AX, GH);
  c.fix(stone).rect(0.62, 0.55, AX - 1.24, 2.35); c.fix('#23282e').rect(0.72, 0.62, AX - 1.44, 2.2); c.glass(0.78, 0.66, AX - 1.56, 2.12, 'flat', 1, 1);
  c.fix(frame).rect(AX / 2 - 0.03, 0.66, 0.06, 2.12).rect(0.78, 1.9, AX - 1.56, 0.05); c.fix(stone).rect(0.5, 2.9, AX - 1.0, 0.2);
  c.fix(stone).opening(AX / 2 - 0.5, 3.25, 1.0, 1.0, 'flat', 0.1); c.fix('#23282e').rect(AX / 2 - 0.4, 3.35, 0.8, 0.8); c.glass(AX / 2 - 0.36, 3.38, 0.72, 0.74, 'flat', 1, 2);
  c.fix(stone).rect(0, GH - 0.16, AX, 0.16); c.end();
  // the dormer's front
  c = A.cell('ri.dorm', 1.4, 1.5); c.fix(wall).rect(0, 0, 1.4, 1.5); c.fix(stone).opening(0.2, 0.15, 1.0, 1.15, 'arch', 0.1); c.fix('#23282e').opening(0.2, 0.15, 1.0, 1.15, 'arch', 0); c.glass(0.26, 0.2, 0.88, 1.05, 'arch', 1, 1); c.fix(frame).openingLine(0.23, 0.18, 0.94, 1.1, 'arch', 0.05).rect(0.67, 0.2, 0.06, 0.7); c.end();
  // ---- first floor: a window in a cream aedicule: pilasters, a pediment, a balustraded apron
  c = A.cell('ri.f1', AX, SH); plaster(c);
  c.fix(stone).rect(0.55, 0.2, AX - 1.1, 3.2); c.fix(wall).rect(0.75, 0.45, AX - 1.5, 2.55);
  gwin(c, 0.95, 0.75, AX - 1.9, 2.25, { cols: 2, trans: 0.25, frame, sill: 0, tone: 2 });
  c.fix(stone).poly([[0.45, 3.4], [AX - 0.45, 3.4], [AX / 2, 3.95]]); c.fix(wall).poly([[0.85, 3.45], [AX - 0.85, 3.45], [AX / 2, 3.78]]);
  c.fix(stone); for (let x = 1.0; x < AX - 0.9; x += 0.22) c.ell(x, 0.58, 0.05, 0.1).rect(x - 0.015, 0.5, 0.03, 0.2);
  c.rect(0.75, 0.38, AX - 1.5, 0.08).rect(0.75, 0.66, AX - 1.5, 0.06); c.end();
  // ---- second floor: a plain window in a flat cream casing with a small cornice
  c = A.cell('ri.f2', AX, SH); plaster(c);
  c.fix(stone).rect(0.78, 0.55, AX - 1.56, 2.55); c.fix(wall).rect(0.9, 0.67, AX - 1.8, 2.31);
  gwin(c, 1.0, 0.75, AX - 2.0, 2.15, { cols: 2, trans: 0.25, frame, sill: 0, tone: 2 }); c.fix(stone).rect(0.68, 3.1, AX - 1.36, 0.16).rect(0.6, 0.45, AX - 1.2, 0.12); c.end();
  // ---- the chamfered corner: quoined, a tall arched door, a window over a balcony door under a cartouche, the top window
  c = A.cell('ri.cg', CW, GH); rusticate(c, CW, GH, shade(wall, 0.96)); quoins(c, CW, GH);
  c.fix(stone).opening(0.75, 0.55, CW - 1.5, 3.3, 'arch', 0.17); c.fix('#23282e').opening(0.75, 0.55, CW - 1.5, 3.3, 'arch', 0); c.glass(0.84, 0.6, CW - 1.68, 3.2, 'arch', 1, 1);
  c.fix(frame).openingLine(0.8, 0.58, CW - 1.6, 3.25, 'arch', 0.06).rect(CW / 2 - 0.03, 0.6, 0.06, 2.0).rect(0.84, 2.2, CW - 1.68, 0.05); c.fix(stone).rect(0, GH - 0.16, CW, 0.16); c.end();
  c = A.cell('ri.c1', CW, SH); plaster(c); quoins(c, CW, SH);
  c.fix(stone).rect(0.8, 0.2, CW - 1.6, 3.25); gwin(c, 0.95, 0.35, CW - 1.9, 2.9, { cols: 1, trans: 0.25, frame, sill: 0, tone: 2 });
  c.fix(stone).poly([[0.7, 3.45], [CW - 0.7, 3.45], [CW / 2, 3.95]]); c.end();
  c = A.cell('ri.c2', CW, SH); plaster(c); quoins(c, CW, SH);
  c.fix(stone).rect(0.85, 0.55, CW - 1.7, 2.7); gwin(c, 1.0, 0.7, CW - 2.0, 2.3, { cols: 1, trans: 0.25, frame, sill: 0, tone: 2 });
  c.fix(stone).ell(CW / 2, 3.55, 0.3, 0.2); c.end();
  c = A.cell('ri.oc', 1.6, 1.6); c.fix(shade(wall, 0.98)).rect(0, 0, 1.6, 1.6); c.fix(stone).ell(0.8, 0.8, 0.6, 0.6); c.fix('#23282e').ell(0.8, 0.8, 0.46, 0.46); c.glass(0.4, 0.4, 0.8, 0.8, 'flat', 1, 2); c.fix(frame).rect(0.77, 0.34, 0.06, 0.92).rect(0.34, 0.77, 0.92, 0.06); c.end();
  c = A.cell('ri.lant', 0.7, 1.4); plaster(c, stone); c.fix('#5a5550').opening(0.14, 0.25, 0.42, 0.8, 'arch', 0); c.fix(stone).rect(0, 0, 0.7, 0.16).rect(0, 1.25, 0.7, 0.15); c.end();
  ironCell(A, 'rail.R', '#2c2926', 'wave', 3.6);
}
