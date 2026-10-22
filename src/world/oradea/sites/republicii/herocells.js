// OWNER: oradea. Atlas cells of the two palaces (not a site module), painted in fixed colours, no tint roles.
//   heroCells(A, r)   adds to the atlas:
//     mosk.reg / reg2 / nobile / top / pier    Palatul Moskovits Miksa (1904–1905): turquoise wall, lilac piers with white relief
//     mosk.tG / tA / tB / tC / tD                   the tower's facets (1.5 m wide): ground door, first floor, the arched niche with
//                                              the white tree relief and mask, the top floor
//     mosk.drum, mosk.corbel, g.mosk, g.moskPier, gable.mosk1 / mosk2 / mosk3, dorm.mosk
//     ullc.nobile / reg / reg2 / top / pier, g.ullc   the 5 m cells of the Ullmann centre axes
//     ull.nobile (first floor) / reg / reg2 / top / pier / bowF / frieze / bay, gable.ull, g.ull (ground), dorm.ull   Palatul Ullmann (1913)
//   Colours are from the 2021 / 2023 photographs of the Moskovits palace and the 2012 photographs of the Ullmann one.
import { BAY, STOREY, GROUND } from './styles.js';

const TQ = '#44bfd0', TQD = '#2f9fb2', LI = '#c1c6f4', LID = '#a7aee8', WH = '#f6f5f0', WHD = '#d9d8d0', WINE = '#5a2329', WOOD = '#4b2d20', IRON = '#1b1c1e';

function glassWin(c, x, y, w, h, o = {}) { // a window with a white casing on fixed colours
  const { head = 'flat', cas = 0.15, cols = 2, trans = 0, blind = 0, sill = 0.1, frame = '#f1eee6', casCol = WH, lit = 1, tone = 0, scallop = false } = o;
  if (cas > 0) c.fix(casCol).opening(x, y, w, h, head, cas);
  c.fix('#262c33').opening(x, y, w, h, head);
  c.glass(x + 0.04, y + 0.03, w - 0.08, h - 0.07, head, lit, tone);
  c.dif('rgba(0,0,0,0.28)').rect(x + 0.04, y + 0.03, 0.06, h - 0.07).rect(x + 0.04, y + h - 0.12, w - 0.08, 0.07);
  c.fix(frame).openingLine(x + 0.02, y + 0.02, w - 0.04, h - 0.04, head, 0.04);
  for (let i = 1; i < cols; i++) c.rect(x + (w * i) / cols - 0.018, y + 0.04, 0.036, h - 0.08);
  if (trans) c.rect(x + 0.04, y + h * (1 - trans) - 0.02, w - 0.08, 0.04);
  if (blind > 0) { c.fix('#d7caa6').rect(x + 0.04, y + h - 0.04 - h * blind, w - 0.08, h * blind); c.dif('rgba(0,0,0,0.16)'); for (let yy = y + h - 0.04 - h * blind; yy < y + h - 0.04; yy += 0.07) c.rect(x + 0.04, yy, w - 0.08, 0.012); }
  if (sill) {
    c.fix(casCol).rect(x - 0.1, y - sill, w + 0.2, sill);
    if (scallop) for (let i = 0; i < 5; i++) c.ell(x + 0.1 + i * ((w - 0.2) / 4), y - sill - 0.06, 0.17, 0.12);
    c.dif('rgba(0,0,0,0.3)').rect(x - 0.1, y - sill - 0.08, w + 0.2, 0.08);
  }
}
const tex = (c, v) => { c.speckle(v, 160); };

