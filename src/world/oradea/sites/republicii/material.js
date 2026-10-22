// OWNER: oradea. Materials of the Calea Republicii site (not a site module).
//   Palette -> pal                       pal.idx(wallHex, trimHex) -> id (0..63);  pal.texture() -> the 64 x 2 sRGB lookup
//   facadeMaterial({ map, mask }, pal, { tiled? }) -> MeshStandardMaterial
//        the atlas colour times a palette: where the mask says wall the painted grey takes the building's wall colour, where
//        it says trim the trim colour, elsewhere (glass, frames, ironwork, flowers) the painted colour stays. Per vertex:
//        `part` = palette id, `color.r` = the night seed of the quad (lit if below LIT), `color.g` = a shade factor.
//        Lit windows glow with the city's night factor. tiled: the texture repeats (uv in tiles) and the seed comes from the tile.
//   roofTex(r), pavingTex(r, kind), backTex(r) -> textures made on canvases
import * as THREE from 'three';
import { patchMaterial, bindCityUniforms } from '../../../materials.js';
import { canvasTex } from '../../../cherkasy/sculpt.js';
import { hexLin } from '../../../../kit/mesh.js';

export class Palette {
  constructor() { this.list = []; }
  idx(wall, trim) {
    const k = `${wall}|${trim}`; let i = this.list.findIndex((p) => p.k === k);
    if (i < 0) { if (this.list.length >= 64) return 0; i = this.list.push({ k, wall, trim }) - 1; }
    return i;
  }
  texture() {
    const px = new Uint8Array(64 * 2 * 4), put = (row, i, hex) => { const n = parseInt(hex.replace('#', ''), 16); px.set([n >> 16 & 255, n >> 8 & 255, n & 255, 255], (row * 64 + i) * 4); };
    for (let i = 0; i < 64; i++) { const p = this.list[i] ?? { wall: '#d8d0c0', trim: '#f4f0e6' }; put(0, i, p.wall); put(1, i, p.trim); }
    const t = new THREE.DataTexture(px, 64, 2, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.needsUpdate = true;
    return t;
  }
}

const LIT = '0.42';
export function facadeMaterial({ map, mask }, pal, { tiled = false, key = 'republicii-facade' } = {}) {
  const palTex = pal.texture();
  const mat = new THREE.MeshStandardMaterial({ map, roughness: 0.86, metalness: 0, alphaTest: 0.5, side: THREE.DoubleSide });
  patchMaterial(mat, `${key}-${tiled ? 't' : 'a'}`, (s) => {
    bindCityUniforms(s);
    s.uniforms.maskMap = { value: mask }; s.uniforms.palMap = { value: palTex };
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float part;\nattribute vec3 color;\nflat varying float vPal;\nflat varying vec3 vSeed;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPal = part;\nvSeed = color;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform sampler2D maskMap;\nuniform sampler2D palMap;\nuniform float nightFactor;\nflat varying float vPal;\nflat varying vec3 vSeed;\nfloat rHash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }`)
      .replace('#include <map_fragment>', `
  vec4 rTex = texture2D(map, vMapUv);
  vec3 rMk = texture2D(maskMap, vMapUv).rgb;
  float rU = (vPal + 0.5) / 64.0;
  vec3 rWall = texture2D(palMap, vec2(rU, 0.25)).rgb, rTrim = texture2D(palMap, vec2(rU, 0.75)).rgb;
  float rLum = dot(rTex.rgb, vec3(0.3333)) * 1.26;
  vec3 rTint = (rWall * rMk.g + rTrim * rMk.b) * rLum;
  float rW = clamp(rMk.g + rMk.b, 0.0, 1.0);
  diffuseColor.rgb *= mix(rTex.rgb, rTint, rW) * vSeed.y;
  diffuseColor.a *= rTex.a;
  float rSeed = ${tiled ? 'rHash(floor(vMapUv))' : 'vSeed.x'};`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance += vec3(1.0, 0.7, 0.38) * rMk.r * step(rSeed, ${LIT}) * nightFactor * 1.7;`);
  });
  return mat;
}

