import { it, expect } from 'vitest';
import { PET_REGISTRY } from '../src/app/integrations/pet/pet-registry';
import * as equipment from '../src/app/integrations/equipment/equipment-registry';
import * as toys from '../src/app/integrations/toy/toy-registry';
import inventory from './fixtures/content-inventory.json';
import fixtures from './fixtures/parity.json';
it('covers every registered pet, equipment, ailment and toy in the parity inventory', () => {
  expect(Object.keys(PET_REGISTRY).sort()).toEqual(inventory.pets);
  const keys = (r: object, pattern: RegExp) => [...new Set(Object.entries(r).filter(([k, v]) => pattern.test(k) && v && typeof v === 'object').flatMap(([, v]) => Object.keys(v)))].sort();
  expect(keys(equipment, /EQUIPMENT|AILMENT/)).toEqual(inventory.equipment);
  expect(keys(toys, /TOY/)).toEqual(inventory.toys);
  const names = new Set(fixtures.map(f => f.name));
  for (const name of inventory.pets) for (const exp of [0, 2, 5]) expect(names.has(`pet:${name}:${exp}`)).toBe(true);
  for (const name of inventory.equipment) expect(names.has(`equipment:${name}`)).toBe(true);
  for (const name of inventory.toys) for (const level of [1, 2, 3]) expect(names.has(`toy:${name}:${level}`)).toBe(true);
});
