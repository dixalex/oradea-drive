// Headless checks for the phone tier (?phone): node tests/oradea-phone.test.mjs
// The centre filter (phone.js clipToCentre on a small map and on the real Oradea map), the sites and meshes left out, the
// quality ladder in every render table, the reload guard (decision and boot record), the soft edge, the touch stick
// mapping and the touch API of core/input.js.
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import {
  CENTRE, GROUND_PAD, LINE_PAD, SITE_PAD, EDGE, LEVELS, START, GUARD_WINDOW,
  inDisc, cutLine, clipToCentre, anchorsOf, siteInCentre, outsideMeshes, guardDecision, boundary,
} from '../src/world/oradea/phone.js';
import { bootGuard } from '../src/world/oradea/phonegame.js';
import { stickAxes } from '../src/ui/touch.js';
import { createInput } from '../src/core/input.js';
import { createShadows } from '../src/render/shadows.js';
import { createDaylight } from '../src/render/daylight.js';
import { FRAME_OF } from '../src/world/cherkasy/frame.js';
import CONFIG from '../src/world/oradea/config.js';

let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL', msg); } else console.log('ok  ', msg); };
const root = new URL('..', import.meta.url).pathname;
const read = (f) => readFileSync(root + f, 'utf8');

// ---------------------------------------------------------------- the centre filter, a small map
{
  const sq = (x, z, s = 10) => [x - s, z - s, x + s, z - s, x + s, z + s, x - s, z + s];
  const map = {
    region: { x0: -6000, x1: 5000, z0: -3000, z1: 3000 },
    buildings: [{ id: 1, p: sq(0, 0) }, { id: 2, p: sq(1790, 0) }, { id: 3, p: sq(1830, 0) }, { id: 4, p: sq(0, -2500) }],
    roads: [{ p: [0, 0, 1000, 0, 2500, 0, 3000, 0], n: 'out and away' }, { p: [-100, 0, 100, 0], n: 'inside' },
      { p: [0, 2200, 0, 1000, 0, -1000, 0, -2200], n: 'through' }, { p: [4000, 0, 4100, 0], n: 'far' }],
    trams: [], rails: [{ p: [-3000, -3000, -2900, -2900] }],
    signs: [{ x: 10, z: 10 }, { x: 3000, z: 0 }], pois: [{ x: 0, z: 1900 }], trees: [[1, 1], [5000, 0]], junctions: [[0, 0, 5], [2000, 0, 5]],
    land: [[sq(0, 0, 500)], [sq(2400, 0, 200)], [sq(4000, 0, 200)]], asphalt: [[sq(2600, 0, 50)]], walks: [[sq(-2650, 0, 50)]], dirt: [[sq(0, 2650, 50)], [sq(0, 3000, 50)]],
    water: [[sq(5000, 5000, 100)]], parking: [{ id: 9, p: sq(100, 100, 5) }, { id: 10, p: sq(2500, 0, 5) }],
    cover: { park: [[sq(0, 0, 50)], [sq(9000, 0, 50)]] }, zones: { resid: [sq(0, 0, 50), sq(9000, 0, 50)] },
  };
  const C = { x: 0, z: 0, r: 1800 };
  const { keep, region, stats } = clipToCentre(map, C);
  ok(map.buildings.map((b) => b.id).join() === '1,2', `buildings by their centre inside the disc (kept ${map.buildings.map((b) => b.id)})`);
  ok(stats.buildings[0] === 4 && stats.buildings[1] === 2, 'the stats count before and after');
  const allIn = map.roads.every((r) => { for (let i = 0; i < r.p.length; i += 2) if (!inDisc(r.p[i], r.p[i + 1], C, LINE_PAD)) return false; return true; });
  ok(allIn && map.roads.length === 3, `roads cut to the disc + ${LINE_PAD} m (${map.roads.length} pieces, the far one gone)`);
  ok(map.roads.find((r) => r.n === 'inside').p.length === 4 && map.roads.find((r) => r.n === 'out and away').p.join() === '0,0,1000,0', 'an inside road is kept whole, a leaving one ends at its last point inside');
  ok(map.roads.find((r) => r.n === 'through').p.join() === '0,1000,0,-1000', 'a road through the disc keeps its inside run');
  ok(map.rails.length === 0 && map.signs.length === 1 && map.pois.length === 0 && map.trees.length === 1 && map.junctions.length === 1, 'lines and points outside are dropped');
  ok(keep.x0 === -C.r - GROUND_PAD && keep.x1 === C.r + GROUND_PAD && keep.z1 === C.r + GROUND_PAD, `the ground box is the disc + ${GROUND_PAD} m`);
  ok(map.land.length === 2 && map.asphalt.length === 1 && map.walks.length === 1 && map.dirt.length === 1, 'surfaces whose box meets the ground box stay (the one at 4 km goes)');
  ok(map.cover.park.length === 1 && map.zones.resid.length === 1, 'cover polygons and bare zone rings are filtered alike');
  ok(map.water.length === 1, 'the river is kept whole');
  ok(map.parking.map((q) => q.id).join() === '9', 'car parks by their centre');
  ok(region.x0 === -1900 && region.x1 === 1900 && region.z0 === -1900 && region.z1 === 1900 && map.region === region, 'map.region becomes the disc box (+100 m), inside the old region');
  ok(cutLine([0, 0, 5000, 0, 0, 10, 0, 20], C, 0).length === 1 && cutLine([0, 0, 5000, 0], C, 0).length === 0, 'cutLine: runs of two or more points');
}

