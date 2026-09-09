# Source provenance

The battle mechanics, content classes, registries, metadata, and ported regression tests derive from Robert Ley's [SAP-Calculator](https://github.com/robertley/SAP-Calculator), pinned to commit `d165eb0a02f8aa0b54d72ed1d5490a44390d07f4`.

`scripts/extraction-inventory.json` records the original dependency closure before removal of presentation helpers. The four content JSON files retain their upstream bytes. Existing source comments and attribution have been retained where applicable.

The extraction changes dependency wiring rather than reimplementing pet abilities: constructors receive a typed engine context, injector lookups become direct instance dependencies, random helpers use an engine-local source, and logging produces detached structured events. Upstream trigger ordering, rounding, choice selection, battle termination, clone prototypes, and content behavior remain the reference. The one equipment deep-clone path preserves engine and service references instead of recursively cloning the runtime graph.

Additional code implements reusable engine construction, immutable public catalogs, event serialization, complete random-draw tapes, package builds, and validation tools. Disabled log call sites and random-choice descriptions avoid unnecessary allocation. In the snipe path, defense-equipment consumption has been explicitly retained outside optional message formatting.

The reference harness builds the pinned source unchanged for performance tests. For differential checks, a separate bundle adds observation hooks to logs, seeded draws, and terminal boards at build time. It does not edit the checkout. Reference processes are recycled to release reloaded module graphs, and each reference run starts with fresh injector state. A deterministic ambient entropy source lets the harness observe upstream's seed-independent shuffles; those observed draws are replayed by the extracted engine.

Ported upstream tests use the public library API. Assertions that previously read HTML board strings, live pet objects, or appended presentation tags now assert equivalent structured fields. `scripts/upstream-test-inventory.json` lists the selected public-API battle tests and remaining tests that depend on internal or UI APIs.

No license file or package license grant was present in the inspected upstream revision. This extraction does not add a license grant over upstream material. The package remains private and marked `UNLICENSED`; nothing has been published.
