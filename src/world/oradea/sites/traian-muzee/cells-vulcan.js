// OWNER: oradea. Atlas cells of the Iosif Vulcan Memorial Museum (Str. Iosif Vulcan 14; not a site module): a two-storey town house of
// pale ochre render, white casings, flat-headed windows and a pedimented entrance bay with a balcony over the door. The look is a guess
// (no photograph describes it in the sources found): a modest neoclassical house of the 1880s.
//   vulcanCells(A, r)   adds vu.* cells through ./bays.js
//   VU   the colours and measures shared with vulcan.js
import { bayCells } from './bays.js';

export const VU = { wall: '#e6d3a0', trim: '#f6f2e6', plinth: '#b3a47e', frame: '#f1eee6', roof: '#86503c', GH: 4.2, SH: 3.6, AX: 3.4 };
export function vulcanCells(A, r) { bayCells(A, r, 'vu', { ...VU, g: 'flat', u: 'flat', cas: 0.15, blind: 0.0 }); }
