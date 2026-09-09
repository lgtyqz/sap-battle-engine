import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class Grapes extends Equipment {
  name = 'Grapes';
  equipmentClass: EquipmentClass = 'shop';
}
