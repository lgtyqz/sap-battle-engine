import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Angelshark extends Pet {
  name = 'Angelshark';
  tier = 4;
  pack: Pack = 'Danger';
  attack = 3;
  health = 3;

  override initAbilities(): void {
    this.addAbility(new AngelsharkAbility(this.runtime, this, this.logService, this.abilityService));
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

export class AngelsharkAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'AngelsharkAbility',
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
    for (const friend of owner.parent.petArray) {
      if (friend === owner || !friend.alive) continue;
      if (friend.attack > friend.health) friend.increaseAttack(this.level);
      else friend.increaseHealth(this.level);
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} gave ${friend.name} +${this.level} to its highest stat.`,
        type: 'ability',
        player: owner.parent,
        tiger: context.tiger,
        pteranodon: context.pteranodon,
      });
    }
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): AngelsharkAbility {
    return new AngelsharkAbility(this.runtime,
      newOwner,
      this.logService,
      this.abilityService,
    );
  }
}