// terracotta / slate tiles, 1 m a repeat; the vertex colour is the tile colour
export const roofTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#d6d6d6'; g.fillRect(0, 0, w, h);
  const rows = 10, cols = 7, th = h / rows, tw = w / cols;
  for (let j = 0; j < rows; j++) for (let i = -1; i < cols; i++) {
    const x = i * tw + (j & 1 ? tw / 2 : 0), y = j * th, v = 205 + r() * 50;
    g.fillStyle = `rgb(${v | 0},${(v - 6) | 0},${(v - 10) | 0})`; g.fillRect(x + 1, y + 1, tw - 2, th - 1);
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x + 1, y + th - 3, tw - 2, 2); g.fillRect(x + tw - 3, y + 1, 2, th - 2);
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 2, y + 2, tw - 6, 1);
  }
});

// granite setts, a lighter slab band: kind 'sett' (a 3.2 m repeat: running bond of 10 x 16 cm setts, a darker course every 0.8 m), 'slab' (flags)
export const pavingTex = (r, kind) => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = kind === 'sett' ? '#6b6e72' : '#9b9a96'; g.fillRect(0, 0, w, h);
  if (kind === 'sett') {
    const cols = 20, rows = 32, cw = w / cols, rh = h / rows;
    for (let j = 0; j < rows; j++) for (let i = -1; i < cols; i++) {
      const x = i * cw + (j & 1 ? cw / 2 : 0), v = 118 + r() * 44, band = (j % 8 === 0) ? -22 : 0;
      g.fillStyle = `rgb(${(v + band + 2) | 0},${(v + band + 4) | 0},${(v + band + 8) | 0})`; g.fillRect(x + 1.5, j * rh + 1.5, cw - 3, rh - 3);
    }
  } else {
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = 150 + r() * 26; g.fillStyle = `rgb(${v | 0},${(v - 2) | 0},${(v - 6) | 0})`; g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4); }
  }
  for (let i = 0; i < 4000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
});

// the plain back and side walls: a grey render with a window per tile (3.6 m x 4 m), painted as tint roles like the atlas
export function backAtlas(r) {
  const W = 256, H = 256, mk = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
  const d = mk(W, H), m = mk(W, H), g = d.getContext('2d'), k = m.getContext('2d');
  g.fillStyle = '#e6e6e6'; g.fillRect(0, 0, W, H); k.fillStyle = 'rgb(0,255,0)'; k.fillRect(0, 0, W, H);
  for (let i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(60,50,40,0.07)'; g.fillRect(r() * W, r() * H, 1 + r() * 3, 1 + r() * 3); }
  const wx = 82, wy = 70, ww = 92, wh = 120;
  g.fillStyle = '#f1efe9'; g.fillRect(wx - 10, wy - 10, ww + 20, wh + 20); k.fillStyle = 'rgb(0,0,255)'; k.fillRect(wx - 10, wy - 10, ww + 20, wh + 20);
  const gr = g.createLinearGradient?.(wx, wy, wx + ww, wy + wh);
  if (gr?.addColorStop) { gr.addColorStop(0, '#8fa3b4'); gr.addColorStop(0.5, '#3d4a58'); gr.addColorStop(1, '#232b34'); g.fillStyle = gr; } else g.fillStyle = '#334';
  g.fillRect(wx, wy, ww, wh); k.fillStyle = 'rgb(255,0,0)'; k.fillRect(wx, wy, ww, wh);
  g.fillStyle = '#e9e6dc'; g.fillRect(wx + ww / 2 - 2, wy, 4, wh); g.fillRect(wx, wy + wh * 0.3, ww, 3); k.fillStyle = 'rgb(0,0,0)'; k.fillRect(wx + ww / 2 - 2, wy, 4, wh); k.fillRect(wx, wy + wh * 0.3, ww, 3);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(wx - 12, wy + wh + 10, ww + 24, 5);
  const map = new THREE.CanvasTexture(d), mask = new THREE.CanvasTexture(m);
  map.colorSpace = THREE.SRGBColorSpace; mask.colorSpace = THREE.NoColorSpace;
  for (const t of [map, mask]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; }
  return { map, mask };
}
export { hexLin };
