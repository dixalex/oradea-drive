// OWNER: oradea. The cells of the Calea Republicii facade atlas: one bay (3.6 m wide) of one storey (4.0 m; the ground
// floor 4.8 m) per cell, painted per style. Not a site module.
//   buildAtlas(r) -> { A, textures: { map, mask }, uv(name) }   r: a seeded random() ; cell names:
//     `${style}.${kind}`   style: lilien stern apollo baroque wagner plain modern civic;  kind: reg reg2 nobile top pier
//     g.<kind>             ground floors common to the styles: shopA..shopD (timber Secession, 4 colours), glassA..C
//                          (modern glass + fascia), arch (stone arch), gate, entry, pier (a rusticated ground pier)
//     rail.A..D            wrought-iron balcony railings (alpha), 3.6 x 1.0 m
//   The tint roles: wall(v) gets the building's wall colour, trim(v) its trim colour (material.js); the rest is fixed.
import { Atlas, S } from './paint.js';
import { heroCells } from './herocells.js';

export const BAY = 3.6, STOREY = 4.0, GROUND = 4.8;
export const STYLES = ['lilien', 'stern', 'apollo', 'baroque', 'wagner', 'plain', 'modern', 'civic'];
const PI = Math.PI;

// ---- a window: casing (trim), reveal, glass, frame bars, blind, sill
function win(c, x, y, w, h, o = {}) {
  const { head = 'flat', cas = 0.16, casHead = head, frame = '#f2efe6', cols = 2, rows = 0, trans = 0, blind = 0, lit = 1, tone = 0, sill = 0.1, bcol = '#cdbf9c', rcas = 0 } = o;
  if (cas > 0) { c.trim(0.92); if (rcas) c.rr(x - cas, y - cas, w + 2 * cas, h + 2 * cas, rcas); else c.opening(x, y, w, h, casHead, cas); }
  c.fix('#262c33').opening(x, y, w, h, head);
  const t = 0.045;
  c.glass(x + t, y + t, w - 2 * t, h - 2 * t, head, lit, tone);
  c.dif('rgba(0,0,0,0.28)').rect(x + t, y + t, 0.06, h - 2 * t).rect(x + t, y + h - 0.12, w - 2 * t, 0.07);   // reveal shadow, left and top
  c.fix(frame);
  c.openingLine(x + t / 2, y + t / 2, w - t, h - t, head, t);
  for (let i = 1; i < cols; i++) c.rect(x + (w * i) / cols - 0.018, y + t, 0.036, h - 2 * t);
  if (trans) c.rect(x + t, y + h * (1 - trans) - 0.02, w - 2 * t, 0.04);
  for (let i = 1; i <= rows; i++) c.rect(x + t, y + (h * (1 - trans) * i) / (rows + 1), w - 2 * t, 0.02);
  if (blind > 0) {
    const bh = Math.min(h - 0.2, h * blind);
    c.fix(bcol, 0).rect(x + t, y + h - t - bh, w - 2 * t, bh);
    c.dif('rgba(0,0,0,0.16)');
    for (let yy = y + h - t - bh; yy < y + h - t; yy += 0.07) c.rect(x + t, yy, w - 2 * t, 0.012);
  }
  if (sill) {
    c.trim(0.94).rect(x - 0.1, y - sill, w + 0.2, sill);
    c.dif('rgba(0,0,0,0.3)').rect(x - 0.1, y - sill - 0.08, w + 0.2, 0.08);
  }
}
// the bay's wall, speckled and with a faint dirt gradient from the cornice
function base(c, r, v = 0.9) {
  c.wall(v).rect(0, 0, c.W, c.H).speckle(r, 140);
  c.shadeV(0, c.W, 0, c.H, 0.07, 0);
  return c;
}
const flower = (c, x, y, s = 1) => { // a red tulip on two leaves
  c.fix('#4f7a46'); c.leaf(x, y, 0.2 * s, 0.07 * s, 2.2); c.leaf(x, y, 0.2 * s, 0.07 * s, 0.9); c.ln([[x, y], [x, y + 0.2 * s]], 0.02 * s);
  c.fix('#b3363c').ell(x, y + 0.26 * s, 0.07 * s, 0.1 * s); c.fix('#d9a441').ell(x, y + 0.3 * s, 0.025 * s, 0.03 * s);
};