// ---------------------------------------------------------------- the real map
{
  const map = JSON.parse(read('public/assets/oradea/map.json'));
  map.buildings = JSON.parse(read('public/assets/oradea/map_buildings.json'));
  const n0 = map.buildings.length, byId = new Map(map.buildings.map((b) => [b.id, b])), geo = FRAME_OF(map);
  const sites = {};
  for (const id of ['unirii', 'gara', 'cetate', 'bsvo', 'casaminunata', 'orthodox']) sites[id] = (await import(`../src/world/oradea/sites/${id}.js`)).SITE;
  ok(siteInCentre(sites.unirii, byId, geo) && siteInCentre(sites.gara, byId, geo) && siteInCentre(sites.cetate, byId, geo), 'Piața Unirii, the station and the fortress are in the centre');
  ok(!siteInCentre(sites.bsvo, byId, geo) && !siteInCentre(sites.casaminunata, byId, geo), 'BSVO (Calea Borșului) and Casa Minunată (3 km out) are left out');
  ok(siteInCentre(sites.orthodox, byId, geo), 'a site spread over the city stays when one of its places is in the centre');
  ok(anchorsOf({ places: [{ xz: [1, 2] }, { ring: [0, 0, 2, 0, 2, 2, 0, 2] }] }, byId, geo).map(String).join(';') === '1,2;1,1', 'anchors from places: xz, a ring centre');
  ok(siteInCentre({ id: 'none' }, byId, geo), 'a site with no anchors is built (its meshes are culled later)');
  const { stats } = clipToCentre(map, CENTRE);
  const share = map.buildings.length / n0;
  ok(share > 0.2 && share < 0.33, `the centre holds ${map.buildings.length} of ${n0} buildings (${(100 * share).toFixed(1)} %)`);
  ok(map.roads.length > 1500 && map.roads.length < stats.roads[0], `roads: ${stats.roads.join(' -> ')}`);
  ok(Math.abs(Math.hypot(...geo.toXZ(47.0553, 21.9289))) < 1, 'world 0, 0 is Piața Unirii (the frame origin): the disc is centred there');
  const allIn = map.buildings.every((b) => { let x = 0, z = 0; for (let i = 0; i < b.p.length; i += 2) { x += b.p[i]; z += b.p[i + 1]; } return inDisc(2 * x / b.p.length, 2 * z / b.p.length, CENTRE); });
  ok(allIn, 'every building left is inside the disc');
}

// ---------------------------------------------------------------- meshes outside the centre
{
  const g = new THREE.Group(), geo = new THREE.BoxGeometry(10, 10, 10), m = new THREE.MeshBasicMaterial();
  const near = new THREE.Mesh(geo, m); near.position.set(100, 0, 0);
  const edge = new THREE.Mesh(geo, m); edge.position.set(CENTRE.r + SITE_PAD - 2, 0, 0);
  const far = new THREE.Mesh(geo, m); far.position.set(0, 0, CENTRE.r + SITE_PAD + 40);
  g.add(near, edge, far); g.updateMatrixWorld(true);
  const out = outsideMeshes([g], CENTRE);
  ok(out.length === 1 && out[0] === far, `only the mesh wholly past the disc + ${SITE_PAD} m is dropped`);
}

