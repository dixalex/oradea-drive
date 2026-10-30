// OWNER: oradea. The parametric halls of the free-church site (tier b of ../pentecostal.js): one entry per building – the footprint it replaces
// (`id`, an OSM way or an Overture building in map_buildings.json), the point on its street the front looks at (`frame.faceTo`) and what ./hall.js
// cannot read off the outline: heights, colours, roof, the front. Every building here has a Street View or site photograph (biserici.org,
// 2008–2016) as its source; the sides and backs, the roof pitch and the heights are not in them (guesses). Lettering is not drawn.
//   KIT   [{ id, key, name, frame, eave, wall, ..., front(ctx), roofs }]  fields in hall.js
//   SKIP  the footprint ids the kit entries replace
import { poly, nrm, at, ball, cross, WHITE } from './kit.js';
import { canopy } from './parts.js';

const LO = '#34465a';
// a curved ("bell") gable over the front: the wall under the curve and a pale moulding along it
function bell(ctx, { y0, H, base = 0.5, band = '#f6efe0', bw = 0.22, n = 16 }) {
  const { B, ff, front } = ctx, v0 = front.b[1], v1 = front.a[1], vc = (v0 + v1) / 2, hw = (v1 - v0) / 2;
  const P = Array.from({ length: n + 1 }, (_, i) => { const v = v0 + (v1 - v0) * i / n; return [v, y0 + base + (H - base) * Math.cos(Math.PI * (v - vc) / (2 * hw))]; });
  poly(B.wall, [ff.pt(v0, y0), ff.pt(v1, y0), ...P.slice().reverse().map(([v, y]) => ff.pt(v, y))], [-1, 0, 0]);
  B.wall.setColor(band);
  for (let i = 0; i < n; i++) B.wall.face([ff.pt(P[i][0], P[i][1], 0.09), ff.pt(P[i + 1][0], P[i + 1][1], 0.09), ff.pt(P[i + 1][0], P[i + 1][1] + bw, 0.09), ff.pt(P[i][0], P[i][1] + bw, 0.09)], nrm(ff));
  return P;
}

