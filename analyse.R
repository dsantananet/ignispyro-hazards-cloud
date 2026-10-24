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
metrics <- paste(sprintf('<li>%s: <strong>%d</strong></li>',names(counts),as.integer(counts)),collapse='')
report <- paste0('<!doctype html><html lang="pt"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Relat\u00f3rio R — estradas</title><style>body{max-width:960px;margin:3rem auto;padding:1rem;font:18px/1.6 system-ui}img{width:100%}code{overflow-wrap:anywhere}</style><h1>Qualidade dos condicionamentos rodovi\u00e1rios</h1><p>An\u00e1lise executada em R sobre a recolha: ',
 format(Sys.time(),tz='UTC',usetz=TRUE),'. Fonte: C\u00e2mara Municipal de Lisboa, CC BY 4.0.</p><ul>',metrics,
 '</ul><img src="temporal-quality.svg" alt="Contagens por validade temporal"><p>Uma envolvente de datas pode incluir v\u00e1rios per\u00edodos di\u00e1rios. N\u00e3o demonstra um corte cont\u00ednuo. A data da recolha n\u00e3o comprova atualiza\u00e7\u00e3o da fonte. Nenhum registo \u00e9 aqui confirmado como corte atual.</p><p>Contagens limitadas ao munic\u00edpio de Lisboa, sem extrapola\u00e7\u00e3o nacional, sem velocidades ou tempos de viagem. Duplicados id\u00eanticos s\u00e3o removidos; IDs com conte\u00fado contradit\u00f3rio s\u00e3o exclu\u00eddos e contabilizados em <a href="../data/quality.json">quality.json</a>.</p><p><a href="../article.html">Artigo e m\u00e9todo</a> · <a href="R-session.txt">Vers\u00e3o R</a> · <a href="temporal-summary.csv">Tabela</a></p></html>')
writeLines(enc2utf8(report),'site/reports/index.html',useBytes=TRUE)
