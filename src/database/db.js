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

// Dexie/IndexedDB cannot change a store's primary key in place. Remove the
// disposable language caches first, then recreate them with composite keys.
db.version(3)
  .stores({
    heroes: null,
    items: 'id, name, category, patchVersion',
    spells: 'name, patchVersion',
    emblems: 'name, patchVersion',
    patch_metadata: null,
    assets: 'url, localPath, hash, category',
    user_preferences: 'key, value',
    favorites: '++id, heroId, addedAt',
    recent_history: '++id, type, data, timestamp'
  });

// v4 schema — multilingual caches use language-aware composite primary keys.
db.version(4).stores({
  heroes: '[id+lang], id, lang, name, role, patchVersion, [patchVersion+role]',
  items: 'id, name, category, patchVersion',
  spells: 'name, patchVersion',
  emblems: 'name, patchVersion',
  patch_metadata: '[version+lang], version, lang, is_loaded, loaded_at',
  assets: 'url, localPath, hash, category',
  user_preferences: 'key, value',
  favorites: '++id, heroId, addedAt',
  recent_history: '++id, type, data, timestamp'
});

// ─── Helper ─────────────────────────────────────────────────────────────────────

/** Normalise a string for typo-tolerant search. */
const cleanStr = (s) => String(s || '').toLowerCase().trim();

// ─── 2. Repository Layer — Existing (Public API preserved exactly) ──────────────

export const PatchRepository = {
  async getPatchState(version, lang) {
    try {
      return await db.patch_metadata.get([version, lang]);
    } catch (e) {
      return null;
    }
  },

  async setPatchLoaded(version, lang, isLoaded, revision) {
    try {
      await db.patch_metadata.put({
        version,
        lang,
        is_loaded: isLoaded ? 1 : 0,
        loaded_at: new Date().toISOString(),
        revision: revision || ''
      });
    } catch (e) {
      console.error('Failed to write patch load state:', e);
    }
  },

  async isPatchLoaded(version, lang, revision) {
    const state = await this.getPatchState(version, lang);
    if (!state) return false;
    if (state.is_loaded !== 1) return false;
    if (revision && state.revision !== revision) return false;
    return true;
  }
};

