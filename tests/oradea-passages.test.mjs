// Headless checks for Oradea's road underpasses and overpasses (src/world/oradea/sites/passages-*.js, the engines in
// sites/passages/trench.js and deck.js) on the compiled map: node tests/oradea-passages.test.mjs
// Per underpass module: it shapes and builds, no NaN; the floor is below the street along the lower road (the open cuts
// in hf.heightAt, the tunnels in the collision terrain) and never under FLOOR_Y (car.js would take it for water); the
// street over a tunnel and the ground beside a cut keep their height; the car finds the floor under the slab with a low
// hint and the slab's top with a high one; walls stop a ray across the cut; clear() keeps trees off the cut; no surface
// lane or tram drops more than 1 m into a cut. Per overpass module: the expected decks plan, every crossing is cleared,
// grades stay under 8 %, deckAt gives the deck on it and null beside it, the deck carries the car, no lane of another
// road takes a deck's height. All: a missing way, or the phone tier's centre, leaves a group out. Skipped when the
// Oradea map is absent.
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createHeightField } from '../src/world/cherkasy/ground.js';
import { createCollisionWorld } from '../src/world/collision.js';
import { liftBanks, shapeBridges } from '../src/world/oradea/river.js';
import { FRAME_OF } from '../src/world/cherkasy/frame.js';
import { buildLaneNetwork } from '../src/npc/lanes.js';
import { FLOOR_Y, shapeGroup } from '../src/world/oradea/sites/passages/trench.js';
import { planDeck } from '../src/world/oradea/sites/passages/deck.js';

const A = new URL('../public/assets/oradea/', import.meta.url);
if (!existsSync(new URL('map.json', A))) { console.log('skip: no public/assets/oradea/map.json (npm run map:oradea)'); process.exit(0); }
let fails = 0;
const log = console.log, warn = console.warn; console.log = () => {}; console.warn = () => {};
const ok = (c, msg) => { if (!c) { fails++; log('FAIL', msg); } else log('ok  ', msg); };
const pairs = (p) => { const o = []; for (let i = 0; i + 1 < p.length; i += 2) o.push([p[i], p[i + 1]]); return o; };

const load = () => {
  const map = JSON.parse(readFileSync(new URL('map.json', A)));
  map.buildings = JSON.parse(readFileSync(new URL('map_buildings.json', A)));
  const dem = new Int16Array(readFileSync(new URL('dem.bin', A)).buffer.slice(0));
  const hf = createHeightField(map, dem);
  liftBanks(hf, dem, map.dem);
  const bridges = shapeBridges(hf, map);
  return { map, hf, bridges, geo: FRAME_OF(map) };
};
const S = '../src/world/oradea/sites/';
const TRENCH = ['passages-aradului', 'passages-cantemir', 'passages-decebal', 'passages-gojdu', 'passages-magheru'];
const DECKS = ['passages-aradului', 'passages-est', 'passages-nord', 'passages-vest'];
const mods = {};
for (const m of [...new Set([...TRENCH, ...DECKS])]) mods[m] = await import(`${S}${m}.js`);
const cetate = (await import(`${S}cetate.js`)).SITE;

// ---- the whole set, shaped in city.js's order (cetate first: the moat is protected from the lifts)
const W = load();
cetate.shape(W.hf, W.map, W.geo);
const H = W.hf.heightAt; // before the passages
const names = Object.keys(mods).sort();
for (const m of names) mods[m].SITE.shape?.(W.hf, W.map, W.geo);
const cw = createCollisionWorld({ cell: 24, terrain: { height: (x, z) => W.hf.heightAt(x, z) } });
const base = { root: new THREE.Group(), T: null, map: W.map, solids: cw, zips: null, heightAt: W.hf.heightAt, ground: null, geo: W.geo, facadeMat: null, detailMat: null, railLevel: null, bridges: W.bridges, skip: new Set() };
const built = {};
for (const m of names) built[m] = mods[m].SITE.build(base);
const nanIn = (root) => { let bad = 0; root.traverse((o) => { const p = o.geometry?.attributes?.position?.array; if (p) for (let i = 0; i < p.length; i++) if (!Number.isFinite(p[i])) { bad++; break; } }); return bad; };
ok(nanIn(base.root) === 0, 'no NaN in any passage mesh');

