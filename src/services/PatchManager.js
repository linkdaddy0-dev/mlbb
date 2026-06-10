/**
 * @module PatchManager
 * Transactional OTA Patch Installer and version manager for the MLBB companion app.
 *
 * Implements atomic, transaction-safe patch updates:
 *   [Download/Fetch Index] ➔ [Stage Heroes Guides] ➔ [Validate with Zod] ➔ [Atomic Dexie Commit] ➔ [Set Active Version]
 *
 * Any failure during staging or validation aborts the transaction, leaving
 * the database fully intact with the last stable active version.
 */

import { z } from 'zod';
import { db, PatchRepository, HeroRepository, ItemRepository, SpellRepository, EmblemRepository } from '../database/db.js';
import { 
  HeroSchema, 
  HeroBatchSchema, 
  ItemBatchSchema, 
  SpellBatchSchema, 
  EmblemBatchSchema, 
  PatchManifestSchema 
} from '../schemas/index.js';
import { TelemetryService } from './TelemetryService.js';

const PREFIX = '[PatchManager]';

/**
 * Concurrency-limiting helper.
 * Executes tasks concurrently up to a specified maximum.
 * @template T
 * @param {(() => Promise<T>)[]} tasks
 * @param {number} limit
 * @returns {Promise<T[]>}
 */
async function limitConcurrency(tasks, limit) {
  const results = [];
  const executing = new Set();
  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

export const PatchManager = {
  /**
   * Electronically verifies and transactionally installs a patch by version.
   * Feeds patch records securely from native bundles or dynamic update endpoints.
   * @param {string} version - Patch version (e.g. '1.8.84').
   * @param {string} lang - Locale code (e.g. 'en').
   * @param {string} [apiBaseUrl] - Optional API base URL override (defaults to window.location.origin).
   * @returns {Promise<{ ok: boolean, error?: string }>}
   */
  async installPatch(version, lang, apiBaseUrl) {
    const base = apiBaseUrl || window.location.origin;
    const logData = { version, lang, apiBaseUrl };
    console.log(`${PREFIX} Starting transactional install for patch v${version} (${lang}) from base ${base}...`);
    TelemetryService.log('patch_install_start', logData);

    try {
      // ── Step 1. Check if patch is already loaded ────────────────────────────────
      const alreadyLoaded = await PatchRepository.isPatchLoaded(version, lang);
      if (alreadyLoaded) {
        console.log(`${PREFIX} Patch v${version} (${lang}) already loaded in database.`);
        return { ok: true };
      }

      // ── Step 2. Fetch the roster index file ─────────────────────────────────────
      const indexUrl = `${base}/data/patches/${version}/${lang}/heroes/index.json`;
      console.log(`${PREFIX} Fetching index: ${indexUrl}`);
      const indexRes = await fetch(indexUrl);
      if (!indexRes.ok) {
        throw new Error(`Failed to fetch patch index: HTTP ${indexRes.status}`);
      }
      const indexData = await indexRes.json();

      // ── Step 3. Validate Roster Index with Zod ──────────────────────────────────
      console.log(`${PREFIX} Validating roster index schema with Zod...`);
      const parsedRoster = HeroBatchSchema.parse(indexData);
      console.log(`${PREFIX} Roster index is valid. Total heroes to stage: ${parsedRoster.length}`);

      // ── Step 4. Stage and download all individual detailed hero profiles ─────────
      console.log(`${PREFIX} Staging detailed hero guides (Max 5 concurrent downloads)...`);
      const downloadTasks = parsedRoster.map((hero) => async () => {
        const heroUrl = `${base}/data/patches/${version}/${lang}/heroes/${hero.id}.json`;
        const res = await fetch(heroUrl);
        if (!res.ok) {
          throw new Error(`Failed to download profile for hero ID ${hero.id}: HTTP ${res.status}`);
        }
        const heroData = await res.json();
        // Tag with patchVersion
        return {
          ...heroData,
          id: Number(heroData.id),
          win_rate: Number(heroData.win_rate || hero.win_rate || 50.0),
          pick_rate: Number(heroData.pick_rate || hero.pick_rate || 10.0),
          ban_rate: Number(heroData.ban_rate || hero.ban_rate || 1.0),
          patchVersion: version
        };
      });

      const stagedHeroes = await limitConcurrency(downloadTasks, 5);
      console.log(`${PREFIX} All ${stagedHeroes.length} hero guides downloaded. Validating individual records...`);

      // Validate each staged hero guide against Zod schema
      for (const staged of stagedHeroes) {
        HeroSchema.parse(staged);
      }
      console.log(`${PREFIX} Verification check complete ✓ All staged records are schema-compliant.`);

      // ── Step 5. Commit atomically in a single IndexedDB / Dexie transaction ───
      console.log(`${PREFIX} Committing patch atomic transaction...`);
      await db.transaction('rw', [db.heroes, db.patch_metadata], async () => {
        // Safe overwrite: Save the roster and profiles tagged with patchVersion
        await db.heroes.bulkPut(stagedHeroes);

        // Register patch version metadata as fully loaded
        await db.patch_metadata.put({
          version,
          lang,
          is_loaded: 1,
          loaded_at: new Date().toISOString()
        });
      });

      console.log(`${PREFIX} Patch v${version} (${lang}) committed and activated successfully ✓`);
      TelemetryService.log('patch_install_success', logData);
      return { ok: true };

    } catch (err) {
      const errorMsg = err.message || String(err);
      console.error(`${PREFIX} Transaction aborted. Installation failed:`, err);
      TelemetryService.log('patch_install_error', { ...logData, error: errorMsg });
      return { ok: false, error: errorMsg };
    }
  },

  /**
   * Deactivates and deletes all database records associated with a patch version.
   * Rolls back the system safely without soft-bricking.
   * @param {string} version - Patch version to remove.
   * @param {string} lang - Locale of patch.
   * @returns {Promise<{ ok: boolean, error?: string }>}
   */
  async rollbackPatch(version, lang) {
    const logData = { version, lang };
    console.warn(`${PREFIX} Commencing rollback of patch v${version}...`);
    TelemetryService.log('patch_rollback_start', logData);

    try {
      await db.transaction('rw', [db.heroes, db.patch_metadata], async () => {
        // 1. Delete all heroes for this patch version
        const deletedCount = await db.heroes
          .where('patchVersion')
          .equals(version)
          .delete();
        console.log(`${PREFIX} Removed ${deletedCount} hero profile(s) tagged with patchVersion "${version}".`);

        // 2. Remove the version registration metadata
        await db.patch_metadata
          .where({ version, lang })
          .delete();
        console.log(`${PREFIX} Removed patch_metadata record for v${version}.`);
      });

      console.log(`${PREFIX} Rollback of patch v${version} completed successfully ✓`);
      TelemetryService.log('patch_rollback_success', logData);
      return { ok: true };

    } catch (err) {
      const errorMsg = err.message || String(err);
      console.error(`${PREFIX} Rollback failed:`, err);
      TelemetryService.log('patch_rollback_error', { ...logData, error: errorMsg });
      return { ok: false, error: errorMsg };
    }
  }
};
