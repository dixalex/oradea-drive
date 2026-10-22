// OWNER: oradea. The Mobiversal house (Strada Thurzó Sándor 40, Oradea): the geometry. Not a site module; ../mobiversal.js builds the
// materials, the yard and the colliders around it.
// A flat-roofed office of the 2019–2020 phases, as the Google Street View panoramas of April 2023 and May 2024 and the owner's photos show it:
//   – a dark-grey ground floor (3 m of cladding, four narrow high windows, a glazed shop door, the dark panel with the yellow «Goldie»
//     script), over it white render;
//   – the low block (X 0–9.75, first floor, top 9.06 m) and the tall block (X 9.75–20.1, two upper floors, 11.6 m);
//   – on the first floor a yellow band with dark-framed windows, the mobiversal mark and name, and a recessed yellow niche; on the tall block a
//     second window band with a lowered roller shutter and a yellow wing; thin black copings, black downpipes on the south wall.
// Faces seen in the panoramas: the front (west) and most of the south wall. Guesses: the north, back (east) and bay walls (windows and
// their counts), the ground-floor slits there, the roof fittings.
//   buildBuilding(B) -> { openings }   B = { wall, det, lit, sign } builders (MB) with the local frame's transform already set
import { face, rect, quad, skin, hole, box as sbox } from '../../../cherkasy/slabkit.js';
import { L, D1, D2, XB, XS, H_G, H_LOW, H_TALL } from './plan.js';
import { SIGN, uvOf } from './kit.js';

export const C = {
  white: '#fcfbf7', grey: '#706f6e', grey2: '#7f7e7e', pier: '#929190', dark: '#49484a', frame: '#2b2d31', glass: '#8093a2',
  yellow: '#ffcc2c', yellowIn: '#f2bb1f', coping: '#3a3d42', slab: '#3d4045', roofM: '#64676b', pipe: '#2a2c30', metal: '#a2a6aa',
};
const BASE = -0.3;
const FL = { y0: 5.2, y1: 6.6 }, F2 = { y0: 8.74, y1: 10.36 }; // the window bands of the first and the second floor

