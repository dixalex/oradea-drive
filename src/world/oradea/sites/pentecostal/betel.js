// OWNER: oradea. Biserica Penticostală Betel (Strada Ion Ghica 13, Oradea): the mother church of Oradea's Pentecostals, the first Pentecostal church
// raised in the city; the congregation bought a storehouse here in 1955–56 and rebuilt it in the communist years. On the footprint 423100418
// (OSM's untagged two-storey block on the west side of Ion Ghica). Built after the Street View photograph on biserici.org (2016): a two-storey
// hall in grey-beige render, its short end to the street – a stepped parapet with a raised centre piece and a white cross, a sawtooth band
// along the cornice, pointed blind niches on the end pilasters, tall upper windows with a French balcony – and a row of upper windows down
// the long sides under a low roof. The yard annex and the green gate in the photograph are not built. The roof and the back are guesses.
//   buildBetel({ B, S, g, ring }) -> { footprints, stats }
import { begin, end, frameOf, groundOf, frontFrame, sideFrame, gable, at, nrm, slab, poly, cross, gableSolid, WHITE } from './kit.js';
import { canopy } from './parts.js';

export const BETEL_ID = 423100418;
const C = { wall: '#c9c1aa', niche: '#a79e86', band: '#ddd7c4', trim: '#f1ece0', plinth: '#8d897d', cornice: '#b9b09a', roof: '#7e6556', glass: '#35485a', rail: '#2c2e30' };

