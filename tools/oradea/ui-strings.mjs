// Lists upstream's Ukrainian UI text runs and keeps src/world/oradea/ui.js in step with them: every run the Oradea
// build will translate (tools/oradea/strings.mjs finds the strings, src/i18n.js RUN cuts them) gets an entry
// "run": [ro, en]; translations already there are kept, runs upstream dropped go, new ones arrive as [null, null].
// Run: npm run strings:oradea   (prints the files and the count still untranslated)
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { uiStrings, SKIP } from './strings.mjs';
import { RUN, runKey } from '../../src/i18n.js';

const ROOT = new URL('../../', import.meta.url).pathname, SRC = join(ROOT, 'src'), OUT = join(SRC, 'world/oradea/ui.js');
const files = [];
(function scan(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) scan(p); else if (p.endsWith('.js') && !SKIP.test(p)) files.push(p); } })(SRC);
const old = existsSync(OUT) ? (await import(OUT + '?t=' + Date.now())).UI : {};
const byFile = new Map();
for (const f of files.sort()) {
  const keys = [];
  for (const s of uiStrings(readFileSync(f, 'utf8'))) for (const m of s.text.matchAll(RUN)) { const k = runKey(m[0]); if (k && !keys.includes(k)) keys.push(k); }
  if (keys.length) byFile.set(relative(SRC, f), keys);
}
const seen = new Set();
let body = '', missing = 0;
for (const [f, keys] of byFile) {
  const fresh = keys.filter((k) => !seen.has(k));
  if (!fresh.length) continue;
  body += `  // ${f}\n`;
  for (const k of fresh) {
    seen.add(k);
    const v = old[k] ?? [null, null];
    if (v[0] == null || v[1] == null) missing++;
    body += `  ${JSON.stringify(k)}: [${JSON.stringify(v[0])}, ${JSON.stringify(v[1])}],\n`;
  }
}
writeFileSync(OUT, `// Upstream's Ukrainian UI text runs -> [Romanian, English] for the Oradea build (src/world/oradea/tr.js). The keys come
// from \`npm run strings:oradea\` (tools/oradea/ui-strings.mjs), the translations are by hand; null falls back to Ukrainian.
export const UI = {
${body}};
`);
console.log(`${seen.size} runs in ${byFile.size} files, ${missing} untranslated -> ${relative(ROOT, OUT)}`);
