// OWNER: oradea. The house of the Viața Nouă church and of BCUO (the Ukrainian church run by the Drumul Vieții association),
// Strada Nicolae Jiga 25, Oradea (OSM way 420863618), the game's first partner. The city generator drew it as an old-town house
// with a row of shop windows; this is how it stands today (Google Street View, 2024):
//   the one-storey 1900s street house, flush with the pavement behind a brick plinth: cream render with four arched windows in two
//   pairs (ochre hoods, keystones, stone sills, brown timber sashes), ochre piers, a sawtooth band, a frieze with four round vents,
//   a dentil cornice, a tiled roof along the street with a 7 x 3 solar array and a brick east gable; a lower gabled wing behind it;
//   east of the front the church's gate: a black pedestrian leaf, two brick piers, the wide iron gate with its scroll crest, and a
//   stretch of the neighbour's pink wall. The pink ring at the door is placed by sites/partners.js, not here.
// The real facade carries no lettering, so the small enamel name plate on the east pier (a red drop, VIAȚA NOUĂ, BCUO) is an
// addition for the partner: set NAMEPLATE false to leave it out. The rear wing and the yard behind the gate are not visible from
// the street: their walls, windows, entrance and garden are guesses.
//   SITE { id, label, skip, places, ground: true, build(base) -> { update, clear(x, z), footprints, stats } }  (no `partners`)
//   Six draw calls (wall, brick, roof, det, lit, sign), one root group `landmark-viatanoua`.
import * as THREE from 'three';
import { MB, M4 } from '../../../kit/mesh.js';
import { nightK } from '../../../render/daylight.js';
import { finish } from '../../cherkasy/slabkit.js';
import { rng } from '../../cherkasy/geo.js';
import { plasterTex, brickTex, tileTex, plateTex, cellDrape, mat } from './viatanoua/kit.js';
import { buildHouse, buildGate, FR, toWorld, WF, D1, D2, WX0, H_EAVE, H_RIDGE, WING_EAVE, WING_RIDGE, OSM_RING, GATE } from './viatanoua/house.js';

export const OSM_ID = 420863618;
const NAMEPLATE = true;
const YARD = { x0: GATE.doorX0, x1: 17.4, z0: -0.1, z1: -D2 - 0.6 }; // the church yard behind the gate, local frame

// plane y = a + bx x + bz z through three (x, z, y) points
function plane(p, q, r) {
  const [ux, uz, uy] = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], [vx, vz, vy] = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
  const det = ux * vz - uz * vx, bx = (uy * vz - uz * vy) / det, bz = (ux * vy - uy * vx) / det;
  return { a: p[2] - bx * p[0] - bz * p[1], bx, bz };
}

