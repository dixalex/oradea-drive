# Oradea Drive on phones

The game needs about 2.4 GB on a desktop and draws 380–650 batches a frame. A phone tab is safe at roughly 300–500 MB
and 100–200 batches. Two code fixes already measured cut a quarter of the page's memory. The full path to phones is
four steps. Steps 1 and 2 also fix desktops and are about two weeks. Streaming the whole city on phones is 3–6 weeks.

## Where the memory goes

Measured 2026-10-21 in desktop Chrome, Oradea build, lowest graphics level, right after load, on a dev server with live
reload off (`tools/oradea/memory/`). Long drives were not measured.

| What | Size |
|---|---|
| Chrome page process / GPU process | ~1.9–2.0 GB / ~0.5 GB |
| Page memory (`performance.memory`) | 1,079 MB: 277 MB JS objects + 802 MB binary arrays |
| Binary arrays, building geometry | 332 MB, of which 159 MB is drawn: the rest is two intermediate copies kept alive by closures in `world/cherkasy/buildings.js` (`tiles`) and `kit/batch.js` (`geoms`) |
| Binary arrays, ground geometry and rasters | 167 MB (126 MB drawn, the rest is the asphalt / water / land rasters the game queries) |
| Geometry kept in JS after the GPU has a copy | 378 MB: ground 126, roofs 101, facades 58, trees 22, rails 22, wet bands 17 |
| Collision world | ~80 MB, Float64 arrays grown by doubling |
| Mesh-builder scratch kept alive | ~30 MB |
| Railways | ~80 MB: 20 MB geometry + ~59 MB of plain JS number arrays its builders keep |
| Roof-edge anchors (`zips`) | ~24 MB of JS objects |
| Draw load, high / medium / low | 647 / 562 / 382 draw calls, 4.3 / 3.9 / 2.9 M triangles, 218 shader programs |

## Step 1 so far (on `oradea`, and offered upstream as branch `upstream-memory`)

Measured 2026-10-30 the same way (`tools/oradea/memory/profile.mjs`, lowest graphics level, right after load):

| Change | Oradea page memory | Cherkasy page memory |
|---|---|---|
| Before | 1,000 MB | 1,537 MB |
| The two closure leaks (`buildings.js`, `kit/batch.js`) | 795 MB | |
| Ground tiles release their CPU copy after upload (`kit/batch.js releaseOnUpload`) | 722 MB | |
| Collision arrays trimmed after the build (`collision.compact()`) | 700 MB | |
| Rails and wet bands release after upload | 662 MB | 1,111 MB |
| Mesh builders drop their scratch once built (`MeshBuilder.free()`: the site kits, trams, parks, bridges) | 591 MB | |

Left from step 1: roof-edge anchors (`zips`), Float32 collision. The sites' own geometry keeps its CPU copy (~26 MB):
the far stand-ins (`world/cherkasy/proxies.js`) read it on the first lower graphics level. Tiles not drawn yet keep their CPU copy until they are first drawn, so the number falls further
during a drive.

The engine stays: `tools/oradea/research/reports/engine.md` (2026-10-30) found no engine that fixes these problems by
itself, and every swap would cost Oleg's upstream.

## Step 2: the phone beta (`?phone`)

Opt-in only: `?phone` on a phone, `?desktop&phone` on a computer, or "Joacă (beta)" on the phone map page. Phones are
still sent to the map page by default.

