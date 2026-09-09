import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Rootling extends Pet {
  name = 'Rootling';
  tier = 4;
  pack: Pack = 'Custom';
  attack = 1;
  health = 8;
  initAbilities(): void {
    this.addAbility(new RootlingAbility(this.runtime, this, this.logService));
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

export class RootlingAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Rootling Ability',
      owner: owner,
      triggers: ['EndTurn'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const { tiger, pteranodon } = context;
    const owner = this.owner;
    const amount = this.level;

    const candidates = owner.parent.petArray
      .filter(
        (friend) =>
          friend &&
          friend.alive &&
          friend !== owner &&
          friend.health < owner.health,
      )
      .sort((a, b) => a.health - b.health);

    const targets = candidates.slice(0, 2);

    for (const target of targets) {
      target.increaseAttack(amount);
      target.increaseHealth(amount);
    }

    if (targets.length > 0) {
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} gave ${targets.map((pet) => pet.name).join(', ')} +${amount}/+${amount}.`,
        type: 'ability',
        player: owner.parent,
        tiger: tiger,
        pteranodon: pteranodon,
      });
    }

    this.triggerTigerExecution(context);
  }

  override copy(newOwner: Pet): RootlingAbility {
    return new RootlingAbility(this.runtime, newOwner, this.logService);
  }
}

