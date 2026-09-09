import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Jellyfish extends Pet {
  name = 'Jellyfish';
  tier = 2;
  pack: Pack = 'Star';
  attack = 3;
  health = 3;

  initAbilities(): void {
    this.addAbility(new JellyfishAbility(this.runtime, this, this.logService));
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

export class JellyfishAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'JellyfishAbility',
      owner: owner,
      triggers: ['FriendLeveledUp'],
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

    let power = this.level;
    target.increaseAttack(power);
    target.increaseHealth(power);
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gave ${target.name} attack by ${power} and health by ${power}`,
      type: 'ability',
      player: owner.parent,
      sourcePet: owner,
      targetPet: target,
      tiger: tiger,
      randomEvent: targetResp.random,
    });

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): JellyfishAbility {
    return new JellyfishAbility(this.runtime, newOwner, this.logService);
  }
}

