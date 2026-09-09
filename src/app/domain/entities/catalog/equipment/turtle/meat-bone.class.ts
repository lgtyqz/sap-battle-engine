import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment, EquipmentClass } from '../../../equipment.class';

export class MeatBone extends Equipment {
  name = 'Meat Bone';
  equipmentClass = 'attack' as EquipmentClass;
  power = 3;
  originalPower = 3;
}
