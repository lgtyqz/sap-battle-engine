import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { Corncob } from 'app/domain/entities/catalog/equipment/custom/corncob.class';

export class FarmerMouse extends Pet {
  name = 'Farmer Mouse';
  tier = 1;
  pack: Pack = 'Custom';
  attack = 2;
  health = 3;
  initAbilities(): void {
    this.addAbility(new FarmerMouseAbility(this.runtime, this, this.logService));
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

export class FarmerMouseAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'FarmerMouseAbility',
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
  }

  private executeAbility(context: AbilityContext): void {
    const { tiger, pteranodon } = context;
    const owner = this.owner;

    const targetsResp = owner.parent.nearestPetsBehind(this.level, owner);
    const targets = targetsResp.pets;
    if (targets.length === 0) {
      return;
    }

    for (const target of targets) {
      target.givePetEquipment(new Corncob(this.runtime));
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} fed ${target.name} Corncob.`,
        type: 'ability',
        player: owner.parent,
        tiger: tiger,
        pteranodon: pteranodon,
      });
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): FarmerMouseAbility {
    return new FarmerMouseAbility(this.runtime, newOwner, this.logService);
  }
}

