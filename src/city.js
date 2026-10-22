// The city this build plays. VITE_CITY=oradea (npm run dev:oradea / build:oradea) -> src/world/oradea/config.js; unset
// -> null, and every shared module keeps its Cherkasy value (`CITY?.x ?? <Cherkasy value>`), so upstream Cherkasy code
// and its tests run unchanged.
//   CITY: the city config or null;  ASSETS: the folder of map.json / map_buildings.json / dem.bin, under the base URL
import oradea from './world/oradea/config.js';

export const CITY = import.meta.env?.VITE_CITY === 'oradea' ? oradea : null;
export const ASSETS = `${import.meta.env?.BASE_URL ?? '/'}${CITY?.assets ?? 'assets/cherkasy/'}`;
