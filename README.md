# IGNISPYRO HAZARDS

Cinco módulos no portal: Floods, Seismic, Landslides, Extreme Weather e Roads & Incidents. [Aplicação](https://dsantananet.github.io/ignispyro-hazards-cloud/) · [Disponível e em falta](https://dsantananet.github.io/ignispyro-hazards-cloud/site/reports/modules.html).

- Floods preserva a aplicação e os estudos hidráulicos existentes, sem afirmar mancha atual validada.
- Seismic separa sismos observados de perigosidade ESHM20/PGA.
- Landslides disponibiliza suscetibilidade NASA de cerca de1km, erosão regional Eurostat/JRC2016 e o piloto GEE já calculado na nuvem. O piloto cobre0,95km²; não é cartografia nacional detalhada nem previsão calibrada.
- Extreme Weather representa avisos IPMA em validade por pontos oficiais de referência das áreas, sem inventar polígonos de perigo.
- Roads mostra trânsito Waze/IP em direto e a vista Hazards nas vias. O iframe não aceita camadas próprias; a sobreposição de velocidades Google/Waze não foi implementada sem uma API licenciada. Não há APIs pagas ativadas.

Geometrias viárias OpenFreeMap/OpenMapTiles/OpenStreetMap, ODbL. A triagem exploratória de500m assinala segmentos próximos de ocorrências pontuais atuais, sem inferir cortes. Dados antigos, sismos, avisos distritais e suscetibilidade estática não criam cortes automaticamente.

Dados de contexto em site/data: NASA para continente/Açores/Madeira; Eurostat2016 em NUTS2021,23valores e2nulos. Cada produto preserva fonte, escala, ano e limitações. Limites regionais ©EuroGeographics, GISCO não comercial; recorte NASA Natural Earth, domínio público. Dados IPMA/SIFOR respeitam atribuição e uso experimental não comercial; EMSC/EFEHR CC BY4.0. As posições SIFOR são consultadas na origem, não arquivadas no Git.

## Reprodução

`python -m unittest -v`; `node --test tests/*.test.mjs`; `python collect.py`; `node collect-hazards.mjs`; `Rscript analyse.R`.

Mapa: `pnpm install --frozen-lockfile`; `node build-map.mjs`; `node build-integrated.mjs`. Bundle inclui licenças PBF/vector-tile; assets versionados por hash.

Contexto Portugal: research/build_portugal_context.py com rasterio/shapely/numpy e os recortes NASA exportImage, Natural Earth e Eurostat/GISCO identificados nos metadados. As entradas temporárias não são versionadas; hashes NASA registados. Não recalcular cartografia estática a cada atualização de avisos.

Pós-fogo: `python research/cross_postfire.py severity.geojson output.geojson`. Exige uma camada real de severidade alta datada, índice e classificação documentados. Solo exposto não é severidade. O cruzamento real permanece dependente dessa entrada; não gera aviso ou corte. Testes de interseção em research/test_postfire.py, com fixtures sintéticas apenas nos testes.

A recolha horária GitHub pode atrasar; eventos são consultados de cinco em cinco minutos enquanto a página está visível. No NAS, o gateway autenticado lê apenas resultados derivados GEE com mount readonly e verifica hashes. O mapa público mostra snapshot datado. Não foram copiadas credenciais nem alterados o motor GEE, o coletor ou as bases existentes.
