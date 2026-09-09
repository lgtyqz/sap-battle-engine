import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class SpinyBushViper extends Pet {
  name = 'Spiny Bush Viper';
  tier = 4;
  pack: Pack = 'Custom';
  attack = 5;
  health = 2;
  initAbilities(): void {
    this.addAbility(new SpinyBushViperAbility(this.runtime, this, this.logService));
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

export class SpinyBushViperAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Spiny Bush Viper Ability',
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
    const owner = this.owner;
    const opponentPets = owner.parent.opponent.petArray.filter(
      (pet) => pet && pet.alive,
    );
    if (opponentPets.length === 0) {
      this.triggerTigerExecution(context);
      return;
    }

    const targets = this.runtime.random.shuffle([...opponentPets]).slice(
      0,
      Math.min(2, opponentPets.length),
    );
    const ownerPosition = owner.position ?? owner.savedPosition ?? 0;
    const damageLog: string[] = [];

    for (const target of targets) {
      const targetPosition = target.position ?? target.savedPosition ?? 0;
      const distance = Math.max(1, Math.abs(ownerPosition - targetPosition));
      const damage = Math.max(1, this.level) * distance;
      owner.dealDamage(target, damage);
      damageLog.push(`${damage} to ${target.name}`);
    }

    if (damageLog.length > 0) {
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} dealt ${damageLog.join(' and ')}.`,
        type: 'ability',
        player: owner.parent,
        tiger: context.tiger,
        pteranodon: context.pteranodon,
      });
    }

    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): SpinyBushViperAbility {
    return new SpinyBushViperAbility(this.runtime, newOwner, this.logService);
  }
}

