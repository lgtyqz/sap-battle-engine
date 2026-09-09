import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { PetService } from 'app/integrations/pet/pet.service';
import { Equipment, EquipmentClass } from '../../../equipment.class';
import { Pet } from '../../../pet.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Seaweed extends Equipment {
  name = 'Seaweed';
  equipmentClass = 'beforeAttack' as EquipmentClass;
  callback = (pet: Pet) => {
    const equipment = pet.getEquippedEquipmentInstance(this);
    // Add Seaweed ability using dedicated ability class
    pet.addAbility(
      new SeaweedAbility(this.runtime, pet, equipment, this.logService, this.petService),
    );
  };

  constructor(runtime: EngineContext,
    protected logService: LogService,
    protected abilityService: AbilityService,
    protected petService: PetService,
  ) {
    super(runtime);
  }
}

export class SeaweedAbility extends Ability {
  private equipment: Equipment;
  private logService: LogService;
  private petService: PetService;

  constructor(runtime: EngineContext,
    owner: Pet,
    equipment: Equipment,
    logService: LogService,
    petService: PetService,
  ) {
    super(runtime, {
      name: 'SeaweedAbility',
      owner: owner,
      triggers: ['BeforeThisAttacks'],
      abilityType: 'Equipment',
      native: true,
      abilitylevel: 1,
      abilityFunction: (context) => {
        this.executeAbility(context);
      },
    });
    this.equipment = equipment;
    this.logService = logService;
    this.petService = petService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;

    // Create Baby Urchin with current pet's stats
    let babyUrchinPet = this.petService.createPet(
      {
        name: 'Baby Urchin',
        attack: owner.attack,
        health: owner.health,
        mana: owner.mana,
        exp: owner.exp,
        equipment: null,
      },
      owner.parent,
    );

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} transformed into ${babyUrchinPet.name} (Seaweed)`,
      type: 'equipment',
      player: owner.parent,
    });

    owner.parent.transformPet(owner, babyUrchinPet);
  }
}

