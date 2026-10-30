// Headless checks for Oradea's Reformed, Lutheran and Unitarian churches and synagogues (src/world/oradea/sites/reformed.js) on the compiled map:
// node tests/oradea-reformed.test.mjs
// Every OSM way the site replaces is in map_buildings.json, the site builds in budget with no NaN, as two named root groups (the central
// churches in one, Seleuș, which lies outside the phone tier's disc, in its own) of at most 7 meshes each, every building stands at a sane
// height with a collider, the lots keep generated trees off, and the five tier-(a) sights are well formed. Skipped without the Oradea map.
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createCollisionWorld } from '../src/world/collision.js';
import { createHeightField } from '../src/world/cherkasy/ground.js';
import { FRAME_OF } from '../src/world/cherkasy/frame.js';
import { SITE } from '../src/world/oradea/sites/reformed.js';
import { PLACES } from '../src/world/oradea/places.js';

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
// the buildings other sites own are not touched here: the Sion (Neolog) synagogue, the basilica, the Orthodox cathedrals
for (const id of [423122948, 262832955, 264917565, 286245385, 190653989]) ok(!SITE.skip.includes(id), `${id} is another site's`);

SITE.shape?.(hf, map);
const cw = createCollisionWorld({ terrain: (x, z) => hf.heightAt(x, z) });
const root = new THREE.Group();
const site = SITE.build({ root, map, solids: cw, zips: { edge() {} }, heightAt: hf.heightAt, ground: { heightAt: hf.heightAt }, geo: FRAME_OF(map) });
ok(site, 'builds');
let verts = 0, nan = false;
const meshesOf = { main: 0, far: 0 };
root.traverse((o) => {
  if (!o.isMesh) return;
  verts += o.geometry.attributes.position.count;
  let p = o.parent; while (p && p.parent !== root) p = p.parent;
  meshesOf[p?.name === 'landmark-reformed-seleus' ? 'far' : 'main']++;
  for (const v of o.geometry.attributes.position.array) if (!Number.isFinite(v)) nan = true;
});
ok(!nan, 'no NaN / infinite vertices');
ok(root.children.length === 2 && root.children[0].name === 'landmark-reformed' && root.children[1].name === 'landmark-reformed-seleus', `two root groups: ${root.children.map((c) => c.name).join(', ')}`);
ok(meshesOf.main <= 7 && meshesOf.far <= 7 && meshesOf.main + meshesOf.far <= 15, `${meshesOf.main} + ${meshesOf.far} meshes (draw calls) for the whole site`);
ok(site.stats.callsPhone === meshesOf.main, `${site.stats.callsPhone} meshes on the phone tier (Seleuș's group is dropped there)`);
const TIER_A = ['orasulnou', 'olosig', 'lutheran', 'greatsyn', 'aachvas'];
for (const k of TIER_A) ok(site.stats.verts[k] > 2500 && site.stats.verts[k] <= 20000, `${k}: ${site.stats.verts[k]} vertices (hand-built, at most 20000)`);
for (const [k, n] of Object.entries(site.stats.verts)) if (k !== 'total' && !TIER_A.includes(k)) ok(n > 500 && n <= 4500, `${k}: ${n} vertices (kit building, at most 4500)`);
ok(site.stats.churches === 13, `${site.stats.churches} buildings built (5 hand-built, 8 from the kit)`);
ok(verts > 20000 && verts < 80000, `${(verts / 1000).toFixed(1)}k verts in all`);
ok(site.stats.skipped.length === 0, `nothing skipped (${site.stats.skipped.join(',')})`);
ok(site.footprints.length === 13, `${site.footprints.length} footprints`);
ok(site.footprints.every((f) => f.poly.length >= 3 && f.poly.flat().every(Number.isFinite) && f.h > 3 && f.h < 40), 'footprints have outlines and heights');
const fpIds = new Set(site.footprints.map((f) => f.id));
ok(SITE.skip.every((id) => fpIds.has(id)), 'a footprint for every skipped building');

// each building: a collider on its footprint, taller than a man, lower than a cathedral
const top = (x, z) => cw.groundHeight(x, z, 80) - hf.heightAt(x, z);
for (const f of site.footprints) {
  const c = f.poly.reduce((s, p) => [s[0] + p[0] / f.poly.length, s[1] + p[1] / f.poly.length], [0, 0]);
  const h = top(...c);
  ok(h > 3.5 && h < 30, `${f.name}: solid ${h.toFixed(1)} m at the centre (footprint ${f.h.toFixed(1)} m)`);
  ok(site.clear(...c), `${f.name}: clear() keeps trees off`);
}
ok(!site.clear(0, 0), 'clear() is false in Piața Unirii');

// the maps: the five tier-(a) sights (the orchestrator moves them into places.js); unique ids, bilingual strings
const IDS = ['reformataorasulnou', 'reformataolosig', 'evanghelica', 'sinagogamare', 'aachvasrein'];
const SIGHTS = [...PLACES, ...SITE.places].filter((q) => IDS.includes(q.id));
ok(SIGHTS.length === IDS.length, `five sights (${SIGHTS.map((q) => q.id).join(', ')})`);
ok(new Set([...PLACES, ...SITE.places].map((q) => q.id)).size === PLACES.length + SITE.places.length, 'place ids are unique');
for (const q of SIGHTS) ok(q.kind === 'sight' && q.icon && q.name && q.note && q.bld?.every((id) => byId(id) && SITE.skip.includes(id)), `${q.id}: kind, icon, name, note, and a replaced building`);
ok(SIGHTS.every((q) => !/—/.test(q.name + q.note)), 'no em-dashes in the sights');
ok(typeof site.update === 'function', 'update(dt) drives the night glow');
site.update(0.016, null);

log(fails ? `${fails} failed` : 'all ok');
process.exit(fails ? 1 : 0);
