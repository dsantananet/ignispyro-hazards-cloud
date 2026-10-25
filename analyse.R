# Base R: reproducible quality report, no downloaded R packages.
options(encoding='UTF-8')
if (.Platform$OS.type == 'windows') Sys.setlocale('LC_CTYPE','English_United States.utf8')
dir.create('site/reports', recursive=TRUE, showWarnings=FALSE)
d <- read.csv('site/data/quality.csv', encoding='UTF-8', stringsAsFactors=FALSE)
stopifnot(nrow(d)>0, !anyNA(d$temporal_state))
states <- c('expired','future','within_envelope_unverified')
counts <- table(factor(d$temporal_state, levels=states))
svg('site/reports/temporal-quality.svg', width=9, height=5, bg='white')
par(mar=c(7,5,4,2))
barplot(counts, names.arg=c('Expirados','Futuros','Na envolvente\nsem confirma\u00e7\u00e3o'),
 col=c('#7c8994','#4b8daf','#d7a53c'),las=1,ylab='Registos distintos',
 main='Lisboa: validade temporal dos condicionamentos')
dev.off()
write.csv(data.frame(state=names(counts),records=as.integer(counts)),
 'site/reports/temporal-summary.csv',row.names=FALSE,fileEncoding='UTF-8')
capture.output(sessionInfo(),file='site/reports/R-session.txt')
metrics <- paste(sprintf('<li>%s: <strong>%d</strong></li>',c('Expirados','Futuros','Na envolvente, sem confirma\u00e7\u00e3o'),as.integer(counts)),collapse='')
report <- paste0('<!doctype html><html lang="pt"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Relat\u00f3rio R — estradas</title><style>body{max-width:960px;margin:3rem auto;padding:1rem;font:18px/1.6 system-ui}img{width:100%}code{overflow-wrap:anywhere}</style><h1>Qualidade dos condicionamentos rodovi\u00e1rios</h1><p><a href="https://dsantananet.github.io/ignispyro-hazards-cloud/">Consultar tr\u00e2nsito em direto</a>. O visualizador Waze/IP \u00e9 independente desta an\u00e1lise: n\u00e3o foram extra\u00eddas velocidades ou ocorr\u00eancias desses mapas.</p><p>An\u00e1lise executada em R em ',
 format(Sys.time(),tz='UTC',usetz=TRUE),'. Fonte: C\u00e2mara Municipal de Lisboa, CC BY 4.0.</p><ul>',metrics,
 '</ul><img src="temporal-quality.svg" alt="Contagens por validade temporal"><p>Uma envolvente de datas pode incluir v\u00e1rios per\u00edodos di\u00e1rios. N\u00e3o demonstra um corte cont\u00ednuo. A data da recolha n\u00e3o comprova atualiza\u00e7\u00e3o da fonte. Nenhum registo \u00e9 aqui confirmado como corte atual.</p><p>Contagens limitadas ao munic\u00edpio de Lisboa, sem extrapola\u00e7\u00e3o nacional, sem velocidades ou tempos de viagem. Duplicados id\u00eanticos s\u00e3o removidos; IDs com conte\u00fado contradit\u00f3rio s\u00e3o exclu\u00eddos e contabilizados em <a href="../data/quality.json">quality.json</a>.</p><p><a href="../article.html">Artigo e m\u00e9todo</a> · <a href="R-session.txt">Vers\u00e3o R</a> · <a href="temporal-summary.csv">Tabela</a></p></html>')
writeLines(enc2utf8(report),'site/reports/index.html',useBytes=TRUE)

