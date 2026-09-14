import type { Pet } from './pet.class';

function triggerFoodEvent(target: Pet, foodType: string): void {
  target.runtime.services.abilityService.triggerFoodEvents(target, foodType);
}

export function feedCorncob(target: Pet, effectMultiplier = 1): void {
  const statGain = Math.max(1, Math.floor(effectMultiplier));
  if (target.attack <= target.health) {
    target.increaseAttack(statGain);
  } else {
    target.increaseHealth(statGain);
  }
  triggerFoodEvent(target, 'corn');
}

export function feedPear(target: Pet): void {
  target.increaseAttack(2);
  target.increaseHealth(2);
  triggerFoodEvent(target, 'pear');
}

export function feedBetterApple(target: Pet): void {
  target.increaseAttack(2);
  target.increaseHealth(2);
  triggerFoodEvent(target, 'better apple');
}
