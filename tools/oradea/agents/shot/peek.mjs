// The phone page's 3D peek for each Oradea place: opens it headless, steps it, saves a picture, reports errors.
//   node peek.mjs --port 5175 --out /abs/dir [--ids a,b,c]
import { chromium } from 'playwright';
const args = process.argv.slice(2), opt = { port: 5175, out: './peek', ids: '' };
for (let i = 0; i < args.length; i += 2) opt[args[i].replace(/^--/, '')] = args[i + 1];
// One game browser at a time on this machine (each holds the whole city, ~2-3 GB): wait for the lock, and for the
// Mac to have at least 30 % memory free, before launching. The lock is a directory; a dead holder's lock is taken over.
import { mkdirSync, rmSync, writeFileSync, readFileSync as rf } from 'node:fs';
import { execSync } from 'node:child_process';
const LOCK = (await import('node:path')).join((await import('node:os')).tmpdir(), 'oradea-game-browser.lock');
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
const freePct = () => { try { return +/free percentage: (\d+)/.exec(execSync('memory_pressure', { encoding: 'utf8' }))[1]; } catch { return 100; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let waited = 0; ; waited += 2) {
  try { mkdirSync(LOCK); writeFileSync(`${LOCK}/pid`, String(process.pid)); break; } catch {
    let pid = 0; try { pid = +rf(`${LOCK}/pid`, 'utf8'); } catch {}
    if (pid && !alive(pid)) { rmSync(LOCK, { recursive: true, force: true }); continue; }
    if (waited % 30 === 0) console.error(`[shot] waiting for another screenshot run (pid ${pid}) to finish…`);
    await sleep(2000);
  }
}
const unlock = () => { try { if (+rf(`${LOCK}/pid`, 'utf8') === process.pid) rmSync(LOCK, { recursive: true, force: true }); } catch {} };
process.on('exit', unlock); for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => { unlock(); process.exit(1); });
for (let waited = 0; freePct() < 30; waited += 5) { if (waited % 60 === 0) console.error(`[shot] only ${freePct()}% memory free, waiting…`); await sleep(5000); }
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage({ viewport: { width: 420, height: 860 }, isMobile: true, hasTouch: true });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(`http://127.0.0.1:${opt.port}/?mobile&nosound&lang=en`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => window.__mapview?.peek && window.__mapview.painter?.places?.length, null, { timeout: 120000, polling: 500 });
  const all = await page.evaluate(() => window.__mapview.painter.places.map((p) => [p.id, window.__mapview.peek.has(p)]));
  console.log('places on the phone map:', all.length, '| with a 3D model:', all.filter((a) => a[1]).length, '| without:', all.filter((a) => !a[1]).map((a) => a[0]).join(' ') || '-');
  const ids = opt.ids ? opt.ids.split(',') : all.filter((a) => a[1]).map((a) => a[0]);
  for (const id of ids) {
    const n0 = errs.length, t0 = Date.now();
    const r = await page.evaluate(async (id) => {
      const P = window.__mapview.peek, p = window.__mapview.painter.places.find((q) => q.id === id);
      await P.open(p);
      const s = P.tick(60);
      const failed = document.querySelector('.pk-failed, .failed') != null;
      return { s, failed, open: P.isOpen, hasView: !!P.view };
    }, id);
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${opt.out}/${id}.png` });
    await page.evaluate(() => window.__mapview.peek.close());
    console.log(`${id}: ${r.hasView ? 'ok' : 'NO VIEW'} ${Date.now() - t0} ms, calls ${r.s?.calls}, tris ${r.s?.tris}${errs.length > n0 ? ' | ERRORS: ' + errs.slice(n0).join(' / ').slice(0, 300) : ''}`);
  }
} finally { await browser.close(); unlock(); }