# Separate quality analysis: event counts do not establish road closures.
if (file.exists('site/data/hazards-quality.csv') && file.exists('site/data/hazards-by-kind.csv')) {
 hq <- read.csv('site/data/hazards-quality.csv', encoding='UTF-8', stringsAsFactors=FALSE)
 hk <- read.csv('site/data/hazards-by-kind.csv', encoding='UTF-8', stringsAsFactors=FALSE)
 stopifnot(all(hq$records == hq$fresh + hq$stale_or_unknown), all(hk$records == hk$fresh + hk$stale_or_unknown))
 labels <- c(fire='Inc\u00eandios reportados',flood='Inunda\u00e7\u00f5es',landslide='Movimentos de massa',road_incident='Ocorr\u00eancias rodovi\u00e1rias',obstruction='Obstru\u00e7\u00f5es',weather='Avisos meteorol\u00f3gicos',earthquake='Sismos observados (7 dias)')
 svg('site/reports/hazards-quality.svg',width=11,height=6,bg='white')
 par(mar=c(5,15,4,2))
 if(nrow(hk)>0) {
   plotdata <- rbind(hk$fresh,hk$stale_or_unknown)
   barplot(plotdata,horiz=TRUE,beside=FALSE,names.arg=unname(labels[hk$kind]),las=1,col=c('#397ea8','#8a979f'),xlab='Registos da fonte',main='Atualidade dos registos por tipo')
   legend('bottomright',legend=c('Fonte dentro da janela adotada','Atualiza\u00e7\u00e3o antiga/desconhecida'),fill=c('#397ea8','#8a979f'),bty='n')
 } else { plot.new();title('Sem dados de eventos dispon\u00edveis; n\u00e3o equivale a aus\u00eancia de perigo') }
 dev.off()
 rows <- paste(sprintf('<tr><td>%s</td><td>%s</td><td>%d</td><td>%d</td><td>%d</td></tr>',hq$source,hq$status,hq$records,hq$fresh,hq$stale_or_unknown),collapse='')
 section <- paste0('<section><h2>Hazards, inc\u00eandios e qualidade das fontes</h2><p>Este quadro descreve o snapshot recolhido para an\u00e1lise. A aplica\u00e7\u00e3o consulta as fontes diretamente de cinco em cinco minutos e pode mostrar dados mais recentes.</p><table><tr><th>Fonte</th><th>Recolha</th><th>Registos</th><th>Dentro da janela</th><th>Antigos/desconhecidos</th></tr>',rows,'</table><img src="hazards-quality.svg" alt="Gr\u00e1fico de atualidade por tipo de evento"><p>Para SIFOR, a janela explorat\u00f3ria \u00e9 de uma hora desde DataDosDados e desde a recolha. Fonte recente n\u00e3o garante posi\u00e7\u00e3o precisa ou dano. Os sismos s\u00e3o observa\u00e7\u00f5es dos \u00faltimos sete dias na \u00e1rea alargada de Portugal, Atl\u00e2ntico e Ib\u00e9ria; n\u00e3o s\u00e3o  eventos em curso nem cortes. IPMA inclui apenas avisos n\u00e3o verdes em validade.</p><p>A triagem da aplica\u00e7\u00e3o mede dist\u00e2ncias entre um ponto escolhido pelo utilizador e ocorr\u00eancias pontuais atuais. Raios de 500 m, 1 km e 2 km s\u00e3o explorat\u00f3rios, sem calibra\u00e7\u00e3o de dano ou valida\u00e7\u00e3o de rotas. N\u00e3o se calculam quil\u00f3metros de estrada afetada, nem se infere corte por proximidade, sismo ou aviso distrital. A confirma\u00e7\u00e3o permanece na autoridade ou operador.</p><p>Fonte: \u00a9SIFOR / ANEPC (agregados, utiliza\u00e7\u00e3o n\u00e3o comercial), IPMA, I.P. (com atribui\u00e7\u00e3o) e EMSC-CSEM (CC BY 4.0). As posi\u00e7\u00f5es SIFOR s\u00e3o consultadas na origem pelo navegador e n\u00e3o republicadas no arquivo Git. A geolocaliza\u00e7\u00e3o do utilizador n\u00e3o integra este relat\u00f3rio.</p></section>')
 branded <- sub('<h1>','<p><img src="../assets/ignispyro-logo.png" alt="IGNISPYRO" style="width:260px"></p><h1>',report,fixed=TRUE)
 branded <- sub('</html>',paste0(section,'</html>'),branded,fixed=TRUE)
 writeLines(enc2utf8(branded),'site/reports/index.html',useBytes=TRUE)
}
