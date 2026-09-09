import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class Sleepy extends Equipment {
  name = 'Sleepy';
  equipmentClass: EquipmentClass = 'ailment-other';
}
