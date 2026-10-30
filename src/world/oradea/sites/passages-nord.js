// OWNER: oradea. The road overpasses of the north: the "Drumul expres" ring (Centura mică) over Strada Gheorghe Doja and
// over Strada Piatra Craiului, Strada Ogorului's new bridges (OSM start_date 2021) and the two side roads over Ogorului.
// OSM ways below; the decks, ramps and piers are ./passages/deck.js. Traffic rides the decks of the primary, secondary
// and tertiary roads (deckAt; npc/lanes.js has no trunk roads). The phone tier keeps the ones inside its centre.
import { deckSite } from './passages/deck.js';

export const NORD = [
  { id: 'expres-doja', name: 'Drumul expres peste Strada Gheorghe Doja', centre: [540, -1140], ways: [387529969] },
  { id: 'expres-piatra-craiului', name: 'Drumul expres peste Strada Piatra Craiului', centre: [1452, -840], ways: [692487426] },
  { id: 'ogorului-v-1', name: 'Strada Ogorului', opened: '2021', centre: [-117, 2217], ways: [692174660, 864620321, 864619181] },
  { id: 'ogorului-v-2', name: 'Strada Ogorului', opened: '2021', centre: [-117, 2217], ways: [864618255, 864618257, 864618256] },
  { id: 'ogorului-x-1', name: 'Pasaj peste Strada Ogorului', centre: [1327, 2090], ways: [440561088] },
  { id: 'ogorului-x-2', name: 'Pasaj peste Strada Ogorului', centre: [2465, 2154], ways: [440561529] },
];
export const SITE = deckSite({ id: 'passages-nord', label: 'Pasajele din nord', decks: NORD });
