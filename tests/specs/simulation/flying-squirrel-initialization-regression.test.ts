import { describe, expect, it } from 'vitest';
import { runSimulation, type SimulationConfig } from '../../../src/index';

const baseConfig = (): SimulationConfig => ({
  playerPack: 'Custom',
  opponentPack: 'Turtle',
  turn: 5,
  simulationCount: 1,
  logsEnabled: true,
  maxLoggedBattles: 1,
  playerPets: [],
  opponentPets: [],
});

describe('Flying Squirrel initialization regression', () => {
  it('preserves configured stats when battle startup resets pets', () => {
    const config = baseConfig();
    config.playerPets = [
      { name: 'Flying Squirrel', attack: 8, health: 8, exp: 2, mana: 7 },
    ];
    config.opponentPets = [{ name: 'Fish', attack: 1, health: 1 }];

    const result = runSimulation(config);
    const beforeBattle = result.battles?.[0]?.logs.find(
      (event) => event.message === 'Phase 1: Before battle',
    );

    expect(beforeBattle?.board.player[0]).toMatchObject({
      name: 'Flying Squirrel',
      attack: 8,
      health: 8,
      exp: 2,
      mana: 7,
    });
    expect(result).toMatchObject({ playerWins: 1, opponentWins: 0, draws: 0 });
  });

  it('initializes its friendly-toy-broke ability', () => {
    const config = baseConfig();
    config.playerToy = 'Balloon';
    config.playerToyLevel = 1;
    config.playerPets = [
      { name: 'Mandrill', attack: 1, health: 1 },
      { name: 'Flying Squirrel', attack: 3, health: 20 },
    ];
    config.opponentPets = [{ name: 'Fish', attack: 2, health: 30 }];

    const messages = runSimulation(config).battles?.[0]?.logs.map(
      (event) => event.message,
    );

    expect(messages).toContain('Flying Squirrel gave Flying Squirrel +2 attack');
    expect(messages).toContain('Balloon respawned (Level 1)!');
  });
});
