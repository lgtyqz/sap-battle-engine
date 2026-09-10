import type {
  BattleDeterminismProbeResult,
  SimulationConfig,
  SimulationResult,
} from '../app/domain/interfaces/simulation-config.interface';
import { createSeededRandom } from '../app/gameplay/simulation-randomness';
import { condenseResponseTrace } from './counterposition-graph';
import { createEndTurnLineupResolver, type EndTurnProjector } from './end-turn';
import { generatePositionings, normalizeLineup } from './positionings';
import { searchResponses } from './search';
import type { FightOptimizerOptions, FightOptimizerResult, MatchupEstimate } from './types';

/** Test seam; the public API always uses the real battle engine. */
export type BattleSampler = (config: SimulationConfig, entropy: () => number, shouldAbort: () => boolean) => SimulationResult;
export type BattleDeterminismProbe = (
  config: SimulationConfig,
  entropy: () => number,
) => BattleDeterminismProbeResult;
interface CachedMatchup {
  player: number;
  opponent: number;
  playerWins: number;
  opponentWins: number;
  draws: number;
  random: () => number;
  deterministic?: boolean;
}
function summarize(match: CachedMatchup): MatchupEstimate {
  const n = match.playerWins + match.opponentWins + match.draws;
  return {playerPosition: match.player, opponentPosition: match.opponent, simulations: n,
    playerWins: match.playerWins, opponentWins: match.opponentWins, draws: match.draws,
    playerWinPercent: n ? match.playerWins * 100 / n : 0, opponentWinPercent: n ? match.opponentWins * 100 / n : 0, drawPercent: n ? match.draws * 100 / n : 0,
    sampledOutcome: n === 0 ? null : match.playerWins === n ? 'player-wins' : match.opponentWins === n ? 'opponent-wins' : match.draws === n ? 'draws' : null};
}
function integer(value: number | undefined, fallback: number, minimum: number, name: string): number {
  const resolved = value ?? fallback;
  if (!Number.isSafeInteger(resolved) || resolved < minimum) throw new Error(`${name} must be an integer >= ${minimum}`);
  return resolved;
}
export function runFightOptimizer(
  input: SimulationConfig,
  options: FightOptimizerOptions,
  sample: BattleSampler,
  projectEndTurn?: EndTurnProjector,
  probeDeterminism?: BattleDeterminismProbe,
): FightOptimizerResult {
  const start = performance.now();
  const initial = integer(options.initialSimulations, 15, 1, 'initialSimulations');
  const refinement = integer(options.refinementSimulations, 50, initial, 'refinementSimulations');
  const budget = options.maxSimulations === undefined ? Infinity : integer(options.maxSimulations, 0, 0, 'maxSimulations');
  const rawSeed = options.seed ?? (Number.isFinite(input.seed) ? input.seed : 1);
  if (!Number.isFinite(rawSeed)) throw new Error('Optimizer seed must be finite');
  const seed = Math.trunc(rawSeed) >>> 0;
  // Decision indices/options refer to a particular fight order, so reusing them
  // across permutations would compare different constrained events or invalid tapes.
  if (input.randomDecisionOverrides?.length || input.randomDrawOverrides !== undefined) throw new Error('Remove battle-specific random overrides before optimizing positionings');
  const config = structuredClone(input);
  const playerPets = normalizeLineup(config.playerPets), opponentPets = normalizeLineup(config.opponentPets);
  const playerPositions = generatePositionings(playerPets), opponentPositions = generatePositionings(opponentPets);
  const projectionConfig = {...config, playerPets, opponentPets, seed};
  const rawPlayerLineup = (position: number) => playerPositions[position].order.map(slot => playerPets[slot]);
  const rawOpponentLineup = (position: number) => opponentPositions[position].order.map(slot => opponentPets[slot]);
  const resolvePlayerLineup = projectEndTurn
    ? createEndTurnLineupResolver(projectionConfig, 'player', playerPets, projectEndTurn)
    : (position: typeof playerPositions[number]) => rawPlayerLineup(position.id);
  const resolveOpponentLineup = projectEndTurn
    ? createEndTurnLineupResolver(projectionConfig, 'opponent', opponentPets, projectEndTurn)
    : (position: typeof opponentPositions[number]) => rawOpponentLineup(position.id);
  const playerLineups = new Map<number, SimulationConfig['playerPets']>();
  const opponentLineups = new Map<number, SimulationConfig['opponentPets']>();
  const playerLineup = (position: number) => {
    let lineup = playerLineups.get(position);
    if (!lineup) { lineup = resolvePlayerLineup(playerPositions[position]); playerLineups.set(position, lineup); }
    return lineup;
  };
  const opponentLineup = (position: number) => {
    let lineup = opponentLineups.get(position);
    if (!lineup) { lineup = resolveOpponentLineup(opponentPositions[position]); opponentLineups.set(position, lineup); }
    return lineup;
  };
  const potential = playerPositions.length * opponentPositions.length;
  const maxSteps = integer(options.maxResponseSteps, 2 * potential + 1, 0, 'maxResponseSteps');
  const cache = new Map<number, CachedMatchup>();
  let simulations = 0, cacheHits = 0, engineCalls = 0, completedResponses = 0;
  let aborted = false;
  const shouldAbort = () => aborted ||= options.shouldAbort?.() === true;
  const interruption = () => shouldAbort() ? 'cancelled' as const : simulations >= budget ? 'simulation-budget' as const : null;
  const progress = (phase: 'sampling' | 'response') => options.onProgress?.({phase, simulations, evaluatedMatchups: cache.size, potentialMatchups: potential, completedResponses});
  const base: SimulationConfig = {...config, seed: null, logsEnabled: false, maxLoggedBattles: 0,
    captureRandomDecisions: false, captureRandomDraws: false, randomDecisionOverrides: [], randomDrawOverrides: undefined,
    optimizeDeterministicSimulations: false};
  const evaluate = (player: number, opponent: number, target: number): MatchupEstimate | null => {
    if (shouldAbort()) return null;
    const key = player * opponentPositions.length + opponent;
    let entry = cache.get(key);
    if (entry) {
      const n = entry.playerWins + entry.opponentWins + entry.draws;
      if (entry.deterministic || n >= target) { cacheHits++; return summarize(entry); }
    }
    if (simulations >= budget) return null;
    if (!entry) {
      // A pair-specific stream makes exploration order irrelevant; keeping the
      // generator extends the first 15 trials by 35 rather than rerunning them.
      const pairSeed = (Math.imul(key + 1, 0x9e3779b1) ^ seed) >>> 0;
      entry = {player, opponent, playerWins: 0, opponentWins: 0, draws: 0, random: createSeededRandom(pairSeed)};
      cache.set(key, entry);
    }
    const matchupConfig = (simulationCount: number): SimulationConfig => ({
      ...base,
      playerPets: playerLineup(player),
      opponentPets: opponentLineup(opponent),
      simulationCount,
    });
    const record = (outcome: SimulationResult, requested: number): number => {
      const actual = outcome.playerWins + outcome.opponentWins + outcome.draws;
      if (
        ![outcome.playerWins, outcome.opponentWins, outcome.draws]
          .every(n => Number.isSafeInteger(n) && n >= 0) ||
        actual > requested
      ) {
        throw new Error('Battle engine returned invalid sample counts');
      }
      if (outcome.randomOverrideError) throw new Error(outcome.randomOverrideError);
      entry.playerWins += outcome.playerWins;
      entry.opponentWins += outcome.opponentWins;
      entry.draws += outcome.draws;
      simulations += actual;
      engineCalls++;
      progress('sampling');
      return actual;
    };

    if (probeDeterminism && entry.deterministic === undefined) {
      const probe = probeDeterminism(matchupConfig(1), entry.random);
      entry.deterministic = probe.deterministic;
      if (probe.simulation) {
        const actual = record(probe.simulation, 1);
        if (actual < 1) {
          throw new Error('Battle engine stopped before completing the determinism probe');
        }
      } else if (probe.deterministic) {
        throw new Error('Deterministic battle probe did not return its simulation');
      }
      if (shouldAbort()) return null;
    }

    const previous = entry.playerWins + entry.opponentWins + entry.draws;
    if (entry.deterministic || previous >= target) return summarize(entry);
    if (simulations >= budget) return null;

    const requested = Math.min(target - previous, budget - simulations);
    const outcome = sample(matchupConfig(requested), entry.random, shouldAbort);
    const actual = record(outcome, requested);
    if (actual < requested && !shouldAbort()) throw new Error('Battle engine stopped before completing the requested samples');
    return shouldAbort() || previous + actual < target ? null : summarize(entry);
  };
  const dynamics = searchResponses({playerCount: playerPositions.length, opponentCount: opponentPositions.length,
    initialSamples: initial, refinedSamples: refinement, collectAll: options.collectAllBestResponses ?? false, maxSteps,
    evaluate, interruption, onStep() { completedResponses++; progress('response'); }});
  const trace = condenseResponseTrace(dynamics.steps, dynamics.termination, dynamics.cycle, (player, opponent) => {
    const match = cache.get(player * opponentPositions.length + opponent);
    return match ? summarize(match) : undefined;
  });
  const p = playerPositions[dynamics.player], o = opponentPositions[dynamics.opponent];
  const finalPlayerLineup = playerLineup(dynamics.player), finalOpponentLineup = opponentLineup(dynamics.opponent);
  const finalMatch = cache.get(dynamics.player * opponentPositions.length + dynamics.opponent);
  return {
    evidence: 'sampled', termination: dynamics.termination, positionings: {player: playerPositions, opponent: opponentPositions}, steps: trace.steps,
    ...(trace.cycle ? {cycle: trace.cycle} : {}), ...(dynamics.unbeatenSide ? {unbeatenSide: dynamics.unbeatenSide} : {}),
    finalPosition: {playerOrder: p.order.slice(), opponentOrder: o.order.slice(),
      playerPets: structuredClone(finalPlayerLineup), opponentPets: structuredClone(finalOpponentLineup),
      ...(finalMatch ? {matchup: summarize(finalMatch)} : {})},
    matchups: Array.from(cache.values(), summarize),
    stats: {simulations, evaluatedMatchups: cache.size, potentialMatchups: potential, cacheHits, engineCalls, seed, elapsedMs: performance.now() - start},
  };
}
