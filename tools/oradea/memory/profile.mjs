// Memory profile of the Oradea game load (ORADEA-MOBILE.md): a sampling heap profile (live JS objects by allocating
// source file / function), the heap per loading stage, V8 heap vs typed-array backing stores, the Chrome processes' RSS.
//   node profile.mjs --port 5180 --out /abs/dir/name [--query "&notraffic"] [--q low] [--track 1] [--patch edits.json]
//     --track 1: abtrack.js attributes every live ArrayBuffer to the code that made it (typed-array constructors,
//       worker messages, fetches); --patch: [{ url, find, replace }] edits served modules in this browser only, to try a
//       fix without touching the repo.
// Needs playwright where it runs (npm i playwright) and Google Chrome. Measure against a dev server without live reload
// (vite.nohmr.mjs), or a file edit reloads the page mid-run:
//   VITE_CITY=oradea npx vite --config tools/oradea/memory/vite.nohmr.mjs --port 5180 --strictPort --host 127.0.0.1
// One game browser at a time on the machine (a lock in the temp folder) and 30 % memory free before it starts.
import { chromium } from 'playwright';
import { mkdirSync, rmSync, writeFileSync, readFileSync as rf } from 'node:fs';
import { execSync } from 'node:child_process';

const args = process.argv.slice(2), opt = { port: 5175, out: './prof', query: '', q: 'low' };
for (let i = 0; i < args.length; i += 2) opt[args[i].replace(/^--/, '')] = args[i + 1];
const LOCK = (await import('node:path')).join((await import('node:os')).tmpdir(), 'oradea-game-browser.lock');
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
const freePct = () => { try { return +/free percentage: (\d+)/.exec(execSync('memory_pressure', { encoding: 'utf8' }))[1]; } catch { return 100; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let waited = 0; ; waited += 2) {
  try { mkdirSync(LOCK); writeFileSync(`${LOCK}/pid`, String(process.pid)); break; } catch {
    let pid = 0; try { pid = +rf(`${LOCK}/pid`, 'utf8'); } catch {}
    if (pid && !alive(pid)) { rmSync(LOCK, { recursive: true, force: true }); continue; }
    if (waited % 30 === 0) console.error(`[prof] waiting for the lock (pid ${pid})…`);
    await sleep(2000);
  }
}
const unlock = () => { try { if (+rf(`${LOCK}/pid`, 'utf8') === process.pid) rmSync(LOCK, { recursive: true, force: true }); } catch {} };
process.on('exit', unlock); for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { unlock(); process.exit(1); });
while (freePct() < 30) await sleep(5000);

