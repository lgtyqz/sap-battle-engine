import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class Sausage extends Equipment {
  name = 'Sausage';
  equipmentClass: EquipmentClass = 'shop';
}
