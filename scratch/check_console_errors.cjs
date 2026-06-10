const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`BROWSER ERROR: ${err.message}`);
    console.log(err.stack);
  });

  console.log("Navigating to app...");
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(2000);

  console.log("Setting onboarding complete in localStorage...");
  await page.evaluate(() => {
    localStorage.setItem('mldraft_onboarding_complete', 'true');
  });

  console.log("Reloading app...");
  await page.goto('http://localhost:3000/');

  console.log("Waiting for bottom navigation bar to load...");
  await page.waitForSelector('.bottom-nav-bar', { timeout: 60000 });
  console.log("Bottom navigation bar loaded.");

  // Click the Heroes tab (the 2nd button in the bottom navigation bar)
  console.log("Clicking Heroes tab...");
  await page.click('.bottom-nav-bar button:nth-child(2)');
  
  console.log("Waiting for roster items to load...");
  await page.waitForSelector('.roster-item-container', { timeout: 10000 });
  console.log("Roster items loaded.");

  // Click Yu Zhong
  console.log("Clicking Yu Zhong card...");
  await page.click('.roster-item-container:has-text("Yu Zhong")');
  
  console.log("Waiting for modal content to load...");
  await page.waitForSelector('.modal-content', { timeout: 10000 });
  console.log("Modal opened successfully.");

  // Click Overview tab just to verify
  console.log("Checking Overview tab...");
  await page.click('.esports-tab-btn:has-text("Overview")');
  await page.waitForTimeout(2000);

  // Click Builds tab
  console.log("Checking Builds tab...");
  await page.click('.esports-tab-btn:has-text("Builds")');
  await page.waitForTimeout(2000);

  // Click Matchups tab
  console.log("Checking Matchups tab...");
  await page.click('.esports-tab-btn:has-text("Matchups")');
  await page.waitForTimeout(2000);

  // Click Guide tab
  console.log("Checking Guide tab...");
  await page.click('.esports-tab-btn:has-text("Guide")');
  await page.waitForTimeout(2000);

  // Click Stats tab
  console.log("Checking Stats tab...");
  await page.click('.esports-tab-btn:has-text("Stats")');
  await page.waitForTimeout(2000);

  // Click Lore tab
  console.log("Checking Lore tab...");
  await page.click('.esports-tab-btn:has-text("Lore")');
  await page.waitForTimeout(2000);

  await browser.close();
  console.log("Test finished.");
})();
