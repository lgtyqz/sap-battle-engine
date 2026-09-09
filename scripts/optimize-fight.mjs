import { readFile } from 'node:fs/promises';
import { optimizeFight } from '../dist/index.js';
const [file, seed = '1'] = process.argv.slice(2);
if (!file) throw new Error('Usage: node scripts/optimize-fight.mjs battle.json [seed]');
const config = JSON.parse(await readFile(file, 'utf8'));
console.log(JSON.stringify(optimizeFight(config, {seed:Number(seed)}), null, 2));
