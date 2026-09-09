import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Stonefish extends Pet {
  name = 'Stonefish';
  tier = 5;
  pack: Pack = 'Puppy';
  attack = 7;
  health = 4;
  initAbilities(): void {
    this.addAbility(new StonefishAbility(this.runtime, this, this.logService));
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

export class StonefishAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'StonefishAbility',
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
  }

  private executeAbility(context: AbilityContext): void {
    const { tiger, pteranodon } = context;
    const owner = this.owner;

    // PostRemovalFaint receives the fainted pet as its trigger pet. Stonefish
    // must instead target the pet that caused its faint, which is recorded by
    // combat damage before the faint is removed from the board.
    let targetResp = owner.parent.getSpecificPet(owner, owner.killedBy);
    let target = targetResp.pet;
    if (target == null || !target.alive) {
      return;
    }
    owner.snipePet(target, owner.attack * this.level, false, tiger, pteranodon);

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): StonefishAbility {
    return new StonefishAbility(this.runtime, newOwner, this.logService);
  }
}

