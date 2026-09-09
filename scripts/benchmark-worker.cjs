const {performance}=require('node:perf_hooks');
const {readFileSync}=require('node:fs');
const mode=process.argv[2];const config=JSON.parse(readFileSync(process.argv[3] || 0,'utf8'));
const beforeImport=performance.now();
const api=require(mode==='upstream'?'../.reference/original.cjs':'../dist/index.cjs');
const importMs=performance.now()-beforeImport;
const beforeInit=performance.now();
const engine=mode==='upstream'?api:api.createBattleEngine();
const initMs=performance.now()-beforeInit;
const run=c=>engine.runSimulation(c);
const first=performance.now();run({...config,simulationCount:1});const firstBattleMs=performance.now()-first;
for(let i=0;i<3;i++)run({...config,simulationCount:100});
global.gc?.();const baseline=process.memoryUsage().heapUsed;
const samples=[];for(let i=0;i<7;i++){const start=performance.now();run(config);samples.push(performance.now()-start);}
const after=process.memoryUsage().heapUsed;global.gc?.();
const retained=process.memoryUsage().heapUsed;
samples.sort((a,b)=>a-b);
process.stdout.write(JSON.stringify({importMs,initMs,firstBattleMs,medianMs:samples[3],samplesMs:samples,battlesPerSecond:config.simulationCount/(samples[3]/1000),heapGrowthBytes:after-baseline,retainedHeapBytes:retained-baseline,maxRssKiB:process.resourceUsage().maxRSS}));
