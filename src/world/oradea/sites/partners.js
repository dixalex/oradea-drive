// OWNER: oradea. The partners' doors (game/partners.js draws the pink ring there and slides in the card of the places.js
// entry with the same id) and, where the building is the city generator's, a lit name board over its shopfront that
// covers the generic shop names, brightening as the car comes near (glow) and after dusk (nightK). A hand-built site's
// building (Emanuel, BBSO) and a house (no shop band) get the ring only. A new partner is a TABLE line plus its places.js entry.
//   TABLE: { id, bld (OSM id) | ring (world metres, [[x, z], …] or flat: a building OSM lacks, as a hand-built site draws it),
//            street? (the road its door faces; else the nearest named road), door? ([x, z]: a hand-built site's entrance,
//            in place of the wall search), sign? (board text) }
// Site contract of src/world/oradea/city.js: SITE { id, label, skip, places, ground, build(base) -> { update, clear,
// footprints, partners, stats } }.
import * as THREE from 'three';
import { nightK } from '../../../render/daylight.js';
import { MOBIVERSAL_RING } from './mobiversal/plan.js'; // the plan only, not the whole site

export const TABLE = [
  { id: 'viatanoua', bld: 420863618, door: [-36.5, -1066.6] }, // before the yard gate east of the house (viatanoua/house.js GATE), the way in
  { id: 'mobiversal', ring: MOBIVERSAL_RING, street: 'Strada Thurzó Sándor' }, // no OSM outline: the hand-built house (sites/mobiversal.js) draws its own
  { id: 'casaminunata', bld: 436834224, door: [-2174.9, -2073.0] }, // before the open street gate into the courtyard (casaminunata/grounds.js GATES.street)
  // the hand-built churches (sites/baptist): the ring in front of the real entrance – BBSO's concrete entrance block on the
  // south forecourt (bbsoToMap(41, 48.5)), Emanuel's main doors through the fence's gap on the boulevard (22°, 27.5 m from the drum's centre)
  { id: 'bbso', bld: 1264556370, door: [1208.5, 1715.1] },
  { id: 'emanuel', bld: 3530253, door: [-868.5, 332.8] },
  { id: 'bsvo', bld: 717082633, door: [-2811.4, -959.3] }, // the church is the long building 717082633, not the cream shop 717082635; the ring 5.4 m before its glazed double door, through the open yard gate (sites/bsvo.js: church frame u 25.6, v -5.4)
];

const DOOR_OUT = 3.2, BOARD_H = 0.8; // m: the ring out from the wall; the board's height (the facade's band is 0.75 m)
// the storefront floor's height by the building's look (world/buildings.js: max(3.6, plinth + storey)); the band's centre
// is 0.575 m under its top, counted from the floor line (the mean ground + 0.15), as oradea/shopsigns.js does
const SHOP_H = { old: 4.9, mall: 5.5, market: 5.0, public: 4.1, apt: 3.9 };

function ringOf(b) { const P = []; for (let i = 0; i < b.p.length; i += 2) P.push([b.p[i], b.p[i + 1]]); return P; }

function placeDoor(b, roads) {
  const P = ringOf(b), cx = P.reduce((a, p) => a + p[0], 0) / P.length, cz = P.reduce((a, p) => a + p[1], 0) / P.length;
  const segsOf = (r) => { const S = []; for (let i = 0; i + 3 < r.p.length; i += 2) S.push([r.p[i], r.p[i + 1], r.p[i + 2], r.p[i + 3]]); return S; };
  const dist = (S, x, z) => Math.min(...S.map(([ax, az, bx, bz]) => {
    const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz, t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)) : 0;
    return Math.hypot(ax + t * dx - x, az + t * dz - z);
  }));
  const segs = roads.flatMap(segsOf);
  if (!segs.length) return null;
  let best = null;
  for (let i = 0; i < P.length; i++) { // the wall toward the street: near it, and long enough for a front
    const [ax, az] = P[i], [bx, bz] = P[(i + 1) % P.length], len = Math.hypot(bx - ax, bz - az);
    if (len < 4) continue;
    const mx = (ax + bx) / 2, mz = (az + bz) / 2, score = dist(segs, mx, mz) - len * 0.3;
    if (!best || score < best.score) best = { mx, mz, len, score, ax, az, bx, bz };
  }
  if (!best) return null;
  let nx = -(best.bz - best.az) / best.len, nz = (best.bx - best.ax) / best.len;
  if ((best.mx - cx) * nx + (best.mz - cz) * nz < 0) { nx = -nx; nz = -nz; } // outward
  return { ...best, nx, nz, P };
}

