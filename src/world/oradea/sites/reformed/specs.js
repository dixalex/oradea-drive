// OWNER: oradea. The parametric churches and synagogues of Oradea's Reformed / Unitarian / Jewish site (tier b of ../reformed.js): one entry per
// building, the OSM footprint it replaces (`id`) or a node and a ring maker, the street its front looks at (`frame.faceTo`, a map point), and what
// the kit (church.js) cannot read off the outline: heights, colours, roof material, towers and their caps. Walls follow the OSM ring, roofs follow
// the plan. Sources: the Bing aerial (roof colours and plan), OSM, and the Wikimedia Commons photographs where a building has one (named in the
// site header); every entry that has no photograph is marked `guess` in its comment: the walls, windows and tower are then the type's, not the building's.
//   KIT   [{ id | node + ring(x, z), key, name, frame, H, wall, trim, roofMat, roofCol, win, towers, finial, ... }]  fields in church.js
//   SKIP  the OSM building ids the kit entries replace
const TILE = '#9a4a36', ZINC = '#8d959b', COPPER = '#9b5c3e';

export const KIT = [
  // Biserica Unitariană (Strada Nicolae Jiga 72): the OSM outline is the street range of a courtyard block (aerial: red-brown hipped tile roof);
  // no photograph found: a plain hall under a hip roof, round-headed windows, no tower (a guess)
  { id: 1545661917, key: 'unitarian', name: 'Biserica Unitariană', frame: { faceTo: [-485, -1100] }, H: 6.4, wall: '#e6dcc2', trim: '#f6f1e4', plinth: '#a8a090',
    roofCol: '#9d4c3a', hip: true, finial: 'none', win: { w: 1.0, h: 3.2, y: 1.7, kind: 'round', bay: 3.8, sur: 0.15 }, door: { w: 1.5, h: 2.9, kind: 'round' } },
  // Biserica Reformată Seleuș (Strada Constantin Noica 27): an orange-tiled hall on the Noica / Ialomiței car park (aerial); the nave and a front
  // tower with a copper-coloured cap and the cockerel are the Reformed type's (a guess)
  { id: 421767355, key: 'seleus', name: 'Biserica Reformată Seleuș', frame: { faceTo: [2640, 1180] }, H: 6.0, wall: '#ece3cc', trim: '#fbf7ea', plinth: '#aaa395',
    roofCol: '#c0603c', finial: 'cockerel', win: { w: 0.95, h: 3.0, y: 1.6, kind: 'round', bay: 3.4 },
    towers: [{ at: 'front', side: 'centre', w: 3.6, d: 3.2, h: 15.5, cap: 'copper', capCol: COPPER, capH: 6.5, bands: [7.4], bel: { up: 3.6, h: 2.0 }, proj: 0.3, wins: [{ y: 2.6, w: 0.5, h: 1.3 }] }] },
  // Biserica reformată Csillagváros / Luceafărul (Strada Gala Galaction 67): a modern church (aerial: a long hall whose side walls step in 2.7 m
  // notches every ~10 m under a dark grey metal roof); no photograph found, the walls are plain (a guess)
  { id: 422590291, key: 'csillag', name: 'Biserica reformată Luceafărul', frame: { faceTo: [1190, 655] }, H: 7.2, pitch: 0.42, wall: '#e8e3d6', trim: '#f4f1e8', plinth: '#a09a8e',
    roofMat: 'sheet', roofCol: '#5d6368', hip: true, finial: 'cockerel', win: { w: 1.1, h: 3.8, y: 1.9, kind: 'round', bay: 3.8 } },
  // Biserica reformată Rogerius (Strada Spartacus): a 1990s round church (aerial: a cream drum and a fan of orange tiled cones round it on the
  // south, a long dark brown nave north of it, a terrace on the east); built in ./rogerius.js
  { id: 1210617912, key: 'rogerius', name: 'Biserica reformată Rogerius', custom: 'rogerius', frame: { faceTo: [-1130, -1250] } },
  // Réti református templom (Biserică reformată, Strada Sfântul Ladislau): a node in OSM, no building outline in any map data; a small hall and a
  // front tower on a made-up 9 x 19 m footprint along the street, found on the aerial (a guess)
  { node: [47.0723182, 21.9330475], key: 'reti', name: 'Biserica reformată din Rét', ring: (x, z) => retiRing(x, z), frame: { faceTo: [-760, -1750] }, H: 6.0, wall: '#ebe3cd', trim: '#faf6ea', plinth: '#aaa395',
    roofCol: '#b25a3a', finial: 'cockerel', win: { w: 0.95, h: 3.0, y: 1.6, kind: 'round', bay: 3.4 },
    towers: [{ at: 'front', side: 'centre', w: 3.4, d: 3.0, h: 14, cap: 'pyramid', capCol: '#8e4a38', capH: 5.2, bel: { up: 3.4, h: 1.9 }, proj: 0.3 }] },
  // Sinagoga Mică Ortodoxă (Sas Chevra, courtyard of the Great Synagogue, Strada Mihai Viteazul 4; 1908, Incze Lajos): a plain hall under a red
  // gabled roof (aerial); no street photograph, no symbols or inscriptions are drawn (a guess)
  { id: 423122957, key: 'micaortodoxa', name: 'Sinagoga Mică Ortodoxă', synagogue: true, frame: { faceTo: [445, 215] }, H: 6.6, pitch: 0.4, wall: '#ece4cf', trim: '#f8f3e6', plinth: '#b0a898',
    roofCol: '#a24c3c', finial: 'none', win: { w: 1.1, h: 3.2, y: 1.8, kind: 'round', bay: 3.6, pil: true }, door: { w: 1.5, h: 2.7, kind: 'round' } },
  // Sinagoga Poale Cedek / Teleki (Strada Tudor Vladimirescu 18, a former synagogue): a hall under a hip roof of orange tile (aerial), a smaller
  // block on its east side; no photograph found, plain walls and round-headed windows (a guess)
  { id: 1539737624, key: 'poalecedek', name: 'Sinagoga Poale Cedek', synagogue: true, frame: { faceTo: [-330, 15] }, H: 7.4, pitch: 0.45, wall: '#e9dfc6', trim: '#f6f0e0', plinth: '#aaa090',
    roofCol: '#b4573a', hip: true, finial: 'none', win: { w: 1.1, h: 3.6, y: 1.9, kind: 'round', bay: 3.6, pil: true }, door: { w: 1.5, h: 2.8, kind: 'round' } },
  // Sinagoga Hasidică Vijnița / Visznitz (Strada Crinului, built 1933, later a hospital and a factory, now a jazz bar): a dull brick hall (Times of
  // Israel) under a terracotta hip roof (aerial); the street front is not known (a guess)
  { id: 423100549, key: 'visznitz', name: 'Sinagoga Visznitz', synagogue: true, frame: { faceTo: [650, 270] }, H: 6.2, pitch: 0.4, wall: '#a9593f', trim: '#cfc2a8', plinth: '#8e8478', brick: true,
    roofCol: '#a64e38', hip: true, finial: 'none', win: { w: 1.0, h: 3.0, y: 1.6, kind: 'round', bay: 3.4 }, door: { w: 1.5, h: 2.6, kind: 'round' } },
];

// a 9 x 19 m rectangle centred on (x, z), its long axis along the street (about -37 degrees in map axes)
function retiRing(x, z) {
  const a = -0.64, c = Math.cos(a), s = Math.sin(a), L = 9.5, W = 4.5;
  return [[-L, -W], [L, -W], [L, W], [-L, W]].map(([u, v]) => [x + c * u - s * v, z + s * u + c * v]);
}

export const SKIP = KIT.filter((k) => k.id).map((k) => k.id);
export { TILE, ZINC, COPPER };
