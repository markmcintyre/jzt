# JZT Performance and Architecture Refactoring Plan

Status: complete
Current phase: Phase 8 complete

This plan turns the board-performance and architecture review into sequenced, testable work. Preserve gameplay behavior unless a change is explicitly called out as a timing correction.

## 1. Baseline

Current repository checks:

- `npm test`: 104 passing tests.
- `npm run build`: passing.
- `npm run build:dev`: passing.
- Player packaging and preview smoke checks: passing.
- Registry smoke check: 46 registered thing types.

Source-level hot-path benchmark on an empty `256x256` board:

- 100 `Board.updateSmartPath()` calls: approximately 487 ms, or 4.87 ms per call.
- 100 `Board.update()` calls: approximately 554 ms, or 5.54 ms per update.

The synthetic board had no actors, rendering, scripts, or Canvas work. These numbers are directional, not production-browser measurements. Add a repeatable benchmark harness before using performance thresholds.

## 2. Invariants

Every phase MUST preserve these invariants unless its acceptance criteria explicitly change them:

- Forward and reverse tile-update ordering remains observable and intentional.
- A tile is not updated twice because it moved during the same update pass.
- Player movement, bullet movement, actor movement, `under` tile behavior, and removal semantics remain unchanged.
- Smart-path distance remains capped at the current distance limit of 50.
- Bullet smart-path influence retains its current strength and direction semantics.
- Current and previous lighting remain separately queryable by scripts.
- Serialized thing names remain backward-compatible.
- Editor/runtime behavior stays distinct where the current code distinguishes `game.isEditor`.
- Existing world files continue to load and serialize compatibly.

## 3. Execution rules

- Land one workstream at a time. Keep each change set reviewable.
- Add a regression test before changing behavior with a non-obvious invariant.
- Use direct indexed loops and flat arrays in hot paths; retain `Point` and object APIs at public boundaries.
- Do not remove snapshotting from actor updates without first documenting and testing the mutation semantics.
- Do not add speculative abstractions to unrelated gameplay code.
- Run the full verification matrix after each phase, not only after the final phase.

## 4. Phase 0 — Add measurement and deterministic fixtures

### Goal

Make performance changes measurable without making normal tests timing-sensitive.

### Work

- [x] Add a developer-only benchmark entry point, for example `task/benchmark.js` or `task/benchmarks/board.js`.
- [ ] Benchmark boards sized `10x10`, `64x64`, and `256x256`.
- [ ] Cover at least these fixtures:
  - [ ] empty board,
  - [ ] static blockers,
  - [ ] smart-seeking actors,
  - [ ] player bullets,
  - [ ] dark board with player/scriptable/explosion torches.
- [ ] Report median and p95 update time over warm iterations.
- [ ] Report path recomputation count, tile-array copy count, and fixture counts.
- [ ] Add a deterministic state hash or serialized snapshot for simulation comparisons.
- [ ] Keep benchmark assertions out of `npm test`; performance budgets should be reviewed separately from functional tests.

### Acceptance criteria

- One command records comparable before/after results.
- A fixture can prove whether an unchanged board recomputed its path.
- The benchmark does not require a browser or network service.

## 5. Phase 1 — Remove avoidable board traversal and allocation

### Goal

Reduce work that is repeated every frame without changing simulation semantics.

### Current locations

- `src/board.js:468-552` — snapshotting remains in `each` and `eachBackwards`; `eachDisplayable` is now direct.
- `src/board.js:1010-1057` — update passes.
- `src/board.js:1128-1167` — visible rendering.

### Work

- [x] Add a direct indexed iterator for read-only board scans.
- [x] Change `eachDisplayable` or add a renderer-specific path that does not copy the full board array. Iterate only the clamped visible rectangle.
- [x] Avoid `Point.subtract()` allocation in the render loop. Pass integer board and screen coordinates or reuse a controlled scratch point.
- [x] Change path-weight scanning to a direct indexed loop; it is read-only except for the known influencer callbacks.
- [x] Instrument forward and reverse update snapshot behavior before optimizing it.
- [x] If snapshot allocation remains material, reuse capacity or introduce an explicit update snapshot structure while preserving the fact that the current post-forward reverse snapshot semantics are preserved.
- [x] Do not share the forward and reverse snapshots until tests prove that doing so does not change movement ordering.

