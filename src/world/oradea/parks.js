// OWNER: oradea. Park furniture and street sculpture from map.json, wherever no hand-built site draws its own (`covered`):
// - lamps and benches along the footways in the parks (cover.park of 1500 m2 or more): a lamp every 24 m on alternate
//   sides (40 m on earth paths), a slatted bench with a bin every 31 m along the paved ones, facing the path (the
//   furniture of cherkasy/sobornyi.js). Pooled: the nearest LAMPS / BENCHES within reach are drawn, re-picked as the
//   camera moves; every one keeps its collider;
// - playground equipment on the OSM playgrounds (cover.play): a slide tower, swings, a sandbox, spring riders, a see-saw,
//   a climbing dome, as many as fit, lined up with the playground's long side; steel in primary colours and timber;
// - the OSM fountains (pois amenity=fountain): a stone basin on the mapped outline (2.6 m round for a node), water, a jet;
// - the OSM statues and busts (tourism=artwork, historic=memorial with artwork_type / memorial statue or bust, or a name
//   starting «Statuia»), cannons, the monument obelisk and the other memorials as steles: generic bronze figures on
//   granite plinths turned to the nearest street. They are types, not likenesses; plaques are left to the walls;
// - the wayside crosses (historic=wayside_cross): a troiță, an oak cross under a small tin roof.
//   buildParks({ root, map, solids, heightAt, onAsphalt, covered }) -> { update(dt, camera), clear(x, z), stats } | null
//     covered(x, z): true where a hand-built site already has its own (its clear area); clear: keeps trees off the lot
import * as THREE from 'three';
import { MB, M4 } from '../../kit/mesh.js';
import { SG } from '../cherkasy/sculpt.js';
import { put, mapper } from '../cherkasy/bohdan.js';
import { nightK } from '../../render/daylight.js';
import { ringPts, inPoly, areaOf, bboxOf, centroid, rng, obb } from '../cherkasy/geo.js';

const PI = Math.PI, TAU = PI * 2;
const LAMPS = 600, BENCHES = 600, LAMP_REACH = 320, BENCH_REACH = 220;
const PATHS = /^(footway|path|pedestrian|cycleway)$/;
const PLAY = ['#d6402f', '#f2c12e', '#2f7fc1', '#3aa655', '#f07c1f'];

// ------------------------------------------------------------------------------------------------ instanced furniture
function lampGeo() { // a black cast-iron park lamp with a lantern on a short arm (local +x reaches over the path)
  const D = new MB().setColor('#25282b'), G = new MB().setColor('#f4efe2');
  D.cyl(0, -0.2, 0, 0.14, 0.12, 0.75, 8).cyl(0, 0.55, 0, 0.07, 0.05, 3.5, 8).cyl(0, 4.05, 0, 0.09, 0.06, 0.12, 8);
  D.tube([0, 3.95, 0], [0.42, 4.08, 0], 0.03, 5, true).cyl(0.42, 3.5, 0, 0.17, 0.2, 0.06, 8).cyl(0.42, 3.96, 0, 0.22, 0.04, 0.22, 8);
  G.cyl(0.42, 3.56, 0, 0.13, 0.17, 0.4, 8);
  return [D.build(), G.build()];
}
function benchGeo() { // seat facing +z, the bin at its +x end
  const D = new MB(), L = 1.9;
  D.setColor('#24272a');
  for (const s of [-L / 2 + 0.2, L / 2 - 0.2]) D.box(s - 0.04, 0, -0.27, s + 0.04, 0.43, 0.23).box(s - 0.04, 0.43, -0.31, s + 0.04, 0.88, -0.23);
  D.setColor('#8e5f3a');
  [-0.25, -0.13, -0.01, 0.11].forEach((d) => D.box(-L / 2, 0.43, d, L / 2, 0.47, d + 0.1));
  [0.55, 0.67, 0.79].forEach((y) => D.box(-L / 2, y, -0.31, L / 2, y + 0.09, -0.27));
  D.setColor('#33373a').cyl(L / 2 + 0.45, 0, -0.05, 0.2, 0.22, 0.78, 8).setColor('#24272a').cyl(L / 2 + 0.45, 0.78, -0.05, 0.23, 0.23, 0.05, 8);
  return D.build();
}

