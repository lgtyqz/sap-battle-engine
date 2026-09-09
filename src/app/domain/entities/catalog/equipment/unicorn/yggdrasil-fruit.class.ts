import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment, EquipmentClass } from '../../../equipment.class';
import { Pet } from '../../../pet.class';
import { Tandgnost } from 'app/domain/entities/catalog/pets/custom/tier-4/tandgnost.class';
import { Tandgrisner } from 'app/domain/entities/catalog/pets/custom/tier-5/tandgrisner.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class YggdrasilFruit extends Equipment {
  name = 'Yggdrasil Fruit';
  equipmentClass = 'afterFaint' as EquipmentClass;
  callback = (pet?: Pet) => {
    pet.addAbility(
      new YggdrasilFruitAbility(this.runtime,
        pet,
        this,
        this.logService,
        this.abilityService,
      ),
    );
  };
  constructor(runtime: EngineContext,
    protected logService: LogService,
    protected abilityService: AbilityService,
  ) {
    super(runtime);
  }
}

export class YggdrasilFruitAbility extends Ability {
  private equipment: Equipment;
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    equipment: Equipment,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'YggdrasilFruitAbility',
      owner: owner,
      triggers: ['PostRemovalFaint'],
      abilityType: 'Equipment',
      native: true,
      abilitylevel: 1,
      abilityFunction: (context) => {
        this.executeAbility(context);
      },
    });
    this.equipment = equipment;
    this.logService = logService;
    this.abilityService = abilityService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;

    for (let i = 0; i < this.equipment.multiplier; i++) {
      let tandgnost = new Tandgnost(this.runtime,
        this.logService,
        this.abilityService,
        owner.parent,
        5,
        5,
        0,
      );
      let tandgrisner = new Tandgrisner(this.runtime,
        this.logService,
        this.abilityService,
        owner.parent,
        5,
        5,
        0,
      );

      let multiplierMessage = i > 0 ? this.equipment.multiplierMessage : '';

      let summonResult = owner.parent.summonPet(tandgnost, owner.savedPosition);
      if (summonResult.success) {
        if (this.logService.isEnabled()) this.logService.createLog({
          message: `${owner.name} Spawned Tandgnost (Yggdrasil Fruit)${multiplierMessage}`,
          type: 'ability',
          player: owner.parent,
        });
      }

      let summonResult2 = owner.parent.summonPet(
        tandgrisner,
        owner.savedPosition,
      );
      if (summonResult2.success) {
        if (this.logService.isEnabled()) this.logService.createLog({
          message: `${owner.name} Spawned Tandgrisner (Yggdrasil Fruit)${multiplierMessage}`,
          type: 'ability',
          player: owner.parent,
        });
      }
    }
  }
}

