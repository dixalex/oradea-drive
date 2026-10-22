// Oradea (Romania) from OpenStreetMap: public/assets/oradea/map.json + map_buildings.json + dem.bin (compiled by
// CITY=oradea node tools/cherkasy/build_map.mjs; map data (c) OpenStreetMap contributors, ODbL). Frame: config.js
// tools.frame (origin at Piața Unirii), y up, the river plane at WATER_Y.
//
//   buildCity({ scene, renderer, onProgress?(fraction 0..1, text), params? }) -> Promise<world>
//
// A trimmed copy of src/world/cherkasy/city.js: the same world contract (raycast, groundHeight, surfaceAt,
// collideDynamic, ram, spawn / carSpawn, streetsAt, life, traffic, people, places, cherkasy { map, ground, hf, B,
// sites, ... } – the key keeps its upstream name, the HUD, maps and missions read it – update, setQuality, stats), with
// none of the Cherkasy hand-built sites, terrain hooks, shore strip or skip lists. Oradea's own hand-built places are
// modules in ./sites/ (contract at SITE_MODULES below); the generic ones (railways, river bridges, trams, shop signs) are in SITES. When upstream improves the generic parts of the Cherkasy file (water,
// DETAIL, spawn, the world object), port them here by hand.
import * as THREE from 'three';
import { loadCityTextures } from '../../kit/textures.js';
import { createFacadeMaterial } from '../facade.js';
import { createDetailMaterial } from '../materials.js';
import { createCollisionWorld, createCollisionDebug } from '../collision.js';
import { buildTrees } from '../trees.js';
import { buildWater, buildWetBands, buildPonds, waterNormalTexture } from '../water.js';
import { createGibs } from '../../npc/gibs.js';
import { createPeople } from '../../npc/people.js';
import { createHeightField, buildGroundAsync } from '../cherkasy/ground.js';
import { buildCityBuildings } from '../cherkasy/buildings.js';
import { treeSpots, footprintRaster } from '../cherkasy/greenery.js';
import { createTreeBreaker } from '../cherkasy/treebreak.js';
import { buildCherkasyTraffic } from '../cherkasy/traffic.js';
import { loadTrafficVehicles } from '../../npc/vehicles.js';
import { ringPts, bboxOf } from '../cherkasy/geo.js';
import { resolvePlaces } from '../cherkasy/places.js';
import { FRAME_OF } from '../cherkasy/frame.js';
import { buildRails } from '../cherkasy/station_rails.js';
import { ukrainianSigns } from '../cherkasy/signs.js';
import { createFarCull } from '../farcull.js';
import { createSiteProxies } from '../cherkasy/proxies.js';
import { buildCarParks } from '../cherkasy/carparks.js';
import { SIGN_ROWS } from './signs.js';
import { liftBanks, shapeBridges, buildBridges } from './river.js';
import { buildTrams } from './trams.js';
import { buildShopSigns } from './shopsigns.js';
import { buildParks } from './parks.js';
import { installFeedbackKey } from './feedback.js';
import { PLACES } from './places.js';
import CONFIG from './config.js';
import { ASSETS } from '../../city.js';
import { t } from '../../i18n.js';

const guard = (label, fn, fallback = null) => { try { return fn() ?? fallback; } catch (e) { console.error(`[oradea] ${label} failed`, e); return fallback; } };
const nextTask = () => new Promise((res) => { const ch = new MessageChannel(); ch.port1.onmessage = () => { ch.port1.close(); res(); }; ch.port2.postMessage(0); });
const nextFrame = () => new Promise((res) => (typeof requestAnimationFrame === 'function' && !document.hidden ? requestAnimationFrame(() => res()) : setTimeout(res, 0)));

// Oradea's built-in sites: [label, builder(base), reads ground]; the hand-built places come from ./sites/ (below)
const SITES = [
  ['railways', (b) => buildRails(b, {}), true],
  ['bridges', (b) => buildBridges(b, b.bridges), true],
  ['trams', (b) => buildTrams(b), true],
  ['shop signs', (b) => buildShopSigns({ root: b.root, map: b.map, heightAt: b.ground.heightAt, skip: b.skip }), true],
];

