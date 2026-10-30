// The phone tier (?phone; on a computer ?desktop&phone): the pure parts, no DOM. Phones play Oradea's centre only,
// a disc round Piața Unirii (the map origin), on a graphics ladder of their own; phonegame.js puts it on screen.
//
//   CENTRE = { x, z, r }   the disc (m); GROUND_PAD: how far past it the ground is still built (the fog hides the rest)
//   inDisc(x, z, c = CENTRE, pad = 0) -> bool
//   clipToCentre(map, c = CENTRE) -> { keep, region, stats }   cuts map.json down to the centre, in place: buildings by
//     their centre inside the disc; roads, tram and rail lines cut into the runs of points inside the disc + 60 m (the
//     lanes, the trams and the missions end at the edge); points (signs, POIs, OSM trees, junctions) inside the disc;
//     surfaces (land, asphalt, walks, dirt, cover, zones, parking) whose box meets the ground box; the river kept whole.
//     map.region becomes the disc's box (lanes, people, tree rasters); keep is the ground box for the ground workers
//     (cherkasy/ground.js buildGroundAsync({ keep })), which read their own copy of map.json
//   anchorsOf(SITE, byId, geo) -> [[x, z]]   where a hand-built site stands: its replaced OSM buildings and its places;
//     siteInCentre(SITE, byId, geo, c) -> false only when it has anchors and none is inside the disc + SITE_PAD
//   outsideMeshes(roots, c) -> [mesh]   meshes whose world bounds lie wholly outside the disc + SITE_PAD (city.js drops them)
//   LEVELS: the phone ladder for main.js QUALITY_LEVELS (lowest first), START: the level a phone starts on;
//     NAMES: the levels' names (RO / EN) for the pills
//   guardDecision(record, now, levels, saved) -> { level, crashed, floor }   the reload guard: a boot record that was never
//     closed cleanly (no pagehide) and is younger than GUARD_WINDOW ms means the last start died within a minute of
//     play (iOS kills the tab and reloads it, with no JS error first): start one step lower than that start's level
//     (floor: it was already the lowest). Otherwise the saved level, else START
//   boundary(px, pz, vx, vz, dt, c = CENTRE) -> { vx, vz, px, pz, over }   the soft edge: past r the outward speed
//     brakes harder the further out (a car at 144 km/h stops ~25 m past r, a jet at full boost ~55 m) and the car is
//     eased back in; past r + EDGE + 40 it is put back on that line. over: metres past r (0 inside)
import { t } from '../../i18n.js';

export const CENTRE = { x: 0, z: 0, r: 1800 };
export const GROUND_PAD = 900, SITE_PAD = 150, LINE_PAD = 60, EDGE = 60;
export const LEVELS = ['minimal', 'phone', 'low'];
export const START = 'phone';
export const NAMES = { minimal: t('minimă', 'minimal'), phone: t('telefon', 'phone'), low: t('joasă', 'low') };
export const GUARD_WINDOW = 3 * 60e3, STABLE_AFTER = 60;

export const inDisc = (x, z, c = CENTRE, pad = 0) => (x - c.x) ** 2 + (z - c.z) ** 2 < (c.r + pad) ** 2;

