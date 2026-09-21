import type { Pet } from '../pet.class';
import type { Toy } from '../toy.class';
import type { Equipment } from '../equipment.class';

export interface PetLike {
  name: string;
  equipment?: { name?: string; equipmentClass?: string; uses?: number } | null;
}

export interface PlayerLike {
  readonly runtime: import('app/runtime/engine-context').EngineContext;
  pet0?: Pet;
  pet1?: Pet;
  pet2?: Pet;
  pet3?: Pet;
  pet4?: Pet;
  petArray: Pet[];
  opponent: PlayerLike;
  furthestUpPet: Pet | null;
  toy: Toy | null;
  hardToy?: Toy | null;
  brokenToy: Toy | null;
  brokenHardToy?: Toy | null;
  trumpets: number;
  spawnedGoldenRetiever: boolean;
  goldenRetrieverEquipment: Equipment | null;
  getPet(index: number): Pet | undefined;
  setPet(index: number, pet: Pet, init?: boolean): void;
}
