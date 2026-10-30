// OWNER: oradea. Biserica Penticostală Filadelfia (Strada Ana Ipătescu 11, Oradea; services Sunday 10:00 and 18:00, Wednesday, Thursday), on the
// Overture footprint 3000011312 (OSM has no outline for it). Built after the Street View photograph on biserici.org (2016): a three-storey
// block of terracotta stucco under red clay tile, the street front a tall gable with a pair of arched windows over the entrance and a big
// pointed-arch window above a glazed door with a dark curved canopy, white window surrounds, a brown eave, a tower-like chimney stack at the
// corner. The footprint is an L: a long back wing under a hip roof along the street, the front block with its gable roof, a small
// two-storey tab beside it. The side and back walls are not in the photograph (guesses: windows repeat the front's rows).
//   buildFiladelfia({ B, S, g, ring }) -> { footprints, stats }
import { begin, end, frameOf, groundOf, edgeFrame, at, rect, slab, poly, nrm, win, gable, pyramid, gableSolid } from './kit.js';
import { bays, canopy } from './parts.js';

export const FILADELFIA_ID = 3000011312;
const C = { wall: '#d9955e', wall2: '#e3b27c', trim: '#f2e6cc', plinth: '#8c7a68', fascia: '#6e3b2b', roof: '#b0482d', glass: '#33485a', dark: '#2f3a40' };

