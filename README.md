# sap-battle-engine

A standalone TypeScript Super Auto Pets battle engine for Node and browsers. It extracts the mechanics of SAP-Calculator revision `d165eb0a02f8aa0b54d72ed1d5490a44390d07f4`, including its existing quirks. There are no runtime dependencies, Angular imports, injectors, UI modules, or global simulation sessions.

It contains the battle library; no UI, shop simulator, or migration of `sap-board-query` is included. Because the pinned upstream did not include a license grant, this package remains `private` and `UNLICENSED`; use it only where you have the necessary rights. See [PROVENANCE.md](PROVENANCE.md).

## Install

Install a pinned Git revision directly. npm runs the package's `prepare` script, so a clean checkout builds automatically during installation:

```sh
npm install github:lgtyqz/sap-battle-engine#<commit-or-tag>
```

For local development, install dependencies and build this repository once, then add it to a consuming project by path:

```sh
# In sap-battle-engine
npm ci

# In the consuming project
npm install ../sap-battle-engine
```

Commit the resulting lockfile so consumers resolve the same source revision. The package is intentionally blocked from npm registry publication until its licensing status changes.

## Build and use

The runtime requires Node 20+ or a modern browser with `structuredClone`. Use Node 22.12+ for the development toolchain.

```sh
npm ci
npm run build
npm test
npm run test:package
```

The build produces `dist/index.js` (ESM and browser), `dist/index.cjs` (CommonJS), source maps, and TypeScript declarations. A browser can import the ESM bundle through an application bundler or directly. The packed artifact is tested as an actual dependency in ESM, CommonJS, browser-like, and strict TypeScript consumers.

```ts
import { createBattleEngine, type SimulationConfig } from 'sap-battle-engine';

const engine = createBattleEngine();
const config: SimulationConfig = {
  playerPack: 'Turtle',
  opponentPack: 'Turtle',
  turn: 3,
  playerPets: [
    { name: 'Mosquito', attack: 3, health: 4 },
    { name: 'Ant', attack: 2, health: 2 },
  ],
  opponentPets: [
    { name: 'Fish', attack: 4, health: 4 },
    { name: 'Pig', attack: 3, health: 2 },
  ],
  seed: 42,
  simulationCount: 1000,
};

const result = engine.runHeadlessSimulation(config);
console.log(result.playerWins, result.opponentWins, result.draws);
```

Reuse an engine for repeated queries to avoid rebuilding its registries and services. Convenience `runSimulation(config, hooks?)` and `runHeadlessSimulation(config, options?, hooks?)` functions construct a new engine per call. CommonJS consumers use `require('sap-battle-engine')`.

## API and compatibility

- `createBattleEngine({ entropy? })` creates an isolated engine. The optional entropy function must return finite numbers in `[0, 1)`. A stateful function explicitly shared by the caller remains caller-owned.
- `engine.runSimulation(config, hooks?)` preserves upstream simulation inputs and defaults, including logging on by default and the upstream simulation-count fallback.
- `engine.runHeadlessSimulation(config, { enableLogs?, includeBattles? }, hooks?)` defaults logging off unless the config specifies otherwise. Battle records are omitted unless `includeBattles` is true.
- `hooks` supports `onProgress`, `progressInterval`, and `shouldAbort`, checked between battles. Counts describe completed battles. Reentrant calls through hooks use an isolated temporary engine.
- `catalogs` exposes deeply frozen pets, toys, food, and perks metadata. `UPSTREAM_REVISION` identifies the compatibility baseline.

Inputs are cloned before execution. Runs do not mutate caller inputs or previously returned results. Mutable queues, players, factories, RNG state, and overrides belong to one engine. A failed run rebuilds that engine's mutable state before its next use.

All 581 registered pets, 105 equipment/ailment entries, and 59 toys are represented in the test inventory. Food support consists of upstream metadata and implemented battle behavior, including food-derived perks and food-related counters; this is not an API for buying or feeding shop food.

## Structured battle events

```ts
const detailed = engine.runSimulation({
  ...config,
  simulationCount: 1,
  logsEnabled: true,
  captureRandomDecisions: true,
});

for (const event of detailed.battles?.[0]?.logs ?? []) {
  console.log(event.sequence, event.type, event.source?.name, event.target?.name);
  console.log(event.message, event.board);
}
```

