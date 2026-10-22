// Oradea's measured building heights, for tools/oradea/heights.py: the Copernicus Urban Atlas Building Block Height
// 2021 raster (10 m, EPSG:3035, CLMS, free and open with attribution) of the Oradea FUA, into
// tools/cherkasy/raw/oradea/bbh_2021.tif.
//   node tools/oradea/fetch_heights.mjs        (npm run heights:oradea fetches it when missing, then resamples it)
// The STAC search needs no login; the product download needs a free Copernicus Data Space account
// (https://dataspace.copernicus.eu), read from the macOS keychain item CDSE_ORADEA (account = the login email):
//   security add-generic-password -s CDSE_ORADEA -a you@example.com -w      (it prompts for the password)
// An account with two-factor login also needs the current code: CDSE_TOTP=123456 node tools/oradea/fetch_heights.mjs
// (token API: https://documentation.dataspace.copernicus.eu/APIs/Token.html).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const RAW = fileURLToPath(new URL('../cherkasy/raw/oradea/', import.meta.url));
const OUT = join(RAW, 'bbh_2021.tif');
const STAC = 'https://stac.dataspace.copernicus.eu/v1/collections/clms_ua_building-height_europe_10m_3yearly_v1/items?bbox=21.90,47.04,21.95,47.07&limit=5';
const TOKEN = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';

if (existsSync(OUT) && !process.env.FORCE) { console.log(`have ${OUT} (FORCE=1 fetches it again)`); process.exit(0); }
const item = (await (await fetch(STAC)).json()).features?.find((f) => /ORADEA/.test(f.id));
if (!item) throw new Error('no Oradea item in the CLMS building-height collection');
const product = item.assets.product.href;
console.log(`${item.id} -> ${product}`);

let user, pass;
try {
  const meta = execFileSync('security', ['find-generic-password', '-s', 'CDSE_ORADEA'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  user = /"acct"<blob>="([^"]*)"/.exec(meta)?.[1];
  pass = execFileSync('security', ['find-generic-password', '-s', 'CDSE_ORADEA', '-w'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
} catch { /* reported below */ }
if (!user || !pass) {
  console.error('No Copernicus login in the keychain. Make a free account at https://dataspace.copernicus.eu, then run:\n' +
    '  security add-generic-password -s CDSE_ORADEA -a <your login email> -w');
  process.exit(1);
}
const tok = await fetch(TOKEN, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: 'cdse-public', grant_type: 'password', username: user, password: pass, ...(process.env.CDSE_TOTP ? { totp: process.env.CDSE_TOTP } : {}) }) });
if (!tok.ok) throw new Error(`login failed: ${tok.status} ${await tok.text()}${process.env.CDSE_TOTP ? '' : ' (two-factor login on? run with CDSE_TOTP=<code>)'}`);
const auth = { authorization: `Bearer ${(await tok.json()).access_token}` };

// fetch drops the Authorization header on a cross-origin redirect, and the download redirects: follow by hand
let url = product, res;
for (let hop = 0; hop < 5; hop++) {
  res = await fetch(url, { headers: auth, redirect: 'manual' });
  if (res.status >= 300 && res.status < 400 && res.headers.get('location')) { url = new URL(res.headers.get('location'), url).href; continue; }
  break;
}
if (!res.ok) throw new Error(`download failed: ${res.status} ${await res.text()}`);
mkdirSync(RAW, { recursive: true });
const zip = join(RAW, 'bbh_2021.zip'), tmp = join(RAW, 'bbh_2021');
writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
rmSync(tmp, { recursive: true, force: true });
execFileSync('unzip', ['-q', '-o', zip, '-d', tmp]);
const find = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? find(p) : /\.tiff?$/i.test(f) ? [p] : []; });
const tif = find(tmp)[0];
if (!tif) throw new Error(`no GeoTIFF in ${zip}`);
renameSync(tif, OUT);
rmSync(tmp, { recursive: true, force: true }); rmSync(zip, { force: true });
console.log(`-> ${OUT} (${(statSync(OUT).size / 1e6).toFixed(1)} MB)`);
