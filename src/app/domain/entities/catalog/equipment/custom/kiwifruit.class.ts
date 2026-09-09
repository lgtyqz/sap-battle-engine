import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class Kiwifruit extends Equipment {
  name = 'Kiwifruit';
  equipmentClass: EquipmentClass = 'shop';
  tier = 2;
}
