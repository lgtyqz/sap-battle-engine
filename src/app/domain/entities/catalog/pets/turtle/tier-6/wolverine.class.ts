import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Wolverine extends Pet {
  name = 'Wolverine';
  tier = 6;
  pack: Pack = 'Turtle';
  attack = 5;
  health = 7;
  initAbilities(): void {
    this.addAbility(
      new WolverineAbility(this.runtime, this, this.logService, this.abilityService),
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

export class WolverineAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'WolverineAbility',
      owner: owner,
      triggers: ['FriendHurt4'],
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
    let targetResp = owner.parent.opponent.getAll(false, owner);
    let targets = targetResp.pets;
    if (targets.length == 0) {
      return;
    }
    for (let targetPet of targets) {
      let power = -3 * this.level;
      targetPet.increaseHealth(power);
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} reduced ${targetPet.name} health by ${Math.abs(power)}`,
        type: 'ability',
        player: owner.parent,
        tiger: tiger,
        randomEvent: targetResp.random,
      });
    }
    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): WolverineAbility {
    return new WolverineAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

