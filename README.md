# IGNISPYRO Hazards Cloud

Free public-source collection and reproducible R quality reports. This repository contains only new public collector code, CC BY 4.0 Lisbon road data and study outputs. No NAS keys, private portal source, user accounts or paid calls.

Run `python -m unittest -v`, `python collect.py`, `Rscript analyse.R`.
Open `site/article.html` and `site/reports/index.html`.

Public traffic viewer: `index.html`. It embeds the official Waze Live Map, switches to the original IP incident viewer and opens Google Maps with its traffic layer through documented Maps URLs. No paid key, scraping, copied third-party traffic dataset or inference of official closures. Visual coverage and freshness remain the provider's. The base-R report still analyses only the licensed Lisbon archive.

Hourly scheduled collection is a refresh attempt, not a real-time service guarantee. GitHub may delay scheduled runs or disable inactive schedules. A failed collection does not publish empty normal-state data. No source here confirms national road closures. Lisbon data remain historical/unverified until their original update cadence is established.

Source attribution: CÃ¢mara Municipal de Lisboa / Lisboa Aberta, CC BY 4.0, links and SHA-256 in `site/data/quality.json`. Collector transformations: geometry validation, deduplication, temporal classification. Original data licence applies separately from code.

Waze/Google browser scraping is not implemented. Waze official partner access and OpenWeb Ninja require source-use rights. OpenWeb Ninja's advertised free 100 calls/month (account UI actually offered 50) is insufficient for national five-minute refresh. OpenWeb Ninja Basic was activated at $0 with a hard limit; API testing was blocked by endpoint protection and was not bypassed. No paid API is enabled.
