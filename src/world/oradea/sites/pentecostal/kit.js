// OWNER: oradea. Shared kit of the free-church site (../pentecostal.js): the material set (five meshes per root group), the canvas textures, face
// frames on a footprint's edge or on a front plane, arched openings, gables and hips, crosses, the local frame of a footprint. Small helpers copied
// from the Reformed site's kit (sites/reformed/kit.js), trimmed to what these buildings use. Not a site module.
// Everything is drawn in a building-local frame (u from the front toward the back, v across, y absolute) between begin() and end(); the
// MeshBuilders bake the transform, so a whole root group stays five meshes whatever the number of buildings.
//   KEYS / newSet()          wall (plaster, tinted by vertex colour) tile (clay) sheet (standing-seam metal) trim (doors, dark trim, crosses,
//                            railings: `det` and `cap` are aliases) lit (window glass, lit at night)
//   makeMats(r) / finishSet(group, B, M, name) -> { verts, tris, meshes }
//   begin(B, x, z, yaw) / end(B)   local (u, v) -> map x = cx + cos(yaw) u - sin(yaw) v, z = cz + sin(yaw) u + cos(yaw) v
//   frameOf(ring, { faceTo, yaw, flip }) -> { cx, cz, yaw, U, V, ring (local, positive area), minU, maxU, minV, maxV, toMap(u, v), loc(x, z) }
//   groundOf(ring, g) -> { Fy, gLo }   the floor stands on the highest corner, the plinth reaches the lowest
//   edgeFrame(a, b), at(f, s, y, d), nrm(f), rect(M, f, s0, s1, y0, y1, d), slab(M, f, s0, s1, y0, y1, d0, d1, mask), poly(M, pts, hint)
//   frontFrame(u, v0, v1, dir) / sideFrame(v, u0, u1, dir)   a plane facing outward with methods in its own coordinate w: pt, rect, slab, win,
//                            door, oculus; seen from outside w grows to the right for ('u', -1) and ('v', +1)
//   outline(s, y0, w, h, kind, n, rise), win(B, f, s, y0, w, h, o), oculus, door
//   gable(R, o), pyramid(R, o)   roofs;  PROFILES + lathe(M, prof, seg, cx, cz, y0, R, H);  cross(D, x, y, z, h, col, yaw), ball
//   gableSolid(S, F, toW, o)     the two slopes of a gable roof as collision prisms
import * as THREE from 'three';
import { MB, M4 } from '../../../../kit/mesh.js';
import { canvasTex } from '../../../cherkasy/sculpt.js';

export const PI = Math.PI, TAU = PI * 2;
export const KEYS = ['wall', 'tile', 'sheet', 'trim', 'lit'];
export const newSet = () => { const B = Object.fromEntries(KEYS.map((k) => [k, new MB()])); B.det = B.cap = B.trim; return B; };
export const begin = (B, x, z, yaw) => { const m = M4(x, 0, z, -yaw); for (const k of KEYS) B[k].setXf(m); };
export const end = (B) => { for (const k of KEYS) B[k].setXf(null); };

