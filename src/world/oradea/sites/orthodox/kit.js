// OWNER: oradea. Shared kit of the Orthodox churches (../orthodox.js): the material set (ten meshes for the whole site), the
// canvas textures, face frames on a footprint's edges, roofs, domes, spires, crosses and arched openings. Not a site module.
// Everything is drawn in a church-local frame (u east along the nave, v across, y absolute) between begin() and end(); the
// MeshBuilders then bake the transform, so the whole site stays ten meshes whatever the number of churches.
//   KEYS / newSet()            the ten builders: wall stone brick (yellow blocks, red joints) roof tile shingle wood dome det lit
//   makeMats(r)                the matching materials (vertex colours tint the near-white textures)
//   finishSet(group, B, M)     builders -> meshes under `group`
//   begin(B, x, z, yaw) / end(B)  the local frame of a church: local (u, v) -> map x = cx + U0 u + V0 v, z = cz + U1 u + V1 v
//   edgeFrame(a, b), at(f, s, y, d), nrm(f), rect(M, f, s0, s1, y0, y1, d), slab(M, f, s0, s1, y0, y1, d0, d1, mask)
//   archOutline(s, y0, w, h, rise, n)  an arched opening outline on a face; archWin(B, f, s, y0, w, h, o); archDoor(...)
//   gable(R, G, o), hipRoof(R, o), pyramid(R, o)  roofs; spire(M, prof, seg, cx, cz, y0, R, H)  lathe bodies
//   PROFILES: onion, byz, bell (the Romanian flared spire), needle   -> [[r, y], ...] for a unit radius and height
//   cross(D, x, y, z, h, col), ball(D, x, y, z, r)
import * as THREE from 'three';
import { MB, M4 } from '../../../../kit/mesh.js';
import { canvasTex } from '../../../cherkasy/sculpt.js';

export const PI = Math.PI;
export const KEYS = ['wall', 'stone', 'brick', 'roof', 'tile', 'shingle', 'wood', 'dome', 'det', 'lit'];
export const newSet = () => Object.fromEntries(KEYS.map((k) => [k, new MB()]));
export const begin = (B, x, z, yaw) => { const m = M4(x, 0, z, -yaw); for (const k of KEYS) B[k].setXf(m); };
export const end = (B) => { for (const k of KEYS) B[k].setXf(null); };