const MB = (b) => Math.round(b / 1e6);
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-precise-memory-info'] });
const out = { opt, timeline: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  // --patch file.json: [{ url, find, replace }] edits served modules in this browser only (an experiment, the repo untouched)
  if (opt.patch) for (const p of JSON.parse(rf(opt.patch, 'utf8'))) await page.route((u) => u.href.includes(p.url) && !u.href.includes('worker'), async (route) => {
    const res = await route.fetch(), body = await res.text();
    if (!body.includes(p.find)) console.error('[patch] not found in', p.url, ':', p.find.slice(0, 60));
    await route.fulfill({ response: res, body: body.replace(p.find, p.replace) });
  });
  if (opt.track) await page.addInitScript({ path: new URL('./abtrack.js', import.meta.url).pathname });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('HeapProfiler.enable');
  await cdp.send('HeapProfiler.startSampling', { samplingInterval: 32768 });
  const t0 = Date.now();
  await page.goto(`http://127.0.0.1:${opt.port}/?nosound&lang=en&fresh&stilltime${opt.query}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(1500); await page.keyboard.press('Space').catch(() => {});
  // the heap per loading stage until the world is up
  for (;;) {
    const s = await page.evaluate(() => ({ heap: performance.memory?.usedJSHeapSize ?? 0, msg: document.querySelector('#loading .msg')?.textContent ?? '', up: !!window.__game?.world?.cherkasy }));
    const last = out.timeline.at(-1);
    if (!last || last.msg !== s.msg || Math.abs(last.heapMB - MB(s.heap)) > 40) out.timeline.push({ t: (Date.now() - t0) / 1000, heapMB: MB(s.heap), msg: s.msg });
    if (s.up) break;
    if (Date.now() - t0 > 240000) throw new Error('world did not come up');
    await sleep(250);
  }
  await page.keyboard.press('Space').catch(() => {});
  await page.evaluate((q) => { if (q) window.__game.setQuality?.(q); window.tick?.(60); }, opt.q);
  await page.waitForTimeout(1000);
  await cdp.send('HeapProfiler.collectGarbage');
  out.heapUsage = await cdp.send('Runtime.getHeapUsage');
  out.memory = await page.evaluate(() => ({ used: performance.memory.usedJSHeapSize, total: performance.memory.totalJSHeapSize }));
  if (opt.track) { await page.waitForTimeout(1500); await cdp.send('HeapProfiler.collectGarbage'); await page.waitForTimeout(1500); out.ab = await page.evaluate(() => window.__ab.report(0.4e6)); }
  const { profile } = await cdp.send('HeapProfiler.getSamplingProfile');
  await cdp.send('HeapProfiler.stopSampling');
  // processes
  try { out.ps = execSync(`ps -axo rss,command | grep -i "chrom" | grep -v grep | grep -E "type=(renderer|gpu-process)|Google Chrome for Testing|headless" | sort -nr | head -6`, { encoding: 'utf8' }).split('\n').filter(Boolean).map((l) => { const [rss, ...c] = l.trim().split(/\s+/); return { rssMB: MB(+rss * 1024), what: (/--type=([a-z-]+)/.exec(c.join(' ')) ?? [, 'browser'])[1] }; }); } catch {}

  // attribute each sampled allocation to the nearest frame in our own code (src/), and to the module under the loader
  const own = (u) => /\/src\//.test(u) && !/node_modules/.test(u);
  const short = (u) => u.replace(/^.*\/src\//, 'src/').replace(/\?.*$/, '');
  const byFile = new Map(), byFn = new Map(), byLeaf = new Map(); let total = 0;
  const walk = (n, stack) => {
    const st = [...stack, n.callFrame];
    if (n.selfSize) {
      total += n.selfSize;
      const mine = [...st].reverse().find((f) => own(f.url));
      const file = mine ? short(mine.url) : '(not our code: ' + (st.at(-1).functionName || st.at(-1).url.replace(/^.*\//, '') || 'native') + ')';
      byFile.set(file, (byFile.get(file) ?? 0) + n.selfSize);
      const fn = mine ? `${file}:${mine.lineNumber + 1} ${mine.functionName || '(anon)'}` : file;
      byFn.set(fn, (byFn.get(fn) ?? 0) + n.selfSize);
      const leaf = st.at(-1); const lk = `${leaf.functionName || '(anon)'} @ ${leaf.url.replace(/^.*\//, '').replace(/\?.*$/, '')}`;
      byLeaf.set(lk, (byLeaf.get(lk) ?? 0) + n.selfSize);
    }
    for (const c of n.children ?? []) walk(c, st);
  };
  walk(profile.head, []);
  const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => [MB(v), k]);
  out.sampledMB = MB(total);
  out.byFile = top(byFile, 40); out.byFn = top(byFn, 50); out.byLeaf = top(byLeaf, 25);
} finally { await browser.close(); unlock(); }
writeFileSync(`${opt.out}.json`, JSON.stringify(out, null, 1));
console.log(`heap used ${MB(out.memory?.used ?? 0)} MB; V8 heap ${MB(out.heapUsage?.usedSize ?? 0)} MB, typed-array backing stores ${MB(out.heapUsage?.backingStorageSize ?? 0)} MB, embedder ${MB(out.heapUsage?.embedderHeapUsedSize ?? 0)} MB; sampled ${out.sampledMB} MB`);
console.log('processes', JSON.stringify(out.ps));
if (out.ab) { console.log(`tracked live array buffers ${out.ab.totalMB} MB`); for (const r of out.ab.rows.slice(0, 60)) console.log('  ' + r); }
console.log('timeline'); for (const s of out.timeline) console.log(`  ${s.t.toFixed(1)}s ${s.heapMB} MB  ${s.msg}`);
console.log('by file'); for (const [m, k] of out.byFile.slice(0, 30)) console.log(`  ${String(m).padStart(5)} MB  ${k}`);
console.log('by function'); for (const [m, k] of out.byFn.slice(0, 30)) console.log(`  ${String(m).padStart(5)} MB  ${k}`);
console.log('by allocating leaf'); for (const [m, k] of out.byLeaf.slice(0, 15)) console.log(`  ${String(m).padStart(5)} MB  ${k}`);