// ------------------------------------------------------------------------------------------------ textures
const speck = (g, r, w, h, n, light = 'rgba(255,255,255,0.28)', dark = 'rgba(90,70,40,0.07)') => {
  for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? light : dark; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
};
// rendered plaster, near white so the wall colour is the vertex colour's (2.5 m a repeat)
export const plasterTex = (r) => {
  const t = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#f3f1ec'; g.fillRect(0, 0, w, h); speck(g, r, w, h, 3600, 'rgba(255,255,255,0.22)', 'rgba(90,70,40,0.06)');
    for (let i = 0; i < 36; i++) { g.fillStyle = `rgba(110,90,60,${0.008 + r() * 0.012})`; g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 44, 6 + r() * 26, r() * 3, 0, TAU); g.fill(); }
  });
  t.repeat.set(0.4, 0.4); return t;
};
// clay tiles in staggered courses (2 m a repeat)
export const tileTex = (r) => {
  const t = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#9d948b'; g.fillRect(0, 0, w, h);
    const rows = 14, cols = 10, th = h / rows, tw = w / cols;
    for (let j = 0; j < rows; j++) for (let i = -1; i < cols; i++) {
      const x = i * tw + (j & 1 ? tw / 2 : 0), y = j * th, v = 0.8 + r() * 0.3;
      g.fillStyle = `rgb(${Math.min(255, 238 * v) | 0},${Math.min(255, 220 * v) | 0},${Math.min(255, 208 * v) | 0})`;
      g.beginPath(); g.moveTo(x + 1, y); g.lineTo(x + tw - 1, y); g.lineTo(x + tw - 1, y + th * 0.62); g.quadraticCurveTo(x + tw / 2, y + th * 1.25, x + 1, y + th * 0.62); g.closePath(); g.fill();
      g.fillStyle = 'rgba(40,20,10,0.25)'; g.fillRect(x + 1, y + th * 0.55, tw - 2, 2);
    }
  });
  t.repeat.set(0.5, 0.5); return t;
};
// standing-seam sheet metal, a seam every 0.5 m (2 m a repeat)
export const seamTex = () => {
  const t = canvasTex(128, 64, (g, w, h) => {
    g.fillStyle = '#e8eaeb'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { const x = i * w / 4; g.fillStyle = '#9ba0a3'; g.fillRect(x, 0, 2, h); g.fillStyle = '#fbfcfc'; g.fillRect(x + 2, 0, 1.5, h); }
  });
  t.repeat.set(0.5, 0.5); return t;
};

export function makeMats(r) {
  const P = plasterTex(r), D = THREE.DoubleSide;
  return {
    wall: new THREE.MeshStandardMaterial({ map: P, vertexColors: true, roughness: 0.9, emissive: 0xffd9a8, emissiveMap: P, emissiveIntensity: 0 }),
    tile: new THREE.MeshStandardMaterial({ map: tileTex(r), vertexColors: true, roughness: 0.82, side: D }),
    sheet: new THREE.MeshStandardMaterial({ map: seamTex(), vertexColors: true, roughness: 0.55, metalness: 0.22, side: D }),
    trim: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.3, side: D }),
    lit: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.14, metalness: 0.35, emissive: 0xffd8a0, emissiveIntensity: 0 }),
  };
}

