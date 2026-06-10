import { chromium } from 'playwright';
import fs from 'fs';

async function run() {
  console.log('[Playwright] Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // Monitor network requests and responses
  page.on('request', request => {
    const url = request.url();
    if (url.includes('academy') || url.includes('detailrank') || url.includes('moonton') || url.includes('gms')) {
      console.log(`[Request] ${request.method()} ${url}`);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('academy') || url.includes('detailrank') || url.includes('moonton') || url.includes('gms')) {
      console.log(`[Response] ${response.status()} ${url}`);
      if (response.status() === 200 && (url.includes('json') || response.headers()['content-type']?.includes('json'))) {
        try {
          const json = await response.json();
          console.log(`[JSON Data Match] From ${url}:`);
          console.log(JSON.stringify(json, null, 2).substring(0, 1000));
        } catch (e) {
          // ignore
        }
      }
    }
  });

  const url = 'https://www.mobilelegends.com/academy/guide/detailrank?heroid=1';
  console.log(`[Playwright] Navigating to ${url}...`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('[Playwright] Page loaded successfully!');

    // Wait for the table or list to be visible on the page
    console.log('[Playwright] Waiting for ranking lists to load...');
    await page.waitForTimeout(5000); // Wait 5 seconds for React to mount and fetch data

    // Capture a screenshot of the page so we can verify if needed
    await page.screenshot({ path: 'scratch/playwright_screenshot.png' });
    console.log('[Playwright] Saved screenshot to scratch/playwright_screenshot.png');

    // Scrape the DOM
    console.log('[Playwright] Extracting rendered DOM rankings...');
    
    // We will extract whatever elements are visible in the root div
    const htmlContent = await page.content();
    fs.writeFileSync('scratch/playwright_rendered.html', htmlContent, 'utf-8');
    console.log('[Playwright] Saved fully-rendered HTML to scratch/playwright_rendered.html');

    // Let's run a selector evaluation to print all tables or list items
    const textElements = await page.evaluate(() => {
      const items = [];
      // Let's traverse the body and find anything that resembles a ranking row
      // Looking at the screenshots, there are rankings (1, 2, 3...), names, and scores (e.g. 2.33%)
      // Let's collect all texts that look like scores or hero names.
      document.querySelectorAll('*').forEach(el => {
        // If it's a leaf node or has direct text
        if (el.children.length === 0 && el.textContent?.trim()) {
          items.push({
            tagName: el.tagName,
            class: el.className,
            text: el.textContent.trim()
          });
        }
      });
      return items;
    });

    console.log(`[Playwright] Found ${textElements.length} text elements in DOM.`);
    const filteredText = textElements.filter(x => x.text.includes('%') || (x.text.length > 2 && x.text.length < 20));
    console.log('[Playwright] Sample filtered text nodes:', filteredText.slice(0, 50));

  } catch (err) {
    console.error('[Playwright] Navigation or execution error:', err);
  } finally {
    await browser.close();
    console.log('[Playwright] Browser closed.');
  }
}

run();
