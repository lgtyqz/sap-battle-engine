# Fight positioning optimizer

`optimizeFight(config, options)` searches alternating best responses using the standalone battle engine. It starts with a heuristic order for both teams, searches Player 1's orders against Player 2, then reverses sides until the pair and next responder repeat or a complete response search finds no sampled wins. This is a best-response chain, not a minimax solver or proof of globally optimal play.

```ts
import { optimizeFight } from 'sap-battle-engine';
const result = optimizeFight({
  playerPets: [{ name: 'Fish', attack: 20, health: 20 }],
  opponentPets: [{ name: 'Fish', attack: 10, health: 10 }],
  simulationCount: 1,
}, { seed: 42, maxSimulations: 10000 });
console.log(result.finalPosition, result.steps, result.termination);
```

Each new matchup gets 15 battles. An all-win sample is a provisional winning response and allows early exit. If a complete response search has no all-win, all-loss, or all-draw samples, every candidate in that search is extended to 50 total battles. Estimates are cached across the entire chain; refinement adds 35 battles. All reported certainty is **sampled, never proven**. `no-sampled-counter` means every opposing order examined has zero sampled wins, with draws allowed. Finite sampling can miss counters.

Responses maximize the responding side's win rate, breaking ties by draw rate and then heuristic order. `collectAllBestResponses: true` disables early exits and collects all equally ranked responses. `searchComplete` indicates whether all orders were checked; collected ties otherwise cover only the searched prefix. If a selected response would revisit an earlier state, the optimizer finishes that response search and follows an equally ranked or better unvisited response when one exists; only then does it report a cycle. The search starts from the heuristic opponent order rather than evaluating all 14,400 pairs upfront.

The heuristic puts high effective attack first, uses lower health first for ties, and moves Friend Ahead/Friend Faints support behind a suitable attacker. It considers lethal equipment, damage bonuses, multipliers, minimum attack, and target damage from perks including Peanut, Steak, Squash, Cheese, and Golden Egg. This is an ordering heuristic; situational ability and equipment interactions are resolved by the actual simulator.

Orders contain original zero-based input slot indices, front to back. Teams are padded to five slots. Identical complete pet configurations and empty slots are deduplicated, while distinct gap placements remain searchable. Five distinct pets yield 120 orders per side.

Options include `initialSimulations` (15), `refinementSimulations` (50), `seed`, `collectAllBestResponses`, `maxSimulations`, `maxResponseSteps`, `shouldAbort`, and `onProgress`. Cancellation and budget limits retain completed response steps and partial matchup counts. Progress callbacks run synchronously between batches; use a worker for an interactive UI. Inputs and results are detached. Logs and decision capture are disabled during optimization. Battle-specific random overrides are rejected because their event indices and choices change with positioning.

Each matchup owns a seeded random stream covering both simulator and legacy shuffle draws. Refinement continues that stream, making fixed inputs and options reproducible. The optimizer seed is independent of the simulator's single-match seed convention. Other battle settings, toys, custom packs, memory, and legacy flags pass through unchanged. `simulationCount` is replaced by the optimizer's sample counts.

The result contains the response trace, cycle state indices, final orders and pets, sampled matchup estimates, and simulation/cache statistics. `generatePositionings` and `getPetPositioningHint` are also exported. Runtime engine classes remain private.

Run a saved SimulationConfig JSON file with:

```sh
node scripts/optimize-fight.mjs battle.json 42
```

Tests cover known payoff cycles, mixed-sample refinement, ties, early exits, duplicate orders, perk/support heuristics, real battles, reproducibility, input isolation, budgets, cancellation, and nested runs. They do not prove exhaustive parity across all pets or random outcomes.

A local Node 21.7.3 smoke benchmark (seed 42, one run per fixture, other tests running concurrently) measured simple combat at 255 battles / 17 pairs / 0.40 seconds, random targeting at 5,475 battles / 365 pairs / 8.40 seconds, and summon-heavy combat at the 10,000-battle budget / 667 pairs / 43.91 seconds. The first two reached cycles; the last remained incomplete. These are workload observations, not controlled speedup claims. Reproduce with `node scripts/benchmark-optimizer.mjs`; raw counters are in `reports/optimizer-benchmark.json`.
