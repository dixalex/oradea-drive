// OWNER: oradea. Atlas cells of the Strada Vasile Alecsandri row (not a site module): six parametric styles painted in fixed colours,
// each with the five storey cells and two ground cells the republicii dressLot reads (`${style}.reg|reg2|nobile|top|pier`, a ground bay
// `g.${style}`, a ground pier `g.${style}P`), plus a gate cell for the passages. The facades are readings of the buildings' styles, not
// of photographs of them (see row.js for what each stands for); ground floors carry blank fascias, no shop names.
//   rowCells(A, r)   adds the cells of ROW_STYLES, a gate `g.munkG`, the Arcadia door `g.innD`, and rail.A / rail.B / rail.C (iron)
//   ROW_STYLES: key -> { wall, trim, ... }  (colours the buildings pass to dressLot as its wall / trim pair)
import { S } from '../republicii/paint.js';
import { render, gwin, railCell } from './paintkit.js';

export const ROW_STYLES = {
  roth:   { wall: '#e6c7b9', trim: '#f6efe4', frame: '#46564c', ground: '#b9a99b', head: 'seg', headN: 'arch', headT: 'flat', hood: 'curve', garland: false, round: true },
  munk:   { wall: '#e4cf9f', trim: '#f4ebd2', frame: '#4b3a2e', ground: '#bdb29a', head: 'flat', headN: 'flat', headT: 'seg', hood: 'tri', garland: false, rust: true },
  no5:    { wall: '#d9cdb7', trim: '#efe8d8', frame: '#4d4a44', ground: '#b4ab98', head: 'flat', headN: 'flat', headT: 'flat', hood: 'none', garland: false },
  rendes: { wall: '#e4c56c', trim: '#f3eee0', frame: '#3f3a34', ground: '#b9b7ad', head: 'flat', headN: 'flat', headT: 'flat', hood: 'seg', garland: true, rust: true, bracket: true },
  amant:  { wall: '#efe0b3', trim: '#f7f2e4', frame: '#4a3b30', ground: '#c9bd9c', head: 'flat', headN: 'flat', headT: 'flat', hood: 'tri', garland: false, pilaster: true },
  inn:    { wall: '#ecd3ae', trim: '#f4ead6', frame: '#5a3b2c', ground: '#c3b392', head: 'seg', headN: 'seg', headT: 'flat', hood: 'none', garland: false, shutters: true },
};