// What each graphics level draws (as in cherkasy/city.js DETAIL)
const DETAIL = {
  high: { trees: {}, bld: {}, sites: {}, people: [300, 1], traffic: [700, 1], water: { on: true }, facade: 1 },
  medium: {
    trees: { nearOut: [55, 68], midOut: [220, 250], farOut: [1100, 1250], shadow: 110 },
    bld: { detailFar: 1800, detailShadow: 250, facadeShadow: 600 },
    sites: { ratio: 1 / 150, shadow: 450 }, proxy: 500, people: [220, 0.85], traffic: [500, 0.85], water: { on: true, hz: 8, scale: 0.3 }, facade: 1.4,
  },
  low: {
    trees: { nearOut: [40, 50], midOut: [150, 175], farOut: [900, 1050], shadow: 60 },
    bld: { detailFar: 1100, detailShadow: 150, facadeShadow: 300 },
    sites: { ratio: 1 / 60, shadow: 200 }, proxy: 250, people: [150, 0.7], traffic: [350, 0.7], water: { on: false }, facade: 2,
  },
};

const { at: SPAWN, look: SPAWN_LOOK, carDir: CAR_DIR } = CONFIG.spawn;

// The hand-built places: one module per place in ./sites/, each exporting
//   SITE = { id, label?, skip?: [OSM building ids it replaces], places?: [places.js entries it adds],
//            shape?(hf, map, geo) (terrain, before the ground is built), ground?: true (build once the ground exists),
//            build(base) -> { update?(dt, camera), clear?(x, z), deckAt?(x, z), footprints?, spots?, parked?, collide? } | null }
// base = { root, T, map, solids, zips, heightAt, ground, geo, facadeMat, detailMat, railLevel, bridges }. A module that
// fails to load or build is logged and left out; the rest of the city carries on.
const SITE_MODULES = import.meta.glob('./sites/*.js');
// canopy.bin (tools/oradea/canopy.py, Meta + WRI CHMv2, CC BY 4.0): 4 m cells, set where a real tree crown stands within
// 4 m -> (x, z) -> bool for the tree generator (street rows and yard trees only where real trees are), or null
function canopyAt(buf) {
  if (!buf || buf.byteLength < 24) return null;
  const [magic, x0, z0, cell, w, h] = new Int32Array(buf, 0, 6), bits = new Uint8Array(buf, 24);
  if (magic !== 0x59504e43 || bits.length * 8 < w * h) return null;
  return (x, z) => {
    const i = Math.floor((x - x0) / cell), j = Math.floor((z - z0) / cell);
    if (i < 0 || j < 0 || i >= w || j >= h) return false;
    const k = j * w + i; return (bits[k >> 3] >> (k & 7) & 1) === 1;
  };
}
async function loadSites() {
  const out = [];
  for (const [path, load] of Object.entries(SITE_MODULES).sort(([a], [b]) => a.localeCompare(b))) {
    try { const m = await load(); if (m.SITE?.build) out.push(m.SITE); } catch (e) { console.error(`[oradea] site ${path} failed to load`, e); }
  }
  return out;
}

