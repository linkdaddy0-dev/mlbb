/**
 * @module crawl_direct_assets
 * Stealth-hardened Playwright script to fetch hardcoded direct Fandom CDN URLs of MLBB spells, emblems, and talents
 * using browser-native fetch() inside an active session.
 *
 * This completely bypasses Cloudflare geoblocks and avoids dynamic search-router mismatches,
 * ensuring 100% correct, authentic, high-resolution original game icons.
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

// Target list of direct authentic Fandom CDN URLs
const TARGETS = [
  // 1. Spells (Category: spells)
  { name: 'Inspire', category: 'spells', url: "https://static.wikia.nocookie.net/mobile-legends/images/c/c5/Inspire.png" },
  { name: 'Flicker', category: 'spells', url: "https://static.wikia.nocookie.net/mobile-legends/images/a/a7/Flicker.png" },
  { name: 'Retribution', category: 'spells', url: "https://static.wikia.nocookie.net/mobile-legends/images/b/bc/Retribution.png" },
  { name: 'Purify', category: 'spells', url: "https://static.wikia.nocookie.net/mobile-legends/images/7/7e/Purify.png" },
  { name: 'Petrify', category: 'spells', url: "https://static.wikia.nocookie.net/mobile-legends/images/b/b2/Petrify.png" },
  { name: 'Execute', category: 'spells', url: "https://static.wikia.nocookie.net/mobile-legends/images/5/52/Execute.png" },
  { name: 'Aegis', category: 'spells', url: "https://static.wikia.nocookie.net/mobile-legends/images/a/a6/Aegis.png" },
  { name: 'Revitalize', category: 'spells', url: "https://static.wikia.nocookie.net/mobile-legends/images/8/87/Revitalize.png" },
  { name: 'Flameshot', category: 'spells', url: "https://static.wikia.nocookie.net/mobile-legends/images/6/6f/Flameshot.png" },
  { name: 'Vengeance', category: 'spells', url: "https://static.wikia.nocookie.net/mobile-legends/images/b/b3/Vengeance.png" },
  { name: 'Sprint', category: 'spells', url: "https://static.wikia.nocookie.net/mobile-legends/images/6/6a/Sprint.png" },
  { name: 'Arrival', category: 'spells', url: "https://static.wikia.nocookie.net/mobile-legends/images/5/5e/Arrival.png" },

  // 2. Emblems (Category: emblems)
  { name: 'Custom_Marksman_Emblem', category: 'emblems', url: "https://static.wikia.nocookie.net/mobile-legends/images/d/df/Custom_Marksman_Emblem_New.png" },
  { name: 'Custom_Assassin_Emblem', category: 'emblems', url: "https://static.wikia.nocookie.net/mobile-legends/images/6/6f/Custom_Assassin_Emblem_New.png" },
  { name: 'Custom_Mage_Emblem', category: 'emblems', url: "https://static.wikia.nocookie.net/mobile-legends/images/c/ca/Custom_Mage_Emblem_New.png" },
  { name: 'Custom_Tank_Emblem', category: 'emblems', url: "https://static.wikia.nocookie.net/mobile-legends/images/c/cc/Custom_Tank_Emblem_New.png" },
  { name: 'Custom_Fighter_Emblem', category: 'emblems', url: "https://static.wikia.nocookie.net/mobile-legends/images/f/f6/Custom_Fighter_Emblem_New.png" },
  { name: 'Custom_Support_Emblem', category: 'emblems', url: "https://static.wikia.nocookie.net/mobile-legends/images/d/df/Custom_Support_Emblem_New.png" },

  // 3. Talents (Category: talents)
  { name: 'Fatal', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/c/c4/Fatal.png" },
  { name: 'Bargain_Hunter', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/3/30/Bargain_Hunter.png" },
  { name: 'Weakness_Finder', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/e/ef/Weakness_Finder.png" },
  { name: 'Swift', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/1/14/Swift.png" },
  { name: 'Master_Assassin', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/6/62/Master_Assassin.png" },
  { name: 'Killing_Spree', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/3/3d/Killing_Spree.png" },
  { name: 'Rupture', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/7/75/Rupture.png" },
  { name: 'Weapon_Master', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/a/a2/Weapon_Master.png" },
  { name: 'Lethal_Ignition', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/c/c4/Lethal_Ignition.png" },
  { name: 'Thrill', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/0/07/Thrill.png" },
  { name: 'Festival_of_Blood', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/b/b8/Festival_of_Blood.png" },
  { name: 'Brave_Smite', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/6/60/Brave_Smite.png" },
  { name: 'Impure_Rage', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/8/86/Impure_Rage.png" },
  { name: 'Tenacity', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/0/00/Tenacity.png" },
  { name: 'Focus_Mark', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/2/2f/Focus_Mark.png" },
  { name: 'Concussive_Blast', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/7/79/Concussive_Blast.png" },
  { name: 'Wilderness_Blessing', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/1/17/Wilderness_Blessing.png" },
  { name: 'Pull_Yourself_Together', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/5/5a/Pull_Yourself_Together.png" },
  { name: 'Temporal_Reign', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/6/6b/Temporal_Reign.png" },
  { name: 'Quantum_Charge', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/d/d7/Quantum_Charge.png" },
  { name: 'War_Cry', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/4/4b/War_Cry.png" },
  { name: 'Chrono_Turquoise', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/5/52/Chrono_Turquoise.png" },
  { name: 'Shielding_Skill', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/2/24/Shielding_Skill.png" },
  { name: 'Focusing_Mark', category: 'talents', url: "https://static.wikia.nocookie.net/mobile-legends/images/5/5a/Focusing_Mark.png" }
];

async function run() {
  console.log("============================================================");
  console.log("    DYNAMIC DIRECT CDN BINARY INGESTION CRAWLER ENGINE      ");
  console.log("============================================================");

  console.log('[DirectCrawler] Launching stealth persistent browser context...');
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: true,
    viewport: { width: 1024, height: 768 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();
  
  // Navigate to Fandom home page once to establish session & trust metrics
  console.log('[DirectCrawler] Warm-up loading Fandom Wiki context...');
  await page.goto('https://mobile-legends.fandom.com/wiki/Mobile_Legends:_Bang_Bang_Wiki', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  console.log(`[DirectCrawler] Starting download queue of ${TARGETS.length} assets...`);

  for (let i = 0; i < TARGETS.length; i++) {
    const task = TARGETS[i];
    const destPath = path.join(SUB_DIRS[task.category], `${task.name}.webp`);
    
    console.log(`  [${i+1}/${TARGETS.length}] Fetching ${task.name} direct: ${task.url}`);

    try {
      // Execute the fetch INSIDE the browser tab context to borrow stealth headers & trust cookies
      const base64Data = await page.evaluate(async (targetUrl) => {
        // Force append revision/latest to hit raw static image
        const cdnUrl = targetUrl + "/revision/latest";
        const res = await fetch(cdnUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.onerror = () => reject(new Error('FileReader failed'));
          reader.readAsDataURL(blob);
        });
      }, task.url);

      const buffer = Buffer.from(base64Data, 'base64');
      
      if (buffer.length < 100) {
        throw new Error(`Suspicious empty buffer: ${buffer.length} bytes`);
      }

      // Metadata check via Sharp to ensure it is not a Cloudflare captcha/error page
      const meta = await sharp(buffer).metadata();
      if (!meta.format) {
        throw new Error('Sharp validation failed. Buffer is not an image.');
      }

      // Convert to WebP and write directly
      await sharp(buffer)
        .webp({ quality: 90 })
        .toFile(destPath);

      console.log(`    - Success ✓ Wrote authentic WebP: ${path.basename(destPath)} (${buffer.length} bytes)`);

    } catch (e) {
      console.error(`    - ❌ Ingestion failure on ${task.name}: ${e.message}`);
    }

    // Gentle delay to simulate human timing
    await page.waitForTimeout(500);
  }

  await context.close();
  console.log("\n============================================================");
  console.log("   DIRECT CDN ASSETS MIRROR INGESTION TASK RUN COMPLETED     ");
  console.log("============================================================\n");
}

run().catch(err => {
  console.error("Direct Ingestion Pipeline Crash:", err);
  process.exit(1);
});
