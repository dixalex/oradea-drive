// OWNER: oradea. What the east side of Piața Unirii holds (not a site module): the buildings in build order, the OSM ids replaced, the
// map places. Every id was checked against the skip lists of all sites/*.js (none takes any of them).
//   LIST    [{ key, id, group: 'est' | 'vest', build(ctx, osm) }]      SKIP  the replaced ids      AXIS  the street's centre line
//   the map places (the sight 'alecsandri', the improved 'moskovitsadolf', 'kovats', 'iuliumaniu') live in ../../places.js
import { adolf, ADOLF_ID } from './adolf.js';
import { deutsch, DEUTSCH_ID } from './deutsch.js';
import { kovats, KOVATS_ID } from './kovats.js';
import { lyceum, LYCEUM_ID } from './lyceum.js';
import { ROW } from './row.js';

export { AXIS } from './axis.js';

export const LIST = [
  { key: 'adolf', id: ADOLF_ID, group: 'est', build: adolf },
  { key: 'deutsch', id: DEUTSCH_ID, group: 'est', build: deutsch },
  { key: 'kovats', id: KOVATS_ID, group: 'vest', build: kovats },
  { key: 'lyceum', id: LYCEUM_ID, group: 'vest', build: lyceum },
  ...ROW.map((b) => ({ ...b, group: 'est' })),
];
export const SKIP = LIST.map((b) => b.id);