export function buildBetel({ B, S, g, ring, faceTo = [945, 398] }) {
  const F = frameOf(ring, { faceTo }), toW = F.toMap, st = { windows: 0, towers: 0 };
  const { Fy, gLo } = groundOf(ring, g), Y = (h) => Fy + h;
  const { minU, maxU, minV, maxV } = F, vc = (minV + maxV) / 2, W = maxV - minV;
  const EAVE = 7.4, RISE = 1.5;
  begin(B, F.cx, F.cz, F.yaw);
  const WL = B.wall, TL = B.tile;
  const ff = frontFrame(minU, minV, maxV, -1), bf = frontFrame(maxU, minV, maxV, 1), west = sideFrame(minV, minU, maxU, -1), east = sideFrame(maxV, minU, maxU, 1);

  // ---- the long sides and the back: render, plinth, a cornice, a ribbon of upper windows, small ground windows
  const L = maxU - minU, n = 7, step = (L - 3.2) / n;
  for (const f of [west, east, bf]) {
    const [w0, w1] = f === bf ? [minV, maxV] : [minU, maxU];
    WL.setColor(C.wall); f.rect(WL, w0, w1, gLo, Y(EAVE));
    WL.setColor(C.plinth); f.slab(WL, w0 - 0.05, w1 + 0.05, gLo, Y(0.8), 0, 0.12, 'ft');
    WL.setColor(C.cornice); f.slab(WL, w0 - 0.25, w1 + 0.25, Y(EAVE - 0.4), Y(EAVE + 0.05), 0, 0.42, 'ftb');
    WL.setColor(C.band); f.slab(WL, w0, w1, Y(3.55), Y(3.8), 0, 0.1, 'ft');   // the string course between the storeys
  }
  for (const f of [west, east]) for (let k = 0; k < n; k++) {
    const u = minU + 3.4 + (k + 0.5) * step;
    f.win(B, u, Y(4.35), 1.25, 1.55, { kind: 'flat', trim: C.trim, glass: C.glass, sur: 0.1, d: 0.06 }); st.windows++;
    if (k % 2 === 0) { f.win(B, u, Y(1.45), 1.2, 1.25, { kind: 'flat', trim: C.trim, glass: C.glass, sur: 0.1, d: 0.06 }); st.windows++; }
  }
  for (const v of [minV + 2.4, vc, maxV - 2.4]) for (const y of [1.45, 4.35]) { bf.win(B, v, Y(y), 1.2, 1.5, { kind: 'flat', trim: C.trim, glass: C.glass, sur: 0.1, d: 0.06 }); st.windows++; }

  // ---- the street front (the short end): render, the stepped parapet, the sawtooth band, the niches, the windows and the balcony
  WL.setColor(C.wall); ff.rect(WL, minV, maxV, gLo, Y(EAVE));
  WL.setColor(C.plinth); ff.slab(WL, minV - 0.05, maxV + 0.05, gLo, Y(0.8), 0, 0.12, 'ft');
  WL.setColor(C.cornice); ff.slab(WL, minV - 0.25, maxV + 0.25, Y(EAVE - 0.4), Y(EAVE + 0.05), 0, 0.42, 'ftb');
  // the parapet: a raised middle block with a stepped shoulder each side, a cross on the top
  WL.setColor(C.wall); ff.slab(WL, vc - 2.5, vc + 2.5, Y(EAVE), Y(EAVE + 1.5), 0, 0.14, 'ftlr');
  WL.setColor(C.band); ff.slab(WL, vc - 2.7, vc + 2.7, Y(EAVE + 1.5), Y(EAVE + 1.8), 0, 0.26, 'ftlr');
  for (const sgn of [-1, 1]) { WL.setColor(C.wall); ff.slab(WL, ...[vc + sgn * 2.5, vc + sgn * 4.3].sort((a, b) => a - b), Y(EAVE), Y(EAVE + 0.8), 0, 0.14, 'ftlr'); WL.setColor(C.band); ff.slab(WL, ...[vc + sgn * 2.5, vc + sgn * 4.5].sort((a, b) => a - b), Y(EAVE + 0.8), Y(EAVE + 1.05), 0, 0.22, 'ftlr'); }
  cross(B.trim, ...at(ff, ff.sOf(vc), Y(EAVE + 1.8), 0.1), 1.8, WHITE, 0);
  // the sawtooth band under the cornice, and a chevron course over the ground floor
  { WL.setColor(C.band); for (const [a, b] of [[minV + 0.9, vc - 2.5], [vc + 2.5, maxV - 0.9]]) {
      const k = Math.max(1, Math.round((b - a) / 1.3)), sw = (b - a) / k;
      for (let i = 0; i < k; i++) { const v0 = a + i * sw; poly(WL, [ff.pt(v0, Y(EAVE - 0.45), 0.08), ff.pt(v0 + sw, Y(EAVE - 0.45), 0.08), ff.pt(v0 + sw / 2, Y(EAVE - 1.25), 0.08)], [-1, 0, 0]); } }
    for (let i = 0; i < 9; i++) { const v0 = minV + 0.9 + i * ((W - 1.8) / 9), sw = (W - 1.8) / 9; poly(WL, [ff.pt(v0, Y(3.8), 0.08), ff.pt(v0 + sw, Y(3.8), 0.08), ff.pt(v0 + sw / 2, Y(4.3), 0.08)], [-1, 0, 0]); } }
  // pointed blind niches on the pilasters at both ends: a tall one over a short one
  for (const v of [minV + 1.1, maxV - 1.1]) {
    ff.win(B, v, Y(0.95), 0.6, 2.4, { kind: 'pointed', trim: C.band, glass: C.niche, sur: 0.12, d: 0.05, n: 4 });
    ff.win(B, v, Y(4.55), 0.6, 2.2, { kind: 'pointed', trim: C.band, glass: C.niche, sur: 0.12, d: 0.05, n: 4 }); st.windows += 2;
  }
  // upper windows (one with a French balcony) and the ground-floor windows
  for (const v of [vc - 2.2, vc + 0.1, vc + 2.3]) { ff.win(B, v, Y(4.5), 1.0, 2.25, { kind: 'flat', trim: C.trim, glass: C.glass, sur: 0.12, d: 0.06 }); st.windows++; }
  { const v = vc + 2.3;   // the balcony: a slab and a railing of bars
    WL.setColor(C.band); ff.slab(WL, v - 0.95, v + 0.95, Y(4.1), Y(4.4), 0, 0.55, 'ftblr');
    B.trim.setColor(C.rail); for (let i = 0; i <= 8; i++) { const s = v - 0.9 + i * 0.225, [x, , z] = at(ff, ff.sOf(s), 0, 0.5); B.trim.tube([x, Y(4.4), z], [x, Y(5.3), z], 0.015, 3); }
    const [xa, , za] = at(ff, ff.sOf(v - 0.9), 0, 0.5), [xb, , zb] = at(ff, ff.sOf(v + 0.9), 0, 0.5); B.trim.tube([xa, Y(5.3), za], [xb, Y(5.3), zb], 0.02, 3); }
  for (const v of [vc - 2.2, vc + 2.2]) { ff.win(B, v, Y(1.45), 1.0, 1.35, { kind: 'flat', trim: C.trim, glass: C.glass, sur: 0.1, d: 0.06 }); st.windows++; }
  ff.door(B, vc + 0.1, Y(0.2), 1.5, 2.5, { kind: 'flat', glass: true, col: '#35485a', trim: C.trim, sur: 0.12, d: 0.08 });
  // a side door near the front on the long wall, with a canopy
  { const f = west, u = minU + 3.0; f.door(B, u, Y(0.2), 1.5, 2.3, { kind: 'flat', glass: true, col: '#35485a', trim: C.trim, sur: 0.1, d: 0.08 });
    canopy(B, f, f.sOf(u), 2.6, Y(2.95), { depth: 1.1, th: 0.16, col: '#7d6a5c', tilt: 0.25 }); }

  // ---- the roof: a low gable, hidden behind the front parapet
  gable(TL, { a0: minU, a1: maxU, b0: minV, b1: maxV, yE: Y(EAVE + 0.05), yR: Y(EAVE + RISE), ridge: 'u', ov: 0.4, rake: 0.02, col: C.roof, G: WL, gcol: C.wall });
  end(B);

  S.prism(ring.flat(), gLo, Y(EAVE + 0.2), 0, 0, 'wall');
  gableSolid(S, { cx: F.cx, cz: F.cz, U: F.U, V: F.V }, toW, { u0: minU, u1: maxU, vt: minV, vb: maxV, eaveY: Y(EAVE + 0.05), rise: RISE - 0.05 });
  return { footprints: [{ poly: ring.map((p) => [p[0], p[1]]), h: EAVE + 3.6, kind: 'church', name: 'Biserica Penticostală Betel', id: BETEL_ID }], stats: st };
}
void slab; void nrm;
