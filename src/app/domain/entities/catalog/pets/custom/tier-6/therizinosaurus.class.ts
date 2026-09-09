import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { Coconut } from 'app/domain/entities/catalog/equipment/turtle/coconut.class';

export class Therizinosaurus extends Pet {
  name = 'Therizinosaurus';
  tier = 6;
  pack: Pack = 'Custom';
  attack = 3;
  health = 8;
  initAbilities(): void {
    this.addAbility(new TherizinosaurusAbility(this.runtime, this, this.logService));
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

export class TherizinosaurusAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'TherizinosaurusAbility',
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
  }

  private executeAbility(context: AbilityContext): void {
    const { gameApi, triggerPet, tiger, pteranodon } = context;
    const owner = this.owner;

    let excludePets = owner.parent.getPetsWithoutEquipment('Strawberry');
    let targetsResp = owner.parent.getFurthestUpPets(
      this.level,
      excludePets,
      owner,
    );
    let targets = targetsResp.pets;
    for (let pet of targets) {
      pet.givePetEquipment(new Coconut(this.runtime));
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} gave ${pet.name} Coconut.`,
        type: 'ability',
        player: owner.parent,
        tiger: tiger,
        pteranodon: pteranodon,
        randomEvent: targetsResp.random,
      });
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): TherizinosaurusAbility {
    return new TherizinosaurusAbility(this.runtime, newOwner, this.logService);
  }
}

