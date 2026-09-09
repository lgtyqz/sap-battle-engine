import { RandomSource } from './random-decision-state';
import type { LogService } from '../integrations/log.service';
import type { GameService } from './state/game.service';
import type { AbilityService } from '../integrations/ability/ability.service';
import type { AbilityQueueService } from '../integrations/ability/ability-queue.service';
import type { PetService } from '../integrations/pet/pet.service';
import type { EquipmentService } from '../integrations/equipment/equipment.service';
import type { ToyService } from '../integrations/toy/toy.service';
import type { PetFactoryService } from '../integrations/pet/pet-factory.service';
import type { EquipmentFactoryService } from '../integrations/equipment/equipment-factory.service';
import type { ToyFactoryService } from '../integrations/toy/toy-factory.service';
export interface EngineServices {
  logService: LogService; gameService: GameService; abilityService: AbilityService;
  abilityQueueService: AbilityQueueService; petService: PetService; equipmentService: EquipmentService;
  toyService: ToyService; petFactoryService: PetFactoryService;
  equipmentFactoryService: EquipmentFactoryService; toyFactoryService: ToyFactoryService;
}
/** Constructed once per engine; never stored globally or resolved through an injector. */
export class EngineContext {
  readonly random: RandomSource;
  readonly services = {} as EngineServices;
  constructor(entropy?: () => number) { this.random = new RandomSource(entropy); }
}
