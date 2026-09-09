import type { FightOptimizerResult, MatchupEstimate, OptimizerSide, ResponseStep } from './types';
export interface SearchControls {
  playerCount: number;
  opponentCount: number;
  initialSamples: number;
  refinedSamples: number;
  collectAll: boolean;
  maxSteps: number;
  evaluate(player: number, opponent: number, samples: number): MatchupEstimate | null;
  interruption(): 'cancelled' | 'simulation-budget' | null;
  onStep(step: ResponseStep): void;
}
export interface DynamicsResult {
  termination: FightOptimizerResult['termination'];
  steps: ResponseStep[];
  player: number;
  opponent: number;
  cycle?: FightOptimizerResult['cycle'];
  unbeatenSide?: OptimizerSide;
}
function wins(match: MatchupEstimate, side: OptimizerSide) {
  return side === 'player' ? match.playerWins : match.opponentWins;
}
function compare(a: MatchupEstimate, b: MatchupEstimate, side: OptimizerSide): number {
  // Cross-products avoid rounding percent estimates (15- and 50-sample entries can coexist).
  return wins(a, side) * b.simulations - wins(b, side) * a.simulations || a.draws * b.simulations - b.draws * a.simulations;
}

/** Alternating sampled best responses, not a minimax or a mixed-strategy solver. */
export function searchResponses(control: SearchControls): DynamicsResult {
  let player = 0, opponent = 0;
  let side: OptimizerSide = 'player';
  const steps: ResponseStep[] = [];
  const seen = new Map<string, number>([['0:0:player', 0]]);
  const finish = (termination: DynamicsResult['termination']): DynamicsResult => ({termination, steps, player, opponent});
  for (let index = 0; index < control.maxSteps; index++) {
    if (control.interruption() === 'cancelled') return finish('cancelled');
    const count = side === 'player' ? control.playerCount : control.opponentCount;
    const estimates: MatchupEstimate[] = [];
    let hasUniformOutcome = false;
    let best: MatchupEstimate | undefined;
    let bestResponses: number[] = [];
    const consider = (estimate: MatchupEstimate, position: number) => {
      const difference = best ? compare(estimate, best, side) : 1;
      if (difference > 0) { best = estimate; bestResponses = [position]; }
      else if (difference === 0) bestResponses.push(position);
    };
    for (let position = 0; position < count; position++) {
      const estimate = control.evaluate(side === 'player' ? position : player, side === 'opponent' ? position : opponent, control.initialSamples);
      if (!estimate) return finish(control.interruption() ?? 'simulation-budget');
      estimates.push(estimate);
      hasUniformOutcome ||= estimate.sampledOutcome !== null;
      consider(estimate, position);
      if (!control.collectAll && wins(estimate, side) === estimate.simulations) break;
    }
    let refined = false, changedEvidence = false;
    if (!hasUniformOutcome && control.refinedSamples > control.initialSamples) {
      refined = true;
      best = undefined; bestResponses = [];
      // Once refinement is needed, bring every candidate in the response search to 50.
      for (let position = 0; position < count; position++) {
        const before = estimates[position];
        const estimate = control.evaluate(side === 'player' ? position : player, side === 'opponent' ? position : opponent, control.refinedSamples);
        if (!estimate) return finish(control.interruption() ?? 'simulation-budget');
        changedEvidence ||= before.simulations < estimate.simulations;
        estimates[position] = estimate;
        consider(estimate, position);
      }
    }
    if (side === 'player') player = bestResponses[0];
    else opponent = bestResponses[0];
    const step: ResponseStep = {
      index, side, playerPosition: player, opponentPosition: opponent, matchup: {...best},
      bestResponses, searchedPositions: estimates.length, searchComplete: estimates.length === count, refined,
    };
    steps.push(step);
    control.onStep(step);
    if (control.interruption() === 'cancelled') return finish('cancelled');
    if (step.searchComplete && estimates.every(estimate => wins(estimate, side) === 0)) {
      return {...finish('no-sampled-counter'), unbeatenSide: side === 'player' ? 'opponent' : 'player'};
    }
    side = side === 'player' ? 'opponent' : 'player';
    // A refinement can overturn an earlier best response. Do not reuse cycle evidence
    // collected against the previous estimates. Adding an unseen pair cannot do that.
    if (changedEvidence) seen.clear();
    const key = `${player}:${opponent}:${side}`;
    const stateIndex = steps.length;
    const cycleStart = seen.get(key);
    if (cycleStart !== undefined) return {...finish('cycle'), cycle: {startState: cycleStart, endState: stateIndex, length: stateIndex - cycleStart}};
    seen.set(key, stateIndex);
  }
  return finish('step-limit');
}
