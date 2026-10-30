// Headless checks for «Secretele Oradiei» (src/world/oradea/quests.js) and the quest book's quiet cards: node tests/oradea-quests.test.mjs
// The data, in Romanian and in English (t() resolves once per load, so the file runs itself again with ?lang=ro): every
// card, held ones too, is complete, sourced, inside the Oradea map and within reach of a motor road, with no em-dashes.
// The logic: a quiet card pays nothing and plays no jingle, and the set's bonus comes with the last other card.
// The wiring: the Oradea config offers the quest and leaves the mugging mission out.
import fs from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const RO = process.argv.includes('--ro');
if (RO) globalThis.location = { search: '?lang=ro' };
const THREE = await import('three');
const { createQuests, curbSpot } = await import('../src/game/quests.js');
const { SECRETE, HELD } = await import('../src/world/oradea/quests.js');
const { LANG } = await import('../src/i18n.js');
const { FRAME_OF } = await import('../src/world/cherkasy/frame.js');

let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL', msg); } else console.log('ok  ', msg); };

const map = JSON.parse(fs.readFileSync(new URL('../public/assets/oradea/map.json', import.meta.url)));
const f = FRAME_OF(map), R = map.region;

// ---- the data
ok(LANG === (RO ? 'ro' : 'en'), `texts in ${LANG}`);
const q = SECRETE;
ok(q.id && q.title && q.icon && q.blurb && q.unit && q.reward > 0 && q.rewardAll > 0 && q.cards.length >= 20, `quest ${q.id}: complete (${q.cards.length} cards)`);
ok(!/—/.test(`${q.title}${q.blurb}${q.unit}`), 'quest texts: no em-dash');
const ids = new Set(), bad = [];
for (const c of [...q.cards, ...HELD]) {
  const why = [];
  if (ids.has(c.id)) why.push('duplicate id'); ids.add(c.id);
  if (!c.title || !c.icon || !c.hint || !c.story) why.push('missing text');
  if (!/^https:\/\//.test(c.source?.url || '') || !c.source?.name) why.push('no source');
  if (/—/.test(`${c.title}${c.hint}${c.story}`)) why.push('em-dash');
  if (/[Ѐ-ӿ]/.test(`${c.title}${c.hint}${c.story}`)) why.push('Cyrillic');
  if (c.hint.length > 200 || c.story.length > 800) why.push('too long');
  const [x, z] = f.toXZ(...(c.at || c.ll));
  if (!(x > R.x0 && x < R.x1 && z > R.z0 && z < R.z1)) why.push('outside the map');
  else if (!curbSpot(map, x, z, 120)) why.push('no motor road within 120 m');
  if (why.length) bad.push(`${c.id}: ${why.join(', ')}`);
}
ok(!bad.length, `${ids.size} cards valid${bad.length ? ` – ${bad.join('; ')}` : ''}`);
ok(HELD.some((c) => c.id === 'eva' && c.quiet) && !q.cards.some((c) => HELD.includes(c)), 'the held cards stay out of the quest; Eva\'s is quiet');

if (!RO) {
  // ---- quiet cards, on the real map with a flat ground
  const quest = { ...q, id: 'test', cards: [q.cards[0], { ...HELD[0] }, q.cards[1]] };
  const mem = new Map(), storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)) };
  const world = { cherkasy: { map }, groundHeight: () => 0 };
  const player = { position: new THREE.Vector3(0, 0.5, 0) };
  const banners = [];
  let money = 0;
  const Q = createQuests({ world, player, scene: new THREE.Scene(), hud: { mission: { banner: (t, s) => banners.push([t, s]) } },
    reward: (n) => { money += n; }, quests: [quest], storage, container: null });
  Q.setActive('test');
  const [a, quiet, b] = Q.list[0].cards;
  Q.find(a.id);
  ok(money === quest.reward, `a card pays ${quest.reward}`);
  Q.find(quiet.id);
  ok(quiet.found && money === quest.reward && !/₴|lei/.test(banners.at(-1)[1]), 'the quiet card is found, pays nothing and its banner names no money');
  Q.find(b.id);
  ok(money === quest.reward * 2 + quest.rewardAll, `the last other card brings the bonus (${money})`);
  Q.dispose();

  // ---- the wiring
  const cfg = fs.readFileSync(new URL('../src/world/oradea/config.js', import.meta.url), 'utf8');
  ok(/quests:\s*\[SECRETE\]/.test(cfg), 'the Oradea config offers the quest');
  ok(/missionsOff:\s*\['mugging'\]/.test(cfg), 'the Oradea config leaves the mugging mission out');
  ok(/CITY\?\.missionsOff\?\.includes\(k\)/.test(fs.readFileSync(new URL('../src/game/missions.js', import.meta.url), 'utf8')), 'missions.js reads the switch');

  // ---- the same data checks in Romanian
  const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--ro'], { encoding: 'utf8' });
  process.stdout.write(r.stdout.replace(/^/gm, '  ro '));
  ok(r.status === 0, 'Romanian texts pass the same checks');
}

console.log(fails ? `\n${fails} failed` : '\nall ok');
process.exit(fails ? 1 : 0);
