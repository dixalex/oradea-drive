// OWNER: oradea. Piața Unirii, Oradea: the hand-built public buildings on the river side of the square –
//   Primăria Oradea (City Hall, 1902–1903, Kálmán Rimanóczy Jr.; OSM 6481078) with Turnul Primăriei (OSM 1207602388),
//   Biserica Romano-Catolică «Sfântul Ladislau» (OSM 264917565),
//   Palatul Vulturul Negru (Black Eagle Palace, 1907–1908, Komor and Jakab; OSM 19826329) with its stained-glass passage.
// The three are in ./primaria/ (hall.js with portico.js and tower.js, church.js, eagle.js; kit.js is the shared palette,
// textures and helpers, tiles.js the painted wall bays of the City Hall, frame.js its plan frame). They share one set of
// builders and materials, so the whole group is a dozen meshes; the wall shaders read one list of floodlights.
// Site contract of src/world/oradea/city.js: SITE { id, label, skip, ground, build(base) -> { update, clear, footprints } }.
import * as THREE from 'three';
import { rng, inPoly } from '../../cherkasy/geo.js';
import { canvasTex } from '../../cherkasy/sculpt.js';
import { nightK, getDaylight } from '../../../render/daylight.js';
import { newSet, makeMats, tileMaterial, finishSet, drawClock } from './primaria/kit.js';
import { bayAtlas } from './primaria/tiles.js';
import { buildChurch, CHURCH_ID } from './primaria/church.js';
import { buildHall, HALL_ID, TOWER_ID } from './primaria/hall.js';
import { buildEagle, VN_ID } from './primaria/eagle.js';
import { vnAtlas } from './primaria/vnpaint.js';

const SKIP = [CHURCH_ID, HALL_ID, TOWER_ID, VN_ID];

// the clocks of all three buildings in one 2 x 2 atlas (white Roman face, dark-blue and gold, dark and gold), redrawn each game minute
function makeClocks() {
  const KIND = [0, 1, 2, 0];
  const tex = canvasTex(1024, 1024, () => {}, { repeat: false });
  const g = tex.image.getContext('2d');
  let last = -1;
  const draw = (hours) => { g.clearRect(0, 0, 1024, 1024); KIND.forEach((k, i) => drawClock(g, (i % 2) * 512 + 16, (i >> 1) * 512 + 16, 480, k, hours)); tex.needsUpdate = true; };
  draw(10 + 10 / 60);
  return { tex, tick(hours) { const m = Math.floor(hours * 60); if (m !== last) { last = m; draw(hours); } } };
}

const near = (ring, x, z, m) => {
  if (inPoly(ring, x, z)) return true;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const ax = ring[j][0], az = ring[j][1], dx = ring[i][0] - ax, dz = ring[i][1] - az, L2 = dx * dx + dz * dz || 1;
    const f = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2));
    if (Math.hypot(x - ax - dx * f, z - az - dz * f) < m) return true;
  }
  return false;
};

export const SITE = {
  id: 'primaria',
  label: 'Piața Unirii: Primăria, Sf. Ladislau, Vulturul Negru',
  skip: SKIP,
  ground: true,
  build(base) {
    const { root, solids: S } = base, H = base.ground?.heightAt ?? base.heightAt;
    const t0 = performance.now(), n0 = S.count, r = rng(1903);
    const clocks = makeClocks();
    const B = newSet('vn'), wash = [];
    const footprints = [];
    for (const res of [buildChurch({ B, S, H, r, wash }), buildHall({ B, S, H, r, wash }), buildEagle({ B, S, H, r, wash })]) footprints.push(...res.footprints);
    const M = makeMats(r, { wallKey: 'primaria', wash, reach: 45 });
    const T = tileMaterial(bayAtlas(r), wash, 45, 'primaria');
    M.tile = T.mat;
    const T2 = tileMaterial(vnAtlas(), wash, 45, 'primaria-vn');
    M.vn = T2.mat;
    M.sign = new THREE.MeshStandardMaterial({ map: clocks.tex, alphaTest: 0.5, roughness: 0.4, metalness: 0.2, emissive: 0xffd9a0, emissiveMap: clocks.tex, emissiveIntensity: 0 });
    const out = finishSet(root, 'primaria', B, M, ['wall', 'stone', 'roof', 'clay', 'tile', 'vn', 'det']);
    console.log(`[oradea] Piața Unirii: ${(out.verts / 1000).toFixed(1)}k verts, ${out.meshes} meshes, ${S.count - n0} solids, ${wash.length} lights in ${(performance.now() - t0).toFixed(0)} ms`);
    const rings = footprints.map((f) => f.poly), cam = new THREE.Vector3();
    return {
      footprints,
      clear: (x, z) => rings.some((q) => near(q, x, z, 3)),
      update(dt, camera) {
        const k = nightK.value, e = Math.min(1, 3 * k);
        M.lit.emissiveIntensity = 0.95 * k; M.wall.emissiveIntensity = 0.34 * e; M.glow.emissiveIntensity = 0.05 + 2.4 * e;
        T.u.uLit.value = 0.95 * k; T.u.uWall.value = 0.34 * e; T2.u.uLit.value = 0.95 * k; T2.u.uWall.value = 0.34 * e;
        M.sign.emissiveIntensity = 0.5 * e;
        if (camera) { camera.getWorldPosition(cam); if (Math.hypot(cam.x, cam.z) < 450) { const d = getDaylight(); if (d) clocks.tick(d.state.hours); } }
      },
    };
  },
};
