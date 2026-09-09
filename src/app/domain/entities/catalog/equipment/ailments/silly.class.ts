import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class Silly extends Equipment {
  name = 'Silly';
  equipmentClass: EquipmentClass = 'ailment-other';
}
