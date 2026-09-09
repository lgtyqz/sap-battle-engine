import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { logAbility, resolveFriendSummonedTarget } from 'app/domain/entities/ability-resolution';

export class Lobster extends Pet {
  name = 'Lobster';
  tier = 4;
  pack: Pack = 'Puppy';
  attack = 3;
  health = 3;
  initAbilities(): void {
    this.addAbility(
      new LobsterAbility(this.runtime, this, this.logService, this.abilityService),
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

export class LobsterAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'LobsterAbility',
      owner: owner,
      triggers: ['FriendSummoned'],
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
    const targetResp = resolveFriendSummonedTarget(owner, context.triggerPet);
    if (!targetResp.pet) {
      return;
    }

    const attackGain = this.level;
    const healthGain = this.level * 2;
    targetResp.pet.increaseAttack(attackGain);
    targetResp.pet.increaseHealth(healthGain);

    logAbility(
      this.logService,
      owner,
      `${owner.name} gave ${targetResp.pet.name} ${attackGain} attack and ${healthGain} health.`,
      context.tiger,
      context.pteranodon,
      { randomEvent: targetResp.random },
    );
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): LobsterAbility {
    return new LobsterAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