// ------------------------------------------------------------------------------------------------ textures
const speck = (g, r, w, h, n, light = 'rgba(255,255,255,0.3)', dark = 'rgba(90,70,40,0.07)') => {
  for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? light : dark; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
};
export const plasterTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, w, h); speck(g, r, w, h, 2200);
  for (let i = 0; i < 22; i++) { g.fillStyle = `rgba(120,95,50,${0.02 + r() * 0.03})`; g.beginPath(); g.ellipse(r() * w, r() * h, 12 + r() * 38, 6 + r() * 20, r() * 3, 0, PI * 2); g.fill(); }
});
// dressed stone: ashlar courses 0.5 m high with staggered joints (one repeat = 2 m)
export const stoneTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#efede8'; g.fillRect(0, 0, w, h);
  const rows = 4, ch = h / rows;
  for (let j = 0; j < rows; j++) for (let i = 0; i < 3; i++) {
    const x = (i + (j & 1) * 0.5) * w / 3 + (r() - 0.5) * 6, v = 0.93 + r() * 0.1;
    g.fillStyle = `rgb(${236 * v | 0},${233 * v | 0},${226 * v | 0})`; g.fillRect(x, j * ch, w / 3, ch);
    g.fillStyle = 'rgba(70,64,56,0.35)'; g.fillRect(x, j * ch, 2, ch); g.fillRect(0, j * ch, w, 2);
  }
  speck(g, r, w, h, 1200);
});
// yellow facing brick in big offset blocks (0.67 x 0.33 m) with red joints, as on the church of St Andrew (one repeat = 2 m)
export const brickTex = (r) => canvasTex(192, 192, (g, w, h) => {
  g.fillStyle = '#9a4a34'; g.fillRect(0, 0, w, h);
  const rows = 6, cols = 3, bh = h / rows, bw = w / cols;
  for (let j = 0; j < rows; j++) for (let i = -1; i < cols + 1; i++) {
    const v = 0.9 + r() * 0.18, x = (i + (j & 1) * 0.5) * bw, y = j * bh;
    g.fillStyle = `rgb(${Math.min(255, 228 * v) | 0},${Math.min(255, 186 * v) | 0},${Math.min(255, 104 * v) | 0})`;
    g.fillRect(x + 2, y + 2, bw - 4, bh - 4);
    g.fillStyle = 'rgba(255,240,200,0.18)'; g.fillRect(x + 2, y + 2, bw - 4, 3);
  }
});
// standing-seam sheet metal, a seam every 0.5 m (one repeat = 2 m); near white so the colour is the vertex colour's
export const seamTex = () => canvasTex(128, 64, (g, w, h) => {
  g.fillStyle = '#eceeef'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) { const x = i * w / 4; g.fillStyle = '#9ea3a6'; g.fillRect(x, 0, 2, h); g.fillStyle = '#fbfcfc'; g.fillRect(x + 2, 0, 1.5, h); }
});
// clay roof tiles, two metres a repeat
export const tileTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#9a8f86'; g.fillRect(0, 0, w, h);
  const rows = 14, cols = 10, th = h / rows, tw = w / cols;
  for (let j = 0; j < rows; j++) for (let i = -1; i < cols; i++) {
    const x = i * tw + (j & 1 ? tw / 2 : 0), y = j * th, v = 0.82 + r() * 0.3;
    g.fillStyle = `rgb(${Math.min(255, 238 * v) | 0},${Math.min(255, 218 * v) | 0},${Math.min(255, 205 * v) | 0})`;
    g.beginPath(); g.moveTo(x + 1, y); g.lineTo(x + tw - 1, y); g.lineTo(x + tw - 1, y + th * 0.62); g.quadraticCurveTo(x + tw / 2, y + th * 1.25, x + 1, y + th * 0.62); g.closePath(); g.fill();
    g.fillStyle = 'rgba(40,20,10,0.25)'; g.fillRect(x + 1, y + th * 0.55, tw - 2, 2);
  }
});
// wooden shingles in scalloped courses, 1.2 m a repeat
export const shingleTex = (r) => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#6d6a66'; g.fillRect(0, 0, w, h);
  const rows = 8, cols = 8, th = h / rows, tw = w / cols;
  for (let j = 0; j < rows; j++) for (let i = -1; i < cols; i++) {
    const x = i * tw + (j & 1 ? tw / 2 : 0), y = j * th, v = 0.75 + r() * 0.4;
    g.fillStyle = `rgb(${150 * v | 0},${140 * v | 0},${128 * v | 0})`;
    g.beginPath(); g.moveTo(x + 0.5, y); g.lineTo(x + tw - 0.5, y); g.lineTo(x + tw - 0.5, y + th * 0.7); g.quadraticCurveTo(x + tw / 2, y + th * 1.3, x + 0.5, y + th * 0.7); g.closePath(); g.fill();
    g.fillStyle = 'rgba(20,16,12,0.35)'; g.fillRect(x + 0.5, y + th * 0.62, tw - 1, 1.5);
  }
});
// squared logs / planks laid horizontally with weathered grain, 2 m a repeat
export const woodTex = (r) => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#9a8a76'; g.fillRect(0, 0, w, h);
  const rows = 8, th = h / rows;
  for (let j = 0; j < rows; j++) {
    const v = 0.8 + r() * 0.3; g.fillStyle = `rgb(${170 * v | 0},${150 * v | 0},${125 * v | 0})`; g.fillRect(0, j * th + 1, w, th - 2);
    for (let k = 0; k < 7; k++) { g.fillStyle = 'rgba(40,30,20,0.18)'; g.fillRect(r() * w, j * th + 2 + r() * (th - 5), 10 + r() * 40, 1); }
    g.fillStyle = 'rgba(30,22,14,0.5)'; g.fillRect(0, j * th, w, 1.5);
  }
});

