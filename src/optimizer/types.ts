import type { PetConfig, SimulationConfig } from '../app/domain/interfaces/simulation-config.interface';
export type OptimizerSide = 'player' | 'opponent';
export interface Positioning {
  /** Index into the corresponding result.positionings array, in heuristic order. */
  id: number;
  /** Original zero-based input slots, now arranged front to back (including empty slots). */
  order: number[];
}
export interface MatchupEstimate {
  playerPosition: number;
  opponentPosition: number;
  simulations: number;
  playerWins: number;
  opponentWins: number;
  draws: number;
  playerWinPercent: number;
  opponentWinPercent: number;
  drawPercent: number;
  /** Uniform observed samples, never a proof over all random outcomes. */
  sampledOutcome: 'player-wins' | 'opponent-wins' | 'draws' | null;
}
export interface ResponseStep {
  index: number;
  side: OptimizerSide;
  playerPosition: number;
  opponentPosition: number;
  matchup: MatchupEstimate;
  /** Equal best win rate and draw rate among the positions searched. */
  bestResponses: number[];
  searchedPositions: number;
  searchComplete: boolean;
  refined: boolean;
}
export interface OptimizerProgress {
  phase: 'sampling' | 'response';
  simulations: number;
  evaluatedMatchups: number;
  potentialMatchups: number;
  completedResponses: number;
}
export interface FightOptimizerOptions {
  /** Defaults to config.seed when finite, otherwise 1. Controls both random streams. */
  seed?: number;
  initialSimulations?: number; // default 15
  refinementSimulations?: number; // default 50
  /** Scan all responses even after finding a sampled 100% win. Default false. */
  collectAllBestResponses?: boolean;
  /** Optional hard limits; hitting one returns an explicitly incomplete result. */
  maxSimulations?: number;
  maxResponseSteps?: number;
  shouldAbort?: () => boolean;
  onProgress?: (progress: OptimizerProgress) => void;
}
export interface FightOptimizerResult {
  evidence: 'sampled';
  termination: 'cycle' | 'no-sampled-counter' | 'simulation-budget' | 'step-limit' | 'cancelled';
  positionings: { player: Positioning[]; opponent: Positioning[] };
  /** Starts with Player 1 responding to Player 2's heuristic positioning. */
  steps: ResponseStep[];
  /** State indices: 0 is the initial heuristic pair; step i produces state i + 1. */
  cycle?: { startState: number; endState: number; length: number };
  unbeatenSide?: OptimizerSide;
  finalPosition: {
    playerOrder: number[];
    opponentOrder: number[];
    playerPets: SimulationConfig['playerPets'];
    opponentPets: SimulationConfig['opponentPets'];
    matchup?: MatchupEstimate;
  };
  matchups: MatchupEstimate[];
  stats: {
    simulations: number;
    evaluatedMatchups: number;
    potentialMatchups: number;
    cacheHits: number;
    engineCalls: number;
    seed: number;
    elapsedMs: number;
  };
}
export interface PetPositioningHint {
  effectiveAttack: number;
  health: number;
  avoidFront: boolean;
}
export type Lineup = (PetConfig | null)[];
