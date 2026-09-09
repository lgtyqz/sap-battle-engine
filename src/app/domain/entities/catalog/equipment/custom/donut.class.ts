import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class Donut extends Equipment {
  name = 'Donut';
  equipmentClass: EquipmentClass = 'target';
  constructor(runtime: EngineContext) {
    super(runtime);
  }
}
