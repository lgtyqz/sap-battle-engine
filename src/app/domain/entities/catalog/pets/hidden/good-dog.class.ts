import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../equipment.class';
import { Pack, Pet } from '../../../pet.class';
import { Player } from '../../../player.class';
import { PetService } from 'app/integrations/pet/pet.service';
import { GameService } from 'app/runtime/state/game.service';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { EquipmentService } from 'app/integrations/equipment/equipment.service';

import { cloneEquipment } from 'app/runtime/equipment-clone';

import { formatPetScopedRandomLabel } from 'app/runtime/random-decision-label';

export class GoodDog extends Pet {
  name = 'Good Dog';
  tier = 5;
  pack: Pack = 'Unicorn';
  attack = 1;
  health = 1;
  hidden: boolean = true;
  initAbilities(): void {
    this.addAbility(new GoodDogAbility(this.runtime, this, this.logService));
    super.initAbilities();
  }
  constructor(runtime: EngineContext,
    protected logService: LogService,
    protected abilityService: AbilityService,
    protected petService: PetService,
    protected gameService: GameService,
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

export class GoodDogAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'GoodDogAbility',
      owner: owner,
      triggers: ['StartBattle'],
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
    const { gameApi, triggerPet, tiger, pteranodon } = context;
    const owner = this.owner;

    let targetsResp = owner.parent.getAll(true, owner);
    let targets = targetsResp.pets;
    if (targets.length === 0) {
      return;
    }

    const equipmentMap = this.runtime.services.equipmentService
      .getInstanceOfAllEquipment();
    const minTierByLevel = new Map([
      [1, 1],
      [2, 3],
      [3, 5],
    ]);
    const minTier = minTierByLevel.get(owner.level) ?? 1;
    let equipmentArray = Array.from(equipmentMap.values()).filter(
      (equipment) => equipment && (equipment.tier ?? 1) >= minTier,
    );

    if (!equipmentArray.length) {
      equipmentArray = Array.from(equipmentMap.values()).filter(
        (equipment) => equipment,
      );
    }

    for (let pet of targets) {
      if (!pet.alive) {
        continue;
      }
      const choice = this.runtime.random.chooseRandomOption(
        () => ({
          key: 'pet.good-dog-equipment',
          label: formatPetScopedRandomLabel(
            owner,
            `Good Dog equipment for P${pet.savedPosition + 1} ${pet.name}`,
          ),
          options: equipmentArray.map((equipment) => ({
            id: equipment.name,
            label: equipment.name,
          })),
        }),
        () => this.runtime.random.getRandomInt(0, equipmentArray.length - 1), (equipmentArray).length
      );
      const baseEquipment = equipmentArray[choice.index];
      const equipment = cloneEquipment(baseEquipment);
      if (!equipment) {
        continue;
      }
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} gave ${pet.name} ${equipment.name}`,
        type: 'ability',
        player: owner.parent,
        randomEvent: targetsResp.random || choice.randomEvent,
        tiger: tiger,
      });
      pet.givePetEquipment(equipment);
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): GoodDogAbility {
    return new GoodDogAbility(this.runtime, newOwner, this.logService);
  }
}

