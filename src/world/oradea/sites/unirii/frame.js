// Piața Unirii, Oradea: the site frame shared by the square, the statue and the three buildings.
//   Local metres (e, s): e runs east (toward the Black Eagle palace), s south (toward the Moon Church), the origin is the
//   OSM node of the equestrian statue (n506476057). The long axis of the square is 15 degrees off the map's z axis: the
//   street grid of the centre is turned -30.5 degrees from north and the square lies across it.
//   toMap(e, s) -> [x, z];  toLocal(x, z) -> [e, s];  yawOf(e, s) -> the map yaw (radians, M4 convention) of a local
//   direction;  O, E, S: the origin and the two unit vectors in map x / z;  ring(flat) -> local points of a flat map ring
//   mapRing(local points) -> flat map ring.
export const O = [-15.5, 49.4];
const A = 15 * Math.PI / 180, C = Math.cos(A), N = Math.sin(A);
export const E = [C, -N], S = [N, C];

export const toMap = (e, s) => [O[0] + e * E[0] + s * S[0], O[1] + e * E[1] + s * S[1]];
export const toLocal = (x, z) => { const dx = x - O[0], dz = z - O[1]; return [dx * E[0] + dz * E[1], dx * S[0] + dz * S[1]]; };
// M4(x, y, z, yaw) turns local +x to world (cos yaw, 0, -sin yaw) and local +z to (sin yaw, 0, cos yaw); this is the yaw
// that sends local +z to the site direction (de, ds)
export const yawOf = (de, ds) => { const x = de * E[0] + ds * S[0], z = de * E[1] + ds * S[1]; return Math.atan2(x, z); };

export const ring = (flat) => { const out = []; for (let i = 0; i < flat.length; i += 2) out.push(toLocal(flat[i], flat[i + 1])); return out; };
export const mapRing = (pts) => pts.flatMap(([e, s]) => toMap(e, s));
