import { describe, expect, it, vi } from 'vitest';
import type { Ability } from '../src/app/domain/entities/ability.class';
import type { GameAPI } from '../src/app/domain/interfaces/gameAPI.interface';
import type { Pet } from '../src/app/domain/entities/pet.class';
import { AbilityQueueService } from '../src/app/integrations/ability/ability-queue.service';
import { EngineContext } from '../src/app/runtime/engine-context';

describe('counter-event ordering', () => {
  it('increments from the source trigger but queues and executes CounterEvent', () => {
    const executeAbilities = vi.fn();
    const numberedTrigger = 'EnemyAttacked7' as const;
    const ability = { triggers: [numberedTrigger] } as Ability;
    const pet = {
      abilityCounter: 0,
      abilityList: [ability],
      attack: 9,
      equipment: undefined,
      parent: { isOpponent: false },
      petBehind: () => null,
      hasTrigger: (trigger: string, source?: string) =>
        trigger === numberedTrigger && source !== 'Equipment',
      executeAbilities,
      transformed: false,
      transformedInto: null,
    } as unknown as Pet;
    const service = new AbilityQueueService(new EngineContext());

    service.incrementCounterForSource(pet, 'FriendHurt');
    service.incrementCounterForSource(pet, 'Eat');
    expect(pet.abilityCounter).toBe(0);

    for (let attack = 0; attack < 6; attack++) {
      service.incrementCounterForSource(
        pet,
        'EnemyAttacked',
        undefined,
        undefined,
      );
    }
    expect(pet.abilityCounter).toBe(6);
    expect(service.globalEventQueue).toEqual([]);

    service.incrementCounterForSource(
      pet,
      'EnemyAttacked',
      pet,
      undefined,
    );

    const event = service.getNextHighestPriorityEvent();
    expect(event).toMatchObject({
      abilityType: 'CounterEvent',
      executionTrigger: numberedTrigger,
      priority: 9,
      triggerPet: pet,
      customParams: {
        trigger: numberedTrigger,
        counterSource: 'EnemyAttacked',
      },
    });
    expect(service.getAbilityPriority(event?.abilityType)).toBe(18);

    service.executeEvent(event!, {} as GameAPI);
    expect(executeAbilities).toHaveBeenCalledWith(
      numberedTrigger,
      expect.anything(),
      pet,
      undefined,
      undefined,
      expect.objectContaining({
        trigger: numberedTrigger,
        counterSource: 'EnemyAttacked',
      }),
      'Pet',
    );
  });
});
