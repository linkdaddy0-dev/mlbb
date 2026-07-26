"""
Freshness gate for the daily sync.

The scrapers swallow every exception and exit 0, so a run where Moonton
blocked the runner used to look identical to a successful one: green build,
new commit, new data revision — carrying yesterday's numbers. This script
turns that silent no-op into a failed workflow.

Usage:
    python scripts/verify_sync.py <run_marker_file>

`run_marker_file` is created at the start of the workflow; every critical
output must have been rewritten after it.
"""

import json
import os
import sys

# path -> minimum number of top-level entries expected
CRITICAL_OUTPUTS = {
    os.path.join("data", "official_matchups.json"): 100,
    os.path.join("data", "official_relations.json"): 100,
    os.path.join("src", "data", "hero_meta_stats.json"): 100,
}


def entry_count(payload):
    if isinstance(payload, dict):
        return len(payload)
    if isinstance(payload, list):
        return len(payload)
    return 0


def main():
    if len(sys.argv) < 2:
        print("usage: verify_sync.py <run_marker_file>", file=sys.stderr)
        return 2

    marker = sys.argv[1]
    if not os.path.exists(marker):
        print(f"FAIL: run marker '{marker}' is missing", file=sys.stderr)
        return 2
    marker_mtime = os.path.getmtime(marker)

    failures = []

    for path, minimum in CRITICAL_OUTPUTS.items():
        if not os.path.exists(path):
            failures.append(f"{path}: missing entirely")
            continue

        if os.path.getmtime(path) <= marker_mtime:
            failures.append(
                f"{path}: not rewritten during this run — the scraper that "
                f"produces it failed silently"
            )
            continue

        try:
            with open(path, "r", encoding="utf-8") as f:
                payload = json.load(f)
        except (json.JSONDecodeError, OSError) as err:
            failures.append(f"{path}: unreadable ({err})")
            continue

        count = entry_count(payload)
        if count < minimum:
            failures.append(f"{path}: only {count} entries, expected at least {minimum}")
        else:
            print(f"OK  {path}: {count} entries, freshly written")

    if failures:
        print("\n=== SYNC VERIFICATION FAILED ===", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        print(
            "\nRefusing to compile and publish. Publishing here would bump the "
            "data revision and force every installed app to re-download an "
            "unchanged dataset.",
            file=sys.stderr,
        )
        return 1

    print("\nAll critical scrape outputs are fresh and well-formed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
