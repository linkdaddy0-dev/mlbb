/**
 * @module RecoveryModeService
 * Boot integrity check and database recovery for the MLBB companion app.
 *
 * Checks:
 *   1. Dexie database can be opened successfully
 *   2. Critical object stores exist (heroes, patch_metadata)
 *   3. At least one patch is marked as loaded
 *
 * Recovery:
 *   Deletes the entire database and lets Dexie recreate the schema on next boot.
 */

import Dexie from 'dexie';
import { db } from '../database/db.js';

const PREFIX = '[RecoveryMode]';

/**
 * Runs a full integrity check against the MLBB database.
 * @returns {Promise<{ ok: boolean, issues: string[] }>}
 */
async function checkIntegrity() {
  /** @type {string[]} */
  const issues = [];

  // ── 1. Can the database be opened? ──────────────────────────────────────────
  try {
    console.log(`${PREFIX} Opening database...`);
    await db.open();
    console.log(`${PREFIX} Database opened successfully.`);
  } catch (err) {
    const msg = `Database could not be opened: ${err.message}`;
    console.error(`${PREFIX} ${msg}`);
    issues.push(msg);
    return { ok: false, issues };
  }

  // ── 2. Do the critical stores exist? ────────────────────────────────────────
  try {
    const storeNames = db.tables.map((t) => t.name);
    console.log(`${PREFIX} Found stores: ${storeNames.join(', ')}`);

    for (const required of ['heroes', 'patch_metadata']) {
      if (!storeNames.includes(required)) {
        issues.push(`Missing critical store: "${required}"`);
      }
    }
  } catch (err) {
    issues.push(`Could not enumerate stores: ${err.message}`);
  }

  // ── 3. Is at least one patch loaded? ────────────────────────────────────────
  try {
    const patches = await db.table('patch_metadata').toArray();
    const loaded = patches.filter((p) => p.is_loaded === 1);
    console.log(
      `${PREFIX} Patches found: ${patches.length}, loaded: ${loaded.length}`
    );
    if (loaded.length === 0) {
      issues.push('No patch data has been loaded yet');
    }
  } catch (err) {
    issues.push(`Could not read patch_metadata: ${err.message}`);
  }

  const ok = issues.length === 0;
  console.log(
    ok
      ? `${PREFIX} Integrity check passed ✓`
      : `${PREFIX} Integrity check found ${issues.length} issue(s)`
  );

  return { ok, issues };
}

/**
 * Attempts a full database recovery by deleting and allowing Dexie to
 * recreate the schema on next open().
 * @returns {Promise<{ recovered: boolean, error?: string }>}
 */
async function recover() {
  console.warn(`${PREFIX} Starting database recovery...`);

  try {
    // Close any open connections first
    db.close();
    console.log(`${PREFIX} Closed existing database connection.`);

    // Delete the entire database
    await Dexie.delete('MLBBCompanionDB');
    console.log(`${PREFIX} Database deleted successfully.`);

    // Re-open so Dexie recreates the schema
    await db.open();
    console.log(`${PREFIX} Database recreated and opened. Recovery complete ✓`);

    return { recovered: true };
  } catch (err) {
    const errorMsg = `Recovery failed: ${err.message}`;
    console.error(`${PREFIX} ${errorMsg}`);
    return { recovered: false, error: errorMsg };
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────────

export const RecoveryModeService = {
  checkIntegrity,
  recover,
};
