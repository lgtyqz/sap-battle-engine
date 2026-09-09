import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Seal extends Pet {
  name = 'Seal';
  tier = 5;
  pack: Pack = 'Turtle';
  attack = 3;
  health = 8;
  initAbilities(): void {
    this.addAbility(new SealAbility(this.runtime, this, this.logService));
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

export class SealAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'SealAbility',
      owner: owner,
      triggers: ['FoodEatenByThis'],
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

    if (triggerPet != owner) {
      return;
    }
    let power = this.level;
    let targetsResp = owner.parent.getRandomPets(
      3,
      [owner],
      true,
      false,
      owner,
    );
    for (let target of targetsResp.pets) {
      if (target != null) {
        target.increaseAttack(power);
        if (this.logService.isEnabled()) this.logService.createLog({
          message: `${owner.name} gave ${target.name} ${power} attack.`,
          type: 'ability',
          player: owner.parent,
          tiger: tiger,
          randomEvent: targetsResp.random,
        });
      }
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): SealAbility {
    return new SealAbility(this.runtime, newOwner, this.logService);
  }
}

