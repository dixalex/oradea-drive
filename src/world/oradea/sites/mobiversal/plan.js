// OWNER: oradea. The plan of the Mobiversal house (Strada Thurzó Sándor 40, Oradea): numbers only, no three.js, so the partner table
// (sites/partners.js) and the test can read it without loading the model. Not a site module; ../mobiversal.js builds it.
// Local frame: X runs along the front wall from its north end to its south end, Y up from the floor line, Z out toward the street
// (Z < 0 is inside the building). FR is the map frame of it; toWorld(X, Z) -> [x, z] and toLocal(x, z) -> [X, Z] map metres.
//   The footprint follows the city generator's Overture outline 3000001278 (328 m2: front 20.5 m, depth 15.4 m, a 1.8 m bay on the
//   south-east corner) squared up; the front wall's length and the two heights come from the Google Street View panoramas of 2024.
export const O = [1330.0, 1850.4];
const [ux, uz] = [0.0681, 0.99768];
export const FR = { O, ux, uz, th: -Math.atan2(uz, ux), ang: Math.atan2(uz, ux) };
export const toWorld = (X, Z) => [O[0] + X * ux - Z * uz, O[1] + X * uz + Z * ux];
export const toLocal = (x, z) => { const dx = x - O[0], dz = z - O[1]; return [dx * ux + dz * uz, -dx * uz + dz * ux]; };

// ---- the volumes
export const L = 20.1;          // front wall
export const D1 = 15.5;         // depth of the main body
export const D2 = 17.3;         // depth of the south-east bay (X > XB)
export const XB = 15.5;         // where the bay starts
export const XS = 9.75;         // the step: the low block is X < XS, the tall block X > XS
export const H_G = 3.05;        // the dark ground-floor cladding's top
export const H_LOW = 9.06;      // top of the low block's parapet
export const H_TALL = 11.6;     // top of the tall block
export const F1 = 4.3, F2 = 7.85; // floor levels (windows sit 0.9 m over them)

// the outline as [X, Z] pairs, clockwise seen from above in map metres (north end of the front first)
export const OUTLINE_LOCAL = [[0, 0], [L, 0], [L, -D2], [XB, -D2], [XB, -D1], [0, -D1]];
const r1 = (v) => Math.round(v * 10) / 10;
// the partner table takes [x, z] pairs; places.js carries the same numbers flat
export const MOBIVERSAL_RING = OUTLINE_LOCAL.map(([X, Z]) => toWorld(X, Z).map(r1));

// ---- the lot (local frame): the fenced yard and the strip behind
export const LOT = { x0: -1.6, x1: 21.6, z0: -18.6, z1: 14.6 };
export const GATE_X = 10.3;     // the street fence ends here (house-number post); the entrance is open from here to the south fence