// ---------------------------------------------------------------- the quality ladder in every table
{
  ok(LEVELS[0] === 'minimal' && LEVELS.includes(START) && LEVELS.at(-1) === 'low', `the phone ladder, lowest first: ${LEVELS.join(' < ')}`);
  ok(CONFIG.phone.levels === LEVELS && CONFIG.phone.start === START && /beta/i.test(CONFIG.phone.play), 'config.js carries the ladder and the map page button');
  // the build moves index.html's inline script into the bundle; only a 'pre' hook still edits it (the ?phone redirect)
  ok(/transformIndexHtml:\s*\{\s*order:\s*'pre'/.test(read('vite.config.js')) && read('index.html').includes('const q = new URLSearchParams(location.search), mm = '),
    'vite.config.js edits index.html before the build bundles its script, and the line it edits is still there');
  const table = (file, name) => { const s = read(file), i = s.indexOf(name), j = s.indexOf('};', i); return s.slice(i, j); };
  const post = table('src/render/post.js', 'const QUALITY = {'), sky = table('src/render/sky.js', 'const Q = {'), detail = table('src/world/oradea/city.js', 'const DETAIL = {');
  for (const q of ['phone', 'minimal']) {
    ok(new RegExp(`\\b${q}: \\{`).test(post) && new RegExp(`\\b${q}: \\{`).test(sky) && new RegExp(`\\b${q}: \\{`).test(detail), `'${q}' is tabled in post.js, sky.js and city.js DETAIL`);
  }
  const line = (src, q) => src.split('\n').find((l) => l.includes(`${q}: {`)) ?? '';
  const dpr = (q) => +/maxDpr: ([\d.]+)/.exec(line(post, q))[1];
  ok(dpr('phone') <= 1.25 && dpr('minimal') <= 1, 'phone pixel ratio <= 1.25, minimal 1');
  ok(['phone', 'minimal'].every((q) => /ao: false/.test(line(post, q)) && /bloom: false/.test(line(post, q)) && !/smaa/.test(line(post, q))), 'no AO, no bloom, no SMAA on the phone levels');
  const haze = (q) => +/haze: ([\d.]+)/.exec(line(sky, q))[1];
  ok(Math.abs(1 - Math.exp(-haze('phone') * 680 * 0.98) - 0.9) < 0.02, `phone haze ~90 % opaque at 800 m (density ${haze('phone')})`);
  ok(/water: \{ on: false \}/.test(detail.slice(detail.indexOf('phone: {'))), 'no river mirror on the phone levels');
  const block = (q) => detail.slice(detail.indexOf(`${q}: {`), detail.indexOf(`${q}: {`) + 420);
  ok(['phone', 'minimal'].every((q) => /sites: \{[^}]*far: \d+/.test(block(q))), 'the sites have a hard draw distance on the phone levels');

  const scene = new THREE.Scene(), dl = createDaylight({ preset: 'day' });
  const renderer = { shadowMap: { needsUpdate: false }, state: { buffers: { depth: { getReversed: () => true } } } };
  const sh = createShadows({ scene, renderer, daylight: dl, quality: 'phone' });
  ok(!sh.light.castShadow, 'phone: no shadow maps (two cascades doubled the draw calls)');
  sh.setQuality('minimal');
  ok(!sh.light.castShadow, 'minimal: no shadow maps');
  sh.setQuality('low');
  ok(sh.light.castShadow && sh.light.shadow.mapSize.x === 1024, 'back to low: shadows again');
  dl.dispose();
}

// ---------------------------------------------------------------- the reload guard
{
  const t0 = 1_000_000;
  ok(guardDecision(null, t0).level === START && !guardDecision(null, t0).crashed, 'no record: the start level');
  ok(guardDecision(null, t0, LEVELS, 'low').level === 'low', 'no record: the saved level');
  const died = { at: t0 - 40e3, level: 'phone', clean: false };
  const d = guardDecision(died, t0, LEVELS, 'phone');
  ok(d.crashed && d.level === 'minimal' && !d.floor, 'an unclosed record 40 s old: one level lower');
  ok(guardDecision({ ...died, level: 'low' }, t0, LEVELS, 'low').level === 'phone', 'from low: down to phone');
  const f = guardDecision({ ...died, level: 'minimal' }, t0);
  ok(f.crashed && f.level === 'minimal' && f.floor, 'at the lowest level: stays there, says so');
  ok(!guardDecision({ ...died, clean: true }, t0).crashed, 'a clean unload (pagehide) is not a crash');
  ok(!guardDecision({ ...died, at: t0 - GUARD_WINDOW - 1 }, t0).crashed, 'an old record (a tab closed long ago) is not a crash');

  const store = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };
  const S = store();
  const g1 = bootGuard({ levels: LEVELS, saved: null, storage: S, now: t0 });
  ok(!g1.crashed && g1.level === 'phone' && JSON.parse(S.getItem('odphone.boot')).clean === false, 'first boot: a record is written');
  g1.setLevel('low');
  const g2 = bootGuard({ levels: LEVELS, saved: 'low', storage: S, now: t0 + 20e3 }); // the tab died and reloaded
  ok(g2.crashed && g2.level === 'phone' && S.getItem('cd.quality.phone') === 'phone', 'a reload 20 s later: one level under the one in use, saved');
  g2.clean();
  const g3 = bootGuard({ levels: LEVELS, saved: 'phone', storage: S, now: t0 + 30e3 });
  ok(!g3.crashed && g3.level === 'phone', 'after a clean unload: no step down');
  g3.clean(); g3.open(); // the tab hidden, then back in front
  ok(JSON.parse(S.getItem('odphone.boot')).clean === false, 'back in front: the record is live again (a crash now still counts)');
  g3.clean();
  ok(!guardDecision(JSON.parse(S.getItem('odphone.boot')), t0 + 60e3).crashed, 'discarded while in the background: no step down');
  g3.stable();
  ok(S.getItem('odphone.boot') === null, 'a minute of play drops the record');
  ok(!/^(cherkasy|cd|oradea)\./.test('odphone.boot'), "the boot record is not a save-code key (savecode.js), so a code never carries it");
}

