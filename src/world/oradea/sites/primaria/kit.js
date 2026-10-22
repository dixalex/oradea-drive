// OWNER: oradea. Shared kit of the Piața Unirii site (primaria.js): the palette, the canvas textures, the material set
// and the small geometry helpers the three buildings (hall.js, church.js, eagle.js) use. Not a site module.
//   COL                                   palette (sRGB hex strings; the vertex colour tints near-white textures)
//   newSet(...extra) -> { wall, stone, det, roof, clay, glass, lit, sign, balu, rail, glow, tile, ...extra }   one MeshBuilder per material
//   makeMats(r, { wash, reach }) -> { wall, stone, det, roof (standing seam), clay (tiles), glass, lit, glow, balu, rail }   the materials
//   tileMaterial(atlas, wash, reach, key) -> { mat, u }   the painted-bay material: glow mask for the panes plus a floodlight wash; u.uLit / u.uWall drive it
//   archPts(hw, rise, n) / outline(w, h, rise, g, n)    window outlines in a plane: [[a, b], ...], a across, b up
//   windowA(B, f, spec)                  a window stuck on the face f: pane, surround, sill; lit panes go to B.lit
//   fan(D, pts, n, uv?)                  convex polygon of 3D points, winding picked by n
//   poly2(D, f, outer, holes, o, uvM)    any 2D polygon [[s, y], ...] on the face f (earcut)
//   strip(D, A, Bq, n)                   quads between two equal-length 3D polylines
//   slopeSolid(S, ring, y0, p0, n, k, kind)   a prism whose top plane rises at k per metre from p0 along n
//   finishSet(root, name, B, M, shade)   builders -> meshes (empty ones skipped)
import * as THREE from 'three';
import { MB, triangulateRings } from '../../../../kit/mesh.js';
import { canvasTex } from '../../../cherkasy/sculpt.js';
import { at, quad, rect, box, finish } from '../../../cherkasy/slabkit.js';

export const PI = Math.PI;
export const COL = {
  cream: '#eadba7', creamPale: '#efe3b8', white: '#f3eee0', ivory: '#ece6d2', granite: '#a1766a', graniteD: '#6b4540',
  copper: '#6d5543', copperGreen: '#4d6e5c', dark: '#2a2c2e', iron: '#2e3330', brown: '#4a3426', glassTint: '#8fa2ae',
  tile: '#a4472f', tileD: '#8a3a28', sheet: '#7f9188', helm: '#37524a', gold: '#c9a04e',
};
export const UP = [0, 1, 0], DN = [0, -1, 0];