export const SITE = {
  id: 'viatanoua',
  label: 'Viața Nouă · BCUO, Strada Nicolae Jiga 25',
  skip: [OSM_ID],
  places: [], // the partner is in places.js
  ground: true,
  build(base) {
    const { root, solids: S } = base, gnd = base.ground?.heightAt ?? base.heightAt;
    const g = (x, z) => { const h = gnd(x, z); return Number.isFinite(h) ? h : 3.9; };
    const t0 = performance.now(), n0 = S.count, r = rng(25);
    // the floor line: the mean ground along the front wall
    let yF = 0; for (let i = 0; i <= 10; i++) { const [x, z] = toWorld(WF * i / 10, 0.3); yF += g(x, z) / 11; }
    yF += 0.05;
    const gl = (lx, lz) => { const [x, z] = toWorld(lx, lz); return g(x, z) - yF; }; // local ground height

    const B = Object.fromEntries(['wall', 'brick', 'roof', 'det', 'lit', 'sign'].map((k) => [k, new MB()]));
    const xf = M4(FR.O[0], yF, FR.O[1], FR.th);
    for (const D of Object.values(B)) D.setXf(xf);
    buildHouse({ wall: B.wall, brick: B.brick, roof: B.roof, det: B.det, lit: B.lit, sign: NAMEPLATE ? B.sign : null });
    const gate = buildGate(B);

    // ---- the yard behind the gate: pavers, gravel path, lawn (flat colours, laid on the ground), shrubs
    const dg = new MB();
    const lay = (x0, z0, x1, z1, col, lift) => { dg.setColor(col); cellDrape(dg, g, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([a, b]) => toWorld(a, b)), lift, 2); };
    lay(YARD.x0, YARD.z0, 16.4, -6.5, '#a09d94', 0.2);   // the forecourt behind the gate (parking)
    lay(YARD.x0, -6.5, 12.9, YARD.z1, '#aaa493', 0.2);   // the gravel path along the east wall
    lay(12.2, -15.9, 13.5, -18.1, '#aeaba3', 0.22);      // the apron at the wing's door
    const shrub = (x, z, rx, ry, col, n = 8) => { B.det.setColor(col); B.det.ellipsoid([x, gl(x, z) + ry * 0.85, z], [rx, ry, rx], n, 5); };
    shrub(13.5, -1.7, 0.62, 0.55, '#55823d'); shrub(15.1, -1.9, 0.6, 0.55, '#4e7a3a');
    shrub(14.3, -3.6, 0.5, 1.3, '#2f5b34'); shrub(16.5, -8.2, 0.5, 1.2, '#2f5b34'); shrub(16.5, -12.4, 0.5, 1.2, '#31603a'); shrub(13.8, -22.6, 0.5, 1.15, '#2f5b34');
    shrub(15.6, -15.5, 0.8, 0.7, '#5a8541'); shrub(15.2, -19.5, 0.7, 0.6, '#4e7a3a');

    for (const D of Object.values(B)) D.setXf(null);
    B.det.merge(dg);

    // ---- materials
    const plate = plateTex('VIAȚA NOUĂ', 'BCUO · biserica ucraineană');
    const M = {
      wall: mat({ map: plasterTex(r), vertexColors: true, roughness: 0.93 }),
      brick: mat({ map: brickTex(r), vertexColors: true, roughness: 0.9 }),
      roof: mat({ map: tileTex(r), vertexColors: true, roughness: 0.82, side: THREE.DoubleSide }),
      det: mat({ vertexColors: true, roughness: 0.7, metalness: 0.12 }),
      lit: mat({ vertexColors: true, roughness: 0.4, metalness: 0.15, emissive: 0xffd9a0, emissiveIntensity: 0 }),
      sign: mat({ map: plate, roughness: 0.45, emissive: 0xffffff, emissiveMap: plate, emissiveIntensity: 0 }),
    };
    const out = finish(root, 'landmark-viatanoua', B, M, { shade: ['wall', 'brick', 'roof', 'det'] });

    // ---- colliders: the front range (walls, then the two roof planes), the wing, the gate group
    const W = (lx, lz) => toWorld(lx, lz);
    const rect = (x0, z0, x1, z1) => [W(x0, z0), W(x1, z0), W(x1, z1), W(x0, z1)].flat();
    const topPlane = (pts) => plane(...pts.map(([lx, lz, y]) => { const [x, z] = W(lx, lz); return [x, z, y]; }));
    const eY = yF + 5.5, rY = yF + H_RIDGE, eZ = 0.35, rZ = -D1 / 2, bZ = -D1 - 0.35;
    S.prism(rect(0, 0, WF, -D1), yF - 1, yF + H_EAVE, 0, 0, 'wall', 0);
    const roofF = (lz0, lz1, y0, y1) => { const pl = topPlane([[0, lz0, y0], [WF, lz0, y0], [0, lz1, y1]]); S.prism(rect(-0.12, lz0, WF + 0.12, lz1), yF + H_EAVE - 0.05, pl.a, pl.bx, pl.bz, 'wall', 0); };
    roofF(eZ, rZ, eY, rY); roofF(rZ, bZ, rY, eY);
    const XM = (WX0 + WF) / 2, wr = yF + WING_RIDGE, we = yF + WING_EAVE;
    S.prism(rect(WX0, -D1, WF, -D2), yF - 1, we, 0, 0, 'wall', 0);
    const roofW = (x0, x1, y0, y1) => { const pl = topPlane([[x0, -D1, y0], [x1, -D1, y1], [x0, -D2, y0]]); S.prism(rect(x0, -D1, x1, -D2), we - 0.05, pl.a, pl.bx, pl.bz, 'wall', 0); };
    roofW(WX0, XM, we, wr); roofW(XM, WF, wr, we);
    for (const q of gate.solids) { const [cx, cz] = W(q.cx, q.cz); S.obox(cx, cz, q.hx, q.hz, FR.ang, yF - 0.6, yF + q.y1, 'wall', 0); }

    // ---- what the maps and the tree placement see
    const inYard = (x, z) => {
      const dx = x - FR.O[0], dz = z - FR.O[1], lx = dx * FR.ux + dz * FR.uz, lz = -dx * FR.uz + dz * FR.ux;
      return lx > -1.2 && lx < YARD.x1 + 0.4 && lz < 0.7 && lz > YARD.z1 - 0.4;
    };
    const verts = out.verts, meshes = out.meshes;
    console.log(`[oradea] viatanoua: ${(verts / 1000).toFixed(1)}k verts, ${meshes} meshes, ${S.count - n0} solids, ${Math.round(performance.now() - t0)} ms`);
    return {
      footprints: [{ poly: OSM_RING.map((p) => [p[0], p[1]]), h: H_RIDGE, kind: 'church', name: 'Viața Nouă · BCUO', id: OSM_ID }],
      clear: inYard,
      update() {
        const k = nightK.value, e = Math.min(1, 3 * k);
        M.lit.emissiveIntensity = 0.85 * k;
        M.sign.emissiveIntensity = 0.5 * e;
      },
      stats: { verts, meshes, solids: S.count - n0, yF: +yF.toFixed(2), nameplate: NAMEPLATE },
    };
  },
};
