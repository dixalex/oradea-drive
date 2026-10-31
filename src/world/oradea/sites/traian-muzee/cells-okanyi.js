// OWNER: oradea. Atlas cells of the Okányi-Schwartz villa (Str. Mihai Eminescu 25A; Marcell Komor and Dezső Jakab for Jakab Schwarz, 1912,
// builder Ferenc Sztarill; the Bihor Chamber of Commerce since 2014; not a site module): a two-storey Secession villa in pale yellow
// render with ochre bands and green sashes. The look is a guess (oradeaheritage.ro gives the history and photographs without a description).
//   okanyiCells(A, r)   adds ok.* cells through ./bays.js
//   OK   the colours and measures shared with okanyi.js
import { bayCells } from './bays.js';

export const OK = { wall: '#ebe0b0', trim: '#d9bb78', plinth: '#a89a72', frame: '#4f7a5a', accent: '#d9bb78', roof: '#5f5148', GH: 4.3, SH: 3.7, AX: 3.4 };
export function okanyiCells(A, r) { bayCells(A, r, 'ok', { ...OK, g: 'arch', u: 'flat', cas: 0.15, blind: 0, door: '#4a3a2c' }); }