// the meshes of one root group; every builder is freed once built (the geometry keeps its own arrays, proxies.js reads them)
export function finishSet(group, B, M, name = 'pentecostal') {
  const out = { verts: 0, tris: 0, meshes: 0 };
  for (const k of KEYS) {
    const D = B[k];
    if (!D.v || !M[k]) continue;
    const geo = D.build();
    out.verts += D.v; out.tris += geo.index.count / 3; out.meshes++;
    group.add(Object.assign(new THREE.Mesh(geo, M[k]), { name: `${name}-${k}`, castShadow: k !== 'lit' && k !== 'trim', receiveShadow: true }));
    D.free();
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ the local frame of a footprint
export const ringArea = (R) => R.reduce((s, p, i) => { const q = R[(i + 1) % R.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
const EAST = -30.5 * PI / 180; // the map direction of true east (the frame's rotation)

// +u along the long axis of the minimum-area bounding rectangle, away from the side that looks at `faceTo` (a map point), centred on the box
export function frameOf(ring, o = {}) {
  let best = null;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], c = ring[(i + 1) % ring.length], ang = Math.atan2(c[1] - a[1], c[0] - a[0]), ca = Math.cos(-ang), sa = Math.sin(-ang);
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const p of ring) { const u = p[0] * ca - p[1] * sa, v = p[0] * sa + p[1] * ca; x0 = Math.min(x0, u); x1 = Math.max(x1, u); z0 = Math.min(z0, v); z1 = Math.max(z1, v); }
    const A = (x1 - x0) * (z1 - z0);
    if (!best || A < best.A) best = { A, ang, L: x1 - x0, W: z1 - z0 };
  }
  const wide = best.W > best.L + 0.5;
  let yaw = best.ang + ((o.nave === 'short' ? !wide : wide) ? PI / 2 : 0);
  const mid = ring.reduce((s, p) => [s[0] + p[0] / ring.length, s[1] + p[1] / ring.length], [0, 0]);
  if (o.yaw != null) yaw = o.yaw * PI / 180;
  else if (o.faceTo) { if ((o.faceTo[0] - mid[0]) * Math.cos(yaw) + (o.faceTo[1] - mid[1]) * Math.sin(yaw) > 0) yaw += PI; }
  else if (Math.cos(yaw - EAST) < 0) yaw += PI;
  if (o.flip) yaw += PI;
  const U = [Math.cos(yaw), Math.sin(yaw)], V = [-U[1], U[0]];
  const loc0 = ring.map((p) => [p[0] * U[0] + p[1] * U[1], p[0] * V[0] + p[1] * V[1]]);
  const u0 = Math.min(...loc0.map((q) => q[0])), u1 = Math.max(...loc0.map((q) => q[0])), v0 = Math.min(...loc0.map((q) => q[1])), v1 = Math.max(...loc0.map((q) => q[1]));
  const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, cx = U[0] * cu + V[0] * cv, cz = U[1] * cu + V[1] * cv;
  let lr = loc0.map(([u, v]) => [u - cu, v - cv]);
  if (ringArea(lr) < 0) lr = lr.reverse();
  return {
    cx, cz, yaw, U, V, ring: lr, minU: u0 - cu, maxU: u1 - cu, minV: v0 - cv, maxV: v1 - cv,
    toMap: (u, v) => [cx + U[0] * u + V[0] * v, cz + U[1] * u + V[1] * v],
    loc: (x, z) => [(x - cx) * U[0] + (z - cz) * U[1], (x - cx) * V[0] + (z - cz) * V[1]],
  };
}
// the floor level of a footprint (map-space ring, g(x, z) the ground): the floor stands on the highest corner / edge midpoint, the plinth reaches the lowest
export function groundOf(ring, g) {
  let hi = -1e9, lo = 1e9;
  ring.forEach((p, i) => {
    const q = ring[(i + 1) % ring.length];
    for (const [x, z] of [p, [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]]) { const h = g(x, z); if (Number.isFinite(h)) { hi = Math.max(hi, h); lo = Math.min(lo, h); } }
  });
  if (!Number.isFinite(hi)) { hi = 3; lo = 3; }
  return { Fy: hi + 0.15, gLo: lo - 0.5 };
}

// ------------------------------------------------------------------------------------------------ faces on a footprint edge
// a face from local point a to b, its outward normal (dv, -du): the footprint ring is positive-area in (u, v)
export function edgeFrame(a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1e-6;
  return { a, b, L, t: [dx / L, dz / L], n: [dz / L, -dx / L] };
}
export const at = (f, s, y, d = 0) => [f.a[0] + f.t[0] * s + f.n[0] * d, y, f.a[1] + f.t[1] * s + f.n[1] * d];
export const nrm = (f) => [f.n[0], 0, f.n[1]];
export const rect = (M, f, s0, s1, y0, y1, d = 0) => M.face([at(f, s0, y0, d), at(f, s1, y0, d), at(f, s1, y1, d), at(f, s0, y1, d)], nrm(f));
// a box leaning on the face: depth d0..d1, s0..s1, y0..y1; mask letters f front, t top, b bottom, l left, r right
export function slab(M, f, s0, s1, y0, y1, d0, d1, mask = 'ftlr') {
  const P = (s, y, d) => at(f, s, y, d);
  if (mask.includes('f')) M.face([P(s0, y0, d1), P(s1, y0, d1), P(s1, y1, d1), P(s0, y1, d1)], nrm(f));
  if (mask.includes('t')) M.face([P(s0, y1, d1), P(s1, y1, d1), P(s1, y1, d0), P(s0, y1, d0)], [0, 1, 0]);
  if (mask.includes('b')) M.face([P(s0, y0, d0), P(s1, y0, d0), P(s1, y0, d1), P(s0, y0, d1)], [0, -1, 0]);
  if (mask.includes('l')) M.face([P(s0, y0, d0), P(s0, y0, d1), P(s0, y1, d1), P(s0, y1, d0)], [-f.t[0], 0, -f.t[1]]);
  if (mask.includes('r')) M.face([P(s1, y0, d1), P(s1, y0, d0), P(s1, y1, d0), P(s1, y1, d1)], [f.t[0], 0, f.t[1]]);
}
// a flat polygon in a plane, its normal turned toward `hint`
export function poly(M, pts, hint) {
  let nx = 0, ny = 0, nz = 0;
  pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; nx += (p[1] - q[1]) * (p[2] + q[2]); ny += (p[2] - q[2]) * (p[0] + q[0]); nz += (p[0] - q[0]) * (p[1] + q[1]); });
  const l = Math.hypot(nx, ny, nz) || 1; let n = [nx / l, ny / l, nz / l];
  if (n[0] * hint[0] + n[1] * hint[1] + n[2] * hint[2] < 0) n = n.map((v) => -v);
  M.face(pts, n);
}

