import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';
import { Pet } from '../../../pet.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

import { LogService } from 'app/integrations/log.service';

export class Cursed extends Equipment {
  name = 'Cursed';
  equipmentClass: EquipmentClass = 'ailment-other';
  callback = (pet: Pet) => {
    pet.addAbility(new CursedAbility(this.runtime, pet));
  };
}

export class CursedAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet) {
    super(runtime, {
      name: 'CursedAbility',
      owner: owner,
      triggers: ['PostRemovalFaint'],
      abilityType: 'Equipment',
      native: true,
      abilitylevel: 1,
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = runtime.services.logService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const targetResp = owner.parent.getRandomPet(
      [owner],
      false,
      false,
      false,
      owner,
    );
    const target = targetResp.pet;

    if (!target) {
      return;
    }

    target.givePetEquipment(new Cursed(this.runtime));
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} made ${target.name} Cursed.`,
      type: 'equipment',
      player: owner.parent,
      randomEvent: targetResp.random,
    });
  }
}

