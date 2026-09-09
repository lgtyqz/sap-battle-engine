import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { Orangutan } from 'app/domain/entities/catalog/pets/star/tier-3/orangutan.class';

export class Macaque extends Pet {
  name = 'Macaque';
  tier = 5;
  pack: Pack = 'Golden';
  attack = 2;
  health = 2;
  initAbilities(): void {
    this.addAbility(
      new MacaqueAbility(this.runtime, this, this.logService, this.abilityService),
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

export class MacaqueAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'MacaqueAbility',
      owner: owner,
      triggers: ['StartBattle'],
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

    let power = this.level * 12;
    let monke = new Orangutan(this.runtime,
      this.logService,
      this.abilityService,
      owner.parent,
      power,
      power,
      0,
      owner.minExpForLevel,
      owner.equipment,
    );

    let result = owner.parent.summonPetInFront(owner, monke);
    if (result.success) {
      let message = `${owner.name} spawned Orangutan ${monke.attack}/${monke.health}`;
      if (owner.equipment != null) {
        message += ` with ${owner.equipment.name}`;
      }
      message += `.`;

      if (this.logService.isEnabled()) this.logService.createLog({
        message: message,
        type: 'ability',
        player: owner.parent,
        tiger: tiger,
        pteranodon: pteranodon,
        randomEvent: result.randomEvent,
      });
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): MacaqueAbility {
    return new MacaqueAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

