import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Centipede extends Pet {
  name = 'Centipede';
  tier = 3;
  pack: Pack = 'Custom';
  attack = 1;
  health = 4;

  initAbilities(): void {
    this.addAbility(new CentipedeAbility(this.runtime, this, this.logService));
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

export class CentipedeAbility extends Ability {
  private logService: LogService;
  private pendingAttack = 0;
  private pendingHealth = 0;
  private usedThisTurn = false;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'CentipedeAbility',
      owner: owner,
      triggers: ['FriendBought', 'EndTurn'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const { trigger, triggerPet, tiger, pteranodon } = context;
    const owner = this.owner;

    if (trigger === 'FriendBought') {
      if (this.usedThisTurn || !triggerPet) {
        return;
      }
      const tier = triggerPet.tier ?? 1;
      const power = this.level * tier;

      owner.increaseAttack(power);
      owner.increaseHealth(power);
      this.pendingAttack += power;
      this.pendingHealth += power;
      this.usedThisTurn = true;

      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} gained +${power} attack and +${power} health until next turn.`,
        type: 'ability',
        player: owner.parent,
        tiger: tiger,
        pteranodon: pteranodon,
      });

      this.triggerTigerExecution(context);
      return;
    }

    if (trigger === 'EndTurn') {
      if (this.pendingAttack || this.pendingHealth) {
        owner.increaseAttack(-this.pendingAttack);
        owner.increaseHealth(-this.pendingHealth);
        this.pendingAttack = 0;
        this.pendingHealth = 0;
      }
      this.usedThisTurn = false;
      return;
    }
  }

  copy(newOwner: Pet): CentipedeAbility {
    return new CentipedeAbility(this.runtime, newOwner, this.logService);
  }
}

