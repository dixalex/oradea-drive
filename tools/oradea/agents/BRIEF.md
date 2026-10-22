# Oradea landmark builder brief

Setup once: `cd tools/oradea/agents/shot && npm i playwright` (the screenshot tools need it; Google Chrome must be installed).
The orchestrator gives each agent this brief plus one card (`card-*.txt`) and a scratchpad folder.

You build one hand-made place for **Oradea Drive**, a fork of the open-source game Cherkasy Drive (three.js r186 + Vite,
plain ES modules) that plays the real city of Oradea, Romania. The owner wants the public places to look like the real
ones. Today they are generic OSM boxes with the same windowed facade as an apartment block.

Repo: `/Users/alexandertinyaev/Sites/oradea-drive`. Read, in this order:

1. `AGENTS.md`: the engine, conventions and debug handles. It describes Cherkasy, and the Oradea build shares the engine.
2. `docs/agent-brief.md`: Oleg's method for building a place (research order, budgets, verification, Codex fidelity
   check, report). Follow it, except where this brief overrides it.
3. `docs/improve-object.md`: the mechanics (site-module contract, materials, `MB`, colliders, `nightK`).
4. `ORADEA.md`: how the Oradea fork is laid out.
5. A finished Cherkasy landmark as a model of quality and style, e.g. `src/world/cherkasy/drama.js` (a theatre with its
   square and a monument), `src/world/cherkasy/bohdan.js` (bronze statue helpers), `src/world/cherkasy/druzhba.js`.

## Overrides to docs/agent-brief.md for this fork

- **No worktree, no git.** Work directly in the checkout above. Do not commit, branch, stash, reset or checkout. The
  tree holds a lot of uncommitted work by others.
- **Files you may create:** only
  - `src/world/oradea/sites/<slug>.js` (your site module; exactly one file directly in `sites/`), plus helper files
    under `src/world/oradea/sites/<slug>/` if you need them;
  - `tests/oradea-<slug>.test.mjs`;
  - anything under your scratchpad folder (below).
- **Do not edit any existing file**: not `city.js`, `places.js`, `peek3d.js`, `AGENTS.md`, `ORADEA.md`, the Cherkasy kits,
  `package.json`, and not another agent's site. Import the Cherkasy helpers from `../../cherkasy/...` as they are. If you
  truly need a shared change, describe it in your report instead.
- **Other agents** are building other Oradea places at the same time in the same checkout. Their files are not yours.
  The loader skips a site that fails to load, so a broken sibling won't stop you; mention it if you see it.
- Do not run `npm run build`, `npm run build:oradea`, the map compiler, or the whole test suite. The orchestrator runs
  those. Run your own test and `node tests/oradea-river.test.mjs`.
