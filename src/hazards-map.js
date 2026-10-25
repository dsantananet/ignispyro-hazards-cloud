import {fetchRoadVectors} from './roads-vector.mjs';
import {fetchHazards} from '../site/hazard-sources.mjs';
import {sourceFresh,nearby,coordinates,roadScreening} from '../site/hazard-core.mjs';
import {zones,parseLocation} from '../site/locations.mjs';
import {requestLocation} from '../site/geolocation.mjs';
const $=id=>document.getElementById(id),names={fire:'Incêndio',flood:'Inundação / cheia',landslide:'Movimento de massa',road_incident:'Ocorrência rodoviária',obstruction:'Obstrução',weather:'Aviso meteorológico',earthquake:'Sismo observado',other:'Outra ocorrência'};
const colors={fire:'#f27830',flood:'#36a7ff',landslide:'#c59a68',road_incident:'#df668a',obstruction:'#ddad50',weather:'#f5bb3a',earthquake:'#7bbfff',other:'#a9a1ce'};
const map=L.map('hazards-map',{scrollWheelZoom:false}).fitBounds([[36.8,-9.6],[42.2,-6.1]]);
map.attributionControl.addAttribution('<a href="https://openfreemap.org/">OpenFreeMap</a> · ©OpenMapTiles · <a href="https://www.openstreetmap.org/copyright">ODbL</a>');
const requestedZone=new URLSearchParams(location.search).get('zone');if(zones[requestedZone]){const z=zones[requestedZone];if(z.bounds)map.fitBounds(z.bounds);else map.setView([z.lat,z.lng],z.zoom);}
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
const points=L.layerGroup().addTo(map);let dataset={features:[],metadata:{sources:[]}},selection,selectedMarker,rangeCircle,accuracyCircle,busy=false;
const date=v=>v?new Date(v).toLocaleString('pt-PT',{timeZone:'UTC'})+' UTC':'não fornecida';
function text(tag,value){const node=document.createElement(tag);node.textContent=value;return node;}
function screen(){if(!selection)return;const radius=Number($('screen-radius').value),matches=nearby(dataset.features,selection,radius);$('nearby').replaceChildren(text('p',matches.length?`${matches.length} ocorrência(s) atual(is) localizada(s) a até ${radius} m. Verificar possíveis condicionamentos com as autoridades; não é um corte confirmado.`:`Sem ocorrência atual localizada a até ${radius} m na amostra disponível. Dados em falta ou antigos não permitem garantir circulação livre.`));
 for(const x of matches){const p=x.feature.properties;$('nearby').append(text('p',`${names[p.kind]} · ${p.area} · ${p.state} · ${x.distance_m} m`));}if(rangeCircle)rangeCircle.setRadius(radius);}
