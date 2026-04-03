// ═══════════════════════════════════════════════════════════
//  MEM — MIDDLE EASTERN MONITOR · HUD War Room
//  Full-screen map with floating intelligence overlays
//  Live data from GPD backend
// ═══════════════════════════════════════════════════════════

const API = 'https://dngws-monitor.vercel.app/api';
const WAR_START = new Date('2026-02-28T00:00:00Z');

// ── CLOCK + DAY COUNTER ────────────────────────────────────
function tick() {
  const now = new Date();
  const h = now.getUTCHours().toString().padStart(2, '0');
  const m = now.getUTCMinutes().toString().padStart(2, '0');
  document.getElementById('clock').textContent = `${h}:${m}`;
  document.getElementById('dayCount').textContent = Math.floor((now - WAR_START) / 86400000);
}
setInterval(tick, 1000);
tick();

// ── MAP ────────────────────────────────────────────────────
const map = L.map('map', {
  center: [29, 48], zoom: 5,
  zoomControl: false, attributionControl: false,
  zoomAnimation: true, fadeAnimation: true
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(map);

// Conflict zones — animated dash
const ZONES = [
  { n: 'Gaza', c: [[31.2,34.2],[31.6,34.2],[31.6,34.6],[31.2,34.6]], col: '#ef4444' },
  { n: 'West Bank', c: [[31.3,34.9],[32.6,34.9],[32.6,35.6],[31.3,35.6]], col: '#f97316' },
  { n: 'South Lebanon', c: [[33.0,35.1],[33.6,35.1],[33.6,36.0],[33.0,36.0]], col: '#f97316' },
  { n: 'NW Syria', c: [[35.5,36.0],[37.0,36.0],[37.0,37.5],[35.5,37.5]], col: '#f59e0b' },
  { n: 'Yemen (Houthi)', c: [[13.0,42.0],[16.0,42.0],[16.0,47.0],[13.0,47.0]], col: '#f59e0b' },
  { n: 'NE Iraq / PMU', c: [[33.5,42.0],[35.5,42.0],[35.5,45.0],[33.5,45.0]], col: '#f59e0b' },
  { n: 'Strait of Hormuz', c: [[26.0,55.5],[27.0,55.5],[27.0,57.0],[26.0,57.0]], col: '#3b82f6' },
];

ZONES.forEach(z => {
  L.polygon(z.c, {
    color: z.col, fillColor: z.col, fillOpacity: 0.05,
    weight: 1.5, opacity: 0.35, dashArray: '8,6'
  }).addTo(map).bindTooltip(z.n, { className: 'zone-tooltip', sticky: true });
});

// Nuclear facilities
const NUC_SITES = [
  { name: 'Natanz', lat: 33.72, lon: 51.73, status: 'destroyed', type: 'Enrichment' },
  { name: 'Fordow', lat: 34.88, lon: 51.59, status: 'damaged', type: 'Enrichment' },
  { name: 'Isfahan', lat: 32.65, lon: 51.68, status: 'damaged', type: 'Conversion' },
  { name: 'Arak', lat: 34.38, lon: 49.24, status: 'intact', type: 'Heavy Water' },
  { name: 'Bushehr', lat: 28.83, lon: 50.89, status: 'intact', type: 'Power Reactor' },
];
const SC = { destroyed: '#ef4444', damaged: '#f59e0b', intact: '#22c55e' };

NUC_SITES.forEach(s => {
  const icon = L.divIcon({ className: '', html: `<div class="mk-nuc" style="border-color:${SC[s.status]}60;background:${SC[s.status]}"></div>`, iconSize: [12, 12], iconAnchor: [6, 6] });
  L.marker([s.lat, s.lon], { icon }).addTo(map)
    .bindPopup(`<div class="pp-type" style="color:${SC[s.status]}">NUCLEAR · ${s.status.toUpperCase()}</div><div class="pp-title">${s.name}</div><div class="pp-detail">${s.type}</div>`);
});

// Supply routes
[
  { from: [32.4,53.7], to: [33.9,35.5], col: '#ef444460', label: 'Iran → Hezbollah' },
  { from: [32.4,53.7], to: [15.5,48.5], col: '#f9731660', label: 'Iran → Houthis' },
  { from: [32.4,53.7], to: [33.3,44.4], col: '#f59e0b60', label: 'Iran → PMU' },
].forEach(r => {
  L.polyline([r.from, r.to], { color: r.col, weight: 1.5, dashArray: '10,8' }).addTo(map).bindTooltip(r.label);
});

// Quick zoom
document.getElementById('zME').addEventListener('click', () => map.flyTo([29, 48], 5, { duration: 1.2 }));
document.getElementById('zIR').addEventListener('click', () => map.flyTo([33, 52], 6, { duration: 1.2 }));
document.getElementById('zGZ').addEventListener('click', () => map.flyTo([31.4, 34.4], 10, { duration: 1.2 }));
document.getElementById('zYE').addEventListener('click', () => map.flyTo([15, 45], 6, { duration: 1.2 }));

// ── FETCH HELPER ───────────────────────────────────────────
async function api(path) {
  try { const r = await fetch(`${API}${path}`); if (!r.ok) throw 0; return await r.json(); }
  catch { return null; }
}

// ── ESCALATION ─────────────────────────────────────────────
async function loadEsc() {
  const d = await api('/escalation');
  if (!d) return;
  const pct = Math.min(d.score, 100);
  const circ = 125.6; // 2 * PI * 20
  document.getElementById('escArc').style.strokeDashoffset = circ - (pct / 100) * circ;
  document.getElementById('escVal').textContent = Math.round(d.score);
  const col = d.level === 'red' ? '#ef4444' : d.level === 'amber' ? '#f59e0b' : '#22c55e';
  document.getElementById('escArc').style.stroke = col;
  document.getElementById('escVal').style.color = col;
  document.getElementById('escLabel').textContent = d.label || 'ESCALATION';
}

// ── ACLED ──────────────────────────────────────────────────
let acledMk = [];
async function loadAcled() {
  const d = await api('/acled');
  if (!d?.features?.length) return;
  acledMk.forEach(m => map.removeLayer(m)); acledMk = [];

  let fatal = 0;
  const feed = document.getElementById('pane-acled');
  feed.innerHTML = '';

  d.features.forEach(f => {
    const p = f.properties, co = f.geometry?.coordinates;
    fatal += p.fatalities || 0;
    const isStrike = (p.eventType || '').includes('Explosion');
    const isBattle = (p.eventType || '').includes('Battle');
    const cls = isStrike ? 'mk-strike' : isBattle ? 'mk-battle' : 'mk-strike';
    const cardCls = isStrike ? 'strike' : isBattle ? 'battle' : (p.eventType || '').includes('Violence') ? 'violence' : '';
    const typeColor = isStrike ? 'var(--red)' : isBattle ? 'var(--orange)' : 'var(--pink)';

    if (co) {
      const icon = L.divIcon({ className: '', html: `<div class="${cls}"></div>`, iconSize: [10, 10], iconAnchor: [5, 5] });
      const m = L.marker([co[1], co[0]], { icon }).addTo(map)
        .bindPopup(`<div class="pp-type" style="color:${typeColor}">${(p.eventType || 'EVENT').toUpperCase()}</div>
          <div class="pp-title">${p.country || ''} · ${p.admin1 || ''}</div>
          <div class="pp-detail">${(p.notes || p.actor1 || '').substring(0, 120)}</div>
          <div class="pp-meta">${p.fatalities ? p.fatalities + ' fatalities · ' : ''}${p.eventDate || p.event_date || ''}</div>`);
      acledMk.push(m);
    }

    const card = document.createElement('div');
    card.className = `icard ${cardCls}`;
    card.innerHTML = `<div class="ic-src"><span>${(p.eventType || 'EVENT').replace('Explosions/Remote violence','Explosion').toUpperCase()}</span><span>${p.eventDate || p.event_date || ''}</span></div>
      <div class="ic-hl">${p.country || ''}${p.admin1 ? ' · ' + p.admin1 : ''}</div>
      <div class="ic-sub">${(p.notes || p.actor1 || '').substring(0, 90)}</div>
      <div class="ic-meta">${p.fatalities ? `<span class="ic-cas">${p.fatalities} KIA</span>` : ''}<span>${(p.actor1 || '').substring(0, 25)}</span></div>`;
    if (co) card.addEventListener('click', () => map.flyTo([co[1], co[0]], 9, { duration: 0.8 }));
    feed.appendChild(card);
  });

  document.getElementById('statEvents').textContent = d.features.length;
  document.getElementById('statFatal').textContent = fatal.toLocaleString();
}

// ── FIRMS ──────────────────────────────────────────────────
let firmsMk = [];
async function loadFirms() {
  const d = await api('/firms');
  if (!d?.features?.length) return;
  firmsMk.forEach(m => map.removeLayer(m)); firmsMk = [];
  d.features.forEach(f => {
    const co = f.geometry?.coordinates;
    if (!co) return;
    const icon = L.divIcon({ className: '', html: '<div class="mk-fire"></div>', iconSize: [5, 5], iconAnchor: [2, 2] });
    firmsMk.push(L.marker([co[1], co[0]], { icon }).addTo(map));
  });
  document.getElementById('statFires').textContent = d.features.length;
}

// ── MARKETS ────────────────────────────────────────────────
async function loadMarkets() {
  const d = await api('/markets');
  if (!d || !Array.isArray(d)) return;

  // Ticker
  const track = document.getElementById('tickerTrack');
  const html = d.map(m => {
    const c = parseFloat(m.change) || 0;
    return `<span class="t-item"><span class="t-sym">${m.symbol || m.name}</span><span class="t-price">${m.price}</span><span class="${c >= 0 ? 't-up' : 't-dn'}">${c >= 0 ? '+' : ''}${c.toFixed(2)}%</span></span>`;
  }).join('');
  track.innerHTML = html + html;

  // Right panel — key symbols
  const panel = document.getElementById('rMarkets');
  const show = d.filter(m => {
    const n = (m.symbol || m.name || '').toLowerCase();
    return ['wti', 'brent', 'gold', 'btc', 's&p', 'eur'].some(k => n.includes(k));
  }).slice(0, 6);
  if (!show.length) show.push(...d.slice(0, 6));

  panel.innerHTML = show.map(m => {
    const c = parseFloat(m.change) || 0;
    return `<div class="mrow"><span class="m-sym">${m.symbol || m.name}</span><span class="m-price">${m.price}</span><span class="m-chg ${c >= 0 ? 'm-up' : 'm-dn'}">${c >= 0 ? '+' : ''}${c.toFixed(2)}%</span></div>`;
  }).join('');
}

// ── NEWS ───────────────────────────────────────────────────
const LOC = {
  'gaza':[31.4,34.3],'west bank':[31.9,35.2],'jerusalem':[31.8,35.2],'israel':[31.5,34.9],
  'iran':[32.4,53.7],'tehran':[35.7,51.4],'iraq':[33.3,44.4],'baghdad':[33.3,44.4],
  'syria':[34.8,38.9],'damascus':[33.5,36.3],'lebanon':[33.9,35.5],'beirut':[33.9,35.5],
  'yemen':[15.5,48.5],'hamas':[31.4,34.3],'hezbollah':[33.9,35.5],'houthi':[15.5,48.5],
  'hormuz':[26.5,56.3],'natanz':[33.72,51.73],'saudi':[23.9,45.1],
};
function geo(text) {
  const l = (text || '').toLowerCase();
  for (const [k, v] of Object.entries(LOC)) if (l.includes(k)) return v;
  return null;
}
function ago(d) {
  if (!d) return '';
  try {
    const m = Math.floor((Date.now() - new Date(d)) / 60000);
    if (m < 1) return 'NOW'; if (m < 60) return m + 'm'; if (m < 1440) return Math.floor(m / 60) + 'h';
    return new Date(d).toLocaleDateString();
  } catch { return ''; }
}

async function loadNews() {
  const d = await api('/ticker');
  const feed = document.getElementById('pane-news');

  if (d && Array.isArray(d) && d.length) {
    feed.innerHTML = '';
    // Breaking detection
    const brk = d.find(a => (a.title || '').toLowerCase().match(/breaking|alert|urgent|just in/));
    if (brk) showBreaking(brk.title);

    d.slice(0, 30).forEach(a => {
      const coords = geo(a.title);
      const tags = (a.tags || []).map(t => `<span class="ic-tag">#${t}</span>`).join(' ');
      const card = document.createElement('div');
      card.className = 'icard';
      card.innerHTML = `<div class="ic-src"><span>${a.source || 'OSINT'}</span><span>${ago(a.pubDate)}</span></div>
        <div class="ic-hl">${a.title}</div>
        <div class="ic-meta">${tags}</div>`;
      if (coords) card.addEventListener('click', () => map.flyTo(coords, 8, { duration: 0.8 }));
      else if (a.link) card.addEventListener('click', () => window.open(a.link, '_blank'));
      feed.appendChild(card);
    });
    return;
  }

  // RSS fallback
  const PROXY = 'https://api.allorigins.win/get?url=';
  const FEEDS = [
    { url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', name: 'BBC' },
    { url: 'https://rss.aljazeera.com/rss/all.rss', name: 'AL JAZEERA' },
  ];
  const results = await Promise.all(FEEDS.map(async f => {
    try {
      const r = await fetch(PROXY + encodeURIComponent(f.url));
      const j = await r.json();
      const xml = new DOMParser().parseFromString(j.contents, 'text/xml');
      return Array.from(xml.querySelectorAll('item')).map(i => ({
        title: i.querySelector('title')?.textContent || '',
        source: f.name,
        pubDate: i.querySelector('pubDate')?.textContent || '',
      }));
    } catch { return []; }
  }));

  feed.innerHTML = '';
  results.flat().slice(0, 25).forEach(a => {
    const card = document.createElement('div');
    card.className = 'icard';
    card.innerHTML = `<div class="ic-src"><span>${a.source}</span><span>${ago(a.pubDate)}</span></div><div class="ic-hl">${a.title}</div>`;
    const coords = geo(a.title);
    if (coords) card.addEventListener('click', () => map.flyTo(coords, 8, { duration: 0.8 }));
    feed.appendChild(card);
  });
}

// ── BREAKING ───────────────────────────────────────────────
function showBreaking(text) {
  document.getElementById('brkText').textContent = text;
  document.getElementById('breaking').style.display = 'flex';
  setTimeout(() => { document.getElementById('breaking').style.display = 'none'; }, 25000);
}
document.getElementById('brkClose').addEventListener('click', () => { document.getElementById('breaking').style.display = 'none'; });

// ── NUCLEAR PANEL ──────────────────────────────────────────
document.getElementById('rNuclear').innerHTML = NUC_SITES.map(s =>
  `<div class="n-row"><div class="n-dot ${s.status}"></div><span class="n-name">${s.name}</span><span class="n-stat ${s.status}">${s.status}</span></div>`
).join('');

// ── FRONTS PANEL ───────────────────────────────────────────
async function loadFronts() {
  const d = await api('/fronts');
  const panel = document.getElementById('rFronts');
  if (!d?.fronts?.length) {
    // Fallback curated
    panel.innerHTML = [
      { n: 'Iran Theater', s: 'critical' }, { n: 'Lebanon / Hezbollah', s: 'active' },
      { n: 'Red Sea / Houthi', s: 'active' }, { n: 'Strait of Hormuz', s: 'critical' },
      { n: 'Iraq / PMU', s: 'active' }, { n: 'Syria', s: 'stable' },
    ].map(f => `<div class="f-row"><div class="f-dot ${f.s}"></div><span class="f-name">${f.n}</span><span class="f-status ${f.s}">${f.s}</span></div>`).join('');
    return;
  }
  panel.innerHTML = d.fronts.map(f => {
    const s = (f.status || '').toLowerCase();
    const cls = s === 'critical' ? 'critical' : s === 'active' ? 'active' : 'stable';
    return `<div class="f-row"><div class="f-dot ${cls}"></div><span class="f-name">${f.name}</span><span class="f-status ${cls}">${s}</span></div>`;
  }).join('');
}

// ── TABS ───────────────────────────────────────────────────
document.querySelectorAll('.ftab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.feed-pane').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('pane-' + tab.dataset.tab).classList.add('active');
  });
});

// ── INIT ───────────────────────────────────────────────────
Promise.allSettled([loadEsc(), loadAcled(), loadFirms(), loadMarkets(), loadNews(), loadFronts()]);

setInterval(loadEsc, 5 * 60 * 1000);
setInterval(loadAcled, 10 * 60 * 1000);
setInterval(loadFirms, 10 * 60 * 1000);
setInterval(loadMarkets, 2 * 60 * 1000);
setInterval(loadNews, 3 * 60 * 1000);
setInterval(loadFronts, 5 * 60 * 1000);
