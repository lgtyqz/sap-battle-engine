import type { EngineContext } from 'app/runtime/engine-context';

import { GameAPI } from 'app/domain/interfaces/gameAPI.interface';
import { Toy } from '../../../toy.class';

export class DiceCup extends Toy {
  name = 'Dice Cup';
  tier = 1;
  startOfBattle(gameApi?: GameAPI, puma?: boolean) {
    const pets = this.runtime.random.shuffleCopy(this.parent.petArray.filter((pet) => pet.alive));
    for (let i = 0; i < 5; i++) {
      this.parent.setPet(i, pets[i] ?? null);
    }

    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${this.name} shuffled the team.`,
      type: 'ability',
      player: this.parent,
      puma: puma,
    });
  }
}
