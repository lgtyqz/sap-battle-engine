import type { EngineContext } from 'app/runtime/engine-context';
import { LogService } from 'app/integrations/log.service';
import { Equipment, EquipmentClass } from '../../../equipment.class';
import { Pet } from '../../../pet.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class GoldenEgg extends Equipment {
  name = 'Golden Egg';
  equipmentClass: EquipmentClass = 'beforeAttack';
  callback = (pet: Pet) => {
    const equipment = pet.getEquippedEquipmentInstance(this);
    pet.addAbility(new GoldenEggAbility(this.runtime, pet, equipment));
  };

  constructor(runtime: EngineContext, protected logService: LogService) {
    super(runtime);
  }
}

export class GoldenEggAbility extends Ability {
  private equipment: Equipment;

  constructor(runtime: EngineContext, owner: Pet, equipment: Equipment) {
    super(runtime, {
      name: 'GoldenEggAbility',
      owner: owner,
      triggers: ['BeforeThisAttacks'],
      abilityType: 'Equipment',
      native: true,
      maxUses: 1, // Golden Egg is removed after one use
      abilitylevel: 1,
      abilityFunction: (context) => {
        this.executeAbility(context);
      },
    });
    this.equipment = equipment;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const attackPet = context.attackTarget instanceof Pet
      ? context.attackTarget
      : owner.parent.opponent.furthestUpPet;

    if (attackPet == null || !attackPet.alive) {
      return;
    }

    let multiplier = this.equipment.multiplier;

    for (let i = 0; i < multiplier; i++) {
      // Use proper snipePet method which handles all the damage logic correctly
      owner.snipePet(attackPet, 6, false, false, false, true, false);
    }

    // Remove equipment after use
    owner.removePerk();
  }
}