// ------------------------------------------------------------------------------------------------ figures (SG, 1.8 tall, +z forward)
const ring = (y, rx, rz, n = 12, dz = 0) => Array.from({ length: n }, (_, k) => { const a = (-k / n) * TAU; return [Math.cos(a) * rx, y, Math.sin(a) * rz + dz]; });
function man(s, pose) { // a standing man in a long coat; pose 1: right hand on the chest, 2: right arm forward
  for (const sx of [-1, 1]) { s.tube([[0.1 * sx, 0.04, 0.02], [0.1 * sx, 0.62, 0]], [0.075, 0.08], 8, { caps: true }); s.ellipsoid([0.1 * sx, 0.04, 0.07], [0.06, 0.04, 0.12], 8, 5); }
  s.loft([ring(0.42, 0.27, 0.2), ring(0.8, 0.25, 0.17), ring(1.1, 0.22, 0.14), ring(1.36, 0.23, 0.14), ring(1.46, 0.17, 0.11), ring(1.52, 0.07, 0.07)], { cap0: true, cap1: true });
  s.ellipsoid([0, 1.65, 0.01], [0.095, 0.12, 0.105], 10, 7);
  const right = pose === 1 ? [0.06, 1.25, 0.16] : pose === 2 ? [0.3, 1.32, 0.42] : [0.24, 0.86, 0.06];
  s.tube([[0.22, 1.42, 0], [0.27, 1.16, pose ? 0.12 : 0.03], right], [0.05, 0.045, 0.04], 6, { caps: true });
  s.tube([[-0.22, 1.42, 0], [-0.27, 1.16, 0.03], [-0.24, 0.86, 0.06]], [0.05, 0.045, 0.04], 6, { caps: true });
  return s;
}
function bust(s) {
  s.loft([ring(0, 0.2, 0.12, 10), ring(0.18, 0.21, 0.13, 10), ring(0.3, 0.12, 0.09, 10), ring(0.34, 0.06, 0.06, 10)], { cap0: true, cap1: true });
  s.ellipsoid([0, 0.5, 0.01], [0.085, 0.11, 0.095], 10, 7);
  return s;
}
const place = (dst, src, x, y, z, yaw, k) => put(dst, src, mapper(M4(x, y, z, yaw, k)));

