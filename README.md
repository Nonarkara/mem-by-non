# MEM by NON — Middle Eastern Monitor

Standalone conflict-tracker dashboard for the Middle East. A static Leaflet map with a glass HUD: intel headlines, conflict events, satellite and thermal overlays, markets, and a small set of analyst-coded panels.

Created by **Dr. Non Arkaraprasertkul**. In the app’s own Papers tab, MEM is the fast regional monitor in a family of four dashboards (AsiaWatch, GlobeWatch, World Console, MEM). The UI labels this copy a legacy monitor and links the fuller GlobeWatch build.

This repository is the front end only. Live numbers on the map come from a remote API and from public map/news sources. They are not stored in this repo, and this README does not publish casualty figures.

## Live demo

Verified against this tree (same `index.html` as `main`):

- [https://mem-by-non.pages.dev](https://mem-by-non.pages.dev) — Cloudflare Pages (`mem-by-non`)
- [https://nonarkara.github.io/mem-by-non/](https://nonarkara.github.io/mem-by-non/) — GitHub Pages

The GitHub repo homepage field points at `https://mem-by-non.vercel.app`, and this repo includes a `vercel.json` SPA rewrite. That Vercel hostname currently returns **no deployment** (`DEPLOYMENT_NOT_FOUND`). Do not treat it as a live site until a deployment exists.

Related dashboards named in the UI:

| Monitor | URL |
| --- | --- |
| GlobeWatch (full version) | https://globalmonitor.nonarkara.org/ |
| AsiaWatch | https://asia.nonarkara.org |
| World Console (API host) | https://global.nonarkara.org |

## What it shows

Full-bleed map (Leaflet) with floating panels:

- **Header** — UTC clock; “days of conflict” counted from `2026-02-28T00:00:00Z` in `app.js`; escalation gauge from the API; event / KIA / fire / source pills filled from feeds (placeholders `--` until data arrives)
- **Intel** — headlines from the API ticker, with BBC World (Middle East) and Al Jazeera RSS as fallback
- **Conflict** — GeoJSON events from the API (ACLED-shaped). The strike log is labeled **LIVE** only when the feed is not a curated fallback
- **SAT** — NASA GIBS MODIS true color (about two-day lag), aerosol/dust overlay, NASA FIRMS thermal detections
- **Predict** — hand-set scenario markers, not a live poll or computed forecast (`app.js` says so on the pane)
- **Papers** — project note and satellite-layer honesty (Himawari / GCOM-C / ALOS-2 are called out as not built yet)
- **Data wall** — satellite stack, market impact, active fronts, conflict hotspots, strike log, nuclear-site markers, source health

Map stack: dark (Carto), world imagery (Esri), NASA MODIS; overlays for AOD, conflict, thermal, and news. Preset zooms: ME, IR, GZ, YE, Hormuz.

Nuclear-site rows and some front scores are **coded in the client** (`NUC`, and a fronts fallback if the API returns nothing). Treat them as UI fixtures, not independently verified tallies.

## Stack

| Piece | Detail |
| --- | --- |
| Runtime | Static HTML / CSS / JS — no bundler, no npm dependencies |
| Map | [Leaflet](https://leafletjs.com/) 1.9.4 (CDN) |
| API | `https://global.nonarkara.org/api` — `/escalation`, `/acled`, `/firms`, `/markets`, `/ticker`, `/fronts` |
| Tiles | Carto Dark, Esri World Imagery, [NASA GIBS](https://nasa.github.io/worldview/) MODIS |
| News fallback | BBC and Al Jazeera RSS via [All Origins](https://api.allorigins.win/) |
| Deploy configs | `vercel.json` (rewrite all paths to `index.html`); Cloudflare Pages project name `mem-by-non` |

`package.json` is metadata only (`name`: `mem-by-non`, `version`: `1.0.0`). There is no `start` script and nothing to install.

## Run locally

Any static file server works. The dashboard fetches the remote API and map tiles, so it needs a network.

```bash
git clone https://github.com/Nonarkara/mem-by-non.git
cd mem-by-non
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).

Alternatives:

```bash
npx --yes serve .
# or
npx --yes http-server -p 8080
```

Opening `index.html` as a `file://` URL may block some fetches depending on the browser. Use a local server.

Refresh intervals (from `app.js`): escalation and fronts every 5 minutes, conflict and FIRMS every 10 minutes, markets every 2 minutes, news every 3 minutes.

## Data and honesty

- **KIA / event counts** are sums of whatever the conflict feed returns (`properties.fatalities` and feature count). This repo does not ship a casualty table.
- **FIRMS** may be live NASA detections or a backend sample set. The fires pill is titled accordingly; live thermal data is a backend key (`FIRMS_MAP_KEY` on the API host, not in this repo).
- **Conflict source** may include `fallback` / curated data. The UI then says **CURATED STRIKE LOG**, not LIVE.
- **Predict** percentages are analyst-set, updated by hand.
- Banner copy (“UNCLASSIFIED // FOR OFFICIAL USE ONLY”) is styling, not a classification marking for this public dashboard.

Use the map as an OSINT viewer. It is not official government intelligence or policy guidance.

## Project layout

```
index.html    # HUD, map root, About modal
app.js        # map, overlays, API clients, fallbacks
style.css     # war-room layout
404.html      # older static copy (legacy 404 page)
vercel.json   # Vercel SPA rewrite
package.json  # name/version only
```

## Credits

Supported in the About modal by the Program Management Unit for Area Based Development (PMU A) and the Digital Economy Promotion Agency (depa); project execution credited to Axiom and ReTL (The Reason to Live Company). Created by Dr. Non Arkaraprasertkul and Associate Professor Dr. Poon Thiengburanathum.

## License

[MIT](LICENSE)
