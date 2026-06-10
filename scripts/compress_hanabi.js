import sharp from 'sharp';
import fs from 'fs';

const inputPath = 'C:/Users/rosha/Downloads/hanabii.png';
const outputPath = 'public/assets/banners/hero_60_transparent.webp';

async function compressImage() {
  try {
    if (!fs.existsSync(inputPath)) {
      console.error(`Input file not found at: ${inputPath}`);
      process.exit(1);
    }
    
    console.log(`Compressing ${inputPath} to ${outputPath}...`);
    
    // Convert PNG to WebP with WebP lossy compression at quality 80
    await sharp(inputPath)
      .webp({ quality: 80, effort: 6 })
      .toFile(outputPath);
      
    console.log('Successfully compressed and saved Hanabi transparent asset!');
  } catch (err) {
    console.error('Error processing image:', err);
    process.exit(1);
  }
}

compressImage();
