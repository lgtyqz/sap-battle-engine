import { describe, expect, it } from 'vitest';
import { runSimulation, type SimulationConfig } from '../../../src/index';

const auditedPets = [
  'Aardvark',
  'Axehandle Hound',
  'Brazillian Treehopper',
  'Pegasus',
  'Cracked Egg',
  'Gold Fish',
] as const;

const createConfig = (name: string): SimulationConfig => ({
  playerPack: 'Custom',
  opponentPack: 'Turtle',
  turn: 5,
  simulationCount: 1,
  logsEnabled: true,
  maxLoggedBattles: 1,
  playerPets: [{
    name,
    attack: 17,
    health: 19,
    exp: 2,
    mana: 7,
    equipment: 'Garlic',
  }],
  opponentPets: [],
});

describe('pet constructor audit regressions', () => {
  it.each(auditedPets)('%s preserves its configured runtime state', (name) => {
    const result = runSimulation(createConfig(name));
    const beforeBattle = result.battles?.[0]?.logs.find(
      (event) => event.message === 'Phase 1: Before battle',
    );

    expect(beforeBattle?.board.player[0]).toMatchObject({
      name,
      attack: 17,
      health: 19,
      exp: 2,
      mana: 7,
      equipment: 'Garlic',
    });
    expect(result).toMatchObject({ playerWins: 1, opponentWins: 0, draws: 0 });
  });
});
