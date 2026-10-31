// OWNER: oradea. Atlas cells of the Füchsl Palace (Strada Mihai Viteazul / Strada Independenței, 1902–1903, Zoltán Bálint and Lajos
// Jámbor for the wine merchants Arnold and Mór Füchsl), not a site module. Fixed colours read from the 2023 restoration photographs
// (Commons): cream-white wall panels framed by taupe-pink piers, peach-orange relief (vines with grapes, urns, wavy bands, the «FT»
// monogram), dark-grey S-curved copings and cornice, golden-oak windows, a taupe ground storey with tall dark-brown shop doors.
//   fuchslCells(A, r)   adds fu.g / fu.gW / fu.gM (ground: bay, wing, monogram strip), fu.f1 / fu.f2 (the floors of a bay), fu.f1W / fu.f2W
//     (a wing bay), fu.fM (the vine strip), fu.gable (a wing's gable with the kidney-shaped attic window), fu.tg / fu.t1 / fu.t2 / fu.tw1 /
//     fu.tw2 (a facet of the round tower), fu.lant (the lantern on the tower's cone)
import { render, gwin, gableWave, shade, ironCell } from './paint.js';

export const FU = { wall: '#ebe5da', pier: '#cdb7ab', ground: '#e1cfbc', orange: '#e2a479', grey: '#69707a', gold: '#b98640', brown: '#4a2a24', trim: '#e7dccf', roof: '#7e3d30', GH: 4.6, SH: 4.0, AX: 3.7, WW: 4.4, TW: 1.1 };

