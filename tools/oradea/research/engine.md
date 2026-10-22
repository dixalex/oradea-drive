Research task, read-only: no code changes, no commits, no pull requests. You run inside the repo checkout (/Users/alexandertinyaev/Sites/oradea-drive): read ORADEA.md, ORADEA-MOBILE.md, ARCHITECTURE.md and the code as needed. Do not start the game, the dev server, a build or build_map (memory on this Mac is tight). Use web search and fetch for evidence.

QUESTION: Is it worth swapping the game engine of Oradea Drive for better graphics and better performance, especially on phones? Or should it stay on three.js and be fixed in place? Give a clear recommendation.

THE PROJECT
- Oradea Drive: an open-world driving and flying game of the real city of Oradea, Romania, in the browser. It is a hobby fork (for fun) of a friend's open-source game, Cherkasy Drive (Oleg's, AGPL-3.0, a Ukrainian city). The fork wants to keep pulling Oleg's upstream updates, so Oradea lives beside Cherkasy in the same codebase behind a city switch.
- Stack: three.js r186 WebGLRenderer (WebGL2) + Vite, plain ES modules, no framework. 318 JS files, about 79k lines: world/cherkasy 159 files / 48k lines (procedural city: OSM building extrusion, terrain and roads built in Web Workers, ~150 hand-built landmark modules), world/oradea 93 files / 15k lines, npc 13 / 3.8k (traffic sim with ~130 cars, ~600 GPU-animated pedestrians), game 13 / 3.7k (car physics, flight, missions), render 6 / 1.1k, ui 8 / 2.2k, kit 5 / 0.7k (MeshBuilder that emits three.js BufferGeometry). About 2,245 references to THREE in the code; 14 files use custom ShaderMaterial or onBeforeCompile; a custom collision world (no physics engine). Recount these from the repo if they look stale.
- Rendering: merged and tiled static meshes (256 m tiles, 2x2 per mesh), instanced LOD pools for ~92k trees, N8AO ambient occlusion -> bloom -> PBR Neutral tone mapping -> SMAA, three's SunLight with 2 shadow cascades, adaptive resolution, three graphics levels.
- City data: map.json 5.3 MB + map_buildings.json 4.7 MB (OSM-derived, ODbL) + 5.7 MB DEM, all loaded at start; ~30k buildings in a 69 km2 play area.

MEASURED (2026-10-21, desktop Chrome, after load; details in ORADEA-MOBILE.md)
- Chrome page process ~1.9-2.0 GB plus GPU process ~0.5 GB. Page memory 1,079 MB: 277 MB JS objects + 802 MB typed-array backing stores.
- Two closure leaks keep two extra copies of all building geometry; fixing them measured 1,079 -> 805 MB. About 378 MB of geometry also stays in JS after GPU upload.
- Draw calls high / medium / low: 647 / 562 / 382; triangles 4.3 / 3.9 / 2.9 M; 218 shader programs.
- Phone evidence gathered so far: iOS Safari tab soft limit near 1.5 GB per a WebKit engineer (bugs.webkit.org 277848), kills without warning (279637, 300782); developers report 300-500 MB total as safe on Safari (anecdotal); PlayCanvas manual suggests 100-200 draw calls on low-end phones.
- The current plan without an engine swap: (1) memory fixes, est. page memory down to 350-450 MB, 3-5 days; (2) a phone tier: touch controls, lighter post-processing, centre-only map on phones, 1-2 weeks; (3) streaming the city in tiles around the car, 3-6 weeks.

COMPARE AT LEAST
- Stay on three.js WebGLRenderer and fix (the plan above).
- three.js WebGPURenderer + TSL (node materials): what it changes for performance and visuals, mobile support (iOS Safari 26 ships WebGPU; WebGL2 fallback), migration cost for custom ShaderMaterial / onBeforeCompile code, BatchedMesh and compute.
- Babylon.js (WebGPU, frame graph, mobile track record, migration effort from three.js).
- PlayCanvas engine (mobile focus, batching, its own editor optional).
- Unity 6 Web (WebGPU/WebGL builds: download size, startup, memory on iOS, license terms vs an AGPL project).
- Godot 4 web export (performance, single-threaded web limits, iOS support).
- Others only if they are serious contenders (e.g. Bevy/wasm, Needle Engine, CesiumJS with 3D Tiles, Google Photorealistic 3D Tiles - check its terms).
For each: evidence of phone performance and memory on comparable scenes (large open worlds, cities, many draw calls), the graphics ceiling (lighting, shadows, GI, post-processing), migration cost for THIS codebase in weeks (most code is procedural geometry and game logic that could port; say what would have to be rewritten), what happens to pulling Oleg's upstream updates, licensing compatibility with AGPL-3.0 and ODbL data, download size and load time, community and tooling, and risk.
Also say plainly whether the problems measured above are engine problems or content / architecture problems (whole city loaded at once, leaks, too many draw calls), since that decides whether a swap helps.

EVIDENCE RULES
Every claim gets a source URL and its date. Prefer official docs, release notes, bug trackers, benchmarks with methodology, and developer write-ups with numbers. Mark anecdotal or unverified claims as such. Do not invent numbers; say when you could not find one.

OUTPUT
- Lead with the recommendation in two or three sentences: swap or not, to what, and why.
- Then a comparison table (engine x criteria above), the migration estimate in weeks for the top two options, the top risks, and a short numbered next-steps list.
- Under about 1,500 words. Plain English, short sentences, no em dashes, no marketing words.
- Write the full report to tools/oradea/research/reports/engine.md and return it as your final message.
