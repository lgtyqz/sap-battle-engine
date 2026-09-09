import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Sleipnir extends Pet {
  name = 'Sleipnir';
  tier = 6;
  pack: Pack = 'Unicorn';
  attack = 8;
  health = 5;
  initAbilities(): void {
    this.addAbility(new SleipnirAbility(this.runtime, this, this.logService));
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

export class SleipnirAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'SleipnirAbility',
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

    let manaAmt = Math.floor(owner.attack / 2);
    let targetsResp = owner.parent.getFurthestUpPets(
      this.level,
      [owner],
      owner,
    );
    let targets = targetsResp.pets;
    if (targets.length == 0) {
      return;
    }
    for (let target of targets) {
      if (target != null) {
        if (this.logService.isEnabled()) this.logService.createLog({
          message: `${owner.name} gave ${target.name} ${manaAmt} mana.`,
          type: 'ability',
          player: owner.parent,
          tiger: tiger,
          randomEvent: targetsResp.random,
        });

        target.increaseMana(manaAmt);
      }
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): SleipnirAbility {
    return new SleipnirAbility(this.runtime, newOwner, this.logService);
  }
}

