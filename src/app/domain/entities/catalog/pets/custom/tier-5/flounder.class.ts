import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { AdultFlounder } from 'app/domain/entities/catalog/pets/hidden/adult-flounder.class';

export class Flounder extends Pet {
  name = 'Flounder';
  tier = 5;
  pack: Pack = 'Custom';
  attack = 2;
  health = 4;
  initAbilities(): void {
    this.addAbility(new FlounderAbility(this.runtime, this, this.logService));
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

export class FlounderAbility extends Ability {
  private logService: LogService;
  private triggeredThisTurn = false;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Flounder Ability',
      owner: owner,
      triggers: ['Eat2', 'StartTurn'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;

    if (context.trigger === 'StartTurn') {
      this.triggeredThisTurn = false;
      this.triggerTigerExecution(context);
      return;
    }

    if (this.triggeredThisTurn) {
      this.triggerTigerExecution(context);
      return;
    }

    this.triggeredThisTurn = true;
    const adult = new AdultFlounder(this.runtime,
      this.logService,
      this.runtime.services.abilityService,
      owner.parent,
      owner.health,
      owner.attack,
      owner.mana,
      owner.exp,
      owner.equipment,
    );
    owner.parent.transformPet(owner, adult);
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} transformed into ${adult.name}.`,
      type: 'ability',
      player: owner.parent,
      tiger: context.tiger,
      pteranodon: context.pteranodon,
    });
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): FlounderAbility {
    return new FlounderAbility(this.runtime, newOwner, this.logService);
  }
}
