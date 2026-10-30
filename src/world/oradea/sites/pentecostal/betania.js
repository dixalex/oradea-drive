// OWNER: oradea. Biserica Penticostală Betania, the Betania Christian Centre (Strada Doina 19, Oradea; a congregation of the early 1990s, now one of
// the city's largest), on OSM way 261607829: a big faceted hall of 38 x 30 m whose outline steps in notches round an oval. No photograph of
// the building turned up (the church's own pages show none, Street View is not reachable), so the shape follows the Bing / Esri aerial
// view: a flat roof band round a raised barrel vault of translucent panels (about 18 x 10 m, its axis along the long side). The walls
// (two storeys of pale render with a row of tall windows, string course, parapet) and the glazed entrance with its canopy on the Vasile
// Conta side are the type's, not the building's: every detail here is a guess except the outline and the vault.
//   buildBetania({ B, S, g, ring }) -> { footprints, stats }
import { begin, end, frameOf, groundOf, edgeFrame, at, rect, slab, ringArea } from './kit.js';
import { bays } from './parts.js';

export const BETANIA_ID = 261607829;
const C = { wall: '#dbd3be', band: '#cfc6af', trim: '#f3eee2', plinth: '#8e887b', roof: '#b4b6b3', glass: '#31475a', vault: '#cbd6dc', rib: '#8a9298', kerb: '#c8bfa8' };

