import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class Blackberry extends Equipment {
  name = 'Blackberry';
  tier = 3;
  equipmentClass: EquipmentClass = 'shop';
  constructor(runtime: EngineContext) {
    super(runtime);
  }
  //coded in givePetEquipment
}
