import { describe, expect, it, vi } from 'vitest';
import { CyclopsAbility } from '../src/app/domain/entities/catalog/pets/unicorn/tier-4/cyclops.class';
import type { Pet } from '../src/app/domain/entities/pet.class';
import type { LogService } from '../src/app/integrations/log.service';
import type { GameAPI } from '../src/app/domain/interfaces/gameAPI.interface';
import { EngineContext } from '../src/app/runtime/engine-context';
import { createBaseConfig, createPet } from './support/battle-test-runtime';
import { runSimulation } from '../src';

function abilityFixture(level = 1, triggersConsumed = 0) {
  const owner = {
    level, triggersConsumed, removed: false, name: 'Cyclops',
    abilityValidCheck: () => true, petBehind: () => null,
    parent: { getSpecificPet: (_owner: Pet, pet: Pet) => ({ pet, random: false }) },
  } as unknown as Pet;
  const target = {
    name: 'Fish', alive: true, increaseMana: vi.fn(), increaseExp: vi.fn(),
  } as unknown as Pet;
  const logService = { isEnabled: () => false } as LogService;
  const ability = new CyclopsAbility(new EngineContext(), owner, logService);
  const trigger = () => ability.execute({} as GameAPI, target, false, false, { trigger: 'FriendLeveledUp' });
  return { owner, target, ability, trigger };
}

describe('Cyclops per-turn experience limit', () => {
  it.each([1, 2, 3])('grants experience only on the first %i triggers but always grants mana', (level) => {
    const { target, trigger } = abilityFixture(level);
    for (let i = 0; i < 5; i++) trigger();
    expect(target.increaseExp).toHaveBeenCalledTimes(level);
    expect(target.increaseMana).toHaveBeenCalledTimes(5);
    expect(target.increaseMana).toHaveBeenLastCalledWith(level * 2);
  });

  it('refreshes the experience allowance when Cyclops levels up', () => {
    const { owner, target, ability, trigger } = abilityFixture(1, 2);
    Object.assign(owner, { level: 2 });
    ability.reset();
    trigger(); trigger(); trigger();
    expect(target.increaseExp).toHaveBeenCalledTimes(2);
    expect(target.increaseMana).toHaveBeenCalledTimes(3);
    expect(target.increaseMana).toHaveBeenLastCalledWith(4);
  });

  it('starts a new turn with a fresh experience allowance without granting mana on StartTurn', () => {
    const { target, ability, trigger } = abilityFixture(2, 2);
    expect(ability.matchesTrigger('StartTurn')).toBe(true);
    ability.execute({} as GameAPI, undefined, false, false, { trigger: 'StartTurn' });
    expect(target.increaseMana).not.toHaveBeenCalled();
    for (let i = 0; i < 3; i++) trigger();
    expect(target.increaseExp).toHaveBeenCalledTimes(2);
    expect(target.increaseMana).toHaveBeenCalledTimes(3);
  });

  it('restores configured progress for each simulation', () => {
    const { target, ability, trigger } = abilityFixture(2, 1);
    trigger(); trigger();
    ability.initUses();
    trigger(); trigger();
    expect(target.increaseExp).toHaveBeenCalledTimes(2);
    expect(target.increaseMana).toHaveBeenCalledTimes(4);
  });

  it('refreshes experience when Cyclops levels up before battle', () => {
    const config = createBaseConfig('Unicorn');
    config.logsEnabled = true;
    config.playerPets = [
      createPet('Ant', { exp: 1, equipment: { name: 'Gingerbread Man' } }),
      createPet('Cyclops', { exp: 1, attack: 50, triggersConsumed: 2, equipment: { name: 'Gingerbread Man' } }),
      null, null, null,
    ];
    config.opponentPets[0] = createPet('Fish', { attack: 50, health: 50 });
    const messages = runSimulation(config).battles?.[0]?.logs.map((log) => log.message) ?? [];
    expect(messages).toContain('Cyclops leveled up to level 2.');
    expect(messages).toContain('Cyclops gave Ant 4 mana.');
    expect(messages).toContain('Cyclops gave Ant 1 exp.');
  });

  it.each([0, 1, 2, 3])('honors %i consumed triggers through the public simulation API', (triggersConsumed) => {
    const config = createBaseConfig('Unicorn');
    config.logsEnabled = true;
    config.simulationCount = 2;
    config.maxLoggedBattles = 2;
    config.playerPets = [
      ...Array.from({ length: 4 }, () => createPet('Ant', { exp: 1, equipment: { name: 'Gingerbread Man' } })),
      createPet('Cyclops', { exp: 5, triggersConsumed }),
    ];
    config.opponentPets[0] = createPet('Fish', { attack: 50, health: 50 });
    const result = runSimulation(config);
    expect(result.battles).toHaveLength(2);
    for (const battle of result.battles ?? []) {
      expect(battle.logs.filter((log) => log.message === 'Cyclops gave Ant 6 mana.')).toHaveLength(4);
      expect(battle.logs.filter((log) => log.message === 'Cyclops gave Ant 1 exp.')).toHaveLength(3 - triggersConsumed);
    }
  });
});
