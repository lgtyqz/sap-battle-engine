import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Head } from '../../hidden/head.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Hydra extends Pet {
  name = 'Hydra';
  tier = 6;
  pack: Pack = 'Unicorn';
  attack = 10;
  health = 6;
  initAbilities(): void {
    this.addAbility(
      new HydraAbility(this.runtime, this, this.logService, this.abilityService),
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

export class HydraAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'HydraAbility',
      owner: owner,
      triggers: ['PostRemovalFaint'],
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

    let amt = Math.floor(owner.attack / 10);
    for (let i = 0; i < amt; i++) {
      let power = this.level * 5;
      let head = new Head(this.runtime,
        this.logService,
        this.abilityService,
        owner.parent,
        power,
        power,
      );

      let summonResult = owner.parent.summonPet(
        head,
        owner.savedPosition,
        false,
        owner,
      );
      if (summonResult.success) {
        if (this.logService.isEnabled()) this.logService.createLog({
          message: `${owner.name} spawned Head (${head.attack}/${head.health}).`,
          type: 'ability',
          player: owner.parent,
          tiger: tiger,
          pteranodon: pteranodon,
          sourcePet: owner,
          randomEvent: summonResult.randomEvent,
        });
      }
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): HydraAbility {
    return new HydraAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

