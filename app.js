// ═══════════════════════════════════════════════════════════
//  MEM — MIDDLE EASTERN MONITOR  ·  Cinematic War Room
//  Live data from GPD backend (ACLED, FIRMS, Markets, News)
// ═══════════════════════════════════════════════════════════

const API = 'https://dngws-monitor.vercel.app/api';
const WAR_START = new Date('2026-02-28T00:00:00Z');

// ── CLOCK ──────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent =
    now.toUTCString().split(' ')[4] + ' UTC';
  document.getElementById('dayCount').textContent =
    Math.floor((now - WAR_START) / 86400000);
}
setInterval(updateClock, 1000);
updateClock();

// ── MAP ────────────────────────────────────────────────────
const map = L.map('map', {
  center: [30, 48], zoom: 5,
  zoomControl: false,
  attributionControl: false
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 18
}).addTo(map);

// Conflict zones with animated pulsing borders
const ZONES = [
  { n: 'Gaza Strip',     c: [[31.2,34.2],[31.6,34.2],[31.6,34.6],[31.2,34.6]], col: '#ef4444' },
  { n: 'West Bank',      c: [[31.3,34.9],[32.6,34.9],[32.6,35.6],[31.3,35.6]], col: '#f97316' },
  { n: 'S. Lebanon',     c: [[33.0,35.1],[33.6,35.1],[33.6,36.0],[33.0,36.0]], col: '#f97316' },
  { n: 'NW Syria',       c: [[35.5,36.0],[37.0,36.0],[37.0,37.5],[35.5,37.5]], col: '#f59e0b' },
  { n: 'Yemen (Houthi)', c: [[13.0,42.0],[16.0,42.0],[16.0,47.0],[13.0,47.0]], col: '#f59e0b' },
  { n: 'NE Iraq',        c: [[33.5,42.0],[35.5,42.0],[35.5,45.0],[33.5,45.0]], col: '#f59e0b' },
  { n: 'Strait of Hormuz', c: [[26.0,55.5],[27.0,55.5],[27.0,57.0],[26.0,57.0]], col: '#3b82f6' },
];

ZONES.forEach(z => {
  L.polygon(z.c, {
    color: z.col, fillColor: z.col,
    fillOpacity: 0.06, weight: 1.5,
    opacity: 0.4, dashArray: '6,4'
  }).addTo(map).bindTooltip(z.n, { className: 'zone-tooltip' });
});

// Nuclear facility markers
const NUCLEAR_SITES = [
  { name: 'Natanz (FEP)', lat: 33.72, lon: 51.73, status: 'destroyed', type: 'Enrichment' },
  { name: 'Fordow (FFEP)', lat: 34.88, lon: 51.59, status: 'damaged', type: 'Enrichment' },
  { name: 'Isfahan (UCF)', lat: 32.65, lon: 51.68, status: 'damaged', type: 'Conversion' },
  { name: 'Arak (IR-40)', lat: 34.38, lon: 49.24, status: 'intact', type: 'Heavy Water' },
  { name: 'Bushehr NPP', lat: 28.83, lon: 50.89, status: 'intact', type: 'Power Reactor' },
];

const STATUS_COLORS = { destroyed: '#ef4444', damaged: '#f59e0b', intact: '#22c55e' };

NUCLEAR_SITES.forEach(site => {
  const icon = L.divIcon({
    className: '',
    html: `<div class="marker-nuclear" style="border-color:${STATUS_COLORS[site.status]}40;background:${STATUS_COLORS[site.status]}"></div>`,
    iconSize: [14, 14], iconAnchor: [7, 7]
  });
  L.marker([site.lat, site.lon], { icon }).addTo(map)
    .bindPopup(`<div class="pp-type" style="color:${STATUS_COLORS[site.status]}">NUCLEAR · ${site.status.toUpperCase()}</div>
      <div class="pp-title">${site.name}</div>
      <div class="pp-detail">${site.type}</div>`);
});

