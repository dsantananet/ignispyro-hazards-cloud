import {liveTrafficLinks} from './roads-live.js';
import {zones} from './locations.mjs';
const place=document.querySelector('#place'),frame=document.querySelector('#traffic'),note=document.querySelector('#source-note');
const requested=new URLSearchParams(location.search).get('zone');if(zones[requested])place.value=requested;
let zone=zones[place.value];
function waze(){const links=liveTrafficLinks(zone);frame.title='Waze Live Map — trânsito em direto, visualizador original';frame.src=links.waze;document.querySelector('#google').href=links.google;note.textContent='Waze Live Map · informação apresentada e atualizada pelo Waze, conforme cobertura disponível.';}
place.onchange=()=>{zone=zones[place.value];waze();window.dispatchEvent(new CustomEvent('ignispyro-zone',{detail:zone}));};document.querySelector('#waze').onclick=waze;
window.addEventListener('ignispyro-traffic-zone',event=>{zone=event.detail;waze();});
document.querySelector('#ip').onclick=()=>{frame.title='Infraestruturas de Portugal — visualizador oficial de trânsito';frame.src='https://infraestruturas.maps.arcgis.com/apps/instant/basic/index.html?appid=4092ca606ea04621be26aa4ec784e069';note.textContent='Infraestruturas de Portugal · condicionamentos na rede coberta pelo visualizador oficial.';};
waze();
