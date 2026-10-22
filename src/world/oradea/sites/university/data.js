// OWNER: oradea. The building table of the university site (not a site module): every OSM footprint the site replaces, with the
// storeys, wall colours and roof the photographs and the aerial give (see the notes on each group).
//   CAMPUS: Universitatea din Oradea, Str. Universității 1 – the former gendarmerie school (the brothers Vágó's Secession campus):
//     pastel render over a grey stone-clad ground storey, white-framed windows, orange-red tile roofs with green-capped chimneys.
//     The OSM level tags are guesses; the storeys here are read off the photos (A: 3 + attic, B: stone base + 3, C: stone base + 3).
//   TOWN: Medicine & Pharmacy, Partium, Law / Environment / Construction, Agora; EMANUEL: Universitatea Emanuel.
import { STYLE, LAYER } from '../../../facade.js';

const TILE = { col: '#b5482c', col2: '#a63f26' };
const DARK = { col: '#6d4a3d', col2: '#62423a' };

// ids of the footprints the site replaces (the loader keeps them out of the generic extrusion)
export const IDS = {
  A: 309251497, B: 309261868, C: 309262055, D: 309263650, E: 309263727, F: 309250926, I: 309251381, L: 717122919, M: 309262730,
  V: 309262866, X: 316705140, Y: 421070907, Z: 309262772, V1: 314479838, V2: 314479837, V3: 314479839, ART: 310198489,
  LIB: 309261311, HALL: 309251687, POST: 1215857493, STUDIO: 1215857494, RANGE: 632078433,
  MED1: 423119164, MED2: 423119162, PARTIUM: 6482683, ARANY: 439861563, LAW: 423118595, ENV: 1345006056, FCCA1: 420895021, FCCA2: 420895139,
  EMANUEL: 264915540,
  AGORA: [1040626475, 1040626476, 1040626477, 1040626478, 1040626479],
};

// kit blocks of the main campus (the hero buildings add their own dressing in campus.js)
export const CAMPUS = [
  { id: IDS.A, name: 'Corpul A', n: 3, gh: 3.8, sh: 3.8, wall: '#efe9da', stone: '#aaa59a', roof: { ...TILE, ov: 0.9, pitch: 0.55 }, fascia: '#4a3f38', trim: '#f2eee3', bay: 2.8, winW: 0.5, winH: 0.58 },
  { id: IDS.B, name: 'Corpul B', n: 4, gh: 5.2, sh: 3.7, wall: '#dcbfb8', stone: '#9d9a93', roof: { ...DARK, ov: 0.8, pitch: 0.5 }, bay: 3.1, winW: 0.42, winH: 0.58, rects: [{ seed: [-40, 1395], ang: 47 }, { seed: [-5, 1411], ang: -14.6 }, { seed: [-26, 1424], ang: 18 }] },
  { id: IDS.C, name: 'Corpul C', n: 4, gh: 4.6, sh: 3.7, wall: '#cad8e2', stone: '#9ea1a1', roof: { ...TILE, ov: 0.8, pitch: 0.55 }, bay: 3.1, winW: 0.44, winH: 0.58, rects: [{ seed: [-63, 1284], ang: 50.8 }, { seed: [-25, 1297], ang: -11.8 }, { seed: [-52, 1322], ang: 113 }] },
  { id: IDS.D, name: 'Corpul D', n: 2, gh: 3.8, sh: 3.6, wall: '#eadfc8', stone: '#a6a196', roof: { ...TILE } },
  { id: IDS.E, name: 'Corpul E', n: 3, gh: 4.0, sh: 3.6, wall: '#ece3cf', stone: '#a8a398', roof: { ...TILE } },
  { id: IDS.F, name: 'Corpul F', n: 3, gh: 4.0, sh: 3.6, wall: '#e8dcc4', stone: '#a6a196', roof: { ...TILE } },
  { id: IDS.I, name: 'Corpul I', n: 2, gh: 4.0, sh: 3.7, wall: '#e8b9a5', stone: '#a5a096', roof: { ...TILE, pitch: 0.85 }, bay: 3.0, dormers: { step: 5.5 } },
  { id: IDS.L, name: 'Corpul L', n: 1, gh: 4.2, sh: 3.6, wall: '#e6e2d8', stone: null, eave: 'gable', roof: { col: '#6c7a84', col2: '#64727c', pitch: 0.25, ov: 0.35 } },
  { id: IDS.M, name: 'Corpul M', n: 3, gh: 4.0, sh: 3.7, wall: '#e3c27a', stone: '#a7a297', roof: { ...TILE } },
  { id: IDS.V, name: 'Corpul V', n: 2, gh: 3.8, sh: 3.6, wall: '#e9dfca', stone: null, roof: { ...DARK } },
  { id: IDS.X, name: 'Corpul X', n: 2, gh: 3.8, sh: 3.6, wall: '#e9e1ce', stone: null, roof: { ...DARK } },
  { id: IDS.Y, name: 'Corpul Y, CICERO', n: 3, gh: 3.8, sh: 3.5, wall: '#e8dfc9', stone: '#a6a196', roof: { ...TILE } },
  { id: IDS.Z, name: 'Corpul Z', n: 3, gh: 3.8, sh: 3.5, wall: '#e8dfc9', stone: '#a6a196', roof: { ...TILE } },
  { id: IDS.V1, name: 'Clădire V1', n: 2, gh: 3.8, sh: 3.6, wall: '#e9dfca', stone: null, roof: { ...TILE } },
  { id: IDS.V2, name: 'Clădire V2', n: 3, gh: 3.6, sh: 3.5, wall: '#e6e3dc', stone: null, style: STYLE.RIBBON, roof: { col: '#4b4f55', col2: '#464a50', pitch: 0.3 } },
  { id: IDS.V3, name: 'Clădire V3', n: 3, gh: 3.6, sh: 3.5, wall: '#e6e3dc', stone: null, style: STYLE.RIBBON, roof: { col: '#4b4f55', col2: '#464a50', pitch: 0.3 } },
  { id: IDS.ART, name: 'Facultatea de Artă', n: 2, gh: 3.8, sh: 3.6, wall: '#e5ddc9', stone: null, roof: { col: '#8a4a39', col2: '#7e4334' } },
  { id: IDS.LIB, name: 'Biblioteca Universității', n: 3, gh: 4.0, sh: 3.7, wall: '#eee6d3', stone: '#a9a499', roof: { ...TILE }, bay: 3.0 },
  { id: IDS.HALL, name: 'Sala de jocuri sportive', n: 1, gh: 9.0, sh: 9.0, wall: '#e6e0cf', stone: null, eave: 'gable', style: STYLE.RIBBON, roof: { ...TILE, pitch: 0.18, ov: 0.5 } },
  { id: IDS.RANGE, name: 'Poligon de Tragere', n: 1, gh: 5.2, sh: 5.2, wall: '#d8d6cf', stone: null, eave: 'gable', style: STYLE.BLANK, roof: { col: '#58626b', col2: '#535d66', pitch: 0.2 } },
  { id: IDS.POST, name: 'Post de Poliție', n: 2, gh: 3.4, sh: 3.0, wall: '#eee5d0', stone: '#aaa59a', roof: { col: '#4f7f78', col2: '#477469', pitch: 0.7 }, door: null },
  { id: IDS.STUDIO, name: 'Compartiment Artistic', n: 2, gh: 3.4, sh: 3.0, wall: '#eee5d0', stone: '#a7a297', roof: { col: '#59675f', col2: '#515e57', pitch: 0.7 }, door: null },
];

