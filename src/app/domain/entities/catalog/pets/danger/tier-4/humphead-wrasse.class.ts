import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class HumpheadWrasse extends Pet {
  name = 'Humphead Wrasse';
  tier = 4;
  pack: Pack = 'Danger';
  attack = 6;
  health = 4;

  initAbilities(): void {
    this.addAbility(new HumpheadWrasseAbility(this.runtime, this, this.logService));
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

export class HumpheadWrasseAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'HumpheadWrasseAbility',
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

    let percentage = 0.3 * this.level; // 30%/60%/90%
    let targetResp = owner.parent.opponent.getHighestAttackPet(
      undefined,
      owner,
    );

    if (!targetResp.pet) {
      return;
    }

    let target = targetResp.pet;
    let reductionAmount = Math.ceil(target.attack * percentage);
    let newAttack = Math.max(1, target.attack - reductionAmount);

    target.attack = newAttack;

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} reduced ${target.name}'s attack by ${percentage * 100}% to ${target.attack}.`,
      type: 'ability',
      player: owner.parent,
      tiger: tiger,
      randomEvent: targetResp.random,
    });

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): HumpheadWrasseAbility {
    return new HumpheadWrasseAbility(this.runtime, newOwner, this.logService);
  }
}

