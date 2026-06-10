/**
 * @module TelemetryService
 * Lightweight local-only telemetry logger for the MLBB companion app.
 *
 * All data stays on-device in localStorage under the 'mlbb_telemetry' key.
 * Uses a circular buffer capped at MAX_ENTRIES (200).
 */

const STORAGE_KEY = 'mlbb_telemetry';
const MAX_ENTRIES = 200;

// ─── Internal Helpers ───────────────────────────────────────────────────────────

/**
 * Reads the current log array from localStorage.
 * @returns {{ timestamp: string, event: string, data: unknown }[]}
 */
function readLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Writes the log array back to localStorage.
 * @param {{ timestamp: string, event: string, data: unknown }[]} logs
 */
function writeLogs(logs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (err) {
    console.warn('[Telemetry] Could not persist logs:', err.message);
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────────

export const TelemetryService = {
  /**
   * Appends an event to the circular buffer.
   * @param {string} event - Event name / type (e.g. 'hero_view', 'search').
   * @param {unknown} [data=null] - Arbitrary payload attached to the entry.
   */
  log(event, data = null) {
    const logs = readLogs();

    logs.push({
      timestamp: new Date().toISOString(),
      event,
      data,
    });

    // Enforce circular buffer limit — drop oldest entries
    while (logs.length > MAX_ENTRIES) {
      logs.shift();
    }

    writeLogs(logs);
  },

  /**
   * Returns the current array of log entries (newest last).
   * @returns {{ timestamp: string, event: string, data: unknown }[]}
   */
  getLogs() {
    return readLogs();
  },

  /**
   * Serialises all current logs into a human-readable string suitable for
   * download or copy-paste debugging.
   * @returns {string}
   */
  exportLogs() {
    const logs = readLogs();
    if (logs.length === 0) return '(no telemetry logs)';

    return logs
      .map(
        (entry) =>
          `[${entry.timestamp}] ${entry.event} ${
            entry.data != null ? JSON.stringify(entry.data) : ''
          }`
      )
      .join('\n');
  },

  /**
   * Removes all stored telemetry logs.
   */
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // silent — storage may be unavailable
    }
  },
};
