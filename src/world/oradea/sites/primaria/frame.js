// OWNER: oradea. The plan frame and the heights Primăria Oradea's modules (hall.js, portico.js, tower.js) share.
//   toMap(a, b) -> [x, z];  toLocal(x, z) -> [a, b]   a runs WSW along the south front (away from the square), b north
//   along the square front; EA / EB are the unit vectors of a / b in map metres
//   Y_PL, Y_TOP, Y_COR, Y_BAL, PAV_UP: heights above the floor F of the plinth top, the bays' top, the cornice slab, the
//   balustrade rail and how much higher the pavilion's cornice stands; ROOF: [inset, y] of the mansard's three rings
export const Q = [-77.3, 13.5], EA = [-0.97014, 0.24254], EB = [-0.24254, -0.97014];
export const toMap = (a, b) => [Q[0] + a * EA[0] + b * EB[0], Q[1] + a * EA[1] + b * EB[1]];
export const toLocal = (x, z) => [(x - Q[0]) * EA[0] + (z - Q[1]) * EA[1], (x - Q[0]) * EB[0] + (z - Q[1]) * EB[1]];
export const Y_PL = 1.1, Y_TOP = 16.2, Y_COR = 17.35, Y_BAL = 18.45, PAV_UP = 1.9;
export const ROOF = [[0.8, 17.0], [2.7, 21.3], [3.9, 22.9]];
// the clock tower: centre on the river street, the axis (t1) along the arm's north wall
export const TOWER = { c: [-139.4, -44.9], t1: [0.946, 0.329], t2: [-0.329, 0.946], hw: 3.5 };
