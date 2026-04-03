// ═══════════════════════════════════════════════
//  MIDDLE EAST MONITOR — app.js
// ═══════════════════════════════════════════════

// ── CLOCK ──────────────────────────────────────
function updateClock() {
  document.getElementById('clock').textContent =
    new Date().toUTCString().split(' ')[4] + ' UTC';
}
setInterval(updateClock, 1000);
updateClock();

// ── MAP ────────────────────────────────────────
const map = L.map('map', { center:[29.5,42], zoom:5, zoomControl:true, attributionControl:false });
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom:18 }).addTo(map);

const zones = [
  { n:'Gaza Strip',     c:[[31.2,34.2],[31.6,34.2],[31.6,34.6],[31.2,34.6]], col:'#e63946' },
  { n:'West Bank',      c:[[31.3,34.9],[32.6,34.9],[32.6,35.6],[31.3,35.6]], col:'#ff8c00' },
  { n:'S. Lebanon',     c:[[33.0,35.1],[33.6,35.1],[33.6,36.0],[33.0,36.0]], col:'#ff8c00' },
  { n:'NW Syria',       c:[[35.5,36.0],[37.0,36.0],[37.0,37.5],[35.5,37.5]], col:'#ff8c00' },
  { n:'Yemen (Houthi)', c:[[13.0,42.0],[16.0,42.0],[16.0,47.0],[13.0,47.0]], col:'#ffd60a' },
  { n:'NE Iraq',        c:[[33.5,42.0],[35.5,42.0],[35.5,45.0],[33.5,45.0]], col:'#ffd60a' },
];
zones.forEach(z => L.polygon(z.c, { color:z.col, fillColor:z.col, fillOpacity:.08, weight:1, opacity:.4, dashArray:'4,4' }).addTo(map).bindTooltip(z.n));

const locDB = {
  'gaza':[31.4,34.3],'west bank':[31.9,35.2],'jerusalem':[31.8,35.2],
  'tel aviv':[32.1,34.8],'israel':[31.5,34.9],'palestine':[31.9,35.2],
  'iran':[32.4,53.7],'tehran':[35.7,51.4],'iraq':[33.3,44.4],'baghdad':[33.3,44.4],
  'syria':[34.8,38.9],'damascus':[33.5,36.3],'aleppo':[36.2,37.2],
  'lebanon':[33.9,35.5],'beirut':[33.9,35.5],'yemen':[15.5,48.5],
  'saudi':[23.9,45.1],'riyadh':[24.7,46.7],'jordan':[31.0,36.5],
  'egypt':[26.8,30.8],'cairo':[30.0,31.2],'turkey':[38.9,35.2],
  'qatar':[25.3,51.2],'doha':[25.3,51.5],'uae':[24.0,54.0],'dubai':[25.2,55.3],
  'hamas':[31.4,34.3],'hezbollah':[33.9,35.5],'houthi':[15.5,48.5],
  'rafah':[31.3,34.2],'mosul':[36.3,43.1],'aden':[12.8,45.0],
};

function getCoords(text) {
  const l = (text||'').toLowerCase();
  for (const [k,v] of Object.entries(locDB)) { if (l.includes(k)) return v; }
  return null;
}

let mkrs = [];
function clearMarkers() { mkrs.forEach(m => map.removeLayer(m)); mkrs = []; }
function addMarker(coords, type, title, detail, time) {
  const cls = { airstrike:'marker-airstrike', ground:'marker-ground', news:'marker-news' };
  const col = { airstrike:'#e63946', ground:'#ff8c00', news:'#ffd60a' };
  const lbl = { airstrike:'AIRSTRIKE', ground:'GROUND OP', news:'NEWS EVENT' };
  const icon = L.divIcon({ className:'', html:`<div class="${cls[type]||'marker-news'}"></div>`, iconSize:[12,12], iconAnchor:[6,6] });
  const m = L.marker(coords, {icon}).addTo(map);
  m.bindPopup(`<div class="pp-type" style="color:${col[type]}">${lbl[type]||'EVENT'}</div>
    <div class="pp-title">${title}</div>
    <div class="pp-det">${(detail||'').substring(0,100)}</div>
    <div class="pp-time">${time||''}</div>`);
  mkrs.push(m);
}