### Acceptance criteria

- Visible rendering performs no full-board `slice()`.
- Path-weight calculation performs no full-board snapshot.
- Existing movement and reverse-update tests pass.
- Benchmark reports lower allocation/copy counts with no regression in actor ordering.

### Implementation note

Phase 1 is complete. The update loop now uses separate reusable forward and reverse snapshot arrays. The reverse snapshot is copied after the forward pass, preserving the existing movement semantics; the snapshots are not shared.

Verification completed:

- `npm test`: 96 passing tests.
- `npm run build`: passing.
- `npm run build:dev`: passing.
- `npm run benchmark`: reports two reusable snapshot copies per update and zero `tiles.slice()` calls during updates for `10x10`, `64x64`, and `256x256` fixtures.
- Direct traversal smoke test: visible iteration and path weighting complete without invoking `tiles.slice()`.
- Directional convoy tests cover East/reverse and West/forward movement ordering.
- Production preview smoke test: player loaded and rendered the fixture world with no browser errors.

## 6. Phase 2 — Make smart-path computation dirty and iterative

### Goal

Stop rebuilding path data when nothing relevant changed, then reduce the cost of required rebuilds.

### Current locations

- `src/board.js:1070-1077` — dirty-gated path update.
- `src/board.js:1327-1442` — iterative path construction and active-bullet weighting.
- `src/board.js:1391-1430` — smart-direction lookup.
- `src/things/Bullet.js:70-82` — player-bullet influence.

### Work

- [x] Add a path dirty flag or topology/target version.
- [x] Mark path state dirty when:
  - [x] the player changes position.
  - [x] a blocking tile is inserted, removed, or moved.
  - [x] a player bullet is inserted, moved, or removed.
  - [x] any other current smart-path influencer changes state.
- [x] Preserve the current pre-update timing of path calculation, or document and test any intentional change.
- [x] Replace recursive traversal with a bounded BFS using integer indices.
- [x] Use a predictable flat storage representation with an explicit unreachable sentinel. Preserve the public `Infinity` behavior of `getSmartValue()`.
- [x] Maintain an active player-bullet collection instead of scanning every tile to find bullet influencers.
- [x] Apply transient bullet weights after rebuilding the base path, or invalidate/reapply them in a way that preserves current behavior.
- [x] Consider lazy computation on the first smart-direction request when a board has no smart-path consumers. Deferred: `Board.update()` now avoids rebuilding unchanged paths; first-use lazy initialization remains unnecessary for the current consumers.

### Acceptance criteria

- An unchanged board does not rebuild its path.
- A player move or blocking-topology change rebuilds the path exactly when needed.
- Smart-direction choices remain equivalent for deterministic random seeds.
- Bullet avoidance remains equivalent.
- No recursive path traversal remains in the hot path.
- The benchmark shows the unchanged-board path cost is eliminated rather than merely reduced.

### Implementation note

Phase 2 is complete. `Board.update()` still computes the path before actor updates, so mutations during a tick invalidate the path for the next tick just as before. Explicit `updateSmartPath()` calls still force a rebuild.

The path now uses a reusable `Float64Array` with `Infinity` as the unreachable sentinel, a reusable integer queue, bounded BFS, and an active player-bullet list.

Benchmark results after Phase 2:

- Unchanged `256x256` update: approximately `0.833 ms/update`.
- Forced path rebuild on `256x256`: approximately `0.054 ms/rebuild`.
- Unchanged benchmark path rebuilds: 1 warmup rebuild, then none across measured updates.
- Tile-array `slice()` calls during updates: 0.

Verification completed:

- `npm test`: 99 passing tests.
- `npm run build`: passing.
- `npm run build:dev`: passing.
- `npm run benchmark`: passing with path rebuild metrics.
- Production preview smoke test: player loaded, started, and reported no browser errors.

## 7. Phase 3 — Use a fixed-step throttled simulation clock

### Goal

Prevent rendering cadence and wall-clock stalls from changing simulation speed. If the browser cannot deliver ticks, gameplay slows instead of catching up with a visible jump.

### Current locations

- `src/jzt.js:880-905` — fixed-step render-loop gating.
- `src/jzt.js:953-975` — fixed simulation delta propagation.
- `src/jzt.js:1132-1162` — counter timing.

