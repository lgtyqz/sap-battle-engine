import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

import { ToyService } from 'app/integrations/toy/toy.service';

import { formatPetScopedRandomLabel } from 'app/runtime/random-decision-label';

export class QuestingBeast extends Pet {
  name = 'Questing Beast';
  tier = 6;
  pack: Pack = 'Custom';
  attack = 7;
  health = 9;
  initAbilities(): void {
    this.addAbility(new QuestingBeastAbility(this.runtime, this, this.logService));
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

export class QuestingBeastAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'QuestingBeastAbility',
      owner: owner,
      triggers: ['ThisSold'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const level = Math.max(1, Math.min(3, this.level));
    const toyService = this.runtime.services.toyService;
    const availableToys = toyService.toys.get(level) ?? [];
    if (availableToys.length === 0) {
      this.triggerTigerExecution(context);
      return;
    }

    const toyChoice = this.runtime.random.chooseLegacyRandomOption(
      () => ({
        key: 'pet.questing-beast-toy',
        label: formatPetScopedRandomLabel(
          owner,
          `Questing Beast level ${level} toy`,
        ),
        options: availableToys.map((name) => ({ id: name, label: name })),
      }),
      () => this.runtime.random.getRandomInt(0, availableToys.length - 1), (availableToys).length
    );
    const toyName = availableToys[toyChoice.index];
    const newToy = toyService.createToy(toyName, owner.parent, level);
    if (!newToy) {
      this.triggerTigerExecution(context);
      return;
    }

    owner.parent.toy = newToy;
    owner.parent.toy.used = false;
    owner.parent.toy.triggers = 0;

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} created a level ${level} ${toyName} toy.`,
      type: 'ability',
      player: owner.parent,
      randomEvent: toyChoice.randomEvent,
    });

    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): QuestingBeastAbility {
    return new QuestingBeastAbility(this.runtime, newOwner, this.logService);
  }
}

