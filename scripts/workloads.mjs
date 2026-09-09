import {readFileSync} from 'node:fs';
const pet=(name,extra={})=>({name,attack:10,health:10,exp:2,...extra});
const base={playerPack:'Custom',opponentPack:'Custom',turn:11,seed:42,allPets:true,playerPets:[],opponentPets:[]};
export const workloads=[
 {name:'simple',config:{...base,playerPets:[pet('Fish')],opponentPets:[pet('Pig')]}},
 {name:'random-targets',config:{...base,playerPets:[pet('Mosquito'),pet('Leopard'),pet('Snake')],opponentPets:[pet('Elephant'),pet('Blowfish'),pet('Camel')]}},
 {name:'summons',config:{...base,playerPets:[pet('Sheep'),pet('Fly'),pet('Turkey')],opponentPets:[pet('Deer'),pet('Rooster'),pet('Shark')]}},
 {name:'copy-transform',config:{...base,playerPets:[pet('Ant'),pet('Basilisk'),pet('Parrot'),pet('Tiger')],opponentPets:[pet('Beluga Whale',{belugaSwallowedPet:'Deer'}),pet('Tapir'),pet('Snake')]}},
 ...['eleblow-t11','double-anteater','capy-pheasant-t3'].map(name=>({name,config:{...JSON.parse(readFileSync(new URL(`../tests/fixtures/examples/${name}.json`,import.meta.url))),seed:42}}))
];
