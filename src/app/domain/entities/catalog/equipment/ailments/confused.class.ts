import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';
import { Pet } from '../../../pet.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { PetService } from 'app/integrations/pet/pet.service';

import { LogService } from 'app/integrations/log.service';

import { formatEquipmentScopedRandomLabel } from 'app/runtime/random-decision-label';

export class Confused extends Equipment {
  name = 'Confused';
  equipmentClass: EquipmentClass = 'ailment-other';
  callback = (pet: Pet) => {
    pet.addAbility(new ConfusedAbility(this.runtime, pet));
  };
}

export class ConfusedAbility extends Ability {
  private petService: PetService;
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet) {
    super(runtime, {
      name: 'ConfusedAbility',
      owner: owner,
      triggers: ['BeforeThisAttacks'],
      abilityType: 'Equipment',
      native: true,
      maxUses: 1,
      abilitylevel: 1,
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.petService = runtime.services.petService;
    this.logService = runtime.services.logService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const tier = Math.max(1, (owner.tier ?? 1) - 1);
    const pool = this.petService.allPets.get(tier) ?? [];

    if (pool.length === 0) {
      owner.removePerk();
      return;
    }

    const choice = this.runtime.random.chooseRandomOption(
      () => ({
        key: 'equipment.confused-transform',
        label: formatEquipmentScopedRandomLabel(owner, 'Confused', 'transform'),
        options: pool.map((name) => ({ id: name, label: name })),
      }),
      () => this.runtime.random.getRandomInt(0, pool.length - 1), (pool).length
    );
    const petName = pool[choice.index];
    owner.removePerk();

    const transformedPet = this.petService.createPet(
      {
        name: petName,
        attack: owner.attack,
        health: owner.health,
        exp: owner.exp ?? 0,
        equipment: null,
        mana: owner.mana,
      },
      owner.parent,
    );

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} transformed into a ${petName}. (Confused)`,
      type: 'equipment',
      player: owner.parent,
      randomEvent: choice.randomEvent,
    });

    owner.parent.transformPet(owner, transformedPet);
  }
}

