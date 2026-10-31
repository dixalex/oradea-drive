// OWNER: oradea. What the Art Nouveau corners hold (not a site module): the buildings in build order, the OSM ids replaced.
// Every id was checked against the skip lists of all sites/*.js (none takes any of them).
//   LIST    [{ key, id, group: 'ferdinand' | 'fuchsl', build(ctx, osm) }]      SKIP  the replaced ids
// The map places (poynar, fuchsl, transilvania, adorjan, rimanoczy) are SITE.places in ../ferdinand-olosig.js.
import { poynar, POYNAR_ID } from './poynar.js';
import { transilvania, TRANSILVANIA_ID } from './transilvania.js';
import { fuchsl, FUCHSL_ID } from './fuchsl.js';
import { adorjan1, adorjan2, ADORJAN1_ID, ADORJAN2_ID } from './adorjan.js';
import { rimanoczy, baths, RIMANOCZY_ID, BATHS_ID } from './rimanoczy.js';

export const LIST = [
  { key: 'poynar', id: POYNAR_ID, group: 'ferdinand', build: poynar },
  { key: 'transilvania', id: TRANSILVANIA_ID, group: 'ferdinand', build: transilvania },
  { key: 'fuchsl', id: FUCHSL_ID, group: 'fuchsl', build: fuchsl },
  { key: 'adorjan1', id: ADORJAN1_ID, group: 'ferdinand', build: adorjan1 },
  { key: 'adorjan2', id: ADORJAN2_ID, group: 'ferdinand', build: adorjan2 },
  { key: 'rimanoczy', id: RIMANOCZY_ID, group: 'ferdinand', build: rimanoczy },
  { key: 'baths', id: BATHS_ID, group: 'ferdinand', build: baths },
];
export const SKIP = LIST.map((b) => b.id);