export const SITE = {
  id: 'partners',
  label: 'Partners',
  skip: [],
  places: [], // the partners live in places.js (the phone map loads no site)
  ground: true,
  build(base) {
    const { root, map } = base;
    const heightAt = base.ground?.heightAt ?? base.heightAt;
    // the ring stands on what is drawn: land is 0.15 m over heightAt (ground.js GY.LAND), so a ring at heightAt hid under the grass
    const surfaceAt = base.ground?.terrainHeight ?? heightAt;
    const area = (o) => { let a = 0; for (let i = 0, n = o.p.length; i < n; i += 2) { const j = (i + 2) % n; a += o.p[i] * o.p[j + 1] - o.p[j] * o.p[i + 1]; } return Math.abs(a) / 2; };
    const byId = new Map(); // a multipolygon comes as several parts with one id: its largest part holds the door
    for (const o of map.buildings ?? []) { const had = byId.get(o.id); if (!had || area(o) > area(had)) byId.set(o.id, o); }
    const partners = {}, doors = [], mats = [], near = {}, stats = { placed: [], missing: [] };
    for (const e of TABLE) {
      const b = e.ring ? { p: e.ring.flat() } : byId.get(e.bld);
      if (!b) { stats.missing.push(e.id); continue; }
      const [cx, cz] = [b.p[0], b.p[1]];
      const named = (map.roads ?? []).filter((r) => r.n && (e.street ? r.n === e.street : true));
      // without a street: the named roads within 120 m of the building
      const roads = e.street ? named : named.filter((r) => { for (let i = 0; i < r.p.length; i += 2) if (Math.hypot(r.p[i] - cx, r.p[i + 1] - cz) < 120) return true; return false; });
      const w = e.door ? null : placeDoor(b, roads);
      if (!w && !e.door) { stats.missing.push(e.id); continue; }
      const door = e.door ? new THREE.Vector3(e.door[0], 0, e.door[1]) : new THREE.Vector3(w.mx + w.nx * DOOR_OUT, 0, w.mz + w.nz * DOOR_OUT);
      door.y = surfaceAt(door.x, door.z);
      doors.push(door);
      near[e.id] = 0;
      partners[e.id] = { door, glow(k) { near[e.id] = Math.max(0, Math.min(1, k)); } };
      stats.placed.push({ id: e.id, door: [door.x, door.z], wall: w?.len ?? 0 });
      if (!e.sign || !w || typeof document === 'undefined') continue;

      // the name board: painted once at its own aspect, lit by glow / night
      const bw = w.len - 0.3, CH = 160, cv = Object.assign(document.createElement('canvas'), { width: Math.min(4096, Math.round(CH * bw / BOARD_H)), height: CH });
      const c = cv.getContext('2d');
      c.fillStyle = '#16233f'; c.fillRect(0, 0, cv.width, CH);
      c.fillStyle = '#f2c14e'; c.fillRect(0, CH - 14, cv.width, 14);
      c.fillStyle = '#ffffff'; c.font = '700 96px Arial, Helvetica, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(e.sign, cv.width / 2, 74, cv.width * 0.92);
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const mat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.15, roughness: 0.6 });
      mats.push({ id: e.id, mat, last: -1 });
      let g0 = 0; for (const [x, z] of w.P) g0 += heightAt(x, z); g0 = g0 / w.P.length + 0.15;
      const shopH = Math.max(3.6, (b.old && (b.k === 'apt' || b.k === 'public') ? SHOP_H.old : SHOP_H[b.k === 'public' && SHOP_H[b.u] ? b.u : b.k]) ?? 0);
      const board = new THREE.Mesh(new THREE.PlaneGeometry(bw, BOARD_H), mat);
      board.position.set(w.mx + w.nx * 0.14, g0 + shopH - 0.575, w.mz + w.nz * 0.14);
      board.rotation.y = Math.atan2(w.nx, w.nz);
      board.name = `partner-${e.id}`;
      root.add(board);
    }
    if (!doors.length) return null;
    const clearR2 = (DOOR_OUT + 3) ** 2;
    return {
      update() {
        for (const m of mats) {
          const k = Math.max(nightK.value * 0.9, near[m.id]);
          if (Math.abs(k - m.last) > 0.01) { m.mat.emissiveIntensity = 0.15 + 0.85 * k; m.last = k; }
        }
      },
      clear: (x, z) => doors.some((d) => (x - d.x) ** 2 + (z - d.z) ** 2 < clearR2), // keep trees off the rings
      footprints: [],
      partners,
      stats,
    };
  },
};
