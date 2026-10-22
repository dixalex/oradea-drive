// Oradea's trams (OTL): the street track from map.json `trams` (build_map.mjs with config tools.trams: one OSM
// railway=tram way per track), the overhead line, and trams that run along it on the wall clock, as the plane and the
// yacht do, so every player sees them in the same place.
//   buildTrams({ map, root, heightAt, ground, detailMat }) -> site { update(dt, camera), collide(p, r, h), clear(x, z),
//     stats } | null (no trams in the map)
//   Track: per way a concrete bed (1.9 m) with two steel rails, draped every 3 m on the street (+3 cm on asphalt,
//     +20 cm off it, over the quays where a way crosses the river on a bridge). One mesh.
//   Overhead: a pole with an arm every ~32 m beside the track, on the first spot off the carriageway 2.6–7 m out
//     (none where a pole of the other track already stands within 10 m; one InstancedMesh), the contact wire 5.8 m up
//     (one LineSegments).
//   Trams: routes run through the network along the straightest continuation at each junction, back at a dead end;
//     routes of 500 m and more carry one tram per ~1.6 km, ping-ponging at SPEED. A tram is three 10.6 m sections
//     (white over a blue skirt, a dark window band, cabs at both ends, a pantograph on the middle), each set on the
//     route by its own two bogie points, so the train bends round curves. Two InstancedMeshes (end, middle sections).
//   collide(p, r, h): the player's body (feet p.y, radius r, height h) against each section's box (city.js chains it
//     into world.collideDynamic, like the traffic). clear(x, z): no generated tree within 3 m of a track.
import * as THREE from 'three';
import { MB } from '../../kit/mesh.js';
import { DP } from '../materials.js';
import { WATER_Y } from '../water.js';

const GAUGE = 1.435, BED = 1.9, RAIL = 0.075, STEP = 3;
const WIRE_Y = 5.8, POLE_STEP = 32;
const SEC = 10.6, HALF_W = 1.2, BODY_H = 3.35, SPEED = 8.5, MIN_ROUTE = 500, PER_M = 1600;

const pairs = (p) => { const P = []; for (let i = 0; i + 1 < p.length; i += 2) P.push([p[i], p[i + 1]]); return P; };
function densify(P, step) {
  const out = [P[0]];
  for (let k = 1; k < P.length; k++) {
    const [ax, az] = P[k - 1], [bx, bz] = P[k], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / step));
    for (let i = 1; i <= n; i++) out.push([ax + (bx - ax) * i / n, az + (bz - az) * i / n]);
  }
  return out;
}
const cumOf = (P) => { const c = [0]; for (let k = 1; k < P.length; k++) c.push(c[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1])); return c; };
function at(P, cum, s) { // point and unit heading at arc s (clamped)
  const L = cum[cum.length - 1]; s = Math.max(0, Math.min(L, s));
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
  const seg = cum[hi] - cum[lo] || 1, f = (s - cum[lo]) / seg, [ax, az] = P[lo], [bx, bz] = P[hi];
  return [ax + (bx - ax) * f, az + (bz - az) * f, (bx - ax) / seg, (bz - az) / seg];
}

