// OWNER: oradea. A shared bay painter and run dresser for the villas and museum houses of the Parcul Traian site (not a site module).
//   bayCells(A, r, k, P)   adds the cells k.g (a ground window bay), k.gd (the door bay), k.f (an upper window bay), k.fb (an upper bay with a
//     balcony door), k.f3 (a wide bay of three windows), k.p / k.pu (a blank ground / upper pier), k.gable (a tympanum 5.6 x 2.4 m),
//     k.rail (a wrought-iron rail strip 3.6 x 1 m); P: { wall, trim, plinth, frame, GH, SH, AX, g: 'arch' | 'flat' (ground windows), u: the
//     upper windows' head, accent (a second casing colour, e.g. brick), cas (casing width), sill, blind (a shutter share, 0..1), blindCol,
//     door (the door's colour), band (a string course in the trim colour at the head of each storey) }
//   makeDress(k) -> a `spec.dress` for ../unirii-est/assemble.js: ../ferdinand-olosig/dress.js's run dresser, with runs under 3.2 m as blank piers
import { render, gwin } from '../unirii-est/paintkit.js';
import { dressRun } from '../ferdinand-olosig/dress.js';
import { aq, dbox } from '../republicii/facade.js';
import { gable } from '../republicii/herokit.js';
import { zwerch } from '../unirii-est/kit.js';
import { face } from '../../../cherkasy/slabkit.js';

export function bayCells(A, r, k, P) {
  const { wall, trim, plinth, frame, GH, SH, AX, g = 'flat', u = 'flat', accent = null, cas = 0.14, sill = 0.13, blind = 0, blindCol = '#6d7a5a', door = '#5a3a2a', band = true } = P;
  const cc = accent ?? trim;
  const body = (c, h, ground) => { render(c, wall, r, 170); if (ground) { c.fix(plinth).rect(0, 0, c.W, 0.5); c.dif('rgba(0,0,0,0.12)').rect(0, 0.46, c.W, 0.05); } if (band) c.fix(trim).rect(0, h - 0.2, c.W, 0.2); };
  let c = A.cell(`${k}.g`, AX, GH); body(c, GH, true);
  gwin(c, (AX - 1.35) / 2, 0.9, 1.35, 2.4, { head: g, cols: 2, trans: 0.28, frame, cas, casCol: cc, sill, sillCol: trim, blind, blindCol });
  c.end();
  c = A.cell(`${k}.gd`, AX + 0.4, GH); body(c, GH, true);
  { const w = 1.7, x = (c.W - w) / 2, head = g === 'arch' ? 'arch' : 'flat'; c.fix(cc).opening(x - 0.18, 0.5, w + 0.36, 2.95, head, 0); c.fix(door).opening(x, 0.5, w, 2.8, head, 0);
    c.fix('#23282e').opening(x + 0.22, 1.6, w - 0.44, 1.5, head, 0); c.glass(x + 0.26, 1.64, w - 0.52, 1.42, head, 1, 1); c.fix(frame).rect(c.W / 2 - 0.03, 0.55, 0.06, 2.6);
    c.dif('rgba(0,0,0,0.25)').rect(x + 0.1, 0.65, w / 2 - 0.2, 0.8).rect(c.W / 2 + 0.1, 0.65, w / 2 - 0.2, 0.8); }
  c.end();
  c = A.cell(`${k}.f`, AX, SH); body(c, SH, false);
  gwin(c, (AX - 1.3) / 2, 0.75, 1.3, 2.3, { head: u, cols: 2, trans: 0.28, frame, cas, casCol: cc, sill, sillCol: trim, blind, blindCol });
  c.end();
  c = A.cell(`${k}.fb`, AX, SH); body(c, SH, false);
  gwin(c, (AX - 1.5) / 2, 0.15, 1.5, 3.1, { head: u, cols: 2, trans: 0.22, frame, cas, casCol: cc, sill: 0, blind, blindCol });
  c.end();
  c = A.cell(`${k}.f3`, AX + 1.6, SH); body(c, SH, false);
  { const w = 1.0, gap = 0.28, tot = 3 * w + 2 * gap, x0 = (c.W - tot) / 2; c.fix(cc).rect(x0 - 0.16, 0.6, tot + 0.32, 2.75);
    for (let i = 0; i < 3; i++) gwin(c, x0 + i * (w + gap), 0.75, w, 2.3, { head: 'arch', cols: 1, trans: 0.3, frame, cas: 0.1, casCol: cc, sill: 0, blind: 0 });
    c.fix(trim); for (let i = 0; i < 2; i++) c.rect(x0 + (i + 1) * w + i * gap + 0.02, 0.75, gap - 0.04, 2.1); c.fix(trim).rect(x0 - 0.2, 0.52, tot + 0.4, 0.1); }
  c.end();
  c = A.cell(`${k}.p`, 3.2, GH); body(c, GH, true); c.end();
  c = A.cell(`${k}.pu`, 3.2, SH); body(c, SH, false); c.end();
  c = A.cell(`${k}.gable`, 5.6, 2.4); render(c, wall, r, 120); c.fix(trim).rect(0, 0, 5.6, 0.14);
  c.fix(cc).ell(2.8, 1.0, 0.45, 0.45); c.fix(wall).ell(2.8, 1.0, 0.33, 0.33); c.fix('#23282e').ell(2.8, 1.0, 0.28, 0.28); c.fix(frame).rect(2.77, 0.72, 0.06, 0.56).rect(2.52, 0.97, 0.56, 0.06); c.end();
  c = A.cell(`${k}.rail`, 3.6, 1.0); c.fix('#2c2926').rect(0, 0.93, c.W, 0.05).rect(0, 0.08, c.W, 0.04); for (let i = 0; i <= 28; i++) c.rect(0.04 + i * 0.126, 0.1, 0.02, 0.83); c.rect(0, 0.5, c.W, 0.03); c.end();
}