export function buildParks({ root, map, solids: S, heightAt, onAsphalt = () => false, covered = () => false }) {
  if (!map?.roads) return null;
  const t0 = performance.now();
  const g = (x, z) => { const h = heightAt(x, z); return Number.isFinite(h) ? h : 0; };
  const solidAt = (x, z) => S.topAt(x, z).id >= 0;
  // colliders wait until every placement query is done: a registration makes the next query rebuild the whole grid
  const later = [], C = Object.fromEntries(['cyl', 'obox', 'prism'].map((k) => [k, (...a) => later.push([k, a])]));
  const free = (x, z, r) => !onAsphalt(x, z) && !covered(x, z)
    && ![[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].some(([dx, dz]) => solidAt(x + dx, z + dz));
  const R = map.region, inRegion = (x, z) => x > R.x0 && x < R.x1 && z > R.z0 && z < R.z1;

  // things trees keep off: [x, z, r] in a 16 m grid
  const keep = new Map(), kkey = (x, z) => Math.floor(x / 16) * 1e5 + Math.floor(z / 16);
  const hold = (x, z, r) => { const k = kkey(x, z); (keep.get(k) ?? keep.set(k, []).get(k)).push([x, z, r]); };
  const held = (x, z, d) => { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const [a, b, r] of keep.get(kkey(x + i * 16, z + j * 16)) ?? []) if (Math.hypot(a - x, b - z) < r + d) return true; return false; };

  // ---------------------------------------------------------------- the parks, in a 100 m grid
  const parks = [], pgrid = new Map(), pkey = (i, j) => i * 1e5 + j;
  for (const rings of map.cover?.park ?? []) {
    const P = rings.map(ringPts); if (P[0].length < 3 || areaOf(P[0]) < 1500) continue;
    const b = bboxOf(P[0]), k = parks.push({ P, b }) - 1;
    for (let i = Math.floor(b.x0 / 100); i <= Math.floor(b.x1 / 100); i++) for (let j = Math.floor(b.z0 / 100); j <= Math.floor(b.z1 / 100); j++) (pgrid.get(pkey(i, j)) ?? pgrid.set(pkey(i, j), []).get(pkey(i, j))).push(k);
  }
  const inPark = (x, z) => (pgrid.get(pkey(Math.floor(x / 100), Math.floor(z / 100))) ?? []).some((k) => {
    const { P, b } = parks[k];
    return x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1 && inPoly(P[0], x, z) && !P.slice(1).some((h) => inPoly(h, x, z));
  });

  // ---------------------------------------------------------------- lamps and benches along the park footways
  const lamps = [], benches = [];
  for (const q of map.roads) {
    if (!PATHS.test(q.c)) continue;
    const P = ringPts(q.p), paved = q.k !== 'd', every = paved ? 24 : 40, w = q.w ?? 2.5, off = w / 2 + 0.6, bo = w / 2 + 0.75;
    let next = every * 0.5, bNext = 14, walked = 0, side = 1;
    for (let k = 1; k < P.length; k++) {
      const a = P[k - 1], b = P[k], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.01) continue;
      const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
      for (; next < walked + L; next += every) {
        const t = next - walked, x = a[0] + ux * t - uz * off * side, z = a[1] + uz * t + ux * off * side;
        if (inRegion(x, z) && inPark(x, z) && !held(x, z, 8) && free(x, z, 0.4)) {
          lamps.push([x, g(x, z) + 0.1, z, Math.atan2(ux * side, uz * side)]); hold(x, z, 1.2); side = -side;
        }
      }
      if (paved) for (; bNext < walked + L; bNext += 31) {
        const t = bNext - walked, s = -side, x = a[0] + ux * t - uz * bo * s, z = a[1] + uz * t + ux * bo * s;
        if (inRegion(x, z) && inPark(x, z) && !held(x, z, 1.4) && free(x, z, 1.1)) {
          const yaw = Math.atan2(uz * s, -ux * s); // +z (the seat's front) toward the path
          benches.push([x, g(x, z) + 0.08, z, yaw]); hold(x, z, 1.6);
        }
      }
      walked += L;
    }
  }
  for (const [x, y, z] of lamps) C.cyl(x, z, y - 0.2, y + 4.1, 0.13, 0.07, 'pole');
  for (const [x, y, z, yaw] of benches) C.obox(x, z, 1.0, 0.32, -yaw, y, y + 0.5, 'bench');

  // ---------------------------------------------------------------- static meshes: playgrounds, fountains, sculpture
  const steel = new MB(), stone = new MB(), water = new MB(), jets = new MB(), bronze = new SG();
  let nPlay = 0, nItems = 0, nFount = 0, nSculpt = 0, nCross = 0;

  // playground items, local frame: +x along the playground's long side; each [radius, height, build(D, col)]
  const ITEMS = {
    tower: [3.2, 3.4, (D, c) => { // a 1.5 m deck on four posts, a roof, a ladder at -x, the slide down +x
      for (const [x, z] of [[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]]) D.setColor(c[0]).box(x - 0.06, 0, z - 0.06, x + 0.06, 2.9, z + 0.06);
      D.setColor('#9a6a42').box(-0.8, 1.4, -0.8, 0.8, 1.5, 0.8).setColor(c[1]).box(-0.8, 1.5, -0.8, 0.8, 2.0, -0.74).box(-0.8, 1.5, 0.74, 0.8, 2.0, 0.8);
      D.setColor(c[2]);
      for (const sx of [-1, 1]) D.face([[0.95 * sx, 2.9, -0.95], [0.95 * sx, 2.9, 0.95], [0.95 * sx, 3.4, 0]], [sx, 0, 0]);
      for (const sz of [-1, 1]) D.face([[-0.98, 2.88, 0.98 * sz], [0.98, 2.88, 0.98 * sz], [0.98, 3.42, 0], [-0.98, 3.42, 0]], [0, 0.707, 0.707 * sz]);
      D.setColor(c[0]); for (const z of [-0.35, 0.35]) D.box(-1.55, 0, z - 0.04, -1.47, 1.5, z + 0.04);
      for (let y = 0.3; y < 1.5; y += 0.3) D.box(-1.55, y, -0.35, -1.47, y + 0.05, 0.35);
      D.setColor(c[1]).face([[0.8, 1.45, -0.32], [3.1, 0.25, -0.32], [3.1, 0.25, 0.32], [0.8, 1.45, 0.32]], [0.46, 0.89, 0]);
      for (const z of [-0.34, 0.34]) D.tube([0.8, 1.62, z], [3.1, 0.42, z], 0.03, 5, true).face([[0.8, 1.6, z], [3.1, 0.4, z], [3.1, 0.25, z], [0.8, 1.45, z]], [0, 0, Math.sign(z)]);
    }],
    swings: [2.6, 2.3, (D, c) => { // two A-frames 3.2 m apart, a top bar, two seats on chains
      D.setColor(c[0]);
      for (const x of [-1.6, 1.6]) for (const z of [-0.8, 0.8]) D.tube([x, 0, z], [x, 2.25, 0], 0.05, 6, false);
      D.setColor(c[1]).tube([-1.65, 2.25, 0], [1.65, 2.25, 0], 0.055, 8, true);
      for (const x of [-0.75, 0.75]) { D.setColor('#9aa0a4'); for (const dx of [-0.2, 0.2]) D.box(x + dx - 0.01, 0.45, -0.01, x + dx + 0.01, 2.25, 0.01); D.setColor('#202326').box(x - 0.24, 0.42, -0.1, x + 0.24, 0.47, 0.1); }
    }],
    sandbox: [2.0, 0.3, (D) => { D.setColor('#9a6a42'); for (const s of [-1, 1]) D.box(-1.5, 0, 1.5 * s - 0.08, 1.5, 0.3, 1.5 * s + 0.08).box(1.5 * s - 0.08, 0, -1.5, 1.5 * s + 0.08, 0.3, 1.5); D.setColor('#e3cf9a').box(-1.42, 0, -1.42, 1.42, 0.2, 1.42); }],
    spring: [0.9, 1.0, (D, c) => { D.setColor('#55595c').cyl(0, 0, 0, 0.25, 0.25, 0.05, 10).setColor('#c9a227').cyl(0, 0.05, 0, 0.09, 0.09, 0.4, 8); D.setColor(c[0]).ellipsoid([0, 0.62, 0], [0.18, 0.2, 0.42], 10, 6).ellipsoid([0, 0.9, 0.3], [0.13, 0.15, 0.14], 8, 5); D.setColor('#202326').box(-0.12, 0.8, -0.1, 0.12, 0.84, 0.15); }],
    seesaw: [2.0, 0.9, (D, c) => { D.setColor(c[0]).box(-0.12, 0, -0.15, 0.12, 0.5, 0.15).setColor(c[1]).box(-1.8, 0.48, -0.12, 1.8, 0.56, 0.12); D.setColor('#202326'); for (const x of [-1.6, 1.6]) D.box(x - 0.2, 0.56, -0.15, x + 0.2, 0.6, 0.15).box(x - 0.03, 0.56, -0.2, x + 0.03, 0.85, 0.2); }],
    dome: [2.2, 1.9, (D, c) => { // a climbing dome: crossed arches of steel tube
      D.setColor(c[0]);
      for (let k = 0; k < 4; k++) { const a = (k / 4) * PI, cs = Math.cos(a), sn = Math.sin(a); let prev = null; for (let i = 0; i <= 8; i++) { const t = (i / 8) * PI, p = [Math.cos(t) * 1.8 * cs, Math.sin(t) * 1.8, Math.cos(t) * 1.8 * sn]; if (prev) D.tube(prev, p, 0.04, 5, false); prev = p; } }
      D.setColor(c[1]); for (const h of [0.6, 1.2]) { const r = Math.sqrt(1.8 * 1.8 - h * h); let prev = null; for (let i = 0; i <= 12; i++) { const a = (i / 12) * TAU, p = [Math.cos(a) * r, h, Math.sin(a) * r]; if (prev) D.tube(prev, p, 0.035, 5, false); prev = p; } }
    }],
  };
  const ORDER = ['tower', 'swings', 'sandbox', 'spring', 'dome', 'seesaw', 'spring', 'swings', 'spring', 'tower'];
  (map.cover?.play ?? []).forEach((rings, pi) => {
    const P = rings.map(ringPts); if (P[0].length < 3 || areaOf(P[0]) < 30) return;
    const [cx, cz] = centroid(P[0]); if (!inRegion(cx, cz) || covered(cx, cz)) return;
    const o = obb(P[0]); if (!o) return;
    const r = rng(1000 + pi), ux = o.ux, uz = o.uz, yaw = Math.atan2(-uz, ux); // local +x along the long side
    const inside = (x, z, rad) => [[0, 0], [rad, 0], [-rad, 0], [0, rad], [0, -rad]].every(([dx, dz]) => inPoly(P[0], x + dx, z + dz) && !P.slice(1).some((h) => inPoly(h, x + dx, z + dz)));
    const placed = [];
    for (const name of ORDER) {
      const [rad, hgt, make] = ITEMS[name];
      let spot = null;
      for (let tries = 0; tries < 40 && !spot; tries++) {
        const s = (r() - 0.5) * (o.L - 2 * rad), t = (r() - 0.5) * Math.max(0, o.W - 2 * rad);
        const x = o.cx + ux * s - uz * t, z = o.cz + uz * s + ux * t;
        if (inside(x, z, rad) && placed.every(([a, b, q]) => Math.hypot(a - x, b - z) > q + rad + 0.8) && free(x, z, rad * 0.7)) spot = [x, z];
      }
      if (!spot) continue;
      const [x, z] = spot, y = g(x, z), turn = r() < 0.5 ? 0 : PI, cols = [PLAY[Math.floor(r() * 5)], PLAY[Math.floor(r() * 5)], PLAY[Math.floor(r() * 5)]];
      steel.with(M4(x, y, z, yaw + turn), (D) => make(D, cols));
      placed.push([x, z, rad]); hold(x, z, rad + 0.5); nItems++;
      if (hgt > 0.5) C.obox(x, z, rad * 0.75, Math.min(rad, 1.2) * 0.75, -(yaw + turn), y, y + hgt, 'playground');
    }
    if (placed.length) nPlay++;
  });

  // fountains
  for (const p of map.pois ?? []) {
    if (p.tags?.amenity !== 'fountain') continue;
    let ring0 = p.p ? ringPts(p.p) : null;
    if (ring0 && ring0.length > 1 && Math.hypot(ring0[0][0] - ring0.at(-1)[0], ring0[0][1] - ring0.at(-1)[1]) < 0.05) ring0.pop(); // a closed way repeats its first point
    if (ring0 && (ring0.length < 3 || areaOf(ring0) < 3)) ring0 = null;
    const [cx, cz] = ring0 ? centroid(ring0) : [p.x, p.z];
    if (!inRegion(cx, cz) || covered(cx, cz) || solidAt(cx, cz)) continue;
    const outer = ring0 ?? Array.from({ length: 20 }, (_, k) => [cx + Math.cos((-k / 20) * TAU) * 2.6, cz + Math.sin((-k / 20) * TAU) * 2.6]);
    const rMean = outer.reduce((s, [x, z]) => s + Math.hypot(x - cx, z - cz), 0) / outer.length;
    const k = Math.max(0.3, 1 - 0.35 / rMean), inner = outer.map(([x, z]) => [cx + (x - cx) * k, cz + (z - cz) * k]);
    // on a slope the basin sits level with its high side and the rim runs down to the low one
    const hs = [...outer, ...inner, [cx, cz]].map(([x, z]) => g(x, z)), lo = Math.min(...hs) - 0.2, y0 = Math.max(...hs) - 0.05;
    stone.setColor('#c9c3b5').extrude(outer, [inner], lo, y0 + 0.5, { top: true, sides: true }).setColor('#8f9a9c').fill(inner, [], y0 + 0.08, true);
    water.fill(inner, [], y0 + 0.36, true);
    const jr = Math.min(0.45, Math.max(0.15, rMean * 0.1)), jh = Math.min(3.0, 0.8 + rMean * 0.35);
    stone.setColor('#bdb6a6').cyl(cx, y0, cz, jr * 1.6, jr * 1.3, 0.75, 12);
    const yw = y0 + 0.36; // the jet: a column that opens into a falling crown
    jets.lathe([[jr * 0.5, yw], [jr * 0.38, yw + jh * 0.3], [jr * 0.26, yw + jh * 0.92], [jr * 0.7, yw + jh], [jr * 1.4, yw + jh * 0.86], [jr * 1.8, yw + jh * 0.6]], 12, cx, cz);
    C.prism(outer.flat(), lo, y0 + 0.5, 0, 0, 'fountain');
    hold(cx, cz, rMean + 1); nFount++;
  }

  // the street a monument faces: the nearest road point within 60 m
  const roadSegs = map.roads.filter((q) => q.k === 'm' || q.c === 'pedestrian').map((q) => ringPts(q.p));
  const faceRoad = (x, z) => {
    let best = null, bd = 60;
    for (const P of roadSegs) for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i]; if (Math.min(a[0], b[0]) > x + bd || Math.max(a[0], b[0]) < x - bd || Math.min(a[1], b[1]) > z + bd || Math.max(a[1], b[1]) < z - bd) continue;
      const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
      const px = a[0] + dx * t, pz = a[1] + dz * t, d = Math.hypot(px - x, pz - z);
      if (d < bd) { bd = d; best = [px - x, pz - z]; }
    }
    return best ? Math.atan2(best[0], best[1]) : 0; // M4 / rotateY yaw that turns +z toward the street
  };
  for (const p of map.pois ?? []) {
    const t = p.tags ?? {}, x = p.x, z = p.z;
    const type = t.artwork_type ?? t.memorial ?? '', named = /^statuia\b/i.test(p.name ?? '');
    let kind = null;
    if (t.historic === 'wayside_cross') kind = 'cross';
    else if (t.historic === 'monument') kind = 'obelisk';
    else if (/^(statue|bust|cannon)$/.test(type) && (t.tourism === 'artwork' || t.historic === 'memorial')) kind = type;
    else if (named && (t.tourism === 'artwork' || t.historic === 'memorial')) kind = 'statue';
    else if (t.historic === 'memorial' && !type) kind = 'stele';
    if (!kind || p.p || !inRegion(x, z) || covered(x, z) || solidAt(x, z) || held(x, z, 0.5)) continue;
    const yaw = faceRoad(x, z), y = g(x, z) - 0.05, fig = Math.floor((p.x * 7 + p.z * 13) % 3 + 3) % 3;
    const st = (fn) => stone.with(M4(x, 0, z, yaw), fn);
    if (kind === 'statue') {
      st((D) => D.setColor('#8d8a85').box(-1.3, y, -1.3, 1.3, y + 0.25, 1.3).setColor('#a9a59c').box(-0.85, y + 0.25, -0.85, 0.85, y + 0.55, 0.85)
        .setColor('#b8b2a6').box(-0.65, y + 0.55, -0.65, 0.65, y + 2.35, 0.65).setColor('#a9a59c').box(-0.78, y + 2.35, -0.78, 0.78, y + 2.6, 0.78));
      place(bronze, man(new SG(), fig), x, y + 2.6, z, yaw, 1.45);
      C.obox(x, z, 1.3, 1.3, -yaw, y, y + 5.2, 'monument');
    } else if (kind === 'bust') {
      st((D) => D.setColor('#8d8a85').box(-0.7, y, -0.7, 0.7, y + 0.2, 0.7).setColor('#c8c2b4').box(-0.38, y + 0.2, -0.38, 0.38, y + 1.75, 0.38).setColor('#b3ad9f').box(-0.46, y + 1.75, -0.46, 0.46, y + 1.9, 0.46));
      place(bronze, bust(new SG()), x, y + 1.9, z, yaw, 1.35);
      C.obox(x, z, 0.7, 0.7, -yaw, y, y + 2.7, 'monument');
    } else if (kind === 'cannon') {
      st((D) => { D.setColor('#4a3b2c').box(-0.35, y + 0.3, -0.7, 0.35, y + 0.55, 0.6).setColor('#3a2f25'); for (const sx of [-1, 1]) D.tube([sx * 0.38, y + 0.45, 0.2], [sx * 0.46, y + 0.45, 0.2], 0.45, 14, true); });
      bronze.tube([[x - Math.sin(yaw) * 0.6, y + 0.65, z - Math.cos(yaw) * 0.6], [x + Math.sin(yaw) * 1.3, y + 0.85, z + Math.cos(yaw) * 1.3]], [0.17, 0.11], 10, { caps: true });
      C.obox(x, z, 1.2, 0.5, Math.atan2(Math.cos(yaw), Math.sin(yaw)), y, y + 1.0, 'monument');
    } else if (kind === 'obelisk') {
      st((D) => D.setColor('#9a958c').box(-1.4, y, -1.4, 1.4, y + 0.3, 1.4).setColor('#c4beb0').box(-0.9, y + 0.3, -0.9, 0.9, y + 1.3, 0.9).cyl(0, y + 1.3, 0, 0.62, 0.4, 5.2, 4).cyl(0, y + 6.5, 0, 0.4, 0.02, 0.8, 4));
      C.obox(x, z, 1.4, 1.4, -yaw, y, y + 7.3, 'monument');
    } else if (kind === 'stele') {
      st((D) => D.setColor('#8d8a85').box(-1.0, y, -0.6, 1.0, y + 0.2, 0.6).setColor('#3f4245').box(-0.62, y + 0.2, -0.16, 0.62, y + 2.2, 0.16).setColor('#a88d4a').box(-0.4, y + 1.2, 0.16, 0.4, y + 1.75, 0.18));
      C.obox(x, z, 1.0, 0.6, -yaw, y, y + 2.2, 'monument');
    } else { // the troiță: an oak cross with a small tin roof
      st((D) => {
        D.setColor('#5b3a22').box(-0.1, y, -0.1, 0.1, y + 3.3, 0.1).box(-0.75, y + 2.2, -0.08, 0.75, y + 2.38, 0.08).box(-0.35, y + 1.25, -0.07, 0.35, y + 1.38, 0.07);
        D.setColor('#4c5054').face([[-0.9, y + 2.55, 0.32], [0.9, y + 2.55, 0.32], [0.9, y + 2.8, 0], [-0.9, y + 2.8, 0]], [0, 0.8, 0.6]).face([[0.9, y + 2.55, -0.32], [-0.9, y + 2.55, -0.32], [-0.9, y + 2.8, 0], [0.9, y + 2.8, 0]], [0, 0.8, -0.6]);
        D.face([[-0.2, y + 3.25, 0.3], [0.2, y + 3.25, 0.3], [0.2, y + 3.45, 0], [-0.2, y + 3.45, 0]], [0, 0.8, 0.6]).face([[0.2, y + 3.25, -0.3], [-0.2, y + 3.25, -0.3], [-0.2, y + 3.45, 0], [0.2, y + 3.45, 0]], [0, 0.8, -0.6]);
      });
      C.obox(x, z, 0.2, 0.2, -yaw, y, y + 3.3, 'cross'); nCross++;
    }
    if (kind !== 'cross') nSculpt++;
    hold(x, z, 2);
  }

  for (const [k, a] of later) S[k](...a);

  // ---------------------------------------------------------------- meshes
  const group = Object.assign(new THREE.Group(), { name: 'oradea-parks' });
  const wide = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const add = (geo, mat, name, cast = true) => {
    const m = new THREE.Mesh(geo, mat); m.name = name; m.castShadow = cast; m.receiveShadow = true; group.add(m); return m;
  };
  if (steel.v) add(steel.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.25 }), 'parks-playgrounds');
  if (stone.v) add(stone.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), 'parks-stone');
  if (bronze.v) add(bronze.build(), new THREE.MeshStandardMaterial({ color: 0x6a6450, roughness: 0.5, metalness: 0.6 }), 'parks-bronze');
  if (water.v) add(water.build(), new THREE.MeshStandardMaterial({ color: 0x41707c, roughness: 0.06, metalness: 0.2, transparent: true, opacity: 0.88 }), 'parks-water', false);
  const jetMat = new THREE.MeshStandardMaterial({ color: 0xeaf4f6, roughness: 0.2, transparent: true, opacity: 0.5, depthWrite: false, emissive: 0x9fd0e0, emissiveIntensity: 0.1, side: THREE.DoubleSide });
  if (jets.v) add(jets.build(), jetMat, 'parks-jets', false);

  const one = new THREE.Vector3(1, 1, 1), m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), pv = new THREE.Vector3();
  const pool = (geo, mat, cap, name, cast) => {
    const m = new THREE.InstancedMesh(geo, mat, cap); m.name = name; m.count = 0; m.castShadow = cast; m.receiveShadow = true;
    m.frustumCulled = false; m.boundingSphere = wide; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); group.add(m); return m;
  };
  const [lg, gg] = lampGeo();
  const glowMat = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.3, emissive: 0xffdcaa, emissiveIntensity: 0 });
  const nL = Math.min(LAMPS, lamps.length), nB = Math.min(BENCHES, benches.length);
  const poles = nL ? pool(lg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.45 }), nL, 'parks-lamps', true) : null;
  const glows = nL ? pool(gg, glowMat, nL, 'parks-lamp-glow', false) : null;
  const seats = nB ? pool(benchGeo(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 }), nB, 'parks-benches', true) : null;
  root.add(group);

  const fill = (items, cap, reach, meshes, cx, cz) => {
    const near = [];
    for (const it of items) { const dx = it[0] - cx, dz = it[2] - cz; if (Math.abs(dx) < reach && Math.abs(dz) < reach) { const d = dx * dx + dz * dz; if (d < reach * reach) near.push([d, it]); } }
    if (near.length > cap) near.sort((a, b) => a[0] - b[0]);
    const n = Math.min(cap, near.length);
    for (let i = 0; i < n; i++) { const [x, y, z, yaw] = near[i][1]; m4.compose(pv.set(x, y, z), qt.setFromAxisAngle(up, yaw), one); for (const m of meshes) m.setMatrixAt(i, m4); }
    for (const m of meshes) { m.count = n; m.instanceMatrix.needsUpdate = true; }
  };
  let lx = Infinity, lz = Infinity, wait = 0, lastK = -1, clock = 0;
  const stats = { parks: parks.length, lamps: lamps.length, benches: benches.length, playgrounds: nPlay, playItems: nItems, fountains: nFount, sculptures: nSculpt, crosses: nCross, ms: 0 };
  stats.ms = Math.round(performance.now() - t0);
  console.log(`[oradea] parks: ${stats.lamps} lamps, ${stats.benches} benches in ${stats.parks} parks; ${nItems} items on ${nPlay} playgrounds; ${nFount} fountains, ${nSculpt} statues / memorials, ${nCross} crosses; ${stats.ms} ms`);
  return {
    stats,
    clear: (x, z) => held(x, z, 0.3),
    update(dt, camera) {
      clock += dt;
      const k = Math.min(1, nightK.value * 2.5);
      if (Math.abs(k - lastK) > 0.01) { glowMat.emissiveIntensity = 2.4 * k; lastK = k; }
      jetMat.opacity = 0.46 + 0.06 * Math.sin(clock * 7.3) * Math.sin(clock * 2.1);
      if ((wait -= dt) > 0 || !camera) return;
      wait = 0.5;
      const cx = camera.position.x, cz = camera.position.z;
      if ((cx - lx) ** 2 + (cz - lz) ** 2 < 15 * 15) return;
      lx = cx; lz = cz;
      if (poles) fill(lamps, nL, LAMP_REACH, [poles, glows], cx, cz);
      if (seats) fill(benches, nB, BENCH_REACH, [seats], cx, cz);
    },
  };
}
