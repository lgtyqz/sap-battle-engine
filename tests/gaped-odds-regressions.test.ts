import { describe, expect, it } from 'vitest';
import { createBattleEngine, type SimulationConfig } from '../src/index';

const pet = (
  name: string,
  attack: number,
  health: number,
  exp = 0,
  equipment?: string,
) => ({ name, attack, health, exp, ...(equipment ? { equipment } : {}) });

const battle = (
  turn: number,
  playerPets: SimulationConfig['playerPets'],
  opponentPets: SimulationConfig['opponentPets'],
  seed: number,
): SimulationConfig => ({
  playerPack: 'Custom',
  opponentPack: 'Custom',
  turn,
  playerPets,
  opponentPets,
  seed,
  simulationCount: 1,
  logsEnabled: true,
});

describe('Gaped battle odds regressions', () => {
  it('turn 14 has a reachable tie branch', () => {
    // The payload has random effects. This is one fixed branch, not a claim
    // that the SAP seed reproduces the original game's random choices.
    const config = battle(14, [
      pet('Farmer Crow', 24, 22, 3),
      pet('Bay Cat', 26, 27, 2, 'White Okra'),
      pet('Volcano Snail', 29, 32, 5, 'Cod Roe'),
      pet('Farmer Dog', 7, 8, 2),
      pet('Chimpanzee', 10, 10, 3),
    ], [
      pet('Flea', 17, 16, 5),
      pet('Vampire Bat', 8, 15, 0, 'Honeydew Melon'),
      pet('Anubis', 12, 13, 2, 'Churros'),
      pet('Flounder', 4, 6),
      pet('Spiny Bush Viper', 7, 4, 2, 'White Truffle'),
    ], 6);

    const result = createBattleEngine({ entropy: () => 0.5 }).runSimulation(config);
    expect(result.draws).toBe(1);
  });

  it('turn 5 gives the swallowed Quetzalcoatlus room to spawn and buffs its killer team', () => {
    const config = battle(5, [
      pet('Angelshark', 3, 3, 0, 'Squash'),
      pet('Tropical Fish', 3, 4),
      pet('Volcano Snail', 5, 11, 3, 'Cod Roe'),
      pet('Kangaroo', 3, 5, 1),
      pet('Barghest', 4, 7, 2),
    ], [
      { ...pet('Sarcastic Fringehead', 6, 7), sarcasticFringeheadSwallowedPet: 'Quetzalcoatlus' },
      pet('Mandarinfish', 5, 4, 1),
      pet('Tadpole', 4, 4, 2),
      pet('Stoat', 3, 3),
      pet('Marmoset', 3, 4, 1),
    ], 1807836382);

    const result = createBattleEngine({ entropy: () => 0.5 }).runSimulation(config);
    const messages = result.battles?.[0]?.logs.map((event) => event.message) ?? [];
    expect(messages).toContain('Sarcastic Fringehead spawned Quetzalcoatlus for the opponent.');
    expect(messages).toContain('Quetzalcoatlus (Faint) gave +1/+1 to Mandarinfish and its friends.');
    expect(result.draws).toBe(1);
  });

  it('turn 5 preserves Gelada’s first food charge through battle reset', () => {
    const config = battle(5, [
      pet('Tsuchinoko', 5, 4, 3),
      pet('Lemming', 5, 4, 2),
      pet('Mandrake', 4, 3, 0, 'Radish'),
      pet('Jellyfish', 4, 4, 0, 'Sausage'),
      { ...pet('Gelada', 4, 5, 0, 'Radish'), foodsEaten: 1 },
    ], [
      pet('Beetle', 2, 5),
      pet('Moth', 5, 7, 4),
      pet('Dolphin', 5, 7, 1),
      pet('Robin', 4, 8, 2),
      pet('Orangutan', 2, 5),
    ], 506529947);

    const result = createBattleEngine({ entropy: () => 0.5 }).runSimulation(config);
    expect(result.battles?.[0]?.logs.some((event) =>
      event.message.includes('Gelada transformed into Sleeping Gelada'))).toBe(true);
    expect(result.playerWins).toBe(1);
  });
});
