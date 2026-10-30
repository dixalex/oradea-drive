// OWNER: oradea. Aquapark Nymphaea (Aleea Ștrandului 13B, Oradea; opened 2016, run by the city): the main building by the Crișul Repede
// bank – OSM way 779281928, a long lobby block along the car park with a round part behind it. Built after the Google Street View panorama
// from the car-park road (the north side) and the Bing aerial (the plan, the petals):
//   the lobby block: a brown brick base with rust-brown piers every bay and a band of glazing over it, a dark flat roof; behind it the round
//   hall under a shallow, ribbed, translucent dome (about 27 m radius, 11 m rise, apex ~18 m over the ground) on a drum, and round the dome's
//   south half seven white lotus-petal canopies that lean against the drum and fall to the lawn – the "petals" the pools sit between.
//   The petal curves, the dome's rise and the drum's height are read off the aerial and a single north view (no south photo found): a guess.
//   Slides, pools, the Olympic pool hall and the sun shells are not built (generic or absent).
//   buildNymphaea(ctx) -> { footprints, clear(x, z), stats }      NYMPH_ROWS: the atlas strips (ng brick base, n1 glazed band)
import { M4 } from '../../../../kit/mesh.js';
import { ringFaces } from '../../../cherkasy/slabkit.js';
import { frame, PI } from './kit.js';
import { glassRect } from './bays.js';
import { bayWall } from './walls.js';
import { inside, upN } from './rects.js';

export const NYMPH_ID = 779281928;
export const NYMPH_RING = [[1589.7, -719.2], [1712.2, -722.1], [1714.4, -717.4], [1714.7, -712.5], [1714.5, -707.2], [1709.4, -691.8], [1704.5, -681.9], [1687.0, -682.6], [1686.4, -671.3], [1681.1, -663.8], [1673.2, -654.8], [1661.3, -650.3], [1649.7, -652.0], [1640.1, -654.8], [1631.8, -664.1], [1628.2, -673.2], [1628.3, -683.4]];
const CX = 1657, CZ = -677, RD = 27.5, DECK = 7.5, RISE = 11;
const COL = { brick: '#7d4c3a', pier: '#5f3629', dark: '#33363a', white: '#f3f3ef', glass: '#d3e2e8' };

function paintB(g, x, y, w, h, i, r) {
  g.fillStyle = COL.brick; g.fillRect(x, y, w, h);
  for (let yy = y + 3; yy < y + h; yy += 3) { g.fillStyle = 'rgba(40,22,14,0.16)'; g.fillRect(x, yy, w, 1); }
  for (let k = 0; k < 60; k++) { g.fillStyle = r() < 0.5 ? 'rgba(255,220,190,0.08)' : 'rgba(30,16,10,0.12)'; g.fillRect(x + r() * w, y + r() * h, 3 + r() * 6, 2); }
  g.fillStyle = COL.pier; g.fillRect(x, y, 7, h); g.fillRect(x + w - 7, y, 7, h);
  return [];
}
function paintU(g, x, y, w, h, i, r) {
  g.fillStyle = COL.dark; g.fillRect(x, y, w, h);
  const pw = (w - 14) / 3;
  for (let k = 0; k < 3; k++) glassRect(g, x + 7 + k * pw + 2, y + 6, pw - 4, h - 12, '#93aab5', '#3d4f59');
  g.fillStyle = COL.pier; g.fillRect(x, y, 7, h); g.fillRect(x + w - 7, y, 7, h);
  return [[x + 9, y + 6, w - 18, h - 12]];
}
export const NYMPH_ROWS = [{ name: 'ng', h: 4.8, paint: paintB }, { name: 'n1', h: 2.4, paint: paintU }];