// ---------------------------------------------------------------------------------------------------- lilien (Moskovits)
function lilien(A, r) {
  const mk = (kind, wM = BAY) => { const c = A.cell(`lilien.${kind}`, wM, STOREY); base(c, r); return c; };
  const vine = (c, x) => { c.trim(0.95).vine(x, 0.2, x, 3.8, 0.1, 6, 0.04, 0.2); c.trim(0.95).rosette(x, 3.5, 0.11, 6); };
  let c = mk('reg');
  vine(c, 0.18); win(c, 1.15, 1.0, 1.25, 2.05, { cas: 0.17, rcas: 0.2, cols: 2, trans: 0.22, blind: 0.35 });
  c.trim(0.95); for (let i = 0; i < 4; i++) c.ell(1.15 + 0.1 + i * 0.35, 0.78, 0.17, 0.12); c.end();
  c = mk('reg2');
  vine(c, 0.18); win(c, 1.15, 0.95, 1.25, 2.1, { head: 'flat', cas: 0.17, rcas: 0.2, cols: 2, trans: 0.25, blind: 0 });
  c.trim(0.95).ell(1.78, 3.35, 0.4, 0.17); c.dif('rgba(0,0,0,0.25)').ln([[1.5, 3.35], [2.05, 3.35]], 0.02);
  c.trim(0.95); for (let i = 0; i < 4; i++) c.ell(1.25 + i * 0.35, 0.75, 0.17, 0.12); c.end();
  c = mk('nobile');
  vine(c, 0.18); win(c, 1.05, 0.3, 1.45, 2.65, { head: 'seg', cas: 0.17, cols: 2, trans: 0.2, sill: 0 });
  c.trim(0.96).face(1.78, 3.3, 0.22); c.garland(1.2, 2.4, 3.15, 0.1, 5); c.end();
  c = mk('top');
  vine(c, 0.18); win(c, 1.2, 0.8, 1.2, 1.8, { head: 'arch', cas: 0.17, cols: 2, trans: 0.3, sill: 0.08 });
  c.trim(0.96).ell(1.8, 3.2, 0.35, 0.28); c.dif('rgba(0,0,0,0.3)').ell(1.8, 3.2, 0.2, 0.15); c.end();
  c = mk('pier', 1.2);
  c.trim(0.95).vine(0.6, 0.2, 0.6, 3.7, 0.18, 7, 0.05, 0.25); c.trim(0.97).face(0.6, 3.3, 0.2); c.rect(0, 0, 0.1, 4).rect(1.1, 0, 0.1, 4); c.end();
}

