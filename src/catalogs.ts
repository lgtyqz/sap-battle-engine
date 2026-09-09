import pets from './assets/data/pets.json';
import toys from './assets/data/toys.json';
import food from './assets/data/food.json';
import perks from './assets/data/perks.json';
export const UPSTREAM_REVISION = 'd165eb0a02f8aa0b54d72ed1d5490a44390d07f4' as const;
type DeepReadonly<T> = T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;
function freeze<T>(value: T): DeepReadonly<T> {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value); for (const entry of Object.values(value)) freeze(entry);
  }
  return value as DeepReadonly<T>;
}
export const catalogs = freeze({ pets, toys, food, perks });