export function buildNymphaea(ctx) {
  const { B, S, g, bays } = ctx, P = NYMPH_RING, n = P.length, faces = ringFaces(P);
  const gs = P.map(([x, z]) => g(x, z)), yT = Math.max(...gs) + 0.1, gLow = Math.min(...gs) - 0.4 - yT;
  for (const b of Object.values(B)) b.setXf(M4(0, yT, 0));
  const stats = { bays: 0, petals: 7 };
  const spec = { rows: [['ng', 0.3, 5.1], ['n1', 5.1, 7.5]], gaps: [[7.5, 8.0]], wall: COL.dark, plinth: [0.3, '#8a8782'], trim: COL.dark, strings: [], cornice: [7.4, 0.8] };
  for (const i of [0, 1, 2, 3, 4, 5, 6, 16]) {
    const a = P[i], b = P[(i + 1) % n], fc = faces[i];
    stats.bays += bayWall({ B, bays, gLow }, frame(a, b, [fc.nx, fc.nz]), spec, false);
  }
  // the roof deck, then the round hall: a white drum, the ribbed translucent dome with its ring beam and oculus
  B.det.setColor('#4a4c50'); B.det.fill(P, [], 7.7, true);
  B.det.setColor('#eeeeea'); B.det.cyl(CX, gLow, CZ, RD + 0.4, RD + 0.4, DECK - gLow + 0.4, 36, false);
  B.det.setColor('#d9dad6'); B.det.cyl(CX, DECK - 0.1, CZ, RD + 0.9, RD + 0.9, 0.6, 36, true);
  const Rs = (RD * RD + RISE * RISE) / (2 * RISE), phiMax = Math.asin(RD / Rs);
  const prof = []; for (let k = 0; k <= 12; k++) { const ph = phiMax * (1 - k / 12) * 1; prof.push([Rs * Math.sin(ph) + (k === 12 ? 0.04 : 0), DECK + 0.4 + Rs * (Math.cos(ph) - Math.cos(phiMax))]); }
  B.glass.setColor(COL.glass); B.glass.lathe(prof, 36, CX, CZ);
  // the ribs: 16 meridians and three rings
  const pt = (ph, th, d = 0.0) => [CX + Math.cos(th) * (Rs + d) * Math.sin(ph), DECK + 0.4 + Rs * (Math.cos(ph) - Math.cos(phiMax)) + (Math.cos(ph) * d), CZ + Math.sin(th) * (Rs + d) * Math.sin(ph)];
  B.det.setColor(COL.white);
  for (let m = 0; m < 16; m++) { const th = m / 16 * PI * 2; for (let k = 0; k < 5; k++) B.det.tube(pt(phiMax * (1 - k / 5), th, 0.12), pt(phiMax * (1 - (k + 1) / 5), th, 0.12), 0.16, 4, false); }
  for (const f of [0.35, 0.65, 0.9]) { const ph = phiMax * f, rr = Rs * Math.sin(ph) + 0.1, yy = DECK + 0.4 + Rs * (Math.cos(ph) - Math.cos(phiMax)); B.det.cyl(CX, yy - 0.12, CZ, rr, rr, 0.24, 36, false); }
  B.det.cyl(CX, DECK + RISE + 0.1, CZ, 1.6, 1.6, 0.5, 12, true);
  // seven petals on the south half: a shell from the drum (5.6 m up) out to the lawn
  for (let k = 0; k < 7; k++) {
    const th = k * PI / 6, ux = Math.cos(th), uz = Math.sin(th), tx = -uz, tz = ux, NT = 6, NV = 4;
    const grid = [];
    for (let i = 0; i <= NT; i++) {
      const t = i / NT, rr = 41 - 13.2 * t, yy = 0.4 + 5.4 * Math.pow(t, 1.45), w = 7.4 * Math.pow(t, 0.55) * (1 - 0.2 * t) + 0.2, row = [];
      for (let j = 0; j <= NV; j++) { const v = -1 + 2 * j / NV; row.push([CX + ux * rr + tx * v * w, yy + 0.7 * (1 - v * v) * t, CZ + uz * rr + tz * v * w]); }
      grid.push(row);
    }
    for (let i = 0; i < NT; i++) for (let j = 0; j < NV; j++) {
      const q = [grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]];
      B.det.setColor((i + j) % 2 ? '#f6f6f2' : '#ecece7'); B.det.face(q, upN(q[0], q[1], q[2]));
    }
  }
  for (const b of Object.values(B)) b.setXf(null);
  S.prism(P.flat(), yT + gLow, yT + 8.0, 0, 0, 'wall', 0);
  S.cyl(CX, CZ, yT + gLow, yT + DECK + 0.5, RD + 0.5, RD + 0.5, 'wall', 0);
  stats.yT = yT;
  return { footprints: [{ poly: P, h: 8 + RISE, kind: 'sport', name: 'Aquapark Nymphaea', id: NYMPH_ID }], stats, clear: (x, z) => inside(P, x, z) || Math.hypot(x - CX, z - CZ) < 30 };
}
