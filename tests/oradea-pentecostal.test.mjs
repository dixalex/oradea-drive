// Headless checks for Oradea's Pentecostal churches, Adventist churches and Kingdom Halls (src/world/oradea/sites/pentecostal.js) on the compiled map:
// node tests/oradea-pentecostal.test.mjs
// Every footprint the site replaces is in map_buildings.json and owned by no other site (no skip list, no places.js building of anyone else),
// the site builds in budget with no NaN, as two named root groups (the buildings inside the phone tier's 1800 m disc in one, those outside it in
// their own) of at most 5 meshes each and 12 draw calls in all, every building stands at a sane height with a collider, the lots keep generated
// trees off, and the four tier-(a) sights are well formed. Skipped without the Oradea map.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import * as THREE from 'three';
import { createCollisionWorld } from '../src/world/collision.js';
import { createHeightField } from '../src/world/cherkasy/ground.js';
import { FRAME_OF } from '../src/world/cherkasy/frame.js';
import { SITE } from '../src/world/oradea/sites/pentecostal.js';
import { PLACES } from '../src/world/oradea/places.js';
import { inPoly } from '../src/world/cherkasy/geo.js';
import { clipToCentre, siteInCentre } from '../src/world/oradea/phone.js';

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
const ringOf = (b) => { const P = []; for (let i = 0; i < b.p.length; i += 2) P.push([b.p[i], b.p[i + 1]]); return P; };

ok(new Set(SITE.skip).size === SITE.skip.length, `skips ${SITE.skip.length} distinct footprints`);
for (const id of SITE.skip) ok(byId(id), `footprint ${id} is in map_buildings.json`);

// no building another site owns is touched: not in any other site's skip list, not a building of any other place, and no centre inside one
const others = new Map();   // id -> owner
const dir = new URL('../src/world/oradea/sites/', import.meta.url);
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.js') || f === 'pentecostal.js') continue;
  try { const m = await import(new URL(f, dir)); for (const id of m.SITE?.skip ?? []) others.set(+id, f); } catch (e) { log('note: could not load', f, e.message.slice(0, 60)); }
}
const mine = new Set(SITE.skip), placeIds = new Set(SITE.places.map((q) => q.id));
for (const q of PLACES) if (!placeIds.has(q.id)) for (const id of q.bld ?? []) if (!mine.has(id)) others.set(+id, `places.js:${q.id}`);
ok(others.size > 50, `${others.size} buildings owned by other sites and places collected`);
for (const id of SITE.skip) ok(!others.has(id), `${id} is not owned elsewhere${others.has(id) ? ' (' + others.get(id) + ')' : ''}`);
// the churches that belong to others stay theirs: Viața Nouă / BCUO, BSVO, Emanuel, the Orthodox cathedral, the Roman Catholic basilica
for (const id of [420863618, 717082633, 3530253, 286245390, 262832955, 421285030, 3000010737]) ok(!SITE.skip.includes(id), `${id} is another site's`);

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
  meshesOf[p?.name === 'landmark-pentecostal-far' ? 'far' : 'main']++;
  for (const v of o.geometry.attributes.position.array) if (!Number.isFinite(v)) nan = true;
});
ok(!nan, 'no NaN / infinite vertices');
ok(root.children.length === 2 && root.children[0].name === 'landmark-pentecostal' && root.children[1].name === 'landmark-pentecostal-far', `two root groups: ${root.children.map((c) => c.name).join(', ')}`);
ok(meshesOf.main <= 5 && meshesOf.far <= 5 && meshesOf.main + meshesOf.far <= 12, `${meshesOf.main} + ${meshesOf.far} meshes (draw calls) for the whole site, at most 12`);
ok(site.stats.callsPhone === meshesOf.main, `${site.stats.callsPhone} meshes on the phone tier (the far group is dropped there)`);
const TIER_A = ['betania', 'betel', 'filadelfia', 'tabor'];
for (const k of TIER_A) ok(site.stats.verts[k] > 1000 && site.stats.verts[k] <= 20000, `${k}: ${site.stats.verts[k]} vertices (hand-built, at most 20000)`);
for (const [k, n] of Object.entries(site.stats.verts)) if (k !== 'total' && !TIER_A.includes(k)) ok(n > 500 && n <= 4500, `${k}: ${n} vertices (kit building, at most 4500)`);
const NB = TIER_A.length + 5;
ok(site.stats.buildings === NB, `${site.stats.buildings} buildings built (4 hand-built, 5 from the kit)`);
ok(verts > 10000 && verts < 80000, `${(verts / 1000).toFixed(1)}k verts in all`);
ok(site.stats.skipped.length === 0, `nothing skipped (${site.stats.skipped.join(',')})`);
ok(site.footprints.length === NB, `${site.footprints.length} footprints`);
ok(site.footprints.every((f) => f.poly.length >= 3 && f.poly.flat().every(Number.isFinite) && f.h > 3 && f.h < 40), 'footprints have outlines and heights');
const fpIds = new Set(site.footprints.map((f) => f.id));
ok(SITE.skip.every((id) => fpIds.has(id)), 'a footprint for every skipped building');
// the far group holds exactly what lies outside the phone disc
const farNames = new Set(root.children[1].children.map((m) => m.name));
const outside = site.footprints.filter((f) => { const c = f.poly.reduce((s, p) => [s[0] + p[0] / f.poly.length, s[1] + p[1] / f.poly.length], [0, 0]); return Math.hypot(c[0], c[1]) > 1800; });
ok((outside.length > 0) === (farNames.size > 0), `${outside.length} buildings outside the 1800 m disc, ${farNames.size} meshes in the far group`);