// ---- underpasses
const laneOffs = (r) => { const w = r.w ?? 6, out = []; if (r.ow) { const n = Math.max(1, Math.min(2, r.ln || (w >= 9 ? 2 : 1))), tot = Math.max(n, r.ln || n), lw = w / tot, sh = tot > n ? lw * (tot - n) / 2 : 0; for (let k = 0; k < n; k++) out.push(lw * (k + 0.5) - w / 2 + sh); } else { const n = Math.max(1, Math.min(2, r.ln ? Math.floor(r.ln / 2) : (w >= 13 ? 2 : 1))), lw = w / (r.ln ? Math.max(2, r.ln) : 2 * n); for (let k = 0; k < n; k++) { const o = Math.max(1.65, lw * (k + 0.5)); out.push(o, -o); } } return out; };
for (const m of TRENCH) {
  const r = built[m], st = r?.state;
  ok(!!st && !!r, `${m}: shaped and built`);
  if (!st) continue;
  const tun = st.ways.filter((w) => w.tn), cut = st.ways.filter((w) => !w.tn);
  ok(tun.length > 0 && cut.length > 0, `${m}: ${tun.length} tunnel and ${cut.length} cut ways`);
  // floors
  let low = 0, minF = Infinity;
  for (const w of st.ways) for (const [x, z] of w.P) { const f = st.floorAt(x, z); if (f < Infinity) minF = Math.min(minF, f); if (f < FLOOR_Y - 1e-6) low++; }
  ok(low === 0, `${m}: no floor under FLOOR_Y (lowest ${minF.toFixed(2)})`);
  // the open cuts: hf.heightAt is the floor, at a portal (a cut's end on a tunnel) at least 3 m under the street
  const near1 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.5;
  let portals = 0, deep = 0;
  for (const w of cut) for (const e of [w.P[0], w.P[w.P.length - 1]]) {
    if (!tun.some((t) => near1(t.P[0], e) || near1(t.P[t.P.length - 1], e))) continue;
    const seq = w.P.indexOf(e) === 0 ? w.P : w.P.slice().reverse(), a = seq.find(([x, z]) => st.openAt(x, z) < Infinity); // the first open step (a roof added over a crossing street may come first)
    portals++; if (a && st.surfaceAt(a[0], a[1]) - W.hf.heightAt(a[0], a[1]) > 2.5) deep++;
  }
  ok(portals > 0 && deep === portals, `${m}: hf.heightAt over 2.5 m under the street where the cuts open at the portals (${deep}/${portals})`);
  // tunnels: the street keeps its level, the car's terrain is the floor, the slab carries a car from above
  let street = 0, floorHint = 0, slabHint = 0, slabNo = 0, n = 0;
  const decked = (x, z) => DECKS.some((d) => built[d]?.deckAt?.(x, z) != null);
  for (const w of tun) for (const [x, z] of w.P.slice(1, -1)) {
    if (st.openAt(x, z) < Infinity || decked(x, z)) continue; // (a ring-road deck over the street: three levels)
    n++;
    const s = st.surfaceAt(x, z), f = st.floorAt(x, z);
    if (Math.abs(W.hf.heightAt(x, z) - s) < 0.01) street++;
    if (Math.abs(cw.groundHeight(x, z, f + 0.5) - f) < 0.05) floorHint++;
    if (Math.abs(cw.groundHeight(x, z, s + 1) - s) < 0.35) slabHint++;
    if (Math.abs(cw.groundHeight(x, z) - s) < 0.35) slabNo++;
  }
  ok(n > 0 && street === n, `${m}: street over the tunnels unchanged (${street}/${n})`);
  ok(floorHint === n, `${m}: low hint finds the tunnel floor (${floorHint}/${n})`);
  ok(slabHint === n && slabNo === n, `${m}: high / no hint finds the slab top (${slabHint}, ${slabNo} / ${n})`);
  // beside the cut: 6 m past the corridor the ground is as before
  let beside = 0, bn = 0;
  for (const w of cut) for (let k = 1; k + 1 < w.P.length; k += 3) {
    const a = w.P[k - 1], b = w.P[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / l, nz = (b[0] - a[0]) / l;
    for (const sg of [1, -1]) {
      const o = (sg > 0 ? w.wl[k] : w.wr[k]) + 6, x = w.P[k][0] + nx * o * sg, z = w.P[k][1] + nz * o * sg;
      if (st.floorAt(x, z) < Infinity) continue;
      bn++; if (Math.abs(W.hf.heightAt(x, z) - st.surfaceAt(x, z)) < 0.01) beside++;
    }
  }
  ok(bn > 0 && beside === bn, `${m}: ground beside the cuts unchanged (${beside}/${bn})`);
  // walls: from the middle of a deep cut, a ray across hits a wall within the corridor
  let rays = 0, hits = 0;
  for (const w of cut) for (let k = 2; k + 2 < w.P.length; k += 4) {
    const [x, z] = w.P[k], f = st.floorAt(x, z), s = st.surfaceAt(x, z);
    if (s - f < 2 || st.openAt(x, z) === Infinity) continue;
    const a = w.P[k - 1], b = w.P[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    for (const sg of [1, -1]) {
      rays++;
      const hit = cw.raycast({ x, y: f + 1, z }, { x: -(b[1] - a[1]) / l * sg, y: 0, z: (b[0] - a[0]) / l * sg }, 25);
      if (hit && hit.distance < 25) hits++; // (across a dual carriageway in one box the far wall)
    }
  }
  ok(rays > 0 && hits >= rays * 0.9, `${m}: walls stop a ray across the cut (${hits}/${rays})`);
  // the edge: a car-sized box pushed at every edge point from 4 m back on the street (or the slab over a tunnel) never
  // lands more than 1.5 m below where it started (corners where street, slab and cut meet had no wall: 4.7 m; a lane kept
  // at the street beside a ramp drops ~1 m onto that ramp, a road)
  const D8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7071, 0.7071], [-0.7071, 0.7071], [0.7071, -0.7071], [-0.7071, -0.7071]];
  let pushes = 0, falls = 0, fallAt = null;
  const carHit = {};
  for (let x = st.box[0]; x <= st.box[2]; x += 1) for (let z = st.box[1]; z <= st.box[3]; z += 1) {
    if (st.openAt(x, z) !== Infinity) continue;
    const s = W.hf.heightAt(x, z);
    for (const [dx, dz] of D8) {
      const f = st.openAt(x + dx * 1.5, z + dz * 1.5), ox = x - dx * 4, oz = z - dz * 4;
      if (f === Infinity || s - f < 0.8 || st.openAt(ox, oz) !== Infinity) continue;
      const b = { x: ox, y: W.hf.heightAt(ox, oz) + 0.05, z: oz, yaw: Math.atan2(dx, dz), hl: 2.6, hw: 1.0, h: 1.6, step: 0.35 };
      if (cw.pushBox({ ...b }, carHit)) continue; // no room for a car there (it would start inside a wall)
      pushes++;
      for (let k = 0; k < 30; k++) {
        b.x += dx * 0.2; b.z += dz * 0.2;
        if (st.openAt(b.x, b.z) === Infinity) b.y = W.hf.heightAt(b.x, b.z) + 0.05; // over the cut it keeps its height
        cw.pushBox(b, carHit);
        if (st.openAt(b.x, b.z) !== Infinity && s - W.hf.heightAt(b.x, b.z) > 1.5) { falls++; fallAt ??= [x, z]; break; } // the ground it would land on
      }
    }
  }
  ok(pushes > 0 && falls === 0, `${m}: a car pushed at the cut's edge never drops over 1.5 m (${falls} fall-ins of ${pushes}${fallAt ? `, first from (${fallAt})` : ''})`);
  // the way in: a car driving each cut way's own line (and the street 15 m before it) is never held by a wall (a lane
  // kept at the street where another road crosses a cut had the cut's edge wall across it: Gojdu's south mouth)
  let held = 0, heldAt = null, steps = 0;
  const flo = (q) => { const f = st.floorAt(q[0], q[1]); return f === Infinity ? 1e9 : f; };
  for (const w of cut) {
    const P = w.P.slice();
    if (flo(P[P.length - 1]) > flo(P[0])) P.reverse(); // from its street end down (a way drawn from the tunnel out)
    const a = P[0], b = P[1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    if (flo(a) > 1e8 || st.surfaceAt(a[0], a[1]) - flo(a) < 0.5) P.unshift([a[0] - (b[0] - a[0]) / l * 15, a[1] - (b[1] - a[1]) / l * 15]); // the street before it
    let rest = 0; for (let k = 1; k < P.length; k++) rest += Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]);
    rest -= 2.5; // the car's nose stops short of the far end (the next way may bend away)
    const car = { x: P[0][0], y: 0, z: P[0][1], yaw: 0, hl: 2.4, hw: 0.95, h: 1.6, step: 0.35 };
    car.y = cw.groundHeight(car.x, car.z, W.hf.heightAt(car.x, car.z) + 1) + 0.02;
    for (let k = 1; k < P.length; k++) {
      const [ax, az] = P[k - 1], [bx, bz] = P[k], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / (L || 1), uz = (bz - az) / (L || 1);
      car.yaw = Math.atan2(ux, uz);
      for (let s = 0; s < L && rest > 0; s += 0.25, rest -= 0.25) {
        car.x = ax + ux * s; car.z = az + uz * s; // on the line: only a wall across it can hold the car
        car.y = cw.groundHeight(car.x, car.z, car.y + 0.4) + 0.02;
        const px = car.x, pz = car.z; steps++;
        cw.pushBox(car, carHit);
        if ((car.x - px) * ux + (car.z - pz) * uz < -0.05 && cw.kindOf(carHit.id) === 'wall') { held++; heldAt ??= [px.toFixed(0), pz.toFixed(0), w.id]; }
      }
    }
  }
  ok(steps > 0 && held === 0, `${m}: no wall across a cut way's line (${held} held of ${steps}${heldAt ? `, first at (${heldAt})` : ''})`);
  // clear(): trees off the floor
  const w0 = cut[0], mid = w0.P[Math.floor(w0.P.length / 2)];
  const fa = w0.P[Math.max(0, Math.floor(w0.P.length / 2) - 1)], fb = w0.P[Math.min(w0.P.length - 1, Math.floor(w0.P.length / 2) + 1)], fl = Math.hypot(fb[0] - fa[0], fb[1] - fa[1]) || 1;
  const off = [mid[0] - (fb[1] - fa[1]) / fl * 80, mid[1] + (fb[0] - fa[0]) / fl * 80];
  ok(r.clear(mid[0], mid[1]) && (st.floorAt(off[0], off[1]) < Infinity || !r.clear(off[0], off[1])), `${m}: clear() on the cut, not 80 m beside it`);
  // surface lanes and trams over the cuts
  const own = (P) => P.every(([x, z]) => st.ways.some((q) => q.P.some((v, k) => k && seg(x, z, q.P[k - 1], v) < 1.0)));
  let worst = 0, at = null;
  const lines = [];
  for (const q of W.map.roads) if (q.k === 'm' && q.p.length >= 4) { const P = pairs(q.p); if (P.some(([x, z]) => x > st.box[0] - 20 && x < st.box[2] + 20 && z > st.box[1] - 20 && z < st.box[3] + 20) && !own(P)) for (const o of laneOffs(q)) lines.push([P, o]); }
  for (const q of W.map.trams ?? []) { const P = pairs(q.p); if (P.some(([x, z]) => x > st.box[0] - 20 && x < st.box[2] + 20 && z > st.box[1] - 20 && z < st.box[3] + 20)) lines.push([P, 0]); }
  for (const [P, o] of lines) for (let k = 1; k < P.length; k++) {
    const [ax, az] = P[k - 1], [bx, bz] = P[k], l = Math.hypot(bx - ax, bz - az) || 1, ux = (bx - ax) / l, uz = (bz - az) / l;
    for (let s = 0; s <= l; s += 1) { const x = ax + ux * s - uz * o, z = az + uz * s + ux * o; if (st.floorAt(x, z) === Infinity) continue; const d = st.surfaceAt(x, z) - W.hf.heightAt(x, z); if (d > worst) { worst = d; at = [x.toFixed(0), z.toFixed(0)]; } }
  }
  ok(worst < 1.0, `${m}: no surface lane or tram more than 1 m into a cut (worst ${worst.toFixed(2)} m at ${at})`);
  ok(st.stats.clearMin >= 2.59, `${m}: tunnel clearance >= 2.6 m (${st.stats.clearMin})`);
}
function seg(x, z, a, b) { const ex = b[0] - a[0], ez = b[1] - a[1], L2 = ex * ex + ez * ez || 1; const t = Math.max(0, Math.min(1, ((x - a[0]) * ex + (z - a[1]) * ez) / L2)); return Math.hypot(x - a[0] - ex * t, z - a[1] - ez * t); }

