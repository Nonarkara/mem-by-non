import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { researchRecord } from '../research-catalog.js';
const source = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');

test('actual MEM popup handler retains structured marker dates and does not infer one from HTML', () => {
  const start = source.indexOf("map.on('popupopen', event => {");
  const end = source.indexOf('\n});', start) + 4;
  let handler, selected;
  const researchPopups = new WeakMap();
  vm.runInNewContext(source.slice(start, end), { map: { on: (_, fn) => { handler = fn; } }, researchPopups, selectResearchContext: value => { selected = value; } });
  for (const context of [
    { label: 'Public news', publishedAt: '2026-10-25T01:00:00Z' },
    { label: 'Thermal detection', observedAt: '2026-10-25 01:00 UTC' },
    { label: 'Conflict', eventAt: '2026-10-24' },
  ]) {
    const popup = { getElement: () => ({ querySelector: () => ({ textContent: 'Display-only label' }) }) };
    researchPopups.set(popup, context); handler({ popup });
    assert.deepEqual(selected, context);
    const record = researchRecord('mem', selected);
    for (const key of ['publishedAt', 'observedAt', 'eventAt']) assert.equal(record.context[key], context[key] || null);
  }
  handler({ popup: { getElement: () => null } }); assert.equal(selected, null);
});

test('actual conflict-card action retains event date while still moving the map', () => {
  // Use the handler containing its structured event time, regardless of the
  // name of the surrounding renderer.
  const anchor = source.indexOf("selectResearchContext({ label: `${item.country}");
  const from = source.lastIndexOf('card.onclick = () => {', anchor);
  const to = source.indexOf('\n    };', anchor) + 7;
  assert.ok(from >= 0 && to > from);
  let selected, moved = false;
  const card = {}, item = { country: 'Israel', region: 'Southern', type: 'Battle', date: '2026-10-23', lat: 1, lon: 2 };
  vm.runInNewContext(source.slice(from, to), { card, item, selectResearchContext: value => { selected = value; }, map: { flyTo: () => { moved = true; } } });
  card.onclick();
  assert.equal(selected.eventAt, item.date); assert.ok(moved);
});

test('actual marker producers attach the time metadata consumed by the popup handler', () => {
  for (const [needle, field, expected] of [
    ["label: `${item.country}", 'eventAt', '2026-10-23'],
    ["label: 'Thermal detection'", 'observedAt', '2026-10-25 01:00 UTC'],
    ['label: item.title, publishedAt: item.pubDate', 'publishedAt', '2026-10-25T02:00:00Z'],
  ]) {
    const annotation = source.indexOf('researchPopups.set(marker.getPopup(), { ' + needle);
    assert.ok(annotation > 0, 'marker producer is present');
    const from = source.lastIndexOf('const marker = ', annotation);
    const to = source.indexOf('\n', annotation);
    const popup = {}, researchPopups = new WeakMap();
    const layer = { addTo() { return this; }, bindPopup() { return this; }, getPopup() { return popup; } };
    const item = { country: 'Israel', region: 'Southern', type: 'Battle', date: '2026-10-23', title: 'Public news', pubDate: '2026-10-25T02:00:00Z', acqDate: '2026-10-25', acqTime: '0100', confidence: 'high', coords: [1, 2] };
    vm.runInNewContext(source.slice(from, to), {
      researchPopups, item, L: { marker: () => layer, circleMarker: () => layer },
      groups: {}, tone: { color: 'red' }, icon: {}, radius: 5, opacity: 0.2,
      escapeHtml: String, ago: String, fmtCoords: () => 'coordinates', fmtAcqDate: String, fmtTimeCompact: () => '01:00',
    });
    const context = researchPopups.get(popup);
    assert.ok(context, 'producer must register its real popup');
    assert.equal(researchRecord('mem', context).context[field], expected);
  }
});