export async function buildCity({ scene, renderer, onProgress = null, params = new URLSearchParams(globalThis.location?.search ?? '') }) {
  installFeedbackKey(); // key I -> the WhatsApp feedback chat (feedback.js)
  const t0 = performance.now(), stages = {};
  let tPrev = t0;
  const stage = (name, f, text) => {
    const now = performance.now(); stages[name] = Math.round(now - tPrev); tPrev = now;
    onProgress?.(f, text);
  };
  onProgress?.(0.02, t('Încărcăm harta Oradiei…', 'Loading the map of Oradea…'));
  if (!params.has('notraffic')) loadTrafficVehicles();
  const asset = (f) => fetch(`${ASSETS}${f}`);
  const [T, map, buildingsJson, demBuf, handBuilt, canopyBuf] = await Promise.all([
    loadCityTextures(renderer),
    asset('map.json').then((r) => r.json()),
    asset('map_buildings.json').then((r) => r.json()),
    asset('dem.bin').then((r) => r.arrayBuffer()),
    loadSites(),
    asset('canopy.bin').then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null),
  ]);
  map.buildings = buildingsJson;
  stage('load', 0.12, t('Relief și străzi…', 'Terrain and streets…'));

  const geo = guard('frame', () => FRAME_OF(map));
  const dem = new Int16Array(demBuf), hf = createHeightField(map, dem);
  // the narrow river (river.js): banks kept above the water, and the bridges over it on decks the lattice rides
  const banks = guard('banks', () => liftBanks(hf, dem, map.dem), 0);
  const bridges = guard('bridges', () => shapeBridges(hf, map), []);
  console.log(`[oradea] river: ${banks} bank lattice nodes lifted, ${bridges.length} bridges shaped`);
  for (const S of handBuilt) if (S.shape) guard(`${S.id} terrain`, () => S.shape(hf, map, geo));
  const ALL = [...SITES, ...handBuilt.map((S) => [S.label ?? S.id, (b) => S.build(b), !!S.ground])];
  T.signs = guard('signs', () => ukrainianSigns(SIGN_ROWS));
  const facadeMat = createFacadeMaterial(T), detailMat = createDetailMaterial(T);
  const root = Object.assign(new THREE.Group(), { name: 'city' });
  scene.add(root);

  const collision = createCollisionWorld({ cell: 24 });
  const zips = createZipStore();
  const skip = new Set(handBuilt.flatMap((S) => S.skip ?? []));
  let groundDone = false, bldF = 0;
  const report = () => onProgress?.(0.15 + 0.55 * (0.3 * (groundDone ? 1 : 0) + 0.7 * bldF),
    `${t('Relief, străzi, clădiri…', 'Terrain, streets, buildings…')} ${Math.round(100 * (0.3 * (groundDone ? 1 : 0) + 0.7 * bldF))}%`);
  const groundP = buildGroundAsync({ scene: root, T, map, hf, strip: null, renderer, mapUrl: `${ASSETS}map.json` }).then((g) => { groundDone = true; report(); return g; });
  const bldP = buildCityBuildings({ root, map, hf, solids: collision, zips, skip, facadeMat, detailMat, useWorkers: !params.has('noworkers'),
    onProgress: (f) => { bldF = f; report(); } });
  const base = { root, T, map, solids: collision, zips, heightAt: hf.heightAt, ground: null, geo, facadeMat, detailMat, railLevel: null, bridges, skip };
  const before = new Set(root.children);
  const built = ALL.map(() => null);
  const runSites = async (late) => {
    for (const [i, [label, fn, needsGround]] of ALL.entries()) {
      if (!!needsGround !== late) continue;
      built[i] = guard(label, () => fn(base));
      await nextTask();
    }
  };
  await runSites(false);
  waterNormalTexture();
  const ground = await groundP;
  const heightAt = ground.heightAt;
  collision.setTerrain({ height: ground.terrainHeight, surface: (x, z) => (ground.onAsphalt(x, z) ? 'asphalt' : ground.isWater(x, z) ? 'water' : 'ground'), minY: ground.band.minY, maxY: ground.band.maxY });
  stage('ground', 0.35, t('Monumente…', 'Landmarks…'));
  base.ground = ground;
  await runSites(true);
  const sites = built.filter(Boolean);
  const movers = sites.filter((s) => s.collide);
  stage('sites', 0.5, t('Clădiri…', 'Buildings…'));
  const Bld = await bldP;
  const B = Bld.B;
  const notSite = new Set([...before, ground.root, ...Bld.meshes]);
  const siteRoots = root.children.filter((o) => !notSite.has(o));
  const farCull = createFarCull(siteRoots);
  let proxies = null;
  for (const s of sites) if (s.footprints) B.footprints.push(...s.footprints);
  // park furniture and street sculpture from the map, wherever no hand-built site has its own (parks.js); after the
  // buildings, whose colliders it keeps off, and before the trees, which keep off it
  const parkKit = guard('parks', () => buildParks({ root, map, solids: collision, heightAt, onAsphalt: ground.onAsphalt, covered: (x, z) => sites.some((s) => s.clear?.(x, z)) }));
  if (parkKit) sites.push(parkKit);
  stage('buildings', 0.72, t('Apă și copaci…', 'Water and trees…'));
  await nextFrame();

  // water: the river at one level (no reservoir to the horizon: land all round), the banks' wet bands, ponds
  const water = buildWater({ scene: root, T, renderer, shoreDist: ground.shoreDist, skirtWater: () => false });
  const wet = buildWetBands({ scene: root, T, segs: ground.wetSegs, isWater: ground.isWater });
  const ponds = buildPonds({ scene: root, map, heightAt });

  const occ = footprintRaster(B.footprints, map.region);
  const spots = treeSpots({ map, ground, footprints: B.footprints, occ, clear: sites.filter((s) => s.clear).map((s) => s.clear),
    extra: sites.flatMap((s) => s.spots ?? []), sparse: null, real: canopyAt(canopyBuf) });
  const trees = buildTrees({ scene: root, T, spots, maxScale: 3.2, heightAt, floorY: hf.data.grid.reduce((m, h) => Math.min(m, h), Infinity) - 5 });
  const trunks = new Map();
  trees.addSolids((c) => { trunks.set(c.item, collision.cyl(c.x, c.z, c.y0, c.y1, c.r, c.r, 'tree')); });
  stage('trees', 0.78, t('Mașini și oameni…', 'Cars and people…'));
  await nextFrame();

  const debris = createGibs(root, (x, z, y) => collision.groundHeight(x, z, y ?? 1e4), { blood: params.has('blood') });
  let traffic = null, people = null, carParks = null;
  if (!params.has('notraffic')) {
    const decks = sites.filter((s) => s.deckAt);
    const deckAt = (x, z) => { for (const s of decks) { const y = s.deckAt(x, z); if (y != null) return y; } return null; };
    try { traffic = await buildCherkasyTraffic({ scene: root, map, ground, deckAt }); } catch (e) { console.error('[oradea] traffic failed', e); }
  }
  stage('traffic', 0.9, t('Oameni…', 'People…'));
  if (!params.has('nopeds')) {
    people = guard('people', () => createPeople({ scene: root, map, ground: { heightAt, onAsphalt: ground.onAsphalt, isWater: ground.isWater, isBuilding: (x, z) => occ.get(x, z) === 1 },
      buildings: map.buildings, traffic, gibs: debris }));
  }
  if (traffic) {
    traffic.attachSolids(collision, collision.groundHeight);
    traffic.sim.addParkingSpots(sites.flatMap((s) => s.parked ?? []));
    carParks = guard('car parks', () => buildCarParks({ map, occ, heightAt, solids: collision, sites, scene: root, renderer }));
    if (carParks) traffic.sim.addParkingLots(carParks.lots);
    traffic.sim.setDebris(debris);
    if (people) traffic.setPeds(people);
  }
  if (globalThis.window && people) window.__cherkasyPeds = people;
  const treeBreak = createTreeBreaker({ scene: root, trees, collision, trunks, debris });
  collision.finalize();
  const geoDebug = createCollisionDebug(root, collision);
  geoDebug.enabled = params.has('coll');
  stage('life', 0.96, t('Shadere…', 'Shaders…'));

  // ---- spawn points
  const free = (x, z) => !ground.onAsphalt(x, z) && collision.topAt(x, z).id < 0;
  const spawn = new THREE.Vector3(SPAWN[0], 0, SPAWN[1]);
  const found = spiralFind(SPAWN[0], SPAWN[1], 2, 40, 8, free);
  if (found) spawn.set(found[0], 0, found[1]);
  spawn.y = collision.groundHeight(spawn.x, spawn.z);
  const spawnYaw = Math.atan2(SPAWN_LOOK[0] - spawn.x, SPAWN_LOOK[1] - spawn.z);
  const car = carSpot(map, ground, collision, spawn);
  const carSpawn = car ? new THREE.Vector3(car.x, collision.groundHeight(car.x, car.z), car.z) : spawn.clone();
  const carSpawnYaw = car ? car.yaw : spawnYaw;

  let forced = params.get('cam') ? params.get('cam').split(',').map(Number) : null;
  const eye = spawn.clone().add(new THREE.Vector3(0, 1.7, 6)), aim = spawn.clone().add(new THREE.Vector3(0, 8, -200));
  const viewpoints = { street: { pos: eye, target: aim, subject: spawn.clone() } };
  const ramZero = () => ({ dv: new THREE.Vector3(), push: new THREE.Vector3(), hits: 0, knocked: 0, severity: 0 });
  let lifeErr = false;
  const camPos = new THREE.Vector3();

  const world = {
    raycast: (o, d, max) => collision.raycast(o, d, max),
    groundHeight: (x, z, yHint) => collision.groundHeight(x, z, yHint),
    surfaceAt: (x, z, yHint) => collision.surfaceAt(x, z, yHint),
    spawn, spawnYaw, carSpawn, carSpawnYaw, viewpoints,
    collideDynamic: traffic || movers.length ? (p, r, h) => traffic?.collideDynamic(p, r, h) ?? movers.reduce((hit, s) => hit ?? s.collide(p, r, h), null) : null,
    ram(q) {
      const r = traffic?.sim?.ram ? traffic.sim.ram(q) : ramZero();
      const tb = treeBreak.hit(q);
      if (tb.n) { r.dv.x -= q.v.x * (1 - tb.keep); r.dv.z -= q.v.z * (1 - tb.keep); r.trees = tb.n; r.severity = Math.max(r.severity, 0.35); }
      r.people = people?.hitBox && Math.hypot(q.v.x, q.v.y, q.v.z) > 3
        ? people.hitBox({ x: q.x, z: q.z, fx: q.fx, fz: q.fz, hl: q.hl, hw: q.hw, y0: q.y, y1: q.y + q.h, vx: q.v.x, vy: q.v.y, vz: q.v.z }) : 0;
      return r;
    },
    streetsAt: (x, z) => ({ type: ground.onAsphalt(x, z) ? 'street' : 'sidewalk' }),
    getZipPoints: zips.query,
    setPlayer: (pos, vel) => traffic?.setPlayer(pos, vel),
    alarm: (pos, r) => people?.alarm?.(pos, r),
    honk: (q) => people?.honk?.(q),
    life: { traffic: traffic?.sim ?? null, crowd: people },
    traffic, people, trees, water, debris, treeBreak, collision, geoDebug,
    bridgeLimit: null, bridgeDeckY: () => null,
    propAnchors: () => [], grabbables: () => [], grabProp: () => null, releaseProp: () => {},
    buildings: B.boxes, footprints: B.footprints,
    getMapFeatures: () => mapFeatures(map, B),
    places: guard('places', () => {
      const partners = Object.assign({}, ...sites.map((x) => x.partners));
      return resolvePlaces(map, geo, [...PLACES, ...handBuilt.flatMap((S) => S.places ?? [])]).map((q) => Object.assign(q, partners[q.id]));
    }, []),
    textures: T, materials: { facade: facadeMat, detail: detailMat, ground: ground.root.children[0]?.material ?? null },
    cherkasy: { map, ground, hf, B, sites, landmarks: {}, carParks, setCam: (c) => { forced = c; } },
    update(dt, camera) {
      water.update(dt, camera); wet.update?.(dt); ponds.update?.(dt);
      if (!camera) return;
      if (forced) { camera.position.fromArray(forced); camera.lookAt(...forced.slice(3, 6)); }
      camPos.copy(camera.position);
      Bld.update(camPos);
      trees.update(dt, camPos, camera);
      geoDebug.update(camera);
      for (const s of sites) if (s.update && !s.failed) try { s.update(dt, camera); } catch (e) { s.failed = true; console.error('[oradea] site update failed, stopped', e); }
      farCull.update(camPos); proxies?.update(camPos);
      debris.update(dt); treeBreak.update(dt);
      try { traffic?.update(dt, camera); people?.update(dt, camera); } catch (e) { if (!lifeErr) { lifeErr = true; console.error('[oradea] life update failed', e); } }
    },
    setQuality(q) {
      const D = DETAIL[q] || DETAIL.high;
      trees.setDetail(D.trees); Bld.setDetail(D.bld); farCull.set(D.sites); proxies?.set(D.proxy); facadeMat.setDetail(D.facade);
      people?.setDrawDistance(...D.people); traffic?.sim?.setDrawDistance(...D.traffic);
      water.setReflection(D.water.on, D.water);
    },
    stats: () => ({ loadMs: world.loadMs, stages, solids: collision.count, zips: zips.count, buildings: Bld.stats(), ground: ground.stats, trees: trees.stats(),
      spots: spots.stats, carParks: carParks?.stats() ?? null, farCull: farCull.stats(), proxies: proxies?.stats() ?? null, traffic: traffic?.stats() ?? null, people: people?.stats?.() ?? null, treeBreak: treeBreak.stats(), sites: sites.length }),
  };
  world.cherkasy.proxies = proxies = guard('proxies', () => createSiteProxies({ parent: root, roots: siteRoots, places: world.places, map, skip, heightAt, facadeMat, detailMat }));
  world.loadMs = Math.round(performance.now() - t0);
  console.log(`[oradea] built in ${world.loadMs} ms: ${B.footprints.length} buildings, ${collision.count} solids, ${spots.length} trees, ${sites.length} sites | ${Object.entries(stages).map(([k, v]) => k + ' ' + v).join(', ')}`);
  return world;
}

