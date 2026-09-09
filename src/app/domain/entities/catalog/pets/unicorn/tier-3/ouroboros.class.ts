import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Ouroboros extends Pet {
  name = 'Ouroboros';
  tier = 3;
  pack: Pack = 'Unicorn';
  attack = 2;
  health = 4;
  initAbilities(): void {
    this.addAbility(
      new OuroborosAbility(this.runtime, this, this.logService, this.abilityService),
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

export class OuroborosAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;
  private usesThisTurn = 0;
  private readonly maxUsesPerTurn = 5;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'OuroborosAbility',
      owner: owner,
      triggers: ['Roll', 'StartTurn'],
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
    if (context.trigger === 'StartTurn') {
      this.usesThisTurn = 0;
      this.triggerTigerExecution(context);
      return;
    }

    if (this.usesThisTurn >= this.maxUsesPerTurn) {
      this.triggerTigerExecution(context);
      return;
    }

    const owner = this.owner;
    const buff = this.level;
    this.usesThisTurn++;
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gave newly rolled shop pets +${buff}/+${buff} until next turn.`,
      type: 'ability',
      player: owner.parent,
      tiger: context.tiger,
      pteranodon: context.pteranodon,
    });
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): OuroborosAbility {
    return new OuroborosAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

