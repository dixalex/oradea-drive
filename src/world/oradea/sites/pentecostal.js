// OWNER: oradea. Oradea's Pentecostal churches (the city is one of Romania's main Pentecostal centres) and the other free-church houses of worship
// no other site owns: the Adventist and Jehovah's Witnesses' halls (the generic OSM boxes replaced), in two tiers, one shared material set
// (five meshes for the buildings inside the phone tier's 1800 m disc, in the root group `landmark-pentecostal`, and one more set for those
// outside it – Filadelfia and Tabor – in a group of its own, `landmark-pentecostal-far`, which the phone tier drops):
//   (a) hand-built from photographs (./pentecostal/*.js, one builder each): Betania (OSM 261607829, Strada Doina 19: a big faceted hall with a
//       translucent barrel vault; from the aerial view only), Betel (OSM 423100418, Strada Ion Ghica 13: by the church's own account the first Pentecostal
//       church raised in Oradea; a stepped front with a cross), Filadelfia (Overture 3000011312, Strada Ana Ipătescu 11: terracotta stucco under red tile,
//       a big pointed window over the entrance) and Tabor (OSM 421861043, Strada Meiului 8: a three-storey hall with a stepped front and a
//       cream strip, founded 1990)
//   (b) the parametric hall (./pentecostal/hall.js, specs in ./pentecostal/specs.js): the Adventist churches Maranatha (Strada Clujului 32) and
//       Eden (Strada Academiei 9), the Kingdom Halls on Strada Olimpiadei 44 and Strada Anatole France 50, the Pentecostal church Efrata
//       (Strada Dobrogei 1), each on its footprint, dressed from its Street View photograph
// Not built here: the Baptist churches (sites/baptist: Emanuel, BBSO, Providența and the rest, among them the pyramid-roofed church on Calea
// Bihorului that the Street View lettering calls Biserica Penticostală Speranța), the Orthodox, Catholic and Reformed ones, the Viața Nouă / BCUO
// block and BSVO (sites/viatanoua, sites/bsvo); the Mormon meeting room (Strada Episcop Mihai Pavel 26, a rented floor of an old-town house with no
// building of its own); Pentecostal houses whose address or building could not be fixed (Maranata, Carmel, Efraim, Horeb, Ierusalim, Vestea Bună, Harul,
// Geneza, Învierea, Lumina, Nădejdea Vie, Ekklesia, Elim in Cihei: outside the play area).
//   SITE.skip: the buildings replaced;  SITE.places: empty, the four tier-(a) sights live in places.js
//   build(base) -> { update, clear, footprints, stats }   stats.verts: vertices per building, stats.callsPhone: meshes in the central group
import { Group } from 'three';
import { rng, inPoly } from '../../cherkasy/geo.js';
import { nightK } from '../../../render/daylight.js';
import { KEYS, newSet, makeMats, finishSet, end } from './pentecostal/kit.js';
import { buildHall } from './pentecostal/hall.js';
import { KIT, SKIP as KIT_SKIP } from './pentecostal/specs.js';
import { buildBetania, BETANIA_ID } from './pentecostal/betania.js';
import { buildBetel, BETEL_ID } from './pentecostal/betel.js';
import { buildFiladelfia, FILADELFIA_ID } from './pentecostal/filadelfia.js';
import { buildTabor, TABOR_ID } from './pentecostal/tabor.js';

const ringOf = (map, id) => { const b = map.buildings.find((o) => o.id === id); if (!b) return null; const P = []; for (let i = 0; i < b.p.length; i += 2) P.push([b.p[i], b.p[i + 1]]); return P; };
const FAR_R = 1800;   // the phone tier's disc (phone.js CENTRE): what lies outside it goes in its own group

