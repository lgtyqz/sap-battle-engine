import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Emu extends Pet {
  name = 'Emu';
  tier = 5;
  pack: Pack = 'Golden';
  attack = 3;
  health = 4;
  initAbilities(): void {
    this.addAbility(new EmuAbility(this.runtime, this, this.logService));
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

export class EmuAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'EmuAbility',
      owner: owner,
      triggers: ['EmptyFrontSpace'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      condition: (context: AbilityContext) => {
        const owner = this.owner;
        // Check if first pet is null (front space is empty)
        return owner.parent.pet0 == null;
      },
      abilityFunction: (context) => {
        this.executeAbility(context);
      },
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const { gameApi, triggerPet, tiger, pteranodon } = context;
    const owner = this.owner;

    let buffTargetsAheadResp = owner.parent.nearestPetsAhead(1, owner);
    if (buffTargetsAheadResp.pets.length == 0) {
      return;
    }
    let buffTarget = buffTargetsAheadResp.pets[0];
    let power = this.level * 4;
    buffTarget.increaseHealth(power);
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gave ${buffTarget.name} ${power} health.`,
      type: 'ability',
      player: owner.parent,
      tiger: tiger,
      pteranodon: pteranodon,
      randomEvent: buffTargetsAheadResp.random,
    });

    let targetsAheadResp = owner.parent.nearestPetsAhead(1, owner);
    if (targetsAheadResp.pets.length === 0) {
      return;
    }
    let target = targetsAheadResp.pets[0];
    owner.parent.pushPetToFront(target);
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} pushed ${target.name} to the front.`,
      type: 'ability',
      player: owner.parent,
      tiger: tiger,
      pteranodon: pteranodon,
      randomEvent: targetsAheadResp.random,
    });

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): EmuAbility {
    return new EmuAbility(this.runtime, newOwner, this.logService);
  }
}

