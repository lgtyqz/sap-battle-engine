import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class Blueberry extends Equipment {
  name = 'Blueberry';
  equipmentClass: EquipmentClass = 'target';
  constructor(runtime: EngineContext) {
    super(runtime);
  }
}
