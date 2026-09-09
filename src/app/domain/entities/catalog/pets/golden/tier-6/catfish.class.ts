import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Catfish extends Pet {
  name = 'Catfish';
  tier = 6;
  pack: Pack = 'Golden';
  attack = 4;
  health = 6;
  initAbilities(): void {
    this.addAbility(
      new CatfishAbility(this.runtime, this, this.logService, this.abilityService),
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

export class CatfishAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'CatfishAbility',
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
    const target = owner.petAhead;
    if (!target) {
      this.triggerTigerExecution(context);
      return;
    }

    const times = this.level;
    const hasBuyAbility = target.hasTrigger('ThisBought');
    if (hasBuyAbility) {
      for (let i = 0; i < times; i++) {
        target.executeAbilities(
          'ThisBought',
          context.gameApi,
          target,
          undefined,
          undefined,
          { trigger: 'ThisBought' },
        );
      }
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} activated ${target.name}'s buy ability ${times} time${times === 1 ? '' : 's'}.`,
        type: 'ability',
        player: owner.parent,
        tiger: context.tiger,
        pteranodon: context.pteranodon,
      });
    } else {
      const healthGain = this.level * 4;
      target.increaseHealth(healthGain);
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} gave ${target.name} +${healthGain} health.`,
        type: 'ability',
        player: owner.parent,
        tiger: context.tiger,
        pteranodon: context.pteranodon,
      });
    }
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): CatfishAbility {
    return new CatfishAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

