import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
await build({entryPoints:['src/hazards-map.js'],outfile:'site/hazards-map.js',bundle:true,format:'esm',target:'es2022',legalComments:'inline',banner:{js:'/* Third-party licenses\n'+(await readFile('node_modules/pbf/LICENSE','utf8'))+'\n'+(await readFile('node_modules/@mapbox/vector-tile/LICENSE.txt','utf8'))+'\n*/'}});
