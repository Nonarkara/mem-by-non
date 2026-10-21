import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Source/parse contract only. The suite's rendered gate and independent
// browser trial still own actual tiles, layout, controls and readability.
const code = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
new vm.Script(code);
const urls = [...code.matchAll(/L\.tileLayer\('([^']+)'/g)].map(m=>m[1]);
const tileProblems = values => values.filter(url => !url.startsWith('https://') || url.includes('cartocdn.com'));
assert.ok(urls.length >= 2);
assert.deepEqual(tileProblems(urls), []);
assert.ok(tileProblems([...urls,'https://a.basemaps.cartocdn.com/dark_all/3/1/1.png']).length, 'key-required provider mutant must fail');
console.log('PASS: JavaScript parses; configured legacy tiles avoid the rejected provider; mutant caught.');