`Battle.logs` contains serializable `BattleEvent` records, not legacy log objects. Each event includes a one-based battle number, zero-based sequence, plain message, available source/target identities and positions, upstream flags, and a pet-board snapshot at emission. Consecutive snapshots expose state changes. Each logged battle also includes `finalBoard`, captured before reset.

Pet identities follow runtime objects, are local to a battle, and stay stable across its events. Upstream name-only synthetic log sources receive their own identity. Positions are one-based. Names, attack/health, experience, mana, and equipment state are copied into snapshots; some upstream synthetic log sources contain only a name, so attack/health are optional. Snapshots are detached records, not runtime objects or a complete resumable simulation state.

Events are emitted before upstream presentation merging and collapsing. HTML board rendering is replaced by `board`; Tiger/Puma/etc. flags are retained as data rather than automatically appended display suffixes. Some ability code already includes explanatory tags in its plain message. Display formatting belongs to the consuming app. Randomness capture is independent of logging.

## Random decisions and complete replay

The existing `seed`, `captureRandomDecisions`, `randomDecisionOverrides`, and `strictRandomOverrideValidation` behavior is retained. Decision indices span a whole simulation run. Overrides can identify a decision by index or by its key and label; upstream fingerprint precedence and repeated-label behavior are preserved. Forced choices still consume the original random draw.

```ts
const captured = engine.runSimulation({
  ...config,
  simulationCount: 1,
  captureRandomDecisions: true,
});
const choice = captured.randomDecisions?.find(d => d.options.length > 1);
if (choice) {
  const alternative = choice.options.find(o => o.id !== choice.selectedOptionId)!;
  const changed = engine.runSimulation({
    ...config,
    simulationCount: 1,
    captureRandomDecisions: true,
    randomDecisionOverrides: [{ index: choice.index, optionId: alternative.id }],
  });
}
```

**Upstream seed limitation:** Lodash shuffles capture a separate entropy source before upstream installs its seeded RNG. Consequently, `seed` alone does not reproduce every upstream battle. This engine deliberately preserves that distinction, including Lodash's forward-shuffle algorithm and draw consumption.

Use the additional raw draw tape when every random event must replay exactly:

```ts
const recordedConfig = {
  ...config,
  simulationCount: 1,
  logsEnabled: true,
  captureRandomDraws: true,
};
const recorded = engine.runSimulation(recordedConfig);
const replayed = engine.runSimulation({
  ...recordedConfig,
  randomDrawOverrides: recorded.randomDraws,
});
```

`RandomDraw` contains `stream` (`seeded` or `shuffle`) and `value`. The `seeded` label denotes the main stream even when no seed was supplied. The tape covers both streams, including draws not represented by upstream decision capture. Replay rejects exhausted tapes, wrong stream order, and invalid values; unused suffixes are allowed, for example when cancellation stops a replay early. Keep the same input and choice overrides to replay a transcript. Changing a choice can change subsequent draw requirements.

Strict choice-override failures retain upstream error handling, which can surface as an exception or `randomOverrideError`; permissive invalid overrides fall back to the sampled choice. Replay-tape failures are always propagated even if upstream ability code catches an intermediate error.

## Validation and benchmarks

```sh
# Downloads precisely the pinned upstream revision and builds isolated reference bundles.
npm run reference:prepare
npm run test:parity
npm run benchmark
npm run test:all
```

Set `SAP_REFERENCE_SOURCE` to an existing checkout of the pinned revision to avoid downloading it. Reference code is never a runtime dependency and is ignored by Git under `.reference/`.

See [VALIDATION.md](VALIDATION.md) for coverage, benchmark methodology, and limitations; machine-readable results are in `reports/`. See [PROVENANCE.md](PROVENANCE.md) for the source baseline and extraction changes.

## Positioning optimizer

Use `optimizeFight(config, { seed: 42 })` to find an alternating chain of sampled best responses for both sides. It caches matchups, starts with 15 trials per pair, and refines mixed response searches to 50. See [the optimizer guide](OPTIMIZER.md) for examples, result fields, heuristics, and sampling limitations.
