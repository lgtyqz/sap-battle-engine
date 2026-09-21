import type { EngineContext } from 'app/runtime/engine-context';
import { Equipment } from '../../../../equipment.class';
import { Pet } from '../../../../pet.class';
import { LogService } from 'app/integrations/log.service';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { Player } from '../../../../player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class BrazillianTreehopper extends Pet {
  constructor(runtime: EngineContext,
    logService: LogService,
    abilityService: AbilityService,
    parent: Player,
    health?: number,
    attack?: number,
    mana?: number,
    exp?: number,
    equipment?: Equipment,
    triggersConsumed?: number,
  ) {
    super(runtime, logService, abilityService, parent);
    this.name = 'Brazillian Treehopper';
    this.tier = 3;
    this.pack = 'Custom';
    this.attack = 2;
    this.health = 3;
    this.initPet(exp, health, attack, mana, equipment, triggersConsumed);
  }

  initAbilities(): void {
    this.abilityList = [new BrazillianTreehopperAbility(this.runtime, this, this.logService)];
    super.initAbilities();
  }
}

export class BrazillianTreehopperAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Brazillian Treehopper Ability',
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
    const targetsResp = owner.parent.opponent.getHighestHealthPets(
      this.level,
      undefined,
      owner,
    );
    const targets = targetsResp.pets;

    const changes: string[] = [];
    let randomEvent = targetsResp.random;
    for (const target of targets) {
      const statTotal = target.attack + target.health;
      const statCap = target.name === 'Behemoth' ? 100 : 50;
      const minAttack = Math.max(1, statTotal - statCap);
      const maxAttack = Math.min(statCap, statTotal - 1);
      if (maxAttack < minAttack) {
        continue;
      }

      const decision = this.runtime.random.chooseRandomOption(
        () => ({
          key: 'pet.brazillian-treehopper-stats',
          label: `${owner.name} stats for ${target.name}`,
          options: Array.from(
            { length: maxAttack - minAttack + 1 },
            (_, index) => {
              const attack = minAttack + index;
              return {
                id: `${attack}/${statTotal - attack}`,
                label: `${attack}/${statTotal - attack}`,
              };
            },
          ),
        }),
        () => this.runtime.random.getRandomInt(minAttack, maxAttack) - minAttack,
        maxAttack - minAttack + 1,
      );
      randomEvent = randomEvent || decision.randomEvent;
      const newAttack = minAttack + decision.index;
      target.attack = newAttack;
      target.health = statTotal - newAttack;
      changes.push(`${target.name} to ${target.attack}/${target.health}`);
    }

    if (changes.length > 0 && this.logService.isEnabled()) {
      this.logService.createLog({
        message: `${owner.name} redistributed ${changes.join(', ')}.`,
        type: 'ability',
        player: owner.parent,
        tiger,
        pteranodon,
        randomEvent,
      });
    }

    this.triggerTigerExecution(context);
  }

  override copy(newOwner: Pet): BrazillianTreehopperAbility {
    return new BrazillianTreehopperAbility(this.runtime, newOwner, this.logService);
  }
}
