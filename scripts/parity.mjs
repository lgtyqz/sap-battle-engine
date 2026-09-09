import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { createBattleEngine } from '../dist/index.js';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import path from 'node:path';
process.chdir(path.resolve(import.meta.dirname,'..'));
let child, pending, requests=0;
function startWorker(){
 child=spawn(process.execPath,['scripts/reference-worker.cjs'],{stdio:['pipe','pipe','inherit']});
 const lines=createInterface({input:child.stdout});
 lines.on('line',line=>{const done=pending;pending=undefined;done.resolve(JSON.parse(line));});
 const current=child; child.on('exit',code=>{if(current===child && pending)pending.reject(new Error(`Reference exited ${code}`));});
}
startWorker();
const reference=config=>new Promise((resolve,reject)=>{
 if(requests && requests%20===0){child.stdin.end();startWorker();}
 requests++;pending={resolve,reject};child.stdin.write(JSON.stringify(config)+'\n');
});
const base={playerPack:'Custom',opponentPack:'Custom',turn:11,seed:123,simulationCount:1,logsEnabled:true,captureRandomDecisions:true,captureRandomDraws:true,allPets:true,mana:true};
const pet=(name,extra={})=>({name,attack:8,health:8,exp:0,...extra});
const allFixtures=JSON.parse(readFileSync('tests/fixtures/parity.json','utf8'));
const fixtures=process.env.PARITY_FILTER ? allFixtures.filter(f=>f.name.includes(process.env.PARITY_FILTER)) : allFixtures;
const simpleSnapshot=({id,side,position,...rest})=>rest;
const cleanBoard=b=>({player:b.player.map(p=>p&&simpleSnapshot(p)),opponent:b.opponent.map(p=>p&&simpleSnapshot(p))});
let passed=0;const failures=[];const start=performance.now();
for(const fixture of fixtures){
 const config={...base,...fixture.config};
 if(fixture.overrideMode){
   const baseline=await reference(config), first=baseline.randomDecisions[0];
   const invalid=fixture.overrideMode.startsWith('invalid');
   const optionId=invalid?'invalid':first.options.find(o=>o.id!==first.selectedOptionId).id;
   config.randomDecisionOverrides=[{index:first.index,optionId,...(fixture.overrideMode==='fingerprint'?{index:999,key:first.key,label:first.label}:{})}];
   config.strictRandomOverrideValidation=fixture.overrideMode!=='invalid-permissive';
 }
 const ref=await reference(config);
 if(ref.error){
   let error;try{createBattleEngine({entropy:()=>0.375}).runSimulation(config);}catch(e){error=e.message;}
   if(fixture.overrideMode==='invalid-strict' && error===ref.error)passed++;
   else failures.push({name:fixture.name,upstreamError:ref.error,error});
   continue;
 }
 let result;
 try{result=createBattleEngine().runSimulation({...config,randomDrawOverrides:ref.randomDraws});}
 catch(e){failures.push({name:fixture.name,error:e.message});continue;}
 const actual=JSON.parse(JSON.stringify({playerWins:result.playerWins,opponentWins:result.opponentWins,draws:result.draws,randomDecisions:result.randomDecisions,
  events:result.battles.flatMap(b=>b.logs.map(e=>({type:e.type,message:e.type==='board'?'':e.message,randomEvent:e.randomEvent??false,source:e.source?simpleSnapshot(e.source):null,target:e.target?simpleSnapshot(e.target):null,sourceIndex:e.sourceIndex??null,targetIndex:e.targetIndex??null}))),
  finalBoards:result.battles.map(b=>cleanBoard(b.finalBoard)),randomDraws:result.randomDraws}));
 const off=createBattleEngine().runSimulation({...config,logsEnabled:false,captureRandomDecisions:false,randomDrawOverrides:ref.randomDraws});
 const offMatches=off.playerWins===ref.playerWins && off.opponentWins===ref.opponentWins && off.draws===ref.draws && isDeepStrictEqual(off.randomDraws,ref.randomDraws);
 if(isDeepStrictEqual(actual,ref) && offMatches)passed++;
 else{const fields=Object.keys(actual).filter(k=>!isDeepStrictEqual(actual[k],ref[k]));failures.push({name:fixture.name,fields,offMatches});if(failures.length<=3){writeFileSync(path.join('.reference', `parity-failure-${failures.length}.json`),JSON.stringify({config,ref,actual},null,2));}}
 if((passed+failures.length)%100===0)console.log('compared',passed+failures.length,'failures',failures.length);
}
child.stdin.end();
mkdirSync('reports',{recursive:true});
const report={upstreamRevision:'d165eb0a02f8aa0b54d72ed1d5490a44390d07f4',cases:fixtures.length,passed,failures,seconds:(performance.now()-start)/1000};
writeFileSync(process.env.PARITY_FILTER ? 'reports/parity-focused.json' : 'reports/parity.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(failures.length)process.exitCode=1;
