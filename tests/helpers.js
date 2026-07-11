// Shared helpers for driving the calculator via its share-link query params.

// Third-party analytics and the hosting artifact script; blocked so tests are
// hermetic and fast. Google Fonts is allowed only in visual tests.
const BLOCKED = /googletagmanager\.com|google-analytics\.com|catrepairwoman\.com|back_to_spaceship/;

async function blockExternal(page, { allowFonts = false } = {}) {
  await page.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith('http://127.0.0.1:4173')) return route.continue();
    if (allowFonts && /fonts\.(googleapis|gstatic)\.com/.test(url)) return route.continue();
    return route.abort();
  });
}

// Loads the app with the given state applied through the same fromQuery()
// mechanism the share-link feature uses, then waits for calcAll() to finish.
async function loadState(page, state) {
  // The summary shows today's date; freeze the clock so outputs are stable.
  await page.clock.setFixedTime(new Date('2026-01-15T10:00:00'));
  const params = new URLSearchParams(state).toString();
  await page.goto(`/?${params}`);
  await page.waitForFunction(() => window._loadedFromQueryString === true);
}

// Every element whose content is derived from the calculation. `value` fields
// are <input>/<select>, the rest are read as text.
const VALUE_IDS = ['merKcal', 'mealPlanKcal', 'dryOut', 'wetUnitsOut', 'dryUnitsOut', 'dryAmountCalc', 'wetAmountSel'];
const TEXT_IDS = [
  'factorBanner', 'merPillbar', 'kpiRer', 'merDelta', 'kpiDiff',
  'feedHeading', 'feedLine', 'feedPlanHeading', 'feedPlanList',
  'calorieCallout', 'lossNote', 'step5Warn', 'weightHint',
];

async function captureOutputs(page) {
  return page.evaluate(({ VALUE_IDS, TEXT_IDS }) => {
    const norm = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    const visible = el => {
      for (let e = el; e; e = e.parentElement) {
        if (getComputedStyle(e).display === 'none') return false;
      }
      return true;
    };
    const out = {};
    for (const id of VALUE_IDS) {
      const el = document.getElementById(id);
      out[id] = el ? { value: norm(el.value), visible: visible(el) } : null;
    }
    for (const id of TEXT_IDS) {
      const el = document.getElementById(id);
      out[id] = el ? { text: norm(el.textContent), visible: visible(el) } : null;
    }
    return out;
  }, { VALUE_IDS, TEXT_IDS });
}

module.exports = { blockExternal, loadState, captureOutputs };
