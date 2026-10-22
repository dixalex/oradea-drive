// Oradea Fortress (Cetatea Oradea): the survey data the site is built on, in map metres (frame of src/world/oradea/
// config.js; geo.toXZ). Not a site module: ../cetate.js imports it.
//   OUTLINE   the outer face of the star's walls, OSM way 190653999 (castle_type=fortress, 61 vertices: five bastions
//             with their ears, joined by the curtains), clockwise on the map
//   BASTIONS  the five bastions in ring order from the Bethlen bastion: name, apex (the far tip of the face pair)
//   GATES     the two gates through the curtains: centre on the outline, the way in (unit vector into the fortress),
//             the way out; the roads at both lead straight to the palace ring (the Wikimedia plan of the fortress, CC BY-SA)
//   RING      the palace ring (Corps A-E) from OSM way 190653953; CHURCH the garrison church, OSM way 190653989
//   LOT       the outbuildings inside the walls, from the OSM footprints (K, I, F+G, H, J) and the plan (L, M, P)
// Sources: OSM (ODbL), the plan "Oradea Citadel map RO.svg" (ArnoldPlaton, CC BY-SA 3.0, Wikimedia Commons) fitted to the
// OSM outline (mean error 1.8 m), Wikimedia Commons photographs of 2012 and 2025.

export const OUTLINE = [[999.2, -114.5], [993.4, -121.9], [988.1, -123.6], [983, -121], [972.3, -16.5], [1060.5, -43.9], [1063.1, -50.1],
  [1061, -56.9], [1049.9, -58.9], [1050.1, -71.3], [1152.5, -69.8], [1152.5, -62.7], [1146.6, -58.3], [1143.2, -51.1], [1143.5, -45.1],
  [1195.9, -29.7], [1214.4, -92.1], [1208.2, -94.6], [1195.8, -84.4], [1188.6, -91.1], [1236.4, -163.4], [1246.8, -179.1], [1250.4, -177],
  [1245.7, -161.5], [1248.1, -156.8], [1251.4, -154.5], [1256.2, -152.6], [1333.2, -215], [1242.1, -251.8], [1235.2, -253.7],
  [1229.6, -249.2], [1233.8, -233.8], [1225.1, -224], [1219.2, -224.3], [1191.8, -253.1], [1153.8, -292.9], [1158.8, -297.3],
  [1170, -291.1], [1176.2, -293.4], [1177.1, -299.1], [1144.8, -359.4], [1094.3, -312.2], [1096.3, -308.7], [1103.6, -306.8],
  [1104.1, -296.3], [1001.3, -256], [994.7, -262.5], [999.7, -269.2], [1000.8, -273.7], [992.9, -276.6], [938.1, -269.3], [963.2, -218],
  [967.5, -213.9], [971.6, -214.9], [973.3, -219.2], [975, -224.5], [985.7, -223.9], [986.7, -219.8], [999.6, -167.6], [1001.4, -156.9],
  [1009.6, -119.2]];

export const BASTIONS = [
  { id: 'bethlen', name: 'Bastionul Bethlen', apex: [972.3, -16.5] },
  { id: 'craisorul', name: 'Bastionul Crăișorul', apex: [1195.9, -29.7] },
  { id: 'rosu', name: 'Bastionul Roșu', apex: [1333.2, -215] },
  { id: 'aurit', name: 'Bastionul Aurit', apex: [1144.8, -359.4] },
  { id: 'ciunt', name: 'Bastionul Ciunt', apex: [938.1, -269.3] },
];

// the way in is perpendicular to the curtain: Poarta de Vest through the west curtain (the wooden bridge, the brick gate),
// Poarta de Est through the curtain between the Aurit and Roșu bastions (the east moat still holds water)
export const GATES = {
  vest: { at: [1000.5, -162.3], inward: [0.9848, -0.1736] },
  est: { at: [1186.5, -259.2], inward: [-0.7071, 0.7071] },
};

// the palace ring: outer + inner path of OSM 190653953, open where the church stands
export const RING = [[1137.3, -139.7], [1160.6, -187.8], [1171.7, -199.2], [1187.2, -191.3], [1155.9, -129.8], [1161.2, -127.3], [1154.1, -108],
  [1134.1, -112.3], [1135.3, -121.5], [1069.7, -128.7], [1063.9, -169.7], [1060.8, -191], [1053.2, -214.3], [1064.6, -218.2], [1088.3, -232.1],
  [1111.6, -245.9], [1127.3, -259.4], [1135.1, -249.3], [1124.8, -239.5], [1148.6, -215.9], [1140.3, -207.5], [1116.1, -230.2],
  [1097.2, -218.5], [1075.9, -205.5], [1083.5, -173.9], [1089.9, -147.2]];
export const CHURCH = [[1160.6, -187.8], [1145.3, -202.6], [1140.3, -207.5], [1148.6, -215.9], [1151.4, -218.9], [1155.9, -214.6], [1171.7, -199.2]];

// building ids the site replaces (buildings.js skips their generic extrusion): the ring, the church, the outbuildings that the
// map compiler had guessed to be nine- and fourteen-storey blocks, and three Overture footprints that sit on the walls and in
// the Ciunt bastion (a three-storey "apartment" block on the south curtain, a house and a shed)
export const SKIP = [190653953, 190653989, 190653952, 190653962, 190653974, 190653994, 712395379, 3000001560, 3000011671, 3000011672];
