/**
 * @module PatchGarbageCollector
 * Prunes stale patch data from the MLBB companion database.
 *
 * Keeps the latest N patch versions (by loaded_at timestamp) and deletes all
 * heroes, items, spells, and emblems tagged with older patchVersion values.
 */

import { db } from '../database/db.js';

const PREFIX = '[GarbageCollector]';

// ─── Public API ─────────────────────────────────────────────────────────────────

export const PatchGarbageCollector = {
  /**
   * Removes old patch data, keeping the most recent `keepVersions` patches.
   * @param {number} [keepVersions=2] - Number of latest patch versions to retain.
   * @returns {Promise<{ removed: string[], kept: string[] }>}
   */
  async cleanup(keepVersions = 2) {
    console.log(`${PREFIX} Starting cleanup, keeping latest ${keepVersions} version(s)...`);

    try {
      // Gather all loaded patch metadata, sorted newest-first
      const allPatches = await db.patch_metadata.toArray();
      const sorted = allPatches
        .slice()
        .sort((a, b) => {
          // Sort by loaded_at descending (newest first)
          const tA = a.loaded_at ? new Date(a.loaded_at).getTime() : 0;
          const tB = b.loaded_at ? new Date(b.loaded_at).getTime() : 0;
          return tB - tA;
        });

      const kept = sorted.slice(0, keepVersions).map((p) => p.version);
      const stale = sorted.slice(keepVersions).map((p) => p.version);

      console.log(`${PREFIX} Keeping versions: [${kept.join(', ')}]`);
      console.log(`${PREFIX} Removing versions: [${stale.join(', ')}]`);

      if (stale.length === 0) {
        console.log(`${PREFIX} Nothing to clean up.`);
        return { removed: [], kept };
      }

      // Delete records from each entity store that belong to stale versions
      const entityStores = ['heroes', 'items', 'spells', 'emblems'];

      for (const storeName of entityStores) {
        try {
          const table = db.table(storeName);
          const deleted = await table
            .where('patchVersion')
            .anyOf(stale)
            .delete();
          console.log(`${PREFIX} Deleted ${deleted} record(s) from "${storeName}".`);
        } catch (err) {
          console.warn(`${PREFIX} Could not clean "${storeName}": ${err.message}`);
        }
      }

      // Delete the stale patch_metadata entries
      for (const version of stale) {
        try {
          await db.patch_metadata.where('version').equals(version).delete();
          console.log(`${PREFIX} Removed patch_metadata for version "${version}".`);
        } catch (err) {
          console.warn(`${PREFIX} Could not remove patch_metadata "${version}": ${err.message}`);
        }
      }

      console.log(`${PREFIX} Cleanup complete ✓`);
      return { removed: stale, kept };
    } catch (err) {
      console.error(`${PREFIX} Cleanup failed:`, err);
      return { removed: [], kept: [] };
    }
  },

  /**
   * Returns storage statistics for the MLBB database.
   * @returns {Promise<{ totalRecords: number, patchVersions: string[] }>}
   */
  async getStorageStats() {
    try {
      const entityStores = ['heroes', 'items', 'spells', 'emblems'];
      let totalRecords = 0;

      for (const storeName of entityStores) {
        try {
          const count = await db.table(storeName).count();
          totalRecords += count;
        } catch {
          // store may not exist yet
        }
      }

      const patches = await db.patch_metadata.toArray();
      const patchVersions = patches.map((p) => p.version);

      console.log(
        `${PREFIX} Stats — ${totalRecords} total records across ${patchVersions.length} patch version(s).`
      );

      return { totalRecords, patchVersions };
    } catch (err) {
      console.error(`${PREFIX} Could not gather storage stats:`, err);
      return { totalRecords: 0, patchVersions: [] };
    }
  },
};
