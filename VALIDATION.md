# Validation

## Compatibility evidence

Reference: SAP-Calculator commit `d165eb0a02f8aa0b54d72ed1d5490a44390d07f4`.

- **2096/2096 differential cases passed**, with 0 unresolved differences in this corpus.
- **111 tests passed across 63 test files**: 60 adapted upstream public-API battle suites, plus engine isolation/replay, random-decision semantics, and catalog inventory suites.
- Type checking and declaration generation passed. CommonJS and ESM produced the same smoke-test result. The ESM bundle also executed in a browser-like VM context without Node imports, Angular, or a DOM. Strict NodeNext TypeScript consumers compiled against the package exports in both ESM (.mts) and CommonJS (.cts) mode.
- Build metadata rejects runtime dependencies under node_modules and UI/presentation modules. Core runtime code contains no global injector, mutable global simulation session, or Math.random replacement.

The generated inventory contains 581 pets, 105 equipment/ailment entries, and 59 toys. Differential cases include 1743 pet-level scenarios, 105 equipment/ailment scenarios, 177 toy-level scenarios, and 71 additional workload/legacy/override scenarios. Canonical content hashes are recorded in [reports/content-sha256.json](reports/content-sha256.json).

For each successful reference run, the harness compares aggregate outcomes, terminal pet boards, decision captures, and the complete raw random-draw tape. Normalized event traces compare type, plain message, randomness flags, source/target snapshots, and source/target positions. HTML board rendering and post-emission display merging are intentionally outside the event contract. The same tape is also replayed with logging and decision capture disabled, comparing outcomes and draw consumption. Expected strict-override exceptions are compared separately.

Coverage includes summoned pets, copied abilities, transformations, equipment depletion, hard toys, restricted custom packs, legacy options, empty sides, multiple seeds, multi-battle streams, and valid/invalid overrides. Unit/regression tests additionally cover reentrant progress hooks, cancellation, independent engines, prior-result stability, input immutability, error recovery, fingerprint precedence, repeated labels, and legacy single-option draws.

## Performance

Measured with Node v21.7.3 on darwin/arm64. These are local observations, not guaranteed speedups on other hardware or every lineup.

| Workload | Engine battles/s, logs off | Speedup, logs off | Speedup, logs on |
| --- | ---: | ---: | ---: |
| simple | 44,801 | 3.47× | 1.85× |
| random-targets | 4,769 | 1.76× | 1.48× |
| summons | 2,224 | 2.44× | 1.53× |
| copy-transform | 2,482 | 2.14× | 1.40× |
| eleblow-t11 | 1,216 | 2.01× | 1.40× |
| double-anteater (empty opponent) | 77,496 | 4.98× | 2.91× |
| capy-pheasant-t3 (empty opponent) | 55,744 | 5.75× | 2.40× |

The baseline is the pinned upstream headless bundle, which already uses Angular shims. The engine reuses its instance; upstream's public API constructs services per call. Both execute the same configs and seeds. Aggregate batches contain 1,000 battles; logged batches contain 100. Each timing is the median of seven batches after warmup, in separate processes. The final benchmark runs without the test suite competing for CPU. Two input examples have empty opposing teams and are labeled accordingly; their measurements mainly exercise setup and immediate resolution.

[reports/benchmark.json](reports/benchmark.json) includes individual timing samples, module import time, engine initialization, first-battle latency, heap growth, retained heap after GC, and maximum resident memory. Cold timings are single observations. Memory figures reflect process/GC behavior, not a per-battle allocation guarantee. Logged engine results include per-event pet snapshots, which are richer than upstream formatted logs.

The initial CPU profile identified garbage collection, entity initialization, and per-object logging fallback setup among the upstream costs. The extraction removes fallback property descriptors, reuses services/catalog initialization, guards disabled log emissions, avoids hot-path combat message formatting when logs are off, and lazily constructs random-choice descriptions. Equipment consumption formerly hidden inside a snipe formatting helper remains active when logs are disabled. See [reports/profile-baseline.json](reports/profile-baseline.json) for the sampled hotspots.

## Boundaries and reproduction

The catalog scenarios exercise every registered entity, but they do not prove every ability branch or every interaction. Some entities have shop-only/no-op battle behavior; this library preserves that rather than implementing a shop phase. Additional upstream suites depending on internal or UI APIs were not blindly copied; their filenames are recorded in scripts/upstream-test-inventory.json. Finite parity checks cannot prove equivalence for every possible input.

Upstream's seeded RNG does not govern Lodash shuffles. The reference harness provides reproducible ambient entropy and observes both streams, then replays the resulting tape in the engine. Ordinary seed behavior remains compatible; use raw-draw capture/replay when full reproducibility is required. Native browser performance and browser automation were not measured; browser validation executes the standalone ESM bundle in an isolated VM context.

From a fresh checkout:

```sh
npm ci
npm run reference:prepare
npm run test:all
npm run benchmark
```

The reference checkout is pinned and isolated under .reference/. Set SAP_REFERENCE_SOURCE to an existing checkout at the same revision to reuse it. No source from the current sap-board-query installation is modified by these commands.
