import { describe, expect, it } from 'vitest';
import { projectLineupAfterEndTurn } from '../../../src';
import { ButterflyAbility } from '../../../src/app/domain/entities/catalog/pets/hidden/butterfly.class';
import { TandAndTandAbility } from '../../../src/app/domain/entities/catalog/pets/hidden/tand-and-tand.class';
import type { Pet } from '../../../src/app/domain/entities/pet.class';
import type { LogService } from '../../../src/app/integrations/log.service';
import type { EngineContext } from '../../../src/app/runtime/engine-context';
import type { GameAPI } from '../../../src/app/domain/interfaces/gameAPI.interface';
import { createBaseConfig, createPet, runBattleLogs } from '../../support/battle-test-runtime';

describe('pet catalog ability regressions', () => {
  it('applies end-turn effects at the described levels and targets', () => {
    const config = createBaseConfig('Custom');
    const umbrella = projectLineupAfterEndTurn(config, 'player', [
      createPet('Fish'), createPet('Fish'), createPet('Fish'),
      createPet('Umbrella Bird', { exp: 2 }), null,
    ]);
    expect(umbrella.map((pet) => pet?.equipment?.name)).toEqual([undefined, 'Dazed', 'Dazed', undefined, undefined]);

    const shark = projectLineupAfterEndTurn(config, 'player', [
      createPet('Fish', { attack: 3, health: 7 }),
      createPet('Fish', { attack: 7, health: 3 }),
      createPet('Angelshark', { exp: 2 }), null, null,
    ]);
    expect(shark[0]).toMatchObject({ attack: 3, health: 9 });
    expect(shark[1]).toMatchObject({ attack: 9, health: 3 });

    const tortoise = projectLineupAfterEndTurn(config, 'player', [
      createPet('Giant Tortoise', { attack: 20, health: 90, exp: 5 }),
      null, null, null, null,
    ]);
    expect(tortoise[0]).toMatchObject({ attack: 12, health: 96 });

    const behemoth = projectLineupAfterEndTurn(config, 'player', [
      createPet('Behemoth', { attack: 98, health: 99, exp: 5 }),
      null, null, null, null,
    ]);
    expect(behemoth[0]).toMatchObject({ attack: 100, health: 100 });

    const hornbill = projectLineupAfterEndTurn(config, 'player', [
      createPet('Fish', { attack: 2, health: 7 }),
      createPet('Fish', { attack: 7, health: 2 }),
      createPet('Fish', { attack: 2, health: 7 }),
      createPet('Helmeted Hornbill', { exp: 2 }), null,
    ]);
    expect(hornbill.slice(0, 3).map((pet) => [pet?.attack, pet?.health])).toEqual([
      [6, 7], [7, 6], [6, 7],
    ]);
  });

  it('buffs friends when Baby Mammoth faints', () => {
    const config = createBaseConfig('Custom');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Baby Mammoth', { attack: 1, health: 1, exp: 2 });
    config.playerPets[1] = createPet('Fish', { attack: 4, health: 20 });
    config.opponentPets[0] = createPet('Fish', { attack: 3, health: 20 });
    expect(runBattleLogs(config).map((log) => log.message)).toContain(
      'Baby Mammoth gave Fish +2 attack and +2 health.',
    );
  });

  it('copies Giant Squirrel’s perk to both back pets after attacking', () => {
    const config = createBaseConfig('Custom');
    config.logsEnabled = true;
    config.playerPets[0] = createPet('Giant Squirrel', {
      attack: 1, health: 10, equipment: { name: 'Blueberry' },
    });
    config.playerPets[1] = createPet('Fish', { attack: 1, health: 20 });
    config.opponentPets[0] = createPet('Fish', { attack: 1, health: 20 });
    config.opponentPets[1] = createPet('Fish', { attack: 1, health: 20 });
    const copies = runBattleLogs(config).filter((log) => log.message.startsWith('Giant Squirrel copied'));
    expect(copies).toHaveLength(2);
    expect(copies[1].board.player[1]?.equipment).toBe('Blueberry');
    expect(copies[1].board.opponent[1]?.equipment).toBe('Blueberry');
  });

  it('transforms Flounder after two foods and grants experience from Adult Flounder', () => {
    const config = createBaseConfig('Custom');
    config.logsEnabled = true;
    const lineup = [
      createPet('Flounder', { exp: 2 }),
      createPet('Farmer Dog'), createPet('Farmer Dog'), null, null,
    ];
    const projected = projectLineupAfterEndTurn(config, 'player', lineup);
    expect(projected[0]?.name).toBe('Adult Flounder');
    expect(projected[1]?.exp).toBe(2);
    expect(projected[2]?.exp).toBe(2);
  });

  it('scales Olm’s Spooked multiplier with rolls and level', () => {
    for (const [exp, multiplier] of [[0, 3], [2, 5], [5, 7]]) {
      const config = createBaseConfig('Custom');
      config.logsEnabled = true;
      config.playerRollAmount = 2;
      config.playerPets[0] = createPet('Olm', { attack: 1, health: 1, exp });
      config.opponentPets[0] = createPet('Fish', { attack: 2, health: 20 });
      const logs = runBattleLogs(config);
      expect(logs.map((log) => log.message)).toContain(`Olm made Fish ${multiplier}x Spooked.`);
    }
  });

  it('replaces an ailment with a perk from Silkie Chicken’s level tier', () => {
    const config = createBaseConfig('Custom');
    const tierTwo = new Set(['Lime', 'Meat Bone', 'Cherry', 'Bok Choy', 'Kiwifruit', 'Fairy Dust']);
    const projected = projectLineupAfterEndTurn(config, 'player', [
      createPet('Fish'), createPet('Umbrella Bird'),
      createPet('Silkie Chicken', { exp: 2 }), null, null,
    ]);
    expect(tierTwo.has(projected[0]?.equipment?.name ?? '')).toBe(true);
  });

  it('applies Thunder Hammer’s level-scaled buff to Tand & Tand at battle start', () => {
    const config = createBaseConfig('Custom');
    config.logsEnabled = true;
    config.playerToy = 'Thunder Hammer';
    config.playerToyLevel = 2;
    config.playerPets[0] = createPet('Tand & Tand', { attack: 1, health: 20 });
    config.opponentPets[0] = createPet('Fish', { attack: 1, health: 60 });
    expect(runBattleLogs(config).map((log) => log.message)).toContain(
      'Thunder Hammer gave Tand & Tand +12 attack and +12 health.',
    );
  });

  it('copies 33%, 66%, and 100% of the strongest enemy for Butterfly', () => {
    const silentLog = { isEnabled: () => false } as LogService;
    for (const [level, attack, health] of [[1, 11, 22], [2, 22, 44], [3, 34, 67]]) {
      const owner = {
        level, alive: true, attack: 1, health: 1, triggersConsumed: 0,
        petBehind: () => null,
        parent: { opponent: { getStrongestPet: () => ({ pet: { attack: 34, health: 67 } }) } },
      } as unknown as Pet;
      const ability = new ButterflyAbility({} as EngineContext, owner, silentLog);
      ability.abilityFunction({ gameApi: {} as GameAPI });
      expect([owner.attack, owner.health]).toEqual([attack, health]);
    }
  });

  it('summons a Thunder Hammer at Tand & Tand’s level on transformation', () => {
    let summonedLevel = 0;
    let equippedName = '';
    const owner = {
      level: 2, triggersConsumed: 0, petBehind: () => null,
      parent: { setToy: (toy: { name: string }) => { equippedName = toy.name; } },
    } as unknown as Pet;
    const ability = new TandAndTandAbility(
      {} as EngineContext, owner, { isEnabled: () => false } as LogService,
    );
    ability.abilityFunction({ gameApi: {
      toyService: { createToy: (_name: string, _parent: unknown, level: number) => {
        summonedLevel = level;
        return { name: 'Thunder Hammer' };
      } },
    } as unknown as GameAPI });
    expect([summonedLevel, equippedName]).toEqual([2, 'Thunder Hammer']);
  });
});
