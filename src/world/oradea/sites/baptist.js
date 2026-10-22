// OWNER: oradea. Oradea's Baptist churches, as they look today (the generic OSM boxes replaced):
//   Biserica Baptistă «Emanuel» (Bulevardul Decebal; OSM relation 3530253): the 2,700-seat megachurch of 1986–1993, a pale-grey
//     rainscreen drum with ribbon windows, oculi and glazed entrance bays, its lattice-cross stair tower, the office crescent, the
//     school bar and the paved forecourt – ./baptist/emanuel.js;
//   Campusul BBSO (Biserica Baptistă «Speranța» Oradea, Strada Thurzó Sándor 19; OSM way 1264556370 stands where it is): the
//     campus opened on 6 October 2024 (Todor Studio, 7,130 m²), a graphite-zinc volume wrapped in white perforated ribbons over a
//     glazed ground floor, its concrete entrance block and the lit BBSO lettering – ./baptist/bbso.js;
//   six smaller Baptist churches built from their OSM outlines and the aerial – ./baptist/chapels.js: Providența (a round church),
//     Rogériusz, the Hungarian Baptist convention's chapel, the Biserica Baptistă on the Rogerius side (a hall with a tiled skirt),
//     the octagonal red-roofed Biserica Baptistă in the north and the Betlehem Hungarian Baptist house church.
// Sources: the churches' own photographs (myoradea.ro, bbso.ro, awards.share-architects.com), Wikipedia (Emanuel Baptist Church of
// Oradea), the Esri World Imagery aerial and OSM. Site contract of src/world/oradea/city.js.
//   SITE { id, label, skip, places, shape(hf, map), ground: true, build(base) -> { update, clear, footprints, spots, stats } }
//   One root group per church (landmark-emanuel, landmark-bbso, baptist-<slug>), each with its own meshes, so far churches are
//   frustum-culled and the proxy swap leaves the two big ones alone.
import * as THREE from 'three';
import { MB } from '../../../kit/mesh.js';
import { nightK } from '../../../render/daylight.js';
import { finish } from '../../cherkasy/slabkit.js';
import { rng, hull } from '../../cherkasy/geo.js';
import { decal } from '../../cherkasy/sculpt.js';
import { barTex } from '../../cherkasy/bridgekit.js';
import { panelTex, gravelTex, lawnTex, payTex, zincTex, perfTex, boardTex, slabTex, signTex, plasterTex, tileTex } from './baptist/kit.js';
import { buildEmanuel, EMANUEL_ID, EMANUEL_RINGS } from './baptist/emanuel.js';
import { buildBbso, BBSO_ID, BBSO_LOT } from './baptist/bbso.js';
import { buildChapel, CHAPELS, CHAPEL_SKIP } from './baptist/chapels.js';

const guard = (label, fn) => { try { return fn(); } catch (e) { console.error(`[oradea] baptist ${label} failed`, e); return null; } };

