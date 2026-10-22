// Real shop signs (map.json `signs`, tools/oradea/signs.mjs): a board over the shopfront with the business's name in plain
// lettering, drawn only near the camera. A pool of SLOTS boards (two InstancedMeshes: the lettered face and its backing)
// takes the nearest signs every 0.4 s; a slot's name is painted into its cell of one canvas atlas when it changes hands.
// The faces glow after dusk (nightK). A sign on a building a hand-built site replaces is dropped. A board sits on the
// facade's own sign band, so it covers the generic shop names: world/buildings.js counts the storefront floor from the
// building's mean ground + 0.15, max(3.6, plinth + storey) tall by its look (SHOP_H; apartment blocks vary 3.6-4.25 with
// the era, the middle is taken), and ends the band 0.2 m under its top.
//   buildShopSigns({ root, map, heightAt, skip }) -> { update(dt, camera), stats } | null (no signs in the map)
import * as THREE from 'three';
import { nightK } from '../../render/daylight.js';

const SLOTS = 128, COLS = 4, CW = 256, CH = 48, REACH = 260, H = 0.78;
const SHOP_H = { old: 4.9, mall: 5.5, market: 5.0, hall: 8.4, public: 4.1, apt: 3.9, indus: 5.8, church: 5.8 };
const BG = { food: '#7a1f1f', shop: '#1d3557', bank: '#1e4d3a', health: '#0f6e3f', office: '#2e2f33' };

export function buildShopSigns({ root, map, heightAt, skip = new Set() }) {
  const all = (map.signs ?? []).filter((s) => !skip.has(s.b));
  if (!all.length) return null;
  const blds = new Map((map.buildings ?? []).map((b) => [b.id, b]));
  const bandY = (s) => { // the band's centre: as buildings.js lays the storefront floor
    const b = blds.get(s.b);
    if (!b?.p) return heightAt(s.x + Math.sin(s.a) * 1.5, s.z + Math.cos(s.a) * 1.5) + 3.0;
    let sum = 0, n = 0;
    for (let i = 0; i < b.p.length; i += 2) { sum += heightAt(b.p[i], b.p[i + 1]); n++; }
    const shopH = Math.max(3.6, (b.old && (b.k === 'apt' || b.k === 'public') ? SHOP_H.old : SHOP_H[b.k === 'public' && SHOP_H[b.u] ? b.u : b.k]) ?? 0);
    return sum / n + 0.15 + shopH - 0.575;
  };
  for (const s of all) { s.nx = Math.sin(s.a); s.nz = Math.cos(s.a); s.y = bandY(s); s.slot = -1; }

  const canvas = document.createElement('canvas'); canvas.width = CW * COLS; canvas.height = CH * Math.ceil(SLOTS / COLS);
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const cell = new THREE.Vector2(CW / canvas.width, CH / canvas.height);

  const face = new THREE.PlaneGeometry(1, 1);
  const aCell = new THREE.InstancedBufferAttribute(new Float32Array(SLOTS * 2), 2); face.setAttribute('aCell', aCell);
  const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.6 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uCell = { value: cell };
    sh.vertexShader = 'attribute vec2 aCell;\nuniform vec2 uCell;\n' + sh.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>
      #ifdef USE_MAP
        vMapUv = vMapUv * uCell + aCell;
      #endif
      #ifdef USE_EMISSIVEMAP
        vEmissiveMapUv = vEmissiveMapUv * uCell + aCell;
      #endif`);
  };
  const faces = new THREE.InstancedMesh(face, mat, SLOTS), backs = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.5, metalness: 0.3 }), SLOTS);
  faces.name = 'shop-sign-faces'; backs.name = 'shop-sign-boards';
  // a city-wide pool: never frustum-culled, and its bounds span the city so the far cull and the site proxies leave it alone
  for (const m of [faces, backs]) {
    m.frustumCulled = false; m.castShadow = false; m.receiveShadow = true; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  }
  root.add(Object.assign(new THREE.Group(), { name: 'shop-signs' }).add(backs, faces));
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < SLOTS; i++) { faces.setMatrixAt(i, zero); backs.setMatrixAt(i, zero); }

  const paint = (i, s) => { // the name in the slot's cell, pre-squeezed so it reads right stretched over a w x H board
    const x0 = (i % COLS) * CW, y0 = Math.floor(i / COLS) * CH, squeeze = (CW / CH) / (s.w / H);
    ctx.save(); ctx.fillStyle = BG[s.k] ?? BG.shop; ctx.fillRect(x0, y0, CW, CH);
    ctx.beginPath(); ctx.rect(x0, y0, CW, CH); ctx.clip();
    let px = 30; ctx.font = `bold ${px}px "Helvetica Neue", Arial, sans-serif`;
    const room = (CW - 16) / squeeze, tw = ctx.measureText(s.n).width;
    if (tw > room) { px = Math.max(12, Math.floor(px * room / tw)); ctx.font = `bold ${px}px "Helvetica Neue", Arial, sans-serif`; }
    ctx.translate(x0 + CW / 2, y0 + CH / 2 + 1); ctx.scale(squeeze, 1);
    ctx.fillStyle = '#f6f1e3'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.n, 0, 0);
    ctx.restore();
  };
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  const place = (i, s) => {
    Q.setFromAxisAngle(UP, s.a);
    faces.setMatrixAt(i, M.compose(P.set(s.x + s.nx * 0.13, s.y, s.z + s.nz * 0.13), Q, S.set(s.w, H, 1)));
    backs.setMatrixAt(i, M.compose(P.set(s.x + s.nx * 0.06, s.y, s.z + s.nz * 0.06), Q, S.set(s.w + 0.12, H + 0.12, 0.12)));
    aCell.setXY(i, (i % COLS) * cell.x, 1 - (Math.floor(i / COLS) + 1) * cell.y);
  };

  const slots = new Array(SLOTS).fill(null), stats = { signs: all.length, shown: 0, painted: 0 };
  let wait = 0, lastK = -1;
  return {
    stats,
    update(dt, camera) {
      const k = Math.min(1, nightK.value * 2.5);
      if (Math.abs(k - lastK) > 0.01) { mat.emissiveIntensity = 0.85 * k; lastK = k; }
      if ((wait -= dt) > 0 || !camera) return;
      wait = 0.4;
      const cx = camera.position.x, cz = camera.position.z;
      const near = all.filter((s) => Math.abs(s.x - cx) < REACH && Math.abs(s.z - cz) < REACH).map((s) => [s, (s.x - cx) ** 2 + (s.z - cz) ** 2])
        .filter(([, d]) => d < REACH * REACH).sort((a, b) => a[1] - b[1]).slice(0, SLOTS).map(([s]) => s);
      const keep = new Set(near);
      let dirty = false, moved = false;
      for (let i = 0; i < SLOTS; i++) if (slots[i] && !keep.has(slots[i])) { slots[i].slot = -1; slots[i] = null; faces.setMatrixAt(i, zero); backs.setMatrixAt(i, zero); moved = true; }
      for (const s of near) {
        if (s.slot >= 0) continue;
        const i = slots.indexOf(null); if (i < 0) break;
        slots[i] = s; s.slot = i; paint(i, s); place(i, s); dirty = moved = true; stats.painted++;
      }
      if (dirty) tex.needsUpdate = true;
      if (moved) { faces.instanceMatrix.needsUpdate = backs.instanceMatrix.needsUpdate = true; aCell.needsUpdate = true; }
      stats.shown = near.length;
    },
  };
}
