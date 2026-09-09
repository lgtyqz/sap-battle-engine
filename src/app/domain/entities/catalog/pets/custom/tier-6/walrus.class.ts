import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { PeanutButter } from 'app/domain/entities/catalog/equipment/hidden/peanut-butter';

export class Walrus extends Pet {
  name = 'Walrus';
  tier = 6;
  pack: Pack = 'Custom';
  attack = 7;
  health = 5;
  initAbilities(): void {
    this.addAbility(new WalrusAbility(this.runtime, this, this.logService));
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

export class WalrusAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'WalrusAbility',
      owner: owner,
      triggers: ['PostRemovalFaint'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const { tiger, pteranodon } = context;
    const owner = this.owner;
    const targetsResp = owner.parent.getRandomPets(
      this.level,
      [owner],
      false,
      false,
      owner,
    );
    const targets = targetsResp.pets;

    if (targets.length === 0) {
      this.triggerTigerExecution(context);
      return;
    }

    const names = [];
    for (const target of targets) {
      target.givePetEquipment(new PeanutButter(this.runtime));
      names.push(target.name);
    }

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gave Peanut Butter to ${names.join(', ')} on faint.`,
      type: 'ability',
      player: owner.parent,
      tiger,
      pteranodon,
      randomEvent: targetsResp.random,
    });

    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): WalrusAbility {
    return new WalrusAbility(this.runtime, newOwner, this.logService);
  }
}

