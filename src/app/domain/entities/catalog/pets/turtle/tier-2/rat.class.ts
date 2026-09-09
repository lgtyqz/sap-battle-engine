import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { DirtyRat } from '../../hidden/dirty-rat.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Rat extends Pet {
  name = 'Rat';
  tier = 2;
  pack: Pack = 'Turtle';
  health = 6;
  attack = 3;
  initAbilities(): void {
    this.addAbility(new RatAbility(this.runtime, this, this.logService, this.abilityService));
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

export class RatAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'RatAbility',
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

    let opponent = owner.parent.opponent;

    for (let i = 0; i < this.level; i++) {
      let dirtyRat = new DirtyRat(this.runtime,
        this.logService,
        this.abilityService,
        opponent,
        null,
        null,
        0,
        0,
      );

      let summonResult = opponent.summonPet(dirtyRat, 0, false, owner);

      if (summonResult.success) {
        if (this.logService.isEnabled()) this.logService.createLog({
          message: `${owner.name} Summoned Dirty Rat on Opponent`,
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

  copy(newOwner: Pet): RatAbility {
    return new RatAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

