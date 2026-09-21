import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { cloneEquipment } from 'app/runtime/equipment-clone';

export class HermitCrab extends Pet {
  name = 'Hermit Crab';
  tier = 1;
  pack: Pack = 'Custom';
  attack = 1;
  health = 4;
  override initAbilities(): void {
    this.addAbility(new HermitCrabAbility(this.runtime, this, this.logService));
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

export class HermitCrabAbility extends Ability {
  constructor(runtime: EngineContext, owner: Pet, private logService: LogService) {
    super(runtime, {
      name: 'Hermit Crab Ability',
      owner,
      triggers: ['StartBattle'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const equipment = owner.equipment;
    const isAilment = equipment?.equipmentClass?.startsWith('ailment');
    const tierLimit = this.level * 2;

    if (equipment && !isAilment && (equipment.tier ?? 0) <= tierLimit) {
      owner.parent.goldenRetrieverEquipment = cloneEquipment(equipment);
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} copied ${equipment.name} to the next Golden Retriever.`,
        type: 'ability',
        player: owner.parent,
        tiger: context.tiger,
        pteranodon: context.pteranodon,
      });
    }

    this.triggerTigerExecution(context);
  }

  override copy(newOwner: Pet): HermitCrabAbility {
    return new HermitCrabAbility(this.runtime, newOwner, this.logService);
  }
}
