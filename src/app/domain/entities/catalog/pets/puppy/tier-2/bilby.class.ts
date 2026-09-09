import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { Garlic } from 'app/domain/entities/catalog/equipment/turtle/garlic.class';
import { hasAliveTriggerTarget, resolveTriggerTargetAlive } from 'app/domain/entities/ability-resolution';

export class Bilby extends Pet {
  name = 'Bilby';
  tier = 2;
  pack: Pack = 'Puppy';
  attack = 2;
  health = 4;
  initAbilities(): void {
    this.addAbility(new BilbyAbility(this.runtime, this, this.logService));
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

export class BilbyAbility extends Ability {
  private logService: LogService;

  reset(): void {
    this.maxUses = this.level;
    super.reset();
  }

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'BilbyAbility',
      owner: owner,
      triggers: ['FriendLostPerk'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      maxUses: owner.level,
      precondition: (context: AbilityContext) =>
        hasAliveTriggerTarget(this.owner, context.triggerPet, {
          excludeOwner: true,
        }),
      abilityFunction: (context) => {
        this.executeAbility(context);
      },
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const { gameApi, triggerPet, tiger, pteranodon } = context;
    const owner = this.owner;

    let targetResp = resolveTriggerTargetAlive(owner, triggerPet);
    let target = targetResp.pet;
    if (target == null) {
      return;
    }
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gave ${target.name} Garlic.`,
      type: 'ability',
      player: owner.parent,
      tiger: tiger,
      randomEvent: targetResp.random,
    });
    target.givePetEquipment(new Garlic(this.runtime));

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): BilbyAbility {
    return new BilbyAbility(this.runtime, newOwner, this.logService);
  }
}

