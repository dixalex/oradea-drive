// Headless checks for Oradea's trams (src/world/oradea/trams.js) on the compiled map: node tests/oradea-trams.test.mjs
// The network loads with its track and poles, routes of 500 m+ carry trams, every tram section stands on a track
// (within 0.5 m of an OSM tram way), the trams move with the wall clock, collide() pushes a body out of a tram and
// leaves a far one alone, clear() keeps trees off the track. Skipped when the Oradea map (or its trams) is absent.
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createHeightField } from '../src/world/cherkasy/ground.js';
import { buildTrams } from '../src/world/oradea/trams.js';

const A = new URL('../public/assets/oradea/', import.meta.url);
if (!existsSync(new URL('map.json', A))) { console.log('skip: no public/assets/oradea/map.json'); process.exit(0); }
const map = JSON.parse(readFileSync(new URL('map.json', A)));
if (!map.trams?.length) { console.log('skip: the map has no trams (config tools.trams, npm run map:oradea)'); process.exit(0); }
let fails = 0;
const log = console.log; console.log = () => {};
const ok = (c, msg) => { if (!c) { fails++; log('FAIL', msg); } else log('ok  ', msg); };

const hf = createHeightField(map, new Int16Array(readFileSync(new URL('dem.bin', A)).buffer.slice(0)));
const realNow = Date.now; let clock = 1.8e12; Date.now = () => clock;
const root = new THREE.Group();
const site = buildTrams({ map, root, heightAt: hf.heightAt, ground: { onAsphalt: () => false, isWater: () => false }, detailMat: null }); // no carriageway anywhere: a pole fits at every step
ok(site && site.stats.trackKm > 30, `track: ${site?.stats.trackKm} km in ${site?.stats.ways} ways`);
ok(site.stats.poles > 300, `overhead poles: ${site.stats.poles}`);
ok(site.stats.trams >= 10 && site.stats.routes >= 5, `${site.stats.trams} trams on ${site.stats.routes} routes`);

const mids = root.getObjectByName('tram-mids'), ends = root.getObjectByName('tram-ends'), M = new THREE.Matrix4();
const segs = map.trams.flatMap((w) => { const s = []; for (let i = 2; i < w.p.length; i += 2) s.push([w.p[i - 2], w.p[i - 1], w.p[i], w.p[i + 1]]); return s; });
const offTrack = (x, z) => { let best = Infinity; for (const [ax, az, bx, bz] of segs) { const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)); best = Math.min(best, Math.hypot(ax + dx * t - x, az + dz * t - z)); } return best; };
const pos = (m, i) => { m.getMatrixAt(i, M); return new THREE.Vector3().setFromMatrixPosition(M); };
let worst = 0;
for (let i = 0; i < mids.count; i++) worst = Math.max(worst, offTrack(pos(mids, i).x, pos(mids, i).z));
ok(worst < 0.5, `every middle section on a track (worst ${worst.toFixed(2)} m off)`);
const p0 = pos(mids, 0); clock += 10000; site.update(); const p1 = pos(mids, 0);
ok(p0.distanceTo(p1) > 20 && p0.distanceTo(p1) < 120, `a tram moves ${p0.distanceTo(p1).toFixed(0)} m in 10 s`);
const e0 = pos(ends, 0), e1 = pos(ends, 1);
ok(Math.abs(e0.distanceTo(e1) - 21.2) < 1.5, `the two cab sections ~21 m apart (${e0.distanceTo(e1).toFixed(1)} m)`);

const hit = site.collide({ x: p1.x + 0.4, y: p1.y + 0.3, z: p1.z }, 1, 1.3);
ok(hit && hit.depth > 0.1, 'collide pushes a body out of a tram');
ok(site.collide({ x: p1.x + 60, y: p1.y, z: p1.z }, 1, 1.3) === null, 'collide leaves a far body alone');
ok(site.clear(map.trams[0].p[0], map.trams[0].p[1]) && !site.clear(1e5, 1e5), 'clear() keeps trees off the track only');

Date.now = realNow;
console.log = log;
console.log(fails ? `${fails} FAILED` : 'all ok');
process.exit(fails ? 1 : 0);
