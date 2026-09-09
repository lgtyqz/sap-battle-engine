import type { EngineContext } from 'app/runtime/engine-context';
import { Pet } from '../../../../pet.class';
import { LogService } from 'app/integrations/log.service';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class AxehandleHound extends Pet {
  constructor(runtime: EngineContext,
    logService: LogService,
    abilityService: AbilityService,
    parent: Player,
  ) {
    super(runtime, logService, abilityService, parent);
    this.name = 'Axehandle Hound';
    this.attack = 5;
    this.health = 3;
    this.tier = 3;
    this.pack = 'Custom';
  }

  override initAbilities(): void {
    this.abilityList = [new AxehandleHoundAbility(this.runtime, this, this.logService)];
    super.initAbilities();
  }
}

export class AxehandleHoundAbility extends Ability {
  private hasUsed = false;
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Axehandle Hound Ability',
      owner: owner,
      triggers: ['BeforeFriendlyAttack', 'StartBattle'],
      abilityType: 'Pet',
      native: true,
      abilitylevel: owner.level,
      abilityFunction: (context) => this.executeAbility(context),
    });
    this.logService = logService;
  }

  private executeAbility(context: AbilityContext): void {
    const { gameApi, tiger, pteranodon } = context;
    if (context.trigger === 'StartBattle') {
      this.hasUsed = false;
      this.triggerTigerExecution(context);
      return;
    }
    if (this.hasUsed) {
      return;
    }

    const opponent = gameApi.opponent;
    if (!opponent) {
      return;
    }

    const opponentPets = opponent.petArray.filter((p) => p.health > 0);
    const petNames = opponentPets.map((p) => p.name);
    const hasDuplicates = new Set(petNames).size !== petNames.length;

    if (hasDuplicates) {
      this.hasUsed = true;
      const damage = this.level * 2;

      if (this.logService.isEnabled()) this.logService.createLog({
        message: `${this.owner.name} activated. Opponent has duplicates. Dealing ${damage} damage to all enemies.`,
        type: 'ability',
        player: this.owner.parent,
        tiger: tiger,
        pteranodon: pteranodon,
      });

      for (const enemy of opponentPets) {
        this.owner.dealDamage(enemy, damage);
      }
    }

    this.triggerTigerExecution(context);
  }

  override copy(owner: Pet): AxehandleHoundAbility {
    const copy = new AxehandleHoundAbility(this.runtime, owner, this.logService);
    copy.hasUsed = this.hasUsed;
    return copy;
  }
}