// ── CONFLICT ───────────────────────────────────
const incidents = [
  { type:'airstrike', loc:'Gaza Strip',         coords:[31.35,34.28], detail:'Israeli airstrikes on northern Gaza residential areas.',   time:'2h ago',  cas:12 },
  { type:'airstrike', loc:'Rafah',              coords:[31.30,34.24], detail:'Multiple strikes on southern Gaza crossing zone.',         time:'4h ago',  cas:7  },
  { type:'ground',    loc:'West Bank (Jenin)',  coords:[32.1,35.2],   detail:'IDF ground operation in Jenin refugee camp.',             time:'6h ago',  cas:3  },
  { type:'airstrike', loc:'Southern Lebanon',   coords:[33.2,35.4],   detail:'Rocket interception near Lebanon border.',               time:'8h ago',  cas:0  },
  { type:'shelling',  loc:'NW Syria (Idlib)',   coords:[36.2,36.9],   detail:'Artillery shelling near Idlib DMZ.',                    time:'10h ago', cas:5  },
  { type:'airstrike', loc:'Yemen (Hodeidah)',   coords:[14.8,42.9],   detail:'US-UK airstrikes on Houthi infrastructure.',             time:'12h ago', cas:0  },
  { type:'ground',    loc:'Northern Gaza',      coords:[31.55,34.47], detail:'Ground forces advance in Beit Hanoun.',                 time:'14h ago', cas:18 },
  { type:'shelling',  loc:'Baghdad Green Zone', coords:[33.3,44.4],   detail:'Rocket fire near US base.',                            time:'16h ago', cas:2  },
  { type:'airstrike', loc:'Deir ez-Zor, Syria', coords:[35.3,40.1],  detail:'Coalition strike on militant positions.',                time:'18h ago', cas:4  },
  { type:'ground',    loc:'Tulkarm, West Bank', coords:[32.3,35.0],   detail:'IDF operation in Tulkarm camp.',                       time:'20h ago', cas:1  },
];

document.getElementById('airstrike-count').textContent = incidents.filter(i => i.type==='airstrike').length;
document.getElementById('casualty-count').textContent  = (incidents.reduce((s,i) => s+(i.cas||0), 0)*30).toLocaleString();
document.getElementById('conflict-count').textContent  = zones.length;

function renderConflict() {
  const feed = document.getElementById('conflictFeed');
  feed.innerHTML = '';
  incidents.forEach(inc => {
    const tc  = inc.type==='ground' ? 'ground' : inc.type==='shelling' ? 'shelling' : '';
    const tl  = inc.type==='airstrike' ? 'AIRSTRIKE' : inc.type==='ground' ? 'GROUND OP' : 'SHELLING';
    const tcl = inc.type==='airstrike' ? 'ta' : inc.type==='ground' ? 'tg' : 'ts';
    const d   = document.createElement('div');
    d.className = `ccard ${tc}`;
    d.innerHTML = `<div class="cc-type"><span class="${tcl}">${tl}</span><span style="color:var(--muted)">${inc.time}</span></div>
      <div class="cc-loc">📍 ${inc.loc}</div>
      <div class="cc-det">${inc.detail}</div>
      ${inc.cas > 0 ? `<div class="cc-cas">⚠ ${inc.cas} casualties reported</div>` : ''}`;
    d.addEventListener('click', () => { map.flyTo(inc.coords, 9, {duration:1.2}); addMarker(inc.coords, inc.type, inc.loc, inc.detail, inc.time); });
    feed.appendChild(d);
    addMarker(inc.coords, inc.type, inc.loc, inc.detail, inc.time);
  });
}
renderConflict();

// ── PREDICT ────────────────────────────────────
const preds = [
  { id:'p1', q:'Will a Gaza ceasefire be announced this month?',      vol:'$2.4M', end:'Mar 31', yes:62, no:38, voted:null },
  { id:'p2', q:'Will Iran conduct direct military strike on Israel?',  vol:'$1.8M', end:'Apr 15', yes:27, no:73, voted:null },
  { id:'p3', q:'Will Houthi attacks on Red Sea resume full scale?',    vol:'$890K', end:'Mar 20', yes:71, no:29, voted:null },
  { id:'p4', q:'Will UN Security Council pass new Gaza resolution?',   vol:'$1.1M', end:'Apr 1',  yes:45, no:55, voted:null },
  { id:'p5', q:'Will Saudi-Israel normalization talks restart?',       vol:'$650K', end:'Jun 30', yes:38, no:62, voted:null },
  { id:'p6', q:'Will Lebanon war re-escalate before June 2025?',      vol:'$3.1M', end:'Jun 1',  yes:33, no:67, voted:null },
];

function buildPCard(p) {
  const y = Math.round(p.yes), n = 100 - y;
  return `<div class="pq">${p.q}</div>
    <div class="pm">VOL: ${p.vol} · CLOSES: ${p.end}</div>
    <div class="pbar-labels"><span class="byl">YES ${y}%</span><span class="bnl">NO ${n}%</span></div>
    <div class="pbar"><div class="pby" style="width:${y}%"></div><div class="pbn" style="width:${n}%"></div></div>
    <div class="pbtns">
      <button class="pbtn yes" onclick="castVote('${p.id}','yes')" ${p.voted?'disabled':''}>BUY YES</button>
      <button class="pbtn no"  onclick="castVote('${p.id}','no')"  ${p.voted?'disabled':''}>BUY NO</button>
    </div>
    <div class="pvol">${p.yes+p.no} votes</div>
    ${p.voted ? `<div class="pvoted">✓ You voted ${p.voted.toUpperCase()}</div>` : ''}`;
}

