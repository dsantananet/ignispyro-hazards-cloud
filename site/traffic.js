import {liveTrafficLinks} from './roads-live.js';
import {zones} from './locations.mjs';
const place=document.querySelector('#place');
const requested=new URLSearchParams(location.search).get('zone');if(zones[requested])place.value=requested;
let zone=zones[place.value];
function links(){document.querySelector('#google').href=liveTrafficLinks(zone).google;}
place.onchange=()=>{zone=zones[place.value];links();window.dispatchEvent(new CustomEvent('ignispyro-zone',{detail:zone}));};
window.addEventListener('ignispyro-map-center',event=>{zone=event.detail;links();});
document.querySelector('#waze').onclick=()=>window.open(liveTrafficLinks(zone).waze,'_blank','noopener');
document.querySelector('#ip').onclick=()=>window.open('https://infraestruturas.maps.arcgis.com/apps/instant/basic/index.html?appid=4092ca606ea04621be26aa4ec784e069','_blank','noopener');
links();
