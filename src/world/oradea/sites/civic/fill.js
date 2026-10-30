// OWNER: oradea. Neighbours of the civic buildings (not a site module): when a hand-built building replaces an OSM footprint that is
// bigger than the building itself (a whole street block, a courtyard complex), the rest of the footprint has to be drawn again.
// This turns the left-over parts into ordinary dressed blocks – the city generator's facade shader walls, the shared detail
// material for roofs and trims – by way of the university site's block kit, so they match the buildings round them.
//   pieces(ring, rects) -> [ring]       the parts of `ring` outside every oriented rectangle { cx, cz, ux, uz, hl, hw } (areas under 6 m2 dropped)
//   makeFill(base, name, seed) -> { ctx, block(spec) -> res | null, finish() -> { group, verts, meshes } | null }
//     block(spec): the university kit's spec (n storeys, wall '#hex', roof { col, col2, pitch }, eave, ring ...); spec.ring is the part
//     of the footprint, drawn with its collider; the footprint it adds goes to `foot` (the site returns them for the maps).
import { makeGroup, buildingIndex } from '../university/group.js';
import { makeKit } from '../university/block.js';
import { clipHalf, ringArea } from './kit.js';

// the parts of P outside one oriented rectangle: left of it, right of it, and above / below it between the two (clipHalf keeps n . p <= d)
function minusRect(P, r) {
  const { cx, cz, ux, uz, hl, hw } = r, vx = -uz, vz = ux;
  const du = ux * cx + uz * cz, dv = vx * cx + vz * cz;
  // a rectangle that does not touch P leaves it whole (so the partition lines do not cut it)
  const inside = clipHalf(clipHalf(clipHalf(clipHalf(P, ux, uz, du + hl), -ux, -uz, -(du - hl)), vx, vz, dv + hw), -vx, -vz, -(dv - hw));
  if (inside.length < 3 || Math.abs(ringArea(inside)) < 0.5) return [P];
  const left = clipHalf(P, ux, uz, du - hl), right = clipHalf(P, -ux, -uz, -(du + hl));
  const mid = clipHalf(clipHalf(P, -ux, -uz, -(du - hl)), ux, uz, du + hl);
  const top = clipHalf(mid, -vx, -vz, -(dv + hw)), bot = clipHalf(mid, vx, vz, dv - hw);
  return [left, right, top, bot].filter((q) => q.length >= 3);
}
export function pieces(ring, rects) {
  let cur = [ring];
  for (const r of rects) cur = cur.flatMap((q) => minusRect(q, r));
  return cur.filter((q) => Math.abs(ringArea(q)) > 6);
}

export function makeFill(base, name, seed = 5) {
  const index = buildingIndex(base.map);
  const ctx = makeGroup(name, base, null, index, seed);
  const kit = makeKit(ctx);
  return {
    ctx,
    block: (spec) => kit.block(spec),
    finish: () => (ctx.F.v || ctx.D.v ? ctx.finish() : null),
  };
}
