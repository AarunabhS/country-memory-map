import {build} from 'esbuild';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
process.chdir(fileURLToPath(new URL('.',import.meta.url)));
await mkdir('shared',{recursive:true});
// The deployed service carries a generated snapshot of the single source of game rules/data.
try{await copyFile('../game-core.js','shared/game-core.cjs');await writeFile('shared/countries.json',JSON.stringify(require('../scripts/load-game-data.cjs')));}catch(e){if(e.code!=='ENOENT'&&e.code!=='MODULE_NOT_FOUND')throw e;}
await build({absWorkingDir:process.cwd(),entryPoints:['worker.mjs'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'neutral',target:'es2022',minify:false});
console.log('Built multiplayer Worker.');
