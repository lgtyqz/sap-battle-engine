import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class CakeSlice extends Equipment {
  name = 'Cake Slice';
  equipmentClass: EquipmentClass = 'shop';
  tier = 1;
}
