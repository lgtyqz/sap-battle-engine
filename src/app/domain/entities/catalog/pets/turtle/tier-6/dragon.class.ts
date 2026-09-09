import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Dragon extends Pet {
  name = 'Dragon';
  tier = 6;
  pack: Pack = 'Turtle';
  attack = 3;
  health = 8;
  initAbilities(): void {
    this.addAbility(new DragonAbility(this.runtime, this, this.logService, this.abilityService));
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

export class DragonAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'DragonAbility',
      owner: owner,
      triggers: ['Tier1FriendBought'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      maxUses: 4,
      abilityFunction: (context) => {
        this.executeAbility(context);
      },
    });
    this.logService = logService;
    this.abilityService = abilityService;
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const buff = this.level;
    const targets = owner.parent.petArray.filter((pet) => pet && pet.alive);
    if (targets.length === 0) {
      return;
    }

    for (const pet of targets) {
      pet.increaseAttack(buff);
      pet.increaseHealth(buff);
    }

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gave friends +${buff} attack and +${buff} health.`,
      type: 'ability',
      player: owner.parent,
      tiger: context.tiger,
    });
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): DragonAbility {
    return new DragonAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

