import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class TabbyCat extends Pet {
  name = 'Tabby Cat';
  tier = 2;
  pack: Pack = 'Puppy';
  attack = 3;
  health = 2;
  initAbilities(): void {
    this.addAbility(new TabbyCatAbility(this.runtime, this, this.logService));
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

export class TabbyCatAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'TabbyCatAbility',
      owner: owner,
      triggers: ['FriendlyGainsPerk'],
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

    let targetsResp = owner.parent.getRandomPets(
      2,
      [owner],
      true,
      false,
      owner,
    );
    if (targetsResp.pets.length == 0) {
      return;
    }
    for (let target of targetsResp.pets) {
      if (target != null) {
        if (this.logService.isEnabled()) this.logService.createLog({
          message: `${owner.name} increased ${target.name}'s health by ${this.level}.`,
          type: 'ability',
          player: owner.parent,
          randomEvent: targetsResp.random,
          tiger: tiger,
        });
        target.increaseHealth(this.level);
      }
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): TabbyCatAbility {
    return new TabbyCatAbility(this.runtime, newOwner, this.logService);
  }
}

