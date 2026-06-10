const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');
const crypto = require('crypto');

// Target Directories
const ROOT_DIR = path.resolve(__dirname, '..');
const HEROES_DIR = path.join(ROOT_DIR, 'public', 'data', 'patches', '1.8.84', 'en', 'heroes');
const ASSETS_OUT_DIR = path.join(ROOT_DIR, 'public', 'assets');

// Setup output subdirectories
const SUB_DIRS = {
  heroes: path.join(ASSETS_OUT_DIR, 'heroes'),
  items: path.join(ASSETS_OUT_DIR, 'items'),
  emblems: path.join(ASSETS_OUT_DIR, 'emblems'),
  spells: path.join(ASSETS_OUT_DIR, 'spells'),
  talents: path.join(ASSETS_OUT_DIR, 'talents'),
  skills: path.join(ASSETS_OUT_DIR, 'skills'),
  misc: path.join(ASSETS_OUT_DIR, 'misc')
};

// Hardcoded emblem and battle spells from App.jsx to guarantee capturing them
const EXTRA_HARDCODED_URLS = [
  // Spells
  "https://static.wikia.nocookie.net/mobile-legends/images/c/c5/Inspire.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/a/a7/Flicker.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/b/bc/Retribution.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/7/7e/Purify.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/b/b2/Petrify.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/5/52/Execute.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/a/a6/Aegis.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/8/87/Revitalize.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/6/6f/Flameshot.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/b/b3/Vengeance.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/6/6a/Sprint.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/5/5e/Arrival.png",

  // Emblems
  "https://static.wikia.nocookie.net/mobile-legends/images/d/df/Custom_Marksman_Emblem_New.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/6/6f/Custom_Assassin_Emblem_New.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/c/ca/Custom_Mage_Emblem_New.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/c/cc/Custom_Tank_Emblem_New.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/f/f6/Custom_Fighter_Emblem_New.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/d/df/Custom_Support_Emblem_New.png",

  // Talents
  "https://static.wikia.nocookie.net/mobile-legends/images/c/c4/Fatal.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/3/30/Bargain_Hunter.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/e/ef/Weakness_Finder.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/1/14/Swift.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/6/62/Master_Assassin.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/3/3d/Killing_Spree.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/7/75/Rupture.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/a/a2/Weapon_Master.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/c/c4/Lethal_Ignition.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/0/07/Thrill.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/b/b8/Festival_of_Blood.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/6/60/Brave_Smite.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/8/86/Impure_Rage.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/0/00/Tenacity.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/2/2f/Focus_Mark.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/7/79/Concussive_Blast.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/1/17/Wilderness_Blessing.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/5/5a/Pull_Yourself_Together.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/6/6b/Temporal_Reign.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/d/d7/Quantum_Charge.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/4/4b/War_Cry.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/5/52/Chrono_Turquoise.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/2/24/Shielding_Skill.png",
  "https://static.wikia.nocookie.net/mobile-legends/images/5/5a/Focusing_Mark.png"
];

// Ensure all target folders exist
Object.values(SUB_DIRS).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper to determine logical asset category from URL structure
function getCategory(url) {
  const lower = url.toLowerCase();
  
  if (lower.includes('equip/') || lower.includes('equip') || lower.includes('res/') || lower.includes('/equipment/')) {
    return 'items';
  }
  if (lower.includes('emblem_new') || lower.includes('emblem')) {
    return 'emblems';
  }
  if (lower.includes('inspire') || lower.includes('flicker') || lower.includes('retribution') || lower.includes('purify') || lower.includes('petrify') || lower.includes('execute') || lower.includes('aegis') || lower.includes('revitalize') || lower.includes('flameshot') || lower.includes('vengeance') || lower.includes('sprint') || lower.includes('arrival')) {
    return 'spells';
  }
  if (lower.includes('fatal') || lower.includes('bargain') || lower.includes('weakness_finder') || lower.includes('killing_spree') || lower.includes('lethal_ignition') || lower.includes('rupture') || lower.includes('brave_smite') || lower.includes('tenacity') || lower.includes('concussive') || lower.includes('quantum_charge') || lower.includes('war_cry')) {
    return 'talents';
  }
  if (lower.includes('hero') || lower.includes('avatar') || lower.includes('cover_picture') || lower.includes('group1/m00/')) {
    return 'heroes';
  }
  if (lower.includes('skill') || lower.includes('blessing') || lower.includes('arrow') || lower.includes('eclipse') || lower.includes('moonlight')) {
    return 'skills';
  }
  return 'misc';
}

