import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';
import { Pet } from '../../../pet.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

import { LogService } from 'app/integrations/log.service';
import { PetService } from 'app/integrations/pet/pet.service';

export class Webbed extends Equipment {
  name = 'Webbed';
  equipmentClass: EquipmentClass = 'ailment-other';
  callback = (pet: Pet) => {
    pet.addAbility(new WebbedAbility(this.runtime, pet));
  };
}

export class WebbedAbility extends Ability {
  private logService: LogService;
  private petService: PetService;

  constructor(runtime: EngineContext, owner: Pet) {
    super(runtime, {
      name: 'WebbedAbility',
      owner: owner,
      triggers: ['PostRemovalFaint'],
      abilityType: 'Equipment',
      native: true,
      abilitylevel: 1,
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = runtime.services.logService;
    this.petService = runtime.services.petService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const opponent = owner.parent.opponent;

    const spider = this.petService.createPet(
      {
        name: 'Spider',
        attack: 2,
        health: 2,
        exp: 0,
        equipment: null,
        mana: 0,
      },
      opponent,
    );

    const summonResult = opponent.summonPet(spider, 0, false, owner);
    if (summonResult.success) {
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} summoned ${spider.name} for the opponent. (Webbed)`,
        type: 'equipment',
        player: owner.parent,
        randomEvent: summonResult.randomEvent,
      });
    }
  }
}

