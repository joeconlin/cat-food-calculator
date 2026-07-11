// Screenshot regression for the two experiences that must never degrade:
// the mobile exam-room flow and the printable output.
//
// Baselines live in tests/__screenshots__/. After an INTENTIONAL visual
// change, regenerate with: npx playwright test visual --update-snapshots
// and eyeball the new images before committing.

const { test, expect } = require('@playwright/test');
const { blockExternal, loadState } = require('./helpers');

const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1280, height: 900 },
};

const STATES = {
  'initial': null,
  'calorie-only': {
    name: 'Chonkster', weightInput: '14', weightUnit: 'lb',
    lifeStage: 'neutered_adult', activity: 'inactive', bcs: '8',
    summaryMode: 'calorie-only',
  },
  'full-plan': {
    name: 'Chonkster', weightInput: '14', weightUnit: 'lb',
    lifeStage: 'neutered_adult', activity: 'inactive', bcs: '8',
    foodType: 'both', wetKcal: '78', wetUnit: 'can', dryKcal: '380', dryBasis: 'cup',
  },
};

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}

for (const [stateName, state] of Object.entries(STATES)) {
  for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
    test(`screen: ${stateName} @ ${vpName}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await blockExternal(page, { allowFonts: true });
      if (state) {
        await loadState(page, state);
      } else {
        await page.clock.setFixedTime(new Date('2026-01-15T10:00:00'));
        await page.goto('/');
      }
      await settle(page);
      await expect(page).toHaveScreenshot(`${stateName}-${vpName}.png`, { fullPage: true });
    });
  }
}

for (const stateName of ['calorie-only', 'full-plan']) {
  test(`print: ${stateName}`, async ({ page }) => {
    await page.setViewportSize({ width: 816, height: 1056 }); // US Letter at 96dpi
    await blockExternal(page, { allowFonts: true });
    await loadState(page, STATES[stateName]);
    await page.emulateMedia({ media: 'print' });
    await settle(page);
    await expect(page).toHaveScreenshot(`print-${stateName}.png`, { fullPage: true });
  });
}
