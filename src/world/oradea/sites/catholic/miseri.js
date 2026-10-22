// OWNER: oradea. The church of the Misericordians (Mizericordieni; hospital church «Îngerii păzitori», c. 1754, Strada Mihai Viteazul side, OSM node
// 8516264332) together with the hospital wings it stands in, which OSM draws as one generic two-storey ring (OSM way 41416354, replaced here).
// The church from the Commons photographs: a high ochre-yellow flat front with a round-headed door in a stone surround, a tall arched window
// in a scrolled frame, a heavy cornice, a volute gable with an oval window between two small square towers on the front corners whose slender
// pink-grey spires rise behind it, a slate-grey hipped nave roof, and a round chancel at the back under a low copper dome. The hospital: plain
// two-storey wings in pale plaster under red hipped roofs on the OSM outline (the west wing, the south wing and a lower annex east of the church);
// the church's position in that ring is read off the node and the ring's edges, the wings' façades are guesses (no photographs).
//   buildMiseri({ B, S, g }) -> { footprints, stats, top }
import {
  begin, end, edgeFrame, at, nrm, slab, poly, win, oval, frontFrame, lathe, PROFILES, cross, ball, GOLD, gable, gableSolid, shaft, PI,
} from './kit.js';

export const MISERI_NODE = 8516264332, HOSPITAL_ID = 41416354;
// frame: origin on the south front line of the ring's east block, u runs north (the long axis of the ring), v east
const O = [292.7, -803.84], YAW = -1.3652;
const U = [Math.cos(YAW), Math.sin(YAW)], V = [-U[1], U[0]];
const toW = (u, v) => [O[0] + U[0] * u + V[0] * v, O[1] + U[1] * u + V[1] * v];
const WALL = '#dcc58e', TRIM = '#eee6cf', STONE = '#b9b2a2', PLINTH = '#a39a88', SLATE = '#757a82', SPIRE = '#b9aca6', COPPER = '#9b6f66', GLASS = '#35465a';
const PLASTER = '#e6dcc2', RED = '#a8472f';