// a vertical plane addressed by its own coordinate w: axis 'u' is the plane u = c running along v in [lo, hi], axis 'v' the plane v = c running
// along u; dir is the side it faces (-1 / +1 along the axis). Seen from outside, w grows to the right for ('u', -1) and ('v', +1), to the left
// for the other two. Every method takes w ranges in ascending order and builds on the frame's edge (at / slab / rect of this file).
export function planeFrame(axis, c, lo, hi, dir) {
  let f;
  if (axis === 'u') f = dir < 0 ? edgeFrame([c, hi], [c, lo]) : edgeFrame([c, lo], [c, hi]);
  else f = dir > 0 ? edgeFrame([hi, c], [lo, c]) : edgeFrame([lo, c], [hi, c]);
  const rev = axis === 'u' ? dir < 0 : dir > 0;
  const sOf = (w) => (rev ? hi - w : w - lo);
  const range = (w0, w1) => { const a = sOf(w0), b = sOf(w1); return a < b ? [a, b] : [b, a]; };
  return Object.assign(f, {
    axis, c, dir, sOf, vOf: (s) => (rev ? hi - s : lo + s), range,
    pt: (w, y, d = 0) => at(f, sOf(w), y, d),
    rect(M, w0, w1, y0, y1, d = 0) { const [a, b] = range(w0, w1); rect(M, f, a, b, y0, y1, d); },
    slab(M, w0, w1, y0, y1, d0, d1, mask = 'ftlr') { const [a, b] = range(w0, w1); slab(M, f, a, b, y0, y1, d0, d1, mask); },
    win(B, w, y0, ww, h, o) { win(B, f, sOf(w), y0, ww, h, o); },
    door(B, w, y0, ww, h, o) { door(B, f, sOf(w), y0, ww, h, o); },
    oculus(B, w, y, r, o) { oculus(B, f, sOf(w), y, r, o); },
  });
}
export const frontFrame = (uF, vLo, vHi, dir = -1) => planeFrame('u', uF, vLo, vHi, dir);
export const sideFrame = (vF, uLo, uHi, dir = 1) => planeFrame('v', vF, uLo, uHi, dir);

