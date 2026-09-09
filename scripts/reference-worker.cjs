// One process per comparison batch: original static injector cannot cross process boundaries.
let entropyState=123456789;
function entropy(){entropyState=(entropyState+0x6d2b79f5)>>>0;let t=Math.imul(entropyState^(entropyState>>>15),1|entropyState);t^=t+Math.imul(t^(t>>>7),61|t);const v=((t^(t>>>14))>>>0)/4294967296;global.__observeDraw?.('shuffle',v);return v;}
Math.random=entropy;

const readline=require('node:readline');
const pet=p=>p?{name:p.name,attack:p.attack,health:p.health,exp:p.exp??0,mana:p.mana??0,equipment:p.equipment?.name??null,equipmentUses:p.equipment?.uses??null}:null;
const board=(p,o)=>({player:Array.from({length:5},(_,i)=>pet(p.getPetAtPosition(i))),opponent:Array.from({length:5},(_,i)=>pet(o.getPetAtPosition(i)))});
readline.createInterface({input:process.stdin}).on('line',line=>{
 const config=JSON.parse(line);entropyState=123456789; Math.random=entropy;
 delete require.cache[require.resolve('../.reference/instrumented.cjs')];
 const {runSimulation}=require('../.reference/instrumented.cjs');
 const events=[],finalBoards=[],draws=[];
 global.__observeDraw=(stream,value)=>draws.push({stream,value});
 global.__observeLog=log=>{events.push({type:log.type,message:log.type==='board'?'':log.message.replace(/<[^>]*>/g,''),randomEvent:log.randomEvent??false,source:pet(log.sourcePet),target:pet(log.targetPet),sourceIndex:log.sourceIndex??null,targetIndex:log.targetIndex??null});};
 global.__observeFinal=(p,o)=>finalBoards.push(board(p,o));
 try{const r=runSimulation(config);process.stdout.write(JSON.stringify({playerWins:r.playerWins,opponentWins:r.opponentWins,draws:r.draws,randomDecisions:r.randomDecisions,events,finalBoards,randomDraws:draws})+'\n');}
 catch(e){process.stdout.write(JSON.stringify({error:e.message})+'\n');}
 global.__observeDraw=undefined;
});
