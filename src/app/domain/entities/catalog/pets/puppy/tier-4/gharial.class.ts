import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

import { ToyService } from 'app/integrations/toy/toy.service';

import { logAbility } from 'app/domain/entities/ability-resolution';

import { formatPetScopedRandomLabel } from 'app/runtime/random-decision-label';

export class Gharial extends Pet {
  name = 'Gharial';
  tier = 3;
  pack: Pack = 'Puppy';
  attack = 4;
  health = 3;
  initAbilities(): void {
    this.addAbility(
      new GharialAbility(this.runtime, this, this.logService, this.abilityService),
    );
    super.initAbilities();
  }
  constructor(runtime: EngineContext,
    protected logService: LogService,
    protected abilityService: AbilityService,
    parent: Player,
    health?: number,
    attack?: number,
    mana?: number,
    exp?: number,
    equipment?: Equipment,
    triggersConsumed?: number,
  ) {
    super(runtime, logService, abilityService, parent);
    this.initPet(exp, health, attack, mana, equipment, triggersConsumed);
  }
}

export class GharialAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'GharialAbility',
      owner: owner,
      triggers: ['StartTurn'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => {
        this.executeAbility(context);
      },
    });
    this.logService = logService;
    this.abilityService = abilityService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const toyService = this.runtime.services.toyService;
    const tier = Math.max(1, Math.min(3, this.level));
    const availableToys = toyService.toys.get(tier) ?? [];

    if (availableToys.length === 0) {
      this.triggerTigerExecution(context);
      return;
    }

    const toyChoice = this.runtime.random.chooseLegacyRandomOption(
      () => ({
        key: 'pet.gharial-toy',
        label: formatPetScopedRandomLabel(owner, `Gharial level ${tier} toy`),
        options: availableToys.map((name) => ({ id: name, label: name })),
      }),
      () => this.runtime.random.getRandomInt(0, availableToys.length - 1), (availableToys).length
    );
    const toyName = availableToys[toyChoice.index];
    const newToy = toyService.createToy(toyName, owner.parent, tier);
    if (!newToy) {
      this.triggerTigerExecution(context);
      return;
    }

    owner.parent.toy = newToy;
    owner.parent.toy.used = false;
    owner.parent.toy.triggers = 0;

    logAbility(
      this.logService,
      owner,
      `${owner.name} chose a level ${tier} ${toyName} toy.`,
      context.tiger,
      context.pteranodon,
      { randomEvent: toyChoice.randomEvent },
    );
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): GharialAbility {
    return new GharialAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