// the town buildings built as kit blocks (the heroes in medicine.js, town.js and emanuel.js dress the rest)
export const TOWN = [
  { grp: 'law', id: IDS.LAW, name: 'Facultatea de Drept', n: 3, gh: 4.0, sh: 3.6, wall: '#e9ddc9', stone: '#b4aa98', stoneLayer: LAYER.LIME, bay: 3.2, roof: { col: '#a9482f', col2: '#9a3f29', pitch: 0.55 }, trim: '#f1ede1' },
  { grp: 'law', id: IDS.ENV, name: 'Facultatea de Protecția Mediului', n: 3, gh: 4.0, sh: 3.6, wall: '#e3e0d6', stone: null, bay: 3.2, roof: { col: '#a9482f', col2: '#9a3f29', pitch: 0.5 }, trim: '#f1ede1' },
  { grp: 'law', id: IDS.FCCA1, name: 'Facultatea de Construcții, Cadastru și Arhitectură', n: 3, gh: 3.8, sh: 3.5, wall: '#e8dfca', stone: null, bay: 3.2, roof: { col: '#5f666e', col2: '#585f67', pitch: 0.4 }, trim: '#f1ede1' },
  { grp: 'law', id: IDS.FCCA2, name: 'Facultatea de Construcții, Cadastru și Arhitectură', n: 3, gh: 3.8, sh: 3.5, wall: '#e8dfca', stone: null, bay: 3.2, roof: { col: '#a9482f', col2: '#9a3f29', pitch: 0.5 }, trim: '#f1ede1' },
  ...IDS.AGORA.map((id, i) => ({ grp: 'agora', id, name: 'Universitatea Agora', n: i === 1 ? 1 : 2, gh: 3.4, sh: 3.0, wall: '#efe5d2', stone: null, bay: 3.0, roof: { col: '#a2493a', col2: '#933f31', pitch: 0.6, maxRise: 3.4 }, trim: '#f4efe4' })),
];

export const ALL_IDS = [...Object.values(IDS).flat()];
export { LAYER };
