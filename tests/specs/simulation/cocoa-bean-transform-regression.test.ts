import { describe, expect, it } from 'vitest';
import { createBaseConfig, createPet, runBattleLogs } from '../../support/battle-test-runtime';

describe('Cocoa Bean transformation', () => {
  it('consumes the perk before the transformed pet resolves the same attack trigger', () => {
    const config = createBaseConfig('Danger');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Fish', {
      attack: 1,
      health: 50,
      equipment: { name: 'Cocoa Bean' },
    });
    config.opponentPets[0] = createPet('Fish', { attack: 1, health: 50 });

    const logs = runBattleLogs(config);
    const transformations = logs.filter((log) =>
      log.message.includes('transformed into') && log.message.includes('(Cocoa Bean)'),
    );

    expect(transformations).toHaveLength(1);
    expect(logs.some((log) =>
      log.board.player[0]?.name !== 'Fish' && log.board.player[0]?.equipment === 'Cocoa Bean',
    )).toBe(false);
  });

  it('resolves a White Truffle jump into a Cocoa Bean pet without repeating the transform', () => {
    const config = createBaseConfig('Danger');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Fish', { attack: 10, health: 10 });
    config.playerPets[1] = createPet('Fish', {
      attack: 20,
      health: 20,
      equipment: { name: 'Cocoa Bean' },
    });
    config.opponentPets[0] = createPet('Pig', { attack: 1, health: 1 });
    config.opponentPets[1] = createPet('Fish', {
      attack: 2,
      health: 20,
      equipment: { name: 'White Truffle' },
    });

    const logs = runBattleLogs(config);
    expect(logs.filter((log) =>
      log.message.includes('gained 4 attack (White Truffle)'),
    )).toHaveLength(1);
    expect(logs.filter((log) =>
      log.message.includes('transformed into') && log.message.includes('(Cocoa Bean)'),
    )).toHaveLength(1);
  });
});