export const SITE = {
  id: 'baptist',
  label: 'Bisericile baptiste: Emanuel, BBSO și altele',
  skip: [EMANUEL_ID, BBSO_ID, ...CHAPEL_SKIP],
  places: [], // Emanuel and BBSO are sights in places.js
  shape(hf, map) {
    const ring = hull(EMANUEL_RINGS.flat().concat([[-862, 336], [-874, 374], [-906, 372], [-897, 273]]));
    hf.pad(ring, 14);
    hf.pad(hull(BBSO_LOT), 8);
  },
  ground: true,
  build(base) {
    const { root, solids: S } = base, gnd = base.ground?.heightAt ?? base.heightAt;
    const g = (x, z) => { const h = gnd(x, z); return Number.isFinite(h) ? h : 2; };
    const t0 = performance.now(), n0 = S.count, r = rng(1993);
    const parts = [];
    const lamps = [];

    // ---- Emanuel
    {
      const B = Object.fromEntries(['wall', 'roof', 'glass', 'lit', 'det', 'glow', 'rail', 'pave', 'lawn'].map((k) => [k, new MB()]));
      const res = guard('Emanuel', () => buildEmanuel({ B, S, g, r, lampsOut: lamps }));
      if (res) {
        const wTex = panelTex(r);
        const M = {
          wall: new THREE.MeshStandardMaterial({ map: wTex, vertexColors: true, roughness: 0.78, emissive: 0xffe2b8, emissiveMap: wTex, emissiveIntensity: 0 }),
          roof: new THREE.MeshStandardMaterial({ map: gravelTex(r), vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }),
          glass: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 0.25 }),
          lit: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.14, metalness: 0.35, emissive: 0xffd9a0, emissiveIntensity: 0 }),
          det: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.2 }),
          glow: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, emissive: 0xfff0d0, emissiveIntensity: 0 }),
          rail: new THREE.MeshStandardMaterial({ vertexColors: true, alphaMap: barTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.3 }),
          pave: decal(new THREE.MeshStandardMaterial({ map: payTex(r), vertexColors: true, roughness: 0.88 }), 2),
          lawn: decal(new THREE.MeshStandardMaterial({ map: lawnTex(r), vertexColors: true, roughness: 0.96 }), 1),
        };
        const out = finish(root, 'landmark-emanuel', B, M, { shade: ['wall', 'roof', 'det'] });
        parts.push({ name: 'emanuel', res, M, out, kind: 'emanuel' });
      }
    }

    // ---- BBSO
    {
      const B = Object.fromEntries(['zinc', 'fin', 'conc', 'glass', 'lit', 'det', 'roof', 'pave', 'sign', 'engr'].map((k) => [k, new MB()]));
      const res = guard('BBSO', () => buildBbso({ B, S, g, r, lampsOut: lamps }));
      if (res) {
        const sTex = signTex('BBSO', { font: 'bold 200px Helvetica, Arial, sans-serif' }), pTex = perfTex();
        const M = {
          zinc: new THREE.MeshStandardMaterial({ map: zincTex(r), vertexColors: true, roughness: 0.5, metalness: 0.3 }),
          fin: new THREE.MeshStandardMaterial({ map: pTex, vertexColors: true, side: THREE.DoubleSide, roughness: 0.55, emissive: 0xf4f6ff, emissiveMap: pTex, emissiveIntensity: 0 }),
          conc: new THREE.MeshStandardMaterial({ map: boardTex(r), vertexColors: true, roughness: 0.9 }),
          glass: new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.4, depthWrite: false, roughness: 0.06, metalness: 0.5 }),
          lit: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, emissive: 0xffd9a0, emissiveIntensity: 0 }),
          det: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.2 }),
          roof: new THREE.MeshStandardMaterial({ map: gravelTex(r), vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }),
          pave: decal(new THREE.MeshStandardMaterial({ map: slabTex(r), vertexColors: true, roughness: 0.85 }), 2),
          sign: new THREE.MeshStandardMaterial({ map: sTex, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5, emissive: 0xffffff, emissiveMap: sTex, emissiveIntensity: 0 }),
          engr: new THREE.MeshStandardMaterial({ map: sTex, vertexColors: true, alphaTest: 0.5, roughness: 0.9 }),
        };
        const out = finish(root, 'landmark-bbso', B, M, { shade: ['zinc', 'conc', 'roof', 'det'] });
        parts.push({ name: 'bbso', res, M, out, kind: 'bbso' });
      }
    }

    // ---- the six smaller churches: three meshes each, the three materials shared
    {
      const MC = {
        wall: new THREE.MeshStandardMaterial({ map: plasterTex(r), vertexColors: true, roughness: 0.92 }),
        roof: new THREE.MeshStandardMaterial({ map: tileTex(r), vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }),
        det: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 }),
      };
      for (const def of CHAPELS) {
        const c = guard(def.slug, () => buildChapel(def, { g, S }));
        if (!c) continue;
        const out = finish(root, `baptist-${def.slug}`, c.B, MC, { shade: ['wall', 'roof', 'det'] });
        parts.push({ name: def.slug, res: c.res, M: MC, out, kind: 'chapel' });
      }
    }

    const verts = parts.reduce((n, p) => n + p.out.verts, 0), meshes = parts.reduce((n, p) => n + p.out.meshes, 0);
    console.log(`[oradea] baptist: ${(verts / 1000).toFixed(1)}k verts, ${meshes} meshes, ${S.count - n0} solids, ${Math.round(performance.now() - t0)} ms`);
    return {
      footprints: parts.flatMap((p) => p.res.footprints ?? []),
      spots: parts.flatMap((p) => p.res.spots ?? []),
      clear: (x, z) => parts.some((p) => p.res.clear?.(x, z)),
      update() {
        const k = nightK.value, e = Math.min(1, 3 * k);
        for (const p of parts) {
          const M = p.M;
          if (p.kind === 'bbso') { M.lit.emissiveIntensity = 0.9 * k; M.sign.emissiveIntensity = 2.4 * e; M.fin.emissiveIntensity = 0.7 * e; }
          if (p.kind === 'emanuel') { M.lit.emissiveIntensity = 0.9 * k; M.wall.emissiveIntensity = 0.06 * e; M.glow.emissiveIntensity = 2.2 * e; }
        }
      },
      stats: Object.fromEntries(parts.map((p) => [p.name, { verts: p.out.verts, meshes: p.out.meshes, ...p.res.stats }])),
    };
  },
};
