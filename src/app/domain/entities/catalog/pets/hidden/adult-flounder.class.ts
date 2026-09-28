import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class AdultFlounder extends Pet {
  name = 'Adult Flounder';
  tier = 1;
  pack: Pack = 'Custom';
  hidden: boolean = true;
  attack = 2;
  health = 4;
  override initAbilities(): void {
    this.addAbility(new AdultFlounderAbility(this.runtime, this, this.logService));
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

export class AdultFlounderAbility extends Ability {
  constructor(runtime: EngineContext, owner: Pet, private logService: LogService) {
    super(runtime, {
      name: 'AdultFlounderAbility',
      owner,
      triggers: ['ThisTransformed'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const friends = owner.parent.petArray.filter((pet) => pet !== owner && pet.alive).slice(-2);
    for (const friend of friends) {
      friend.increaseExp(this.level);
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} gave ${friend.name} +${this.level} experience.`,
        type: 'ability',
        player: owner.parent,
        tiger: context.tiger,
        pteranodon: context.pteranodon,
      });
    }
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): AdultFlounderAbility {
    return new AdultFlounderAbility(this.runtime, newOwner, this.logService);
  }
}
