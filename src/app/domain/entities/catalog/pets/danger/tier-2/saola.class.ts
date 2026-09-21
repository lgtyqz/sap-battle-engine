import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Saola extends Pet {
  name = 'Saola';
  tier = 2;
  pack: Pack = 'Danger';
  attack = 2;
  health = 2;

  override initAbilities(): void {
    this.addAbility(
      new SaolaAbility(this.runtime, this, this.logService, this.abilityService),
    );
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

export class SaolaAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'SaolaAbility',
      owner: owner,
      triggers: ['EndTurn'],
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
    const owner = this.owner;
    const targetResp = owner.parent.getHighestAttackPets(
      this.level,
      [owner],
      owner,
    );

    for (const target of targetResp.pets) {
      target.increaseAttack(-1);
      target.increaseHealth(2);
    }

    if (targetResp.pets.length > 0 && this.logService.isEnabled()) {
      this.logService.createLog({
        message: `${owner.name} gave ${targetResp.pets.map((pet) => pet.name).join(', ')} -1 attack and +2 health.`,
        type: 'ability',
        player: owner.parent,
        tiger: context.tiger,
        pteranodon: context.pteranodon,
        randomEvent: targetResp.random,
      });
    }

    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): SaolaAbility {
    return new SaolaAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}
