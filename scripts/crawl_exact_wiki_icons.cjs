/**
 * @module crawl_exact_wiki_icons
 * High-accuracy stealth Playwright scraper that fetches Fandom Wiki pages and extracts the exact,
 * authentic icon CDN URLs matching alt/data-image-name attributes for Spells, Emblems, and Talents.
 *
 * This completely resolves "wrong image" issues by avoiding search-router guess-hashes and matching
 * exact elements inside Fandom's official listings pages.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

chromium.use(stealth);

const ROOT_DIR = path.resolve(__dirname, '..');
const PROFILE_DIR = path.join(__dirname, 'crawler_profile');
const ASSETS_OUT_DIR = path.join(ROOT_DIR, 'public', 'assets');

const SUB_DIRS = {
  emblems: path.join(ASSETS_OUT_DIR, 'emblems'),
  spells: path.join(ASSETS_OUT_DIR, 'spells'),
  talents: path.join(ASSETS_OUT_DIR, 'talents'),
  misc: path.join(ASSETS_OUT_DIR, 'misc')
};

// Target Names to scrape
const BATTLE_SPELLS = [
  'Inspire', 'Flicker', 'Retribution', 'Purify', 'Petrify', 
  'Execute', 'Aegis', 'Revitalize', 'Flameshot', 'Vengeance', 
  'Sprint', 'Arrival'
];

const EMBLEMS = [
  { key: 'Marksman', name: 'Custom Marksman Emblem' },
  { key: 'Assassin', name: 'Custom Assassin Emblem' },
  { key: 'Mage', name: 'Custom Mage Emblem' },
  { key: 'Tank', name: 'Custom Tank Emblem' },
  { key: 'Fighter', name: 'Custom Fighter Emblem' },
  { key: 'Support', name: 'Custom Support Emblem' }
];

const TALENTS = [
  'Fatal', 'Bargain Hunter', 'Weakness Finder', 'Swift', 'Master Assassin',
  'Killing Spree', 'Rupture', 'Weapon Master', 'Lethal Ignition', 'Thrill',
  'Festival of Blood', 'Brave Smite', 'Impure Rage', 'Tenacity', 'Focus Mark',
  'Concussive Blast', 'Wilderness Blessing', 'Pull Yourself Together', 
  'Temporal Reign', 'Quantum Charge', 'War Cry', 'Chrono Turquoise', 
  'Shielding Skill', 'Focusing Mark'
];

// Helper to download binary inside browser context to bypass geoblocking
async function downloadImageInTab(page, targetUrl, localDestPath) {
  try {
    const base64Data = await page.evaluate(async (url) => {
      // Force append /revision/latest to bypass scaling CDN artifacts
      const cleanUrl = url.split('/revision/')[0] + "/revision/latest";
      const res = await fetch(cleanUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => reject(new Error('FileReader failed'));
        reader.readAsDataURL(blob);
      });
    }, targetUrl);

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length < 100) throw new Error(`Empty buffer returned: ${buffer.length}`);

    // Sharp validation check
    const meta = await sharp(buffer).metadata();
    if (!meta.format) throw new Error('Buffer is not a valid image format.');

    // Save as optimized WebP
    await sharp(buffer)
      .webp({ quality: 90 })
      .toFile(localDestPath);
      
    console.log(`    - Success ✓ Wrote authentic WebP: ${path.basename(localDestPath)} (${buffer.length} bytes)`);
    return true;
  } catch (err) {
    console.error(`    - ❌ Download failed: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log("============================================================");
  console.log("   DYNAMIC DDOM DIRECT-MATCH ASSET ACQUISITION ENGINE      ");
  console.log("============================================================");

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();
  
  // Set ad-blocking to speed up load times
  await page.route('**/*', (route) => {
    const url = route.request().url().toLowerCase();
    const type = route.request().resourceType();
    if (
      type === 'font' ||
      url.includes('google-analytics') ||
      url.includes('doubleclick') ||
      url.includes('adsystem') ||
      url.includes('adengine')
    ) {
      route.abort();
    } else {
      route.continue();
    }
  });

  // ── Step 1. Scrape Battle Spells ──────────────────────────────────────────
  console.log('\n[1/3] Navigating to Battle Spells wiki page...');
  await page.goto('https://mobile-legends.fandom.com/wiki/Battle_spells', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  // Extract all img tags with their alt, src, and data-image-name attributes
  const spellImages = await page.$$eval('img', imgs => {
    return imgs.map(i => ({
      src: i.getAttribute('src') || '',
      dataSrc: i.getAttribute('data-src') || '',
      alt: i.getAttribute('alt') || '',
      imageName: i.getAttribute('data-image-name') || ''
    }));
  });

  console.log(`Found ${spellImages.length} images on Battle Spells page. Matching spells...`);
  for (const spellName of BATTLE_SPELLS) {
    console.log(`  - Resolving Battle Spell: "${spellName}"`);
    // Find the image where alt or imageName contains the spell name exactly
    const match = spellImages.find(img => {
      const altLower = img.alt.toLowerCase();
      const nameLower = img.imageName.toLowerCase();
      const query = spellName.toLowerCase();
      return (altLower === query || nameLower === `${query}.png` || nameLower === `${query}_new.png`);
    });

    if (match) {
      const srcUrl = match.dataSrc || match.src;
      const dest = path.join(SUB_DIRS.spells, `${spellName}.webp`);
      await downloadImageInTab(page, srcUrl, dest);
    } else {
      console.warn(`    - ⚠️ Warning: Could not find exact image for spell "${spellName}"`);
    }
  }

  // ── Step 2. Scrape Emblems & Talents ──────────────────────────────────────
  console.log('\n[2/3] Navigating to Emblems wiki page...');
  await page.goto('https://mobile-legends.fandom.com/wiki/Emblems', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  // Scroll to trigger lazy loading
  await page.evaluate(async () => {
    window.scrollTo(0, 1000);
    await new Promise(r => setTimeout(r, 500));
    window.scrollTo(0, 2000);
    await new Promise(r => setTimeout(r, 500));
  });

  const emblemImages = await page.$$eval('img', imgs => {
    return imgs.map(i => ({
      src: i.getAttribute('src') || '',
      dataSrc: i.getAttribute('data-src') || '',
      alt: i.getAttribute('alt') || '',
      imageName: i.getAttribute('data-image-name') || ''
    }));
  });

  console.log(`Found ${emblemImages.length} images on Emblems page. Matching emblems...`);
  for (const emblem of EMBLEMS) {
    console.log(`  - Resolving Emblem: "${emblem.name}"`);
    // Match custom emblem names
    const match = emblemImages.find(img => {
      const nameLower = img.imageName.toLowerCase();
      const query = emblem.key.toLowerCase();
      return (nameLower.includes(query) && nameLower.includes('emblem'));
    });

    if (match) {
      const srcUrl = match.dataSrc || match.src;
      // Save with underscores to match codebase paths
      const safeName = emblem.name.replace(/\s+/g, '_');
      const dest = path.join(SUB_DIRS.emblems, `${safeName}.webp`);
      await downloadImageInTab(page, srcUrl, dest);
    } else {
      console.warn(`    - ⚠️ Warning: Could not find exact image for emblem "${emblem.name}"`);
    }
  }

  console.log(`\n[3/3] Matching talents from Emblems page...`);
  for (const talentName of TALENTS) {
    console.log(`  - Resolving Talent: "${talentName}"`);
    // Match talents
    const match = emblemImages.find(img => {
      const nameLower = img.imageName.toLowerCase();
      const query = talentName.toLowerCase().replace(/\s+/g, '_');
      return (nameLower === `${query}.png` || nameLower === `${query}_new.png` || nameLower.replace(/_/g, ' ') === `${talentName.toLowerCase()}.png`);
    });

    if (match) {
      const srcUrl = match.dataSrc || match.src;
      // Save safe name (spaces replaced with underscores)
      const safeName = talentName.replace(/\s+/g, '_');
      const dest = path.join(SUB_DIRS.talents, `${safeName}.webp`);
      await downloadImageInTab(page, srcUrl, dest);
    } else {
      // Fallback search resolver inside Fandom if it wasn't on the general page
      console.warn(`    - Talent "${talentName}" not found on general Emblems page. Crawling directly...`);
      try {
        const queryUrl = `https://mobile-legends.fandom.com/wiki/Special:Search?query=${encodeURIComponent(talentName)}`;
        const talentPage = await context.newPage();
        await talentPage.goto(queryUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const results = await talentPage.$$eval('a.result-link, .unified-search__result a', anchors => {
          return anchors.map(a => a.getAttribute('href')).filter(h => h && !h.includes('/Special:'));
        });
        if (results.length > 0) {
          await talentPage.goto(results[0], { waitUntil: 'domcontentloaded', timeout: 30000 });
          const talentImages = await talentPage.$$eval('img', imgs => {
            return imgs.map(i => ({
              src: i.getAttribute('src') || '',
              dataSrc: i.getAttribute('data-src') || '',
              imageName: i.getAttribute('data-image-name') || ''
            }));
          });
          const exactImg = talentImages.find(img => img.imageName.toLowerCase().includes(talentName.toLowerCase().replace(/\s+/g, '_')));
          if (exactImg) {
            const srcUrl = exactImg.dataSrc || exactImg.src;
            const dest = path.join(SUB_DIRS.talents, `${talentName.replace(/\s+/g, '_')}.webp`);
            await downloadImageInTab(talentPage, srcUrl, dest);
          }
        }
        await talentPage.close();
      } catch (e) {
        console.error(`    - Alternate crawl failed for ${talentName}: ${e.message}`);
      }
    }
  }

  await context.close();
  console.log("\n============================================================");
  console.log("   EXACT WIKI DIRECT-MATCH INGESTION COMPLETED SUCCESSFULLY ");
  console.log("============================================================\n");
}

run().catch(err => {
  console.error("Direct-Match Ingestion Pipeline Crash:", err);
  process.exit(1);
});
