import { readFileSync, writeFileSync, mkdirSync, symlinkSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { SourceTextModule, createContext } from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
const require=createRequire(import.meta.url);
const cjs=require('../dist/index.cjs'), esm=await import('../dist/index.js');
const config={playerPack:'Turtle',opponentPack:'Turtle',turn:1,seed:1,simulationCount:1,logsEnabled:false,playerPets:[{name:'Fish',attack:3,health:5}],opponentPets:[{name:'Pig',attack:2,health:1}]};
assert.deepEqual(cjs.runSimulation(config),esm.runSimulation(config));
const browser=new SourceTextModule(readFileSync('dist/index.js','utf8'),{context:createContext({structuredClone,console})});
await browser.link(()=>{throw Error('Browser bundle requested an external import');});await browser.evaluate();
assert.equal(browser.namespace.runSimulation(config).playerWins,1);
mkdirSync('.reference/consumer/node_modules',{recursive:true});
if (!existsSync('.reference/consumer/node_modules/sap-battle-engine')) symlinkSync('../../..', '.reference/consumer/node_modules/sap-battle-engine', 'dir');
for (const extension of ['mts','cts']) {
 const file=`.reference/consumer/check.${extension}`;
 writeFileSync(file, `import {createBattleEngine, type SimulationConfig, type BattleEvent, catalogs} from 'sap-battle-engine';\nconst config: SimulationConfig = ${JSON.stringify(config)};\nconst result = createBattleEngine().runSimulation(config);\nconst event: BattleEvent | undefined = result.battles?.[0]?.logs[0];\nconsole.log(event?.source?.name, catalogs.pets[0].Name);\n`);
 execFileSync(process.execPath,['node_modules/typescript/bin/tsc','--noEmit','--strict','--skipLibCheck','false','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext',file],{stdio:'inherit'});
}
console.log('CommonJS, ESM, browser sandbox, and strict declaration consumer checks passed.');
