// Piața Unirii: the paving. One draped mesh over the whole pedestrian area whose fragment shader picks the surface from a
// splat map painted from polygons in the site frame: limestone slabs (the central field and the statue's plaza), porphyry
// fans (the lanes, the edges and the promenade south of the square), the red setts of the tram bed, lawn. The splat is
// 8 px / m, so the edges between surfaces are exact; the mesh itself is a 4 m grid (the terrain is smooth here).
//   LAYOUT     the polygons (local [e, s]) the splat is painted from (cobble, extra pavements, lime, lawn), and the tram track centre lines
//   buildPaving({ g, map, rng }) -> { geo (BufferGeometry), material, inside(e, s) -> bool, ponds: [local ring],
//                                      lawns: [local ring], tram: { A, B } }
// `inside` is true on any surface of the splat (the generated trees keep off it).
import * as THREE from 'three';
import { decal } from '../../../cherkasy/sculpt.js';
import { inPoly } from '../../../cherkasy/geo.js';
import { toMap, ring, E } from './frame.js';
import { limeTex, fanTex, settTex, grassTex } from './textures.js';

export const BOX = [-52, -62, 76, 142]; // e0, s0, e1, s1 of the splat
const K = 8, LIFT = 0.24, CELL = 4;

// everything the surfaces are painted from, in the site frame (e east, s south, origin at the statue)
export const LAYOUT = {
  // the pedestrian area: the square, the forecourt in front of Sf. Ladislau and the promenade south of it
  cobble: [[-26.6, -57], [72, -57], [72, 44], [67.5, 44], [67.5, 128], [27.5, 128], [27.5, 62], [23, 54], [14, 49.5], [-26.6, 47]],
  // the forecourt before the Episcopal Palace: the pavement between its front and the street, porphyry fans like the rest
  extra: [[[-49.4, 1.5], [-31.3, 1.5], [-31.3, 45], [-49.4, 45]]],
  // limestone: the plaza round the statue and the central field between the four fountains
  lime: [
    [[-11, -18.5], [-7, -19], [-6.5, -22], [-4, -25], [14.5, -25], [19, -22], [20, -18], [21, -17.5], [21, -36], [64, -36], [64, 36.5], [21, 36.5], [21, 13], [19, 13], [18, 17], [15, 19], [-3.5, 19], [-6.5, 16], [-7, 12], [-11, 11.5]],
  ],
  // lawns (the OSM grass the ground draws green): the north-west and south-west corners of the field, the north-east corner
  lawn: [
    [[24.5, -40.5], [12.4, -40.6], [12, -26.1], [15.1, -23.9], [16.5, -21.5], [17.1, -19.3], [20.6, -19.1], [21.5, -20.4], [24.3, -30.8]],
    [[23.3, 20], [22.5, 33.8], [8.3, 33.3], [8.3, 28.9], [11.1, 18.6], [12.6, 18.2], [14.8, 15.1], [15.2, 11.7], [20.6, 11.7]],
    [[72, -16], [64.6, -15.9], [64.5, -18.8], [59.8, -28.7], [59.8, -35.2], [59.7, -39.4], [72, -41]],
  ],
  // the tram tracks (OSM railway=tram, ways 999292689 / 999480946 / 432737383 cut to the square): north track A, south B
  tramA: [[-26.6, -45.5], [-23.1, -45.5], [25.5, -45.1], [48.5, -44.2], [52.7, -44.3], [56, -44.5], [58.7, -44.8], [63.4, -45.3], [67.9, -45.9], [72, -46.2]],
  tramB: [[-26.6, -49.85], [-23, -49.7], [25.7, -48.3], [36, -48], [42.9, -47.8], [52.2, -47.5], [55.9, -47.6], [58.7, -47.8], [62.7, -48.4], [66.9, -48.9], [72, -49.5]],
};

const bedPoly = () => { // the tram bed: both tracks plus 2.3 m, as one polygon
  const { tramA: A, tramB: B } = LAYOUT;
  return [...B.map(([e, s]) => [e, s - 2.3]), ...[...A].reverse().map(([e, s]) => [e, s + 2.3])];
};

function layerCanvas(polys, holes, W, H) {
  const cv = Object.assign(document.createElement('canvas'), { width: W, height: H }), c = cv.getContext('2d', { willReadFrequently: true });
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const path = (p) => { c.beginPath(); p.forEach(([e, s], i) => (i ? c.lineTo((e - BOX[0]) * K, (s - BOX[1]) * K) : c.moveTo((e - BOX[0]) * K, (s - BOX[1]) * K))); c.closePath(); };
  c.fillStyle = '#fff';
  for (const p of polys) { path(p); c.fill(); }
  c.fillStyle = '#000';
  for (const p of holes) { path(p); c.fill(); }
  return cv;
}
const grey = (cv) => { const c = cv.getContext('2d', { willReadFrequently: true }), d = c.getImageData?.(0, 0, cv.width, cv.height)?.data; return d && d.length ? d : null; };

