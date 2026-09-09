import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class Bloated extends Equipment {
  name = 'Bloated';
  equipmentClass: EquipmentClass = 'ailment-other';
}
