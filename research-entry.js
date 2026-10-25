import { openResearchTools } from './research-tools.js?v=sic-2026-10-25-r2';

let context = null;
window.addEventListener('mem:research-context', event => { context = event.detail; });
document.getElementById('researchToolsOpen').addEventListener('click', event => {
  document.querySelector('.layer-dock').open = false;
  openResearchTools({ system: 'mem', context, returnFocus: document.querySelector('.layer-h') });
});
