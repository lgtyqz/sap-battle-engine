import { describe, expect, it } from 'vitest';
import {
  createBaseConfig,
  createPet,
  runBattleLogs,
} from '../../support/battle-test-runtime';

describe('current engine bugfix regressions', () => {
  it('gives a Takhi summon the Takhi level for African Wild Dog damage', () => {
    const config = createBaseConfig('Danger');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Takhi', {
      attack: 1,
      health: 1,
      exp: 2,
    });
    config.opponentPets[0] = createPet('Fish', { attack: 2, health: 50 });
    config.opponentPets[1] = createPet('Ant', { attack: 1, health: 50 });

    const messages = runBattleLogs(config).map((log) => log.message);

    expect(messages).toContain('Takhi summoned a 6/4 African Wild Dog');
    expect(messages).toContain('African Wild Dog jump-attacks Ant for 6.');
  });

  it('rounds both Maple Syrup attack and defense damage up', () => {
    const getFirstAttack = (
      attackerEquipment: { name: string } | null,
      defenderEquipment: { name: string } | null,
    ) => {
      const config = createBaseConfig('Golden');
      config.logsEnabled = true;
      config.playerPets[0] = createPet('Fish', {
        attack: 5,
        health: 20,
        equipment: attackerEquipment,
      });
      config.opponentPets[0] = createPet('Fish', {
        attack: 1,
        health: 20,
        equipment: defenderEquipment,
      });
      return runBattleLogs(config)
        .map((log) => log.message)
        .find((message) => message.includes('attacks Fish'));
    };

    expect(getFirstAttack({ name: 'Maple Syrup' }, null)).toContain(
      'for 3. (Maple Syrup (Attack) x0.5)',
    );
    expect(getFirstAttack(null, { name: 'Maple Syrup' })).toContain(
      'for 3. (Maple Syrup x0.5)',
    );
  });

  it('rounds Ibex health removal up', () => {
    const config = createBaseConfig('Star');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Fish', { attack: 1, health: 20 });
    config.playerPets[1] = createPet('Ibex', { attack: 6, health: 20 });
    config.opponentPets[0] = createPet('Fish', { attack: 1, health: 10 });

    const messages = runBattleLogs(config).map((log) => log.message);

    expect(messages).toContain('Ibex removed 7 health from Fish (70%)');
  });

  it('supports named plain copies without their native pet ability', () => {
    const config = createBaseConfig('Star');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Ant', {
      attack: 1,
      health: 1,
      equipment: { name: 'Strawberry' },
    });
    config.playerPets[1] = createPet('Shima Enaga', {
      attack: 7,
      health: 8,
      plainCopy: true,
      equipment: { name: 'Garlic' },
    });
    config.opponentPets[0] = createPet('Fish', { attack: 5, health: 50 });

    const logs = runBattleLogs(config);
    const messages = logs.map((log) => log.message);
    const shima = logs
      .flatMap((log) => log.board.player)
      .find((pet) => pet?.name === 'Shima Enaga');

    expect(shima).toMatchObject({
      name: 'Shima Enaga',
      attack: 7,
      health: 8,
      equipment: 'Garlic',
    });
    expect(
      messages.some((message) => message.includes('summoned a (2/2) Shima Enaga')),
    ).toBe(false);
  });

  it('resolves Mammoth faint before Wolverine fourth-friend-hurt counter', () => {
    const config = createBaseConfig('Turtle');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Fish', { attack: 1, health: 1 });
    config.playerPets[1] = createPet('Fish', { attack: 1, health: 1 });
    config.playerPets[2] = createPet('Fish', { attack: 1, health: 1 });
    config.playerPets[3] = createPet('Mammoth', { attack: 1, health: 1 });
    config.playerPets[4] = createPet('Wolverine', {
      attack: 5,
      health: 20,
    });
    config.opponentPets[0] = createPet('Fish', { attack: 2, health: 100 });

    const messages = runBattleLogs(config).map((log) => log.message);
    const mammothIndex = messages.findIndex((message) =>
      message.includes('Mammoth gave Wolverine 2 attack and 2 health.'),
    );
    const wolverineIndex = messages.findIndex((message) =>
      message.includes('Wolverine reduced Fish health by 3'),
    );

    expect(mammothIndex).toBeGreaterThan(-1);
    expect(wolverineIndex).toBeGreaterThan(mammothIndex);
  });

  it('does not let a sniped Pygmy Hog execute its queued transform', () => {
    const config = createBaseConfig('Danger');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Fish', { attack: 1, health: 50 });
    config.playerPets[1] = createPet('Pygmy Hog', { attack: 1, health: 2 });
    config.opponentPets[0] = createPet('Fish', { attack: 1, health: 50 });
    config.opponentPets[1] = createPet('Pygmy Hippo', {
      attack: 20,
      health: 9,
    });

    const messages = runBattleLogs(config).map((log) => log.message);

    expect(messages).toContain('Pygmy Hippo sniped Pygmy Hog for 3.');
    expect(
      messages.some((message) =>
        message.includes('Pygmy Hog transformed into Angry Pygmy Hog'),
      ),
    ).toBe(false);
  });

  it.each([
    {
      label: 'Crocodile',
      setup: () => {
        const config = createBaseConfig('Turtle');
        config.logsEnabled = true;
        config.playerPets[0] = createPet('Crocodile', {
          attack: 1,
          health: 20,
        });
        config.opponentPets[0] = createPet('Fish', {
          attack: 1,
          health: 20,
          equipment: { name: 'Maple Syrup' },
        });
        return config;
      },
      expected: 'Crocodile sniped Fish for 4. (Maple Syrup x0.5)',
    },
    {
      label: 'Chili',
      setup: () => {
        const config = createBaseConfig('Turtle');
        config.logsEnabled = true;
        config.playerPets[0] = createPet('Fish', {
          attack: 1,
          health: 30,
          equipment: { name: 'Chili' },
        });
        config.opponentPets[0] = createPet('Fish', {
          attack: 1,
          health: 30,
        });
        config.opponentPets[1] = createPet('Ant', {
          attack: 1,
          health: 20,
          equipment: { name: 'Maple Syrup' },
        });
        return config;
      },
      expected: 'Fish attacked Ant for 3. (Maple Syrup x0.5) (Chili)',
    },
    {
      label: 'Tennis Ball',
      setup: () => {
        const config = createBaseConfig('Golden');
        config.logsEnabled = true;
        config.playerToy = 'Tennis Ball';
        config.playerToyLevel = 1;
        config.playerPets[0] = createPet('Fish', {
          attack: 1,
          health: 20,
        });
        config.opponentPets[0] = createPet('Fish', {
          attack: 1,
          health: 20,
          equipment: { name: 'Maple Syrup' },
        });
        return config;
      },
      expected: 'Tennis Ball sniped Fish for 2. (Maple Syrup x0.5)',
    },
  ])('lets Maple Syrup halve and round up $label snipe damage', ({ setup, expected }) => {
    const messages = runBattleLogs(setup()).map((log) => log.message);

    expect(messages).toContain(expected);
  });

  it('represents a chained Parrot copy through copied-ability metadata', () => {
    const config = createBaseConfig('Turtle');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Ox', { attack: 1, health: 1 });
    config.playerPets[1] = createPet('Parrot', {
      attack: 1,
      health: 1,
      parrotCopyPet: 'Ox',
    });
    config.playerPets[2] = createPet('Parrot', {
      attack: 1,
      health: 10,
      // This Parrot copied the Ox ability via the Parrot ahead in the shop.
      parrotCopyPet: 'Ox',
    });
    config.opponentPets[0] = createPet('Fish', { attack: 50, health: 50 });

    const copiedOxTriggers = runBattleLogs(config).filter(
      (log) => log.message === "Parrot's Ox gave Parrot Melon.",
    );

    expect(copiedOxTriggers).toHaveLength(2);
  });

});