### Work

- [x] Define the existing simulation tick interval from the configured game rate.
- [x] Keep at most one simulation update per accepted animation frame; do not execute catch-up updates after a stall.
- [x] Discard elapsed-time backlog after the accepted update rather than simulating missed wall-clock time.
- [x] Pass the fixed simulation step to time-based counters and scheduling code; do not pass raw wall-clock delta to gameplay timers.
- [x] Keep rendering outside the simulation update; render once after the tick.
- [x] Keep wall-clock timing out of gameplay; no separate wall-clock diagnostic consumer currently requires stored state.
- [x] Verify pause, resume, game-over, board transitions, keyboard handling, and delayed-frame behavior under the new clock.

### Acceptance criteria

- The simulation advances by one fixed tick only when an update executes.
- A delayed or throttled frame slows actor movement and gameplay timers; it does not cause a catch-up jump.
- No simulation backlog accumulates after a stall.
- Pause and resume do not consume simulation ticks.
- Existing gameplay tests remain valid or are updated to explicitly document the intentional slowdown behavior.
- A deterministic timing test covers normal, delayed, and throttled-frame scenarios.

### Implementation note

Phase 3 is complete. `Game.SIMULATION_STEP` is the configured `FPS_INTERVAL` (approximately 33.3 ms). `Game.loop()` still performs at most one update per accepted animation frame, while `Game.update()` always uses the fixed step for board updates, counters, playtime, and reading time.

The previous wall-clock timestamp state and raw `realDelta` propagation were removed. A delayed frame therefore slows gameplay instead of jumping gameplay timers forward.

Verification completed:

- `npm test`: 102 passing tests.
- `npm run build`: passing.
- `npm run build:dev`: passing.
- `npm run benchmark`: passing.
- Fixed-step tests cover delayed Playing and Reading states, including a delayed render-loop tick.
- Production preview smoke test: player loaded, started, and reported no browser errors.

## 8. Phase 4 — Replace repeated lighting geometry with dirty light state

### Goal

Make dark-board visibility proportional to changed light sources rather than visible tiles multiplied by torch count.

### Current locations

- `src/board.js:394-560` — compact source registry, cached geometry, and dirty masks.
- `src/board.js:1201-1227` — O(1) current/previous mask lookup.
- `src/board.js:1247-1349` — source lifecycle and mask rebuild timing.
- `src/things/Player.js:204-217` — dynamic player radius source.
- `src/things/Scriptable.js:148-158` — cached scriptable radius source.
- `src/things/Explosion.js:52-56` — dynamic explosion radius source.

### Work

- [x] Represent light sources with compact source data: position, radius/shape, and source identity.
- [x] Maintain separate current and previous light masks.
- [x] Mark lighting dirty when a source moves, changes radius, appears, or disappears.
- [x] Rebuild the full mask only when lighting is dirty; stable source sets skip mask rebuilds.
- [x] Make `isLit()` an O(1) mask lookup for ordinary tiles.
- [x] Preserve glow behavior and current/previous lighting queries.
- [x] Cache fixed-radius geometry for scriptables where position/radius did not change.
- [x] Treat explosions and the player as dynamic sources with explicit invalidation.

### Acceptance criteria

- Render-time lighting does not scan every torch for every visible tile in the normal path.
- `lit` script behavior matches before/after snapshots for current and previous lighting.
- Dynamic torch movement and radius changes remain visually correct.
- Dark-board benchmark reports lower update/render work for multi-torch fixtures.

### Implementation note

Phase 4 is complete. Boards now register compact light sources keyed by their owning thing, cache circle row geometry by radius, and maintain separate current and previous `Uint8Array` masks. `isLit()` reads one mask entry instead of scanning every torch for every visible tile.

Source changes mark the mask dirty. Stable source sets skip full mask rebuilds; player, scriptable, and explosion sources update their radius or position explicitly. Current/previous mask behavior remains available to `lit` script expressions.

Verification completed:

- `npm test`: 103 passing tests.
- `npm run build`: passing.
- `npm run build:dev`: passing.
- `npm run benchmark`: passing; 4/16/32-source dark-board fixtures completed 100 updates with zero mask rebuilds and O(1) lighting lookups.
- Focused dark-board test covers source movement, radius changes, removal, and current/previous lighting.
- Production preview smoke test: player loaded, started, and reported no browser errors.