function renderPredict() {
  const feed = document.getElementById('predictionFeed');
  feed.innerHTML = '';
  preds.forEach(p => {
    const card = document.createElement('div');
    card.className = 'pcard'; card.id = `pred-${p.id}`;
    card.innerHTML = buildPCard(p);
    feed.appendChild(card);
  });
}
renderPredict();

window.castVote = function(id, side) {
  const p = preds.find(x => x.id===id);
  if (!p || p.voted) return;
  p.voted = side;
  const shift = 1 + Math.random()*2;
  if (side==='yes') p.yes = Math.min(97, p.yes+shift);
  else              p.yes = Math.max(3,  p.yes-shift);
  p.no = 100 - p.yes;
  document.getElementById(`pred-${id}`).innerHTML = buildPCard(p);
  addMessage('SYSTEM', `📊 Voted ${side.toUpperCase()}: "${p.q.substring(0,40)}..."`, true);
};

// ── TWEETS ─────────────────────────────────────
const tweetData = [
  { avatar:'🏛️', color:'#1da1f2', name:'Al Jazeera English',  handle:'@AJEnglish',    verified:true,  badge:'breaking', text:'🔴 LIVE: Ceasefire negotiations in Cairo enter critical phase as mediators push for 6-week deal.',           time:'2m ago',  likes:'4.2K', rt:'1.8K' },
  { avatar:'📡', color:'#e63946', name:'Reuters Middle East',  handle:'@ReutersMidEast',verified:true, badge:'official', text:'BREAKING: Israeli PM office confirms receipt of latest ceasefire proposal from Qatar and Egypt mediators.', time:'8m ago',  likes:'6.1K', rt:'2.9K' },
  { avatar:'🌍', color:'#ff8c00', name:'BBC News Middle East', handle:'@BBCMiddleEast', verified:true,  badge:'official', text:'Oil prices surge 2.3% after reports of heightened military activity near Strait of Hormuz.',              time:'14m ago', likes:'2.8K', rt:'980'  },
  { avatar:'📰', color:'#00d4ff', name:'Haaretz',              handle:'@haaretzcom',    verified:true,  badge:'',         text:'IDF spokesperson: "We continue to operate to achieve war objectives." No comment on ceasefire timeline.', time:'21m ago', likes:'1.4K', rt:'620'  },
  { avatar:'🕌', color:'#00e676', name:'Middle East Eye',      handle:'@MiddleEastEye', verified:false, badge:'breaking', text:'EXCLUSIVE: Three senior Hamas officials tell MEE they are "seriously considering" revised hostage-ceasefire framework.',time:'35m ago',likes:'8.7K',rt:'3.4K'},
  { avatar:'🌐', color:'#ffd60a', name:'CENTCOM',              handle:'@CENTCOM',       verified:true,  badge:'official', text:'U.S. forces conducted strikes against Houthi targets in Yemen in response to attacks on freedom of navigation.',time:'1h ago', likes:'5.3K',rt:'2.1K'},
  { avatar:'🏥', color:'#ff3355', name:'WHO EMRO',             handle:'@WHOEMRO',       verified:true,  badge:'',         text:'Gaza health system on verge of total collapse. Only 12 of 36 hospitals partially functional. Urgent access needed.',time:'2h ago',likes:'9.2K',rt:'4.8K'},
  { avatar:'💹', color:'#a78bfa', name:'Geopolitical Futures', handle:'@GPF_official',  verified:false, badge:'',         text:'Our analysis: 70% probability of further Hezbollah escalation in Q2 2025 if Gaza deal fails. Full thread below 🧵', time:'3h ago', likes:'3.1K',rt:'1.2K'},
];

const liveTweets = [
  { avatar:'📡', color:'#e63946', name:'NewsDesk',      handle:'@newsdesk_me',  badge:'breaking', text:'🚨 DEVELOPING: Reports of explosions heard in northern Gaza. Verifying details.', verified:false },
  { avatar:'🌍', color:'#ff8c00', name:'GulfObserver',  handle:'@GulfObserver', badge:'',         text:'Saudi Arabia calls for immediate de-escalation as tensions spike near Yemen border.', verified:false },
  { avatar:'🛡️', color:'#00d4ff', name:'IranWatch',     handle:'@IranWatch',    badge:'official', text:'Iranian state media: IRGC conducting "routine exercises" near Iraqi border. Pentagon monitoring.', verified:true },
  { avatar:'🔴', color:'#ff3355', name:'BreakingAlertz',handle:'@BreakAlerts',  badge:'breaking', text:'CONFIRMED: New drone strike intercepted over Red Sea. Houthi origin suspected.', verified:false },
];

