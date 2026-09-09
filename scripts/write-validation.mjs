import {readFileSync,writeFileSync} from 'node:fs';
const parity=JSON.parse(readFileSync('reports/parity.json','utf8'));
const benchmark=JSON.parse(readFileSync('reports/benchmark.json','utf8'));
const inventory=JSON.parse(readFileSync('tests/fixtures/content-inventory.json','utf8'));
const fixtures=JSON.parse(readFileSync('tests/fixtures/parity.json','utf8'));
const counts={};for(const f of fixtures){const key=f.name.split(':')[0];counts[key]=(counts[key]??0)+1;}
const rows=[];
for(const off of benchmark.results.filter(r=>!r.logsEnabled)){
 const on=benchmark.results.find(r=>r.name===off.name&&r.logsEnabled);
 const label=['double-anteater','capy-pheasant-t3'].includes(off.name)?`${off.name} (empty opponent)`:off.name;
 rows.push(`| ${label} | ${Math.round(off.engine.battlesPerSecond).toLocaleString('en-US')} | ${off.speedup.toFixed(2)}× | ${on.speedup.toFixed(2)}× |`);
}
const text=`# Validation

## Compatibility evidence

Reference: SAP-Calculator commit \`${parity.upstreamRevision}\`.

- **${parity.passed}/${parity.cases} differential cases passed**, with ${parity.failures.length} unresolved differences in this corpus.
- **111 tests passed across 63 test files**: 60 adapted upstream public-API battle suites, plus engine isolation/replay, random-decision semantics, and catalog inventory suites.
- Type checking and declaration generation passed. CommonJS and ESM produced the same smoke-test result. The ESM bundle also executed in a browser-like VM context without Node imports, Angular, or a DOM. Strict NodeNext TypeScript consumers compiled against the package exports in both ESM (.mts) and CommonJS (.cts) mode.
- Build metadata rejects runtime dependencies under node_modules and UI/presentation modules. Core runtime code contains no global injector, mutable global simulation session, or Math.random replacement.

The generated inventory contains ${inventory.pets.length} pets, ${inventory.equipment.length} equipment/ailment entries, and ${inventory.toys.length} toys. Differential cases include ${counts.pet} pet-level scenarios, ${counts.equipment} equipment/ailment scenarios, ${counts.toy} toy-level scenarios, and ${counts.scenario+counts.override} additional workload/legacy/override scenarios. Canonical content hashes are recorded in [reports/content-sha256.json](reports/content-sha256.json).

For each successful reference run, the harness compares aggregate outcomes, terminal pet boards, decision captures, and the complete raw random-draw tape. Normalized event traces compare type, plain message, randomness flags, source/target snapshots, and source/target positions. HTML board rendering and post-emission display merging are intentionally outside the event contract. The same tape is also replayed with logging and decision capture disabled, comparing outcomes and draw consumption. Expected strict-override exceptions are compared separately.

Coverage includes summoned pets, copied abilities, transformations, equipment depletion, hard toys, restricted custom packs, legacy options, empty sides, multiple seeds, multi-battle streams, and valid/invalid overrides. Unit/regression tests additionally cover reentrant progress hooks, cancellation, independent engines, prior-result stability, input immutability, error recovery, fingerprint precedence, repeated labels, and legacy single-option draws.

## Performance

Measured with Node ${benchmark.node} on ${benchmark.platform}/${benchmark.arch}. These are local observations, not guaranteed speedups on other hardware or every lineup.

| Workload | Engine battles/s, logs off | Speedup, logs off | Speedup, logs on |
| --- | ---: | ---: | ---: |
${rows.join('\n')}

The baseline is the pinned upstream headless bundle, which already uses Angular shims. The engine reuses its instance; upstream's public API constructs services per call. Both execute the same configs and seeds. Aggregate batches contain 1,000 battles; logged batches contain 100. Each timing is the median of seven batches after warmup, in separate processes. The final benchmark runs without the test suite competing for CPU. Two input examples have empty opposing teams and are labeled accordingly; their measurements mainly exercise setup and immediate resolution.

[reports/benchmark.json](reports/benchmark.json) includes individual timing samples, module import time, engine initialization, first-battle latency, heap growth, retained heap after GC, and maximum resident memory. Cold timings are single observations. Memory figures reflect process/GC behavior, not a per-battle allocation guarantee. Logged engine results include per-event pet snapshots, which are richer than upstream formatted logs.

The initial CPU profile identified garbage collection, entity initialization, and per-object logging fallback setup among the upstream costs. The extraction removes fallback property descriptors, reuses services/catalog initialization, guards disabled log emissions, avoids hot-path combat message formatting when logs are off, and lazily constructs random-choice descriptions. Equipment consumption formerly hidden inside a snipe formatting helper remains active when logs are disabled. See [reports/profile-baseline.json](reports/profile-baseline.json) for the sampled hotspots.

## Boundaries and reproduction

The catalog scenarios exercise every registered entity, but they do not prove every ability branch or every interaction. Some entities have shop-only/no-op battle behavior; this library preserves that rather than implementing a shop phase. Additional upstream suites depending on internal or UI APIs were not blindly copied; their filenames are recorded in scripts/upstream-test-inventory.json. Finite parity checks cannot prove equivalence for every possible input.

Upstream's seeded RNG does not govern Lodash shuffles. The reference harness provides reproducible ambient entropy and observes both streams, then replays the resulting tape in the engine. Ordinary seed behavior remains compatible; use raw-draw capture/replay when full reproducibility is required. Native browser performance and browser automation were not measured; browser validation executes the standalone ESM bundle in an isolated VM context.

From a fresh checkout:

\`\`\`sh
npm ci
npm run reference:prepare
npm run test:all
npm run benchmark
\`\`\`

The reference checkout is pinned and isolated under .reference/. Set SAP_REFERENCE_SOURCE to an existing checkout at the same revision to reuse it. No source from the current sap-board-query installation is modified by these commands.
`;
writeFileSync('VALIDATION.md',text);
