import { describe, expect, it } from 'vitest';
import {
  createBattleEngine,
  isBattleDeterministic,
  type PetConfig,
  type SimulationConfig,
} from '../src/index';

const pet = (
  name: string,
  attack: number,
  health: number,
  extra: Partial<PetConfig> = {},
): PetConfig => ({ name, attack, health, ...extra });

const battle = (
  playerPets: SimulationConfig['playerPets'],
  opponentPets: SimulationConfig['opponentPets'],
  extra: Partial<SimulationConfig> = {},
): SimulationConfig => ({
  playerPack: 'Turtle',
  opponentPack: 'Turtle',
  turn: 5,
  simulationCount: 100,
  playerPets,
  opponentPets,
  ...extra,
});

describe('battle determinism probe', () => {
  it('recognizes a battle with no random choices as deterministic', () => {
    expect(isBattleDeterministic(battle(
      [pet('Fish', 4, 5)],
      [pet('Pig', 3, 4)],
    ))).toBe(true);
  });

  it('recognizes catalog-marked random pets and toys', () => {
    expect(isBattleDeterministic(battle(
      [pet('Ant', 2, 1), pet('Fish', 3, 3), pet('Pig', 3, 3)],
      [pet('Fish', 10, 10)],
    ))).toBe(false);
    expect(isBattleDeterministic(battle(
      [pet('Fish', 4, 5)],
      [pet('Pig', 3, 4)],
      { playerToy: 'Pandoras Box', playerToyLevel: 1 },
    ))).toBe(false);
  });

  it('recognizes random mana faint targets', () => {
    expect(isBattleDeterministic(battle(
      [pet('Fish', 1, 1, { mana: 5 })],
      [pet('Fish', 10, 10), pet('Pig', 10, 10)],
    ))).toBe(false);
  });

  it('recognizes Silly equipment and pets that give Silly', () => {
    expect(isBattleDeterministic(battle(
      [pet('Fish', 4, 5, { equipment: 'Silly' })],
      [pet('Pig', 3, 4)],
    ))).toBe(false);
    expect(isBattleDeterministic(battle(
      [pet('Tree Kangaroo', 3, 4)],
      [pet('Fish', 4, 5)],
    ))).toBe(false);
  });

  it('recognizes equal-priority trigger order at runtime', () => {
    const oneTrigger = battle(
      [pet('Axehandle Hound', 5, 20)],
      [pet('Fish', 4, 20), pet('Fish', 4, 20)],
    );
    const tiedTriggers = battle(
      [pet('Axehandle Hound', 5, 20), pet('Axehandle Hound', 5, 20)],
      [pet('Fish', 4, 20), pet('Fish', 4, 20)],
    );

    expect(isBattleDeterministic(oneTrigger)).toBe(true);
    expect(isBattleDeterministic(tiedTriggers)).toBe(false);
  });

  it('recognizes a random initial attacker when front pets have equal attack', () => {
    expect(isBattleDeterministic(battle(
      [pet('Fish', 5, 10)],
      [pet('Pig', 5, 10)],
    ))).toBe(false);
  });

  it('is available on reusable engines without leaking the probe battle', () => {
    const engine = createBattleEngine({ entropy: () => 0.375 });
    const deterministic = battle(
      [pet('Fish', 4, 5)],
      [pet('Pig', 3, 4)],
    );

    const probe = engine.probeBattleDeterminism(deterministic);
    expect(probe.deterministic).toBe(true);
    expect(probe.simulation).toMatchObject({
      playerWins: 1,
      opponentWins: 0,
      draws: 0,
    });
    expect(engine.isBattleDeterministic(deterministic)).toBe(true);
    expect(engine.runHeadlessSimulation({
      ...deterministic,
      simulationCount: 1,
    })).toMatchObject({ playerWins: 1, opponentWins: 0, draws: 0 });
  });
});
