const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT_DIR, 'public', 'assets', 'manifest.json');
const PATCHES_DIR = path.join(ROOT_DIR, 'public', 'data', 'patches');
const APP_JSX_PATH = path.join(ROOT_DIR, 'src', 'App.jsx');
const SMART_IMAGE_PATH = path.join(ROOT_DIR, 'src', 'components', 'SmartImage.jsx');

function rewriteDirectory(dir, manifest) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      rewriteDirectory(filePath, manifest);
    } else if (file.endsWith('.json') && file !== 'manifest.json') {
      try {
        let content = fs.readFileSync(filePath, 'utf-8');
        let replaced = false;
        
        // Loop through all keys in the manifest and rewrite
        Object.entries(manifest).forEach(([originalUrl, localPath]) => {
          if (content.includes(originalUrl)) {
            // Replace all occurrences of this URL in this file
            const regex = new RegExp(escapeRegExp(originalUrl), 'g');
            content = content.replace(regex, localPath);
            replaced = true;
          }
        });
        
        if (replaced) {
          fs.writeFileSync(filePath, content, 'utf-8');
          console.log(`  - Rewrote assets inside: ${path.basename(filePath)}`);
        }
      } catch (e) {
        console.error(`Error rewriting file ${file}:`, e);
      }
    }
  });
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function run() {
  console.log("============================================================");
  console.log("     MLBB BUILD-TIME PERMANENT CODE & DATA REWRITER         ");
  console.log("============================================================");

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error("❌ Error: manifest.json not found! Please run node scripts/mirror_assets.cjs first.");
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  console.log(`Loaded mapping manifest with ${Object.keys(manifest).length} URL conversions.\n`);

  // 1. Rewrite patch database files
  console.log("[1/4] Rewriting all compiled patch guide JSON files...");
  rewriteDirectory(PATCHES_DIR, manifest);

  // 2. Rewrite src/data/ static JSON databases (emblems, combos, spells, fallbacks, equipment)
  console.log("\n[2/4] Rewriting src/data/ static database JSON files...");
  const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'data');
  rewriteDirectory(SRC_DATA_DIR, manifest);

  // 3. Rewrite src/App.jsx hardcoded URLs
  console.log("\n[3/4] Rewriting hardcoded spells, emblems, and talent URLs in App.jsx...");
  if (fs.existsSync(APP_JSX_PATH)) {
    let appContent = fs.readFileSync(APP_JSX_PATH, 'utf-8');
    let replacedCount = 0;
    
    Object.entries(manifest).forEach(([originalUrl, localPath]) => {
      if (appContent.includes(originalUrl)) {
        const regex = new RegExp(escapeRegExp(originalUrl), 'g');
        appContent = appContent.replace(regex, localPath);
        replacedCount++;
      }
    });
    
    if (replacedCount > 0) {
      fs.writeFileSync(APP_JSX_PATH, appContent, 'utf-8');
      console.log(`  - Successfully replaced ${replacedCount} hardcoded CDN URLs inside App.jsx!`);
    } else {
      console.log("  - No hardcoded CDN URLs found in App.jsx (already rewritten).");
    }
  } else {
    console.warn("  - Warning: src/App.jsx not found!");
  }

  // 4. Clean up SmartImage.jsx proxying logic completely
  console.log("\n[4/4] Deleting obsolete proxy interceptors inside SmartImage.jsx...");
  if (fs.existsSync(SMART_IMAGE_PATH)) {
    const newSmartImageContent = `import React, { useState, useEffect } from 'react';

// Sleek SVG vectors to use as elegant, fallback assets if offline or failed
const FALLBACK_VECTORS = {
  hero: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/><circle cx='12' cy='11' r='3'/></svg>", // Premium inline vector shield
  skill: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><path d='m12 8-4 4 4 4 4-4-4-4z'/></svg>",
  item: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fbbf24' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/></svg>",
  spell: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polygon points='5 3 19 12 5 21 5 3'/></svg>"
};

export default function SmartImage({ src, alt, className, style, fallbackType = 'hero' }) {
  const [imgSrc, setImgSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Whenever source changes, load local asset directly (zero runtime proxying allowed!)
    setImgSrc(src);
    setLoading(true);
    setError(false);
    setRetryCount(0);
  }, [src]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    if (retryCount < 2) {
      setRetryCount(prev => prev + 1);
      const delay = (retryCount + 1) * 1000;
      setTimeout(() => {
        setImgSrc(src);
      }, delay);
    } else {
      console.warn(\`SmartImage failed to load: \${src}. Applying local offline fallback.\`);
      setLoading(false);
      setError(true);
      setImgSrc(FALLBACK_VECTORS[fallbackType] || FALLBACK_VECTORS.hero);
    }
  };

  return (
    <div 
      style={{ 
        position: 'relative', 
        display: 'inline-block', 
        width: className ? undefined : '100%', 
        height: className ? undefined : '100%', 
        overflow: 'hidden',
        ...style 
      }} 
      className={className}
    >
      {/* Premium Skeleton Pulse Loading Overlay */}
      {loading && (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
            borderRadius: 'inherit',
            zIndex: 2
          }}
        />
      )}
      
      {/* Local Asset Image */}
      <img
        src={imgSrc || FALLBACK_VECTORS[fallbackType]}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        referrerPolicy="no-referrer"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.25s ease-in-out',
          borderRadius: 'inherit'
        }}
      />
    </div>
  );
}
`;
    
    fs.writeFileSync(SMART_IMAGE_PATH, newSmartImageContent, 'utf-8');
    console.log("  - Successfully cleaned up SmartImage.jsx and removed all runtime proxy modules!");
  } else {
    console.warn("  - Warning: src/components/SmartImage.jsx not found!");
  }

  console.log("\n============================================================");
  console.log("   REWRITE SUCCESSFUL! APP COMPONENTS ARE SECURELY LOCAL    ");
  console.log("============================================================\n");
}

run();
