"""Intersect supplied, documented high burn severity with static context, never current closures.

Usage: python research/cross_postfire.py severity.geojson output.geojson
Requires shapely. No severity input is inferred from exposed soil, slope or an empty file.
"""
import json,sys
from pathlib import Path
from shapely.geometry import shape,mapping
from shapely.validation import make_valid

def cross(severity,nasa,erosion):
    meta=severity.get('metadata',{})
    if meta.get('product')!='burn_severity' or not meta.get('source_url','').startswith('https://') or not meta.get('observed_at') or meta.get('synthetic') is not False:
        raise ValueError('A real, dated burn-severity source is required; land-cover change is not burn severity')
    if meta.get('index') not in ['dNBR','RdNBR','RBR'] or not meta.get('classification_method'):
        raise ValueError('Burn index and classification provenance required')
    if not isinstance(severity.get('features'),list) or len(severity['features'])>1000:raise ValueError('bounded_feature_collection_required')
    high=[f for f in severity['features'] if f.get('properties',{}).get('severity_class')=='high']
    if not high:raise ValueError('No verified high-severity polygons supplied; no zero-risk conclusion')
    susceptibility=[(shape(f['geometry']),f['properties']) for f in nasa['features'] if f['properties']['susceptibility_class']>=4]
    regions=[(shape(f['geometry']),f['properties']) for f in erosion['features']]
    output=[]
    for f in high:
        if f.get('geometry',{}).get('type') not in ['Polygon','MultiPolygon']:raise ValueError('severity_polygons_required')
        footprint=shape(f['geometry'])
        if not footprint.is_valid:raise ValueError('invalid_severity_geometry')
        for g,p in susceptibility:
            if not footprint.intersects(g):continue
            overlap=footprint.intersection(g)
            for region,q in regions:
                if not overlap.intersects(region):continue
                polygon=make_valid(overlap.intersection(region))
                if polygon.is_empty or polygon.area<=0:continue
                output.append(dict(type='Feature',geometry=mapping(polygon),properties=dict(product='postfire_context_overlap',severity_class='high',severity_source=meta['source_url'],observed_at=meta['observed_at'],susceptibility_class=p['susceptibility_class'],soil_loss_t_ha_year=q['soil_loss_t_ha_year'],erosion_reference_year=q['reference_year'],nuts_id=q['nuts_id'],current_warning=False,road_closure_confirmed=False,validated=False)))
    return dict(type='FeatureCollection',features=output,metadata=dict(product='postfire_context_overlap',severity_provenance=meta,validated=False,limitations=['Spatial overlap of independent products, not a calibrated instability probability','NASA about1km; erosion regional2016; never road-level proof of damage','No confirmed road closure inferred']))

if __name__=='__main__':
    base=Path(__file__).resolve().parents[1]/'site/data'
    result=cross(json.loads(Path(sys.argv[1]).read_text(encoding='utf-8')),json.loads((base/'portugal-landslide-susceptibility.geojson').read_text(encoding='utf-8')),json.loads((base/'portugal-regional-erosion.geojson').read_text(encoding='utf-8')))
    Path(sys.argv[2]).write_text(json.dumps(result,ensure_ascii=False),encoding='utf-8')
