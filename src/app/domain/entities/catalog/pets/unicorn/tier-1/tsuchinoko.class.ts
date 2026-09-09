import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Tsuchinoko extends Pet {
  name = 'Tsuchinoko';
  tier = 1;
  pack: Pack = 'Unicorn';
  attack = 2;
  health = 1;
  initAbilities(): void {
    this.addAbility(new TsuchinokoAbility(this.runtime, this, this.logService));
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

export class TsuchinokoAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'TsuchinokoAbility',
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

    let targetResp = owner.parent.getThis(owner);
    let target = targetResp.pet;
    if (target == null) {
      return;
    }

    owner.parent.pushPetToFront(target, true);
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} pushed ${target.name} to the front and gained ${this.level} experience.`,
      type: 'ability',
      player: owner.parent,
      tiger: tiger,
    });

    let expTargetResp = owner.parent.getThis(owner);
    let expTarget = expTargetResp.pet;
    if (expTarget == null) {
      return;
    }
    expTarget.increaseExp(this.level);

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): TsuchinokoAbility {
    return new TsuchinokoAbility(this.runtime, newOwner, this.logService);
  }
}

