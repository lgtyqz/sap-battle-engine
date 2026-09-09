import type { EngineContext } from 'app/runtime/engine-context';
import { Pet } from 'app/domain/entities/pet.class';

export type PetConstructor = new (runtime: EngineContext, ...args: unknown[]) => Pet;
export type PetRegistryMap = Record<string, unknown>;
