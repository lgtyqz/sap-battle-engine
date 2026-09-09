import type { EngineContext } from 'app/runtime/engine-context';
import { LogService } from 'app/integrations/log.service';
import { Equipment, EquipmentClass } from '../../../equipment.class';
import { Pet } from '../../../pet.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Pancakes extends Equipment {
  name = 'Pancakes';
  tier = 6;
  equipmentClass: EquipmentClass = 'beforeStartOfBattle';
  callback = (pet: Pet) => {
    const equipment = pet.getEquippedEquipmentInstance(this);
    // Add Pancakes ability using dedicated ability class
    pet.addAbility(new PancakesAbility(this.runtime, pet, equipment, this.logService));
  };

  constructor(runtime: EngineContext, protected logService: LogService) {
    super(runtime);
  }
}

export class PancakesAbility extends Ability {
  private equipment: Equipment;
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, equipment: Equipment, logService: LogService) {
    super(runtime, {
      name: 'PancakesAbility',
      owner: owner,
      triggers: ['BeforeStartBattle'],
      abilityType: 'Equipment',
      native: true,
      abilitylevel: 1,
      abilityFunction: (context) => {
        this.executeAbility(context);
      },
    });
    this.equipment = equipment;
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;

    for (let pett of owner.parent.petArray) {
      if (owner == pett) {
        continue;
      }
      let attackGain = 2 * this.equipment.multiplier;
      let healthGain = 2 * this.equipment.multiplier;
      pett.increaseAttack(attackGain);
      pett.increaseHealth(healthGain);
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${pett.name} gained ${attackGain} attack and ${healthGain} health (Pancakes)${this.equipment.multiplierMessage}`,
        type: 'equipment',
        player: owner.parent,
      });
    }
  }
}

