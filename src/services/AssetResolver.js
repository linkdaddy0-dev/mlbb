/**
 * @module AssetResolver
 * Asset resolution service for the MLBB companion app.
 *
 * Resolution strategy:
 *   1. If the URL is already a local path (starts with '/') → return as-is
 *   2. Look up in the lazily-loaded asset manifest (/assets/manifest.json)
 *   3. Return a themed SVG data-URI fallback based on asset type
 */

// ─── Manifest Cache ─────────────────────────────────────────────────────────────

/** @type {Map<string, string>|null} url → localPath mapping, loaded once */
let manifestCache = null;

/** @type {Promise<void>|null} Guards against concurrent loads */
let loadPromise = null;

/**
 * Lazily loads the asset manifest from /assets/manifest.json and caches it
 * as a Map<url, localPath>.
 * @returns {Promise<Map<string, string>>}
 */
async function ensureManifest() {
  if (manifestCache) return manifestCache;

  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const res = await fetch('/assets/manifest.json');
        if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
        const data = await res.json();

        manifestCache = new Map();

        if (Array.isArray(data)) {
          // Array format: [{ url, localPath }, ...]
          for (const entry of data) {
            if (entry.url && entry.localPath) {
              manifestCache.set(entry.url, entry.localPath);
            }
          }
        } else if (data && typeof data === 'object') {
          // Object format: { "original_url": "local_path", ... }
          // Also handles { assets: [...] } wrapper
          if (Array.isArray(data.assets)) {
            for (const entry of data.assets) {
              if (entry.url && entry.localPath) {
                manifestCache.set(entry.url, entry.localPath);
              }
            }
          } else {
            for (const [url, localPath] of Object.entries(data)) {
              if (typeof localPath === 'string') {
                manifestCache.set(url, localPath);
              }
            }
          }
        }
      } catch (err) {
        console.warn('[AssetResolver] Could not load manifest, using fallbacks:', err.message);
        manifestCache = new Map();
      }
    })();
  }

  await loadPromise;
  return manifestCache;
}

// ─── SVG Fallbacks ──────────────────────────────────────────────────────────────

/**
 * Encodes an SVG string as a data-URI.
 * @param {string} svg
 * @returns {string}
 */
const toDataUri = (svg) =>
  `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;

/** @type {Record<string, string>} Themed SVG fallbacks keyed by asset type */
const FALLBACKS = {
  hero: toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <defs>
    <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="80" height="80" rx="12" fill="url(#hg)"/>
  <circle cx="40" cy="30" r="12" fill="#fff" opacity=".85"/>
  <path d="M20 65c0-11 9-20 20-20s20 9 20 20" fill="#fff" opacity=".65"/>
</svg>`),

  item: toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <defs>
    <linearGradient id="ig" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#ef4444"/>
    </linearGradient>
  </defs>
  <rect width="80" height="80" rx="12" fill="url(#ig)"/>
  <rect x="24" y="18" width="32" height="44" rx="4" fill="#fff" opacity=".8"/>
  <path d="M32 34h16M32 42h12" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
</svg>`),

  spell: toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <defs>
    <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  <rect width="80" height="80" rx="12" fill="url(#sg)"/>
  <polygon points="40,14 48,34 68,34 52,46 58,66 40,54 22,66 28,46 12,34 32,34"
           fill="#fff" opacity=".85"/>
</svg>`),

  emblem: toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <defs>
    <linearGradient id="eg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <rect width="80" height="80" rx="12" fill="url(#eg)"/>
  <circle cx="40" cy="40" r="20" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/>
  <circle cx="40" cy="40" r="10" fill="#fff" opacity=".75"/>
</svg>`),

  skill: toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <defs>
    <linearGradient id="kg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ec4899"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="80" height="80" rx="12" fill="url(#kg)"/>
  <path d="M40 16l6 18h18l-14 10 5 18-15-11-15 11 5-18-14-10h18z"
        fill="#fff" opacity=".85"/>
</svg>`),
};

/** Returns the appropriate SVG fallback for the given type */
const getFallback = (type) => FALLBACKS[type] ?? FALLBACKS.hero;

// ─── Core Resolver ──────────────────────────────────────────────────────────────

/**
 * Resolves a URL to a usable local path using the asset manifest, or
 * returns a themed fallback.
 * @param {string} url   - The original URL / path to resolve.
 * @param {string} [type='hero'] - Asset type for fallback selection.
 * @returns {Promise<string>} Resolved path or data-URI.
 */
async function resolveUrl(url, type = 'hero') {
  if (!url) return getFallback(type);

  // Already a local path
  if (url.startsWith('/')) return url;

  const manifest = await ensureManifest();
  const localPath = manifest.get(url);
  if (localPath) return localPath;

  return getFallback(type);
}

// ─── Public API ─────────────────────────────────────────────────────────────────

/**
 * Stateless asset resolution service for MLBB companion assets.
 * All methods return a Promise<string> resolving to a usable image source.
 */
export const AssetResolver = {
  /**
   * Get the avatar image for a hero.
   * @param {number|string} heroId
   * @returns {Promise<string>}
   */
  async getHeroAvatar(heroId) {
    return resolveUrl(`/data/heroes/${heroId}/avatar.png`, 'hero');
  },

  /**
   * Get the splash art for a hero.
   * @param {number|string} heroId
   * @returns {Promise<string>}
   */
  async getHeroSplash(heroId) {
    return resolveUrl(`/data/heroes/${heroId}/splash.png`, 'hero');
  },

  /**
   * Get the icon for an item (by ID or name).
   * @param {number|string} itemIdOrName
   * @returns {Promise<string>}
   */
  async getItemIcon(itemIdOrName) {
    return resolveUrl(`/data/items/${itemIdOrName}/icon.png`, 'item');
  },

  /**
   * Get the icon for a battle spell.
   * @param {string} spellName
   * @returns {Promise<string>}
   */
  async getSpellIcon(spellName) {
    return resolveUrl(`/data/spells/${spellName}/icon.png`, 'spell');
  },

  /**
   * Get the icon for an emblem set.
   * @param {string} emblemName
   * @returns {Promise<string>}
   */
  async getEmblemIcon(emblemName) {
    return resolveUrl(`/data/emblems/${emblemName}/icon.png`, 'emblem');
  },

  /**
   * Get the icon for an emblem talent.
   * @param {string} talentName
   * @returns {Promise<string>}
   */
  async getTalentIcon(talentName) {
    return resolveUrl(`/data/talents/${talentName}/icon.png`, 'skill');
  },

  /**
   * Generic resolver — pass any URL and get back a usable path.
   * @param {string} url
   * @returns {Promise<string>}
   */
  async resolve(url) {
    return resolveUrl(url, 'hero');
  },
};
