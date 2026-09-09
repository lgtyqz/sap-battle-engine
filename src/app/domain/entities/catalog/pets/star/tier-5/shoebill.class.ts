import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Shoebill extends Pet {
  name = 'Shoebill';
  tier = 5;
  pack: Pack = 'Star';
  attack = 3;
  health = 6;
  initAbilities(): void {
    this.addAbility(
      new ShoebillAbility(this.runtime, this, this.logService, this.abilityService),
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

export class ShoebillAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'ShoebillAbility',
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
    let target = owner.petAhead;
    while (target) {
      if (target.equipment?.name === 'Strawberry') {
        const buff = this.level * 4;
        target.removePerk();
        target.increaseAttack(buff);
        target.increaseHealth(buff);
        if (this.logService.isEnabled()) this.logService.createLog({
          message: `${owner.name} replaced Strawberry on ${target.name} with +${buff}/+${buff}.`,
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

  copy(newOwner: Pet): ShoebillAbility {
    return new ShoebillAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

