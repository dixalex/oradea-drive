// OWNER: oradea. Gara Oradea (the main railway station, OSM 242379148) and Sala Polivalentă Oradea Arena (OSM 998980470),
// two hand-built public buildings in ./gara/ (station.js, arena.js; kit.js holds the shared frame, atlas, roof and texture
// helpers). Site contract of src/world/oradea/city.js: SITE { id, label, skip, ground, build(base) -> { update, clear,
// footprints } }.
import { buildStation, OSM_ID as STATION_ID } from './gara/station.js';
import { buildArena, OSM_ID as ARENA_ID } from './gara/arena.js';

const guard = (label, fn) => { try { return fn(); } catch (e) { console.error(`[oradea] ${label} failed`, e); return null; } };

export const SITE = {
  id: 'gara',
  label: 'Gara Oradea and Oradea Arena',
  skip: [STATION_ID, 3000011216, ARENA_ID], // the station and the Overture footprint of its platform shed (it stands on platform 1)
  ground: true,
  build(base) {
    const { root, solids: S, zips, map } = base, H = base.ground?.heightAt ?? base.heightAt;
    const onAsphalt = base.ground?.onAsphalt;
    const parts = [guard('Gara Oradea', () => buildStation({ root, S, H, zips, map, onAsphalt })), guard('Oradea Arena', () => buildArena({ root, S, H, zips, map, onAsphalt }))].filter(Boolean);
    if (!parts.length) return null;
    return {
      footprints: parts.flatMap((p) => p.footprints ?? []),
      clear: (x, z) => parts.some((p) => p.clear?.(x, z)),
      update(dt, camera) { for (const p of parts) p.update?.(dt, camera); },
    };
  },
};
