import type { EngineContext } from 'app/runtime/engine-context';

import { GameAPI } from 'app/domain/interfaces/gameAPI.interface';
import { Toy } from '../../../toy.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { Pet } from '../../../pet.class';
import { LogService } from 'app/integrations/log.service';
import { AbilityService } from 'app/integrations/ability/ability.service';

export class MagicWand extends Toy {
  name = 'Magic Wand';
  tier = 1;
  startOfBattle(gameApi?: GameAPI, puma?: boolean) {
    let targets = this.parent.petArray.filter((pet) => pet.level < 3);
    let target: Pet | null = null;
    let random = false;
    if (targets.length == 0) {
      const targetResp = this.parent.getRandomPet([], true);
      target = targetResp.pet;
      random = targetResp.random;
    } else {
      targets = this.runtime.random.shuffleCopy(targets);
      target = targets[0];
      random = targets.length > 1;
    }

    if (target == null) {
      return;
    }

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${this.name} gave ${target.name} ${this.level} exp.`,
      type: 'ability',
      player: this.parent,
      targetPet: target,
      puma: puma,
      randomEvent: random,
    });

    target.increaseExp(this.level);
  }
}

export class MagicWandAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'MagicWandAbility',
      owner: owner,
      triggers: [],
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
    const { gameApi, triggerPet, tiger, pteranodon } = context;
    const owner = this.owner;

    // Mirror Magic Wand toy behavior
    let targets = owner.parent.petArray.filter((pet) => pet.level < 3);
    let target = null;
    let random = false;
    if (targets.length == 0) {
      let targetResp = owner.parent.getRandomPet([], true, false, false, owner);
      target = targetResp.pet;
      random = targetResp.random;
    } else {
      targets = this.runtime.random.shuffleCopy(targets);
      target = targets[0];
      random = targets.length > 1;
    }

    if (target == null) {
      this.triggerTigerExecution(context);
      return;
    }

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `Magic Wand Ability gave ${target.name} ${this.level} exp.`,
      type: 'ability',
      player: owner.parent,
      sourcePet: owner,
      targetPet: target,
      tiger: tiger,
      pteranodon: pteranodon,
      randomEvent: random,
    });

    target.increaseExp(this.level);

    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): MagicWandAbility {
    return new MagicWandAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