// ---- overpasses
const EXPECT_NULL = new Set(['teodor-nes', 'podului-n', 'podului-s', 'expres-doja']);
const allDecks = [];
for (const m of DECKS) {
  const r = built[m], list = m === 'passages-aradului' ? mods[m].ARADULUI_DECKS : mods[m][m.replace('passages-', '').toUpperCase()];
  ok(!!r?.plans && !!r.deckAt, `${m}: decks built with deckAt`);
  if (!r?.plans) continue;
  list.forEach((O, i) => {
    const p = r.plans[i];
    if (EXPECT_NULL.has(O.id)) { ok(p === null, `${m}: ${O.id} left on the ground (no room for its ramps)`); return; }
    ok(!!p, `${m}: ${O.id} planned`);
    if (!p) return;
    allDecks.push({ p, r, m });
    const spare = Math.min(...p.crossings.map((c) => p.y(c.s) - 1.35 - c.g - c.clr));
    ok(spare > -0.02, `${m}: ${O.id} clears its ${p.crossings.length} crossings (spare ${spare.toFixed(2)} m)`);
    let steep = 0;
    for (let s = p.foot[0]; s + 2 <= p.foot[1]; s += 2) steep = Math.max(steep, Math.abs(p.y(s + 2) - p.y(s)) / 2);
    ok(steep < 0.08, `${m}: ${O.id} grade <= 8 % (max ${(steep * 100).toFixed(1)} %)`);
    const c = p.crossings[0], [x, z, dx, dz] = (() => { let k = 1; while (k < p.L.length - 1 && p.cum[k] < c.s) k++; const l = p.cum[k] - p.cum[k - 1] || 1, f = (c.s - p.cum[k - 1]) / l; return [p.L[k - 1][0] + (p.L[k][0] - p.L[k - 1][0]) * f, p.L[k - 1][1] + (p.L[k][1] - p.L[k - 1][1]) * f, (p.L[k][0] - p.L[k - 1][0]) / l, (p.L[k][1] - p.L[k - 1][1]) / l]; })();
    const yd = r.deckAt(x, z);
    ok(yd != null && Math.abs(yd - p.y(c.s)) < 0.05, `${m}: ${O.id} deckAt on the deck (${yd?.toFixed(2)} vs ${p.y(c.s).toFixed(2)})`);
    ok(r.deckAt(x - dz * 40, z + dx * 40) == null || allDecks.length === 0, `${m}: ${O.id} deckAt null 40 m beside`);
    ok(Math.abs(cw.groundHeight(x, z, p.y(c.s) + 1) - p.y(c.s)) < 0.25, `${m}: ${O.id} the deck carries the car over its crossing`);
    ok(r.clear(x, z), `${m}: ${O.id} clear() on the deck`);
  });
}
// no lane of another road takes a deck's height
{
  const deckAt = (x, z) => { for (const m of DECKS) { const y = built[m]?.deckAt?.(x, z); if (y != null) return y; } return null; };
  const net = buildLaneNetwork(W.map, (x, z) => W.hf.heightAt(x, z), { deckAt });
  let on = 0, foreign = 0;
  for (const L of net.links) {
    if (!L.bridge) continue;
    const ex = L.ax + L.dx * L.len, ez = L.az + L.dz * L.len;
    if (deckAt(L.ax, L.az) == null && deckAt(ex, ez) == null) continue;
    on++;
    const mx = L.ax + L.dx * L.len / 2, mz = L.az + L.dz * L.len / 2, along = [-3, 3].every((t) => deckAt(mx + L.dx * t, mz + L.dz * t) != null);
    if (!along && Math.max(Math.abs(L.y0 - W.hf.heightAt(L.ax, L.az)), Math.abs(L.y1 - W.hf.heightAt(ex, ez))) > 1) foreign++;
  }
  ok(on > 50 && foreign === 0, `lanes: ${on} links ride the decks, ${foreign} of other roads took a deck's height`);
}