// ------------------------------------------------------------------------------------------------ textures
// fine render speckle, near white, 2.5 m a repeat
export const stuccoTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1600; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.3)' : 'rgba(90,78,60,0.07)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
});
// rough ashlar / granite plinth, 2 m a repeat
export const stoneTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#d8d2c8'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4000; i++) { const k = r(); g.fillStyle = k < 0.4 ? 'rgba(50,30,26,0.25)' : k < 0.75 ? 'rgba(255,235,225,0.3)' : 'rgba(150,90,80,0.2)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  g.fillStyle = 'rgba(40,30,26,0.35)'; for (let j = 1; j < 4; j++) g.fillRect(0, j * h / 4 - 1, w, 2);
});
// one window pane: glass gradient inside a thin frame, a transom at 40 %; the mask is white on the glass (night glow)
export const paneTex = (mask, frame = '#2e251f') => canvasTex(64, 128, (g, w, h) => {
  const gl = g.createLinearGradient(0, 0, w * 0.6, h);
  gl.addColorStop(0, mask ? '#fff' : '#b9c7cf'); gl.addColorStop(0.55, mask ? '#fff' : '#7d909c'); gl.addColorStop(1, mask ? '#fff' : '#3f4d57');
  g.fillStyle = gl; g.fillRect(0, 0, w, h);
  g.fillStyle = mask ? '#000' : frame;
  g.fillRect(0, 0, 4, h); g.fillRect(w - 4, 0, 4, h); g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4);
  g.fillRect(w / 2 - 1.5, 0, 3, h); g.fillRect(0, Math.round(h * 0.38), w, 3);
});
// standing-seam sheet roof, 2 m a repeat (four seams)
export const seamTex = () => canvasTex(256, 64, (g, w, h) => {
  g.fillStyle = '#e8e8e6'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) { const x = i * 64; g.fillStyle = '#9c9c9a'; g.fillRect(x, 0, 3, h); g.fillStyle = '#fff'; g.fillRect(x + 3, 0, 2, h); }
});
// clay roof tiles, 1 m a repeat: courses of 0.25 m, tiles 0.2 m wide
export const clayTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#e9e1da'; g.fillRect(0, 0, w, h);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) {
    const v = 226 + r() * 29, x = i * 43 + (j & 1 ? 21 : 0);
    g.fillStyle = `rgb(${v | 0},${(v - 6) | 0},${(v - 10) | 0})`; g.fillRect(x + 2, j * 64 + 2, 39, 60);
    g.fillStyle = 'rgba(60,20,10,0.25)'; g.fillRect(x + 2, j * 64 + 54, 39, 8);
  }
});
// stone balusters between a rail and a plinth strip on a clear ground; 256 x 128 = 1.8 m x 0.9 m, tiles along u
export const baluTex = () => canvasTex(256, 128, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#fff';
  for (let i = 0; i < 8; i++) {
    const x = i * 32 + 16;
    g.beginPath(); g.moveTo(x - 6, h - 12); g.lineTo(x + 6, h - 12); g.lineTo(x + 4, h - 28); g.lineTo(x + 9, h - 50); g.lineTo(x + 3, h - 70); g.lineTo(x + 6, h - 88); g.lineTo(x - 6, h - 88); g.lineTo(x - 3, h - 70); g.lineTo(x - 9, h - 50); g.lineTo(x - 4, h - 28); g.closePath(); g.fill();
  }
  g.fillRect(0, h - 14, w, 14); g.fillRect(0, 0, w, 14);
});
// wrought iron: rails, uprights, a scroll between every other pair; 256 x 128 = 1.8 m x 0.9 m
export const railTex = () => canvasTex(256, 128, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.strokeStyle = '#fff'; g.lineWidth = 9;
  g.beginPath(); g.moveTo(0, 6); g.lineTo(w, 6); g.moveTo(0, h - 7); g.lineTo(w, h - 7); g.stroke();
  g.lineWidth = 5;
  for (let i = 0; i < 12; i++) { const x = i * 21.3 + 10; g.beginPath(); g.moveTo(x, 6); g.lineTo(x, h - 7); g.stroke(); if (i % 2 === 0) { g.beginPath(); g.arc(x + 10.6, h * 0.5, 12, 0, PI * 2); g.stroke(); } }
});
// the clocks: a 2 x 2 atlas (white Roman faces with a dark rim, a dark face with gold figures), the hands drawn on top
export function drawClock(g, x, y, d, kind, hours) {
  const c = d / 2, cx = x + c, cy = y + c;
  g.fillStyle = kind === 1 ? '#27384a' : kind === 2 ? '#23282b' : '#f2efe4'; g.beginPath(); g.arc(cx, cy, c, 0, PI * 2); g.fill();
  g.strokeStyle = kind === 1 ? '#c9a04e' : '#2a2a2a'; g.lineWidth = d * 0.035; g.beginPath(); g.arc(cx, cy, c * 0.96, 0, PI * 2); g.stroke();
  g.fillStyle = kind === 0 ? '#1d1d1d' : '#d9b866'; g.font = `bold ${d * 0.11}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const rom = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2 - PI / 2; g.fillText(rom[k], cx + Math.cos(a) * c * 0.76, cy + Math.sin(a) * c * 0.76); }
  g.strokeStyle = kind === 0 ? '#161616' : '#e6cf86'; g.lineCap = 'round';
  const hr = hours % 12, mn = (hours * 60) % 60;
  const hand = (a, len, wd) => { g.lineWidth = wd; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(a) * len, cy - Math.cos(a) * len); g.stroke(); };
  hand((hr + mn / 60) / 12 * PI * 2, c * 0.5, d * 0.035); hand(mn / 60 * PI * 2, c * 0.72, d * 0.024);
}

// ------------------------------------------------------------------------------------------------ builders / materials
export const newSet = (...extra) => Object.fromEntries(['wall', 'stone', 'det', 'roof', 'clay', 'glass', 'lit', 'sign', 'balu', 'rail', 'glow', 'tile', ...extra].map((k) => [k, new MB()]));

// the shared set; `wash` is the list of floodlight points (map metres) for the wall wash at night
export function makeMats(r, { wallKey = 'p', wash = [], reach = 40 } = {}) {
  const warm = new THREE.Color('#ffd7a0'), pane = paneTex(false), mask = paneTex(true);
  const wallMap = stuccoTex(r);
  const wall = new THREE.MeshStandardMaterial({ map: wallMap, vertexColors: true, roughness: 0.88, emissive: 0xffe2b8, emissiveMap: wallMap, emissiveIntensity: 0 });
  if (wash.length) {
    const n = wash.length, U = { uFlood: { value: wash.map((p) => new THREE.Vector3(...p)) }, uReach: { value: reach } };
    wall.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = 'varying vec3 vFlP;\nvarying vec3 vFlN;\n' + sh.vertexShader.replace('#include <project_vertex>',
        '#include <project_vertex>\n  vFlP = (modelMatrix * vec4(transformed, 1.0)).xyz;\n  vFlN = mat3(modelMatrix) * objectNormal;');
      sh.fragmentShader = `uniform vec3 uFlood[${n}];\nuniform float uReach;\nvarying vec3 vFlP;\nvarying vec3 vFlN;\n` + sh.fragmentShader.replace('#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
  {
    vec3 fN = normalize(vFlN) * (gl_FrontFacing ? 1.0 : -1.0);
    float wash = 0.0;
    for (int i = 0; i < ${n}; i++) { vec3 L = uFlood[i] - vFlP; float d = length(L); wash += max(dot(fN, L / d), 0.0) * clamp(1.35 - d / uReach, 0.0, 1.0); }
    totalEmissiveRadiance *= wash;
  }`);
    };
    wall.customProgramCacheKey = () => `oradea-${wallKey}-flood-${n}`;
  }
  return {
    wall,
    stone: new THREE.MeshStandardMaterial({ map: stoneTex(r), vertexColors: true, roughness: 0.6, metalness: 0.05 }),
    det: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.25 }),
    roof: new THREE.MeshStandardMaterial({ map: seamTex(), vertexColors: true, roughness: 0.45, metalness: 0.4 }),
    clay: new THREE.MeshStandardMaterial({ map: clayTex(r), vertexColors: true, roughness: 0.78, metalness: 0.02 }),
    glass: new THREE.MeshStandardMaterial({ map: pane, vertexColors: true, roughness: 0.1, metalness: 0.45, envMapIntensity: 1.2 }),
    lit: new THREE.MeshStandardMaterial({ map: pane, vertexColors: true, roughness: 0.12, metalness: 0.35, emissive: warm, emissiveMap: mask, emissiveIntensity: 0 }),
    glow: new THREE.MeshStandardMaterial({ color: 0xf6f0e2, roughness: 0.3, emissive: 0xffe2b0, emissiveIntensity: 0.05 }),
    balu: new THREE.MeshStandardMaterial({ map: baluTex(), vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7 }),
    rail: new THREE.MeshStandardMaterial({ map: railTex(), vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.3 }),
  };
}

