import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync, rmSync, cpSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
process.chdir(root);
rmSync('dist', {recursive:true, force:true});
mkdirSync('dist', {recursive:true});
for (const [format, outfile] of [['esm','dist/index.js'],['cjs','dist/index.cjs']]) {
  const result = await build({entryPoints:['src/index.ts'], bundle:true, platform:'neutral', target:'es2020', format, outfile, sourcemap:true, metafile:true});
  const forbidden=Object.keys(result.metafile.inputs).filter(p=> /node_modules|\/ui\/|angular|log-inline-icons|log-board-render/.test(p));
  if(forbidden.length) throw new Error(`Unexpected runtime dependencies: ${forbidden.join(', ')}`);
  writeFileSync(`dist/${format}-inputs.json`,JSON.stringify(Object.keys(result.metafile.inputs),null,2));
}
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','--emitDeclarationOnly'],{stdio:'inherit'});
// Declarations are unbundled; rewrite internal aliases so package consumers need no tsconfig paths.
for(const file of readdirSync('dist/types',{recursive:true}).filter(f=>f.endsWith('.d.ts'))){
 const full=path.join('dist/types',file);
 let source=readFileSync(full,'utf8').replace(/(['"])(app|assets)\/([^'"]+)\1/g,(_m,q,dir,tail)=>{
  let relative=path.relative(path.dirname(full),path.join('dist/types',dir,tail)).replaceAll(path.sep,'/');
  if(!relative.startsWith('.'))relative='./'+relative;
  return q+relative+q;
 });
 source = source.replace(/(['"])(\.\.?\/[^'"]+)\1/g, (_m, q, target) => q + (target.endsWith('.js') || target.endsWith('.json') ? target : target + '.js') + q);
 writeFileSync(full,source);
}

// Ship only declarations reachable from the package entry point. Emitting the
// entire source tree is useful to TypeScript during the build, but exposes
// implementation details and previously added roughly 1,700 package entries.
const typesRoot = path.resolve('dist/types');
const reachable = new Set();
const declarationImports = /\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)|\bimport\s*['"]([^'"]+)['"]/g;
function visitDeclaration(file) {
  const absolute = path.resolve(file);
  if (reachable.has(absolute)) return;
  if (!existsSync(absolute)) throw new Error(`Missing public declaration dependency: ${absolute}`);
  reachable.add(absolute);
  const source = readFileSync(absolute, 'utf8');
  for (const match of source.matchAll(declarationImports)) {
    const specifier = match[1] ?? match[2] ?? match[3];
    if (!specifier.startsWith('.')) continue;
    const target = specifier.endsWith('.js')
      ? specifier.slice(0, -3) + '.d.ts'
      : specifier + '.d.ts';
    visitDeclaration(path.resolve(path.dirname(absolute), target));
  }
}
visitDeclaration(path.join(typesRoot, 'index.d.ts'));
for (const file of readdirSync(typesRoot, {recursive:true}).filter(file => file.endsWith('.d.ts'))) {
  const absolute = path.resolve(typesRoot, file);
  if (!reachable.has(absolute)) rmSync(absolute);
}

// NodeNext consumers need declarations with matching ESM/CommonJS module identity.
cpSync('dist/types', 'dist/types-cjs', {recursive:true});
writeFileSync('dist/types-cjs/package.json', JSON.stringify({type:'commonjs'})+'\n');
