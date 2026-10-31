// OWNER: oradea. Atlas cells of the Orthodox Episcopal Palace (Str. Roman Ciorogariu, built 1905 by Kálmán Rimanóczy Jr as a family villa;
// the Orthodox Church's since 1921; not a site module): a Venetian-style front of warm cream render banded with red brick, brick-framed
// windows and a first-floor loggia window of three arches. The colours and the arch count are from the card; the rest is a guess.
//   episcopiaCells(A, r)   adds ep.* cells through ./bays.js
//   EP   the colours and measures shared with episcopia.js
import { bayCells } from './bays.js';

export const EP = { wall: '#ead9b6', trim: '#f4eee0', plinth: '#a9573b', frame: '#f1ede2', accent: '#a9583b', roof: '#9a4a33', GH: 4.4, SH: 3.9, AX: 3.6 };
export function episcopiaCells(A, r) { bayCells(A, r, 'ep', { ...EP, g: 'arch', u: 'arch', cas: 0.16, blind: 0 }); }
