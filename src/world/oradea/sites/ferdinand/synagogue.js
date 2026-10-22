// OWNER: oradea. Sinagoga Neologă Sion, Strada Independenței, on the bank of the Crișul Repede (OSM way 423122948; design by
// David Busch, built 1877–1878 by Rimanóczy Kálmán the elder, Neo-Moorish; restored 2021–2023). Built after the Wikimedia
// Commons photos of the restored building (2021, 2023) and the older ones from the bridge:
//   a white rendered block 22 x 35.6 m under a heavy cornice with a blue-painted frieze; the west front has three round-arched
//   doors on the ground floor, a string course, three tall arched windows with rosette tracery, three small ornamental panels
//   under the cornice; the long sides carry the same windows in seven bays; on the roof an octagonal drum with eight arched
//   windows and a ribbed onion dome of grey zinc with a finial and the Star of David.
//   buildSynagogue(ctx) -> { footprint, clear(x, z), F, yF }
import { M4 } from '../../../../kit/mesh.js';
import { at, quad, box, skin, hole, UP } from '../../../cherkasy/slabkit.js';
import { frame, archOpening, cornice, dentils, mansard } from './kit.js';

export const SYNAGOGUE_ID = 423122948;
const RING = [[234.5, -84], [229.9, -105.6], [264.5, -113.8], [269.8, -92.4]];
const COL = { wall: '#f1f0ec', wallD: '#e3e1db', white: '#fbfaf6', blue: '#5f86b8', blueD: '#486d9c', brown: '#4a3524', zinc: '#8f8b85', roof: '#9da2a6', base: '#bdb8ae', stone: '#d9d6cd' };

