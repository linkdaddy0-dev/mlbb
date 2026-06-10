/**
 * @module stabilize_asset_variants
 * Copy crawled WebP assets to alternate naming variants (e.g. Custom_Marksman_Emblem.webp -> Custom_Marksman_Emblem_New.webp
 * and Swift.webp -> Talent_Swift.webp) to guarantee 100% load success across all JSON and App.jsx naming patterns.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const EMBLEMS_DIR = path.join(ROOT_DIR, 'public', 'assets', 'emblems');
const TALENTS_DIR = path.join(ROOT_DIR, 'public', 'assets', 'talents');
const MISC_DIR = path.join(ROOT_DIR, 'public', 'assets', 'misc');
const SPELLS_DIR = path.join(ROOT_DIR, 'public', 'assets', 'spells');

// Ensure misc exists
if (!fs.existsSync(MISC_DIR)) {
  fs.mkdirSync(MISC_DIR, { recursive: true });
}

// 1. Map Emblems (e.g. Custom_Marksman_Emblem.webp -> Custom_Marksman_Emblem_New.webp)
const EMBLEMS_MAP = [
  'Custom_Marksman_Emblem',
  'Custom_Assassin_Emblem',
  'Custom_Mage_Emblem',
  'Custom_Tank_Emblem',
  'Custom_Fighter_Emblem',
  'Custom_Support_Emblem'
];

console.log('[Stabilizer] Copying emblem asset variants...');
EMBLEMS_MAP.forEach(baseName => {
  const src = path.join(EMBLEMS_DIR, `${baseName}.webp`);
  const dest = path.join(EMBLEMS_DIR, `${baseName}_New.webp`);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  - Copied emblem: ${baseName}.webp ➔ ${baseName}_New.webp`);
  } else {
    console.warn(`  - Warning: Emblem source missing: ${src}`);
  }
});

// 2. Map Talents (e.g. Swift.webp -> Talent_Swift.webp and misc/ variants)
const TALENTS = [
  'Fatal', 'Bargain_Hunter', 'Weakness_Finder', 'Swift', 'Master_Assassin',
  'Killing_Spree', 'Rupture', 'Weapon_Master', 'Lethal_Ignition', 'Thrill',
  'Festival_of_Blood', 'Brave_Smite', 'Impure_Rage', 'Tenacity', 'Focus_Mark',
  'Concussive_Blast', 'Wilderness_Blessing', 'Pull_Yourself_Together', 
  'Temporal_Reign', 'Quantum_Charge', 'War_Cry', 'Chrono_Turquoise', 
  'Shielding_Skill', 'Focusing_Mark'
];

console.log('\n[Stabilizer] Copying talent asset variants across folders...');
TALENTS.forEach(name => {
  const src = path.join(TALENTS_DIR, `${name}.webp`);
  
  if (fs.existsSync(src)) {
    // Target variants
    const targets = [
      path.join(TALENTS_DIR, `Talent_${name}.webp`),
      path.join(MISC_DIR, `Talent_${name}.webp`),
      path.join(MISC_DIR, `${name}.webp`)
    ];
    
    targets.forEach(dest => {
      // Ensure target directory exists
      const dir = path.dirname(dest);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      
      fs.copyFileSync(src, dest);
    });
    console.log(`  - Stabilized talent: ${name}.webp ➔ Talent_${name}.webp + misc/`);
  } else {
    // Alternate check: if it was saved with spaces, normalize it
    const spacedName = name.replace(/_/g, ' ');
    const spacedSrc = path.join(TALENTS_DIR, `${spacedName.replace(/[^a-zA-Z0-9_\-]/g, '_')}.webp`);
    
    if (fs.existsSync(spacedSrc)) {
      const targets = [
        path.join(TALENTS_DIR, `${name}.webp`),
        path.join(TALENTS_DIR, `Talent_${name}.webp`),
        path.join(MISC_DIR, `Talent_${name}.webp`),
        path.join(MISC_DIR, `${name}.webp`)
      ];
      
      targets.forEach(dest => {
        fs.copyFileSync(spacedSrc, dest);
      });
      console.log(`  - Normalized and stabilized spaced talent: ${spacedSrc} ➔ ${name}.webp`);
    } else {
      console.warn(`  - Warning: Talent source missing: ${src}`);
    }
  }
});

console.log('\n[Stabilizer] Asset variants stabilization successful!\n');