// Generate human-friendly deterministic WebP file names
function getLocalPath(url) {
  const category = getCategory(url);
  
  // Extract clean filename from URL (remove query params)
  const cleanUrl = url.split('?')[0];
  const originalFileName = path.basename(cleanUrl);
  
  // Strip extension
  const nameWithoutExt = path.parse(originalFileName).name;
  
  // Clean special characters
  let safeName = nameWithoutExt.replace(/[^a-zA-Z0-9_\-]/g, '_');
  
  // In case of duplicate common names or hashes, keep it unique
  if (safeName.length < 3) {
    const md5 = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
    safeName = `asset_${md5}`;
  }
  
  const webpName = `${safeName}.webp`;
  const relativePath = `/assets/${category}/${webpName}`;
  const absolutePath = path.join(SUB_DIRS[category], webpName);
  
  return { relativePath, absolutePath };
}

// Crawl a specific directory for image URLs in JSONs
function crawlDirectory(dir, urls = new Set()) {
  if (!fs.existsSync(dir)) return urls;
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      crawlDirectory(filePath, urls);
    } else if (file.endsWith('.json')) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Match image URLs with extensions AND extensionless Moonton/Fandom CDN URLs
        const matches = content.match(/\"https?:\/\/[^\"]+\.(png|jpg|jpeg|svg|webp)[^\"]*\"|\"https?:\/\/(akmweb\.youngjoygame\.com|img\.mobilelegends\.com|static\.wikia\.nocookie\.net)[^\"]+\"/gi);
        if (matches) {
          matches.forEach(m => {
            // strip quotes
            const cleanUrl = m.replace(/^"|"$/g, '').trim();
            if (cleanUrl.startsWith('http')) {
              urls.add(cleanUrl);
            }
          });
        }
      } catch (e) {
        console.error(`Error reading file ${file}:`, e);
      }
    }
  });
  
  return urls;
}

// Normalize Fandom/Wikia URLs to include /revision/latest for direct image access
function normalizeFandomUrl(url) {
  if (url.includes('static.wikia.nocookie.net') && !url.includes('/revision/')) {
    return url + '/revision/latest';
  }
  return url;
}

// Download image helper with retries and redirect following
function downloadImage(url, destPath, retries = 3) {
  const normalizedUrl = normalizeFandomUrl(url);
  
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://mobile-legends.fandom.com/'
    };
    
    const request = https.get(normalizedUrl, { headers }, (response) => {
      // Follow redirects (301, 302, 307, 308)
      if ([301, 302, 307, 308].includes(response.statusCode) && response.headers.location) {
        response.resume();
        const redirectUrl = response.headers.location;
        downloadImage(redirectUrl.startsWith('http') ? redirectUrl : new URL(redirectUrl, normalizedUrl).href, destPath, retries)
          .then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        response.resume();
        if (retries > 0) {
          console.warn(`  - HTTP Status ${response.statusCode} on ${path.basename(normalizedUrl)}. Retrying (${4 - retries}/3)...`);
          setTimeout(() => downloadImage(url, destPath, retries - 1).then(resolve).catch(reject), 1000);
        } else {
          reject(new Error(`Failed with status code: ${response.statusCode}`));
        }
        return;
      }
      
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        
        // Validate that the buffer looks like an actual image (at least 100 bytes)
        if (buffer.length < 100) {
          if (retries > 0) {
            console.warn(`  - Suspiciously small response (${buffer.length} bytes) for ${path.basename(normalizedUrl)}. Retrying...`);
            setTimeout(() => downloadImage(url, destPath, retries - 1).then(resolve).catch(reject), 1000);
          } else {
            reject(new Error(`Response too small: ${buffer.length} bytes`));
          }
          return;
        }
        
        // Pass buffer to sharp for WebP compression and write directly
        sharp(buffer)
          .webp({ quality: 80 })
          .toFile(destPath)
          .then(() => resolve())
          .catch(err => {
            console.error(`  - Sharp compression failed on ${path.basename(normalizedUrl)}: ${err.message}`);
            // If sharp fails (e.g. invalid format/SVG), write raw buffer as fallback
            fs.writeFile(destPath, buffer, (e) => {
              if (e) reject(e);
              else resolve();
            });
          });
      });
    });
    
    request.on('error', (err) => {
      if (retries > 0) {
        console.warn(`  - Request error on ${path.basename(normalizedUrl)}: ${err.message}. Retrying (${4 - retries}/3)...`);
        setTimeout(() => downloadImage(url, destPath, retries - 1).then(resolve).catch(reject), 1500);
      } else {
        reject(err);
      }
    });
    
    request.setTimeout(15000, () => {
      request.destroy();
      if (retries > 0) {
        console.warn(`  - Timeout on ${path.basename(normalizedUrl)}. Retrying (${4 - retries}/3)...`);
        setTimeout(() => downloadImage(url, destPath, retries - 1).then(resolve).catch(reject), 1500);
      } else {
        reject(new Error('Request Timeout'));
      }
    });
  });
}

