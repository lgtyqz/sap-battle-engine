import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { getAdjacentAlivePets } from 'app/domain/entities/ability-resolution';

export class Mosasaurus extends Pet {
  name = 'Mosasaurus';
  tier = 5;
  pack: Pack = 'Puppy';
  attack = 5;
  health = 6;
  initAbilities(): void {
    this.addAbility(
      new MosasaurusAbility(this.runtime, this, this.logService, this.abilityService),
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

export class MosasaurusAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'MosasaurusAbility',
      owner: owner,
      triggers: ['FriendlyToyBroke'],
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
    const targets = getAdjacentAlivePets(owner);
    if (targets.length === 0) {
      this.triggerTigerExecution(context);
      return;
    }

    const attackGain = this.level * 2;
    const healthGain = this.level * 3;
    for (const target of targets) {
      target.increaseAttack(attackGain);
      target.increaseHealth(healthGain);
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} gave ${target.name} +${attackGain}/+${healthGain}.`,
        type: 'ability',
        player: owner.parent,
        tiger: context.tiger,
        pteranodon: context.pteranodon,
      });
    }
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): MosasaurusAbility {
    return new MosasaurusAbility(this.runtime,
      newOwner,
      this.logService,
      this.abilityService,
    );
  }
}

