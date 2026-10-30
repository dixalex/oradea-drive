// OWNER: oradea. The Lotus Center mall (Lotus Center, Oradea; OSM way 191186359, the shopping centre by the Nufărul roundabout road, a
// 2008 two-storey box of about 250 m by 110 m with a flat roof carrying photovoltaic panels). Built after the Google Street View
// panoramas of 2025 across its car park, as architecture only – no names, logos or signs:
//   a white-grey aluminium-panel parapet over a first floor of blue-grey curtain wall (a grid of glass between dark mullions over a
//   light spandrel), a ground floor of charcoal fascia and glazed shopfronts between white concrete columns every other bay, a flat roof
//   of pale membrane with a glass skylight. The ground floor is painted bays (./bays.js); each face has its own floor level (the plan
//   is 250 m long on sloping ground) and the parapet is cut to one roof height. The yard sides are the same bays (a guess).
//   buildLotus(ctx) -> { footprints, ring, clear(x, z), stats }      LOTUS_ROWS: the atlas strips (lg ground floor, l1 first floor)
import * as THREE from 'three';
import { M4 } from '../../../../kit/mesh.js';
import { ringFaces } from '../../../cherkasy/slabkit.js';
import { frame, roofRect } from './kit.js';
import { glassRect } from './bays.js';
import { bayWall } from './walls.js';
import { inside } from './rects.js';

export const LOTUS_ID = 191186359;
export const LOTUS_RING = [[2394.2, 1098.3], [2413.1, 1057.7], [2444.5, 1071.3], [2451.0, 1073.6], [2470.2, 1031.6], [2386.8, 992.4], [2390.2, 986.1], [2381.1, 980.8], [2388.3, 966.0], [2401.3, 972.3], [2403.4, 968.6], [2441.8, 891.1], [2516.3, 920.4], [2506.3, 941.8], [2591.7, 984.2], [2560.8, 1046.5], [2523.9, 1117.9], [2513.5, 1112.8], [2493.6, 1152.0], [2504.6, 1155.4], [2495.6, 1177.7], [2482.5, 1192.5], [2420.2, 1234.9], [2417.7, 1246.7], [2353.9, 1234.7], [2355.7, 1220.9], [2351.4, 1215.9], [2344.9, 1216.9], [2339.8, 1212.3], [2338.0, 1206.8], [2342.1, 1200.1], [2347.8, 1198.6], [2349.0, 1194.2], [2343.5, 1191.3], [2377.0, 1114.4], [2387.1, 1120.2], [2386.4, 1113.3]];
const COL = { wall: '#d8d6d0', plinth: '#8c8a86', roof: '#a9a8a2', parapet: '#dddbd6' };
const PL = 0.4, G = 5.0, S1 = 5.45, T1 = 10.0, H = 11.4;

const colEdge = (g, x, y, w, h, i) => { if (i % 2 === 0) { g.fillStyle = '#ecebe7'; g.fillRect(x, y, 9, h); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x + 9, y, 3, h); } };
function paintG(g, x, y, w, h, i, r) {
  g.fillStyle = '#c9c8c3'; g.fillRect(x, y, w, h);
  g.fillStyle = '#3c3e43'; g.fillRect(x, y, w, 30);                                              // the charcoal fascia
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x, y + 30, w, 2);
  const gx = x + 12, gw = w - 14, gy = y + 36, gh = h - 40;
  glassRect(g, gx, gy, gw, gh, '#9fb2bc', '#47545c');
  g.fillStyle = 'rgba(255,214,150,0.28)'; g.fillRect(gx, gy + gh * 0.45, gw, gh * 0.55);          // the lit shop behind the glass
  g.fillStyle = '#2f3237'; g.fillRect(gx - 2, gy, 4, gh); g.fillRect(gx + gw / 2 - 2, gy, 4, gh); g.fillRect(gx, gy + 2, gw, 4); g.fillRect(gx, gy + gh * 0.28, gw, 3);
  colEdge(g, x, y, w, h, i);
  return [[gx, gy + 8, gw, gh - 10]];
}
function paintU(g, x, y, w, h, i, r) {
  g.fillStyle = '#7f95a2'; g.fillRect(x, y, w, h);
  const sp = 34;                                                                                  // the light spandrel at the foot
  const gr = g.createLinearGradient(0, y, 0, y + h - sp); gr.addColorStop(0, '#a6bac5'); gr.addColorStop(1, '#4f6572');
  g.fillStyle = gr; g.fillRect(x, y, w, h - sp);
  g.fillStyle = '#cfcfcb'; g.fillRect(x, y + h - sp, w, sp);
  g.fillStyle = '#2d3238';
  for (let k = 0; k <= 4; k++) g.fillRect(x + k * w / 4 - (k === 4 ? 3 : 0), y, 3, h - sp);
  g.fillRect(x, y, w, 4); g.fillRect(x, y + (h - sp) / 3, w, 3); g.fillRect(x, y + 2 * (h - sp) / 3, w, 3); g.fillRect(x, y + h - sp - 2, w, 3);
  g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(x + 6, y + 6, w * 0.4, h - sp - 12);
  return [[x + 4, y + 6, w - 8, h - sp - 10]];
}
export const LOTUS_ROWS = [{ name: 'lg', h: G - PL, paint: paintG }, { name: 'l1', h: T1 - S1, paint: paintU }];

