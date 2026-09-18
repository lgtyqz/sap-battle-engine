import { describe, expect, it } from 'vitest';
import {
  createBaseConfig,
  createPet,
  runBattleLogs,
} from '../../support/battle-test-runtime';

describe('additional observed engine bug regressions', () => {
  it('Macaque copies a perk but not an ailment to its Orangutan', () => {
    const perkConfig = createBaseConfig('Golden');
    perkConfig.logsEnabled = true;
    perkConfig.playerPets[0] = createPet('Macaque', {
      attack: 2,
      health: 20,
      equipment: 'Garlic',
    });
    perkConfig.opponentPets[0] = createPet('Fish', {
      attack: 1,
      health: 50,
    });

    const perkMessages = runBattleLogs(perkConfig).map((log) => log.message);
    expect(perkMessages).toContain(
      'Macaque spawned Orangutan 12/12 with Garlic.',
    );

    const ailmentConfig = createBaseConfig('Golden');
    ailmentConfig.logsEnabled = true;
    ailmentConfig.playerPets[0] = createPet('Macaque', {
      attack: 2,
      health: 20,
      equipment: 'Weak',
    });
    ailmentConfig.opponentPets[0] = createPet('Fish', {
      attack: 1,
      health: 50,
    });

    const ailmentMessages = runBattleLogs(ailmentConfig).map((log) => log.message);
    expect(ailmentMessages).toContain('Macaque spawned Orangutan 12/12.');
    expect(ailmentMessages).not.toContain(
      'Macaque spawned Orangutan 12/12 with Weak.',
    );
  });

  it('resolves Peanut Jar, Chameleon, and Puma as three perk grants', () => {
    const config = createBaseConfig('Puppy');
    config.logsEnabled = true;
    config.playerToy = 'Peanut Jar';
    config.playerToyLevel = 1;
    config.playerPets[0] = createPet('Fish', { attack: 1, health: 30 });
    config.playerPets[1] = createPet('Fish', { attack: 2, health: 30 });
    config.playerPets[2] = createPet('Fish', { attack: 3, health: 30 });
    config.playerPets[3] = createPet('Chameleon', { attack: 4, health: 30 });
    config.playerPets[4] = createPet('Puma', { attack: 5, health: 30 });
    config.opponentPets[0] = createPet('Fish', { attack: 1, health: 50 });

    const messages = runBattleLogs(config).map((log) => String(log.message));
    const peanutGrants = messages.filter((message) =>
      message.includes('PeanutButter'),
    );

    expect(peanutGrants).toHaveLength(3);
  });

  it('also resolves another perk-granting toy separately from Chameleon and Puma', () => {
    const config = createBaseConfig('Puppy');
    config.logsEnabled = true;
    config.playerToy = 'Air Palm Tree';
    config.playerToyLevel = 1;
    config.playerPets[0] = createPet('Fish', { attack: 1, health: 30 });
    config.playerPets[1] = createPet('Fish', { attack: 2, health: 30 });
    config.playerPets[2] = createPet('Fish', { attack: 3, health: 30 });
    config.playerPets[3] = createPet('Chameleon', { attack: 4, health: 30 });
    config.playerPets[4] = createPet('Puma', { attack: 5, health: 30 });
    config.opponentPets[0] = createPet('Fish', { attack: 1, health: 50 });

    const messages = runBattleLogs(config).map((log) => String(log.message));
    const coconutGrants = messages.filter((message) =>
      message.includes('Coconut'),
    );

    expect(coconutGrants).toHaveLength(3);
  });

  it('targets a jump attacker\'s chosen enemy with Geechee Red Pea', () => {
    const config = createBaseConfig('Danger');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Amami Rabbit', {
      attack: 2,
      health: 30,
      equipment: 'Geechee Red Pea',
    });
    config.opponentPets[0] = createPet('Fish', {
      attack: 2,
      health: 30,
    });
    config.opponentPets[1] = createPet('Ant', {
      attack: 10,
      health: 30,
    });

    const messages = runBattleLogs(config).map((log) => String(log.message));
    expect(messages).toContain(
      'Amami Rabbit removed 5 attack from Ant. (Geechee Red Pea)',
    );
    expect(messages).not.toContain(
      'Amami Rabbit removed 5 attack from Fish. (Geechee Red Pea)',
    );
  });

  it('targets a jump attacker\'s chosen enemy with Squash', () => {
    const config = createBaseConfig('Danger');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Amami Rabbit', {
      attack: 2,
      health: 30,
      equipment: 'Squash',
    });
    config.opponentPets[0] = createPet('Fish', {
      attack: 2,
      health: 30,
    });
    config.opponentPets[1] = createPet('Ant', {
      attack: 10,
      health: 30,
    });

    const messages = runBattleLogs(config).map((log) => String(log.message));
    expect(messages).toContain('Squash reduced Ant health by 6 to 24');
    expect(messages).not.toContain('Squash reduced Fish health by 6 to 24');
  });

  it.each([
    ['Egg', 2],
    ['Golden Egg', 6],
  ])(
    'targets a jump attacker\'s chosen enemy with %s',
    (equipment, damage) => {
      const config = createBaseConfig('Danger');
      config.logsEnabled = true;
      config.playerPets[0] = createPet('Amami Rabbit', {
        attack: 2,
        health: 30,
        equipment,
      });
      config.opponentPets[0] = createPet('Fish', {
        attack: 2,
        health: 30,
      });
      config.opponentPets[1] = createPet('Ant', {
        attack: 10,
        health: 30,
      });

      const messages = runBattleLogs(config).map((log) => String(log.message));
      expect(messages).toContain(
        `Amami Rabbit sniped Ant for ${damage}. (${equipment})`,
      );
      expect(messages).not.toContain(
        `Amami Rabbit sniped Fish for ${damage}. (${equipment})`,
      );
    },
  );
});
