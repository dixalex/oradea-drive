// Which city the map tools work on. CITY=<id> reads src/world/<id>/config.js (its `tools` block); unset, the tools
// build Cherkasy from the constants in each of them, as before.
//   CITY: that config, or null for Cherkasy;  ID: 'cherkasy' | <id>
//   RAW: where fetch_osm.mjs / fetch_dem.mjs save and build_map.mjs reads (tools/cherkasy/raw/ or raw/<id>/, gitignored)
//   OUT: public/assets/<id>/ (map.json, map_buildings.json, dem.bin);  SITES: the folder whose OSM ids build_map keeps
export const ID = process.env.CITY || 'cherkasy';
export const CITY = ID === 'cherkasy' ? null : (await import(`../../src/world/${ID}/config.js`)).default;
export const RAW = new URL(CITY ? `./raw/${ID}/` : './raw/', import.meta.url);
export const OUT = new URL(`../../public/assets/${ID}/`, import.meta.url);
export const SITES = new URL(`../../src/world/${ID}/`, import.meta.url);
