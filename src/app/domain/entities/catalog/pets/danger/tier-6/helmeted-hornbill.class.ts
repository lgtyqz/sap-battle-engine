import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Player } from '../../../../player.class';
import { Pet, Pack } from '../../../../pet.class';
import { Equipment } from '../../../../equipment.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class HelmetedHornbill extends Pet {
  name = 'Helmeted Hornbill';
  tier = 6;
  pack: Pack = 'Danger';
  health = 4;
  attack = 5;

  override initAbilities(): void {
    this.addAbility(new HelmetedHornbillAbility(this.runtime, this, this.logService, this.abilityService));
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

export class HelmetedHornbillAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'HelmetedHornbillAbility',
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
    const targets = owner.parent.getRandomPets(3, [owner], false, false, owner);
    for (const friend of targets.pets) {
      if (friend.attack < friend.health) friend.increaseAttack(this.level * 2);
      else friend.increaseHealth(this.level * 2);
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} gave ${friend.name} +${this.level * 2} to its lowest stat.`,
        type: 'ability',
        player: owner.parent,
        tiger: context.tiger,
        pteranodon: context.pteranodon,
        randomEvent: targets.random,
      });
    }
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): HelmetedHornbillAbility {
    return new HelmetedHornbillAbility(this.runtime,
      newOwner,
      this.logService,
      this.abilityService,
    );
  }
}
