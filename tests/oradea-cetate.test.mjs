// Headless checks for Cetatea Oradea (src/world/oradea/sites/cetate.js): node tests/oradea-cetate.test.mjs
// Skipped when the Oradea map is absent.
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';

const ctx2d = new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true });
globalThis.document = { createElement: () => ({ width: 1, height: 1, getContext: () => ctx2d, style: {} }) };
const A = new URL('../public/assets/oradea/', import.meta.url);
if (!existsSync(new URL('map.json', A))) { console.log('skip: no public/assets/oradea/map.json (npm run map:oradea)'); process.exit(0); }
const { createHeightField } = await import('../src/world/cherkasy/ground.js');
const { liftBanks } = await import('../src/world/oradea/river.js');
const { createCollisionWorld } = await import('../src/world/collision.js');
const { SITE } = await import('../src/world/oradea/sites/cetate.js');

let fails = 0;
const log = console.log; console.log = () => {};
const ok = (c, msg) => { if (!c) { fails++; log('FAIL', msg); } else log('ok  ', msg); };

const map = JSON.parse(readFileSync(new URL('map.json', A)));
map.buildings = JSON.parse(readFileSync(new URL('map_buildings.json', A)));
const dem = new Int16Array(readFileSync(new URL('dem.bin', A)).buffer.slice(0));
const hf = createHeightField(map, dem);
liftBanks(hf, dem, map.dem);
const t0 = performance.now();
SITE.shape(hf, map);
const tShape = performance.now() - t0;
const LAND = 0.15;                                  // the rendered land stands 0.15 m over heightAt (ground.js GY.LAND)
const S = createCollisionWorld({ terrain: (x, z) => hf.heightAt(x, z) + LAND });
const root = new THREE.Group();
const t1 = performance.now();
const site = SITE.build({ root, solids: S, map, heightAt: hf.heightAt, ground: { root: new THREE.Group(), heightAt: hf.heightAt }, T: {} });
const tBuild = performance.now() - t1;
ok(site && site.info, `the site builds (shape ${tShape.toFixed(0)} ms, build ${tBuild.toFixed(0)} ms)`);
const { info } = site, G = info.st.G;
let verts = 0, meshes = 0, nan = false;
root.traverse((o) => { if (o.isMesh) { meshes++; verts += o.geometry.attributes.position.count; for (const v of o.geometry.attributes.position.array) if (Number.isNaN(v)) nan = true; } });
ok(!nan, 'no NaN vertices');
ok(verts < 40000 && meshes <= 15, `budget: ${verts} verts in ${meshes} meshes (and the moat's re-laid ground tiles)`);

// ---- a car-sized box driven along waypoints (pushBox, as the game does): where does it end up?
function drive(path, step = 0.3) {
  const b = { x: path[0][0], y: S.groundHeight(path[0][0], path[0][1], 10) , z: path[0][1], yaw: 0, hl: 2.4, hw: 1.0, h: 1.7, step: 0.35, vertical: true };
  let worst = 0, k = 1;
  for (let guard = 0; guard < 6000 && k < path.length; guard++) {
    const [tx, tz] = path[k], dx = tx - b.x, dz = tz - b.z, d = Math.hypot(dx, dz);
    if (d < 1.0) { k++; continue; }
    b.yaw = Math.atan2(dx, dz);
    const nx = b.x + dx / d * step, nz = b.z + dz / d * step;
    b.x = nx; b.z = nz; b.y = S.groundHeight(nx, nz, b.y + 0.5);
    const out = S.pushBox(b);
    if (out) worst = Math.max(worst, out.depth ?? 0);
  }
  return { x: b.x, y: b.y, z: b.z, k, worst };
}
const gates = info.walls.gates, west = gates.find((g) => g.id === 'vest'), east = gates.find((g) => g.id === 'est');
const gAt = (g, a, o = 0) => [g.centre[0] + g.inward[0] * a - g.inward[1] * o, g.centre[1] + g.inward[1] * a + g.inward[0] * o];
const pas = info.palace.passage, pax = [pas.to[0] - pas.from[0], pas.to[1] - pas.from[1]], pal = Math.hypot(...pax), pu = [pax[0] / pal, pax[1] / pal];
const fromOutside = drive([gAt(west, -30), gAt(west, 9), [1030, -166.5], [pas.from[0] - pu[0] * 5, pas.from[1] - pu[1] * 5], [pas.to[0] + pu[0] * 6, pas.to[1] + pu[1] * 6], [1112, -176]]);
ok(fromOutside.k === 6 && Math.hypot(fromOutside.x - 1112, fromOutside.z + 176) < 3, `a car drives in by the west gate, over the bridge, through the wing's passage into the yard (ended ${fromOutside.x.toFixed(1)}, ${fromOutside.z.toFixed(1)}, leg ${fromOutside.k}/6)`);
const leave = drive([[1112, -176], [pas.to[0] + pu[0] * 6, pas.to[1] + pu[1] * 6], [pas.from[0] - pu[0] * 5, pas.from[1] - pu[1] * 5], [1030, -166.5], gAt(west, 9), gAt(west, -30)]);
ok(leave.k === 6, `and out again (leg ${leave.k}/6)`);
const eastIn = drive([gAt(east, -30), gAt(east, 9)]);
ok(eastIn.k === 2 && Math.hypot(eastIn.x - gAt(east, 9)[0], eastIn.z - gAt(east, 9)[1]) < 2, `the east gate's bridge and passage are open (leg ${eastIn.k}/2)`);
// walls hold: drive at the curtain, the moat's far edge and the palace from the open ground
const stops = (from, to) => { const r = drive([from, to]); return r.k < 2 ? Math.hypot(r.x - from[0], r.z - from[1]) : Infinity; };
const sample = [[1100, -55, 1100, -75], [1060, -250, 1040, -262], [1230, -140, 1215, -150]];   // inside the star toward the curtain (south, north, east)
for (const [x0, z0, x1, z1] of sample) {
  const d = stops([x0, z0], [x1, z1]);
  ok(d < Math.hypot(x1 - x0, z1 - z0) - 0.5, `a car driving at the curtain is stopped (${d.toFixed(1)} m of ${Math.hypot(x1 - x0, z1 - z0).toFixed(0)} m)`);
}
{
  const d = stops([1150, -150], [1100, -230]);
  ok(d < 70, `a car driving across the yard at the palace's north wing is stopped (${d.toFixed(1)} m)`);
}
{ // the moat's counterscarp from the street
  const u = west.inward, side = [west.centre[0] - u[1] * 12 - u[0] * 24, west.centre[1] + u[0] * 12 - u[1] * 24], to = [side[0] + u[0] * 14, side[1] + u[1] * 14];
  const d = stops(side, to);
  ok(d < 13.5, `the counterscarp stops a car beside the bridge (${d.toFixed(1)} m)`);
}

console.log = log;
console.log(fails ? `${fails} FAILED` : 'all ok');
process.exit(fails ? 1 : 0);
