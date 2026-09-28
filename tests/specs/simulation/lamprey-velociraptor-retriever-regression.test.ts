import { describe, expect, it } from 'vitest';
import { catalogs } from '../../../src/catalogs';
import { createBaseConfig, createPet, runBattleLogs } from '../../support/battle-test-runtime';

describe('Lamprey, Velociraptor, and Retriever regressions', () => {
  it('applies protective equipment to Lamprey damage', () => {
    const config = createBaseConfig('Custom');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Ant', { attack: 1, health: 1 });
    config.playerPets[1] = createPet('Fish', {
      attack: 1,
      health: 10,
      equipment: { name: 'Coconut' },
    });
    config.playerPets[2] = createPet('Lamprey', { attack: 1, health: 10 });
    config.opponentPets[0] = createPet('Fish', { attack: 2, health: 50 });

    const logs = runBattleLogs(config);
    expect(logs.some((log) => log.message.includes('Lamprey sniped Fish for 0. (Coconut block)'))).toBe(true);
  });

  it('moves the stolen Strawberry onto Velociraptor over its old perk', () => {
    const config = createBaseConfig('Star');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Fish', {
      attack: 1,
      health: 15,
      equipment: { name: 'Strawberry' },
    });
    config.playerPets[1] = createPet('Velociraptor', {
      attack: 1,
      health: 15,
      equipment: { name: 'Garlic' },
    });
    config.opponentPets[0] = createPet('Fish', { attack: 1, health: 50 });

    const logs = runBattleLogs(config);
    const transfer = logs.find((log) => log.message.includes('Velociraptor stole Strawberry'));
    expect(transfer).toBeDefined();
    expect(transfer?.board.player.find((pet) => pet?.name === 'Velociraptor')?.equipment).toBe('Strawberry');
    expect(transfer?.board.player.find((pet) => pet?.name === 'Fish')?.equipment).toBeNull();
  });

  it('blocks later trumpet gains after a Mara summons a Retriever', () => {
    const config = createBaseConfig('Custom');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Patagonian Mara', { attack: 1, health: 1 });
    config.playerPets[1] = createPet('Patagonian Mara', { attack: 1, health: 1 });
    config.opponentPets[0] = createPet('Fish', { attack: 10, health: 50 });

    const logs = runBattleLogs(config);
    const trumpetLogs = logs.filter((log) => log.type === 'trumpets');
    expect(trumpetLogs.filter((log) => log.message.includes('Patagonian Mara gained'))).toHaveLength(1);
    expect(logs.filter((log) => log.message === 'Patagonian Mara summoned a Golden Retriever.')).toHaveLength(1);
  });

  it('exposes timesHurt as battle metadata for hurt-count pets', () => {
    for (const name of ['Tuna', 'Sabertooth Tiger']) {
      expect(catalogs.pets.find((pet) => pet.Name === name)?.BattleMetadata).toContain('timesHurt');
    }
  });
});
