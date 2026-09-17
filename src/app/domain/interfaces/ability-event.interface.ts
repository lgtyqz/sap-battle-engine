import {
  AbilityCustomParams,
  AbilityTrigger,
  AbilityType,
} from 'app/domain/entities/ability.class';
import { Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';

export type AbilityEventType = AbilityTrigger | 'CounterEvent';

export type AbilityEventCallback = {
  bivarianceHack(...args: unknown[]): void | boolean;
}['bivarianceHack'];

export interface AbilityEvent {
  priority: number;
  callback?: AbilityEventCallback;
  player?: Player;
  level?: number;
  pet?: Pet;
  triggerPet?: Pet; // Pet that triggered this ability (e.g., the pet that fainted)
  /** Queue-order category. Counter abilities always use CounterEvent here. */
  abilityType?: AbilityEventType;
  /** Ability trigger to execute when it differs from the queue category. */
  executionTrigger?: AbilityTrigger;
  abilitySourceType?: AbilityType; // Pet abilities resolve before equipment abilities for equal-priority events
  tieBreaker?: number; // Random number for tie breaking
  customParams?: AbilityCustomParams; // Custom parameters to pass through context
}
