import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Beaver } from '../../turtle/tier-1/beaver.class';
import { Duck } from '../../turtle/tier-1/duck.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Platypus extends Pet {
  name = 'Platypus';
  tier = 4;
  pack: Pack = 'Star';
  attack = 2;
  health = 2;

  initAbilities(): void {
    this.addAbility(
      new PlatypusAbility(this.runtime, this, this.logService, this.abilityService),
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

export class PlatypusAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'PlatypusAbility',
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

    let attackPower = 3 * this.level;
    let healthPower = 2 * this.level;

    let duck = new Duck(this.runtime,
      this.logService,
      this.abilityService,
      owner.parent,
      healthPower,
      attackPower,
      0,
      this.minExpForLevel,
    );
    let beaver = new Beaver(this.runtime,
      this.logService,
      this.abilityService,
      owner.parent,
      healthPower,
      attackPower,
      0,
      this.minExpForLevel,
    );

    let duckSummonResult = owner.parent.summonPet(
      duck,
      owner.savedPosition,
      false,
      owner,
    );
    if (duckSummonResult.success) {
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} spawned ${attackPower}/${healthPower} Duck level ${this.level}`,
        type: 'ability',
        player: owner.parent,
        tiger: tiger,
        pteranodon: pteranodon,
        randomEvent: duckSummonResult.randomEvent,
      });
    }

    let beaverSummonResult = owner.parent.summonPet(
      beaver,
      owner.savedPosition,
      false,
      owner,
    );
    if (beaverSummonResult.success) {
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} spawned ${attackPower}/${healthPower} Beaver level ${this.level}`,
        type: 'ability',
        player: owner.parent,
        tiger: tiger,
        pteranodon: pteranodon,
        randomEvent: beaverSummonResult.randomEvent,
      });
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): PlatypusAbility {
    return new PlatypusAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

