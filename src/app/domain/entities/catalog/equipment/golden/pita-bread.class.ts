import type { EngineContext } from 'app/runtime/engine-context';
import { LogService } from 'app/integrations/log.service';
import { Equipment, EquipmentClass } from '../../../equipment.class';
import { Pet } from '../../../pet.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class PitaBread extends Equipment {
  name = 'Pita Bread';
  tier = 6;
  power = 0;
  equipmentClass = 'hurt' as EquipmentClass;
  callback = (pet: Pet) => {
    const equipment = pet.getEquippedEquipmentInstance(this);
    pet.addAbility(new PitaBreadAbility(this.runtime, pet, equipment, this.logService));
  };
  constructor(runtime: EngineContext, protected logService: LogService) {
    super(runtime);
  }
}

export class PitaBreadAbility extends Ability {
  private equipment: Equipment;
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, equipment: Equipment, logService: LogService) {
    super(runtime, {
      name: 'PitaBreadAbility',
      owner: owner,
      triggers: ['ThisHurt'],
      abilityType: 'Equipment',
      native: true,
      maxUses: 1, // Pita Bread is removed after one use
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

    if (!owner.alive) {
      return;
    }

    let multiplier = this.equipment.multiplier;
    let power = 15 * multiplier;
    owner.increaseHealth(power);

    let message = `${owner.name} gained ${power} health. (Pita Bread)${this.equipment.multiplierMessage}`;

    if (this.logService.isEnabled()) this.logService.createLog({
      message: message,
      type: 'equipment',
      player: owner.parent,
    });

    owner.removePerk();
  }
}

