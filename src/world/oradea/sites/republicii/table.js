// OWNER: oradea. The per-building table of the Calea Republicii site (not a site module): what stands behind each OSM
// footprint that fronts the street, from the photographs of the prominent houses and from the street's mix elsewhere.
// OSM's `building:levels` here is a default guess (9, 16), so storeys are set by hand.
//   PAL     named wall / trim colour pairs (the restored pastel renders of the Corso)
//   TABLE   [{ id, name?, kind, n (storeys incl. the ground floor), styles, cols, roof, lots?, rise? }]  (building.js)
//     lots: explicit lots along the main front, read left to right as seen from the street ({ w metres, style, cols, n,
//     ground, gate, balc ... }; a lot without w takes the rest); ltr is set on every table entry
//   HERO    the two palaces built apart: Moskovits Miksa (21056815) and Ullmann (423122934)
export const PAL = {
  turq: ['#3db5c6', '#f2f0e8'], ochre: ['#d9a35a', '#f2e4c2'], cream: ['#eee3c9', '#fbf8ef'], pink: ['#e8bfae', '#f8eee2'],
  green: ['#b9d0a4', '#f4f1e2'], sky: ['#9fc4dc', '#f5f2ea'], lemon: ['#ecd883', '#f7f0d6'], salmon: ['#e29a82', '#f6e6d5'],
  lilac: ['#b8aad8', '#f4eef4'], sage: ['#aac0a6', '#ece8d8'], mint: ['#9fd1c0', '#f3f1e6'], peach: ['#f1c39c', '#fbf0e0'],
  ivory: ['#e9d79f', '#f5ecd2'], white: ['#f3ece0', '#fdfbf6'], stone: ['#cfc6b4', '#ebe5d6'], grey: ['#c4bfb4', '#e4dfd4'],
  brick: ['#bd7a5c', '#f0e2cf'], rose: ['#e6b3b0', '#f8ecea'],
};
const P = PAL;
const warm = [P.ochre, P.cream, P.peach, P.lemon, P.pink, P.ivory];
const cool = [P.turq, P.sky, P.mint, P.green, P.lilac, P.sage];
const mixed = [...warm, ...cool];

export const TABLE = [
  // the south end, east and west of the mouth by the Ferdinand square
  { id: 421787911, n: 5, styles: ['baroque', 'apollo'], cols: [P.ivory, P.cream, P.peach], roof: '#8f4a38' },
  { id: 421787912, n: 4, styles: ['plain', 'lilien', 'wagner', 'stern'], cols: mixed, roof: '#9b4a36' },
  { id: 421787918, n: 2, styles: ['modern', 'plain'], cols: [P.grey, P.stone, P.cream], roof: '#5b5f62', kind: 'public' },
  { id: 421787850, name: 'hotel', n: 5, styles: ['apollo', 'civic'], cols: [P.white, P.cream], roof: '#5b6166' },
  // the middle of the street
  { id: 21056818, n: 4, styles: ['lilien', 'plain', 'wagner'], cols: [P.sky, P.rose, P.mint, P.lemon], roof: '#a2523a' },
  { id: 313967734, name: 'Liceul Teoretic Ady Endre', kind: 'public', n: 3, styles: ['civic'], cols: [P.cream, P.ochre], roof: '#8f4a38', rise: 4 },
  { id: 21056819, n: 5, styles: ['baroque', 'civic'], cols: [P.ivory, P.stone, P.cream], roof: '#8f4a38' },
  { id: 1523040878, n: 5, styles: ['apollo', 'wagner'], cols: [P.pink, P.cream, P.peach], roof: '#8f4a38' },
  { id: 21056811, n: 4, styles: ['wagner', 'stern', 'plain'], cols: mixed, roof: '#a2523a' },
  { id: 7211175, name: 'Palatul Stern', n: 4, styles: ['stern'], cols: [P.ochre], roof: '#7f3f2e', rise: 4,
    lots: [{ w: 24, gate: 1 }, { w: 12 }, {}] },
  { id: 21056812, n: 4, styles: ['baroque'], cols: [P.ivory, P.cream], roof: '#8f4a38', kind: 'public' },
  { id: 21056814, name: 'Palatul Apollo', n: 5, styles: ['apollo'], cols: [P.white], roof: '#5b6166', rise: 4 },
  // the north half: narrower fronts, lower
  { id: 1531214228, n: 4, styles: ['stern', 'lilien'], cols: [P.lemon, P.ochre, P.salmon], roof: '#a2523a' },
  { id: 1531214229, n: 4, styles: ['lilien', 'wagner'], cols: [P.mint, P.sky, P.rose], roof: '#a2523a' },
  { id: 1531214230, n: 3, styles: ['stern', 'plain'], cols: [P.peach, P.pink], roof: '#a2523a' },
  { id: 1531214231, n: 3, styles: ['plain', 'wagner'], cols: [P.cream, P.green], roof: '#8f4a38' },
  { id: 423325574, n: 4, styles: ['plain', 'baroque'], cols: [P.ivory, P.sky, P.pink], roof: '#8f4a38' },
  { id: 423325632, n: 4, styles: ['wagner', 'plain'], cols: [P.lemon, P.mint], roof: '#8f4a38' },
  { id: 423325542, n: 3, styles: ['plain', 'wagner', 'lilien', 'stern'], cols: mixed, roof: '#9b4a36' },
  { id: 1531214232, n: 3, styles: ['plain', 'lilien', 'wagner'], cols: mixed, roof: '#9b4a36' },
  { id: 423325638, n: 3, styles: ['plain', 'stern'], cols: [P.salmon, P.cream, P.green], roof: '#8f4a38' },
  { id: 190789775, n: 3, kind: 'public', styles: ['civic', 'plain'], cols: [P.stone, P.cream], roof: '#6a5e58' },
];
export const HERO = { moskovits: 21056815, ullmann: 423122934 };