// ---------------------------------------------------------------------------------------------------- stern (folk Secession)
function stern(A, r) {
  const mk = (kind, wM = BAY) => { const c = A.cell(`stern.${kind}`, wM, STOREY); base(c, r); return c; };
  const casing = (c, x, y, w, h) => { // a soft rounded band with a dotted green edge
    c.trim(0.95).rr(x - 0.28, y - 0.22, w + 0.56, h + 0.5, 0.3);
    c.wall(0.9).rr(x - 0.12, y - 0.07, w + 0.24, h + 0.2, 0.15);
    c.fix('#5e8a58').ln([[x - 0.24, y - 0.16], [x - 0.24, y + h + 0.2]], 0.016);
    c.fix('#5e8a58').ln([[x + w + 0.24, y - 0.16], [x + w + 0.24, y + h + 0.2]], 0.016);
    for (let yy = y - 0.1; yy < y + h + 0.2; yy += 0.16) { c.fix('#5e8a58').ell(x - 0.24, yy, 0.025, 0.025).ell(x + w + 0.24, yy, 0.025, 0.025); }
  };
  const green = '#3f7a4a';
  let c = mk('reg');
  casing(c, 1.2, 0.95, 1.2, 1.85); win(c, 1.2, 0.95, 1.2, 1.85, { cas: 0, frame: green, cols: 2, trans: 0.28, blind: 0.2, sill: 0.08 });
  flower(c, 1.8, 3.1, 1.1); flower(c, 0.5, 0.5, 0.9); flower(c, 3.1, 0.5, 0.9); c.end();
  c = mk('reg2');
  casing(c, 0.45, 1.0, 2.7, 1.8);
  win(c, 0.55, 1.0, 1.0, 1.8, { cas: 0, frame: green, cols: 2, trans: 0.28, blind: 0, sill: 0.08 }); win(c, 2.05, 1.0, 1.0, 1.8, { cas: 0, frame: green, cols: 2, trans: 0.28, blind: 0.55, sill: 0.08 });
  c.fix('#4f7a46').vine(1.8, 1.0, 1.8, 3.0, 0.07, 6, 0.03, 0.14); flower(c, 1.8, 3.1, 0.9); c.end();
  c = mk('nobile');
  casing(c, 1.0, 0.7, 1.6, 2.4); win(c, 1.0, 0.7, 1.6, 2.4, { cas: 0, frame: green, cols: 2, trans: 0.26, blind: 0, sill: 0.1 });
  c.trim(0.95).ell(1.8, 3.62, 0.5, 0.18); flower(c, 1.8, 3.4, 0.8); c.end();
  c = mk('top');
  c.trim(0.95).rect(0, 3.45, c.W, 0.55); c.fix('#8a5a3a').rect(0, 3.38, c.W, 0.07);
  for (let i = 0; i < 6; i++) { flower(c, 0.3 + i * 0.6, 3.6, 0.55); }
  casing(c, 1.3, 0.85, 1.0, 1.6); win(c, 1.3, 0.85, 1.0, 1.6, { cas: 0, frame: green, cols: 2, trans: 0.3, blind: 0.4, sill: 0.08 }); c.end();
  c = mk('pier', 1.2);
  c.fix('#4f7a46').vine(0.6, 0.3, 0.6, 3.6, 0.14, 6, 0.03, 0.16); flower(c, 0.6, 3.5, 0.8);
  c.trim(0.95).rect(0, 0, 0.07, 4).rect(1.13, 0, 0.07, 4); c.end();
}

// ---------------------------------------------------------------------------------------------------- apollo (white Secession)
function apollo(A, r) {
  const mk = (kind, wM = BAY) => { const c = A.cell(`apollo.${kind}`, wM, STOREY); base(c, r); return c; };
  const stripes = (c) => { c.wall(0.8).rect(0.1, 0, 0.07, 4).rect(0.22, 0, 0.07, 4).rect(c.W - 0.17, 0, 0.07, 4).rect(c.W - 0.29, 0, 0.07, 4); };
  const bal = (c, x, w, y) => { // a stone balustrade under a window
    c.trim(0.95).rect(x - 0.05, y, w + 0.1, 0.07).rect(x - 0.05, y + 0.62, w + 0.1, 0.09);
    for (let k = 0; k < Math.round(w / 0.17); k++) c.ell(x + 0.1 + k * 0.17, y + 0.35, 0.05, 0.27);
  };
  let c = mk('reg');
  stripes(c); win(c, 1.2, 0.95, 1.2, 2.0, { head: 'seg', cas: 0.18, cols: 2, trans: 0.22, blind: 0.3 });
  c.trim(0.96).garland(1.2, 2.4, 3.35, 0.14, 7); c.end();
  c = mk('reg2');
  stripes(c); win(c, 1.2, 0.95, 1.2, 2.0, { head: 'flat', cas: 0.18, cols: 2, trans: 0.22, blind: 0 });
  c.trim(0.96).rect(1.0, 3.1, 1.6, 0.14).poly([[1.0, 3.24], [2.6, 3.24], [1.8, 3.62]]); c.dif('rgba(0,0,0,0.2)').ln([[1.0, 3.1], [2.6, 3.1]], 0.02); c.end();
  c = mk('nobile');
  stripes(c); win(c, 1.1, 0.75, 1.4, 2.4, { head: 'arch', cas: 0.2, cols: 2, trans: 0.3, sill: 0 }); bal(c, 0.95, 1.7, 0.1);
  c.trim(0.97).poly([[1.65, 3.62], [1.95, 3.62], [2.05, 3.95], [1.55, 3.95]]); c.end();
  c = mk('top');
  stripes(c); win(c, 1.3, 0.9, 1.0, 1.5, { head: 'arch', cas: 0.15, cols: 2, trans: 0.3, sill: 0.08 });
  c.trim(0.96).ell(1.8, 2.95, 0.3, 0.3); c.fix('#262c33').ell(1.8, 2.95, 0.17, 0.17); c.end();
  c = mk('pier', 1.2);
  c.trim(0.94).rect(0.15, 0, 0.9, 4); for (let k = 0; k < 5; k++) c.dif('rgba(0,0,0,0.14)').rect(0.28 + k * 0.17, 0.1, 0.03, 3.6);
  c.trim(0.97).rect(0.05, 3.5, 1.1, 0.3); c.end();
}

