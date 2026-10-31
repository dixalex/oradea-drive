// OWNER: oradea. The Strada Vasile Alecsandri row as facade lots (not a site module), on the OSM footprints, each lot a readings of the
// building's style (no photographs of these fronts were found; the lots are pinned by house number, frontage width and the heritage
// texts of arhitectura-1906.ro, oradeaheritage.ro and the city's Vasile Alecsandri page):
//   south side (odd numbers, from the square): OSM 21059343 holds No. 3 Casa Roth (1912, Mende Valér, Art Nouveau), No. 5 and No. 7
//   Casa Munk (1893–94, a bazaar passage to Gen. Moșoiu); 21059342 No. 9 Casa Rendes Vilmos (1903–04, neo-Renaissance: grey rusticated
//   ground floor, yellow upper floors, garlands under the cornice); 423122936 No. 13 Casa Amant (classicist, once a hotel);
//   north side (even): 423122962 No. 6, the Green Tree Inn of 1760 (the oldest house of the street, rebuilt several times, now the Arcadia
//   puppet theatre, its own lettering over the door).
//   rowBuildings -> [{ key, id, build(ctx, b) }]   build(ctx, b) -> assembleBuilding's result
import { assembleBuilding } from './assemble.js';
import { ringOf } from '../republicii/ring.js';
import { ROW_STYLES } from './cells-row.js';

const S = ROW_STYLES, pair = (k) => [S[k].wall, S[k].trim], cols = (k) => [pair(k)];
// only the edges with explicit lots carry a facade; every other edge is a plain wall
const mk = (spec) => (ctx, b) => assembleBuilding(ctx, { id: b.id, ring: ringOf(b.p), holes: (b.holes ?? []).map(ringOf), spec: { ...spec, dressed: (i) => !!spec.edges[i] } });

// 21059343: the front is ring edge 7, 48.2 m, listed from its east end (the viewer's left) to the west end by the square
const BLOCK3 = mk({
  name: 'Strada Vasile Alecsandri 3–7', n: 4, styles: ['munk'], cols: cols('munk'), roof: '#a2523a', rise: 4.4, depth: 6.5, fall: 1.4, kind: 'apt', allPublic: false,
  edges: { 7: [
    { w: 22.6, style: 'munk', n: 4, cols: pair('munk'), gcell: 'g.munk', gpier: 'g.munkP', nb: 5, gh: 4.6, sh: 3.9, balc: null },
    { w: 12.0, style: 'no5', n: 3, cols: pair('no5'), gcell: 'g.no5', gpier: 'g.no5P', nb: 3, gh: 4.5, sh: 3.8, balc: null },
    { w: 13.6, style: 'roth', n: 4, cols: pair('roth'), gcell: 'g.roth', gpier: 'g.rothP', nb: 3, gh: 4.5, sh: 3.9, balc: { j: 1, bays: [1], rail: 'B' } },
  ] },
});
// 21059342: ring edge 3, 15.9 m
const RENDES = mk({
  name: 'Casa Rendes Vilmos', n: 3, styles: ['rendes'], cols: cols('rendes'), roof: '#8f4a38', rise: 4.2, depth: 6.0, fall: 1.4, kind: 'apt',
  edges: { 3: [{ n: 3, gcell: 'g.rendes', gpier: 'g.rendesP', nb: 3, gh: 4.8, sh: 4.2, balc: null }] },
});
// 423122936: ring edge 1, 30.2 m
const AMANT = mk({
  name: 'Casa Amant', n: 3, styles: ['amant'], cols: cols('amant'), roof: '#8f4a38', rise: 5.0, depth: 7.5, fall: 1.4, kind: 'apt',
  edges: { 1: [{ n: 3, gcell: 'g.amant', gpier: 'g.amantP', nb: 7, gh: 4.4, sh: 3.9, balc: null }] },
});
// 423122962: ring edge 14, 30.8 m, a door in the middle under the theatre's name
const INN = mk({
  name: 'Han Pomul Verde (Teatrul Arcadia)', n: 2, styles: ['inn'], cols: cols('inn'), roof: '#8c4a36', rise: 5.5, depth: 7.0, fall: 1.4, kind: 'public',
  edges: { 14: [
    { w: 12.65, n: 2, gcell: 'g.inn', gpier: 'g.innP', nb: 3, gh: 4.4, sh: 4.0, balc: null },
    { w: 5.5, n: 2, gcell: 'g.innD', gpier: 'g.innP', nb: 1, gh: 4.4, sh: 4.0, balc: null, piers: false },
    { w: 12.65, n: 2, gcell: 'g.inn', gpier: 'g.innP', nb: 3, gh: 4.4, sh: 4.0, balc: null },
  ] },
});
export const ROW = [
  { key: 'block37', id: 21059343, build: BLOCK3 }, { key: 'rendes', id: 21059342, build: RENDES },
  { key: 'amant', id: 423122936, build: AMANT }, { key: 'inn', id: 423122962, build: INN },
];
