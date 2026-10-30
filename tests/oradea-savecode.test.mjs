// Headless checks for the save code (src/world/oradea/savecode.js): node tests/oradea-savecode.test.mjs
// A code carries every game key and nothing else, survives line breaks and spaces from a paste, turns away a cut or
// changed code, and restoring it gives back exactly the saved game state without touching other sites' keys.
import { encode, decode, restore } from '../src/world/oradea/savecode.js';

let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL', msg); } else console.log('ok  ', msg); };
const store = (o = {}) => {
  const m = new Map(Object.entries(o));
  return { get length() { return m.size; }, key: (i) => [...m.keys()][i] ?? null, getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), dump: () => Object.fromEntries(m) };
};

const saved = {
  'cherkasy.money': '4250', 'cherkasy.explore': JSON.stringify({ visited: ['unirii', 'cetate'], known: ['unirii', 'cetate', 'gara'] }),
  'cherkasy.quests': JSON.stringify({ active: 'secrete', found: ['rogerius', 'cetate-1660'] }), 'cherkasy.car': 'roadster',
  'cd.quality': 'low', 'oradea.lang': 'ro', 'cherkasy.mark': JSON.stringify({ x: 12.5, z: -340 }), 'cherkasy.note': 'Oradea – Piața Unirii ✓',
};
const A = store({ ...saved, 'other.site': 'keep me', 'theme': 'dark' });
const code = encode(A);
ok(/^OD1\.[A-Za-z0-9_-]+\.[0-9a-z]+$/.test(code), `the code is one line of safe characters (${code.length} chars)`);
const back = decode(code);
ok(back && Object.keys(back).length === Object.keys(saved).length && Object.entries(saved).every(([k, v]) => back[k] === v), 'it decodes to every game key, Unicode included');
ok(back && !('other.site' in back) && !('theme' in back), 'other keys stay out');
ok(JSON.stringify(decode(`  ${code.slice(0, 40)}\n${code.slice(40, 90)}\r\n ${code.slice(90)} `)) === JSON.stringify(back), 'line breaks and spaces from a paste are ignored');
ok(decode(code.slice(0, -6)) === null && decode(code.slice(0, code.length - 30) + code.slice(-8)) === null, 'a cut code is turned away');
const i = code.indexOf('.') + 5, flip = code[i] === 'A' ? 'B' : 'A';
ok(decode(code.slice(0, i) + flip + code.slice(i + 1)) === null, 'a changed character is turned away');
ok(decode('') === null && decode('hello') === null && decode(null) === null && decode('OD1..x') === null, 'empty or foreign text is turned away');

const B = store({ 'cherkasy.money': '10', 'cherkasy.pos': '[1,2,3]', 'other.site': 'mine' });
const n = restore(B, back);
const d = B.dump();
ok(n === Object.keys(saved).length && Object.entries(saved).every(([k, v]) => d[k] === v), `restore writes the saved keys (${n})`);
ok(!('cherkasy.pos' in d), 'a game key the code lacks is removed, so the state is the saved one');
ok(d['other.site'] === 'mine', 'other keys are left alone');
ok(encode(B) === code, 'the restored browser encodes to the same code');

console.log(fails ? `\n${fails} failed` : '\nall ok');
process.exit(fails ? 1 : 0);
