import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../equipment.class';
import { Pack, Pet } from '../../../pet.class';
import { Player } from '../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { SmallestSlug } from 'app/domain/entities/catalog/pets/hidden/smallest-slug.class';

export class SmallerSlug extends Pet {
  name = 'Smaller Slug';
  tier = 1;
  pack: Pack = 'Golden';
  hidden: boolean = true;
  health = 2;
  attack = 2;
  initAbilities(): void {
    this.addAbility(
      new SmallerSlugAbility(this.runtime, this, this.logService, this.abilityService),
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

export class SmallerSlugAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'SmallerSlugAbility',
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
    this.abilityService = abilityService;
  }

  private executeAbility(context: AbilityContext): void {
    const { gameApi, triggerPet, tiger, pteranodon } = context;
    const owner = this.owner;
    const slugAttack = this.level;
    const slugHealth = this.level;

    let slug = new SmallestSlug(this.runtime,
      this.logService,
      this.abilityService,
      owner.parent,
      slugHealth,
      slugAttack,
      0,
      owner.minExpForLevel,
    );

    let summonResult = owner.parent.summonPet(
      slug,
      owner.savedPosition,
      false,
      owner,
    );
    if (summonResult.success) {
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} spawned Smallest Slug Level ${owner.level}`,
        type: 'ability',
        player: owner.parent,
        tiger: tiger,
        pteranodon: pteranodon,
        randomEvent: summonResult.randomEvent,
      });
    }

    // Tiger system: trigger Tiger execution at the end
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): SmallerSlugAbility {
    return new SmallerSlugAbility(this.runtime,
      newOwner,
      this.logService,
      this.abilityService,
    );
  }
}