// ------------------------------------------------------------------------------------------------ geometry
// a convex polygon of 3D points whose front looks along n; uv: [[u, v], ...] per point
export function fan(D, pts, n, uv = null) {
  const ids = pts.map((p, k) => D.vert(p[0], p[1], p[2], n[0], n[1], n[2], uv?.[k][0] ?? 0, uv?.[k][1] ?? 0));
  const a = pts[0], b = pts[1], c = pts[2];
  const e = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], g = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const cr = [e[1] * g[2] - e[2] * g[1], e[2] * g[0] - e[0] * g[2], e[0] * g[1] - e[1] * g[0]];
  const flip = cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0;
  for (let i = 2; i < pts.length; i++) flip ? D.tri(ids[0], ids[i], ids[i - 1]) : D.tri(ids[0], ids[i - 1], ids[i]);
  return D;
}
// quads between two polylines of equal length (3D), the front looking along n
export function strip(D, A, Bq, n, uvOf = null) {
  for (let i = 0; i + 1 < A.length; i++) quad(D, A[i], A[i + 1], Bq[i + 1], Bq[i], n, uvOf ? uvOf(i) : null);
}
// a 2D polygon [[s, y], ...] (any shape, with holes) on the face f at offset o; uv in metres / uvM
export function poly2(D, f, outer, holes = [], o = 0, uvM = 2.5) {
  const T = triangulateRings(outer, holes);
  if (!T) return D;
  const first = D.v;
  for (const p of T.pts) { const q = at(f, p[0], p[1], o); D.vert(q[0], q[1], q[2], f.N[0], 0, f.N[2], p[0] / uvM, p[1] / uvM); }
  for (let t = 0; t < T.idx.length; t += 3) {
    const a = T.idx[t], b = T.idx[t + 1], c = T.idx[t + 2], P = T.pts;
    // the face's (s, y) frame looks along -N when s runs to the viewer's right: keep the triangle facing +N
    const cr = (P[b][0] - P[a][0]) * (P[c][1] - P[a][1]) - (P[b][1] - P[a][1]) * (P[c][0] - P[a][0]); // + = counter-clockwise in (s, y)
    const rightward = f.ux * f.nz - f.uz * f.nx > 0;
    (cr > 0) === rightward ? D.tri(first + a, first + b, first + c) : D.tri(first + a, first + c, first + b);
  }
  return D;
}
// poly2 with the uv chosen by uvf(s, y) -> [u, v]
export function poly2uv(D, f, outer, holes, o, uvf) {
  const T = triangulateRings(outer, holes);
  if (!T) return D;
  const first = D.v;
  for (const p of T.pts) { const q = at(f, p[0], p[1], o), uv = uvf(p[0], p[1]); D.vert(q[0], q[1], q[2], f.N[0], 0, f.N[2], uv[0], uv[1]); }
  const rightward = f.ux * f.nz - f.uz * f.nx > 0;
  for (let t = 0; t < T.idx.length; t += 3) {
    const a = T.idx[t], b = T.idx[t + 1], c = T.idx[t + 2], P = T.pts;
    const cr = (P[b][0] - P[a][0]) * (P[c][1] - P[a][1]) - (P[b][1] - P[a][1]) * (P[c][0] - P[a][0]);
    (cr > 0) === rightward ? D.tri(first + a, first + b, first + c) : D.tri(first + a, first + c, first + b);
  }
  return D;
}
// a window's outline, counter-clockwise (a across, b up from the sill line b = 0), grown by g all round: bottom-left,
// bottom-right, up the right side to the springing, over the arch (rise > 0), down the left side
export function outline(w, h, rise, g = 0, n = 6) {
  const hw = w / 2 + g, out = [[-hw, -g], [hw, -g]];
  if (rise > 0) {
    out.push([hw, h]);
    for (let k = 1; k < n; k++) { const a = (k / n) * PI; out.push([Math.cos(a) * hw, h + Math.sin(a) * (rise + g)]); }
    out.push([-hw, h]);
  } else out.push([hw, h + g], [-hw, h + g]);
  return out;
}

