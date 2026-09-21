import { describe, expect, it } from 'vitest';
import { feedCorncob } from '../../../src/app/domain/entities/food-effects';
import {
  createBaseConfig,
  createPet,
  runBattleLogs,
} from '../../support/battle-test-runtime';

describe('engine bug batch regressions', () => {
  it('Corncob prioritizes health when attack and health are equal', () => {
    let foodEvents = 0;
    const target = {
      attack: 5,
      health: 5,
      increaseAttack(amount: number) {
        this.attack += amount;
      },
      increaseHealth(amount: number) {
        this.health += amount;
      },
      runtime: {
        services: {
          abilityService: {
            triggerFoodEvents() {
              foodEvents++;
            },
          },
        },
      },
    };

    feedCorncob(target as never);

    expect(target).toMatchObject({ attack: 5, health: 6 });
    expect(foodEvents).toBe(1);
  });

  it('Tadpole transforms into a level-one Frog before gaining experience', () => {
    const config = createBaseConfig('Custom');
    config.playerPets[0] = createPet('Tadpole', { exp: 2, health: 20 });
    config.opponentPets[0] = createPet('Fish', { attack: 1, health: 20 });

    const logs = runBattleLogs(config);
    const transform = logs.find((log) =>
      log.message.includes('Tadpole transformed into a Frog and gained +4 experience.'),
    );

    expect(transform).toBeDefined();
    expect(transform?.board.player[0]).toMatchObject({
      name: 'Frog',
      exp: 4,
    });
  });

  it('Lusca spends its mana instead of firing the generic mana snipe first', () => {
    const config = createBaseConfig('Custom');
    config.playerPets[0] = createPet('Lusca', {
      attack: 1,
      health: 1,
      mana: 4,
    });
    config.opponentPets[0] = createPet('Fish', { attack: 10, health: 20 });

    const messages = runBattleLogs(config).map((log) => log.message);

    expect(messages.some((message) =>
      message.includes('Lusca spent 4 mana and drained Fish.'),
    )).toBe(true);
    expect(messages.some((message) =>
      message.includes('Lusca sniped Fish for 4'),
    )).toBe(false);
  });

  it('Peacock Spider resolves on Faint and only targets perk-less adjacent pets', () => {
    const config = createBaseConfig('Custom');
    config.playerPets[0] = createPet('Fish', {
      attack: 1,
      health: 20,
      equipment: { name: 'Melon' },
    });
    config.playerPets[1] = createPet('Peacock Spider', {
      attack: 3,
      health: 1,
      mana: 4,
    });
    config.playerPets[2] = createPet('Ant', { attack: 1, health: 20 });
    config.opponentPets[0] = createPet('Dolphin', { attack: 1, health: 20 });

    const logs = runBattleLogs(config);
    const peacockIndex = logs.findIndex((log) =>
      log.message.includes('Peacock Spider gave Ant Spooked.'),
    );
    const manaIndex = logs.findIndex((log) =>
      log.message.includes('Peacock Spider sniped'),
    );

    expect(peacockIndex).toBeGreaterThan(-1);
    expect(logs.some((log) =>
      log.message.includes('Peacock Spider gave Fish Spooked.'),
    )).toBe(false);
    expect(manaIndex).toBeGreaterThan(peacockIndex);
  });

  it('Mandarinfish replaces its ailment with stats before attacking', () => {
    const config = createBaseConfig('Custom');
    config.playerPets[0] = createPet('Mandarinfish', {
      attack: 2,
      health: 8,
      exp: 2,
      equipment: { name: 'Weak' },
    });
    config.opponentPets[0] = createPet('Fish', { attack: 1, health: 30 });

    const logs = runBattleLogs(config);
    const replacement = logs.find((log) =>
      log.message.includes('Mandarinfish replaced Weak with +4 attack and +4 health.'),
    );

    expect(replacement).toBeDefined();
    expect(replacement?.board.player[0]).toMatchObject({
      attack: 6,
      health: 12,
      equipment: null,
    });
  });

  it('Pink Robin can activate Saola End Turn', () => {
    const config = createBaseConfig('Custom');
    config.playerPets[0] = createPet('Pink Robin', { attack: 1, health: 1 });
    config.playerPets[1] = createPet('Saola', { attack: 2, health: 20 });
    config.playerPets[2] = createPet('Camel', { attack: 10, health: 20 });
    config.opponentPets[0] = createPet('Fish', { attack: 20, health: 30 });

    const messages = runBattleLogs(config).map((log) => log.message);

    expect(messages).toContain('Pink Robin activated End Turn on Saola.');
    expect(messages).toContain('Saola gave Camel -1 attack and +2 health.');
  });

  it('Lobster does not buff battle summons', () => {
    const config = createBaseConfig('Puppy');
    config.playerPets[0] = createPet('Cricket', { attack: 1, health: 1 });
    config.playerPets[1] = createPet('Lobster', { attack: 2, health: 20 });
    config.opponentPets[0] = createPet('Fish', { attack: 10, health: 30 });

    const messages = runBattleLogs(config).map((log) => log.message);

    expect(messages.some((message) => message.startsWith('Lobster gave'))).toBe(false);
  });

  it('Ethiopian Wolf resolves its Faint effect before its mana snipe', () => {
    const config = createBaseConfig('Danger');
    config.playerPets[0] = createPet('Fish', { attack: 1, health: 20 });
    config.playerPets[1] = createPet('Ethiopian Wolf', {
      attack: 3,
      health: 1,
      mana: 3,
    });
    config.opponentPets[0] = createPet('Dolphin', { attack: 5, health: 20 });

    const messages = runBattleLogs(config).map((log) => log.message);
    const faintIndex = messages.findIndex((message) =>
      message.includes('Ethiopian Wolf removed 1 attack from Dolphin.'),
    );
    const manaIndex = messages.findIndex((message) =>
      message.startsWith('Ethiopian Wolf sniped') && message.includes('(Mana)'),
    );

    expect(faintIndex).toBeGreaterThan(-1);
    expect(manaIndex).toBeGreaterThan(faintIndex);
  });

  it('Blue Jay consumes foodsEaten metadata on faint', () => {
    const config = createBaseConfig('Custom');
    config.playerPets[0] = createPet('Blue Jay', {
      attack: 1,
      health: 1,
      foodsEaten: 2,
    });
    config.playerPets[1] = createPet('Fish', { attack: 2, health: 20 });
    config.playerPets[2] = createPet('Ant', { attack: 2, health: 20 });
    config.opponentPets[0] = createPet('Fish', { attack: 10, health: 30 });

    const messages = runBattleLogs(config).map((log) => log.message);

    expect(messages.some((message) =>
      message.includes('Blue Jay gave') && message.includes('+2/+2 after fainting.'),
    )).toBe(true);
  });

  it('transformations preserve the original pet perk', () => {
    const config = createBaseConfig('Custom');
    config.playerPets[0] = createPet('Tadpole', {
      attack: 2,
      health: 20,
      equipment: { name: 'Melon' },
    });
    config.opponentPets[0] = createPet('Fish', { attack: 10, health: 40 });

    const logs = runBattleLogs(config);
    const transform = logs.find((log) =>
      log.message.startsWith('Tadpole transformed into a Frog'),
    );
    const transformedPet = transform?.board.player.find((pet) => pet?.name === 'Frog');

    expect(transform).toBeDefined();
    expect(transformedPet?.equipment).toBe('Melon');
  });

  it('Unicorn always grants +2/+2 while level controls uses', () => {
    const config = createBaseConfig('Unicorn');
    config.playerPets[0] = createPet('Microbe', { attack: 1, health: 1 });
    config.playerPets[1] = createPet('Fish', { attack: 3, health: 20 });
    config.playerPets[2] = createPet('Unicorn', {
      attack: 2,
      health: 20,
      exp: 5,
    });
    config.opponentPets[0] = createPet('Fish', { attack: 10, health: 30 });

    const messages = runBattleLogs(config).map((log) => log.message);

    expect(messages).toContain('Unicorn gave Fish 2 attack and 2 health.');
    expect(messages.some((message) => message.includes('gave Fish 6 attack'))).toBe(false);
  });

  it('Dunkleosteus removes its ailment and can replace an enemy perk', () => {
    const config = createBaseConfig('Custom');
    config.playerPets[0] = createPet('Dunkleosteus', {
      attack: 6,
      health: 20,
      equipment: { name: 'Weak' },
    });
    config.opponentPets[0] = createPet('Fish', {
      attack: 1,
      health: 20,
      equipment: { name: 'Melon' },
    });

    const logs = runBattleLogs(config);
    const moved = logs.find((log) =>
      log.message.includes('Dunkleosteus moved Weak to Fish.'),
    );

    expect(moved).toBeDefined();
    expect(moved?.board.player[0]?.equipment).toBeNull();
    expect(moved?.board.opponent[0]?.equipment).toBe('Weak');
  });

  it('Leaf Gecko distributes ailments to distinct random pets', () => {
    const config = createBaseConfig('Custom');
    config.seed = 9;
    config.playerPets[0] = createPet('Leaf Gecko', { attack: 1, health: 1 });
    config.playerPets[1] = createPet('Fish', { attack: 2, health: 20 });
    config.playerPets[2] = createPet('Ant', { attack: 2, health: 20 });
    config.opponentPets[0] = createPet('Pig', { attack: 10, health: 30 });
    config.opponentPets[1] = createPet('Camel', { attack: 2, health: 20 });

    const logs = runBattleLogs(config);
    const curse = logs.find((log) =>
      log.message.startsWith('Leaf Gecko cursed 3 pets:'),
    );
    const equippedPets = [
      ...(curse?.board.player ?? []),
      ...(curse?.board.opponent ?? []),
    ].filter((pet) => pet?.equipment && pet.name !== 'Leaf Gecko');

    expect(curse).toBeDefined();
    expect(equippedPets).toHaveLength(3);
  });

  it('seeds Gelada food-counter progress and lets Hooded Seal reverse it', () => {
    const config = createBaseConfig('Custom');
    config.playerPets[0] = createPet('Farmer Crow', { attack: 1, health: 1 });
    config.playerPets[1] = createPet('Gelada', {
      attack: 4,
      health: 20,
      foodsEaten: 1,
      exp: 5,
    });
    config.playerPets[2] = createPet('Hooded Seal', {
      attack: 4,
      health: 20,
    });
    config.opponentPets[0] = createPet('Fish', { attack: 20, health: 50 });

    const messages = runBattleLogs(config).map((log) => log.message);
    const geladaIndex = messages.findIndex((message) =>
      message.includes('Gelada transformed into Sleeping Gelada'),
    );
    const sealIndex = messages.findIndex((message) =>
      message.includes('Hooded Seal transformed Sleeping Gelada back into Gelada at level 1.'),
    );

    expect(geladaIndex).toBeGreaterThan(-1);
    expect(sealIndex).toBe(geladaIndex + 1);
  });

  it('Anubis activates pre-removal Faint abilities', () => {
    const config = createBaseConfig('Custom');
    config.playerPets[0] = createPet('Ant', { attack: 2, health: 20 });
    config.playerPets[1] = createPet('Fish', { attack: 4, health: 20 });
    config.playerPets[2] = createPet('Anubis', { attack: 4, health: 20 });
    config.opponentPets[0] = createPet('Fish', { attack: 1, health: 30 });

    const messages = runBattleLogs(config).map((log) => log.message);

    expect(messages.some((message) => message.includes('Ant gave'))).toBe(true);
  });

  it('Brazillian Treehopper redistributes each target while preserving its total', () => {
    const config = createBaseConfig('Custom');
    config.seed = 17;
    config.playerPets[0] = createPet('Brazillian Treehopper', {
      attack: 2,
      health: 30,
    });
    config.opponentPets[0] = createPet('Fish', { attack: 7, health: 13 });
    config.opponentPets[1] = createPet('Ant', { attack: 15, health: 10 });

    const logs = runBattleLogs(config);
    const redistributed = logs.find((log) =>
      log.message.includes('Brazillian Treehopper redistributed'),
    );
    const target = redistributed?.board.opponent.find((pet) => pet?.name === 'Fish');

    expect(redistributed).toBeDefined();
    expect((target?.attack ?? 0) + (target?.health ?? 0)).toBe(20);
  });

  it('Spiny Bush Viper measures distance across the opposing teams', () => {
    const config = createBaseConfig('Custom');
    config.playerPets[0] = createPet('Fish', { attack: 1, health: 20 });
    config.playerPets[1] = createPet('Ant', { attack: 1, health: 20 });
    config.playerPets[2] = createPet('Spiny Bush Viper', {
      attack: 5,
      health: 1,
    });
    config.opponentPets[0] = createPet('Dolphin', { attack: 1, health: 20 });

    const messages = runBattleLogs(config).map((log) => log.message);

    expect(messages).toContain('Spiny Bush Viper dealt 3 to Dolphin.');
  });

  it('Honduran White Bat counts one friend from each distinct tier', () => {
    const config = createBaseConfig('Custom');
    config.playerPets[0] = createPet('Honduran White Bat', {
      attack: 1,
      health: 20,
      exp: 2,
    });
    config.playerPets[1] = createPet('Fish', { attack: 1, health: 20 });
    config.playerPets[2] = createPet('Ant', { attack: 1, health: 20 });
    config.playerPets[3] = createPet('Camel', { attack: 1, health: 20 });
    config.opponentPets[0] = createPet('Fish', { attack: 1, health: 30 });

    const messages = runBattleLogs(config).map((log) => log.message);

    expect(messages).toContain('Honduran White Bat gained 4 trumpets. (4)');
  });

  it('Jackalope doubles its buff for a friend that jumped', () => {
    const config = createBaseConfig('Unicorn');
    config.playerPets[0] = createPet('Jackalope', { attack: 1, health: 20 });
    config.playerPets[1] = createPet('Tsuchinoko', { attack: 2, health: 20 });
    config.opponentPets[0] = createPet('Fish', { attack: 1, health: 30 });

    const messages = runBattleLogs(config).map((log) => log.message);
    const jackalopeBuffs = messages.filter((message) =>
      message.startsWith('Jackalope gave Tsuchinoko'),
    );

    expect(messages).toContain('Jackalope gave Tsuchinoko +2 attack.');
    expect(jackalopeBuffs).toHaveLength(3);
  });

  it('Deinocheirus reverses Weak without granting start-battle stats', () => {
    const config = createBaseConfig('Custom');
    config.playerPets[0] = createPet('Deinocheirus', {
      attack: 4,
      health: 20,
      exp: 2,
      equipment: { name: 'Weak' },
    });
    config.opponentPets[0] = createPet('Fish', { attack: 10, health: 30 });

    const messages = runBattleLogs(config).map((log) => log.message);

    expect(messages).toContain('Fish attacks Deinocheirus for 4. (Weak -6)');
    expect(messages.some((message) => message.includes('Deinocheirus reversed Weak and gained'))).toBe(false);
  });

  it('Sugar Glider does not grant battle mana', () => {
    const config = createBaseConfig('Custom');
    config.playerPets[0] = createPet('Sugar Glider', { attack: 1, health: 20 });
    config.playerPets[1] = createPet('Fish', { attack: 2, health: 20 });
    config.opponentPets[0] = createPet('Fish', { attack: 1, health: 30 });

    const messages = runBattleLogs(config).map((log) => log.message);

    expect(messages.some((message) =>
      message.includes('Sugar Glider gave') && message.includes('mana'),
    )).toBe(false);
  });

  it('Hermit Crab copies an eligible perk to a Golden Retriever', () => {
    const config = createBaseConfig('Custom');
    config.playerPets[0] = createPet('Groundhog', { attack: 1, health: 1 });
    config.playerPets[1] = createPet('Hermit Crab', {
      attack: 1,
      health: 20,
      equipment: { name: 'Honey' },
    });
    config.opponentPets[0] = createPet('Fish', { attack: 10, health: 40 });

    const logs = runBattleLogs(config);
    expect(logs.some((log) =>
      log.board.player.some((pet) =>
      pet?.name === 'Golden Retriever' && pet.equipment === 'Honey',
      ),
    )).toBe(true);
  });

  it('supports Sarcastic Fringehead swallowed-pet metadata', () => {
    const config = createBaseConfig('Custom');
    config.playerPets[0] = createPet('Sarcastic Fringehead', {
      attack: 1,
      health: 1,
      exp: 2,
      sarcasticFringeheadSwallowedPet: 'Ant',
    });
    config.opponentPets[0] = createPet('Fish', { attack: 10, health: 30 });

    const logs = runBattleLogs(config);
    const spawn = logs.find((log) =>
      log.message.includes('Sarcastic Fringehead spawned Ant for the opponent.'),
    );

    expect(spawn).toBeDefined();
    expect(spawn?.board.opponent[0]).toMatchObject({
      name: 'Ant',
      attack: 1,
      health: 1,
      exp: 2,
    });
  });
});
