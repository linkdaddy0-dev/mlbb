import sharp from 'sharp';
import fs from 'fs';

const inputPath = 'C:/Users/rosha/Downloads/hanabii.png';
const outputs = [
  'public/assets/banners/hero_60_transparent.webp',
  'public/assets/banners/hero_60.webp',
  'public/assets/paintings/hero_60.webp'
];

async function compress() {
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }
  for (const out of outputs) {
    console.log(`Compressing ${inputPath} to ${out}...`);
    // Convert to webp with quality 80 and compression level 6
    await sharp(inputPath)
      .webp({ quality: 80, effort: 6 })
      .toFile(out);
  }
  console.log("Completed all Hanabi asset replacements!");
}

compress();