export function makeMats(r) {
  const P = plasterTex(r), D = THREE.DoubleSide;
  const warm = (map) => ({ emissive: 0xffd9a8, emissiveMap: map ?? null, emissiveIntensity: 0 });
  return {
    wall: new THREE.MeshStandardMaterial({ map: P, vertexColors: true, roughness: 0.9, ...warm(P) }),
    stone: new THREE.MeshStandardMaterial({ map: stoneTex(r), vertexColors: true, roughness: 0.66, metalness: 0.03 }),
    brick: new THREE.MeshStandardMaterial({ map: brickTex(r), vertexColors: true, roughness: 0.88 }),
    roof: new THREE.MeshStandardMaterial({ map: seamTex(), vertexColors: true, roughness: 0.46, metalness: 0.4, side: D }),
    tile: new THREE.MeshStandardMaterial({ map: tileTex(r), vertexColors: true, roughness: 0.82, side: D }),
    shingle: new THREE.MeshStandardMaterial({ map: shingleTex(r), vertexColors: true, roughness: 0.92, side: D }),
    wood: new THREE.MeshStandardMaterial({ map: woodTex(r), vertexColors: true, roughness: 0.9 }),
    dome: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.32, metalness: 0.72, side: D }),
    det: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.25, side: D }),
    lit: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.12, metalness: 0.4, emissive: 0xffd8a0, emissiveIntensity: 0 }),
  };
}

export function finishSet(group, B, M, name = 'orthodox') {
  const out = { verts: 0, tris: 0, meshes: 0 };
  for (const [k, D] of Object.entries(B)) {
    if (!D.v || !M[k]) continue;
    const geo = D.build();
    out.verts += D.v; out.tris += geo.index.count / 3; out.meshes++;
    group.add(Object.assign(new THREE.Mesh(geo, M[k]), { name: `${name}-${k}`, castShadow: k !== 'lit' && k !== 'det', receiveShadow: true }));
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ faces on a footprint edge
// a face from local point a to b, its outward normal (dv, -du): the footprint ring is positive-area in (u, v), as MB.extrude expects
export function edgeFrame(a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1e-6;
  return { a, b, L, t: [dx / L, dz / L], n: [dz / L, -dx / L] };
}
export const at = (f, s, y, d = 0) => [f.a[0] + f.t[0] * s + f.n[0] * d, y, f.a[1] + f.t[1] * s + f.n[1] * d];
export const nrm = (f) => [f.n[0], 0, f.n[1]];
export const rect = (M, f, s0, s1, y0, y1, d = 0) => M.face([at(f, s0, y0, d), at(f, s1, y0, d), at(f, s1, y1, d), at(f, s0, y1, d)], nrm(f));
// a box leaning on the face: from depth d0 to d1, s0..s1, y0..y1; mask letters f front, t top, b bottom, l left, r right
export function slab(M, f, s0, s1, y0, y1, d0, d1, mask = 'ftlr') {
  const P = (s, y, d) => at(f, s, y, d);
  if (mask.includes('f')) M.face([P(s0, y0, d1), P(s1, y0, d1), P(s1, y1, d1), P(s0, y1, d1)], nrm(f));
  if (mask.includes('t')) M.face([P(s0, y1, d1), P(s1, y1, d1), P(s1, y1, d0), P(s0, y1, d0)], [0, 1, 0]);
  if (mask.includes('b')) M.face([P(s0, y0, d0), P(s1, y0, d0), P(s1, y0, d1), P(s0, y0, d1)], [0, -1, 0]);
  if (mask.includes('l')) M.face([P(s0, y0, d0), P(s0, y0, d1), P(s0, y1, d1), P(s0, y1, d0)], [-f.t[0], 0, -f.t[1]]);
  if (mask.includes('r')) M.face([P(s1, y0, d1), P(s1, y0, d0), P(s1, y1, d0), P(s1, y1, d1)], [f.t[0], 0, f.t[1]]);
}
// a flat polygon lying in a plane, normal turned toward `hint`
export function poly(M, pts, hint) {
  let nx = 0, ny = 0, nz = 0;
  pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; nx += (p[1] - q[1]) * (p[2] + q[2]); ny += (p[2] - q[2]) * (p[0] + q[0]); nz += (p[0] - q[0]) * (p[1] + q[1]); });
  const l = Math.hypot(nx, ny, nz) || 1; let n = [nx / l, ny / l, nz / l];
  if (n[0] * hint[0] + n[1] * hint[1] + n[2] * hint[2] < 0) n = n.map((v) => -v);
  M.face(pts, n);
}

