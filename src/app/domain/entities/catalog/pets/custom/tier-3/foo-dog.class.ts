import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class FooDog extends Pet {
  name = 'Foo Dog';
  tier = 3;
  pack: Pack = 'Custom';
  attack = 3;
  health = 5;

  override initAbilities(): void {
    this.addAbility(new FooDogAbility(this.runtime, this, this.logService));
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

export class FooDogAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Foo Dog Ability',
      owner: owner,
      triggers: ['ThisBought'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const hpBuff = 2 * this.level;

    // Shop logic - log the effect
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} was bought and gave future shop pets from the next tier +${hpBuff} health.`,
      type: 'ability',
      player: owner.parent,
    });

    this.triggerTigerExecution(context);
  }

  override copy(newOwner: Pet): FooDogAbility {
    return new FooDogAbility(this.runtime, newOwner, this.logService);
  }
}

