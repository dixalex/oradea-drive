// OWNER: oradea. The church «Adormirea Maicii Domnului» (Csodásérmű Boldogasszony, Cătălina, OSM way 1540255477): the Lazarists' church of the 1930s on its
// plateau, with the priests' house beside it. The front is a compact group of three towers – a tall middle one with a narrow louvred slot and a
// slender dark spire, and two lower ones with red tile pyramids – grey-blue stucco, a portico of two columns over the door with a statue of Mary
// above it, a dark gabled roof over a nave of arched windows, a polygonal sanctuary and a low sacristy on the side. Sources: the 1930s postcard
// and the miserend.hu photograph of the front, the Esri aerial of 2025 (a dark roof, the plan) and the OSM ring; the end that carries the front
// is read off the photographs (the tower group, not the ring), the sacristy's and the side wing's details are guesses.
//   buildAdormirea({ B, S, g, ring }) -> { footprints, stats, top }
import { frameOf } from './church.js';
import {
  begin, end, edgeFrame, at, nrm, slab, poly, win, door, oculus, frontFrame, gable, pyramid, fanRoof, gableSolid, shaft, column, cross, ball, GOLD, ringArea,
} from './kit.js';

export const ADORMIREA_ID = 1540255477;
const WALL = '#8f9ba6', TRIM = '#eeece6', PLINTH = '#6f7780', ROOF = '#4a403d', RED = '#9c4330', DARK = '#3f4a56', GLASS = '#34465a';
const UF = -20.4, VR = -13.6, VL = 6.7, EAVE = 8.8, VC = (VR + VL) / 2, RISE = 5.0;

