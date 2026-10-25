import unittest
from cross_postfire import cross
polygon={'type':'Polygon','coordinates':[[[0,0],[1,0],[1,1],[0,1],[0,0]]]}
class CrossTests(unittest.TestCase):
 def test_rejects_bare_soil_as_severity(self):
  with self.assertRaises(ValueError):cross({'metadata':{'product':'experimental_erosion_screening'}},{},{})
 def test_overlap_is_context_never_warning(self):
  f={'geometry':polygon,'properties':{'severity_class':'high'}}
  severity={'metadata':{'product':'burn_severity','source_url':'https://test.invalid/fixture','observed_at':'2020-01-01','synthetic':False,'index':'dNBR','classification_method':'unit test fixture only'},'features':[f]}
  nasa={'features':[{'geometry':polygon,'properties':{'susceptibility_class':4}}]}
  er={'features':[{'geometry':polygon,'properties':{'soil_loss_t_ha_year':2,'reference_year':2016,'nuts_id':'fixture'}}]}
  out=cross(severity,nasa,er);self.assertEqual(len(out['features']),1);self.assertFalse(out['features'][0]['properties']['current_warning']);self.assertFalse(out['features'][0]['properties']['road_closure_confirmed'])
if __name__=='__main__':unittest.main()
