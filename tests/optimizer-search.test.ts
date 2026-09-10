import { describe, it, expect } from 'vitest';
import { searchResponses, type SearchControls } from '../src/optimizer/search';
import type { MatchupEstimate } from '../src/optimizer/types';
function estimate(player: number, opponent: number, n: number, wins: number, draws = 0): MatchupEstimate {
  const losses = n - wins - draws;
  return {playerPosition: player, opponentPosition: opponent, simulations: n, playerWins: wins, opponentWins: losses, draws,
    playerWinPercent: wins * 100 / n, opponentWinPercent: losses * 100 / n, drawPercent: draws * 100 / n,
    sampledOutcome: wins === n ? 'player-wins' : losses === n ? 'opponent-wins' : draws === n ? 'draws' : null};
}
function matrixSearch(matrix: number[][], overrides: Partial<SearchControls> = {}) {
  const calls: [number, number, number][] = [];
  const cached = new Map<string, MatchupEstimate>();
  const result = searchResponses({playerCount: matrix.length, opponentCount: matrix[0].length,
    initialSamples: 15, refinedSamples: 50, maxSteps: 200, collectAll: false,
    evaluate(p, o, n) {
      calls.push([p, o, n]);
      const key = `${p}:${o}`, old = cached.get(key);
      if (old?.simulations >= n) return old;
      const value = estimate(p, o, n, Math.round(matrix[p][o] * n)); cached.set(key, value); return value;
    }, interruption: () => null, onStep() {}, ...overrides});
  return {result, calls};
}
describe('alternating positioning responses', () => {
  it('discovers a four-response counter cycle and includes the responding side in state identity', () => {
    const {result, calls} = matrixSearch([[1, 0], [0, 1]]);
    expect(result.termination).toBe('cycle');
    expect(result.steps.map(s => [s.side, s.playerPosition, s.opponentPosition])).toEqual([
      ['player', 0, 0], ['opponent', 0, 1], ['player', 1, 1], ['opponent', 1, 0], ['player', 0, 0],
    ]);
    expect(result.cycle).toEqual({startState: 1, endState: 5, length: 4});
    expect(calls.every(c => c[2] === 15)).toBe(true);
    expect(result.steps[0].searchComplete).toBe(false);
    expect(result.steps.at(-1)?.searchComplete).toBe(true);
  });
  it('searches for an equally good unvisited response before accepting a cycle', () => {
    const {result} = matrixSearch([[1, 0], [0, 1], [1, 1]]);
    expect(result.termination).toBe('no-sampled-counter');
    expect(result.unbeatenSide).toBe('player');
    expect(result.steps.slice(0, 5).map(s => [s.side, s.playerPosition, s.opponentPosition])).toEqual([
      ['player', 0, 0], ['opponent', 0, 1], ['player', 1, 1], ['opponent', 1, 0], ['player', 2, 0],
    ]);
    expect(result.steps[4]).toMatchObject({bestResponses: [0, 2], searchedPositions: 3, searchComplete: true});
  });
  it('fully checks counters before reporting an unbeaten positioning', () => {
    const {result} = matrixSearch([[1, 1, 1], [0, 0, 0]]);
    expect(result.termination).toBe('no-sampled-counter');
    expect(result.unbeatenSide).toBe('player');
    expect(result.steps.at(-1)).toMatchObject({side: 'opponent', searchedPositions: 3, searchComplete: true});
  });
  it('can report Player 2 unbeaten during the initial response search', () => {
    const {result} = matrixSearch([[0, 1], [0, 1]]);
    expect(result.unbeatenSide).toBe('opponent');
    expect(result.steps).toHaveLength(1);
  });
  it('refines every candidate to 50 only when none has a uniform sample', () => {
    const {result, calls} = matrixSearch([[0.7, 0.4], [0.6, 0.5]]);
    expect(result.termination).toBe('cycle');
    expect(result.steps[0].refined).toBe(true);
    expect(calls.slice(0, 4)).toEqual([[0, 0, 15], [1, 0, 15], [0, 0, 50], [1, 0, 50]]);
    expect(result.steps[0].matchup.simulations).toBe(50);
  });
  it('does not refine if even one candidate is an all-loss sample', () => {
    const {result, calls} = matrixSearch([[0.6], [0]], {maxSteps: 1});
    expect(result.steps[0].refined).toBe(false);
    expect(calls.map(c => c[2])).toEqual([15, 15]);
  });
  it('does not refine all-draw positions and treats them as non-winning counters', () => {
    const {result, calls} = matrixSearch([[0], [0]], {evaluate: (p, o, n) => estimate(p, o, n, 0, n)});
    expect(result.termination).toBe('no-sampled-counter');
    expect(result.steps[0].matchup.sampledOutcome).toBe('draws');
    expect(result.steps[0].refined).toBe(false);
  });
  it('returns all equal best responses when exhaustive tie collection is requested', () => {
    const {result} = matrixSearch([[1], [1], [0]], {collectAll: true, maxSteps: 1});
    expect(result.steps[0].bestResponses).toEqual([0, 1]);
    expect(result.steps[0].searchComplete).toBe(true);
  });
  it('maximizes own win rate before draw rate, including for Player 2', () => {
    const {result} = matrixSearch([[0.7, 0.3, 0.5]], {maxSteps: 2});
    expect(result.steps[1].opponentPosition).toBe(1);
    const tie = matrixSearch([[0], [0]], {maxSteps: 1, evaluate: (p, o, n) => estimate(p, o, n, 5, p ? 8 : 1)});
    expect(tie.result.steps[0].playerPosition).toBe(1);
  });
  it('does not call a one-sided unchanged move a cycle before the other side responds', () => {
    const {result} = matrixSearch([[1, 0]], {maxSteps: 2});
    expect(result.steps).toHaveLength(2);
    expect(result.steps[1].opponentPosition).toBe(1);
    expect(result.termination).toBe('step-limit');
  });
  it('does not publish partially searched responses when evaluation is interrupted', () => {
    const {result} = matrixSearch([[0.5], [0.5]], {evaluate: (p, o, n) => p ? null : estimate(p, o, n, 7), interruption: () => 'simulation-budget'});
    expect(result.termination).toBe('simulation-budget'); expect(result.steps).toEqual([]);
  });
});
