import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

import { formatPetScopedRandomLabel } from 'app/runtime/random-decision-label';

export class Elk extends Pet {
  name = 'Elk';
  tier = 4;
  pack: Pack = 'Star';
  attack = 2;
  health = 6;
  initAbilities(): void {
    this.addAbility(new ElkAbility(this.runtime, this, this.logService, this.abilityService));
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

export class ElkAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'ElkAbility',
      owner: owner,
      triggers: ['EndTurn'],
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
      (pet) => pet.alive && pet.isSellPet(),
    );
    if (candidates.length === 0) {
      this.triggerTigerExecution(context);
      return;
    }

    const choice = this.runtime.random.chooseRandomOption(
      () => ({
        key: 'pet.elk-end-turn-target',
        label: formatPetScopedRandomLabel(owner, 'Elk end turn sell target'),
        options: candidates.map((pet) => ({
          id: `${pet.savedPosition + 1}:${pet.name}`,
          label: `P${pet.savedPosition + 1} ${pet.name}`,
        })),
      }),
      () => this.runtime.random.getRandomInt(0, candidates.length - 1), (candidates).length
    );
    const target = candidates[choice.index];
    const sellValueGain = this.level * 2;
    target.increaseSellValue(sellValueGain);
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} increased ${target.name}'s sell value by ${sellValueGain}.`,
      type: 'ability',
      player: owner.parent,
      tiger: context.tiger,
      pteranodon: context.pteranodon,
      randomEvent: choice.randomEvent,
    });
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): ElkAbility {
    return new ElkAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

