import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { feedCorncob } from 'app/domain/entities/food-effects';

export class FarmerCat extends Pet {
  name = 'Farmer Cat';
  tier = 4;
  pack: Pack = 'Custom';
  attack = 4;
  health = 3;
  initAbilities(): void {
    this.addAbility(new FarmerCatAbility(this.runtime, this, this.logService));
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

export class FarmerCatAbility extends Ability {
  constructor(
    runtime: EngineContext,
    owner: Pet,
    private logService: LogService,
  ) {
    super(runtime, {
      name: 'Farmer Cat Ability',
      owner,
      triggers: ['ThisBought'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const friends = owner.parent.petArray.filter(
      (pet) => pet.alive && pet !== owner,
    );

    for (const friend of friends) {
      for (let i = 0; i < this.level; i++) {
        feedCorncob(friend);
      }
    }

    if (friends.length > 0 && this.logService.isEnabled()) {
      this.logService.createLog({
        message: `${owner.name} fed ${this.level} Corncob${this.level === 1 ? '' : 's'} to ${friends.length} friend${friends.length === 1 ? '' : 's'}.`,
        type: 'ability',
        player: owner.parent,
        tiger: context.tiger,
        pteranodon: context.pteranodon,
      });
    }

    this.triggerTigerExecution(context);
  }

  override copy(newOwner: Pet): FarmerCatAbility {
    return new FarmerCatAbility(this.runtime, newOwner, this.logService);
  }
}
