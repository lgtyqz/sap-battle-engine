import { build } from 'esbuild';
import { readFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const root = path.resolve(import.meta.dirname,'..');
const upstream = process.env.SAP_REFERENCE_SOURCE || path.join(root,'.reference/upstream');
const revision=execFileSync('git',['-C',upstream,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(revision!=='d165eb0a02f8aa0b54d72ed1d5490a44390d07f4')throw new Error('Reference revision mismatch');
mkdirSync(path.join(root,'.reference'),{recursive:true});
const common={entryPoints:[path.join(upstream,'simulation/simulate.ts')],bundle:true,platform:'node',format:'cjs',target:'es2020',tsconfig:path.join(upstream,'simulation/tsconfig.simulation.json'),nodePaths:[path.join(root,'node_modules')]};
await build({...common,outfile:path.join(root,'.reference/original.cjs')});
// Read-only instrumentation at bundle time: capture state before upstream presentation processing.
await build({...common,outfile:path.join(root,'.reference/instrumented.cjs'),plugins:[{name:'observe',setup(b){b.onLoad({filter:/\/(log\.service|simulation-runner|simulation-randomness)\.ts$/},async args=>{
 let contents=readFileSync(args.path,'utf8');
 if(args.path.endsWith('/log.service.ts')) contents=contents.replace('this.resolveLogMetadata(log);','this.resolveLogMetadata(log); globalThis.__observeLog?.(log);');
 if(args.path.endsWith('/simulation-runner.ts')) contents=contents.replace('this.executeBattleLoop();','this.executeBattleLoop(); globalThis.__observeFinal?.(this.player, this.opponent);');
 if(args.path.endsWith('/simulation-randomness.ts')) contents=contents.replace('mathWithRandom.random = random;','mathWithRandom.random = () => { const value = random(); globalThis.__observeDraw?.("seeded", value); return value; };');
 return {contents,loader:'ts'};
 });}}]});