// ---- a missing way, and the phone tier, leave groups out
{
  const V = load();
  const gone = mods['passages-magheru'].MAGHERU.ways[0];
  V.map.levels = V.map.levels.filter((w) => w.id !== gone);
  ok(shapeGroup(V.hf, V.map, V.geo, mods['passages-magheru'].MAGHERU) === null, 'a way missing from map.json: the group is left out');
  ok(planDeck(V.map, V.hf.heightAt, { id: 'x', ways: [123456789] }) === null, 'a deck way missing from map.json: no plan');
  V.map.phoneCentre = { x: 0, z: 0, r: 1800 };
  ok(shapeGroup(V.hf, V.map, V.geo, mods['passages-aradului'].ARADULUI) === null, 'phone tier: Calea Aradului (outside the centre) left out');
  ok(shapeGroup(V.hf, V.map, V.geo, mods['passages-gojdu'].GOJDU) !== null, 'phone tier: Gojdu (inside the centre) kept');
  const vb = { ...base, map: V.map, heightAt: V.hf.heightAt, root: new THREE.Group(), solids: createCollisionWorld({ cell: 24 }) };
  const est = mods['passages-est'].SITE.build(vb), nord = mods['passages-nord'].SITE.build(vb);
  ok(est === null && nord?.plans?.length === mods['passages-nord'].NORD.filter((O) => Math.hypot(O.centre[0], O.centre[1]) <= 1950).length, `phone tier: no eastern decks, ${nord?.plans?.length ?? 0} northern ones inside the centre`);
}
// the lifts: no group's lifted ground reaches another group's corridor
{
  const sts = TRENCH.map((m) => built[m]?.state).filter(Boolean);
  let overlap = 0;
  for (let i = 0; i < sts.length; i++) for (let j = i + 1; j < sts.length; j++) { const a = sts[i].box, b = sts[j].box; if (a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]) overlap++; }
  ok(overlap === 0, `the underpass groups do not overlap (${sts.length} groups)`);
}
void H; void warn;
log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);