// the phone tier: the map is clipped to the 1800 m disc, so the two far churches are not in it; the site still builds, the central group
// keeps its five meshes, the far group stays empty (nothing to drop)
{
  const pm = { buildings: map.buildings.slice(), region: map.region };
  clipToCentre(pm);
  const pcw = createCollisionWorld({ terrain: (x, z) => hf.heightAt(x, z) });
  const proot = new THREE.Group();
  const psite = SITE.build({ root: proot, map: pm, solids: pcw, zips: { edge() {} }, heightAt: hf.heightAt, ground: { heightAt: hf.heightAt }, geo: FRAME_OF(map) });
  const pm2 = [0, 0]; proot.traverse((o) => { if (o.isMesh) pm2[o.parent?.name === 'landmark-pentecostal-far' ? 1 : 0]++; });
  ok(pm2[0] === psite.stats.callsPhone && pm2[0] <= 5, `phone tier: ${pm2[0]} meshes in the central group (at most 5)`);
  ok(pm2[1] === 0, `phone tier: ${pm2[1]} meshes in the far group`);
  ok(psite.stats.skipped.slice().sort().join() === 'filadelfia,tabor', `phone tier: skipped ${psite.stats.skipped.join(',')} (the far two)`);
  ok(psite.stats.buildings === NB - 2, `phone tier: ${psite.stats.buildings} buildings built`);
  const byIdM = new Map(map.buildings.map((b) => [b.id, b]));
  ok(siteInCentre(SITE, byIdM, FRAME_OF(map)), 'phone tier: the site is in the disc, so it is built');
}

// each building: a collider on its footprint, taller than a man, lower than a cathedral
const top = (x, z) => cw.groundHeight(x, z, 80) - hf.heightAt(x, z);
for (const f of site.footprints) {
  const c = f.poly.reduce((s, p) => [s[0] + p[0] / f.poly.length, s[1] + p[1] / f.poly.length], [0, 0]);
  const h = top(...c);
  ok(h > 3.5 && h < 30, `${f.name}: solid ${h.toFixed(1)} m at the centre (footprint ${f.h.toFixed(1)} m)`);
  ok(site.clear(...c), `${f.name}: clear() keeps trees off`);
  const own = byId(f.id);
  ok(!map.buildings.some((b) => b.id !== f.id && others.has(b.id) && inPoly(ringOf(b), ...c)), `${f.name}: no other site's building under its centre`);
  void own;
}
ok(!site.clear(0, 0), 'clear() is false in Piața Unirii');

// the maps: the four tier-(a) sights (the orchestrator moves them into places.js); unique ids, bilingual strings
const IDS = ['penticostalabetania', 'penticostalafiladelfia', 'penticostalabetel', 'penticostalatabor'];
const SIGHTS = [...PLACES, ...SITE.places].filter((q) => IDS.includes(q.id));
ok(SIGHTS.length === IDS.length, `four sights (${SIGHTS.map((q) => q.id).join(', ')})`);
ok(new Set([...PLACES, ...SITE.places].map((q) => q.id)).size === PLACES.length + SITE.places.length, 'place ids are unique');
for (const q of SIGHTS) ok(q.kind === 'sight' && q.icon && q.name && q.note && q.bld?.length && q.bld.every((id) => byId(id) && SITE.skip.includes(id)), `${q.id}: kind, icon, name, note, and a replaced building`);
ok(SIGHTS.every((q) => !/—/.test(String(q.name) + String(q.note))), 'no em-dashes in the sights');
ok(typeof site.update === 'function', 'update(dt) drives the night glow');
site.update(0.016, null);

log(fails ? `${fails} failed` : 'all ok');
process.exit(fails ? 1 : 0);