// Supply routes
const SUPPLY_ROUTES = [
  { from: [32.4, 53.7], to: [33.9, 35.5], color: '#ef4444', label: 'Iran → Hezbollah' },
  { from: [32.4, 53.7], to: [15.5, 48.5], color: '#f97316', label: 'Iran → Houthis' },
  { from: [32.4, 53.7], to: [33.3, 44.4], color: '#f59e0b', label: 'Iran → PMU/Iraq' },
];

SUPPLY_ROUTES.forEach(route => {
  L.polyline([route.from, route.to], {
    color: route.color, weight: 1.5,
    opacity: 0.35, dashArray: '8,6',
    className: 'supply-route'
  }).addTo(map).bindTooltip(route.label);
});

// Map quick-zoom buttons
document.getElementById('btnZoomME').addEventListener('click', () => map.flyTo([30, 48], 5, { duration: 1.2 }));
document.getElementById('btnZoomIran').addEventListener('click', () => map.flyTo([33, 52], 6, { duration: 1.2 }));
document.getElementById('btnZoomGaza').addEventListener('click', () => map.flyTo([31.4, 34.4], 10, { duration: 1.2 }));
document.getElementById('btnZoomYemen').addEventListener('click', () => map.flyTo([15, 45], 6, { duration: 1.2 }));

// ── LIVE DATA FETCHING ─────────────────────────────────────

let acledMarkers = [];
let firmsMarkers = [];

async function fetchJSON(endpoint) {
  try {
    const r = await fetch(`${API}${endpoint}`);
    if (!r.ok) throw new Error(`${r.status}`);
    return await r.json();
  } catch (e) {
    console.warn(`MEM: Failed to fetch ${endpoint}:`, e.message);
    return null;
  }
}

// ── ESCALATION ─────────────────────────────────────────────
async function loadEscalation() {
  const data = await fetchJSON('/escalation');
  if (!data) return;
  const fill = document.getElementById('escFill');
  const score = document.getElementById('escScore');
  fill.style.width = `${Math.min(data.score, 100)}%`;
  score.textContent = Math.round(data.score);
  score.style.color = data.level === 'red' ? '#ef4444' : data.level === 'amber' ? '#f59e0b' : '#22c55e';
}

// ── ACLED EVENTS ───────────────────────────────────────────
async function loadAcled() {
  const data = await fetchJSON('/acled');
  if (!data?.features?.length) return;

  // Clear old markers
  acledMarkers.forEach(m => map.removeLayer(m));
  acledMarkers = [];

  const events = data.features;
  let totalFatalities = 0;

  // Map markers
  events.forEach(f => {
    const p = f.properties;
    const coords = f.geometry?.coordinates;
    if (!coords) return;

    totalFatalities += p.fatalities || 0;

    const isStrike = (p.eventType || '').includes('Explosion');
    const isBattle = (p.eventType || '').includes('Battle');
    const cls = isStrike ? 'marker-strike' : isBattle ? 'marker-battle' : 'marker-strike';

    const icon = L.divIcon({
      className: '',
      html: `<div class="${cls}"></div>`,
      iconSize: [12, 12], iconAnchor: [6, 6]
    });

    const m = L.marker([coords[1], coords[0]], { icon }).addTo(map)
      .bindPopup(`<div class="pp-type" style="color:${isStrike ? '#ef4444' : isBattle ? '#f97316' : '#3b82f6'}">${(p.eventType || 'EVENT').toUpperCase()}</div>
        <div class="pp-title">${p.country || ''} · ${p.admin1 || ''}</div>
        <div class="pp-detail">${(p.notes || p.actor1 || '').substring(0, 120)}</div>
        <div class="pp-meta">${p.fatalities ? p.fatalities + ' fatalities · ' : ''}${p.eventDate || p.event_date || ''}</div>`);
    acledMarkers.push(m);
  });

  // Update header stats
  document.getElementById('statEvents').textContent = events.length;
  document.getElementById('statFatalities').textContent = totalFatalities.toLocaleString();

  // Render ACLED feed
  const feed = document.getElementById('acledFeed');
  feed.innerHTML = '';
  events.slice(0, 30).forEach(f => {
    const p = f.properties;
    const isStrike = (p.eventType || '').includes('Explosion');
    const isBattle = (p.eventType || '').includes('Battle');
    const isViolence = (p.eventType || '').includes('Violence');
    const cls = isStrike ? 'strike' : isBattle ? 'battle' : isViolence ? 'violence' : 'other';
    const typeCls = isStrike ? 'type-strike' : isBattle ? 'type-battle' : isViolence ? 'type-violence' : 'type-other';

    const card = document.createElement('div');
    card.className = `acard ${cls}`;
    card.innerHTML = `
      <div class="ac-type"><span class="type-label ${typeCls}">${(p.eventType || 'EVENT').replace('Explosions/Remote violence','Explosion')}</span><span>${p.eventDate || p.event_date || ''}</span></div>
      <div class="ac-loc">${p.country || ''}${p.admin1 ? ' · ' + p.admin1 : ''}</div>
      <div class="ac-detail">${(p.notes || p.actor1 || '').substring(0, 100)}</div>
      <div class="ac-footer">
        ${p.fatalities ? `<span class="ac-cas">${p.fatalities} fatalities</span>` : '<span></span>'}
        <span class="ac-actors">${(p.actor1 || '').substring(0, 30)}</span>
      </div>`;

    const coords = f.geometry?.coordinates;
    if (coords) {
      card.addEventListener('click', () => map.flyTo([coords[1], coords[0]], 9, { duration: 1 }));
    }
    feed.appendChild(card);
  });

  document.getElementById('articleCount').textContent = `EVENTS: ${events.length}`;
}