// ------------------------------------------------------------------------------------------------ openings
// outline of an opening on a face as [s, y] points: bottom-left, bottom-right, up the right side, over the head, down the left side.
// kind: 'round' (semicircle), 'seg' (a shallow arc), 'pointed' (a lancet), 'flat'
export function outline(s, y0, w, h, kind = 'round', n = 4, rise = null) {
  const hw = w / 2;
  if (kind === 'flat') return [[s - hw, y0], [s + hw, y0], [s + hw, y0 + h], [s - hw, y0 + h]];
  const rs = rise ?? (kind === 'round' ? hw : kind === 'seg' ? w * 0.16 : w * 0.9), spring = y0 + h - rs, P = [[s - hw, y0], [s + hw, y0], [s + hw, spring]];
  if (kind === 'pointed') {
    for (let i = 1; i < n; i++) { const t = i / n; P.push([s + hw * (1 - Math.pow(t, 1.6)), spring + rs * t]); }
    P.push([s, spring + rs]);
    for (let i = n - 1; i >= 1; i--) { const t = i / n; P.push([s - hw * (1 - Math.pow(t, 1.6)), spring + rs * t]); }
  } else for (let i = 1; i < n; i++) { const a = i / n * PI; P.push([s + hw * Math.cos(a), spring + rs * Math.sin(a)]); }
  P.push([s - hw, spring]);
  return P;
}
// glass in an opening with a lighter surround of width `sur`; the glass goes to B.lit, the surround to B.wall
// o: kind, rise, sur, trim, glass, d (relief), n, sill, bars (a vertical and a horizontal glazing bar)
export function win(B, f, s, y0, w, h, o = {}) {
  const { kind = 'round', rise = null, sur = 0.16, trim = '#f6f0e4', glass = '#34465a', d = 0.04, n = 6, sill = true, bars = false } = o;
  const G = outline(s, y0, w, h, kind, n, rise);
  B.lit.setColor(glass); B.lit.face(G.map(([a, b]) => at(f, a, b, d)), nrm(f));
  if (sur > 0) {
    const ws = w + 2 * sur, y0o = y0 - (sill ? 0.07 : 0), ho = h + sur + (sill ? 0.07 : 0);
    const Q = outline(s, y0o, ws, ho, kind, n, rise == null ? null : rise * ws / w);
    B.wall.setColor(trim);
    for (let i = 0; i < G.length; i++) {
      const j = (i + 1) % G.length;
      if (i === 0 && !sill) continue;
      if (Q.length !== G.length) break;
      B.wall.face([at(f, Q[i][0], Q[i][1], d * 0.6), at(f, Q[j][0], Q[j][1], d * 0.6), at(f, G[j][0], G[j][1], d * 0.6), at(f, G[i][0], G[i][1], d * 0.6)], nrm(f));
    }
  }
  if (bars) {
    B.trim.setColor('#d8d2c4');
    slab(B.trim, f, s - 0.025, s + 0.025, y0, y0 + h - (kind === 'flat' ? 0 : w * 0.4), 0, d + 0.025, 'f');
    slab(B.trim, f, s - w / 2, s + w / 2, y0 + h * 0.46, y0 + h * 0.46 + 0.05, 0, d + 0.025, 'f');
  }
}
// a round window (an oculus): glass disc in a ring of trim
export function oculus(B, f, s, y, r, o = {}) {
  const { trim = '#f6f0e4', glass = '#34465a', d = 0.04, n = 12, ring = 0.14 } = o;
  const P = (rr, i, dd = d) => at(f, s + Math.cos(i / n * TAU) * rr, y + Math.sin(i / n * TAU) * rr, dd);
  B.lit.setColor(glass); B.lit.face(Array.from({ length: n }, (_, i) => P(r, i)), nrm(f));
  B.wall.setColor(trim);
  for (let i = 0; i < n; i++) B.wall.face([P(r + ring, i, d * 0.6), P(r + ring, i + 1, d * 0.6), P(r, i + 1, d * 0.6), P(r, i, d * 0.6)], nrm(f));
}
// a door: the leaf in dark wood or glass, the head arched or flat, the surround in trim
export function door(B, f, s, y0, w, h, o = {}) {
  const { kind = 'round', rise = null, col = '#5a3a26', trim = '#efe8d8', d = 0.05, sur = 0.2, n = 6, glass = false } = o;
  const G = outline(s, y0, w, h, kind, n, rise);
  const T = glass ? B.lit : B.trim; T.setColor(col); T.face(G.map(([a, b]) => at(f, a, b, d)), nrm(f));
  const ws = w + 2 * sur, Q = outline(s, y0, ws, h + sur, kind, n, rise == null ? null : rise * ws / w);
  B.wall.setColor(trim);
  if (sur > 0 && Q.length === G.length) for (let i = 1; i < G.length; i++) { const j = (i + 1) % G.length; B.wall.face([at(f, Q[i][0], Q[i][1], d * 0.7), at(f, Q[j][0], Q[j][1], d * 0.7), at(f, G[j][0], G[j][1], d * 0.7), at(f, G[i][0], G[i][1], d * 0.7)], nrm(f)); }
  B.trim.setColor(glass ? '#2a2d30' : '#3a2a20'); slab(B.trim, f, s - 0.03, s + 0.03, y0, y0 + h - (kind === 'flat' ? 0 : w * 0.45), 0, d + 0.02, 'f');
}

