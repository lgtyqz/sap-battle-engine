import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';
import { Pet } from '../../../pet.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

import { LogService } from 'app/integrations/log.service';

export class OysterMushroom extends Equipment {
  name = 'Oyster Mushroom';
  equipmentClass: EquipmentClass = 'beforeAttack';
  callback = (pet: Pet) => {
    const equipment = pet.getEquippedEquipmentInstance(this);
    pet.addAbility(new OysterMushroomAbility(this.runtime, pet, equipment));
  };
}

export class OysterMushroomAbility extends Ability {
  private equipment: Equipment;
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, equipment: Equipment) {
    super(runtime, {
      name: 'OysterMushroomAbility',
      owner: owner,
      triggers: ['BeforeThisAttacks'],
      abilityType: 'Equipment',
      native: true,
      maxUses: 1,
      abilitylevel: 1,
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.equipment = equipment;
    this.logService = runtime.services.logService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const targetAttack = Math.max(owner.attack, 9);
    const targetHealth = Math.max(owner.health, 9);

    if (targetAttack !== owner.attack) {
      owner.attack = targetAttack;
    }
    if (targetHealth !== owner.health) {
      owner.health = targetHealth;
    }

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} set stats to ${owner.attack}/${owner.health}. (Oyster Mushroom)`,
      type: 'equipment',
      player: owner.parent,
    });

    owner.removePerk();
  }
}