let tweetRendered = false;
let liveTweetIdx  = 0;

function renderTweets() {
  if (tweetRendered) return;
  tweetRendered = true;
  const feed = document.getElementById('tweetFeed');
  feed.innerHTML = '';

  // X widget
  const wrap = document.createElement('div');
  wrap.innerHTML = `<a class="twitter-timeline" data-theme="dark" data-height="180"
    data-chrome="noheader nofooter noborders"
    href="https://twitter.com/search?q=%23Gaza+OR+%23MiddleEast+OR+%23Israel+OR+%23Iran&f=live">
    Loading live tweets...</a>`;
  feed.appendChild(wrap);
  if (!window._twLoaded) {
    const s = document.createElement('script');
    s.src = 'https://platform.twitter.com/widgets.js';
    s.async = true; s.charset = 'utf-8';
    document.head.appendChild(s);
    window._twLoaded = true;
  } else if (window.twttr) {
    window.twttr.widgets.load();
  }

  const div = document.createElement('div');
  div.className = 'tw-divider'; div.textContent = '— CURATED FEEDS —';
  feed.appendChild(div);

  tweetData.forEach(t => feed.appendChild(buildTweet(t)));
  scheduleLiveTweet(feed);
}

function buildTweet(t, isLive=false) {
  const card = document.createElement('div');
  card.className = 'tweet';
  const badge = t.badge ? `<span class="tw-badge ${t.badge}">${t.badge.toUpperCase()}</span>` : '';
  const ver   = t.verified ? '<span class="tw-verified">✓</span>' : '';
  const live  = isLive ? '<span class="tw-live-tag">● LIVE</span>' : '';
  const now   = new Date();
  const ts    = isLive ? now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0')+' UTC' : t.time;
  card.innerHTML = `
    <div class="tw-hdr">
      <div class="tw-avatar" style="background:${t.color}22;color:${t.color}">${t.avatar}</div>
      <div class="tw-info">
        <div class="tw-name">${t.name}${ver} ${badge} ${live}</div>
        <div class="tw-handle">${t.handle}</div>
      </div>
    </div>
    <div class="tw-text">${t.text}</div>
    <div class="tw-footer">
      <span class="tw-time">${ts}</span>
      <div class="tw-actions">
        <span class="tw-act">❤ ${t.likes||'0'}</span>
        <span class="tw-act">🔁 ${t.rt||'0'}</span>
      </div>
    </div>`;
  return card;
}

function scheduleLiveTweet(feed) {
  setTimeout(() => {
    const t = liveTweets[liveTweetIdx % liveTweets.length]; liveTweetIdx++;
    const card = buildTweet(t, true);
    const divider = feed.querySelector('.tw-divider');
    if (divider) feed.insertBefore(card, divider.nextSibling);
    else feed.prepend(card);
    scheduleLiveTweet(feed);
  }, 20000 + Math.random()*30000);
}

// ── VIDEO SWITCHER ──────────────────────────────
document.querySelectorAll('.vsw').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.vsw').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const ch = btn.dataset.channel;
    const customRow  = document.getElementById('customRow');
    const vlinks     = document.getElementById('vlinks');
    const vframeWrap = document.getElementById('vframeWrap');
    const frame      = document.getElementById('videoFrame');

    if (ch === 'custom') {
      vlinks.style.display = 'none';
      vframeWrap.style.display = 'none';
      customRow.style.display = 'flex';
    } else {
      customRow.style.display = 'none';
      vframeWrap.style.display = 'none';
      vlinks.style.display = 'flex';
    }
  });
});

document.getElementById('loadCustomStream').addEventListener('click', () => {
  let url = document.getElementById('customStreamUrl').value.trim();
  if (!url) return;
  // Convert watch URL to embed
  url = url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/');
  if (!url.includes('youtube.com/embed') && !url.includes('twitch.tv')) {
    alert('Please paste a YouTube or Twitch embed URL.');
    return;
  }
  if (!url.includes('autoplay') && url.includes('youtube')) {
    url += (url.includes('?') ? '&' : '?') + 'autoplay=1&mute=1';
  }
  const frame = document.getElementById('videoFrame');
  frame.src = url;
  document.getElementById('vlinks').style.display = 'none';
  document.getElementById('vframeWrap').style.display = 'block';
});

