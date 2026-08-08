const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3000');

  // Wait a bit for everything to load and render
  await page.waitForTimeout(2000);

  // Take a screenshot of the main HUD
  await page.screenshot({ path: 'screenshot_hud.png' });

  // Press tab to open inventory
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);

  // Take a screenshot of the inventory
  await page.screenshot({ path: 'screenshot_inv.png' });

  await browser.close();
})();
