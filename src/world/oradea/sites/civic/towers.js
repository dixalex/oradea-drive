// OWNER: oradea. The four water towers of Oradea that OSM has as points (map.json pois, man_made=water_tower; the generic city draws
// nothing for a point, and the one way, w544713643, a 5 m "industrial building" circle, as a box): concrete shafts under round tanks.
//   Tower 2 (Calea Aradului side, Street View of the shaft, the Bing aerial's 27 m roof circle): a ribbed octagonal grey concrete shaft,
//   34 m, under a mushroom tank 24 m across (a flared underside, a drum, a shallow conical roof). The other three are seen only from above:
//   a plainer 24–26 m shaft of the same concrete with a steel tank (a drum under a cone) about 12 m across (a guess).
//   buildTowers(ctx) -> { footprints, clear(x, z), stats, skip: [OSM ids] }     one merged builder (the det mesh), solids per tower
import { cap } from './kit.js';

export const TOWER_WAY = 544713643;
const CONC = '#cfcdc5', CONC_D = '#b7b4ab', STEEL = '#8e9ba1', ROOF = '#7e8b92', DARK = '#3b3a38';
// x, z of the OSM point, shaft radius, shaft height, tank radius, tank wall height, mushroom flare
export const TOWER_SPEC = [
  { id: 'n12568621808', x: -1617.8, z: -50.2, R: 2.9, H: 26, T: 6.4, TH: 5.8, mush: false },
  { id: 'w544713643', x: -1257.6, z: -1567.1, R: 3.9, H: 34, T: 12.0, TH: 6.6, mush: true },
  { id: 'n7814325481', x: -4819.6, z: -1539.1, R: 2.8, H: 24, T: 6.0, TH: 5.5, mush: false },
  { id: 'n11649363230', x: -4955.6, z: -1216.2, R: 2.8, H: 25, T: 6.2, TH: 5.5, mush: false },
];
export const towerRing = (sp) => Array.from({ length: 10 }, (_, k) => [sp.x + Math.cos(k / 10 * Math.PI * 2) * sp.R * 1.5, sp.z + Math.sin(k / 10 * Math.PI * 2) * sp.R * 1.5]);

export function buildTowers(ctx) {
  const { B, S, g } = ctx, D = B.det, stats = { towers: 0, verts: 0 }, foot = [], at = [];
  const v0 = D.v;
  for (const sp of TOWER_SPEC) {
    const x = sp.x, z = sp.z, y0 = g(x, z) - 0.4;
    // the shaft: an octagonal frustum with a thin collar at the foot, rings every 8 m, a door
    D.setColor(CONC); D.cyl(x, y0, z, sp.R * 1.08, sp.R, sp.H, 8, false);
    D.setColor(CONC_D); D.cyl(x, y0, z, sp.R * 1.22, sp.R * 1.22, 1.0, 8, true);
    for (let h = 8; h < sp.H - 2; h += 8) { D.setColor(CONC_D); D.cyl(x, y0 + h, z, sp.R * 1.04, sp.R * 1.04, 0.35, 8, true); }
    D.setColor(DARK); D.box(x + sp.R * 0.8, y0 + 0.9, z - 0.6, x + sp.R * 1.14, y0 + 3.0, z + 0.6);
    if (sp.mush) {
      // ribs: eight vertical pilaster strips down the shaft
      for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2; D.setColor(CONC_D); D.box(x + Math.cos(a) * sp.R * 1.0 - 0.18, y0 + 1.0, z + Math.sin(a) * sp.R * 1.0 - 0.18, x + Math.cos(a) * sp.R * 1.0 + 0.18, y0 + sp.H, z + Math.sin(a) * sp.R * 1.0 + 0.18); }
      const T = sp.T, yb = y0 + sp.H;
      D.setColor(CONC); D.lathe([[sp.R * 1.05, yb], [sp.R * 1.8, yb + 1.2], [T * 0.55, yb + 2.8], [T * 0.85, yb + 4.2], [T, yb + 5.0]], 24, x, z);
      D.setColor('#d8d6cf'); D.cyl(x, yb + 5.0, z, T, T, sp.TH, 24, false);
      D.setColor(CONC_D); D.cyl(x, yb + 5.0 + sp.TH - 0.4, z, T + 0.25, T + 0.25, 0.5, 24, true);
      B.roof.setColor(ROOF); cap(B.roof, x, z, [[T + 0.3, yb + 5.0 + sp.TH], [T * 0.6, yb + 5.0 + sp.TH + 1.6], [T * 0.25, yb + 5.0 + sp.TH + 2.4], [0.4, yb + 5.0 + sp.TH + 2.8]], 24, ROOF);
      D.setColor(DARK); D.cyl(x, yb + 5.0 + sp.TH + 2.7, z, 0.12, 0.08, 1.8, 6, true);
      S.cyl(x, z, y0, yb, sp.R * 1.1, sp.R, 'wall', 0);
      S.cyl(x, z, yb, yb + 5.0 + sp.TH + 2.8, T, T, 'watertower', 0);
      stats.top = yb + 5.0 + sp.TH + 2.8;
    } else {
      const T = sp.T, yb = y0 + sp.H;
      D.setColor(STEEL); D.lathe([[sp.R * 1.1, yb], [T * 0.7, yb + 0.9], [T, yb + 1.5]], 20, x, z);
      D.setColor('#9aa7ad'); D.cyl(x, yb + 1.5, z, T, T, sp.TH, 20, false);
      D.setColor(DARK); D.cyl(x, yb + 1.5 + sp.TH * 0.55, z, T + 0.06, T + 0.06, 0.25, 20, false);
      B.roof.setColor(ROOF); cap(B.roof, x, z, [[T + 0.2, yb + 1.5 + sp.TH], [T * 0.5, yb + 1.5 + sp.TH + 1.8], [0.3, yb + 1.5 + sp.TH + 3.0]], 20, ROOF);
      S.cyl(x, z, y0, yb, sp.R * 1.1, sp.R, 'wall', 0);
      S.cyl(x, z, yb, yb + 1.5 + sp.TH + 3.0, T, T, 'watertower', 0);
    }
    at.push([x, z, sp.T + 3]);
    foot.push({ poly: towerRing(sp), h: sp.H + sp.TH + 4, kind: 'tower', name: 'Castel de apă', id: parseInt(sp.id.slice(1), 10) });
    stats.towers++;
  }
  stats.verts = D.v - v0;
  return { footprints: foot, stats, clear: (x, z) => at.some(([a, c, r]) => Math.hypot(a - x, c - z) < r), skip: [TOWER_WAY] };
}
