import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { feedBetterApple } from 'app/domain/entities/food-effects';

export class Pony extends Pet {
  name = 'Pony';
  tier = 3;
  pack: Pack = 'Custom';
  attack = 4;
  health = 4;

  override initAbilities(): void {
    this.addAbility(new PonyAbility(this.runtime, this, this.logService));
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

export class PonyAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Pony Ability',
      owner: owner,
      triggers: ['KnockOut'],
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
    const player = owner.parent;
    const apples = this.level;
    const target = owner.petBehind();

    if (!target) {
      this.triggerTigerExecution(context);
      return;
    }

    for (let i = 0; i < apples; i++) {
      feedBetterApple(target);
    }

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} fed ${target.name} ${apples} Better Apple${apples === 1 ? '' : 's'} after knocking out an enemy.`,
      type: 'ability',
      player: player,
      tiger: tiger,
      pteranodon: pteranodon,
    });

    this.triggerTigerExecution(context);
  }

  override copy(newOwner: Pet): PonyAbility {
    return new PonyAbility(this.runtime, newOwner, this.logService);
  }
}
