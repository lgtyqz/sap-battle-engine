import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class Carrot extends Equipment {
  name = 'Carrot';
  equipmentClass: EquipmentClass = 'shop';
}
