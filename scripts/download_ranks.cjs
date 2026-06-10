const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

// Ranks configurations
const RANKS = [
  { name: 'Warrior', url: 'https://static.wikia.nocookie.net/mobile-legends/images/9/97/Warrior.png/revision/latest' },
  { name: 'Elite', url: 'https://static.wikia.nocookie.net/mobile-legends/images/e/e3/Elite.png/revision/latest' },
  { name: 'Master', url: 'https://static.wikia.nocookie.net/mobile-legends/images/6/6b/Master.png/revision/latest' },
  { name: 'Grandmaster', url: 'https://static.wikia.nocookie.net/mobile-legends/images/2/28/Grandmaster.png/revision/latest' },
  { name: 'Epic', url: 'https://static.wikia.nocookie.net/mobile-legends/images/2/26/Epic.png/revision/latest' },
  { name: 'Legend', url: 'https://static.wikia.nocookie.net/mobile-legends/images/1/10/Legend.png/revision/latest' },
  { name: 'Mythic', url: 'https://static.wikia.nocookie.net/mobile-legends/images/e/ec/Mythic.png/revision/latest' },
  { name: 'Mythical_Honor', url: 'https://static.wikia.nocookie.net/mobile-legends/images/c/c8/Mythical_Honor.png/revision/latest' },
  { name: 'Mythical_Glory', url: 'https://static.wikia.nocookie.net/mobile-legends/images/4/42/Mythical_Glory.png/revision/latest' },
  { name: 'Mythical_Immortal', url: 'https://static.wikia.nocookie.net/mobile-legends/images/3/3c/Mythical_Immortal.png/revision/latest' }
];

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'ranks');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (Status Code: ${res.statusCode})`));
        return;
      }
      
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    }).on('error', reject);
  });
}

async function start() {
  console.log(`Starting rank division medals scraper... Target directory: ${OUTPUT_DIR}`);
  
  for (const rank of RANKS) {
    const filename = rank.name.toLowerCase() + '.webp';
    const finalDest = path.join(OUTPUT_DIR, filename);
    
    console.log(`Downloading ${rank.name}...`);
    try {
      const imgBuffer = await downloadImage(rank.url, finalDest);
      
      // Optimize image using sharp: resize to max 160px width, convert to webp with high quality and transparency
      await sharp(imgBuffer)
        .resize({ width: 160, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(finalDest);
        
      const stats = fs.statSync(finalDest);
      console.log(`Successfully saved and optimized ${rank.name} -> ${filename} (${stats.size} bytes)`);
    } catch (err) {
      console.error(`❌ Failed to scrape ${rank.name}:`, err.message);
    }
  }
  
  console.log('🎉 Scraping and optimization of rank division medals complete!');
}

start();
