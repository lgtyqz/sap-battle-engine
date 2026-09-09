import { optimizeFight } from '../dist/index.js';
import { writeFileSync } from 'node:fs';
const fixtures = [
  ['simple', ['Fish','Beaver','Pig','Otter','Duck']],
  ['random-targeting', ['Mosquito','Ant','Fish','Cricket','Horse']],
  ['summons', ['Sheep','Spider','Rooster','Turkey','Fly']],
];
const results = fixtures.map(([name, pets]) => {
  const lineup = pets.map((name, i) => ({name, attack:10+i, health:10+i}));
  const result = optimizeFight({playerPets:lineup, opponentPets:name === 'random-targeting' ? ['Ant','Mosquito','Fish','Horse','Cricket'].map((name,i)=>({name,attack:10+i,health:10+i})) : lineup, simulationCount:1}, {seed:42, maxSimulations:10000});
  return {name, termination:result.termination, responses:result.steps.length, ...result.stats};
});
const report = {node:process.version, description:'Single run per fixture; 10000-battle budget, seed 42. Not a statistically robust throughput comparison.', results};
writeFileSync(new URL('../reports/optimizer-benchmark.json', import.meta.url), JSON.stringify(report, null, 2));
console.log(report);
