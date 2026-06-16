import os
import json
import logging

LANGUAGES = ['en']
PUBLIC_DATA_DIR = os.path.join("public", "data")
META_DIR = os.path.join(PUBLIC_DATA_DIR, "meta")
LOGS_DIR = os.path.join("logs")

# Configure validator logger
os.makedirs(LOGS_DIR, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(LOGS_DIR, "validator.log"), encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("MLDraftValidator")

def print_status(message, success=True):
    """Log status checks with safe text prefixes to prevent encoding crashes on Windows shell."""
    prefix = "[OK] SUCCESS:" if success else "[WARN] WARNING:"
    if success:
        logger.info(f"{prefix} {message}")
    else:
        logger.warning(f"{prefix} {message}")

def run_diagnostics():
    """Run comprehensive validations on split-files patch directory mappings."""
    logger.info("=" * 60)
    logger.info("           MLDRAFT PRODUCTION SPLIT-DATA VALIDATION RUN           ")
    logger.info("=" * 60)
    
    # 1. Patch Metadata Verification
    patch_path = os.path.join(META_DIR, "current_patch.json")
    if not os.path.exists(patch_path):
        print_status("Global metadata patch metrics file is missing!", success=False)
        return
        
    try:
        with open(patch_path, 'r', encoding='utf-8') as f:
            patch_meta = json.load(f)
        patch_version = patch_meta.get("current_patch")
        total_heroes_meta = patch_meta.get("total_heroes")
        print_status(f"Global patch metrics loaded: version {patch_version}, total heroes: {total_heroes_meta}")
    except Exception as e:
        print_status(f"Failed to read patch metadata: {e}", success=False)
        return
        
    patches_dir = os.path.join(PUBLIC_DATA_DIR, "patches", patch_version)
    if not os.path.exists(patches_dir):
        print_status(f"Compiled patch version folder is missing: {patches_dir}", success=False)
        return
        
    # 2. Localized Datasets Integrity Diagnostics
    for lang in LANGUAGES:
        lang_dir = os.path.join(patches_dir, lang)
        logger.info(f"\nAnalyzing locale: [{lang.upper()}] ...")
        logger.info("-" * 50)
        
        index_path = os.path.join(lang_dir, "heroes", "index.json")
        matrix_path = os.path.join(lang_dir, "draft_matrix.json")
        search_path = os.path.join(lang_dir, "search_index.json")
        
        # Check files existence
        missing_file = False
        for p_file in [index_path, matrix_path, search_path]:
            if not os.path.exists(p_file):
                print_status(f"Missing required file: {os.path.basename(p_file)}", success=False)
                missing_file = True
                
        if missing_file:
            print_status(f"Locale [{lang.upper()}] has incomplete files. Skipping checks.", success=False)
            continue
            
        # Parse data
        try:
            with open(index_path, 'r', encoding='utf-8') as f:
                roster_index = json.load(f)
            with open(matrix_path, 'r', encoding='utf-8') as f:
                matrix = json.load(f)
            with open(search_path, 'r', encoding='utf-8') as f:
                search_index = json.load(f)
        except Exception as e:
            print_status(f"JSON parsing error in [{lang.upper()}]: {e}", success=False)
            continue
            
        print_status(f"Successfully parsed roster index ({len(roster_index)} items), draft_matrix.json ({len(matrix)} nodes), and search_index.json ({len(search_index)} nodes).")
        
        # Collect statistics and validate entries
        hero_ids = set()
        hero_names = set()
        
        duplicate_ids = []
        duplicate_names = []
        
        missing_avatar = 0
        missing_cover_thumb = 0
        
        missing_details_files = []
        empty_skills = 0
        empty_build_items = 0
        empty_matchups = 0
        
        for item in roster_index:
            h_id = item.get("id")
            name = item.get("name")
            
            # Check duplicates
            if h_id in hero_ids:
                duplicate_ids.append(h_id)
            hero_ids.add(h_id)
            
            if name.lower() in hero_names:
                duplicate_names.append(name)
            hero_names.add(name.lower())
            
            # Check basic properties
            if not item.get("avatar_url"):
                missing_avatar += 1
            if not item.get("cover_thumb"):
                missing_cover_thumb += 1
                
            # Verify individual hero detail file exists: heroes/[id].json
            detail_file_path = os.path.join(lang_dir, "heroes", f"{h_id}.json")
            if not os.path.exists(detail_file_path):
                missing_details_files.append(h_id)
            else:
                # Load detail file to assert profile sanity
                try:
                    with open(detail_file_path, 'r', encoding='utf-8') as df:
                        details = json.load(df)
                    
                    skills = details.get("skills", [])
                    if not skills or len(skills) < 3:
                        empty_skills += 1
                        
                    builds = details.get("builds", {}).get("items", [])
                    if not builds or len(builds) < 6:
                        empty_build_items += 1
                        
                    matchups = details.get("matchups", {})
                    if not matchups.get("synergy", {}).get("name") and not matchups.get("counters", {}).get("name") and not matchups.get("countered_by", {}).get("name"):
                        empty_matchups += 1
                except Exception as de_err:
                    print_status(f"Hero {h_id} detail file is corrupted: {de_err}", success=False)
                    
        # Report telemetry
        if duplicate_ids:
            print_status(f"Found duplicate hero IDs in roster index: {duplicate_ids}", success=False)
        else:
            print_status("No duplicate hero IDs detected in roster index.")
            
        if duplicate_names:
            print_status(f"Found duplicate hero names in roster index: {duplicate_names}", success=False)
        else:
            print_status("No duplicate hero names detected in roster index.")
            
        if missing_details_files:
            print_status(f"Found missing individual hero detail files: {missing_details_files}", success=False)
        else:
            print_status("All individual hero detail files are successfully generated.")
            
        if missing_avatar > 0:
            print_status(f"Found {missing_avatar} heroes missing avatar URLs.", success=False)
        else:
            print_status("All heroes contain valid avatar CDN paths.")
            
        if missing_cover_thumb > 0:
            print_status(f"Found {missing_cover_thumb} heroes missing cover thumbs.", success=False)
        else:
            print_status("All heroes contain valid cover thumb CDN paths.")
            
        if empty_skills > 0:
            print_status(f"Found {empty_skills} heroes with empty or incomplete skill lists.", success=False)
        else:
            print_status("All hero detailed cards have complete active skills listings.")
            
        if empty_build_items > 0:
            print_status(f"Found {empty_build_items} heroes with incomplete item builds.", success=False)
        else:
            print_status("All hero detailed cards have complete 6-item pro builds.")
            
        if empty_matchups > 0:
            print_status(f"Found {empty_matchups} heroes with empty counter pairings.", success=False)
        else:
            print_status("All hero detailed cards contain counter and synergy pairings.")
            
        # Matchup indexing ID sanity check
        matrix_errors = 0
        for h_id_str, node in matrix.items():
            for relation in ["strong_against", "weak_against", "synergy"]:
                for item in node.get(relation, []):
                    target_id = item.get("id")
                    if target_id and target_id not in hero_ids:
                        matrix_errors += 1
                        
        if matrix_errors > 0:
            print_status(f"Found {matrix_errors} counter matchup ID references to missing heroes in draft matrix!", success=False)
        else:
            print_status("All draft matrix counter mappings are 100% consistent with the active roster index.")
            
    logger.info("\n" + "=" * 60)
    logger.info("TELEMETRY CHECK COMPLETE: DIAGNOSTIC LOGGED SUCCESSFULLY")
    logger.info("=" * 60)

if __name__ == "__main__":
    run_diagnostics()