// ---------------------------------------------------------------- the soft edge
{
  const C = CENTRE, dt = 1 / 60;
  const a = boundary(100, 0, 30, 0, dt, C);
  ok(a.over === 0 && a.vx === 30 && a.px === 100, 'inside: nothing changes');
  const run = (v0) => { let px = C.r - 5, vx = v0, most = 0; for (let i = 0; i < 600; i++) { const b = boundary(px, 0, vx, 0, dt, C); vx = b.vx; px = b.px + b.vx * dt; most = Math.max(most, px - C.r); } return { most, px, vx }; };
  const r40 = run(40), r85 = run(85);
  ok(r40.most > 10 && r40.most < 35 && r40.px < C.r + r40.most && r40.vx < 0, `a car at 144 km/h stops ${r40.most.toFixed(1)} m past the edge, not at a wall, and is eased back in`);
  ok(r85.most < EDGE + 40, `a jet at full boost (85 m/s) stops ${r85.most.toFixed(1)} m past it, before the hard line`);
  const c = boundary(0, C.r + 500, 0, 0, dt, C);
  ok(Math.abs(Math.hypot(c.px, c.pz) - (C.r + EDGE + 40)) < 1e-6, 'far outside: put back on the hard line');
  const s = boundary(C.r + 20, 0, 0, 25, dt, C);
  ok(s.vz === 25, 'speed along the edge is kept');
}

// ---------------------------------------------------------------- touch: the stick and the input API
{
  const R = 56;
  ok(stickAxes(0, 0, R).x === 0 && stickAxes(3, -3, R).y === 0, 'the dead zone in the middle reads 0');
  ok(stickAxes(R, 0, R).x === 1 && stickAxes(-2 * R, 0, R).x === -1, 'the rim reads 1, a finger past it is clamped');
  const d = stickAxes(R, R, R);
  ok(Math.abs(Math.hypot(d.x, d.y) - 1) < 0.002, 'diagonal: clamped to the circle');
  const h = stickAxes(R / 2, 0, R).x;
  ok(h > 0.4 && h < 0.5, `half way out reads a bit under half (${h}: rescaled past the dead zone)`);
  ok(stickAxes(0, R, R).y === 1, 'finger below the centre: y +1 (touch.js sends -y: nose up for a finger above)');

  const inp = createInput({ target: null });
  inp.touch.hold('gas'); inp.touch.stick(-0.5, 0.25);
  let f = inp.update(1 / 60);
  ok(f.throttle === 1 && f.move.y === 1 && f.move.x === -0.5 && f.pitch === 0.25, 'gas pedal + stick: throttle 1, steer -0.5, pitch 0.25');
  inp.touch.release('gas'); inp.touch.hold('brake');
  f = inp.update(1 / 60);
  ok(f.throttle === -1 && inp.held('brake') && inp.released('gas'), 'brake held, gas released');
  inp.touch.hold('sprint'); inp.touch.hold('jump'); inp.touch.hold('horn');
  f = inp.update(1 / 60);
  ok(f.sprint && f.jump && f.horn, 'fly (sprint), handbrake (jump) and horn buttons');
  inp.touch.hold('camera'); inp.touch.release('camera'); // a tap between two frames
  f = inp.update(1 / 60);
  ok(f.cameraPressed, 'a quick tap still counts as one press');
  inp.bind('map', ['KeyM']); inp.touch.hold('map');
  ok(inp.update(1 / 60) && inp.pressed('map'), 'an action bound later (main.js map) answers to its on-screen button');
  inp.touch.look(10, -4);
  f = inp.update(1 / 60);
  ok(f.look.dx === 10 && f.look.dy === -4, 'a look drag feeds the mouse look');
  inp.touch.clear();
  f = inp.update(1 / 60);
  ok(!f.sprint && !f.jump && f.move.x === 0 && f.throttle === 0, 'clear() lets go of everything');
  inp.inject.down('KeyW');
  ok(inp.update(1 / 60).throttle === 1, 'keys still work beside the touch API');
  inp.dispose();
}

console.log(fails ? `\n${fails} FAILED` : '\nall passed');
process.exit(fails ? 1 : 0);
