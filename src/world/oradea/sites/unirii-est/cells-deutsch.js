// OWNER: oradea. The atlas cell of Casa Deutsch (Str. Vasile Alecsandri 4), not a site module: the whole street front as one picture,
// 16.9 x 11.4 m at 52 px per metre. Sky-blue render covered with white folk-floral relief (the Kalocsa-style embroidery motifs of the
// Hungarian Secession: peacock fans over the arched windows, flower panels under them, tulip columns on the pilasters), dark
// brown-grey window frames, olive doors, a granite plinth with relief medallions. Colours from the 2021 photographs.
//   deutschCells(A, r)   adds dd.face;  DD = the layout in metres (bays, windows, the silhouette) shared with deutsch.js
import { gwin } from './paintkit.js';

export const DD = {
  W: 16.9, H: 11.4, PLINTH: 0.45, GROUND: 4.05, SILL: 4.45,
  wall: '#86a9cd', orn: '#f0ede4', frame: '#625e55', door: '#71766a', granite: '#8b8c88',
  X: [0, 3.55, 6.75, 11.05, 16.9],   // the bay boundaries (the tulip pilasters stand there)
  // the top edge has three arcs, not four (the second one spans two bays and carries the heart): the finials stand at TX[1] and TX[2]
  TX: [0, 3.55, 11.05, 16.9], TV: [8.1, 8.55, 9.45, 9.7], TP: [9.5, 10.95, 11.35],   // arc ends, the height at them, the peak of each arc
  windows: [{ x: 1.0, w: 1.9, head: 'arch' }, { x: 4.2, w: 1.9, head: 'arch' }, { x: 7.5, w: 2.8, head: 'seg' }, { x: 11.8, w: 4.35, head: 'seg' }],
  heart: [7.3, 9.55],
};
// the top edge: scalloped arcs between the arc ends, [[x, y]] left to right
export function deutschTop(n = 8) {
  const pts = [], { TX, TV, TP } = DD;
  for (let i = 0; i < TX.length - 1; i++) {
    const xa = TX[i], xb = TX[i + 1], va = TV[i], vb = TV[i + 1], bulge = TP[i] - (va + vb) / 2, m = Math.round(n * (xb - xa) / 4.5);
    for (let k = 0; k < m; k++) { const t = k / m; pts.push([xa + (xb - xa) * t, va + (vb - va) * t + bulge * Math.sin(Math.PI * t)]); }
  }
  pts.push([TX[TX.length - 1], TV[TV.length - 1]]);
  return pts;
}