// ── FIRMS THERMAL ──────────────────────────────────────────
async function loadFirms() {
  const data = await fetchJSON('/firms');
  if (!data?.features?.length) return;

  firmsMarkers.forEach(m => map.removeLayer(m));
  firmsMarkers = [];

  data.features.forEach(f => {
    const coords = f.geometry?.coordinates;
    if (!coords) return;

    const icon = L.divIcon({
      className: '',
      html: '<div class="marker-fire"></div>',
      iconSize: [7, 7], iconAnchor: [3, 3]
    });

    const m = L.marker([coords[1], coords[0]], { icon }).addTo(map)
      .bindPopup(`<div class="pp-type" style="color:#f59e0b">THERMAL ANOMALY</div>
        <div class="pp-detail">FRP: ${f.properties?.frp || '?'} MW · Confidence: ${f.properties?.confidence || '?'}</div>`);
    firmsMarkers.push(m);
  });

  document.getElementById('statFires').textContent = data.features.length;
}

// ── MARKETS ────────────────────────────────────────────────
async function loadMarkets() {
  const data = await fetchJSON('/markets');
  if (!data || !Array.isArray(data)) return;

  // Ticker
  const track = document.getElementById('tickerTrack');
  const items = data.map(m => {
    const chg = parseFloat(m.change) || 0;
    const cls = chg >= 0 ? 'up' : 'dn';
    const sign = chg >= 0 ? '+' : '';
    return `<span class="ticker-item"><span class="sym">${m.symbol || m.name}</span><span class="price">${m.price}</span><span class="${cls}">${sign}${chg.toFixed(2)}%</span></span>`;
  }).join('');
  track.innerHTML = items + items; // double for infinite scroll

  // Right panel
  const panel = document.getElementById('marketPanel');
  const keySymbols = ['WTI Crude', 'Brent', 'Gold', 'BTC', 'S&P 500', 'EUR/USD'];
  const filtered = data.filter(m =>
    keySymbols.some(s => (m.symbol || m.name || '').toLowerCase().includes(s.toLowerCase()))
  ).slice(0, 8);

  if (filtered.length === 0 && data.length > 0) {
    // Fallback: show first 8
    filtered.push(...data.slice(0, 8));
  }

  panel.innerHTML = filtered.map(m => {
    const chg = parseFloat(m.change) || 0;
    const cls = chg >= 0 ? 'mkt-up' : 'mkt-dn';
    const sign = chg >= 0 ? '+' : '';
    return `<div class="market-row">
      <span class="mkt-name">${m.symbol || m.name}</span>
      <span class="mkt-price">${m.price}</span>
      <span class="mkt-change ${cls}">${sign}${chg.toFixed(2)}%</span>
    </div>`;
  }).join('');
}