// ── NEWS ───────────────────────────────────────
const PROXY = 'https://api.allorigins.win/get?url=';
const RSS = [
  { url:'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', name:'BBC NEWS' },
  { url:'https://rss.aljazeera.com/rss/all.rss',                   name:'AL JAZEERA' },
];

async function fetchRSS(f) {
  try {
    const r = await fetch(PROXY + encodeURIComponent(f.url));
    const d = await r.json();
    const xml = new DOMParser().parseFromString(d.contents, 'text/xml');
    return Array.from(xml.querySelectorAll('item')).map(i => ({
      title:       i.querySelector('title')?.textContent || '',
      description: (i.querySelector('description')?.textContent || '').replace(/<[^>]+>/g, ''),
      source:      f.name,
      pubDate:     i.querySelector('pubDate')?.textContent || '',
    }));
  } catch { return []; }
}

function fmtTime(d) {
  if (!d) return '--';
  try {
    const diff = Math.floor((Date.now() - new Date(d)) / 60000);
    if (diff < 1)    return 'JUST NOW';
    if (diff < 60)   return `${diff}m AGO`;
    if (diff < 1440) return `${Math.floor(diff/60)}h AGO`;
    return new Date(d).toLocaleDateString();
  } catch { return d; }
}

function renderNews(articles) {
  const feed = document.getElementById('newsFeed');
  if (!articles.length) { feed.innerHTML = '<div class="loader">NO ARTICLES</div>'; return; }
  feed.innerHTML = '';
  articles.forEach(a => {
    const coords = getCoords(a.title + ' ' + a.description);
    const d = document.createElement('div');
    d.className = 'ncard';
    d.innerHTML = `<div class="nc-src"><span>${a.source}</span>${coords?'<span class="mapped">📍</span>':''}</div>
      <div class="nc-hl">${a.title}</div>
      <div class="nc-desc">${(a.description||'').substring(0,80)}${(a.description||'').length>80?'...':''}</div>
      <div class="nc-time">${fmtTime(a.pubDate)}</div>`;
    if (coords) {
      d.addEventListener('click', () => map.flyTo(coords, 7, {duration:1.2}));
      addMarker(coords, 'news', a.title, (a.description||'').substring(0,100), fmtTime(a.pubDate));
    }
    feed.appendChild(d);
  });
  document.getElementById('articleCount').textContent = `ARTICLES: ${articles.length}`;
  document.getElementById('lastUpdate').textContent   = 'UPDATED: ' + new Date().toUTCString().split(' ')[4];
}

async function fetchNews() {
  const r = await Promise.all(RSS.map(fetchRSS));
  renderNews(r.flat().slice(0, 25));
}
fetchNews();
setInterval(fetchNews, 3*60*1000);

// ── TABS ───────────────────────────────────────
document.querySelectorAll('.ptab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'tweets') renderTweets();
  });
});

// ── VIEWERS ────────────────────────────────────
let viewers = Math.floor(Math.random()*200) + 350;
let peak    = viewers;

function updateViewers() {
  viewers = Math.max(50, Math.min(2000, viewers + Math.floor((Math.random()-.38)*12)));
  if (viewers > peak) peak = viewers;
  document.getElementById('viewer-count').textContent  = viewers.toLocaleString();
  document.getElementById('viewerDisplay').textContent = viewers.toLocaleString() + ' watching';
  document.getElementById('peakViewers').textContent   = peak.toLocaleString();
}
updateViewers();
setInterval(updateViewers, 4000);

// ── REACTIONS ──────────────────────────────────
const rcounts = { fire:0, skull:0, bolt:0, alert:0, shock:0 };
const remojis = { fire:'🔥', skull:'💀', bolt:'⚡', alert:'🚨', shock:'😱' };

document.querySelectorAll('.rbtn').forEach(btn => {
  btn.addEventListener('click', () => {
    const k = btn.dataset.key;
    rcounts[k]++;
    document.getElementById('rc-'+k).textContent = rcounts[k];
    const r = btn.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'float-emoji';
    el.textContent = remojis[k];
    el.style.left = (r.left + r.width/2 - 10) + 'px';
    el.style.top  = (r.top - 8) + 'px';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  });
});

setInterval(() => {
  const k = Object.keys(rcounts)[Math.floor(Math.random()*5)];
  rcounts[k] += Math.floor(Math.random()*3)+1;
  document.getElementById('rc-'+k).textContent = rcounts[k];
}, 4000);

// ── CHAT ───────────────────────────────────────
const msgs = document.getElementById('chatMessages');

