const svg = document.getElementById("map");
    const grid = document.getElementById("grid");
    const mapViewport = document.getElementById("mapViewport");
    const countriesGroup = document.getElementById("countries");
    const capitalMarkersGroup = document.getElementById("capitalMarkers");
    const labelLeadersGroup = document.getElementById("labelLeaders");
    const labelAnchorsGroup = document.getElementById("labelAnchors");
    const labelsGroup = document.getElementById("labels");
    const legend = document.getElementById("legend");
    const continentButtons = document.getElementById("continentButtons");
    const input = document.getElementById("guessInput");
    const voiceButton = document.getElementById("voiceButton");
    const form = document.getElementById("guessForm");
    const markButton = document.getElementById("markButton");
    const message = document.getElementById("message");
    const score = document.getElementById("score");
    const appTitle = document.getElementById("appTitle");
    const countryModeButton = document.getElementById("countryModeButton");
    const capitalModeButton = document.getElementById("capitalModeButton");
    const revealButton = document.getElementById("revealButton");
    const resetButton = document.getElementById("resetButton");
    const zoomInButton = document.getElementById("zoomInButton");
    const zoomOutButton = document.getElementById("zoomOutButton");
    const zoomResetButton = document.getElementById("zoomResetButton");
    const loading = document.getElementById("loading");

    const width = 1000;
    const height = 520;
    const padX = 26;
    const padY = 24;

    const colors = {
      "Africa": "var(--africa)",
      "Asia": "var(--asia)",
      "Europe": "var(--europe)",
      "North America": "var(--north-america)",
      "South America": "var(--south-america)",
      "Oceania": "var(--oceania)",
      "Antarctica": "var(--antarctica)",
      "Seven seas (open ocean)": "var(--other)"
    };

    const continentOrder = ["World", "Africa", "Asia", "Europe", "North America", "South America", "Oceania"];
    const countryOnlyAdminNames = new Set([
      "Australia",
      "China",
      "Cuba",
      "Denmark",
      "Finland",
      "France",
      "Israel",
      "Kazakhstan",
      "Netherlands",
      "New Zealand",
      "Palestine",
      "United Kingdom",
      "United States of America"
    ]);
    const nonCountryAdminNames = new Set([
      "Northern Cyprus",
      "Somaliland",
      "Taiwan"
    ]);
    const continentOverrides = {
      "Maldives": "Asia",
      "Mauritius": "Africa",
      "Seychelles": "Africa"
    };
    const continentLonLatBounds = {
      "Africa": { minLon: -20, maxLon: 55, minLat: -37, maxLat: 38 },
      "Asia": { minLon: 25, maxLon: 180, minLat: -12, maxLat: 82 },
      "Europe": { minLon: -25, maxLon: 45, minLat: 34, maxLat: 72 },
      "North America": { minLon: -170, maxLon: -50, minLat: 5, maxLat: 84 },
      "South America": { minLon: -85, maxLon: -30, minLat: -58, maxLat: 15 },
      "Oceania": { minLon: 110, maxLon: 180, minLat: -50, maxLat: 12 }
    };
    const continentIslandFocus = {
      "North America": {
        name: "Caribbean islands",
        bounds: { minLon: -86, maxLon: -58, minLat: 8, maxLat: 26 }
      }
    };

    const manualAliases = {
      "United States of America": ["United States", "USA", "US", "America", "U.S.A.", "U.S."],
      "United Kingdom": ["UK", "U.K.", "Britain", "Great Britain"],
      "Republic of Serbia": ["Serbia"],
      "Czechia": ["Czech Republic"],
      "Ivory Coast": ["Cote d'Ivoire", "Côte d’Ivoire", "Côte d'Ivoire"],
      "Democratic Republic of the Congo": ["DRC", "D.R.C.", "Congo Kinshasa", "Congo-Kinshasa", "Democratic Congo"],
      "Republic of the Congo": ["Congo", "Congo Brazzaville", "Congo-Brazzaville"],
      "United Republic of Tanzania": ["Tanzania"],
      "eSwatini": ["Eswatini", "Swaziland"],
      "Cabo Verde": ["Cape Verde"],
      "East Timor": ["Timor Leste", "Timor-Leste"],
      "Myanmar": ["Burma"],
      "Laos": ["Lao PDR", "Lao People's Democratic Republic"],
      "Syria": ["Syrian Arab Republic"],
      "Russia": ["Russian Federation"],
      "South Korea": ["Republic of Korea", "Korea South"],
      "North Korea": ["DPRK", "Democratic People's Republic of Korea", "Korea North"],
      "United Arab Emirates": ["UAE", "U.A.E."],
      "Vatican": ["Vatican City", "Holy See"],
      "The Bahamas": ["Bahamas"],
      "Federated States of Micronesia": ["Micronesia"],
      "São Tomé and Principe": ["Sao Tome and Principe", "Sao Tome", "São Tomé"],
      "Bosnia and Herzegovina": ["Bosnia"],
      "North Macedonia": ["Macedonia"],
      "Palestine": ["State of Palestine"],
      "Macao S.A.R": ["Macau", "Macao"],
      "Hong Kong S.A.R.": ["Hong Kong"],
      "Aland": ["Åland", "Aland Islands", "Åland Islands"],
      "Brunei": ["Brunei Darussalam"],
      "Moldova": ["Republic of Moldova"],
      "Bolivia": ["Plurinational State of Bolivia"],
      "Venezuela": ["Bolivarian Republic of Venezuela"],
      "Vietnam": ["Viet Nam"],
      "Iran": ["Islamic Republic of Iran"],
      "Turkey": ["Turkiye", "Türkiye"],
      "Gambia": ["The Gambia"],
      "Saint Barthelemy": ["St Barthelemy", "St. Barthelemy", "Saint Barthélemy"],
      "Saint Kitts and Nevis": ["St Kitts and Nevis", "St. Kitts and Nevis"],
      "Saint Lucia": ["St Lucia", "St. Lucia"],
      "Saint Martin": ["St Martin", "St. Martin"],
      "Saint Pierre and Miquelon": ["St Pierre and Miquelon", "St. Pierre and Miquelon"],
      "Saint Vincent and the Grenadines": ["St Vincent and the Grenadines", "St. Vincent and the Grenadines"],
      "South Georgia and the Islands": ["South Georgia and South Sandwich Islands"],
      "French Southern and Antarctic Lands": ["French Southern Territories"],
      "British Virgin Islands": ["Virgin Islands British"],
      "United States Virgin Islands": ["US Virgin Islands", "U.S. Virgin Islands"],
      "Northern Cyprus": ["Turkish Republic of Northern Cyprus"],
      "Somaliland": ["Somaliland Region"]
    };

    const foundIds = new Set();
    const foundTerritoryIds = new Set();
    const foundCapitalCountryIds = new Set();
    const foundCapitalCityIds = new Set();
    const countryByAlias = new Map();
    const countryById = new Map();
    let countryAnswerValidator = null;
    const countryIdByName = new Map();
    const capitalByAlias = new Map();
    const countryRecords = [];
    const regionRecords = [];
    const labelRecords = [];
    const capitalRecords = [];
    const continentCounts = new Map();
    let countryCount = 0;
    let labelsVisible = false;
    let quizMode = "countries";
    let selectedContinent = "World";
    let viewBox = { x: 0, y: 0, w: width, h: height };
    let recognition = null;
    let isListening = false;
    let legendNote = null;
    let feedbackSequence = 0;
    let latestFeedback = null;

    function normalize(value) {
      return GeographyGame.normalize(value);
    }

    function project(coord) {
      const lon = coord[0];
      const lat = coord[1];
      const x = padX + ((lon + 180) / 360) * (width - padX * 2);
      const y = padY + ((90 - lat) / 180) * (height - padY * 2);
      return [x, y];
    }

    function ringToPath(ring) {
      return ring.map((point, index) => {
        const [x, y] = project(point);
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      }).join(" ") + " Z";
    }

    function geometryToPath(geometry) {
      if (!geometry) return "";
      if (geometry.type === "Polygon") {
        return geometry.coordinates.map(ringToPath).join(" ");
      }
      if (geometry.type === "MultiPolygon") {
        return geometry.coordinates.flatMap(poly => poly.map(ringToPath)).join(" ");
      }
      return "";
    }

    function coordinatesForGeometry(geometry) {
      if (geometry.type === "Polygon") return geometry.coordinates.flat(1);
      if (geometry.type === "MultiPolygon") return geometry.coordinates.flat(2);
      return [];
    }

    function labelPosition(feature) {
      const labelLon = Number(feature.properties?.LABEL_X);
      const labelLat = Number(feature.properties?.LABEL_Y);
      if (Number.isFinite(labelLon) && Number.isFinite(labelLat)) {
        return project([labelLon, labelLat]);
      }
      const geometry = feature.geometry;
      const points = coordinatesForGeometry(geometry);
      if (!points.length) return [width / 2, height / 2];
      let minLon = Infinity;
      let maxLon = -Infinity;
      let minLat = Infinity;
      let maxLat = -Infinity;
      for (const [lon, lat] of points) {
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
      return project([(minLon + maxLon) / 2, (minLat + maxLat) / 2]);
    }

    function geometryBounds(geometry) {
      const points = coordinatesForGeometry(geometry).map(project);
      if (!points.length) return { minX: 0, minY: 0, maxX: width, maxY: height };
      return points.reduce((bounds, [x, y]) => ({
        minX: Math.min(bounds.minX, x),
        minY: Math.min(bounds.minY, y),
        maxX: Math.max(bounds.maxX, x),
        maxY: Math.max(bounds.maxY, y)
      }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
    }

    function mergeBounds(boundsList) {
      return boundsList.reduce((bounds, item) => ({
        minX: Math.min(bounds.minX, item.minX),
        minY: Math.min(bounds.minY, item.minY),
        maxX: Math.max(bounds.maxX, item.maxX),
        maxY: Math.max(bounds.maxY, item.maxY)
      }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
    }

    function makeSvgElement(name, attrs = {}) {
      const element = document.createElementNS("http://www.w3.org/2000/svg", name);
      for (const [key, value] of Object.entries(attrs)) {
        element.setAttribute(key, value);
      }
      return element;
    }

    function drawGrid() {
      for (let lon = -180; lon <= 180; lon += 30) {
        const [x1, y1] = project([lon, -90]);
        const [x2, y2] = project([lon, 90]);
        grid.appendChild(makeSvgElement("path", {
          class: "graticule",
          d: `M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`
        }));
      }
      for (let lat = -60; lat <= 60; lat += 30) {
        const [x1, y1] = project([-180, lat]);
        const [x2, y2] = project([180, lat]);
        grid.appendChild(makeSvgElement("path", {
          class: "graticule",
          d: `M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`
        }));
      }
    }

    function splitAliases(value) {
      return String(value || "")
        .split(/[|,;]+/)
        .map(part => part.trim())
        .filter(Boolean);
    }

    function aliasesFor(feature) {
      const p = feature.properties || {};
      const base = [
        p.ADMIN, p.NAME, p.NAME_LONG, p.BRK_NAME, p.SOVEREIGNT,
        p.NAME_EN, p.ISO_A2, p.ISO_A3, p.ADM0_A3
      ].filter(Boolean);
      const fromAlt = splitAliases(p.NAME_ALT);
      const manual = manualAliases[p.ADMIN] || manualAliases[p.NAME] || [];
      const expanded = [...base, ...fromAlt, ...manual];
      const saintExpanded = expanded.flatMap(name => {
        const n = String(name);
        if (/^Saint /.test(n)) return [n, n.replace(/^Saint /, "St "), n.replace(/^Saint /, "St. ")];
        return [n];
      });
      return [...new Set(saintExpanded.map(normalize).filter(Boolean))];
    }

    function displayName(feature) {
      const name = feature.properties.ADMIN || feature.properties.NAME || "Unnamed";
      return name === "Vatican" ? "Vatican City" : name;
    }

    function adminName(feature) {
      return feature.properties.ADMIN || feature.properties.NAME || "";
    }

    function countryContinent(feature) {
      const name = adminName(feature);
      return continentOverrides[name] || feature.properties.CONTINENT || "Seven seas (open ocean)";
    }

    function isCountryFeature(feature) {
      if (!feature.geometry || !feature.properties) return false;
      const name = adminName(feature);
      const type = feature.properties.TYPE;
      if (displayName(feature) === "Antarctica") return false;
      if (nonCountryAdminNames.has(name)) return false;
      return type === "Sovereign country" || countryOnlyAdminNames.has(name);
    }

    function isNamedTerritory(feature) {
      if (!feature.geometry || !feature.properties || isCountryFeature(feature)) return false;
      if (displayName(feature) === "Antarctica") return false;
      return feature.properties.TYPE === "Country" || feature.properties.TYPE === "Dependency";
    }

    function isLabelFeature(feature) {
      return isCountryFeature(feature) || isNamedTerritory(feature);
    }

    function isIntegratedCountryFeature(feature) {
      const name = adminName(feature);
      return name === "Somalia" || name === "Somaliland" ||
        name === "Cyprus" || name === "Northern Cyprus";
    }

    function isWesternSaharaFeature(feature) {
      return adminName(feature) === "Western Sahara";
    }

    function ownerCountryName(feature) {
      const owners = {
        "Somaliland": "Somalia",
        "Northern Cyprus": "Cyprus"
      };
      return owners[adminName(feature)] || null;
    }

    function registerSearchableRegion(feature, id, isCountry) {
      countryById.set(id, { feature, isCountry });
      const sovereignAlias = normalize(feature.properties.SOVEREIGNT);
      for (const alias of aliasesFor(feature)) {
        if (!isCountry && alias === sovereignAlias) continue;
        if (!countryByAlias.has(alias)) {
          countryByAlias.set(alias, id);
        }
      }
    }

    function setMessage(text, type = "") {
      message.textContent = text;
      message.className = `message ${type}`.trim();
      latestFeedback = Object.freeze({ sequence: ++feedbackSequence, message: String(text), kind: type || "info" });
      return latestFeedback;
    }

    function updateScore() {
      const visibleRecords = countryRecords.filter(record => isRecordVisible(record));
      const activeFoundIds = quizMode === "capitals" ? foundCapitalCountryIds : foundIds;
      const visibleFound = visibleRecords.filter(record => activeFoundIds.has(record.id)).length;
      const noun = quizMode === "capitals" ? "capitals" : "countries";
      if (selectedContinent === "World") {
        const territoryText = quizMode === "countries" && foundTerritoryIds.size
          ? ` · ${foundTerritoryIds.size} territories`
          : "";
        score.textContent = `${activeFoundIds.size} / ${countryCount} ${noun} found${territoryText}`;
      } else {
        score.textContent = `${visibleFound} / ${visibleRecords.length} ${selectedContinent} ${noun} found`;
      }
    }

    function refreshFoundStyles() {
      const activeFoundIds = quizMode === "capitals" ? foundCapitalCountryIds : foundIds;
      for (const record of regionRecords) {
        const ownerId = record.ownerId || record.id;
        const found = activeFoundIds.has(ownerId) ||
          (quizMode === "countries" && foundTerritoryIds.has(record.id));
        record.path.classList.toggle("found", found);
      }
      for (const record of capitalRecords) {
        record.anchor.classList.toggle("found", foundCapitalCityIds.has(record.capitalId));
      }
      updateLabelLayout();
    }

    function isRecordVisible(record) {
      if (window.GameMap?.gameActive) return true;
      return selectedContinent === "World" || record.continent === selectedContinent;
    }

    function zoomScale() {
      return width / viewBox.w;
    }

    let viewFrame = 0;
    function paintViewBox() {
      viewFrame = 0;
      svg.setAttribute("viewBox", `${viewBox.x.toFixed(2)} ${viewBox.y.toFixed(2)} ${viewBox.w.toFixed(2)} ${viewBox.h.toFixed(2)}`);
      updateLabelLayout();
      window.dispatchEvent(new Event("mapviewchange"));
    }

    function applyViewBox(interactive = false) {
      if (!interactive) {
        if (viewFrame) cancelAnimationFrame(viewFrame);
        paintViewBox();
        return;
      }
      if (!viewFrame) viewFrame = requestAnimationFrame(paintViewBox);
    }

    function clampViewBox(box) {
      const w = Math.min(width, Math.max(20, box.w));
      const h = Math.min(height, Math.max(11, box.h));
      return {
        x: Math.max(0, Math.min(width - w, box.x)),
        y: Math.max(0, Math.min(height - h, box.y)),
        w,
        h
      };
    }

    function setViewBox(nextViewBox, interactive = false) {
      viewBox = clampViewBox(nextViewBox);
      applyViewBox(interactive);
    }

    function worldViewBox() {
      return { x: 0, y: 0, w: width, h: height };
    }

    function viewBoxForBounds(bounds, padding = 34) {
      let minX = Math.max(0, bounds.minX - padding);
      let minY = Math.max(0, bounds.minY - padding);
      let maxX = Math.min(width, bounds.maxX + padding);
      let maxY = Math.min(height, bounds.maxY + padding);
      let boxW = Math.max(80, maxX - minX);
      let boxH = Math.max(70, maxY - minY);
      const targetRatio = svg.clientWidth / Math.max(1, svg.clientHeight);
      const boxRatio = boxW / boxH;

      if (boxRatio > targetRatio) {
        const neededH = boxW / targetRatio;
        const extra = neededH - boxH;
        minY -= extra / 2;
        maxY += extra / 2;
        boxH = neededH;
      } else {
        const neededW = boxH * targetRatio;
        const extra = neededW - boxW;
        minX -= extra / 2;
        maxX += extra / 2;
        boxW = neededW;
      }

      minX = Math.max(0, Math.min(width - boxW, minX));
      minY = Math.max(0, Math.min(height - boxH, minY));
      return { x: minX, y: minY, w: Math.min(width, boxW), h: Math.min(height, boxH) };
    }

    function boundsForLonLat(bounds) {
      const [minX, maxY] = project([bounds.minLon, bounds.minLat]);
      const [maxX, minY] = project([bounds.maxLon, bounds.maxLat]);
      return { minX, minY, maxX, maxY };
    }

    function fitSelectedContinent() {
      if (selectedContinent === "World") {
        setViewBox(worldViewBox());
        return;
      }
      if (continentLonLatBounds[selectedContinent]) {
        setViewBox(viewBoxForBounds(boundsForLonLat(continentLonLatBounds[selectedContinent])));
        return;
      }
      const visibleBounds = countryRecords
        .filter(record => isRecordVisible(record))
        .map(record => record.bounds);
      if (!visibleBounds.length) {
        setViewBox(worldViewBox());
        return;
      }
      setViewBox(viewBoxForBounds(mergeBounds(visibleBounds)));
    }

    function zoomBy(factor) {
      const centerX = viewBox.x + viewBox.w / 2;
      const centerY = viewBox.y + viewBox.h / 2;
      const minW = 20;
      const maxW = width;
      const nextW = Math.max(minW, Math.min(maxW, viewBox.w / factor));
      const nextH = nextW * viewBox.h / viewBox.w;
      setViewBox({
        x: Math.max(0, Math.min(width - nextW, centerX - nextW / 2)),
        y: Math.max(0, Math.min(height - nextH, centerY - nextH / 2)),
        w: nextW,
        h: nextH
      });
    }

    function focusIslandGroup() {
      const focus = continentIslandFocus[selectedContinent];
      if (!focus || !labelsVisible) return false;
      const focusBox = viewBoxForBounds(boundsForLonLat(focus.bounds), 8);
      const focusScale = width / focusBox.w;
      if (zoomScale() >= focusScale * 0.9) return false;
      setViewBox(focusBox);
      setMessage(`${focus.name} isolated. Dots mark exact island positions and lines connect each name.`);
      return true;
    }

    function canPan() {
      return viewBox.w < width || viewBox.h < height;
    }

    function panBy(screenDx, screenDy) {
      if (!canPan()) return;
      const rect = svg.getBoundingClientRect();
      const scale = Math.max(viewBox.w / rect.width, viewBox.h / rect.height);
      const dx = screenDx * scale;
      const dy = screenDy * scale;
      setViewBox({
        x: viewBox.x + dx,
        y: viewBox.y + dy,
        w: viewBox.w,
        h: viewBox.h
      });
    }

    const pointers = new Map();
    let gesture = null;
    function mapPoint(x, y) {
      return new DOMPoint(x, y).matrixTransform(svg.getScreenCTM().inverse());
    }
    function beginGesture() {
      const points = [...pointers.values()];
      if (!points.length) { gesture = null; return; }
      const a = points[0], b = points[1] || a;
      gesture = { box: { ...viewBox }, point: mapPoint((a.x + b.x) / 2, (a.y + b.y) / 2),
        distance: points.length > 1 ? Math.hypot(a.x - b.x, a.y - b.y) : 0 };
    }
    function startPan(event) {
      if (event.button !== 0) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      svg.setPointerCapture(event.pointerId);
      svg.classList.add("panning");
      beginGesture();
    }
    function movePan(event) {
      if (!pointers.has(event.pointerId) || !gesture) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const points = [...pointers.values()], a = points[0], b = points[1] || a;
      const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
      const rect = svg.getBoundingClientRect();
      const factor = gesture.distance ? Math.max(0.1, Math.hypot(a.x - b.x, a.y - b.y) / gesture.distance) : 1;
      const w = Math.max(20, Math.min(width, gesture.box.w / factor));
      const h = Math.max(11, Math.min(height, gesture.box.h * w / gesture.box.w));
      const screenX = Math.max(0, Math.min(1, (midX - rect.left) / Math.max(1, rect.width)));
      const screenY = Math.max(0, Math.min(1, (midY - rect.top) / Math.max(1, rect.height)));
      setViewBox({ x: gesture.point.x - screenX * w, y: gesture.point.y - screenY * h, w, h }, true);
    }
    function stopPan(event) {
      pointers.delete(event.pointerId);
      if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
      svg.classList.toggle("panning", pointers.size > 0);
      if (!pointers.size && viewFrame) { cancelAnimationFrame(viewFrame); paintViewBox(); }
      beginGesture();
    }

    function updateLabelLayout() {
      const svgRect = svg.getBoundingClientRect();
      const unitsPerPixel = Math.max(viewBox.w / Math.max(1, svgRect.width), viewBox.h / Math.max(1, svgRect.height));
      const fontSize = 12 * unitsPerPixel;
      const gap = 3 * unitsPerPixel;
      const placed = [];
      const matrix = svg.getScreenCTM();
      if (matrix) {
        for (const control of document.querySelectorAll(".zoom-controls, .legend-panel")) {
          const box = control.getBoundingClientRect();
          const start = new DOMPoint(box.left, box.top).matrixTransform(matrix.inverse());
          const end = new DOMPoint(box.right, box.bottom).matrixTransform(matrix.inverse());
          placed.push({ minX: start.x - gap, minY: start.y - gap, maxX: end.x + gap, maxY: end.y + gap });
        }
      }
      const mainlandCandidates = [
        [0, 0], [0, -17], [0, 17], [26, 0], [-26, 0],
        [24, -17], [-24, -17], [24, 17], [-24, 17],
        [0, -34], [0, 34], [42, 0], [-42, 0],
        [38, -28], [-38, -28], [38, 28], [-38, 28],
        [0, -52], [0, 52], [58, 0], [-58, 0]
      ];
      const islandCandidates = [
        [0, -24], [0, 24], [36, 0], [-36, 0],
        [30, -24], [-30, -24], [30, 24], [-30, 24],
        [0, -42], [0, 42], [58, 0], [-58, 0],
        [52, -34], [-52, -34], [52, 34], [-52, 34],
        [0, -64], [0, 64], [82, 0], [-82, 0]
      ];

      for (const record of labelRecords) {
        if ((record.mode || "countries") !== quizMode) {
          record.label.classList.add("suppressed");
          record.leader.classList.add("suppressed");
          record.anchor.classList.add("suppressed");
        }
      }

      const ordered = labelRecords
        .filter(record => (record.mode || "countries") === quizMode)
        .sort((a, b) =>
        Number((b.capitalId || b.id) === latestAnswerId) - Number((a.capitalId || a.id) === latestAnswerId) ||
        Number(isAnswered(b)) - Number(isAnswered(a)) ||
        Number(b.isCountry) - Number(a.isCountry) ||
        a.labelRank - b.labelRank ||
        b.area - a.area ||
        a.name.localeCompare(b.name)
      );
      let shown = 0;
      let hidden = 0;
      const islandAnchors = ordered
        .filter(record => record.isIsland && isRecordVisible(record))
        .map(record => ({ x: record.labelX, y: record.labelY }));

      for (const record of ordered) {
        const label = record.label;
        const leader = record.leader;
        const anchor = record.anchor;
        label.classList.remove("suppressed");
        leader.classList.remove("suppressed");
        anchor.classList.remove("suppressed");
        const foundCapital = record.mode === "capitals" && foundCapitalCityIds.has(record.capitalId);
        anchor.classList.toggle("found", foundCapital);
        if (record.mode !== "capitals" && !record.isIsland) anchor.classList.add("suppressed");
        label.style.fontSize = `${fontSize.toFixed(2)}px`;
        label.style.strokeWidth = `${(2.4 * unitsPerPixel).toFixed(2)}px`;
        const markerRadius = record.mode === "capitals" ? (foundCapital ? 3.5 : 2.8) : 2.4;
        anchor.setAttribute("r", (markerRadius * unitsPerPixel).toFixed(2));
        label.setAttribute("x", record.labelX.toFixed(2));
        label.setAttribute("y", record.labelY.toFixed(2));
        leader.setAttribute("x1", record.labelX.toFixed(2));
        leader.setAttribute("y1", record.labelY.toFixed(2));
        leader.setAttribute("x2", record.labelX.toFixed(2));
        leader.setAttribute("y2", record.labelY.toFixed(2));

        const answered = isAnswered(record);
        if (record.mode === "capitals") label.textContent = answered ? `${record.name} · ${record.country}` : record.name;
        for (const element of [label, leader, anchor]) element.classList.toggle("answered", answered);
        if ((!labelsVisible && !answered) || !isRecordVisible(record)) {
          label.classList.add("suppressed");
          leader.classList.add("suppressed");
          if (!foundCapital || !isRecordVisible(record)) anchor.classList.add("suppressed");
          continue;
        }

        const measuredWidth = label.getComputedTextLength();
        const textWidth = Math.max(28 * unitsPerPixel, measuredWidth) + 8 * unitsPerPixel;
        const textHeight = fontSize + 7 * unitsPerPixel;
        let chosen = null;

        const candidates = record.isIsland ? islandCandidates : mainlandCandidates;
        for (const [dxScreen, dyScreen] of candidates) {
          const dx = dxScreen * unitsPerPixel;
          const dy = dyScreen * unitsPerPixel;
          const rect = {
            minX: record.labelX + dx - textWidth / 2 - gap,
            maxX: record.labelX + dx + textWidth / 2 + gap,
            minY: record.labelY + dy - textHeight / 2 - gap,
            maxY: record.labelY + dy + textHeight / 2 + gap
          };
          const withinView = rect.minX >= viewBox.x && rect.maxX <= viewBox.x + viewBox.w &&
            rect.minY >= viewBox.y && rect.maxY <= viewBox.y + viewBox.h;
          const overlaps = placed.some(item =>
            rect.minX < item.maxX &&
            rect.maxX > item.minX &&
            rect.minY < item.maxY &&
            rect.maxY > item.minY
          );
          const coversIsland = islandAnchors.some(point =>
            point.x > rect.minX - gap && point.x < rect.maxX + gap &&
            point.y > rect.minY - gap && point.y < rect.maxY + gap
          );
          if (withinView && !overlaps && !coversIsland) {
            chosen = { dx, dy, rect };
            break;
          }
        }

        if (!chosen) {
          label.classList.add("suppressed");
          leader.classList.add("suppressed");
          if (record.mode !== "capitals") anchor.classList.add("suppressed");
          hidden += 1;
          continue;
        }

        const finalX = record.labelX + chosen.dx;
        const finalY = record.labelY + chosen.dy;
        label.setAttribute("x", finalX.toFixed(2));
        label.setAttribute("y", finalY.toFixed(2));
        if (record.isIsland || Math.hypot(chosen.dx, chosen.dy) > 8 * unitsPerPixel) {
          leader.setAttribute("x2", finalX.toFixed(2));
          leader.setAttribute("y2", finalY.toFixed(2));
        } else {
          leader.classList.add("suppressed");
        }
        placed.push(chosen.rect);
        shown += 1;
      }
      return { shown, hidden };
    }

    function playAnimation(element, className) {
      element.classList.remove(className);
      void element.getBoundingClientRect();
      element.classList.add(className);
      element.addEventListener("animationend", () => element.classList.remove(className), { once: true });
    }

    function celebrateCountry(id) {
      const label = labelRecords.find(record => (record.capitalId || record.id) === latestAnswerId);
      if (label && (label.labelX < viewBox.x || label.labelX > viewBox.x + viewBox.w ||
          label.labelY < viewBox.y || label.labelY > viewBox.y + viewBox.h)) {
        setViewBox({ ...viewBox, x: label.labelX - viewBox.w / 2, y: label.labelY - viewBox.h / 2 });
      }
      for (const record of regionRecords) {
        if ((record.ownerId || record.id) === id) playAnimation(record.path, "answer-pulse");
      }
    }

    let latestAnswerId = null;

    function isAnswered(record) {
      return record.mode === "capitals" ? foundCapitalCityIds.has(record.capitalId)
        : foundIds.has(record.id) || foundTerritoryIds.has(record.id);
    }

    function focusInput() {
      if (!document.querySelector(".app")?.hasAttribute("data-free-map-active")) return;
      if (matchMedia("(hover: hover) and (pointer: fine)").matches) input.focus({ preventScroll: true });
    }

    function markCountry(id, name) {
      const entry = countryById.get(id);
      if (!entry) return;
      const record = regionRecords.find(item => item.id === id);
      if (!record) return;
      const targetSet = entry.isCountry ? foundIds : foundTerritoryIds;
      const alreadyFound = targetSet.has(id);
      targetSet.add(id);
      latestAnswerId = id;
      record.path.classList.remove("dimmed");
      refreshFoundStyles();
      updateScore();
      if (entry.isCountry) {
        setMessage(alreadyFound ? `${name} was already marked.` : `Marked ${name}.`, "good");
      } else {
        const sovereign = entry.feature.properties.SOVEREIGNT;
        const note = sovereign && sovereign !== name ? `, part of ${sovereign}` : "";
        setMessage(`${name} is shown and highlighted as a territory${note}; it is not counted in the 195-country score.`, "good");
      }
      celebrateCountry(id);
    }

    function handleCountryGuess(raw) {
      const alias = normalize(raw);
      if (!alias) return;
      const id = countryAnswerValidator?.resolveId(raw, { allowFuzzy: true }) || countryByAlias.get(alias);
      if (!id) {
        setMessage(`No match for "${raw}". Try a common country name or ISO code.`, "bad");
        return;
      }
      const feature = countryById.get(id).feature;
      const continent = countryContinent(feature);
      if (selectedContinent !== "World" && continent !== selectedContinent) {
        setMessage(`${displayName(feature)} is in ${continent}. Select that continent first.`, "bad");
        return;
      }
      markCountry(id, displayName(feature));
    }

    function markCapital(record) {
      const alreadyFound = foundCapitalCountryIds.has(record.countryId);
      foundCapitalCountryIds.add(record.countryId);
      foundCapitalCityIds.add(record.capitalId);
      latestAnswerId = record.capitalId;
      refreshFoundStyles();
      updateScore();
      const roleText = record.role === "capital" ? "" : ` (${record.role})`;
      setMessage(
        alreadyFound
          ? `${record.name}${roleText} belongs to ${record.country}; that country was already scored.`
          : `Marked ${record.name}${roleText}, ${record.country}.`,
        "good"
      );
      celebrateCountry(record.countryId);
    }

    function handleCapitalGuess(raw) {
      const alias = normalize(raw);
      if (!alias) return;
      if (alias === normalize("Malabo")) {
        setMessage("Malabo was replaced by Ciudad de la Paz as Equatorial Guinea's capital in January 2026.", "bad");
        return;
      }
      const record = capitalByAlias.get(alias);
      if (!record) {
        setMessage(`No capital match for "${raw}". Try the current capital's common English name.`, "bad");
        return;
      }
      if (selectedContinent !== "World" && record.continent !== selectedContinent) {
        setMessage(`${record.name} is the capital of ${record.country} in ${record.continent}. Select that continent first.`, "bad");
        return;
      }
      markCapital(record);
    }

    function countrySummary(id) {
      const entry = countryById.get(id);
      if (!entry?.isCountry) return null;
      const feature = entry.feature;
      const properties = feature.properties || {};
      const iso2 = /^[A-Z]{2}$/.test(properties.ISO_A2_EH)
        ? properties.ISO_A2_EH
        : (/^[A-Z]{2}$/.test(properties.ISO_A2) ? properties.ISO_A2 : null);
      const iso3 = properties.ISO_A3_EH !== '-99' ? properties.ISO_A3_EH : properties.ADM0_A3;
      const capitals = capitalRecords
        .filter(record => record.countryId === id)
        .map(record => ({ name: record.name, role: record.role }));
      return Object.freeze({
        id,
        name: displayName(feature),
        iso2,
        iso3,
        continent: countryContinent(feature),
        subregion: properties.SUBREGION || null,
        capitals: Object.freeze(capitals)
      });
    }

    function handleGuess(raw) {
      const handled = window.gameController?.handleText(raw);
      if (handled) return handled;
      if (!normalize(raw)) return;
      if (quizMode === "capitals") handleCapitalGuess(raw);
      else handleCountryGuess(raw);
      if (message.classList.contains("bad")) playAnimation(form.closest("section"), "wrong-answer");
    }

    function showVoiceDialog({ title, message }) {
      const dialog = document.getElementById("voiceDialog");
      if (!dialog) {
        setMessage(message.replace(/\n+/g, " "), "bad");
        return;
      }
      const titleEl = document.getElementById("voiceDialogTitle");
      const msgEl = document.getElementById("voiceDialogMessage");
      const closeBtn = document.getElementById("voiceDialogClose");
      if (titleEl) titleEl.textContent = title;
      if (msgEl) msgEl.textContent = message;
      const onClose = () => {
        dialog.removeEventListener("close", onClose);
        voiceButton?.focus({ preventScroll: true });
      };
      dialog.addEventListener("close", onClose);
      if (!dialog.open) {
        try { dialog.showModal(); } catch { dialog.setAttribute("open", ""); }
      }
      closeBtn?.focus({ preventScroll: true });
    }

    function stopVoiceInput(reason = "cancelled") {
      if (recognition?.active) {
        try { recognition.abort(); } catch {}
      }
      isListening = false;
      voiceButton.classList.remove("listening", "starting", "processing", "permission");
      voiceButton.setAttribute("aria-busy", "false");
      voiceButton.setAttribute("aria-pressed", "false");
      voiceButton.setAttribute("aria-label", quizMode === "capitals" ? "Say capital name" : "Say country name");
      voiceButton.textContent = "Speak";
      if (reason === "cancelled") {
        setMessage("Microphone stopped. Press Speak to try again or type your answer.");
      }
    }

    function setupVoiceInput() {
      const createRecognition = (function() {
        const LocalSR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (LocalSR) return () => new LocalSR();
        try {
          if (window.top && typeof window.top.createSpeechRecognition === "function") {
            return () => window.top.createSpeechRecognition();
          }
          if (window.top && (window.top.SpeechRecognition || window.top.webkitSpeechRecognition)) {
            const TopSR = window.top.SpeechRecognition || window.top.webkitSpeechRecognition;
            return () => new TopSR();
          }
        } catch (e) {}
        return null;
      })();
      const VoiceInputController = window.CountryMemoryVoice?.VoiceInputController;
      if (!createRecognition || !VoiceInputController) {
        voiceButton.setAttribute("aria-label", "Voice input unavailable; tap for help");
        voiceButton.title = "Voice input is not supported in this browser.";
        return;
      }

      const userLang = (typeof navigator !== "undefined" && navigator.language && navigator.language.startsWith("en"))
        ? navigator.language
        : "en-US";

      voiceButton.setAttribute("aria-busy", "false");
      voiceButton.setAttribute("aria-pressed", "false");
      recognition = new VoiceInputController({
        createRecognition,
        requestMicrophone: null,
        language: userLang,
        setTimer: (fn, ms) => window.setTimeout(fn, ms),
        clearTimer: id => window.clearTimeout(id),
        onState: ({ state, reason }) => {
          if (state === "starting" || state === "processing") {
            isListening = true;
            voiceButton.classList.remove("listening", "starting", "processing", "permission");
            voiceButton.classList.add(state);
            voiceButton.setAttribute("aria-busy", "true");
            voiceButton.setAttribute("aria-pressed", "true");
            voiceButton.setAttribute("aria-label", state === "starting" ? "Cancel microphone startup" : "Cancel voice recognition");
            voiceButton.textContent = state === "starting" ? "Starting…" : "Finishing…";
            setMessage(state === "starting"
              ? "Starting microphone… wait for Listening before speaking. Allow access if your browser asks."
              : "Finishing voice recognition…", "pending");
          } else if (state === "listening") {
            isListening = true;
            voiceButton.classList.add("listening");
            voiceButton.classList.remove("starting", "processing", "permission");
            voiceButton.setAttribute("aria-busy", "false");
            voiceButton.setAttribute("aria-pressed", "true");
            voiceButton.setAttribute("aria-label", quizMode === "capitals" ? "Stop listening to capital name" : "Stop listening to country name");
            voiceButton.textContent = "● Listening";
            setMessage(`Microphone on · say one ${quizMode === "capitals" ? "capital" : "country"} name.`, "listening");
          } else if (state === "idle") {
            isListening = false;
            voiceButton.classList.remove("listening", "starting", "processing", "permission");
            voiceButton.setAttribute("aria-busy", "false");
            voiceButton.setAttribute("aria-pressed", "false");
            voiceButton.setAttribute("aria-label", quizMode === "capitals" ? "Say capital name" : "Say country name");
            voiceButton.textContent = "Speak";
            if (reason === "cancelled") {
              setMessage("Microphone stopped. Press Speak to try again or type your answer.");
            }
          }
        },
        onPreview: (heard) => {
          input.value = heard;
          const handled = window.gameController?.previewVoice?.(heard);
          if (!handled) setMessage(`Hearing: “${heard}”…`, "listening");
        },
        onFinal: alternatives => {
          isListening = false;
          voiceButton.classList.remove("listening");
          voiceButton.setAttribute("aria-pressed", "false");
          voiceButton.setAttribute("aria-label", quizMode === "capitals" ? "Say capital name" : "Say country name");
          voiceButton.textContent = "Speak";
          const heard = alternatives[0] || "";
          input.value = heard;
          const gameHandled = window.gameController?.handleVoice?.(alternatives);
          if (gameHandled) return;
          const transcript = quizMode === "capitals"
            ? alternatives.find(value => capitalByAlias.has(normalize(value))) || alternatives[0] || ""
            : alternatives.find(value => countryAnswerValidator?.resolve(value, { allowFuzzy: true })) || alternatives[0] || "";
          input.value = transcript;
          if (transcript) {
            handleGuess(transcript);
            if (!message.classList.contains("bad")) {
              input.value = "";
            }
          }
          focusInput();
        },
        onError: ({ code }) => {
          isListening = false;
          voiceButton.classList.remove("listening", "starting", "processing", "permission");
          voiceButton.setAttribute("aria-busy", "false");
          voiceButton.setAttribute("aria-pressed", "false");
          voiceButton.setAttribute("aria-label", quizMode === "capitals" ? "Say capital name" : "Say country name");
          voiceButton.textContent = "Speak";
          if (code === "not-allowed" || code === "service-not-allowed") {
            showVoiceDialog({
              title: "Microphone Access Blocked",
              message: "Your browser could not allow microphone or speech recognition access.\n\nIn iPhone Safari, open the page menu beside the address bar, then Website Settings > Microphone > Allow.\n\nIn Chrome or other browsers, open the site's permissions beside the address bar and allow Microphone.\n\nIf access is already allowed, check your device's speech recognition settings and restrictions, then tap Speak again. You can also type your answer."
            });
            setMessage("Microphone permission was blocked. Allow it in browser settings or type your answer.", "bad");
            return;
          }
          const reason = code === "no-speech"
            ? "No speech was heard. Try again, move closer to the microphone, or type your answer."
            : code === "start-timeout"
              ? "The microphone did not start. Check browser permission, then try again or type your answer."
              : code === "recognition-timeout"
                ? "Voice recognition took too long. Check any text above and submit it, or press Speak to try again."
              : `Voice input did not work. Try again or type the ${quizMode === "capitals" ? "capital" : "country"}.`;
          setMessage(reason, "bad");
        }
      });
    }

    function startVoiceInput() {
      if (isListening || recognition?.active) {
        stopVoiceInput("cancelled");
        return;
      }

      if (location.protocol === "file:") {
        showVoiceDialog({
          title: "Server Required for Voice Input",
          message: "Browsers require an HTTP or HTTPS origin to grant microphone permission.\n\nPlease open this map at http://127.0.0.1:8000/ or http://localhost:8000/ to use voice input."
        });
        setMessage("For one-time microphone permission, open this map at http://127.0.0.1:8000/ and choose Allow while visiting this site.", "bad");
        return;
      }
      if (typeof window !== "undefined" && !window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
        showVoiceDialog({
          title: "Secure Connection Required",
          message: "Mobile browsers and speech recognition require a secure (HTTPS) connection.\n\nMicrophone access is blocked on insecure local network addresses (such as " + location.origin + ").\n\nTo use voice input on mobile:\n• Open the secure site: https://www.arunabhosom.com/country-memory-map/\n• Or test on your computer at http://localhost:8000/."
        });
        setMessage("Microphone requires HTTPS or localhost. Open via https://www.arunabhosom.com/country-memory-map/ to use voice on mobile.", "bad");
        return;
      }
      if (!recognition) {
        showVoiceDialog({
          title: "Voice Input Unsupported",
          message: "This browser does not support Web Speech voice input.\n\nYou can type your answers or use your device keyboard’s microphone or dictation button."
        });
        setMessage("This browser does not support voice input. Use your keyboard’s microphone or type an answer.", "bad");
        return;
      }

      try {
        recognition.start();
      } catch (err) {
        console.warn("Speech recognition failed to start:", err);
        stopVoiceInput();
        setMessage(`Voice input could not start (${err?.message || "error"}). Try again or type your answer.`, "bad");
      }
    }

    function createLegend() {
      const order = ["Africa", "Asia", "Europe", "North America", "South America", "Oceania", "Antarctica", "Seven seas (open ocean)"];
      for (const name of order) {
        const item = document.createElement("span");
        item.className = "legend-item";
        const swatch = document.createElement("span");
        swatch.className = "swatch";
        swatch.style.background = colors[name] || colors["Seven seas (open ocean)"];
        const label = document.createElement("span");
        label.textContent = name === "Seven seas (open ocean)" ? "Other" : name;
        item.append(swatch, label);
        legend.appendChild(item);
      }
      const statusItem = document.createElement("span");
      statusItem.className = "legend-item";
      const statusSwatch = document.createElement("span");
      statusSwatch.className = "swatch un-territory";
      const statusLabel = document.createElement("span");
      statusLabel.textContent = "UN territory / unresolved status";
      statusItem.append(statusSwatch, statusLabel);
      legend.appendChild(statusItem);

      legendNote = document.createElement("span");
      legendNote.className = "legend-note";
      legendNote.title = "Country status follows the 193 UN member states plus the Holy See and State of Palestine. Western Sahara follows its United Nations Non-Self-Governing Territory status. Boundary geometry uses Natural Earth 1:10m v5.1.1.";
      legend.appendChild(legendNote);
      updateLegendNote();
    }

    function updateLegendNote() {
      if (!legendNote) return;
      legendNote.textContent = quizMode === "capitals"
        ? "195-country capital score · official and administrative variants accepted"
        : "195-country score · territories shown";
    }

    function createContinentButtons() {
      for (const name of continentOrder) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = name;
        button.dataset.continent = name;
        if (colors[name]) {
          button.style.setProperty("--continent-color", colors[name]);
        }
        if (name === selectedContinent) button.classList.add("active");
        button.addEventListener("click", () => selectContinent(name));
        continentButtons.appendChild(button);
      }
    }

    function setQuizMode(mode) {
      quizMode = mode === "capitals" ? "capitals" : "countries";
      labelsVisible = false;
      svg.classList.remove("labels-on");
      svg.classList.toggle("capital-mode", quizMode === "capitals");
      svg.classList.toggle("country-mode", quizMode === "countries");
      revealButton.textContent = "Reveal names";

      countryModeButton.classList.toggle("active", quizMode === "countries");
      capitalModeButton.classList.toggle("active", quizMode === "capitals");
      countryModeButton.setAttribute("aria-pressed", String(quizMode === "countries"));
      capitalModeButton.setAttribute("aria-pressed", String(quizMode === "capitals"));

      const isCapitalMode = quizMode === "capitals";
      appTitle.textContent = isCapitalMode ? "Capital Memory Map" : "Country Memory Map";
      document.title = appTitle.textContent;
      input.placeholder = isCapitalMode ? "Type a capital name" : "Type a country name";
      input.setAttribute("aria-label", input.placeholder);
      voiceButton.setAttribute("aria-label", isCapitalMode ? "Say capital name" : "Say country name");
      voiceButton.title = voiceButton.getAttribute("aria-label");
      form.closest("section").setAttribute("aria-label", isCapitalMode ? "Capital input" : "Country input");

      refreshFoundStyles();
      updateScore();
      updateLegendNote();
      setMessage(
        isCapitalMode
          ? "Capital quiz ready. Name a capital to highlight its country and exact location."
          : "Country quiz ready. Name a country to highlight it."
      );
      focusInput();
    }

    function selectContinent(name) {
      selectedContinent = name;
      labelsVisible = false;
      svg.classList.remove("labels-on");
      revealButton.textContent = "Reveal names";

      document.querySelectorAll("[data-continent]").forEach(button => {
        button.classList.toggle("active", button.dataset.continent === selectedContinent);
      });

      applyContinentFilter();
      fitSelectedContinent();
      updateScore();
      setMessage(
        selectedContinent === "World"
          ? "World view restored. Choose a continent before revealing names."
          : `${selectedContinent} selected. Other continents are hidden.`
      );
      focusInput();
    }

    function applyContinentFilter() {
      for (const record of regionRecords) {
        const visible = isRecordVisible(record);
        record.path.classList.toggle("hidden-continent", !visible);
        record.path.classList.toggle("outside-target", !!window.GameMap?.gameActive && window.GameMap.gameRegion !== "World" && record.continent !== window.GameMap.gameRegion);
      }
      for (const record of labelRecords) {
        const visible = isRecordVisible(record);
        record.label.classList.toggle("hidden-continent", !visible);
        record.leader.classList.toggle("hidden-continent", !visible);
        record.anchor.classList.toggle("hidden-continent", !visible);
      }
      updateLabelLayout();
    }

    function renderCapitals(capitals) {
      for (const [index, capital] of capitals.entries()) {
        const countryId = countryIdByName.get(capital.country);
        const countryRecord = countryRecords.find(record => record.id === countryId);
        if (!countryRecord) {
          console.warn(`Capital data has no matching country: ${capital.country}`);
          continue;
        }

        const [x, y] = project([capital.lon, capital.lat]);
        const capitalId = `capital-${index}`;
        const marker = makeSvgElement("circle", {
          class: "capital-marker suppressed",
          cx: x.toFixed(2),
          cy: y.toFixed(2),
          r: "2.8",
          "data-capital-id": capitalId,
          "data-country-id": countryId,
          "data-continent-name": countryRecord.continent,
          "aria-label": `${capital.name}, ${capital.role} of ${capital.country}`
        });
        const title = makeSvgElement("title");
        title.textContent = `${capital.name} — ${capital.role} of ${capital.country}`;
        marker.appendChild(title);
        capitalMarkersGroup.appendChild(marker);

        const leader = makeSvgElement("line", {
          class: "label-leader capital-label-leader suppressed",
          x1: x.toFixed(2),
          y1: y.toFixed(2),
          x2: x.toFixed(2),
          y2: y.toFixed(2),
          "data-continent-name": countryRecord.continent
        });
        labelLeadersGroup.appendChild(leader);

        const label = makeSvgElement("text", {
          class: "label capital-label suppressed",
          x: x.toFixed(2),
          y: y.toFixed(2),
          "data-continent-name": countryRecord.continent,
          "data-label-id": capitalId
        });
        label.textContent = capital.name;
        labelsGroup.appendChild(label);

        const record = {
          ...countryRecord,
          name: capital.name,
          country: capital.country,
          countryId,
          capitalId,
          role: capital.role,
          mode: "capitals",
          label,
          leader,
          anchor: marker,
          labelX: x,
          labelY: y,
          labelRank: 1,
          area: Math.max(0, (countryRecord.bounds.maxX - countryRecord.bounds.minX) *
            (countryRecord.bounds.maxY - countryRecord.bounds.minY)),
          isIsland: true
        };
        capitalRecords.push(record);
        labelRecords.push(record);

        for (const alias of [capital.name, ...(capital.aliases || [])].map(normalize).filter(Boolean)) {
          if (!capitalByAlias.has(alias)) capitalByAlias.set(alias, record);
        }
      }
    }

    function renderMap(data, capitals = []) {
      const features = data.features
        .filter(feature => feature.geometry && feature.properties)
        .sort((a, b) => Number(a.properties.TYPE === "Disputed" || a.properties.TYPE === "Indeterminate") -
          Number(b.properties.TYPE === "Disputed" || b.properties.TYPE === "Indeterminate"));
      countryCount = features.filter(isCountryFeature).length;

      for (const [index, feature] of features.entries()) {
        const name = displayName(feature);
        const id = `${feature.properties.ADM0_A3 || feature.properties.ISO_A3 || "region"}-${feature.properties.NE_ID || index}`;
        const continent = countryContinent(feature);
        const isCountry = isCountryFeature(feature);
        const isTerritory = isNamedTerritory(feature);
        const integratedCountry = isIntegratedCountryFeature(feature);
        const westernSahara = isWesternSaharaFeature(feature);
        const disputed = feature.properties.TYPE === "Disputed" || feature.properties.TYPE === "Indeterminate";
        if (isCountry) continentCounts.set(continent, (continentCounts.get(continent) || 0) + 1);
        const path = makeSvgElement("path", {
          class: `country${isTerritory ? " territory" : ""}${disputed ? " disputed-region" : ""}${integratedCountry ? " integrated-country" : ""}${westernSahara ? " un-territory" : ""}`,
          d: geometryToPath(feature.geometry),
          fill: westernSahara ? "url(#unTerritoryPattern)" : colors[continent] || colors["Seven seas (open ocean)"],
          "data-region-id": id,
          "data-region-name": name,
          "data-continent-name": continent,
          "aria-label": westernSahara
            ? "Western Sahara, United Nations Non-Self-Governing Territory; not a quiz country"
            : adminName(feature) === "Somaliland"
              ? "Northern Somalia"
              : adminName(feature) === "Northern Cyprus"
                ? "Northern Cyprus region of Cyprus"
              : isCountry ? name : `${name}, mapped region`
        });
        countriesGroup.appendChild(path);

        const bounds = geometryBounds(feature.geometry);
        const regionRecord = {
          id,
          name,
          continent,
          path,
          bounds,
          isCountry,
          isTerritory,
          ownerName: ownerCountryName(feature),
          ownerId: null
        };
        regionRecords.push(regionRecord);

        if (isCountry) {
          countryRecords.push(regionRecord);
          countryIdByName.set(adminName(feature), id);
          countryIdByName.set(name, id);
        }
        if (isCountry || isTerritory) registerSearchableRegion(feature, id, isCountry);

        if (isLabelFeature(feature)) {
          const [x, y] = labelPosition(feature);
          const leader = makeSvgElement("line", {
            class: "label-leader country-label-leader suppressed",
            x1: x.toFixed(2),
            y1: y.toFixed(2),
            x2: x.toFixed(2),
            y2: y.toFixed(2),
            "data-continent-name": continent
          });
          labelLeadersGroup.appendChild(leader);
          const anchor = makeSvgElement("circle", {
            class: "label-anchor country-label-anchor suppressed",
            cx: x.toFixed(2),
            cy: y.toFixed(2),
            r: "2",
            "data-continent-name": continent
          });
          labelAnchorsGroup.appendChild(anchor);
          const label = makeSvgElement("text", {
            class: `label country-label${isTerritory ? " territory-label" : ""}`,
            x: x.toFixed(2),
            y: y.toFixed(2),
            "data-continent-name": continent,
            "data-label-id": id
          });
          label.textContent = name;
          labelsGroup.appendChild(label);
          labelRecords.push({
            ...regionRecord,
            label,
            leader,
            anchor,
            mode: "countries",
            labelX: x,
            labelY: y,
            labelRank: Number(feature.properties.LABELRANK) || 9,
            area: Math.max(0, (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY)),
            isIsland: feature.properties.SUBREGION === "Caribbean" ||
              feature.properties.REGION_UN === "Oceania" || Number(feature.properties.TINY) > 0
          });
        }
      }

      for (const record of regionRecords) {
        if (record.ownerName) record.ownerId = countryIdByName.get(record.ownerName) || null;
      }
      countryAnswerValidator = new window.GeographyGame.AnswerValidator(countryRecords.map(record => {
        const feature = countryById.get(record.id)?.feature;
        return {
          id: record.id,
          canonicalName: record.name,
          aliases: feature ? aliasesFor(feature) : []
        };
      }));
      renderCapitals(capitals);
      capitalModeButton.disabled = !capitalRecords.length;

      createContinentButtons();
      applyContinentFilter();
      refreshFoundStyles();
      updateScore();
      loading.classList.add("hidden");
      focusInput();
      window.dispatchEvent(new Event("mapready"));
    }

    form.addEventListener("submit", event => {
      event.preventDefault();
      const handled = handleGuess(input.value);
      if (handled !== "pending") input.value = "";
    });

    markButton.addEventListener("touchend", event => {
      event.preventDefault();
      form.requestSubmit(markButton);
    }, { passive: false });

    function ensureInputVisible() {
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          input.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
        }, 280);
      }
    }
    input.addEventListener("focus", ensureInputVisible);

    countryModeButton.addEventListener("click", () => setQuizMode("countries"));
    capitalModeButton.addEventListener("click", () => setQuizMode("capitals"));
    voiceButton.addEventListener("click", startVoiceInput);
    document.getElementById("voiceDialogClose")?.addEventListener("click", () => {
      const dialog = document.getElementById("voiceDialog");
      if (dialog?.open) dialog.close();
      else dialog?.removeAttribute("open");
    });

    revealButton.addEventListener("click", () => {
      if (selectedContinent === "World") {
        labelsVisible = false;
        svg.classList.remove("labels-on");
        revealButton.textContent = "Reveal names";
        setMessage("Choose a continent first, then reveal names for that continent.", "bad");
        return;
      }
      labelsVisible = !labelsVisible;
      svg.classList.toggle("labels-on", labelsVisible);
      revealButton.textContent = labelsVisible ? "Hide names" : "Reveal names";
      const layout = updateLabelLayout();
      setMessage(
        labelsVisible
          ? `${layout.shown} names shown without overlap${layout.hidden ? `; zoom in for ${layout.hidden} more` : ""}.`
          : `${quizMode === "capitals" ? "Capital" : "Country"} names are hidden again.`
      );
    });

    resetButton.addEventListener("click", () => {
      if (quizMode === "capitals") {
        foundCapitalCountryIds.clear();
        foundCapitalCityIds.clear();
      } else {
        foundIds.clear();
        foundTerritoryIds.clear();
      }
      refreshFoundStyles();
      updateScore();
      setMessage(`${quizMode === "capitals" ? "Capital" : "Country"} quiz reset. Names remain hidden unless revealed.`);
      focusInput();
    });

    zoomInButton.addEventListener("click", () => {
      if (focusIslandGroup()) return;
      zoomBy(1.5);
      setMessage("Zoomed in. Drag the map or scroll sideways to pan; island dots stay connected to their names.");
    });
    zoomOutButton.addEventListener("click", () => {
      zoomBy(1 / 1.35);
      setMessage("Zoomed out. Drag the map or scroll sideways to pan.");
    });
    zoomResetButton.addEventListener("click", () => {
      fitSelectedContinent();
      setMessage("Zoom reset for the current view.");
    });

    svg.addEventListener("pointerdown", startPan);
    svg.addEventListener("pointermove", movePan);
    svg.addEventListener("pointerup", stopPan);
    svg.addEventListener("pointercancel", stopPan);
    svg.addEventListener("lostpointercapture", stopPan);
    svg.addEventListener("wheel", event => {
      if (!canPan()) return;
      event.preventDefault();
      const horizontal = event.deltaX || (event.shiftKey ? event.deltaY : 0);
      const vertical = event.shiftKey ? 0 : event.deltaY;
      panBy(horizontal, vertical);
    }, { passive: false });

    async function init() {
      drawGrid();
      createLegend();
      setupVoiceInput();
      try {
        if (!window.COUNTRIES_GEOJSON) throw new Error('The country geometry bundle is unavailable.');
        renderMap(window.COUNTRIES_GEOJSON, window.CAPITALS_DATA || []);
      } catch (error) {
        loading.classList.add("hidden");
        setMessage("Could not load the embedded country map data. Reload the page or reopen index.html.", "bad");
        console.error(error);
      }
    }

    let lastMapWidth = 0;
    new ResizeObserver(() => {
      if (lastMapWidth && Math.abs(svg.clientWidth - lastMapWidth) > 10) fitSelectedContinent();
      lastMapWidth = svg.clientWidth;
      updateLabelLayout();
    }).observe(svg);
    document.querySelector(".legend-panel").addEventListener("toggle", updateLabelLayout);
    function syncViewport() {
      let viewport = window.visualViewport;
      let embedded = false;
      try {
        embedded = window.parent !== window && window.parent.location.origin === window.location.origin;
        if (embedded) viewport = window.parent.visualViewport || viewport;
      } catch {
        embedded = false;
      }
      const h = Math.max(1, Math.round(viewport?.height || window.innerHeight));
      document.documentElement.style.setProperty("--app-height", `${h}px`);
      document.documentElement.style.setProperty("--keyboard-top", embedded ? "0px" : `${Math.max(0, Math.round(viewport?.offsetTop || 0))}px`);
    }
    window.visualViewport?.addEventListener("resize", syncViewport);
    window.visualViewport?.addEventListener("scroll", syncViewport);
    window.addEventListener("resize", syncViewport);
    window.addEventListener("orientationchange", syncViewport);
    syncViewport();
    window.GameMap = {
      svg, countryRecords, regionRecords, labelRecords, capitalRecords,
      countries: countryRecords, capitals: capitalRecords, gameActive: false, gameRegion: "World",
      stopVoice: () => stopVoiceInput("cancelled"),
      feature: id => countryById.get(id)?.feature,
      countryId: name => countryIdByName.get(name),
      aliases: id => [...countryByAlias].filter(([, value]) => value === id).map(([alias]) => alias),
      submitFreeMapGuess: ({ value, checker = quizMode } = {}) => {
        if (!['countries', 'capitals'].includes(checker)) throw new Error('That Free Map checker is unavailable.');
        const raw = String(value || '').trim();
        if (!normalize(raw)) throw new Error('Enter a country or capital name.');
        if (quizMode !== checker) setQuizMode(checker);
        const matchedCapital = checker === 'capitals' ? capitalByAlias.get(normalize(raw)) : null;
        const before = feedbackSequence;
        if (checker === 'capitals') handleCapitalGuess(raw);
        else handleCountryGuess(raw);
        if (feedbackSequence === before || !latestFeedback) throw new Error('The Free Map checker did not return a result.');
        if (latestFeedback.kind === 'bad') playAnimation(form.closest('section'), 'wrong-answer');
        const accepted = latestFeedback.kind === 'good';
        const selectedCountryId = checker === 'capitals' ? matchedCapital?.countryId : latestAnswerId;
        return Object.freeze({
          ...latestFeedback,
          checker,
          accepted,
          country: accepted ? countrySummary(selectedCountryId) : null
        });
      },
      getChecker: () => quizMode,
      getView: () => ({ ...viewBox }), setView: setViewBox, point: mapPoint, project,
      selectRegion: selectContinent,
      setMode: setQuizMode,
      clear: () => { foundIds.clear(); foundTerritoryIds.clear(); foundCapitalCountryIds.clear(); foundCapitalCityIds.clear(); latestAnswerId = null; refreshFoundStyles(); },
      mark: id => { foundIds.add(id); latestAnswerId = id; refreshFoundStyles(); },
      filter: applyContinentFilter, layout: updateLabelLayout,
      focusRegion: (name) => { selectedContinent = name; fitSelectedContinent(); },
      refresh: refreshFoundStyles
    };
    init();
