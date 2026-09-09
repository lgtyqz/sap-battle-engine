import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class SardinianCurrant extends Equipment {
  name = 'Sardinian Currant';
  equipmentClass: EquipmentClass = 'shop';
}
