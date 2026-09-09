import type { EngineContext } from 'app/runtime/engine-context';
import { Pet } from '../../../../pet.class';
import { LogService } from 'app/integrations/log.service';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { ToyService } from 'app/integrations/toy/toy.service';

export class FlyingSquirrel extends Pet {
  constructor(runtime: EngineContext,
    logService: LogService,
    abilityService: AbilityService,
    parent: Player,
  ) {
    super(runtime, logService, abilityService, parent);
    this.name = 'Flying Squirrel';
    this.tier = 3;
    this.pack = 'Custom';
    this.attack = 3;
    this.health = 3;
  }

  initAbilities(): void {
    this.abilityList = [new FlyingSquirrelAbility(this.runtime, this, this.logService)];
    super.initAbilities();
  }
}

export class FlyingSquirrelAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'FlyingSquirrelAbility',
      owner: owner,
      triggers: ['FriendlyToyBroke'],
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

    let power = this.level * 2;
    let targetResp = owner.parent.getThis(owner);
    let target = targetResp.pet;
    if (target == null) {
      return;
    }
    target.increaseAttack(power);
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gave ${target.name} +${power} attack`,
      type: 'ability',
      player: owner.parent,
      tiger: tiger,
      randomEvent: targetResp.random,
    });

    if (owner.parent.brokenToy == null) {
      return;
    }
    const newToy = this.runtime.services.toyService
      .createToy(owner.parent.brokenToy.name, owner.parent);
    newToy.level = Math.min(this.level, owner.parent.brokenToy.level);

    owner.parent.setToy(newToy);
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${newToy.name} respawned (Level ${newToy.level})!`,
      type: 'ability',
      player: owner.parent,
      tiger: tiger,
    });

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): FlyingSquirrelAbility {
    return new FlyingSquirrelAbility(this.runtime, newOwner, this.logService);
  }
}

