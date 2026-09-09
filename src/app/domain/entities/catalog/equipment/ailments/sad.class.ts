import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class Sad extends Equipment {
  name = 'Sad';
  equipmentClass: EquipmentClass = 'ailment-other';
}
