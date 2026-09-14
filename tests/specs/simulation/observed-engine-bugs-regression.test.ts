import { describe, expect, it } from 'vitest';
import {
  createBaseConfig,
  createPet,
  runBattleLogs,
} from '../../support/battle-test-runtime';
import { getPetsWithinXSpaces } from '../../../src/app/domain/entities/player/player-targeting-position';
import { projectLineupAfterEndTurn } from '../../../src';
import { feedPear } from '../../../src/app/domain/entities/food-effects';

describe('observed engine bug regressions', () => {
  it('lets Silly retarget each Sea Turtle summon ability to any living pet', () => {
    const config = createBaseConfig('Golden');
    config.logsEnabled = true;
    config.seed = 3;
    config.playerPets[0] = createPet('Cricket', { attack: 1, health: 1 });
    config.playerPets[1] = createPet('Sea Turtle', {
      attack: 1,
      health: 10,
      equipment: { name: 'Silly' },
    });
    config.opponentPets[0] = createPet('Elephant', {
      attack: 5,
      health: 30,
    });

    const messages = runBattleLogs(config).map((log) => log.message);

    expect(messages).toContain('Sea Turtle gave Elephant 2 health.');
  });

  it('does not let Crane buff a friend that fainted from the hit', () => {
    const config = createBaseConfig('Golden');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Ant', { attack: 1, health: 1 });
    config.playerPets[1] = createPet('Crane', { attack: 6, health: 5 });
    config.opponentPets[0] = createPet('Fish', { attack: 5, health: 20 });

    const messages = runBattleLogs(config).map((log) => log.message);

    expect(messages.some((message) => message.includes('Crane gave Ant'))).toBe(false);
  });

  it('reflects Porcupine damage to the pet that hurt it', () => {
    const config = createBaseConfig('Custom');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Porcupine', { attack: 2, health: 10 });
    config.opponentPets[0] = createPet('Fish', { attack: 1, health: 20 });

    const messages = runBattleLogs(config).map((log) => log.message);

    expect(messages).toContain('Porcupine reflected 3 damage to Fish.');
  });

  it('skips fainted pets when Firefly resolves pets within range', () => {
    const behind = { name: 'behind', alive: true, position: 4 };
    const deadBehind = { name: 'dead-behind', alive: false, position: 3 };
    const firefly = {
      name: 'Firefly',
      alive: false,
      position: 2,
      savedPosition: 2,
      equipment: null,
    };
    const deadAhead = { name: 'dead-ahead', alive: false, position: 1 };
    const ahead = { name: 'ahead', alive: true, position: 0 };
    const enemy = { name: 'enemy', alive: true, position: 0 };
    const player = {
      petArray: [ahead, deadAhead, firefly, deadBehind, behind],
      opponent: { petArray: [enemy] },
    };
    player.opponent.opponent = player;

    const result = getPetsWithinXSpaces(player as never, firefly as never, 1);

    expect(result.pets).toEqual([behind, ahead]);
  });

  it.each([
    { exp: 1, receivesExperience: false },
    { exp: 2, receivesExperience: true },
  ])(
    'allows Bass to target a Sell friend with $exp exp: $receivesExperience',
    ({ exp, receivesExperience }) => {
      const config = createBaseConfig('Star');
      config.logsEnabled = true;
      config.playerPets[0] = createPet('Fish', { attack: 50, health: 50 });
      config.opponentPets[0] = createPet('Bass', {
        attack: 1,
        health: 1,
        exp: 2,
      });
      config.opponentPets[1] = createPet('Marmoset', {
        attack: 4,
        health: 50,
        exp,
      });

      const messages = runBattleLogs(config).map((log) => log.message);

      expect(
        messages.some((message) =>
          message.includes('Bass gave Marmoset +2 experience.'),
        ),
      ).toBe(receivesExperience);
    },
  );

  it('preserves attack and health when Red Lipped Batfish transforms an enemy', () => {
    const config = createBaseConfig('Custom');
    config.logsEnabled = true;
    config.seed = 1234;
    config.playerPets[0] = createPet('Red Lipped Batfish', {
      attack: 5,
      health: 30,
    });
    config.opponentPets[0] = createPet('Fish', { attack: 17, health: 23 });

    const transformLog = runBattleLogs(config).find((log) =>
      log.message.startsWith('Red Lipped Batfish transformed Fish into '),
    );

    expect(transformLog).toBeDefined();
    expect(transformLog?.board.opponent[0]).toMatchObject({
      attack: 17,
      health: 23,
    });
  });

  it('feeds Farmer Crow Corncobs without replacing the target perk', () => {
    const config = createBaseConfig('Custom');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Farmer Crow', { attack: 1, health: 1 });
    config.playerPets[1] = createPet('Fish', {
      attack: 4,
      health: 4,
      equipment: { name: 'Melon' },
    });
    config.playerPets[2] = createPet('Chimpanzee', {
      attack: 3,
      health: 20,
    });
    config.opponentPets[0] = createPet('Elephant', {
      attack: 20,
      health: 50,
    });

    const logs = runBattleLogs(config);
    const chimpTriggers = logs.filter((log) =>
      log.message.includes('Chimpanzee gave Fish +1/+1 after eating Corncob.'),
    );
    const crowLog = logs.find((log) =>
      log.message.startsWith('Farmer Crow fed Corncobs'),
    );

    expect(chimpTriggers).toHaveLength(3);
    expect(
      crowLog?.board.player.find((pet) => pet?.name === 'Fish'),
    ).toMatchObject({ equipment: 'Melon' });
  });

  it('feeds Farmer Dog Corncobs separately so each feed resolves', () => {
    const config = createBaseConfig('Custom');
    const lineup = [
      createPet('Fish', { attack: 4, health: 4 }),
      createPet('Farmer Dog', { attack: 5, health: 6, exp: 2 }),
      null,
      null,
      null,
    ];

    const projected = projectLineupAfterEndTurn(config, 'player', lineup);

    expect(projected[0]).toMatchObject({ attack: 5, health: 5 });
  });

  it('makes each Gelada Pear grant +2 attack and +2 health', () => {
    let foodEvents = 0;
    const target = {
      attack: 4,
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

    feedPear(target as never);

    expect(target).toMatchObject({ attack: 6, health: 7 });
    expect(foodEvents).toBe(1);
  });

  it.each([
    { attack: 1, health: 2, transformedStats: '(5/5)' },
    { attack: 10, health: 10, transformedStats: '(10/10)' },
  ])(
    'does not reduce a $attack/$health Pygmy Hog when transforming',
    ({ attack, health, transformedStats }) => {
      const config = createBaseConfig('Danger');
      config.logsEnabled = true;
      config.playerPets[0] = createPet('Fish', { attack: 1, health: 50 });
      config.playerPets[1] = createPet('Pygmy Hog', { attack, health });
      config.opponentPets[0] = createPet('Fish', { attack: 1, health: 50 });

      const messages = runBattleLogs(config).map((log) => log.message);

      expect(
        messages.some(
          (message) =>
            message.includes('Pygmy Hog transformed into Angry Pygmy Hog') &&
            message.includes(transformedStats),
        ),
      ).toBe(true);
    },
  );

  it('resolves a Tomato and Marine Iguana before a start-of-battle jump attack', () => {
    const config = createBaseConfig('Danger');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Sumatran Tiger', {
      attack: 10,
      health: 20,
      equipment: { name: 'Tomato' },
    });
    config.playerPets[1] = createPet('Marine Iguana', {
      attack: 4,
      health: 20,
    });
    config.opponentPets[0] = createPet('Fish', { attack: 1, health: 50 });
    config.opponentPets[1] = createPet('Ant', { attack: 1, health: 50 });

    const messages = runBattleLogs(config).map((log) => log.message);
    const tomatoIndex = messages.findIndex((message) =>
      message.includes('Sumatran Tiger sniped Ant for 10.'),
    );
    const iguanaIndex = messages.findIndex((message) =>
      message.includes('Marine Iguana gave Sumatran Tiger Melon'),
    );
    const jumpIndex = messages.findIndex((message) =>
      message.includes('Sumatran Tiger jump-attacks Fish'),
    );

    expect(tomatoIndex).toBeGreaterThan(-1);
    expect(iguanaIndex).toBeGreaterThan(tomatoIndex);
    expect(jumpIndex).toBeGreaterThan(iguanaIndex);
  });
});
