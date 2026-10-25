import {VectorTile} from '@mapbox/vector-tile';
import {PbfReader} from 'pbf';
const cache=new Map();
const xTile=(lon,z)=>Math.floor((lon+180)/360*2**z);
const yTile=(lat,z)=>Math.floor((1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*2**z);
const allowed=new Set(['motorway','trunk','primary','secondary','tertiary','minor','service']);
export async function fetchRoadVectors({south,west,north,east},{fetcher=fetch}={}){
 if(![south,west,north,east].every(Number.isFinite)||south>=north||west>=east||south<29||north>45||west< -33||east>5||north-south>.12||east-west>.18)throw Error('bounds');
 let meta=cache.get('metadata');if(!meta){const r=await fetcher('https://tiles.openfreemap.org/planet',{signal:AbortSignal.timeout(12000),redirect:'error'});if(!r.ok)throw Error('metadata');meta=await r.json();if(!/^https:\/\/tiles\.openfreemap\.org\/planet\/[a-zA-Z0-9_-]+\/\{z\}\/\{x\}\/\{y\}\.pbf$/.test(meta.tiles?.[0]))throw Error('template');cache.set('metadata',meta);}
 const z=13,jobs=[];for(let x=xTile(west,z);x<=xTile(east,z);x++)for(let y=yTile(north,z);y<=yTile(south,z);y++)jobs.push({x,y});if(jobs.length>12)throw Error('tiles');
 const roads=[];for(let i=0;i<jobs.length;i+=4){const result=await Promise.all(jobs.slice(i,i+4).map(async({x,y})=>{
  const url=meta.tiles[0].replace('{z}',z).replace('{x}',x).replace('{y}',y);let bytes=cache.get(url);
  if(!bytes){const r=await fetcher(url,{signal:AbortSignal.timeout(15000),redirect:'error'});if(!r.ok)throw Error('tile');bytes=new Uint8Array(await r.arrayBuffer());if(bytes.length>2000000)throw Error('size');if(cache.size>50)cache.delete([...cache.keys()].find(k=>k!=='metadata'));cache.set(url,bytes);}
  const tile=new VectorTile(new PbfReader(bytes)),layer=tile.layers.transportation,out=[];if(!layer)return out;if(layer.length>20000)throw Error('features');
  for(let n=0;n<layer.length;n++){const f=layer.feature(n);if(f.type!==2||!allowed.has(f.properties.class))continue;const geo=f.toGeoJSON(x,y,z);const lines=geo.geometry.type==='LineString'?[geo.geometry.coordinates]:geo.geometry.type==='MultiLineString'?geo.geometry.coordinates:[];for(const geometry of lines){if(geometry.length<2||geometry.length>2000||!geometry.every(p=>p.length===2&&p.every(Number.isFinite)))continue;const name=String(f.properties.ref||f.properties.name||'Via cartográfica - '+f.properties.class).slice(0,150);let run=[];for(let k=1;k<geometry.length;k++){const a=geometry[k-1],b=geometry[k],hit=Math.max(a[0],b[0])>=west&&Math.min(a[0],b[0])<=east&&Math.max(a[1],b[1])>=south&&Math.min(a[1],b[1])<=north;if(hit){if(!run.length)run.push(a);run.push(b);}else if(run.length){out.push({name,geometry:run});run=[];}}if(run.length)out.push({name,geometry:run});}}
  return out;
 }));roads.push(...result.flat());}
 if(roads.reduce((n,r)=>n+r.geometry.length-1,0)>20000)throw Error('segments');return roads;
}
