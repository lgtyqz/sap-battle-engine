import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

import { formatPetScopedRandomLabel } from 'app/runtime/random-decision-label';

export class Cockatoo extends Pet {
  name = 'Cockatoo';
  tier = 4;
  pack: Pack = 'Golden';
  attack = 4;
  health = 2;
  initAbilities(): void {
    this.addAbility(
      new CockatooAbility(this.runtime, this, this.logService, this.abilityService),
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

export class CockatooAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'CockatooAbility',
      owner: owner,
      triggers: ['ThisBought'],
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
    const friends = owner.parent.petArray.filter(
      (pet) => pet.alive && pet !== owner,
    );
    if (friends.length === 0) {
      this.triggerTigerExecution(context);
      return;
    }

    let maxTier = Math.max(...friends.map((pet) => pet.tier));
    const candidates = friends.filter((pet) => pet.tier === maxTier);
    const choice = this.runtime.random.chooseRandomOption(
      () => ({
        key: 'pet.cockatoo-bought-target',
        label: formatPetScopedRandomLabel(owner, 'Cockatoo bought target'),
        options: candidates.map((pet) => ({
          id: `${pet.savedPosition + 1}:${pet.name}`,
          label: `P${pet.savedPosition + 1} ${pet.name}`,
        })),
      }),
      () => this.runtime.random.getRandomInt(0, candidates.length - 1), (candidates).length
    );
    const target = candidates[choice.index];
    const buff = this.level * 2;
    target.increaseAttack(buff);
    target.increaseHealth(buff);

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gave ${target.name} +${buff}/+${buff}.`,
      type: 'ability',
      player: owner.parent,
      tiger: context.tiger,
      pteranodon: context.pteranodon,
      randomEvent: choice.randomEvent,
    });
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): CockatooAbility {
    return new CockatooAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

