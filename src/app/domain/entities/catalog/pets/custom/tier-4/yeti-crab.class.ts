import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { MelonSlice } from 'app/domain/entities/catalog/equipment/custom/melon-slice.class';
import { hasAliveTriggerTarget, resolveTriggerTargetAlive } from 'app/domain/entities/ability-resolution';

export class YetiCrab extends Pet {
  name = 'Yeti Crab';
  tier = 4;
  pack: Pack = 'Custom';
  attack = 3;
  health = 5;
  initAbilities(): void {
    this.addAbility(new YetiCrabAbility(this.runtime, this, this.logService));
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

export class YetiCrabAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Yeti Crab Ability',
      owner: owner,
      triggers: ['PetLostPerk'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      maxUses: owner.level,
      precondition: (context: AbilityContext) => {
        const { triggerPet } = context;
        const owner = this.owner;
        if (!triggerPet) {
          return false;
        }
        if (triggerPet.parent !== owner.parent) {
          return triggerPet.alive;
        }
        return hasAliveTriggerTarget(owner, triggerPet);
      },
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const triggerPet = context.triggerPet;
    const { tiger, pteranodon } = context;

    if (!triggerPet) {
      return;
    }

    if (triggerPet.parent === owner.parent) {
      const targetResp = resolveTriggerTargetAlive(owner, triggerPet);
      const target = targetResp.pet;
      if (!target) {
        return;
      }
      const melon = new MelonSlice(this.runtime);
      target.givePetEquipment(melon);
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} gave ${target.name} a Melon Slice after losing a perk.`,
        type: 'ability',
        player: owner.parent,
        tiger,
        randomEvent: targetResp.random,
      });
    } else {
      owner.dealDamage(triggerPet, 6);
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} dealt 6 damage to ${triggerPet.name} after they lost a perk.`,
        type: 'ability',
        player: owner.parent,
        tiger,
        pteranodon,
      });
    }

    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): YetiCrabAbility {
    return new YetiCrabAbility(this.runtime, newOwner, this.logService);
  }
}

