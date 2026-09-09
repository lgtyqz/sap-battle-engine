import type { EngineContext } from 'app/runtime/engine-context';
import { Strawberry } from 'app/domain/entities/catalog/equipment/star/strawberry.class';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Hummingbird extends Pet {
  name = 'Hummingbird';
  tier = 1;
  pack: Pack = 'Star';
  attack = 3;
  health = 1;

  initAbilities(): void {
    this.addAbility(
      new HummingbirdAbility(this.runtime, this, this.logService, this.abilityService),
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

export class HummingbirdAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'HummingbirdAbility',
      owner: owner,
      triggers: ['PostRemovalFaint'],
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

    let excludePets = owner.parent.getPetsWithEquipment('Strawberry');
    let targetsResp = owner.parent.nearestPetsBehind(
      this.level,
      owner,
      excludePets,
    );
    if (targetsResp.pets.length === 0) {
      return;
    }

    for (let target of targetsResp.pets) {
      target.givePetEquipment(new Strawberry(this.runtime, this.logService));
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} gave ${target.name} strawberry.`,
        type: 'ability',
        player: owner.parent,
        tiger: tiger,
        randomEvent: targetsResp.random,
      });
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): HummingbirdAbility {
    return new HummingbirdAbility(this.runtime,
      newOwner,
      this.logService,
      this.abilityService,
    );
  }
}

