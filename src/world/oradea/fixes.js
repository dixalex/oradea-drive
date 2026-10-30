// OWNER: oradea. Hand corrections to generic buildings that map_buildings.json draws wrong (guessed storeys, a shopfront
// look on a house), checked against street photos. applyFixes(map) patches the entries in place before the city builds.
//   FIXES: { id, at: [x, z] (the footprint's centre, map metres: Overture ids from 3e9 follow file order in build_map.mjs
//            and can shift with a new download, so tests/oradea-fixes.test.mjs checks each id still stands there),
//            set: { lv?, k? } (what changes: storeys; the look, e.g. 'house' has no shopfront), why }
export const FIXES = [
  { id: 1532247045, at: [-57.7, -1083.1], set: { lv: 1, k: 'house' },
    why: 'Strada Nicolae Jiga 27, beside Viața Nouă: a one-storey house with a carved door (Street View 2024), not a three-storey shop block' },
  { id: 3000001284, at: [1322.4, 1841.3], set: { lv: 1, k: 'shed' },
    why: 'north of Mobiversal on Strada Thurzó Sándor: a white-panelled gabled shed (Street View 2024), not three storeys' },
];

export function applyFixes(map) {
  const byId = new Map(FIXES.map((f) => [f.id, f]));
  let n = 0;
  for (const b of map.buildings ?? []) { const f = byId.get(b.id); if (f) { Object.assign(b, f.set); n++; } }
  return n;
}
