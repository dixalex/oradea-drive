// OWNER: oradea. Biserica Penticostală Tabor (Strada Meiului 8, Oradea; the congregation formed in 1990), on the Overture footprint 421861043 by
// the Meiului / Vavilov crossing. Built after the Street View photograph on biserici.org (2016): a three-storey hall in terracotta render
// with its short end to the street – a tall cream strip up the middle of the front, a slit window in it, a brown canopy over a glazed double
// door on three steps, the terracotta flanks stepped up in two notches at the corners – and stacks of tall narrow windows between pale
// strips down the long sides, under a low brown roof. The back wall and the roof pitch are not in the photograph (guesses).
//   buildTabor({ B, S, g, ring }) -> { footprints, stats }
import { begin, end, frameOf, groundOf, frontFrame, sideFrame, gable, poly, at, nrm, slab, cross, gableSolid, WHITE } from './kit.js';
import { wallEdge, bays, strips, canopy, steps } from './parts.js';

export const TABOR_ID = 421861043;
const C = { wall: '#cf9269', cream: '#ece1c8', trim: '#f4ecd9', plinth: '#8f8577', cornice: '#7b4a38', roof: '#6b4033', glass: '#2f3f4e', canopy: '#7a4a32', door: '#33505e' };

export function buildTabor({ B, S, g, ring, faceTo = [1960, 1080] }) {
  const F = frameOf(ring, { faceTo }), toW = F.toMap, st = { windows: 0, towers: 0 };
  const { Fy, gLo } = groundOf(ring, g), Y = (h) => Fy + h;
  const { minU, maxU, minV, maxV } = F, vc = (minV + maxV) / 2, W = maxV - minV;
  const EAVE = 9.9, RISE = 1.7, STRIP = 2.35;   // the cream strip is 2 x STRIP wide
  begin(B, F.cx, F.cz, F.yaw);
  const WL = B.wall, SH = B.sheet;
  const ff = frontFrame(minU, minV, maxV, -1), bf = frontFrame(maxU, minV, maxV, 1), west = sideFrame(minV, minU, maxU, -1), east = sideFrame(maxV, minU, maxU, 1);

  // ---- the long sides and the back: walls, plinth, eave, stacks of windows between pale strips
  for (const f of [west, east, bf]) {
    const [w0, w1] = f === bf ? [minV, maxV] : [minU, maxU];
    WL.setColor(C.wall); f.rect(WL, w0, w1, gLo, Y(EAVE));
    WL.setColor(C.plinth); f.slab(WL, w0 - 0.05, w1 + 0.05, gLo, Y(0.8), 0, 0.12, 'ft');
    WL.setColor(C.cornice); f.slab(WL, w0 - 0.3, w1 + 0.3, Y(EAVE - 0.35), Y(EAVE + 0.1), 0, 0.5, 'ftb');
  }
  { const L = maxU - minU, n = 6, step = (L - 4.4) / n, cs = Array.from({ length: n }, (_, k) => minU + 3.0 + (k + 0.5) * step);
    for (const f of [west, east]) {
      WL.setColor(C.cream); for (const u of cs) f.slab(WL, u - 0.85, u + 0.85, Y(0.8), Y(EAVE - 0.4), 0, 0.06, 'f');
      for (const u of cs) for (const y of [1.25, 4.45, 7.55]) { f.win(B, u, Y(y), 0.9, 2.0, { kind: 'flat', trim: C.trim, glass: C.glass, sur: 0.1, d: 0.06 }); st.windows++; }
    }
    for (const v of [minV + 2.2, vc, maxV - 2.2]) for (const y of [4.45, 7.55]) { bf.win(B, v, Y(y), 0.9, 2.0, { kind: 'flat', trim: C.trim, glass: C.glass, sur: 0.1, d: 0.06 }); st.windows++; }
  }

  // ---- the front: terracotta flanks stepped up in two notches, the cream strip, the slit window, the porch
  WL.setColor(C.wall); ff.rect(WL, minV, maxV, gLo, Y(EAVE));
  WL.setColor(C.plinth); ff.slab(WL, minV - 0.05, maxV + 0.05, gLo, Y(0.8), 0, 0.12, 'ft');
  WL.setColor(C.cornice); for (const [a, b] of [[minV, vc - STRIP], [vc + STRIP, maxV]]) ff.slab(WL, a, b, Y(EAVE - 0.35), Y(EAVE + 0.05), 0, 0.3, 'ftb');
  for (const sgn of [-1, 1]) {   // merlons: the outer one 1.2 m tall over the eave, the inner one 0.6 m (the photograph's two notches)
    const vo = vc + sgn * (W / 2), vm = vc + sgn * (W / 2 - 1.5), vi = vc + sgn * STRIP;
    WL.setColor(C.wall); ff.slab(WL, Math.min(vo, vm), Math.max(vo, vm), Y(EAVE), Y(EAVE + 1.2), 0, 0.14, 'ftlr');
    ff.slab(WL, Math.min(vm - sgn * 0.4, vi), Math.max(vm - sgn * 0.4, vi), Y(EAVE), Y(EAVE + 0.7), 0, 0.14, 'ftlr');
  }
  WL.setColor(C.cream); ff.slab(WL, vc - STRIP, vc + STRIP, Y(0.8), Y(EAVE + 2.3), 0, 0.22, 'ftlr'); // the tall strip
  WL.setColor('#d8ccb0'); for (const sgn of [-1, 1]) ff.slab(WL, vc + sgn * (STRIP - 0.25) - 0.12, vc + sgn * (STRIP - 0.25) + 0.12, Y(EAVE + 2.3), Y(EAVE + 2.75), 0, 0.22, 'ftlr'); // two small points on its crown
  // slit window with a cross of short arms
  { const slit = (w0, w1, y0, y1) => { B.lit.setColor(C.glass); B.lit.face([ff.pt(w0, y0, 0.24), ff.pt(w1, y0, 0.24), ff.pt(w1, y1, 0.24), ff.pt(w0, y1, 0.24)], nrm(ff)); };
    slit(vc - 0.22, vc + 0.22, Y(5.4), Y(11.7));
    for (const y of [8.7, 10.1]) slit(vc - 1.0, vc + 1.0, Y(y), Y(y + 0.32));
    B.trim.setColor(C.trim); ff.slab(B.trim, vc - 0.28, vc + 0.28, Y(5.3), Y(5.4), 0, 0.26, 'f'); st.windows += 3; }
  // flank windows
  for (const v of [vc - (W / 2 + STRIP) / 2, vc + (W / 2 + STRIP) / 2]) for (const y of [4.45, 7.55]) { ff.win(B, v, Y(y), 0.85, 2.0, { kind: 'flat', trim: C.trim, glass: C.glass, sur: 0.1, d: 0.06 }); st.windows++; }
  for (const v of [vc - (W / 2 + STRIP) / 2, vc + (W / 2 + STRIP) / 2]) { ff.win(B, v, Y(1.3), 0.85, 1.6, { kind: 'flat', trim: C.trim, glass: C.glass, sur: 0.1, d: 0.06 }); st.windows++; }
  // the porch: a glazed double door on three steps under a brown canopy
  ff.door(B, vc, Y(0.2), 2.3, 2.7, { kind: 'flat', glass: true, col: C.door, trim: C.trim, sur: 0.12, d: 0.26 });
  canopy(B, ff, ff.sOf(vc), 4.6, Y(3.65), { depth: 1.7, th: 0.3, col: C.canopy, tilt: 0.0 });
  steps(B, ff, ff.sOf(vc), 3.2, 3, { y0: Y(0.2), col: '#b8b3a8' });
  cross(B.trim, ...at(ff, ff.sOf(vc), Y(EAVE + 2.75), 0.12), 1.7, WHITE, 0);

  // ---- the roof: a low gable of brown metal behind the stepped front (the gable ends are walls)
  gable(SH, { a0: minU, a1: maxU, b0: minV, b1: maxV, yE: Y(EAVE + 0.05), yR: Y(EAVE + RISE), ridge: 'u', ov: 0.45, rake: 0.02, col: C.roof, G: WL, gcol: C.wall });
  end(B);

  // ---- colliders and the map footprint
  S.prism(ring.flat(), gLo, Y(EAVE + 0.2), 0, 0, 'wall');
  gableSolid(S, { cx: F.cx, cz: F.cz, U: F.U, V: F.V }, toW, { u0: minU, u1: maxU, vt: minV, vb: maxV, eaveY: Y(EAVE + 0.05), rise: RISE - 0.05 });
  { const [x0, z0] = toW(minU - 1.7, vc - 2.3), [x1, z1] = toW(minU - 1.7, vc + 2.3), [x2, z2] = toW(minU, vc + 2.3), [x3, z3] = toW(minU, vc - 2.3);
    S.prism([x0, z0, x1, z1, x2, z2, x3, z3], Y(3.35), Y(3.65), 0, 0, 'awning'); }
  return { footprints: [{ poly: ring.map((p) => [p[0], p[1]]), h: EAVE + 2.8, kind: 'church', name: 'Biserica Penticostală Tabor', id: TABOR_ID }], stats: st };
}
void poly; void slab; void wallEdge; void bays; void strips;