// a window stuck on the face f (a few cm proud of the wall): the pane (B.glass, or B.lit), a surround of width `sur`
// round it and an optional sill and flat or segmental cap. spec: { s, y0, w, h, rise = 0, sur = 0.16, surCol, glass,
// lit = false, sill = false, off = 0.03, cap = 0, capCol, rows = 1, cols = 1 }
export function windowA(B, f, q) {
  const { s, y0, w, h, rise = 0, sur = 0.16, off = 0.03, lit = false, sill = false, cap = 0, cols = 1, rows = 1 } = q;
  const G = lit ? B.lit : B.glass, D = B.det, ol = outline(w, h, rise, 0), top = h + rise;
  G.setColor(q.glass ?? COL.glassTint);
  fan(G, ol.map(([a, b]) => at(f, s + a, y0 + b, off)), f.N, ol.map(([a, b]) => [(a + w / 2) / w * cols, b / top * rows]));
  if (sur > 0) {
    const o2 = outline(w, h, rise, sur), ni = ol.length - 1;
    // the surround: the outline ring between the pane and the grown outline (the bottom edge is the sill's)
    const inner = ol.map(([a, b]) => at(f, s + a, y0 + b, off + 0.01)), outer = o2.map(([a, b]) => at(f, s + a, y0 + b, off + 0.01));
    B.wall.setColor(q.surCol ?? COL.white);
    // side and top bands only: from the right-bottom corner round to the left-bottom one
    strip(B.wall, inner.slice(1, ni + 1), outer.slice(1, ni + 1), f.N);
    quad(B.wall, inner[ni], inner[0], outer[0], outer[ni], f.N);
  }
  if (sill) { B.wall.setColor(q.surCol ?? COL.white); box(B.wall, f, s - w / 2 - sur - 0.1, s + w / 2 + sur + 0.1, y0 - sur - 0.12, y0 - sur, 0, 0.16, 'ftlru'); }
  if (cap) { // a flat hood: a cornice slab over the window
    B.wall.setColor(q.capCol ?? q.surCol ?? COL.white);
    box(B.wall, f, s - w / 2 - sur - 0.12, s + w / 2 + sur + 0.12, y0 + h + rise + sur, y0 + h + rise + sur + cap, 0, 0.22, 'ftlru');
  }
}

