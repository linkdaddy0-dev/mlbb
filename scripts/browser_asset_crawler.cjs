/**
 * @module browser_asset_crawler
 * Stealth-hardened, production-grade Playwright browser asset crawler.
 *
 * Implements persistent contexts, stealth fingerprint masking, tab concurrency pooling,
 * lazy-load scrolling, network response interception, custom failure diagnostic dumps,
 * and high-resolution Wikia asset extraction.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
// Custom concurrency limiter replaces module dependency
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

// Inject stealth plugin
chromium.use(stealth);

// Target Directories
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_OUT_DIR = path.join(ROOT_DIR, 'public', 'assets');
const PROFILE_DIR = path.join(__dirname, 'crawler_profile');
const FAILURES_DIR = path.join(ROOT_DIR, 'reports', 'failures');
const CACHE_FILE = path.join(__dirname, 'generated', 'resolved_asset_sources.json');

const SUB_DIRS = {
  heroes: path.join(ASSETS_OUT_DIR, 'heroes'),
  items: path.join(ASSETS_OUT_DIR, 'items'),
  emblems: path.join(ASSETS_OUT_DIR, 'emblems'),
  spells: path.join(ASSETS_OUT_DIR, 'spells'),
  talents: path.join(ASSETS_OUT_DIR, 'talents'),
  skills: path.join(ASSETS_OUT_DIR, 'skills'),
  misc: path.join(ASSETS_OUT_DIR, 'misc')
};

// Ensure directories exist
Object.values(SUB_DIRS).forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
if (!fs.existsSync(FAILURES_DIR)) fs.mkdirSync(FAILURES_DIR, { recursive: true });

// Setup Asset Crawl Target Database
const BATTLE_SPELLS = [
  'Inspire', 'Flicker', 'Retribution', 'Purify', 'Petrify', 
  'Execute', 'Aegis', 'Revitalize', 'Flameshot', 'Vengeance', 
  'Sprint', 'Arrival'
];

const EMBLEMS = [
  'Custom Marksman Emblem', 'Custom Assassin Emblem', 'Custom Mage Emblem',
  'Custom Tank Emblem', 'Custom Fighter Emblem', 'Custom Support Emblem'
];

const TALENTS = [
  'Fatal', 'Bargain Hunter', 'Weakness Finder', 'Swift', 'Master Assassin',
  'Killing Spree', 'Rupture', 'Weapon Master', 'Lethal Ignition', 'Thrill',
  'Festival of Blood', 'Brave Smite', 'Impure Rage', 'Tenacity', 'Focus Mark',
  'Concussive Blast', 'Wilderness Blessing', 'Pull Yourself Together', 
  'Temporal Reign', 'Quantum Charge', 'War Cry', 'Chrono Turquoise', 
  'Shielding Skill', 'Focusing Mark'
];

// Helper to determine logical asset category from nickname/name
function getCategory(name) {
  const lower = name.toLowerCase();
  if (BATTLE_SPELLS.some(s => s.toLowerCase() === lower)) return 'spells';
  if (EMBLEMS.some(e => e.toLowerCase() === lower)) return 'emblems';
  if (TALENTS.some(t => t.toLowerCase() === lower)) return 'talents';
  return 'misc';
}

// Deterministic local file naming
function getLocalFileName(name) {
  const safeName = name.replace(/[^a-zA-Z0-9_\-]/g, '_');
  return `${safeName}.webp`;
}

// Custom Concurrency Limiting Executor
async function limitConcurrency(tasks, limit) {
  const results = [];
  const executing = new Set();
  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

// Concurrency pool manager for Playwright contexts to optimize RAM lifecycle
class CrawlerResourceManager {
  constructor() {
    this.context = null;
    this.requestCount = 0;
  }

  async getContext() {
    if (this.context) {
      this.requestCount++;
      if (this.requestCount >= 50) {
        console.log('[ResourceManager] Context reached request cap. Recycling browser context...');
        await this.recycle();
      } else {
        return this.context;
      }
    }

    const launchOptions = {
      headless: true,
      viewport: { width: 1366, height: 768 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'Asia/Kolkata',
      ignoreHTTPSErrors: true
    };

    // Proxy support inside environment vars to bypass India blocks
    if (process.env.PROXY_SERVER) {
      launchOptions.proxy = { server: process.env.PROXY_SERVER };
      console.log(`[ResourceManager] Routing traffic through remote proxy: ${process.env.PROXY_SERVER}`);
    }

    console.log('[ResourceManager] Launching persistent Chromium context...');
    this.context = await chromium.launchPersistentContext(PROFILE_DIR, launchOptions);
    this.requestCount = 0;
    return this.context;
  }

  async recycle() {
    if (this.context) {
      try {
        await this.context.close();
      } catch (e) {
        console.warn('[ResourceManager] Error closing context during recycle:', e.message);
      }
      this.context = null;
    }
    return this.getContext();
  }

  async closeAll() {
    if (this.context) {
      console.log('[ResourceManager] Closing persistent browser context.');
      await this.context.close();
      this.context = null;
    }
  }
}

const resourceManager = new CrawlerResourceManager();

// Save Failure Diagnostics Bundle
async function dumpFailureDiagnostics(name, page, errorMsg, consoleLogs, networkLogs) {
  const sanitizeName = name.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const targetDir = path.join(FAILURES_DIR, sanitizeName);
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  try {
    // 1. Take Screenshot
    await page.screenshot({ path: path.join(targetDir, 'screenshot.png'), fullPage: true });
    
    // 2. Dump DOM
    const htmlContent = await page.content();
    fs.writeFileSync(path.join(targetDir, 'page.html'), htmlContent, 'utf-8');
    
    // 3. Write page console log
    fs.writeFileSync(path.join(targetDir, 'console.log'), consoleLogs.join('\n'), 'utf-8');
    
    // 4. Dump traced HTTP network codes
    fs.writeFileSync(
      path.join(targetDir, 'network.json'), 
      JSON.stringify({ error: errorMsg, logs: networkLogs }, null, 2), 
      'utf-8'
    );
    
    console.error(`  - 📂 Diagnostic trace written successfully to: ${targetDir}`);
  } catch (e) {
    console.error(`  - Failed to write diagnostic trace: ${e.message}`);
  }
}

// Download validation and sharp optimization
async function downloadAndOptimize(imageUrl, localDestPath) {
  const response = await fetch(imageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'Referer': 'https://mobile-legends.fandom.com/'
    }
  });

  if (!response.ok) {
    throw new Error(`Binary download failed with HTTP status: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length < 100) {
    throw new Error(`Buffer size suspicious: ${buffer.length} bytes`);
  }

  // Enforce validation via Sharp metadata check (reject HTML Cloudflare trigger sheets)
  const metadata = await sharp(buffer).metadata();
  if (!metadata.format) {
    throw new Error('MIME validation failed. File is not a valid image format.');
  }

  // Compress to WebP and save locally
  await sharp(buffer)
    .webp({ quality: 85 })
    .toFile(localDestPath);
    
  return buffer.length;
}

// Dynamic Wikia Search resolver
async function searchWikiPage(page, name) {
  const searchQuery = encodeURIComponent(name);
  const searchUrl = `https://mobile-legends.fandom.com/wiki/Special:Search?query=${searchQuery}`;
  
  console.log(`  - Querying Wiki Search: ${searchUrl}`);
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Locate result anchors (selectors for Fandom unified search results)
  const results = await page.$$eval('.unified-search__result__title, a.result-link, .unified-search__result a', anchors => {
    return anchors.map(a => ({
      title: a.innerText || '',
      href: a.getAttribute('href') || ''
    })).filter(x => x.href && !x.href.includes('/Special:'));
  });

  if (results.length === 0) {
    throw new Error(`No search results returned on Fandom for query: ${name}`);
  }

  // Pick the best match (favor exact name match in title, fallback to first)
  const queryLower = name.toLowerCase();
  const bestMatch = results.find(r => r.title.toLowerCase().includes(queryLower)) || results[0];
  
  console.log(`  - Dynamic router matched page: "${bestMatch.title}" ➔ ${bestMatch.href}`);
  return bestMatch.href;
}

// DOM image parser with priority filtering
async function parseHighQualityImage(page, category, name) {
  // Check image tags on page
  const images = await page.$$eval('img', imgs => {
    return imgs.map(i => ({
      src: i.getAttribute('src') || '',
      dataSrc: i.getAttribute('data-src') || '',
      srcset: i.getAttribute('srcset') || '',
      alt: i.getAttribute('alt') || '',
      class: i.getAttribute('class') || '',
      width: i.naturalWidth || i.width || 0,
      height: i.naturalHeight || i.height || 0
    }));
  });

  const queryLower = name.toLowerCase().replace(/_/g, ' ');
  const categoryLower = category.toLowerCase();

  const candidates = [];
  for (const img of images) {
    const rawUrl = img.dataSrc || img.src;
    if (!rawUrl || !rawUrl.startsWith('http')) continue;

    const urlLower = rawUrl.toLowerCase();
    
    // Ignore small thumbnails, avatars of users, or generic site assets
    if (urlLower.includes('avatar') && !urlLower.includes('custom_')) continue;
    if (urlLower.includes('wiki-header') || urlLower.includes('site-logo') || urlLower.includes('sprite')) continue;
    
    // High Priority matches: Check if filename contains query or category keywords
    let score = 0;
    const filename = path.basename(rawUrl.split('?')[0]).toLowerCase();

    if (filename.includes(queryLower.replace(/\s+/g, '_'))) score += 100;
    if (filename.includes(queryLower.replace(/\s+/g, ''))) score += 50;
    if (urlLower.includes(categoryLower)) score += 30;

    // Check sizes inside DOM
    if (img.width > 40 && img.height > 40) score += 20;
    
    // De-prioritize thumb/scaled strings
    if (urlLower.includes('thumb/')) score -= 30;
    if (urlLower.includes('scale-to-width-down')) score -= 40;

    candidates.push({ url: rawUrl, score });
  }

  // Sort by extraction relevance score
  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length === 0 || candidates[0].score < -10) {
    throw new Error(`Could not find a valid high-quality image candidate for ${name}`);
  }

  // Wikia trick: Strip the '/revision/latest/scale-to-width-down/...' suffix to fetch raw source
  let resolvedUrl = candidates[0].url;
  if (resolvedUrl.includes('/revision/')) {
    resolvedUrl = resolvedUrl.split('/revision/')[0];
  }

  console.log(`  - Extraction verified best candidate: ${resolvedUrl} (Score: ${candidates[0].score})`);
  return resolvedUrl;
}

// Core crawler task runner
async function crawlAssetTask(name, category, cacheRegistry) {
  const localFileName = getLocalFileName(name);
  const localDestPath = path.join(SUB_DIRS[category], localFileName);
  const relativeLocalPath = `/assets/${category}/${localFileName}`;

  // Step 1. Incremental cache validation
  if (cacheRegistry[name] && fs.existsSync(localDestPath)) {
    console.log(`[Incremental Cache] ${name} already mirrored locally. Skipping.`);
    return;
  }

  console.log(`\n============================================================`);
  console.log(`[CRAWL] Resolving asset: "${name}" (${category})`);
  console.log(`============================================================`);

  const context = await resourceManager.getContext();
  const page = await context.newPage();

  const consoleLogs = [];
  const networkLogs = [];

  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('requestfailed', req => networkLogs.push(`FAIL: ${req.url()} (${req.failure() ? req.failure().errorText : 'unknown'})`));
  page.on('response', res => {
    if (res.status() >= 400) {
      networkLogs.push(`HTTP ${res.status()}: ${res.url()}`);
    }
  });

  // Intercept and block heavy ads, stylesheets, fonts, and trackers to boost crawling speed and prevent timeouts
  await page.route('**/*', (route) => {
    const url = route.request().url().toLowerCase();
    const type = route.request().resourceType();
    if (
      type === 'font' ||
      url.includes('google-analytics') ||
      url.includes('doubleclick') ||
      url.includes('adsystem') ||
      url.includes('adnxs') ||
      url.includes('amazon-adsystem') ||
      url.includes('quantserve') ||
      url.includes('scorecardresearch') ||
      url.includes('fandom-coop') ||
      url.includes('adengine')
    ) {
      route.abort();
    } else {
      route.continue();
    }
  });

  try {
    // 1. Dynamic search resolution
    const canonicalPageUrl = await searchWikiPage(page, name);

    // 2. Load matched page and wait for layout
    console.log(`  - Visiting matched URL...`);
    await page.goto(canonicalPageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 3. Lazy-Load view scroll trigger
    console.log(`  - Triggering lazy-loaded image scrolls...`);
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 150;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= document.body.scrollHeight || totalHeight > 2500) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    // Short buffer to let lazy images settle
    await page.waitForTimeout(1000);

    // 4. DOM high-resolution extraction
    const finalCDNUrl = await parseHighQualityImage(page, category, name);

    // 5. Download binary with Sharp validation & WebP compression
    console.log(`  - Saving & validating binary image...`);
    const size = await downloadAndOptimize(finalCDNUrl, localDestPath);

    console.log(`  - Success ✓ Cached locally: ${relativeLocalPath} (${size} bytes)`);

    // 6. Update cache registry permanently
    cacheRegistry[name] = {
      source: 'playwright_fandom',
      resolvedUrl: finalCDNUrl,
      localPath: relativeLocalPath,
      lastCrawled: new Date().toISOString()
    };

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheRegistry, null, 2), 'utf-8');

  } catch (err) {
    const errorMsg = err.message || String(err);
    console.error(`  - ❌ Error crawling ${name}: ${errorMsg}`);
    
    // Dump full diagnostic bundle for debugging Cloudflare blocks / broken selector targets
    await dumpFailureDiagnostics(name, page, errorMsg, consoleLogs, networkLogs);
  } finally {
    await page.close();
  }
}

