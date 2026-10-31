// OWNER: oradea. Atlas cells of the Aurel Lazăr Memorial House (Str. Aurel Lazăr 13; not a site module): the lawyer's two-storey villa in
// cream render with white casings, arched ground-floor windows, flat-headed upper ones and green shutters. A guess from the sources found
// (they describe the museum's rooms, not the front).
//   lazarCells(A, r)   adds la.* cells through ./bays.js
//   LA   the colours and measures shared with lazar.js
import { bayCells } from './bays.js';

export const LA = { wall: '#ece1c9', trim: '#faf7ee', plinth: '#aa9f86', frame: '#f4f1e8', roof: '#6d5b50', GH: 4.0, SH: 3.5, AX: 3.5 };
export function lazarCells(A, r) { bayCells(A, r, 'la', { ...LA, g: 'arch', u: 'flat', cas: 0.15, blind: 1, blindCol: '#4f6b4b' }); }
