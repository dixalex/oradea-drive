// OWNER: oradea. Oradea's universities (the generic OSM boxes replaced):
//   Universitatea din Oradea, Str. Universității 1 (the main campus, the former gendarmerie school of the Vágó brothers: pastel render
//     over grey stone, orange tile roofs; Corpul A the rectorate with its round stair tower and stone porch), and Campus B;
//   Facultatea de Medicină și Farmacie (the former Chamber of Commerce, Piața 1 Decembrie 10), Partium (Str. Primăriei 27 and 36),
//     Facultatea de Drept (Magheru 26), Universitatea Agora (Piața Tineretului 8), Universitatea Emanuel (Str. Nufărului 87).
// Sources: the universities' and Wikimedia Commons photographs, the Esri World Imagery aerial and OSM. Site contract of
// src/world/oradea/city.js.
//   Three root groups (university-campus, university-town, university-emanuel), each with three meshes (facade walls on the shared
//   facade material, details on the shared detail material, a draped ground mesh): nine draw calls for the whole site.
import * as THREE from 'three';
import { canvasTex, decal } from '../../cherkasy/sculpt.js';
import { t } from '../../../i18n.js';
import { buildingIndex, makeGroup } from './university/group.js';
import { makeKit } from './university/block.js';
import { buildCampus } from './university/campus.js';
import { buildCentre, buildLaw, buildAgora } from './university/town.js';
import { buildEmanuel } from './university/emanuel.js';
import { CAMPUS, TOWN, IDS } from './university/data.js';

const guard = (label, fn) => { try { return fn(); } catch (e) { console.error(`[oradea] university ${label} failed`, e); return null; } };

// the ground patches share one grain texture; the colour comes from the vertices
const grainTex = (r) => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#d9d9d9'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { const k = r(); g.fillStyle = k < 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(40,40,40,0.14)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
});

export const SITE = {
  id: 'university',
  label: 'Universitățile: Oradea, Partium, Medicină, Emanuel, Agora',
  skip: [...CAMPUS.map((s) => s.id), ...TOWN.map((s) => s.id), IDS.MED2, IDS.PARTIUM, IDS.ARANY, IDS.EMANUEL],
  places: [], // the sights and improved objects live in places.js (the phone map loads no site)
  ground: true,
  build(base) {
    const t0 = performance.now(), n0 = base.solids.count;
    const index = buildingIndex(base.map);
    let seed = 11;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const groundMat = decal(new THREE.MeshStandardMaterial({ map: grainTex(rnd), vertexColors: true, roughness: 0.93 }), 1);
    const parts = [];

    const campus = guard('campus', () => {
      const ctx = makeGroup('university-campus', base, groundMat, index, 3);
      const kit = makeKit(ctx);
      const out = buildCampus(ctx, kit);
      return { ctx, out };
    });
    if (campus) parts.push(campus);

    const more = [['university-centre', buildCentre, 5], ['university-law', buildLaw, 6], ['university-agora', buildAgora, 8], ['university-emanuel', buildEmanuel, 9]];
    for (const [name, fn, sd] of more) {
      const part = guard(name, () => {
        const ctx = makeGroup(name, base, groundMat, index, sd);
        return { ctx, out: fn(ctx, makeKit(ctx)) };
      });
      if (part) parts.push(part);
    }

    const done = parts.map((p) => ({ ...p, fin: p.ctx.finish() }));
    const verts = done.reduce((n, p) => n + p.fin.verts, 0), meshes = done.reduce((n, p) => n + p.fin.meshes, 0);
    console.log(`[oradea] university: ${(verts / 1000).toFixed(1)}k verts, ${meshes} meshes, ${base.solids.count - n0} solids, ${Math.round(performance.now() - t0)} ms`);
    return {
      footprints: done.flatMap((p) => p.ctx.foot),
      spots: done.flatMap((p) => p.ctx.spots),
      clear: (x, z) => done.some((p) => p.out?.clear?.(x, z)),
      stats: Object.fromEntries(done.map((p) => [p.ctx.name, { verts: p.fin.verts, meshes: p.fin.meshes }])),
    };
  },
};
