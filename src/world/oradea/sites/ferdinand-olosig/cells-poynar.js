// OWNER: oradea. Atlas cells of Casa Poynár (Piața Regele Ferdinand 1, the Secession corner house of 1907–1911), not a site module.
// Fixed colours read from the Commons photographs (2013 and 2022, the restored look): cream upper walls over an ochre shop storey, white
// relief, red-brown roller blinds, a grey slate roof, a verdigris cupola.
//   poynarCells(A, r)   adds pt.g (shop storey with the mezzanine arch), pt.f1 / pt.f1b / pt.f2 / pt.f2R (the floors; b: balcony door,
//     R: the raven panel between two windows), pt.tg / pt.t1 / pt.t2 / pt.tw1 / pt.tw2 (a facet of the round tower), pt.drum, pt.gA / pt.gB
//     (the two curved pediments), rail.PB (the butterfly balustrade)
//   PT   the colours and the measures shared with poynar.js
import { render, gwin, studs, butterfly, ironCell, shade } from './paint.js';

export const PT = {
  wall: '#f2dfae', warm: '#e6c696', trim: '#f6f0e2', blind: '#8b3b2b', slate: '#5f6469', slateCap: '#52575c', dome: '#6f9882', frame: '#7a5232', iron: '#2f2c29',
  AX: 4.1, GH: 5.4, SH: 4.1, FW: 1.06,
};

