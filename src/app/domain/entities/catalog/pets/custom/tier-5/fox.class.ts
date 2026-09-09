import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

import { EquipmentService } from 'app/integrations/equipment/equipment.service';

export class Fox extends Pet {
  name = 'Fox';
  tier = 5;
  pack: Pack = 'Custom';
  attack = 6;
  health = 4;
  initAbilities(): void {
    this.addAbility(new FoxAbility(this.runtime, this, this.logService));
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

export class FoxAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Fox Ability',
      owner: owner,
      triggers: ['EndTurn'],
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
    const owner = this.owner;
    const equipmentService =
      this.runtime.services.equipmentService;
    const equipmentMap = equipmentService.getInstanceOfAllEquipment();
    const shopFoods = Array.from(equipmentMap.values()).filter(
      (equipment) => equipment.equipmentClass === 'shop',
    );
    if (shopFoods.length === 0) {
      this.triggerTigerExecution(context);
      return;
    }

    const stolenFood = shopFoods[shopFoods.length - 1];
    const effectMultiplier = this.level;
    const baseBuff = Math.max(1, owner.level * 2);
    const totalBuff = baseBuff * effectMultiplier;
    owner.increaseAttack(totalBuff);
    owner.increaseHealth(totalBuff);

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} stole ${stolenFood.name} (x${effectMultiplier}) and gained +${totalBuff}/+${totalBuff}.`,
      type: 'ability',
      player: owner.parent,
      tiger: context.tiger,
      pteranodon: context.pteranodon,
    });

    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): FoxAbility {
    return new FoxAbility(this.runtime, newOwner, this.logService);
  }
}

