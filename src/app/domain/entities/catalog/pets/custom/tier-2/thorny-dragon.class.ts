import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

import { formatPetScopedRandomLabel } from 'app/runtime/random-decision-label';

export class ThornyDragon extends Pet {
  name = 'Thorny Dragon';
  tier = 2;
  pack: Pack = 'Custom';
  attack = 3;
  health = 3;
  hasRandomEvents = true;

  override initAbilities(): void {
    this.addAbility(new ThornyDragonAbility(this.runtime, this, this.logService));
    super.initAbilities();
  }

  constructor(runtime: EngineContext,
    protected logService: LogService,
    protected abilityService: AbilityService,
    parent: Player,
    health?: number,
    attack?: number,
    mana?: number,
    exp?: number,
    equipment?: Equipment,
    triggersConsumed?: number,
  ) {
    super(runtime, logService, abilityService, parent);
    this.initPet(exp, health, attack, mana, equipment, triggersConsumed);
  }
}

export class ThornyDragonAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Thorny Dragon Ability',
      owner: owner,
      triggers: ['PostRemovalFaint'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const { tiger, pteranodon } = context;
    const owner = this.owner;
    const damage = 3 * this.level;

    const opponentPets = owner.parent.opponent.petArray.filter((p) => p.alive);
    if (opponentPets.length === 0) return;

    // Prioritize pets with ailments
    const petsWithAilments = opponentPets.filter((p) => {
      if (!p.equipment) return false;
      return (
        p.equipment.equipmentClass === 'ailment-attack' ||
        p.equipment.equipmentClass === 'ailment-defense' ||
        p.equipment.equipmentClass === 'ailment-other'
      );
    });

    const targetPool =
      petsWithAilments.length > 0 ? petsWithAilments : opponentPets;
    const targetChoice = this.runtime.random.chooseLegacyRandomOption(
      () => ({
        key: 'pet.thorny-dragon-target',
        label: formatPetScopedRandomLabel(owner, 'Thorny Dragon target'),
        options: targetPool.map((pet) => ({
          id: `${pet.name}-${pet.savedPosition}`,
          label: pet.name,
        })),
      }),
      () => this.runtime.random.getRandomInt(0, targetPool.length - 1), (targetPool).length
    );
    const target = targetPool[targetChoice.index];

    if (target) {
      owner.snipePet(target, damage, targetChoice.randomEvent, tiger, pteranodon);

      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} fainted and dealt ${damage} damage to ${target.name} (prioritizing ailments).`,
        type: 'ability',
        player: owner.parent,
        tiger: tiger,
        pteranodon: pteranodon,
        randomEvent: targetChoice.randomEvent,
      });
    }

    this.triggerTigerExecution(context);
  }

  override copy(newOwner: Pet): ThornyDragonAbility {
    return new ThornyDragonAbility(this.runtime, newOwner, this.logService);
  }
}

