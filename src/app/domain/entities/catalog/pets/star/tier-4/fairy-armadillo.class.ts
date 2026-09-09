import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { FairyBall } from '../../hidden/fairy-ball.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class FairyArmadillo extends Pet {
  name = 'Fairy Armadillo';
  tier = 4;
  pack: Pack = 'Star';
  attack = 2;
  health = 6;

  initAbilities(): void {
    this.addAbility(
      new FairyArmadilloAbility(this.runtime, this, this.logService, this.abilityService),
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

export class FairyArmadilloAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'FairyArmadilloAbility',
      owner: owner,
      triggers: ['ThisHurt'],
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

    const healthGain = this.level * 2;
    const targetResp = owner.parent.getThis(owner);
    const target = targetResp.pet;
    if (target == null) {
      return;
    }
    target.increaseHealth(healthGain);
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gave ${target.name} ${healthGain} permanent health and transforms into a protected ball!`,
      type: 'ability',
      player: owner.parent,
      tiger: tiger,
      randomEvent: targetResp.random,
    });

    const transformTargetResp = owner.parent.getThis(owner);
    const transformTarget = transformTargetResp.pet;
    if (transformTarget == null) {
      return;
    }
    const fairyBall = new FairyBall(this.runtime,
      this.logService,
      this.abilityService,
      transformTarget.parent,
      transformTarget.health,
      transformTarget.attack,
      transformTarget.mana,
      transformTarget.exp,
      transformTarget.equipment,
    );
    transformTarget.parent.transformPet(transformTarget, fairyBall);

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): FairyArmadilloAbility {
    return new FairyArmadilloAbility(this.runtime,
      newOwner,
      this.logService,
      this.abilityService,
    );
  }
}

