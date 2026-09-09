import type { EngineContext } from 'app/runtime/engine-context';
import { LogService } from 'app/integrations/log.service';
import { Equipment, EquipmentClass } from '../../../equipment.class';
import { Pet } from '../../../pet.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Durian extends Equipment {
  name = 'Durian';
  equipmentClass: EquipmentClass = 'beforeAttack';
  callback = (pet: Pet) => {
    const equipment = pet.getEquippedEquipmentInstance(this);
    pet.addAbility(new DurianAbility(this.runtime, pet, equipment, this.logService));
  };

  constructor(runtime: EngineContext, protected logService: LogService) {
    super(runtime);
  }
}

export class DurianAbility extends Ability {
  private equipment: Equipment;
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, equipment: Equipment, logService: LogService) {
    super(runtime, {
      name: 'DurianAbility',
      owner: owner,
      triggers: ['BeforeThisAttacks'],
      abilityType: 'Equipment',
      native: true,
      maxUses: 1, // Durian is removed after one use
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

    let multiplier = this.equipment.multiplier;

    for (let i = 0; i < multiplier; i++) {
      let resp = owner.parent.opponent.getHighestHealthPet();
      let targetPet = resp.pet;
      if (targetPet == null) {
        continue;
      }

      let power = 0.33;
      let reducedTo = Math.max(1, Math.floor(targetPet.health * (1 - power)));
      targetPet.health = reducedTo;

      let multiplierMessage = i > 0 ? this.equipment.multiplierMessage : '';

      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${this.equipment.name} reduced ${targetPet.name} health by ${power * 100}% to ${reducedTo}${multiplierMessage}`,
        type: 'ability',
        player: owner.parent,
        randomEvent: resp.random,
      });
    }

    // Remove equipment after use
    owner.removePerk();
  }
}