| Part | What it does |
|---|---|
| Centre only | `map.json` cut to 1.8 km round Piața Unirii in memory: 8,010 of 30,661 buildings, roads 8,150 → 2,626 pieces, 3 far sites skipped and 23 far site meshes dropped. Ground built to 2.7 km. A soft edge brakes the car past 1.8 km and eases it back |
| Graphics ladder | `minimal` < `phone` < `low`, starts on `phone`. No AO, bloom, SMAA or shadow maps (three's `SunLight` has a fixed 2 cascades, so one cascade is not possible; a soft blob under the car instead), tone mapping kept, pixel ratio 1.25 / 1, haze ~90 % at 800 m, camera far plane 1.8 km, no river mirror, traffic density 0.35, at most 360 people, shorter tree, building and site distances |
| Touch | Floating stick (steer; up/down pitches in the air), gas and brake pedals, handbrake, fly (hold), horn, map, camera; drag elsewhere to look. Any number of fingers. No page zoom or scroll. Keys still work |
| Small screen | Landscape first, readable at 375×667 CSS px. Minimap top right, speed bottom centre, photo and radio chips hidden, a touch section on top of the H card under the save-code line, a close button over the big map. Portrait shows a "turn your phone" card; a tap plays on in portrait, but the HUD is cramped there |
| Reload guard | A tab that dies within its first minute of play and comes back within 3 minutes starts one level lower, with a pill. Hiding the tab or leaving the page is not counted |

Measured 2026-10-30, Chrome phone emulation, iPhone 13 landscape (750×342 CSS px), the same four camera spots:

| Spot | Normal `low` | `phone` | `minimal` |
|---|---|---|---|
| Piața Unirii, street level | 683 draw calls | 175 | 167 |
| Republicii, street level | 440 | 148 | 138 |
| Cetate, 80 m up | 468 | 155 | 150 |
| Over the centre, 300 m up | 521 | 147 | 136 |
| Triangles | 2.7–4.5 M | 1.1–1.7 M | 1.1–1.7 M |

The car is ~34 of those calls in the chase view.

Memory, desktop Chrome 1280×720, `tools/oradea/memory/profile.mjs`, right after load:

| | Normal `low` | `phone` |
|---|---|---|
| Page memory | 620 MB (269 JS + 350 arrays) | 294 MB (106 JS + 188 arrays) |
| Peak while loading | ~910 MB | ~450 MB |
| Chrome page process | 570 MB | 370–500 MB over four runs |
| GPU process | 380 MB | 270–290 MB |

Needs a real phone: frame rate on a mid Android and an iPhone, memory and kills in Safari Web Inspector, stick size and
feel, fullscreen and orientation lock on Android, the notch and safe areas, the haze, the guard after a real crash, the
save code's copy button on iOS.

Left: the car's ~34 draw calls, sites merged per material (BatchedMesh), the map page's "driving is for computers"
text, sending phones to the beta by default once tested.

## Phone limits

No browser publishes a per-device tab limit.

| Fact | Source |
|---|---|
| iOS Safari's tab process has a soft limit near 1.5 GB, lower on iPhones with less RAM; above it the system may kill the tab | WebKit engineer, [bug 277848](https://bugs.webkit.org/show_bug.cgi?id=277848), 2024-08 |
| A killed tab reloads, then shows "A problem repeatedly occurred"; no JS error or `webglcontextlost` comes first | [bug 279637](https://bugs.webkit.org/show_bug.cgi?id=279637), 2024-09; [bug 300782](https://bugs.webkit.org/show_bug.cgi?id=300782), open 2026-03 |
| Developers report 300–500 MB total as safe on Safari | Unity forum threads (anecdotal) |
| 100–200 draw calls for low-end phones | [PlayCanvas manual](https://developer.playcanvas.com/user-manual/optimization/guidelines/) |
| WebGL2, half-float targets and parallel shader compile are in every current iPhone Safari | Khronos 2022; MDN compat data |
| Safari has no memory API; measure with Web Inspector over a cable (Timelines > Memory) | [Apple](https://support.apple.com/guide/safari-developer/dev935efea11/mac) |

Treat JS and GPU memory as one budget on phones. They share the RAM, and the WebKit engineer suspects graphics memory in
the kills.

## The plan

| Step | What | Saves | Effort | Risk |
|---|---|---|---|---|
| 0. Phone test | Deploy a test build; open it on a real iPhone and Android with the game forced (`?desktop`); Safari Web Inspector for memory | – | 1 day | Needs your phones and a cable |
| 1. Memory fixes (desktop too) | The two closure leaks (measured −274 MB); free geometry in JS after the GPU upload (three's `onUpload`, est. −300 MB); Float32 collision with exact sizes (est. −50 MB); free builder scratch, rail arrays, compact anchors (est. −80 MB) | 1,079 MB → est. 350–450 MB page memory | 3–5 days | Low. A lost WebGL context then needs a page reload |
| 2. Phone tier | Touch controls and layout; a graphics level below "low" (pixel ratio ≤ 1.25, no AO / bloom / SMAA, one shadow cascade, no river mirror, fewer cars and people, fog at ~800 m); a guard that steps quality down when the page reloads itself; phones play the centre (1.5–2 km round Piața Unirii: 18–32 % of the buildings) | Draw calls toward ~150; GPU memory roughly in proportion | 1–2 weeks | Medium: frame rate on mid-range Android is unknown until step 0 |
| 3. Streaming | The city in 512 m tiles of binary data, built in workers as the car nears them, dropped beyond ~1.5 km, a byte-capped cache; far blocks as plain boxes (`proxies.js` already does this for sites); collision, traffic and people per tile | The whole city on phones | 3–6 weeks | High: rewrites the engine's loading, shared with upstream |

Steps 1 and 3 change Oleg's shared engine (`kit/batch.js`, `world/cherkasy/buildings.js`, `world/collision.js`, the
loaders). They help his Cherkasy game the same way, so offer them upstream rather than carry them as fork-only conflicts.

Every new hand-built site adds draw calls (the landmark budget is up to 15 each). The phone tier must cull or merge far
sites, or the centre alone passes 200.

## Upstream pull request (branch `upstream-memory`, not opened yet)

Shared-engine changes go to Oleg's repository as pull requests, not as fork-only edits:

1. The two closure leaks: free `tiles` / `parts` after batching in `world/cherkasy/buildings.js`, and drop `geoms` in
   `kit/batch.js` `batchTiles`. Measured 1,079 → 805 MB here; Cherkasy loads the same pipeline.
2. Step 1's other memory fixes (geometry freed after upload, Float32 collision, builder scratch, rail arrays), each
   measured before and after with `tools/oradea/memory/profile.mjs`.
3. Optional: the city switch itself (`src/city.js` and the `CITY?.x ?? <Cherkasy value>` lines listed in `ORADEA.md`),
   so the fork stops carrying conflict-prone edits in his files.

## Not worth it now

- Meshopt / Draco compression: it shrinks the download, not the memory after load.
- KTX2 textures: most textures here are painted on canvases at run time; they would have to be baked first.
- WebGPU: Safari 26 ships it, but the post chain and materials are WebGL; it does not change the memory budget.
