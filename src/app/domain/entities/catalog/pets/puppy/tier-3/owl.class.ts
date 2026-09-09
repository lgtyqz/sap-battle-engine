import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from '../../../../equipment.class';
import { Pack, Pet } from '../../../../pet.class';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';
import { Mouse } from 'app/domain/entities/catalog/pets/custom/tier-1/mouse.class';

export class Owl extends Pet {
  name = 'Owl';
  tier = 3;
  pack: Pack = 'Puppy';
  attack = 3;
  health = 2;
  initAbilities(): void {
    this.addAbility(new OwlAbility(this.runtime, this, this.logService, this.abilityService));
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

export class OwlAbility extends Ability {
  private logService: LogService;
  private abilityService: AbilityService;

  constructor(runtime: EngineContext,
    owner: Pet,
    logService: LogService,
    abilityService: AbilityService,
  ) {
    super(runtime, {
      name: 'OwlAbility',
      owner: owner,
      triggers: ['StartTurn'],
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
    const exp = this.minExpForLevel;
    const mouse = new Mouse(this.runtime,
      this.logService,
      this.abilityService,
      owner.parent,
      null,
      null,
      null,
      exp,
    );

    const summonResult = owner.parent.summonPet(
      mouse,
      owner.savedPosition,
      false,
      owner,
    );
    if (summonResult.success) {
      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${owner.name} summoned a level ${this.level} Mouse.`,
        type: 'ability',
        player: owner.parent,
        tiger: context.tiger,
        pteranodon: context.pteranodon,
        randomEvent: summonResult.randomEvent,
      });
    }
    this.triggerTigerExecution(context);
  }

  copy(newOwner: Pet): OwlAbility {
    return new OwlAbility(this.runtime, newOwner, this.logService, this.abilityService);
  }
}