export function buildSynagogue(ctx) {
  const { B, S, g, r } = ctx;
  const F = frame(RING[1], RING[0], [-1, 0]), W = F.W, f = F.face(), DEPTH = 35.6;
  const yF = Math.max(g(...RING[0]), g(...RING[1])) + 0.45, Y = (h) => yF + h;
  const gB = Math.min(...RING.map(([x, z]) => g(x, z))) - 0.7 - yF;
  for (const b of Object.values(B)) b.setXf(M4(0, yF, 0));
  const CX = W / 2, U1 = [1, 1];
  const WIN = { W: B.wall, wcol: COL.wall, dep: 0.5, frame: COL.brown, glass: '#566a78', rev: COL.white, lit: true };
  const TOP = 14.3, CORN = 14.3;

  // ------------------------------------------------------------------------------------------ the faces
  const faces = [
    { fc: f, bays: 3, side: false },
    { fc: frame(RING[1], RING[2], [0, -1]).face(), side: true },      // north long side (toward the river)
    { fc: frame(RING[2], RING[3], [1, 0]).face(), bays: 3, side: false, back: true },
    { fc: frame(RING[3], RING[0], [0, 1]).face(), side: true },       // south long side
  ];
  for (const { fc, side, bays, back } of faces) {
    const L = fc.L;
    if (side) {
      const n = 7, step = (L - 4.4) / (n - 1);
      for (let k = 0; k < n; k++) {
        const c = 2.2 + k * step;
        archOpening(B, fc, { ...WIN, s0: c - 1.3, s1: c + 1.3, y0: 4.9, yS: 9.6, rise: 1.8, mull: [c - 0.43, c + 0.43], tr: 8.2, sill: COL.stone, dep: 0.45 });
        archOpening(B, fc, { ...WIN, s0: c - 0.6, s1: c + 0.6, y0: 1.2, yS: 2.7, rise: 0.7, lit: r() < 0.5, dep: 0.3, mull: [], tr: null });
        B.det.setColor(COL.blue); box(B.det, fc, c - 0.7, c + 0.7, 12.2, 13.0, 0, 0.06, 'f'); // a small ornamental panel
        B.det.setColor(COL.white); box(B.det, fc, c - 0.78, c + 0.78, 12.1, 13.1, -0.02, 0.03, 'f');
      }
    } else {
      const sc = L / 2, off = back ? 0 : 3.7;
      for (const d of back ? [-4.5, 0, 4.5] : [-3.7, 0, 3.7]) {
        const c = sc + d;
        archOpening(B, fc, { ...WIN, s0: c - 1.35, s1: c + 1.35, y0: 4.9, yS: 9.6, rise: 1.8, mull: [c - 0.45, c + 0.45], tr: 8.2, sill: COL.stone, dep: 0.5 });
        if (!back) archOpening(B, fc, { ...WIN, s0: c - 1.05, s1: c + 1.05, y0: 0, yS: 1.9, rise: 1.1, glass: '#4a2d20', frame: '#3b2a1c', lit: false, dep: 0.4, door: true, mull: [c], tr: null, sill: null });
        else archOpening(B, fc, { ...WIN, s0: c - 0.7, s1: c + 0.7, y0: 1.2, yS: 2.8, rise: 0.8, lit: false, dep: 0.3, mull: [], tr: null });
        B.det.setColor(COL.blue); box(B.det, fc, c - 1.1, c + 1.1, 12.2, 13.0, 0, 0.06, 'f');
        B.det.setColor(COL.white); box(B.det, fc, c - 1.2, c + 1.2, 12.1, 13.1, -0.02, 0.03, 'f');
      }
      void off;
      if (!back) for (const [a, b] of [[0.3, 1.2], [L - 1.2, L - 0.3]]) { // the two flat-headed side doors at the corners
        fc.cuts.push({ s0: a, s1: b, y0: 0, y1: 2.6 });
        hole(B, fc, { s0: a, s1: b, y0: 0, y1: 2.6, dep: 0.35, frame: '#3b2a1c', glass: '#4a2d20', door: true, pitch: 1.5, rev: COL.white });
      }
    }
    skin(B.wall, fc, 0, TOP, COL.wall, U1);
    B.stone.setColor(COL.base); box(B.stone, fc, -0.1, L + 0.1, gB, 0.02, -0.06, 0.18, 'ft');
    B.det.setColor(COL.wallD); box(B.det, fc, -0.04, L + 0.04, 3.95, 4.25, 0, 0.1, 'ftu');             // the string course
    B.det.setColor(COL.white); box(B.det, fc, -0.04, L + 0.04, 4.25, 4.45, 0, 0.04, 'f');
    // the frieze under the cornice (blue band with a white dentil row) and the cornice itself
    B.det.setColor(COL.blue); box(B.det, fc, -0.3, L + 0.3, 13.55, 14.3, 0, 0.45, 'f');
    dentils(B.det, fc, 0.0, L, 13.25, 0.3, 0.46, COL.white, 0.7);
    cornice(B.det, fc, -0.55, L + 0.55, CORN, 1.1, 0, 1.15, COL.white, 0.8);
    B.det.setColor(COL.white); box(B.det, fc, -0.4, L + 0.4, CORN + 1.1, CORN + 1.35, 0.25, 0.9, 'ftu');
  }
  // the west front: pilaster strips either side of the three bays, three steps up to the doors
  B.det.setColor(COL.white);
  for (const s of [1.6, W - 1.6]) box(B.det, f, s - 0.3, s + 0.3, 0.0, TOP, 0, 0.14, 'ftlr');
  B.stone.setColor('#cfcac0');
  for (let i = 0; i < 3; i++) box(B.stone, f, CX - 6.2 - i * 0.2, CX + 6.2 + i * 0.2, gB, 0.45 - i * 0.15, 0.04, 0.55 + (i + 1) * 0.4, 'ft');

  // ------------------------------------------------------------------------------------------ roof, drum and dome
  const ring = [RING[1], RING[0], RING[3], RING[2]];
  mansard(B.roof, ring, [[0.1, 15.5], [2.2, 15.9]], COL.roof);
  const [dx, dz] = F.toMap(CX, -11.9), yb = 15.9, R8 = 5.1;
  B.wall.setColor(COL.wall).lathe([[R8 + 0.5, yb], [R8 + 0.5, yb + 0.5], [R8, yb + 0.6], [R8, yb + 3.2], [R8 + 0.3, yb + 3.4]], 8, dx, dz);
  B.det.setColor(COL.blue).lathe([[R8 + 0.1, yb + 0.9], [R8 + 0.1, yb + 1.0], [R8, yb + 1.0]], 8, dx, dz);
  B.det.setColor(COL.white).lathe([[R8 + 0.45, yb + 3.2], [R8 + 0.6, yb + 3.5], [R8 + 0.55, yb + 3.8], [R8 + 0.1, yb + 3.8]], 8, dx, dz);
  for (let k = 0; k < 8; k++) { // arched windows on the drum's eight faces
    const a = Math.PI / 8 + (k * Math.PI) / 4, ca = Math.cos(a), sa = Math.sin(a), ap = R8 * Math.cos(Math.PI / 8) + 0.02;
    const fx = dx + ca * ap, fz = dz + sa * ap, yaw = -Math.atan2(sa, ca) + Math.PI / 2;
    B.lit.setColor('#ffd9a0');
    B.lit.with(M4(fx, yb + 1.4, fz, yaw), (q) => { q.face([[-0.55, 0, 0], [0.55, 0, 0], [0.55, 1.4, 0], [0.35, 1.9, 0], [0, 2.1, 0], [-0.35, 1.9, 0], [-0.55, 1.4, 0]], [0, 0, 1]); });
    B.det.setColor(COL.brown);
    B.det.with(M4(fx, yb + 1.4, fz, yaw), (q) => { q.box(-0.6, 0, 0.0, -0.5, 1.5, 0.05, 63); q.box(0.5, 0, 0.0, 0.6, 1.5, 0.05, 63); q.box(-0.06, 0, 0.0, 0.06, 2.0, 0.06, 63); });
  }
  const yd = yb + 3.8;
  // the dome: a bulbous, ribbed-looking dome of weathered grey zinc, a little wider than the drum, a lantern and a spire with
  // the Star of David (the 2021 photos): about 7 m high on a 10 m drum
  B.wall.setColor('#8f8a82').lathe([[R8 + 0.15, yd], [R8 + 0.7, yd + 0.25], [R8 + 0.95, yd + 0.9], [R8 + 1.0, yd + 1.9], [R8 + 0.8, yd + 3.0], [R8 + 0.35, yd + 4.0], [R8 - 0.7, yd + 5.0], [R8 - 2.0, yd + 5.8], [R8 - 3.3, yd + 6.4], [R8 - 4.2, yd + 6.75], [0.4, yd + 6.95]], 16, dx, dz);
  B.det.setColor('#6c6862');
  B.det.cyl(dx, yd + 6.9, dz, 0.4, 0.26, 0.5, 10, true); B.det.tube([dx, yd + 7.35, dz], [dx, yd + 8.6, dz], 0.06, 6);
  for (const a of [Math.PI / 2, Math.PI / 2 + Math.PI / 3, Math.PI / 2 - Math.PI / 3]) B.det.tube([dx + Math.cos(a) * 0.4, yd + 8.9 + Math.sin(a) * 0.4, dz], [dx - Math.cos(a) * 0.4, yd + 8.9 - Math.sin(a) * 0.4, dz], 0.025, 4);
  for (const b of Object.values(B)) b.setXf(null);

  // ------------------------------------------------------------------------------------------ night wash and collision
  for (const d of [-5.5, 5.5]) { const [x, z] = F.toMap(CX + d, 2.8); ctx.wash.push([x, g(x, z) + 0.5, z]); }
  S.prism(ring.flat(), yF + gB, Y(15.9), 0, 0, 'wall', 0);
  S.cyl(dx, dz, Y(15.9), Y(20), R8, R8, 'wall');
  return {
    footprint: { poly: RING.map(([x, z]) => [x, z]), h: 27, kind: 'church', name: 'Sinagoga Neologă Sion', id: SYNAGOGUE_ID },
    clear: (x, z) => { const [s, o] = F.toLocal(x, z); return s > -9 && s < W + 9 && o > -DEPTH - 3 && o < 16; },
    F, yF,
  };
}
void at; void quad; void UP;
