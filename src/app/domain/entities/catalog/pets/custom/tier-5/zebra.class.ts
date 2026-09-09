import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Zebra extends Pet {
  name = 'Zebra';
  tier = 5;
  pack: Pack = 'Custom';
  attack = 3;
  health = 5;
  initAbilities(): void {
    this.addAbility(new ZebraAbility(this.runtime, this, this.logService));
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

export class ZebraAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Zebra Ability',
      owner: owner,
      triggers: ['ThisBought', 'ThisSold'],
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
    const owner = this.owner;
    const targetResp = owner.parent.getRandomPets(
      1,
      [owner],
      false,
      false,
      owner,
    );
    const target = targetResp.pets[0];
    if (!target) {
      this.triggerTigerExecution(context);
      return;
    }

    const buff = 2 * this.level;
    target.increaseAttack(buff);
    target.increaseHealth(buff);

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gave ${target.name} +${buff}/+${buff}.`,
      type: 'ability',
      player: owner.parent,
      tiger: context.tiger,
      pteranodon: context.pteranodon,
      randomEvent: targetResp.random,
    });

    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): ZebraAbility {
    return new ZebraAbility(this.runtime, newOwner, this.logService);
  }
}

