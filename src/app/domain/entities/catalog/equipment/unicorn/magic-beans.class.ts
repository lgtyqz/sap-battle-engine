import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class MagicBeans extends Equipment {
  name = 'Magic Beans';
  equipmentClass = 'shop' as EquipmentClass;
  constructor(runtime: EngineContext) {
    super(runtime);
  }
}
