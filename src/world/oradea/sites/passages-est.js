// OWNER: oradea. The road overpasses of the east: Strada Ogorului's long viaduct, the Sânmartin bypass over Ogorului and
// the ring road, and the ring road's new bridges (OSM start_date 2026) over the service roads. OSM ways below; the decks,
// ramps and piers are ./passages/deck.js. These are trunk roads (npc/lanes.js has none: no traffic on them). The phone
// tier keeps none.
import { deckSite } from './passages/deck.js';

export const EST = [
  { id: 'ogorului-viaduct-1', name: 'Viaductul Ogorului', centre: [3580, 1660], ways: [388683031] },
  { id: 'ogorului-viaduct-2', name: 'Viaductul Ogorului', centre: [3580, 1660], ways: [388683032] },
  { id: 'sanmartin', name: 'Varianta Sânmartin', centre: [4006, 1189], ways: [971372716] },
  { id: 'centura-e-1', name: 'Centura', opened: '2026', centre: [4290, 910], ways: [1550337083, 1472488706, 1550342388] },
  { id: 'centura-e-2', name: 'Centura', opened: '2026', centre: [4290, 910], ways: [1550337082, 1472488708, 1550342387] },
];
export const SITE = deckSite({ id: 'passages-est', label: 'Pasajele din est', decks: EST });
