import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

import { formatPetScopedRandomLabel } from 'app/runtime/random-decision-label';

export class Tyrannosaurus extends Pet {
  name = 'Tyrannosaurus';
  tier = 6;
  pack: Pack = 'Puppy';
  attack = 7;
  health = 7;
  initAbilities(): void {
    this.addAbility(
      new TyrannosaurusAbility(this.runtime, this, this.logService, this.abilityService),
    );
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

export class TyrannosaurusAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'TyrannosaurusAbility',
      owner: owner,
      triggers: ['StartTurn'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => {
        this.executeAbility(context);
      },
    });
    this.logService = logService;
    this.abilityService = abilityService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const candidates = owner.parent.petArray.filter(
      (pet) => pet.alive && pet !== owner && pet.tier >= 5,
    );
    const initialCount = candidates.length;
    if (candidates.length === 0) {
      this.triggerTigerExecution(context);
      return;
    }

    const targets: Pet[] = [];
    while (targets.length < 2 && candidates.length > 0) {
      const choice = this.runtime.random.chooseLegacyRandomOption(
        () => ({
          key: 'pet.tyrannosaurus-target',
          label: formatPetScopedRandomLabel(
            owner,
            `Tyrannosaurus target ${targets.length + 1}`,
          ),
          options: candidates.map((pet) => ({
            id: `${pet.name}-${pet.savedPosition}`,
            label: pet.name,
          })),
        }),
        () => this.runtime.random.getRandomInt(0, candidates.length - 1), (candidates).length
      );
      targets.push(candidates[choice.index]);
      candidates.splice(choice.index, 1);
    }

    const buff = this.level * 2;
    for (const target of targets) {
      target.increaseAttack(buff);
      target.increaseHealth(buff);
    }

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gave ${targets.map((pet) => pet.name).join(', ')} +${buff}/+${buff}.`,
      type: 'ability',
      player: owner.parent,
      tiger: context.tiger,
      pteranodon: context.pteranodon,
      randomEvent: initialCount > targets.length,
    });
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): TyrannosaurusAbility {
    return new TyrannosaurusAbility(this.runtime,
      newOwner,
      this.logService,
      this.abilityService,
    );
  }
}

