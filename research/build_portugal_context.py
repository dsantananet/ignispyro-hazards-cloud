"""Reproduce bounded Portugal context from official NASA/Eurostat data, never warnings."""
import sys,json,hashlib
from pathlib import Path
from datetime import datetime,timezone
import numpy as np
import rasterio
from rasterio.features import shapes
from shapely.geometry import shape,mapping
from shapely.ops import unary_union
from shapely.validation import make_valid
root=Path('.');folder=root/'site/data';folder.mkdir(exist_ok=True)
countries=json.loads((root/'.runtime/nasa/countries.geojson').read_text(encoding='utf-8'))
country=next(shape(f['geometry']) for f in countries['features'] if f['properties'].get('ADM0_A3')=='PRT')
features=[]
for region in ['mainland','madeira','azores']:
 path=root/'.runtime/nasa'/('portugal-'+region+'.tif')
 with rasterio.open(path) as src:
  a=src.read(1);assert src.count==1 and src.crs.to_epsg()==4326 and set(np.unique(a))<=set(range(6))
  groups={i:[] for i in range(1,6)}
  for geom,value in shapes(a,mask=a>0,transform=src.transform):
   g=shape(geom).intersection(country)
   if not g.is_empty:groups[int(value)].append(g)
  for code,parts in groups.items():
   if not parts:continue
   geom=unary_union(parts).simplify(.001,preserve_topology=True)
   features.append(dict(type='Feature',geometry=mapping(geom),properties=dict(region=region,susceptibility_class=code,product='static_landslide_susceptibility',source='NASA GSFC / Stanley & Kirschbaum 2017',resolution_m_approx=1000,reference='https://doi.org/10.1007/s11069-017-2757-y',current_warning=False,road_closure_inference=False)))
meta=dict(generated_at=datetime.now(timezone.utc).isoformat(),source='https://gis.earthdata.nasa.gov/portal/home/item.html?id=d9c8e1279e3e48c2ab3dd318a6649b3a',license='NASA Earth science open data; attribution',country_clip='Natural Earth 1:10m, public domain; approximate, not CAOP',limitations=['Static 1km landslide susceptibility, not erosion rate or current instability','No cadastral or road-segment interpretation','0 is no data and is omitted'],sha256={r:hashlib.sha256((root/'.runtime/nasa'/('portugal-'+r+'.tif')).read_bytes()).hexdigest() for r in ['mainland','madeira','azores']})
def rounded(v):
 if isinstance(v,float):return round(v,5)
 if isinstance(v,(list,tuple)):return [rounded(x) for x in v]
 if isinstance(v,dict):return {k:rounded(x) for k,x in v.items()}
 return v
features=rounded(features)
def polygon_parts(g):
 if g.geom_type=='Polygon':return [g]
 if hasattr(g,'geoms'):return [p for x in g.geoms for p in polygon_parts(x)]
 return []
for f in features:
 g=shape(f['geometry'])
 if not g.is_valid:g=unary_union(polygon_parts(make_valid(g)))
 assert g.is_valid and not g.is_empty and g.geom_type in ['Polygon','MultiPolygon']
 f['geometry']=mapping(g)
meta['geometry_processing']='coordinates rounded to5decimals; invalid rings repaired; zero-area remnants omitted'

(folder/'portugal-landslide-susceptibility.geojson').write_text(json.dumps(dict(type='FeatureCollection',features=features,metadata=meta),ensure_ascii=False,separators=(',',':')),encoding='utf-8')
nuts=json.loads((root/'.runtime/modules/nuts2021.geojson').read_text(encoding='utf-8'));data=json.loads((root/'.runtime/modules/erosion.json').read_text(encoding='utf-8'));assert data['id']==['freq','levels','clc18','unit','geo','time'] and data['size'][:4]==[1,1,1,1] and data['size'][-1]==1
index=data['dimension']['geo']['category']['index'];values=data.get('value',{});flags=data.get('status',{});out=[]
for f in nuts['features']:
 p=f['properties'];code=p['NUTS_ID']
 if not code.startswith('PT'):continue
 i=index.get(code);v=values.get(str(i)) if i is not None else None
 f['properties']=dict(nuts_id=code,name=p.get('NAME_LATN',p.get('NUTS_NAME',code)),reference_year=2016,soil_loss_t_ha_year=v,source_flag=flags.get(str(i)),source='Eurostat aei_pr_soiler / JRC RUSLE',cover='Agricultural, forest and seminatural land excluding bare rock/beaches',product='regional_modelled_soil_loss',geometry_version='NUTS2021',current_warning=False,road_closure_inference=False)
 out.append(f)
(folder/'portugal-regional-erosion.geojson').write_text(json.dumps(dict(type='FeatureCollection',features=out,metadata=dict(reference_year=2016,source_updated=data['updated'],source='https://ec.europa.eu/eurostat/cache/metadata/EN/aei_pr_soiler_esms.htm',geometry_source='GISCO NUTS2021 1:3million',geometry_attribution='© EuroGeographics para os limites administrativos',geometry_license='GISCO noncommercial terms; statistical reuse with attribution',limitations=['Regional mean, not parcel soil loss or landslide probability','Null is unknown, not zero; island coverage follows source','Historical modelled annual loss, not current road impact'])),ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(json.dumps({'landslide_features':len(features),'erosion_regions':len(out),'erosion_with_values':sum(f['properties']['soil_loss_t_ha_year'] is not None for f in out)}))
