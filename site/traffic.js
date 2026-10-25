import {liveTrafficLinks} from './roads-live.js';
const zones={lisboa:{lat:38.72,lng:-9.14,zoom:12},coimbra:{lat:40.21,lng:-8.43,zoom:12},porto:{lat:41.15,lng:-8.61,zoom:12},portugal:{lat:39.6,lng:-8.0,zoom:7},madeira:{lat:32.66,lng:-16.92,zoom:12},acores:{lat:37.74,lng:-25.67,zoom:12}};
const place=document.querySelector('#place'),frame=document.querySelector('#traffic'),note=document.querySelector('#source-note');
function waze(){const links=liveTrafficLinks(zones[place.value]);frame.title='Waze Live Map — trânsito em direto, visualizador original';frame.src=links.waze;document.querySelector('#google').href=links.google;note.textContent='Waze Live Map · informação apresentada e atualizada pelo Waze, conforme cobertura disponível.';}
place.onchange=waze;document.querySelector('#waze').onclick=waze;
document.querySelector('#ip').onclick=()=>{frame.title='Infraestruturas de Portugal — visualizador oficial de trânsito';frame.src='https://infraestruturas.maps.arcgis.com/apps/instant/basic/index.html?appid=4092ca606ea04621be26aa4ec784e069';note.textContent='Infraestruturas de Portugal · condicionamentos na rede coberta pelo visualizador oficial.';};
waze();
