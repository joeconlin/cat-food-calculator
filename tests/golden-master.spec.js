// Golden-master regression tests for the vet-validated calculation logic.
//
// Each case loads the app with inputs via the share-link query string and
// captures every calculation-derived output. Results are compared against
// tests/golden/calc-golden.json — the frozen, vet-validated behavior.
//
// To (re)generate the golden file after an INTENTIONAL logic change:
//   UPDATE_GOLDEN=1 npx playwright test golden-master
// Never regenerate to make a failing refactor pass.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { blockExternal, loadState, captureOutputs } = require('./helpers');

const GOLDEN_PATH = path.join(__dirname, 'golden', 'calc-golden.json');
const UPDATE = !!process.env.UPDATE_GOLDEN || !fs.existsSync(GOLDEN_PATH);

const LIFE_STAGES = ['neutered_adult', 'intact_adult', 'kitten', 'pregnant'];
const ACTIVITIES = ['inactive', 'active'];
const ALL_BCS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

function caseId(state) {
  return Object.entries(state).map(([k, v]) => `${k}=${v}`).join('&');
}

// --- Case matrix -----------------------------------------------------------

// Calorie-only (steps 1-3): full factor table at a fixed weight.
const factorCases = [];
for (const lifeStage of LIFE_STAGES) {
  for (const activity of ACTIVITIES) {
    for (const bcs of ALL_BCS) {
      factorCases.push({ name: 'GoldenCat', weightInput: '12', weightUnit: 'lb', lifeStage, activity, bcs });
    }
  }
}

// Weight sweep, both units, including edge weights.
const weightCases = [];
for (const w of ['2', '4', '6', '8', '10', '14', '18', '25']) {
  weightCases.push({ name: 'GoldenCat', weightInput: w, weightUnit: 'lb', lifeStage: 'neutered_adult', activity: 'inactive', bcs: '7' });
}
for (const w of ['1.5', '2.5', '4', '5.5', '7', '9']) {
  weightCases.push({ name: 'GoldenCat', weightInput: w, weightUnit: 'kg', lifeStage: 'neutered_adult', activity: 'inactive', bcs: '7' });
}
// Possessive handling for names ending in s.
weightCases.push({ name: 'Socks', weightInput: '11', weightUnit: 'lb', lifeStage: 'neutered_adult', activity: 'inactive', bcs: '6' });

// Meal-plan cases (steps 4-5).
const base = { name: 'GoldenCat', weightInput: '11', weightUnit: 'lb', lifeStage: 'neutered_adult', activity: 'inactive', bcs: '7' };
const mealCases = [];
for (const wetKcal of ['70', '95', '180']) {
  for (const wetUnit of ['can', 'pouch']) {
    mealCases.push({ ...base, foodType: 'wet', wetKcal, wetUnit });
  }
}
mealCases.push({ ...base, foodType: 'wet', wetKcal: '78', wetUnit: 'can', wetAmountSel: '1.5' });
for (const dryKcal of ['320', '350', '410']) {
  mealCases.push({ ...base, foodType: 'dry', dryKcal, dryBasis: 'cup' });
}
mealCases.push({ ...base, foodType: 'dry', dryKcal: '3500', dryBasis: 'kg' });
for (const wetKcal of ['70', '90']) {
  for (const dryKcal of ['350', '400']) {
    mealCases.push({ ...base, foodType: 'both', wetKcal, wetUnit: 'can', dryKcal, dryBasis: 'cup' });
  }
}
for (const wetAmountSel of ['0', '0.5', '1', '2']) {
  mealCases.push({ ...base, foodType: 'both', wetKcal: '78', wetUnit: 'can', dryKcal: '380', dryBasis: 'cup', wetAmountSel });
}
// Maintenance (ideal BCS) and other life stages through the full plan.
mealCases.push({ ...base, bcs: '5', foodType: 'both', wetKcal: '78', wetUnit: 'can', dryKcal: '380', dryBasis: 'cup' });
mealCases.push({ ...base, bcs: '3', foodType: 'both', wetKcal: '78', wetUnit: 'can', dryKcal: '380', dryBasis: 'cup' });
mealCases.push({ ...base, lifeStage: 'kitten', bcs: '5', weightInput: '4', foodType: 'both', wetKcal: '78', wetUnit: 'can', dryKcal: '380', dryBasis: 'cup' });
mealCases.push({ ...base, lifeStage: 'pregnant', bcs: '5', activity: 'active', foodType: 'wet', wetKcal: '95', wetUnit: 'can' });
// Calorie-only summary mode.
mealCases.push({ ...base, summaryMode: 'calorie-only' });

const SUITES = {
  'factor table': factorCases,
  'weight sweep': weightCases,
  'meal plans': mealCases,
};

// --- Runner ----------------------------------------------------------------

const collected = {};

for (const [suiteName, cases] of Object.entries(SUITES)) {
  test(`golden master: ${suiteName} (${cases.length} cases)`, async ({ page }) => {
    test.setTimeout(300_000);
    await blockExternal(page);
    const golden = UPDATE ? null : JSON.parse(fs.readFileSync(GOLDEN_PATH, 'utf8'));
    for (const state of cases) {
      const id = caseId(state);
      await loadState(page, state);
      const outputs = await captureOutputs(page);
      if (UPDATE) {
        collected[id] = outputs;
      } else {
        expect.soft(outputs, `case: ${id}`).toEqual(golden[id]);
      }
    }
  });
}

test.afterAll(() => {
  if (!UPDATE) return;
  fs.mkdirSync(path.dirname(GOLDEN_PATH), { recursive: true });
  const existing = fs.existsSync(GOLDEN_PATH) ? JSON.parse(fs.readFileSync(GOLDEN_PATH, 'utf8')) : {};
  fs.writeFileSync(GOLDEN_PATH, JSON.stringify({ ...existing, ...collected }, null, 1));
  console.log(`Golden file updated: ${Object.keys(collected).length} cases written to ${GOLDEN_PATH}`);
});
