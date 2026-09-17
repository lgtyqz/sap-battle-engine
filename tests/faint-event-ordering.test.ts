import { describe, expect, it } from 'vitest';
import type { AbilityTrigger } from '../src/app/domain/entities/ability.class';
import type { Pet } from '../src/app/domain/entities/pet.class';
import { FaintEventService } from '../src/app/integrations/ability/faint-event.service';
import type { AbilityQueueService } from '../src/app/integrations/ability/ability-queue.service';
import type { ToyEventService } from '../src/app/integrations/ability/toy-event.service';
import { EngineContext } from '../src/app/runtime/engine-context';

describe('post-removal faint ordering', () => {
  it('captures adjacent friends at faint time and triggers them after removal', () => {
    const calls: Array<{ pet: Pet; trigger: AbilityTrigger }> = [];
    const opponent = {};
    const parent = { opponent };

    let faintedPet: Pet;
    let friendAhead: Pet;
    let friendBehind: Pet;
    let distantFriend: Pet;

    distantFriend = {
      alive: true,
      parent,
      savedPosition: 4,
      petBehind: () => null,
    } as unknown as Pet;
    friendBehind = {
      alive: true,
      parent,
      savedPosition: 3,
      petBehind: () => distantFriend,
    } as unknown as Pet;
    faintedPet = {
      alive: false,
      parent,
      savedPosition: 2,
      petBehind: () => friendBehind,
    } as unknown as Pet;
    friendAhead = {
      alive: true,
      parent,
      savedPosition: 0,
      petBehind: () => faintedPet,
    } as unknown as Pet;

    let removed = false;
    const queueService = {
      getTeam: (subject: Pet | object) => {
        if (subject === faintedPet) {
          return removed
            ? [friendAhead, friendBehind, distantFriend]
            : [friendAhead, faintedPet, friendBehind, distantFriend];
        }
        return [];
      },
      triggerAbility: (pet: Pet, trigger: AbilityTrigger) => {
        calls.push({ pet, trigger });
      },
      incrementCounterForSource: () => undefined,
    } as unknown as AbilityQueueService;
    const toyEventService = {
      triggerFriendFaintsToyEvents: () => undefined,
      executeFriendFaintsToyEvents: () => undefined,
    } as unknown as ToyEventService;
    const service = new FaintEventService(
      new EngineContext(),
      queueService,
      toyEventService,
    );

    service.triggerFaintEvents(faintedPet);
    expect(
      calls.filter((call) => call.trigger === 'AdjacentFriendsFaint'),
    ).toEqual([]);

    removed = true;
    service.triggerAfterFaintEvents(faintedPet);
    expect(
      calls
        .filter((call) => call.trigger === 'AdjacentFriendsFaint')
        .map((call) => call.pet),
    ).toEqual([friendAhead, friendBehind]);
  });
});
