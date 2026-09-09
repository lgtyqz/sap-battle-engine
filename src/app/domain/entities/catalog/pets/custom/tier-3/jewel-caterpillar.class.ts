import type { EngineContext } from 'app/runtime/engine-context';
import { AbilityService } from 'app/integrations/ability/ability.service';
import { LogService } from 'app/integrations/log.service';
import { Equipment } from 'app/domain/entities/equipment.class';
import { Pack, Pet } from 'app/domain/entities/pet.class';
import { Player } from 'app/domain/entities/player.class';
import { Ability, AbilityContext } from 'app/domain/entities/ability.class';

export class JewelCaterpillar extends Pet {
  name = 'Jewel Caterpillar';
  tier = 3;
  pack: Pack = 'Custom';
  attack = 3;
  health = 2;

  override initAbilities(): void {
    this.addAbility(new JewelCaterpillarAbility(this.runtime, this, this.logService));
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

export class JewelCaterpillarAbility extends Ability {
  private logService: LogService;

  constructor(runtime: EngineContext, owner: Pet, logService: LogService) {
    super(runtime, {
      name: 'Jewel Caterpillar Ability',
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
    const player = owner.parent;
    const trumpetCost = 2;

    if (player.trumpets < trumpetCost) {
      this.triggerTigerExecution(context);
      return;
    }

    const targets = player.petArray
      .filter((friend) => friend.alive && friend !== owner)
      .slice(-2);

    if (targets.length === 0) {
      this.triggerTigerExecution(context);
      return;
    }

    const sellIncrease = this.level;
    targets.forEach((friend) => friend.increaseSellValue(sellIncrease));
    player.spendTrumpets(trumpetCost, owner, pteranodon);

    const formattedNames = this.formatNames(
      targets.map((friend) => friend.name),
    );

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${owner.name} spent ${trumpetCost} trumpets to give ${formattedNames} +${sellIncrease} sell value each permanently.`,
      type: 'ability',
      player: player,
      tiger: tiger,
      pteranodon: pteranodon,
    });

    this.triggerTigerExecution(context);
  }

  private formatNames(names: string[]): string {
    if (names.length === 0) {
      return 'no friends';
    }
    if (names.length === 1) {
      return names[0];
    }
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  }

  override copy(newOwner: Pet): JewelCaterpillarAbility {
    return new JewelCaterpillarAbility(this.runtime, newOwner, this.logService);
  }
}

