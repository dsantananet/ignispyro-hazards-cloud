export const MAX_AGE=3600000;
export function clean(value){const s=String(value??'');return s.includes('\ufffd')?'Designação indisponível na origem':s.slice(0,800);}
export function instant(value){
 if(value===null||value===undefined||value==='')return null;
 let d;if(typeof value==='number')d=new Date(value);else{
  const s=String(value),m=s.match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)(?::(\d\d)(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)?$/);if(!m)return null;
  const [y,month,day,hour,minute,second]=m.slice(1).map(x=>Number(x??0)),check=new Date(Date.UTC(y,month-1,day,hour,minute,second));
  if(check.getUTCFullYear()!==y||check.getUTCMonth()!==month-1||check.getUTCDate()!==day||check.getUTCHours()!==hour||check.getUTCMinutes()!==minute||check.getUTCSeconds()!==second)return null;
  d=new Date(/Z$|[+-]\d\d:\d\d$/.test(s)?s:s+'Z');
 }return Number.isFinite(+d)?d.toISOString():null;
}
export function coordinates(lon,lat){return typeof lon==='number'&&typeof lat==='number'&&Number.isFinite(lon)&&Number.isFinite(lat)&&lat>=29&&lat<=45&&lon>=-33&&lon<=5;}
const fold=v=>String(v??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
export function natureKind(code,nature){const s=fold(nature);if(code>=3101&&code<=3108)return 'fire';if(/inund|cheia/.test(s))return 'flood';if(/movimento de massa|desliz|derroc/.test(s))return 'landslide';if(/colis|despiste|atropel|acidente.*via|acidente.*rodov/.test(s))return 'road_incident';if(/queda.*arvor|queda.*estrutura/.test(s))return 'obstruction';return 'other';}
export function normalize(source,data,fetchedAt,areas={}){
 const features=[];let rejected=0,ignored=0,encodingLoss=0;
 const push=(id,lon,lat,p)=>{if(!coordinates(lon,lat))throw Error('coordinates');features.push({type:'Feature',id:`${source}:${id}`,geometry:{type:'Point',coordinates:[lon,lat]},properties:{...p,source,fetched_at:fetchedAt,closure_confirmed:false}});};
 if(source==='sifor'||source==='emsc'){
  if(data?.type!=='FeatureCollection'||!Array.isArray(data.features)||data.features.length>2000||data.exceededTransferLimit||data.properties?.exceededTransferLimit)throw Error('incomplete_feed');
  for(const f of data.features){try{const p=f.properties;if(!p)throw Error('properties');const xy=f.geometry?.type==='Point'?f.geometry.coordinates:[Number(p.Longitude),Number(p.Latitude)];
   if(source==='sifor'){
    const code=Number(p.CodNatureza);if(!Number.isFinite(code)||p.ID_oc==null)throw Error('identity');
    const state=clean(p.EstadoAgrupado);if(natureKind(code,p.Natureza)==='other'||/encerrad|anulad|extint/.test(fold(state))){ignored++;continue;}
    if([p.Concelho,p.Freguesia,p.Natureza].some(v=>String(v).includes('\ufffd')))encodingLoss++;
    push(p.ID_oc,xy[0],xy[1],{kind:natureKind(code,p.Natureza),title:clean(p.Natureza),area:clean(p.Concelho),parish:clean(p.Freguesia),state,updated_at:instant(p.DataDosDados),observed_at:instant(p.DataInicioOcorrencia),source_time_original:clean(p.DataInicioOcorrencia),geometry_role:'event_point',source_url:'https://www.sgifr.gov.pt/ocorrencias',attribution:'Fonte: ©SIFOR - Sistema de Informação de Fogos Rurais; ANEPC',license:'SIFOR terms: attribution; noncommercial research',license_url:'https://www.sgifr.gov.pt/termos-e-condicoes'});
   }else{
    const at=instant(p.time);if(!at||Date.parse(at)>Date.parse(fetchedAt)+60000||Date.parse(fetchedAt)-Date.parse(at)>7*86400000){ignored++;continue;}
    if(f.id==null&&p.unid==null)throw Error('event_id');
    push(f.id??p.unid,xy[0],xy[1],{kind:'earthquake',title:clean(p.flynn_region),area:clean(p.flynn_region),state:'Observação sísmica',observed_at:at,updated_at:instant(p.lastupdate),magnitude:p.mag==null?null:Number(p.mag),geometry_role:'observation_point',source_url:'https://www.seismicportal.eu/',attribution:'EMSC-CSEM SeismicPortal; '+clean(p.auth),license:'CC-BY-4.0',license_url:'https://www.seismicportal.eu/terms.html'});
   }
  }catch{rejected++;}}
 }else if(source==='ipma'){
  if(!Array.isArray(data)||data.length>2000)throw Error('warning_shape');
  for(const p of data){try{const from=instant(p.startTime),until=instant(p.endTime);if(!from||!until||until<from)throw Error('warning_time');if(!['yellow','orange','red'].includes(p.awarenessLevelID)||Date.parse(from)>Date.parse(fetchedAt)||Date.parse(until)<Date.parse(fetchedAt)){ignored++;continue;}
   const a=areas[p.idAreaAviso];if(!a)throw Error('area_geometry');
   push([p.idAreaAviso,p.awarenessTypeName,from,until].join(':'),Number(a.longitude),Number(a.latitude),{kind:'weather',title:clean(p.awarenessTypeName),area:clean(a.local),state:p.awarenessLevelID,description:clean(p.text),valid_from:from,valid_until:until,updated_at:null,geometry_role:'area_representative',source_url:'https://www.ipma.pt/pt/otempo/prev-sam/',attribution:'IPMA, I.P.',license:'IPMA API: public noncommercial use with attribution',license_url:'https://api.ipma.pt/#termos'});
  }catch{rejected++;}}
 }else throw Error('unknown_source');
 return {features,rejected,ignored,encoding_loss:encodingLoss};
}
export function sourceFresh(f,now=Date.now()){
 const p=f.properties,t=Date.parse(p.fetched_at);if(!Number.isFinite(t)||now<t-60000||now-t>MAX_AGE||p.source_state==='stale'||p.source_state==='unavailable')return false;
 if(p.kind==='weather')return Date.parse(p.valid_from)<=now&&now<=Date.parse(p.valid_until);
 if(p.source==='sifor'){const u=Date.parse(p.updated_at);return Number.isFinite(u)&&now-u<=MAX_AGE&&u<=now+300000;}
 return true;
}
export function distanceM(a,b){const r=Math.PI/180,[x,y]=a,[u,v]=b,dy=(v-y)*r,dx=(u-x)*r;return 12742000*Math.asin(Math.min(1,Math.sqrt(Math.sin(dy/2)**2+Math.cos(y*r)*Math.cos(v*r)*Math.sin(dx/2)**2)));}
export function nearby(features,point,radius=1000,now=Date.now()){
 if(!coordinates(...point)||!Number.isFinite(radius)||radius<100||radius>5000)throw Error('invalid_screening');
 return features.filter(f=>sourceFresh(f,now)&&['fire','flood','landslide','road_incident','obstruction'].includes(f.properties.kind)&&['em curso','em despacho','em resolucao'].includes(fold(f.properties.state).trim())).map(f=>({feature:f,distance_m:Math.round(distanceM(point,f.geometry.coordinates))})).filter(x=>x.distance_m<=radius).sort((a,b)=>a.distance_m-b.distance_m);
}

// Local planar distance is only used for exploratory screening over short road segments.
export function segmentDistanceM(point,a,b){
 if(![point,a,b].every(p=>Array.isArray(p)&&coordinates(...p)))return Infinity;
 const sy=111195,sx=sy*Math.cos(point[1]*Math.PI/180);
 const ax=(a[0]-point[0])*sx,ay=(a[1]-point[1])*sy,bx=(b[0]-point[0])*sx,by=(b[1]-point[1])*sy;
 const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,(-(ax*dx+ay*dy))/(dx*dx+dy*dy||1)));
 return Math.hypot(ax+t*dx,ay+t*dy);
}
export function roadScreening(road,features,radius=500,now=Date.now()){
 if(!Array.isArray(road)||road.length<2||road.length>10000||!Number.isFinite(radius)||radius<100||radius>2000)return [];
 const active=features.filter(f=>sourceFresh(f,now)&&['fire','flood','landslide','road_incident','obstruction'].includes(f.properties.kind)&&['em curso','em despacho','em resolucao'].includes(fold(f.properties.state).trim()));
 return active.map(feature=>({feature,distance_m:Math.round(Math.min(...road.slice(1).map((b,i)=>segmentDistanceM(feature.geometry.coordinates,road[i],b))))})).filter(x=>x.distance_m<=radius);
}