const BLANK = (k) => ({ layout: 'p', n: 1, cells: { p: { g: `${k}.p`, f: [`${k}.pu`] } } });
export function makeDress(k) {
  return (K, f, s0, s1, floorY, spec, rnd, l) => {
    if (s1 - s0 < 3.2) l.def = { ...l.def, ...BLANK(k), n: l.def?.n ?? spec.n, gh: l.def?.gh, sh: l.def?.sh, mould: l.def?.mould };
    dressRun(K, f, s0, s1, floorY, spec, rnd, l);
  };
}

// an `after` hook: a triangular pediment (cell k.gable) with its roof behind it over every token `tok` of a front, and entrance steps
export function pedimentHook(k, { w = 4.6, h = 1.7, roof, tok = 'G', steps = true, outline = null }) {
  return ({ K, pieces, depth, rnd }) => {
    for (const l of pieces) {
      const tks = l.info?.toks.filter((q) => q.t === tok) ?? []; if (!tks.length) continue;
      const e = l.e, f = face(e.B, e.A, e.nx, e.nz), surf = (o) => l.He + 0.12 + (l.Hl - l.He - 0.12) * Math.min(1, o / depth);
      for (const tk of tks) {
        const sc = (tk.a + tk.b) / 2, ww = Math.min(w, tk.b - tk.a + 1.0);
        gable(K, f, sc, l.He + 0.1, ww, h, outline ? outline(ww, h) : [[0, 0], [ww, 0], [ww / 2, h]], `${k}.gable`, rnd(), l.spec.pal, 0.05);
        zwerch(K, f, sc, l.He + 0.1, ww, h, surf, depth, roof);
        if (steps) { dbox(K, f, sc - 1.6, sc + 1.6, l.floor - 0.5, l.floor - 0.02, 0, 1.0, 'ftulr', '#cfc6b2'); dbox(K, f, sc - 1.9, sc + 1.9, l.floor - 1.0, l.floor - 0.5, 0, 1.6, 'ftulr', '#c4baa4'); }
      }
    }
  };
}
