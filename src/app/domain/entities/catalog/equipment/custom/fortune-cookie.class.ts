import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class FortuneCookie extends Equipment {
  name = 'Fortune Cookie';
  equipmentClass: EquipmentClass = 'attack';
  constructor(runtime: EngineContext) {
    super(runtime);
  }
}
