import type { EngineContext } from 'app/runtime/engine-context';
import { LogService } from 'app/integrations/log.service';
import { Equipment, EquipmentClass } from '../../../equipment.class';
import { Pet } from '../../../pet.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { PetService } from 'app/integrations/pet/pet.service';

export class LovePotion extends Equipment {
  name = 'Love Potion';
  equipmentClass = 'beforeStartOfBattle' as EquipmentClass;
  tier = 5;
  callback = (pet: Pet) => {
    const equipment = pet.getEquippedEquipmentInstance(this);
    pet.addAbility(new LovePotionAbility(this.runtime, pet, equipment, this.logService));
  };

  constructor(runtime: EngineContext, protected logService: LogService) {
    super(runtime);
  }
}

export class LovePotionAbility extends Ability {
  private equipment: Equipment;
  private logService: LogService;
  private petService: PetService;

  constructor(runtime: EngineContext, owner: Pet, equipment: Equipment, logService: LogService) {
    super(runtime, {
      name: 'LovePotionAbility',
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
    this.petService = runtime.services.petService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;

    for (let i = 0; i < this.equipment.multiplier; i++) {
      const copyPet = this.petService.createPet(
        {
          name: owner.name,
          attack: 3,
          health: 3,
          exp: 0,
          equipment: null,
          mana: 0,
        },
        owner.parent,
      );

      const summonResult = owner.parent.summonPet(
        copyPet,
        owner.savedPosition,
        false,
        owner,
      );
      if (summonResult.success) {
        const multiplierMessage = i > 0 ? this.equipment.multiplierMessage : '';
        if (this.logService.isEnabled()) this.logService.createLog({
          message: `${owner.name} summoned a ${copyPet.attack}/${copyPet.health} ${copyPet.name} (Love Potion)${multiplierMessage}.`,
          type: 'equipment',
          player: owner.parent,
          randomEvent: summonResult.randomEvent,
        });
      }
    }
  }
}

