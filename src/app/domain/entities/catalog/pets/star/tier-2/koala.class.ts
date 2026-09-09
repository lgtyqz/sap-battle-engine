import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { Eucalyptus } from 'app/domain/entities/catalog/equipment/puppy/eucalyptus.class';
import { hasAliveTriggerTarget, getAliveTriggerTarget } from 'app/domain/entities/ability-resolution';

export class Koala extends Pet {
  name = 'Koala';
  tier = 2;
  pack: Pack = 'Star';
  attack = 4;
  health = 2;
  initAbilities(): void {
    this.addAbility(new KoalaAbility(this.runtime, this, this.logService));
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

export class KoalaAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'KoalaAbility',
      owner: owner,
      triggers: ['FriendHurt'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      maxUses: owner.level,
      precondition: (context: AbilityContext) =>
        hasAliveTriggerTarget(this.owner, context.triggerPet),
      abilityFunction: (context) => {
        this.executeAbility(context);
      },
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const { gameApi, triggerPet, tiger, pteranodon } = context;
    const owner = this.owner;

    let targetResp = getAliveTriggerTarget(owner, triggerPet);
    let target = targetResp.pet;
    if (!target) {
      return;
    }

    target.givePetEquipment(new Eucalyptus(this.runtime));

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gave ${target.name} Eucalyptus perk.`,
      type: 'ability',
      player: owner.parent,
      tiger: tiger,
      randomEvent: targetResp.random,
    });

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): KoalaAbility {
    return new KoalaAbility(this.runtime, newOwner, this.logService);
  }
}

