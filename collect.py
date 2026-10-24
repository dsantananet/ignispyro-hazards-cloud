"""Free, bounded collection of licensed Lisbon road restrictions. No credentials."""
import csv, hashlib, io, json, pathlib, urllib.request
from datetime import datetime, timezone

URL = 'https://coiapp2.cm-lisboa.pt/file/datahub/950792bf-6f72-4bb2-b725-652c1619175a'
CATALOG = 'https://dados.cm-lisboa.pt/pt_BR/dataset/condicionamentos-de-transito'

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        raise ValueError('Redirect refused')

def geometry(g):
    if not isinstance(g, dict):
        raise ValueError('geometry')
    kind = g.get('type')
    if kind == 'GeometryCollection':
        children = g.get('geometries', [])
        if not children or len(children)>100:
            raise ValueError('geometry collection')
        return {'type':kind,'geometries':[geometry(x) for x in children]}
    depths = {'Point':0,'LineString':1,'MultiLineString':2,'Polygon':2,'MultiPolygon':3}
    if kind not in depths:
        raise ValueError('geometry type')
    def check(v,depth):
        if depth:
            if not isinstance(v,list) or not v or len(v)>20000: raise ValueError('coordinates')
            for child in v: check(child,depth-1)
        elif (not isinstance(v,list) or len(v)!=2 or
              any(isinstance(n,bool) or not isinstance(n,(int,float)) for n in v) or
              not (-9.5<=v[0]<=-8.8 and 38.4<=v[1]<=39)):
            raise ValueError('outside Lisbon')
    check(g.get('coordinates'),depths[kind])
    return {'type':kind,'coordinates':g['coordinates']}

def normalize(raw, now=None):
    now = now or datetime.now(timezone.utc)
    stamp = now.isoformat().replace('+00:00','Z')
    try: text = raw.decode('utf-8-sig'); encoding='utf-8'
    except UnicodeDecodeError: text=raw.decode('cp1252'); encoding='windows-1252'
    reader = csv.DictReader(io.StringIO(text))
    required={'entity_id','position','periodos_condicionamentos','creation_date'}
    if not required.issubset(reader.fieldnames or []): raise ValueError('CSV schema changed')
    features=[]; rows=[]; rejected=duplicates=0; seen={}; conflicts=set()
    for index,r in enumerate(reader):
        if index>=20000: raise ValueError('row limit exceeded')
        try:
            identifier=r['entity_id']
            if not identifier: raise ValueError('missing identifier')
            fingerprint=json.dumps(r,sort_keys=True)
            if identifier in seen:
                duplicates+=1
                if seen[identifier]!=fingerprint: conflicts.add(identifier)
                continue
            g=geometry(json.loads(r['position']))
            periods=json.loads(r['periodos_condicionamentos'])
            if not isinstance(periods,list) or not periods: raise ValueError('periods')
            starts=[];ends=[]
            for p in periods:
                a=datetime.fromtimestamp(float(p['start_date'])/1000,timezone.utc)
                b=datetime.fromtimestamp(float(p['end_date'])/1000,timezone.utc)
                if b<a: raise ValueError('inverted period')
                starts.append(a);ends.append(b)
            a,b=min(starts),max(ends)
            temporal='expired' if b<now else 'future' if a>now else 'within_envelope_unverified'
            created=datetime.fromisoformat(r['creation_date'].replace('Z','+00:00'))
            if created.tzinfo is None or created>now:raise ValueError('creation time')
            props={'source_id':'cml-roads','source_url':CATALOG,'license':'CC-BY-4.0',
                'attribution':'Câmara Municipal de Lisboa — Lisboa Aberta',
                'hazard':'restriction','product':'planned_restriction','area_name':r.get('morada','Lisboa'),
                'title':r.get('restricao_circulacao','Condicionamento'),
                'description':r.get('motivo',''),'impact':r.get('impacto',''),
                'valid_from':a.isoformat(),'valid_until':b.isoformat(),
                'periods':periods,'temporal_state':temporal,'effective_state':'unknown',
                'freshness':'unverified_current','freshness_basis':'source_update_unknown',
                'fetched_at':stamp,'issued_at':r['creation_date'],
                'confirmed_accident':False,'current_state_known':False}
            features.append({'type':'Feature','id':identifier,'geometry':g,'properties':props})
            rows.append({'id':identifier,'created_at':r['creation_date'],'valid_until':b.isoformat(),
                         'temporal_state':temporal,'restriction':r.get('restricao_circulacao','')})
            seen[identifier]=fingerprint
        except (ValueError,TypeError,KeyError,OverflowError,OSError): rejected+=1
    features=[f for f in features if f['id'] not in conflicts]
    rows=[r for r in rows if r['id'] not in conflicts]
    meta={'generated_at':stamp,'source_url':URL,'catalog_url':CATALOG,'license':'CC-BY-4.0',
          'attribution':'Câmara Municipal de Lisboa — Lisboa Aberta','sha256':hashlib.sha256(raw).hexdigest(),
          'encoding':encoding,'accepted':len(features),'rejected':rejected,'duplicates':duplicates,'conflicting_ids':len(conflicts),
          'coverage':'Lisboa municipality only','source_updated_at':None,'current_state_known':False,
          'status':'historical_or_unverified','warning':'Retrieval time is not source update time. Date envelope does not imply continuous closure.'}
    return {'type':'FeatureCollection','features':features,'metadata':meta},rows

def main():
    req=urllib.request.Request(URL,headers={'User-Agent':'IgnisPyroHazards/1.0 open-data quality study'})
    with urllib.request.build_opener(NoRedirect).open(req,timeout=25) as response:
        raw=response.read(5000001)
    if len(raw)>5000000: raise ValueError('response size')
    data,rows=normalize(raw)
    out=pathlib.Path('site/data');out.mkdir(parents=True,exist_ok=True)
    (out/'roads.geojson').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    (out/'quality.json').write_text(json.dumps(data['metadata'],ensure_ascii=False,indent=2),encoding='utf-8')
    with (out/'quality.csv').open('w',encoding='utf-8',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=['id','created_at','valid_until','temporal_state','restriction']);writer.writeheader();writer.writerows(rows)
    print(json.dumps(data['metadata'],ensure_ascii=True))

if __name__=='__main__': main()
