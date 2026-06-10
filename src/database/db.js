import Dexie from 'dexie';

// ─── 1. Initialize Dexie Database ───────────────────────────────────────────────

export const db = new Dexie('MLBBCompanionDB');

// Original v1 schema — required for migration path
db.version(1).stores({
  patches: '[version+lang], version, lang, is_loaded',
  heroes: 'id, name, role, win_rate, pick_rate, ban_rate, lane'
});

// v2 schema — expanded entity stores + new tables
db.version(2)
  .stores({
    // Core entity stores (patchVersion indexed for GC)
    heroes: 'id, name, role, patchVersion, [patchVersion+role]',
    items: 'id, name, category, patchVersion',
    spells: 'name, patchVersion',
    emblems: 'name, patchVersion',

    // Patch & asset management
    patch_metadata: 'version, lang, is_loaded, loaded_at',
    assets: 'url, localPath, hash, category',

    // User data
    user_preferences: 'key, value',
    favorites: '++id, heroId, addedAt',
    recent_history: '++id, type, data, timestamp',

    // Remove legacy v1 table
    patches: null
  })
  .upgrade(async (tx) => {
    // Migrate v1 patches → v2 patch_metadata
    const legacyPatches = await tx.table('patches').toArray();
    if (legacyPatches.length > 0) {
      const migrated = legacyPatches.map((p) => ({
        version: p.version,
        lang: p.lang,
        is_loaded: p.is_loaded,
        loaded_at: new Date().toISOString()
      }));
      await tx.table('patch_metadata').bulkPut(migrated);
      console.log(
        `[DB Migration] Migrated ${migrated.length} legacy patch record(s) to patch_metadata.`
      );
    }
  });

// ─── Helper ─────────────────────────────────────────────────────────────────────

/** Normalise a string for typo-tolerant search. */
const cleanStr = (s) => String(s || '').toLowerCase().trim();

// ─── 2. Repository Layer — Existing (Public API preserved exactly) ──────────────

