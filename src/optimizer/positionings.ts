import petData from '../assets/data/pets.json';
import perkData from '../assets/data/perks.json';
import type { PetConfig } from '../app/domain/interfaces/simulation-config.interface';
import type { Lineup, PetPositioningHint, Positioning } from './types';
const pets = new Map(petData.map(pet => [pet.Name, pet]));
const perks = new Map(perkData.map(perk => [perk.Name, perk.Ability]));

/** Ordering hint only. Battle outcomes are always calculated by the engine. */
export function getPetPositioningHint(pet: PetConfig): PetPositioningHint {
  let attack = pet.attack ?? 0;
  const health = pet.health ?? 0;
  const level = (pet.exp ?? 0) >= 5 ? 3 : (pet.exp ?? 0) >= 2 ? 2 : 1;
  const ability = pets.get(pet.name)?.Abilities.find(a => a.Level === level)?.About ?? '';
  const equipment = typeof pet.equipment === 'string' ? pet.equipment : pet.equipment?.name;
  const perk = pet.equipmentUses === 0 ? '' : perks.get(equipment) ?? '';
  if (pet.name === 'Monty') attack *= level + 1;
  if (/Knock out any pet attacked and hurt/i.test(perk)) attack = Number.POSITIVE_INFINITY;
  else {
    const additive = /attack (?:with|for) \+(\d+) damage/i.exec(perk);
    if (additive) attack += Number(additive[1]);
    if (/attack for double damage/i.test(perk)) attack *= 2;
    if (/50% chance to deal double damage/i.test(perk)) attack *= 1.5;
    if (/attack (?:with half|for 50%) damage/i.test(perk)) attack *= 0.5;
    if (/attack and ability deal (\d+) less damage/i.test(perk)) attack -= Number(/deal (\d+)/i.exec(perk)?.[1] ?? 0);
    const minimum = /attack with at least (\d+) attack/i.exec(perk);
    if (minimum) attack = Math.max(attack, Number(minimum[1]));
    const removeHealth = /before attack: remove (\d+) health from target/i.exec(perk);
    const directSnipe = /before attack: deal (\d+) damage to target/i.exec(perk);
    if (removeHealth || directSnipe) attack += Number((removeHealth ?? directSnipe)[1]);
    if (equipment === 'Nachos') attack += Math.min(3, Math.max(0, health - 1));
    if (equipment === 'Oyster Mushroom') attack = Math.max(9, attack);
  }
  return {
    effectiveAttack: Math.max(0, attack), health,
    avoidFront: /friend(?:s)? ahead|nearest friend ahead|friend(?:s)? faint(?:s|ed)?/i.test(`${ability} ${perk}`),
  };
}

/** JSON inputs with different property insertion order are still identical pets. */
function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).filter(k => record[k] !== undefined).sort().map(k => `${JSON.stringify(k)}:${canonical(record[k])}`).join(',')}}`;
}
export function normalizeLineup(lineup: Lineup): Lineup {
  if (!Array.isArray(lineup) || lineup.length > 5) throw new Error('A lineup must contain at most five slots');
  return Array.from({ length: 5 }, (_, i) => lineup[i]?.name ? lineup[i] : null);
}
export function generatePositionings(lineup: Lineup): Positioning[] {
  const slots = normalizeLineup(lineup);
  const ranked = slots.map((pet, slot) => ({slot, pet, hint: pet ? getPetPositioningHint(pet) : null}));
  ranked.sort((a, b) => {
    if (!a.hint || !b.hint) return a.hint ? -1 : b.hint ? 1 : a.slot - b.slot;
    const attackOrder = a.hint.effectiveAttack === b.hint.effectiveAttack ? 0 : a.hint.effectiveAttack > b.hint.effectiveAttack ? -1 : 1;
    return attackOrder || a.hint.health - b.hint.health || a.slot - b.slot;
  });
  const front = ranked.findIndex(p => p.hint && !p.hint.avoidFront);
  if (front > 0) ranked.unshift(...ranked.splice(front, 1));
  const signatures = slots.map(canonical);
  const result: Positioning[] = [];
  function visit(order: number[], remaining: number[]) {
    if (!remaining.length) { result.push({id: result.length, order}); return; }
    const seen = new Set<string>();
    for (const slot of remaining) {
      if (seen.has(signatures[slot])) continue;
      seen.add(signatures[slot]);
      visit([...order, slot], remaining.filter(i => i !== slot));
    }
  }
  visit([], ranked.map(p => p.slot));
  return result;
}
