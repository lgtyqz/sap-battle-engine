import { describe, expect, it } from 'vitest';
import {
  createBaseConfig,
  createPet,
  runBattleLogs,
} from '../../support/battle-test-runtime';

describe('counter ability timing', () => {
  it('enables Aye-aye from enemy attacks but resolves as CounterEvent', () => {
    const config = createBaseConfig('Danger');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Fish', { attack: 1, health: 100 });
    config.playerPets[1] = createPet('Aye-aye', { attack: 3, health: 5 });
    config.opponentPets[0] = createPet('Fish', {
      attack: 1,
      health: 100,
    });

    const messages = runBattleLogs(config).map((log) => log.message);
    const abilityIndex = messages.findIndex((message) =>
      message.includes('Aye-aye summoned a 3/3 Lemur.'),
    );

    expect(abilityIndex).toBeGreaterThan(-1);
  });

  it('executes Bombus damage directly during CounterEvent timing', () => {
    const config = createBaseConfig('Danger');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Fish', { attack: 1, health: 100 });
    config.playerPets[1] = createPet('Bombus Dahlbomii', {
      attack: 1,
      health: 2,
    });
    config.opponentPets[0] = createPet('Fish', {
      attack: 1,
      health: 100,
    });

    const messages = runBattleLogs(config).map((log) => log.message);
    const damageIndex = messages.findIndex((message) =>
      message.includes('Bombus Dahlbomii sniped Fish for 1.'),
    );

    expect(damageIndex).toBeGreaterThan(-1);
  });
});
