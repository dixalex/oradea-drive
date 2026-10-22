// OWNER: oradea. Teatrul de Stat / Teatrul Regina Maria, Piața Regele Ferdinand I nr. 4–6 (OSM way 7211172; Fellner & Helmer,
// built July 1899 – October 1900, neoclassical), as it stands today. Built after the Wikimedia Commons photos of 2009–2023
// (front elevation, the portico, the tympanum, the night view) and the OSM outline:
//   a pale-peach two-storey front block (33.4 m) with a hexastyle colossal portico of cream-white Corinthian columns
//   (coupled at the ends: 1.9 m, then 4.7 m between the two middle ones) under a lettered entablature
//   («TEATRUL DE STAT · ÁLLAMI SZÍNHÁZ») and a pediment with a five-figure relief group and acroteria; behind the columns
//   three arched first-floor windows on pierced balconies over three doors; the wings carry an arched window under a small
//   pediment each, ornamented end piers and a heavy cornice with an attic; eight steps between two statues of muses on
//   pedestals; a taller auditorium and stage block behind under a grey zinc mansard roof.
// All heights below are metres over the portico floor (the threshold, `yT` in the world): the shared builders are shifted
// by it while this module draws, so a wall at "0..13" stands on the floor.
//   buildTheatre(ctx) -> { footprint, T (the front frame), yT, oFoot (the steps' foot), Y(h), clear(x, z), groundLow }
//   ctx: { B (shared MB builders), S (collision), g (heightAt), r (rng), wash (night floodlight points), stone (SG, white
//     stone figures) }
import * as THREE from 'three';
import { M4 } from '../../../../kit/mesh.js';
import { OVERHANG } from '../../../collision.js';
import { SG } from '../../../cherkasy/sculpt.js';
import { at, quad, box, skin, hole, UP } from '../../../cherkasy/slabkit.js';
import { frame, poly, archOpening, column, cornice, dentils, rake, robed, seated, lying, place, mansard } from './kit.js';

export const THEATRE_ID = 7211172;
const F0 = [10.1, -249.3], F1 = [43.5, -248.5];
const RING = [[10.1, -249.3], [43.5, -248.5], [48.8, -304.5], [12.5, -309]]; // front west, front east, rear east, rear west
const COL = { wall: '#ebd2bc', wallD: '#dfc3a6', white: '#f3eee2', stone: '#cdc3b0', base: '#b4a995', brown: '#4a2c20', door: '#563322', roof: '#a9afb4', dark: '#2a2c2e', gold: '#cdb26a' };

export const theatreFrame = frame(F0, F1, [0, 1]);