// a prism whose top is the plane through p0 = [x, y, z] rising k per metre along the horizontal unit n = [nx, nz]
export function slopeSolid(S, ring, y0, p0, n, k, kind = 'roof', flags = 0) {
  const bx = k * n[0], bz = k * n[1], a = p0[1] - bx * p0[0] - bz * p0[2];
  return S.prism(ring.flat(), y0, a, bx, bz, kind, flags);
}
// the builders of a set -> meshes under one named group (finish of slabkit; empty builders skipped)
export const finishSet = (root, name, B, M, shade = ['wall', 'stone', 'roof']) => finish(root, name, B, M, { shade });
export { MB, at, quad, rect, box };

// a roof triangle / quad from 3D points, the normal made to point up; uv from the horizontal coordinates / uvM
export function roofPoly(D, pts, uvM = 2) {
  const a = pts[0], b = pts[1], c = pts[2];
  const e = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], g = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  let n = [e[1] * g[2] - e[2] * g[1], e[2] * g[0] - e[0] * g[2], e[0] * g[1] - e[1] * g[0]];
  if (n[1] < 0) n = n.map((v) => -v);
  const l = Math.hypot(...n) || 1; n = n.map((v) => v / l);
  // uv along the slope: across = horizontal axis perpendicular to the fall line, down = distance along it
  const fall = Math.hypot(n[0], n[2]) > 1e-6 ? [n[0] / Math.hypot(n[0], n[2]), n[2] / Math.hypot(n[0], n[2])] : [1, 0], side = [-fall[1], fall[0]];
  return fan(D, pts, n, pts.map((p) => [(p[0] * side[0] + p[2] * side[1]) / uvM, (p[0] * fall[0] + p[2] * fall[1]) / uvM / Math.max(0.2, Math.hypot(n[0], n[2]))]));
}
// the clock atlas cell k (0..3, 2 x 2) as [u0, v0, u1, v1] with v up
export const clockUV = (k) => { const c = k % 2, rw = k >> 1; return [c * 0.5, 1 - (rw + 1) * 0.5, c * 0.5 + 0.5, 1 - rw * 0.5]; };
// a round clock on the face f at (s, y), diameter d, on a ring of stone: sign quad + a 16-gon ring behind it
export function clockOn(B, f, s, y, d, k, ring = COL.white) {
  const ph = (i, rr) => { const a = (i / 16) * PI * 2; return at(f, s + Math.cos(a) * rr, y + Math.sin(a) * rr, 0.07); };
  B.wall.setColor(ring); fan(B.wall, Array.from({ length: 16 }, (_, i) => ph(i, d * 0.62)), f.N);
  const [u0, v0, u1, v1] = clockUV(k), h = d / 2, o = 0.12;
  B.sign.setColor('#ffffff');
  const dir = f.ux * f.nz - f.uz * f.nx > 0 ? 1 : -1; // s runs to the viewer's right: u follows it
  const [uL, uR] = dir > 0 ? [u0, u1] : [u1, u0];
  quad(B.sign, at(f, s - h, y - h, o), at(f, s + h, y - h, o), at(f, s + h, y + h, o), at(f, s - h, y + h, o), f.N, [[uL, v0], [uR, v0], [uR, v1], [uL, v1]]);
}