export function buildLotus(ctx) {
  const { B, S, g, bays } = ctx, P = LOTUS_RING, n = P.length, faces = ringFaces(P);
  // each face's floor: the median ground 2.5–6 m outside its middle (the DEM inside the plan carries the roof), roof height = the highest floor + H
  const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
  const lv = P.map((a, i) => { const b = P[(i + 1) % n], fc = faces[i], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2; return med([2.5, 4, 6].map((d) => g(mx + fc.nx * d, mz + fc.nz * d))); });
  // the plan runs over a slope of about 3 %, so the roof is one tilted plane fitted to the floors (weighted by face length): every face is H tall
  const wts = P.map((a, i) => { const b = P[(i + 1) % n]; return Math.hypot(b[0] - a[0], b[1] - a[1]); });
  const mids = P.map((a, i) => { const b = P[(i + 1) % n]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; });
  const cx0 = mids.reduce((s, m, i) => s + m[0] * wts[i], 0) / wts.reduce((s, w) => s + w, 0), cz0 = mids.reduce((s, m, i) => s + m[1] * wts[i], 0) / wts.reduce((s, w) => s + w, 0);
  let sxx = 0, sxz = 0, szz = 0, sxy = 0, szy = 0, sy = 0, sw = 0;
  mids.forEach(([x, z], i) => { const w = wts[i], dx = x - cx0, dz = z - cz0; sxx += w * dx * dx; sxz += w * dx * dz; szz += w * dz * dz; sxy += w * dx * lv[i]; szy += w * dz * lv[i]; sy += w * lv[i]; sw += w; });
  const det = sxx * szz - sxz * sxz, bx = det > 1e-6 ? (sxy * szz - szy * sxz) / det : 0, bz = det > 1e-6 ? (szy * sxx - sxy * sxz) / det : 0, a0 = sy / sw;
  const plane = (x, z) => a0 + bx * (x - cx0) + bz * (z - cz0), yTop = (x, z) => plane(x, z) + 0.12 + H;
  const stats = { bays: 0, slope: [bx, bz], yTopMax: Math.max(...P.map(([x, z]) => yTop(x, z))) };
  P.forEach((a, i) => {
    const b = P[(i + 1) % n], fc = faces[i], F = frame(a, b, [fc.nx, fc.nz]), yF = lv[i] + 0.12, top = Math.max(H - 1.5, yTop(mids[i][0], mids[i][1]) - yF);
    for (const bb of Object.values(B)) bb.setXf(M4(0, yF, 0));
    const lo = Math.min(...[0, 0.25, 0.5, 0.75, 1].map((t) => g(a[0] + (b[0] - a[0]) * t + fc.nx * 1.5, a[1] + (b[1] - a[1]) * t + fc.nz * 1.5)));
    const spec = { rows: [['lg', PL, G], ['l1', S1, T1]], gaps: [[G, S1], [T1, top]], wall: COL.wall, plinth: [PL, COL.plinth], trim: COL.parapet, strings: [[G - 0.12, S1 + 0.1, 0.2]], cornice: [top - 1.35, 1.35] };
    stats.bays += bayWall({ B, bays, gLow: Math.min(-0.3, lo - yF - 0.4) }, F, spec, false);
  });
  for (const bb of Object.values(B)) bb.setXf(null);
  // the roof: one pale deck on the tilted plane (a sheared copy of the flat fill) at the parapet's foot; a glass skylight on it
  B.deck.setColor(COL.roof);
  B.deck.setXf(new THREE.Matrix4().set(1, 0, 0, 0, bx, 1, bz, a0 - 1.3 + 0.12 + H - bx * cx0 - bz * cz0, 0, 0, 1, 0, 0, 0, 0, 1));
  B.deck.fill(P, [], 0, true); B.deck.setXf(null);
  const ux = Math.cos(0.43), uz = Math.sin(0.43);
  roofRect(B.glass, { cx: 2386, cz: 1127, ux, uz, hl: 14, hw: 7.5, yE: yTop(2386, 1127) - 1.3, rise: 1.6, col: '#98acb7', col2: '#8a9faa', gable: true, gcol: '#9fb0b9', ov: 0.1 });
  S.prism(P.flat(), Math.min(...lv) - 1.0, stats.yTopMax, 0, 0, 'wall', 0);
  return { footprints: [{ poly: P, h: H, kind: 'mall', name: 'Lotus Center', id: LOTUS_ID }], ring: P, stats, clear: (x, z) => inside(P, x, z) };
}
