/**
 * @module fix_equipment_icons
 * Scans pro_equipment.json and repairs any incorrect icon paths (like placeholder hashes).
 * Checks if a name-matched local WebP file already exists, and if not, dynamically crawls
 * Fandom's item page using Playwright stealth browser-native fetch to download and optimize it.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

chromium.use(stealth);

const ROOT_DIR = path.resolve(__dirname, '..');
const PROFILE_DIR = path.join(__dirname, 'crawler_profile');
const EQUIPMENT_JSON_PATH = path.join(ROOT_DIR, 'src', 'data', 'pro_equipment.json');
const ITEMS_DIR = path.join(ROOT_DIR, 'public', 'assets', 'items');
const MISC_DIR = path.join(ROOT_DIR, 'public', 'assets', 'misc');

if (!fs.existsSync(ITEMS_DIR)) fs.mkdirSync(ITEMS_DIR, { recursive: true });

// Helper to sanitize name into safe filename
function getSafeName(name) {
  return name.replace(/\s+/g, '_').replace(/['’]/g, '_');
}

// Download image helper inside browser session to bypass geoblocking
async function downloadItemIcon(page, targetUrl, localDestPath) {
  try {
    const base64Data = await page.evaluate(async (url) => {
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
    if (buffer.length < 100) return null;

    const meta = await sharp(buffer).metadata();
    if (!meta.format) return null;

    await sharp(buffer)
      .webp({ quality: 90 })
      .toFile(localDestPath);

    return true;
  } catch (e) {
    return null;
  }
}

async function run() {
  console.log("============================================================");
  console.log("      BUILD-TIME PRO EQUIPMENT ICON REPAIR SYSTEM           ");
  console.log("============================================================");

  if (!fs.existsSync(EQUIPMENT_JSON_PATH)) {
    console.error(`Error: pro_equipment.json not found at ${EQUIPMENT_JSON_PATH}`);
    process.exit(1);
  }

  const equipment = JSON.parse(fs.readFileSync(EQUIPMENT_JSON_PATH, 'utf-8'));
  console.log(`Loaded ${equipment.length} equipment items to analyze...`);

  console.log('[EquipRepair] Launching persistent browser context...');
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  // Block ads/trackers
  await page.route('**/*', (route) => {
    const url = route.request().url().toLowerCase();
    if (
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

  let repairedCount = 0;

  for (let i = 0; i < equipment.length; i++) {
    const item = equipment[i];
    const safeName = getSafeName(item.name);
    
    const itemsPath = `/assets/items/${safeName}.webp`;
    const miscPath = `/assets/misc/${safeName}.webp`;
    
    const absoluteItemsPath = path.join(ITEMS_DIR, `${safeName}.webp`);
    const absoluteMiscPath = path.join(MISC_DIR, `${safeName}.webp`);

    console.log(`\n[${i+1}/${equipment.length}] Item: "${item.name}"`);

    // Step 1: Check if item already has a local name-matched file
    if (fs.existsSync(absoluteItemsPath)) {
      item.icon = itemsPath;
      console.log(`  - Local WebP found in /items/. Updated icon path: ${item.icon}`);
      repairedCount++;
      continue;
    }
    
    if (fs.existsSync(absoluteMiscPath)) {
      // Copy to items directory to make it uniform
      fs.copyFileSync(absoluteMiscPath, absoluteItemsPath);
      item.icon = itemsPath;
      console.log(`  - Local WebP found in /misc/. Copied to /items/ and updated: ${item.icon}`);
      repairedCount++;
      continue;
    }

    // Step 2: If file is missing, dynamically crawl it from Fandom
    const wikiUrl = `https://mobile-legends.fandom.com/wiki/${encodeURIComponent(item.name)}`;
    console.log(`  - WebP missing. Crawling Fandom page: ${wikiUrl}`);

    try {
      await page.goto(wikiUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      const images = await page.$$eval('img', imgs => {
        return imgs.map(i => ({
          src: i.getAttribute('src') || '',
          dataSrc: i.getAttribute('data-src') || '',
          alt: i.getAttribute('alt') || '',
          imageName: i.getAttribute('data-image-name') || ''
        }));
      });

      // Find the image where the data-image-name or alt matches the item name
      const match = images.find(img => {
        const altLower = img.alt.toLowerCase();
        const imageNameLower = img.imageName.toLowerCase();
        const query = item.name.toLowerCase();
        return (altLower === query || imageNameLower === `${query.replace(/\s+/g, '_')}.png` || imageNameLower.replace(/_/g, ' ') === `${query}.png`);
      }) || images.find(img => img.imageName.toLowerCase().includes('equip') || img.imageName.toLowerCase().includes(safeName.toLowerCase()));

      if (match) {
        const srcUrl = match.dataSrc || match.src;
        console.log(`    - Found icon match: ${srcUrl}`);
        const success = await downloadItemIcon(page, srcUrl, absoluteItemsPath);
        if (success) {
          item.icon = itemsPath;
          console.log(`    - Success ✓ Crawled and saved: ${item.icon}`);
          repairedCount++;
        } else {
          console.error(`    - Failed to download image binary.`);
        }
      } else {
        console.warn(`    - ⚠️ Warning: No matching icon found on wiki page.`);
      }
    } catch (e) {
      console.error(`    - Ingestion crash: ${e.message}`);
    }

    // Small delay
    await page.waitForTimeout(400);
  }

  await context.close();

  // Write updated pro_equipment.json back to disk
  fs.writeFileSync(EQUIPMENT_JSON_PATH, JSON.stringify(equipment, null, 2), 'utf-8');
  console.log(`\n============================================================`);
  console.log(`   REPAIR COMPLETE! Repaired ${repairedCount} item icon(s) successfully!`);
  console.log(`============================================================\n`);
}

run().catch(err => {
  console.error("Equipment Repair Pipeline Crash:", err);
  process.exit(1);
});
