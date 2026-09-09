import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import path from 'node:path';
const directory=process.env.SAP_REFERENCE_SOURCE || path.resolve('.reference/upstream');
const revision='d165eb0a02f8aa0b54d72ed1d5490a44390d07f4';
if(!existsSync(path.join(directory,'.git'))){
 mkdirSync(directory,{recursive:true});
 execFileSync('git',['init',directory],{stdio:'inherit'});
 execFileSync('git',['-C',directory,'fetch','--depth=1','https://github.com/robertley/SAP-Calculator.git',revision],{stdio:'inherit'});
 execFileSync('git',['-C',directory,'checkout','--detach','FETCH_HEAD'],{stdio:'inherit'});
}
if(execFileSync('git',['-C',directory,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==revision)throw new Error('Unexpected reference revision');
await import('./build-reference.mjs');
