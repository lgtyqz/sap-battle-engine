import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { getAdjacentAlivePets } from 'app/domain/entities/ability-resolution';

export class PrayingMantis extends Pet {
  name = 'Praying Mantis';
  tier = 4;
  pack: Pack = 'Star';
  attack = 7;
  health = 2;
  initAbilities(): void {
    this.addAbility(
      new PrayingMantisAbility(this.runtime, this, this.logService, this.abilityService),
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

export class PrayingMantisAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'PrayingMantisAbility',
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
    const damage = 50;
    const adjacentPets = getAdjacentAlivePets(owner);
    for (const target of adjacentPets) {
      owner.dealDamage(target, damage);
    }

    const buff = this.level * 2;
    owner.increaseAttack(buff);
    owner.increaseHealth(buff);

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} dealt ${damage} damage to adjacent friends and gained +${buff}/+${buff}.`,
      type: 'ability',
      player: owner.parent,
      tiger: context.tiger,
      pteranodon: context.pteranodon,
      randomEvent: adjacentPets.length > 1,
    });
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): PrayingMantisAbility {
    return new PrayingMantisAbility(this.runtime,
      newOwner,
      this.logService,
      this.abilityService,
    );
  }
}

