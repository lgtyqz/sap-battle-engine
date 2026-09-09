import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class Hoatzin extends Pet {
  name = 'Hoatzin';
  tier = 4;
  pack: Pack = 'Custom';
  attack = 4;
  health = 3;

  override initAbilities(): void {
    this.addAbility(new HoatzinAbility(this.runtime, this, this.logService));
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

export class HoatzinAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Hoatzin Ability',
      owner: owner,
      triggers: ['StartBattle'],
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
    const player = owner.parent;
    const trumpetsPerStrawberry = 3 * this.level;
    let strawberriesRemoved = 0;

    for (const friend of player.petArray) {
      if (!friend || !friend.alive) {
        continue;
      }
      if (friend.equipment?.name === 'Strawberry') {
        friend.removePerk();
        strawberriesRemoved++;
      }
    }

    if (strawberriesRemoved === 0) {
      this.triggerTigerExecution(context);
      return;
    }

    const trumpetsGained = trumpetsPerStrawberry * strawberriesRemoved;
    const trumpetTargetResp = player.resolveTrumpetGainTarget(owner);
    trumpetTargetResp.player.gainTrumpets(
      trumpetsGained,
      owner,
      tiger,
      undefined,
      undefined,
      trumpetTargetResp.random,
    );

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} removed ${strawberriesRemoved} Strawberry${strawberriesRemoved === 1 ? '' : 's'} for +${trumpetsGained} trumpets.`,
      type: 'ability',
      player: player,
      tiger: tiger,
      pteranodon: pteranodon,
    });

    this.triggerTigerExecution(context);
  }

  override copy(newOwner: Pet): HoatzinAbility {
    return new HoatzinAbility(this.runtime, newOwner, this.logService);
  }
}

