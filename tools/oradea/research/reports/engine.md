# Engine choice for Oradea Drive

**Recommendation: do not swap engines.** Stay on three.js WebGLRenderer and carry out the plan in `ORADEA-MOBILE.md` (memory fixes, phone tier, streaming), plus BatchedMesh for the hand-built sites. The measured problems come from loading the whole city at once, two leaks, geometry kept in JS after upload and too many draw calls. Every engine would carry those. Babylon, PlayCanvas, Unity and Godot each mean rewriting the renderer layer and losing Oleg's upstream, with no phone benchmark showing a gain. Move to three.js WebGPURenderer later, without switching engines: port the GLSL to TSL while still on WebGLRenderer (possible since r184), then switch only if a phone A/B test shows it is faster.

## Engine problem or content problem?

Content and architecture. A swap would not fix them.

- **Memory.** Of 1,079 MB page memory, 802 MB is typed arrays the game itself holds. Two closure leaks keep extra geometry copies; fixing them measured 1,079 → 805 MB. Another 378 MB is geometry kept after GPU upload, plus ~80 MB collision and ~80 MB rails [1]. three.js already has `BufferAttribute.onUpload` to free CPU copies [2]. No engine frees data the app still references. Unity and Godot would hold the same data in a wasm heap that grows and can crash when it resizes on phones [3].
- **Draw calls.** The 382–647 calls come from tiles × layers and from hand-built sites (up to 15 calls each) [1]. WebGLRenderer can merge them already. BatchedMesh uses `WEBGL_multi_draw`, which iOS Safari has had since 15 [4]. r187 (2026-10-30) also merges consecutive BatchedMesh draws [5].
- **Whole city at start.** ~30k buildings and 16 MB of raw data are built in one go [1]. Streaming changes the architecture whatever the engine. Slow Roads, a three.js driving game, recycles geometry on a "treadmill" [6].

Repo recount (2026-10-30): 356 JS files, 83.7k lines; world/oradea is 131 files / 19.8k lines. 222 files import three, with 2,683 `THREE.` references. 15 files hold ~790 lines of GLSL in template strings, and there are 21 `onBeforeCompile` hooks. The post chain uses `n8ao` and `postprocessing`. Upstream: 139 of Oleg's 161 non-merge commits (2026-09-30 to 2026-10-16) touch a file that imports three [7].

## Comparison

