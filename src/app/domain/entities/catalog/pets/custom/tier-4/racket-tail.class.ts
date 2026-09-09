import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { EquipmentService } from 'app/integrations/equipment/equipment.service';

export class RacketTail extends Pet {
  name = 'Racket Tail';
  tier = 4;
  pack: Pack = 'Custom';
  attack = 2;
  health = 5;

  override initAbilities(): void {
    this.addAbility(new RacketTailAbility(this.runtime, this, this.logService));
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

export class RacketTailAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Racket Tail Ability',
      owner: owner,
      triggers: ['BeforeFriendAttacks'],
      abilityType: 'Pet',
      maxUses: owner.level,
      native: true,
      abilitylevel: owner.level,
      precondition: (context: AbilityContext) => {
        const { triggerPet } = context;
        return (
          !!triggerPet &&
          triggerPet.parent === this.owner.parent &&
          triggerPet.alive
        );
      },
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const { triggerPet, tiger, pteranodon } = context;
    const owner = this.owner;

    if (!triggerPet) {
      return;
    }

    const equipmentService =
      this.runtime.services.equipmentService;
    const strawberry = equipmentService
      .getInstanceOfAllEquipment()
      .get('Strawberry');
    if (strawberry) {
      triggerPet.givePetEquipment(strawberry);
    }
    const attackBonus = 5;
    triggerPet.increaseAttack(attackBonus);

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gave ${triggerPet.name} Strawberry and +${attackBonus} attack before attacking.`,
      type: 'ability',
      player: owner.parent,
      tiger: tiger,
      pteranodon: pteranodon,
    });

    this.triggerTigerExecution(context);
  }

  override copy(newOwner: Pet): RacketTailAbility {
    return new RacketTailAbility(this.runtime, newOwner, this.logService);
  }
}

