/* Third-party licenses
Copyright (c) 2026, Mapbox
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of pbf nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

Copyright (c) 2024, Mapbox

All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice,
      this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
      and/or other materials provided with the distribution.
    * Neither the name of Mapbox nor the names of its contributors
      may be used to endorse or promote products derived from this software
      without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

// src/products.mjs
var apps = {
  floods: { name: "Floods", description: "Cheias e inunda\xE7\xF5es. Ocorr\xEAncias reportadas aqui; cen\xE1rios e valida\xE7\xE3o hidr\xE1ulica na aplica\xE7\xE3o Floods existente.", kinds: ["flood"] },
  seismic: { name: "Seismic", description: "Sismos observados e perigosidade s\xEDsmica ESHM20 s\xE3o produtos distintos. Magnitude n\xE3o demonstra danos numa estrada.", kinds: ["earthquake"] },
  landslides: { name: "Landslides", description: "Suscetibilidade NASA a movimentos de vertente, eros\xE3o regional Eurostat e piloto experimental GEE. Nenhum destes produtos confirma uma derrocada atual.", kinds: ["landslide"] },
  "extreme-weather": { name: "Extreme Weather", description: "Avisos IPMA em validade: neve, calor, frio, vento e precipita\xE7\xE3o. Os pontos representam \xE1reas oficiais de aviso, n\xE3o perigos localizados nessa coordenada.", kinds: ["weather"] },
  "roads-incidents": { name: "Roads & Incidents", description: "Servi\xE7o de tr\xE2nsito Waze/IP e consulta conjunta dos hazards nas vias. Google Maps dispon\xEDvel por liga\xE7\xE3o, sem API paga.", kinds: ["fire", "flood", "landslide", "road_incident", "obstruction", "weather", "earthquake"] }
};
var selectedModule = (search) => Object.hasOwn(apps, new URLSearchParams(search).get("module")) ? new URLSearchParams(search).get("module") : "roads-incidents";
var el = (tag, content) => {
  const x = document.createElement(tag);
  x.textContent = content;
  return x;
};
async function installProducts({ map: map2, L: L2, render: render2 }) {
  const module = selectedModule(location.search), app = apps[module], roads = module === "roads-incidents";
  document.title = "IGNISPYRO \xB7 " + app.name;
  document.querySelector(".brand").textContent = "IGNISPYRO HAZARDS \xB7 " + app.name.toUpperCase();
  document.querySelector("#overview-description").textContent = roads ? "Tr\xE2nsito em direto e consulta dos poss\xEDveis efeitos dos hazards na rede vi\xE1ria." : "Mapa espec\xEDfico do m\xF3dulo, com produtos, datas e escalas distintos. Suscetibilidade e perigosidade n\xE3o s\xE3o ocorr\xEAncias confirmadas.";
  document.querySelector('a[href="#events"]').textContent = roads ? "Mapa de tr\xE2nsito" : "Mapa " + app.name;
  document.querySelector("#hazards-map").setAttribute("aria-label", "Mapa " + app.name + " e fontes de contexto");
  document.querySelector("#event-legend").hidden = !roads;
  document.querySelector("#app-title").textContent = app.name;
  document.querySelector("#app-description").textContent = app.description;
  document.querySelector("#map-title").textContent = roads ? "Tr\xE2nsito e condicionamentos nas estradas" : app.name + " \xB7 mapa e fontes";
  for (const c of document.querySelectorAll("[data-kind]")) {
    c.checked = app.kinds.includes(c.dataset.kind) && (module !== "roads-incidents" || !["weather", "earthquake"].includes(c.dataset.kind));
    c.closest("label").hidden = !app.kinds.includes(c.dataset.kind);
  }
  for (const id of ["road-controls", "road-screening", "roads-status", "traffic-service", "road-explanation"]) document.getElementById(id).hidden = !roads;
  const frame = document.querySelector("#traffic"), canvas = document.querySelector("#hazards-map");
  function mode(traffic) {
    frame.hidden = !traffic;
    canvas.hidden = traffic;
    for (const id of ["context-products", "road-explanation", "roads-status", "road-screening", "event-legend"]) document.getElementById(id).hidden = traffic;
    document.querySelector(".layer-filters").hidden = traffic;
    document.querySelector("#load-roads").hidden = traffic;
    if (!traffic) map2.invalidateSize();
    document.querySelector("#traffic-source-note").textContent = traffic ? "Tr\xE2nsito em direto na fonte original. Para consultar os perigos na rede vi\xE1ria, escolhe Hazards nas vias." : "Hazards e poss\xEDveis condicionamentos nas vias. Velocidades/congestionamento Waze n\xE3o s\xE3o copiados para esta cartografia.";
  }
  document.querySelector("#show-traffic").onclick = () => mode(true);
  document.querySelector("#show-hazards").onclick = () => mode(false);
  window.addEventListener("ignispyro-show-traffic", () => mode(true));
  if (roads) {
    document.querySelector("#waze").click();
    mode(true);
  } else {
    frame.hidden = true;
    canvas.hidden = false;
  }
  const panel = document.querySelector("#context-products");
  if (module === "floods") {
    const a = el("a", "Abrir Floods \xB7 modelo, barragens e valida\xE7\xE3o de Coimbra \u2197");
    a.href = "https://dsantananet.github.io/ignispyro-floods/";
    a.target = "_blank";
    a.rel = "noopener";
    panel.append(a, el("p", "Sem mancha hidr\xE1ulica atual validada nesta camada; uma ocorr\xEAncia pontual n\xE3o representa a \xE1rea inundada."));
  }
  async function geo(path) {
    const r = await fetch(new URL("./data/" + path, import.meta.url), { signal: AbortSignal.timeout(2e4) });
    if (!r.ok) throw Error("source");
    const j = await r.json();
    if (j.type !== "FeatureCollection" || !Array.isArray(j.features) || j.features.length > 1e3) throw Error("shape");
    return j;
  }
  function toggle(label, loader, initial = false) {
    const row = el("label", ""), c = document.createElement("input"), status = el("small", "");
    c.type = "checkbox";
    row.append(c, document.createTextNode(" " + label + " "), status);
    panel.append(row, document.createElement("br"));
    let layer, pending = false;
    c.onchange = async () => {
      if (pending) return;
      if (!c.checked) {
        if (layer) map2.removeLayer(layer);
        return;
      }
      if (layer) {
        layer.addTo(map2);
        return;
      }
      pending = true;
      status.textContent = "A consultar\u2026";
      try {
        layer = await loader();
        let failed = false;
        layer.on?.("loading", () => {
          failed = false;
        });
        layer.on?.("tileerror", () => {
          failed = true;
          status.textContent = "Falha ao obter imagens da fonte; cobertura n\xE3o confirmada.";
        });
        layer.on?.("load", () => {
          if (!failed) status.textContent = "Imagens recebidas da fonte; consultar legenda e escala.";
        });
        if (c.checked) layer.addTo(map2);
        status.textContent = layer._url ? "Pedido enviado \xE0 fonte; atualiza\xE7\xE3o sujeita a disponibilidade." : "Dados recebidos; consultar legenda e escala.";
      } catch {
        c.checked = false;
        status.textContent = "Fonte indispon\xEDvel. Sem classifica\xE7\xE3o substituta.";
      } finally {
        pending = false;
      }
    };
    if (initial) {
      c.checked = true;
      c.onchange();
    }
    return c;
  }
  if (["landslides", "roads-incidents"].includes(module)) {
    toggle("Suscetibilidade NASA \xB7 cerca de 1 km \xB7 contexto est\xE1tico", async () => {
      const j = await geo("portugal-landslide-susceptibility.geojson");
      return L2.geoJSON(j, { style: (f) => ({ color: "#75685e", weight: 0.3, fillColor: ["", "#cadde9", "#9cc8d9", "#ecd16e", "#e69850", "#cb635b"][f.properties.susceptibility_class], fillOpacity: 0.5 }), onEachFeature(f, l) {
        const p = f.properties;
        l.bindPopup(el("p", `NASA GSFC \xB7 suscetibilidade ${["", "muito baixa", "baixa", "moderada", "alta", "muito alta"][p.susceptibility_class]}. Modelo est\xE1tico de cerca de 1 km; n\xE3o confirma instabilidade atual ou corte. Stanley & Kirschbaum 2017, doi:10.1007/s11069-017-2757-y. Recorte Natural Earth aproximado, n\xE3o CAOP.`));
      } });
    }, module === "landslides");
    toggle("Eros\xE3o h\xEDdrica regional \xB7 Eurostat/RUSLE \xB7 refer\xEAncia 2016", async () => {
      const j = await geo("portugal-regional-erosion.geojson");
      return L2.geoJSON(j, { style: (f) => {
        const v = f.properties.soil_loss_t_ha_year;
        return { color: "#674d36", weight: 1, fillOpacity: 0.5, fillColor: v == null ? "#89969e" : v > 5 ? "#a84232" : v > 2 ? "#e6a454" : v > 1 ? "#e7d28b" : "#e5e1c8" };
      }, onEachFeature(f, l) {
        const p = f.properties;
        l.bindPopup(el("p", `${p.name} \xB7 ${p.soil_loss_t_ha_year ?? "sem dados"} t/ha/ano, m\xE9dia modelada de 2016. N\xE3o \xE9 eros\xE3o medida em cada parcela nem previs\xE3o atual. Fonte Eurostat aei_pr_soiler / JRC; \xA9 EuroGeographics para os limites administrativos NUTS2021, utiliza\xE7\xE3o n\xE3o comercial.`));
      } });
    });
    panel.append(el("p", "NASA: azul claro \u2192 vermelho, suscetibilidade muito baixa \u2192 muito alta; n\xE3o \xE9 risco atual. Eros\xE3o: m\xE9dias regionais \u22641, 1\u20132, 2\u20135 e >5 t/ha/ano, apenas intervalos de apresenta\xE7\xE3o. A\xE7ores/Madeira podem ter dados em falta."));
    const pilot = el("button", "Ver piloto GEE existente");
    pilot.type = "button";
    const note = el("p", "");
    panel.append(pilot, note);
    let image, outline;
    pilot.onclick = async () => {
      try {
        const r = await fetch(location.pathname.startsWith("/module-study/") || location.pathname.startsWith("/roads-study/") ? "/api/landslides/latest" : new URL("./data/gee-pilot.json", import.meta.url));
        if (!r.ok) throw Error();
        const j = await r.json();
        if (j.product !== "experimental_erosion_screening" || j.synthetic !== false || j.calibrated !== false || j.statistics.coverage_fraction < 0.8) throw Error();
        const [w, s, e, n] = j.request.bbox, b = [[s, w], [n, e]];
        if (image) map2.removeLayer(image);
        if (outline) map2.removeLayer(outline);
        image = L2.imageOverlay(location.pathname.startsWith("/module-study/") || location.pathname.startsWith("/roads-study/") ? "/api/landslides/preview" : new URL("./data/gee-pilot-preview.png", import.meta.url).href, b, { opacity: 0.75 }).addTo(map2);
        outline = L2.rectangle(b, { color: "#bc8adb", weight: 2, fillOpacity: 0 }).bindPopup("\xC1rea de estudo GEE, n\xE3o mancha de deslizamento.").addTo(map2);
        map2.fitBounds(b, { maxZoom: 15 });
        note.textContent = `GEE ${j.generated_at} \xB7 ${j.area_km2.toFixed(2)} km\xB2 \xB7 per\xEDodo ${j.request.comparison.join(" \u2192 ")} \xB7 cobertura ${(j.statistics.coverage_fraction * 100).toFixed(0)}% \xB7 \xE1rea candidata ${j.statistics.candidate_area_m2} m\xB2. Altera\xE7\xE3o de probabilidade de solo exposto e declive, n\xE3o severidade de inc\xEAndio nem probabilidade de deslizamento. Chuva regional: ${j.statistics.rainfall_context.comparison.complete ? "s\xE9rie completa" : "s\xE9rie incompleta; total n\xE3o estimado"}.`;
      } catch {
        note.textContent = "Resultado GEE indispon\xEDvel ou sem cobertura suficiente.";
      }
    };
  }
  if (["seismic", "roads-incidents"].includes(module)) {
    toggle("Perigosidade s\xEDsmica ESHM20 \xB7 PGA \xB7 10% em 50 anos", async () => L2.tileLayer.wms("https://efehrmaps.ethz.ch/cgi-bin/mapserv?MAP=/var/www/mapfile/sharehazard.01.map", { layers: "hmap1846", format: "image/png", transparent: true, version: "1.1.1", crs: L2.CRS.EPSG4326, opacity: 0.55, attribution: "EFEHR ESHM20 \xB7 CC BY 4.0 \xB7 doi:10.12686/a15" }), module === "seismic");
    panel.append(el("p", "ESHM20 \xE9 perigosidade de longo prazo para a condi\xE7\xE3o de solo do modelo, n\xE3o previs\xE3o do pr\xF3ximo sismo nem confirma\xE7\xE3o de danos nas vias. A cobertura e a escala seguem a fonte EFEHR."));
  }
  render2();
  return module;
}

// node_modules/.pnpm/@mapbox+point-geometry@1.1.0/node_modules/@mapbox/point-geometry/index.js
function Point(x, y) {
  this.x = x;
  this.y = y;
}
Point.prototype = {
  /**
   * Clone this point, returning a new point that can be modified
   * without affecting the old one.
   * @return {Point} the clone
   */
  clone() {
    return new Point(this.x, this.y);
  },
  /**
   * Add this point's x & y coordinates to another point,
   * yielding a new point.
   * @param {Point} p the other point
   * @return {Point} output point
   */
  add(p) {
    return this.clone()._add(p);
  },
  /**
   * Subtract this point's x & y coordinates to from point,
   * yielding a new point.
   * @param {Point} p the other point
   * @return {Point} output point
   */
  sub(p) {
    return this.clone()._sub(p);
  },
  /**
   * Multiply this point's x & y coordinates by point,
   * yielding a new point.
   * @param {Point} p the other point
   * @return {Point} output point
   */
  multByPoint(p) {
    return this.clone()._multByPoint(p);
  },
  /**
   * Divide this point's x & y coordinates by point,
   * yielding a new point.
   * @param {Point} p the other point
   * @return {Point} output point
   */
  divByPoint(p) {
    return this.clone()._divByPoint(p);
  },
  /**
   * Multiply this point's x & y coordinates by a factor,
   * yielding a new point.
   * @param {number} k factor
   * @return {Point} output point
   */
  mult(k) {
    return this.clone()._mult(k);
  },
  /**
   * Divide this point's x & y coordinates by a factor,
   * yielding a new point.
   * @param {number} k factor
   * @return {Point} output point
   */
  div(k) {
    return this.clone()._div(k);
  },
  /**
   * Rotate this point around the 0, 0 origin by an angle a,
   * given in radians
   * @param {number} a angle to rotate around, in radians
   * @return {Point} output point
   */
  rotate(a) {
    return this.clone()._rotate(a);
  },
  /**
   * Rotate this point around p point by an angle a,
   * given in radians
   * @param {number} a angle to rotate around, in radians
   * @param {Point} p Point to rotate around
   * @return {Point} output point
   */
  rotateAround(a, p) {
    return this.clone()._rotateAround(a, p);
  },
  /**
   * Multiply this point by a 4x1 transformation matrix
   * @param {[number, number, number, number]} m transformation matrix
   * @return {Point} output point
   */
  matMult(m) {
    return this.clone()._matMult(m);
  },
  /**
   * Calculate this point but as a unit vector from 0, 0, meaning
   * that the distance from the resulting point to the 0, 0
   * coordinate will be equal to 1 and the angle from the resulting
   * point to the 0, 0 coordinate will be the same as before.
   * @return {Point} unit vector point
   */
  unit() {
    return this.clone()._unit();
  },
  /**
   * Compute a perpendicular point, where the new y coordinate
   * is the old x coordinate and the new x coordinate is the old y
   * coordinate multiplied by -1
   * @return {Point} perpendicular point
   */
  perp() {
    return this.clone()._perp();
  },
  /**
   * Return a version of this point with the x & y coordinates
   * rounded to integers.
   * @return {Point} rounded point
   */
  round() {
    return this.clone()._round();
  },
  /**
   * Return the magnitude of this point: this is the Euclidean
   * distance from the 0, 0 coordinate to this point's x and y
   * coordinates.
   * @return {number} magnitude
   */
  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  },
  /**
   * Judge whether this point is equal to another point, returning
   * true or false.
   * @param {Point} other the other point
   * @return {boolean} whether the points are equal
   */
  equals(other) {
    return this.x === other.x && this.y === other.y;
  },
  /**
   * Calculate the distance from this point to another point
   * @param {Point} p the other point
   * @return {number} distance
   */
  dist(p) {
    return Math.sqrt(this.distSqr(p));
  },
  /**
   * Calculate the distance from this point to another point,
   * without the square root step. Useful if you're comparing
   * relative distances.
   * @param {Point} p the other point
   * @return {number} distance
   */
  distSqr(p) {
    const dx = p.x - this.x, dy = p.y - this.y;
    return dx * dx + dy * dy;
  },
  /**
   * Get the angle from the 0, 0 coordinate to this point, in radians
   * coordinates.
   * @return {number} angle
   */
  angle() {
    return Math.atan2(this.y, this.x);
  },
  /**
   * Get the angle from this point to another point, in radians
   * @param {Point} b the other point
   * @return {number} angle
   */
  angleTo(b) {
    return Math.atan2(this.y - b.y, this.x - b.x);
  },
  /**
   * Get the angle between this point and another point, in radians
   * @param {Point} b the other point
   * @return {number} angle
   */
  angleWith(b) {
    return this.angleWithSep(b.x, b.y);
  },
  /**
   * Find the angle of the two vectors, solving the formula for
   * the cross product a x b = |a||b|sin(θ) for θ.
   * @param {number} x the x-coordinate
   * @param {number} y the y-coordinate
   * @return {number} the angle in radians
   */
  angleWithSep(x, y) {
    return Math.atan2(
      this.x * y - this.y * x,
      this.x * x + this.y * y
    );
  },
  /** @param {[number, number, number, number]} m */
  _matMult(m) {
    const x = m[0] * this.x + m[1] * this.y, y = m[2] * this.x + m[3] * this.y;
    this.x = x;
    this.y = y;
    return this;
  },
  /** @param {Point} p */
  _add(p) {
    this.x += p.x;
    this.y += p.y;
    return this;
  },
  /** @param {Point} p */
  _sub(p) {
    this.x -= p.x;
    this.y -= p.y;
    return this;
  },
  /** @param {number} k */
  _mult(k) {
    this.x *= k;
    this.y *= k;
    return this;
  },
  /** @param {number} k */
  _div(k) {
    this.x /= k;
    this.y /= k;
    return this;
  },
  /** @param {Point} p */
  _multByPoint(p) {
    this.x *= p.x;
    this.y *= p.y;
    return this;
  },
  /** @param {Point} p */
  _divByPoint(p) {
    this.x /= p.x;
    this.y /= p.y;
    return this;
  },
  _unit() {
    this._div(this.mag());
    return this;
  },
  _perp() {
    const y = this.y;
    this.y = this.x;
    this.x = -y;
    return this;
  },
  /** @param {number} angle */
  _rotate(angle) {
    const cos = Math.cos(angle), sin = Math.sin(angle), x = cos * this.x - sin * this.y, y = sin * this.x + cos * this.y;
    this.x = x;
    this.y = y;
    return this;
  },
  /**
   * @param {number} angle
   * @param {Point} p
   */
  _rotateAround(angle, p) {
    const cos = Math.cos(angle), sin = Math.sin(angle), x = p.x + cos * (this.x - p.x) - sin * (this.y - p.y), y = p.y + sin * (this.x - p.x) + cos * (this.y - p.y);
    this.x = x;
    this.y = y;
    return this;
  },
  _round() {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    return this;
  },
  constructor: Point
};
Point.convert = function(p) {
  if (p instanceof Point) {
    return (
      /** @type {Point} */
      p
    );
  }
  if (Array.isArray(p)) {
    return new Point(+p[0], +p[1]);
  }
  if (p.x !== void 0 && p.y !== void 0) {
    return new Point(+p.x, +p.y);
  }
  throw new Error("Expected [x, y] or {x, y} point format");
};

