import { describe, expect, it } from 'vitest';
import { createBaseConfig, createPet, runBattleLogs } from '../../support/battle-test-runtime';

describe('transforming perks and ailments', () => {
  for (const [equipment, pet, pack] of [
    ['Gros Michel Banana', 'Fish', 'Danger'],
    ['Seaweed', 'Fish', 'Star'],
    ['Confused', 'Caterpillar', 'Custom'],
  ] as const) {
    it(`removes ${equipment} from the transformed pet`, () => {
      const config = createBaseConfig(pack);
      config.logsEnabled = true;
      config.playerPets[0] = createPet(pet, {
        attack: 1,
        health: 50,
        equipment: { name: equipment },
      });
      config.opponentPets[0] = createPet('Fish', { attack: 1, health: 50 });

      const logs = runBattleLogs(config);
      const transformationIndex = logs.findIndex((log) =>
        log.message.includes('transformed into') && log.message.includes(`(${equipment})`),
      );

      expect(transformationIndex).toBeGreaterThanOrEqual(0);
      expect(logs.filter((log) => log.message.includes(`(${equipment})`) &&
        log.message.includes('transformed into'))).toHaveLength(1);
      const subsequentLogs = logs.slice(transformationIndex + 1);
      expect(subsequentLogs.some((log) => log.board.player[0] != null)).toBe(true);
      expect(subsequentLogs.some((log) =>
        log.board.player.some((boardPet) => boardPet?.equipment === equipment),
      )).toBe(false);
    });
  }
});
