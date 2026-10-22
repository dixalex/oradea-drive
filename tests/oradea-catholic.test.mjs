// Headless checks for Oradea's Catholic churches (src/world/oradea/sites/catholic.js) on the compiled map: node tests/oradea-catholic.test.mjs
// Every OSM way the site replaces is in map_buildings.json, the site builds in budget with no NaN, as one named root group of at most 8
// meshes, each church stands at a sane height with a collider, the lots keep generated trees off, and the tier-(a) sights are well formed.
// Skipped without the Oradea map.
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createCollisionWorld } from '../src/world/collision.js';
import { createHeightField } from '../src/world/cherkasy/ground.js';
import { FRAME_OF } from '../src/world/cherkasy/frame.js';
import { SITE } from '../src/world/oradea/sites/catholic.js';
import { PLACES } from '../src/world/oradea/places.js';
import { toW as ursulineAt } from '../src/world/oradea/sites/catholic/ursuline.js';

const A = new URL('../public/assets/oradea/', import.meta.url);
if (!existsSync(new URL('map.json', A)) || !existsSync(new URL('map_buildings.json', A))) { console.log('skip: no public/assets/oradea/map.json (npm run map:oradea)'); process.exit(0); }
const ctx2d = new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true });
globalThis.document = { createElement: () => ({ width: 1, height: 1, getContext: () => ctx2d, style: {} }) };

let fails = 0;
const log = console.log; console.log = () => {};
const ok = (c, msg) => { if (!c) { fails++; log('FAIL', msg); } else log('ok  ', msg); };

const map = JSON.parse(readFileSync(new URL('map.json', A)));
map.buildings = JSON.parse(readFileSync(new URL('map_buildings.json', A)));
const dem = new Int16Array(readFileSync(new URL('dem.bin', A)).buffer.slice(0));
const hf = createHeightField(map, dem);
const byId = (id) => map.buildings.find((b) => b.id === id);

ok(new Set(SITE.skip).size === SITE.skip.length, `skips ${SITE.skip.length} distinct OSM buildings`);
for (const id of SITE.skip) ok(byId(id), `OSM building ${id} is in map_buildings.json`);
// the churches other sites own are not touched here
for (const id of [262832955, 264917565, 286245385, 190653989]) ok(!SITE.skip.includes(id), `${id} (basilica / St Ladislaus / GC cathedral / garrison church) is another site's`);

SITE.shape?.(hf, map);
const cw = createCollisionWorld({ terrain: (x, z) => hf.heightAt(x, z) });
const root = new THREE.Group();
const site = SITE.build({ root, map, solids: cw, zips: { edge() {} }, heightAt: hf.heightAt, ground: { heightAt: hf.heightAt }, geo: FRAME_OF(map) });
ok(site, 'builds');
let verts = 0, meshes = 0, nan = false;
root.traverse((o) => {
  if (!o.isMesh) return;
  meshes++; verts += o.geometry.attributes.position.count;
  for (const v of o.geometry.attributes.position.array) if (!Number.isFinite(v)) nan = true;
});
ok(!nan, 'no NaN / infinite vertices');
ok(root.children.length === 1 && root.children[0].name === 'landmark-catholic', `one root group: ${root.children.map((c) => c.name).join(', ')}`);
ok(meshes <= 8, `${meshes} meshes (draw calls) for the whole site`);
const TIER_A = ['premon', 'ursuline', 'seminar', 'duh', 'miseri', 'adormirea'];
for (const [k, n] of Object.entries(site.stats.verts)) ok(n > 300 && n <= (TIER_A.includes(k) ? 20000 : 6000), `${k}: ${n} vertices (${TIER_A.includes(k) ? 'hand-built, at most 20000' : 'kit church, at most 6000'})`);
ok(site.stats.churches === 15, `${site.stats.churches} churches built (13 OSM churches replaced, the hospital's ring rebuilt with the Misericordians', the Ursuline front)`);
ok(verts > 30000 && verts < 160000, `${(verts / 1000).toFixed(1)}k verts in all`);
ok(site.stats.skipped.length === 0, `no church skipped (${site.stats.skipped.join(',')})`);
const churches = site.footprints.filter((f) => f.kind === 'church');
ok(churches.length === site.stats.churches, `${churches.length} church footprints for ${site.stats.churches} churches (${site.footprints.length - churches.length} more for the hospital wings)`);
ok(site.footprints.every((f) => (f.kind === 'church' || f.kind === 'public') && f.poly.length >= 3 && f.poly.flat().every(Number.isFinite) && f.h > 3 && f.h < 60), 'footprints are churches with outlines and heights');
const wantIds = SITE.skip;
const fpIds = new Set(site.footprints.map((f) => f.id));
ok(wantIds.every((id) => fpIds.has(id)), 'a footprint for every skipped church');

// each church: a collider on its footprint, taller than a man, lower than a cathedral
const top = (x, z) => cw.groundHeight(x, z, 80) - hf.heightAt(x, z);
for (const f of site.footprints) {
  // the Ursuline front stands on the street edge of the Ady block's ring (drawn by sites/republicii), so its solids are the proud strip and the tower
  const c = f.id === 703829100 ? ursulineAt(0, 24) : f.poly.reduce((s, p) => [s[0] + p[0] / f.poly.length, s[1] + p[1] / f.poly.length], [0, 0]);
  const h = top(...c);
  ok(h > 3.5 && h < 40, `${f.name}: solid ${h.toFixed(1)} m at the centre (footprint ${f.h.toFixed(1)} m)`);
  ok(site.clear(...c), `${f.name}: clear() keeps trees off`);
}
ok(!site.clear(0, 0), 'clear() is false in Piața Unirii');

// the maps: the tier-(a) sights, moved into places.js; unique ids, bilingual strings
const IDS = ['premonstratense', 'sfanaursuline', 'seminargreco', 'duhsfant', 'mizericordieni'];
const SIGHTS = PLACES.filter((q) => IDS.includes(q.id));
ok(SITE.places.length === 0 && SIGHTS.length === IDS.length, `five sights in places.js (${SIGHTS.map((q) => q.id).join(', ')})`);
ok(new Set(PLACES.map((q) => q.id)).size === PLACES.length, 'place ids are unique');
for (const q of SIGHTS) ok(q.kind === 'sight' && q.icon && q.name && q.note && (q.bld?.every((id) => byId(id) && SITE.skip.includes(id)) || q.xz), `${q.id}: kind, icon, name, note, and a replaced building or a point`);
ok(SIGHTS.every((q) => !/\u2014/.test(q.name + q.note)), 'no em-dashes in the sights');
ok(typeof site.update === 'function', 'update(dt) drives the night glow');
site.update(0.016, null);

log(fails ? `${fails} failed` : 'all ok');
process.exit(fails ? 1 : 0);