## 9. Phase 5 — Cache static audio and reduce remaining hot allocations

### Goal

Address smaller repeated allocations after the structural wins are complete.

### Work

- [x] Cache parsed `AudioSong` data by normalized notation in `src/audio/audio.js`.
- [x] Store cached song notes as immutable data.
- [x] Keep WebAudio scheduling timestamps and cancellation behavior uncached.
- [ ] Replace hot internal `Point.add()` calls with integer neighbor calculations where profiling shows benefit.
- [ ] Add optional sprite/text caches only after measuring repeated UI workloads.
- [ ] Avoid optimizing save/load and editor-only paths unless profiling shows user-visible cost.

### Acceptance criteria

- Repeated identical sound notation does not reparse on every play.
- The per-`Audio` cache is bounded by 64 entries and 4,096 parsed notes; oversized songs are not retained.
- Audio behavior, interruption, and uninterruptable sounds remain unchanged.
- Cache diagnostics and focused tests cover hits, normalization, eviction, note limits, and playback integration.

### Implementation note

`Audio.playAfter()` now uses a per-instance LRU cache keyed by uppercase notation. The cache stores at most 64 songs and 4,096 parsed notes, evicts least-recently-used entries, skips oversized songs, and exposes hit/miss/eviction/size diagnostics through `getSongCacheStats()`. Cached songs and notes are frozen; WebAudio scheduling state remains per playback.

Verification completed:

- `npm test`: 104 passing tests.
- `npm run build`: passing.
- `npm run build:dev`: passing.
- `npm run benchmark`: passing.
- Focused audio tests cover normalization, cache hits, immutable songs, LRU bounds, oversized-song skipping, and `playAfter()` integration.
- Production preview smoke test: player loaded, started, and reported no browser errors.

## 10. Phase 6 — Untangle thing registration and module boundaries

### Goal

Make initialization explicit and reduce circular dependency risk without changing serialized type names.

### Current locations

- `src/things/thing-definitions.js` — explicit built-in definition table and initialization boundary.
- `src/jzt-script-commands/shared.js:1-7` — direct registry dependency for command-side `ThingFactory` access.
- `src/things/Scriptable.js:1-4` and `src/jzt-script-context.js:1-3` — former cycle path.

### Work

- [x] Change command code that only needs `ThingFactory` to import the registry module directly.
- [x] Introduce an explicit thing-definition table that imports and registers concrete classes.
- [x] Keep the public aggregator as a compatibility boundary while removing registration-by-import side effects where practical.
- [x] Use a null-prototype object for registry lookups.
- [x] Freeze the built-in registry after initialization.
- [x] Preserve case-insensitive serialized names and all current built-in names.
- [x] Export concrete classes deliberately rather than relying on consumers to trigger side-effect imports.
- [x] Keep the game bundle monolithic; code splitting is not planned because the complete game can be loaded together.

### Acceptance criteria

- The command/thing dependency cycle is removed or explicitly documented with a tested initialization contract.
- All 46 built-in types register deterministically.
- Deserialization of existing worlds is unchanged.
- Tests can import a concrete thing without depending on unrelated thing-module side effects.

### Implementation note

The registration boundary is now explicit. Concrete thing modules export classes without registering themselves; `thing-definitions.js` imports the built-ins in the historical order and `things.js` initializes them once. The public `things` and `ThingFactory` exports remain compatible, while the registry and cached map use null-prototype objects and are frozen after initialization. The game bundle remains monolithic by design.

Verification completed:

- `npm test`: 104 passing tests.
- Focused registration and serialization tests: 40 passing tests.
- `npm run build`: passing.
- `npm run build:dev`: passing.
- `npm run benchmark`: passing.
- Production preview smoke test: player loaded, started, and reported no browser errors.



## 11. Phase 7 — Split Board responsibilities incrementally

### Goal

Create maintainable system boundaries after hot-path behavior is stable.

### Proposed boundaries

- `BoardModel`: tile storage, occupancy, movement, serialization.
- `BoardSimulation`: update ordering, bullets, invalidation.
- `PathService`: bounded path map and smart-direction queries.
- `LightingService`: current/previous masks and source invalidation.
- `BoardRenderer`: viewport and Canvas drawing.