// ── NEWS (RSS) ─────────────────────────────────────────────
async function loadNews() {
  // Try GPD ticker first
  const tickerData = await fetchJSON('/ticker');
  if (tickerData && Array.isArray(tickerData) && tickerData.length > 0) {
    renderNews(tickerData.map(t => ({
      title: t.title,
      description: '',
      source: t.source || 'OSINT',
      pubDate: t.pubDate,
      link: t.link,
      tags: t.tags
    })));
    return;
  }

  // Fallback: direct RSS
  const PROXY = 'https://api.allorigins.win/get?url=';
  const feeds = [
    { url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', name: 'BBC' },
    { url: 'https://rss.aljazeera.com/rss/all.rss', name: 'AL JAZEERA' },
  ];

  const results = await Promise.all(feeds.map(async f => {
    try {
      const r = await fetch(PROXY + encodeURIComponent(f.url));
      const d = await r.json();
      const xml = new DOMParser().parseFromString(d.contents, 'text/xml');
      return Array.from(xml.querySelectorAll('item')).map(i => ({
        title: i.querySelector('title')?.textContent || '',
        description: (i.querySelector('description')?.textContent || '').replace(/<[^>]+>/g, ''),
        source: f.name,
        pubDate: i.querySelector('pubDate')?.textContent || '',
      }));
    } catch { return []; }
  }));

  renderNews(results.flat().slice(0, 25));
}

const LOC_DB = {
  'gaza':[31.4,34.3],'west bank':[31.9,35.2],'jerusalem':[31.8,35.2],
  'tel aviv':[32.1,34.8],'israel':[31.5,34.9],'iran':[32.4,53.7],
  'tehran':[35.7,51.4],'iraq':[33.3,44.4],'baghdad':[33.3,44.4],
  'syria':[34.8,38.9],'damascus':[33.5,36.3],'lebanon':[33.9,35.5],
  'beirut':[33.9,35.5],'yemen':[15.5,48.5],'saudi':[23.9,45.1],
  'hamas':[31.4,34.3],'hezbollah':[33.9,35.5],'houthi':[15.5,48.5],
  'hormuz':[26.5,56.3],'natanz':[33.72,51.73],'fordow':[34.88,51.59],
};

function getCoords(text) {
  const l = (text || '').toLowerCase();
  for (const [k, v] of Object.entries(LOC_DB)) {
    if (l.includes(k)) return v;
  }
  return null;
}

function fmtTime(d) {
  if (!d) return '--';
  try {
    const diff = Math.floor((Date.now() - new Date(d)) / 60000);
    if (diff < 1) return 'JUST NOW';
    if (diff < 60) return `${diff}m AGO`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h AGO`;
    return new Date(d).toLocaleDateString();
  } catch { return d; }
}

function renderNews(articles) {
  const feed = document.getElementById('newsFeed');
  if (!articles.length) {
    feed.innerHTML = '<div class="loader">NO INTEL AVAILABLE</div>';
    return;
  }
  feed.innerHTML = '';

  // Check for breaking news
  const breaking = articles.find(a =>
    (a.title || '').toLowerCase().match(/breaking|alert|urgent|just in/)
  );
  if (breaking) showBreaking(breaking.title);

  articles.forEach(a => {
    const coords = getCoords(a.title + ' ' + (a.description || ''));
    const tags = a.tags ? a.tags.map(t => `<span style="color:var(--accent);font-size:0.4rem">#${t}</span>`).join(' ') : '';
    const d = document.createElement('div');
    d.className = 'ncard';
    d.innerHTML = `
      <div class="nc-src"><span>${a.source || 'OSINT'}</span>${coords ? '<span class="nc-mapped">MAP</span>' : ''}</div>
      <div class="nc-hl">${a.title}</div>
      ${a.description ? `<div class="nc-desc">${a.description.substring(0, 80)}${a.description.length > 80 ? '...' : ''}</div>` : ''}
      <div class="nc-time">${fmtTime(a.pubDate)} ${tags}</div>`;
    if (coords) {
      d.addEventListener('click', () => map.flyTo(coords, 8, { duration: 1 }));
    } else if (a.link) {
      d.addEventListener('click', () => window.open(a.link, '_blank'));
    }
    feed.appendChild(d);
  });

  document.getElementById('lastUpdate').textContent = 'UPDATED: ' + new Date().toUTCString().split(' ')[4];
}