export function buildMiseri({ B, S, g }) {
  const st = { windows: 0, towers: 2, solids: 0 };
  // ---- the blocks: [u0, u1, v0, v1] of the three hospital wings and the church nave
  const WEST = [22.9, 57.6, -23.2, -8.7], SOUTH = [8.4, 22.9, -24.3, 2.0], ANNEX = [0.4, 31.8, 16.6, 27.6];
  const CH = { u0: 1.0, u1: 26.0, v0: 2.2, v1: 16.6 }, RC = 5.0, RCU = 26.0, RCV = (CH.v0 + CH.v1) / 2;
  let hi = -1e9, lo = 1e9;
  const probe = (u, v) => { const [x, z] = toW(u, v), h = g(x, z); if (Number.isFinite(h)) { hi = Math.max(hi, h); lo = Math.min(lo, h); } };
  for (const [a, b, c, d] of [WEST, SOUTH, ANNEX, [CH.u0, CH.u1 + RC, CH.v0, CH.v1]]) for (const [u, v] of [[a, c], [b, c], [b, d], [a, d], [(a + b) / 2, (c + d) / 2]]) probe(u, v);
  if (!Number.isFinite(hi)) { hi = 3; lo = 3; }
  const Fy = hi + 0.15, gLo = lo - 0.5, Y = (h) => Fy + h;
  const eaveH = Y(8.3), eaveA = Y(7.2), eaveC = Y(11.0);
  begin(B, O[0], O[1], YAW);

  // ---- the hospital blocks: walls with window rows (the faces that touch another block are left out), hipped red roofs
  const block = ([u0, u1, v0, v1], eave, skip, nSt) => {
    const R = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
    R.forEach((a, i) => {
      if (skip.includes(i)) return;
      const f = edgeFrame(a, R[(i + 1) % 4]);
      B.wall.setColor(PLASTER); slab(B.wall, f, 0, f.L, gLo, eave, 0, 0, 'f');
      B.wall.setColor(PLINTH); slab(B.wall, f, -0.04, f.L + 0.04, gLo, Y(0.9), 0, 0.1, 'ft');
      B.wall.setColor(TRIM); slab(B.wall, f, -0.25, f.L + 0.25, eave - 0.45, eave + 0.05, 0, 0.35, 'ftb');
      const n = Math.max(1, Math.round(f.L / 3.1)), bay = f.L / n;
      for (let k = 0; k < n; k++) for (let j = 0; j < nSt; j++) {
        win(B, f, (k + 0.5) * bay, Y(1.3 + j * 3.45), 1.1, 1.95, { kind: j === 0 ? 'seg' : 'flat', trim: TRIM, glass: GLASS, sur: 0.12, d: 0.05 }); st.windows++;
      }
    });
    S.prism(R.map(([u, v]) => toW(u, v)).flat(), gLo, eave, 0, 0, 'wall'); st.solids++;
  };
  block(WEST, eaveH, [3], 2); block(SOUTH, eaveH, [2], 2); block(ANNEX, eaveA, [0], 2);
  const roofR = (o) => gable(B.tile, { ov: 0.5, col: RED, ...o });
  roofR({ a0: 15.65, a1: WEST[1], b0: WEST[2], b1: WEST[3], yE: eaveH, yR: eaveH + 3.7, ridge: 'u', hip1: true });
  roofR({ a0: SOUTH[2], a1: 2.6, b0: SOUTH[0], b1: SOUTH[1], yE: eaveH, yR: eaveH + 3.7, ridge: 'v', hip0: true });
  roofR({ a0: ANNEX[0] + 0.5, a1: ANNEX[1], b0: ANNEX[2], b1: ANNEX[3], yE: eaveA, yR: eaveA + 3.2, ridge: 'u', hip0: true, hip1: true });
  gableSolid(S, { cx: O[0], cz: O[1], U, V }, toW, { u0: WEST[0], u1: WEST[1], vt: WEST[2], vb: WEST[3], eaveY: eaveH, rise: 3.7 }); st.solids += 2;
  gableSolid(S, { cx: O[0], cz: O[1], U, V }, toW, { u0: SOUTH[0], u1: SOUTH[1], vt: SOUTH[2], vb: SOUTH[3], eaveY: eaveH, rise: 3.7, across: true }); st.solids += 2;
  gableSolid(S, { cx: O[0], cz: O[1], U, V }, toW, { u0: ANNEX[0], u1: ANNEX[1], vt: ANNEX[2], vb: ANNEX[3], eaveY: eaveA, rise: 3.2 }); st.solids += 2;

  // ---- the church: walls, the front, the roof, the rotunda
  const nave = [[CH.u0, CH.v0], [CH.u1, CH.v0], [CH.u1, CH.v1], [CH.u0, CH.v1]];
  for (const [i, bays] of [[0, 4], [1, 0], [2, 4]]) {
    if (!bays) continue;
    const f = edgeFrame(nave[i], nave[(i + 1) % 4]);
    B.wall.setColor(WALL); slab(B.wall, f, 0, f.L, gLo, eaveC, 0, 0, 'f');
    B.wall.setColor(PLINTH); slab(B.wall, f, -0.04, f.L + 0.04, gLo, Y(1.0), 0, 0.12, 'ft');
    B.wall.setColor(TRIM); slab(B.wall, f, -0.3, f.L + 0.3, eaveC - 0.9, eaveC + 0.05, 0, 0.5, 'ftb');
    const n = bays, bay = f.L / n;
    for (let k = 0; k < n; k++) {
      win(B, f, (k + 0.5) * bay, Y(k === 0 ? 1.3 : 4.2), k === 0 ? 0.8 : 1.1, k === 0 ? 1.4 : 3.2, { kind: k === 0 ? 'flat' : 'round', trim: TRIM, glass: GLASS, sur: 0.14, d: 0.05 }); st.windows++;
      B.wall.setColor(TRIM); slab(B.wall, f, k * bay - 0.35, k * bay + 0.35, Y(1.0), eaveC - 0.9, 0, 0.1, 'flr');
    }
  }
  // the roof: slate, hipped at the back
  gable(B.sheet, { a0: CH.u0, a1: CH.u1 + 1.0, b0: CH.v0, b1: CH.v1, yE: eaveC, yR: eaveC + 4.4, ridge: 'u', hip0: true, hip1: true, ov: 0.5, col: SLATE });
  gableSolid(S, { cx: O[0], cz: O[1], U, V }, toW, { u0: CH.u0, u1: CH.u1, vt: CH.v0, vb: CH.v1, eaveY: eaveC, rise: 4.4 }); st.solids += 2;
  // the round chancel under a low copper dome
  B.wall.setColor(WALL); B.wall.cyl(RCU, gLo, RCV, RC, RC, Y(10.2) - gLo, 16, false);
  B.wall.setColor(TRIM); B.wall.cyl(RCU, Y(9.4), RCV, RC + 0.18, RC + 0.3, 0.7, 16, true);
  B.det.setColor(COPPER); lathe(B.det, PROFILES.dome, 16, RCU, RCV, Y(10.1), RC + 0.4, 3.9);
  B.wall.setColor(TRIM); B.wall.cyl(RCU, Y(13.9), RCV, 0.7, 0.55, 1.0, 8, true);
  ball(B.cap, RCU, Y(15.1), RCV, 0.3); cross(B.cap, RCU, Y(15.3), RCV, 1.6, GOLD, 0);
  // the front: the flat wall with the door and the window, the cornice, the corner pilasters
  const Fc = frontFrame(CH.u0, CH.v0, CH.v1, -1), vm = (CH.v0 + CH.v1) / 2, W = CH.v1 - CH.v0;
  B.wall.setColor(WALL); Fc.rect(B.wall, CH.v0, CH.v1, gLo, eaveC, 0);
  B.wall.setColor(PLINTH); Fc.slab(B.wall, CH.v0 - 0.05, CH.v1 + 0.05, gLo, Y(1.0), 0, 0.12, 'ft');
  B.wall.setColor('#e8e0c8'); for (const w of [CH.v0 + 0.5, CH.v1 - 0.5]) Fc.slab(B.wall, w - 0.5, w + 0.5, Y(1.0), eaveC - 0.9, 0, 0.14, 'flr');
  B.wall.setColor(TRIM); Fc.slab(B.wall, CH.v0 - 0.3, CH.v1 + 0.3, eaveC - 0.9, eaveC + 0.05, -0.1, 0.55, 'ftb');
  Fc.door(B, vm, Y(0.2), 1.9, 3.1, { kind: 'seg', col: '#7a5a34', trim: STONE, sur: 0.3, d: 0.08 });
  B.wall.setColor('#d2cbbb'); Fc.slab(B.wall, vm - 1.5, vm + 1.5, Y(3.45), Y(3.75), 0, 0.3, 'ftlr');
  Fc.win(B, vm, Y(4.4), 1.5, 3.3, { kind: 'round', trim: '#e3dac0', glass: GLASS, sur: 0.42, d: 0.08, bars: true }); st.windows += 2;
  B.wall.setColor('#e3dac0'); poly(B.wall, [Fc.pt(vm - 1.35, Y(8.9), 0.12), Fc.pt(vm + 1.35, Y(8.9), 0.12), Fc.pt(vm, Y(9.8), 0.1)], [-1, 0, 0]);
  // the volute gable between the towers
  const t0 = CH.v0 + 3.4, t1 = CH.v1 - 3.4, GY = eaveC;
  const gp = [[t0, 0], [t1, 0], [t1, 1.3], [t1 - 0.8, 2.2], [t1 - 2.0, 3.0], [vm + 0.8, 3.9], [vm, 4.1], [vm - 0.8, 3.9], [t0 + 2.0, 3.0], [t0 + 0.8, 2.2], [t0, 1.3]];
  B.wall.setColor(TRIM); poly(B.wall, gp.map(([w, h]) => Fc.pt(w, GY + h + 0.3, 0.06)), [-1, 0, 0]);
  B.wall.setColor(WALL); poly(B.wall, gp.map(([w, h]) => Fc.pt(vm + (w - vm) * 0.93, GY + (h > 0 ? h * 0.94 : 0.02) + 0.3, 0.1)), [-1, 0, 0]);
  Fc.oval(B, vm, GY + 1.7, 0.75, 0.5, { trim: TRIM, glass: GLASS, ring: 0.2, d: 0.12 }); st.windows++;
  // the two small towers on the front corners, the slender spires
  for (const [v0, v1] of [[CH.v0, CH.v0 + 3.2], [CH.v1 - 3.2, CH.v1]]) {
    const u0 = CH.u0, u1 = CH.u0 + 3.2;
    shaft(B, { u0, u1, v0, v1, y0: eaveC + 0.05, y1: Y(18.3), wall: WALL, trim: TRIM, pil: 0.3, bel: { y: Y(14.3), h: 2.3, w: 1.0, glass: '#2b241e' }, cornice: 0.7, bands: [] });
    const cx = (u0 + u1) / 2, cz = (v0 + v1) / 2;
    B.det.setColor(SPIRE); lathe(B.det, PROFILES.needle, 4, cx, cz, Y(18.3), 1.95, 11.4, PI / 4);
    ball(B.cap, cx, Y(29.7), cz, 0.2); cross(B.cap, cx, Y(29.8), cz, 1.5, GOLD, 0);
    S.prism([[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => toW(u, v)).flat(), eaveC, Y(18.3), 0, 0, 'tower'); st.solids++;
    S.cyl(...toW(cx, cz), Y(18.3), Y(29.5), 1.0, 0.2, 'tower'); st.solids++;
  }
  end(B);

  // ---- colliders and footprints
  S.prism(nave.map(([u, v]) => toW(u, v)).flat(), gLo, eaveC, 0, 0, 'wall'); st.solids++;
  S.cyl(...toW(RCU, RCV), gLo, Y(13.8), RC, RC - 0.4, 'wall'); st.solids++;
  const arc = [];
  for (let k = 0; k <= 8; k++) { const th = (-90 + k * 22.5) * PI / 180; arc.push([RCU + RC * Math.cos(th), RCV + RC * Math.sin(th)]); }
  const churchRing = [[CH.u0, CH.v0], [CH.u1, CH.v0], [CH.u1, RCV - RC], ...arc.slice(1, 8), [CH.u1, RCV + RC], [CH.u1, CH.v1], [CH.u0, CH.v1]];
  const rect = ([u0, u1, v0, v1]) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => toW(u, v));
  const footprints = [
    { poly: churchRing.map(([u, v]) => toW(u, v)), h: Y(29.8) - gLo, kind: 'church', name: 'Biserica Mizericordienilor «Îngerii păzitori»', id: MISERI_NODE },
    { poly: rect(WEST), h: eaveH + 3.7 - gLo, kind: 'public', name: 'Spitalul Mizericordienilor', id: HOSPITAL_ID },
    { poly: rect(SOUTH), h: eaveH + 3.7 - gLo, kind: 'public', name: 'Spitalul Mizericordienilor', id: HOSPITAL_ID },
    { poly: rect(ANNEX), h: eaveA + 3.2 - gLo, kind: 'public', name: 'Spitalul Mizericordienilor', id: HOSPITAL_ID },
  ];
  void oval; void at; void nrm;
  return { footprints, stats: st, top: Y(29.8) };
}
