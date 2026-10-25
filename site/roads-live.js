export function liveTrafficLinks({lat=40.21,lng=-8.43,zoom=12}={}){
 if(!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lng)||Math.abs(lng)>180)throw Error('invalid_map_center');
 const level=Math.max(3,Math.min(17,Math.round(Number.isFinite(zoom)?zoom:12)));
 const waze=new URL('https://embed.waze.com/pt-PT/iframe');
 waze.search=new URLSearchParams({lat:lat.toFixed(5),lon:lng.toFixed(5),zoom:String(level)});
 const google=new URL('https://www.google.com/maps/@');
 google.search=new URLSearchParams({api:'1',map_action:'map',center:`${lat.toFixed(5)},${lng.toFixed(5)}`,zoom:String(level),basemap:'roadmap',layer:'traffic'});
 return {waze:waze.href,google:google.href};
}