export const SITE = {
  id: 'pentecostal',
  label: 'Bisericile penticostale, adventiste și sălile Martorilor lui Iehova',
  skip: [...KIT_SKIP, BETANIA_ID, BETEL_ID, FILADELFIA_ID, TABOR_ID],
  places: [], // the sights live in places.js (the phone map loads no site)
  ground: true,
  build(base) {
    const { root, map, solids: S } = base, t0 = performance.now();
    const heightAt = base.ground?.heightAt ?? base.heightAt, r = rng(2310);
    const g = (x, z) => { const h = heightAt(x, z); return Number.isFinite(h) ? h : 3; };
    const M = makeMats(r);
    const layer = (name) => ({ name, B: newSet(), group: Object.assign(new Group(), { name }) });
    const main = layer('landmark-pentecostal'), far = layer('landmark-pentecostal-far');
    root.add(main.group, far.group);
    const footprints = [], lots = [], stats = { buildings: 0, windows: 0, skipped: [], verts: {} };
    const nv = () => [main, far].reduce((n, L) => n + KEYS.reduce((m, k) => m + (L.B[k].v ?? 0), 0), 0);
    const built = (res) => { footprints.push(...res.footprints); lots.push(...res.footprints.map((f) => f.poly)); stats.buildings++; stats.windows += res.stats?.windows ?? 0; };
    const run = (key, fn, L) => { const v0 = nv(); try { built(fn()); stats.verts[key] = nv() - v0; } catch (e) { console.error(`[oradea] pentecostal ${key} failed`, e); end(L.B); stats.skipped.push(key); } };
    const layerOf = (ring) => { const c = ring.reduce((s, p) => [s[0] + p[0] / ring.length, s[1] + p[1] / ring.length], [0, 0]); return Math.hypot(c[0], c[1]) > FAR_R ? far : main; };

    const hand = [   // the hand-built buildings: the way each one stands on, and the builder
      ['betania', BETANIA_ID, (L, ring) => buildBetania({ B: L.B, S, g, ring })],
      ['betel', BETEL_ID, (L, ring) => buildBetel({ B: L.B, S, g, ring })],
      ['filadelfia', FILADELFIA_ID, (L, ring) => buildFiladelfia({ B: L.B, S, g, ring })],
      ['tabor', TABOR_ID, (L, ring) => buildTabor({ B: L.B, S, g, ring })],
    ];
    for (const [key, id, fn] of hand) {
      const ring = ringOf(map, id);
      if (!ring) { stats.skipped.push(key); continue; }
      const L = layerOf(ring);
      run(key, () => fn(L, ring), L);
    }
    for (const spec of KIT) {
      const ring = ringOf(map, spec.id);
      if (!ring) { stats.skipped.push(spec.key); continue; }
      const L = layerOf(ring);
      run(spec.key, () => buildHall({ B: L.B, S, g, spec, ring }), L);
    }

    const a = finishSet(main.group, main.B, M, 'pentecostal'), b = finishSet(far.group, far.B, M, 'pentecostal-far');
    stats.meshes = a.meshes + b.meshes; stats.verts.total = a.verts + b.verts; stats.callsPhone = a.meshes;
    console.log(`[oradea] Pentecostal / Adventist / Kingdom Halls: ${stats.buildings} buildings, ${((a.verts + b.verts) / 1000).toFixed(1)}k verts, ${a.meshes} + ${b.meshes} meshes in ${(performance.now() - t0).toFixed(0)} ms${stats.skipped.length ? ', skipped ' + stats.skipped.join(',') : ''}`);

    const near = (poly, x, z, m) => {
      if (inPoly(poly, x, z)) return true;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const ax = poly[j][0], az = poly[j][1], dx = poly[i][0] - ax, dz = poly[i][1] - az, L2 = dx * dx + dz * dz || 1;
        const f = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2));
        if (Math.hypot(x - ax - dx * f, z - az - dz * f) < m) return true;
      }
      return false;
    };
    return {
      footprints, stats,
      clear: (x, z) => lots.some((q) => near(q, x, z, 4)),
      update() {
        const k = nightK.value, e = Math.min(1, 3 * k);
        M.lit.emissiveIntensity = 0.9 * k; M.wall.emissiveIntensity = 0.08 * e;
      },
    };
  },
};
