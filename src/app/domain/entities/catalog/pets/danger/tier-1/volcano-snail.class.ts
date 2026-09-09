import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { Toasty } from 'app/domain/entities/catalog/equipment/ailments/toasty.class';

export class VolcanoSnail extends Pet {
  name = 'Volcano Snail';
  tier = 1;
  pack: Pack = 'Danger';
  attack = 1;
  health = 4;
  initAbilities(): void {
    this.addAbility(new VolcanoSnailAbility(this.runtime, this, this.logService));
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

export class VolcanoSnailAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'VolcanoSnailAbility',
      owner: owner,
      triggers: ['Faint'],
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
    const { gameApi, triggerPet, tiger, pteranodon } = context;
    const owner = this.owner;

    let petsWithPerk = owner.parent.getPetsWithEquipmentWithSillyFallback(
      'perk',
      owner,
    );
    let petsWithToasty = owner.parent.getPetsWithEquipmentWithSillyFallback(
      'Toasty',
      owner,
    );
    let excludePets = [...petsWithPerk, ...petsWithToasty];
    let targetResp = owner.parent.getRandomEnemyPetsWithSillyFallback(
      this.level,
      excludePets,
      null,
      null,
      owner,
    );

    if (targetResp.pets.length === 0) {
      return;
    }

    for (let target of targetResp.pets) {
      let toasty = new Toasty(this.runtime);
      target.givePetEquipment(toasty);

      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} made ${target.name} Toasty`,
        type: 'ability',
        player: owner.parent,
        sourcePet: owner,
        targetPet: target,
        tiger: tiger,
        randomEvent: targetResp.random,
      });
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): VolcanoSnailAbility {
    return new VolcanoSnailAbility(this.runtime, newOwner, this.logService);
  }
}

