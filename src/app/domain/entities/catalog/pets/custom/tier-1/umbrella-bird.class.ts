import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { Dazed } from 'app/domain/entities/catalog/equipment/ailments/dazed.class';

export class UmbrellaBird extends Pet {
  name = 'Umbrella Bird';
  tier = 1;
  pack: Pack = 'Custom';
  attack = 3;
  health = 2;
  override initAbilities(): void {
    this.addAbility(new UmbrellaBirdAbility(this.runtime, this, this.logService));
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

export class UmbrellaBirdAbility extends Ability {
  constructor(runtime: EngineContext, owner: Pet, private logService: LogService) {
    super(runtime, {
      name: 'UmbrellaBirdAbility',
      owner,
      triggers: ['EndTurn'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
  }

  private executeAbility(context: AbilityContext): void {
    const targets = this.owner.parent.nearestPetsAhead(this.level, this.owner).pets;
    for (const target of targets) {
      target.givePetEquipment(new Dazed(this.runtime));
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${this.owner.name} made ${target.name} Dazed.`,
        type: 'ability',
        player: this.owner.parent,
        tiger: context.tiger,
        pteranodon: context.pteranodon,
      });
    }
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): UmbrellaBirdAbility {
    return new UmbrellaBirdAbility(this.runtime, newOwner, this.logService);
  }
}
