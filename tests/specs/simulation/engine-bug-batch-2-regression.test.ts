import { describe, expect, it } from 'vitest';
import {
  createBaseConfig,
  createPet,
  runBattleLogs,
} from '../../support/battle-test-runtime';

describe('engine bug batch 2 regressions', () => {
  it('Betta Fish can react again when its granted Guava is consumed', () => {
    const config = createBaseConfig('Golden');
    config.playerPets[0] = createPet('Fish', {
      attack: 1,
      health: 50,
      equipment: { name: 'Guava' },
    });
    config.playerPets[1] = createPet('Betta Fish', {
      attack: 1,
      health: 50,
      exp: 2,
    });
    config.opponentPets[0] = createPet('Fish', { attack: 1, health: 50 });

    const messages = runBattleLogs(config).map((log) => log.message);

    expect(messages.filter((message) =>
      message === 'Betta Fish gave Fish Guava.',
    )).toHaveLength(2);
  });

  it('Eucalyptus only blocks enemy damage', () => {
    const config = createBaseConfig('Turtle');
    config.playerPets[0] = createPet('Hedgehog', { attack: 3, health: 1 });
    config.playerPets[1] = createPet('Fish', {
      attack: 1,
      health: 10,
      equipment: { name: 'Eucalyptus' },
    });
    config.opponentPets[0] = createPet('Pig', { attack: 3, health: 10 });
    config.opponentPets[1] = createPet('Fish', {
      attack: 3,
      health: 10,
      equipment: { name: 'Eucalyptus' },
    });

    const logs = runBattleLogs(config);
    const hedgehogDamage = logs.filter((log) =>
      log.message.startsWith('Hedgehog sniped Fish'),
    );

    expect(hedgehogDamage.some((log) =>
      log.message === 'Hedgehog sniped Fish for 2.',
    )).toBe(true);
    expect(hedgehogDamage.filter((log) =>
      log.message.includes('Eucalyptus -4'),
    )).toHaveLength(1);
  });

  it('Chocolate Cake stops Tasmanian Devil before Spooked or its jump attack', () => {
    const config = createBaseConfig('Danger');
    config.playerPets[0] = createPet('Tasmanian Devil', {
      attack: 20,
      health: 20,
      equipment: { name: 'Chocolate Cake' },
    });
    config.opponentPets[0] = createPet('Ant', { attack: 1, health: 30 });

    const messages = runBattleLogs(config).map((log) => log.message);
    const cakeIndex = messages.findIndex((message) =>
      message.includes('Tasmanian Devil gained 3 exp. (Chocolate Cake)'),
    );

    expect(cakeIndex).toBeGreaterThanOrEqual(0);
    expect(messages.some((message) =>
      message.includes('Tasmanian Devil gave Ant') &&
      message.includes('Spooked'),
    )).toBe(false);
    expect(messages.some((message) =>
      message.includes('Tasmanian Devil jump-attacks'),
    )).toBe(false);
  });

  it('Chocolate Cake cancels jump attacks through the shared jump path', () => {
    const config = createBaseConfig('Danger');
    config.playerPets[0] = createPet('Sumatran Tiger', {
      attack: 20,
      health: 20,
      equipment: { name: 'Chocolate Cake' },
    });
    config.opponentPets[0] = createPet('Ant', { attack: 1, health: 30 });

    const messages = runBattleLogs(config).map((log) => log.message);

    expect(messages.some((message) =>
      message.includes('Sumatran Tiger gained 3 exp. (Chocolate Cake)'),
    )).toBe(true);
    expect(messages.some((message) =>
      message.includes('Sumatran Tiger jump-attacks'),
    )).toBe(false);
  });

  it('Falcon inserts its summon in front and pushes its fainting body and friends back', () => {
    const config = createBaseConfig('Golden');
    config.playerPets[0] = createPet('Falcon', { attack: 10, health: 1 });
    config.playerPets[1] = createPet('Fish', { attack: 1, health: 30 });
    config.playerPets[2] = createPet('Pig', { attack: 1, health: 30 });
    config.playerPets[3] = createPet('Ant', { attack: 1, health: 30 });
    config.opponentPets[0] = createPet('Cricket', { attack: 10, health: 1 });

    const logs = runBattleLogs(config);
    const falconLog = logs.find((log) =>
      log.message.includes('Falcon spawned Cricket 3/3 Level 1'),
    );

    expect(falconLog).toBeDefined();
    expect(falconLog?.board.player.map((pet) => pet?.name ?? null)).toEqual([
      'Cricket',
      'Falcon',
      'Fish',
      'Pig',
      'Ant',
    ]);
    expect(falconLog?.board.player[1]?.health).toBeLessThanOrEqual(0);
  });

  it('gaining a perk counts as eating food', () => {
    const config = createBaseConfig('Turtle');
    config.playerPets[0] = createPet('Fish', { attack: 1, health: 30 });
    config.playerPets[1] = createPet('Rabbit', { attack: 1, health: 20 });
    config.playerPets[2] = createPet('Betta Fish', { attack: 1, health: 20 });
    config.opponentPets[0] = createPet('Fish', { attack: 1, health: 30 });

    // Give the front Fish a consumable perk through the normal equipment path,
    // then let Betta replace it after the first attack.
    config.playerPets[0]!.equipment = { name: 'Guava' };

    const logs = runBattleLogs(config);
    const bettaLog = logs.find((log) =>
      log.message === 'Betta Fish gave Fish Guava.',
    );

    expect(bettaLog).toBeDefined();
    expect(logs.some((log) =>
      log.message.includes('Rabbit gave Fish') && log.message.includes('health'),
    )).toBe(true);
  });

  it('perk gains advance Gelada food counters', () => {
    const config = createBaseConfig('Custom');
    config.playerPets[0] = createPet('Gelada', {
      attack: 1,
      health: 50,
      equipment: { name: 'Guava' },
    });
    config.playerPets[1] = createPet('Betta Fish', {
      attack: 1,
      health: 50,
      exp: 2,
    });
    config.opponentPets[0] = createPet('Fish', { attack: 1, health: 50 });

    const messages = runBattleLogs(config).map((log) => log.message);

    expect(messages).toContain(
      'Gelada transformed into Sleeping Gelada and fed each friend 1 Pear.',
    );
  });

  it('Dirty Rat does not trigger summon abilities', () => {
    const config = createBaseConfig('Turtle');
    config.playerPets[0] = createPet('Rat', { attack: 1, health: 1 });
    config.opponentPets[0] = createPet('Fish', { attack: 10, health: 30 });
    config.opponentPets[1] = createPet('Horse', { attack: 2, health: 20 });

    const logs = runBattleLogs(config);

    expect(logs.some((log) =>
      log.message.includes('Summoned Dirty Rat on Opponent'),
    )).toBe(true);
    expect(logs.some((log) =>
      log.message.includes('Horse gave Dirty Rat'),
    )).toBe(false);
  });

  it('Peacock Spider looks past fainted adjacent pets', () => {
    const config = createBaseConfig('Custom');
    config.playerPets[0] = createPet('Fish', { attack: 3, health: 10 });
    config.playerPets[1] = createPet('Ant', { attack: 1, health: 1 });
    config.playerPets[2] = createPet('Peacock Spider', { attack: 1, health: 1 });
    config.playerPets[3] = createPet('Pig', { attack: 1, health: 10 });
    config.opponentPets[0] = createPet('Hedgehog', { attack: 3, health: 1 });

    const messages = runBattleLogs(config).map((log) => log.message);

    expect(messages).toContain('Peacock Spider gave Fish Spooked.');
    expect(messages).toContain('Peacock Spider gave Pig Spooked.');
    expect(messages).not.toContain('Peacock Spider gave Ant Spooked.');
  });

  it('accepts foodsEaten metadata for Blue Jay, Locust, and Dung Beetle', () => {
    const cases = [
      ['Blue Jay', 'gave', 2],
      ['Locust', 'summoned', 2],
      ['Dung Beetle', 'dealt', 3],
    ] as const;

    for (const [name, logFragment, foodsEaten] of cases) {
      const config = createBaseConfig('Custom');
      config.playerPets[0] = createPet(name, {
        attack: 5,
        health: 1,
        foodsEaten,
      });
      config.playerPets[1] = createPet('Fish', { attack: 1, health: 30 });
      config.opponentPets[0] = createPet('Fish', { attack: 10, health: 40 });

      const messages = runBattleLogs(config).map((log) => log.message);
      expect(messages.some((message) =>
        message.startsWith(name) && message.includes(logFragment),
      )).toBe(true);
    }
  });
});
