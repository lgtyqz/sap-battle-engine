import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { PrayingMantis } from 'app/domain/entities/catalog/pets/star/tier-4/praying-mantis.class';

export class OrchidMantis extends Pet {
  name = 'Orchid Mantis';
  tier = 5;
  pack: Pack = 'Puppy';
  attack = 8;
  health = 4;
  initAbilities(): void {
    this.addAbility(
      new OrchidMantisAbility(this.runtime, this, this.logService, this.abilityService),
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

export class OrchidMantisAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'OrchidMantisAbility',
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

    let attack = Math.min(Math.floor(owner.attack * (this.level * 0.4)), 50);
    let health = Math.min(Math.floor(owner.health * (this.level * 0.4)), 50);
    let mantis = new PrayingMantis(this.runtime,
      this.logService,
      this.abilityService,
      owner.parent,
      health,
      attack,
      0,
      this.minExpForLevel,
      null,
    );

    let result = owner.parent.summonPetInFront(owner, mantis);
    if (result.success) {
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} spawned Mantis ${mantis.attack}/${mantis.health}.`,
        type: 'ability',
        player: owner.parent,
        tiger: tiger,
        randomEvent: result.randomEvent,
      });
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): OrchidMantisAbility {
    return new OrchidMantisAbility(this.runtime,
      newOwner,
      this.logService,
      this.abilityService,
    );
  }
}