// the car starts on the carriageway next to the spawn: nearest wide asphalt, the right-hand lane of the closest motor
// road, heading the way closest to CAR_DIR (as in cherkasy/city.js)
function carSpot(map, ground, collision, spawn) {
  const A = (x, z) => ground.onAsphalt(x, z);
  const wide = (x, z) => [[0, 0], [2, 0], [-2, 0], [0, 2], [0, -2]].every(([u, w]) => A(x + u, z + w)) && collision.topAt(x, z).id < 0;
  const best = spiralFind(spawn.x, spawn.z, 1, 30, 16, wide);
  if (!best) return null;
  let bd = Infinity, dir = CAR_DIR, foot = null;
  for (const rd of map.roads) {
    if (rd.k !== 'm') continue;
    for (let i = 2; i + 1 < rd.p.length; i += 2) {
      const ax = rd.p[i - 2], az = rd.p[i - 1], ex = rd.p[i] - ax, ez = rd.p[i + 1] - az, L2 = ex * ex + ez * ez;
      if (L2 < 1) continue;
      let f = ((best[0] - ax) * ex + (best[1] - az) * ez) / L2;
      f = f > 1 ? 1 : f < 0 ? 0 : f;
      const px = ax + f * ex, pz = az + f * ez, d = Math.hypot(best[0] - px, best[1] - pz);
      if (d >= bd) continue;
      bd = d; foot = [px, pz];
      const L = Math.sqrt(L2), sg = ex * CAR_DIR[0] + ez * CAR_DIR[1] < 0 ? -1 : 1;
      dir = [sg * ex / L, sg * ez / L];
    }
  }
  const at = foot && bd < 12 ? [foot[0] - dir[1] * 1.9, foot[1] + dir[0] * 1.9] : best;
  return { x: at[0], z: at[1], yaw: Math.atan2(dir[0], dir[1]) };
}

