import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment } from '../../../../equipment.class';
import { Pet } from '../../../../pet.class';
import { LogService } from 'app/integrations/log.service';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Pegasus extends Pet {
  constructor(runtime: EngineContext,
    logService: LogService,
    abilityService: AbilityService,
    parent: Player,
    health?: number,
    attack?: number,
    mana?: number,
    exp?: number,
    equipment?: Equipment,
    triggersConsumed?: number,
  ) {
    super(runtime, logService, abilityService, parent);
    this.name = 'Pegasus';
    this.tier = 4;
    this.pack = 'Custom';
    this.attack = 2;
    this.health = 4;
    this.initPet(exp, health, attack, mana, equipment, triggersConsumed);
  }

  override initAbilities(): void {
    this.abilityList = [new PegasusAbility(this.runtime, this, this.logService)];
    super.initAbilities();
  }
}

export class PegasusAbility extends Ability {
  private logService: LogService;
  private pendingBuffs: Map<Pet, number> = new Map();

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Pegasus Ability',
      owner: owner,
      triggers: ['FriendSummoned', 'EndTurn'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const { trigger, tiger, pteranodon } = context;
    const owner = this.owner;

    if (trigger === 'FriendSummoned') {
      const targetsResp = owner.parent.getRandomPets(
        3,
        [],
        false,
        false,
        owner,
      );
      const buffAmount = this.level;

      if (targetsResp.pets.length > 0) {
        const names = [];
        for (const target of targetsResp.pets) {
          target.increaseAttack(buffAmount);
          const previousBuff = this.pendingBuffs.get(target) ?? 0;
          this.pendingBuffs.set(target, previousBuff + buffAmount);
          names.push(target.name);
        }

        if (this.logService.isEnabled()) this.logService.createLog({
          message: `${owner.name} temporarily buffed ${names.join(', ')} for +${buffAmount} attack until next turn.`,
          type: 'ability',
          player: owner.parent,
          tiger: tiger,
          pteranodon: pteranodon,
          randomEvent: targetsResp.random,
        });
      }
    } else if (trigger === 'EndTurn') {
      this.resetBuffs();
    }

    this.triggerTigerExecution(context);
  }

  private resetBuffs(): void {
    for (const [pet, amount] of this.pendingBuffs) {
      if (pet.alive) {
        pet.increaseAttack(-amount);
      }
    }
    this.pendingBuffs.clear();
  }

  override copy(newOwner: Pet): PegasusAbility {
    return new PegasusAbility(this.runtime, newOwner, this.logService);
  }
}
