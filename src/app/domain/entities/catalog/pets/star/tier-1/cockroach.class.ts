import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { SummonedCockroach } from '../../hidden/summoned-cockroach.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Cockroach extends Pet {
  name = 'Cockroach';
  tier = 1;
  pack: Pack = 'Star';
  attack = 1;
  health = 1;
  initAbilities(): void {
    this.addAbility(
      new CockroachAbility(this.runtime, this, this.logService, this.abilityService),
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

export class CockroachAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'CockroachAbility',
      owner: owner,
      triggers: ['PostRemovalFaint'],
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
    const { gameApi, triggerPet, tiger, pteranodon } = context;
    const owner = this.owner;

    const expToGain = this.level;

    const newCockroach = new SummonedCockroach(this.runtime,
      this.logService,
      this.abilityService,
      owner.parent,
      1,
      1,
      0,
      0,
    );

    let summonResult = owner.parent.summonPet(
      newCockroach,
      owner.savedPosition,
      false,
      owner,
    );
    if (summonResult.success) {
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} summoned a 1/1 Cockroach.`,
        type: 'ability',
        player: owner.parent,
        tiger: tiger,
        pteranodon: pteranodon,
        randomEvent: summonResult.randomEvent,
      });

      let targetResp = owner.parent.getSpecificPet(owner, newCockroach);
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} gave ${targetResp.pet.name} +${expToGain} exp.`,
        type: 'ability',
        player: owner.parent,
        sourcePet: owner,
        targetPet: targetResp.pet,
        tiger: tiger,
        randomEvent: targetResp.random,
      });
      targetResp.pet.increaseExp(expToGain);
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): CockroachAbility {
    return new CockroachAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

