// OWNER: oradea. Palatul Moskovits Adolf și Fiii (Str. Vasile Alecsandri 1, OSM way 6481080), not a site module: the Vágó brothers'
// Secession palace on the corner of Piața Unirii, built for the milling and trading family in two stages in the early 1910s
// (sources give 1904–1905, 1910 and a 1912 design). Three floors over a tall grey ground floor; white render with narrow golden-oak
// windows, columns and lattice panels of green and yellow ceramic tiles, a black-line sgraffito frieze (millers, sacks, barrels) under
// the cornices, gold-painted geometric iron balconies, two shallow four-window bows on the square front, each under a triangular
// attic with a half-round window, a big rounded corner, a grey slate roof.
//   ADOLF_ID = 6481080;  adolf(ctx, b) -> { footprint, top, floor, lots }   ctx as assemble.js's
// Sources: oradeaheritage.ro (Palatul Moskovits Adolf și fii), arhitectura-1906.ro, photographs of 2018 and 2021 (the render was being
// restored under scaffolding: today's colours are read from those). The ground floor is a guess behind the shopfronts (no shop names);
// the courtyard, the south side and the party wall are plain guesses; the axis rhythm is counted from the square-front photographs.
import { assembleBuilding } from './assemble.js';
import { face, at, quad } from '../../../cherkasy/slabkit.js';
import { aq, dbox } from '../republicii/facade.js';
import { gable, faceBetween } from '../republicii/herokit.js';
import { DP } from '../../../materials.js';
import { MA } from './cells-adolf.js';
import { fillet, zwerch } from './kit.js';
import { ringOf } from '../republicii/ring.js';

export const ADOLF_ID = 6481080;
const GH = 4.8, SH = 3.9, PIER = 0.9, ORIEL = 6.8, BOW = 5.0;
const TRIM = MA.trim;

// the footprint with its north-west corner rounded (OSM draws it sharp): the arc replaces vertex 3
export function adolfRing(flat) {
  const P = []; for (let i = 0; i < flat.length; i += 2) P.push([flat[i], flat[i + 1]]);
  const arc = fillet(P[2], P[3], P[4], 6.4, 8);
  return { ring: [P[0], P[1], P[2], ...arc, P[4], P[5]], arc: arc.length };
}

// widths of a lot's tokens: P pier, O oriel, a / b / G axes (b: balconies, G: the courtyard gate) share what is left
function layout(def, L) {
  const toks = (def.layout ?? 'a').split(' '), fixed = toks.reduce((s, t) => s + (t === 'P' ? PIER : t === 'O' ? ORIEL : 0), 0), nAx = toks.filter((t) => 'abG'.includes(t)).length;
  const aw = nAx ? (L - fixed) / nAx : 0;
  return toks.map((t) => ({ t, w: t === 'P' ? PIER : t === 'O' ? ORIEL : aw }));
}

