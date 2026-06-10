const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`CONSOLE: ${msg.text()}`));
  page.on('pageerror', err => console.log(`PAGEERROR: ${err.message}\n${err.stack}`));

  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(5000);

  const html = await page.evaluate(() => document.body.innerHTML);
  console.log("HTML length:", html.length);
  console.log("HTML snippet:", html.slice(0, 1000));
  
  await browser.close();
})();