const centreOf = (F) => { let x = 0, z = 0; const n = F.length >> 1; for (let i = 0; i < F.length; i += 2) { x += F[i]; z += F[i + 1]; } return [x / n, z / n]; };
const boxHits = (F, B) => {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let i = 0; i < F.length; i += 2) { const x = F[i], z = F[i + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
  return x1 >= B.x0 && x0 <= B.x1 && z1 >= B.z0 && z0 <= B.z1;
};
// a flat polyline [x, z, ...] -> its runs of consecutive points inside the disc + pad (each 2+ points)
export function cutLine(p, c, pad) {
  const out = []; let run = [];
  for (let i = 0; i + 1 < p.length; i += 2) {
    if (inDisc(p[i], p[i + 1], c, pad)) { run.push(p[i], p[i + 1]); continue; }
    if (run.length >= 4) out.push(run);
    run = [];
  }
  if (run.length >= 4) out.push(run);
  return out;
}

export function clipToCentre(map, c = CENTRE) {
  const R0 = map.region, stats = {};
  const box = (pad) => ({ x0: c.x - c.r - pad, x1: c.x + c.r + pad, z0: c.z - c.r - pad, z1: c.z + c.r + pad });
  const keep = box(GROUND_PAD);
  const region = R0 ? { x0: Math.max(R0.x0, c.x - c.r - 100), x1: Math.min(R0.x1, c.x + c.r + 100), z0: Math.max(R0.z0, c.z - c.r - 100), z1: Math.min(R0.z1, c.z + c.r + 100) } : box(100);
  const count = (k, before, after) => { stats[k] = [before, after]; };
  const filter = (k, test) => { if (!Array.isArray(map[k])) return; const n = map[k].length; map[k] = map[k].filter(test); count(k, n, map[k].length); };
  const lines = (k) => {
    if (!Array.isArray(map[k])) return;
    const n = map[k].length, out = [];
    for (const w of map[k]) for (const p of cutLine(w.p ?? [], c, LINE_PAD)) out.push(p.length === w.p.length ? w : { ...w, p });
    map[k] = out; count(k, n, out.length);
  };
  const outer = (r) => (Array.isArray(r[0]) ? r[0] : r); // a polygon [outer, ...holes] or a bare ring (zones)
  const rings = (rs) => rs.filter((r) => boxHits(outer(r), keep));

  filter('buildings', (b) => b.p?.length >= 6 && inDisc(...centreOf(b.p), c));
  lines('roads'); lines('trams'); lines('rails');
  for (const k of ['signs', 'pois']) filter(k, (q) => inDisc(q.x, q.z, c, 50));
  for (const k of ['trees', 'junctions']) filter(k, (q) => inDisc(q[0], q[1], c, 50));
  for (const k of ['land', 'asphalt', 'walks', 'dirt']) filter(k, (r) => boxHits(r[0], keep));
  filter('parking', (q) => inDisc(...centreOf(q.p), c, 50));
  for (const g of ['cover', 'zones']) for (const [k, rs] of Object.entries(map[g] ?? {})) { const n = rs.length; map[g][k] = rings(rs); count(`${g}.${k}`, n, map[g][k].length); }
  map.region = region;
  map.phoneCentre = { ...c };
  return { keep, region, stats };
}

export function anchorsOf(S, byId, geo) {
  const out = [];
  for (const id of S.skip ?? []) { const b = byId.get(id); if (b?.p?.length >= 6) out.push(centreOf(b.p)); }
  for (const q of S.places ?? []) {
    if (q.xz) out.push(q.xz);
    else if (q.ll && geo) out.push(geo.toXZ(q.ll[0], q.ll[1]));
    else if (q.ring) out.push(centreOf(Array.isArray(q.ring[0]) ? q.ring.flat() : q.ring));
    else for (const id of q.bld ?? []) { const b = byId.get(id); if (b?.p?.length >= 6) out.push(centreOf(b.p)); }
  }
  return out;
}
export function siteInCentre(S, byId, geo, c = CENTRE) {
  const a = anchorsOf(S, byId, geo);
  return !a.length || a.some(([x, z]) => inDisc(x, z, c, SITE_PAD));
}

// meshes wholly outside the disc + SITE_PAD, by their world bounding sphere (matrices must be current)
export function outsideMeshes(roots, c = CENTRE) {
  const out = [];
  for (const r of roots) r?.traverse?.((o) => {
    if (!(o.isMesh || o.isLine || o.isPoints)) return;
    const g = o.geometry; if (!g?.attributes?.position) return;
    if (o.isInstancedMesh) { if (!o.boundingSphere) o.computeBoundingSphere?.(); }
    else if (!g.boundingSphere) g.computeBoundingSphere();
    const s = (o.isInstancedMesh ? o.boundingSphere : g.boundingSphere)?.clone().applyMatrix4(o.matrixWorld);
    if (!s || !Number.isFinite(s.radius)) return;
    if (Math.hypot(s.center.x - c.x, s.center.z - c.z) - s.radius > c.r + SITE_PAD) out.push(o);
  });
  return out;
}

export function guardDecision(record, now, levels = LEVELS, saved = null) {
  const base = levels.includes(saved) ? saved : levels.includes(START) ? START : levels[0];
  if (!record || record.clean || !(now - record.at >= 0 && now - record.at < GUARD_WINDOW)) return { level: base, crashed: false, floor: false };
  const i = levels.indexOf(record.level);
  if (i < 0) return { level: base, crashed: true, floor: false };
  return { level: levels[Math.max(0, i - 1)], crashed: true, floor: i === 0 };
}

export function boundary(px, pz, vx, vz, dt, c = CENTRE) {
  const dx = px - c.x, dz = pz - c.z, d = Math.hypot(dx, dz), over = d - c.r;
  if (over <= 0) return { px, pz, vx, vz, over: 0 };
  const nx = dx / d, nz = dz / d, k = Math.min(1, over / EDGE);
  // the outward speed brakes at 8 m/s2 on the line, up to 128 m/s2 at r + EDGE (from 144 km/h: ~25 m), and the car is
  // eased back in at up to 6 m/s; the speed along the edge is kept
  const out = vx * nx + vz * nz, target = -6 * k;
  if (out > target) { const cut = Math.min(out - target, (8 + 120 * k) * dt); vx -= nx * cut; vz -= nz * cut; }
  const hard = c.r + EDGE + 40;
  if (d > hard) { px = c.x + nx * hard; pz = c.z + nz * hard; }
  return { px, pz, vx, vz, over };
}