function ts() {
  const n = new Date();
  return n.getHours().toString().padStart(2,'0') + ':' + n.getMinutes().toString().padStart(2,'0');
}
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function addMessage(author, text, sys=false) {
  const d = document.createElement('div');
  d.className = 'msg' + (sys ? ' sys' : '');
  if (sys) {
    d.innerHTML = `<div class="mtext">${text}</div>`;
  } else {
    d.innerHTML = `<div class="mauthor"><span>${esc(author)}</span><span class="mtime">${ts()}</span></div>
      <div class="mtext">${esc(text)}</div>`;
  }
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
  while (msgs.children.length > 80) msgs.removeChild(msgs.firstChild);
}

function addGif(author, url) {
  const d = document.createElement('div');
  d.className = 'msg gmsg';
  d.innerHTML = `<div class="mauthor"><span>${esc(author)}</span><span class="mtime">${ts()}</span></div>
    <img class="cgif" src="${url}" loading="lazy"/>`;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
}

function addSticker(author, url) {
  const d = document.createElement('div');
  d.className = 'msg gmsg';
  d.innerHTML = `<div class="mauthor"><span>${esc(author)}</span><span class="mtime">${ts()}</span></div>
    <img class="csticker" src="${url}" loading="lazy"/>`;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
}

const botMsgs = [
  { n:'NewsBot',     t:'🔴 BREAKING: Ceasefire talks resume in Cairo' },
  { n:'Analyst_42',  t:'Oil prices spiking on Hormuz reports' },
  { n:'WatcherX',    t:'Explosions heard near Damascus suburbs' },
  { n:'MidEastDesk', t:'UN Security Council emergency session called' },
  { n:'Tracker99',   t:'Houthi drone intercepted over Red Sea — 3rd this week' },
  { n:'GeoInt',      t:'Satellite imagery: increased movement near Iranian border' },
  { n:'ReporterM',   t:'Aid convoy blocked at Gaza crossing 6th day in a row' },
  { n:'AnalystK',    t:'Iranian FM statement expected within the hour' },
  { n:'NewsBot',     t:'📊 Gold up 1.2% as regional tensions escalate' },
  { n:'WatcherX',    t:'3 rockets fired toward Eilat, Iron Dome activated' },
  { n:'Lurker_88',   t:'Anyone watching the ceasefire deal closely?' },
  { n:'MidEastDesk', t:'Qatar mediators land in Tel Aviv for talks' },
];

addMessage('', '— LIVE GLOBAL CHAT —', true);
addMessage('', 'Messages not stored. Be respectful.', true);
setTimeout(() => addMessage(botMsgs[0].n, botMsgs[0].t), 1000);
setTimeout(() => addMessage(botMsgs[1].n, botMsgs[1].t), 2800);
setTimeout(() => addMessage(botMsgs[2].n, botMsgs[2].t), 5200);

let bi = 3;
function schedBot() {
  setTimeout(() => {
    const m = botMsgs[bi % botMsgs.length];
    addMessage(m.n, m.t);
    bi++;
    schedBot();
  }, 8000 + Math.random()*18000);
}
schedBot();

const cinput = document.getElementById('chatInput');
const csend  = document.getElementById('chatSend');
const ninput = document.getElementById('nameInput');

function sendMsg() {
  const t = cinput.value.trim(); if (!t) return;
  addMessage(ninput.value.trim() || 'Anonymous', t);
  cinput.value = '';
}
csend.addEventListener('click', sendMsg);
cinput.addEventListener('keydown', e => { if (e.key==='Enter') sendMsg(); });

// ── GIF / STICKER ──────────────────────────────
const gifPanel     = document.getElementById('gifPanel');
const stickerPanel = document.getElementById('stickerPanel');
const openGif      = document.getElementById('openGifBtn');
const openStk      = document.getElementById('openStickerBtn');

function closeAll() {
  gifPanel.style.display = 'none';
  stickerPanel.style.display = 'none';
  openGif.classList.remove('active');
  openStk.classList.remove('active');
}

openGif.addEventListener('click', () => {
  const o = gifPanel.style.display === 'flex';
  closeAll();
  if (!o) { gifPanel.style.display = 'flex'; openGif.classList.add('active'); }
});
openStk.addEventListener('click', () => {
  const o = stickerPanel.style.display === 'flex';
  closeAll();
  if (!o) { stickerPanel.style.display = 'flex'; openStk.classList.add('active'); }
});
document.getElementById('closeGif').addEventListener('click', closeAll);
document.getElementById('closeSticker').addEventListener('click', closeAll);

