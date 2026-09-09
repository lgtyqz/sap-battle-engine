import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { EquipmentService } from 'app/integrations/equipment/equipment.service';

import { formatPetScopedRandomLabel } from 'app/runtime/random-decision-label';

export class SilkieChicken extends Pet {
  name = 'Silkie Chicken';
  tier = 3;
  pack: Pack = 'Custom';
  attack = 2;
  health = 6;

  override initAbilities(): void {
    this.addAbility(new SilkieChickenAbility(this.runtime, this, this.logService));
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

export class SilkieChickenAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Silkie Chicken Ability',
      owner: owner,
      triggers: ['FriendGainsAilment'],
      abilityType: 'Pet',
      native: true,
      maxUses: 2,
      abilitylevel: owner.level,
      precondition: (context: AbilityContext) => {
        const target = context.triggerPet;
        return !!target && target.alive;
      },
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const { tiger, pteranodon, triggerPet } = context;
    const owner = this.owner;
    const target = triggerPet;

    if (!target) {
      return;
    }

    const equipmentService =
      this.runtime.services.equipmentService;
    const perks = equipmentService.getUsefulPerksByTier(1);

    if (perks.length === 0) {
      return;
    }

    const perkChoice = this.runtime.random.chooseLegacyRandomOption(
      () => ({
        key: 'pet.silkie-chicken-perk',
        label: formatPetScopedRandomLabel(owner, 'Silkie Chicken perk'),
        options: perks.map((perk) => ({ id: perk.name, label: perk.name })),
      }),
      () => this.runtime.random.getRandomInt(0, perks.length - 1), (perks).length
    );
    const perk = perks[perkChoice.index];
    target.givePetEquipment(perk);

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gave ${target.name} the ${perk.name} perk.`,
      type: 'ability',
      player: owner.parent,
      tiger: tiger,
      pteranodon: pteranodon,
      randomEvent: perkChoice.randomEvent,
    });

    this.triggerTigerExecution(context);
  }

  override copy(newOwner: Pet): SilkieChickenAbility {
    return new SilkieChickenAbility(this.runtime, newOwner, this.logService);
  }
}