// node_modules/.pnpm/@mapbox+vector-tile@3.0.0/node_modules/@mapbox/vector-tile/index.js
var VectorTileFeature = class {
  /**
   * @param {PbfReader} pbf
   * @param {number} end
   * @param {number} extent
   * @param {string[]} keys
   * @param {(number | string | boolean)[]} values
   */
  constructor(pbf, end, extent, keys, values) {
    this.properties = /* @__PURE__ */ Object.create(null);
    this.extent = extent;
    this.type = 0;
    this.id = void 0;
    this._pbf = pbf;
    this._geometry = -1;
    this._keys = keys;
    this._values = values;
    while (pbf.pos < end) {
      const tag = pbf.readVarint();
      if (tag === 8) this.id = pbf.readVarint();
      else if (tag === 18) {
        const tagsEnd = pbf.readVarint() + pbf.pos;
        while (pbf.pos < tagsEnd) {
          const key = keys[pbf.readVarint()];
          const value = values[pbf.readVarint()];
          this.properties[key] = value;
        }
      } else if (tag === 24) this.type = /** @type {0 | 1 | 2 | 3} */
      pbf.readVarint();
      else if (tag === 34) {
        this._geometry = pbf.pos;
        pbf.skip(tag);
      } else pbf.skip(tag);
    }
  }
  loadGeometry() {
    if (this._geometry < 0) throw new Error("feature has no geometry");
    const pbf = this._pbf;
    pbf.pos = this._geometry;
    const end = pbf.readVarint() + pbf.pos;
    const lines = [];
    let line;
    let cmd = 1;
    let length = 0;
    let x = 0;
    let y = 0;
    while (pbf.pos < end) {
      if (length <= 0) {
        const cmdLen = pbf.readVarint();
        cmd = cmdLen & 7;
        length = cmdLen >> 3;
        if (length === 0) continue;
      }
      length--;
      if (cmd === 1) {
        x += pbf.readSVarint();
        y += pbf.readSVarint();
        if (line) lines.push(line);
        line = [new Point(x, y)];
      } else if (cmd === 2) {
        x += pbf.readSVarint();
        y += pbf.readSVarint();
        if (line) line.push(new Point(x, y));
      } else if (cmd === 7) {
        if (line) {
          line.push(line[0].clone());
        }
      } else {
        throw new Error(`unknown command ${cmd}`);
      }
    }
    if (line) lines.push(line);
    return lines;
  }
  bbox() {
    if (this._geometry < 0) throw new Error("feature has no geometry");
    const pbf = this._pbf;
    pbf.pos = this._geometry;
    const end = pbf.readVarint() + pbf.pos;
    let cmd = 1, length = 0, x = 0, y = 0, x1 = Infinity, x2 = -Infinity, y1 = Infinity, y2 = -Infinity;
    while (pbf.pos < end) {
      if (length <= 0) {
        const cmdLen = pbf.readVarint();
        cmd = cmdLen & 7;
        length = cmdLen >> 3;
        if (length === 0) continue;
      }
      length--;
      if (cmd === 1 || cmd === 2) {
        x += pbf.readSVarint();
        y += pbf.readSVarint();
        if (x < x1) x1 = x;
        if (x > x2) x2 = x;
        if (y < y1) y1 = y;
        if (y > y2) y2 = y;
      } else if (cmd !== 7) {
        throw new Error(`unknown command ${cmd}`);
      }
    }
    return [x1, y1, x2, y2];
  }
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @return {Feature}
   */
  toGeoJSON(x, y, z) {
    const size = this.extent * Math.pow(2, z), x0 = this.extent * x, y0 = this.extent * y, vtCoords = this.loadGeometry();
    function projectPoint(p) {
      return [
        (p.x + x0) * 360 / size - 180,
        360 / Math.PI * Math.atan(Math.exp((1 - (p.y + y0) * 2 / size) * Math.PI)) - 90
      ];
    }
    function projectLine(line) {
      return line.map(projectPoint);
    }
    let geometry;
    if (this.type === 1) {
      const points2 = [];
      for (const line of vtCoords) {
        points2.push(line[0]);
      }
      const coordinates2 = projectLine(points2);
      geometry = points2.length === 1 ? { type: "Point", coordinates: coordinates2[0] } : { type: "MultiPoint", coordinates: coordinates2 };
    } else if (this.type === 2) {
      const coordinates2 = vtCoords.map(projectLine);
      geometry = coordinates2.length === 1 ? { type: "LineString", coordinates: coordinates2[0] } : { type: "MultiLineString", coordinates: coordinates2 };
    } else if (this.type === 3) {
      const polygons = classifyRings(vtCoords);
      const coordinates2 = [];
      for (const polygon of polygons) {
        coordinates2.push(polygon.map(projectLine));
      }
      geometry = coordinates2.length === 1 ? { type: "Polygon", coordinates: coordinates2[0] } : { type: "MultiPolygon", coordinates: coordinates2 };
    } else {
      throw new Error("unknown feature type");
    }
    const result = {
      type: "Feature",
      geometry,
      properties: this.properties
    };
    if (this.id != null) {
      result.id = this.id;
    }
    return result;
  }
};
VectorTileFeature.types = ["Unknown", "Point", "LineString", "Polygon"];
function classifyRings(rings) {
  const len = rings.length;
  if (len <= 1) return [rings];
  const polygons = [];
  let polygon, ccw;
  for (let i = 0; i < len; i++) {
    const area = signedArea(rings[i]);
    if (area === 0) continue;
    if (ccw === void 0) ccw = area < 0;
    if (ccw === area < 0) {
      if (polygon) polygons.push(polygon);
      polygon = [rings[i]];
    } else if (polygon) {
      polygon.push(rings[i]);
    }
  }
  if (polygon) polygons.push(polygon);
  return polygons;
}
function signedArea(ring) {
  let sum = 0;
  for (let i = 0, len = ring.length, j = len - 1, p1, p2; i < len; j = i++) {
    p1 = ring[i];
    p2 = ring[j];
    sum += (p2.x - p1.x) * (p1.y + p2.y);
  }
  return sum;
}
var VectorTileLayer = class {
  /**
   * @param {PbfReader} pbf
   * @param {number} [end]
   */
  constructor(pbf, end) {
    this.version = 1;
    this.name = "";
    this.extent = 4096;
    this.length = 0;
    this._pbf = pbf;
    this._keys = [];
    this._values = [];
    this._features = [];
    if (end === void 0) end = pbf.length;
    while (pbf.pos < end) {
      const tag = pbf.readVarint();
      if (tag === 10) this.name = pbf.readString();
      else if (tag === 18) {
        this._features.push(pbf.pos);
        pbf.skip(tag);
      } else if (tag === 26) this._keys.push(pbf.readString());
      else if (tag === 34) this._values.push(readValueMessage(pbf));
      else if (tag === 40) this.extent = pbf.readVarint();
      else if (tag === 120) this.version = pbf.readVarint();
      else pbf.skip(tag);
    }
    this.length = this._features.length;
  }
  /** return feature `i` from this layer as a `VectorTileFeature`
   * @param {number} i
   */
  feature(i) {
    if (i < 0 || i >= this._features.length) throw new Error("feature index out of bounds");
    this._pbf.pos = this._features[i];
    const end = this._pbf.readVarint() + this._pbf.pos;
    return new VectorTileFeature(this._pbf, end, this.extent, this._keys, this._values);
  }
};
function readValueMessage(pbf) {
  let value = null;
  const end = pbf.readVarint() + pbf.pos;
  while (pbf.pos < end) {
    const tag = pbf.readVarint();
    value = tag === 10 ? pbf.readString() : tag === 21 ? pbf.readFloat() : tag === 25 ? pbf.readDouble() : tag === 32 ? pbf.readVarint(true) : tag === 40 ? pbf.readVarint() : tag === 48 ? pbf.readSVarint() : tag === 56 ? pbf.readBoolean() : (pbf.skip(tag), null);
  }
  if (value == null) {
    throw new Error("unknown feature value");
  }
  return value;
}
var VectorTile = class {
  /**
   * @param {PbfReader} pbf
   * @param {number} [end]
   */
  constructor(pbf, end = pbf.length) {
    const layers = /* @__PURE__ */ Object.create(null);
    while (pbf.pos < end) {
      const tag = pbf.readVarint();
      if (tag === 26) {
        const layer = new VectorTileLayer(pbf, pbf.readVarint() + pbf.pos);
        if (layer.length) layers[layer.name] = layer;
      } else pbf.skip(tag);
    }
    this.layers = layers;
  }
};

