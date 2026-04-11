const API = 'https://globalmonitor.fly.dev/api';
const WAR = new Date('2026-02-28T00:00:00Z');
const SATELLITE_LAG_DAYS = 2;
const MODIS_DATE = isoDate(SATELLITE_LAG_DAYS);
const AOD_DATE = MODIS_DATE;

const STATE = {
  base: 'dark',
  overlays: { aod: true, acled: true, firms: true, news: true },
  escalation: null,
  sourceHealth: {},
  acled: [],
  acledMeta: null,
  firms: [],
  firmsMeta: null,
  news: [],
  newsUpdated: '',
  fronts: [],
  frontsUpdated: '',
  markets: [],
  marketsUpdated: '',
};

const LOC = {
  gaza: [31.4, 34.3],
  'west bank': [31.9, 35.2],
  israel: [31.5, 34.9],
  'southern israel': [31.25, 34.79],
  iran: [32.4, 53.7],
  tehran: [35.69, 51.39],
  natanz: [33.72, 51.73],
  isfahan: [32.65, 51.68],
  bushehr: [28.83, 50.89],
  asaluyeh: [27.5, 52.6],
  'south pars': [27.5, 52.6],
  iraq: [33.3, 44.4],
  erbil: [36.19, 44.01],
  kuwait: [29.05, 48.15],
  syria: [34.8, 38.9],
  damascus: [33.52, 36.24],
  lebanon: [33.9, 35.5],
  beirut: [33.9, 35.5],
  nabatieh: [33.38, 35.48],
  'southern lebanon': [33.27, 35.2],
  yemen: [15.5, 48.5],
  sanaa: [15.37, 44.19],
  houthi: [15.5, 48.5],
  houthis: [15.5, 48.5],
  qatar: [25.9, 51.53],
  'ras laffan': [25.9, 51.53],
  hormuz: [26.5, 56.25],
  'strait of hormuz': [26.5, 56.25],
  'red sea': [18.5, 41.6],
  hezbollah: [33.9, 35.5],
  hamas: [31.4, 34.3],
  saudi: [23.9, 45.1],
  uae: [24.45, 54.38],
  emirates: [24.45, 54.38],
};

const PRED = [
  { q: 'Iran-US ceasefire holds through April?', y: 35 },
  { q: 'Hormuz reopens to commercial traffic?', y: 22 },
  { q: 'UNSC passes new sanctions resolution?', y: 68 },
  { q: 'Hezbollah escalates northern front?', y: 45 },
  { q: 'Oil exceeds $120/bbl this month?', y: 71 },
  { q: 'Iran withdraws from NPT?', y: 18 },
  { q: 'China brokers mediation framework?', y: 32 },
  { q: 'US deploys additional carrier group?', y: 55 },
];

const NUC = [
  { n: 'Natanz', lat: 33.72, lon: 51.73, s: 'x', t: 'Enrichment — DESTROYED' },
  { n: 'Fordow', lat: 34.88, lon: 51.59, s: 'd', t: 'Enrichment — DAMAGED' },
  { n: 'Isfahan', lat: 32.65, lon: 51.68, s: 'd', t: 'Conversion — DAMAGED' },
  { n: 'Arak', lat: 34.38, lon: 49.24, s: 'i', t: 'Heavy Water — INTACT' },
  { n: 'Bushehr', lat: 28.83, lon: 50.89, s: 'i', t: 'Power Reactor — INTACT' },
];

const NUC_COLORS = { x: '#ef4444', d: '#f59e0b', i: '#22c55e' };

function isoDate(daysAgo = 0) {
  return new Date(Date.now() - daysAgo * 864e5).toISOString().slice(0, 10);
}