export function buildBuilding(B) {
  const { wall, det, lit, sign } = B, B3 = { det, lit, glass: det };
  let openings = 0;
  const pending = []; // [face, opening] built after the walls, so every cut is known
  const win = (f, X0, X1, y0, y1, o = {}) => {
    const s0 = o.rel ? X0 : X0 - f.s0, s1 = o.rel ? X1 : X1 - f.s0;
    f.cuts.push({ s0, s1, y0, y1 }); openings++;
    pending.push([f, { s0, s1, y0, y1, dep: 0.2, rev: C.white, frame: C.frame, glass: C.glass, pitch: 0.85, sill: o.sill === false ? null : '#7b7e82', ...o.q }, o]);
  };
  const mk = (a, b, nx, nz, s0 = 0) => Object.assign(face(a, b, nx, nz), { s0 });
  // a coloured patch the skin leaves out (a cut) – `at` = absolute X (front) or the face's own s
  const patch = (f, X0, X1, y0, y1, col, rel) => { const s0 = rel ? X0 : X0 - f.s0, s1 = rel ? X1 : X1 - f.s0; f.cuts.push({ s0, s1, y0, y1 }); wall.setColor(col); rect(wall, f, s0, s1, y0, y1, 0); };
  // an overlay strip (yellow) a hair in front of the wall
  const strip = (f, X0, X1, y0, y1, col, rel) => { const s0 = rel ? X0 : X0 - f.s0, s1 = rel ? X1 : X1 - f.s0; wall.setColor(col); rect(wall, f, s0, s1, y0, y1, 0.012); };
  const skins = (f, top, bands = [[BASE, H_G, C.grey], [H_G, top, C.white]]) => { for (const [a, b, c] of bands) skin(wall, f, a, Math.min(b, top), c); };
  const shutter = (f, X0, X1, y0, y1, rel, col = '#3a3d42') => { const s0 = rel ? X0 : X0 - f.s0, s1 = rel ? X1 : X1 - f.s0; det.setColor(col); sbox(det, f, s0 - 0.04, s1 + 0.04, y0, y1, -0.02, 0.07, 'ftlru'); };

  // ================================================================ the front, low block (X 0 – XS)
  const f1 = mk([0, 0], [XS, 0], 0, 1, 0);
  for (const [a, b] of [[1.5, 2.04], [3.61, 4.23], [5.79, 6.34], [7.93, 8.52]]) win(f1, a, b, 0.5, 3.0, { q: { dep: 0.12, lit: true, pitch: 2 }, sill: false });
  win(f1, 3.03, 4.7, FL.y0, FL.y1, { q: { lit: true } });
  win(f1, 5.72, 9.09, FL.y0, FL.y1, { q: { lit: true, pitch: 0.84 } });
  patch(f1, 0, 2.93, FL.y0, FL.y1, C.white);          // the white wall left of the yellow band
  patch(f1, 8.9, XS, 0, H_G, C.grey2);                // the lighter grey bay of the ground floor
  skins(f1, H_LOW - 0.12);
  strip(f1, 2.93, 3.03, FL.y0, FL.y1, C.yellow); strip(f1, 4.7, 5.72, FL.y0, FL.y1, C.yellow); strip(f1, 9.09, XS, FL.y0, FL.y1, C.yellow);
  shutter(f1, 3.03, 4.7, 6.12, 6.66); shutter(f1, 5.72, 9.09, 6.12, 6.66);

  // ================================================================ the front, tall block (X XS – L)
  const f2 = mk([XS, 0], [L, 0], 0, 1, XS);
  win(f2, 13.0, 14.5, 0.0, 2.95, { q: { dep: 0.16, lit: true, pitch: 0.75, door: true }, sill: false });
  win(f2, 15.1, 18.45, F2.y0, F2.y1, { q: { pitch: 0.82 } });
  f2.cuts.push({ s0: 14.93 - XS, s1: 18.68 - XS, y0: FL.y0, y1: FL.y1 }); // the niche
  patch(f2, XS, 13.0, 0, H_G, C.grey2);
  patch(f2, 14.5, 15.0, BASE, H_G, C.pier);
  patch(f2, 15.0, 19.15, BASE, H_G, C.dark);          // the Goldie panel
  skins(f2, H_TALL - 0.12);
  strip(f2, XS, 14.93, FL.y0, FL.y1, C.yellow); strip(f2, 18.68, L, FL.y0, FL.y1, C.yellow); strip(f2, 18.5, 19.65, F2.y0, F2.y1, C.yellow);
  shutter(f2, 15.1, 18.45, 9.22, 10.42, false, '#4b4f55');
  // the recessed niche: yellow back and ends, the white soffit, the dark slab; a dark edge runs under the band to the corner
  {
    const x0 = 14.93, x1 = 18.68, dp = 0.6, y0 = FL.y0, y1 = FL.y1;
    wall.setColor(C.yellowIn); quad(wall, [x0, y0, -dp], [x1, y0, -dp], [x1, y1, -dp], [x0, y1, -dp], [0, 0, 1]);
    wall.setColor(C.yellow);
    quad(wall, [x0, y0, 0], [x0, y0, -dp], [x0, y1, -dp], [x0, y1, 0], [1, 0, 0]);
    quad(wall, [x1, y0, 0], [x1, y0, -dp], [x1, y1, -dp], [x1, y1, 0], [-1, 0, 0]);
    wall.setColor(C.white); quad(wall, [x0, y1, 0], [x1, y1, 0], [x1, y1, -dp], [x0, y1, -dp], [0, -1, 0]);
    det.setColor(C.slab); quad(det, [x0, y0, 0], [x1, y0, 0], [x1, y0, -dp], [x0, y0, -dp], [0, 1, 0]);
    det.box(14.93, 5.04, -0.03, 20.03, y0, 0.07, 63 & ~32);
  }

  // ================================================================ the south wall (X = L, Z 0 → -D2)
  const fs = mk([L, 0], [L, -D2], 1, 0, 0);
  win(fs, 11.35, 12.2, FL.y0, FL.y1, { rel: true, q: { pitch: 2, lit: true } });
  for (const [a, b] of [[4.0, 4.55], [8.0, 8.55]]) win(fs, a, b, 1.65, 3.0, { rel: true, q: { dep: 0.12, pitch: 2 }, sill: false });
  skins(fs, H_TALL - 0.12);
  strip(fs, 0, 0.9, FL.y0, FL.y1, C.yellow, true); strip(fs, 0, 0.9, F2.y0, F2.y1, C.yellow, true);

  // ================================================================ the north wall of the low block, the tall block's north wall above it
  const fn = mk([0, -D1], [0, 0], -1, 0, 0);
  win(fn, 7.05, 7.95, FL.y0, FL.y1, { rel: true, q: { pitch: 2 } });
  win(fn, 3.0, 3.55, 1.65, 3.0, { rel: true, q: { dep: 0.12, pitch: 2 }, sill: false });
  skins(fn, H_LOW - 0.12);
  const fnt = mk([XS, -D1], [XS, 0], -1, 0, 0);
  win(fnt, 5.25, 6.15, 9.3, 10.4, { rel: true, q: { pitch: 2 } });
  skin(wall, fnt, H_LOW - 0.12, H_TALL - 0.12, C.white);
  // (the part of the north step wall below the low roof is inside the low block)

  // ================================================================ the back walls (guesses: the same windows as the front, fewer)
  const fb1 = mk([0, -D1], [XS, -D1], 0, -1, 0);
  for (const [a, b] of [[1.2, 2.2], [4.2, 5.2], [7.2, 8.2]]) win(fb1, a, b, FL.y0, FL.y1, { rel: true, q: { pitch: 2 } });
  for (const [a, b] of [[1.5, 2.05], [4.6, 5.15], [7.7, 8.25]]) win(fb1, a, b, 1.65, 3.0, { rel: true, q: { dep: 0.12, pitch: 2 }, sill: false });
  skins(fb1, H_LOW - 0.12);
  const fb2 = mk([XS, -D1], [XB, -D1], 0, -1, 0);
  for (const [a, b] of [[1.2, 2.2], [3.8, 4.8]]) { win(fb2, a, b, FL.y0, FL.y1, { rel: true, q: { pitch: 2 } }); win(fb2, a, b, F2.y0, F2.y1, { rel: true, q: { pitch: 2 } }); }
  skins(fb2, H_TALL - 0.12);
  const fb3 = mk([XB, -D2], [L, -D2], 0, -1, 0);
  for (const [a, b] of [[1.0, 2.0], [2.9, 3.9]]) { win(fb3, a, b, FL.y0, FL.y1, { rel: true, q: { pitch: 2 } }); win(fb3, a, b, F2.y0, F2.y1, { rel: true, q: { pitch: 2 } }); }
  skins(fb3, H_TALL - 0.12);
  const fj = mk([XB, -D1], [XB, -D2], -1, 0, 0);
  skins(fj, H_TALL - 0.12);

  // ---- the openings (reveals, glass, frames) once all cuts are in
  for (const [f, q] of pending) hole(B3, f, q);

  // ================================================================ roofs and copings
  const top = (y, ring, col) => { det.setColor(col); det.fill(ring, [], y, true); };
  top(H_LOW - 0.13, [[0, 0], [XS, 0], [XS, -D1], [0, -D1]], C.roofM);
  top(H_TALL - 0.13, [[XS, 0], [L, 0], [L, -D2], [XB, -D2], [XB, -D1], [XS, -D1]], C.roofM);
  const rim = (axis, c, a0, a1, yTop, out) => { // a thin black coping along a wall line; out = +1 / -1 the side the wall faces
    const w0 = out > 0 ? -0.26 : -0.05, w1 = out > 0 ? 0.05 : 0.26;
    det.setColor(C.coping);
    if (axis === 'x') det.box(a0 - 0.05, yTop - 0.13, c + w0, a1 + 0.05, yTop, c + w1, 63);
    else det.box(c + w0, yTop - 0.13, a0 - 0.05, c + w1, yTop, a1 + 0.05, 63);
  };
  // axis 'x': a wall along X at Z = c (outward +Z = out 1); axis 'z': a wall along Z at X = c (outward +X = out 1)
  rim('x', 0, 0, XS, H_LOW, 1); rim('x', -D1, 0, XS, H_LOW, -1); rim('z', 0, -D1, 0, H_LOW, -1);
  rim('x', 0, XS, L, H_TALL, 1); rim('z', L, -D2, 0, H_TALL, 1); rim('x', -D2, XB, L, H_TALL, -1);
  rim('z', XB, -D2, -D1, H_TALL, -1); rim('x', -D1, XS, XB, H_TALL, -1); rim('z', XS, -D1, 0, H_TALL, -1);
  // roof fittings on the low roof (guess from the aerial): two condenser units and a hatch
  det.setColor('#d8dbdd'); det.box(1.2, H_LOW - 0.13, -5.0, 2.5, H_LOW + 0.5, -3.8, 63); det.box(3.1, H_LOW - 0.13, -5.0, 4.4, H_LOW + 0.5, -3.8, 63);
  det.setColor('#8e9296'); det.box(6.0, H_LOW - 0.13, -9.2, 7.4, H_LOW + 0.45, -7.8, 63);

  // ================================================================ downpipes, lamps, small fittings on the front
  det.setColor(C.pipe);
  for (const z of [-0.32, -D2 + 0.28]) det.tube([L + 0.06, 0.05, z], [L + 0.06, H_TALL - 0.3, z], 0.05, 6);
  det.setColor('#c0262a'); det.box(10.2, 4.0, 0, 10.45, 4.25, 0.14, 63 & ~32);   // the alarm siren
  det.setColor('#8d9195'); det.box(9.4, 3.6, 0, 9.65, 3.8, 0.1, 63 & ~32); det.box(0.5, 3.5, 0, 0.75, 3.7, 0.3, 63 & ~32); // a box and the camera
  lit.setColor('#fff0cc'); lit.box(13.55, 3.3, 0, 13.95, 3.42, 0.14, 63 & ~32);   // the lamp over the shop door
  det.setColor('#202225'); det.box(13.35, 2.95, 0.0, 14.65, 3.05, 0.06, 63 & ~32); // the door's lintel shadow bar

  // ================================================================ the lettering (alpha-tested quads on the atlas)
  const q = (X0, X1, y0, y1, z, r) => quad(sign, [X0, y0, z], [X1, y0, z], [X1, y1, z], [X0, y1, z], [0, 0, 1], uvOf(r));
  sign.setColor('#ffffff');
  q(10.4, 13.65, 5.68, 5.68 + 3.25 / (SIGN.mob.w / SIGN.mob.h), 0.026, SIGN.mob);
  q(15.8, 17.85, 1.74, 1.74 + 2.05 / (SIGN.goldie.w / SIGN.goldie.h), 0.02, SIGN.goldie);

  return { openings };
}