export const KIT = [
  // Biserica Adventistă Maranatha (Strada Clujului 32; bought and fitted out before 1989; the Street View / Facebook photograph): a cream-peach
  // pilastered front in three bays – tall arched windows either side of an arched door in a brick-red surround –, a stepped attic with the
  // emblem triangle and ball pinnacles, a hip roof of red tile behind and a lower annex on its east side
  { id: 423108728, key: 'advmaranatha', name: 'Biserica Adventistă Maranatha', frame: { faceTo: [1160, -428] }, eave: 8.4, wall: '#ecd3a8', side: '#e6cfa4', trim: '#f7eddb',
    plinth: '#a9533d', plinthH: 0.95, roofCol: '#b04a33', pitch: 3.8, rows: [{ y: 1.3, h: 2.5, w: 1.1, kind: 'round' }, { y: 4.7, h: 2.5, w: 1.1, kind: 'round' }],
    tops: (f) => (f.a[0] > 9 && f.b[0] > 9 ? [[0, 10.9, 8.4], [10.9, f.L, 6.2]] : (f.a[0] > -0.5 && f.b[0] > -0.5 && f.a[0] < 0.5 ? [[0, f.L, 6.2]] : (f.a[1] > 1.5 && f.b[1] > 1.5 ? [[0, f.L, 6.2]] : null))),
    roofs: [{ u0: -10.2, u1: 10.2, v0: -9.5, v1: 1.4, ridge: 'u', rise: 3.0, hip0: true, hip1: true }, { u0: -0.2, u1: 10.2, v0: 1.4, v1: 9.4, ridge: 'u', rise: 2.3, hip0: true, hip1: true, drop: 2.2 }],
    front(ctx) {
      const { B, ff, front, Y, eave, st } = ctx, WL = B.wall, v0 = front.b[1], v1 = front.a[1], vc = (v0 + v1) / 2, bay = (v1 - v0 - 0.8) / 3;
      const bc = (k) => v0 + 0.4 + bay * (k + 0.5);
      WL.setColor('#f4e6c8');   // four pilasters, the entablature, the frieze band
      for (let k = 0; k <= 3; k++) { const v = v0 + 0.4 + bay * k; ff.slab(WL, v - 0.35, v + 0.35, Y(0.95), Y(eave - 0.7), 0, 0.16, 'flr'); ff.slab(WL, v - 0.45, v + 0.45, Y(eave - 0.9), Y(eave - 0.7), 0, 0.22, 'ftlr'); }
      WL.setColor('#f1e0bd'); ff.slab(WL, v0 - 0.25, v1 + 0.25, Y(eave - 0.7), Y(eave + 0.1), 0, 0.5, 'ftb'); ff.slab(WL, v0, v1, Y(eave - 1.6), Y(eave - 0.9), 0, 0.1, 'f');
      for (const k of [0, 2]) { ff.win(B, bc(k), Y(1.4), 1.3, 4.7, { kind: 'round', trim: '#f7eddb', glass: LO, sur: 0.18, d: 0.08 }); st.windows++; }
      ff.door(B, bc(1), Y(0.95), 1.9, 3.3, { kind: 'round', col: '#4b2f22', trim: '#b4583f', sur: 0.3, d: 0.08 });
      // the stepped attic over the middle bays: a block 7 m wide, two lower steps, ball pinnacles, the triangle emblem
      WL.setColor('#ecd3a8'); ff.slab(WL, vc - 3.4, vc + 3.4, Y(eave), Y(eave + 2.9), 0, 0.12, 'ftlr');
      for (const sg of [-1, 1]) ff.slab(WL, ...[vc + sg * 3.4, vc + sg * 5.0].sort((a, b) => a - b), Y(eave), Y(eave + 1.1), 0, 0.12, 'ftlr');
      WL.setColor('#f1e0bd'); ff.slab(WL, vc - 3.7, vc + 3.7, Y(eave + 2.9), Y(eave + 3.25), 0, 0.4, 'ftb');
      for (const sg of [-1, 1]) ff.slab(WL, ...[vc + sg * 3.4, vc + sg * 5.2].sort((a, b) => a - b), Y(eave + 1.1), Y(eave + 1.35), 0, 0.3, 'ftb');
      B.trim.setColor('#f6f2e8'); poly(B.trim, [ff.pt(vc - 0.95, Y(eave + 0.55), 0.14), ff.pt(vc + 0.95, Y(eave + 0.55), 0.14), ff.pt(vc, Y(eave + 2.15), 0.14)], [-1, 0, 0]);
      for (const [v, y, r] of [[vc - 3.5, eave + 3.25, 0.26], [vc + 3.5, eave + 3.25, 0.26], [vc, eave + 3.25, 0.34], [vc - 5.1, eave + 1.35, 0.2], [vc + 5.1, eave + 1.35, 0.2]]) { const [u, , w] = ff.pt(v, 0, 0.2); ball(B.trim, u, Y(y + r), w, r, '#ecd9b0'); }
    } },

  // Biserica Adventistă Eden (Strada Academiei 9, Imaház; bought and fitted out before 1989; Facebook photograph of 2010): a narrow hall whose
  // end is a tall curved gable – peach render, a white moulding along the curve, an arched window high in the middle, two arched windows
  // either side, a round-arched porch – under a dark tiled roof
  { id: 423346495, key: 'adveden', name: 'Biserica Adventistă Eden', frame: { faceTo: [-250, -487] }, eave: 6.5, wall: '#efc89f', side: '#ead3b2', trim: '#f8f1e4', plinth: '#a69c8a',
    roofCol: '#4d4749', pitch: 4.4, rows: [{ y: 1.7, h: 3.4, w: 1.2, kind: 'round' }], rise: 2.9, hip0: false, hip: true,
    front(ctx) {
      const { B, ff, front, Y, eave, st } = ctx, v0 = front.b[1], v1 = front.a[1], vc = (v0 + v1) / 2;
      bell(ctx, { y0: Y(eave), H: 3.3, base: 0.6, band: '#f8f1e4', bw: 0.26 });
      B.wall.setColor('#f8f1e4'); ff.slab(B.wall, v0 - 0.2, v1 + 0.2, Y(eave - 0.4), Y(eave + 0.03), 0, 0.3, 'ftb');
      for (const s of [-1, 1]) { ff.win(B, vc + s * 2.75, Y(1.9), 1.15, 2.7, { kind: 'round', trim: '#f8f1e4', glass: LO, sur: 0.2, d: 0.08 }); st.windows++; }
      ff.win(B, vc, Y(4.0), 1.5, 2.9, { kind: 'round', trim: '#f8f1e4', glass: LO, sur: 0.22, d: 0.08 }); st.windows++;
      ff.door(B, vc, Y(0.9), 1.8, 2.6, { kind: 'round', col: '#47301f', trim: '#f8f1e4', sur: 0.3, d: 0.1 });
      B.wall.setColor('#f2e7d2'); ff.slab(B.wall, vc - 1.5, vc + 1.5, Y(0.9), Y(3.6), 0, 0.5, 'lr'); ff.slab(B.wall, vc - 1.5, vc + 1.5, Y(3.5), Y(3.7), 0, 0.5, 'ft');
    } },

  // Sala Regatului (Strada Olimpiadei 44, OSM way 291005315; 2008 photograph): an old three-storey corner house turned into a Kingdom Hall –
  // pale grey render, a tan strip up the middle of the front with a small flat canopy over a brown door, small paired windows, brown tile hip roof
  { id: 291005315, key: 'jwhall', name: 'Sala Regatului a Martorilor lui Iehova', frame: { faceTo: [-1019, -1474] }, eave: 9.1, wall: '#dedacd', side: '#e2ddd0', trim: '#faf6ec', plinth: '#9d9588',
    roofCol: '#6f4a3a', pitch: 3.6, rows: [{ y: 1.3, h: 1.55 }, { y: 4.4, h: 1.7 }, { y: 7.4, h: 1.6 }], rise: 3.6,
    front(ctx) {
      const { B, ff, front, Y, eave, st } = ctx, v0 = front.b[1], v1 = front.a[1], vc = (v0 + v1) / 2;
      B.wall.setColor('#d3ad92'); ff.slab(B.wall, vc - 1.7, vc + 1.7, Y(0.8), Y(eave - 0.4), 0, 0.14, 'flr');
      for (const dv of [-3.4, 3.4]) for (const y of [1.3, 4.4, 7.4]) { ff.win(B, vc + dv, Y(y), 1.15, y < 2 ? 1.5 : 1.7, { kind: 'flat', trim: '#faf6ec', glass: LO, sur: 0.12, d: 0.06 }); st.windows++; }
      for (const y of [4.4, 7.4]) { ff.win(B, vc, Y(y), 1.1, 1.7, { kind: 'flat', trim: '#faf6ec', glass: LO, sur: 0.12, d: 0.08 }); st.windows++; }
      ff.door(B, vc, Y(0.2), 1.5, 2.5, { kind: 'flat', col: '#6a4126', trim: '#faf6ec', sur: 0.12, d: 0.1 });
      canopy(B, ff, ff.sOf(vc), 2.6, Y(3.1), { depth: 1.2, th: 0.14, col: '#e8e4d8' });
    } },

  // Sala Regatului I (Strada Anatole France 50; built 1991; 2008 photograph): a three-storey house with a hip roof of brown tile, cream and
  // tan render, the entrance bay projecting a little under a pale canopy
  { id: 423089822, key: 'jwhall1', name: 'Sala Regatului a Martorilor lui Iehova', frame: { faceTo: [1360, 600] }, eave: 9.3, wall: '#e0d6c2', side: '#e3dac8', trim: '#fbf7ee', plinth: '#9b8f80',
    roofCol: '#7b4d3d', pitch: 3.7, rows: [{ y: 1.3, h: 1.55 }, { y: 4.4, h: 1.7 }, { y: 7.5, h: 1.6 }], rise: 4.0,
    front(ctx) {
      const { B, ff, front, Y, eave, st } = ctx, v0 = front.b[1], v1 = front.a[1], vc = (v0 + v1) / 2;
      B.wall.setColor('#d4a98b'); ff.slab(B.wall, vc - 1.9, vc + 1.9, Y(0.8), Y(eave - 0.4), 0, 0.3, 'flr');
      for (const dv of [-4.9, 4.9]) { for (const y of [1.3, 4.4, 7.5]) { ff.win(B, vc + dv, Y(y), 1.15, y < 2 ? 1.5 : 1.7, { kind: 'flat', trim: '#fbf7ee', glass: LO, sur: 0.12, d: 0.06 }); st.windows++; } }
      for (const y of [4.4, 7.5]) { ff.win(B, vc, Y(y), 1.1, 1.7, { kind: 'flat', trim: '#fbf7ee', glass: LO, sur: 0.12, d: 0.32 }); st.windows++; }
      ff.door(B, vc, Y(0.2), 1.5, 2.5, { kind: 'flat', col: '#6a4126', trim: '#fbf7ee', sur: 0.1, d: 0.32 });
      canopy(B, ff, ff.sOf(vc), 3.0, Y(3.1), { depth: 1.4, th: 0.14, col: '#f0ece0' });
    } },

  // Biserica Penticostală Efrata (Strada Dobrogei 1; Street View 2016): a two-storey hall whose end is a shaped gable – mauve pilaster blocks
  // either side of an ochre centre with a yellow awning over the door, a small window in a pale panel under a stepped crown –, a cream long wing
  { id: 424746070, key: 'efrata', name: 'Biserica Penticostală Efrata', frame: { faceTo: [1510, -20] }, eave: 6.9, wall: '#d9c27c', side: '#e6dec4', trim: '#faf6ea', plinth: '#a49a88',
    roofCol: '#a14b36', pitch: 4.2, rows: [{ y: 1.4, h: 1.5 }, { y: 4.1, h: 1.7 }], rise: 2.7, hip0: false, hip: false,
    front(ctx) {
      const { B, ff, front, Y, eave, st } = ctx, v0 = front.b[1], v1 = front.a[1], vc = (v0 + v1) / 2, hw = (v1 - v0) / 2;
      for (const s of [-1, 1]) { B.wall.setColor('#a06a80'); ff.slab(B.wall, ...[vc + s * 1.8, vc + s * hw].sort((a, b) => a - b), Y(0.8), Y(eave), 0, 0.18, 'ftlr'); }
      B.wall.setColor('#d9c27c');   // the stepped crown over the ochre centre
      poly(B.wall, [ff.pt(vc - hw, Y(eave)), ff.pt(vc + hw, Y(eave)), ff.pt(vc + hw, Y(eave + 0.7)), ff.pt(vc + 2.1, Y(eave + 0.7)), ff.pt(vc + 2.1, Y(eave + 1.5)), ff.pt(vc + 1.0, Y(eave + 1.5)), ff.pt(vc + 1.0, Y(eave + 2.4)), ff.pt(vc - 1.0, Y(eave + 2.4)), ff.pt(vc - 1.0, Y(eave + 1.5)), ff.pt(vc - 2.1, Y(eave + 1.5)), ff.pt(vc - 2.1, Y(eave + 0.7)), ff.pt(vc - hw, Y(eave + 0.7))], [-1, 0, 0]);
      B.wall.setColor('#a06a80'); for (const s of [-1, 1]) ff.slab(B.wall, ...[vc + s * 2.1, vc + s * hw].sort((a, b) => a - b), Y(eave), Y(eave + 0.7), 0, 0.2, 'ftlr');
      B.wall.setColor('#f1e8cf'); ff.slab(B.wall, vc - 1.2, vc + 1.2, Y(eave + 0.4), Y(eave + 2.1), 0, 0.1, 'f');
      ff.win(B, vc, Y(eave + 0.6), 0.8, 1.2, { kind: 'flat', trim: '#faf6ea', glass: LO, sur: 0.1, d: 0.14 }); st.windows++;
      ff.win(B, vc, Y(4.1), 1.0, 1.9, { kind: 'flat', trim: '#faf6ea', glass: LO, sur: 0.1, d: 0.1 }); st.windows++;
      for (const s of [-1, 1]) { ff.win(B, vc + s * 3.3, Y(1.4), 0.9, 1.5, { kind: 'flat', trim: '#faf6ea', glass: LO, sur: 0.1, d: 0.2 }); ff.win(B, vc + s * 3.3, Y(4.1), 0.9, 1.7, { kind: 'flat', trim: '#faf6ea', glass: LO, sur: 0.1, d: 0.2 }); st.windows += 2; }
      ff.door(B, vc, Y(0.2), 1.5, 2.5, { kind: 'flat', col: '#5a3a26', trim: '#faf6ea', sur: 0.1, d: 0.1 });
      canopy(B, ff, ff.sOf(vc), 2.6, Y(3.0), { depth: 1.2, th: 0.14, col: '#e0b83c', tilt: 0.3 });
    } },
];

export const SKIP = KIT.map((k) => k.id);
void at; void cross; void WHITE;
