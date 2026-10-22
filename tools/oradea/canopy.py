"""Where Oradea's trees really are, for the tree generator: public/assets/oradea/canopy.bin.

Source: Meta + WRI High Resolution Canopy Height Maps v2 (CHMv2, 1 m, Maxar/Vantor 2019 imagery), CC BY 4.0:
"Meta and World Resources Institute (WRI) - 2026. Version 2 High Resolution Canopy Height Maps (CHMv2). Source imagery
for CHM (c) 2016 Vantor." OSM maps only ~300 trees in Oradea, so the game would otherwise invent street rows everywhere.

  uv run --with rasterio --with numpy --with pyproj python -I tools/oradea/canopy.py      (npm run canopy:oradea)

1. The CHMv2 crop (tools/cherkasy/raw/oradea/chmv2_1m_utm34n.tif) is cut from the two web-mercator COG tiles with GDAL
   (Postgres.app's bin has it) when missing.
2. A 2 m grid of the max canopy height over the play region, in the game frame (config.js tools.frame / region).
3. canopy.bin: 4 m cells, a bit set where canopy >= 2 m lies within 4 m of the cell centre (the rule that matched the
   real tree-lined streets best). Int32 header [0x59504e43 ('CNPY'), x0, z0, cell, w, h], then the bits row-major
   (z rows from z0, x from x0), LSB first. ~530 KB.
"""
import json, math, os, shutil, subprocess, sys
from pathlib import Path
import numpy as np, rasterio
from pyproj import Transformer

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / 'tools/cherkasy/raw/oradea'; OUT = ROOT / 'public/assets/oradea/canopy.bin'
TIF = RAW / 'chmv2_1m_utm34n.tif'
cfg = (ROOT / 'src/world/oradea/config.js').read_text()
F = dict(lat0=47.0553, lon0=21.9289, rot=-30.5)  # config.js tools.frame
R = dict(x0=-6250, x1=5250, z0=-3000, z1=3000)  # config.js tools.region
assert "frame: { lat0: 47.0553, lon0: 21.9289, rot: -30.5 }" in cfg and "region: { x0: -6250, x1: 5250, z0: -3000, z1: 3000 }" in cfg, 'config.js frame / region changed: update canopy.py'

if not TIF.exists():
    gdal = shutil.which('gdal_translate') or '/Applications/Postgres.app/Contents/Versions/latest/bin/gdal_translate'
    bin_ = os.path.dirname(gdal); env = dict(os.environ, GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR', CPL_VSIL_CURL_ALLOWED_EXTENSIONS='.tif')
    B = '/vsicurl/https://dataforgood-fb-data.s3.amazonaws.com/forests/v2/global/dinov3_global_chm_v2_ml3/chm'
    vrt, m3857 = RAW / 'chmv2.vrt', RAW / 'chmv2_1m_3857.tif'
    co = ['-co', 'COMPRESS=DEFLATE', '-co', 'TILED=YES']
    subprocess.run([f'{bin_}/gdalbuildvrt', str(vrt), f'{B}/1202311332.tif', f'{B}/1202313110.tif'], check=True, env=env)
    subprocess.run([f'{bin_}/gdal_translate', '-projwin', '2427878', '5961683', '2453482', '5942074', *co, str(vrt), str(m3857)], check=True, env=env)
    subprocess.run([f'{bin_}/gdalwarp', '-q', '-t_srs', 'EPSG:32634', '-tr', '1', '1', '-r', 'near', *co, '-dstnodata', '255', str(m3857), str(TIF)], check=True, env=env)

KY = 111320.0; KX = KY * math.cos(math.radians(F['lat0'])); CR = math.cos(math.radians(F['rot'])); SR = math.sin(math.radians(F['rot']))
T = Transformer.from_crs(4326, 32634, always_xy=True)
ds = rasterio.open(TIF); chm = ds.read(1); X0, Y0 = ds.transform.c, ds.transform.f; H, W = chm.shape
to_ll = lambda x, z: (F['lat0'] + (x * SR - z * CR) / KY, F['lon0'] + (x * CR + z * SR) / KX)

CELL = 2.0; w = int((R['x1'] - R['x0']) / CELL); h = int((R['z1'] - R['z0']) / CELL)
gx = R['x0'] + (np.arange(w) + 0.5) * CELL; gz = R['z0'] + (np.arange(h) + 0.5) * CELL
grid = np.zeros((h, w), np.uint8)
for j in range(h):  # max over the four 1 m samples of each 2 m cell
    lat, lon = to_ll(gx, np.full(w, gz[j])); ux, uy = T.transform(lon, lat); ux = np.asarray(ux); uy = np.asarray(uy)
    best = np.zeros(w, np.uint8)
    for dx in (-0.5, 0.5):
        for dz in (-0.5, 0.5):
            e = dx * CR + dz * SR; n = dx * SR - dz * CR
            c = np.floor(ux + e - X0).astype(int); r = np.floor(Y0 - (uy + n)).astype(int)
            ok = (c >= 0) & (c < W) & (r >= 0) & (r < H)
            v = np.zeros(w, np.uint8); v[ok] = chm[r[ok], c[ok]]; v[v == 255] = 0
            best = np.maximum(best, v)
    grid[j] = best

tree = grid >= 2
# within 4 m: dilate by 2 cells (a disc), then 4 m cells take any of their 2 x 2
dil = np.zeros_like(tree)
for di in range(-2, 3):
    for dj in range(-2, 3):
        if di * di + dj * dj > 4: continue
        dil |= np.roll(np.roll(tree, di, 0), dj, 1)
h4, w4 = h // 2, w // 2
mask = dil[:h4 * 2, :w4 * 2].reshape(h4, 2, w4, 2).any(axis=(1, 3))
bits = np.packbits(mask.reshape(-1), bitorder='little')
hdr = np.array([0x59504e43, R['x0'], R['z0'], 4, w4, h4], '<i4')
OUT.write_bytes(hdr.tobytes() + bits.tobytes())
print(f'canopy >= 2 m on {tree.mean():.1%} of the region; mask {w4} x {h4} at 4 m, {mask.mean():.1%} set -> {OUT} ({OUT.stat().st_size // 1024} KB)')
