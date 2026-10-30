// OWNER: oradea. The parametric hall of the free-church site (tier b of ../pentecostal.js): one function that turns an OSM / Overture footprint and a short
// spec into a church or meeting house – walls on every edge of the outline with a plinth, a cornice and rows of window bays, roof blocks (hip,
// gable or flat), and a hook that draws the front the photograph shows. The front edge is the one facing `faceTo` (a map point on the street).
//   buildHall({ B, S, g, ring, spec }) -> { footprints, stats, ctx }
//     B: the kit's builder set (kit.js newSet), S: collision world, g(x, z): ground height, ring: map-space footprint [[x, z], ...]
//     spec fields (lengths in metres): id, key, name, frame { faceTo [x, z] | yaw (deg) }, eave (height of the wall tops over the floor), wall,
//       side (colour of the side and back walls, default wall), trim, plinth, plinthH, cornice (colour), rows [{ y, h, w, kind }] (window rows on
//       the side walls), pitch (bay pitch), glass, sur, roofs [{ u0, u1, v0, v1, ridge: 'u' | 'v', rise, eave (extra drop), hip0, hip1 }]
//       (default: one block over the bounding box), roofMat ('tile' | 'sheet'), roofCol, ov (eave overhang), front(ctx), extra(ctx), top (h of
//       the footprint for the map), flat (a flat roof with a parapet instead of roofs), tops(f, ctx) -> [[s0, s1, height]] (wall tops along an edge)
//     ctx: { B, S, F, R, edges, front (the front edge frame | null), ff (frontFrame over the front edge), spec, Y, Fy, gLo, eave, st, toW }
import { begin, end, frameOf, groundOf, edgeFrame, frontFrame, rect, slab, gable, gableSolid, at } from './kit.js';
import { bays } from './parts.js';

export function buildHall({ B, S, g, ring, spec }) {
  const F = frameOf(ring, spec.frame ?? {}), R = F.ring, toW = F.toMap, st = { windows: 0, towers: 0 };
  const { Fy, gLo } = groundOf(ring, g), Y = (h) => Fy + h;
  const eave = spec.eave ?? 7.0, WL = B.wall;
  const cWall = spec.wall ?? '#e6dcc2', cSide = spec.side ?? cWall, cTrim = spec.trim ?? '#f6f0e2', cGlass = spec.glass ?? '#34465a';
  const edges = R.map((a, i) => edgeFrame(a, R[(i + 1) % R.length]));
  const { minU, maxU, minV, maxV } = F;
  // the front edge: facing -u, on the front line of the box, the longest such
  let front = null;
  for (const f of edges) if (f.n[0] < -0.9 && Math.abs(f.a[0] - minU) < 0.8 && Math.abs(f.b[0] - minU) < 0.8 && (!front || f.L > front.L)) front = f;
  const ctx = { B, S, F, R, edges, front, spec, Y, Fy, gLo, eave, st, toW, g };
  begin(B, F.cx, F.cz, F.yaw);
  for (const f of edges) {
    if (f.L < 0.2) continue;
    const isFront = f === front && spec.front;
    for (const [s0, s1, top] of spec.tops?.(f, ctx) ?? [[0, f.L, eave]]) {
      WL.setColor(isFront ? cWall : cSide); rect(WL, f, s0, s1, gLo, Y(top));
      WL.setColor(spec.plinth ?? '#a39b8b'); slab(WL, f, s0 - 0.06, s1 + 0.06, gLo, Y(spec.plinthH ?? 0.8), 0, 0.12, 'ft');
      if (spec.cornice !== false) { WL.setColor(spec.cornice ?? cTrim); slab(WL, f, s0 - 0.2, s1 + 0.2, Y(top - 0.4), Y(top + 0.03), 0, 0.34, 'ftb'); }
      if (isFront || s1 - s0 < 2.4) continue;
      for (const r of spec.rows ?? []) if (r.y + (r.h ?? 1.6) < top - 0.5) st.windows += bays(B, f, { y: Y(r.y), w: r.w ?? 1.1, h: r.h ?? 1.6, kind: r.kind ?? 'flat', pitch: spec.pitch ?? 3.4, m0: 1.1, m1: 1.1, from: s0, to: s1, trim: cTrim, glass: cGlass, sur: spec.sur ?? 0.12, d: 0.06 });
    }
  }
  if (front) ctx.ff = frontFrame(minU, front.b[1], front.a[1], -1);
  spec.front?.(ctx);
  // ---- roofs
  const roofs = spec.roofs ?? [{ u0: minU, u1: maxU, v0: minV, v1: maxV, ridge: 'u', hip0: spec.hip0 ?? true, hip1: spec.hip ?? true, rise: spec.rise ?? 2.4 }];
  const RM = spec.roofMat === 'sheet' ? B.sheet : B.tile;
  const FF = { cx: F.cx, cz: F.cz, U: F.U, V: F.V };
  if (spec.flat) {
    B.sheet.setColor(spec.roofCol ?? '#aeb0ad'); B.sheet.fill(R, [], Y(eave), true);
  } else for (const r of roofs) {
    const across = r.ridge === 'v', yE = Y(eave - (r.drop ?? 0)), yR = yE + (r.rise ?? 2.4);
    gable(RM, { a0: across ? r.v0 : r.u0, a1: across ? r.v1 : r.u1, b0: across ? r.u0 : r.v0, b1: across ? r.u1 : r.v1, yE, yR, ridge: r.ridge ?? 'u', ov: spec.ov ?? 0.5,
      rake: r.rake ?? 0.3, hip0: !!r.hip0, hip1: !!r.hip1, col: spec.roofCol ?? '#9a4a36', G: WL, gcol: cSide, tri0: !(spec.front && !across && Math.abs(r.u0 - minU) < 0.8) });
  }
  spec.extra?.(ctx);
  end(B);
  // ---- colliders and the map footprint
  S.prism(ring.flat(), gLo, Y(eave + 0.1), 0, 0, 'wall');
  if (!spec.flat) for (const r of roofs) {
    const across = r.ridge === 'v';
    gableSolid(S, FF, toW, { u0: r.u0, u1: r.u1, vt: r.v0, vb: r.v1, eaveY: Y(eave - (r.drop ?? 0)), rise: (r.rise ?? 2.4) - 0.05, across });
  }
  return { footprints: [{ poly: ring.map((p) => [p[0], p[1]]), h: spec.top ?? eave + (spec.rise ?? 2.4) + 1, kind: 'church', name: spec.name, id: spec.id }], stats: st, ctx };
}
void at;
