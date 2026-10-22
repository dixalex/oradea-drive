# Buildings OSM lacks, for build_map.mjs (config tools.extraBuildings): Overture Maps' buildings theme in the Oradea
# bbox, minus the ones whose geometry comes from OpenStreetMap (the map has those already). In Oradea that leaves the
# Microsoft ML footprints (ODbL): most of the houses on the hills, which OSM does not map.
#   uv run --with duckdb python -I tools/oradea/fetch_overture.py   (npm run fetch:oradea:extra)
# -> tools/cherkasy/raw/oradea/overture_buildings.geojsonl, one GeoJSON feature per line { dataset, id }
# Anonymous S3 read; the bbox column lets parquet row-group pruning skip almost all of the global set (~0.5 GB read,
# ~30 s). RELEASE: the "latest" in https://stac.overturemaps.org/catalog.json when last run.
import duckdb, os, time
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RELEASE = os.environ.get('OVERTURE_RELEASE', '2026-09-23.1')
S, W, N, E = 47.005, 21.82, 47.11, 22.03  # config.js tools.bbox
URL = f"s3://overturemaps-us-west-2/release/{RELEASE}/theme=buildings/type=building/*"
OUT = os.path.join(ROOT, 'tools', 'cherkasy', 'raw', 'oradea', 'overture_buildings.geojsonl')

con = duckdb.connect()
con.execute("INSTALL httpfs; LOAD httpfs; INSTALL spatial; LOAD spatial; SET s3_region='us-west-2'; SET geometry_always_xy = true;")
t = time.time()
if os.path.exists(OUT): os.remove(OUT)
con.execute(f"""
COPY (
  SELECT id, sources[1].dataset AS dataset, geometry
  FROM read_parquet('{URL}', hive_partitioning=1)
  WHERE bbox.xmin <= {E} AND bbox.xmax >= {W} AND bbox.ymin <= {N} AND bbox.ymax >= {S}
    AND sources[1].dataset <> 'OpenStreetMap'
) TO '{OUT}' WITH (FORMAT GDAL, DRIVER 'GeoJSONSeq')""")
n = sum(1 for _ in open(OUT))
print(f"overture {RELEASE}: {n} non-OSM footprints in {time.time() - t:.0f} s -> {OUT}")