// ── BREAKING ALERT ─────────────────────────────────────────
function showBreaking(text) {
  const el = document.getElementById('breakingAlert');
  document.getElementById('breakingText').textContent = text;
  el.style.display = 'flex';
  setTimeout(() => { el.style.display = 'none'; }, 30000);
}

document.getElementById('breakingClose').addEventListener('click', () => {
  document.getElementById('breakingAlert').style.display = 'none';
});

// ── NUCLEAR PANEL ──────────────────────────────────────────
function renderNuclear() {
  const panel = document.getElementById('nuclearPanel');
  panel.innerHTML = NUCLEAR_SITES.map(s =>
    `<div class="nuc-item">
      <div class="nuc-dot ${s.status}"></div>
      <span class="nuc-name">${s.name}</span>
      <span class="nuc-status ${s.status}">${s.status}</span>
    </div>`
  ).join('');
}
renderNuclear();

// ── PREDICTIONS ────────────────────────────────────────────
const PREDICTIONS = [
  { q: 'Will Iran-US ceasefire hold through April?', yes: 35 },
  { q: 'Will Hormuz reopen to commercial traffic?', yes: 22 },
  { q: 'Will UNSC pass new sanctions resolution?', yes: 68 },
  { q: 'Will Hezbollah escalate northern front?', yes: 45 },
  { q: 'Will oil exceed $120/bbl this month?', yes: 71 },
];

function renderPredictions() {
  // Right sidebar mini version
  const sidebar = document.getElementById('predictSidebar');
  sidebar.innerHTML = PREDICTIONS.map(p => {
    const no = 100 - p.yes;
    return `<div class="pred-mini">
      <div class="pred-q">${p.q}</div>
      <div class="pred-bar-wrap">
        <span class="pred-pct yes">${p.yes}%</span>
        <div class="pred-bar"><div class="pred-yes" style="width:${p.yes}%"></div><div class="pred-no" style="width:${no}%"></div></div>
        <span class="pred-pct no">${no}%</span>
      </div>
    </div>`;
  }).join('');

  // Left panel full version
  const feed = document.getElementById('predictionFeed');
  feed.innerHTML = PREDICTIONS.map((p, i) => {
    const no = 100 - p.yes;
    return `<div class="acard other" style="border-left-color:var(--green)">
      <div class="ac-type"><span class="type-label type-other">PREDICTION #${i + 1}</span></div>
      <div class="ac-loc">${p.q}</div>
      <div class="pred-bar-wrap" style="margin-top:6px">
        <span class="pred-pct yes">${p.yes}%</span>
        <div class="pred-bar"><div class="pred-yes" style="width:${p.yes}%"></div><div class="pred-no" style="width:${no}%"></div></div>
        <span class="pred-pct no">${no}%</span>
      </div>
    </div>`;
  }).join('');
}
renderPredictions();

// ── TABS ───────────────────────────────────────────────────
document.querySelectorAll('.ptab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// ── INITIALIZATION ─────────────────────────────────────────
async function init() {
  // Load everything in parallel
  await Promise.allSettled([
    loadEscalation(),
    loadAcled(),
    loadFirms(),
    loadMarkets(),
    loadNews(),
  ]);
}

init();

// Refresh intervals
setInterval(loadEscalation, 5 * 60 * 1000);   // 5 min
setInterval(loadAcled,     10 * 60 * 1000);    // 10 min
setInterval(loadFirms,     10 * 60 * 1000);    // 10 min
setInterval(loadMarkets,    2 * 60 * 1000);    // 2 min
setInterval(loadNews,       3 * 60 * 1000);    // 3 min
