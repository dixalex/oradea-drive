// Piața Unirii: the material set of the whole site (one mesh per material, all under the group landmark-unirii).
//   COL                 the palette (sRGB hex; the vertex colour tints the near-white textures)
//   newSet()            { plaster, stone, det, roof, slate, copper, glass, lit, glow, sign, water }  one MeshBuilder each
//   makeMats(r, wash, atlas) -> the matching materials; `wash` is the list of floodlight points (map metres) the plaster and
//                       the stone are washed from at night, `atlas` the signAtlas() of textures.js
//   finishSet(group, B, M, shade) -> { verts, tris, meshes }   builders -> meshes under `group` (empty ones skipped)
import * as THREE from 'three';
import { MB } from '../../../../kit/mesh.js';
import { floodlit } from '../../../cherkasy/bohdan.js';
import { renderTex, stoneTex, paneTex, seamTex, slateTex } from './textures.js';

export const COL = {
  ochre: '#dcc79a', cream: '#efe6cf', white: '#f4f0e4', ivory: '#ece4cd', plinth: '#b9887e', plinthD: '#8a5049',
  marble: '#a2564a', iron: '#2b2d30', dark: '#2a2c2e', glassTint: '#7e8e98', gold: '#d3a949', brown: '#5a2e22',
  slate: '#4a5058', sheet: '#5b5e63', copper: '#7a5a42', verdi: '#5f8f7a', coral: '#dc7556', peach: '#f0d6a3',
  yellow: '#e4c872', darkOchre: '#d79a35',
};

export const newSet = () => Object.fromEntries(['plaster', 'stone', 'det', 'roof', 'slate', 'copper', 'glass', 'lit', 'glow', 'sign', 'water'].map((k) => [k, new MB()]));

export function makeMats(r, wash, atlas) {
  const warm = new THREE.Color('#ffd7a0'), pane = paneTex(false), mask = paneTex(true), rmap = renderTex(r), smap = stoneTex(r);
  const plaster = new THREE.MeshStandardMaterial({ map: rmap, vertexColors: true, roughness: 0.9, emissive: 0xffdca8, emissiveMap: rmap, emissiveIntensity: 0 });
  const stone = new THREE.MeshStandardMaterial({ map: smap, vertexColors: true, roughness: 0.62, metalness: 0.04, emissive: 0xffdca8, emissiveMap: smap, emissiveIntensity: 0 });
  if (wash.length) { floodlit(plaster, wash, 46, 'unirii-p'); floodlit(stone, wash, 46, 'unirii-s'); }
  return {
    plaster, stone,
    det: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.25 }),
    roof: new THREE.MeshStandardMaterial({ map: seamTex(r), vertexColors: true, roughness: 0.45, metalness: 0.4 }),
    slate: new THREE.MeshStandardMaterial({ map: slateTex(r), vertexColors: true, roughness: 0.62, metalness: 0.08 }),
    copper: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.62 }),
    glass: new THREE.MeshStandardMaterial({ map: pane, vertexColors: true, roughness: 0.1, metalness: 0.45, envMapIntensity: 1.2 }),
    lit: new THREE.MeshStandardMaterial({ map: pane, vertexColors: true, roughness: 0.12, metalness: 0.35, emissive: warm, emissiveMap: mask, emissiveIntensity: 0 }),
    glow: new THREE.MeshStandardMaterial({ color: 0xf6f0e2, roughness: 0.3, emissive: 0xffe2b0, emissiveIntensity: 0.05 }),
    sign: new THREE.MeshStandardMaterial({ map: atlas.tex, alphaTest: 0.5, roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide }),
    water: new THREE.MeshStandardMaterial({ color: 0x6f95a8, roughness: 0.05, metalness: 0.15, transparent: true, opacity: 0.82 }),
  };
}

export function finishSet(group, B, M, shade = ['plaster', 'stone', 'det', 'roof', 'slate', 'copper']) {
  const out = { verts: 0, tris: 0, meshes: 0 };
  for (const [k, D] of Object.entries(B)) {
    if (!D.v || !M[k]) continue;
    const geo = D.build();
    out.verts += D.v; out.tris += geo.index.count / 3; out.meshes++;
    group.add(Object.assign(new THREE.Mesh(geo, M[k]), { name: `unirii-${k}`, castShadow: shade.includes(k), receiveShadow: k !== 'water' }));
  }
  return out;
}
