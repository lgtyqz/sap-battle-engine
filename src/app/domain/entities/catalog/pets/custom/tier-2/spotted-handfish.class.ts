import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

import { formatPetScopedRandomLabel } from 'app/runtime/random-decision-label';

export class SpottedHandfish extends Pet {
  name = 'Spotted Handfish';
  tier = 2;
  pack: Pack = 'Custom';
  attack = 3;
  health = 4;

  override initAbilities(): void {
    this.addAbility(new SpottedHandfishAbility(this.runtime, this));
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

export class SpottedHandfishAbility extends Ability {
  constructor(runtime: EngineContext, owner: Pet) {
    super(runtime, {
      name: 'Spotted Handfish Ability',
      owner: owner,
      triggers: ['StartTurn'],
      abilityType: 'Pet',
      abilitylevel: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
  }

  private executeAbility(context: AbilityContext): void {
    const { gameApi } = context;
    const owner = this.owner;
    const amt = this.level;

    const ailments = [
      'Cold',
      'Crisp',
      'Dazed',
      'Icky',
      'Inked',
      'Spooked',
      'Weak',
      'Silly',
      'Bloated',
      'Confused',
      'Cursed',
      'Sad',
      'Sleepy',
      'Webbed',
    ];

    for (let i = 0; i < amt; i++) {
      const choice = this.runtime.random.chooseRandomOption(
        () => ({
          key: 'pet.spotted-handfish-ailment',
          label: formatPetScopedRandomLabel(owner, 'Spotted Handfish canned ailment', i + 1),
          options: ailments.map((name) => ({ id: name, label: name })),
        }),
        () => this.runtime.random.getRandomInt(0, ailments.length - 1), (ailments).length
      );
      const ailmentName = ailments[choice.index];

      // Add to canned ailments
      owner.parent.cannedAilments.push(ailmentName);

      if (this.runtime.services.logService.isEnabled()) gameApi?.logService?.createLog({
        message: `${owner.name} stocked a canned ${ailmentName}.`,
        type: 'ability',
        player: owner.parent,
        randomEvent: choice.randomEvent,
      });
    }

    this.triggerTigerExecution(context);
  }

  override copy(newOwner: Pet): SpottedHandfishAbility {
    return new SpottedHandfishAbility(this.runtime, newOwner);
  }
}

