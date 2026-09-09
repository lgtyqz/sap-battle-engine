import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createContext, SourceTextModule } from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'sap-battle-engine-package-'));
const npmCache = path.join(temporaryRoot, 'npm-cache');
const consumer = path.join(temporaryRoot, 'consumer');

const config = {
  playerPack: 'Turtle',
  opponentPack: 'Turtle',
  turn: 1,
  seed: 1,
  simulationCount: 1,
  logsEnabled: false,
  playerPets: [{name: 'Fish', attack: 3, health: 5}],
  opponentPets: [{name: 'Pig', attack: 2, health: 1}],
};

function run(command, args, cwd, options = {}) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    ...options,
  });
}

try {
  // npm runs `prepare` here, proving a Git install can build from a fresh clone.
  const packOutput = run('npm', [
    'pack',
    '--json',
    '--silent',
    '--pack-destination', temporaryRoot,
    '--cache', npmCache,
  ], root);
  const [packed] = JSON.parse(packOutput);
  const packageFiles = packed.files.map(file => file.path);
  assert.ok(packageFiles.includes('dist/index.js'));
  assert.ok(packageFiles.includes('dist/index.cjs'));
  assert.ok(packageFiles.includes('dist/types/index.d.ts'));
  assert.ok(packageFiles.includes('dist/types-cjs/index.d.ts'));
  assert.ok(packed.entryCount < 50, `Package contains ${packed.entryCount} files`);
  assert.equal(packageFiles.some(file => /^(src|scripts|tests)\//.test(file)), false);

  mkdirSync(consumer);
  writeFileSync(path.join(consumer, 'package.json'), JSON.stringify({
    name: 'sap-battle-engine-smoke-consumer',
    private: true,
    type: 'module',
  }));
  const tarball = path.join(temporaryRoot, packed.filename);
  run('npm', [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--cache', npmCache,
    tarball,
  ], consumer);

  const runtimeCheck = `
const config = ${JSON.stringify(config)};
const result = engine.runSimulation(config);
const lineup = [
  {name: 'Fish', attack: 3, health: 5},
  {name: 'Monkey', attack: 1, health: 2},
];
const projected = engine.projectLineupAfterEndTurn(
  {...config, turn: 9, playerPets: lineup, opponentPets: []},
  'player',
  lineup,
);
if (projected[0]?.attack !== 5 || projected[0]?.health !== 7) {
  throw new Error('End-turn projection did not apply Monkey');
}
console.log(JSON.stringify(result));
`;
  writeFileSync(path.join(consumer, 'check.mjs'), `
import * as engine from 'sap-battle-engine';
${runtimeCheck}
`);
  writeFileSync(path.join(consumer, 'check.cjs'), `
const engine = require('sap-battle-engine');
${runtimeCheck}
`);
  const esmResult = JSON.parse(run(process.execPath, ['check.mjs'], consumer));
  const cjsResult = JSON.parse(run(process.execPath, ['check.cjs'], consumer));
  assert.deepEqual(cjsResult, esmResult);

  const browserBundle = path.join(
    consumer,
    'node_modules/sap-battle-engine/dist/index.js',
  );
  const browser = new SourceTextModule(readFileSync(browserBundle, 'utf8'), {
    context: createContext({structuredClone, console}),
  });
  await browser.link(() => {
    throw new Error('Browser bundle requested an external import');
  });
  await browser.evaluate();
  assert.equal(browser.namespace.runSimulation(config).playerWins, 1);

  const typeCheck = `
import {
  catalogs,
  createBattleEngine,
  type PetCatalogEntry,
  type SimulationConfig,
  type SimulationProgress,
} from 'sap-battle-engine';
const config: SimulationConfig = {
  ...${JSON.stringify(config)},
  playerPets: [{name: 'Fish', attack: 3, health: 5, equipment: 'Garlic'}],
};
const firstPet: PetCatalogEntry = catalogs.pets[0];
createBattleEngine().runSimulation(config, {
  onProgress(progress: SimulationProgress) {
    console.log(progress.completed, firstPet.Name);
  },
});
createBattleEngine().projectLineupAfterEndTurn(config, 'player', config.playerPets);
`;
  for (const extension of ['mts', 'cts']) {
    const file = path.join(consumer, `check.${extension}`);
    writeFileSync(file, typeCheck);
    run(process.execPath, [
      path.join(root, 'node_modules/typescript/bin/tsc'),
      '--noEmit',
      '--strict',
      '--skipLibCheck', 'false',
      '--target', 'ES2022',
      '--module', 'NodeNext',
      '--moduleResolution', 'NodeNext',
      file,
    ], consumer);
  }

  console.log(
    `Packed artifact passed ESM, CommonJS, browser, and strict TypeScript checks (${packed.entryCount} files, ${packed.size} bytes).`,
  );
} finally {
  rmSync(temporaryRoot, {recursive: true, force: true});
}
