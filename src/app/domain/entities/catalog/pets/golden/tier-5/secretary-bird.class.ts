import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class SecretaryBird extends Pet {
  name = 'Secretary Bird';
  tier = 4;
  pack: Pack = 'Golden';
  attack = 3;
  health = 5;
  initAbilities(): void {
    this.addAbility(new SecretaryBirdAbility(this.runtime, this, this.logService));
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

export class SecretaryBirdAbility extends Ability {
  private logService: LogService;
  private abilityUses: number = 0;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'SecretaryBirdAbility',
      owner: owner,
      triggers: ['PostRemovalFriendFaints2'],
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

    let targetsAheadResp = owner.parent.nearestPetsAhead(1, owner);
    if (targetsAheadResp.pets.length === 0) {
      return;
    }
    let target = targetsAheadResp.pets[0];
    let powerAttack = this.level * 3;
    let powerHealth = this.level * 4;
    target.increaseAttack(powerAttack);
    target.increaseHealth(powerHealth);
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} gave ${target.name} ${powerAttack} attack and ${powerHealth} health.`,
      type: 'ability',
      player: owner.parent,
      tiger: tiger,
      pteranodon: pteranodon,
      randomEvent: targetsAheadResp.random,
    });

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} triggered secretary bird ability at level ${this.level}.`,
      type: 'ability',
      player: owner.parent,
      tiger: tiger,
      pteranodon: pteranodon,
    });
  }

  copy(newOwner: Pet): SecretaryBirdAbility {
    return new SecretaryBirdAbility(this.runtime, newOwner, this.logService);
  }
}

