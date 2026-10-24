import csv,io,json,unittest
from datetime import datetime,timezone
from collect import normalize,geometry

class QualityTests(unittest.TestCase):
    def sample(self,**kw):
        r=dict(entity_id='x',position=json.dumps({'type':'Point','coordinates':[-9.1,38.7]}),creation_date='2024-01-01T00:00:00Z',periodos_condicionamentos=json.dumps([dict(start_date='1704067200000',end_date='1704153600000')]))
        r.update(kw);s=io.StringIO();w=csv.DictWriter(s,fieldnames=r.keys());w.writeheader();w.writerow(r);return s.getvalue().encode()
    def test_old_is_never_current(self):
        d,_=normalize(self.sample(),datetime(2026,10,24,tzinfo=timezone.utc));p=d['features'][0]['properties'];self.assertEqual(p['temporal_state'],'expired');self.assertFalse(p['current_state_known']);self.assertEqual(p['effective_state'],'unknown')
    def test_invalid_coordinate_rejected(self):
        d,_=normalize(self.sample(position='{"type":"Point","coordinates":[0,0]}'));self.assertEqual(d['metadata']['rejected'],1)
    def test_missing_schema_fails(self):
        with self.assertRaises(ValueError): normalize(b'bad\n1')
    def test_nan_rejected(self):
        with self.assertRaises(ValueError):geometry({'type':'Point','coordinates':[float('nan'),38.7]})
    def test_inverted_interval(self):
        d,_=normalize(self.sample(periodos_condicionamentos='[{"start_date":"2000","end_date":"1000"}]'));self.assertEqual(d['metadata']['accepted'],0)

if __name__=='__main__':unittest.main()