// ------------------------------------------------------------------------------------------------ roofs
const mx = (a, b) => (a + b) / 2;
// a gable roof (ridge along `ridge`: 'u' or 'v') over [a0, a1] x [b0, b1] on the (along, across) axes of the ridge, eaves at yE, ridge yR.
// o: ov eave overhang, rake gable overhang, hip0 / hip1 hip the a0 / a1 end, col roof colour, gcol / G the gable-triangle colour / builder,
// tri0 / tri1 false leave out the gable triangle at that end (a front that draws its own)
export function gable(R, o) {
  const { a0, a1, b0, b1, yE, yR, ridge = 'u', ov = 0.45, rake = 0.3, hip0 = false, hip1 = false, col, gcol, G, tri0 = true, tri1 = true } = o;
  const P = (a, b, y) => (ridge === 'u' ? [a, y, b] : [b, y, a]);
  const bm = mx(b0, b1), half = bm - b0, k = (yR - yE) / half, yEo = yE - k * ov;
  const e0 = a0 - (hip0 ? ov : rake), e1 = a1 + (hip1 ? ov : rake);
  const r0 = hip0 ? a0 + half : e0, r1 = hip1 ? a1 - half : e1;
  if (col) R.setColor(col);
  const up = [0, 1, 0];
  poly(R, [P(e0, b0 - ov, yEo), P(e1, b0 - ov, yEo), P(r1, bm, yR), P(r0, bm, yR)], up);
  poly(R, [P(e1, b1 + ov, yEo), P(e0, b1 + ov, yEo), P(r0, bm, yR), P(r1, bm, yR)], up);
  if (hip0) poly(R, [P(e0, b1 + ov, yEo), P(e0, b0 - ov, yEo), P(r0, bm, yR)], up);
  if (hip1) poly(R, [P(e1, b0 - ov, yEo), P(e1, b1 + ov, yEo), P(r1, bm, yR)], up);
  if (G) {
    if (gcol) G.setColor(gcol);
    const dir = (s) => (ridge === 'u' ? [s, 0, 0] : [0, 0, s]);
    if (!hip0 && tri0) poly(G, [P(a0, b0, yE), P(a0, b1, yE), P(a0, bm, yR)], dir(-1));
    if (!hip1 && tri1) poly(G, [P(a1, b1, yE), P(a1, b0, yE), P(a1, bm, yR)], dir(1));
  }
}
// a pyramid over a rectangle: apex at (cx, cz) at yR, eaves at yE over [x0, x1] x [z0, z1] grown by ov
export function pyramid(R, o) {
  const { x0, x1, z0, z1, yE, yR, ov = 0.3, col, cx = mx(x0, x1), cz = mx(z0, z1) } = o;
  if (col) R.setColor(col);
  const k = (yR - yE) / Math.max(1e-3, Math.min(x1 - x0, z1 - z0) / 2), yEo = yE - k * ov;
  const c = [[x0 - ov, yEo, z0 - ov], [x1 + ov, yEo, z0 - ov], [x1 + ov, yEo, z1 + ov], [x0 - ov, yEo, z1 + ov]], A = [cx, yR, cz];
  for (let i = 0; i < 4; i++) { const a = c[i], b = c[(i + 1) % 4]; poly(R, [a, b, A], [(a[0] + b[0]) / 2 - cx, 0.4, (a[2] + b[2]) / 2 - cz]); }
}
// a roof slab sloping from a ridge line down to an eave line (a shed or lean-to): the quad [p0, p1] at the eave, [q0, q1] at the high edge
export const shed = (R, p0, p1, q0, q1, col) => { if (col) R.setColor(col); poly(R, [p0, p1, q1, q0], [0, 1, 0]); };