- **Names and text:** Romanian place names. Anything a player reads goes through `t(ro, en)` from `src/i18n.js`.
  Use en-dashes (–), never em-dashes. Code and comments are in English. Real names of public institutions and
  historic buildings may be shown as they appear on the building (e.g. the theatre's lettering). No commercial brands
  or logos.

## The site contract (src/world/oradea/city.js loads every `src/world/oradea/sites/*.js`)

```js
export const SITE = {
  id: 'unirii',                 // unique slug
  label: 'Piața Unirii',        // for logs
  skip: [651522972, ...],       // OSM building ids (map_buildings.json `id`) your models replace: not drawn generically
  places: [],                   // optional NEW map places (shape of src/world/oradea/places.js entries). The orchestrator
                                //   moves them into places.js afterwards (the phone map loads no site); check places.js
                                //   first and don't re-add an id it has
  shape(hf, map, geo) {},       // optional: terrain before the ground is built, e.g. hf.pad(ring, margin, level)
  ground: true,                 // optional: build after the ground exists (base.ground is then set)
  build(base) { ... return { update(dt, camera) {}, clear(x, z) {}, footprints: [] }; },
};
// base = { root, T, map, solids, zips, heightAt, ground, geo, facadeMat, detailMat, railLevel, bridges, skip }
//   geo.toXZ(lat, lon) -> [x, z] map metres (src/world/cherkasy/frame.js); heightAt(x, z) terrain y
//   solids: the collision world (src/world/collision.js: prism / box / obox / cyl)
//   clear(x, z) -> true keeps generated trees off your lot; footprints [{ poly: [[x,z]..], h, kind, name, id }] for maps
```

Generic city furniture already exists, so leave it alone or claim the spot: `src/world/oradea/parks.js` draws park
lamps, benches, playground equipment and a generic fountain / statue / bust / memorial / wayside cross at every OSM
point no site's `clear(x, z)` covers, and `shopsigns.js` puts OSM shop names on the walls of buildings not in a `skip`
list. If your site models an OSM fountain, statue or memorial, make `clear(x, z)` return true at its point, or there will
be two.

Map data: `public/assets/oradea/map.json` (roads, walks, asphalt, cover, water, rails, trees, pois) and
`map_buildings.json` (`[{ id, p: [x0,z0,..], k, lv, h?, name?, bt?, am?, u? }]`), in map metres (frame: origin
Piața Unirii area, lat0 47.0553 lon0 21.9289, the grid turned −30.5°; `geo.toXZ`). The river Crișul Repede is the water
plane at y = −1.6, and its banks are quays 3.2 m above it (`src/world/oradea/river.js`). OSM bridges over it have decks
from `river.js`; don't rebuild them. Terrain heights are relative: the centre is about 2–5 m.

## Verify

- **Dev server:** one is already running at `http://127.0.0.1:5175` (the Oradea build, live reload). Use it; don't
  start or stop servers. If it is down, start your own: `cd /Users/alexandertinyaev/Sites/oradea-drive &&
  VITE_CITY=oradea npx vite --port <5176..5189> --strictPort --host 127.0.0.1` and stop it when done.
- **Memory (hard rule, the Mac has 32 GB and ran out with six agents):** screenshots only through shot.mjs below, which
  runs one game browser at a time machine-wide and waits for 30 % free memory, so a call may wait. Never launch
  Chrome / Playwright / puppeteer any other way or keep one open, never run build_map or `npm run build`, run one node
  test at a time, and batch several `--cam` views into one shot call.
- **Screenshots, headless (don't use any shared browser):**

      node /Users/alexandertinyaev/Sites/oradea-drive/tools/oradea/agents/shot/shot.mjs \
        --port 5175 --out <your scratchpad folder>/<name> --cam x,y,z,tx,ty,tz [--cam ...] [--time day|sunset|dusk] \
        [--query "&notraffic&nopeds"] [--eval "<js returning a string, run once the world is up>"]

  - Each `--cam` is a camera position and look-at in map metres. It writes `<name>-1.png`, `<name>-2.png` and so on.
    Read them to look.
  - One run takes about 30 s plus about 3 s per camera, so batch several cameras in one run.
  - The browser console shows `[oradea] built in …` with the site count. A site that throws logs
    `[oradea] <label> failed`. Pass `--eval "JSON.stringify(__game.world.stats())"` to see counts.
- The map data may be rewritten by the orchestrator's map compile at some point. If a page load fails once with a JSON
  error, retry after a minute.
- Use Codex for the fidelity check as `docs/agent-brief.md` §4 says (two rounds at most), comparing a reference photo
  with your screenshot. Use `-m gpt-6-sol` and feed the prompt through stdin (`gpt-6.1-sol` is rejected on this account,
  and several `-i` flags swallow a positional prompt).
- **The surrounding blocks are not yours:** most generic buildings still stand at guessed heights (9–16 storeys in the
  old town, where the real ones are 2–4). A measured-heights fix is pending. Tell Codex to ignore the neighbours.
- **Already built, don't redo:** Piața Unirii (Moon Church, St Nicholas cathedral, the Greek Catholic bishop's palace),
  City Hall and St Ladislaus church, the Black Eagle Palace, the theatre, Darvas–La Roche, the Sion synagogue, the
  fortress and its church, the Roman Catholic basilica, the Baroque Palace, Canons' Row, Calea Republicii with Moskovits
  and Ullmann, the railway station, Oradea Arena. Their OSM ids are in the `skip` lists of `src/world/oradea/sites/*.js`.

## Your scratchpad folder

`<your session scratchpad>/landmarks/<slug>/`

Put reference photos, notes and screenshots there.

## Report (your final message, compact)

- What the place is, with sources.
- What you built: files, vertex and draw-call counts, colliders, skipped OSM ids, terrain hooks.
- What is a guess or differs from reality.
- Checks: test output, Codex scores, and the best screenshot paths, best first.
- Any shared-file change you'd need, e.g. a `places.js` note or a `peek3d` SITES line.
