import pets from './assets/data/pets.json';
import toys from './assets/data/toys.json';
import food from './assets/data/food.json';
import perks from './assets/data/perks.json';

export interface CatalogAbility {
  readonly Level: number;
  readonly About: string;
  readonly FinePrint?: string;
}

export interface PetCatalogEntry {
  readonly Attack: number;
  readonly Health: number;
  readonly Abilities: readonly CatalogAbility[];
  readonly Id: string;
  readonly Name: string;
  readonly NameId: string;
  readonly Tier: number;
  readonly TierMax: number;
  readonly Packs: readonly string[];
  readonly PacksRequired: readonly string[];
  readonly Rollable?: boolean;
  readonly PerkNote?: string;
  readonly CustomArchetypes: readonly string[];
  readonly Random?: boolean;
}

export interface ToyCatalogEntry extends PetCatalogEntry {
  readonly Type: number;
  readonly ToyType: number;
}

export interface FoodCatalogEntry {
  readonly Ability: string;
  readonly Id: string;
  readonly Name: string;
  readonly NameId: string;
  readonly Tier: number;
  readonly Packs: readonly string[];
  readonly PacksRequired: readonly string[];
  readonly Rollable?: boolean;
  readonly CustomArchetypes: readonly string[];
  readonly PerkNote?: string;
  readonly PerkFinePrint?: string;
  readonly Random?: boolean;
}

export interface PerkCatalogEntry {
  readonly Ability: string;
  readonly Positive?: boolean;
  readonly Id: string;
  readonly Name: string;
  readonly NameId: string;
  readonly FinePrint?: string;
}

export interface Catalogs {
  readonly pets: readonly PetCatalogEntry[];
  readonly toys: readonly ToyCatalogEntry[];
  readonly food: readonly FoodCatalogEntry[];
  readonly perks: readonly PerkCatalogEntry[];
}

export const UPSTREAM_REVISION = 'd165eb0a02f8aa0b54d72ed1d5490a44390d07f4' as const;
type DeepReadonly<T> = T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;
function freeze<T>(value: T): DeepReadonly<T> {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value); for (const entry of Object.values(value)) freeze(entry);
  }
  return value as DeepReadonly<T>;
}
export const catalogs: Catalogs = freeze({ pets, toys, food, perks });
