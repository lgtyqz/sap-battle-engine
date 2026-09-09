import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Player } from '../../../../player.class';
import { Pet, Pack } from '../../../../pet.class';
import { Equipment } from '../../../../equipment.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class BlueWhale extends Pet {
  name = 'Blue Whale';
  tier = 6;
  pack: Pack = 'Danger';
  health = 12;
  attack = 12;
  initAbilities(): void {
    this.addAbility(
      new BlueWhaleAbility(this.runtime, this, this.logService, this.abilityService),
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

export class BlueWhaleAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'BlueWhaleAbility',
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
    const buff = this.level * 2;
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} sold friends for +2 extra gold each and gave future shop pets +${buff} attack and +${buff} health.`,
      type: 'ability',
      player: owner.parent,
      tiger: context.tiger,
    });
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): BlueWhaleAbility {
    return new BlueWhaleAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

