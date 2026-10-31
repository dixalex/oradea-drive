// OWNER: oradea. Casa Kováts (Piața Unirii 5, OSM way 6481082), not a site module: the neoclassical civic house given its present look
// when it was rebuilt after the great fire of 1836 (a pharmacy, the Hala café, a savings bank in its time; restored 2010–2011).
// A closed block round a yard (the OSM hole), two storeys under a big hipped terracotta roof; the 60 m front on the square is
// thirteen axes: four, a central portico of six giant white pilasters under a pediment (five axes, the arched gateway of the
// entrance passage in the fourth), four; pale-yellow render, white frames, lunettes over the ground-floor openings, dark red timber.
//   KOVATS_ID = 6481082;  kovats(ctx, b) -> { footprint, top, floor, lots }
// Sources: oradeaheritage.ro (Casa Kováts), Wikimedia Commons photographs (Kovats House, 2013) and the Oradea Heritage gallery. The
// passage's coffered half-round vault is inside the block and not modelled (the gate is closed in all photographs); the east, south
// and west fronts and the yard are guesses on the same axes.
import { assembleBuilding } from './assemble.js';
import { face, at } from '../../../cherkasy/slabkit.js';
import { aq, dbox } from '../republicii/facade.js';
import { gable } from '../republicii/herokit.js';
import { ringOf } from '../republicii/ring.js';
import { DP } from '../../../materials.js';
import { KV } from './cells-kovats.js';

export const KOVATS_ID = 6481082;
const GH = 4.8, SH = 4.6, AXW = 4.65, WHITE = KV.trim;

// tokens: a an axis, p a portico axis, q the gateway (in the portico); no layout: as many axes as fit
function tokens(def, L) { return def.layout ? def.layout.split(' ') : Array(Math.max(1, Math.round(L / AXW))).fill('a'); }

function dressKv(K, f, s0, s1, floorY, spec, rnd, l) {
  const palId = spec.pal, n = spec.n, gh = GH, sh = SH, He = floorY + gh + (n - 1) * sh, L = s1 - s0, toks = tokens(l.def ?? {}, L), aw = L / toks.length;
  let porch = null;
  toks.forEach((t, i) => {
    const a = s0 + i * aw, b = a + aw;
    aq(K, f, a, b, floorY, floorY + gh, 0, t === 'q' ? 'kv.gate' : i % 2 ? 'kv.gd' : 'kv.g', rnd(), palId);
    for (let j = 1; j < n; j++) aq(K, f, a, b, floorY + gh + (j - 1) * sh, floorY + gh + j * sh, 0, 'kv.f', rnd(), palId);
    if (t === 'p' || t === 'q') porch = porch ? { a: porch.a, b } : { a, b };
  });
  dbox(K, f, s0, s1, floorY - 1.1, floorY + 0.02, 0, 0.06, 'f', '#a9a086', DP.CONC);
  dbox(K, f, s0, s1, floorY + gh - 0.12, floorY + gh + 0.12, 0, 0.1, 'ft', WHITE);
  dbox(K, f, s0, s1, He - 0.7, He - 0.4, 0, 0.16, 'f', WHITE);
  dbox(K, f, s0 - 0.03, s1 + 0.03, He - 0.4, He - 0.12, 0, 0.5, 'fu', WHITE);
  dbox(K, f, s0 - 0.06, s1 + 0.06, He - 0.12, He + 0.12, 0, 0.78, 'ftu', WHITE);
  l.info = { porch, He };
  if (porch) { // six giant pilasters with plain capitals
    const w = porch.b - porch.a;
    for (let k = 0; k <= 5; k++) { const s = porch.a + (w * k) / 5; dbox(K, f, s - 0.3, s + 0.3, floorY, He - 0.7, 0, 0.3, 'flrt', WHITE); dbox(K, f, s - 0.36, s + 0.36, He - 1.1, He - 0.7, 0, 0.36, 'flrt', WHITE); dbox(K, f, s - 0.36, s + 0.36, floorY, floorY + 0.5, 0, 0.36, 'flrt', WHITE); }
  }
}

const SPEC = {
  name: 'Casa Kováts', n: 2, styles: ['kv'], cols: [[KV.wall, KV.trim]], roof: KV.roof, rise: 5.2, depth: 9.0, fall: 1.4, cap: '#8c4630',
  allPublic: true, kind: 'apt', dress: dressKv,
  edges: { 0: [{ layout: 'a a a a p p p q p a a a a', n: 2 }] },
  sideLot: { n: 2 },
  after({ K, pieces, rnd }) {
    for (const l of pieces) {
      if (!l.info?.porch) continue;
      const e = l.e, f = face(e.B, e.A, e.nx, e.nz), { porch, He } = l.info, w = porch.b - porch.a + 1.0, sc = (porch.a + porch.b) / 2, h = 3.1, palId = l.spec.pal;
      gable(K, f, sc, He + 0.12, w, h, [[0, 0], [w, 0], [w / 2, h]], 'kv.pedi', rnd(), palId, 0.04);
      const D = K.det; D.setPart(DP.PAINT).setColor(WHITE);
      D.tube(at(f, sc - w / 2, He + 0.2, 0.12), at(f, sc, He + 0.12 + h, 0.12), 0.11, 5); D.tube(at(f, sc + w / 2, He + 0.2, 0.12), at(f, sc, He + 0.12 + h, 0.12), 0.11, 5);
    }
  },
};
export function kovats(ctx, b) { return assembleBuilding(ctx, { id: b.id, ring: ringOf(b.p), holes: (b.holes ?? []).map(ringOf), spec: SPEC }); }
