import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';
import { Pet } from '../../../pet.class';
import { LogService } from 'app/integrations/log.service';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { EquipmentService } from 'app/integrations/equipment/equipment.service';

import { formatPetScopedRandomLabel } from 'app/runtime/random-decision-label';

const RADISH_PERK_POOLS: Record<number, string[]> = {
  1: ['Walnut', 'Honey', 'Egg', 'Strawberry'],
  2: [
    'Meat Bone',
    'Lime',
    'Caramel',
    'Bok Choy',
    'Fairy Dust',
    'Faint Bread',
    'Cod Roe',
  ],
  3: ['Garlic', 'Squash', 'Seaweed', 'Fig', 'Brussels Sprout'],
  4: [
    'Fortune Cookie',
    'Salt',
    'Baguette',
    'Cheese',
    'Banana',
    'Bread',
    'Ambrosia',
  ],
  5: ['Chili', 'Lemon', 'Pepper', 'Durian', 'Honeydew Melon', 'Easter Egg'],
  6: [
    'Steak',
    'Melon',
    'Pita Bread',
    'Tomato',
    'Yggdrasil Fruit',
    'Popcorn',
    'White Okra',
  ],
};

export class Radish extends Equipment {
  name = 'Radish';
  equipmentClass: EquipmentClass = 'beforeStartOfBattle';
  callback = (pet: Pet) => {
    const equipment = pet.getEquippedEquipmentInstance(this);
    pet.addAbility(new RadishAbility(this.runtime, pet, equipment, this.logService));
  };

  constructor(runtime: EngineContext, protected logService: LogService) {
    super(runtime);
  }
}

export class RadishAbility extends Ability {
  private equipment: Equipment;
  private logService: LogService;
  private equipmentService: EquipmentService;

  constructor(runtime: EngineContext, owner: Pet, equipment: Equipment, logService: LogService) {
    super(runtime, {
      name: 'RadishAbility',
      owner: owner,
      triggers: ['BeforeStartBattle'],
      abilityType: 'Equipment',
      native: true,
      abilitylevel: 1,
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.equipment = equipment;
    this.logService = logService;
    this.equipmentService = runtime.services.equipmentService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;

    const tier = Math.min(Math.max(owner.tier ?? owner.level ?? 1, 1), 6);
    const pool = RADISH_PERK_POOLS[tier];

    if (!pool || pool.length === 0) {
      return;
    }

    const equipmentMap = this.equipmentService.getInstanceOfAllEquipment();
    const availablePerks = pool.filter((name) => equipmentMap.has(name));

    if (availablePerks.length === 0) {
      return;
    }

    const perkChoice = this.runtime.random.chooseLegacyRandomOption(
      () => ({
        key: 'equipment.radish-perk',
        label: formatPetScopedRandomLabel(owner, 'Radish perk'),
        options: availablePerks.map((name) => ({ id: name, label: name })),
      }),
      () => this.runtime.random.getRandomInt(0, availablePerks.length - 1), (availablePerks).length
    );
    const perkName = availablePerks[perkChoice.index];
    const perk = equipmentMap.get(perkName);

    if (!perk) {
      return;
    }

    owner.givePetEquipment(perk);

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gained ${perk.name} before battle (Radish).`,
      type: 'equipment',
      player: owner.parent,
      randomEvent: perkChoice.randomEvent,
    });
  }
}