function select(lat,lng,{accuracy=null,zoom=14}={}){if(!coordinates(lng,lat)){ $('location-status').textContent='Escolhe uma localização na área de Portugal e Atlântico acompanhada por esta aplicação.';return false; }selection=[lng,lat];map.setView([lat,lng],zoom);if(selectedMarker)map.removeLayer(selectedMarker);if(rangeCircle)map.removeLayer(rangeCircle);if(accuracyCircle)map.removeLayer(accuracyCircle);selectedMarker=L.marker([lat,lng]).addTo(map).bindPopup('Ponto escolhido para triagem de proximidade; não certifica um troço ou uma rota.');rangeCircle=L.circle([lat,lng],{radius:Number($('screen-radius').value),color:'#70d4d4',weight:2,fillOpacity:.06}).addTo(map);if(accuracy)accuracyCircle=L.circle([lat,lng],{radius:accuracy,color:'#fff',weight:1,fillOpacity:0}).addTo(map);$('coordinates').value=`${lat.toFixed(5)}, ${lng.toFixed(5)}`;screen();return true;}
function render(){points.clearLayers();const now=Date.now(),enabled=new Set([...document.querySelectorAll('[data-kind]:checked')].map(e=>e.dataset.kind));let visible=0,old=0;
 for(const f of dataset.features){const p=f.properties;if(!enabled.has(p.kind))continue;const [lon,lat]=f.geometry.coordinates;if(!coordinates(lon,lat))continue;const fresh=sourceFresh(f,now);if(!fresh)old++;const color=fresh?(p.kind==='weather'?({yellow:'#f3ce48',orange:'#f28a34',red:'#e44c55'}[p.state]||'#aaa'):colors[p.kind]):'#8a979f';const point=L.circleMarker([lat,lon],{radius:p.kind==='fire'?8:6,color:'#102733',weight:1,fillColor:color,fillOpacity:.9});const node=document.createElement('div');node.append(text('strong',names[p.kind]),text('p',p.title),text('p',`${p.area}${p.parish?' · '+p.parish:''} · ${p.state}`),text('p',`${fresh?'Dentro da janela de atualidade adotada':'Dados antigos ou atualidade por confirmar'}. Publicação: ${date(p.updated_at)}. Recolha: ${date(p.fetched_at)}.`));
  if(p.kind==='earthquake')node.append(text('p',`Magnitude ${p.magnitude??'não fornecida'} · observado em ${date(p.observed_at)}. Não demonstra dano ou corte de estrada.`));
  if(p.geometry_role==='area_representative')node.append(text('p','Ponto representativo da área de aviso IPMA. Não é a geometria da área afetada nem um perigo localizado nesta coordenada.'));
  if(p.source_time_original)node.append(text('p','Início indicado pela fonte: '+p.source_time_original+' (formato original).'));
  node.append(text('small',p.attribution));const link=document.createElement('a');link.href=p.source_url;link.target='_blank';link.rel='noopener';link.textContent='Consultar fonte';node.append(document.createElement('br'),link);point.bindPopup(node).bindTooltip(`${names[p.kind]} · ${p.area}`).addTo(points);const shape=point.getElement();if(shape){shape.setAttribute('data-hazard',p.kind);shape.setAttribute('aria-label',`${names[p.kind]} · ${p.area} · ${fresh?'registo dentro da janela':'atualidade por confirmar'}`);shape.setAttribute('role','button');shape.setAttribute('tabindex','0');shape.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();point.openPopup();}});}visible++;
 }
 $('hazards-count').textContent=`${visible} registos representados · ${old} com atualização antiga ou desconhecida. Sem dados não significa ausência de perigo.`;
 $('source-status').replaceChildren();for(const s of dataset.metadata?.sources??[]){const ff=dataset.features.filter(f=>f.properties.source===s.id),fresh=ff.filter(f=>sourceFresh(f)).length;$('source-status').append(text('li',`${s.id.toUpperCase()}: ${s.status} · ${ff.length} registos · ${fresh} dentro da janela adotada · recolha ${date(s.retrieved_at)}${s.encoding_loss?' · texto degradado na origem':''}`));}
 screen();renderRoads();
}
async function refresh(){if(busy)return;busy=true;$('refresh-hazards').disabled=true;$('hazards-count').textContent='A consultar fontes de ocorrências e avisos…';try{const data=await fetchHazards({previous:dataset});dataset=data;render();}finally{busy=false;$('refresh-hazards').disabled=false;}}
for(const checkbox of document.querySelectorAll('[data-kind]'))checkbox.onchange=render;
$('screen-radius').onchange=screen;$('refresh-hazards').onclick=refresh;
map.on('click',event=>{select(event.latlng.lat,event.latlng.lng,{zoom:map.getZoom()});$('location-status').textContent='Ponto escolhido no mapa. A análise é de proximidade; não é uma validação de estrada.';});
$('coordinates-form').onsubmit=event=>{event.preventDefault();const point=parseLocation($('coordinates').value);if(!point){$('location-status').textContent='Usa latitude, longitude; por exemplo 40.21, -8.43.';return;}select(point.lat,point.lng);$('location-status').textContent='Localização manual aplicada ao mapa de eventos.';};
$('locate').onclick=()=>requestLocation(navigator.geolocation,select,message=>{$('location-status').textContent=message;});
window.addEventListener('ignispyro-zone',event=>{const z=event.detail;if(z.bounds)map.fitBounds(z.bounds);else map.setView([z.lat,z.lng],z.zoom);});
map.on('moveend',()=>{const c=map.getCenter();window.dispatchEvent(new CustomEvent('ignispyro-map-center',{detail:{lat:c.lat,lng:c.lng,zoom:map.getZoom()}}));});
const roadLayer=L.layerGroup().addTo(map);let roadWays=[],roadQueryAt=null,roadNextAt=0;
function renderRoads(){
 roadLayer.clearLayers();let affected=0,total=0;const enabled=new Set([...document.querySelectorAll('[data-kind]:checked')].map(e=>e.dataset.kind)),events=dataset.features.filter(f=>enabled.has(f.properties.kind));
 for(const way of roadWays){for(let i=1;i<way.geometry.length;i++){
  const a=way.geometry[i-1],b=way.geometry[i],matches=roadScreening([a,b],events,500);total++;if(matches.length)affected++;
  const line=L.polyline([[a[1],a[0]],[b[1],b[0]]],{color:matches.length?'#f29128':'#397da4',weight:matches.length?7:3,opacity:matches.length?.95:.45,dashArray:matches.length?'10 7':null});
  const node=document.createElement('div');node.append(text('strong',way.name),text('p',matches.length?'Possível condicionamento por proximidade (até 500 m). Não confirma corte nem impacto físico.':'Geometria OpenStreetMap. Estado de circulação desconhecido.'));
  for(const m of matches)node.append(text('p',`${names[m.feature.properties.kind]} · ${m.feature.properties.area} · aproximadamente ${m.distance_m} m`));
  node.append(text('small','© OpenStreetMap contributors · ODbL · consulta '+date(roadQueryAt)));line.bindPopup(node).addTo(roadLayer);
 }}
 points.eachLayer(point=>point.bringToFront?.());
 if(roadWays.length)$('roads-status').textContent=`${total} segmentos cartográficos consultados; ${affected} com possível condicionamento por ocorrência atual próxima. Regra exploratória de 500 m, sem confirmação de corte. Não se medem velocidades ou congestionamento.`;
}
$('load-roads').onclick=async()=>{
 if(Date.now()<roadNextAt){$('roads-status').textContent='Aguarda um minuto entre consultas da rede viária para respeitar a fonte gratuita.';return;}
 const box=map.getBounds();if(map.getZoom()<13||box.getNorth()-box.getSouth()>.12||box.getEast()-box.getWest()>.18){$('roads-status').textContent='Aproxima o mapa a uma localidade (zoom 13 ou superior) para consultar as vias sem sobrecarregar a fonte gratuita.';return;}
 roadNextAt=Date.now()+60000;$('load-roads').disabled=true;roadWays=[];roadLayer.clearLayers();$('roads-status').textContent='A consultar a rede viária desta zona…';
 try{roadWays=await fetchRoadVectors({south:box.getSouth(),west:box.getWest(),north:box.getNorth(),east:box.getEast()});roadQueryAt=new Date().toISOString();renderRoads();if(!roadWays.length)$('roads-status').textContent='Sem geometria viária devolvida para esta zona; circulação desconhecida.';
 }catch{roadWays=[];roadLayer.clearLayers();$('roads-status').textContent='Rede viária indisponível ou resposta incompleta. Não foi possível avaliar os troços; circulação desconhecida.';}finally{$('load-roads').disabled=false;}
};
try{const r=await fetch(new URL('./data/hazards.geojson',import.meta.url),{cache:'no-store',signal:AbortSignal.timeout(10000)});if(r.ok){const d=await r.json();if(d.type==='FeatureCollection'&&Array.isArray(d.features)&&d.features.length<=6000){dataset=d;render();}}}catch{}
await refresh();setInterval(()=>{if(!document.hidden)refresh();},300000);
