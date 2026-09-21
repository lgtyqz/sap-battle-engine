import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { EquipmentService } from 'app/integrations/equipment/equipment.service';

import { canApplyAilment, logAbility } from 'app/domain/entities/ability-resolution';
import { cloneEquipment } from 'app/runtime/equipment-clone';

import { formatPetScopedRandomLabel } from 'app/runtime/random-decision-label';

export class LeafGecko extends Pet {
  name = 'Leaf Gecko';
  tier = 4;
  pack: Pack = 'Custom';
  attack = 4;
  health = 4;

  override initAbilities(): void {
    this.addAbility(new LeafGeckoAbility(this.runtime, this, this.logService));
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

export class LeafGeckoAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Leaf Gecko Ability',
      owner: owner,
      triggers: ['Faint'],
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
    const equipmentService =
      this.runtime.services.equipmentService;
    const ailmentNames = Array.from(
      equipmentService.getInstanceOfAllAilments().keys(),
    );
    const eligibleTargets = [
      ...owner.parent.petArray,
      ...owner.parent.opponent.petArray,
    ].filter(
      (pet) =>
        pet?.alive &&
        (!pet.equipment || pet.equipment.equipmentClass?.startsWith('ailment')),
    );

    if (ailmentNames.length === 0 || eligibleTargets.length === 0) {
      this.triggerTigerExecution(context);
      return;
    }

    const requiredCount = this.level * 3;
    const appliedDetails: string[] = [];
    let randomEvent = false;
    const targets = [...eligibleTargets];

    for (let index = 0; index < Math.min(requiredCount, targets.length); index++) {
      const targetDecision = this.runtime.random.chooseRandomOption(
        () => ({
          key: 'pet.leaf-gecko-target',
          label: formatPetScopedRandomLabel(
            owner,
            'Leaf Gecko cursed target',
            index + 1,
          ),
          options: targets.slice(index).map((pet) => ({
            id: `${pet.parent?.isOpponent ? 'O' : 'P'}:${pet.savedPosition + 1}:${pet.name}`,
            label: `${pet.parent?.isOpponent ? 'O' : 'P'}${pet.savedPosition + 1} ${pet.name}`,
          })),
        }),
        () => this.runtime.random.getRandomInt(index, targets.length - 1) - index,
        targets.length - index,
      );
      randomEvent = randomEvent || targetDecision.randomEvent;
      const selectedIndex = index + targetDecision.index;
      [targets[index], targets[selectedIndex]] = [targets[selectedIndex], targets[index]];
      const target = targets[index];

      const availableAilments = ailmentNames.filter((ailmentName) =>
        canApplyAilment(target, ailmentName),
      );
      if (availableAilments.length === 0) {
        continue;
      }

      const ailmentDecision = this.runtime.random.chooseRandomOption(
        () => ({
          key: 'pet.leaf-gecko-ailment',
          label: formatPetScopedRandomLabel(
            owner,
            `Leaf Gecko ailment for ${target.name}`,
            index + 1,
          ),
          options: availableAilments.map((name) => ({ id: name, label: name })),
        }),
        () => this.runtime.random.getRandomInt(0, availableAilments.length - 1), (availableAilments).length
      );
      randomEvent = randomEvent || ailmentDecision.randomEvent;
      const ailmentName = availableAilments[ailmentDecision.index];
      if (!ailmentName) {
        continue;
      }

      const ailmentInstance = equipmentService
        .getInstanceOfAllAilments()
        .get(ailmentName);
      if (!ailmentInstance) {
        continue;
      }

      const ailmentClone = cloneEquipment(ailmentInstance);
      if (!ailmentClone) {
        continue;
      }
      if (target.parent !== owner.parent) {
        ailmentClone.multiplier = 2;
        ailmentClone.multiplierMessage = ' x2 (Leaf Gecko)';
      }

      target.givePetEquipment(ailmentClone);

      if (
        target.equipment?.name === ailmentName &&
        target.equipment?.equipmentClass?.startsWith('ailment')
      ) {
        appliedDetails.push(
          `${target.name} (${ailmentName}${target.parent !== owner.parent ? ' x2' : ''})`,
        );
      }
    }

    const appliedCount = appliedDetails.length;
    const message =
      appliedCount > 0
        ? `${owner.name} cursed ${appliedCount} pet${appliedCount === 1 ? '' : 's'}: ${appliedDetails.join(', ')}.`
        : `${owner.name} could not apply any random ailments.`;

    logAbility(this.logService, owner, message, tiger, pteranodon, {
      randomEvent,
    });
    this.triggerTigerExecution(context);
  }

  override copy(newOwner: Pet): LeafGeckoAbility {
    return new LeafGeckoAbility(this.runtime, newOwner, this.logService);
  }
}
