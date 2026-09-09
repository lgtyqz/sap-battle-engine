import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability } from 'app/domain/entities/ability.class';

export class Albatross extends Pet {
  name = 'Albatross';
  tier = 6;
  pack: Pack = 'Custom';
  attack = 5;
  health = 4;
  initAbilities(): void {
    this.addAbility(new AlbatrossAbility(this.runtime, this, this.logService));
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

export class AlbatrossAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Albatross Ability',
      owner: owner,
      triggers: [],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: () => { },
    });
    this.logService = logService;
  }

  copy(newOwner: Pet): AlbatrossAbility {
    return new AlbatrossAbility(this.runtime, newOwner, this.logService);
  }
}

