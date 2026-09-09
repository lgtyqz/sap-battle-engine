import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { EquipmentService } from 'app/integrations/equipment/equipment.service';

import { formatPetScopedRandomLabel } from 'app/runtime/random-decision-label';

export class AlbinoSquirrel extends Pet {
  name = 'Albino Squirrel';
  tier = 2;
  pack: Pack = 'Custom';
  attack = 3;
  health = 2;
  initAbilities(): void {
    this.addAbility(new AlbinoSquirrelAbility(this.runtime, this, this.logService));
    super.initAbilities();
  }
  constructor(runtime: EngineContext,
    protected logService: LogService,
    protected abilityService: AbilityService,
    parent: Player,
    health?: number,
    attack?: number,
    mana?: number,
    exp?: number,
    equipment?: Equipment,
    triggersConsumed?: number,
  ) {
    super(runtime, logService, abilityService, parent);
    this.initPet(exp, health, attack, mana, equipment, triggersConsumed);
  }
}

export class AlbinoSquirrelAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'AlbinoSquirrelAbility',
      owner: owner,
      triggers: ['ThisSold'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => {
        this.executeAbility(context);
      },
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const { tiger, pteranodon } = context;
    const owner = this.owner;

    const equipmentService =
      this.runtime.services.equipmentService;
    const equipmentMap = equipmentService.getInstanceOfAllEquipment();
    const shopFoods = Array.from(equipmentMap.values()).filter(
      (equipment) => equipment.equipmentClass === 'shop',
    );

    if (shopFoods.length === 0) {
      return;
    }

    let chosenFoods: string[] = [];
    for (let i = 0; i < 3; i++) {
      const foodChoice = this.runtime.random.chooseLegacyRandomOption(
        () => ({
          key: 'pet.albino-squirrel-shop-food',
          label: formatPetScopedRandomLabel(
            owner,
            `Albino Squirrel shop food ${i + 1}`,
          ),
          options: shopFoods.map((food) => ({
            id: food.name,
            label: food.name,
          })),
        }),
        () => this.runtime.random.getRandomInt(0, shopFoods.length - 1), (shopFoods).length
      );
      let food = shopFoods[foodChoice.index];
      chosenFoods.push(food.name);
    }

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} restocked shop food with ${chosenFoods.join(', ')} at -${this.level} gold.`,
      type: 'ability',
      player: owner.parent,
      tiger: tiger,
      pteranodon: pteranodon,
      randomEvent: true,
    });

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): AlbinoSquirrelAbility {
    return new AlbinoSquirrelAbility(this.runtime, newOwner, this.logService);
  }
}

