// OWNER: oradea. The parametric Catholic churches of Oradea (tier b of ../catholic.js): one entry per church, the OSM footprint it replaces
// (`id`), the street its front looks at (`frame.faceTo`, a map point), and what the kit (church.js) cannot read off the outline: heights,
// colours, roof material, towers and their caps. Walls follow the OSM ring, roofs follow the plan. Sources: the Esri aerial of May 2025
// (roof colours and plan), OSM, miserend.hu and Wikimedia Commons photographs where a church has one (named per entry).
//   KIT   [{ id, key, name, frame: { faceTo }, H, wall, trim, roofMat, roofCol, win, towers, ... }]  fields in church.js
//   SKIP  the OSM building ids the kit churches replace
const TILE = '#9a4a36', SLATE = '#6d747a';

export const KIT = [
  // Biserica Romano-Catolică (Capuchin church, Visitation), Strada Mosoiu / Cuza Vodă: neoclassical after the fire of 1836 (Barthel György),
  // a plain gable front of grey ashlar-lined plaster with a segment-headed window, a relief panel and a big steel cross; commons photo
  { id: 423122942, key: 'capucini', name: 'Biserica Capucinilor', frame: { faceTo: [316, 215] }, H: 9.4, pitch: 0.5, wall: '#cfc9b6', trim: '#f1ede2', plinth: '#a39d8e',
    roofCol: '#8c4b3a', front: 'pediment', hip: true, win: { w: 1.2, h: 4.2, y: 2.4, kind: 'round', bay: 4.2, sur: 0.2 }, door: { w: 1.6, h: 3.2, kind: 'round' } },
  // Biserica Concepția Imaculată, Velența (Piața Tineretului): cream-yellow nave with a polygonal apse and a front tower with a clock and a grey spire (miserend.hu photo)
  { id: 286239555, key: 'velenta', name: 'Biserica Concepția Imaculată', frame: { faceTo: [1726, -332] }, H: 8.4, wall: '#e4d4a4', trim: '#f6f0e0', plinth: '#aaa395',
    roofMat: 'sheet', roofCol: '#a4aaaf', win: { w: 1.1, h: 4.4, y: 2.2, kind: 'round', bay: 4.0, pil: true },
    towers: [{ at: 'front', side: 'centre', w: 5.2, d: 5.0, h: 25, cap: 'spire', capMat: 'sheet', capCol: '#8e949a', capH: 11, clock: true, clockUp: 7.5, bands: [8.6, 14], bel: { up: 5.4, h: 2.6 }, wins: [{ y: 3.4, w: 0.5, h: 1.3 }] }] },
  // Biserica Catolică Sfânta Treime (Szőllős / Nufărul, Strada Țiglarilor): a nave with a tower on its front, yellow, a grey Baroque cap with a lantern
  { id: 421779708, key: 'treime', name: 'Biserica Sfânta Treime', frame: { faceTo: [2974, 859] }, H: 6.6, wall: '#e3d09a', trim: '#f4eedc', plinth: '#a89f8e', roofCol: '#a4503a',
    win: { w: 1.0, h: 3.4, y: 1.8, kind: 'round', bay: 3.8 },
    towers: [{ at: 'ring', w: 4.9, h: 18, cap: 'bell', capCol: '#6c7278', capH: 6.4, clock: true, clockUp: 6.2, bands: [7.2], bel: { up: 4.8, h: 2.3 }, wins: [{ y: 2.4, w: 0.5, h: 1.3 }] }] },
  // Szent Antal-kápolna (Tokaji-telep, Calea Clujului 206): a small 1932 chapel with a side porch
  { id: 422175675, key: 'antal', name: 'Szent Antal-kápolna', frame: { faceTo: [4504, -378] }, H: 4.6, wall: '#efe9da', trim: '#faf6ea', plinth: '#b0a898', roofCol: '#9a4a36',
    win: { w: 0.8, h: 2.2, y: 1.2, kind: 'round', bay: 3.4 }, door: { w: 1.3, h: 2.6 }, towers: [{ at: 'front', side: 'centre', w: 1.5, d: 1.5, h: 8.6, cap: 'pyramid', capCol: '#8d4a38', capH: 3.0, pil: 0, bel: null, proj: 0.2 }] },
  // Biserica Romano-Catolică «Sfântul Iosif» (Rogerius, Strada Traian Lalescu): a plain hall church with a blue-grey metal roof
  { id: 436834261, key: 'iosif', name: 'Biserica Sfântul Iosif', frame: { faceTo: [-1583, -1930] }, H: 6.8, wall: '#ebe5d8', trim: '#fbf8ef', plinth: '#aaa395',
    roofMat: 'sheet', roofCol: '#8795a0', hip: true, win: { w: 1.0, h: 3.6, y: 1.9, kind: 'round', bay: 3.8, pil: true }, towers: [{ at: 'front', side: 'centre', w: 3.4, d: 2.6, h: 14.5, cap: 'pyramid', capMat: 'sheet', capCol: '#7c8a95', capH: 5.0, bel: { up: 4.2, h: 2.0 }, proj: 0.3 }] },
  // Biserica Romano-Catolică Sfânta Tereza (Ioșia, Gheorghe Pop de Băsești 1; 1934): a grey stucco hall with twin front towers under red pyramid caps (miserend.hu photo)
  { id: 544645098, key: 'tereza', name: 'Biserica Sfânta Tereza', frame: { faceTo: [-1969, 698] }, H: 9.0, pitch: 0.5, wall: '#b9ae9b', trim: '#e9e2d2', plinth: '#8e8878',
    roofCol: '#a24f3a', win: { w: 1.0, h: 4.4, y: 2.2, kind: 'round', bay: 4.2, pil: true },
    towers: ['left', 'right'].map((side) => ({ at: 'front', side, w: 4.4, d: 4.4, h: 20, cap: 'pyramid', capCol: '#b05434', capH: 6.2, bands: [9.4], bel: { up: 5.4, h: 2.6 }, proj: 0.4, wins: [{ y: 3.4, w: 0.5, h: 1.3 }] })) },
  // Capela Romano-Catolică Sfântul Ladislau (the poorhouse and boys' home chapel, Strada Nicolae Iorga): a white chapel with an apse and a grey roof
  { id: 925805948, key: 'ladislau', name: 'Capela Sfântul Ladislau', frame: { faceTo: [-243, -748] }, H: 5.0, wall: '#f0ece2', trim: '#fbf8ef', plinth: '#b0a898', roofMat: 'sheet', roofCol: '#7e8993',
    win: { w: 0.9, h: 2.6, y: 1.4, kind: 'round', bay: 3.2 }, door: { w: 1.3, h: 2.5 } },
  // Capela Catolică (Strada Ion Creangă area, in a wood): a small chapel, aerial roof only
  { id: 544741749, key: 'capela', name: 'Capela Catolică', frame: { faceTo: [120, 1742] }, H: 4.0, wall: '#eee8dc', trim: '#faf6ea', plinth: '#b0a898', roofCol: '#8e4a38',
    win: { w: 0.8, h: 2.0, y: 1.1, kind: 'round', bay: 3.2 }, door: { w: 1.2, h: 2.3 } },
  // Biserica Sfinții Mihail și Gavril (Greek Catholic, the village on Strada Bisericii): a nave with a round apse and a narrow west tower, grey metal roof
  { id: 437149338, key: 'mihail', name: 'Biserica Sfinții Mihail și Gavril', frame: { faceTo: [-5792, 1608] }, H: 6.2, wall: '#e9e0cc', trim: '#f8f3e6', plinth: '#a8a090',
    roofMat: 'sheet', roofCol: '#7a8b97', win: { w: 0.95, h: 3.2, y: 1.8, kind: 'round', bay: 3.4 },
    towers: [{ at: 'ring', w: 3.8, h: 14.5, cap: 'pyramid', capMat: 'sheet', capCol: '#7a8b97', capH: 4.6, bel: { up: 3.8, h: 2.0 } }] },
];

// Biserica «Adormirea Maicii Domnului» (Csodásérmű Boldogasszony, Cătălina: 1930s Lazarist church with a house): grey-blue stucco, a tall central tower
// with a dark pyramid spire between two lower towers with tile caps (miserend.hu photos)
export const ADORMIREA = { id: 1540255477, key: 'adormirea', name: 'Biserica Adormirea Maicii Domnului' };

export const SKIP = [...KIT.map((k) => k.id), ADORMIREA.id];
export { TILE, SLATE };