export const HeroRepository = {
  async getAllHeroes(lang = 'en') {
    try {
      return await db.heroes.where('lang').equals(lang).toArray();
    } catch (e) {
      return [];
    }
  },

  async getHeroById(id, lang = 'en') {
    try {
      return await db.heroes.get([Number(id), lang]);
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

  async searchHeroes(query, roleFilter = 'All', lang = 'en') {
    try {
      let collection = db.heroes;
      if (roleFilter !== 'All') {
        collection = collection.where('role').equals(roleFilter);
      } else {
        collection = collection.toCollection();
      }

      let all = await collection.toArray();
      all = all.filter((h) => h.lang === lang);

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

const activeSeeders = new Set();

/**
 * Heroes sampled by the self-healing check. Spread across the roster so a
 * partially-stale cache is detected — checking only ID 1 let every other hero
 * keep serving pre-migration records forever.
 */
const SELF_HEAL_SAMPLE_IDS = [1, 17, 34, 51, 68, 85, 102, 119, 133];

/** True when a cached hero record is unusable / from a pre-migration build. */
export const isStaleHeroRecord = (hero, revision) => {
  if (!hero) return true;
  if (!hero.cover_transparent) return true;
  // An unstamped record was written by a build older than the revision-tracking
  // seeder — force one clean re-seed so pre-existing corrupt caches get flushed.
  if (revision && !hero.dataRevision) return true;
  if (revision && hero.dataRevision !== revision) return true;
  const looksRemote = (v) => typeof v === 'string' && v.startsWith('http');
  if (looksRemote(hero.cover_thumb)) return true;
  if (hero.skills && hero.skills[0] && looksRemote(hero.skills[0].icon)) return true;
  if (hero.matchups && hero.matchups.synergy && looksRemote(hero.matchups.synergy.icon)) return true;
  return false;
};

export const BackgroundSeeder = {
  async start(version, lang, rosterIndex, apiBaseUrl, revision) {
    const seederKey = `${version}:${lang}`;
    if (activeSeeders.has(seederKey)) return;
    const base = apiBaseUrl || window.location.origin;

    // Check if patch data is already loaded in IndexedDB
    let alreadyLoaded = await PatchRepository.isPatchLoaded(version, lang, revision);

    // Check if hero count in IndexedDB is less than the rosterIndex length (handles newly added heroes)
    if (alreadyLoaded) {
      try {
        const dbHeroCount = await db.heroes.where('lang').equals(lang).count();
        if (dbHeroCount < rosterIndex.length) {
          console.log(`[Seeder] IndexedDB hero count (${dbHeroCount}) is less than roster index length (${rosterIndex.length}). Force re-seed.`);
          alreadyLoaded = false;
        }
      } catch (e) {
        console.warn('[Seeder] Hero count verification check failed, proceeding normally:', e);
      }
    }

    // Automatic self-healing: if the cache is missing local art or still holds
    // legacy online CDN URLs, force a re-seed. Sample several heroes — a single
    // sample lets the rest of the roster rot unnoticed.
    if (alreadyLoaded) {
      try {
        const samples = await Promise.all(
          SELF_HEAL_SAMPLE_IDS.map((id) => HeroRepository.getHeroById(id, lang))
        );
        const present = samples.filter(Boolean);
        const stale = present.filter((h) => isStaleHeroRecord(h, revision));
        if (stale.length > 0) {
          console.log(`[Seeder] ${stale.length}/${present.length} sampled heroes are stale (missing local art, legacy URLs, or an old revision). Triggering self-healing re-seed.`);
          alreadyLoaded = false;
          await PatchRepository.setPatchLoaded(version, lang, false);
          await db.heroes.where('lang').equals(lang).delete();
        }
      } catch (e) {
        console.warn('[Seeder] Self-healing cache verification encountered an issue, proceeding normally:', e);
      }
    }

    if (alreadyLoaded) {
      console.log(`[Seeder] Patch v${version} (${lang}) is already fully cached in IndexedDB. Skipping seeding.`);
      return;
    }

    activeSeeders.add(seederKey);
    console.log(`[Seeder] Initializing incremental background seeder for patch v${version} (${lang}) from base ${base}...`);

    // First ensure the base roster index is cached in IndexedDB (allows fast initial view)
    const normalizedRoster = rosterIndex.map((hero) => ({
      id: Number(hero.id),
      lang: lang,
      patchVersion: version,
      dataRevision: revision || '',
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

    // Index rows by id so detail documents can inherit roster-only fields
    // (cover_transparent, lane, …) instead of dropping them on write.
    const rosterById = new Map(normalizedRoster.map((h) => [h.id, h]));

    // Queue up the remaining detailed hero profile assets
    let queue = [...normalizedRoster];
    const BATCH_SIZE = 5;
    const BATCH_INTERVAL = 300; // 300ms intervals to keep the UI perfectly thread-safe
    const MAX_PASSES = 3;       // retry sweeps over whatever failed

    let pass = 1;
    let failed = [];

    const fetchHero = async (hero) => {
      const revisionQuery = revision ? `?v=${encodeURIComponent(revision)}` : '';
      const url = `${base}/data/patches/${version}/${lang}/heroes/${hero.id}.json${revisionQuery}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rosterRow = rosterById.get(Number(hero.id)) || {};
      // Roster fields first so a thin detail document can never wipe out the
      // local transparent art paths the UI renders the hero background from.
      await HeroRepository.saveHero({
        ...rosterRow,
        ...data,
        id: Number(data.id ?? hero.id),
        lang,
        patchVersion: version,
        dataRevision: revision || '',
        cover_transparent: data.cover_transparent || rosterRow.cover_transparent || '',
        cover_thumb: data.cover_thumb || rosterRow.cover_thumb || '',
        avatar_url: data.avatar_url || rosterRow.avatar_url || ''
      });
    };

    const finish = async () => {
      activeSeeders.delete(seederKey);
      if (failed.length === 0) {
        console.log('[Seeder] All detailed hero guide files compiled and cached in IndexedDB successfully!');
        await PatchRepository.setPatchLoaded(version, lang, true, revision);
        return;
      }
      // Leave the patch marked NOT loaded so the next app launch retries.
      // Marking it loaded here is what used to freeze the app on stale data.
      console.warn(`[Seeder] ${failed.length} hero file(s) could not be retrieved after ${MAX_PASSES} passes: [${failed.slice(0, 10).join(', ')}${failed.length > 10 ? ', …' : ''}]. Patch left incomplete; it will be retried on next launch.`);
      await PatchRepository.setPatchLoaded(version, lang, false);
    };

    const processNextBatch = async () => {
      if (queue.length === 0) {
        if (failed.length > 0 && pass < MAX_PASSES) {
          pass += 1;
          console.log(`[Seeder] Retry pass ${pass}/${MAX_PASSES} for ${failed.length} hero file(s).`);
          queue = failed.map((id) => rosterById.get(id)).filter(Boolean);
          failed = [];
          setTimeout(processNextBatch, BATCH_INTERVAL);
          return;
        }
        await finish();
        return;
      }

      const batch = queue.splice(0, BATCH_SIZE);

      // allSettled, not all: one bad response must not abandon the rest of the batch
      const results = await Promise.allSettled(batch.map(fetchHero));
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          failed.push(Number(batch[i].id));
          console.warn(`[Seeder] Hero ${batch[i].id} seed failed:`, r.reason?.message || r.reason);
        }
      });

      // Schedule next batch on macro-task queue to guarantee UI stays buttery-smooth
      setTimeout(processNextBatch, BATCH_INTERVAL);
    };

    // Begin processing
    setTimeout(processNextBatch, BATCH_INTERVAL);
  }
};
