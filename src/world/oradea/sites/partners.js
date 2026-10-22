// OWNER: oradea. The partners' doors (game/partners.js draws the pink ring there and slides in the card of the places.js
// entry with the same id) and, where the building is the city generator's, a lit name board over its shopfront that
// covers the generic shop names, brightening as the car comes near (glow) and after dusk (nightK). A hand-built site's
// building (Emanuel, BBSO) gets the ring only. A new partner is a TABLE line plus its places.js entry.
//   TABLE: { id, bld (OSM id), street? (the road its door faces; else the nearest named road), sign? (board text) }
// Site contract of src/world/oradea/city.js: SITE { id, label, skip, places, ground, build(base) -> { update, clear,
// footprints, partners, stats } }.
import * as THREE from 'three';
import { nightK } from '../../../render/daylight.js';

export const TABLE = [
  { id: 'viatanoua', bld: 420863618, street: 'Strada Nicolae Jiga', sign: 'VIAȚA NOUĂ · BCUO' },
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
    const byId = new Map((map.buildings ?? []).map((o) => [o.id, o]));
    const partners = {}, doors = [], mats = [], near = {}, stats = { placed: [], missing: [] };
    for (const e of TABLE) {
      const b = byId.get(e.bld);
      if (!b) { stats.missing.push(e.id); continue; }
      const [cx, cz] = [b.p[0], b.p[1]];
      const named = (map.roads ?? []).filter((r) => r.n && (e.street ? r.n === e.street : true));
      // without a street: the named roads within 120 m of the building
      const roads = e.street ? named : named.filter((r) => { for (let i = 0; i < r.p.length; i += 2) if (Math.hypot(r.p[i] - cx, r.p[i + 1] - cz) < 120) return true; return false; });
      const w = placeDoor(b, roads);
      if (!w) { stats.missing.push(e.id); continue; }
      const door = new THREE.Vector3(w.mx + w.nx * DOOR_OUT, 0, w.mz + w.nz * DOOR_OUT);
      door.y = heightAt(door.x, door.z);
      doors.push(door);
      near[e.id] = 0;
      partners[e.id] = { door, glow(k) { near[e.id] = Math.max(0, Math.min(1, k)); } };
      stats.placed.push({ id: e.id, door: [door.x, door.z], wall: w.len });
      if (!e.sign || typeof document === 'undefined') continue;

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
