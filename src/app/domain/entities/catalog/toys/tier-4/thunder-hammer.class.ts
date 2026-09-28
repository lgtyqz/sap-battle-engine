import type { EngineContext } from 'app/runtime/engine-context';
import { GameAPI } from 'app/domain/interfaces/gameAPI.interface';
import { LogService } from 'app/integrations/log.service';
import { ToyService } from 'app/integrations/toy/toy.service';
import { Player } from 'app/domain/entities/player.class';
import { Toy } from 'app/domain/entities/toy.class';

export class ThunderHammer extends Toy {
  name = 'Thunder Hammer';
  tier = 4;

  constructor(runtime: EngineContext,
    protected logService: LogService,
    toyService: ToyService,
    parent: Player,
    level: number,
  ) {
    super(runtime, logService, toyService, parent, level);
  }

  startOfBattle(_gameApi?: GameAPI, puma?: boolean): void {
    const targets = this.parent.petArray.filter((pet) => pet.alive && pet.name === 'Tand & Tand');
    if (targets.length === 0) return;
    const choice = this.runtime.random.chooseRandomOption(
      () => ({
        key: 'toy.thunder-hammer-target',
        label: 'Thunder Hammer target',
        options: targets.map((pet, index) => ({ id: `${index}`, label: `${pet.name} at ${pet.position}` })),
      }),
      () => this.runtime.random.getRandomInt(0, targets.length - 1),
      targets.length,
    );
    const target = targets[choice.index];
    const gain = 6 * this.level;
    target.increaseAttack(gain);
    target.increaseHealth(gain);
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${this.name} gave ${target.name} +${gain} attack and +${gain} health.`,
      type: 'ability',
      player: this.parent,
      puma,
      randomEvent: choice.randomEvent,
    });
  }
}