// ---------------------------------------------------------------------------------------------------- baroque (rusticated, hoods)
function baroque(A, r) {
  const mk = (kind, wM = BAY) => { const c = A.cell(`baroque.${kind}`, wM, STOREY); base(c, r); return c; };
  const rust = (c) => { c.dif('rgba(0,0,0,0.13)'); for (let y = 0.2; y < 4; y += 0.45) c.rect(0, y, c.W, 0.035); c.dif('rgba(255,255,255,0.12)'); for (let y = 0.235; y < 4; y += 0.45) c.rect(0, y, c.W, 0.02); };
  let c = mk('reg');
  win(c, 1.2, 0.95, 1.2, 2.0, { head: 'flat', cas: 0.2, cols: 2, trans: 0.2, blind: 0.25 });
  c.trim(0.95).rect(1.0, 3.05, 1.6, 0.13).poly([[1.0, 3.18], [2.6, 3.18], [1.8, 3.62]]); c.dif('rgba(0,0,0,0.22)').ln([[1.0, 3.05], [2.6, 3.05]], 0.02);
  c.trim(0.95).rect(0.95, 0.5, 0.1, 0.5).rect(2.55, 0.5, 0.1, 0.5); c.end();
  c = mk('reg2');
  win(c, 1.2, 0.95, 1.2, 2.0, { head: 'flat', cas: 0.2, cols: 2, trans: 0.2, blind: 0 });
  c.trim(0.95).opening(1.0, 3.05, 1.6, 0.5, 'seg', 0).rect(1.0, 3.0, 1.6, 0.1); c.wall(0.9).opening(1.2, 3.1, 1.2, 0.3, 'seg', 0);
  c.trim(0.95).rect(0.95, 0.5, 0.1, 0.5).rect(2.55, 0.5, 0.1, 0.5); c.end();
  c = mk('nobile'); rust(c);
  win(c, 1.1, 0.7, 1.4, 2.4, { head: 'flat', cas: 0.22, cols: 2, trans: 0.2, sill: 0 });
  c.trim(0.95).rect(0.95, 0.05, 1.7, 0.1).rect(0.95, 0.55, 1.7, 0.08); for (let k = 0; k < 9; k++) c.ell(1.05 + k * 0.18, 0.35, 0.05, 0.2);
  c.trim(0.96).poly([[0.9, 3.2], [2.7, 3.2], [1.8, 3.8]]); c.fix('#262c33').opening(1.5, 3.25, 0.6, 0.3, 'arch', 0); c.end();
  c = mk('top');
  win(c, 1.3, 0.9, 1.0, 1.5, { head: 'flat', cas: 0.18, cols: 2, trans: 0.25, blind: 0.3, sill: 0.08 });
  c.trim(0.96).rect(0, 3.3, c.W, 0.12); for (let k = 0; k < 18; k++) c.rect(0.08 + k * 0.2, 3.1, 0.1, 0.2); c.end();
  c = mk('pier', 1.2); rust(c); c.trim(0.93).rect(0, 0, 1.2, 0.05); c.end();
}

