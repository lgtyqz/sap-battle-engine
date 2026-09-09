import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Buffalo extends Pet {
  name = 'Buffalo';
  tier = 4;
  pack: Pack = 'Puppy';
  attack = 4;
  health = 4;
  initAbilities(): void {
    this.addAbility(
      new BuffaloAbility(this.runtime, this, this.logService, this.abilityService),
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

export class BuffaloAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;
  private pendingAttack = 0;
  private pendingHealth = 0;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'BuffaloAbility',
      owner: owner,
      triggers: ['FriendSold', 'StartTurn'],
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
      if (this.pendingAttack || this.pendingHealth) {
        owner.increaseAttack(-this.pendingAttack);
        owner.increaseHealth(-this.pendingHealth);
      }
      this.pendingAttack = 0;
      this.pendingHealth = 0;
      this.triggerTigerExecution(context);
      return;
    }

    const soldPet = context.triggerPet;
    if (!soldPet || !soldPet.isSellPet()) {
      this.triggerTigerExecution(context);
      return;
    }

    const buff = this.level * 2;
    owner.increaseAttack(buff);
    owner.increaseHealth(buff);
    this.pendingAttack += buff;
    this.pendingHealth += buff;

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gained +${buff}/+${buff} until next turn after ${soldPet.name} was sold.`,
      type: 'ability',
      player: owner.parent,
      tiger: context.tiger,
      pteranodon: context.pteranodon,
    });
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): BuffaloAbility {
    return new BuffaloAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

