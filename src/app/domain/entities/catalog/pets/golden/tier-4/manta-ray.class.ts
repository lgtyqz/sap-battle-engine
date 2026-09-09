import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class MantaRay extends Pet {
  name = 'Manta Ray';
  tier = 4;
  pack: Pack = 'Golden';
  attack = 5;
  health = 7;
  initAbilities(): void {
    this.addAbility(
      new MantaRayAbility(this.runtime, this, this.logService, this.abilityService),
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

export class MantaRayAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'MantaRayAbility',
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
    let hasEmptySpace = false;
    for (let i = 0; i < 5; i++) {
      if (owner.parent.getPetAtPosition(i) == null) {
        hasEmptySpace = true;
        break;
      }
    }
    if (!hasEmptySpace) {
      this.triggerTigerExecution(context);
      return;
    }

    const goldGain = this.level * 2;
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} will give +${goldGain} gold next turn.`,
      type: 'ability',
      player: owner.parent,
      tiger: context.tiger,
      pteranodon: context.pteranodon,
    });
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): MantaRayAbility {
    return new MantaRayAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