// ---------------------------------------------------------------------------------------------------- wagner / plain / modern / civic
function wagner(A, r) {
  const mk = (kind, wM = BAY) => { const c = A.cell(`wagner.${kind}`, wM, STOREY); base(c, r); return c; };
  const frameStrip = (c) => { c.trim(0.93).rect(0.35, 0, 0.1, 4).rect(c.W - 0.45, 0, 0.1, 4); };
  let c = mk('reg');
  frameStrip(c); win(c, 1.2, 1.15, 1.2, 1.95, { cas: 0.12, cols: 2, trans: 0.25, blind: 0.4, sill: 0 });
  c.fix('#222428').rect(1.1, 0.95, 1.4, 0.07).rect(1.1, 0.95, 0.05, 0.3).rect(2.35, 0.95, 0.05, 0.3); for (let k = 0; k < 7; k++) c.rect(1.18 + k * 0.17, 0.97, 0.025, 0.28);
  c.trim(0.95).ell(1.8, 0.6, 0.26, 0.26); c.dif('rgba(0,0,0,0.25)').ell(1.8, 0.6, 0.2, 0.2); c.trim(0.95).rosette(1.8, 0.6, 0.15, 8); c.end();
  c = mk('reg2');
  frameStrip(c); win(c, 1.2, 1.0, 1.2, 2.1, { cas: 0.12, cols: 2, trans: 0.25, blind: 0, sill: 0.1 });
  c.trim(0.95).rect(1.0, 3.35, 1.6, 0.1); c.end();
  c = mk('nobile');
  frameStrip(c); win(c, 1.15, 0.65, 1.3, 2.55, { head: 'cut', cas: 0.14, cols: 2, trans: 0.22, sill: 0 });
  c.fix('#222428').rect(1.05, 0.55, 1.5, 0.06); for (let k = 0; k < 8; k++) c.rect(1.1 + k * 0.17, 0.57, 0.025, 0.4); c.rect(1.05, 0.95, 1.5, 0.04); c.end();
  c = mk('top');
  frameStrip(c); win(c, 1.25, 0.9, 1.1, 1.3, { cas: 0.1, cols: 3, sill: 0.08 }); c.trim(0.95).rect(0.6, 2.6, 2.4, 0.55); c.fix('#262c33').ell(1.8, 2.88, 0.18, 0.18); c.end();
  c = mk('pier', 1.2); c.trim(0.93).rect(0.5, 0, 0.2, 4); c.end();
}
function plain(A, r) {
  const mk = (kind, wM = BAY) => { const c = A.cell(`plain.${kind}`, wM, STOREY); base(c, r); return c; };
  let c = mk('reg'); win(c, 1.2, 1.05, 1.2, 1.9, { cas: 0.13, cols: 2, trans: 0.2, blind: 0.2 }); c.trim(0.95).rect(1.0, 3.0, 1.6, 0.1); c.end();
  c = mk('reg2'); win(c, 1.2, 1.05, 1.2, 1.9, { head: 'seg', cas: 0.13, cols: 2, trans: 0.2, blind: 0 }); c.end();
  c = mk('nobile'); win(c, 1.15, 0.8, 1.3, 2.25, { cas: 0.15, cols: 2, trans: 0.2, sill: 0.12 }); c.trim(0.95).rect(0.95, 3.1, 1.7, 0.14).rect(1.0, 3.24, 1.6, 0.08); c.end();
  c = mk('top'); win(c, 1.25, 0.95, 1.1, 1.6, { cas: 0.12, cols: 2, trans: 0.25, blind: 0.35 }); c.end();
  c = mk('pier', 1.2); c.trim(0.93).rect(0.45, 0, 0.3, 4); c.end();
}
function modern(A, r) {
  const mk = (kind, wM = BAY) => { const c = A.cell(`modern.${kind}`, wM, STOREY); base(c, r, 0.88); return c; };
  let c = mk('reg');
  c.trim(0.9).rect(0, 0.7, c.W, 0.12).rect(0, 2.75, c.W, 0.1);
  win(c, 0.25, 0.9, 1.4, 1.75, { cas: 0, cols: 2, frame: '#c9ccd0', sill: 0, trans: 0.2 }); win(c, 1.95, 0.9, 1.4, 1.75, { cas: 0, cols: 2, frame: '#c9ccd0', sill: 0, trans: 0.2, blind: 0.3 }); c.end();
  c = mk('reg2'); c.trim(0.9).rect(0, 0.7, c.W, 0.12).rect(0, 2.75, c.W, 0.1);
  win(c, 0.25, 0.9, 3.1, 1.75, { cas: 0, cols: 4, frame: '#c9ccd0', sill: 0, trans: 0.2 }); c.end();
  c = mk('nobile'); c.trim(0.9).rect(0, 0.7, c.W, 0.12).rect(0, 2.75, c.W, 0.1); win(c, 0.25, 0.9, 1.4, 1.75, { cas: 0, cols: 2, frame: '#c9ccd0', sill: 0 }); win(c, 1.95, 0.9, 1.4, 1.75, { cas: 0, cols: 2, frame: '#c9ccd0', sill: 0 }); c.end();
  c = mk('top'); win(c, 0.35, 1.0, 1.3, 1.5, { cas: 0, cols: 2, frame: '#c9ccd0', sill: 0 }); win(c, 1.95, 1.0, 1.3, 1.5, { cas: 0, cols: 2, frame: '#c9ccd0', sill: 0 }); c.end();
  c = mk('pier', 1.2); c.trim(0.9).rect(0, 0.7, 1.2, 0.12).rect(0, 2.75, 1.2, 0.1); c.end();
}
function civic(A, r) {
  const mk = (kind, wM = BAY) => { const c = A.cell(`civic.${kind}`, wM, STOREY); base(c, r); return c; };
  const pil = (c) => { c.trim(0.94).rect(0, 0, 0.3, 4).rect(c.W - 0.3, 0, 0.3, 4); c.dif('rgba(0,0,0,0.18)').rect(0.3, 0, 0.04, 4).rect(c.W - 0.34, 0, 0.04, 4); };
  let c = mk('reg');
  pil(c); c.wall(0.84).opening(0.55, 0.45, 2.5, 2.9, 'arch', 0); win(c, 0.85, 0.7, 1.9, 2.2, { head: 'arch', cas: 0, cols: 3, trans: 0.35, sill: 0 }); c.end();
  c = mk('reg2'); pil(c); win(c, 1.0, 0.9, 1.6, 2.2, { head: 'flat', cas: 0.15, cols: 3, trans: 0.25, sill: 0.1 }); c.end();
  c = mk('nobile'); pil(c); c.wall(0.84).opening(0.55, 0.35, 2.5, 3.2, 'arch', 0); win(c, 0.85, 0.6, 1.9, 2.5, { head: 'arch', cas: 0, cols: 3, trans: 0.3, sill: 0 }); c.trim(0.97).rect(1.65, 3.65, 0.3, 0.3); c.end();
  c = mk('top'); pil(c); win(c, 1.2, 1.0, 1.2, 1.5, { head: 'arch', cas: 0.12, cols: 2, trans: 0.3, sill: 0.08 }); c.end();
  c = mk('pier', 1.2); c.trim(0.94).rect(0.1, 0, 1.0, 4); for (let k = 0; k < 5; k++) c.dif('rgba(0,0,0,0.14)').rect(0.22 + k * 0.2, 0.1, 0.03, 3.7); c.end();
}