export function deutschCells(A, r) {
  const { W, H, wall, orn, frame } = DD, c = A.cell('dd.face', W, H);
  c.fix(wall).rect(0, 0, W, H); c.speckle(r, 320); c.shadeV(0, W, 0, H, 0.06, 0);
  const wd = '#6f93b8'; // the relief's shadow side on the blue
  const flower = (x, y, s, k = 0) => { // a stylised folk flower: five petals round a heart, two leaves
    c.fix(orn);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + k; c.ell(x + Math.cos(a) * 0.5 * s, y + Math.sin(a) * 0.5 * s, 0.4 * s, 0.19 * s, a); }
    c.ell(x, y, 0.22 * s, 0.22 * s); c.fix(wall).ell(x, y, 0.12 * s, 0.12 * s); c.fix(orn).ell(x, y, 0.06 * s, 0.06 * s);
    c.dif('rgba(40,70,110,0.28)'); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + k; c.ell(x + Math.cos(a) * 0.52 * s, y + Math.sin(a) * 0.52 * s, 0.22 * s, 0.07 * s, a); }
  };
  const fan = (cx, y0, R, n = 9) => { // a peacock fan: petals radiating over an arch
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (0.06 + (i / (n - 1)) * 0.88), x = cx + Math.cos(a) * R * 0.78, y = y0 + Math.sin(a) * R * 0.78;
      c.fix(orn).ell(x, y, R * 0.34, R * 0.13, a); c.dif('rgba(40,70,110,0.3)').ell(x, y, R * 0.2, R * 0.05, a);
      c.fix(orn).ell(cx + Math.cos(a) * R * 1.12, y0 + Math.sin(a) * R * 1.12, R * 0.12, R * 0.08, a + 1.57);
    }
    c.fix(orn).ell(cx, y0 + R * 1.25, R * 0.16, R * 0.16); c.fix(wall).ell(cx, y0 + R * 1.25, R * 0.08, R * 0.08);
  };
  const tulips = (x, y0, y1) => { // a pilaster: a white band with blue tulips up it
    c.fix(orn).rect(x - 0.24, y0, 0.48, y1 - y0); c.dif('rgba(40,70,110,0.18)').rect(x + 0.2, y0, 0.04, y1 - y0);
    for (let y = y0 + 0.22; y < y1 - 0.15; y += 0.3) { c.fix('#7da1c7').ell(x, y, 0.07, 0.11).ell(x - 0.07, y - 0.09, 0.05, 0.11, 0.5).ell(x + 0.07, y - 0.09, 0.05, 0.11, -0.5); c.rect(x - 0.01, y - 0.2, 0.02, 0.12); }
  };
  // ---- plinth: granite with relief medallions at the pilasters
  c.fix(DD.granite).rect(0, 0, W, DD.PLINTH); c.dif('rgba(255,255,255,0.15)').rect(0, DD.PLINTH - 0.05, W, 0.05);
  for (const x of [0.35, 3.55, 6.75, 11.05, 16.55]) { c.fix('#5d5e5b').rect(x - 0.3, 0.05, 0.6, 0.35); c.fix('#7d7e7a').ell(x, 0.23, 0.14, 0.14); c.fix('#5d5e5b').ell(x, 0.23, 0.07, 0.07); }
  // ---- pilasters with tulips
  for (const x of [0.3, ...DD.X.slice(1, 4), W - 0.3]) tulips(x, DD.PLINTH, 8.3);
  // ---- ground floor: shop windows (A, C), a glazed door (B), the big double door (D)
  const shop = (x, w, y0, y1) => { c.fix(orn).rect(x - 0.12, y0 - 0.12, w + 0.24, y1 - y0 + 0.24); c.fix('#23282e').rect(x, y0, w, y1 - y0); c.glass(x + 0.07, y0 + 0.07, w - 0.14, y1 - y0 - 0.14, 'flat', 1, 1);
    c.fix(frame).rect(x, y0, w, 0.07).rect(x, y1 - 0.07, w, 0.07).rect(x, y0, 0.07, y1 - y0).rect(x + w - 0.07, y0, 0.07, y1 - y0).rect(x + w / 2 - 0.03, y0, 0.06, y1 - y0).rect(x, y1 - 0.6, w, 0.06); };
  shop(0.95, 2.1, 1.0, 3.3); shop(7.45, 3.05, 1.0, 3.3);
  c.fix(orn).rect(4.1, DD.PLINTH, 2.1, 3.0); c.fix('#23282e').rect(4.22, DD.PLINTH, 1.86, 2.85); c.glass(4.28, DD.PLINTH + 0.05, 1.74, 2.7, 'flat', 1, 1);
  c.fix(frame).rect(4.22, DD.PLINTH, 0.06, 2.85).rect(6.02, DD.PLINTH, 0.06, 2.85).rect(4.22, 3.3, 1.86, 0.06).rect(5.12, DD.PLINTH, 0.06, 2.8).rect(4.22, 2.7, 1.86, 0.05);
  c.fix(orn).rect(11.55, DD.PLINTH, 4.55, 3.4); c.fix('#5a5f55').rect(11.7, DD.PLINTH, 4.25, 3.2);
  const lw = 2.08; c.fix(DD.door).rect(11.77, DD.PLINTH, lw, 3.05).rect(11.77 + lw, DD.PLINTH, lw, 3.05);
  for (const x of [11.77, 11.77 + lw]) { c.dif('rgba(0,0,0,0.3)').rect(x + 0.16, 0.8, lw - 0.32, 0.8).rect(x + 0.16, 1.75, lw - 0.32, 0.8).rect(x + 0.16, 2.7, lw - 0.32, 0.22); c.dif('rgba(255,255,255,0.12)').rect(x + 0.16, 1.55, lw - 0.32, 0.05).rect(x + 0.16, 2.5, lw - 0.32, 0.05); }
  c.fix('#e8e4da').rect(11.77 + lw + 0.3, 1.7, 0.08, 0.5);
  // ---- the flower band under the upper windows: three white panels per bay
  const bays = [[0.6, 3.3], [3.8, 6.5], [7.0, 10.8], [11.3, 16.3]];
  for (const [a, b] of bays) { const pw = (b - a - 0.2) / 3; for (let k = 0; k < 3; k++) { const x = a + 0.1 + k * pw; c.fix(orn).rect(x, 3.45, pw - 0.1, 0.78); c.fix(wall).rect(x + 0.07, 3.52, pw - 0.24, 0.64); flower(x + (pw - 0.1) / 2, 3.84, 0.42 + (k === 1 ? 0.06 : 0), k); } }
  c.fix(orn).rect(0.6, 4.23, 15.7, 0.12); c.dif('rgba(40,70,110,0.25)').rect(0.6, 4.2, 15.7, 0.04);
  // ---- the arched windows with their rounded casings, the peacock fans above
  DD.windows.forEach((o, i) => {
    const hh = 2.45;
    c.fix(orn).opening(o.x, DD.SILL, o.w, hh, o.head, 0.2);
    gwin(c, o.x, DD.SILL, o.w, hh, { head: o.head, cols: o.w > 3 ? 4 : 3, trans: 0.3, frame, sill: 0, tone: 1 });
    const cx = o.x + o.w / 2, top = DD.SILL + hh + (o.head === 'arch' ? o.w / 2 : o.w * 0.21);
    fan(cx, top + 0.1, Math.min(1.5, 0.55 + o.w * 0.3));
  });
  // ---- the tympanum: flowers in the spandrels between the fans, the heart-shaped oculus on the middle axis
  for (const [x, y, s, k] of [[3.55, 8.35, 0.8, 0.4], [6.75, 8.1, 0.7, 1.1], [11.05, 8.5, 0.95, 0.2], [2.3, 7.95, 0.6, 0.7], [15.4, 8.4, 0.75, 0.9], [0.55, 8.0, 0.5, 0.3], [16.4, 8.9, 0.5, 0.8]]) flower(x, y, s, k);
  const [hx, hy] = DD.heart;
  c.fix(orn).ell(hx, hy, 0.5, 0.5); const hp = [[0, -0.36], [0.34, 0.02], [0.28, 0.22], [0.1, 0.3], [0, 0.18], [-0.1, 0.3], [-0.28, 0.22], [-0.34, 0.02]];
  c.fix('#37404c').poly(hp.map(([dx, dy]) => [hx + dx, hy + dy + 0.0])); c.fix('#c9cdd2').ln([[hx - 0.18, hy - 0.04], [hx, hy - 0.2], [hx + 0.18, hy - 0.04]], 0.02);
  c.end();
}
