import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Player } from '../../../../player.class';
import { Pet, Pack } from '../../../../pet.class';
import { Equipment } from '../../../../equipment.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Cardinal extends Pet {
  name = 'Cardinal';
  tier = 3;
  pack: Pack = 'Star';
  health = 3;
  attack = 4;
  initAbilities(): void {
    this.addAbility(
      new CardinalAbility(this.runtime, this, this.logService, this.abilityService),
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

export class CardinalAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'CardinalAbility',
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
    let target = owner.petAhead;
    while (target) {
      const perk = target.equipment;
      if (perk && !perk.equipmentClass?.startsWith('ailment')) {
        const discount = this.level;
        if (this.logService.isEnabled()) this.logService.createLog({
          message: `${owner.name} stocked a discounted copy of ${perk.name} (-${discount} gold).`,
          type: 'ability',
          player: owner.parent,
          tiger: context.tiger,
          pteranodon: context.pteranodon,
        });
        break;
      }
      target = target.petAhead;
    }
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): CardinalAbility {
    return new CardinalAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