export const PatchRepository = {
  async getPatchState(version, lang) {
    try {
      return await db.patch_metadata.get({ version, lang });
    } catch (e) {
      return null;
    }
  },

  async setPatchLoaded(version, lang, isLoaded) {
    try {
      await db.patch_metadata.put({
        version,
        lang,
        is_loaded: isLoaded ? 1 : 0,
        loaded_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to write patch load state:', e);
    }
  },

  async isPatchLoaded(version, lang) {
    const state = await this.getPatchState(version, lang);
    return state ? state.is_loaded === 1 : false;
  }
};

export const HeroRepository = {
  async getAllHeroes() {
    try {
      return await db.heroes.toArray();
    } catch (e) {
      return [];
    }
  },

  async getHeroById(id) {
    try {
      return await db.heroes.get(Number(id));
    } catch (e) {
      return null;
    }
  },

  async saveHero(heroData) {
    try {
      await db.heroes.put(heroData);
    } catch (e) {
      console.error(`Failed to cache hero ${heroData.id} details:`, e);
    }
  },

  async saveHeroesBatch(heroesList) {
    try {
      await db.heroes.bulkPut(heroesList);
    } catch (e) {
      console.error('Failed to bulk load heroes index:', e);
    }
  },

  async searchHeroes(query, roleFilter = 'All') {
    try {
      let collection = db.heroes;
      if (roleFilter !== 'All') {
        collection = collection.where('role').equals(roleFilter);
      } else {
        collection = collection.toCollection();
      }

      const all = await collection.toArray();
      if (!query) return all;

      const q = cleanStr(query);
      return all.filter(
        (h) =>
          cleanStr(h.name).includes(q) ||
          cleanStr(h.role).includes(q) ||
          (h.lane && cleanStr(h.lane).includes(q))
      );
    } catch (e) {
      console.error('IndexedDB hero search failed:', e);
      return [];
    }
  }
};

// ─── 3. New Repositories ────────────────────────────────────────────────────────

/**
 * Repository for in-game equipment items.
 */
export const ItemRepository = {
  /**
   * Returns all items in the database.
   * @returns {Promise<object[]>}
   */
  async getAllItems() {
    try {
      return await db.items.toArray();
    } catch (e) {
      console.error('Failed to fetch items:', e);
      return [];
    }
  },

  /**
   * Returns a single item by its numeric ID.
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  async getItemById(id) {
    try {
      return await db.items.get(Number(id));
    } catch (e) {
      return null;
    }
  },

  /**
   * Bulk-inserts / upserts an array of item records.
   * @param {object[]} items
   */
  async saveItemsBatch(items) {
    try {
      await db.items.bulkPut(items);
    } catch (e) {
      console.error('Failed to bulk load items:', e);
    }
  }
};

/**
 * Repository for battle spells.
 */
export const SpellRepository = {
  /**
   * Returns all spells in the database.
   * @returns {Promise<object[]>}
   */
  async getAllSpells() {
    try {
      return await db.spells.toArray();
    } catch (e) {
      console.error('Failed to fetch spells:', e);
      return [];
    }
  },

  /**
   * Bulk-inserts / upserts an array of spell records.
   * @param {object[]} spells
   */
  async saveSpellsBatch(spells) {
    try {
      await db.spells.bulkPut(spells);
    } catch (e) {
      console.error('Failed to bulk load spells:', e);
    }
  }
};

/**
 * Repository for emblem sets.
 */
export const EmblemRepository = {
  /**
   * Returns all emblem sets in the database.
   * @returns {Promise<object[]>}
   */
  async getAllEmblems() {
    try {
      return await db.emblems.toArray();
    } catch (e) {
      console.error('Failed to fetch emblems:', e);
      return [];
    }
  },

  /**
   * Bulk-inserts / upserts an array of emblem records.
   * @param {object[]} emblems
   */
  async saveEmblemsBatch(emblems) {
    try {
      await db.emblems.bulkPut(emblems);
    } catch (e) {
      console.error('Failed to bulk load emblems:', e);
    }
  }
};

/**
 * Repository for user-favorited heroes.
 */
export const FavoritesRepository = {
  /**
   * Returns all favorite entries (newest first).
   * @returns {Promise<object[]>}
   */
  async getFavorites() {
    try {
      return await db.favorites.orderBy('addedAt').reverse().toArray();
    } catch (e) {
      console.error('Failed to fetch favorites:', e);
      return [];
    }
  },

  /**
   * Adds a hero to favorites (no-op if already present).
   * @param {number} heroId
   */
  async addFavorite(heroId) {
    try {
      const existing = await db.favorites.where('heroId').equals(heroId).first();
      if (existing) return;
      await db.favorites.add({
        heroId,
        addedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error(`Failed to add favorite for hero ${heroId}:`, e);
    }
  },

  /**
   * Removes a hero from favorites.
   * @param {number} heroId
   */
  async removeFavorite(heroId) {
    try {
      await db.favorites.where('heroId').equals(heroId).delete();
    } catch (e) {
      console.error(`Failed to remove favorite for hero ${heroId}:`, e);
    }
  },

  /**
   * Checks whether a hero is currently favorited.
   * @param {number} heroId
   * @returns {Promise<boolean>}
   */
  async isFavorite(heroId) {
    try {
      const entry = await db.favorites.where('heroId').equals(heroId).first();
      return !!entry;
    } catch (e) {
      return false;
    }
  }
};

/**
 * Repository for cached / resolved asset entries.
 */
export const AssetRepository = {
  /**
   * Looks up a cached asset by its original URL.
   * @param {string} url
   * @returns {Promise<object|null>}
   */
  async getAssetByUrl(url) {
    try {
      return await db.assets.get(url);
    } catch (e) {
      return null;
    }
  },

  /**
   * Saves (upserts) a single asset entry.
   * @param {{ url: string, localPath: string, hash?: string, category?: string }} assetEntry
   */
  async saveAsset(assetEntry) {
    try {
      await db.assets.put(assetEntry);
    } catch (e) {
      console.error('Failed to save asset entry:', e);
    }
  },

  /**
   * Returns every cached asset entry.
   * @returns {Promise<object[]>}
   */
  async getAllAssets() {
    try {
      return await db.assets.toArray();
    } catch (e) {
      console.error('Failed to fetch assets:', e);
      return [];
    }
  }
};

// ─── 4. Incremental Non-Blocking Background Seeder ──────────────────────────────
// Seeds local individual hero JSON files from the APK assets in non-blocking
// batches into IndexedDB.

let seederActive = false;

export const BackgroundSeeder = {
  async start(version, lang, rosterIndex, apiBaseUrl) {
    if (seederActive) return;
    const base = apiBaseUrl || window.location.origin;

    // Check if patch data is already loaded in IndexedDB
    let alreadyLoaded = await PatchRepository.isPatchLoaded(version, lang);
    
    // Automatic self-healing: if cache exists but contains legacy online CDN URLs, trigger a full database clean and force re-seed
    if (alreadyLoaded) {
      try {
        const sampleHero = await db.heroes.get(1); // Miya is always ID 1
        if (sampleHero && (
          !sampleHero.cover_transparent ||
          (sampleHero.avatar_url && sampleHero.avatar_url.startsWith('http')) ||
          (sampleHero.cover_thumb && sampleHero.cover_thumb.startsWith('http')) ||
          (sampleHero.skills && sampleHero.skills[0] && sampleHero.skills[0].icon && sampleHero.skills[0].icon.startsWith('http')) ||
          (sampleHero.matchups && sampleHero.matchups.synergy && sampleHero.matchups.synergy.icon && sampleHero.matchups.synergy.icon.startsWith('http'))
        )) {
          console.log('[Seeder] Cache missing cover_transparent or contains legacy URLs. Triggering self-healing re-seed.');
          alreadyLoaded = false;
          await PatchRepository.setPatchLoaded(version, lang, false);
          await db.heroes.clear();
        }
      } catch (e) {
        console.warn('[Seeder] Self-healing cache verification encountered an issue, proceeding normally:', e);
      }
    }

    if (alreadyLoaded) {
      console.log(`[Seeder] Patch v${version} (${lang}) is already fully cached in IndexedDB. Skipping seeding.`);
      return;
    }

    seederActive = true;
    console.log(`[Seeder] Initializing incremental background seeder for patch v${version} (${lang}) from base ${base}...`);

    // First ensure the base roster index is cached in IndexedDB (allows fast initial view)
    const normalizedRoster = rosterIndex.map((hero) => ({
      id: Number(hero.id),
      name: hero.name,
      role: hero.role,
      avatar_url: hero.avatar_url || '',
      cover_thumb: hero.cover_thumb || '',
      cover_transparent: hero.cover_transparent || '',
      win_rate: Number(hero.win_rate || 50.0),
      pick_rate: Number(hero.pick_rate || 10.0),
      ban_rate: Number(hero.ban_rate || 1.0),
      lane: hero.lane || 'Gold Lane'
    }));
    await HeroRepository.saveHeroesBatch(normalizedRoster);

    // Queue up the remaining detailed hero profile assets
    const queue = [...normalizedRoster];
    const BATCH_SIZE = 5;
    const BATCH_INTERVAL = 300; // 300ms intervals to keep the UI perfectly thread-safe

    const processNextBatch = async () => {
      if (queue.length === 0) {
        console.log(`[Seeder] All detailed hero guide files compiled and cached in IndexedDB successfully!`);
        await PatchRepository.setPatchLoaded(version, lang, true);
        seederActive = false;
        return;
      }

      const batch = queue.splice(0, BATCH_SIZE);

      try {
        await Promise.all(
          batch.map(async (hero) => {
            // Fetch the individual localized hero guide JSON from APK native assets
            const url = `${base}/data/patches/${version}/${lang}/heroes/${hero.id}.json`;
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              // Cache the full detailed JSON document in IndexedDB
              await HeroRepository.saveHero(data);
            }
          })
        );
      } catch (e) {
        console.warn(`[Seeder] Dynamic seed packet retrieval failed momentarily:`, e);
      }

      // Schedule next batch on macro-task queue to guarantee UI stays buttery-smooth
      setTimeout(processNextBatch, BATCH_INTERVAL);
    };

    // Begin processing
    setTimeout(processNextBatch, BATCH_INTERVAL);
  }
};
