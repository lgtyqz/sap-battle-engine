import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class Churros extends Equipment {
  name = 'Churros';
  equipmentClass: EquipmentClass = 'shop';
}