export function buildAdormirea({ B, S, g, ring }) {
  const st = { windows: 0, towers: 3, solids: 0 };
  const F = frameOf(ring, { faceTo: [-1420, -1370] }), toW = F.toMap;
  // ---- the plan: the nave, the narrower choir with a shallow polygonal end, the sacristy on the left (kit frame: u front to altar)
  const P = [[UF, VR], [-4.0, VR], [-4.0, -12.6], [17.0, -12.6], [19.0, -8.4], [20.4, -3.7], [19.0, 2.1], [17.0, 5.2], [15.2, 5.2], [15.2, 13.8], [8.2, 13.8], [8.2, 5.2], [-4.0, 5.2], [-4.0, VL], [UF, VL]];
  const R = ringArea(P) > 0 ? P : P.slice().reverse();
  let hi = -1e9, lo = 1e9;
  for (const [u, v] of R) { const [x, z] = toW(u, v), h = g(x, z); if (Number.isFinite(h)) { hi = Math.max(hi, h); lo = Math.min(lo, h); } }
  if (!Number.isFinite(hi)) { hi = 3; lo = 3; }
  const Fy = hi + 0.15, gLo = lo - 0.5, Y = (h) => Fy + h, eaveY = Y(EAVE), ridgeY = eaveY + RISE, sacY = Y(5.0);
  begin(B, F.cx, F.cz, F.yaw);
  const E = R.map((a, i) => edgeFrame(a, R[(i + 1) % R.length]));

  // ---- walls
  for (const f of E) {
    if (f.n[0] < -0.95 && f.a[0] < UF + 0.1 && f.b[0] < UF + 0.1) continue;                 // the front
    const lump = f.a[0] > 8 && f.b[0] > 8 && f.a[0] < 15.3 && f.b[0] < 15.3 && (f.a[1] > 5.1 || f.b[1] > 5.1) && Math.max(f.a[1], f.b[1]) > 5.3;
    const eave = lump ? sacY : eaveY;
    B.wall.setColor(WALL); slab(B.wall, f, 0, f.L, gLo, eave, 0, 0, 'f');
    B.wall.setColor(PLINTH); slab(B.wall, f, -0.05, f.L + 0.05, gLo, Y(0.9), 0, 0.12, 'ft');
    B.wall.setColor(TRIM); slab(B.wall, f, -0.25, f.L + 0.25, eave - 0.4, eave + 0.05, 0, 0.35, 'ftb');
    if (f.L < 2.4 || Math.abs(f.n[0]) > 0.9 && f.L < 5) continue;
    const n = Math.max(1, Math.round(f.L / (lump ? 4.5 : 4.1))), bay = f.L / n;
    for (let k = 0; k < n; k++) {
      win(B, f, (k + 0.5) * bay, Y(lump ? 1.4 : 2.0), lump ? 0.9 : 1.2, lump ? 2.2 : 4.4, { kind: 'round', trim: TRIM, glass: GLASS, sur: 0.15, d: 0.05 }); st.windows++;
      if (n > 1 && !lump) { B.wall.setColor(TRIM); slab(B.wall, f, k * bay - 0.2, k * bay + 0.2, Y(0.9), eave - 0.4, 0, 0.09, 'flr'); }
    }
  }
  // ---- the front wall, the gable behind the towers
  const Ff = frontFrame(UF, VR, VL, -1);
  B.wall.setColor(WALL); Ff.rect(B.wall, VR, VL, gLo, eaveY, 0);
  poly(B.wall, [Ff.pt(VR, eaveY), Ff.pt(VL, eaveY), Ff.pt(VC, ridgeY)], [-1, 0, 0]);
  B.wall.setColor(PLINTH); Ff.slab(B.wall, VR - 0.05, VL + 0.05, gLo, Y(0.9), 0, 0.12, 'ft');
  B.wall.setColor(TRIM); Ff.slab(B.wall, VR - 0.25, VL + 0.25, eaveY - 0.4, eaveY + 0.05, 0, 0.35, 'ftb');
  for (const s of [-1, 1]) { Ff.win(B, VC + s * 8.1, Y(2.0), 1.2, 4.4, { kind: 'round', trim: TRIM, glass: GLASS, sur: 0.15, d: 0.05 }); st.windows++; }
  Ff.oculus(B, VC + 5.6, Y(11.8), 0.55, { trim: TRIM, glass: GLASS, ring: 0.16, d: 0.05 }); Ff.oculus(B, VC - 5.6, Y(11.8), 0.55, { trim: TRIM, glass: GLASS, ring: 0.16, d: 0.05 });

  // ---- the roofs: one gable over nave and choir, the sacristy's, the shallow apse
  gable(B.tile, { a0: UF, a1: 17.0, b0: VR, b1: VL, yE: eaveY, yR: ridgeY, ridge: 'u', ov: 0.5, rake: 0.3, col: ROOF, gcol: WALL, G: B.wall });
  gable(B.tile, { a0: 5.2, a1: 13.9, b0: 8.2, b1: 15.2, yE: sacY, yR: sacY + 2.4, ridge: 'v', ov: 0.4, rake: 0.2, col: ROOF, gcol: WALL, G: B.wall });
  const apex = [16.9, ridgeY - 1.7, -3.7], ap = [[17.0, -12.6], [19.0, -8.4], [20.4, -3.7], [19.0, 2.1], [17.0, 5.2]];
  fanRoof(B.tile, apex, ap.map(([u, v]) => { const dx = u - apex[0], dz = v - apex[2], d = Math.hypot(dx, dz) || 1; return [u + dx / d * 0.35, eaveY - 0.18, v + dz / d * 0.35]; }), ROOF);
  cross(B.cap, 16.9, ridgeY + 0.05, VC + 0.0, 1.9, GOLD, 0); cross(B.cap, 18.5, apex[1] + 0.05, -3.7, 1.2, GOLD);

  // ---- the front: the middle tower with the portico, the two side towers
  const cw = 5.6, sw = 3.6, u0 = UF - 0.4;
  const cT = { u0, u1: u0 + cw, v0: VC - cw / 2, v1: VC + cw / 2 };
  const yC = Y(23.0);
  shaft(B, { ...cT, y0: gLo, y1: yC, wall: WALL, trim: TRIM, pil: 0.5, bands: [Y(8.4)], wins: [], bel: { y: Y(13.5), h: 6.2, w: 0.8, kind: 'flat', glass: '#5a3220' }, cornice: 0.6 });
  B.sheet.setColor(DARK); pyramid(B.sheet, { x0: cT.u0 + 0.35, x1: cT.u1 - 0.35, z0: cT.v0 + 0.35, z1: cT.v1 - 0.35, yE: yC, yR: yC + 9.5, ov: 0.35, col: DARK });
  const cx = (cT.u0 + cT.u1) / 2;
  ball(B.cap, cx, yC + 9.6, VC, 0.2); cross(B.cap, cx, yC + 9.65, VC, 2.0, GOLD, 0);
  const Ft = frontFrame(u0, cT.v0, cT.v1, -1);
  Ft.door(B, VC, Y(0.3), 2.0, 3.5, { kind: 'round', col: '#4a2f20', trim: TRIM, sur: 0.25, d: 0.1 });
  for (const s of [-1, 1]) column(B, Ft, VC + s * 1.7, 0.27, Y(0.2), Y(4.6), 2.3, { col: TRIM, capH: 0.4 });
  B.wall.setColor(TRIM); Ft.slab(B.wall, VC - 2.35, VC + 2.35, Y(4.6), Y(5.05), 0, 2.7, 'ftlr');
  B.wall.setColor(PLINTH); Ft.slab(B.wall, VC - 2.7, VC + 2.7, gLo, Y(0.2), 0, 3.2, 'ft'); Ft.slab(B.wall, VC - 2.9, VC + 2.9, gLo, Y(0.1), 3.2, 3.7, 'ft');
  // the statue of Mary on a bracket over the portico, and the oval window near the top of the tower
  B.wall.setColor(TRIM); Ft.slab(B.wall, VC - 0.35, VC + 0.35, Y(5.7), Y(5.95), 0, 0.5, 'ftlr');
  B.wall.cyl(...[(Ft.pt(VC, Y(5.95), 0.25))[0], Y(5.95), (Ft.pt(VC, Y(5.95), 0.25))[2]], 0.28, 0.2, 1.5, 8, true);
  ball(B.wall, Ft.pt(VC, Y(7.6), 0.25)[0], Y(7.6), Ft.pt(VC, Y(7.6), 0.25)[2], 0.2, TRIM);
  Ft.oculus(B, VC, Y(19.8), 0.6, { trim: TRIM, glass: GLASS, ring: 0.18, d: 0.07, n: 12 });
  for (const s of [-1, 1]) {
    const vm = VC + s * (cw / 2 + sw / 2), t = { u0, u1: u0 + sw, v0: vm - sw / 2, v1: vm + sw / 2 }, yT = Y(14.6);
    shaft(B, { ...t, y0: gLo, y1: yT, wall: WALL, trim: TRIM, pil: 0.45, bands: [], wins: [], cornice: 0.5, openings: false });
    const Fs = frontFrame(u0, t.v0, t.v1, -1);
    Fs.win(B, vm, Y(2.4), 0.95, 5.2, { kind: 'round', trim: TRIM, glass: GLASS, sur: 0.14, d: 0.06 }); st.windows++;
    Fs.oculus(B, vm, Y(10.4), 0.45, { trim: TRIM, glass: GLASS, ring: 0.14, d: 0.06, n: 10 });
    B.tile.setColor(RED); pyramid(B.tile, { x0: t.u0, x1: t.u1, z0: t.v0, z1: t.v1, yE: yT, yR: yT + 5.0, ov: 0.55, col: RED });
    const tx = (t.u0 + t.u1) / 2;
    ball(B.cap, tx, yT + 5.1, vm, 0.2); cross(B.cap, tx, yT + 5.15, vm, 1.5, GOLD, 0);
    S.prism([[t.u0, t.v0], [t.u1, t.v0], [t.u1, t.v1], [t.u0, t.v1]].map(([a, b]) => toW(a, b)).flat(), gLo, yT, 0, 0, 'tower'); st.solids++;
    S.cyl(...toW(tx, vm), yT, yT + 5.1, 1.2, 0.2, 'tower'); st.solids++;
  }
  end(B);

  // ---- colliders and the footprint
  const wr = R.map(([u, v]) => toW(u, v));
  S.prism(wr.flat(), gLo, eaveY, 0, 0, 'wall'); st.solids++;
  gableSolid(S, F, toW, { u0: UF, u1: 17.0, vt: VR, vb: VL, eaveY, rise: RISE }); st.solids += 2;
  S.prism([[cT.u0, cT.v0], [cT.u1, cT.v0], [cT.u1, cT.v1], [cT.u0, cT.v1]].map(([a, b]) => toW(a, b)).flat(), gLo, yC, 0, 0, 'tower'); st.solids++;
  S.cyl(...toW(cx, VC), yC, yC + 9.6, 1.6, 0.2, 'tower'); st.solids++;
  void at; void nrm; void oculus; void door;
  return { footprints: [{ poly: wr, h: yC + 12 - gLo, kind: 'church', name: 'Biserica «Adormirea Maicii Domnului»', id: ADORMIREA_ID }], stats: st, top: yC + 12 };
}