function safeDate(value) {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function num(value) {
  if (typeof value === 'number') return value;
  const parsed = Number.parseFloat(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function fmtShortDate(value) {
  const date = safeDate(value);
  if (!date) return '--';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();
}

function fmtAcqDate(value) {
  const raw = String(value ?? '');
  if (/^\d{8}$/.test(raw)) {
    return fmtShortDate(`${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T00:00:00Z`);
  }
  return fmtShortDate(value);
}

function fmtTimeCompact(value) {
  const raw = String(value ?? '').padStart(4, '0');
  return `${raw.slice(0, 2)}:${raw.slice(2, 4)}Z`;
}

function fmtCoords(lat, lon) {
  return `${Math.abs(lat).toFixed(2)}${lat >= 0 ? 'N' : 'S'} / ${Math.abs(lon).toFixed(2)}${lon >= 0 ? 'E' : 'W'}`;
}

function ago(value) {
  const date = safeDate(value);
  if (!date) return '';
  const minutes = Math.floor((Date.now() - date.getTime()) / 6e4);
  if (minutes < 1) return 'NOW';
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return fmtShortDate(date.toISOString());
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

function eventDate(props) {
  return props?.date || props?.eventDate || props?.event_date || '';
}

function eventRegion(props) {
  return props?.region || props?.admin1 || props?.location || '';
}

function eventNotes(props) {
  return props?.notes || props?.summary || props?.actor1 || props?.source || '';
}

function eventTone(type) {
  const value = String(type || '').toLowerCase();
  if (value.includes('battle')) return { color: '#f97316', cls: 'mk-b', tag: 'BATTLE' };
  if (value.includes('strategic')) return { color: '#06b6d4', cls: 'mk-c', tag: 'MOVE' };
  if (value.includes('violence')) return { color: '#ec4899', cls: 'mk-v', tag: 'CIV' };
  return { color: '#ef4444', cls: 'mk-s', tag: 'STRIKE' };
}

function changeMeta(entry) {
  const raw = entry?.changePerc ?? entry?.change ?? '';
  const pct = raw ? num(raw) : 0;
  return { pct, text: raw || `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%` };
}

function geo(text) {
  const lower = String(text || '').toLowerCase();
  for (const [key, coords] of Object.entries(LOC)) {
    if (lower.includes(key)) return coords;
  }
  return null;
}

async function f(path) {
  try {
    const response = await fetch(API + path);
    if (!response.ok) throw new Error(String(response.status));
    return await response.json();
  } catch {
    return null;
  }
}

function tick() {
  const now = new Date();
  document.getElementById('clk').textContent = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;
  document.getElementById('dayN').textContent = Math.floor((now - WAR) / 864e5);
}

setInterval(tick, 1000);
tick();

const map = L.map('map', {
  center: [29, 48],
  zoom: 5,
  zoomControl: false,
  attributionControl: false,
});

const baseLayers = {
  dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18 }),
  sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18 }),
  modis: L.tileLayer(
    `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${MODIS_DATE}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
    { maxZoom: 9 }
  ),
};

const labelOverlay = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
  maxZoom: 18,
  opacity: 0.72,
});

const aodLayer = L.tileLayer(
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Combined_Value_Added_AOD/default/${AOD_DATE}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
  { maxZoom: 6, opacity: 0.28 }
);

let activeBaseLayer = baseLayers.dark.addTo(map);

const groups = {
  zones: L.layerGroup().addTo(map),
  routes: L.layerGroup().addTo(map),
  nuclear: L.layerGroup().addTo(map),
  acledHalos: L.layerGroup().addTo(map),
  acled: L.layerGroup().addTo(map),
  firms: L.layerGroup().addTo(map),
  news: L.layerGroup().addTo(map),
};

function setLayer(layer, enabled) {
  if (enabled && !map.hasLayer(layer)) layer.addTo(map);
  if (!enabled && map.hasLayer(layer)) map.removeLayer(layer);
}

function syncOverlays() {
  setLayer(aodLayer, STATE.overlays.aod);
  setLayer(groups.acledHalos, STATE.overlays.acled);
  setLayer(groups.acled, STATE.overlays.acled);
  setLayer(groups.firms, STATE.overlays.firms);
  setLayer(groups.news, STATE.overlays.news);
}

function renderLayerDock() {
  document.querySelectorAll('.ly-base').forEach((button) => {
    button.classList.toggle('on', button.dataset.base === STATE.base);
  });
  document.querySelectorAll('.ly-ov').forEach((button) => {
    button.classList.toggle('on', STATE.overlays[button.dataset.ov]);
  });

  const activeOverlays = Object.entries(STATE.overlays)
    .filter(([, enabled]) => enabled)
    .map(([key]) => ({ aod: `AOD ${AOD_DATE}`, acled: `Conflict ${STATE.acled.length || 0}`, firms: `Thermal ${STATE.firms.length || 0}`, news: `News ${STATE.news.length || 0}` }[key]))
    .join(' · ');

  const baseLabel = {
    dark: 'Analyst dark base',
    sat: 'World satellite base',
    modis: `NASA MODIS ${MODIS_DATE}`,
  }[STATE.base];

  document.getElementById('layerMeta').innerHTML = `${escapeHtml(baseLabel)}<br>${escapeHtml(activeOverlays || 'No overlays active')}`;
}

function setBaseLayer(nextBase) {
  if (STATE.base === nextBase) return;
  map.removeLayer(activeBaseLayer);
  if (map.hasLayer(labelOverlay)) map.removeLayer(labelOverlay);
  activeBaseLayer = baseLayers[nextBase];
  activeBaseLayer.addTo(map);
  if (nextBase !== 'dark') labelOverlay.addTo(map);
  STATE.base = nextBase;
  renderLayerDock();
}

document.querySelectorAll('.ly-base').forEach((button) => {
  button.onclick = () => setBaseLayer(button.dataset.base);
});

document.querySelectorAll('.ly-ov').forEach((button) => {
  button.onclick = () => {
    const key = button.dataset.ov;
    STATE.overlays[key] = !STATE.overlays[key];
    syncOverlays();
    renderLayerDock();
  };
});

syncOverlays();

[
  { n: 'Gaza', c: [[31.2, 34.2], [31.6, 34.2], [31.6, 34.6], [31.2, 34.6]], col: '#ef4444' },
  { n: 'West Bank', c: [[31.3, 34.9], [32.6, 34.9], [32.6, 35.6], [31.3, 35.6]], col: '#f97316' },
  { n: 'South Lebanon', c: [[33.0, 35.1], [33.6, 35.1], [33.6, 36.0], [33.0, 36.0]], col: '#f97316' },
  { n: 'NW Syria', c: [[35.5, 36.0], [37.0, 36.0], [37.0, 37.5], [35.5, 37.5]], col: '#f59e0b' },
  { n: 'Yemen (Houthi)', c: [[13.0, 42.0], [16.0, 42.0], [16.0, 47.0], [13.0, 47.0]], col: '#f59e0b' },
  { n: 'NE Iraq / PMU', c: [[33.5, 42.0], [35.5, 42.0], [35.5, 45.0], [33.5, 45.0]], col: '#f59e0b' },
  { n: 'Hormuz Strait', c: [[26.0, 55.5], [27.0, 55.5], [27.0, 57.0], [26.0, 57.0]], col: '#3b82f6' },
].forEach((zone) => {
  L.polygon(zone.c, {
    color: zone.col,
    fillColor: zone.col,
    fillOpacity: 0.05,
    weight: 1.5,
    opacity: 0.35,
    dashArray: '8,6',
  }).addTo(groups.zones).bindTooltip(zone.n, { className: 'zone-tooltip', sticky: true });
});

NUC.forEach((site) => {
  const icon = L.divIcon({
    className: '',
    html: `<div class="mk-n" style="border-color:${NUC_COLORS[site.s]}50;background:${NUC_COLORS[site.s]}"></div>`,
    iconSize: [11, 11],
    iconAnchor: [5, 5],
  });
  L.marker([site.lat, site.lon], { icon }).addTo(groups.nuclear).bindPopup(
    `<div class="pp-t" style="color:${NUC_COLORS[site.s]}">NUCLEAR</div>
      <div class="pp-h">${escapeHtml(site.n)}</div>
      <div class="pp-d">${escapeHtml(site.t)}</div>`
  );
});

[
  [[32.4, 53.7], [33.9, 35.5], '#ef444450', 'Iran → Hezbollah'],
  [[32.4, 53.7], [15.5, 48.5], '#f9731650', 'Iran → Houthis'],
  [[32.4, 53.7], [33.3, 44.4], '#f59e0b50', 'Iran → PMU'],
].forEach(([from, to, color, label]) => {
  L.polyline([from, to], { color, weight: 1.5, dashArray: '10,8' }).addTo(groups.routes).bindTooltip(label);
});

document.getElementById('zME').onclick = () => map.flyTo([29, 48], 5, { duration: 1 });
document.getElementById('zIR').onclick = () => map.flyTo([33, 52], 6, { duration: 1 });
document.getElementById('zGZ').onclick = () => map.flyTo([31.4, 34.4], 10, { duration: 1 });
document.getElementById('zYE').onclick = () => map.flyTo([15, 45], 6, { duration: 1 });
document.getElementById('zHZ').onclick = () => map.flyTo([26.5, 56.3], 8, { duration: 1 });

function showBrk(text) {
  document.getElementById('brkTxt').textContent = text;
  document.getElementById('brk').style.display = 'flex';
  setTimeout(() => {
    document.getElementById('brk').style.display = 'none';
  }, 25000);
}

document.getElementById('brkX').onclick = () => {
  document.getElementById('brk').style.display = 'none';
};

function renderSources() {
  const rows = [
    { label: 'NASA MODIS true color', status: 'live', detail: MODIS_DATE },
    { label: 'NASA aerosol / dust', status: STATE.overlays.aod ? 'live' : 'delayed', detail: AOD_DATE },
    {
      label: 'Conflict event map',
      status: STATE.acledMeta?.source?.includes('fallback') ? 'delayed' : STATE.acled.length ? 'live' : 'offline',
      detail: STATE.acled.length ? `${STATE.acled.length} locations · since ${STATE.acledMeta?.since || '--'}` : 'Waiting for event feed',
    },
    {
      label: 'NASA FIRMS thermal hits',
      status: STATE.firmsMeta?.source?.includes('sample') ? 'sample' : STATE.firms.length ? 'live' : 'offline',
      detail: STATE.firmsMeta?.fetchedAt ? `${STATE.firms.length} detections · ${ago(STATE.firmsMeta.fetchedAt)}` : `${STATE.firms.length || 0} detections`,
    },
    {
      label: 'Intel headlines',
      status: STATE.news.length ? (STATE.sourceHealth.news === 'live' ? 'live' : 'delayed') : 'offline',
      detail: STATE.newsUpdated ? `${STATE.news.length} items · ${ago(STATE.newsUpdated)}` : 'Waiting for feed',
    },
    {
      label: 'Market impact feed',
      status: STATE.markets.length ? (STATE.sourceHealth.markets === 'live' ? 'live' : 'delayed') : 'offline',
      detail: STATE.marketsUpdated ? `${STATE.markets.length} assets · ${ago(STATE.marketsUpdated)}` : 'Waiting for markets',
    },
    {
      label: 'Frontline model',
      status: STATE.fronts.length ? 'live' : 'offline',
      detail: STATE.frontsUpdated ? `${STATE.fronts.length} theaters · ${ago(STATE.frontsUpdated)}` : 'Waiting for fronts',
    },
  ];

  document.getElementById('rSrc').innerHTML = rows.map((row) => `
    <div class="sr">
      <span class="sd ${row.status}"></span>
      <div class="src-copy">
        <span class="src-name">${escapeHtml(row.label)}</span>
        <span class="src-meta">${escapeHtml(row.detail)}</span>
      </div>
    </div>
  `).join('');

  document.getElementById('sSrc').textContent = rows.filter((row) => row.status !== 'offline').length;
}

function renderSatelliteIntel() {
  const firmsStatus = STATE.firmsMeta?.source?.includes('sample') ? 'sample' : STATE.firms.length ? 'live' : 'offline';
  const top = STATE.firms[0];
  const summary = [
    { name: 'MODIS true color', status: 'live', detail: `Daily mosaic · ${MODIS_DATE}` },
    { name: 'Aerosol / dust', status: STATE.overlays.aod ? 'live' : 'delayed', detail: `NASA GIBS overlay · ${AOD_DATE}` },
    {
      name: 'Thermal anomalies',
      status: firmsStatus,
      detail: STATE.firmsMeta?.fetchedAt ? `${STATE.firms.length} hits · ${ago(STATE.firmsMeta.fetchedAt)}` : `${STATE.firms.length || 0} hits`,
    },
    {
      name: 'Hottest cell',
      status: top ? firmsStatus : 'offline',
      detail: top ? `${Math.round(top.frp)} FRP · ${fmtCoords(top.lat, top.lon)}` : 'No hotspot detected',
    },
  ];

  document.getElementById('rSat').innerHTML = summary.map((row) => `
    <div class="ss">
      <div class="ss-top">
        <span class="ss-name">${escapeHtml(row.name)}</span>
        <span class="sig ${row.status}">${escapeHtml(row.status.toUpperCase())}</span>
      </div>
      <div class="ss-sub">${escapeHtml(row.detail)}</div>
    </div>
  `).join('');

  const satPane = document.getElementById('p-sat');
  const sampleLabel = STATE.firmsMeta?.source?.includes('sample') ? 'THERMAL SAMPLE' : 'THERMAL LIVE';
  satPane.innerHTML = `
    <div class="sat-sum">
      <span class="sat-chip"><strong>BASE</strong> ${STATE.base.toUpperCase()}</span>
      <span class="sat-chip"><strong>MODIS</strong> ${MODIS_DATE}</span>
      <span class="sat-chip"><strong>AOD</strong> ${STATE.overlays.aod ? 'ON' : 'OFF'}</span>
      <span class="sat-chip"><strong>${escapeHtml(sampleLabel)}</strong> ${STATE.firms.length}</span>
    </div>
    ${STATE.firms.length ? STATE.firms.slice(0, 10).map((item, index) => `
      <div class="cd sat" data-firm-idx="${index}">
        <div class="cd-src"><span>${escapeHtml(item.confidence.toUpperCase())} CONF</span><span>${escapeHtml(fmtTimeCompact(item.acqTime))}</span></div>
        <div class="cd-hl">${escapeHtml(fmtCoords(item.lat, item.lon))}</div>
        <div class="cd-sub">${escapeHtml(`${Math.round(item.frp)} FRP · ${Math.round(item.brightness)}K · ${item.satellite}`)}</div>
        <div class="cd-ft"><span class="cd-kia">${escapeHtml(fmtAcqDate(item.acqDate))}</span><span>${escapeHtml(item.source)}</span></div>
      </div>
    `).join('') : '<div class="ld"><div class="sp"></div>No thermal detections yet</div>'}
  `;

  satPane.querySelectorAll('[data-firm-idx]').forEach((card) => {
    card.onclick = () => {
      const item = STATE.firms[Number(card.dataset.firmIdx)];
      if (item) map.flyTo([item.lat, item.lon], 7, { duration: 0.8 });
    };
  });
}

function renderHotspots() {
  const target = document.getElementById('rHot');
  if (!STATE.acled.length) {
    target.innerHTML = '<span class="ld-t">No conflict clusters yet</span>';
    return;
  }

  const grouped = new Map();
  STATE.acled.forEach((item) => {
    const key = `${item.country}|${item.region || 'Main theater'}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        country: item.country,
        region: item.region || 'Main theater',
        lat: 0,
        lon: 0,
        count: 0,
        fatalities: 0,
        latest: item.date,
      });
    }
    const bucket = grouped.get(key);
    bucket.lat += item.lat;
    bucket.lon += item.lon;
    bucket.count += 1;
    bucket.fatalities += item.fatalities;
    if ((safeDate(item.date)?.getTime() || 0) > (safeDate(bucket.latest)?.getTime() || 0)) bucket.latest = item.date;
  });

  const hotspots = [...grouped.values()]
    .map((spot) => {
      const latest = safeDate(spot.latest);
      const ageBonus = latest ? clamp(12 - Math.floor((Date.now() - latest.getTime()) / 864e5), 0, 12) : 0;
      return {
        ...spot,
        lat: spot.lat / spot.count,
        lon: spot.lon / spot.count,
        score: spot.count * 8 + spot.fatalities * 2 + ageBonus,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  target.innerHTML = hotspots.map((spot, index) => `
    <button class="hs" data-hot-idx="${index}">
      <div class="hs-top">
        <span class="hs-name">${escapeHtml(`${spot.country} · ${spot.region}`)}</span>
        <span class="sig live">${spot.count} HIT</span>
      </div>
      <div class="hs-meta">${escapeHtml(`${spot.fatalities.toLocaleString()} KIA · ${fmtShortDate(spot.latest)}`)}</div>
      <div class="hs-sub">${escapeHtml(`Score ${Math.round(spot.score)} · ${fmtCoords(spot.lat, spot.lon)}`)}</div>
    </button>
  `).join('');

  target.querySelectorAll('[data-hot-idx]').forEach((button) => {
    button.onclick = () => {
      const spot = hotspots[Number(button.dataset.hotIdx)];
      if (spot) map.flyTo([spot.lat, spot.lon], 7, { duration: 0.8 });
    };
  });
}

function renderStrikeLog() {
  const target = document.getElementById('rStrike');
  if (!STATE.acled.length) {
    target.innerHTML = '<span class="ld-t">No strike log yet</span>';
    return;
  }

  const items = STATE.acled.slice(0, 6);
  target.innerHTML = items.map((item, index) => {
    const tone = eventTone(item.type);
    return `
      <button class="st" data-strike-idx="${index}">
        <div class="st-top">
          <span class="st-name">${escapeHtml(item.region || item.country)}</span>
          <span class="sig live">${escapeHtml(tone.tag)}</span>
        </div>
        <div class="st-meta">${escapeHtml(`${fmtShortDate(item.date)} · ${item.actor || 'OSINT'}`)}</div>
        <div class="st-sub">${escapeHtml(item.notes)}</div>
      </button>
    `;
  }).join('');

  target.querySelectorAll('[data-strike-idx]').forEach((button) => {
    button.onclick = () => {
      const item = items[Number(button.dataset.strikeIdx)];
      if (item) map.flyTo([item.lat, item.lon], 8, { duration: 0.8 });
    };
  });
}

async function loadEsc() {
  const data = await f('/escalation');
  if (!data) return;
  STATE.escalation = data;
  STATE.sourceHealth = data.sourceHealth || {};
  const pct = Math.min(data.score || 0, 100);
  const circ = 125.6;
  const color = data.level === 'red' ? '#ef4444' : data.level === 'amber' ? '#f59e0b' : '#22c55e';
  document.getElementById('escArc').style.strokeDashoffset = circ - (pct / 100) * circ;
  document.getElementById('escArc').style.stroke = color;
  document.getElementById('escN').textContent = Math.round(data.score || 0);
  document.getElementById('escN').style.color = color;
  document.getElementById('escLbl').textContent = data.label || 'ESCALATION';
  renderSources();
}

async function loadAcled() {
  const data = await f('/acled');
  if (!data?.features?.length) return;

  STATE.acledMeta = { source: data.source || '', since: data.since || '' };
  STATE.acled = data.features
    .map((feature) => {
      const props = feature.properties || {};
      const coords = feature.geometry?.coordinates;
      if (!coords) return null;
      return {
        lat: coords[1],
        lon: coords[0],
        type: props.eventType || 'Event',
        country: props.country || 'Unknown',
        region: eventRegion(props),
        notes: eventNotes(props),
        actor: props.actor1 || '',
        fatalities: Number(props.fatalities) || 0,
        date: eventDate(props),
      };
    })
    .filter(Boolean)
    .sort((a, b) => (safeDate(b.date)?.getTime() || 0) - (safeDate(a.date)?.getTime() || 0));

  groups.acled.clearLayers();
  groups.acledHalos.clearLayers();

  const pane = document.getElementById('p-acled');
  pane.innerHTML = '';

  let fatalities = 0;
  STATE.acled.forEach((item) => {
    fatalities += item.fatalities;
    const tone = eventTone(item.type);
    const radius = clamp(10 + item.fatalities * 0.4 + (tone.tag === 'STRIKE' ? 5 : 0), 12, 32);

    L.circleMarker([item.lat, item.lon], {
      radius,
      color: tone.color,
      weight: 1,
      fillColor: tone.color,
      fillOpacity: 0.06,
    }).addTo(groups.acledHalos);

    const icon = L.divIcon({
      className: '',
      html: `<div class="${tone.cls}"></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });

    L.marker([item.lat, item.lon], { icon }).addTo(groups.acled).bindPopup(
      `<div class="pp-t" style="color:${tone.color}">${escapeHtml(item.type.toUpperCase())}</div>
      <div class="pp-h">${escapeHtml(`${item.country}${item.region ? ` · ${item.region}` : ''}`)}</div>
      <div class="pp-d">${escapeHtml(item.notes)}</div>
      <div class="pp-m">${escapeHtml(`${item.fatalities ? `${item.fatalities} KIA · ` : ''}${item.date || '--'}`)}</div>`
    );

    const card = document.createElement('div');
    card.className = `cd ${tone.tag === 'STRIKE' ? 'str' : tone.tag === 'BATTLE' ? 'bat' : 'vio'}`;
    card.innerHTML = `
      <div class="cd-src"><span>${escapeHtml(tone.tag)}</span><span>${escapeHtml(fmtShortDate(item.date))}</span></div>
      <div class="cd-hl">${escapeHtml(`${item.country}${item.region ? ` · ${item.region}` : ''}`)}</div>
      <div class="cd-sub">${escapeHtml(item.notes)}</div>
      <div class="cd-ft"><span class="cd-kia">${escapeHtml(item.fatalities ? `${item.fatalities} KIA` : 'NO FATALITIES')}</span><span>${escapeHtml(item.actor || 'OSINT')}</span></div>
    `;
    card.onclick = () => map.flyTo([item.lat, item.lon], 8, { duration: 0.8 });
    pane.appendChild(card);
  });

  document.getElementById('sEv').textContent = STATE.acled.length;
  document.getElementById('sKia').textContent = fatalities.toLocaleString();

  renderHotspots();
  renderStrikeLog();
  renderSources();
  renderLayerDock();
}

async function loadFirms() {
  const data = await f('/firms');
  if (!data?.features?.length) return;

  STATE.firmsMeta = data.meta || null;
  STATE.firms = data.features
    .map((feature) => {
      const props = feature.properties || {};
      const coords = feature.geometry?.coordinates;
      if (!coords) return null;
      return {
        lat: coords[1],
        lon: coords[0],
        frp: Number(props.frp) || 0,
        brightness: Number(props.brightness) || 0,
        confidence: String(props.confidence || 'low').toLowerCase(),
        acqDate: props.acq_date || '',
        acqTime: props.acq_time || '0000',
        satellite: props.satellite || 'FIRMS',
        source: props.source || data.meta?.source || 'unknown',
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.frp - a.frp);

  groups.firms.clearLayers();
  STATE.firms.forEach((item) => {
    const radius = clamp(4 + item.frp / 70, 4, 12);
    const opacity = item.confidence === 'high' ? 0.86 : item.confidence === 'medium' ? 0.68 : 0.48;
    L.circleMarker([item.lat, item.lon], {
      radius,
      color: '#fb923c',
      weight: 1.4,
      fillColor: '#f97316',
      fillOpacity: opacity,
    }).addTo(groups.firms).bindPopup(
      `<div class="pp-t" style="color:#f97316">THERMAL</div>
      <div class="pp-h">${escapeHtml(fmtCoords(item.lat, item.lon))}</div>
      <div class="pp-d">${escapeHtml(`${Math.round(item.frp)} FRP · ${Math.round(item.brightness)}K · ${item.satellite}`)}</div>
      <div class="pp-m">${escapeHtml(`${fmtAcqDate(item.acqDate)} · ${fmtTimeCompact(item.acqTime)} · ${item.confidence.toUpperCase()}`)}</div>`
    );
  });

  document.getElementById('sFi').textContent = STATE.firms.length;
  renderSatelliteIntel();
  renderSources();
  renderLayerDock();
}

async function loadMkt() {
  const data = await f('/markets');
  if (!Array.isArray(data)) return;

  STATE.markets = data;
  STATE.marketsUpdated = new Date().toISOString();

  const ticker = document.getElementById('tkTrack');
  const tickerMarkup = data.map((entry) => {
    const change = changeMeta(entry);
    return `<span class="ti"><span class="ti-s">${escapeHtml(entry.symbol || entry.name || '--')}</span><span class="ti-p">${escapeHtml(entry.price || '--')}</span><span class="${change.pct >= 0 ? 'ti-u' : 'ti-d'}">${escapeHtml(change.text)}</span></span>`;
  }).join('');
  ticker.innerHTML = tickerMarkup + tickerMarkup;

  const shortlist = data.filter((entry) => {
    const label = String(entry.symbol || entry.name || '').toLowerCase();
    return ['wti', 'brent', 'gold', 'btc', 'eth', 's&p', 'usd/ils', 'tasi'].some((needle) => label.includes(needle));
  }).slice(0, 8);

  const renderList = shortlist.length ? shortlist : data.slice(0, 8);
  document.getElementById('rMkt').innerHTML = renderList.map((entry) => {
    const change = changeMeta(entry);
    return `<div class="mr"><span class="mr-s">${escapeHtml(entry.symbol || entry.name || '--')}</span><span class="mr-p">${escapeHtml(entry.price || '--')}</span><span class="mr-c ${change.pct >= 0 ? 'mr-u' : 'mr-d'}">${escapeHtml(change.text)}</span></div>`;
  }).join('');

  renderSources();
}

function renderNewsMarkers() {
  groups.news.clearLayers();
  const unique = [];
  const seen = new Set();

  STATE.news.forEach((item) => {
    if (!item.coords) return;
    const key = `${item.coords[0].toFixed(2)}:${item.coords[1].toFixed(2)}`;
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(item);
  });

  unique.slice(0, 14).forEach((item) => {
    const icon = L.divIcon({
      className: '',
      html: '<div class="mk-h"></div>',
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });
    L.marker(item.coords, { icon }).addTo(groups.news).bindPopup(
      `<div class="pp-t" style="color:#06b6d4">${escapeHtml(item.source || 'OSINT')}</div>
      <div class="pp-h">${escapeHtml(item.title)}</div>
      <div class="pp-m">${escapeHtml(ago(item.pubDate))}</div>`
    );
  });
}

function renderNewsPane(items) {
  const pane = document.getElementById('p-news');
  pane.innerHTML = '';
  items.slice(0, 35).forEach((item) => {
    const tags = (item.tags || []).map((tag) => `<span class="cd-tag">#${escapeHtml(tag)}</span>`).join(' ');
    const card = document.createElement('div');
    card.className = 'cd';
    card.innerHTML = `
      <div class="cd-src"><span>${escapeHtml(item.source || 'OSINT')}</span><span>${escapeHtml(ago(item.pubDate))}</span></div>
      <div class="cd-hl">${escapeHtml(item.title)}</div>
      <div class="cd-ft">${tags || '<span></span>'}</div>
    `;
    card.onclick = () => {
      if (item.coords) {
        map.flyTo(item.coords, 7, { duration: 0.8 });
      } else if (item.link) {
        window.open(item.link, '_blank', 'noopener');
      }
    };
    pane.appendChild(card);
  });
}

async function loadNews() {
  const data = await f('/ticker');
  if (Array.isArray(data) && data.length) {
    STATE.news = data
      .map((item) => ({ ...item, coords: geo(item.title) }))
      .sort((a, b) => (safeDate(b.pubDate)?.getTime() || 0) - (safeDate(a.pubDate)?.getTime() || 0));
    STATE.newsUpdated = STATE.news[0]?.pubDate || '';
    renderNewsPane(STATE.news);
    renderNewsMarkers();
    const breaking = STATE.news.find((item) => /breaking|alert|urgent|just in/i.test(item.title || ''));
    if (breaking) showBrk(breaking.title);
    renderSources();
    renderLayerDock();
    return;
  }

  const proxy = 'https://api.allorigins.win/get?url=';
  const feeds = await Promise.all([
    { url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', name: 'BBC' },
    { url: 'https://rss.aljazeera.com/rss/all.rss', name: 'AL JAZEERA' },
  ].map(async (feed) => {
    try {
      const response = await fetch(proxy + encodeURIComponent(feed.url));
      const payload = await response.json();
      const xml = new DOMParser().parseFromString(payload.contents, 'text/xml');
      return Array.from(xml.querySelectorAll('item')).map((item) => ({
        title: item.querySelector('title')?.textContent || '',
        source: feed.name,
        pubDate: item.querySelector('pubDate')?.textContent || '',
        link: item.querySelector('link')?.textContent || '',
        tags: [],
        coords: geo(item.querySelector('title')?.textContent || ''),
      }));
    } catch {
      return [];
    }
  }));

  STATE.news = feeds.flat().sort((a, b) => (safeDate(b.pubDate)?.getTime() || 0) - (safeDate(a.pubDate)?.getTime() || 0));
  STATE.newsUpdated = STATE.news[0]?.pubDate || '';
  renderNewsPane(STATE.news);
  renderNewsMarkers();
  renderSources();
  renderLayerDock();
}

async function loadFr() {
  const data = await f('/fronts');
  const fronts = data?.fronts?.length ? data.fronts : [
    { name: 'Iran Theater', status: 'CRITICAL', score: 54, newsHits: 20, fireCount: 2 },
    { name: 'Lebanon / Hezbollah', status: 'ACTIVE', score: 42, newsHits: 12, fireCount: 2 },
    { name: 'Red Sea / Houthi', status: 'ACTIVE', score: 37, newsHits: 8, fireCount: 1 },
    { name: 'Strait of Hormuz', status: 'CRITICAL', score: 61, newsHits: 15, fireCount: 1 },
    { name: 'Iraq / PMU', status: 'ACTIVE', score: 29, newsHits: 6, fireCount: 1 },
    { name: 'Syria', status: 'STABLE', score: 14, newsHits: 2, fireCount: 2 },
    { name: 'Gaza', status: 'ACTIVE', score: 33, newsHits: 4, fireCount: 0 },
  ];

  STATE.fronts = fronts;
  STATE.frontsUpdated = data?.updatedAt || new Date().toISOString();

  document.getElementById('rFr').innerHTML = fronts.map((front) => {
    const status = String(front.status || '').toLowerCase();
    const cls = status === 'critical' ? 'c' : status === 'stable' ? 's' : 'a';
    return `
      <div class="fr">
        <div class="fd ${cls}"></div>
        <div class="fr-copy">
          <span class="fn">${escapeHtml(front.name)}</span>
          <span class="fm">${escapeHtml(`${front.newsHits || 0} news · ${front.fireCount || 0} fires`)}</span>
        </div>
        <span class="fs ${cls}">${escapeHtml(String(Math.round(front.score || 0)))}</span>
      </div>
    `;
  }).join('');

  renderSources();
}

document.getElementById('rNuc').innerHTML = NUC.map((site) => `
  <div class="nr">
    <div class="nd ${site.s}"></div>
    <span class="nn">${escapeHtml(site.n)}</span>
    <span class="ns ${site.s}">${escapeHtml(site.s === 'x' ? 'DESTROYED' : site.s === 'd' ? 'DAMAGED' : 'INTACT')}</span>
  </div>
`).join('');

document.getElementById('p-pred').innerHTML = PRED.map((prediction) => {
  const no = 100 - prediction.y;
  return `
    <div class="pr">
      <div class="pr-q">${escapeHtml(prediction.q)}</div>
      <div class="pr-bar">
        <span class="pr-pct y">${prediction.y}%</span>
        <div class="pr-track">
          <div class="pr-y" style="width:${prediction.y}%"></div>
          <div class="pr-n" style="width:${no}%"></div>
        </div>
        <span class="pr-pct n">${no}%</span>
      </div>
    </div>
  `;
}).join('');

document.querySelectorAll('.tab').forEach((button) => {
  button.onclick = () => {
    document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('on'));
    document.querySelectorAll('.pane').forEach((pane) => pane.classList.remove('on'));
    button.classList.add('on');
    document.getElementById(`p-${button.dataset.t}`).classList.add('on');
  };
});

renderLayerDock();
renderSatelliteIntel();
renderSources();

Promise.allSettled([loadEsc(), loadAcled(), loadFirms(), loadMkt(), loadNews(), loadFr()]);
setInterval(loadEsc, 5 * 6e4);
setInterval(loadAcled, 10 * 6e4);
setInterval(loadFirms, 10 * 6e4);
setInterval(loadMkt, 2 * 6e4);
setInterval(loadNews, 3 * 6e4);
setInterval(loadFr, 5 * 6e4);
