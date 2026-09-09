import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class Dazed extends Equipment {
  name = 'Dazed';
  equipmentClass: EquipmentClass = 'ailment-other';
}
