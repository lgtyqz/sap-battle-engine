import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class Croissant extends Equipment {
  name = 'Croissant';
  tier = 3;
  equipmentClass: EquipmentClass = 'shop';
  constructor(runtime: EngineContext) {
    super(runtime);
  }
}
