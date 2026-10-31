// OWNER: oradea. What the Parcul Traian museums hold (not a site module): the buildings in build order, the OSM ids replaced.
// Every id was checked against the skip lists of all sites/*.js (none takes any of them).
//   LIST    [{ key, id, build(ctx, osm) -> { footprint | footprints, lots? } }]      SKIP  the replaced ids
// The map places (muzeuady, muzeuvulcan, casalazar, episcopiaortodoxa, okanyi) are SITE.places in ../traian-muzee.js.
import { ady, ADY_ID } from './ady.js';
import { vulcan, VULCAN_ID } from './vulcan.js';
import { lazar, LAZAR_ID } from './lazar.js';
import { episcopia, EPISCOPIA_ID } from './episcopia.js';
import { okanyi, OKANYI_ID } from './okanyi.js';

export const LIST = [
  { key: 'ady', id: ADY_ID, build: ady },
  { key: 'vulcan', id: VULCAN_ID, build: vulcan },
  { key: 'lazar', id: LAZAR_ID, build: lazar },
  { key: 'episcopia', id: EPISCOPIA_ID, build: episcopia },
  { key: 'okanyi', id: OKANYI_ID, build: okanyi },
];
export const SKIP = LIST.map((b) => b.id);
