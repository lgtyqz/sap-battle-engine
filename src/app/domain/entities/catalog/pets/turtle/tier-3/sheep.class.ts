import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ram } from '../../hidden/ram.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Sheep extends Pet {
  name = 'Sheep';
  tier = 3;
  pack: Pack = 'Turtle';
  attack = 2;
  health = 2;
  initAbilities(): void {
    this.addAbility(
      new SheepAbility(this.runtime, this, this.logService, this.abilityService),
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

export class SheepAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'SheepAbility',
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
    const ramAttack = 2 * this.level;
    const ramHealth = 2 * this.level;

    for (let i = 0; i < 2; i++) {
      let ram = new Ram(this.runtime,
        this.logService,
        this.abilityService,
        owner.parent,
        ramHealth,
        ramAttack,
        0,
        this.minExpForLevel,
      );

      let summonResult = owner.parent.summonPet(
        ram,
        owner.savedPosition,
        false,
        owner,
      );

      if (summonResult.success) {
        if (this.logService.isEnabled()) this.logService.createLog({
          message: `${owner.name} spawned Ram (${ram.attack}/${ram.health}).`,
          type: 'ability',
          player: owner.parent,
          tiger: tiger,
          pteranodon: pteranodon,
          randomEvent: summonResult.randomEvent,
        });
      }
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): SheepAbility {
    return new SheepAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

