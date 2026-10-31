// OWNER: oradea. Atlas cells of Casa Kováts (Piața Unirii 5), not a site module: pale-yellow render, white frames and string courses,
// dark red-brown timber windows and doors, round lunettes (white archivolts) over the ground-floor openings, the arched gate in dark
// red timber. Colours from the Commons / oradeaheritage.ro photographs (restored 2010–2011).
//   kovatsCells(A, r)   adds kv.g (a ground window), kv.gd (a ground door), kv.gate, kv.f (a first-floor window), kv.pedi (the tympanum)
import { render, gwin } from './paintkit.js';

export const KV = { wall: '#f5e5ad', trim: '#f6f3ea', plinth: '#cdbf94', brown: '#6c2d26', roof: '#a1503a' };

export function kovatsCells(A, r) {
  const { wall, trim, plinth, brown } = KV, AX = 4.6;
  const base = (c) => { render(c, wall, r); c.fix(plinth).rect(0, 0, c.W, 0.55); c.dif('rgba(0,0,0,0.12)').rect(0, 0.5, c.W, 0.05); };
  // a segmental lunette: the arc of a circle through the chord (cx +- w/2, y) with the given rise, grown by g all round (an 'arch' head of this
  // height drew spiky horns at both ends)
  const seg = (cx, y, w, rs, g) => { const hw = w / 2 + g, r2 = rs + g, R = (hw * hw + r2 * r2) / (2 * r2), cy = y - g + r2 - R, a = Math.asin(hw / R), pts = []; for (let i = 0; i <= 12; i++) { const q = -a + (2 * a * i) / 12; pts.push([cx + R * Math.sin(q), cy + R * Math.cos(q)]); } return pts; };
  const lunette = (c, cx, y, w) => { c.fix(trim).poly(seg(cx, y, w, 0.55, 0.13)); c.fix(wall).poly(seg(cx, y, w, 0.55, 0)); c.dif('rgba(0,0,0,0.1)').poly(seg(cx, y, w - 0.1, 0.55, 0)); };
  let c = A.cell('kv.g', AX, 4.8); base(c);
  gwin(c, (AX - 1.4) / 2, 0.95, 1.4, 2.1, { cols: 2, trans: 0.25, frame: brown, cas: 0.12, casCol: trim, sillCol: trim, sill: 0.1 }); lunette(c, AX / 2, 3.35, 2.3);
  c.end();
  c = A.cell('kv.gd', AX, 4.8); base(c);
  c.fix(trim).rect((AX - 1.6) / 2, 0.55, 1.6, 2.65); c.fix(brown).rect((AX - 1.36) / 2, 0.55, 1.36, 2.5);
  c.fix('#23282e').rect((AX - 1.1) / 2, 1.7, 1.1, 1.2); c.glass((AX - 1.1) / 2, 1.7, 1.1, 1.2, 'flat', 1, 0); c.fix(brown).rect(AX / 2 - 0.03, 1.7, 0.06, 1.2);
  c.dif('rgba(0,0,0,0.25)').rect((AX - 1.1) / 2, 0.75, 1.1, 0.8); lunette(c, AX / 2, 3.35, 2.3); c.end();
  c = A.cell('kv.gate', AX, 4.8); base(c); // the gateway of the entrance passage: a round arch, dark red double doors with a fanlight
  c.fix(trim).opening(0.75, 0.55, 3.1, 2.2, 'arch', 0.22); c.fix(brown).opening(0.75, 0.55, 3.1, 2.2, 'arch', 0);
  c.fix('#23282e').opening(0.95, 2.75, 2.7, 0.01, 'arch', 0); c.glass(1.05, 2.8, 2.5, 0.3, 'arch', 1, 2);
  c.dif('rgba(0,0,0,0.3)').rect(AX / 2 - 0.02, 0.55, 0.04, 2.3).rect(0.85, 1.5, 2.9, 0.03).rect(0.85, 0.9, 2.9, 0.03); for (let i = 0; i < 4; i++) c.rect(1.0 + i * 0.52, 0.6, 0.02, 2.2);
  c.end();
  c = A.cell('kv.f', AX, 4.6); render(c, wall, r);
  c.fix(trim).rect(0, 4.45, AX, 0.15);
  gwin(c, (AX - 1.35) / 2, 1.25, 1.35, 2.35, { cols: 2, trans: 0.25, frame: brown, cas: 0.12, casCol: trim, sillCol: trim, sill: 0.12 });
  c.fix(trim).rect((AX - 1.75) / 2, 3.78, 1.75, 0.16).rect((AX - 1.55) / 2, 3.94, 1.55, 0.08); c.dif('rgba(0,0,0,0.18)').rect((AX - 1.75) / 2, 3.74, 1.75, 0.05); c.end();
  c = A.cell('kv.pedi', 14, 3.2); render(c, wall, r); c.fix(trim).rect(0.6, 0.35, 12.8, 0.1); c.dif('rgba(0,0,0,0.06)').rect(1.2, 0.5, 11.6, 2.2); c.end();
}
