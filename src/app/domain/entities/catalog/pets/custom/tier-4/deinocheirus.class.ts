import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Deinocheirus extends Pet {
  name = 'Deinocheirus';
  tier = 4;
  pack: Pack = 'Custom';
  attack = 4;
  health = 7;
  override initAbilities(): void {
    this.addAbility(new DeinocheirusAbility(this.runtime, this, this.logService));
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

export class DeinocheirusAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Deinocheirus Ability',
      owner,
      triggers: ['StartBattle'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const { tiger, pteranodon } = context;
    const owner = this.owner;
    const equipment = owner.equipment;

    if (!equipment) {
      this.triggerTigerExecution(context);
      return;
    }

    const eqClass = equipment.equipmentClass;
    if (!eqClass?.startsWith('ailment')) {
      this.triggerTigerExecution(context);
      return;
    }

    const multiplier = this.level;
    const attackBuff = multiplier;
    const healthBuff = multiplier * 2;
    owner.increaseAttack(attackBuff);
    owner.increaseHealth(healthBuff);

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} reversed ${equipment.name} and gained +${attackBuff}/+${healthBuff} (x${multiplier}).`,
      type: 'ability',
      player: owner.parent,
      tiger,
      pteranodon,
    });

    this.triggerTigerExecution(context);
  }

  override copy(newOwner: Pet): DeinocheirusAbility {
    return new DeinocheirusAbility(this.runtime, newOwner, this.logService);
  }
}

