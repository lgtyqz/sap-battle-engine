import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { resolveTriggerTargetAlive } from 'app/domain/entities/ability-resolution';

export class Chimpanzee extends Pet {
  name = 'Chimpanzee';
  tier = 6;
  pack: Pack = 'Custom';
  attack = 3;
  health = 5;
  initAbilities(): void {
    this.addAbility(new ChimpanzeeAbility(this.runtime, this, this.logService));
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

export class ChimpanzeeAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Chimpanzee Ability',
      owner: owner,
      triggers: ['CornEatenByFriend'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      precondition: (context: AbilityContext) => {
        const owner = this.owner;
        const targetResp = resolveTriggerTargetAlive(owner, context.triggerPet);
        const target = targetResp.pet;
        return !!target && target.alive;
      },
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const targetResp = resolveTriggerTargetAlive(owner, context.triggerPet);
    const target = targetResp.pet;
    if (!target) {
      this.triggerTigerExecution(context);
      return;
    }

    const buff = this.level;
    target.increaseAttack(buff);
    target.increaseHealth(buff);

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gave ${target.name} +${buff}/+${buff} after eating Corncob.`,
      type: 'ability',
      player: owner.parent,
      tiger: context.tiger,
      pteranodon: context.pteranodon,
      randomEvent: targetResp.random,
    });

    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): ChimpanzeeAbility {
    return new ChimpanzeeAbility(this.runtime, newOwner, this.logService);
  }
}

