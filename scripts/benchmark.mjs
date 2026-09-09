import {spawnSync} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
import {workloads} from './workloads.mjs';
const results=[];
for(const workload of workloads)for(const logsEnabled of [false,true]){
 const config={...workload.config,simulationCount:logsEnabled?100:1000,logsEnabled,maxLoggedBattles:logsEnabled?100:0};
 const row={name:workload.name,logsEnabled};
 writeFileSync('.reference/benchmark-config.json', JSON.stringify(config));
 for(const mode of ['upstream','engine']){
  const r=spawnSync(process.execPath,['--expose-gc','scripts/benchmark-worker.cjs',mode,'.reference/benchmark-config.json'],{encoding:'utf8',maxBuffer:10_000_000,timeout:60000});
  if(r.status!==0)throw new Error(r.stderr);
  row[mode]=JSON.parse(r.stdout);
 }
 row.speedup=row.upstream.medianMs/row.engine.medianMs;results.push(row);
 console.log(workload.name,logsEnabled?'logs on':'logs off',row.speedup.toFixed(2)+'x');
}
mkdirSync('reports',{recursive:true});writeFileSync('reports/benchmark.json',JSON.stringify({node:process.version,platform:process.platform,arch:process.arch,results},null,2));
