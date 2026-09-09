import { describe, it, expect } from 'vitest';
import { generatePositionings, getPetPositioningHint } from '../src/optimizer/positionings';
const pet = (name: string, attack: number, health = 5, equipment?: string) => ({name, attack, health, equipment: equipment ? {name: equipment} : undefined});
describe('positioning enumeration and heuristics', () => {
  it('generates exactly 120 orders for five distinct pets without mutating the input', () => {
    const lineup = ['Ant','Fish','Pig','Cricket','Otter'].map((name, i) => pet(name, i + 1));
    const before = structuredClone(lineup), orders = generatePositionings(lineup);
    expect(orders).toHaveLength(120);expect(new Set(orders.map(p => p.order.join(','))).size).toBe(120);
    expect(orders[0].order).toEqual([4,3,2,1,0]);expect(lineup).toEqual(before);
    expect(orders.every(p => [...p.order].sort().join(',') === '0,1,2,3,4')).toBe(true);
  });
  it('deduplicates identical complete pet configs, but keeps meaningful differences and gaps', () => {
    expect(generatePositionings([])).toHaveLength(1);
    expect(generatePositionings([pet('Fish', 1)])).toHaveLength(5);
    expect(generatePositionings([pet('Fish', 1), pet('Fish', 1)])).toHaveLength(10);
    expect(generatePositionings([pet('Fish', 1), pet('Fish', 2)])).toHaveLength(20);
    expect(generatePositionings([pet('Fish', 1), {health:5,attack:1,name:'Fish'}])).toHaveLength(10);
  });
  it('uses lower health first when effective attacks tie', () => {
    const orders = generatePositionings([pet('Fish', 10, 20), pet('Pig', 10, 3)]);
    expect(orders[0].order.slice(0,2)).toEqual([1,0]);
  });
  it('ranks lethal, additive, multiplicative, minimum-attack and pre-attack perks', () => {
    expect(getPetPositioningHint(pet('Fish', 1, 5, 'Peanut')).effectiveAttack).toBe(Infinity);
    expect(getPetPositioningHint(pet('Fish', 1, 5, 'Steak')).effectiveAttack).toBe(21);
    expect(getPetPositioningHint(pet('Fish', 1, 5, 'Squash')).effectiveAttack).toBe(7);
    expect(getPetPositioningHint(pet('Fish', 1, 5, 'Meat Bone')).effectiveAttack).toBe(4);
    expect(getPetPositioningHint(pet('Fish', 10, 5, 'Salt')).effectiveAttack).toBe(20);
    expect(getPetPositioningHint(pet('Fish', 1, 5, 'Cheese')).effectiveAttack).toBe(15);
    expect(getPetPositioningHint(pet('Fish', 1, 5, 'Golden Egg')).effectiveAttack).toBe(7);
    expect(getPetPositioningHint(pet('Fish', 10, 5, 'Fortune Cookie')).effectiveAttack).toBe(15);
    expect(getPetPositioningHint(pet('Fish', 10, 5, 'Honeydew Melon')).effectiveAttack).toBe(15);
    expect(getPetPositioningHint({...pet('Fish', 1, 5, 'Steak'), equipmentUses:0}).effectiveAttack).toBe(1);
  });
  it('moves friend-ahead and friend-faint supports away from the initial front', () => {
    for (const name of ['Kangaroo', 'Ox', 'Shark', 'Tiger']) {
      expect(getPetPositioningHint(pet(name, 50)).avoidFront).toBe(true);
      expect(generatePositionings([pet(name, 50), pet('Fish', 3)])[0].order[0]).toBe(1);
    }
  });
  it('falls back to attack/health when every pet wants to avoid the front', () => {
    expect(generatePositionings([pet('Kangaroo', 10),pet('Ox', 20)])[0].order[0]).toBe(1);
  });
  it('rejects overfull teams', () => {
    expect(() => generatePositionings(Array(6).fill(null))).toThrow('five');
  });
});