// ---------------------------------------------------------------------------------------------------- ground floors
const WOODS = { A: '#5b2a24', B: '#2e4a3a', C: '#3a2a22', D: '#26324a' };
function shops(A, r) {
  const fascia = (c, y0, y1) => { c.wall(0.9).rect(0, y0, c.W, y1 - y0); c.trim(0.95).rect(0.1, y0 + 0.1, c.W - 0.2, 0.06).rect(0.1, y1 - 0.16, c.W - 0.2, 0.06); c.fix('#2a2523').rr(0.35, y0 + 0.22, c.W - 0.7, y1 - y0 - 0.44, 0.06); c.fix('#c9b98f').rect(0.7, y0 + 0.4, c.W - 1.4, 0.05); };
  for (const [k, col] of Object.entries(WOODS)) { // timber Secession shopfronts
    const c = A.cell(`g.shop${k}`, BAY, GROUND); base(c, r);
    c.trim(0.93).rect(0, 0, c.W, 0.55); c.dif('rgba(0,0,0,0.2)').rect(0, 0.5, c.W, 0.06);
    // a pier each side
    c.wall(0.88).rect(0, 0.55, 0.28, 3.1).rect(c.W - 0.28, 0.55, 0.28, 3.1);
    fascia(c, 3.75, 4.7);
    c.fix(col).opening(0.28, 0.55, c.W - 0.56, 3.1, 'arch', 0); // frame mass
    c.fix('#1e2024').opening(0.42, 0.95, c.W - 0.84, 2.7, 'arch', 0);
    c.glass(0.46, 1.0, c.W - 0.92, 2.6, 'arch', 1, k.charCodeAt(0) % 3);
    c.fix(col).rect(0.42, 0.55, c.W - 0.84, 0.45);                                   // kick panel
    c.fix(col).rect(c.W / 2 - 0.035, 1.0, 0.07, 2.5);
    c.fix(col).openingLine(0.44, 1.0, c.W - 0.88, 2.65, 'arch', 0.06);
    c.fix(col).rect(0.46, 2.55, c.W - 0.92, 0.05);
    c.fix(col).ln([[0.9, 3.0], [1.4, 3.3], [c.W / 2, 3.25]], 0.035).ln([[c.W - 0.9, 3.0], [c.W - 1.4, 3.3], [c.W / 2, 3.25]], 0.035);
    c.end();
  }
  const GL = { A: ['#2d3236', '#2a2523'], B: ['#2d3236', '#e6e2d6'], C: ['#2d3236', '#5a2a2c'] };
  for (const [k, [fr, panel]] of Object.entries(GL)) {  // modern glazed shops
    const c = A.cell(`g.glass${k}`, BAY, GROUND); base(c, r);
    c.trim(0.93).rect(0, 0, c.W, 0.4); c.wall(0.88).rect(0, 0.4, 0.22, 3.4).rect(c.W - 0.22, 0.4, 0.22, 3.4);
    c.wall(0.9).rect(0, 3.8, c.W, 1.0); c.trim(0.95).rect(0, 4.6, c.W, 0.2);
    c.fix(panel).rect(0.3, 3.9, c.W - 0.6, 0.6); c.fix(panel === '#e6e2d6' ? '#7a7468' : '#d8cfb8').rect(0.7, 4.12, c.W - 1.4, 0.06).rect(0.7, 4.25, c.W - 2.0, 0.05);
    c.fix(fr).rect(0.22, 0.4, c.W - 0.44, 3.4); c.glass(0.3, 0.5, c.W - 0.6, 3.2, 'flat', 1, k.charCodeAt(0) % 3);
    c.fix(fr).rect(c.W / 2 - 0.03, 0.5, 0.06, 3.2).rect(0.3, 2.9, c.W - 0.6, 0.05).rect(0.3, 0.5, c.W - 0.6, 0.06);
    c.end();
  }
  { // stone arch with a keystone (baroque / civic ground floor)
    const c = A.cell('g.arch', BAY, GROUND); base(c, r);
    c.dif('rgba(0,0,0,0.13)'); for (let y = 0.3; y < 4.8; y += 0.5) c.rect(0, y, c.W, 0.04);
    c.trim(0.94).opening(0.35, 0.55, c.W - 0.7, 3.3, 'arch', 0.2); c.fix('#262c33').opening(0.35, 0.55, c.W - 0.7, 3.3, 'arch', 0);
    c.glass(0.42, 0.62, c.W - 0.84, 3.15, 'arch', 1, 1); c.fix('#2b2b2e').rect(c.W / 2 - 0.03, 0.62, 0.06, 2.4).rect(0.42, 2.2, c.W - 0.84, 0.05);
    c.trim(0.97).poly([[1.5, 4.05], [2.1, 4.05], [2.2, 4.55], [1.4, 4.55]]); c.fix('#2b2b2e').rect(0.42, 0.62, c.W - 0.84, 0.5);
    c.end();
  }
  { // a round-arched gateway to a courtyard, green timber door
    const c = A.cell('g.gate', BAY, GROUND); base(c, r);
    c.trim(0.94).opening(0.55, 0.2, c.W - 1.1, 3.5, 'arch', 0.25); c.fix('#1c1f21').opening(0.55, 0.2, c.W - 1.1, 3.5, 'arch', 0);
    c.fix('#2f5a45').opening(0.7, 0.2, c.W - 1.4, 2.7, 'arch', 0); c.dif('rgba(0,0,0,0.3)'); c.rect(c.W / 2 - 0.02, 0.2, 0.04, 2.7).ln([[0.7, 1.5], [c.W - 0.7, 1.5]], 0.02);
    c.fix('#d9c37a'); for (let i = 0; i < 6; i++) c.ell(1.0 + i * 0.32, 1.1, 0.03, 0.03);
    c.trim(0.97).ell(c.W / 2, 4.45, 0.2, 0.17); c.trim(0.95).rect(0.2, 0, 0.12, 0.6).rect(c.W - 0.32, 0, 0.12, 0.6);
    c.end();
  }
  { // a stair entrance: double doors with a fanlight
    const c = A.cell('g.entry', BAY, GROUND); base(c, r);
    c.trim(0.94).rect(0.55, 0.0, c.W - 1.1, 3.9).wall(0.88).rect(0.7, 0.15, c.W - 1.4, 3.6);
    c.fix('#3b2a22').rect(0.85, 0.15, c.W - 1.7, 2.7); c.fix('#262c33').opening(0.85, 2.9, c.W - 1.7, 0.7, 'seg', 0); c.glass(0.9, 2.95, c.W - 1.8, 0.6, 'seg', 1, 0);
    c.fix('#2a1d17').rect(c.W / 2 - 0.02, 0.15, 0.04, 2.7).rect(1.0, 0.4, 0.65, 1.0).rect(c.W - 1.65, 0.4, 0.65, 1.0).rect(1.0, 1.7, 0.65, 0.9).rect(c.W - 1.65, 1.7, 0.65, 0.9);
    c.trim(0.96).rect(0.4, 4.0, c.W - 0.8, 0.1).ell(c.W / 2, 4.45, 0.3, 0.22); c.end();
  }
  { // a rusticated ground pier
    const c = A.cell('g.pier', 1.2, GROUND); base(c, r);
    c.dif('rgba(0,0,0,0.15)'); for (let y = 0.3; y < 4.8; y += 0.5) c.rect(0, y, 1.2, 0.04);
    c.trim(0.93).rect(0, 0, 1.2, 0.55); c.end();
  }
}

