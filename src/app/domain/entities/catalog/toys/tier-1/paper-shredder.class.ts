import type { EngineContext } from 'app/runtime/engine-context';
import { GameAPI } from 'app/domain/interfaces/gameAPI.interface';
import { Pet } from '../../../pet.class';
import { Toy } from '../../../toy.class';

export class PaperShredder extends Toy {
  name = 'Paper Shredder';
  tier = 1;
  friendSummoned(gameApi?: GameAPI, pet?: Pet, puma?: boolean, level?: number) {
    if (!pet) {
      return;
    }
    pet.health = 0;
    if (this.logService.isEnabled()) this.logService.createLog({
      message: `${this.name} knocked out ${pet.name}.`,
      type: 'ability',
      player: this.parent,
      puma: puma,
    });
  }
}
