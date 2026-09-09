import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class RockhopperPenguin extends Pet {
  name = 'Rockhopper Penguin';
  tier = 6;
  pack: Pack = 'Custom';
  attack = 2;
  health = 5;

  initAbilities(): void {
    this.addAbility(new RockhopperPenguinAbility(this.runtime, this, this.logService));
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

export class RockhopperPenguinAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'RockhopperPenguinAbility',
      owner: owner,
      triggers: ['EmptyFrontSpace'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      maxUses: 1,
      condition: () => {
        return owner.parent.pet0 == null;
      },
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const { tiger, pteranodon } = context;
    const owner = this.owner;

    const targetResp = owner.parent.getThis(owner);
    const target = targetResp.pet;
    if (!target) {
      this.triggerTigerExecution(context);
      return;
    }

    owner.parent.pushPetToFront(target, true);

    const trumpetsGained = this.level * 12;
    const trumpetTargetResp = owner.parent.resolveTrumpetGainTarget(owner);
    trumpetTargetResp.player.gainTrumpets(
      trumpetsGained,
      owner,
      pteranodon,
      undefined,
      undefined,
      trumpetTargetResp.random,
    );

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} jumped to the front and gained +${trumpetsGained} trumpets.`,
      type: 'ability',
      player: owner.parent,
      tiger,
      pteranodon,
      randomEvent: targetResp.random,
    });

    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): RockhopperPenguinAbility {
    return new RockhopperPenguinAbility(this.runtime, newOwner, this.logService);
  }
}