// ---------------------------------------------------------------------------------------------------- railings
function rails(A) {
  const iron = '#1b1c1e', lw = 0.022;
  const frame = (c) => { c.fix(iron).rect(0, 0.92, c.W, 0.05).rect(0, 0.08, c.W, 0.04); };
  let c = A.cell('rail.A', BAY, 1.0); frame(c);
  for (let i = 0; i <= 18; i++) c.fix(iron).rect(0.05 + i * 0.195, 0.1, 0.02, 0.85);
  for (let i = 0; i < 18; i++) c.fix(iron).ell(0.15 + i * 0.195, 0.52, 0.09, 0.2, 0.0).dif('rgba(0,0,0,0)');
  c.end();
  c = A.cell('rail.B', BAY, 1.0); frame(c); // Secession whiplash
  for (let i = 0; i < 9; i++) { const x = 0.2 + i * 0.4; c.fix(iron).ln([[x, 0.1], [x + 0.05, 0.35], [x + 0.22, 0.6], [x + 0.1, 0.8], [x - 0.04, 0.7], [x + 0.06, 0.55]], 0.026); c.ell(x - 0.04, 0.7, 0.04, 0.04); }
  c.end();
  c = A.cell('rail.C', BAY, 1.0); frame(c);
  for (let i = 0; i <= 14; i++) c.fix(iron).rect(0.08 + i * 0.25, 0.1, 0.018, 0.85);
  for (let i = 0; i < 14; i++) c.ln([[0.1 + i * 0.25, 0.9], [0.24 + i * 0.25, 0.6], [0.37 + i * 0.25, 0.9]], 0.018);
  c.end();
  c = A.cell('rail.D', BAY, 1.0); c.fix(iron).rect(0, 0.92, c.W, 0.06).rect(0, 0.05, c.W, 0.05); // a balustrade in stone is geometry; this one is plain bars
  for (let i = 0; i <= 24; i++) c.rect(0.04 + i * 0.145, 0.1, 0.016, 0.85);
  c.end();
}

export function buildAtlas(r) {
  const A = new Atlas(4096, 2048);
  lilien(A, r); stern(A, r); apollo(A, r); baroque(A, r); wagner(A, r); plain(A, r); modern(A, r); civic(A, r);
  shops(A, r); rails(A); heroCells(A, r);
  return { A, textures: A.textures(), uv: (n) => A.uv(n) };
}
