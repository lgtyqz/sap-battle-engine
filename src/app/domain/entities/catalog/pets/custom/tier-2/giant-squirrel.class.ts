import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { cloneEquipment } from 'app/runtime/equipment-clone';

export class GiantSquirrel extends Pet {
  name = 'Giant Squirrel';
  tier = 2;
  pack: Pack = 'Custom';
  attack = 2;
  health = 5;
  override initAbilities(): void {
    this.addAbility(new GiantSquirrelAbility(this.runtime, this, this.logService));
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

export class GiantSquirrelAbility extends Ability {
  constructor(runtime: EngineContext, owner: Pet, private logService: LogService) {
    super(runtime, {
      name: 'GiantSquirrelAbility',
      owner,
      triggers: ['ThisAttacked'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      maxUses: owner.level,
      precondition: () => !!owner.equipment && !owner.equipment.equipmentClass?.startsWith('ailment'),
      abilityFunction: (context) => this.executeAbility(context),
    });
  }

  override reset(): void {
    this.maxUses = this.level;
    super.reset();
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const perk = owner.equipment;
    if (!perk) return;

    for (const team of [owner.parent, owner.parent.opponent]) {
      const target = team.petArray.filter((pet) => pet.alive).at(-1);
      if (!target) continue;
      target.givePetEquipment(cloneEquipment(perk));
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} copied ${perk.name} to ${target.name}.`,
        type: 'ability',
        player: owner.parent,
        tiger: context.tiger,
        pteranodon: context.pteranodon,
      });
    }
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): GiantSquirrelAbility {
    return new GiantSquirrelAbility(this.runtime, newOwner, this.logService);
  }
}