export function buildBetania({ B, S, g, ring }) {
  const F = frameOf(ring, { yaw: 72.1 }), toW = F.toMap, st = { windows: 0, towers: 0 };
  const R = F.ring, { Fy, gLo } = groundOf(ring, g), Y = (h) => Fy + h;
  const EAVE = 8.8, PARA = 0.6;
  begin(B, F.cx, F.cz, F.yaw);
  const WL = B.wall;
  const edges = R.map((a, i) => edgeFrame(a, R[(i + 1) % R.length]));
  // the entrance edge: the longest facet that looks toward +v (the Vasile Conta side)
  let ent = null;
  for (const f of edges) if (f.n[1] > 0.9 && (!ent || f.L > ent.L)) ent = f;
  for (const f of edges) {
    if (f.L < 0.2) continue;
    WL.setColor(C.wall); rect(WL, f, 0, f.L, gLo, Y(EAVE));
    WL.setColor(C.plinth); slab(WL, f, -0.06, f.L + 0.06, gLo, Y(0.9), 0, 0.12, 'ft');
    WL.setColor(C.band); slab(WL, f, -0.04, f.L + 0.04, Y(4.35), Y(4.62), 0, 0.1, 'ft');                    // the string course between the storeys
    WL.setColor(C.trim); slab(WL, f, -0.2, f.L + 0.2, Y(EAVE - 0.5), Y(EAVE), 0, 0.3, 'ftb');               // the cornice
    WL.face([at(f, 0, Y(EAVE), -0.2), at(f, f.L, Y(EAVE), -0.2), at(f, f.L, Y(EAVE + PARA), -0.2), at(f, 0, Y(EAVE + PARA), -0.2)], [-f.n[0], 0, -f.n[1]]);   // the parapet, inner face
    WL.setColor(C.band); slab(WL, f, -0.2, f.L + 0.2, Y(EAVE), Y(EAVE + PARA), -0.2, 0.04, 'ft');
    if (f.L < 2.4) continue;
    const m = Math.min(0.9, f.L / 4);
    st.windows += bays(B, f, { y: Y(5.1), w: 1.1, h: 2.5, kind: 'flat', pitch: 3.2, m0: m, m1: m, trim: C.trim, glass: C.glass, sur: 0.12, d: 0.06, skip: f === ent ? (s) => Math.abs(s - f.L / 2) < 3.4 : null });
    st.windows += bays(B, f, { y: Y(1.35), w: 1.1, h: 1.45, kind: 'flat', pitch: 3.2, m0: m, m1: m, trim: C.trim, glass: C.glass, sur: 0.12, d: 0.06, skip: f === ent ? (s) => Math.abs(s - f.L / 2) < 3.4 : null });
  }
  // the glazed entrance on the +v side: a wide glass front under a flat canopy on posts
  if (ent) {
    const s = ent.L / 2, w = Math.min(5.6, ent.L - 1.2);
    B.lit.setColor(C.glass); B.lit.face([at(ent, s - w / 2, Y(0.2), 0.12), at(ent, s + w / 2, Y(0.2), 0.12), at(ent, s + w / 2, Y(3.6), 0.12), at(ent, s - w / 2, Y(3.6), 0.12)], [ent.n[0], 0, ent.n[1]]);
    B.trim.setColor('#e6e2d6');
    for (let k = 0; k <= 4; k++) slab(B.trim, ent, s - w / 2 + k * w / 4 - 0.05, s - w / 2 + k * w / 4 + 0.05, Y(0.2), Y(3.6), 0, 0.2, 'f');
    slab(B.trim, ent, s - w / 2, s + w / 2, Y(2.25), Y(2.33), 0, 0.2, 'f');
    B.trim.setColor('#7b6c5e'); slab(B.trim, ent, s - w / 2 - 0.5, s + w / 2 + 0.5, Y(3.75), Y(4.05), 0, 2.6, 'ftblr');
    for (const ss of [s - w / 2 - 0.3, s + w / 2 + 0.3]) { const [x, , z] = at(ent, ss, 0, 2.4); B.trim.setColor('#d8d2c4'); B.trim.box(x - 0.1, Y(0), z - 0.1, x + 0.1, Y(3.75), z + 0.1, 63); }
    B.wall.setColor(C.plinth); slab(B.wall, ent, s - w / 2 - 0.3, s + w / 2 + 0.3, Y(0), Y(0.2), 0, 3.0, 'ft');
  }
  // ---- the flat roof, and the raised barrel vault of translucent panels over the middle
  B.sheet.setColor(C.roof); B.sheet.fill(R, [], Y(EAVE), true);
  const uc = -1.0, vcm = 0.0, hl = 9.0, hw = 5.0, rise = 3.4, y0 = Y(EAVE + 0.8), segs = 14;
  WL.setColor(C.kerb); for (const sg of [-1, 1]) WL.box(uc - hl, Y(EAVE), vcm + sg * hw - 0.15, uc + hl, y0, vcm + sg * hw + 0.15, 63 & ~8);
  const arc = (k, e = 0) => [vcm + Math.cos(Math.PI * k / segs) * (hw + e), y0 + Math.sin(Math.PI * k / segs) * (rise + e * 0.6)];
  B.lit.setColor(C.vault);
  for (let k = 0; k < segs; k++) {
    const [v0, ya] = arc(k), [v1, yb] = arc(k + 1);
    B.lit.face([[uc - hl, ya, v0], [uc + hl, ya, v0], [uc + hl, yb, v1], [uc - hl, yb, v1]], [0, Math.sin(Math.PI * (k + 0.5) / segs), Math.cos(Math.PI * (k + 0.5) / segs)]);
  }
  for (const sg of [-1, 1]) { WL.setColor(C.kerb); WL.face(Array.from({ length: segs + 1 }, (_, k) => { const [v, y] = arc(k); return [uc + sg * hl, y, v]; }), [sg, 0, 0]); }
  B.trim.setColor(C.rib);
  for (let r = 0; r <= 6; r++) { const u = uc - hl + r * (2 * hl) / 6; for (let k = 0; k < segs; k++) { const [v0, ya] = arc(k, 0.05), [v1, yb] = arc(k + 1, 0.05); B.trim.tube([u, ya, v0], [u, yb, v1], 0.06, 4); } }
  end(B);

  S.prism(ring.flat(), gLo, Y(EAVE + PARA), 0, 0, 'wall');
  { const q = [[uc - hl, vcm - hw], [uc + hl, vcm - hw], [uc + hl, vcm + hw], [uc - hl, vcm + hw]].map(([u, v]) => toW(u, v)).flat(); S.prism(q, Y(EAVE + PARA), Y(EAVE + 0.8 + rise * 0.82), 0, 0, 'vault'); }
  if (ent) { const s = ent.L / 2, w = Math.min(5.6, ent.L - 1.2);
    const P = (ss, dd) => { const [u, , v] = at(ent, ss, 0, dd); return toW(u, v); };
    S.prism([...P(s - w / 2 - 0.5, 0), ...P(s + w / 2 + 0.5, 0), ...P(s + w / 2 + 0.5, 2.6), ...P(s - w / 2 - 0.5, 2.6)], Y(3.7), Y(4.05), 0, 0, 'awning'); }
  const area = Math.abs(ringArea(R));
  return { footprints: [{ poly: ring.map((p) => [p[0], p[1]]), h: EAVE + 4.2, kind: 'church', name: 'Biserica Penticostală Betania', id: BETANIA_ID }], stats: { ...st, area } };
}
