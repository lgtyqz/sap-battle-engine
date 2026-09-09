import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class Kiwano extends Equipment {
  name = 'Kiwano';
  equipmentClass: EquipmentClass = 'shop';
}
