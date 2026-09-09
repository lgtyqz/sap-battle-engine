import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { Daycrawler } from 'app/domain/entities/catalog/pets/hidden/daycrawler.class';

export class Nightcrawler extends Pet {
  name = 'Nightcrawler';
  tier = 2;
  pack: Pack = 'Custom';
  attack = 1;
  health = 1;
  initAbilities(): void {
    this.addAbility(
      new NightcrawlerAbility(this.runtime, this, this.logService, this.abilityService),
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

export class NightcrawlerAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'NightcrawlerAbility',
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

    let isPlayer = owner.parent == gameApi.player;
    let summonedAmount = isPlayer
      ? gameApi.playerSummonedAmount
      : gameApi.opponentSummonedAmount;

    if (summonedAmount == 0) {
      return;
    }

    let health = Math.min(50, this.level * summonedAmount);
    let attack = 6;

    let dayCrawler = new Daycrawler(this.runtime,
      this.logService,
      this.abilityService,
      owner.parent,
      health,
      attack,
      0,
      0,
    );

    let summonResult = owner.parent.summonPet(
      dayCrawler,
      owner.savedPosition,
      false,
      owner,
    );
    if (summonResult.success) {
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} spawned Daycrawler (${attack}/${health})`,
        type: 'ability',
        player: owner.parent,
        tiger: tiger,
        pteranodon: pteranodon,
        randomEvent: summonResult.randomEvent,
      });
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): NightcrawlerAbility {
    return new NightcrawlerAbility(this.runtime,
      newOwner,
      this.logService,
      this.abilityService,
    );
  }
}

