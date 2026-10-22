// OWNER: oradea. Piața Unirii, Oradea, as it looks after the 2010s rehabilitation (the square's heart; City Hall, Sf. Ladislau
// and the Black Eagle Palace are in primaria.js, the Ferdinand square and the theatre in ferdinand.js):
//   the pedestrian square itself – limestone slab field and plaza, porphyry fans on the lanes and the promenade south of it,
//   the red-sett tram bed with the rails flush in the paving, the four fountain basins with their jets, lawns, the lantern
//   columns and the carved balustrade along the west side, lamps, benches, young trees –,
//   the equestrian statue of King Ferdinand I (2019 replica on the 1924 pedestal; the card of the task said Mihai Viteazul,
//   whose 1994 statue stood here until it moved to Piața Gojdu),
//   Biserica cu Lună (OSM 651522972), the Greek Catholic cathedral of St Nicholas (OSM 286245385) and the Greek Catholic
//   Episcopal Palace (OSM 41415055).
// Parts: ./unirii/{frame, paving, square, statue, moonchurch, cathedral, palace, set, facekit, kit, textures}.js
// Site contract of src/world/oradea/city.js: SITE { id, label, skip, places, build(base) -> { update, clear, footprints, spots } }.
import * as THREE from 'three';
import { Group, Mesh } from 'three';
import { rng, inPoly } from '../../cherkasy/geo.js';
import { MB, M4 } from '../../../kit/mesh.js';
import { nightK, getDaylight } from '../../../render/daylight.js';
import { t } from '../../../i18n.js';
import { buildPaving, LAYOUT } from './unirii/paving.js';
import { buildSquare } from './unirii/square.js';
import { buildStatue } from './unirii/statue.js';
import { buildMoonChurch } from './unirii/moonchurch.js';
import { buildCathedral } from './unirii/cathedral.js';
import { buildPalace } from './unirii/palace.js';
import { toLocal, toMap } from './unirii/frame.js';
import { newSet, makeMats, finishSet } from './unirii/set.js';
import { signAtlas } from './unirii/textures.js';
import { floodlit } from '../../cherkasy/bohdan.js';

const MOON_ID = 651522972, CATH_ID = 286245385, PALACE_ID = 41415055;

export const SITE = {
  id: 'unirii',
  label: 'Piața Unirii',
  skip: [MOON_ID, CATH_ID, PALACE_ID],
  places: [], // its places are in ../places.js, so the phone map lists them too
  build(base) {
    const { root, map, solids: S, heightAt } = base, t0 = performance.now(), n0 = S.count;
    const r = rng(1925);
    const g = (x, z) => { const h = heightAt(x, z); return Number.isFinite(h) ? h : 3; };
    const group = Object.assign(new Group(), { name: 'landmark-unirii' });
    root.add(group);
    const B = newSet(), spots = [], wash = [], footprints = [], lots = [];
    const atlas = signAtlas();

    // ---- the square
    const P = buildPaving({ g, map, rng: r });
    group.add(Object.assign(new Mesh(P.geo, P.material), { name: 'unirii-pave', receiveShadow: true }));
    const sq = buildSquare({ g, B, S, spots, r, M4 }, P);
    const st = buildStatue({ B, S, g, M4, lift: P.lift });
    wash.push(...st.lamps);

    // ---- the three buildings
    const moon = buildMoonChurch({ B, S, g, wash, atlas });
    footprints.push(...moon.footprints); lots.push(moon.footprints[0].poly);
    const cath = buildCathedral({ B, S, g, wash, atlas });
    footprints.push(...cath.footprints); lots.push(cath.footprints[0].poly);
    const pal = buildPalace({ B, S, g, wash });
    footprints.push(...pal.footprints); lots.push(pal.footprints[0].poly);

    // ---- the basins: water and floor, and the jets
    const jets = new MB();
    P.ponds.forEach((pond, k) => {
      const ring = pond.map(([e, s]) => toMap(e, s)), [cx, cz] = sq.jets[k] ?? [0, 0];
      B.water.setColor(0xffffff).fill(ring, [], sq.jets[k][1] + 0.5, true);
      B.stone.setColor(0x9aa4a3).fill(ring, [], sq.jets[k][1] - 0.22, true);
      void cx; void cz;
    });
    for (const [x, y, z] of sq.jets) {
      jets.cyl(x, y + 0.5, z, 0.16, 0.025, 3.0, 8, false);
      for (let a = 0; a < 8; a++) { const q = a / 8 * Math.PI * 2; jets.tube([x, y + 0.55, z], [x + Math.cos(q) * 1.5, y + 0.45, z + Math.sin(q) * 1.5], 0.025, 4); }
    }

    // ---- materials, meshes
    const M = makeMats(r, wash, atlas);
    const out = finishSet(group, B, M);
    const jetMat = new THREE.MeshBasicMaterial({ color: 0xe4f4fb, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
    group.add(Object.assign(new Mesh(jets.build(), jetMat), { name: 'unirii-jets' }));
    const moonMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.55, emissive: 0xffc060, emissiveIntensity: 0 });
    const moonMesh = Object.assign(new Mesh(moon.moon.geo, moonMat), { name: 'unirii-moon' });
    moonMesh.position.set(...moon.moon.pos);
    group.add(moonMesh);
    // the sphere turns once a lunar month about its vertical axis: the gold half faces the square at the full moon, the black one at the new
    const phase = ((((Date.now() / 86400000 - 10962.76) / 29.530588) % 1) + 1) % 1;
    moonMesh.rotation.y = Math.atan2(-moon.moon.nrm[2], moon.moon.nrm[0]) + Math.PI * (1 - 2 * phase);
    const bronze = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.48, metalness: 0.55, side: THREE.DoubleSide, emissive: 0xffc890, emissiveIntensity: 0 });
    floodlit(bronze, st.lamps, 12, 'unirii-bronze');
    group.add(Object.assign(new Mesh(st.geo, bronze), { name: 'unirii-bronze', castShadow: true, receiveShadow: true }));

    console.log(`[oradea] Piața Unirii: ${((out.verts + st.geo.attributes.position.count + P.geo.attributes.position.count) / 1000).toFixed(1)}k verts, ${out.meshes + 4} meshes, ${S.count - n0} solids in ${(performance.now() - t0).toFixed(0)} ms`);

    const near = (ring, x, z, m) => {
      if (inPoly(ring, x, z)) return true;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const ax = ring[j][0], az = ring[j][1], dx = ring[i][0] - ax, dz = ring[i][1] - az, L2 = dx * dx + dz * dz || 1;
        const f = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2));
        if (Math.hypot(x - ax - dx * f, z - az - dz * f) < m) return true;
      }
      return false;
    };
    return {
      footprints, spots,
      clear: (x, z) => { const [e, s] = toLocal(x, z); return P.inside(e, s) || inPoly(LAYOUT.cobble, e, s) || lots.some((q) => near(q, x, z, 3)); },
      update(dt, camera) {
        const k = nightK.value, e = Math.min(1, 3 * k), time = performance.now() / 1000;
        M.lit.emissiveIntensity = 0.95 * k; M.plaster.emissiveIntensity = 0.34 * e; M.stone.emissiveIntensity = 0.3 * e;
        M.glow.emissiveIntensity = 0.05 + 2.4 * e; bronze.emissiveIntensity = 0.5 * e; moonMat.emissiveIntensity = 0.25 * e;
        jetMat.opacity = 0.42 + 0.1 * Math.sin(time * 5.1) + 0.05 * Math.sin(time * 13);
        if (camera) { const d = getDaylight(); if (d) atlas.tick(d.state.hours); }
      },
    };
  },
};
