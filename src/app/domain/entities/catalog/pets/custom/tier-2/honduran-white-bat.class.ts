import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class HonduranWhiteBat extends Pet {
  name = 'Honduran White Bat';
  tier = 2;
  pack: Pack = 'Custom';
  attack = 1;
  health = 1;
  override initAbilities(): void {
    this.addAbility(new HonduranWhiteBatAbility(this.runtime, this, this.logService));
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

export class HonduranWhiteBatAbility extends Ability {
  constructor(runtime: EngineContext, owner: Pet, private logService: LogService) {
    super(runtime, {
      name: 'Honduran White Bat Ability',
      owner,
      triggers: ['StartBattle'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
  }

  private executeAbility(context: AbilityContext): void {
    const owner = this.owner;
    const friendTiers = new Set(
      owner.parent.petArray
        .filter((friend) => friend !== owner && friend.alive)
        .map((friend) => friend.tier),
    );
    const trumpets = friendTiers.size * this.level;

    if (trumpets > 0) {
      owner.parent.gainTrumpets(trumpets, owner, context.pteranodon);
    }
    this.triggerTigerExecution(context);
  }

  override copy(newOwner: Pet): HonduranWhiteBatAbility {
    return new HonduranWhiteBatAbility(this.runtime, newOwner, this.logService);
  }
}
