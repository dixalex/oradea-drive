// Headless screenshots of the Oradea game (own browser per call, so parallel agents don't fight over one tab).
//   node shot.mjs --port 5176 --out /abs/dir/name --cam x,y,z,tx,ty,tz [--cam ...] [--time day|sunset|dusk] [--q low]
//     [--query "&notraffic&nopeds"] [--size 1280x720] [--eval "js run once the world is up"] [--hud 1] [--route urlpart=file]
//     [--ground 1]  (each --cam's y and ty are metres over the ground at its x, z)
// Writes <out>-<k>.png per --cam (k from 1). Uses the installed Google Chrome (channel 'chrome'), headless, GPU on.
// The game is stepped with window.tick (no real-time loop), the camera held with __game.world.cherkasy.setCam.
import { chromium } from 'playwright';

const args = process.argv.slice(2), cams = [];
const opt = { port: 5176, out: './shot', time: 'day', query: '&notraffic', size: '1280x720', q: '', eval: '' };
for (let i = 0; i < args.length; i += 2) { const k = args[i].replace(/^--/, ''), v = args[i + 1]; if (k === 'cam') cams.push(v.split(',').map(Number)); else opt[k] = v; }
if (!cams.length) { console.error('need at least one --cam x,y,z,tx,ty,tz'); process.exit(2); }
const [W, H] = opt.size.split('x').map(Number);
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
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.addInitScript(() => { try { localStorage.setItem('cherkasy.news.roadster', '1'); } catch {} });
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  // --route <url part>=<local file>: serve a local file instead (a test asset, without touching public/)
  if (opt.route) { const [part, file] = opt.route.split('='); const { readFileSync } = await import('node:fs'); const body = readFileSync(file);
    await page.context().route((u) => u.href.includes(part), (r) => { console.log('routed', part); return r.fulfill({ status: 200, body, contentType: 'application/json' }); }); }
  const c0 = cams[0];
  await page.goto(`http://127.0.0.1:${opt.port}/?nosound&lang=en&fresh&stilltime&paused&cam=${c0.join(',')}${opt.query}`, { waitUntil: 'load', timeout: 120000 });
  // the consent card: any key accepts it
  await page.waitForTimeout(1500); await page.keyboard.press('Space').catch(() => {});
  await page.waitForFunction(() => window.__game?.world?.cherkasy && typeof window.tick === 'function', null, { timeout: 180000, polling: 500 });
  await page.keyboard.press('Space').catch(() => {});
  await page.waitForTimeout(300);
  if (opt.hud !== '1') await page.keyboard.press('F2').catch(() => {}); // HUD off unless --hud 1
  await page.evaluate(({ time, q }) => {
    if (q) window.__game.setQuality?.(q);
    window.__game.daylight?.setPreset?.(time);
  }, { time: opt.time, q: opt.q });
  if (opt.eval) console.log('eval ->', await page.evaluate(opt.eval));
  for (const [k, cam] of cams.entries()) {
    await page.evaluate(({ c, rel }) => {
      if (rel) { const g = (x, z) => window.__game.world.cherkasy.ground.heightAt(x, z); c = [c[0], g(c[0], c[2]) + c[1], c[2], c[3], g(c[3], c[5]) + c[4], c[5]]; }
      window.__game.world.cherkasy.setCam(c); window.tick(90);
    }, { c: cam, rel: opt.ground === '1' });
    await page.waitForTimeout(300);
    const file = `${opt.out}-${k + 1}.png`;
    await page.screenshot({ path: file });
    console.log('saved', file);
  }
} finally { await browser.close(); unlock(); }