// ------------------------------------------------------------------------------------------------ caps, crosses
export const PROFILES = {
  cone: [[1.0, 0], [0.0, 1.0]],
  dome: [[1.0, 0], [0.98, 0.18], [0.9, 0.38], [0.74, 0.58], [0.5, 0.78], [0.22, 0.93], [0.0, 1.0]],
  needle: [[1.0, 0], [0.82, 0.18], [0.58, 0.42], [0.36, 0.64], [0.18, 0.84], [0.06, 0.96], [0.0, 1.0]],
};
export const scaleProf = (p, R, H, y0) => p.map(([r, y]) => [r * R, y0 + y * H]);
// a body of revolution of a unit profile standing on (cx, y0, cz): radius R, height H, `rot` turns an n-gonal section about its axis
export function lathe(M, prof, seg, cx, cz, y0, R, H, rot = 0) {
  if (!rot) return M.lathe(scaleProf(prof, R, H, y0), seg, cx, cz);
  return M.with(M4(cx, 0, cz, rot), (q) => q.lathe(scaleProf(prof, R, H, y0), seg, 0, 0));
}
export const GOLD = '#c9a24a', WHITE = '#e9e6dc';
// a Latin cross standing on (x, y, z), its arms across `yaw`: a post and a bar at two thirds
export function cross(D, x, y, z, h = 1.8, col = GOLD, yaw = 0) {
  D.setColor(col);
  const t = Math.max(0.05, h * 0.04), w = h * 0.5;
  D.with(M4(x, y, z, yaw), (q) => {
    q.box(-t, 0, -t, t, h, t);
    q.box(-t * 0.8, h * 0.66, -w / 2, t * 0.8, h * 0.66 + t * 1.5, w / 2);
  });
}
export const ball = (D, x, y, z, r, col = GOLD, seg = 8) => { D.setColor(col); D.ellipsoid([x, y, z], [r, r, r], seg, 5); };

// ------------------------------------------------------------------------------------------------ colliders
// the two slopes of a gable roof as sloped prisms: ridge along u (the default) over [u0, u1] x [vt, vb], or `across` (ridge along v, the slopes
// fall toward u0 and u1); the eave at eaveY, the ridge `rise` higher on the middle line; F = { cx, cz, U, V }, toW(u, v) -> [x, z]
export function gableSolid(S, F, toW, { u0, u1, vt, vb, eaveY, rise, across = false }) {
  const [s0, s1] = across ? [u0, u1] : [vt, vb], D = across ? F.U : F.V, sc = (s0 + s1) / 2, k = rise / ((s1 - s0) / 2), off = D[0] * F.cx + D[1] * F.cz;
  const side = (a, b, sgn) => {
    const pts = (across ? [[a, vt], [b, vt], [b, vb], [a, vb]] : [[u0, a], [u1, a], [u1, b], [u0, b]]).map(([u, v]) => toW(u, v)).flat();
    const y0 = sgn > 0 ? eaveY - k * (s0 + off) : eaveY + k * (s1 + off);
    S.prism(pts, eaveY, y0, sgn * k * D[0], sgn * k * D[1], 'roof');
  };
  side(s0, sc, 1); side(sc, s1, -1);
}
