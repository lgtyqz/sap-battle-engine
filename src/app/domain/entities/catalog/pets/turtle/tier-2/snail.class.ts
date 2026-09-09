import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Snail extends Pet {
  name = 'Snail';
  tier = 2;
  pack: Pack = 'Turtle';
  health = 3;
  attack = 2;
  initAbilities(): void {
    this.addAbility(new SnailAbility(this.runtime, this, this.logService));
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

export class SnailAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'SnailAbility',
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
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const gameApi = context.gameApi;
    const isPlayer = owner.parent === gameApi?.player;
    const lostLastBattle = isPlayer
      ? Boolean(gameApi?.playerLostLastBattle)
      : Boolean(gameApi?.opponentLostLastBattle);
    if (!lostLastBattle) {
      return;
    }

    const power = this.level;
    const targetsResp = owner.parent.nearestPetsAhead(3, owner);
    if (targetsResp.pets.length === 0) {
      return;
    }

    for (const target of targetsResp.pets) {
      target.increaseAttack(power);
    }

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gave ${targetsResp.pets
        .map((pet) => pet.name)
        .join(', ')} +${power} attack.`,
      type: 'ability',
      player: owner.parent,
      tiger: context.tiger,
      pteranodon: context.pteranodon,
      randomEvent: targetsResp.random,
    });

    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): SnailAbility {
    return new SnailAbility(this.runtime, newOwner, this.logService);
  }
}