// node_modules/.pnpm/pbf@5.1.2/node_modules/pbf/index.js
var SHIFT_LEFT_32 = (1 << 16) * (1 << 16);
var SHIFT_RIGHT_32 = 1 / SHIFT_LEFT_32;
var TEXT_DECODER_MIN_LENGTH = 12;
var utf8TextDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder("utf-8");
var PBF_VARINT = 0;
var PBF_FIXED64 = 1;
var PBF_BYTES = 2;
var PBF_FIXED32 = 5;
var PbfReader = class {
  /**
   * @param {Uint8Array | ArrayBuffer} buf
   */
  constructor(buf) {
    this.buf = ArrayBuffer.isView(buf) ? buf : new Uint8Array(buf);
    this.dataView = new DataView(this.buf.buffer, this.buf.byteOffset, this.buf.byteLength);
    this.pos = 0;
    this.type = 0;
    this._valueStart = -1;
    this.length = this.buf.length;
  }
  /**
   * @template T
   * @param {(tag: number, result: T, pbf: PbfReader) => void} readField
   * @param {T} result
   * @param {number} [end]
   */
  readFields(readField, result, end = this.length) {
    let field;
    while (field = this.nextField(end)) {
      readField(field, result, this);
    }
    return result;
  }
  /**
   * @template T
   * @param {(tag: number, result: T, pbf: PbfReader) => void} readField
   * @param {T} result
   */
  readMessage(readField, result) {
    return this.readFields(readField, result, this.readVarint() + this.pos);
  }
  readFixed32() {
    const val = this.dataView.getUint32(this.pos, true);
    this.pos += 4;
    return val;
  }
  readSFixed32() {
    const val = this.dataView.getInt32(this.pos, true);
    this.pos += 4;
    return val;
  }
  // 64-bit int handling is based on github.com/dpw/node-buffer-more-ints (MIT-licensed)
  readFixed64() {
    const val = this.dataView.getUint32(this.pos, true) + this.dataView.getUint32(this.pos + 4, true) * SHIFT_LEFT_32;
    this.pos += 8;
    return val;
  }
  readSFixed64() {
    const val = this.dataView.getUint32(this.pos, true) + this.dataView.getInt32(this.pos + 4, true) * SHIFT_LEFT_32;
    this.pos += 8;
    return val;
  }
  readFloat() {
    const val = this.dataView.getFloat32(this.pos, true);
    this.pos += 4;
    return val;
  }
  readDouble() {
    const val = this.dataView.getFloat64(this.pos, true);
    this.pos += 8;
    return val;
  }
  /**
   * @param {boolean} [isSigned]
   */
  readVarint(isSigned) {
    const buf = this.buf;
    const b0 = buf[this.pos++];
    if (b0 < 128) return b0;
    let val = b0 & 127, b;
    b = buf[this.pos++];
    val |= (b & 127) << 7;
    if (b < 128) return val;
    b = buf[this.pos++];
    val |= (b & 127) << 14;
    if (b < 128) return val;
    b = buf[this.pos++];
    val |= (b & 127) << 21;
    if (b < 128) return val;
    b = buf[this.pos];
    val |= (b & 15) << 28;
    return readVarintRemainder(val, isSigned, this);
  }
  readSVarint() {
    const num = this.readVarint();
    return num % 2 === 1 ? (num + 1) / -2 : num / 2;
  }
  readBoolean() {
    return Boolean(this.readVarint());
  }
  readString() {
    const end = this.readVarint() + this.pos;
    const pos = this.pos;
    this.pos = end;
    if (end - pos >= TEXT_DECODER_MIN_LENGTH && utf8TextDecoder) {
      return utf8TextDecoder.decode(this.buf.subarray(pos, end));
    }
    return readUtf8(this.buf, pos, end);
  }
  readBytes() {
    const end = this.readVarint() + this.pos, buffer = this.buf.subarray(this.pos, end);
    this.pos = end;
    return buffer;
  }
  // verbose for performance reasons; doesn't affect gzipped size
  /**
   * @param {number[]} [arr]
   * @param {boolean} [isSigned]
   */
  readPackedVarint(arr = [], isSigned) {
    const end = this.readPackedEnd();
    while (this.pos < end) arr.push(this.readVarint(isSigned));
    return arr;
  }
  /** @param {number[]} [arr] */
  readPackedSVarint(arr = []) {
    const end = this.readPackedEnd();
    while (this.pos < end) arr.push(this.readSVarint());
    return arr;
  }
  /** @param {boolean[]} [arr] */
  readPackedBoolean(arr = []) {
    const end = this.readPackedEnd();
    while (this.pos < end) arr.push(this.readBoolean());
    return arr;
  }
  /** @param {number[]} [arr] */
  readPackedFloat(arr = []) {
    const end = this.readPackedEnd();
    while (this.pos < end) arr.push(this.readFloat());
    return arr;
  }
  /** @param {number[]} [arr] */
  readPackedDouble(arr = []) {
    const end = this.readPackedEnd();
    while (this.pos < end) arr.push(this.readDouble());
    return arr;
  }
  /** @param {number[]} [arr] */
  readPackedFixed32(arr = []) {
    const end = this.readPackedEnd();
    while (this.pos < end) arr.push(this.readFixed32());
    return arr;
  }
  /** @param {number[]} [arr] */
  readPackedSFixed32(arr = []) {
    const end = this.readPackedEnd();
    while (this.pos < end) arr.push(this.readSFixed32());
    return arr;
  }
  /** @param {number[]} [arr] */
  readPackedFixed64(arr = []) {
    const end = this.readPackedEnd();
    while (this.pos < end) arr.push(this.readFixed64());
    return arr;
  }
  /** @param {number[]} [arr] */
  readPackedSFixed64(arr = []) {
    const end = this.readPackedEnd();
    while (this.pos < end) arr.push(this.readSFixed64());
    return arr;
  }
  readPackedEnd() {
    return this.type === PBF_BYTES ? this.readVarint() + this.pos : this.pos + 1;
  }
  /**
   * Advance to the next field. Returns the field number, or 0 at end-of-message.
   * @param {number} [end]
   */
  nextField(end = this.length) {
    if (this.pos === this._valueStart) this.skip(this.type);
    if (this.pos >= end) return 0;
    const tag = this.readVarint();
    this.type = tag & 7;
    this._valueStart = this.pos;
    return tag >>> 3;
  }
  /** @param {number} val */
  skip(val) {
    const type = val & 7;
    if (type === PBF_VARINT) while (this.buf[this.pos++] > 127) {
    }
    else if (type === PBF_BYTES) this.pos = this.readVarint() + this.pos;
    else if (type === PBF_FIXED32) this.pos += 4;
    else if (type === PBF_FIXED64) this.pos += 8;
    else throw new Error(`Unimplemented type: ${type}`);
  }
};
function readVarintRemainder(l, s, p) {
  const buf = p.buf;
  let h, b;
  b = buf[p.pos++];
  h = (b & 112) >> 4;
  if (b < 128) return toNum(l, h, s);
  b = buf[p.pos++];
  h |= (b & 127) << 3;
  if (b < 128) return toNum(l, h, s);
  b = buf[p.pos++];
  h |= (b & 127) << 10;
  if (b < 128) return toNum(l, h, s);
  b = buf[p.pos++];
  h |= (b & 127) << 17;
  if (b < 128) return toNum(l, h, s);
  b = buf[p.pos++];
  h |= (b & 127) << 24;
  if (b < 128) return toNum(l, h, s);
  b = buf[p.pos++];
  h |= (b & 1) << 31;
  if (b < 128) return toNum(l, h, s);
  throw new Error("Expected varint not more than 10 bytes");
}
function toNum(low, high, isSigned) {
  return isSigned ? high * 4294967296 + (low >>> 0) : (high >>> 0) * 4294967296 + (low >>> 0);
}
function readUtf8(buf, pos, end) {
  let str = "";
  let i = pos;
  while (i < end) {
    const b0 = buf[i];
    let c = null;
    let bytesPerSequence = b0 > 239 ? 4 : b0 > 223 ? 3 : b0 > 191 ? 2 : 1;
    if (i + bytesPerSequence > end) break;
    let b1, b2, b3;
    if (bytesPerSequence === 1) {
      if (b0 < 128) {
        c = b0;
      }
    } else if (bytesPerSequence === 2) {
      b1 = buf[i + 1];
      if ((b1 & 192) === 128) {
        c = (b0 & 31) << 6 | b1 & 63;
        if (c <= 127) {
          c = null;
        }
      }
    } else if (bytesPerSequence === 3) {
      b1 = buf[i + 1];
      b2 = buf[i + 2];
      if ((b1 & 192) === 128 && (b2 & 192) === 128) {
        c = (b0 & 15) << 12 | (b1 & 63) << 6 | b2 & 63;
        if (c <= 2047 || c >= 55296 && c <= 57343) {
          c = null;
        }
      }
    } else if (bytesPerSequence === 4) {
      b1 = buf[i + 1];
      b2 = buf[i + 2];
      b3 = buf[i + 3];
      if ((b1 & 192) === 128 && (b2 & 192) === 128 && (b3 & 192) === 128) {
        c = (b0 & 15) << 18 | (b1 & 63) << 12 | (b2 & 63) << 6 | b3 & 63;
        if (c <= 65535 || c >= 1114112) {
          c = null;
        }
      }
    }
    if (c === null) {
      c = 65533;
      bytesPerSequence = 1;
    } else if (c > 65535) {
      c -= 65536;
      str += String.fromCharCode(c >>> 10 & 1023 | 55296);
      c = 56320 | c & 1023;
    }
    str += String.fromCharCode(c);
    i += bytesPerSequence;
  }
  return str;
}

