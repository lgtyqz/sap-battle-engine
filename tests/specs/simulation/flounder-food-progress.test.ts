import { describe, expect, it } from 'vitest';
import { projectLineupAfterEndTurn, runSimulation } from '../../../src';
import { createBaseConfig, createPet } from '../../support/battle-test-runtime';

describe('Flounder saved food progress', () => {
  it.each([0, 1, 2, 4])('uses %i saved foods in every simulated battle', (foodsEaten) => {
    const config = createBaseConfig();
    config.logsEnabled = true;
    config.simulationCount = 3;
    config.maxLoggedBattles = 3;
    config.playerPets = [
      createPet('Flounder', { foodsEaten, exp: 2 }),
      createPet('Fish'), createPet('Fish'), null, null,
    ];
    config.opponentPets[0] = createPet('Fish', { attack: 50, health: 50 });
    const result = runSimulation(config);
    expect(result.battles).toHaveLength(3);
    for (const battle of result.battles ?? []) {
      const transformations = battle.logs.filter((log) =>
        log.message === 'Flounder transformed into Adult Flounder.');
      expect(transformations).toHaveLength(foodsEaten >= 2 ? 1 : 0);
      if (foodsEaten >= 2) {
        expect(transformations[0].board.player[0]?.name).toBe('Adult Flounder');
      }
    }
  });

  it.each(['player', 'opponent'] as const)(
    'combines saved progress with new food on the %s team', (side) => {
      const config = createBaseConfig();
      const lineup = [
        createPet('Flounder', { foodsEaten: 1, exp: 2 }),
        createPet('Farmer Dog'), createPet('Fish'), null, null,
      ];
      const projected = projectLineupAfterEndTurn(config, side, lineup);
      expect(projected[0]?.name).toBe('Adult Flounder');
      expect(projected[1]?.exp).toBe(2);
      expect(projected[2]?.exp).toBe(2);
      const unseeded = projectLineupAfterEndTurn(config, side, [
        { ...lineup[0], foodsEaten: 0 }, ...lineup.slice(1),
      ]);
      expect(unseeded[0]?.name).toBe('Flounder');
      expect(unseeded[1]?.exp).toBe(0);
    },
  );
});