export function fuchslCells(A, r) {
  const { wall, pier, ground, orange, grey, gold, brown, trim, GH, SH, AX, WW, TW } = FU;
  const plaster = (c, col = wall) => render(c, col, r, 160);
  const wave = (c, w, y, amp = 0.07) => c.fix(orange).ln(Array.from({ length: 49 }, (_, k) => [(k / 48) * w, y + Math.sin((k / 48) * w * 3.2) * amp]), 0.045);
  const urn = (c, x, y, s = 1) => { c.fix(orange).poly([[x - 0.1 * s, y], [x + 0.1 * s, y], [x + 0.16 * s, y + 0.22 * s], [x + 0.06 * s, y + 0.3 * s], [x - 0.06 * s, y + 0.3 * s], [x - 0.16 * s, y + 0.22 * s]]);
    for (const [dx, dy] of [[0, 0.46], [-0.14, 0.4], [0.14, 0.4], [-0.07, 0.56], [0.07, 0.56]]) c.ell(x + dx * s, y + dy * s, 0.07 * s, 0.07 * s); };
  const grapes = (c, x, y, s = 1) => { c.fix(orange); for (let row = 0; row < 4; row++) for (let k = 0; k <= row; k++) c.ell(x + (k - row / 2) * 0.12 * s, y - row * 0.1 * s, 0.055 * s, 0.055 * s); c.leaf(x, y + 0.04 * s, 0.22 * s, 0.1 * s, 0.9).leaf(x, y + 0.04 * s, 0.22 * s, 0.1 * s, 2.2); };
  // ---- the ground storey: taupe wall, two tall dark shop doors with a transom, a fascia band
  const ground0 = (name, w, wide) => {
    const c = A.cell(name, w, GH); plaster(c, ground); c.fix(shade(ground, 0.84)).rect(0, 0, w, 0.5); c.dif('rgba(255,255,255,0.12)').rect(0, 0.5, w, 0.05);
    const dw = (w - 0.9) / 2 - 0.1;
    if (wide) { // one wide shop window and a door at the side
      c.fix(brown).rect(0.3, 0.55, w - 1.7, 3.0); c.glass(0.38, 0.63, w - 1.86, 2.84, 'flat', 1, 1); c.fix(brown).rect(0.38, 2.6, w - 1.86, 0.06).rect(0.3 + (w - 1.7) / 2 - 0.03, 0.63, 0.06, 2.0);
      c.fix(brown).rect(w - 1.2, 0.5, 0.9, 3.4); c.glass(w - 1.12, 0.58, 0.74, 3.24, 'flat', 1, 1); c.fix(brown).rect(w - 1.12, 2.95, 0.74, 0.06);
    } else for (let k = 0; k < 2; k++) {
      const x = 0.35 + k * (dw + 0.2);
      c.fix(brown).rect(x, 0.5, dw, 3.4); c.glass(x + 0.08, 0.58, dw - 0.16, 3.24, 'flat', 1, 1); c.fix(brown).rect(x + dw / 2 - 0.03, 0.58, 0.06, 2.7).rect(x + 0.08, 2.95, dw - 0.16, 0.06).rect(x + 0.08, 1.2, dw - 0.16, 0.05);
    }
    c.fix(shade(ground, 0.9)).rect(0, 4.05, w, 0.22); c.dif('rgba(0,0,0,0.12)').rect(0, 4.0, w, 0.05); c.end();
  };
  ground0('fu.g', AX, true); ground0('fu.gW', WW, false);
  let c = A.cell('fu.gM', TW, GH); plaster(c, pier); c.fix(shade(pier, 0.82)).rect(0, 0, TW, 0.5);
  c.fix(orange).ell(TW / 2, 3.2, 0.36, 0.46); c.fix(pier).ell(TW / 2, 3.2, 0.29, 0.39);
  c.fix(orange).rect(TW / 2 - 0.2, 3.02, 0.06, 0.36).rect(TW / 2 - 0.2, 3.34, 0.18, 0.05).rect(TW / 2 - 0.2, 3.2, 0.14, 0.04).rect(TW / 2 + 0.03, 3.34, 0.2, 0.05).rect(TW / 2 + 0.11, 3.02, 0.06, 0.36); // «FT»
  c.end();
  // ---- the floors of a plain bay: a golden window, an urn panel under it, the wavy orange band under the cornice
  const bay = (name, w, h, wh, top, o = {}) => {
    const c = A.cell(name, w, h); plaster(c); const ww = o.w ?? 1.0;
    gwin(c, (w - ww) / 2, 0.95, ww, wh, { cols: 2, trans: 0.25, frame: gold, cas: 0.1, casCol: trim, sill: 0.1, sillCol: trim, blind: 0, tone: 2 });
    for (const sx of [(w - ww) / 2 - 0.5, (w + ww) / 2 + 0.1]) { c.fix('#5b3a2c').rect(sx, 0.95, 0.4, wh); c.dif('rgba(0,0,0,0.25)'); for (let yy = 1.1; yy < 0.95 + wh - 0.05; yy += 0.14) c.rect(sx + 0.03, yy, 0.34, 0.025); }
    c.fix(shade(trim, 0.96)).rect((w - ww) / 2 - 0.3, 0.12, ww + 0.6, 0.55); c.dif('rgba(0,0,0,0.07)').rect((w - ww) / 2 - 0.3, 0.12, ww + 0.6, 0.03); urn(c, w / 2, 0.2, 0.9);
    wave(c, w, top); c.fix(orange).rect(0, top + 0.14, w, 0.035); c.end();
  };
  bay('fu.f1', AX, SH, 2.4, SH - 0.28); bay('fu.f2', AX, SH - 0.1, 2.2, SH - 0.38, { w: 0.95 });
  // ---- a wing bay: taupe-pink piers with a textured stripe each side, a two-light window, a basket panel, the same band
  const wing = (name, h, wh, top) => {
    const c = A.cell(name, WW, h); plaster(c, pier);
    for (const x of [0.25, WW - 0.6]) { c.fix(shade(pier, 0.86)).rect(x, 0.2, 0.35, h - 0.5); c.speckle(r, 90); c.fix(orange).ell(x + 0.17, h - 0.45, 0.1, 0.1); }
    gwin(c, 1.0, 0.95, WW - 2.0, wh, { cols: 2, trans: 0.25, frame: gold, cas: 0.1, casCol: trim, sill: 0.1, sillCol: trim, tone: 2 });
    c.fix(wall).rect(1.0, 0.12, WW - 2.0, 0.55); urn(c, WW / 2, 0.18, 0.9); wave(c, WW, top); c.end();
  };
  wing('fu.f1W', SH, 2.4, SH - 0.28); wing('fu.f2W', SH - 0.1, 2.2, SH - 0.38);
  // ---- the vine strip on the axis: a vine with grapes climbing a cream band, the «FT» above its foot
  c = A.cell('fu.fM', TW, SH); plaster(c, pier); c.fix(wall).rect(0.2, 0, TW - 0.4, SH);
  c.fix(orange).vine(TW / 2, 0.1, TW / 2, SH - 0.2, 0.17, 9, 0.04, 0.2); for (let y = 0.7; y < SH - 0.4; y += 0.85) grapes(c, TW / 2 + ((y * 5) % 2 < 1 ? 0.14 : -0.14), y, 1);
  c.end();
  // ---- the gable of a wing: taupe-pink, the kidney-shaped attic window in a relief frame, S-curved grey coping along the edge
  c = A.cell('fu.gable', 5.2, 4.4); plaster(c, pier); const cx = 2.6;
  c.fix(orange).ell(cx, 1.15, 1.0, 0.62); c.fix(pier).ell(cx, 1.15, 0.9, 0.52); c.fix('#23282e').ell(cx, 1.15, 0.72, 0.38); c.glass(cx - 0.55, 1.0, 1.1, 0.3, 'flat', 1, 2);
  c.fix('#23282e').ell(cx - 0.3, 1.2, 0.35, 0.26).ell(cx + 0.3, 1.2, 0.35, 0.26).ell(cx, 1.1, 0.5, 0.25); c.glass(cx - 0.5, 0.95, 1.0, 0.5, 'flat', 1, 2);
  c.fix(orange).ln([[cx - 1.35, 1.8], [cx - 1.0, 2.2], [cx - 0.5, 2.3], [cx - 0.3, 2.05]], 0.05).ln([[cx + 1.35, 1.8], [cx + 1.0, 2.2], [cx + 0.5, 2.3], [cx + 0.3, 2.05]], 0.05);
  urn(c, cx, 2.55, 1.3); grapes(c, cx, 3.5, 1.4); wave(c, 5.2, 0.3, 0.05);
  const gw = gableWave(5.2, 4.4); c.fix(grey).ln(gw.map(([x, y]) => [x, Math.max(0.1, y - 0.1)]), 0.18); c.end();
  // ---- the round tower, 1.1 m a facet: ground, windows on the first and second floor, blank twins
  c = A.cell('fu.tg', TW, GH); plaster(c, ground); c.fix(shade(ground, 0.82)).rect(0, 0, TW, 0.5); c.fix(brown).rect(0.12, 0.5, TW - 0.24, 3.4); c.glass(0.2, 0.58, TW - 0.4, 3.24, 'flat', 1, 1); c.fix(shade(ground, 0.9)).rect(0, 4.05, TW, 0.22); c.end();
  c = A.cell('fu.t1', TW, SH); plaster(c); gwin(c, 0.17, 0.95, TW - 0.34, 2.4, { cols: 1, trans: 0.25, frame: gold, cas: 0.08, casCol: trim, sill: 0.08, sillCol: trim, tone: 2 }); wave(c, TW, SH - 0.28); c.end();
  c = A.cell('fu.t2', TW, SH - 0.1); plaster(c); gwin(c, 0.19, 0.95, TW - 0.38, 2.2, { cols: 1, trans: 0.25, frame: gold, cas: 0.08, casCol: trim, sill: 0.08, sillCol: trim, tone: 2 }); wave(c, TW, SH - 0.38); c.end();
  c = A.cell('fu.tw1', TW, SH); plaster(c); wave(c, TW, SH - 0.28); c.dif('rgba(0,0,0,0.05)').rect(0.12, 0.9, TW - 0.24, 2.2); c.end();
  c = A.cell('fu.tw2', TW, SH - 0.1); plaster(c); wave(c, TW, SH - 0.38); c.dif('rgba(0,0,0,0.05)').rect(0.12, 0.9, TW - 0.24, 2.0); c.end();
  // ---- the lantern on the cone: a white drum with small arches
  ironCell(A, 'rail.F', '#3a342f', 'wave', 3.6);
  c = A.cell('fu.lant', 0.7, 1.4); plaster(c, '#f1ece2'); c.fix('#5a5550').opening(0.14, 0.25, 0.42, 0.8, 'arch', 0); c.fix('#f1ece2').rect(0, 0, 0.7, 0.16).rect(0, 1.25, 0.7, 0.15); c.end();
}
