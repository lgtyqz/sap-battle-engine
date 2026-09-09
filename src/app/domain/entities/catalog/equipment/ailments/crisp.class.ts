import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';
import { Pet } from '../../../pet.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { EquipmentDamageHandler } from '../../../combat/equipment-damage.handler';

import { LogService } from 'app/integrations/log.service';

export class Crisp extends Equipment {
  name = 'Crisp';
  equipmentClass: EquipmentClass = 'ailment-other';
  callback = (pet: Pet) => {
    pet.addAbility(new CrispAbility(this.runtime, pet));
  };
}

export class CrispAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet) {
    super(runtime, {
      name: 'CrispAbility',
      owner,
      triggers: ['AnyoneAttack'],
      abilityType: 'Equipment',
      native: true,
      abilitylevel: 1,
      precondition: () => owner.equipment instanceof Crisp,
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = runtime.services.logService;
  }

  private executeAbility(_context: AbilityContext): void {
    const owner = this.owner;
    EquipmentDamageHandler.applyDamage({
      pet: owner,
      baseDamage: 6,
      perkName: 'Crisp',
      manticoreMultipliers: owner.parent.opponent.getManticoreMult(),
      logService: this.logService,
      afterDamage: (target) => target.removePerk(),
    });
  }
}
