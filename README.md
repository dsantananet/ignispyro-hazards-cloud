# IGNISPYRO — trânsito e condicionamentos

Um mapa principal de estradas com ocorrências rodoviárias, incêndios e outros hazards. Geometria viária de OpenFreeMap/OpenMapTiles/OpenStreetMap (ODbL), consultada por iniciativa do utilizador, com pedidos limitados à área visível e cache em memória. Os segmentos até 500 m de eventos pontuais atuais são destacados a laranja tracejado como possíveis condicionamentos, por confirmar. Não são velocidades, congestionamento medido, impacto físico validado ou cortes oficiais. Dados antigos, sismos observados e avisos distritais não geram esse destaque.

Fontes: SIFOR/ANEPC, IPMA e EMSC. A consulta direta respeita atribuição e utilização experimental não comercial quando exigida pela fonte; o arquivo Git conserva apenas agregados SIFOR. Consulte `site/article.html` para metodologia e limites. Waze, IP e Google Maps são ligações externas, sem segundo mapa incorporado nem cópia dos seus dados.

## Reproduzir

- `python -m unittest -v` e `node --test tests/*.test.mjs`
- `python collect.py` e `node collect-hazards.mjs`
- `Rscript analyse.R`
- Para alterar o mapa: `pnpm install --frozen-lockfile`, `node build-map.mjs`, `node build-integrated.mjs`. O bundle publicado inclui as licenças dos leitores de mosaicos.

O relatório R analisa a qualidade e atualidade das fontes e o arquivo histórico licenciado de Lisboa. Não certifica percursos de emergência nem calcula população ou quilómetros atingidos.

Recolha horária no GitHub é uma tentativa sujeita a atrasos. A aplicação consulta eventos a cada cinco minutos enquanto visível; não garante disponibilidade ou atualização da fonte. Não há APIs pagas, chaves de serviço ou credenciais NAS neste repositório. OSM/OpenFreeMap são cartografia, não uma fonte de estado atual da circulação.