async function run() {
  console.log("============================================================");
  console.log("       MLBB OFFLINE COMPRESSOR & ASSET MIRROR PIPELINE      ");
  console.log("============================================================");
  
  // 1. Discover all unique image URLs
  console.log("\n[1/4] Crawling ALL source directories for external URLs...");
  const uniqueUrls = new Set();
  
  // Crawl patch directory
  crawlDirectory(HEROES_DIR, uniqueUrls);

  // Crawl src/data/ directory (battle_spells, hero_emblems, hero_combos, etc.)
  const srcDataDir = path.join(ROOT_DIR, 'src', 'data');
  crawlDirectory(srcDataDir, uniqueUrls);

  // Crawl public/data/ directory (all patch data)
  const publicDataDir = path.join(ROOT_DIR, 'public', 'data');
  crawlDirectory(publicDataDir, uniqueUrls);

  // Crawl src/App.jsx dynamically
  const appJsxPath = path.join(ROOT_DIR, 'src', 'App.jsx');
  if (fs.existsSync(appJsxPath)) {
    const appContent = fs.readFileSync(appJsxPath, 'utf-8');
    // Match URLs ending in common image extensions AND Moonton CDN URLs without extensions
    const regex = /"(https?:\/\/[^"]+)"/gi;
    const matches = appContent.match(regex) || [];
    matches.forEach(m => {
      const cleanUrl = m.replace(/^"|"$/g, '').split('?')[0].trim();
      if (cleanUrl.startsWith('http') && (
        /\.(png|jpg|jpeg|svg|webp)$/i.test(cleanUrl) ||
        cleanUrl.includes('akmweb.youngjoygame.com') ||
        cleanUrl.includes('img.mobilelegends.com') ||
        cleanUrl.includes('static.wikia.nocookie.net')
      )) {
        uniqueUrls.add(cleanUrl);
      }
    });
  }

  // Add hardcoded extras for any URLs that regex may miss
  EXTRA_HARDCODED_URLS.forEach(url => uniqueUrls.add(url));
  
  console.log(`Found ${uniqueUrls.size} unique external CDN assets to mirror!`);
  
  // 2. Generate mappings and schedule downloads
  console.log("\n[2/4] Initializing asset path mappings...");
  const manifest = {};
  const downloadQueue = [];
  
  uniqueUrls.forEach(url => {
    const { relativePath, absolutePath } = getLocalPath(url);
    manifest[url] = relativePath;
    
    // Check if file already exists to avoid redundant network usage
    if (!fs.existsSync(absolutePath)) {
      downloadQueue.push({ url, absolutePath, relativePath });
    }
  });
  
  console.log(`Asset manifest mapped! Total missing files to download: ${downloadQueue.length}`);
  
  // Save manifest early
  const manifestPath = path.join(ASSETS_OUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Saved manifest lookup: ${manifestPath}`);
  
  // 3. Process Download queue with concurrency throttling
  console.log("\n[3/4] Mirroring and compressing CDN images into local WebP...");
  let succeeded = 0;
  let failed = 0;
  
  const CONCURRENCY_LIMIT = 5;
  for (let i = 0; i < downloadQueue.length; i += CONCURRENCY_LIMIT) {
    const batch = downloadQueue.slice(i, i + CONCURRENCY_LIMIT);
    await Promise.all(batch.map(async (task, bIdx) => {
      const idx = i + bIdx + 1;
      try {
        console.log(`  [${idx}/${downloadQueue.length}] Mirroring: ${path.basename(task.absolutePath)}...`);
        await downloadImage(task.url, task.absolutePath);
        succeeded++;
      } catch (e) {
        console.error(`  [${idx}/${downloadQueue.length}] ❌ Failed to download ${task.url}: ${e.message}`);
        failed++;
      }
    }));
  }
  
  console.log("\n[4/4] Asset Mirroring Summary:");
  console.log(`- Total unique assets: ${uniqueUrls.size}`);
  console.log(`- New downloads completed: ${succeeded}`);
  console.log(`- Downloads failed: ${failed}`);
  console.log(`- Saved inside: ${ASSETS_OUT_DIR}`);
  console.log("============================================================\n");
}

run().catch(err => {
  console.error("Mirror pipeline crash:", err);
  process.exit(1);
});