// the painted-bay material: map = the colours, emissiveMap = the pane mask (lit windows) and a floodlight wash of the
// wall itself; the uniforms uLit (panes) and uWall (wash) follow the night
export function tileMaterial(atlas, wash = [], reach = 40, key = 'tile') {
  const mat = new THREE.MeshStandardMaterial({ map: atlas.map, roughness: 0.88, emissive: 0xffffff, emissiveMap: atlas.emissive, emissiveIntensity: 1 });
  const n = Math.max(1, wash.length), pts = wash.length ? wash : [[0, -1e4, 0]];
  const u = { uLit: { value: 0 }, uWall: { value: 0 }, uFlood: { value: pts.map((p) => new THREE.Vector3(...p)) }, uReach: { value: reach } };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = 'varying vec3 vFlP;\nvarying vec3 vFlN;\n' + sh.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\n  vFlP = (modelMatrix * vec4(transformed, 1.0)).xyz;\n  vFlN = mat3(modelMatrix) * objectNormal;');
    sh.fragmentShader = `uniform float uLit;\nuniform float uWall;\nuniform vec3 uFlood[${n}];\nuniform float uReach;\nvarying vec3 vFlP;\nvarying vec3 vFlN;\n` + sh.fragmentShader.replace('#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
  {
    vec3 fN = normalize(vFlN) * (gl_FrontFacing ? 1.0 : -1.0);
    float wash = 0.0;
    for (int i = 0; i < ${n}; i++) { vec3 L = uFlood[i] - vFlP; float d = length(L); wash += max(dot(fN, L / d), 0.0) * clamp(1.35 - d / uReach, 0.0, 1.0); }
    totalEmissiveRadiance = totalEmissiveRadiance * vec3(1.0, 0.82, 0.55) * uLit + diffuseColor.rgb * vec3(1.0, 0.88, 0.7) * uWall * wash;
  }`);
  };
  mat.customProgramCacheKey = () => `oradea-${key}-tile-${n}`;
  return { mat, u };
}

// ------------------------------------------------------------------------------------------------ rings, reveals, small sculpture
import { face as faceOf } from '../../../cherkasy/slabkit.js';
import { area2 } from '../../../cherkasy/geo.js';

// outward unit normals (out of the material) of every edge of a ring of [x, z]; hole = a ring that bounds a hole
export function edgeNormals(pts, hole = false) {
  const sg = Math.sign(area2(pts)) || 1;
  return pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length], dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz) || 1;
    const s = hole ? -sg : sg;
    return [s * dz / L, -s * dx / L];
  });
}
// the face of the edge p -> q with the normal n, s running to the viewer's right; .rev = s runs against p -> q
export function edgeFace(p, q, n) {
  const dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz) || 1;
  const rev = !((dx / L) * n[1] - (dz / L) * n[0] > 0);
  return Object.assign(rev ? faceOf(q, p, n[0], n[1]) : faceOf(p, q, n[0], n[1]), { rev });
}
// a ring moved d into the material (miter joins); n = edgeNormals(pts, hole)
export function ringInset(pts, d, hole = false) {
  const N = edgeNormals(pts, hole), n = pts.length;
  return pts.map((p, i) => {
    const a = N[(i + n - 1) % n], b = N[i], k = 1 + a[0] * b[0] + a[1] * b[1];
    const m = d / Math.max(0.35, k);
    return [p[0] - (a[0] + b[0]) * m, p[1] - (a[1] + b[1]) * m];
  });
}
// true when no two edges of the ring cross
export function ringSimple(pts) {
  const n = pts.length, cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue;
    const a = pts[i], b = pts[(i + 1) % n], c = pts[j], d = pts[(j + 1) % n];
    if (cr(a, b, c) * cr(a, b, d) < 0 && cr(c, d, a) * cr(c, d, b) < 0) return false;
  }
  return true;
}
// Douglas-Peucker on a closed ring, then drops vertices closer than minEdge to the previous one
export function ringSimplify(pts, tol = 0.6, minEdge = 1.2) {
  const dp = (a, b, P) => {
    let worst = -1, wi = -1;
    const ax = P[a][0], az = P[a][1], dx = P[b][0] - ax, dz = P[b][1] - az, L = Math.hypot(dx, dz) || 1e-6;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((P[i][0] - ax) * dz - (P[i][1] - az) * dx) / L; if (d > worst) { worst = d; wi = i; } }
    return worst > tol ? [...dp(a, wi, P).slice(0, -1), ...dp(wi, b, P)] : [a, b];
  };
  // a closed ring: split at the vertex farthest from the first, simplify the two halves
  let m = 1, far = -1;
  pts.forEach((p, i) => { const d = Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]); if (d > far) { far = d; m = i; } });
  const P = [...pts, pts[0]], keep = [...dp(0, m, P).slice(0, -1), ...dp(m, P.length - 1, P).slice(0, -1)].map((i) => P[i]);
  return keep.filter((p, i) => Math.hypot(p[0] - keep[(i + keep.length - 1) % keep.length][0], p[1] - keep[(i + keep.length - 1) % keep.length][1]) >= minEdge);
}

// the inside of an opening: a strip joining the outline `ol` (from outline(), [a, b] about s / y0) at depth o0 and o1,
// facing the opening's middle
export function reveal(D, f, ol, s, y0, o0, o1) {
  const cx = ol.reduce((q, p) => q + p[0], 0) / ol.length, cy = ol.reduce((q, p) => q + p[1], 0) / ol.length;
  for (let i = 0; i < ol.length; i++) {
    const p = ol[i], q = ol[(i + 1) % ol.length], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    let dx = cx - mx, dy = cy - my; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
    const n = [f.U[0] * dx, dy, f.U[2] * dx];
    quad(D, at(f, s + p[0], y0 + p[1], o0), at(f, s + q[0], y0 + q[1], o0), at(f, s + q[0], y0 + q[1], o1), at(f, s + p[0], y0 + p[1], o1), n);
  }
}
// steps from the sill y to the ground g in front of the face f over s0..s1: a landing o 0..lan, then treads of 0.42 m
export function steps(D, f, s0, s1, y, g, gLo, lan = 0.7, tread = 0.42, col = null) {
  const n = Math.max(1, Math.min(14, Math.ceil((y - g) / 0.17))), h = (y - g) / n;
  if (col) D.setColor(col);
  box(D, f, s0, s1, gLo, y, 0, lan, 'ftlr', [1.2, 1.2]);
  for (let k = 1; k < n; k++) box(D, f, s0, s1, gLo, y - k * h, lan + (k - 1) * tread, lan + k * tread, 'ftlr', [1.2, 1.2]);
}
// a robed standing figure on an optional plinth: its base at (x, y, z), height h; `arm` raises the right arm
export function statue(D, x, y, z, h, col = '#e9e4d3', plinth = null, arm = true) {
  let b = y;
  if (plinth) { D.setColor(plinth.col ?? col); D.box(x - plinth.w / 2, y, z - plinth.w / 2, x + plinth.w / 2, y + plinth.h, z + plinth.w / 2, 63); b = y + plinth.h; }
  D.setColor(col);
  const k = h / 2.0;
  D.lathe([[0.34 * k, b], [0.3 * k, b + 0.5 * k], [0.24 * k, b + 1.1 * k], [0.26 * k, b + 1.25 * k]], 7, x, z);
  D.ellipsoid([x, b + 1.46 * k, z], [0.3 * k, 0.28 * k, 0.2 * k], 7, 4);
  D.ellipsoid([x, b + 1.83 * k, z], [0.13 * k, 0.17 * k, 0.13 * k], 6, 4);
  if (arm) D.tube([x + 0.26 * k, b + 1.5 * k, z], [x + 0.5 * k, b + 2.0 * k, z], 0.055 * k, 5);
}
// a heraldic eagle with spread wings, facing along +n (unit [nx, nz]), the tail at the base (x, y, z); width w
export function eagle3d(D, x, y, z, n, w, col = '#2c2a26') {
  D.setColor(col);
  const t = [-n[1], n[0]], P = (s, u, v) => [x + n[0] * u + t[0] * s, y + v, z + n[1] * u + t[1] * s];
  D.ellipsoid([x, y + 0.45 * w * 0.5, z], [0.1 * w, 0.28 * w, 0.1 * w], 8, 5);
  D.ellipsoid([x + n[0] * 0.04 * w, y + 0.78 * w * 0.5 + 0.18 * w, z + n[1] * 0.04 * w], [0.05 * w, 0.06 * w, 0.05 * w], 6, 4);
  for (const sd of [-1, 1]) {
    const pts = [P(0, 0, 0.3 * w), P(sd * 0.5 * w, -0.06 * w, 0.42 * w), P(sd * 0.5 * w, -0.1 * w, 0.58 * w), P(sd * 0.28 * w, 0.03 * w, 0.62 * w), P(0, 0.02 * w, 0.52 * w)];
    D.face(pts, [0, 1, 0]);
    D.face(pts.slice().reverse(), [0, -1, 0]);
  }
  D.face([P(-0.08 * w, -0.05 * w, 0.0), P(0.08 * w, -0.05 * w, 0.0), P(0.05 * w, -0.14 * w, 0.28 * w), P(-0.05 * w, -0.14 * w, 0.28 * w)], [0, 0, 1]);
}