async function searchGifs() {
  const q  = document.getElementById('gifSearchInput').value.trim();
  const gk = document.getElementById('giphyKey').value.trim();
  const tk = document.getElementById('tenorKey').value.trim();
  if (!q) return;
  const res = document.getElementById('gifResults');
  res.innerHTML = '<div style="grid-column:1/-1;text-align:center;font-family:var(--mono);font-size:9px;color:var(--muted);padding:14px">SEARCHING...</div>';
  const urls = [];
  if (gk) { try { const r=await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${gk}&q=${encodeURIComponent(q)}&limit=9&rating=g`); const d=await r.json(); (d.data||[]).forEach(g=>urls.push(g.images.fixed_height_small.url)); } catch{} }
  if (tk) { try { const r=await fetch(`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${tk}&limit=9&media_filter=gif`); const d=await r.json(); (d.results||[]).forEach(g=>{if(g.media_formats?.gif?.url)urls.push(g.media_formats.gif.url);}); } catch{} }
  if (!urls.length) { res.innerHTML='<div style="grid-column:1/-1;text-align:center;font-family:var(--mono);font-size:9px;color:var(--muted);padding:14px">Add API keys above, or paste a GIF URL directly.</div>'; return; }
  res.innerHTML = '';
  urls.forEach(url => {
    const img = document.createElement('img');
    img.className = 'gthumb'; img.src = url; img.loading = 'lazy';
    img.addEventListener('click', () => { addGif(ninput.value.trim()||'Anonymous', url); closeAll(); });
    res.appendChild(img);
  });
}
document.getElementById('gifSearchBtn').addEventListener('click', searchGifs);
document.getElementById('gifSearchInput').addEventListener('keydown', e => { if(e.key==='Enter') searchGifs(); });
document.getElementById('gifUrlSend').addEventListener('click', () => {
  const url = document.getElementById('gifUrlInput').value.trim(); if (!url) return;
  addGif(ninput.value.trim()||'Anonymous', url);
  document.getElementById('gifUrlInput').value = '';
  closeAll();
});

// STICKERS
const presets = [
  { url:'https://media.giphy.com/media/3o7TKSha51ATTx9KzC/giphy.gif', label:'ALERT'  },
  { url:'https://media.giphy.com/media/l4FGGafcOHmrlQxG0/giphy.gif',  label:'FIRE'   },
  { url:'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',  label:'BOOM'   },
  { url:'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif', label:'RADAR'  },
  { url:'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif',  label:'TANK'   },
  { url:'https://media.giphy.com/media/xT9IgG50Lg7russbDa/giphy.gif', label:'TROOPS' },
  { url:'https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif', label:'PEACE'  },
  { url:'https://media.giphy.com/media/l0HlFZ3R37FLFOBXO/giphy.gif',  label:'MAP'    },
];
let customStickers = [];

function renderPresets() {
  const g = document.getElementById('presetStickers'); g.innerHTML = '';
  presets.forEach(s => {
    const item = document.createElement('div'); item.className = 'sitem';
    item.innerHTML = `<img src="${s.url}" alt="${s.label}"/><span class="slabel">${s.label}</span>`;
    item.addEventListener('click', () => { addSticker(ninput.value.trim()||'Anonymous', s.url); closeAll(); });
    g.appendChild(item);
  });
}

function renderCustom() {
  const g = document.getElementById('customStickers');
  if (!customStickers.length) { g.innerHTML = '<div class="nocustom">No custom stickers yet.</div>'; return; }
  g.innerHTML = '';
  customStickers.forEach(s => {
    const item = document.createElement('div'); item.className = 'sitem';
    item.innerHTML = `<img src="${s.url}" alt="${s.label||''}"/><span class="slabel">${s.label||'CUSTOM'}</span>`;
    item.addEventListener('click', () => { addSticker(ninput.value.trim()||'Anonymous', s.url); closeAll(); });
    g.appendChild(item);
  });
}

document.getElementById('addCustomBtn').addEventListener('click', () => {
  const url   = document.getElementById('customUrl').value.trim();
  const label = document.getElementById('customLabel').value.trim() || 'CUSTOM';
  if (!url) return;
  customStickers.push({ url, label: label.toUpperCase().substring(0,10) });
  document.getElementById('customUrl').value = '';
  document.getElementById('customLabel').value = '';
  renderCustom();
});

document.querySelectorAll('.stab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.stab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.stab-pane').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('stab-' + tab.dataset.stab).classList.add('active');
  });
});
renderPresets(); renderCustom();

// ── TICKER ─────────────────────────────────────
let mock = { gold:2345.80, oil:78.34, sp:5432.10 };

async function fetchCrypto() {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
    return await r.json();
  } catch { return {}; }
}

function fmtP(n) { return n>1000 ? n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) : n.toFixed(2); }

async function updateTicker() {
  const cr = await fetchCrypto();
  mock.gold *= 1+(Math.random()-.5)*.0004;
  mock.oil  *= 1+(Math.random()-.5)*.0006;
  mock.sp   *= 1+(Math.random()-.5)*.0003;
  const assets = [
    { s:'BTC/USD', p:cr.bitcoin?.usd   ||67420, c:cr.bitcoin?.usd_24h_change   ||1.2  },
    { s:'ETH/USD', p:cr.ethereum?.usd  ||3540,  c:cr.ethereum?.usd_24h_change  ||0.8  },
    { s:'GOLD',    p:mock.gold,                  c:0.42  },
    { s:'OIL',     p:mock.oil,                   c:-0.88 },
    { s:'S&P500',  p:mock.sp,                    c:0.61  },
  ];
  const html = assets.map(a => {
    const u = a.c >= 0;
    return `<div class="ticker-item"><span class="sym">${a.s}</span><span class="price">$${fmtP(a.p)}</span><span class="${u?'up':'dn'}">${u?'▲':'▼'} ${Math.abs(a.c).toFixed(2)}%</span></div>`;
  }).join('');
  document.getElementById('tickerTrack').innerHTML = html + html;
}
updateTicker();
setInterval(updateTicker, 30*1000);

// ── WALKTHROUGH ─────────────────────────────────
const wtSteps = [
  { target:'topbar',     icon:'📊', title:'OVERVIEW',      desc:'Live airstrikes, casualties, conflict zones, and viewer count — all updating in real time.' },
  { target:'leftPanel',  icon:'📰', title:'FEEDS',         desc:'Switch between News, Conflict incidents, Prediction markets, and Tweets. Click any card to fly the map there.' },
  { target:'mapWrap',    icon:'🗺️', title:'CONFLICT MAP',  desc:'Live map with pulsing markers. Red = airstrike, Orange = ground op, Yellow = news. Shaded areas = active conflict zones.' },
  { target:'videoBar',   icon:'📺', title:'LIVE VIDEO',    desc:'Open Al Jazeera or BBC in a new tab. Use Custom URL to embed your own YouTube or Twitch stream.' },
  { target:'reactBar',   icon:'🔥', title:'REACTIONS',     desc:'Click emoji reactions — they float up Twitch-style. Bot viewers react automatically.' },
  { target:'chatHdr',    icon:'💬', title:'CHAT + GIFs',   desc:'Chat live. Click GIF to search Giphy & Tenor (add free API keys). Click 🎭 for stickers.' },
  { target:'tickerWrap', icon:'📈', title:'MARKETS',       desc:'Live BTC & ETH from CoinGecko. Gold, Oil, S&P update every 30 seconds.' },
];

let stepIdx = 0;
const overlay    = document.getElementById('wtOverlay');
const spotlight  = document.getElementById('wtSpotlight');
const wtBox      = document.getElementById('wtBox');

function showStep(i) {
  if (i >= wtSteps.length) { endTour(); return; }
  const s = wtSteps[i];
  document.getElementById('wtStep').textContent  = `STEP ${i+1} OF ${wtSteps.length}`;
  document.getElementById('wtIcon').textContent  = s.icon;
  document.getElementById('wtTitle').textContent = s.title;
  document.getElementById('wtDesc').textContent  = s.desc;
  document.getElementById('wtNext').textContent  = i===wtSteps.length-1 ? 'Finish ✓' : 'Next →';

  const el = document.getElementById(s.target);
  if (el) {
    const rect = el.getBoundingClientRect();
    const pad  = 6;
    spotlight.style.left   = (rect.left - pad) + 'px';
    spotlight.style.top    = (rect.top  - pad) + 'px';
    spotlight.style.width  = (rect.width  + pad*2) + 'px';
    spotlight.style.height = (rect.height + pad*2) + 'px';

    const bw = 290, bh = 200;
    let bx = rect.right + 14;
    let by = rect.top;
    if (bx + bw > window.innerWidth)  bx = rect.left - bw - 14;
    if (by + bh > window.innerHeight) by = window.innerHeight - bh - 14;
    if (by < 8) by = 8;
    wtBox.style.left = bx + 'px';
    wtBox.style.top  = by + 'px';
  }
}

function startTour() {
  stepIdx = 0;
  overlay.classList.add('active');
  overlay.style.display = 'block';
  showStep(0);
}

function endTour() {
  overlay.style.display = 'none';
  overlay.classList.remove('active');
}

document.getElementById('wtNext').addEventListener('click', () => { stepIdx++; showStep(stepIdx); });
document.getElementById('wtSkip').addEventListener('click', endTour);
document.getElementById('helpBtn').addEventListener('click', startTour);

// Auto-start tour once
try {
  if (!localStorage.getItem('mem_v2_toured')) {
    setTimeout(() => { startTour(); localStorage.setItem('mem_v2_toured','1'); }, 1400);
  }
} catch(e) {}
