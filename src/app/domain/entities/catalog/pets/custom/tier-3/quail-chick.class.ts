import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { Quail } from 'app/domain/entities/catalog/pets/hidden/quail.class';

export class QuailChick extends Pet {
  name = 'Quail Chick';
  tier = 3;
  pack: Pack = 'Custom';
  attack = 2;
  health = 4;

  override initAbilities(): void {
    this.addAbility(
      new QuailChickAbility(this.runtime, this, this.logService, this.abilityService),
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

export class QuailChickAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'Quail Chick Ability',
      owner: owner,
      triggers: ['FoodEatenByThis'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = logService;
    this.abilityService = abilityService;
  }

  private executeAbility(context: AbilityContext): void {
    const { tiger, pteranodon } = context;
    const owner = this.owner;
    const buffAmount = 2 * this.level * 2;
    const frontFriend = owner.petAhead;

    if (frontFriend && frontFriend.alive) {
      frontFriend.increaseAttack(buffAmount);
      frontFriend.increaseHealth(buffAmount);
    }

    const quail = new Quail(this.runtime,
      this.logService,
      this.abilityService,
      owner.parent,
      undefined,
      undefined,
      undefined,
      owner.exp,
    );

    owner.parent.transformPet(owner, quail);

    if (frontFriend && frontFriend.alive) {
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} transformed into ${quail.name} and gave ${frontFriend.name} +${buffAmount} attack and +${buffAmount} health.`,
        type: 'ability',
        player: owner.parent,
        tiger: tiger,
        pteranodon: pteranodon,
      });
    } else {
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} transformed into ${quail.name}.`,
        type: 'ability',
        player: owner.parent,
        tiger: tiger,
        pteranodon: pteranodon,
      });
    }

    this.triggerTigerExecution(context);
  }

  override copy(newOwner: Pet): QuailChickAbility {
    return new QuailChickAbility(this.runtime,
      newOwner,
      this.logService,
      this.abilityService,
    );
  }
}

