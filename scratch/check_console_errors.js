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
  await page.goto('http://localhost:3000/?hero=95');
  await page.waitForTimeout(2000);

  // Search for Yu Zhong and open modal if not already open
  const modalOpened = await page.evaluate(() => {
    return !!document.querySelector('.modal-content');
  });

  if (!modalOpened) {
    console.log("Modal not open, going to Heroes tab...");
    await page.click('text=Heroes');
    await page.waitForTimeout(1000);
    await page.fill('input[placeholder*="Search"]', 'Yu Zhong');
    await page.waitForTimeout(1000);
    await page.click('text=Yu Zhong');
    await page.waitForTimeout(2000);
  } else {
    console.log("Modal is open.");
  }

  // Click Builds tab
  console.log("Clicking Builds tab...");
  await page.click('text=Builds');
  await page.waitForTimeout(1000);

  // Reload page to open modal again and check Matchups tab
  console.log("Reloading and clicking Matchups tab...");
  await page.goto('http://localhost:3000/?hero=95');
  await page.waitForTimeout(2000);
  await page.click('text=Matchups');
  await page.waitForTimeout(1000);

  // Reload page and check Guide tab
  console.log("Reloading and clicking Guide tab...");
  await page.goto('http://localhost:3000/?hero=95');
  await page.waitForTimeout(2000);
  await page.click('text=Guide');
  await page.waitForTimeout(1000);

  await browser.close();
})();