// src/roads-vector.mjs
var cache = /* @__PURE__ */ new Map();
var xTile = (lon, z) => Math.floor((lon + 180) / 360 * 2 ** z);
var yTile = (lat, z) => Math.floor((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * 2 ** z);
var allowed = /* @__PURE__ */ new Set(["motorway", "trunk", "primary", "secondary", "tertiary", "minor", "service"]);
async function fetchRoadVectors({ south, west, north, east }, { fetcher = fetch } = {}) {
  if (![south, west, north, east].every(Number.isFinite) || south >= north || west >= east || south < 29 || north > 45 || west < -33 || east > 5 || north - south > 0.12 || east - west > 0.18) throw Error("bounds");
  let meta = cache.get("metadata");
  if (!meta) {
    const r = await fetcher("https://tiles.openfreemap.org/planet", { signal: AbortSignal.timeout(12e3), redirect: "error" });
    if (!r.ok) throw Error("metadata");
    meta = await r.json();
    if (!/^https:\/\/tiles\.openfreemap\.org\/planet\/[a-zA-Z0-9_-]+\/\{z\}\/\{x\}\/\{y\}\.pbf$/.test(meta.tiles?.[0])) throw Error("template");
    cache.set("metadata", meta);
  }
  const z = 13, jobs = [];
  for (let x = xTile(west, z); x <= xTile(east, z); x++) for (let y = yTile(north, z); y <= yTile(south, z); y++) jobs.push({ x, y });
  if (jobs.length > 12) throw Error("tiles");
  const roads = [];
  for (let i = 0; i < jobs.length; i += 4) {
    const result = await Promise.all(jobs.slice(i, i + 4).map(async ({ x, y }) => {
      const url = meta.tiles[0].replace("{z}", z).replace("{x}", x).replace("{y}", y);
      let bytes = cache.get(url);
      if (!bytes) {
        const r = await fetcher(url, { signal: AbortSignal.timeout(15e3), redirect: "error" });
        if (!r.ok) throw Error("tile");
        bytes = new Uint8Array(await r.arrayBuffer());
        if (bytes.length > 2e6) throw Error("size");
        if (cache.size > 50) cache.delete([...cache.keys()].find((k) => k !== "metadata"));
        cache.set(url, bytes);
      }
      const tile = new VectorTile(new PbfReader(bytes)), layer = tile.layers.transportation, out = [];
      if (!layer) return out;
      if (layer.length > 2e4) throw Error("features");
      for (let n = 0; n < layer.length; n++) {
        const f = layer.feature(n);
        if (f.type !== 2 || !allowed.has(f.properties.class)) continue;
        const geo = f.toGeoJSON(x, y, z);
        const lines = geo.geometry.type === "LineString" ? [geo.geometry.coordinates] : geo.geometry.type === "MultiLineString" ? geo.geometry.coordinates : [];
        for (const geometry of lines) {
          if (geometry.length < 2 || geometry.length > 2e3 || !geometry.every((p) => p.length === 2 && p.every(Number.isFinite))) continue;
          const name = String(f.properties.ref || f.properties.name || "Via cartogr\xE1fica - " + f.properties.class).slice(0, 150);
          let run = [];
          for (let k = 1; k < geometry.length; k++) {
            const a = geometry[k - 1], b = geometry[k], hit = Math.max(a[0], b[0]) >= west && Math.min(a[0], b[0]) <= east && Math.max(a[1], b[1]) >= south && Math.min(a[1], b[1]) <= north;
            if (hit) {
              if (!run.length) run.push(a);
              run.push(b);
            } else if (run.length) {
              out.push({ name, geometry: run });
              run = [];
            }
          }
          if (run.length) out.push({ name, geometry: run });
        }
      }
      return out;
    }));
    roads.push(...result.flat());
  }
  if (roads.reduce((n, r) => n + r.geometry.length - 1, 0) > 2e4) throw Error("segments");
  return roads;
}

// site/hazard-core.mjs
var MAX_AGE = 36e5;
function clean(value) {
  const s = String(value ?? "");
  return s.includes("\uFFFD") ? "Designa\xE7\xE3o indispon\xEDvel na origem" : s.slice(0, 800);
}
function instant(value) {
  if (value === null || value === void 0 || value === "") return null;
  let d;
  if (typeof value === "number") d = new Date(value);
  else {
    const s = String(value), m = s.match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)(?::(\d\d)(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)?$/);
    if (!m) return null;
    const [y, month, day, hour, minute, second] = m.slice(1).map((x) => Number(x ?? 0)), check = new Date(Date.UTC(y, month - 1, day, hour, minute, second));
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day || check.getUTCHours() !== hour || check.getUTCMinutes() !== minute || check.getUTCSeconds() !== second) return null;
    d = new Date(/Z$|[+-]\d\d:\d\d$/.test(s) ? s : s + "Z");
  }
  return Number.isFinite(+d) ? d.toISOString() : null;
}
function coordinates(lon, lat) {
  return typeof lon === "number" && typeof lat === "number" && Number.isFinite(lon) && Number.isFinite(lat) && lat >= 29 && lat <= 45 && lon >= -33 && lon <= 5;
}
var fold = (v) => String(v ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
function natureKind(code, nature) {
  const s = fold(nature);
  if (code >= 3101 && code <= 3108) return "fire";
  if (/inund|cheia/.test(s)) return "flood";
  if (/movimento de massa|desliz|derroc/.test(s)) return "landslide";
  if (/colis|despiste|atropel|acidente.*via|acidente.*rodov/.test(s)) return "road_incident";
  if (/queda.*arvor|queda.*estrutura/.test(s)) return "obstruction";
  return "other";
}
function normalize(source, data, fetchedAt, areas = {}) {
  const features = [];
  let rejected = 0, ignored = 0, encodingLoss = 0;
  const push = (id, lon, lat, p) => {
    if (!coordinates(lon, lat)) throw Error("coordinates");
    features.push({ type: "Feature", id: `${source}:${id}`, geometry: { type: "Point", coordinates: [lon, lat] }, properties: { ...p, source, fetched_at: fetchedAt, closure_confirmed: false } });
  };
  if (source === "sifor" || source === "emsc") {
    if (data?.type !== "FeatureCollection" || !Array.isArray(data.features) || data.features.length > 2e3 || data.exceededTransferLimit || data.properties?.exceededTransferLimit) throw Error("incomplete_feed");
    for (const f of data.features) {
      try {
        const p = f.properties;
        if (!p) throw Error("properties");
        const xy = f.geometry?.type === "Point" ? f.geometry.coordinates : [Number(p.Longitude), Number(p.Latitude)];
        if (source === "sifor") {
          const code = Number(p.CodNatureza);
          if (!Number.isFinite(code) || p.ID_oc == null) throw Error("identity");
          const state = clean(p.EstadoAgrupado);
          if (natureKind(code, p.Natureza) === "other" || /encerrad|anulad|extint/.test(fold(state))) {
            ignored++;
            continue;
          }
          if ([p.Concelho, p.Freguesia, p.Natureza].some((v) => String(v).includes("\uFFFD"))) encodingLoss++;
          push(p.ID_oc, xy[0], xy[1], { kind: natureKind(code, p.Natureza), title: clean(p.Natureza), area: clean(p.Concelho), parish: clean(p.Freguesia), state, updated_at: instant(p.DataDosDados), observed_at: instant(p.DataInicioOcorrencia), source_time_original: clean(p.DataInicioOcorrencia), geometry_role: "event_point", source_url: "https://www.sgifr.gov.pt/ocorrencias", attribution: "Fonte: \xA9SIFOR - Sistema de Informa\xE7\xE3o de Fogos Rurais; ANEPC", license: "SIFOR terms: attribution; noncommercial research", license_url: "https://www.sgifr.gov.pt/termos-e-condicoes" });
        } else {
          const at = instant(p.time);
          if (!at || Date.parse(at) > Date.parse(fetchedAt) + 6e4 || Date.parse(fetchedAt) - Date.parse(at) > 7 * 864e5) {
            ignored++;
            continue;
          }
          if (f.id == null && p.unid == null) throw Error("event_id");
          push(f.id ?? p.unid, xy[0], xy[1], { kind: "earthquake", title: clean(p.flynn_region), area: clean(p.flynn_region), state: "Observa\xE7\xE3o s\xEDsmica", observed_at: at, updated_at: instant(p.lastupdate), magnitude: p.mag == null ? null : Number(p.mag), geometry_role: "observation_point", source_url: "https://www.seismicportal.eu/", attribution: "EMSC-CSEM SeismicPortal; " + clean(p.auth), license: "CC-BY-4.0", license_url: "https://www.seismicportal.eu/terms.html" });
        }
      } catch {
        rejected++;
      }
    }
  } else if (source === "ipma") {
    if (!Array.isArray(data) || data.length > 2e3) throw Error("warning_shape");
    for (const p of data) {
      try {
        const from = instant(p.startTime), until = instant(p.endTime);
        if (!from || !until || until < from) throw Error("warning_time");
        if (!["yellow", "orange", "red"].includes(p.awarenessLevelID) || Date.parse(from) > Date.parse(fetchedAt) || Date.parse(until) < Date.parse(fetchedAt)) {
          ignored++;
          continue;
        }
        const a = areas[p.idAreaAviso];
        if (!a) throw Error("area_geometry");
        push([p.idAreaAviso, p.awarenessTypeName, from, until].join(":"), Number(a.longitude), Number(a.latitude), { kind: "weather", title: clean(p.awarenessTypeName), area: clean(a.local), state: p.awarenessLevelID, description: clean(p.text), valid_from: from, valid_until: until, updated_at: null, geometry_role: "area_representative", source_url: "https://www.ipma.pt/pt/otempo/prev-sam/", attribution: "IPMA, I.P.", license: "IPMA API: public noncommercial use with attribution", license_url: "https://api.ipma.pt/#termos" });
      } catch {
        rejected++;
      }
    }
  } else throw Error("unknown_source");
  return { features, rejected, ignored, encoding_loss: encodingLoss };
}
function sourceFresh(f, now = Date.now()) {
  const p = f.properties, t = Date.parse(p.fetched_at);
  if (!Number.isFinite(t) || now < t - 6e4 || now - t > MAX_AGE || p.source_state === "stale" || p.source_state === "unavailable") return false;
  if (p.kind === "weather") return Date.parse(p.valid_from) <= now && now <= Date.parse(p.valid_until);
  if (p.source === "sifor") {
    const u = Date.parse(p.updated_at);
    return Number.isFinite(u) && now - u <= MAX_AGE && u <= now + 3e5;
  }
  return true;
}
function distanceM(a, b) {
  const r = Math.PI / 180, [x, y] = a, [u, v] = b, dy = (v - y) * r, dx = (u - x) * r;
  return 12742e3 * Math.asin(Math.min(1, Math.sqrt(Math.sin(dy / 2) ** 2 + Math.cos(y * r) * Math.cos(v * r) * Math.sin(dx / 2) ** 2)));
}
function nearby(features, point, radius = 1e3, now = Date.now()) {
  if (!coordinates(...point) || !Number.isFinite(radius) || radius < 100 || radius > 5e3) throw Error("invalid_screening");
  return features.filter((f) => sourceFresh(f, now) && ["fire", "flood", "landslide", "road_incident", "obstruction"].includes(f.properties.kind) && ["em curso", "em despacho", "em resolucao"].includes(fold(f.properties.state).trim())).map((f) => ({ feature: f, distance_m: Math.round(distanceM(point, f.geometry.coordinates)) })).filter((x) => x.distance_m <= radius).sort((a, b) => a.distance_m - b.distance_m);
}
function segmentDistanceM(point, a, b) {
  if (![point, a, b].every((p) => Array.isArray(p) && coordinates(...p))) return Infinity;
  const sy = 111195, sx = sy * Math.cos(point[1] * Math.PI / 180);
  const ax = (a[0] - point[0]) * sx, ay = (a[1] - point[1]) * sy, bx = (b[0] - point[0]) * sx, by = (b[1] - point[1]) * sy;
  const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(ax + t * dx, ay + t * dy);
}
function roadScreening(road, features, radius = 500, now = Date.now()) {
  if (!Array.isArray(road) || road.length < 2 || road.length > 1e4 || !Number.isFinite(radius) || radius < 100 || radius > 2e3) return [];
  const active = features.filter((f) => sourceFresh(f, now) && ["fire", "flood", "landslide", "road_incident", "obstruction"].includes(f.properties.kind) && ["em curso", "em despacho", "em resolucao"].includes(fold(f.properties.state).trim()));
  return active.map((feature) => ({ feature, distance_m: Math.round(Math.min(...road.slice(1).map((b, i) => segmentDistanceM(feature.geometry.coordinates, road[i], b)))) })).filter((x) => x.distance_m <= radius);
}

// site/hazard-sources.mjs
var fire = "https://api.sgifr.gov.pt/arcgis/rest/services/ANEPC/ocorrencias-ativas/FeatureServer/0/query";
function sourceUrls(now = Date.now()) {
  const where = "(CodNatureza BETWEEN 3101 AND 3108) OR CodNatureza=3313 OR UPPER(Natureza) LIKE '%INUNDA%' OR UPPER(Natureza) LIKE '%CHEIA%' OR UPPER(Natureza) LIKE '%DESLIZ%' OR UPPER(Natureza) LIKE '%COLIS%' OR UPPER(Natureza) LIKE '%DESPISTE%' OR UPPER(Natureza) LIKE '%ATROPEL%' OR UPPER(Natureza) LIKE '%QUEDA%RVOR%' OR UPPER(Natureza) LIKE '%QUEDA%ESTRUT%'";
  const f = new URL(fire);
  f.search = new URLSearchParams({ where, outFields: "ID_oc,CodNatureza,Natureza,EstadoAgrupado,DataInicioOcorrencia,DataDosDados,Concelho,Freguesia,Latitude,Longitude", outSR: "4326", f: "geojson", resultRecordCount: "2000" });
  const e = new URL("https://www.seismicportal.eu/fdsnws/event/1/query");
  e.search = new URLSearchParams({ format: "json", starttime: new Date(now - 7 * 864e5).toISOString(), minlatitude: "29", maxlatitude: "45", minlongitude: "-33", maxlongitude: "5", limit: "1000", orderby: "time" });
  return { sifor: f.href, ipma: "https://api.ipma.pt/open-data/forecast/warnings/warnings_www.json", areas: "https://api.ipma.pt/open-data/distrits-islands.json", emsc: e.href };
}
async function read(url, fetcher) {
  const r = await fetcher(url, { signal: AbortSignal.timeout(2e4), redirect: "error", headers: { Accept: "application/json" } });
  if (r.status === 204) return { type: "FeatureCollection", features: [] };
  if (!r.ok) throw Error("source_http_" + r.status);
  const reader = r.body.getReader(), chunks = [];
  let bytes = 0;
  try {
    for (; ; ) {
      const x = await reader.read();
      if (x.done) break;
      bytes += x.value.length;
      if (bytes > 5e6) throw Error("source_size");
      chunks.push(x.value);
    }
  } finally {
    await reader.cancel();
  }
  const b = new Uint8Array(bytes);
  let pos = 0;
  for (const x of chunks) {
    b.set(x, pos);
    pos += x.length;
  }
  return JSON.parse(new TextDecoder().decode(b));
}
async function fetchHazards({ fetcher = fetch, previous = null, now = Date.now() } = {}) {
  const urls = sourceUrls(now), at = new Date(now).toISOString(), ids = ["sifor", "ipma", "areas", "emsc"];
  const results = await Promise.allSettled(ids.map((id) => read(urls[id], fetcher)));
  const payload = Object.fromEntries(ids.map((id, i) => [id, results[i]]));
  const areas = {};
  if (payload.areas.status === "fulfilled") {
    for (const row of payload.areas.value.data ?? []) if (!areas[row.idAreaAviso]) areas[row.idAreaAviso] = row;
  }
  const features = [], sources = [];
  for (const id of ["sifor", "ipma", "emsc"]) {
    try {
      if (payload[id].status !== "fulfilled") throw Error("source_unavailable");
      const result = normalize(id, payload[id].value, at, areas);
      features.push(...result.features.map((f) => ({ ...f, properties: { ...f.properties, source_state: result.rejected ? "partial" : "ok" } })));
      sources.push({ id, status: result.rejected ? "partial" : "ok", retrieved_at: at, count: result.features.length, rejected: result.rejected, ignored: result.ignored, encoding_loss: result.encoding_loss, url: urls[id] });
    } catch {
      const old = previous?.features?.filter((f) => f.properties?.source === id) ?? [];
      features.push(...old.map((f) => ({ ...f, properties: { ...f.properties, source_state: "stale" } })));
      sources.push({ id, status: old.length ? "stale" : "unavailable", retrieved_at: null, count: old.length, rejected: 0, encoding_loss: 0, url: urls[id] });
    }
  }
  return { type: "FeatureCollection", features, metadata: { generated_at: at, sources, screening_only: true, road_closure_inference: false } };
}

// site/locations.mjs
var zones = { lisboa: { lat: 38.72, lng: -9.14, zoom: 12 }, coimbra: { lat: 40.21, lng: -8.43, zoom: 12 }, porto: { lat: 41.15, lng: -8.61, zoom: 12 }, portugal: { lat: 39.55, lng: -8.05, zoom: 8, bounds: [[36.8, -9.6], [42.2, -6.1]] }, madeira: { lat: 32.8, lng: -16.95, zoom: 9, bounds: [[32.3, -17.5], [33.4, -16.2]] }, acores: { lat: 38.3, lng: -28.2, zoom: 8, bounds: [[36.7, -31.5], [40, -24.5]] } };
function parseLocation(value) {
  const p = String(value).split(",");
  if (p.length !== 2 || p.some((x) => !x.trim())) return null;
  const [lat, lng] = p.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 29 || lat > 45 || lng < -33 || lng > 5) return null;
  return { lat, lng };
}

