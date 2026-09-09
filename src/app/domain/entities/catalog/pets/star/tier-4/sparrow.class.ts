import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Sparrow extends Pet {
  name = 'Sparrow';
  tier = 4;
  pack: Pack = 'Star';
  attack = 3;
  health = 2;
  initAbilities(): void {
    this.addAbility(new SparrowAbility(this.runtime, this, this.logService, this.abilityService));
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

// Friendly Strawberries block 5/10/15 damage twice, or ailments once.

export class SparrowAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'SparrowAbility',
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
    // Passive handled in pet combat calculations (Strawberry + Sparrow scaling).
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): SparrowAbility {
    return new SparrowAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

