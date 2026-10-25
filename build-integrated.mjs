import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
let html=await readFile('index.html','utf8');
for(const asset of ['traffic.js','hazards-map.js','traffic.css']){
 const version=createHash('sha256').update(await readFile('site/'+asset)).digest('hex').slice(0,12);
 html=html.replace(new RegExp('((?:src|href)="site/'+asset.replaceAll('.','\\.')+')(?:\\?v=[a-f0-9]+)?"','g'),'$1?v='+version+'"');
}
await writeFile('index.html',html);
await writeFile('site/integrated.html',html.replaceAll('href="site/','href="').replaceAll('src="site/','src="'));
