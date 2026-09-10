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
    const evaluatePosition = (position: number, samples: number) => {
      const estimate = control.evaluate(side === 'player' ? position : player, side === 'opponent' ? position : opponent, samples);
      if (!estimate) return null;
      estimates.push(estimate);
      hasUniformOutcome ||= estimate.sampledOutcome !== null;
      consider(estimate, position);
      return estimate;
    };
    for (let position = 0; position < count; position++) {
      const estimate = evaluatePosition(position, control.initialSamples);
      if (!estimate) return finish(control.interruption() ?? 'simulation-budget');
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
    // A refinement can overturn an earlier best response. Do not reuse cycle evidence
    // collected against the previous estimates. Adding an unseen pair cannot do that.
    if (changedEvidence) seen.clear();
    const nextSide: OptimizerSide = side === 'player' ? 'opponent' : 'player';
    const stateKey = (position: number) => side === 'player'
      ? `${position}:${opponent}:${nextSide}`
      : `${player}:${position}:${nextSide}`;
    let response = bestResponses[0];
    let cycleStart = seen.get(stateKey(response));
    if (cycleStart !== undefined) {
      // Early all-win exits normally leave the rest of the response set unsearched.
      // Once that provisional choice would cycle, inspect the remaining positions and
      // prefer an equally ranked (or newly discovered better) unvisited response.
      for (let position = estimates.length; position < count; position++) {
        if (!evaluatePosition(position, control.initialSamples)) return finish(control.interruption() ?? 'simulation-budget');
      }
      const alternative = bestResponses.find(position => !seen.has(stateKey(position)));
      if (alternative !== undefined) {
        response = alternative;
        cycleStart = undefined;
      } else {
        response = bestResponses[0];
        cycleStart = seen.get(stateKey(response));
      }
    }
    if (side === 'player') player = response;
    else opponent = response;
    const step: ResponseStep = {
      index, side, playerPosition: player, opponentPosition: opponent, matchup: {...estimates[response]},
      bestResponses, searchedPositions: estimates.length, searchComplete: estimates.length === count, refined,
    };
    steps.push(step);
    control.onStep(step);
    if (control.interruption() === 'cancelled') return finish('cancelled');
    if (step.searchComplete && estimates.every(estimate => wins(estimate, side) === 0)) {
      return {...finish('no-sampled-counter'), unbeatenSide: side === 'player' ? 'opponent' : 'player'};
    }
    side = nextSide;
    const key = `${player}:${opponent}:${side}`;
    const stateIndex = steps.length;
    if (cycleStart !== undefined) return {...finish('cycle'), cycle: {startState: cycleStart, endState: stateIndex, length: stateIndex - cycleStart}};
    seen.set(key, stateIndex);
  }
  return finish('step-limit');
}