export function buildFiladelfia({ B, S, g, ring }) {
  const F = frameOf(ring, { yaw: 43.3 }), toW = F.toMap, st = { windows: 0, towers: 0 };
  const R = F.ring, { Fy, gLo } = groundOf(ring, g), Y = (h) => Fy + h;
  const EAVE = 9.5, TAB = 6.5, FRISE = 2.85, WRISE = 2.9;
  begin(B, F.cx, F.cz, F.yaw);
  const WL = B.wall, TL = B.tile;
  const edges = R.map((a, i) => edgeFrame(a, R[(i + 1) % R.length]));
  const inTab = (f) => f.a[0] > -6.6 && f.b[0] > -6.6 && f.a[0] < -0.5 && f.b[0] < -0.5 && f.a[1] > -4.9 && f.a[1] < -1.0 && f.b[1] > -4.9 && f.b[1] < -1.0;
  let front = null;
  for (const f of edges) if (f.n[0] < -0.9 && f.L > 9 && f.a[0] < -10) front = f;

  for (const f of edges) {
    if (f.L < 0.2) continue;
    const top = inTab(f) ? TAB : EAVE;
    WL.setColor(f === front ? C.wall : C.wall); rect(WL, f, 0, f.L, gLo, Y(top));
    WL.setColor(C.plinth); slab(WL, f, -0.06, f.L + 0.06, gLo, Y(0.8), 0, 0.12, 'ft');
    WL.setColor(C.fascia); slab(WL, f, -0.25, f.L + 0.25, Y(top - 0.42), Y(top + 0.05), 0, 0.42, 'ftb');
    if (f === front || f.L < 2.4) continue;
    const floors = inTab(f) ? [1.25, 4.35] : [1.25, 4.35, 7.45];
    for (const y of floors) st.windows += bays(B, f, { y: Y(y), w: 1.05, h: y < 2 ? 1.4 : 1.65, kind: y > 4 && y < 5 ? 'round' : 'flat', pitch: 3.4, m0: 1.0, m1: 1.0, trim: C.trim, glass: C.glass, sur: 0.11, d: 0.06 });
  }
  if (front) {   // the street front of the front block (s runs from the right edge to the left, seen from the street)
    const f = front, X = (v) => 10.5 - v;   // s of a local v
    for (const [v, ys] of [[0.9, [1.25, 4.35, 7.45]]]) for (const y of ys) { win(B, f, X(v), Y(y), 1.0, 1.55, { kind: 'flat', trim: C.trim, glass: C.glass, sur: 0.11, d: 0.06 }); st.windows++; }
    for (const v of [6.1, 3.3]) { win(B, f, X(v), Y(1.25), 1.05, 1.4, { kind: 'flat', trim: C.trim, glass: C.glass, sur: 0.11, d: 0.06 }); win(B, f, X(v), Y(4.35), 1.0, 2.2, { kind: 'round', trim: C.trim, glass: C.glass, sur: 0.14, d: 0.07 }); st.windows += 2; }
    win(B, f, X(4.7) - 0.6, Y(10.1), 0.6, 1.5, { kind: 'flat', trim: C.trim, glass: C.glass, sur: 0.08, d: 0.05, sill: false }); win(B, f, X(4.7) + 0.6, Y(10.1), 0.6, 1.5, { kind: 'flat', trim: C.trim, glass: C.glass, sur: 0.08, d: 0.05, sill: false }); st.windows += 2;
    // the big pointed window over the entrance, and the door under the dark canopy
    win(B, f, X(8.0), Y(4.2), 2.3, 4.5, { kind: 'pointed', rise: 1.7, trim: C.trim, glass: C.glass, sur: 0.2, d: 0.08, n: 6, bars: true }); st.windows++;
    B.trim.setColor('#f4efe4'); B.trim.face([at(f, X(8.0) - 0.8, Y(0.2), 0.1), at(f, X(8.0) + 0.8, Y(0.2), 0.1), at(f, X(8.0) + 0.8, Y(2.7), 0.1), at(f, X(8.0) - 0.8, Y(2.7), 0.1)], nrm(f));
    B.trim.setColor('#34485a'); B.trim.face([at(f, X(8.0) - 0.62, Y(0.35), 0.12), at(f, X(8.0) + 0.62, Y(0.35), 0.12), at(f, X(8.0) + 0.62, Y(2.55), 0.12), at(f, X(8.0) - 0.62, Y(2.55), 0.12)], nrm(f));
    canopy(B, f, X(8.0), 3.1, Y(3.15), { depth: 1.7, th: 0.12, col: C.dark, tilt: 0.55 });
    // the pale right wing: a lighter render band up the right edge of the front
    WL.setColor(C.wall2); slab(WL, f, 0, 4.1, Y(0.8), Y(EAVE), 0, 0.05, 'f');
    // the gable of the front block: its triangle comes with the roof; a pale rake along both slopes
    for (const k of [0, 1]) { const v0 = k ? -1.1 : 10.5, vm = 4.7; WL.setColor(C.trim); WL.face([at(f, X(v0), Y(EAVE), 0.06), at(f, X(vm), Y(EAVE + FRISE), 0.06), at(f, X(vm), Y(EAVE + FRISE - 0.3), 0.06), at(f, X(v0), Y(EAVE - 0.3), 0.06)], nrm(f)); }
  }
  // ---- the roofs: the long back wing hipped, the front block's gable running into it, the tab under a small pyramid
  gable(TL, { a0: -10.5, a1: 10.5, b0: -0.6, b1: 10.7, yE: Y(EAVE + 0.05), yR: Y(EAVE + WRISE), ridge: 'v', ov: 0.5, hip0: true, hip1: true, col: C.roof });
  gable(TL, { a0: -10.7, a1: 5.05, b0: -1.1, b1: 10.5, yE: Y(EAVE + 0.05), yR: Y(EAVE + FRISE), ridge: 'u', ov: 0.45, rake: 0.3, col: C.roof, G: WL, gcol: C.wall });
  pyramid(TL, { x0: -6.4, x1: -0.6, z0: -4.8, z1: -1.1, yE: Y(TAB + 0.05), yR: Y(TAB + 2.0), ov: 0.4, col: C.roof });
  // a stack of chimneys, rendered, at the rear corner (the photograph's tower-like stack)
  WL.setColor(C.wall); WL.box(8.9, Y(EAVE + 0.5), -9.8, 10.1, Y(EAVE + 3.6), -8.6, 63 & ~8); WL.setColor(C.fascia); WL.box(8.8, Y(EAVE + 3.6), -9.9, 10.2, Y(EAVE + 3.85), -8.5, 63 & ~8);
  end(B);

  S.prism(ring.flat(), gLo, Y(EAVE + 0.1), 0, 0, 'wall');
  const FF = { cx: F.cx, cz: F.cz, U: F.U, V: F.V };
  gableSolid(S, FF, toW, { u0: -0.6, u1: 10.7, vt: -10.5, vb: 10.5, eaveY: Y(EAVE + 0.05), rise: WRISE - 0.05, across: true });
  gableSolid(S, FF, toW, { u0: -10.7, u1: 5.05, vt: -1.1, vb: 10.5, eaveY: Y(EAVE + 0.05), rise: FRISE - 0.05 });
  return { footprints: [{ poly: ring.map((p) => [p[0], p[1]]), h: EAVE + 3.9, kind: 'church', name: 'Biserica Penticostală Filadelfia', id: FILADELFIA_ID }], stats: st };
}
void poly; void rect;
