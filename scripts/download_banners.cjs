/**
 * @module download_banners
 * Stealth-hardened, production-grade Playwright script to scrape, download,
 * and highly compress full-body hero splash art banners as optimized local WebP assets.
 * 
 * Implements Strategy 2: Ultra-Compressed Offline Banners.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const sharp = require('sharp');

// Inject stealth plugin
chromium.use(stealth);

const ROOT_DIR = path.resolve(__dirname, '..');
const BANNERS_DIR = path.join(ROOT_DIR, 'public', 'assets', 'banners');
const PATCH_VERSION = "1.8.84";
const PATCHES_ROOT = path.join(ROOT_DIR, 'public', 'data', 'patches', PATCH_VERSION);
const LANGUAGES = ['en', 'id', 'es', 'pt', 'ru', 'tr', 'tl'];
const PROFILE_DIR = path.join(__dirname, 'crawler_profile');

// Ensure banners output directory exists
if (!fs.existsSync(BANNERS_DIR)) {
  fs.mkdirSync(BANNERS_DIR, { recursive: true });
}

// Helper to sanitize name for wiki URL
function getWikiName(name) {
  // Common name mapping anomalies on Fandom Wiki
  const specialCases = {
    "Yi Sun-shin": "Yi_Sun-Shin",
    "Alucard": "Alucard",
    "Gusion": "Gusion",
    "Aamon": "Aamon",
    "Kaja": "Kaja",
  };
  
  if (specialCases[name]) return specialCases[name];
  return name.trim().replace(/ /g, '_');
}

// Download image and compress to extremely light WebP
async function downloadAndCompress(imageUrl, destPath) {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://mobile-legends.fandom.com/'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching image`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Highly compress using sharp: Width 480px, WebP quality 60 (results in ~20-30KB files!)
    await sharp(buffer)
      .resize({ width: 480, withoutEnlargement: true })
      .webp({ quality: 60, effort: 6 })
      .toFile(destPath);

    const stats = fs.statSync(destPath);
    console.log(`  - [COMPRESSED] Saved to ${path.basename(destPath)} (${(stats.size / 1024).toFixed(1)} KB)`);
    return true;
  } catch (err) {
    console.error(`  - [ERROR] Failed to download/compress: ${err.message}`);
    return false;
  }
}

async function scrapeBanners() {
  console.log("===================================================================");
  console.log("       MLDRAFT STRATEGY 2: ULTRA-COMPRESSED OFFLINE BANNERS        ");
  console.log("===================================================================");

  // Read master roster index to get list of heroes
  const enIndexFile = path.join(PATCHES_ROOT, 'en', 'heroes', 'index.json');
  if (!fs.existsSync(enIndexFile)) {
    console.error(`[ERROR] English roster index not found at: ${enIndexFile}`);
    process.exit(1);
  }

  const roster = JSON.parse(fs.readFileSync(enIndexFile, 'utf-8'));
  console.log(`Loaded roster index containing ${roster.length} heroes.`);

  console.log("\nLaunching stealth browser to crawl unblocked Fandom CDN splash arts...");
  
  const launchOptions = {
    headless: true,
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-US'
  };

  const context = await chromium.launchPersistentContext(PROFILE_DIR, launchOptions);
  const page = await context.newPage();

  // Block useless ad networks and trackers to speed up loading by 90%
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (
      url.includes('google-analytics') || 
      url.includes('doubleclick') || 
      url.includes('quantserve') || 
      url.includes('scorecardresearch') || 
      url.includes('adsystem') || 
      url.includes('adskeeper') || 
      url.includes('fandom-ae') ||
      url.includes('facebook')
    ) {
      route.abort();
    } else {
      route.continue();
    }
  });

  let downloadedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < roster.length; i++) {
    const hero = roster[i];
    const heroId = hero.id;
    const heroName = hero.name;
    const destFile = path.join(BANNERS_DIR, `hero_${heroId}.webp`);

    console.log(`\n[${i + 1}/${roster.length}] Processing hero banner: ${heroName} (ID: ${heroId})`);

    // 1. Skip if already downloaded to respect bandwidth and rate-limits
    if (fs.existsSync(destFile) && fs.statSync(destFile).size > 1000) {
      console.log(`  - Banner already exists. Skipping.`);
      skippedCount++;
      continue;
    }

    // 2. Load the Wiki page using Playwright
    const wikiName = getWikiName(heroName);
    const wikiUrl = `https://mobile-legends.fandom.com/wiki/${encodeURIComponent(wikiName)}`;
    console.log(`  - Fetching Wiki page: ${wikiUrl}`);

    try {
      await page.goto(wikiUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      
      // Extract the main full-body portrait/splash art inside the infobox
      // The selector 'aside.portable-infobox img.pi-image-thumbnail' perfectly targets the infobox character art
      const imageSrc = await page.evaluate(() => {
        const img = document.querySelector('aside.portable-infobox img.pi-image-thumbnail') || 
                    document.querySelector('.portable-infobox figure.pi-image img') ||
                    document.querySelector('a.image img[data-image-name$=".png"]') ||
                    document.querySelector('a.image img[data-image-name*="Default"]');
        return img ? img.src : null;
      });

      if (!imageSrc) {
        console.warn(`  - [WARN] Could not find infobox full-body image on page. Falling back to stub.`);
        failedCount++;
        continue;
      }

      // Strip Wikia's revision/sizing suffixes to get the raw high-resolution image URL
      // e.g. "https://...Miya.png/revision/latest/scale-to-width-down/350?cb=..." -> "https://...Miya.png"
      const rawImageUrl = imageSrc.split('/revision/')[0];
      console.log(`  - Found raw splash art URL: ${rawImageUrl}`);

      // 3. Download and highly compress it
      const success = await downloadAndCompress(rawImageUrl, destFile);
      if (success) {
        downloadedCount++;
      } else {
        failedCount++;
      }

      // Politeness sleep
      await new Promise(r => setTimeout(r, 200));

    } catch (err) {
      console.error(`  - [ERROR] Playwright page load failed for ${heroName}: ${err.message}`);
      failedCount++;
    }
  }

  await context.close();

  console.log("\n===================================================================");
  console.log("       REWRITING DATABASE PATHS FOR ALL LOCALES                     ");
  console.log("===================================================================");

  // Rewrites the "cover_thumb" paths inside all compiled JSON directories
  LANGUAGES.forEach(lang => {
    const langHeroDir = path.join(PATCHES_ROOT, lang, 'heroes');
    const langIndex = path.join(langHeroDir, 'index.json');

    if (!fs.existsSync(langIndex)) {
      console.warn(`Roster index for language [${lang.toUpperCase()}] not found. Skipping rewrite.`);
      return;
    }

    console.log(`Rewriting banner paths for [${lang.toUpperCase()}]...`);

    // 1. Rewrite localized index.json roster
    const indexData = JSON.parse(fs.readFileSync(langIndex, 'utf-8'));
    const updatedIndex = indexData.map(hero => {
      const bannerFile = `hero_${hero.id}.webp`;
      const localPath = `/assets/banners/${bannerFile}`;
      
      // If the offline banner exists, update cover_thumb path
      if (fs.existsSync(path.join(BANNERS_DIR, bannerFile))) {
        return {
          ...hero,
          cover_thumb: localPath
        };
      }
      return hero;
    });
    fs.writeFileSync(langIndex, JSON.stringify(updatedIndex, null, 2), 'utf-8');

    // 2. Rewrite individual hero detail profile JSONs
    const detailFiles = fs.readdirSync(langHeroDir).filter(f => f.endsWith('.json') && f !== 'index.json');
    detailFiles.forEach(file => {
      const filePath = path.join(langHeroDir, file);
      try {
        const detailData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const heroId = detailData.heroid || detailData.id;
        const bannerFile = `hero_${heroId}.webp`;
        const localPath = `/assets/banners/${bannerFile}`;

        if (fs.existsSync(path.join(BANNERS_DIR, bannerFile))) {
          const updatedDetail = {
            ...detailData,
            cover_picture: localPath
          };
          fs.writeFileSync(filePath, JSON.stringify(updatedDetail, null, 2), 'utf-8');
        }
      } catch (err) {
        console.error(`  - Failed to rewrite detail file ${file}: ${err.message}`);
      }
    });

    console.log(`  - Local [${lang.toUpperCase()}] indexes and details successfully rewritten.`);
  });

  console.log("\n===================================================================");
  console.log("       BANNER PIPELINE COMPLETE SUMMARY                            ");
  console.log(`  - Newly Downloaded: ${downloadedCount}`);
  console.log(`  - Cached (Skipped):  ${skippedCount}`);
  console.log(`  - Failed/Stubs:      ${failedCount}`);
  console.log("===================================================================");
}

scrapeBanners().catch(console.error);
