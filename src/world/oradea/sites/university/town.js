// OWNER: oradea. The town universities (not a site module), one builder per root group of university.js.
//   buildCentre(ctx, kit)  Medicine and Pharmacy (+ its west neighbour) and Partium         -> { res, skip, clear }
//   buildLaw(ctx, kit)     Law, Environmental Protection and the Faculty of Construction    -> { res, skip, clear }
//   buildAgora(ctx, kit)   Universitatea Agora (the courtyard complex at Piața Tineretului)  -> { res, skip, clear }
import { TOWN } from './data.js';
import { buildMedicine } from './medicine.js';
import { buildPartium } from './partium.js';

const kitBlocks = (ctx, kit, grp, res, skip) => {
  for (const spec of TOWN.filter((q) => q.grp === grp)) { const r = kit.block(spec); if (r) { res[spec.id] = r; skip.push(spec.id); } }
};

export function buildCentre(ctx, kit) {
  const res = {}, skip = [];
  const med = buildMedicine(ctx, kit);
  if (med) { res.med = med.res; skip.push(med.res.spec.id); if (med.res1) { res.med1 = med.res1; skip.push(med.res1.spec.id); } }
  const par = buildPartium(ctx, kit);
  Object.assign(res, par.res); skip.push(...par.skip);
  kitBlocks(ctx, kit, 'centre', res, skip);
  return { res, skip, clear: () => false };
}

export function buildLaw(ctx, kit) {
  const res = {}, skip = [];
  kitBlocks(ctx, kit, 'law', res, skip);
  return { res, skip, clear: () => false };
}

export function buildAgora(ctx, kit) {
  const res = {}, skip = [];
  kitBlocks(ctx, kit, 'agora', res, skip);
  return { res, skip, clear: () => false };
}
