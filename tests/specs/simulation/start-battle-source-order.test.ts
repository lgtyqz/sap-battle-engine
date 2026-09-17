import { describe, expect, it } from 'vitest';
import {
  createBaseConfig,
  createPet,
  runBattleLogs,
} from '../../support/battle-test-runtime';

describe('start-of-battle source order', () => {
  it('resolves Churros pets, then toys, then other pets before normal reactions', () => {
    const config = createBaseConfig('Danger');
    config.logsEnabled = true;
    config.playerToy = 'Tennis Ball';
    config.playerToyLevel = 1;
    config.playerPets[0] = createPet('Sumatran Tiger', {
      attack: 20,
      health: 20,
      equipment: { name: 'Churros' },
    });
    config.playerPets[1] = createPet('Snow Leopard', {
      attack: 10,
      health: 20,
    });
    config.playerPets[2] = createPet('Philippine Eagle', {
      attack: 7,
      health: 20,
    });
    config.opponentPets[0] = createPet('Pig', { attack: 1, health: 100 });

    const messages = runBattleLogs(config).map((log) => log.message);
    const churrosPetIndex = messages.findIndex((message) =>
      message.includes('Sumatran Tiger jump-attacks Pig'),
    );
    const toyIndex = messages.findIndex((message) =>
      message.includes('Tennis Ball sniped Pig'),
    );
    const otherPetIndex = messages.findIndex((message) =>
      message.includes('Snow Leopard gave Snow Leopard'),
    );
    const normalReactionIndex = messages.findIndex((message) =>
      message.includes('Philippine Eagle gave'),
    );

    expect(churrosPetIndex).toBeGreaterThan(-1);
    expect(toyIndex).toBeGreaterThan(churrosPetIndex);
    expect(otherPetIndex).toBeGreaterThan(toyIndex);
    expect(normalReactionIndex).toBeGreaterThan(otherPetIndex);
  });
});
