import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class SageGrouse extends Pet {
  name = 'Sage-Grouse';
  tier = 3;
  pack: Pack = 'Custom';
  attack = 2;
  health = 4;

  override initAbilities(): void {
    this.addAbility(new SageGrouseAbility(this.runtime, this, this.logService));
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

export class SageGrouseAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Sage-Grouse Ability',
      owner: owner,
      triggers: ['ThisSold'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      maxUses: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const { tiger, pteranodon } = context;
    const owner = this.owner;
    const player = owner.parent;
    const strawberry = owner.equipment?.name;

    if (strawberry !== 'Strawberry') {
      this.triggerTigerExecution(context);
      return;
    }

    owner.removePerk(true);

    const gainGold = 3;
    player.gold = (player.gold ?? 0) + gainGold;

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} sold and removed Strawberry to gain +${gainGold} gold.`,
      type: 'ability',
      player: player,
      tiger: tiger,
      pteranodon: pteranodon,
    });

    this.triggerTigerExecution(context);
  }

  override copy(newOwner: Pet): SageGrouseAbility {
    return new SageGrouseAbility(this.runtime, newOwner, this.logService);
  }
}

