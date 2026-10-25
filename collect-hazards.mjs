import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fetchHazards} from './site/hazard-sources.mjs';
import {sourceFresh} from './site/hazard-core.mjs';
let previous;try{previous=JSON.parse(await readFile('site/data/hazards.geojson','utf8'));}catch{}
const data=await fetchHazards({previous});await mkdir('site/data',{recursive:true});
// SIFOR event coordinates are consulted directly in the browser, not republished
// as a downloadable event archive. Only source quality aggregates are retained.
const snapshot={...data,features:data.features.filter(f=>f.properties.source!=='sifor'),metadata:{...data.metadata,sifor_persistence:'aggregate_only; events queried directly from source'}};
await writeFile('site/data/hazards.geojson',JSON.stringify(snapshot));
const rows=['source,status,records,rejected,encoding_loss,fresh,stale_or_unknown'];for(const s of data.metadata.sources){const ff=data.features.filter(f=>f.properties.source===s.id),fresh=ff.filter(f=>sourceFresh(f)).length;rows.push([s.id,s.status,s.count,s.rejected,s.encoding_loss,fresh,ff.length-fresh].join(','));}
await writeFile('site/data/hazards-quality.csv',rows.join('\n')+'\n');
const kinds=['kind,source,records,fresh,stale_or_unknown'];for(const source of ['sifor','ipma','emsc'])for(const kind of [...new Set(data.features.filter(f=>f.properties.source===source).map(f=>f.properties.kind))]){const group=data.features.filter(f=>f.properties.source===source&&f.properties.kind===kind),fresh=group.filter(f=>sourceFresh(f)).length;kinds.push([kind,source,group.length,fresh,group.length-fresh].join(','));}await writeFile('site/data/hazards-by-kind.csv',kinds.join('\n')+'\n');
console.log(JSON.stringify({sources:data.metadata.sources.map(({id,status,count})=>({id,status,count})),events:data.features.length}));
