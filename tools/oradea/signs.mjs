// Real shop signs, for build_map.mjs (config tools.shops): every named shop, office, café, restaurant, bank or pharmacy
// in OSM gets a sign board on a street-facing wall (`f` code 1 or 2) of the building it stands in, or else of the
// nearest building within 20 m, at the wall point nearest to it; boards on one wall never overlap. Plain text, no logos.
//   placeSigns({ shops, pois, blds, proj, region }) -> [{ x, z, a, w, n, k, b }]
//     shops: raw `shops` elements (fetch_osm.mjs), pois: raw `poi` elements; blds: build_map records ({ id, outer, f });
//     x, z: the board's middle on the wall line, a: the angle of the wall's outward normal (atan2(nx, nz)), w: width m,
//     n: the name, k: 'food' | 'shop' | 'bank' | 'health' | 'office', b: the building id (a hand-built site drops it)
const FOOD = /^(cafe|restaurant|bar|pub|fast_food|ice_cream|biergarten)$/, BANK = /^(bank|bureau_de_change)$/, HEALTH = /^(pharmacy|dentist|clinic|doctors|veterinary)$/;
const kindOf = (t) => (t.shop ? (/^(bakery|pastry|confectionery|coffee)$/.test(t.shop) ? 'food' : /^(optician|chemist|medical_supply|hearing_aids)$/.test(t.shop) ? 'health' : 'shop')
  : FOOD.test(t.amenity ?? '') ? 'food' : BANK.test(t.amenity ?? '') ? 'bank' : HEALTH.test(t.amenity ?? '') ? 'health' : t.office || t.craft ? 'office' : null);

const inRing = (x, z, R) => { let c = false; for (let i = 0, j = R.length - 1; i < R.length; j = i++) { const [xi, zi] = R[i], [xj, zj] = R[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };

export function placeSigns({ shops, pois, blds, proj, region }) {
  // the street walls, in a 40 m grid
  const CELL = 40, grid = new Map(), key = (i, j) => i * 1e6 + j, walls = [];
  blds.forEach((b) => {
    if (!b.f || !/[12]/.test(b.f)) return;
    const R = b.outer;
    for (let i = 0; i < R.length; i++) {
      if (b.f[i] !== '1' && b.f[i] !== '2') continue;
      const a = R[i], c = R[(i + 1) % R.length], ex = c[0] - a[0], ez = c[1] - a[1], len = Math.hypot(ex, ez);
      if (len < 2.2) continue;
      const w = { a, ex: ex / len, ez: ez / len, len, nx: ez / len, nz: -ex / len, b, used: [] }; walls.push(w);
      for (let gi = Math.floor((Math.min(a[0], c[0]) - 20) / CELL); gi <= Math.floor((Math.max(a[0], c[0]) + 20) / CELL); gi++)
        for (let gj = Math.floor((Math.min(a[1], c[1]) - 20) / CELL); gj <= Math.floor((Math.max(a[1], c[1]) + 20) / CELL); gj++) (grid.get(key(gi, gj)) ?? grid.set(key(gi, gj), []).get(key(gi, gj))).push(w);
    }
  });
  const centre = (e) => (e.type === 'node' ? [e.lat, e.lon] : e.geometry?.length ? [e.geometry.reduce((s, g) => s + g.lat, 0) / e.geometry.length, e.geometry.reduce((s, g) => s + g.lon, 0) / e.geometry.length] : null);
  const named = [...shops, ...pois.filter((e) => e.tags?.amenity)].filter((e) => e.tags?.name && kindOf(e.tags) && e.tags.shop !== 'mall');
  const seen = new Set(), out = [];
  for (const e of named) {
    const k = e.type + e.id; if (seen.has(k)) continue; seen.add(k);
    const ll = centre(e); if (!ll) continue;
    const [x, z] = proj(ll[0], ll[1]);
    if (x < region.x0 || x > region.x1 || z < region.z0 || z > region.z1) continue;
    const name = e.tags.name.trim().replace(/\s+/g, ' ').slice(0, 28);
    const want = Math.min(9, Math.max(1.8, 0.34 * name.length + 0.8));
    // the nearest street wall: of the building it stands in, else of any building within 20 m
    let best = null;
    for (const w of grid.get(key(Math.floor(x / CELL), Math.floor(z / CELL))) ?? []) {
      const t = Math.max(0, Math.min(w.len, (x - w.a[0]) * w.ex + (z - w.a[1]) * w.ez));
      const d = Math.hypot(w.a[0] + w.ex * t - x, w.a[1] + w.ez * t - z), inside = inRing(x, z, w.b.outer);
      const score = d - (inside ? 100 : 0);
      if ((inside || d <= 20) && (!best || score < best.score)) best = { w, t, score };
    }
    if (!best) continue;
    const { w } = best, width = Math.min(want, w.len - 0.4);
    if (width < 1.5) continue;
    // the nearest free stretch of that wall
    let t = Math.max(width / 2 + 0.2, Math.min(w.len - width / 2 - 0.2, best.t)), placed = false;
    for (const step of [0, 1, -1, 2, -2, 3, -3, 4, -4]) {
      const tt = t + step * (width + 0.4) / 2;
      if (tt < width / 2 + 0.2 || tt > w.len - width / 2 - 0.2) continue;
      if (w.used.some(([u0, u1]) => tt + width / 2 + 0.3 > u0 && tt - width / 2 - 0.3 < u1)) continue;
      t = tt; placed = true; break;
    }
    if (!placed) continue;
    w.used.push([t - width / 2, t + width / 2]);
    const r1 = (v) => Math.round(v * 100) / 100;
    out.push({ x: r1(w.a[0] + w.ex * t), z: r1(w.a[1] + w.ez * t), a: r1(Math.atan2(w.nx, w.nz)), w: r1(width), n: name, k: kindOf(e.tags), b: w.b.id });
  }
  return out;
}
