import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

import { formatPetScopedRandomLabel } from 'app/runtime/random-decision-label';

export class Baku extends Pet {
  name = 'Baku';
  tier = 1;
  pack: Pack = 'Unicorn';
  attack = 1;
  health = 4;
  initAbilities(): void {
    this.addAbility(new BakuAbility(this.runtime, this, this.logService, this.abilityService));
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

export class BakuAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'BakuAbility',
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
    const turnNumber = context.gameApi?.turnNumber ?? 0;
    if (turnNumber % 2 !== 0) {
      this.triggerTigerExecution(context);
      return;
    }

    const candidates = owner.parent.petArray.filter(
      (pet) =>
        pet.alive && pet.equipment?.equipmentClass?.startsWith('ailment'),
    );
    if (candidates.length === 0) {
      this.triggerTigerExecution(context);
      return;
    }

    const targets: Pet[] = [];
    const pool = [...candidates];
    while (targets.length < 2 && pool.length > 0) {
      const choice = this.runtime.random.chooseRandomOption(
        () => ({
          key: 'pet.baku-end-turn-target',
          label: formatPetScopedRandomLabel(owner, 'Baku ailment target', targets.length + 1),
          options: pool.map((pet) => ({
            id: `${pet.savedPosition + 1}:${pet.name}`,
            label: `P${pet.savedPosition + 1} ${pet.name}`,
          })),
        }),
        () => this.runtime.random.getRandomInt(0, pool.length - 1), (pool).length
      );
      targets.push(pool[choice.index]);
      pool.splice(choice.index, 1);
    }

    const healthGain = this.level;
    for (const target of targets) {
      target.removePerk();
      target.increaseHealth(healthGain);
    }

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} replaced ailments with +${healthGain} health on ${targets.map((pet) => pet.name).join(', ')}.`,
      type: 'ability',
      player: owner.parent,
      tiger: context.tiger,
      pteranodon: context.pteranodon,
      randomEvent: candidates.length > targets.length,
    });
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): BakuAbility {
    return new BakuAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

