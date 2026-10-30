// OWNER: oradea. The road overpasses of the west: Strada Teodor Neș over the railway yard, Strada Podului over Bulevardul
// Dacia and its tram, Calea Borșului's two new carriageways over the old road (OSM start_date 2024), and the northern
// ring road (trunk) over the railway and Calea Sântandrei and over the service roads west of it. OSM ways below; the
// decks, ramps and piers are ./passages/deck.js (the ramps run on along each carriageway's own road ways). Traffic rides
// the decks of the primary and secondary roads (deckAt; npc/lanes.js has no trunk roads). The phone tier keeps none.
import { deckSite } from './passages/deck.js';

export const VEST = [
  { id: 'teodor-nes', name: 'Pasajul Teodor Neș', centre: [-1198, -2222], ways: [41235780] },
  { id: 'podului-n', name: 'Podul de pe Strada Podului', centre: [-2480, -1000], ways: [27826383] },
  { id: 'podului-s', name: 'Podul de pe Strada Podului', centre: [-2480, -1000], ways: [130405036] },
  { id: 'borsului-n', name: 'Pasajul Calea Borșului', opened: '2024', centre: [-5200, -1175], ways: [1240358090, 1240358092, 1240358091] },
  { id: 'borsului-s', name: 'Pasajul Calea Borșului', opened: '2024', centre: [-5200, -1175], ways: [1240358093, 1240358095, 1240358094] },
  { id: 'centura-santandrei-1', name: 'Centura peste calea ferată', centre: [-2520, 2160], ways: [828978727] },
  { id: 'centura-santandrei-2', name: 'Centura peste calea ferată', centre: [-2520, 2160], ways: [828978728] },
  { id: 'centura-nv-1', name: 'Centura', centre: [-2880, 1805], ways: [828978730] },
  { id: 'centura-nv-2', name: 'Centura', centre: [-2880, 1805], ways: [828978731] },
];
export const SITE = deckSite({ id: 'passages-vest', label: 'Pasajele din vest', decks: VEST });