// ------------------------------------------------------------------------------------------------ arched openings
// outline of an opening on a face, bottom-left first, going right then up round the arch (rise = w / 2 is a round arch)
export function archOutline(s, y0, w, h, rise, n = 5) {
  const spring = y0 + h - rise, P = [[s - w / 2, y0], [s + w / 2, y0], [s + w / 2, spring]];
  for (let i = 1; i < n; i++) { const a = (i / n) * PI; P.push([s + (w / 2) * Math.cos(a), spring + rise * Math.sin(a)]); }
  P.push([s - w / 2, spring]);
  return P;
}
// glass in an arched opening with a lighter surround of width `sur`; the glass goes to B.lit, the surround to B.stone
export function archWin(B, f, s, y0, w, h, o = {}) {
  const { rise = w / 2, sur = 0.2, gcol = '#232d3a', tcol = '#f1ece0', d = 0.03, n = 4, sill = true, mullion = false } = o;
  const G = archOutline(s, y0, w, h, rise, n);
  B.lit.setColor(gcol); B.lit.face(G.map(([a, b]) => at(f, a, b, d)), nrm(f));
  if (sur > 0) {
    const riseO = rise * (w + 2 * sur) / w, spring = y0 + h - rise, y0o = y0 - 0.06;
    const Q = archOutline(s, y0o, w + 2 * sur, spring - y0o + riseO, riseO, n);
    B.stone.setColor(tcol);
    for (let i = 0; i < G.length; i++) {
      const j = (i + 1) % G.length;
      if (i === 0 && !sill) continue;
      B.stone.face([at(f, Q[i][0], Q[i][1], d * 0.6), at(f, Q[j][0], Q[j][1], d * 0.6), at(f, G[j][0], G[j][1], d * 0.6), at(f, G[i][0], G[i][1], d * 0.6)], nrm(f));
    }
  }
  if (mullion) { B.stone.setColor(tcol); slab(B.stone, f, s - 0.04, s + 0.04, y0, y0 + h - rise * 0.5, 0.0, d + 0.03, 'f'); }
}
// a door: the panel in dark wood, a round or flat head, the surround in stone
export function archDoor(B, f, s, y0, w, h, o = {}) {
  const { rise = w / 2, col = '#4a2e1f', tcol = '#e8e1d0', d = 0.05, sur = 0.22 } = o;
  const G = archOutline(s, y0, w, h, rise, 5);
  B.det.setColor(col); B.det.face(G.map(([a, b]) => at(f, a, b, d)), nrm(f));
  const riseO = rise * (w + 2 * sur) / w, spring = y0 + h - rise, Q = archOutline(s, y0, w + 2 * sur, spring - y0 + riseO, riseO, 5);
  B.stone.setColor(tcol);
  for (let i = 1; i < G.length; i++) { const j = (i + 1) % G.length; B.stone.face([at(f, Q[i][0], Q[i][1], d * 0.6), at(f, Q[j][0], Q[j][1], d * 0.6), at(f, G[j][0], G[j][1], d * 0.6), at(f, G[i][0], G[i][1], d * 0.6)], nrm(f)); }
  B.det.setColor('#3a2a22'); slab(B.det, f, s - 0.03, s + 0.03, y0, y0 + h - rise, 0.0, d + 0.02, 'f');
}

