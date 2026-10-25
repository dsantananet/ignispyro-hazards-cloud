import {normalize} from './hazard-core.mjs';
const fire='https://api.sgifr.gov.pt/arcgis/rest/services/ANEPC/ocorrencias-ativas/FeatureServer/0/query';
export function sourceUrls(now=Date.now()){
 const where="(CodNatureza BETWEEN 3101 AND 3108) OR CodNatureza=3313 OR UPPER(Natureza) LIKE '%INUNDA%' OR UPPER(Natureza) LIKE '%CHEIA%' OR UPPER(Natureza) LIKE '%DESLIZ%' OR UPPER(Natureza) LIKE '%COLIS%' OR UPPER(Natureza) LIKE '%DESPISTE%' OR UPPER(Natureza) LIKE '%ATROPEL%' OR UPPER(Natureza) LIKE '%QUEDA%RVOR%' OR UPPER(Natureza) LIKE '%QUEDA%ESTRUT%'";
 const f=new URL(fire);f.search=new URLSearchParams({where,outFields:'ID_oc,CodNatureza,Natureza,EstadoAgrupado,DataInicioOcorrencia,DataDosDados,Concelho,Freguesia,Latitude,Longitude',outSR:'4326',f:'geojson',resultRecordCount:'2000'});
 const e=new URL('https://www.seismicportal.eu/fdsnws/event/1/query');e.search=new URLSearchParams({format:'json',starttime:new Date(now-7*86400000).toISOString(),minlatitude:'29',maxlatitude:'45',minlongitude:'-33',maxlongitude:'5',limit:'1000',orderby:'time'});
 return {sifor:f.href,ipma:'https://api.ipma.pt/open-data/forecast/warnings/warnings_www.json',areas:'https://api.ipma.pt/open-data/distrits-islands.json',emsc:e.href};
}
async function read(url,fetcher){const r=await fetcher(url,{signal:AbortSignal.timeout(20000),redirect:'error',headers:{Accept:'application/json'}});if(r.status===204)return {type:'FeatureCollection',features:[]};if(!r.ok)throw Error('source_http_'+r.status);const reader=r.body.getReader(),chunks=[];let bytes=0;try{for(;;){const x=await reader.read();if(x.done)break;bytes+=x.value.length;if(bytes>5000000)throw Error('source_size');chunks.push(x.value);}}finally{await reader.cancel();}const b=new Uint8Array(bytes);let pos=0;for(const x of chunks){b.set(x,pos);pos+=x.length;}return JSON.parse(new TextDecoder().decode(b));}
export async function fetchHazards({fetcher=fetch,previous=null,now=Date.now()}={}){
 const urls=sourceUrls(now),at=new Date(now).toISOString(),ids=['sifor','ipma','areas','emsc'];
 const results=await Promise.allSettled(ids.map(id=>read(urls[id],fetcher)));const payload=Object.fromEntries(ids.map((id,i)=>[id,results[i]]));
 const areas={};if(payload.areas.status==='fulfilled')for(const row of payload.areas.value.data??[])if(!areas[row.idAreaAviso])areas[row.idAreaAviso]=row;
 const features=[],sources=[];
 for(const id of ['sifor','ipma','emsc']){try{if(payload[id].status!=='fulfilled')throw Error('source_unavailable');const result=normalize(id,payload[id].value,at,areas);features.push(...result.features.map(f=>({...f,properties:{...f.properties,source_state:result.rejected?'partial':'ok'}})));sources.push({id,status:result.rejected?'partial':'ok',retrieved_at:at,count:result.features.length,rejected:result.rejected,ignored:result.ignored,encoding_loss:result.encoding_loss,url:urls[id]});}
 catch{const old=previous?.features?.filter(f=>f.properties?.source===id)??[];features.push(...old.map(f=>({...f,properties:{...f.properties,source_state:'stale'}})));sources.push({id,status:old.length?'stale':'unavailable',retrieved_at:null,count:old.length,rejected:0,encoding_loss:0,url:urls[id]});}}
 return {type:'FeatureCollection',features,metadata:{generated_at:at,sources,screening_only:true,road_closure_inference:false}};
}
