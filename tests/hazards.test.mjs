import {test} from 'node:test';import assert from 'node:assert/strict';
import {normalize,nearby,sourceFresh,clean,distanceM,instant} from '../site/hazard-core.mjs';
import {fetchHazards} from '../site/hazard-sources.mjs';
import {parseLocation} from '../site/locations.mjs';import {requestLocation} from '../site/geolocation.mjs';
const at='2026-10-25T13:00:00Z',now=Date.parse(at);
function fire(state='Em Curso',update=now){return normalize('sifor',{type:'FeatureCollection',features:[{geometry:{type:'Point',coordinates:[-8.43,40.21]},properties:{ID_oc:1,CodNatureza:3103,Natureza:'Mato',EstadoAgrupado:state,Concelho:'Coimbra',DataDosDados:update}}]},at).features[0];}
test('fresh proximity creates attention candidates and never a confirmed closure',()=>{const f=fire();assert.equal(nearby([f],[-8.43,40.211],500,now).length,1);assert.equal(f.properties.closure_confirmed,false);assert.equal(nearby([f],[-9,40],500,now).length,0);assert.ok(distanceM([-8.43,40.21],[-8.43,40.211])>100);});
test('stale, unknown, concluding and unavailable observations cannot condition a road',()=>{for(const f of [fire('Em Conclusão'),fire('Estado desconhecido'),fire('Em Curso',now-3600001),{...fire(),properties:{...fire().properties,source_state:'stale'}}])assert.equal(nearby([f],[-8.43,40.21],1000,now).length,0);assert.equal(sourceFresh(fire('Em Curso',null),now),false);});
test('3D earthquake coordinates retain observation semantics and never become road candidates',()=>{const f=normalize('emsc',{type:'FeatureCollection',features:[{id:'quake',geometry:{type:'Point',coordinates:[-8.43,40.21,5]},properties:{time:at,lastupdate:at,mag:2}}]},at).features[0];assert.equal(f.properties.kind,'earthquake');assert.deepEqual(f.geometry.coordinates,[-8.43,40.21]);assert.equal(nearby([f],[-8.43,40.21],1000,now).length,0);});
test('weather warning representative point is not a precise road hazard',()=>{const f=normalize('ipma',[{idAreaAviso:'CBR',awarenessTypeName:'Vento',awarenessLevelID:'orange',startTime:'2026-10-25T12:00:00',endTime:'2026-10-25T14:00:00'}],at,{CBR:{longitude:-8.43,latitude:40.21,local:'Coimbra'}}).features[0];assert.equal(f.properties.geometry_role,'area_representative');assert.equal(nearby([f],[-8.43,40.21],1000,now).length,0);});
test('source failures preserve age and cannot masquerade as verified zero',async()=>{const old={type:'FeatureCollection',features:[fire()]};const d=await fetchHazards({previous:old,now,fetcher:async()=>{throw Error('offline');}});assert.equal(d.metadata.sources[0].status,'stale');assert.equal(d.features[0].properties.fetched_at,at);assert.equal(sourceFresh(d.features[0],now),false);});
test('invalid coordinates, truncated feed and encoding losses are handled explicitly',()=>{assert.throws(()=>normalize('sifor',{type:'FeatureCollection',features:[],exceededTransferLimit:true},at));assert.equal(clean('Sert\ufffd'),'Designação indisponível na origem');assert.equal(parseLocation('40.21, -8.43').lng,-8.43);assert.equal(parseLocation('40,'),null);assert.equal(parseLocation('91, -8'),null);});
test('denied geolocation retains manual alternatives and never fabricates a position',()=>{let applied=0,message='';requestLocation({getCurrentPosition(_yes,no){no({code:1});}},()=>applied++,s=>{message=s;});assert.equal(applied,0);assert.match(message,/coordenadas/);requestLocation(null,()=>applied++,s=>{message=s;});assert.equal(applied,0);assert.match(message,/zona/);});
test('calendar rollovers and nested ArcGIS truncation flags are rejected',()=>{assert.equal(instant('2026-02-30T12:00:00'),null);assert.equal(instant('2026-10-25T25:00:00Z'),null);assert.equal(instant('2026-10-25T13:00:00'),at.replace('Z','.000Z'));assert.throws(()=>normalize('sifor',{type:'FeatureCollection',features:[],properties:{exceededTransferLimit:true}},at));});


test('road segments show only nearby current events, never stale hazards or earthquake damage',async()=>{
 const {roadScreening,segmentDistanceM}=await import('../site/hazard-core.mjs');
 const now=Date.now(),event={geometry:{type:'Point',coordinates:[-8.43,40.2105]},properties:{kind:'fire',source:'sifor',state:'Em Curso',fetched_at:new Date(now).toISOString(),updated_at:new Date(now).toISOString()}};
 const road=[[-8.44,40.21],[-8.42,40.21]];
 assert.ok(segmentDistanceM(event.geometry.coordinates,...road)<60);
 assert.equal(roadScreening(road,[event],500,now).length,1);
 assert.equal(roadScreening(road,[{...event,properties:{...event.properties,updated_at:new Date(now-7200000).toISOString()}}],500,now).length,0);
 assert.equal(roadScreening(road,[{...event,properties:{...event.properties,kind:'earthquake'}}],500,now).length,0);
 assert.equal(roadScreening([[-9,39],[-9,39.01]],[event],500,now).length,0);
});
test('traffic provider and hazard view remain explicit distinct modes',async()=>{
 const {readFile}=await import('node:fs/promises');const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.equal((html.match(/id="hazards-map"/g)||[]).length,1);assert.ok(html.includes('id="traffic"'));assert.ok(html.includes('id="load-roads"'));
});

test('module selection is bounded and Portugal context keeps static scales and missing data',async()=>{
 const {selectedModule}=await import('../src/products.mjs');const {readFile}=await import('node:fs/promises');
 for(const id of ['floods','seismic','landslides','extreme-weather','roads-incidents'])assert.equal(selectedModule('?module='+id),id);
 assert.equal(selectedModule('?module=admin'),'roads-incidents');
 const lands=JSON.parse(await readFile('site/data/portugal-landslide-susceptibility.geojson','utf8'));
 assert.ok(lands.features.length>5);assert.ok(lands.features.every(f=>f.properties.current_warning===false&&f.properties.resolution_m_approx===1000));
 const er=JSON.parse(await readFile('site/data/portugal-regional-erosion.geojson','utf8'));assert.equal(er.features.length,25);assert.equal(er.features.filter(f=>f.properties.soil_loss_t_ha_year!=null).length,23);assert.ok(er.features.every(f=>f.properties.reference_year===2016&&f.properties.road_closure_inference===false));
});