// ------------------------------------------------------------------------------------------------ roofs
const mx = (a, b) => (a + b) / 2;
// a gable roof (ridge along `ridge`: 'u' or 'v') over [a0, a1] x [b0, b1] on the (along, across) axes of the ridge, eaves at yE, ridge yR.
// o: ov eave overhang, rake gable overhang, hip0 / hip1 hip the a0 / a1 end, col roof colour, gcol / gm the gable-triangle colour / builder
export function gable(R, o) {
  const { a0, a1, b0, b1, yE, yR, ridge = 'u', ov = 0.45, rake = 0.3, hip0 = false, hip1 = false, col, gcol, G } = o;
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
    if (!hip0) poly(G, [P(a0, b0, yE), P(a0, b1, yE), P(a0, bm, yR)], dir(-1));
    if (!hip1) poly(G, [P(a1, b1, yE), P(a1, b0, yE), P(a1, bm, yR)], dir(1));
  }
}
// a pyramid / hip over a rectangle: apex (cx, cz) at yR, eaves at yE over [x0, x1] x [z0, z1] grown by ov
export function pyramid(R, o) {
  const { x0, x1, z0, z1, yE, yR, ov = 0.3, col, cx = mx(x0, x1), cz = mx(z0, z1) } = o;
  if (col) R.setColor(col);
  const k = (yR - yE) / Math.max(1e-3, Math.min(x1 - x0, z1 - z0) / 2), yEo = yE - k * ov;
  const c = [[x0 - ov, yEo, z0 - ov], [x1 + ov, yEo, z0 - ov], [x1 + ov, yEo, z1 + ov], [x0 - ov, yEo, z1 + ov]], A = [cx, yR, cz];
  for (let i = 0; i < 4; i++) { const a = c[i], b = c[(i + 1) % 4]; poly(R, [a, b, A], [(a[0] + b[0]) / 2 - cx, 0.4, (a[2] + b[2]) / 2 - cz]); }
}
// a fan of roof triangles from an apex to a ring of eave points (the apse's half cone)
export function fanRoof(R, apex, ringPts, col) {
  if (col) R.setColor(col);
  for (let i = 0; i + 1 < ringPts.length; i++) {
    const a = ringPts[i], b = ringPts[i + 1];
    poly(R, [a, b, apex], [(a[0] + b[0]) / 2 - apex[0], 0.4, (a[2] + b[2]) / 2 - apex[2]]);
  }
}

// ------------------------------------------------------------------------------------------------ bodies of revolution
// unit profiles [r, y] (radius 1, height 1), bottom to top
export const PROFILES = {
  onion: [[0.62, 0], [0.84, 0.07], [1.0, 0.22], [0.98, 0.34], [0.84, 0.48], [0.6, 0.63], [0.34, 0.78], [0.15, 0.9], [0.05, 0.98], [0.0, 1.0]],
  byz: [[1.0, 0], [0.99, 0.12], [0.94, 0.3], [0.84, 0.5], [0.68, 0.7], [0.46, 0.86], [0.2, 0.96], [0.0, 1.0]],
  // the Romanian flared cap: a wide eave, then a concave rise to a thin point
  bell: [[1.22, 0], [1.2, 0.03], [1.0, 0.1], [0.82, 0.2], [0.64, 0.34], [0.46, 0.5], [0.3, 0.68], [0.16, 0.84], [0.06, 0.95], [0.0, 1.0]],
  needle: [[1.0, 0], [0.8, 0.2], [0.55, 0.45], [0.33, 0.68], [0.16, 0.86], [0.05, 0.96], [0.0, 1.0]],
  cone: [[1.0, 0], [0.0, 1.0]],
};
export const scaleProf = (p, R, H, y0) => p.map(([r, y]) => [r * R, y0 + y * H]);
export function spire(M, prof, seg, cx, cz, y0, R, H) { return M.lathe(scaleProf(prof, R, H, y0), seg, cx, cz); }

// ------------------------------------------------------------------------------------------------ crosses
export const GOLD = '#d6ad45';
// an Orthodox cross facing along u (its arms run across the nave): a post, the main bar, a short top bar and a slanted foot bar
export function cross(D, x, y, z, h = 2.2, col = GOLD, yaw = 0) {
  D.setColor(col);
  const t = Math.max(0.06, h * 0.045), w = h * 0.52;
  D.with(M4(x, y, z, yaw), (q) => {
    q.box(-t, 0, -t, t, h, t);
    q.box(-t * 0.8, h * 0.72, -w / 2, t * 0.8, h * 0.72 + t * 1.4, w / 2);
    q.box(-t * 0.8, h * 0.88, -w * 0.3, t * 0.8, h * 0.88 + t * 1.1, w * 0.3);
    q.box(-t * 0.8, h * 0.22, -w * 0.3, t * 0.8, h * 0.22 + t * 1.1, w * 0.3);
  });
}
export const ball = (D, x, y, z, r, col = GOLD, seg = 8) => { D.setColor(col); D.ellipsoid([x, y, z], [r, r, r], seg, 5); };

