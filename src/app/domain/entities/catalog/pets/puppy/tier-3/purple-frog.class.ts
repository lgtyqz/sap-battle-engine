import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { logAbility, resolveFriendSummonedTarget } from 'app/domain/entities/ability-resolution';

export class PurpleFrog extends Pet {
  name = 'Purple Frog';
  tier = 3;
  pack: Pack = 'Puppy';
  attack = 4;
  health = 2;
  initAbilities(): void {
    this.addAbility(
      new PurpleFrogAbility(this.runtime, this, this.logService, this.abilityService),
    );
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

export class PurpleFrogAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;
  private usesThisTurn = 0;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'PurpleFrogAbility',
      owner: owner,
      triggers: ['FriendSummoned', 'StartTurn'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => {
        this.executeAbility(context);
      },
    });
    this.logService = logService;
    this.abilityService = abilityService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    if (context.trigger === 'StartTurn') {
      this.usesThisTurn = 0;
      this.triggerTigerExecution(context);
      return;
    }

    if (this.usesThisTurn >= this.level) {
      this.triggerTigerExecution(context);
      return;
    }

    const targetResp = resolveFriendSummonedTarget(owner, context.triggerPet);
    if (!targetResp.pet) {
      this.triggerTigerExecution(context);
      return;
    }

    targetResp.pet.executeAbilities(
      'StartTurn',
      context.gameApi,
      targetResp.pet,
      undefined,
      undefined,
      { trigger: 'StartTurn' },
    );
    this.usesThisTurn++;

    logAbility(
      this.logService,
      owner,
      `${owner.name} activated ${targetResp.pet.name}'s start of turn ability.`,
      context.tiger,
      context.pteranodon,
      { randomEvent: targetResp.random },
    );
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): PurpleFrogAbility {
    return new PurpleFrogAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