// routes: from each way's ends walk on through the junction to the straightest next way (turn under 40 degrees)
function routesOf(ways) {
  const key = (p) => `${Math.round(p[0] * 2)},${Math.round(p[1] * 2)}`, ends = new Map();
  ways.forEach((w, i) => { for (const e of [0, 1]) { const k = key(e ? w.P[w.P.length - 1] : w.P[0]); (ends.get(k) ?? ends.set(k, []).get(k)).push([i, e]); } });
  const dirAt = (w, e) => { const P = w.P, [a, b] = e ? [P[P.length - 2], P[P.length - 1]] : [P[1], P[0]], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  const used = new Set(), routes = [];
  const order = ways.map((w, i) => i).sort((a, b) => ways[b].len - ways[a].len);
  for (const start of order) {
    if (used.has(start)) continue;
    used.add(start);
    let P = ways[start].P.slice();
    for (const fwd of [true, false]) { // extend at the end, then (reversed) at the start
      if (!fwd) P.reverse();
      for (let guard = 0; guard < 200; guard++) {
        const tail = P[P.length - 1], prev = P[P.length - 2], l = Math.hypot(tail[0] - prev[0], tail[1] - prev[1]) || 1, d = [(tail[0] - prev[0]) / l, (tail[1] - prev[1]) / l];
        let best = null, bestDot = Math.cos(40 * Math.PI / 180);
        for (const [i, e] of ends.get(key(tail)) ?? []) {
          if (used.has(i)) continue;
          const out = dirAt(ways[i], 1 - e), dot = -(out[0] * d[0] + out[1] * d[1]); // dirAt points into the shared end
          if (dot > bestDot) { bestDot = dot; best = [i, e]; }
        }
        if (!best) break;
        const [i, e] = best; used.add(i);
        const Q = e === 0 ? ways[i].P : ways[i].P.slice().reverse();
        P = P.concat(Q.slice(1));
      }
    }
    const cum = cumOf(P);
    routes.push({ P, cum, len: cum[cum.length - 1] });
  }
  return routes;
}

// one section of the tram: local +x along the car, centred, y = 0 on the rails. cab: a driver's end at +x
function sectionGeo(cab) {
  const M = new MB(), L = SEC / 2 - 0.15, W = HALF_W;
  const white = '#eef1f3', blue = '#1d5fae', teal = '#2aa6b8', dark = '#262b31';
  M.setPart(DP.STEEL).setColor(dark);
  for (const bx of [-L + 1.6, L - 1.6]) M.box(bx - 1.1, 0.1, -W + 0.15, bx + 1.1, 0.55, W - 0.15); // bogies
  M.setPart(DP.PAINT).setColor(blue).box(-L, 0.35, -W, L, 0.95, W, 1 | 2 | 8 | 16 | 32); // skirt
  M.setColor(white).box(-L, 0.95, -W, L, 1.05, W, 1 | 2 | 16 | 32);
  M.setPart(DP.GLASS).setColor('#1b2128').box(-L + 0.3, 1.05, -W - 0.005, L - 0.3, 2.45, W + 0.005, 16 | 32); // window band
  M.setPart(DP.PAINT).setColor(white);
  for (const x of [-L, L - 0.3]) M.box(x, 1.05, -W, x + 0.3, 2.45, W, 16 | 32); // the band's ends
  M.box(-L, 2.45, -W, L, BODY_H - 0.25, W, 1 | 2 | 16 | 32);
  M.setColor(teal).box(-L, 2.47, -W - 0.01, L, 2.62, W + 0.01, 16 | 32); // a teal line over the windows
  M.setColor('#d9dde0').box(-L + 0.1, BODY_H - 0.25, -W + 0.08, L - 0.1, BODY_H, W - 0.08); // roof
  M.setColor('#9aa1a7').box(-1.8, BODY_H, -0.7, 1.8, BODY_H + 0.45, 0.7); // roof equipment
  // doors: two per side, glass full height
  M.setPart(DP.GLASS).setColor('#20272e');
  for (const dx of [-2.2, 2.2]) for (const sz of [-1, 1]) M.box(dx - 0.65, 0.4, sz * W - 0.01, dx + 0.65, 2.4, sz * W + 0.01, sz > 0 ? 16 : 32);
  if (cab) { // a raked nose with a wide windscreen and headlights
    M.setPart(DP.PAINT).setColor(white);
    M.face([[L, 0.35, -W], [L + 0.9, 0.35, -W + 0.25], [L + 0.9, 0.35, W - 0.25], [L, 0.35, W]], [0, -1, 0]);
    M.setColor(blue).face([[L + 0.9, 0.35, -W + 0.25], [L + 0.9, 1.0, -W + 0.25], [L + 0.9, 1.0, W - 0.25], [L + 0.9, 0.35, W - 0.25]], [1, 0, 0]);
    for (const sz of [-1, 1]) M.setColor(sz > 0 ? blue : blue).face([[L, 0.35, sz * W], [L + 0.9, 0.35, sz * (W - 0.25)], [L + 0.9, 1.0, sz * (W - 0.25)], [L, 1.0, sz * W]], [0.3, 0, sz]);
    M.setPart(DP.GLASS).setColor('#141a20').face([[L + 0.9, 1.0, -W + 0.25], [L + 0.45, 2.75, -W + 0.15], [L + 0.45, 2.75, W - 0.15], [L + 0.9, 1.0, W - 0.25]], [0.97, 0.25, 0]);
    for (const sz of [-1, 1]) M.setPart(DP.GLASS).face([[L, 1.0, sz * W], [L + 0.9, 1.0, sz * (W - 0.25)], [L + 0.45, 2.75, sz * (W - 0.15)], [L, 2.75, sz * W]], [0.2, 0, sz]);
    M.setPart(DP.PAINT).setColor(white).face([[L, 2.75, -W], [L + 0.45, 2.75, -W + 0.15], [L + 0.45, 2.75, W - 0.15], [L, 2.75, W]], [0, 1, 0]);
    M.face([[L + 0.45, 2.75, -W + 0.15], [L, BODY_H - 0.25, -W + 0.1], [L, BODY_H - 0.25, W - 0.1], [L + 0.45, 2.75, W - 0.15]], [0.6, 0.8, 0]);
    for (const sz of [-1, 1]) M.face([[L, 2.75, sz * W], [L + 0.45, 2.75, sz * (W - 0.15)], [L, BODY_H - 0.25, sz * (W - 0.1)]], [0, 0, sz]);
    M.setPart(DP.LIGHT).setColor('#fff3d6');
    for (const sz of [-1, 1]) M.box(L + 0.88, 0.6, sz * 0.75 - 0.18, L + 0.93, 0.78, sz * 0.75 + 0.18, 1);
    M.setColor('#ffd27a').box(L + 0.4, 2.8, -0.5, L + 0.48, 3.0, 0.5, 1); // the route sign
  } else { // the middle section: the pantograph
    M.setPart(DP.STEEL).setColor('#3a3f45');
    const y0 = BODY_H + 0.45;
    M.tube([-0.9, y0, -0.5], [0.2, y0 + 1.2, -0.5], 0.03, 4).tube([-0.9, y0, 0.5], [0.2, y0 + 1.2, 0.5], 0.03, 4);
    M.tube([0.2, y0 + 1.2, -0.5], [-0.3, WIRE_Y - 0.25 - 0.02, -0.5], 0.025, 4).tube([0.2, y0 + 1.2, 0.5], [-0.3, WIRE_Y - 0.25 - 0.02, 0.5], 0.025, 4);
    M.box(-0.45, WIRE_Y - 0.3, -0.75, -0.15, WIRE_Y - 0.25, 0.75);
  }
  return M.build({ part: true });
}

export function buildTrams({ map, root, heightAt, ground, detailMat }) {
  const ways = (map.trams ?? []).map((w) => { const P = pairs(w.p); return { id: w.id, P, len: cumOf(P).at(-1) }; }).filter((w) => w.P.length >= 2 && w.len > 1);
  if (!ways.length) return null;
  const t0 = performance.now();
  const onAsph = ground?.onAsphalt ?? (() => true), wet = ground?.isWater ?? (() => false);
  const railY = (x, z) => { const h = heightAt(x, z); return wet(x, z) ? Math.max(h, WATER_Y + 3.2) : h + (onAsph(x, z) ? 0.03 : 0.2); };

  // ---- track: bed and rails along each way, vertices shared along the strip
  const T = new MB(), cells = new Map(), ck = (x, z) => Math.floor(x / 16) * 65536 + Math.floor(z / 16);
  const strip = (D, Y, oa, ob, dy) => { // a strip between offsets oa..ob along D, top at Y + dy
    let prev = null;
    for (let k = 0; k < D.length; k++) {
      const a = D[Math.max(0, k - 1)], b = D[Math.min(D.length - 1, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = -(b[1] - a[1]) / l, nz = (b[0] - a[0]) / l, [x, z] = D[k], y = Y[k] + dy;
      const i = T.vert(x + nx * oa, y, z + nz * oa, 0, 1, 0), j = T.vert(x + nx * ob, y, z + nz * ob, 0, 1, 0);
      if (prev) { // wound to face up
        // facing up: (pi, j, i) when the strip's across direction (+n) lies to the left of along, as n = (-dz, dx) does
        const [pi, pj] = prev, left = (D[k][0] - D[k - 1][0]) * nz - (D[k][1] - D[k - 1][1]) * nx;
        if (left > 0) T.tri(pi, j, i).tri(pi, pj, j); else T.tri(pi, i, j).tri(pi, j, pj);
      }
      prev = [i, j];
    }
  };
  const wire = [];
  let trackM = 0;
  for (const w of ways) {
    const D = densify(w.P, STEP), Y = D.map(([x, z]) => railY(x, z));
    T.setPart(DP.CONC).setColor('#8e8b85'); strip(D, Y, -BED / 2, BED / 2, 0);
    T.setPart(DP.STEEL).setColor('#b9bcc0');
    for (const s of [-1, 1]) strip(D, Y, s * GAUGE / 2 - RAIL / 2, s * GAUGE / 2 + RAIL / 2, 0.012);
    for (let k = 0; k < D.length; k++) {
      const c = ck(D[k][0], D[k][1]); (cells.get(c) ?? cells.set(c, []).get(c)).push(D[k][0], D[k][1]);
      if (k % 2 === 0 && k + 2 < D.length) wire.push(D[k][0], Y[k] + WIRE_Y, D[k][1], D[k + 2][0], Y[k + 2] + WIRE_Y, D[k + 2][1]);
    }
    trackM += w.len;
  }

  // ---- overhead: poles beside the track, off the carriageway, shared between the two tracks of a line
  const poles = [];
  const poleNear = (x, z, d) => poles.some((p) => (p[0] - x) ** 2 + (p[1] - z) ** 2 < d * d);
  for (const w of ways) {
    const cum = cumOf(w.P);
    for (let s = POLE_STEP / 2; s < w.len; s += POLE_STEP) {
      const [x, z, dx, dz] = at(w.P, cum, s);
      if (poleNear(x, z, 10)) continue;
      let spot = null;
      for (const o of [2.6, 3.5, 4.5, 6, 7]) for (const sg of [1, -1]) {
        if (spot) break;
        const px = x - dz * o * sg, pz = z + dx * o * sg;
        if (!onAsph(px, pz) && !wet(px, pz)) spot = [px, pz, o];
      }
      if (spot) poles.push([spot[0], spot[1], Math.atan2(x - spot[0], z - spot[1]), spot[2]]); // yaw: local +z toward the track
    }
  }
  const PG = new MB();
  PG.setPart(DP.STEEL).setColor('#4a5056').cyl(0, 0, 0, 0.13, 0.09, 7.2, 8);
  PG.tube([0, 6.4, 0], [0, 6.4, 1], 0.05, 5); // the arm along local +z, scaled to reach the track
  const poleGeo = PG.build({ part: true });
  const mat = detailMat ?? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 });
  const poleMesh = new THREE.InstancedMesh(poleGeo, mat, Math.max(1, poles.length));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  poles.forEach(([x, z, yaw, o], i) => {
    const y = heightAt(x, z) + (onAsph(x, z) ? 0 : 0.15);
    m4.compose(v.set(x, y, z), q.setFromEuler(e.set(0, yaw, 0)), sc.set(1, 1, 1)); poleMesh.setMatrixAt(i, m4);
    // the arm reaches o metres to the wire: a short span drawn as a wire segment from the arm's tip
    wire.push(x, y + 6.4, z, x + Math.sin(yaw) * o, y + 6.4, z + Math.cos(yaw) * o);
  });
  poleMesh.count = poles.length; poleMesh.name = 'tram-poles'; poleMesh.castShadow = true;

  const group = Object.assign(new THREE.Group(), { name: 'oradea-trams' });
  root.add(group);
  group.add(Object.assign(new THREE.Mesh(T.build({ part: true, uv: false }), mat), { name: 'tram-track', receiveShadow: true }));
  group.add(poleMesh);
  const wireGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(wire, 3));
  group.add(Object.assign(new THREE.LineSegments(wireGeo, new THREE.LineBasicMaterial({ color: 0x23272b })), { name: 'tram-wire' }));

  // ---- the trams
  const routes = routesOf(ways).filter((r) => r.len >= MIN_ROUTE);
  const cars = [];
  routes.forEach((r, ri) => {
    const n = Math.max(1, Math.round(r.len / PER_M));
    for (let k = 0; k < n; k++) cars.push({ r, phase: (k / n) * 2 * r.len + ri * 377 });
  });
  const endGeo = sectionGeo(true), midGeo = sectionGeo(false);
  const ends = new THREE.InstancedMesh(endGeo, mat, Math.max(1, cars.length * 2)), mids = new THREE.InstancedMesh(midGeo, mat, Math.max(1, cars.length));
  for (const m of [ends, mids]) { m.castShadow = true; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); group.add(m); }
  ends.name = 'tram-ends'; mids.name = 'tram-mids';
  const live = cars.map(() => [[0, 0, 0], [0, 0, 0], [0, 0, 0]]); // per car, per section: x, z, yaw
  const place = (mesh, i, s, r, flip) => {
    const a = at(r.P, r.cum, s + SEC / 2 - 1.6), b = at(r.P, r.cum, s - SEC / 2 + 1.6);
    const x = (a[0] + b[0]) / 2, z = (a[1] + b[1]) / 2, yaw = Math.atan2(-(a[1] - b[1]), a[0] - b[0]) + (flip ? Math.PI : 0);
    const y = (railY(a[0], a[1]) + railY(b[0], b[1])) / 2 + 0.02;
    m4.compose(v.set(x, y, z), q.setFromEuler(e.set(0, yaw, 0)), sc.set(1, 1, 1)); mesh.setMatrixAt(i, m4);
    return [x, z, yaw, y];
  };
  const pose = () => {
    const t = Date.now() / 1000;
    cars.forEach((c, i) => {
      const { r } = c, span = Math.max(1, r.len - 3 * SEC), u = (t * SPEED + c.phase) % (2 * span);
      const head = (u < span ? u : 2 * span - u) + 2.5 * SEC, back = u >= span; // ping-pong; the leading cab turns round
      const S = [head - SEC, head, head - 2 * SEC]; // middle, then the two ends
      live[i][1] = place(mids, i, S[0], r, false);
      live[i][0] = place(ends, 2 * i, back ? S[2] : S[1], r, back);
      live[i][2] = place(ends, 2 * i + 1, back ? S[1] : S[2], r, !back);
    });
    ends.instanceMatrix.needsUpdate = true; mids.instanceMatrix.needsUpdate = true;
  };
  pose();
  const stats = { ways: ways.length, trackKm: +(trackM / 1000).toFixed(1), poles: poles.length, routes: routes.length, trams: cars.length,
    verts: T.v + poleGeo.attributes.position.count * poles.length + (endGeo.attributes.position.count * 2 + midGeo.attributes.position.count) * cars.length,
    ms: Math.round(performance.now() - t0) };
  console.log(`[oradea] trams: ${stats.ways} track ways (${stats.trackKm} km), ${stats.poles} poles, ${stats.routes} routes, ${stats.trams} trams, ${stats.ms} ms`);

  return {
    stats,
    update() { pose(); },
    clear(x, z) {
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        const a = cells.get(ck(x + i * 16, z + j * 16)); if (!a) continue;
        for (let k = 0; k < a.length; k += 2) if ((a[k] - x) ** 2 + (a[k + 1] - z) ** 2 < 9) return true;
      }
      return false;
    },
    collide(p, r = 1, h = 1.3) {
      for (const secs of live) for (const [x, z, yaw, y] of secs) {
        const ox = p.x - x, oz = p.z - z;
        if (ox * ox + oz * oz > 64 || p.y > y + BODY_H || p.y + h < y) continue;
        const fx = Math.cos(yaw), fz = -Math.sin(yaw), lx = ox * fx + oz * fz, lz = -ox * fz + oz * fx;
        const hx = SEC / 2 + r, hz = HALF_W + r;
        if (Math.abs(lx) >= hx || Math.abs(lz) >= hz) continue;
        const ex = hx - Math.abs(lx), ez = hz - Math.abs(lz);
        const px = ex < ez ? Math.sign(lx) * ex : 0, pz = ex < ez ? 0 : Math.sign(lz || 1) * ez;
        const wx = px * fx - pz * fz, wz = px * fz + pz * fx, d = Math.hypot(wx, wz) || 1;
        return { push: new THREE.Vector3(wx, 0, wz), normal: new THREE.Vector3(wx / d, 0, wz / d), depth: d, grounded: false, groundY: 0, vel: null };
      }
      return null;
    },
  };
}
