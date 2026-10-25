import {liveTrafficLinks} from './roads-live.js';
import {zones} from './locations.mjs';
const place=document.querySelector('#place');
const requested=new URLSearchParams(location.search).get('zone');if(zones[requested])place.value=requested;
let zone=zones[place.value];
function links(){const frame=document.querySelector('#traffic');if(frame?.dataset.provider!=='ip'&&frame?.src)frame.src=liveTrafficLinks(zone).waze;document.querySelector('#google').href=liveTrafficLinks(zone).google;}
place.onchange=()=>{zone=zones[place.value];links();window.dispatchEvent(new CustomEvent('ignispyro-zone',{detail:zone}));};
window.addEventListener('ignispyro-map-center',event=>{zone=event.detail;links();});
document.querySelector('#waze').onclick=()=>{const frame=document.querySelector('#traffic');frame.dataset.provider='waze';frame.src=liveTrafficLinks(zone).waze;frame.title='Trânsito Waze em direto';window.dispatchEvent(new Event('ignispyro-show-traffic'));};
document.querySelector('#ip').onclick=()=>{const frame=document.querySelector('#traffic');frame.dataset.provider='ip';frame.src='https://infraestruturas.maps.arcgis.com/apps/instant/basic/index.html?appid=4092ca606ea04621be26aa4ec784e069';frame.title='Condicionamentos oficiais IP';window.dispatchEvent(new Event('ignispyro-show-traffic'));};
links();
