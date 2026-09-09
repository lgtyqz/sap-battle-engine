import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class Pineapple extends Equipment {
  name = 'Pineapple';
  equipmentClass: EquipmentClass = 'attack-snipe';
  power = 2;
  uses = 3;
  originalUses = 3;
  constructor(runtime: EngineContext) {
    super(runtime);
  }
}
