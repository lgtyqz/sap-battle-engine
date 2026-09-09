import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

import { PetFactoryService } from 'app/integrations/pet/pet-factory.service';
import { PetService } from 'app/integrations/pet/pet.service';

export class Tapir extends Pet {
  name = 'Tapir';
  tier = 6;
  pack: Pack = 'Custom';
  attack = 4;
  health = 3;
  initAbilities(): void {
    this.addAbility(new TapirAbility(this.runtime, this, this.logService));
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

export class TapirAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'TapirAbility',
      owner: owner,
      triggers: ['StartBattle'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const { tiger, pteranodon } = context;
    const backMostResp = owner.parent.getLastPet(undefined, owner);
    const source = backMostResp.pet;
    if (!source) {
      this.triggerTigerExecution(context);
      return;
    }

    const level = Math.min(3, Math.max(1, this.level));
    const size = level * 10;
    const expValue = level === 1 ? 0 : level === 2 ? 2 : 5;

    const petFactory = this.runtime.services.petFactoryService;
    const petService = this.runtime.services.petService;
    const copy = petFactory.createPet(source, petService, size, size, expValue);
    if (!copy) {
      this.triggerTigerExecution(context);
      return;
    }

    const spawnResult = owner.parent.summonPet(
      copy,
      owner.savedPosition,
      false,
      owner,
    );
    if (spawnResult.success) {
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} summoned a ${size}/${size} copy of ${source.name}.`,
        type: 'ability',
        player: owner.parent,
        tiger,
        pteranodon,
        randomEvent: spawnResult.randomEvent,
      });
    }

    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): TapirAbility {
    return new TapirAbility(this.runtime, newOwner, this.logService);
  }
}