export function heroCells(A, r) {
  // =============================================================== Moskovits
  const wall = (c, col = TQ) => { c.fix(col).rect(0, 0, c.W, c.H); tex(c, r); c.shadeV(0, c.W, 0, c.H, 0.06, 0); };
  const pierStrip = (c, x0, x1) => { // a lilac pier with a white vine and a small mask, between x0 and x1 (metres in the cell)
    c.fix(LI).rect(x0, 0, x1 - x0, c.H); c.dif('rgba(0,0,0,0.12)').rect(x1 - 0.04, 0, 0.04, c.H);
    c.fix(WH).vine((x0 + x1) / 2, 0.3, (x0 + x1) / 2, c.H - 0.5, 0.07, 5, 0.035, 0.17); c.fix(WH).rosette((x0 + x1) / 2, c.H - 0.34, 0.1, 6);
  };
  const scallopBand = (c, y) => { c.fix(WH).rect(0, y, c.W, 0.1); for (let i = 0; i < 8; i++) c.ell(0.25 + i * 0.5, y, 0.22, 0.1); };
  let c = A.cell('mosk.reg', BAY, STOREY); wall(c);
  pierStrip(c, 0, 0.5);
  glassWin(c, 1.5, 0.95, 1.2, 2.0, { cas: 0.17, cols: 2, trans: 0.22, blind: 0.3, scallop: true });
  c.fix(WH).ell(2.1, 3.3, 0.45, 0.16).ln([[1.75, 3.3], [2.45, 3.3]], 0.02); c.fix(LID).ell(2.1, 3.3, 0.22, 0.07);
  c.end();
  c = A.cell('mosk.reg2', BAY, STOREY); wall(c);
  pierStrip(c, 0, 0.5);
  glassWin(c, 1.5, 0.95, 1.2, 2.05, { cas: 0.17, cols: 2, trans: 0.22, blind: 0, scallop: true });
  c.fix(WH).vine(1.0, 3.5, 3.4, 3.5, 0.1, 6, 0.03, 0.14); c.end();
  c = A.cell('mosk.nobile', BAY, STOREY); wall(c, TQ);
  pierStrip(c, 0, 0.5);
  c.fix(LI).rect(0.5, 0, 3.1, 0.6); c.fix(WH).rect(0.5, 0.55, 3.1, 0.08);
  glassWin(c, 1.4, 0.7, 1.4, 2.5, { cas: 0.18, head: 'seg', cols: 2, trans: 0.2, sill: 0 });
  c.fix(WH).face(2.1, 3.62, 0.2); c.fix(WH).garland(1.55, 2.65, 3.4, 0.1, 5);
  c.end();
  c = A.cell('mosk.top', BAY, STOREY); wall(c);
  pierStrip(c, 0, 0.5);
  glassWin(c, 1.55, 0.85, 1.1, 1.6, { head: 'arch', cas: 0.17, cols: 2, trans: 0.28, sill: 0.08 });
  c.fix(WH).ell(2.1, 3.0, 0.35, 0.27); c.fix(LID).ell(2.1, 3.0, 0.2, 0.14);
  c.end();
  c = A.cell('mosk.pier', 1.2, STOREY); c.fix(LI).rect(0, 0, 1.2, c.H); tex(c, r);
  c.fix(WH).vine(0.6, 0.2, 0.6, 3.6, 0.2, 7, 0.05, 0.26); c.fix(WH).face(0.6, 3.4, 0.22); c.fix(WH).rect(0, 0, 0.09, 4).rect(1.11, 0, 0.09, 4); c.end();

  // the ground floor: wide brown timber shopfronts under flat arches, between lilac piers with white crenellated caps
  c = A.cell('g.mosk', BAY, GROUND); wall(c, LI); tex(c, r);
  c.fix(WH).rect(0, 3.9, c.W, 0.9); c.fix(LI).rect(0, 4.1, c.W, 0.6); c.fix(WH).rect(0, 4.7, c.W, 0.1);
  for (let i = 0; i < 4; i++) c.fix(WH).rect(0.1 + i * 0.9, 3.8, 0.55, 0.3);
  c.fix(WH).rect(0, 0, c.W, 0.4);
  c.fix(WOOD).opening(0.12, 0.4, c.W - 0.24, 3.45, 'seg', 0); c.glass(0.3, 0.95, c.W - 0.6, 2.75, 'seg', 1, 1);
  c.fix(WOOD).rect(0.18, 0.4, c.W - 0.36, 0.6).rect(0.3, 2.55, c.W - 0.6, 0.07);
  for (let x = 0.3; x < c.W - 0.4; x += 0.42) c.rect(x, 0.95, 0.04, 2.75);
  c.fix(WOOD).ln([[0.9, 3.0], [1.5, 3.55], [c.W / 2, 3.45]], 0.05).ln([[c.W - 0.9, 3.0], [c.W - 1.5, 3.55], [c.W / 2, 3.45]], 0.05);
  c.end();
  c = A.cell('g.moskPier', 1.2, GROUND); wall(c, LI); tex(c, r);
  c.fix(WH).rect(0, 3.8, 1.2, 0.3).rect(0, 4.7, 1.2, 0.1); for (let i = 0; i < 2; i++) c.fix(WH).rect(0.1 + i * 0.55, 4.1, 0.4, 0.6);
  c.fix(WH).rect(0, 0, 1.2, 0.45); c.dif('rgba(0,0,0,0.12)').rect(0, 0.45, 0.05, 3.3).rect(1.15, 0.45, 0.05, 3.3);
  c.fix(WH).vine(0.6, 0.7, 0.6, 3.3, 0.14, 5, 0.04, 0.2); c.end();

  // the tower's facets: 1.5 m wide
  const tw = (name, f, h = STOREY) => { const t = A.cell(name, 1.5, h); t.fix(TQ).rect(0, 0, 1.5, t.H); tex(t, r); f(t); t.end(); };
  tw('mosk.tG', (t) => { // the ground floor of the tower: a wine arched door in a white surround on a lilac pier
    t.fix(LI).rect(0, 0, 1.5, 4.8); t.fix(WH).rect(0, 0, 1.5, 0.45).rect(0, 3.8, 1.5, 0.3).rect(0, 4.7, 1.5, 0.1);
    t.fix(WH).opening(0.18, 0.45, 1.14, 3.2, 'ogee', 0.08); t.fix(WOOD).opening(0.18, 0.45, 1.14, 3.2, 'ogee', 0); t.glass(0.3, 1.0, 0.9, 2.5, 'ogee', 1, 1);
    t.fix(WOOD).rect(0.72, 1.0, 0.06, 2.5).rect(0.3, 2.3, 0.9, 0.05); }, GROUND);
  tw('mosk.tA', (t) => { // the first floor: a narrow window in a white casing on a lilac apron
    t.fix(LI).rect(0, 0, 1.5, 0.7); t.fix(WH).rect(0, 0.65, 1.5, 0.07);
    glassWin(t, 0.38, 0.85, 0.74, 1.95, { cas: 0.14, cols: 2, trans: 0.2, blind: 0.25, scallop: true });
    t.fix(WH).ell(0.75, 3.45, 0.3, 0.14); });
  tw('mosk.tB', (t) => { // a wide pair: the centre of the oriel on the first floor
    glassWin(t, 0.2, 0.95, 1.1, 2.2, { cas: 0.16, cols: 2, trans: 0.2, blind: 0.45, scallop: true });
    t.fix(WH).garland(0.2, 1.3, 3.5, 0.1, 4); });
  tw('mosk.tC', (t) => { // the second floor: a tall door window to the iron balcony, the white tree relief above
    glassWin(t, 0.28, 0.5, 0.94, 2.55, { cas: 0.15, cols: 2, trans: 0.2, blind: 0.5, sill: 0 });
    t.fix(WH).vine(0.75, 3.1, 0.75, 3.9, 0.12, 3, 0.03, 0.14); t.fix(WH).face(0.75, 3.6, 0.17); });
  tw('mosk.tD', (t) => { // the top floor: the arched niche with the tree of life relief
    t.fix(WH).opening(0.1, 0.35, 1.3, 3.5, 'arch', 0.1); t.fix(TQD).opening(0.1, 0.35, 1.3, 3.5, 'arch', 0);
    t.fix(WH).vine(0.75, 0.9, 0.75, 3.5, 0.25, 6, 0.045, 0.28); t.fix(WH).vine(0.5, 1.8, 0.35, 3.2, 0.1, 4, 0.03, 0.2); t.fix(WH).vine(1.0, 1.8, 1.15, 3.2, 0.1, 4, 0.03, 0.2);
    t.fix(WH).face(0.75, 1.1, 0.21); t.fix('#262c33').rect(0.62, 2.3, 0.26, 0.3); });
  c = A.cell('mosk.drum', 1.5, 3.2); c.fix(WH).rect(0, 0, 1.5, c.H); tex(c, r);
  c.fix('#2a3238').opening(0.35, 0.35, 0.8, 1.5, 'arch', 0); c.fix(WHD).rect(0.2, 2.45, 1.1, 0.7); for (let i = 0; i < 4; i++) c.fix('#4a5560').rect(0.3 + i * 0.28, 2.55, 0.12, 0.5); c.end();
  c = A.cell('mosk.corbel', 1.5, 0.7); c.fix(WH).rect(0, 0, 1.5, 0.7); c.fix(LID).ell(0.75, 0.3, 0.4, 0.2); c.fix(WH).rosette(0.75, 0.3, 0.2, 6); c.dif('rgba(0,0,0,0.25)').rect(0, 0, 1.5, 0.12); c.end();

  // shaped gables of the wings
  const gcell = (name, w, h, f) => { const g = A.cell(name, w, h); g.fix(TQ).rect(0, 0, w, h); tex(g, r); f(g); g.end(); };
  gcell('gable.mosk1', 4.0, 3.4, (g) => { // a window opening with an oval, two white herms either side
    g.fix(WH).rect(0, 0, 0.5, 3.4).rect(3.5, 0, 0.5, 3.4); g.fix(WH).face(0.25, 1.3, 0.2); g.fix(WH).face(3.75, 1.3, 0.2);
    g.fix(WH).ell(2.0, 1.5, 0.95, 0.75); g.fix('#262c33').ell(2.0, 1.5, 0.75, 0.55); g.glass(1.45, 1.1, 1.1, 0.8, 'arch', 1, 2); g.fix(LI).rect(0.5, 0, 3.0, 0.35); });
  gcell('gable.mosk2', 3.2, 2.6, (g) => { g.fix(WH).opening(1.0, 0.5, 1.2, 1.2, 'arch', 0.14); g.glass(1.0, 0.5, 1.2, 1.2, 'arch', 1, 1); g.fix(WH).rosette(1.6, 2.15, 0.2, 8); g.fix(LI).rect(0, 0, 3.2, 0.3); });
  gcell('gable.mosk3', 3.2, 2.6, (g) => { g.fix(WH).ell(1.6, 1.3, 0.8, 0.8); g.fix('#262c33').ell(1.6, 1.3, 0.62, 0.62); g.glass(1.1, 0.8, 1.0, 1.0, 'flat', 1, 0); g.fix(WH).vine(0.3, 0.3, 0.3, 2.3, 0.1, 4, 0.03, 0.15).vine(2.9, 0.3, 2.9, 2.3, 0.1, 4, 0.03, 0.15); });
  c = A.cell('dorm.mosk', 1.4, 1.5); c.fix(TQ).rect(0, 0, 1.4, 1.5); glassWin(c, 0.25, 0.2, 0.9, 1.0, { head: 'arch', cas: 0.12, cols: 2, sill: 0.06 }); c.end();

  // =============================================================== Ullmann
  const SAGE = '#cdd6bd', SAGED = '#aab59c', CRM = '#ece6d4', FA = '#5f9a90', FAL = '#7ecab9', BR = '#8c4a22';
  const uw = (c, col = SAGE) => { c.fix(col).rect(0, 0, c.W, c.H); c.speckle(r, 200); c.shadeV(0, c.W, 0, c.H, 0.07, 0); };
  const uwin = (c, x, y, w, h, o = {}) => glassWin(c, x, y, w, h, { frame: BR, casCol: CRM, ...o });
  const gwall = (c) => { uw(c, '#c3cbb4'); c.fix(FA).rect(0, 0, c.W, 0.7); c.dif('rgba(255,255,255,0.2)'); for (let x = 0; x < c.W; x += 0.3) c.rect(x, 0, 0.02, 0.7); c.rect(0, 0.3, c.W, 0.02); c.rect(0, 0.6, c.W, 0.02); c.fix(CRM).rect(0, 0.7, c.W, 0.08).rect(0, 4.6, c.W, 0.2); };
  c = A.cell('g.ull', BAY, GROUND); // the ground floor: pale plaster on a faience plinth, big openings with clipped corners
  gwall(c);
  c.fix(CRM).opening(0.45, 0.85, c.W - 0.9, 3.4, 'cut', 0.12); c.fix('#2a2c2e').opening(0.45, 0.85, c.W - 0.9, 3.4, 'cut', 0);
  c.glass(0.53, 0.93, c.W - 1.06, 3.24, 'cut', 1, 1); c.fix(BR).openingLine(0.51, 0.91, c.W - 1.02, 3.28, 'cut', 0.07).rect(c.W / 2 - 0.04, 0.93, 0.08, 3.2).rect(0.55, 2.8, c.W - 1.1, 0.06);
  c.end();
  c = A.cell('ull.nobile', BAY, STOREY); uw(c, '#dfe6d2'); c.dif('rgba(0,0,0,0.07)'); for (let x = 0; x < c.W; x += 0.45) c.rect(x, 0, 0.015, c.H); for (let y = 0; y < c.H; y += 0.45) c.rect(0, y, c.W, 0.015);
  uwin(c, 1.2, 0.85, 1.2, 2.2, { head: 'cut', cas: 0.13, cols: 2, trans: 0.22, blind: 0.25 }); c.end();
  c = A.cell('ull.reg', BAY, STOREY); uw(c);
  c.fix(CRM).rect(0.35, 0, 0.1, 4).rect(c.W - 0.45, 0, 0.1, 4); c.fix(SAGED).rect(0.45, 0, c.W - 0.9, 4); uw(c, SAGE); c.fix(CRM).rect(0.3, 0, 0.14, 4).rect(c.W - 0.44, 0, 0.14, 4);
  c.fix(SAGED).rect(0.44, 0, 0.06, 4).rect(c.W - 0.5, 0, 0.06, 4);
  uwin(c, 1.2, 1.15, 1.2, 2.2, { cas: 0.1, cols: 2, trans: 0.28, blind: 0.15, sill: 0 });
  c.fix(CRM).ell(1.8, 0.62, 0.24, 0.24); c.fix(SAGED).ell(1.8, 0.62, 0.17, 0.17); c.fix(CRM).rosette(1.8, 0.62, 0.13, 8); c.end();
  c = A.cell('ull.reg2', BAY, STOREY); uw(c); c.fix(CRM).rect(0.3, 0, 0.14, 4).rect(c.W - 0.44, 0, 0.14, 4);
  uwin(c, 1.2, 0.95, 1.2, 2.0, { cas: 0.1, cols: 2, trans: 0.28, sill: 0.1 });
  c.fix('#5e7f6a').rect(1.0, 0.5, 1.6, 0.4); c.fix(CRM).rect(0.95, 0.45, 1.7, 0.07); c.end();
  c = A.cell('ull.top', BAY, STOREY); uw(c); c.fix(CRM).rect(0.3, 0, 0.14, 4).rect(c.W - 0.44, 0, 0.14, 4);
  uwin(c, 1.15, 0.95, 1.3, 1.5, { cas: 0.08, cols: 2, sill: 0.08 }); c.fix(CRM).rect(0.9, 2.65, 1.8, 0.1); c.end();
  c = A.cell('ull.pier', 1.2, STOREY); uw(c, SAGE); c.fix(CRM).rect(0.45, 0, 0.3, 4); c.end();
  c = A.cell('ull.bowF', 1.15, STOREY); uw(c, CRM); // one facet of a bow: a narrow window between white colonnettes
  c.fix(WH).rect(0, 0, 0.12, 4).rect(1.03, 0, 0.12, 4); uwin(c, 0.22, 0.85, 0.72, 2.3, { cas: 0.06, cols: 1, trans: 0.2, blind: 0.4, sill: 0 }); c.end();
  c = A.cell('ull.frieze', 1.15, STOREY); uw(c, '#d8d2bd'); // the relief panel between the bow's floors: lions round a menorah
  c.fix('#b9a784').rect(0.05, 1.3, 1.05, 1.1); c.fix('#8b7a56').ln([[0.57, 1.55], [0.57, 2.1]], 0.04); for (let k = -3; k <= 3; k++) c.ln([[0.57, 1.7], [0.57 + k * 0.1, 2.05]], 0.02);
  c.fix('#8b7a56').ell(0.25, 1.65, 0.16, 0.1).ell(0.9, 1.65, 0.16, 0.1); c.end();
  c = A.cell('ull.bay', 1.8, STOREY); uw(c, SAGE); // an attic bay window, three facets in one cell
  uwin(c, 0.15, 1.0, 0.5, 1.3, { cas: 0.04, cols: 1, sill: 0.05 }); uwin(c, 0.65, 1.0, 0.5, 1.3, { cas: 0.04, cols: 1, sill: 0.05 }); uwin(c, 1.15, 1.0, 0.5, 1.3, { cas: 0.04, cols: 1, sill: 0.05 }); c.end();
  // the centre of the Ullmann front: four axes of 5 m, tall recessed-frame windows, rosettes in the spandrels
  const uaxis = (name, f) => { const c = A.cell(name, 5.0, STOREY); uw(c); c.fix(CRM).rect(0.28, 0, 0.12, 4).rect(4.6, 0, 0.12, 4); c.dif('rgba(0,0,0,0.07)').rect(0.4, 0, 0.05, 4).rect(4.55, 0, 0.05, 4); f(c); c.end(); };
  uaxis('ullc.nobile', (c) => uwin(c, 1.75, 0.85, 1.5, 2.25, { head: 'cut', cas: 0.13, cols: 2, trans: 0.22, blind: 0.2 }));
  uaxis('ullc.reg', (c) => { c.fix(CRM).rect(1.15, 0.05, 2.7, 0.5); uwin(c, 1.7, 0.95, 1.6, 2.4, { head: 'seg', cas: 0.1, cols: 2, trans: 0.28, blind: 0.1, sill: 0 }); c.fix(CRM).ell(2.5, 0.3, 0.2, 0.2); c.fix(SAGED).ell(2.5, 0.3, 0.13, 0.13); c.fix(CRM).rosette(2.5, 0.3, 0.1, 8); });
  uaxis('ullc.reg2', (c) => { c.fix(CRM).rect(1.15, 0.05, 2.7, 0.5); uwin(c, 1.7, 0.95, 1.6, 2.4, { head: 'seg', cas: 0.1, cols: 2, trans: 0.28, blind: 0.1, sill: 0 }); c.fix(CRM).ell(2.5, 0.3, 0.2, 0.2); c.fix(SAGED).ell(2.5, 0.3, 0.13, 0.13); c.fix(CRM).rosette(2.5, 0.3, 0.1, 8); });
  uaxis('ullc.top', (c) => { uwin(c, 1.75, 0.9, 1.5, 1.9, { cas: 0.1, cols: 2, trans: 0.28, sill: 0.1 }); c.fix(CRM).ell(2.5, 3.35, 0.22, 0.22); c.fix(SAGED).ell(2.5, 3.35, 0.15, 0.15); c.fix(CRM).rosette(2.5, 3.35, 0.11, 8); });
  c = A.cell('ullc.pier', 1.2, STOREY); uw(c, SAGE); c.fix(CRM).rect(0.45, 0, 0.3, 4); c.end();
  c = A.cell('g.ullc', 5.0, GROUND); // ground floor of the centre: three narrow clipped-top openings per axis
  gwall(c);
  for (let i = 0; i < 3; i++) { const x = 0.55 + i * 1.4; c.fix(CRM).opening(x, 0.85, 1.1, 3.3, 'cut', 0.1); c.fix('#2a2c2e').opening(x, 0.85, 1.1, 3.3, 'cut', 0); c.glass(x + 0.06, 0.91, 0.98, 3.18, 'cut', 1, 1); c.fix(BR).openingLine(x + 0.04, 0.89, 1.02, 3.22, 'cut', 0.06).rect(x + 0.52, 0.91, 0.06, 3.18); }
  c.end();
  c = A.cell('gable.ull', 4.0, 3.2); c.fix(CRM).rect(0, 0, 4, 3.2); c.speckle(r, 140); c.fix(CRM).opening(1.2, 0.4, 1.6, 1.9, 'arch', 0.15); c.fix('#2a2c2e').opening(1.2, 0.4, 1.6, 1.9, 'arch', 0); c.glass(1.26, 0.45, 1.48, 1.8, 'arch', 1, 1); c.fix(BR).openingLine(1.24, 0.43, 1.52, 1.84, 'arch', 0.06).rect(1.97, 0.45, 0.06, 1.8); c.end();
  c = A.cell('dorm.ull', 1.3, 1.5); c.fix(SAGE).rect(0, 0, 1.3, 1.5); uwin(c, 0.25, 0.2, 0.8, 1.0, { head: 'seg', cas: 0.08, cols: 2, sill: 0.05 }); c.end();
}
