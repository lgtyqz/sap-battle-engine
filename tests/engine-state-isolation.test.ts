import { describe, expect, it } from 'vitest';
import {
  createBattleEngine,
  optimizeFight,
  type SimulationConfig,
} from '../src/index';

const battle = (
  playerPets: SimulationConfig['playerPets'],
  opponentPets: SimulationConfig['opponentPets'],
): SimulationConfig => ({
  playerPack: 'Turtle',
  opponentPack: 'Turtle',
  turn: 1,
  playerPets,
  opponentPets,
  simulationCount: 1,
});

describe('engine state isolation', () => {
  it('clears empty slots when a reusable engine loads a new battle', () => {
    const engine = createBattleEngine();
    engine.runHeadlessSimulation(battle(
      [{ name: 'Fish', attack: 20, health: 20 }],
      [{ name: 'Fish', attack: 1, health: 1 }],
    ));

    const result = engine.runHeadlessSimulation(battle(
      [],
      [{ name: 'Fish', attack: 1, health: 1 }],
    ));

    expect(result).toMatchObject({ playerWins: 0, opponentWins: 1, draws: 0 });
  });

  it('reports the Gorilla and Scorpion positioning as a draw', () => {
    const playerPets: SimulationConfig['playerPets'] = [
      { name: 'Gorilla', attack: 7, health: 7 },
      { name: 'Scorpion', attack: 10, health: 1 },
      { name: 'Rhino', attack: 7, health: 8 },
      null,
      null,
    ];
    const opponentPets: SimulationConfig['opponentPets'] = [
      { name: 'Scorpion', attack: 10, health: 1 },
      { name: 'Gorilla', attack: 7, health: 7 },
      { name: 'Rhino', attack: 7, health: 8 },
      null,
      null,
    ];
    const result = optimizeFight(battle(playerPets, opponentPets), {
      seed: 67,
      maxResponseSteps: 9,
    });
    const unchangedOrder = (position: { order: number[] }) =>
      position.order.every((slot, index) => slot === index);
    const playerPosition = result.positionings.player.find(unchangedOrder)!.id;
    const opponentPosition = result.positionings.opponent.find(unchangedOrder)!.id;
    const matchup = result.matchups.find(
      (estimate) =>
        estimate.playerPosition === playerPosition &&
        estimate.opponentPosition === opponentPosition,
    );

    expect(matchup).toMatchObject({
      simulations: 15,
      playerWins: 0,
      opponentWins: 0,
      draws: 15,
      drawPercent: 100,
      sampledOutcome: 'draws',
    });
  });
});
