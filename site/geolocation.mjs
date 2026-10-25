export function requestLocation(provider,apply,report){
 if(!provider?.getCurrentPosition){report('Este navegador não fornece localização. Escolhe a zona, as coordenadas ou um ponto no mapa.');return;}
 report('A pedir localização ao navegador…');
 provider.getCurrentPosition(p=>{if(apply(p.coords.latitude,p.coords.longitude,{accuracy:p.coords.accuracy})===false)return;report(`Localização recebida, precisão indicada de ${Math.round(p.coords.accuracy)} m. Localização aplicada ao mapa de trânsito.`);},()=>{report('Localização não autorizada ou indisponível. Podes permitir o acesso nas definições do site, escolher uma zona ou indicar coordenadas.');},{enableHighAccuracy:false,timeout:12000,maximumAge:60000});
}