export function rowCells(A, r) {
  const AX = 3.6, WIN = 1.1;
  const alias = (from, to) => { A.cells[to] = A.cells[from]; };
  const tools = (key, o) => {
    const base = (c) => { render(c, o.wall, r); };
    const hood = (c, x, y, w, kind) => { // the casing's head: a triangular or segmental pediment, a plain hood, or a curved Secession brow
      if (kind === 'tri') { c.fix(o.trim).poly([[x - 0.18, y], [x + w + 0.18, y], [x + w / 2, y + 0.5]]); c.fix(o.wall).poly([[x + 0.1, y + 0.05], [x + w - 0.1, y + 0.05], [x + w / 2, y + 0.34]]); c.dif('rgba(0,0,0,0.15)').rect(x - 0.18, y - 0.04, w + 0.36, 0.04); }
      else if (kind === 'seg') { c.fix(o.trim).opening(x - 0.15, y, w + 0.3, 0.05, 'seg', 0.0); c.fix(o.wall).opening(x - 0.02, y + 0.06, w + 0.04, 0.02, 'seg', 0); }
      else if (kind === 'curve') { c.fix(o.trim).ln([[x - 0.25, y - 0.1], [x + w * 0.2, y + 0.3], [x + w / 2, y + 0.18], [x + w * 0.8, y + 0.3], [x + w + 0.25, y - 0.1]], 0.1); }
    };
    const win = (c, x, y, w, h, head, op = {}) => {
      if (o.round) c.fix(o.trim).rr(x - 0.16, y - 0.16, w + 0.32, h + 0.32, 0.22); else c.fix(o.trim).opening(x, y, w, h, head, 0.15);
      gwin(c, x, y, w, h, { head, cols: 2, trans: 0.24, frame: o.frame, sill: 0.1, sillCol: o.trim, ...op });
      if (o.shutters) { c.fix('#3f6a4b').rect(x - 0.5, y, 0.42, h).rect(x + w + 0.08, y, 0.42, h); c.dif('rgba(0,0,0,0.25)'); for (let yy = y + 0.1; yy < y + h; yy += 0.12) c.rect(x - 0.5, yy, 0.42, 0.02).rect(x + w + 0.08, yy, 0.42, 0.02); }
    };
    const apron = (c, x, w) => { if (o.bracket) { c.fix(o.trim).rect(x - 0.05, 0.55, w + 0.1, 0.1); for (let i = 0; i < 4; i++) c.rect(x + 0.05 + i * (w - 0.2) / 3, 0.3, 0.1, 0.25); } };
    const pil = (c) => { if (o.pilaster) c.fix(o.trim).rect(0, 0, 0.25, 4).rect(AX - 0.25, 0, 0.25, 4); };
    return { base, hood, win, apron, pil };
  };
  const wx = (w) => (AX - w) / 2;
  // pass 1: the storey cells of every style (all 4.0 m tall, so the atlas shelves stay tight)
  for (const [key, o] of Object.entries(ROW_STYLES)) {
    const { base, hood, win, apron, pil } = tools(key, o);
    let c = A.cell(`${key}.reg`, AX, 4.0); base(c); pil(c); win(c, wx(WIN), 1.0, WIN, 1.95, o.head); hood(c, wx(WIN), 3.1, WIN, o.hood); apron(c, wx(WIN), WIN); c.end();
    alias(`${key}.reg`, `${key}.reg2`);
    c = A.cell(`${key}.nobile`, AX, 4.0); base(c); pil(c); win(c, wx(1.25), 0.75, 1.25, 2.4, o.headN, { sill: 0 }); hood(c, wx(1.25), 3.3, 1.25, o.hood); c.end();
    c = A.cell(`${key}.top`, AX, 4.0); base(c); pil(c); win(c, wx(1.05), 0.95, 1.05, 1.65, o.headT);
    if (o.garland) { c.fix('#9b8a3a').ln(Array.from({ length: 13 }, (_, i) => [0.1 + (AX - 0.2) * i / 12, 3.5 - Math.sin(Math.PI * i / 12) * 0.28]), 0.07); for (let i = 1; i < 6; i++) c.fix('#c9b94c').ell(0.1 + (AX - 0.2) * i / 6, 3.3, 0.05, 0.07); c.fix(o.trim).rect(0, 3.6, AX, 0.12); } c.end();
    c = A.cell(`${key}.pier`, 1.2, 4.0); base(c); c.fix(o.trim).rect(0.35, 0, 0.5, 4); c.dif('rgba(0,0,0,0.1)').rect(0.35, 0, 0.03, 4).rect(0.82, 0, 0.03, 4); c.end();
  }
  // pass 2: the ground floors: a blank fascia over an arched shopfront on a stone plinth
  for (const [key, o] of Object.entries(ROW_STYLES)) {
    let c = A.cell(`g.${key}`, AX, 4.8); render(c, o.ground, r);
    if (o.rust) { c.dif('rgba(0,0,0,0.12)'); for (let y = 0.35; y < 4.8; y += 0.45) c.rect(0, y, AX, 0.035); }
    c.fix('#6f6a60').rect(0, 0, AX, 0.45); c.fix(o.trim).opening(0.45, 0.6, AX - 0.9, 3.0, 'arch', 0.14); c.fix('#202429').opening(0.45, 0.6, AX - 0.9, 3.0, 'arch', 0); c.glass(0.53, 0.68, AX - 1.06, 2.85, 'arch', 1, 1);
    c.fix(o.frame).rect(AX / 2 - 0.03, 0.68, 0.06, 2.5).rect(0.53, 2.0, AX - 1.06, 0.05).rect(0.53, 0.68, AX - 1.06, 0.55); c.fix(o.trim).rect(0, 4.55, AX, 0.25); c.end();
    c = A.cell(`g.${key}P`, 1.2, 4.8); render(c, o.ground, r); if (o.rust) { c.dif('rgba(0,0,0,0.12)'); for (let y = 0.35; y < 4.8; y += 0.45) c.rect(0, y, 1.2, 0.035); }
    c.fix('#6f6a60').rect(0, 0, 1.2, 0.45); c.fix(o.trim).rect(0, 4.55, 1.2, 0.25); c.end();
  }
  // the Munk passage: a wide round arch into the courtyard of the 1893 bazaar, a dark timber gate
  const M = ROW_STYLES.munk;
  let c = A.cell('g.munkG', AX, 4.8); render(c, M.ground, r); c.dif('rgba(0,0,0,0.12)'); for (let y = 0.35; y < 4.8; y += 0.45) c.rect(0, y, AX, 0.035);
  c.fix('#6f6a60').rect(0, 0, AX, 0.45); c.fix(M.trim).opening(0.4, 0.45, AX - 0.8, 2.9, 'arch', 0.2); c.fix('#14171a').opening(0.4, 0.45, AX - 0.8, 2.9, 'arch', 0);
  c.fix('#4b3a2e').opening(0.55, 0.45, AX - 1.1, 2.2, 'arch', 0); c.dif('rgba(0,0,0,0.3)').rect(AX / 2 - 0.02, 0.45, 0.04, 2.5); c.fix(M.trim).rect(0, 4.55, AX, 0.25); c.end();
  // the Arcadia theatre's door: the theatre's own lettering over it (the one name the row carries)
  const I = ROW_STYLES.inn;
  c = A.cell('g.innD', AX, 4.8); render(c, I.ground, r);
  c.fix('#6f6a60').rect(0, 0, AX, 0.45); c.fix(I.trim).opening(0.65, 0.45, AX - 1.3, 2.4, 'seg', 0.16); c.fix('#5a3b2c').opening(0.65, 0.45, AX - 1.3, 2.4, 'seg', 0);
  c.fix('#202429').opening(0.85, 1.7, AX - 1.7, 1.2, 'seg', 0); c.glass(0.85, 1.7, AX - 1.7, 1.2, 'seg', 1, 0); c.dif('rgba(0,0,0,0.3)').rect(AX / 2 - 0.02, 0.45, 0.04, 2.4);
  c.fix('#2b2a2a').rect(0.2, 3.3, AX - 0.4, 0.95);
  { // the lettering is shrunk to fit its plate (it ran over both ends at a fixed 19 px)
    const g = A.d, pw = (AX - 0.4) * S - 16; g.save(); g.font = 'bold 19px Georgia, serif';
    const w = g.measureText('TEATRUL ARCADIA').width; g.font = `bold ${Math.max(8, Math.floor(19 * Math.min(1, pw / w)))}px Georgia, serif`;
    g.fillStyle = '#e8dfc4'; g.textAlign = 'center'; g.fillText('TEATRUL ARCADIA', c.X(AX / 2), c.Y(3.65)); g.restore();
  }
  c.end();
  railCell(A, 'rail.B', '#2b2d2f', 1);
  alias('rail.B', 'rail.A'); alias('rail.B', 'rail.C');
}
