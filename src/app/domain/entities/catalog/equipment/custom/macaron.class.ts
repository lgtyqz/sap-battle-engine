import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class Macaron extends Equipment {
  name = 'Macaron';
  equipmentClass: EquipmentClass = 'shop';
}