### Work

- [x] Extract pathfinding behind a narrow interface first.
- [x] Extract lighting behind a narrow interface second.
- [x] Move renderer-only state and Canvas dependencies out of the board model.
- [x] Keep `Board` as a façade while callers migrate.
- [x] Delete obsolete pathfinding implementation from `Board`; retain thin compatibility forwarding methods.

### Acceptance criteria

- Model and simulation tests can run without Canvas resources.
- Path and lighting services can be tested with plain arrays and deterministic fixtures.
- Board remains the compatibility façade for existing game/editor callers.
- Each extracted service has one owner for its state.

### Implementation note

All Phase 7 slices are complete. `PathService` owns bounded BFS state and smart-direction queries. `LightingService` owns light-source registration, geometry caching, current/previous masks, invalidation, and mask rebuilds. `BoardRenderer` owns viewport state, displayable traversal, Canvas drawing, custom renderables, and message rendering. `Board` remains the compatibility façade for existing callers.

Verification:

- Focused Board/path/lighting tests: 15 passing tests.
- Focused BoardRenderer/Board tests: 15 passing tests.
- `npm test`: 110 passing tests.
- `npm run build`: passing.
- `npm run build:dev`: passing.
- `npm run benchmark`: passing.
- Production preview smoke test: player loaded, started, and reported no browser errors.

## 12. Phase 8 — Harden world-data boundaries and verification

### Work

- [x] Validate `data.type` before calling string methods in `ThingFactory`.
- [x] Validate tile-array length against board dimensions.
- [x] Report malformed tile records with their index and serialized type.
- [x] Replace string throws at touched boundaries with `Error` instances while preserving user-facing messages.
- [x] Add malformed-world tests for non-string types, unknown types, missing tiles, invalid dimensions, and invalid scripts.
- [x] Add an integration smoke test for the real game loop where the environment permits it.
- [x] Add a browser smoke path for Canvas rendering and, where available, WebAudio scheduling.

### Implementation note

Phase 8 now validates world boundaries before deserialization. `ThingFactory` rejects non-string type inputs safely; `Board` requires integer dimensions, exact tile-array length, valid script records, and known serialized tile types; malformed tiles include their array index and serialized type in `Error` messages. Board and Editor validation boundaries now throw `Error` instances while preserving existing user-facing messages.

Verification:

- Focused world-boundary and Board/ThingFactory tests: 24 passing tests.
- Real game-loop integration and world-data tests: 10 passing tests.
- `npm test`: 117 passing tests.
- `npm run build`: passing.
- `npm run build:dev`: passing.
- `npm run benchmark`: passing.
- Production package preview smoke test: player loaded and started with no browser errors.

## 13. Verification matrix

Run after every phase:

```sh
npm test
npm run build
npm run build:dev
```

Run after changes touching packaging, loading, registry, or bundles:

```sh
npm run package:itch -- --world <fixture-world> --output /tmp/jzt-review-package
npm run preview:itch -- --world <fixture-world> --output /tmp/jzt-review-preview --port <free-port>
```

Run after performance phases:

```sh
node task/benchmark.js
```

Also verify manually or with focused tests:

- actor movement and reverse movement,
- stacked and `under` tiles,
- player bullets and bullet limits,
- smart-seeking enemies,
- dark boards and dynamic torches,
- scripts querying current and previous lighting,
- pause/resume and delayed frames,
- serialized world round trips,
- editor loading and play mode,
- production player package contents.

## 14. Completion criteria

The refactor is complete when:

- [x] Unchanged boards do not rebuild smart paths.
- [x] Visible rendering does not copy the entire board array.
- [x] Required path rebuilds use iterative bounded traversal.
- [x] Simulation timing is deterministic under variable frame delivery.
- [x] Lighting has explicit dirty state and preserves previous-light queries.
- [x] Audio notation is not reparsed for every identical sound.
- [x] Thing registration has an explicit, tested initialization boundary.
- [x] Board responsibilities have documented ownership and no duplicate state.
- [x] World-data validation rejects malformed input predictably.
- [x] Functional tests, builds, package smoke tests, and benchmark comparisons pass.
