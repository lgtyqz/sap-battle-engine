import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Pug extends Pet {
  name = 'Pug';
  tier = 3;
  pack: Pack = 'Star';
  attack = 5;
  health = 2;

  initAbilities(): void {
    this.addAbility(new PugAbility(this.runtime, this, this.logService));
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

export class PugAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'PugAbility',
      owner: owner,
      triggers: ['StartBattle'],
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

    let targetsAheadResp = owner.parent.nearestPetsAhead(1, owner);
    if (targetsAheadResp.pets.length === 0) {
      return;
    }
    let target = targetsAheadResp.pets[0];
    let power = this.level;
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gave ${target.name} ${power} exp.`,
      type: 'ability',
      player: owner.parent,
      sourcePet: owner,
      targetPet: target,
      tiger: tiger,
      randomEvent: targetsAheadResp.random,
    });
    target.increaseExp(power);

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): PugAbility {
    return new PugAbility(this.runtime, newOwner, this.logService);
  }
}

