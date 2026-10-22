"""Measured building heights for build_map.mjs (config tools.heights): tools/cherkasy/raw/oradea/heights.bin.

Source: Copernicus Urban Atlas Building Block Height 2021, 10 m (tools/oradea/fetch_heights.mjs), "(c) European Union,
Copernicus Land Monitoring Service 2021, European Environment Agency (EEA)". OSM tags storeys on ~5 % of Oradea's
buildings, and the upstream guess (Soviet housing series) made the old centre's street blocks nine-storey slabs.

  uv run --with rasterio --with numpy --with pyproj python -I tools/oradea/heights.py     (npm run heights:oradea)
  BBH=<any height GeoTIFF> OUT=<file> override the input / output (a test raster, a newer edition).

heights.bin: the raster resampled (nearest) onto a 5 m grid in the game frame (config.js tools.frame / region). Int32
header [0x54484748 ('HGHT'), x0, z0, cell, w, h], then Uint16 decimetres row-major (z rows from z0, x from x0); 0 = no
building or no data. build_map.mjs turns a footprint's cells into storeys (tools/oradea/heights.mjs).
"""
import math, os
from pathlib import Path
import numpy as np, rasterio
from pyproj import Transformer

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / 'tools/cherkasy/raw/oradea'
SRC = Path(os.environ.get('BBH', RAW / 'bbh_2021.tif')); OUT = Path(os.environ.get('OUT', RAW / 'heights.bin'))
cfg = (ROOT / 'src/world/oradea/config.js').read_text()
F = dict(lat0=47.0553, lon0=21.9289, rot=-30.5)  # config.js tools.frame
R = dict(x0=-6250, x1=5250, z0=-3000, z1=3000)  # config.js tools.region
assert "frame: { lat0: 47.0553, lon0: 21.9289, rot: -30.5 }" in cfg and "region: { x0: -6250, x1: 5250, z0: -3000, z1: 3000 }" in cfg, 'config.js frame / region changed: update heights.py'
if not SRC.exists(): raise SystemExit(f'no {SRC}: run node tools/oradea/fetch_heights.mjs first')

ds = rasterio.open(SRC); band = ds.read(1).astype(np.float64); H, W = band.shape
nod = ds.nodata
bad = ~np.isfinite(band) | (band < 0) | (band > 400)
if nod is not None: bad |= band == nod
band[bad] = 0
inv = ~ds.transform
T = Transformer.from_crs(4326, ds.crs, always_xy=True)
KY = 111320.0; KX = KY * math.cos(math.radians(F['lat0'])); CR = math.cos(math.radians(F['rot'])); SR = math.sin(math.radians(F['rot']))
to_ll = lambda x, z: (F['lat0'] + (x * SR - z * CR) / KY, F['lon0'] + (x * CR + z * SR) / KX)

CELL = 5; w = (R['x1'] - R['x0']) // CELL; h = (R['z1'] - R['z0']) // CELL
gx = R['x0'] + (np.arange(w) + 0.5) * CELL
grid = np.zeros((h, w), np.uint16)
for j in range(h):
    lat, lon = to_ll(gx, np.full(w, R['z0'] + (j + 0.5) * CELL))
    px, py = T.transform(lon, lat)
    c, r = inv * (np.asarray(px), np.asarray(py)); c = np.floor(c).astype(int); r = np.floor(r).astype(int)
    ok = (c >= 0) & (c < W) & (r >= 0) & (r < H)
    v = np.zeros(w); v[ok] = band[r[ok], c[ok]]
    grid[j] = np.clip(np.round(v * 10), 0, 65535).astype(np.uint16)

hdr = np.array([0x54484748, R['x0'], R['z0'], CELL, w, h], '<i4')
OUT.write_bytes(hdr.tobytes() + grid.astype('<u2').tobytes())
on = grid[grid > 0] / 10
print(f'{SRC.name}: {ds.crs}, {W} x {H} px; heights on {(grid > 0).mean():.1%} of the region, median {np.median(on):.1f} m, '
      f'p90 {np.percentile(on, 90):.1f} m, max {on.max():.1f} m -> {OUT} ({OUT.stat().st_size // 1024} KB)')