// Ingestion entry function
async function run() {
  console.log("============================================================");
  console.log("    PRODUCTION PLAYWRIGHT ASSET INGESTION CRAWLER ENGINE    ");
  console.log("============================================================");

  let cacheRegistry = {};
  if (fs.existsSync(CACHE_FILE)) {
    try {
      cacheRegistry = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    } catch (e) {
      cacheRegistry = {};
    }
  }

  // Build crawler targets queue
  const targets = [];
  BATTLE_SPELLS.forEach(s => targets.push({ name: s, category: 'spells' }));
  EMBLEMS.forEach(e => targets.push({ name: e, category: 'emblems' }));
  TALENTS.forEach(t => targets.push({ name: t, category: 'talents' }));

  console.log(`Initialized crawling queue with ${targets.length} targets.`);

  // Incremental execution - throttle concurrency to strictly max 3 pages using our custom scheduler
  const tasks = targets.map(t => () => crawlAssetTask(t.name, t.category, cacheRegistry));
  await limitConcurrency(tasks, 3);

  // Clean up browser contexts
  await resourceManager.closeAll();

  console.log("\n============================================================");
  console.log("   BROWSER INGESTION PIPELINE CRAWL TASK RUN COMPLETED      ");
  console.log("============================================================\n");
}

run().catch(async (err) => {
  console.error("Ingestion pipeline crashed:", err);
  await resourceManager.closeAll();
  process.exit(1);
});