export function buildTheatre(ctx) {
  const { B, S, g, r, wash, stone } = ctx;
  const T = theatreFrame, W = T.W, CX = W / 2, toMap = T.toMap, yawN = -T.ang;
  // ------------------------------------------------------------------------------------------ levels
  const yFoot = Math.max(g(...toMap(CX, 8.3)), g(...toMap(CX - 8, 8.3)), g(...toMap(CX + 8, 8.3)));
  const yT = yFoot + 1.4 + 0.2;                              // the portico floor: eight risers of 0.175 down to the plaza
  const Y = (h) => yT + h;
  const ground = [...RING, ...RING.map(([x, z]) => toMap(...T.toLocal(x, z)))].map(([x, z]) => g(x, z));
  const gB = Math.min(...ground, yFoot) - 0.7 - yT;          // the foundations' bottom, relative
  const shift = (on) => { for (const b of Object.values(B)) b.setXf(on ? M4(0, yT, 0) : null); };
  shift(true);
  const f = T.face(); // the front wall, o = 0
  const ATT = 13.2, CORN = 11.2;
  const win = (q) => { f.cuts.push({ s0: q.s0, s1: q.s1, y0: q.y0, y1: q.y1 }); hole(B, f, q); };

  // ------------------------------------------------------------------------------------------ the front wall
  const WINC = [4.55, W - 4.55], PORTC = [CX - 4.7, CX, CX + 4.7];
  for (const c of WINC) win({ s0: c - 0.85, s1: c + 0.85, y0: 0.9, y1: 3.0, dep: 0.25, frame: COL.white, glass: '#46525a', lit: r() < 0.5, sill: COL.stone, pitch: 0.85, rev: COL.white });
  for (const c of PORTC) win({ s0: c - 1.15, s1: c + 1.15, y0: 0, y1: 3.55, dep: 0.35, frame: COL.door, glass: '#4a2d20', door: true, tr: 2.75, pitch: 1.15, rev: COL.stone });
  const WIN2 = { dep: 0.35, W: B.wall, wcol: COL.wall, frame: COL.brown, glass: '#53626d', rev: COL.white };
  const aedicule = (fc, c, y) => { // a small pediment on consoles over a window
    B.det.setColor(COL.white);
    poly(B.det, fc, [[c - 1.5, y], [c + 1.5, y], [c, y + 1.0]], 0.14);
    box(B.det, fc, c - 1.5, c + 1.5, y - 0.25, y, 0, 0.18, 'ftu');
    for (const sx of [-1, 1]) box(B.det, fc, c + sx * 1.2 - 0.14, c + sx * 1.2 + 0.14, y - 2.2, y - 0.25, 0, 0.12, 'flrt');
    B.det.setColor(COL.stone); box(B.det, fc, c - 0.18, c + 0.18, y - 0.55, y - 0.22, 0, 0.2, 'ftlr');
  };
  for (const c of WINC) { archOpening(B, f, { ...WIN2, s0: c - 0.95, s1: c + 0.95, y0: 4.4, yS: 6.5, rise: 1.0, lit: true, tr: 5.5, mull: [c], sill: COL.white }); aedicule(f, c, 8.0); }
  for (const c of PORTC) archOpening(B, f, { ...WIN2, s0: c - 1.3, s1: c + 1.3, y0: 5.0, yS: 8.1, rise: 1.3, lit: true, tr: 6.6, mull: [c], dep: 0.45 });
  // balconies in front of the three windows: a slab on brackets and a pierced stone balustrade
  for (const c of PORTC) {
    B.det.setColor(COL.white);
    box(B.det, f, c - 1.75, c + 1.75, 4.05, 4.3, 0, 0.62, 'ftulr');
    for (const sx of [-1, 1]) box(B.det, f, c + sx * 1.4 - 0.12, c + sx * 1.4 + 0.12, 3.5, 4.05, 0, 0.45, 'fl');
    box(B.det, f, c - 1.75, c + 1.75, 4.3, 4.45, 0.46, 0.62, 'ftb');
    box(B.det, f, c - 1.75, c + 1.75, 5.25, 5.42, 0.46, 0.62, 'ft');
    for (let k = 0; k <= 12; k++) { const s = c - 1.7 + k * (3.4 / 12); box(B.det, f, s - 0.07, s + 0.07, 4.45, 5.25, 0.5, 0.58, 'f'); }
    for (const sx of [-1, 1]) box(B.det, f, c + sx * 1.7 - 0.1, c + sx * 1.7 + 0.1, 4.3, 5.42, 0.44, 0.64, 'fltr');
  }
  // the wall, the rusticated base, a string course under the first-floor windows
  skin(B.wall, f, 0, ATT, COL.wall, [1, 1]);
  B.stone.setColor(COL.base); box(B.stone, f, -0.35, W + 0.35, gB, 0.02, -0.05, 0.3, 'ftlr');
  B.det.setColor(COL.stone); box(B.det, f, -0.2, W + 0.2, 3.72, 3.95, 0, 0.1, 'ftu');
  // wing ends: an ornamented pier each
  for (const [c, sg] of [[0.62, 1], [W - 0.62, -1]]) {
    B.det.setColor(COL.white); box(B.det, f, c - 0.3, c + 0.3, 5.2, 10.3, 0, 0.14, 'ftlr');
    B.det.setColor(COL.gold); box(B.det, f, c - 0.16, c + 0.16, 8.1, 9.7, 0.14, 0.2, 'f');
    B.det.setColor(COL.white);
    box(B.det, f, c - 0.42, c + 0.42, 7.2, 7.9, 0.14, 0.26, 'ftu');
    box(B.det, f, c - 0.2, c + 0.2, 5.0, 5.3, 0.14, 0.24, 'ftu');
    void sg;
  }
  // the cornice over the wings (the portico's entablature takes the middle), the attic above it
  const pw = [CX - 10.35, CX + 10.35];
  for (const [a, b] of [[-0.3, pw[0]], [pw[1], W + 0.3]]) { cornice(B.det, f, a, b, CORN, 1.0, 0, 0.95, COL.white); dentils(B.det, f, a + 0.1, b - 0.1, CORN - 0.22, 0.22, 0.45, COL.wallD); }
  B.det.setColor(COL.white); box(B.det, f, -0.1, W + 0.1, ATT, ATT + 0.28, -0.05, 0.3, 'ftu');

  // ------------------------------------------------------------------------------------------ the portico
  const OP = 4.7, OC = 3.65, R = 0.78, CH = 10.1;     // entablature front, column axes, shaft radius, capital top
  B.stone.setColor(COL.stone); box(B.stone, f, CX - 11.0, CX + 11.0, gB, 0, 0, 4.95, 'ftlr');
  B.stone.setColor(COL.base); box(B.stone, f, CX - 11.15, CX + 11.15, gB, -0.18, 0, 5.1, 'flr');
  const cols = [-9.05, -7.15, -2.35, 2.35, 7.15, 9.05].map((d) => CX + d);
  for (const s of cols) { const [x, z] = toMap(s, OC); column(B.stone, x, z, 0, CH, R, COL.white, yawN); S.cyl(x, z, yT, Y(CH), R, R, 'column'); }
  // entablature: architrave, frieze (with the lettering), cornice with dentils; the soffit is the architrave's underside
  B.stone.setColor(COL.white);
  box(B.stone, f, pw[0], pw[1], CH, 10.9, 0, OP, 'ftulr');
  box(B.stone, f, pw[0], pw[1], 10.9, 11.9, 0, OP - 0.12, 'ftlr');
  cornice(B.stone, f, pw[0] - 0.35, pw[1] + 0.35, 11.9, 1.0, 0, OP + 0.85, COL.white);
  dentils(B.stone, f, pw[0] - 0.15, pw[1] + 0.15, 11.64, 0.26, OP, COL.wallD, 0.4);
  B.sign.setColor('#ffffff');
  quad(B.sign, ...[[CX - 6.2, 10.98], [CX + 6.2, 10.98], [CX + 6.2, 11.82], [CX - 6.2, 11.82]].map(([s, h]) => at(f, s, h, OP - 0.1)), f.N, [[0, 0], [1, 0], [1, 1], [0, 1]]);
  B.det.setColor(COL.gold);
  for (const s of [pw[0] + 1.3, pw[1] - 1.3]) box(B.det, f, s - 0.3, s + 0.3, 11.1, 11.7, OP - 0.12, OP - 0.04, 'f');
  // pediment: the tympanum, the raking cornices, the acroteria
  const apex = [CX, 16.8], pe = [pw[0] - 0.3, pw[1] + 0.3];
  B.stone.setColor(COL.wallD); poly(B.stone, f, [[pe[0] + 0.2, 12.9], [pe[1] - 0.2, 12.9], apex], 4.2);
  rake(B.stone, f, [pe[0], 12.9], [CX, apex[1]], 0.55, 3.9, OP + 0.85, COL.white);
  rake(B.stone, f, [CX, apex[1]], [pe[1], 12.9], 0.55, 3.9, OP + 0.85, COL.white);
  B.stone.setColor(COL.white);
  for (const s of [pe[0] + 0.1, pe[1] - 0.1]) box(B.stone, f, s - 0.4, s + 0.4, 12.9, 13.5, 3.9, 4.7, 'ftlr');
  box(B.stone, f, CX - 0.45, CX + 0.45, apex[1] + 0.3, apex[1] + 0.9, 4.0, 4.8, 'ftlr');
  {
    const [ax, az] = toMap(CX, 4.4);
    B.stone.lathe([[0.3, apex[1] + 0.9], [0.24, apex[1] + 1.2], [0.4, apex[1] + 1.55], [0.34, apex[1] + 1.9], [0.12, apex[1] + 2.05]], 10, ax, az);
    B.det.setColor(COL.dark); B.det.tube([ax, apex[1] + 2.0, az], [ax, apex[1] + 5.0, az], 0.035, 5);
  }
  B.det.setColor(COL.wallD); // the ceiling beams under the entablature
  for (const s of [CX - 6.0, CX - 2.35, CX + 2.35, CX + 6.0]) box(B.det, f, s - 0.18, s + 0.18, CH - 0.16, CH, 0.2, OP - 0.2, 'fulr');

  // ------------------------------------------------------------------------------------------ steps, cheek blocks, statues
  const nStep = 8, rise = 1.6 / 8, run = 0.38, oS0 = 4.95, sA = CX - 9.0, sB = CX + 9.0;
  const yS = (i) => -rise * (i + 1);
  let oPrev = oS0;
  for (let i = 0; i < nStep; i++) {
    const o1 = oS0 + run * (i + 1), yLow = i === nStep - 1 ? yS(i) - 0.3 : yS(i + 1);
    B.stone.setColor(i % 2 ? COL.stone : '#c5baa6');
    quad(B.stone, at(f, sA, yS(i), oPrev), at(f, sB, yS(i), oPrev), at(f, sB, yS(i), o1), at(f, sA, yS(i), o1), UP);
    B.stone.setColor(COL.base);
    quad(B.stone, at(f, sA, yS(i), o1), at(f, sB, yS(i), o1), at(f, sB, yLow, o1), at(f, sA, yLow, o1), f.N);
    oPrev = o1;
  }
  const oFoot = oPrev, mkMuse = () => robed(new SG(), { pose: 1 });
  for (const sgn of [-1, 1]) { // the flight's ends are the cheek blocks, which carry the two muses
    const s0 = sgn < 0 ? CX - 11.0 : CX + 9.0, s1 = sgn < 0 ? CX - 9.0 : CX + 11.0, sc = (s0 + s1) / 2;
    B.stone.setColor(COL.stone); box(B.stone, f, s0, s1, gB, 0.55, 4.95, oFoot + 0.4, 'ftlr');
    B.stone.setColor(COL.white); box(B.stone, f, s0 - 0.12, s1 + 0.12, 0.55, 0.85, 4.85, oFoot + 0.5, 'ftlru');
    const [x, z] = toMap(sc, oFoot - 1.0);
    place(stone, mkMuse(), x, Y(0.85), z, yawN + (sgn < 0 ? -0.15 : 0.15), 1.35);
    S.obox(...toMap(sc, (4.95 + oFoot + 0.4) / 2), (s1 - s0) / 2, (oFoot + 0.4 - 4.95) / 2, T.ang, yT + gB, Y(0.85), 'ledge');
    S.cyl(x, z, Y(0.85), Y(3.2), 0.4, 0.3, 'statue');
  }
  S.obox(...toMap(CX, 2.45), 11.0, 2.45, T.ang, yT + gB, yT, 'ledge');
  { // the flight as one sloped solid (its top plane runs from the foot up to the portico floor, along -N)
    const P = [[sA, oS0], [sB, oS0], [sB, oFoot], [sA, oFoot]].map(([s, o]) => toMap(s, o)).flat();
    const p0 = toMap(CX, oS0), p1 = toMap(CX, oFoot), yHi = yT, yLo = Y(yS(nStep - 1)), L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const gx = (p0[0] - p1[0]) / L, gz = (p0[1] - p1[1]) / L, k = (yHi - yLo) / L;   // rise per metre toward the building
    S.prism(P, yT + gB, yLo - (k * gx * p1[0] + k * gz * p1[1]), k * gx, k * gz, 'steps', 0);
  }
  // the relief group in the tympanum: a crowned standing figure, two seated ones, two reclining at the corners
  {
    const base = Y(12.95), oo = 4.55, at1 = (s) => toMap(s, oo);
    { const [x, z] = at1(CX); place(stone, robed(new SG(), { crown: true, pose: 1 }), x, base, z, yawN, 1.5); }
    for (const sgn of [-1, 1]) {
      { const [x, z] = at1(CX + sgn * 2.7); place(stone, seated(new SG()), x, base, z, yawN - sgn * 0.2, 1.25); }
      const [x, z] = at1(CX + sgn * 7.4);
      place(stone, lying(new SG()), x, base, z, sgn > 0 ? yawN + Math.PI : yawN, 0.95);
    }
    for (const s of [pe[0] + 0.1, pe[1] - 0.1]) { const [x, z] = toMap(s, 4.3); place(stone, seated(new SG()), x, Y(13.5), z, yawN, 1.05); }
  }

  // ------------------------------------------------------------------------------------------ the body behind
  const ptAlong = (p, q, d) => { const l = Math.hypot(q[0] - p[0], q[1] - p[1]); return [p[0] + ((q[0] - p[0]) * d) / l, p[1] + ((q[1] - p[1]) * d) / l]; };
  const [FW, FE, RE, RW] = RING, DF = 21;
  const SW = ptAlong(FW, RW, DF), SE = ptAlong(FE, RE, DF), RH = 14.2;
  const near = (a, p) => Math.hypot(a[0] - p[0], a[1] - p[1]) < 1;
  const sides = [
    { f: frame(SW, FW, [-1, 0]), front: true, top: ATT, cn: CORN },
    { f: frame(FE, SE, [1, 0]), front: true, top: ATT, cn: CORN },
    { f: frame(RW, SW, [-1, 0]), front: false, top: RH, cn: 13.2 },
    { f: frame(SE, RE, [1, 0]), front: false, top: RH, cn: 13.2 },
    { f: frame(RE, RW, [0, -1]), front: false, top: RH, cn: 13.2 },
  ];
  for (const { f: fr, front, top, cn } of sides) {
    const ff = fr.face(), L = fr.W, aFront = near([ff.ax, ff.az], FW) || near([ff.ax, ff.az], FE);
    const fromFront = (d) => (aFront ? d : L - d);
    if (front) {
      for (let k = 0; k < 4; k++) {
        const c = fromFront(3.4 + k * 4.35);
        archOpening(B, ff, { ...WIN2, s0: c - 0.95, s1: c + 0.95, y0: 4.4, yS: 6.5, rise: 1.0, lit: r() < 0.7, tr: 5.5, mull: [c], sill: COL.white });
        ff.cuts.push({ s0: c - 0.85, s1: c + 0.85, y0: 0.9, y1: 3.0 });
        hole(B, ff, { s0: c - 0.85, s1: c + 0.85, y0: 0.9, y1: 3.0, dep: 0.25, frame: COL.white, glass: '#46525a', lit: r() < 0.5, sill: COL.stone, pitch: 0.85, rev: COL.white });
        aedicule(ff, c, 8.0);
      }
    } else {
      const n = Math.max(2, Math.floor((L - 3) / 4.4)), pad = (L - n * 4.4) / 2;
      for (let k = 0; k < n; k++) {
        const c = pad + 2.2 + k * 4.4;
        for (const [y0, y1] of [[1.0, 3.2], [5.0, 8.4]]) {
          ff.cuts.push({ s0: c - 0.8, s1: c + 0.8, y0, y1 });
          hole(B, ff, { s0: c - 0.8, s1: c + 0.8, y0, y1, dep: 0.25, frame: COL.white, glass: '#46525a', lit: r() < 0.4, sill: COL.stone, pitch: 0.8, rev: COL.white });
        }
      }
    }
    skin(B.wall, ff, 0, top, COL.wall, [1, 1]);
    B.stone.setColor(COL.base); box(B.stone, ff, -0.05, L + 0.05, gB, 0.02, -0.05, 0.3, 'ft');
    cornice(B.det, ff, -0.3, L + 0.3, cn, 1.0, 0, 0.9, COL.white);
    B.det.setColor(COL.white); box(B.det, ff, -0.1, L + 0.1, top, top + 0.26, -0.05, 0.28, 'ftu');
  }
  // roofs: a mansard over the front block, a higher one over the stage block; a small cupola on the front block's top
  const ringF = [FW, FE, SE, SW], ringR = [SW, SE, RE, RW];
  mansard(B.roof, ringF, [[0.1, ATT + 0.3], [2.6, 17.0], [6.5, 19.2]], COL.roof);
  mansard(B.roof, ringR, [[0.1, RH + 0.3], [3.2, 18.4], [9.0, 21.4]], COL.roof);
  {
    const [cx, cz] = toMap(W - 9.5, -10.5), yb = 19.2;
    B.roof.setColor('#8d9397').lathe([[2.0, yb], [2.0, yb + 1.6], [1.7, yb + 1.8], [1.9, yb + 2.1], [1.3, yb + 3.0], [0.5, yb + 3.7], [0.1, yb + 3.9]], 8, cx, cz);
    B.det.setColor(COL.white); B.det.cyl(cx, yb + 0.1, cz, 2.05, 2.05, 0.25, 8, true);
  }
  // collision: the body and the stage block's roof deck
  S.prism(RING.flat(), yT + gB, Y(ATT + 0.3), 0, 0, 'wall', 0);
  S.prism(ringR.flat(), Y(ATT + 0.3) - 0.01, Y(RH + 0.3), 0, 0, 'wall', 0);
  S.obox(...toMap(CX, 2.5), 10.4, 2.5, T.ang, Y(CH), Y(12.9), 'awning', OVERHANG);

  // ------------------------------------------------------------------------------------------ night: floodlights on the portico
  for (const s of [CX - 7.5, CX, CX + 7.5]) { const [x, z] = toMap(s, oFoot + 1.4); wash.push([x, g(x, z) + 0.6, z]); }
  B.glow.setColor('#fff2d6');
  for (const s of [CX - 7.5, CX + 7.5]) { const [x, z] = toMap(s, oFoot + 1.4); B.glow.with(M4(x, g(x, z) - yT + 0.2, z, yawN), (b) => b.box(-0.18, 0, -0.1, 0.18, 0.2, 0.1, 63)); }

  shift(false);
  return {
    footprint: { poly: RING.map(([x, z]) => [x, z]), h: Y(21.4) - g(...toMap(CX, 20)), kind: 'public', name: 'Teatrul Regina Maria', id: THEATRE_ID },
    T, yT, oFoot, Y, groundLow: yT + gB,
    clear: (x, z) => { const [s, o] = T.toLocal(x, z); return s > -6 && s < W + 6 && o > -62 && o < 38; },
  };
}
void THREE;