// one run of a front on the frame f between s0 and s1 (s to the viewer's right): ground floor, storeys, mouldings, balconies, frieze
function dressAdolf(K, f, s0, s1, floorY, spec, rnd, l) {
  const n = spec.n, palId = spec.pal, gh = spec.gh ?? GH, sh = spec.sh ?? SH, He = floorY + gh + (n - 1) * sh, L = s1 - s0;
  const toks = layout(l.def ?? {}, L);
  l.info = { bows: [] };
  const runs = []; let s = s0, k = 0, run = null, ax = 0;
  for (const { t, w } of toks) {
    const a = s, b = s + w; s = b;
    const isO = t === 'O';
    if (isO) { l.info.bows.push({ sc: (a + b) / 2, w: BOW }); run = null; } else { if (!run) { run = { a, b }; runs.push(run); } else run.b = b; }
    // ground floor
    const gcell = t === 'P' ? 'ma.gp' : t === 'G' ? 'ma.gate' : 'ma.g';
    aq(K, f, a, b, floorY, floorY + gh, 0, gcell, rnd(), palId);
    for (let j = 1; j < n; j++) {
      const y0 = floorY + gh + (j - 1) * sh, y1 = y0 + sh;
      if (t === 'P') { aq(K, f, a, b, y0, y1, 0, 'ma.pier', rnd(), palId); continue; }
      if (isO) { // a blank wall behind the bow, a tile strip at each end
        aq(K, f, a + PIER, b - PIER, y0, y1, 0, 'ma.blank', rnd(), palId);
        aq(K, f, a, a + PIER, y0, y1, 0, 'ma.pier', rnd(), palId); aq(K, f, b - PIER, b, y0, y1, 0, 'ma.pier', rnd(), palId);
        continue;
      }
      const bal = t === 'b' && j <= 2;
      const cell = j === 1 ? (bal ? 'ma.nobileB' : 'ma.nobile') : j === n - 1 ? ((ax + k) % 3 === 0 ? 'ma.topB' : 'ma.top') : (bal ? 'ma.regB' : 'ma.reg');
      aq(K, f, a, b, y0, y1, 0, cell, rnd(), palId);
      if (bal) { // an iron balcony on a thin slab: the gold rail, two returns
        const y = y0 + 0.02, ba = a + (b - a) / 2 - 1.1, bb = a + (b - a) / 2 + 1.1, out = 0.8;
        dbox(K, f, ba, bb, y - 0.2, y + 0.02, 0, out, 'ftulr', TRIM);
        aq(K, f, ba, bb, y + 0.02, y + 0.98, out - 0.04, 'rail.G', 0.9, palId, 1);
      }
    }
    if (t !== 'P' && t !== 'O') ax++;
    k++;
  }
  // mouldings run between the oriels: the plinth, the cap of the ground floor, string courses, the eaves cornice and the frieze
  for (const r of runs) {
    dbox(K, f, r.a, r.b, floorY - 1.1, floorY + 0.02, 0, 0.06, 'f', MA.greyD, DP.CONC);
    dbox(K, f, r.a, r.b, floorY + gh - 0.1, floorY + gh + 0.26, 0, 0.16, 'ft', '#d8dadb');
    for (let j = 2; j < n; j++) dbox(K, f, r.a, r.b, floorY + gh + (j - 1) * sh - 0.05, floorY + gh + (j - 1) * sh + 0.05, 0, 0.05, 'f', TRIM);
    dbox(K, f, r.a, r.b, He - 0.55, He - 0.3, 0, 0.14, 'f', TRIM);
    dbox(K, f, r.a - 0.02, r.b + 0.02, He - 0.3, He - 0.05, 0, 0.4, 'fu', TRIM);
    dbox(K, f, r.a - 0.04, r.b + 0.04, He - 0.05, He + 0.14, 0, 0.55, 'ftu', TRIM);
    const w = r.b - r.a, np = Math.max(1, Math.round(w / 7.2));
    for (let q = 0; q < np; q++) aq(K, f, r.a + (w * q) / np, r.a + (w * (q + 1)) / np, He - 1.6, He - 0.58, 0.012, 'ma.frieze', rnd(), palId);
  }
}

// the rounded corner: grey ground floor, blank white storeys, the sgraffito figures high on the top floor
function dressCorner(K, f, s0, s1, floorY, spec, rnd, l, e) {
  const n = spec.n, palId = spec.pal, gh = spec.gh ?? GH, sh = spec.sh ?? SH, He = floorY + gh + (n - 1) * sh;
  aq(K, f, s0, s1, floorY, floorY + gh, 0, 'ma.cg', rnd(), palId);
  for (let j = 1; j < n; j++) aq(K, f, s0, s1, floorY + gh + (j - 1) * sh, floorY + gh + j * sh, 0, j === n - 1 ? `ma.cf${e.i % 3}` : 'ma.cw', rnd(), palId);
  dbox(K, f, s0, s1, floorY - 1.1, floorY + 0.02, 0, 0.06, 'f', MA.greyD, DP.CONC);
  dbox(K, f, s0, s1, floorY + gh - 0.1, floorY + gh + 0.26, 0, 0.16, 'f', '#d8dadb');
  for (let j = 2; j < n; j++) { const y = floorY + gh + (j - 1) * sh; dbox(K, f, s0, s1, y - 0.05, y + 0.05, 0, 0.05, 'f', TRIM); }
  dbox(K, f, s0 - 0.01, s1 + 0.01, He - 0.55, He - 0.1, 0, 0.2, 'f', TRIM);
  dbox(K, f, s0 - 0.03, s1 + 0.03, He - 0.1, He + 0.12, 0, 0.5, 'ftu', TRIM);
}