| Option | Phone evidence | Graphics ceiling | Migration, this code | Upstream merges | Licence (AGPL-3.0, ODbL) | Download / load | Risk |
|---|---|---|---|---|---|---|---|
| three.js WebGLRenderer + plan | Untested on a phone. WebGL2 is in every current iPhone [1] | N8AO, bloom, SMAA, SunLight cascades. No large new features planned for this renderer [8] | 5.5–10 wks (below) | Kept. The fixes can go upstream | MIT [9] | Today ~1.0 MB JS + ~5.5 MB data gzip, 6.6 MB vehicles [7] | Low–medium |
| three.js WebGPURenderer + TSL | Safari 26 ships WebGPU [10]. iOS WebGPU flicker bug until 26.4 [11]. One test: ~2x CPU, 5–10x first frame with 4,000 meshes [12]. Another: 2.6x memory [13]. Root issue open since 2025-02 [14] | Adds GTAO, SSGI, SSR, TRAA and compute nodes (in r186) [15] | +4.5–7 wks on top | Kept only if Oleg moves too | MIT | About the same (not measured) | Medium: may be slower on phones today |
| Babylon.js 9 | No comparable city benchmark found. Snapshot rendering helps only static WebGPU scenes and breaks when meshes are added or removed [16] | Frame graph (GPU texture memory −40% "in some cases"), clustered lights on WebGL2 and WebGPU, volumetric light [17] | Rewrite of 222 files. Est. 12–20 wks | Lost [7] | Apache-2.0 [9] | Not found | High |
| PlayCanvas 2.23 | Official target: 100–200 draw calls on low-end phones [18]. Active WebGPU work [19]. No city benchmark found | Clustered lights, cascades, splats [19] | Same rewrite. Est. 12–20 wks | Lost | MIT [9] | Not found | High |
| Unity 6.6 Web | iOS Safari 15+ supported [20]. Heap needs manual tuning on mobile [3]. ~500 MB iOS ceiling reported (forum, anecdotal) [21] | URP. WebGPU out of experimental since 6.6 (secondary report) [22]; no async compute or dynamic resolution [23] | C# rewrite. Est. 6+ months | Lost | Closed runtime clashes with AGPL (below) [24] | Empty URP build 10.7 MB, 2.0 MB stripped [25] | Very high |
| Godot 4.7 Web | Single-threaded export "works very well" on iOS (docs) [26] | WebGL2 only, no WebGPU. No SSR, SDFGI, VoxelGI, volumetric fog or compute [26][27] | GDScript rewrite (C# cannot export to web). Est. 6+ months | Lost | MIT [9] | Not found | Very high: graphics below today's |

Engine choice does not change the ODbL duty: credit OSM, and keep derived data under ODbL [28].

**Unity and AGPL.** This is my reading of the AGPL, not legal advice. Corresponding Source excludes only System Libraries, and section 13 makes you offer it to network users [24]. The Unity runtime is neither, so a Unity build of Oleg's code needs his written exception, or a clean rewrite with none of his code.

**Others, none a contender.** Needle Engine runs on three.js under a proprietary EULA, free only for non-commercial use [29]. Bevy is a Rust rewrite, and its web build was single-threaded (dated source) [30]. Google Photorealistic 3D Tiles bans caching, offline use and objects traced from the tiles, and costs $6 per 1,000 events after 1,000 free a month [31]. It has no road or building data to drive on. CesiumJS (Apache-2.0) is a globe viewer, not a game engine [9].

No published phone benchmark of a 30k-building city exists for any of these engines (searched 2026-10-30).

## Migration estimate, top two

**A. Stay and fix (WebGLRenderer)**

| Step | Weeks |
|---|---|
| 1. Memory fixes | 0.6–1 [1] |
| 2. Phone tier | 1–2 [1] |
| BatchedMesh for sites and far blocks | ~1 (estimate) |
| 3. Streaming in 512 m tiles | 3–6 [1] |
| **Total** | **5.5–10**. Phones play the centre after ~3 |

**B. three.js WebGPURenderer** (after A's steps 1–2, which still set the memory)

| Work | Weeks |
|---|---|
| Port ~790 GLSL lines to TSL on WebGLRenderer via `WebGLNodesHandler` [32]: facade 179, sky 162, people 120, ground 82, water 50, others ≤45 | 2–3 |
| New post chain: `n8ao` and `postprocessing` are WebGL-only [33], so use GTAONode, BloomNode, SMAANode [15] | 1 |
| Async init, SunLight node registration [34], decal bias, shader warm-up | 0.5–1 |
| Phone A/B test and regressions | 1–2 |
| **Total extra** | **4.5–7**. Adds compute and newer effects. Does not cut memory |

## Top risks

1. Phone frame rate is unknown until step 0 runs on a real device [1].
2. Streaming and the memory fixes change Oleg's shared loaders. Without his agreement they become a permanent merge conflict [1][7].
3. WebGLRenderer is in maintenance mode [8]. TSL via `WebGLNodesHandler` keeps the way out open [32].
4. WebGPURenderer's per-object overhead is still unfixed [14]. Switching early could make phones slower [12][13].
5. iOS kills tabs without warning near 1.5 GB, and lower on smaller iPhones, in any engine [1].

## Next steps

1. Step 0: open the current build on a real iPhone and Android with `?desktop`, and measure memory in Web Inspector. 1 day.
2. Memory fixes. Send the two leak fixes upstream as pull requests.
3. Phone tier, with a draw-call budget of ~150 measured on the phone. Use BatchedMesh for the sites.
4. Ask Oleg whether he plans WebGPU/TSL. If yes, port together, starting with `trees.js` on `WebGLNodesHandler`.
5. Streaming in 512 m tiles.
6. Re-test WebGPURenderer on phones once three.js issue #30560 closes. Switch behind a flag only if frame time and memory both improve.

## Sources

1. `ORADEA-MOBILE.md`, measured 2026-10-21. It cites WebKit bugs [277848](https://bugs.webkit.org/show_bug.cgi?id=277848) (2024-08), [279637](https://bugs.webkit.org/show_bug.cgi?id=279637) and [300782](https://bugs.webkit.org/show_bug.cgi?id=300782).
2. three.js r186 `src/core/BufferAttribute.js`, `onUpload()` doc comment, read 2026-10-30.
3. [Unity 6.6 manual, Web memory](https://docs.unity.com/en-us/engine/current/manual/platform-specific/webgl/develop/memory), accessed 2026-10-30.
4. [caniuse WEBGL_multi_draw](https://caniuse.com/wf-webgl-multi-draw), accessed 2026-10-30. Fallback: [three.js PR #27178](https://github.com/mrdoob/three.js/pull/27178).
5. [three.js r187 release](https://github.com/mrdoob/three.js/releases/tag/r187), 2026-10-30.
6. [web.dev, Slow Roads case study](https://web.dev/case-studies/slow-roads), updated 2023-04-11.
7. Repo counts and `git log main`, 2026-10-30. Sizes from `dist/` (built 2026-10-22) and `public/assets/oradea/`, gzip -9.
8. [three.js manual, WebGPURenderer](https://threejs.org/manual/pages/webgpurenderer.html), undated, accessed 2026-10-30.
9. GitHub API licence fields for three.js, Babylon.js, PlayCanvas, Godot, Bevy and CesiumJS, 2026-10-30.
10. [WebKit Features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/), 2025-09.
11. [WebKit bug 301627](https://bugs.webkit.org/show_bug.cgi?id=301627), 2025-10-29; fixed in Safari 26.4, confirmed 2026-03-26.
12. [three.js forum, r183 many-mesh test](https://discourse.threejs.org/t/webgpurenderer-2x-slower-cpu-and-5-10x-slower-first-frame-than-webglrenderer-on-many-mesh-scenes-r183-same-on-both-backends/91904), 2026-05-29. One user, RTX 4090 laptop.
13. [three.js issue #33194](https://github.com/mrdoob/three.js/issues/33194), 2026-03-17. 1,300 meshes, 211 vs 80 MB.
14. [three.js issue #30560](https://github.com/mrdoob/three.js/issues/30560), opened 2025-02-19, still open 2026-10-30.
15. `node_modules/three/examples/jsm/tsl/display/` in r186, checked 2026-10-30.
16. [Babylon.js snapshot rendering](https://doc.babylonjs.com/setup/support/webGPU/webGPUOptimization/webGPUSnapshotRendering), accessed 2026-10-30.
17. [Announcing Babylon.js 9.0](https://blogs.windows.com/windowsdeveloper/2026/03/26/announcing-babylon-js-9-0/), 2026-03-26.
18. [PlayCanvas optimisation guidelines](https://developer.playcanvas.com/user-manual/optimization/guidelines/), accessed 2026-10-30.
19. [PlayCanvas engine releases](https://github.com/playcanvas/engine/releases): v2.23.0 on 2026-10-01, v2.23.3 on 2026-10-15.
20. [Unity 6.3 manual, browser compatibility](https://docs.unity.com/en-us/engine/6000.3/manual/platform-specific/webgl/intro/browsercompatibility), accessed 2026-10-30.
21. [Unity forum, iOS reloads](https://discussions.unity.com/t/webgl-ios-unity-sometimes-reloads-after-startup/1541942). Anecdotal.
22. [Cinevva, Unity 6.6 WebGPU](https://app.cinevva.com/news/2026-09-01-unity-6-6-webgpu-production), 2026-09-01. Secondary.
23. [Unity 6.6 manual, WebGPU limitations](https://docs.unity.com/en-us/engine/6000.6/manual/platform-specific/webgl/develop/graphics/web-gpu/limitations), accessed 2026-10-30.
24. AGPL-3.0, sections 1 and 13, in the repo's `LICENSE`. Unity Personal is free under $200k revenue: [Unity blog](https://unity.com/blog/unity-is-canceling-the-runtime-fee), 2024-09-12.
25. [Aras Pranckevičius, Unity 6 web build size](https://gist.github.com/aras-p/740c2d4f9977ce92b7de72b1394dd365), 2024-10, Unity 6.0.23.
26. [Godot 4.7 docs, exporting for the web](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html), accessed 2026-10-30.
27. [Godot 4.7 docs, renderers](https://docs.godotengine.org/en/stable/tutorials/rendering/renderers.html), accessed 2026-10-30.
28. [OpenStreetMap copyright](https://www.openstreetmap.org/copyright), accessed 2026-10-30.
29. [Needle EULA](https://needle.tools/eula), accessed 2026-10-30.
30. [Bevy cheatbook, platforms](https://bevy-cheatbook.github.io/platforms.html) (Bevy 0.12, outdated) and [Bevy PR #12205](https://github.com/bevyengine/bevy/pull/12205).
31. [Map Tiles API policies](https://developers.google.com/maps/documentation/tile/policies) and [pricing](https://developers.google.com/maps/billing-and-pricing/pricing), both updated 2026-10-28.
32. [three.js PR #32851](https://github.com/mrdoob/three.js/pull/32851), merged 2026-03-14 (r184). Limits: no VSM shadows, no MRT nodes.
33. [postprocessing issue #643](https://github.com/pmndrs/postprocessing/issues/643), maintainer reply 2024-07-25: it will move "when the WebGPURenderer officially replaces the WebGLRenderer".
34. three.js r186 `examples/jsm/lights/SunLight.js` header (WebGPU needs `renderer.library.addLight`). [r186 release](https://github.com/mrdoob/three.js/releases/tag/r186), 2026-09-24.
