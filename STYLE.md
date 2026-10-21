# MEM: deliberate operating choices

Audience: readers checking Middle East signals quickly on a phone or laptop.
Job: put sourced events on a working geographic surface.
Hierarchy: map, dated signals, optional instruments.
Constraints: public feeds can fail; 320px phones and keyboard access remain supported.
Direction: the existing dark theater chart with compact cyan instruments.

The MEM wordmark, dark ground and geographic category colours are deliberate. Josefin Sans is the label voice, Source Sans 3 is prose, and JetBrains Mono carries numeric instruments. Scientific/event categories are not a decorative accent palette.

The map is full-screen. News/conflict/satellite/prediction/papers and the data wall remain accessible through a single edge drawer. Click its active tab or press Escape to return to the map. Layers use a native disclosure. No fake depth, no decorative glow, no fixed open panel covering the map on first visit.

All basemaps need visible attribution. A provider's HTTP 200 does not prove its tiles are usable: inspect the actual map for key-required watermarks. Keep absent/stale/reference feed qualifications.

Before shipping, use the suite's `scripts/live-suite-check.mjs` against the deployed URL and inspect 1440/1024/390/320 screenshots. A different reviewer exercises the tabs, layer disclosure and return path. Non-Slop: https://github.com/Nonarkara/Non-Slop (MIT).