// site/geolocation.mjs
function requestLocation(provider, apply, report) {
  if (!provider?.getCurrentPosition) {
    report("Este navegador n\xE3o fornece localiza\xE7\xE3o. Escolhe a zona, as coordenadas ou um ponto no mapa.");
    return;
  }
  report("A pedir localiza\xE7\xE3o ao navegador\u2026");
  provider.getCurrentPosition((p) => {
    if (apply(p.coords.latitude, p.coords.longitude, { accuracy: p.coords.accuracy }) === false) return;
    report(`Localiza\xE7\xE3o recebida, precis\xE3o indicada de ${Math.round(p.coords.accuracy)} m. Localiza\xE7\xE3o aplicada ao mapa de tr\xE2nsito.`);
  }, () => {
    report("Localiza\xE7\xE3o n\xE3o autorizada ou indispon\xEDvel. Podes permitir o acesso nas defini\xE7\xF5es do site, escolher uma zona ou indicar coordenadas.");
  }, { enableHighAccuracy: false, timeout: 12e3, maximumAge: 6e4 });
}

// src/hazards-map.js
var $ = (id) => document.getElementById(id);
var names = { fire: "Inc\xEAndio", flood: "Inunda\xE7\xE3o / cheia", landslide: "Movimento de massa", road_incident: "Ocorr\xEAncia rodovi\xE1ria", obstruction: "Obstru\xE7\xE3o", weather: "Aviso meteorol\xF3gico", earthquake: "Sismo observado", other: "Outra ocorr\xEAncia" };
var colors = { fire: "#f27830", flood: "#36a7ff", landslide: "#c59a68", road_incident: "#df668a", obstruction: "#ddad50", weather: "#f5bb3a", earthquake: "#7bbfff", other: "#a9a1ce" };
var map = L.map("hazards-map", { scrollWheelZoom: false }).fitBounds([[36.8, -9.6], [42.2, -6.1]]);
map.attributionControl.addAttribution('<a href="https://openfreemap.org/">OpenFreeMap</a> \xB7 \xA9OpenMapTiles \xB7 <a href="https://www.openstreetmap.org/copyright">ODbL</a>');
var requestedZone = new URLSearchParams(location.search).get("zone");
if (zones[requestedZone]) {
  const z = zones[requestedZone];
  if (z.bounds) map.fitBounds(z.bounds);
  else map.setView([z.lat, z.lng], z.zoom);
}
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '\xA9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
var points = L.layerGroup().addTo(map);
var dataset = { features: [], metadata: { sources: [] } };
var selection;
var selectedMarker;
var rangeCircle;
var accuracyCircle;
var busy = false;
var date = (v) => v ? new Date(v).toLocaleString("pt-PT", { timeZone: "UTC" }) + " UTC" : "n\xE3o fornecida";
function text(tag, value) {
  const node = document.createElement(tag);
  node.textContent = value;
  return node;
}
function screen() {
  if (!selection) return;
  const radius = Number($("screen-radius").value), matches = nearby(dataset.features, selection, radius);
  $("nearby").replaceChildren(text("p", matches.length ? `${matches.length} ocorr\xEAncia(s) atual(is) localizada(s) a at\xE9 ${radius} m. Verificar poss\xEDveis condicionamentos com as autoridades; n\xE3o \xE9 um corte confirmado.` : `Sem ocorr\xEAncia atual localizada a at\xE9 ${radius} m na amostra dispon\xEDvel. Dados em falta ou antigos n\xE3o permitem garantir circula\xE7\xE3o livre.`));
  for (const x of matches) {
    const p = x.feature.properties;
    $("nearby").append(text("p", `${names[p.kind]} \xB7 ${p.area} \xB7 ${p.state} \xB7 ${x.distance_m} m`));
  }
  if (rangeCircle) rangeCircle.setRadius(radius);
}
function select(lat, lng, { accuracy = null, zoom = 14 } = {}) {
  if (!coordinates(lng, lat)) {
    $("location-status").textContent = "Escolhe uma localiza\xE7\xE3o na \xE1rea de Portugal e Atl\xE2ntico acompanhada por esta aplica\xE7\xE3o.";
    return false;
  }
  selection = [lng, lat];
  map.setView([lat, lng], zoom);
  if (selectedMarker) map.removeLayer(selectedMarker);
  if (rangeCircle) map.removeLayer(rangeCircle);
  if (accuracyCircle) map.removeLayer(accuracyCircle);
  selectedMarker = L.marker([lat, lng]).addTo(map).bindPopup("Ponto escolhido para triagem de proximidade; n\xE3o certifica um tro\xE7o ou uma rota.");
  rangeCircle = L.circle([lat, lng], { radius: Number($("screen-radius").value), color: "#70d4d4", weight: 2, fillOpacity: 0.06 }).addTo(map);
  if (accuracy) accuracyCircle = L.circle([lat, lng], { radius: accuracy, color: "#fff", weight: 1, fillOpacity: 0 }).addTo(map);
  $("coordinates").value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  screen();
  return true;
}
function render() {
  points.clearLayers();
  const now = Date.now(), enabled = new Set([...document.querySelectorAll("[data-kind]:checked")].map((e) => e.dataset.kind));
  let visible = 0, old = 0;
  for (const f of dataset.features) {
    const p = f.properties;
    if (!enabled.has(p.kind)) continue;
    const [lon, lat] = f.geometry.coordinates;
    if (!coordinates(lon, lat)) continue;
    const fresh = sourceFresh(f, now);
    if (!fresh) old++;
    const color = fresh ? p.kind === "weather" ? { yellow: "#f3ce48", orange: "#f28a34", red: "#e44c55" }[p.state] || "#aaa" : colors[p.kind] : "#8a979f";
    const point = L.circleMarker([lat, lon], { radius: p.kind === "fire" ? 8 : 6, color: "#102733", weight: 1, fillColor: color, fillOpacity: 0.9 });
    const node = document.createElement("div");
    node.append(text("strong", names[p.kind]), text("p", p.title), text("p", `${p.area}${p.parish ? " \xB7 " + p.parish : ""} \xB7 ${p.state}`), text("p", `${fresh ? "Dentro da janela de atualidade adotada" : "Dados antigos ou atualidade por confirmar"}. Publica\xE7\xE3o: ${date(p.updated_at)}. Recolha: ${date(p.fetched_at)}.`));
    if (p.kind === "earthquake") node.append(text("p", `Magnitude ${p.magnitude ?? "n\xE3o fornecida"} \xB7 observado em ${date(p.observed_at)}. N\xE3o demonstra dano ou corte de estrada.`));
    if (p.geometry_role === "area_representative") node.append(text("p", "Ponto representativo da \xE1rea de aviso IPMA. N\xE3o \xE9 a geometria da \xE1rea afetada nem um perigo localizado nesta coordenada."));
    if (p.source_time_original) node.append(text("p", "In\xEDcio indicado pela fonte: " + p.source_time_original + " (formato original)."));
    node.append(text("small", p.attribution));
    const link = document.createElement("a");
    link.href = p.source_url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Consultar fonte";
    node.append(document.createElement("br"), link);
    point.bindPopup(node).bindTooltip(`${names[p.kind]} \xB7 ${p.area}`).addTo(points);
    const shape = point.getElement();
    if (shape) {
      shape.setAttribute("data-hazard", p.kind);
      shape.setAttribute("aria-label", `${names[p.kind]} \xB7 ${p.area} \xB7 ${fresh ? "registo dentro da janela" : "atualidade por confirmar"}`);
      shape.setAttribute("role", "button");
      shape.setAttribute("tabindex", "0");
      shape.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          point.openPopup();
        }
      });
    }
    visible++;
  }
  $("hazards-count").textContent = `${visible} registos representados \xB7 ${old} com atualiza\xE7\xE3o antiga ou desconhecida. Sem dados n\xE3o significa aus\xEAncia de perigo.`;
  $("source-status").replaceChildren();
  for (const s of dataset.metadata?.sources ?? []) {
    const ff = dataset.features.filter((f) => f.properties.source === s.id), fresh = ff.filter((f) => sourceFresh(f)).length;
    $("source-status").append(text("li", `${s.id.toUpperCase()}: ${s.status} \xB7 ${ff.length} registos \xB7 ${fresh} dentro da janela adotada \xB7 recolha ${date(s.retrieved_at)}${s.encoding_loss ? " \xB7 texto degradado na origem" : ""}`));
  }
  screen();
  renderRoads();
}
async function refresh() {
  if (busy) return;
  busy = true;
  $("refresh-hazards").disabled = true;
  $("hazards-count").textContent = "A consultar fontes de ocorr\xEAncias e avisos\u2026";
  try {
    const data = await fetchHazards({ previous: dataset });
    dataset = data;
    render();
  } finally {
    busy = false;
    $("refresh-hazards").disabled = false;
  }
}
for (const checkbox of document.querySelectorAll("[data-kind]")) checkbox.onchange = render;
$("screen-radius").onchange = screen;
$("refresh-hazards").onclick = refresh;
map.on("click", (event) => {
  select(event.latlng.lat, event.latlng.lng, { zoom: map.getZoom() });
  $("location-status").textContent = "Ponto escolhido no mapa. A an\xE1lise \xE9 de proximidade; n\xE3o \xE9 uma valida\xE7\xE3o de estrada.";
});
$("coordinates-form").onsubmit = (event) => {
  event.preventDefault();
  const point = parseLocation($("coordinates").value);
  if (!point) {
    $("location-status").textContent = "Usa latitude, longitude; por exemplo 40.21, -8.43.";
    return;
  }
  select(point.lat, point.lng);
  $("location-status").textContent = "Localiza\xE7\xE3o manual aplicada ao mapa de eventos.";
};
$("locate").onclick = () => requestLocation(navigator.geolocation, select, (message) => {
  $("location-status").textContent = message;
});
window.addEventListener("ignispyro-zone", (event) => {
  const z = event.detail;
  if (z.bounds) map.fitBounds(z.bounds);
  else map.setView([z.lat, z.lng], z.zoom);
});
map.on("moveend", () => {
  const c = map.getCenter();
  window.dispatchEvent(new CustomEvent("ignispyro-map-center", { detail: { lat: c.lat, lng: c.lng, zoom: map.getZoom() } }));
});
var roadLayer = L.layerGroup().addTo(map);
var roadWays = [];
var roadQueryAt = null;
var roadNextAt = 0;
function renderRoads() {
  roadLayer.clearLayers();
  let affected = 0, total = 0;
  const enabled = new Set([...document.querySelectorAll("[data-kind]:checked")].map((e) => e.dataset.kind)), events = dataset.features.filter((f) => enabled.has(f.properties.kind));
  for (const way of roadWays) {
    for (let i = 1; i < way.geometry.length; i++) {
      const a = way.geometry[i - 1], b = way.geometry[i], matches = roadScreening([a, b], events, 500);
      total++;
      if (matches.length) affected++;
      const line = L.polyline([[a[1], a[0]], [b[1], b[0]]], { color: matches.length ? "#f29128" : "#397da4", weight: matches.length ? 7 : 3, opacity: matches.length ? 0.95 : 0.45, dashArray: matches.length ? "10 7" : null });
      const node = document.createElement("div");
      node.append(text("strong", way.name), text("p", matches.length ? "Poss\xEDvel condicionamento por proximidade (at\xE9 500 m). N\xE3o confirma corte nem impacto f\xEDsico." : "Geometria OpenStreetMap. Estado de circula\xE7\xE3o desconhecido."));
      for (const m of matches) node.append(text("p", `${names[m.feature.properties.kind]} \xB7 ${m.feature.properties.area} \xB7 aproximadamente ${m.distance_m} m`));
      node.append(text("small", "\xA9 OpenStreetMap contributors \xB7 ODbL \xB7 consulta " + date(roadQueryAt)));
      line.bindPopup(node).addTo(roadLayer);
    }
  }
  points.eachLayer((point) => point.bringToFront?.());
  if (roadWays.length) $("roads-status").textContent = `${total} segmentos cartogr\xE1ficos consultados; ${affected} com poss\xEDvel condicionamento por ocorr\xEAncia atual pr\xF3xima. Regra explorat\xF3ria de 500 m, sem confirma\xE7\xE3o de corte. N\xE3o se medem velocidades ou congestionamento.`;
}
$("load-roads").onclick = async () => {
  if (Date.now() < roadNextAt) {
    $("roads-status").textContent = "Aguarda um minuto entre consultas da rede vi\xE1ria para respeitar a fonte gratuita.";
    return;
  }
  const box = map.getBounds();
  if (map.getZoom() < 13 || box.getNorth() - box.getSouth() > 0.12 || box.getEast() - box.getWest() > 0.18) {
    $("roads-status").textContent = "Aproxima o mapa a uma localidade (zoom 13 ou superior) para consultar as vias sem sobrecarregar a fonte gratuita.";
    return;
  }
  roadNextAt = Date.now() + 6e4;
  $("load-roads").disabled = true;
  roadWays = [];
  roadLayer.clearLayers();
  $("roads-status").textContent = "A consultar a rede vi\xE1ria desta zona\u2026";
  try {
    roadWays = await fetchRoadVectors({ south: box.getSouth(), west: box.getWest(), north: box.getNorth(), east: box.getEast() });
    roadQueryAt = (/* @__PURE__ */ new Date()).toISOString();
    renderRoads();
    if (!roadWays.length) $("roads-status").textContent = "Sem geometria vi\xE1ria devolvida para esta zona; circula\xE7\xE3o desconhecida.";
  } catch {
    roadWays = [];
    roadLayer.clearLayers();
    $("roads-status").textContent = "Rede vi\xE1ria indispon\xEDvel ou resposta incompleta. N\xE3o foi poss\xEDvel avaliar os tro\xE7os; circula\xE7\xE3o desconhecida.";
  } finally {
    $("load-roads").disabled = false;
  }
};
await installProducts({ map, L, render });
try {
  const r = await fetch(new URL("./data/hazards.geojson", import.meta.url), { cache: "no-store", signal: AbortSignal.timeout(1e4) });
  if (r.ok) {
    const d = await r.json();
    if (d.type === "FeatureCollection" && Array.isArray(d.features) && d.features.length <= 6e3) {
      dataset = d;
      render();
    }
  }
} catch {
}
await refresh();
setInterval(() => {
  if (!document.hidden) refresh();
}, 3e5);