function spiralFind(cx, cz, step, rings, count, test) {
  for (let k = 0; k < rings; k++) {
    const r = k * step;
    for (let m = 0; m < count; m++) {
      const x = cx + r * Math.cos(2 * Math.PI * m / count), z = cz + r * Math.sin(2 * Math.PI * m / count);
      if (test(x, z)) return [x, z];
    }
  }
  return null;
}

// anchor points for the legacy zip / grab mechanics: points and sampled edges in 32 m buckets
function createZipStore() {
  const C = 32, cells = new Map(), key = (i, j) => i * 65536 + j;
  let count = 0;
  const add = (x, y, z, nx = 0, ny = 1, nz = 0, kind = 'point') => {
    if (![x, y, z].every(Number.isFinite)) return;
    const k = key(Math.floor(x / C), Math.floor(z / C));
    (cells.get(k) ?? cells.set(k, []).get(k)).push({ x, y, z, nx, ny, nz, kind });
    count++;
  };
  return {
    add,
    edge(ax, az, bx, bz, y, nx, nz, kind = 'roofEdge', step = 4) {
      const pieces = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / step)), dx = (bx - ax) / pieces, dz = (bz - az) / pieces;
      for (let x = ax, z = az, left = pieces; left >= 0; left--, x += dx, z += dz) add(x, y, z, nx, 0, nz, kind);
    },
    query(c, r, kinds = null) {
      const out = [];
      for (let i = Math.floor((c.x - r) / C); i <= Math.floor((c.x + r) / C); i++) {
        for (let j = Math.floor((c.z - r) / C); j <= Math.floor((c.z + r) / C); j++) {
          for (const p of cells.get(key(i, j)) ?? []) {
            if ((p.x - c.x) ** 2 + (p.y - c.y) ** 2 + (p.z - c.z) ** 2 <= r * r && (!kinds || kinds.includes(p.kind))) out.push(p);
          }
        }
      }
      return out;
    },
    get count() { return count; },
  };
}

// minimap / map-menu features
function mapFeatures(map, B) {
  const R = map.region, rings = (list) => list.map((r) => ringPts(r[0]));
  return {
    bounds: { x0: R.x0 - 150, z0: R.z0 - 150, x1: R.x1 + 150, z1: R.z1 + 150, free: true },
    land: rings(map.land), farLand: [],
    blocks: map.land.map((r) => ({ poly: ringPts(r[0]), holes: r.slice(1).map(ringPts) })),
    buildings: B.footprints.filter((f) => f.kind !== 'shed').map((f) => ({ ...bboxOf(f.poly), h: f.h, kind: f.kind, poly: f.poly })),
    streets: [], water: rings(map.water),
    parks: rings([...(map.cover.park ?? []), ...(map.cover.forest ?? [])]),
    parkWater: [], avenueNames: [], inPark: () => false, extent: 20000,
  };
}