export function buildPaving({ g, map, rng }) {
  const W = Math.ceil((BOX[2] - BOX[0]) * K), H = Math.ceil((BOX[3] - BOX[1]) * K);
  // the OSM fountain ponds inside the square cut a hole in every surface (the water plane lies under the paving otherwise)
  const ponds = [];
  for (const rings of map?.cover?.pond ?? []) {
    const p = ring(rings[0]), c = p.reduce((a, q) => [a[0] + q[0] / p.length, a[1] + q[1] / p.length], [0, 0]);
    if (c[0] > -26 && c[0] < 72 && c[1] > -45 && c[1] < 46) ponds.push(p);
  }
  const holes = ponds;
  const cobble = [LAYOUT.cobble, ...LAYOUT.extra], lime = LAYOUT.lime, lawn = LAYOUT.lawn, bed = [bedPoly()];

  // splat: R limestone, G fans, B lawn, A tram setts (priority lawn > tram > limestone > fans)
  const tex = (() => {
    const L = [cobble, lime, lawn, bed].map((polys) => grey(layerCanvas(polys, holes, W, H)));
    if (L.some((d) => !d)) return null; // headless: no pixel access
    const out = new Uint8Array(W * H * 4);
    for (let i = 0, n = W * H; i < n; i++) {
      const c = L[0][i * 4] / 255, l = L[1][i * 4] / 255, gr = L[2][i * 4] / 255, t = L[3][i * 4] / 255;
      const wl = gr, wt = t * (1 - wl), wm = l * (1 - wl) * (1 - wt), wc = Math.max(c, l, t, gr) * (1 - wl) * (1 - wt) * (1 - wm);
      out[i * 4] = wm * 255; out[i * 4 + 1] = wc * 255; out[i * 4 + 2] = wl * 255; out[i * 4 + 3] = wt * 255;
    }
    const d = new THREE.DataTexture(out, W, H, THREE.RGBAFormat);
    Object.assign(d, { flipY: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping, needsUpdate: true, colorSpace: THREE.NoColorSpace });
    return d;
  })();

  const maps = { lime: limeTex(rng), fan: fanTex(rng), sett: settTex(rng), grass: grassTex(rng) };
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.84, metalness: 0 });
  const U = {
    uSplat: { value: tex }, uLime: { value: maps.lime }, uFan: { value: maps.fan }, uSett: { value: maps.sett }, uGrass: { value: maps.grass },
    uBox: { value: new THREE.Vector4(BOX[0], BOX[1], 1 / (BOX[2] - BOX[0]), 1 / (BOX[3] - BOX[1])) },
    uO: { value: new THREE.Vector2(...toMap(0, 0)) }, uE: { value: new THREE.Vector2(E[0], E[1]) },
  };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'varying vec2 vLoc;\nuniform vec2 uO;\nuniform vec2 uE;\n' + sh.vertexShader.replace('#include <project_vertex>',
      `#include <project_vertex>
  { vec2 dd = (modelMatrix * vec4(transformed, 1.0)).xz - uO; vLoc = vec2(dot(dd, uE), dot(dd, vec2(-uE.y, uE.x))); }`);
    sh.fragmentShader = 'varying vec2 vLoc;\nuniform sampler2D uSplat;\nuniform sampler2D uLime;\nuniform sampler2D uFan;\nuniform sampler2D uSett;\nuniform sampler2D uGrass;\nuniform vec4 uBox;\n'
      + sh.fragmentShader.replace('#include <map_fragment>', `
  vec4 sp = texture2D(uSplat, (vLoc - uBox.xy) * uBox.zw);
  float tot = sp.r + sp.g + sp.b + sp.a;
  if (tot < 0.5) discard;
  vec3 pv = texture2D(uLime, vLoc / 12.0).rgb * sp.r + texture2D(uFan, vLoc / 3.2).rgb * sp.g
          + texture2D(uGrass, vLoc / 2.0).rgb * sp.b + texture2D(uSett, vLoc / 2.4).rgb * sp.a;
  float broad = 0.93 + 0.07 * sin(vLoc.x * 0.11 + 1.3) * sin(vLoc.y * 0.09 - 0.4);
  diffuseColor.rgb *= pv / tot * broad;`);
  };
  mat.customProgramCacheKey = () => 'unirii-pave';
  decal(mat, 2);

  // the draped grid
  const inside = (e, s) => (inPoly(LAYOUT.cobble, e, s) || LAYOUT.extra.some((q) => inPoly(q, e, s))) && !ponds.some((p) => inPoly(p, e, s));
  const ne = Math.ceil((BOX[2] - BOX[0]) / CELL), ns = Math.ceil((BOX[3] - BOX[1]) / CELL), pos = [], idx = [], at = new Map();
  const vid = (i, j) => {
    const k = j * (ne + 1) + i;
    if (!at.has(k)) { const [x, z] = toMap(BOX[0] + i * CELL, BOX[1] + j * CELL); at.set(k, pos.length / 3); pos.push(x, g(x, z) + LIFT, z); }
    return at.get(k);
  };
  for (let j = 0; j < ns; j++) for (let i = 0; i < ne; i++) {
    const e0 = BOX[0] + i * CELL, s0 = BOX[1] + j * CELL;
    const hit = [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5]].some(([a, b]) => inPoly(LAYOUT.cobble, e0 + a * CELL, s0 + b * CELL) || LAYOUT.extra.some((q) => inPoly(q, e0 + a * CELL, s0 + b * CELL)))
      || [[0, 0], [1, 0], [0, 1], [1, 1]].some(([a, b]) => inPoly(bedPoly(), e0 + a * CELL, s0 + b * CELL));
    if (!hit) continue;
    const a = vid(i, j), b = vid(i + 1, j), c = vid(i + 1, j + 1), d = vid(i, j + 1);
    idx.push(a, d, b, b, d, c); // up-facing (x to the east-ish, z to the south-ish)
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  geo.setIndex(idx);
  geo.computeBoundingBox(); geo.computeBoundingSphere();
  return { geo, material: mat, inside, ponds, lawns: lawn, tram: { A: LAYOUT.tramA, B: LAYOUT.tramB }, lift: LIFT };
}