// a drum: an n-sided prism (vertices at angles rot + 2 pi i / n) with an arched window on every side and a cornice; returns the top y.
// B[wallKey] gets the walls; o { n, col, trim, gcol, win, rot, cornice, ww (window width) }
export function drum(B, cx, cz, y0, R, H, o = {}) {
  const { n = 8, col = '#efe4c4', trim = '#f6f0e0', gcol = '#232d3a', win = true, wallKey = 'wall', rot = 0, cornice = true, ww = 0 } = o;
  const ring = [];
  for (let i = 0; i < n; i++) { const a = rot + (i / n) * PI * 2; ring.push([cx + R * Math.cos(a), cz + R * Math.sin(a)]); }
  for (let i = 0; i < n; i++) {
    const f = edgeFrame(ring[i], ring[(i + 1) % n]);
    B[wallKey].setColor(col); rect(B[wallKey], f, 0, f.L, y0, y0 + H);
    if (win && H > 1.2) archWin(B, f, f.L / 2, y0 + H * 0.2, ww || Math.min(1.1, f.L * 0.4), H * 0.62, { sur: 0.1, tcol: trim, gcol, n: 3 });
    if (cornice) { B.stone.setColor(trim); slab(B.stone, f, -0.1, f.L + 0.1, y0 + H - 0.28, y0 + H, 0, 0.16, 'ft'); }
  }
  return y0 + H;
}

// a round clock on a face: white dial, dark rim, two hands (s along the face, y absolute, radius r)
export function clockFace(B, f, s, y, r, d = 0.07) {
  const n = 16, pt = (rr, i, dd = d) => at(f, s + Math.cos(i / n * PI * 2) * rr, y + Math.sin(i / n * PI * 2) * rr, dd);
  B.det.setColor('#f1eee2'); B.det.face(Array.from({ length: n }, (_, i) => pt(r, i)), nrm(f));
  B.det.setColor('#2a2a2c');
  for (let i = 0; i < n; i++) B.det.face([pt(r * 1.14, i, d * 0.8), pt(r * 1.14, i + 1, d * 0.8), pt(r, i + 1, d * 0.8), pt(r, i, d * 0.8)], nrm(f));
  slab(B.det, f, s - 0.04, s + 0.04, y, y + r * 0.8, 0, d + 0.03, 'f');
  slab(B.det, f, s, s + r * 0.6, y - 0.04, y + 0.04, 0, d + 0.03, 'f');
}

// the four faces of a rectangle [u0, u1] x [v0, v1] with outward normals: { W, E, N (v0 side), S (v1 side) } as edgeFrames
export function rectFrames(u0, u1, v0, v1) {
  let P = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  const area = P.reduce((s, p, i) => { const q = P[(i + 1) % 4]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
  if (area < 0) P = P.slice().reverse();
  const F = {};
  P.forEach((a, i) => { const f = edgeFrame(a, P[(i + 1) % 4]); F[Math.abs(f.n[0]) > 0.5 ? (f.n[0] > 0 ? 'E' : 'W') : (f.n[1] > 0 ? 'S' : 'N')] = f; });
  return F;
}
// the same for a regular n-gon about (cx, cz), vertices at rot + 2 pi i / n: an array of edgeFrames
export function ngonFrames(cx, cz, R, n, rot = 0) {
  const P = Array.from({ length: n }, (_, i) => { const a = rot + i / n * PI * 2; return [cx + R * Math.cos(a), cz + R * Math.sin(a)]; });
  return P.map((a, i) => edgeFrame(a, P[(i + 1) % n]));
}