const SPEC = (arcN) => {
  const t0 = 3, tower = Array.from({ length: arcN - 1 }, (_, i) => t0 + i);       // the arc's edges in the cleaned ring
  return {
    name: 'Palatul Moskovits Adolf și Fiii', n: 4, styles: ['ma'], cols: [[MA.wall, TRIM]], roof: MA.slate, rise: 6.0, depth: 8.0, fall: 1.4, cap: '#5e6468',
    allPublic: true, kind: 'apt', tower, towerSpec: { style: 'ma', n: 4, gh: GH, sh: SH },
    dressTower: dressCorner, dress: dressAdolf,
    // edge index in the cleaned ring (see adolfRing): 0 south part of the square front, 1 the 1 m jog, 2 the north part, arc 3.., then the Alecsandri front, the party wall, the south side
    dressed: (i) => (i === 1 ? false : undefined),
    edges: {
      0: [{ layout: 'b O b', n: 4, gh: GH, sh: SH, balc: null }],
      2: [{ layout: 'b O b a b a', n: 4, gh: GH, sh: SH }],
      [3 + arcN - 1]: [{ layout: 'P a b a G a b P', n: 4, gh: GH, sh: SH }],          // Alecsandri street, east -> west
      [5 + arcN - 1]: [{ layout: 'P a a a a a a P', n: 4, gh: GH, sh: SH }],          // the south side (guess)
    },
    after({ K, E, Hcap, depth, pieces, rnd }) {
      const palId = pieces.find((p) => p.spec)?.spec.pal ?? 0;
      for (const l of pieces) {
        if (!l.info?.bows.length) continue;
        const e = l.e, f = face(e.B, e.A, e.nx, e.nz), D = K.det, gh = GH, sh = SH;
        for (const { sc } of l.info.bows) {
          const yb = l.floor + gh, yt = l.He, P = [];
          for (let i = 0; i <= 4; i++) { const p = at(f, sc - BOW / 2 + (BOW * i) / 4, yb, 0.9 * (1 - Math.pow((i - 2) / 2, 2))); P.push([p[0], p[2]]); }
          for (let i = 0; i < 4; i++) {
            const fb = faceBetween(P[i], P[i + 1]);
            for (let j = 0; j < 3; j++) aq(K, fb, 0, fb.L, yb + j * sh, yb + (j + 1) * sh, 0, 'ma.bf', rnd(), palId);
          }
          D.setPart(DP.PAINT).setColor('#d8dadb'); D.face(P.map((p) => [p[0], yb - 0.02, p[1]]), [0, -1, 0]);        // the soffit
          D.setColor(TRIM); D.face(P.map((p) => [p[0], yt + 0.05, p[1]]), [0, 1, 0]);                                // the cap
          const Q = []; for (let i = 0; i <= 4; i++) { const p = at(f, sc - BOW / 2 - 0.12 + ((BOW + 0.24) * i) / 4, 0, 0.98 * (1 - Math.pow((i - 2) / 2, 2)) + 0.06); Q.push([p[0], p[2]]); }
          for (let i = 0; i < 4; i++) { const fq = faceBetween(Q[i], Q[i + 1]); quad(D, at(fq, 0, yt - 0.3, 0), at(fq, fq.L, yt - 0.3, 0), at(fq, fq.L, yt + 0.12, 0), at(fq, 0, yt + 0.12, 0), fq.N); }
          const w = 7.8, h = 4.9, surf = (o) => l.He + 0.12 + (l.Hl - l.He - 0.12) * Math.min(1, o / depth);
          gable(K, f, sc, l.He + 0.1, w, h, [[0, 0], [w, 0], [w / 2, h]], 'ma.gable', rnd(), palId, 0.05);
          zwerch(K, f, sc, l.He + 0.1, w, h, surf, depth, MA.slate);
        }
      }
    },
  };
};

// b: the map_buildings.json entry ({ id, p, holes })
export function adolf(ctx, b) { const { ring, arc } = adolfRing(b.p); return assembleBuilding(ctx, { id: b.id, ring, holes: (b.holes ?? []).map(ringOf), spec: SPEC(arc) }); }