export function poynarCells(A, r) {
  const { wall, warm, trim, blind, frame, AX } = PT;
  const plaster = (c, col = wall) => render(c, col, r, 170);
  const win = (c, x, y, w, h, head, o = {}) => {
    gwin(c, x, y, w, h, { head, cols: w > 1.1 ? 2 : 1, trans: head === 'arch' ? 0.25 : 0.28, frame, blind: 0.3, blindCol: blind, sill: 0.1, cas: 0.1, casCol: trim, sillCol: trim, ...o });
    studs(c, x - 0.1, y, w + 0.2, h + 0.1, head, trim, 0.27);
  };
  // ---- the shop storey with the mezzanine: ochre render, a tall shop window, the mezzanine arch above
  let c = A.cell('pt.g', AX, PT.GH); plaster(c, warm);
  c.fix(shade(warm, 0.8)).rect(0, 0, AX, 0.45); c.dif('rgba(255,255,255,0.15)').rect(0, 0.45, AX, 0.05);
  c.fix('#3b2e26').rect(0.5, 0.55, AX - 1.0, 2.85); c.glass(0.58, 0.63, AX - 1.16, 2.69, 'flat', 1, 1);
  c.fix('#3b2e26').rect(0.58, 0.63, AX - 1.16, 0.5).rect(AX / 2 - 0.03, 1.13, 0.06, 2.2).rect(0.58, 2.75, AX - 1.16, 0.05);
  c.fix(trim).rect(0.2, 3.46, AX - 0.4, 0.2); c.dif('rgba(0,0,0,0.12)').rect(0.2, 3.4, AX - 0.4, 0.06);
  c.fix(trim).opening(0.85, 3.7, AX - 1.7, 1.6, 'arch', 0.1); c.fix('#23282e').opening(0.85, 3.7, AX - 1.7, 1.6, 'arch', 0);
  c.glass(0.93, 3.74, AX - 1.86, 1.5, 'arch', 1, 2); c.fix(frame).openingLine(0.9, 3.72, AX - 1.8, 1.55, 'arch', 0.06).rect(AX / 2 - 0.03, 3.74, 0.06, 1.2);
  c.fix(trim); c.ell(0.3, 4.2, 0.34, 1.05, 0.06).ell(AX - 0.3, 4.2, 0.34, 1.05, -0.06); c.rect(0, 3.46, 0.5, 0.2).rect(AX - 0.5, 3.46, 0.5, 0.2);          // the swelling piers of the arcade
  c.end();
  // ---- the first floor: a rectangular window on bracketed sill, studs round the casing
  c = A.cell('pt.f1', AX, PT.SH); plaster(c);
  win(c, (AX - 1.25) / 2, 0.65, 1.25, 2.75, 'flat'); c.fix(trim).rect((AX - 1.6) / 2, 0.62, 1.6, 0.14); c.dif('rgba(0,0,0,0.12)').rect((AX - 1.6) / 2, 0.58, 1.6, 0.05);
  c.fix(trim).rect(0, 3.95, AX, 0.15); c.end();
  c = A.cell('pt.f1b', AX, PT.SH); plaster(c); // the balcony door
  win(c, (AX - 1.4) / 2, 0.15, 1.4, 2.95, 'flat', { sill: 0, blind: 0.25 }); c.fix(trim).rect(0, 3.95, AX, 0.15); c.end();
  // ---- the second floor: a window with a round head
  c = A.cell('pt.f2', AX, 3.9); plaster(c);
  win(c, (AX - 1.1) / 2, 0.6, 1.1, 2.75, 'arch'); c.fix(trim).rect((AX - 1.45) / 2, 0.58, 1.45, 0.12); c.end();
  c = A.cell('pt.f2R', AX, 3.9); plaster(c); // two small arched windows and between them the raven with the ring in its beak in a wreath
  win(c, 0.3, 0.85, 0.85, 1.9, 'arch'); win(c, AX - 1.15, 0.85, 0.85, 1.9, 'arch');
  c.fix(trim).ell(AX / 2, 1.9, 0.62, 0.78); c.fix(shade(wall, 0.93)).ell(AX / 2, 1.9, 0.48, 0.64);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; c.fix(trim).ell(AX / 2 + Math.cos(a) * 0.62, 1.9 + Math.sin(a) * 0.78, 0.07, 0.05, a); }
  c.fix('#2c2a2a').ell(AX / 2, 1.85, 0.2, 0.13, 0.25).ell(AX / 2 + 0.17, 2.0, 0.07, 0.06).poly([[AX / 2 + 0.22, 2.0], [AX / 2 + 0.36, 1.95], [AX / 2 + 0.22, 1.96]]);
  c.poly([[AX / 2 - 0.18, 1.82], [AX / 2 - 0.4, 1.68], [AX / 2 - 0.2, 1.74]]); c.ln([[AX / 2 + 0.34, 1.95], [AX / 2 + 0.36, 1.84]], 0.012);
  c.fix(trim).rect(AX / 2 - 0.3, 2.62, 0.6, 0.1); c.end();
  // ---- the tower's facets, 0.99 m each: ground (shop window), first floor (narrow window), second floor (arched), and blank twins
  const FW = PT.FW;
  c = A.cell('pt.tg', FW, PT.GH); plaster(c, warm); c.fix(shade(warm, 0.8)).rect(0, 0, FW, 0.45);
  c.fix('#3b2e26').rect(0.1, 0.55, FW - 0.2, 2.85); c.glass(0.16, 0.61, FW - 0.32, 2.73, 'flat', 1, 1); c.fix(trim).rect(0, 3.46, FW, 0.2);
  c.fix(trim).opening(0.15, 3.7, FW - 0.3, 1.5, 'arch', 0.06); c.glass(0.2, 3.76, FW - 0.4, 1.4, 'arch', 1, 2); c.end();
  c = A.cell('pt.t1', FW, PT.SH); plaster(c); win(c, 0.17, 0.85, FW - 0.34, 2.3, 'flat', { cols: 1, blind: 0.35 }); c.fix(trim).rect(0, 3.95, FW, 0.15); c.end();
  c = A.cell('pt.t2', FW, 3.9); plaster(c); win(c, 0.19, 0.8, FW - 0.38, 2.1, 'arch', { cols: 1 }); c.end();
  c = A.cell('pt.tw1', FW, PT.SH); plaster(c); c.fix(trim).rect(0, 3.95, FW, 0.15); c.dif('rgba(0,0,0,0.05)').rect(0.12, 0.8, FW - 0.24, 2.4); c.end();
  c = A.cell('pt.tw2', FW, 3.9); plaster(c); c.dif('rgba(0,0,0,0.05)').rect(0.12, 0.8, FW - 0.24, 2.2); c.end();
  // ---- the cupola's drum: a ring of small arched niches between half-columns
  c = A.cell('pt.drum', 0.66, 1.8); plaster(c, trim); c.fix('#c9bda4').rect(0.08, 0.35, 0.5, 1.0); c.fix('#6f6a5f').opening(0.15, 0.4, 0.36, 0.9, 'arch', 0);
  c.fix(trim).rect(0, 0, 0.66, 0.2).rect(0, 1.6, 0.66, 0.2); c.end();
  // ---- the two curved pediments: a round window in a wreath, the vase of flowers over it, whiplash relief along the edge
  const gable = (name, w, h, oc) => {
    c = A.cell(name, w, h); plaster(c); const cx = w / 2;
    c.fix(trim).ell(cx, oc, 0.66, 0.66); c.fix('#23282e').ell(cx, oc, 0.5, 0.5); c.glass(cx - 0.45, oc - 0.45, 0.9, 0.9, 'flat', 1, 0);
    c.fix(trim); c.ell(cx, oc, 0.5, 0.5); c.fix('#23282e').ell(cx, oc, 0.4, 0.4);
    c.fix(frame).rect(cx - 0.02, oc - 0.4, 0.04, 0.8).rect(cx - 0.4, oc - 0.02, 0.8, 0.04);
    c.fix('#e3c79a').poly([[cx - 0.2, oc + 0.8], [cx + 0.2, oc + 0.8], [cx + 0.12, oc + 1.15], [cx - 0.12, oc + 1.15]]);          // the vase
    for (const [dx, dy] of [[0, 1.4], [-0.25, 1.28], [0.25, 1.28], [-0.12, 1.5], [0.12, 1.5]]) c.fix('#e9ccc0').ell(cx + dx, oc + dy, 0.09, 0.09);
    c.fix(trim);
    for (const sg of [-1, 1]) { const pts = []; for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push([cx + sg * (w / 2 - 0.2 - u * (w / 2 - 0.4)), 0.25 + (h - 0.7) * (1 - Math.pow(u, 1.55)) * 0.98]); } c.ln(pts, 0.1); }
    c.fix(trim).rect(0, 0, w, 0.16); c.end();
  };
  gable('pt.gA', 6.0, 5.0, 1.9); gable('pt.gB', 6.8, 5.6, 2.1);
  // ---- the balustrade: wrought iron with butterflies
  ironCell(A, 'rail.PB', PT.iron, 'butterfly', 3.6); ironCell(A, 'rail.PB1', PT.iron, 'butterfly', 1.0);
}
