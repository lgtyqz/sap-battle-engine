import type { EngineContext } from 'app/runtime/engine-context';
import { LogService } from 'app/integrations/log.service';
import { Equipment, EquipmentClass } from '../../../equipment.class';
import { Pet } from '../../../pet.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

import { formatEquipmentScopedRandomLabel } from 'app/runtime/random-decision-label';

export class Tasty extends Equipment {
  name = 'Tasty';
  equipmentClass = 'faint' as EquipmentClass;
  callback = (pet: Pet) => {
    const equipment = pet.getEquippedEquipmentInstance(this);
    // Add Tasty ability using dedicated ability class
    pet.addAbility(new TastyAbility(this.runtime, pet, equipment, this.logService));
  };

  constructor(runtime: EngineContext, protected logService: LogService) {
    super(runtime);
  }
}

export class TastyAbility extends Ability {
  private equipment: Equipment;
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, equipment: Equipment, logService: LogService) {
    super(runtime, {
      name: 'TastyAbility',
      owner: owner,
      triggers: ['Faint'],
      abilityType: 'Equipment',
      native: true,
      abilitylevel: 1,
      abilityFunction: (context) => {
        this.executeAbility(context);
      },
    });
    this.equipment = equipment;
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;

    // Get random enemy
    let enemies = owner.parent.opponent.petArray.filter((enemy) => enemy.alive);
    if (enemies.length == 0) {
      return;
    }

    const choice = this.runtime.random.chooseRandomOption(
      () => ({
        key: 'equipment.tasty-target',
        label: formatEquipmentScopedRandomLabel(owner, 'Tasty', 'target'),
        options: enemies.map((enemy) => ({
          id: `${enemy.savedPosition + 1}:${enemy.name}`,
          label: `O${enemy.savedPosition + 1} ${enemy.name}`,
        })),
      }),
      () => this.runtime.random.getRandomInt(0, enemies.length - 1), (enemies).length
    );
    let randomEnemy = enemies[choice.index];

    // Give random enemy +2 attack and +2 health
    randomEnemy.increaseAttack(2 * this.equipment.multiplier);
    randomEnemy.increaseHealth(2 * this.equipment.multiplier);

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gave ${randomEnemy.name} +2 attack and +2 health (Tasty)${this.equipment.multiplierMessage}`,
      type: 'equipment',
      player: owner.parent,
      randomEvent: choice.randomEvent,
    });
  }
}

