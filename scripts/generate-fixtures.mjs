import {build} from 'esbuild';
import {writeFileSync} from 'node:fs';
await build({stdin:{contents:`export {PET_REGISTRY} from './src/app/integrations/pet/pet-registry'; export * from './src/app/integrations/equipment/equipment-registry'; export * from './src/app/integrations/toy/toy-registry';`,resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:'.reference/registry.mjs',tsconfig:'tsconfig.json'});
const r=await import('../.reference/registry.mjs');
const pet=(name,extra={})=>({name,attack:8,health:8,exp:0,...extra});
const fixtures=[];
for(const name of Object.keys(r.PET_REGISTRY)) for(const exp of [0,2,5]) fixtures.push({name:`pet:${name}:${exp}`,config:{playerPets:[pet('Ant',{health:1}),pet(name,{exp,mana:10,foodsEaten:3,timesHurt:2,battlesFought:3}),pet('Cricket'),pet('Turkey'),pet('Tiger')],opponentPets:[pet('Elephant',{attack:12,health:20}),pet('Rat'),pet('Hedgehog'),pet('Ox'),pet('Fly')]}});
for(const [key,value] of Object.entries(r)) {
 if(!value||typeof value!=='object'||key==='PET_REGISTRY')continue;
 if(key.includes('EQUIPMENT')||key.includes('AILMENT')) for(const name of Object.keys(value)) fixtures.push({name:`equipment:${name}`,config:{playerPets:[pet('Ant',{equipment:{name}}),pet('Elephant'),pet('Tiger')],opponentPets:[pet('Hedgehog'),pet('Snake'),pet('Fly')]}});
 if(key.includes('TOY')&& !key.includes('PETS'))for(const name of Object.keys(value)) for(const level of [1,2,3])fixtures.push({name:`toy:${name}:${level}`,config:{playerToy:name,playerToyLevel:level,playerPets:[pet('Ant'),pet('Cricket'),pet('Tiger')],opponentPets:[pet('Hedgehog'),pet('Snake'),pet('Fly')]}});
}
writeFileSync('tests/fixtures/parity.json',JSON.stringify(fixtures,null,2));console.log(fixtures.length,'fixtures');
// Additional multi-battle streams, real input boards, restricted pools, and legacy options.
const {workloads}=await import('./workloads.mjs');
for(const workload of workloads) for(const seed of [0,-1,42,2147483648])for(const simulationCount of [1,3])fixtures.push({name:`scenario:${workload.name}:${seed}:${simulationCount}`,config:{...workload.config,seed,simulationCount}});
const restricted={playerPack:'OnlyAnt',opponentPack:'OnlyAnt',allPets:false,customPacks:[{name:'OnlyAnt',tier1Pets:['Ant'],tier2Pets:['Cricket'],tier3Pets:['Sheep'],tier4Pets:['Deer'],tier5Pets:['Turkey'],tier6Pets:['Fly']}],playerPets:[pet('Stork'),pet('Spider',{equipment:{name:'Popcorn'}})],opponentPets:[pet('Hippo',{attack:20,health:40})]};
for(const oldStork of [false,true])for(const tokenPets of [false,true])fixtures.push({name:`scenario:restricted:${oldStork}:${tokenPets}`,config:{...restricted,oldStork,tokenPets}});
for(const mana of [false,true])for(const komodoShuffle of [false,true])fixtures.push({name:`scenario:legacy:${mana}:${komodoShuffle}`,config:{mana,komodoShuffle,playerHardToy:'Dice Cup',playerHardToyLevel:3,playerPets:[pet('Komodo'),pet('Chimera',{mana:12})],opponentPets:[pet('Fly'),pet('Dragon')]}});
for(const [playerPets,opponentPets] of [[[],[]],[[pet('Fish')],[]],[[],[pet('Fish')]]])fixtures.push({name:`scenario:empty:${playerPets.length}:${opponentPets.length}`,config:{playerPets,opponentPets}});
for(const mode of ['index','fingerprint','invalid-strict','invalid-permissive'])fixtures.push({name:`override:${mode}`,overrideMode:mode,config:{playerPets:[pet('Mosquito'),pet('Ant')],opponentPets:[pet('Pig'),pet('Fish'),pet('Otter')]}});
writeFileSync('tests/fixtures/parity.json',JSON.stringify(fixtures,null,2));
const inventory={pets:Object.keys(r.PET_REGISTRY).sort(),equipment:[],toys:[]};
for(const [key,value] of Object.entries(r))if(value&&typeof value==='object'){
 if(key.includes('EQUIPMENT')||key.includes('AILMENT'))inventory.equipment.push(...Object.keys(value));
 if(key.includes('TOY')&&!key.includes('PETS'))inventory.toys.push(...Object.keys(value));
}
inventory.equipment=[...new Set(inventory.equipment)].sort();inventory.toys=[...new Set(inventory.toys)].sort();
writeFileSync('tests/fixtures/content-inventory.json',JSON.stringify(inventory,null,2));
console.log(fixtures.length,'total fixtures including scenarios');
