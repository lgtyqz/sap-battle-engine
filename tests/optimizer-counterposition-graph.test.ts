import { describe, expect, it } from 'vitest';
import { condenseResponseTrace } from '../src/optimizer/counterposition-graph';
import type { MatchupEstimate, OptimizerSide, ResponseStep } from '../src/optimizer/types';

function matchup(player: number, opponent: number): MatchupEstimate {
  return {playerPosition:player, opponentPosition:opponent, simulations:15, playerWins:15, opponentWins:0, draws:0,
    playerWinPercent:100, opponentWinPercent:0, drawPercent:0, sampledOutcome:'player-wins'};
}
function step(index: number, side: OptimizerSide, player: number, opponent: number, bestResponses?: number[]): ResponseStep {
  return {index, side, playerPosition:player, opponentPosition:opponent, matchup:matchup(player, opponent),
    bestResponses:bestResponses ?? [side === 'player' ? player : opponent], searchedPositions:3, searchComplete:true, refined:false};
}
const lookup = (player: number, opponent: number) => matchup(player, opponent);

describe('counterposition graph condensation', () => {
  it('uses the shortest graph path rather than merely removing the latest loop', () => {
    const raw = [
      step(0, 'player', 0, 0),
      step(1, 'opponent', 0, 1),
      step(2, 'player', 1, 1),
      step(3, 'opponent', 1, 0),
      step(4, 'player', 2, 0),
      step(5, 'opponent', 2, 2),
      step(6, 'player', 1, 2),
      step(7, 'opponent', 1, 3),
    ];
    const result = condenseResponseTrace(raw, 'no-sampled-counter', undefined, lookup);
    expect(result.steps.map(entry => [entry.side, entry.playerPosition, entry.opponentPosition])).toEqual([
      ['player', 0, 0], ['opponent', 0, 1], ['player', 1, 1], ['opponent', 1, 3],
    ]);
    expect(result.steps.map(entry => entry.index)).toEqual([0, 1, 2, 3]);
  });

  it('keeps the shortest discovered cycle and reindexes its state bounds', () => {
    const raw = [
      step(0, 'player', 0, 0),
      step(1, 'opponent', 0, 1, [0, 1]),
      step(2, 'player', 1, 1),
      step(3, 'opponent', 1, 2),
      step(4, 'player', 2, 2),
      step(5, 'opponent', 2, 0),
      step(6, 'player', 0, 0),
    ];
    const result = condenseResponseTrace(raw, 'cycle', {startState:1, endState:7, length:6}, lookup);
    expect(result.steps.map(entry => [entry.side, entry.playerPosition, entry.opponentPosition])).toEqual([
      ['player', 0, 0], ['opponent', 0, 0], ['player', 0, 0],
    ]);
    expect(result.cycle).toEqual({startState:1, endState:3, length:2});
  });
});
