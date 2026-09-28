import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class TandAndTand extends Pet {
  name = 'Tand & Tand';
  tier = 4;
  pack: Pack = 'Custom';
  hidden: boolean = true;
  attack = 1;
  health = 1;
  override initAbilities(): void {
    this.addAbility(new TandAndTandAbility(this.runtime, this, this.logService));
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

export class TandAndTandAbility extends Ability {
  constructor(runtime: EngineContext, owner: Pet, private logService: LogService) {
    super(runtime, {
      name: 'TandAndTandAbility',
      owner,
      triggers: ['ThisTransformed'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const toy = context.gameApi?.toyService?.createToy(
      'Thunder Hammer', owner.parent, this.level,
    ) as Player['toy'];
    if (toy) {
      owner.parent.setToy(toy);
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} summoned a level ${this.level} Thunder Hammer.`,
        type: 'ability',
        player: owner.parent,
        tiger: context.tiger,
        pteranodon: context.pteranodon,
      });
    }
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): TandAndTandAbility {
    return new TandAndTandAbility(this.runtime, newOwner, this.logService);
  }
}
