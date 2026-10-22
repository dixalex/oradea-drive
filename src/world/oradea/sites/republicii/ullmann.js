// OWNER: oradea. Palatul Ullmann (Parcul 1 Decembrie, 1913, Löbl Ferenc), not a site module: the Viennese-Secession palace on the
// south side of the park (the old Nagyvásár square) – NOT by the river –, four storeys on OSM way 423122934 (OSM draws nine).
// The 77 m front looks north into the park: turquoise-green faience on the ground floor under big clipped-corner openings, lighter
// tiles on the first floor, pale sage plaster above, two semicircular bow windows (two storeys, white colonnettes, the relief
// frieze) crowned with balconies and cut-top gables, four central axes of tall windows with iron balconies and rosettes, attic
// dormers, three round cupolas on the roof. The wings behind it are a guess (the same bays).
//   ULL_ID = 423122934;  ullmann(ctx, b) -> { footprint, top, floor, lots }   ctx as assembleBuilding's (K is the palace's own kit)
// Sources: hu.wikipedia Ullmann-palota, Wikimedia Commons photographs (2012).
import { assembleBuilding } from './building.js';
import { gable, cupola, dormer, faceBetween } from './herokit.js';
import { face, at, quad } from '../../../cherkasy/slabkit.js';
import { aq } from './facade.js';
import { DP } from '../../../materials.js';

export const ULL_ID = 423122934;
const BOW_R = 3.0, WALL = '#cdd6bd';

const GABLE = [[0, 0], [4, 0], [4, 0.8], [3.5, 1.2], [3.5, 2.0], [2.7, 2.6], [2.0, 3.2], [1.3, 2.6], [0.5, 2.0], [0.5, 1.2], [0, 0.8]];

const SPEC = {
  name: 'Palatul Ullmann', n: 4, styles: ['ull'], cols: [[WALL, '#ece6d4']], roof: '#6b7774', rise: 2.2, depth: 3.0,
  allPublic: true, kind: 'apt',
  lotDefaults: { style: 'ull', n: 4, gate: -1, entry: -1, balc: null, gcell: 'g.ull', piers: false },
  lots: [{ w: 21.2 }, { w: 8.0, bow: 1 }, { w: 18.5, style: 'ullc', nb: 4, gcell: 'g.ullc', balc: [{ j: 1, bays: 'all', rail: 'B' }, { j: 2, bays: 'all', rail: 'C' }] }, { w: 8.0, bow: 1 }, {}],
  after({ K, E, Hcap, depth, rnd }) {
    const e = E[1], f = face(e.B, e.A, e.nx, e.nz), D = K.det, lots = e.lots, gh = 4.6, sh = 3.95;
    const palId = lots[0].spec.pal, surfOf = (l) => (o) => l.He + 0.12 + (l.Hl - l.He - 0.12) * Math.min(1, o / depth);
    const sOf = (l) => (1 - (l.a + l.b) / 2) * e.L;
    lots.forEach((l, k) => {
      const sc = sOf(l);
      if (SPEC.lots[k]?.bow) {
        // ---- the bow: a half n-gon of eight facets over the two upper storeys, a soffit under it, a balcony and rail on top
        const yb = l.floor + gh, yt = l.floor + gh + 2 * sh, P = [], c0 = K.uv('ull.frieze'), band = { u0: c0.u0, u1: c0.u1, v0: c0.v0 + (c0.v1 - c0.v0) * 0.3, v1: c0.v0 + (c0.v1 - c0.v0) * 0.62 };
        for (let i = 0; i <= 8; i++) { const ph = (Math.PI * i) / 8, p = at(f, sc - BOW_R * Math.cos(ph), yb, BOW_R * Math.sin(ph)); P.push([p[0], p[2]]); }
        for (let i = 0; i < 8; i++) {
          const fb = faceBetween(P[i], P[i + 1]);
          aq(K, fb, 0, fb.L, yb, yb + sh - 0.5, 0, 'ull.bowF', rnd(), palId);
          aq(K, fb, 0, fb.L, yb + sh - 0.5, yb + sh + 0.5, 0.03, band, rnd(), palId);
          aq(K, fb, 0, fb.L, yb + sh + 0.5, yt, 0, 'ull.bowF', rnd(), palId);
        }
        D.setPart(DP.PAINT).setColor('#e4dfcc');
        D.face(P.map((p) => [p[0], yb - 0.02, p[1]]), [0, -1, 0]);
        // balcony: slab + skirt on a ring 0.3 m wider, then the rail
        const Q = [];
        for (let i = 0; i <= 8; i++) { const ph = (Math.PI * i) / 8, p = at(f, sc - (BOW_R + 0.3) * Math.cos(ph), 0, (BOW_R + 0.3) * Math.sin(ph)); Q.push([p[0], p[2]]); }
        D.setPart(DP.PAINT).setColor('#ece6d4');
        D.face(Q.map((p) => [p[0], yt + 0.1, p[1]]), [0, 1, 0]);
        for (let i = 0; i < 8; i++) {
          const fq = faceBetween(Q[i], Q[i + 1]);
          quad(D, at(fq, 0, yt - 0.2, 0), at(fq, fq.L, yt - 0.2, 0), at(fq, fq.L, yt + 0.1, 0), at(fq, 0, yt + 0.1, 0), fq.N);
          aq(K, fq, 0, fq.L, yt + 0.1, yt + 1.05, 0.02, 'rail.C', 0.9, palId);
        }
        gable(K, f, sc, l.He + 0.12, 4.0, 3.2, GABLE, 'gable.ull', rnd(), palId, 0.04);
        const c = at(f, sc, 0, depth + 2.4);
        cupola(D, c[0], c[2], Hcap - 0.1, 1.0, 1.3);
      }
      // ---- attic dormers on the main front
      const n = k === 2 || SPEC.lots[k]?.bow ? 0 : 2, w = (l.b - l.a) * e.L, surf = surfOf(l);
      for (let i = 0; i < n; i++) dormer(K, f, (1 - l.b) * e.L + (w * (i + 0.5)) / n, 1.3, 1.5, 1.1, surf(1.1) - 0.2, 'dorm.ull', rnd(), palId, surf, '#6b7774', WALL);
    });
    const c = lots[2], p = at(f, sOf(c), 0, depth + 2.4);
    cupola(D, p[0], p[2], Hcap - 0.1, 1.0, 1.3);
  },
};

export function ullmann(ctx, b) { return assembleBuilding(ctx, { ...b, spec: SPEC }); }
