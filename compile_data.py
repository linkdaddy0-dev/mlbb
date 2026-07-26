import os
import json
import re
import shutil
import hashlib
from datetime import datetime

# Build configurations
# GAME_VERSION = The official MLBB game patch (e.g. "2.1.18"). Only changes when Moonton pushes a game update.
# DATA_REVISION = Candidate build number from the compilation timestamp. It is only
#                 published when the compiled payload differs from the last run
#                 (see hash_compiled_payload), so identical data keeps its revision
#                 and clients are not forced into a pointless full re-seed.
GAME_VERSION = "2.1.88"
DATA_REVISION = datetime.utcnow().strftime("%Y%m%d%H%M%S")
LANGUAGES = ['en']
RAW_DIR = os.path.join("data", "raw")
PUBLIC_DATA_DIR = os.path.join("public", "data")
PATCHES_DIR = os.path.join(PUBLIC_DATA_DIR, "patches", GAME_VERSION)
META_DIR = os.path.join(PUBLIC_DATA_DIR, "meta")

def setup_directories(lang):
    """Ensure localized target patches and heroes directories are ready."""
    os.makedirs(META_DIR, exist_ok=True)
    lang_dir = os.path.join(PATCHES_DIR, lang)
    if os.path.exists(lang_dir):
        shutil.rmtree(lang_dir)
    os.makedirs(lang_dir, exist_ok=True)
    os.makedirs(os.path.join(lang_dir, "heroes"), exist_ok=True)

def hash_compiled_payload():
    """
    SHA-256 over every compiled file under PATCHES_DIR, in a stable order.

    Used to decide whether a compile run produced genuinely new data. The hash
    covers file paths as well as contents so an added or removed hero counts as
    a change even if the remaining bytes are identical.
    """
    digest = hashlib.sha256()
    for root, dirs, files in os.walk(PATCHES_DIR):
        dirs.sort()
        for name in sorted(files):
            full = os.path.join(root, name)
            rel = os.path.relpath(full, PATCHES_DIR).replace(os.sep, "/")
            digest.update(rel.encode("utf-8"))
            with open(full, 'rb') as f:
                for chunk in iter(lambda: f.read(65536), b""):
                    digest.update(chunk)
    return digest.hexdigest()


def sanitize_url(url):
    """Normalize relative assets CDN links to absolute HTTPS links."""
    if not url:
        return ""
    url = url.strip()
    if url.startswith("//"):
        return f"https:{url}"
    return url

def clean_html(text):
    """Remove HTML wrappers from description blocks."""
    if not text:
        return ""
    text = re.sub(r'<br\s*/?>', ' ', text)
    text = re.sub(r'</?p>', '', text)
    return text.strip()

def map_role(raw_role):
    """Map class classifications to standard titles."""
    if not raw_role:
        return "Unknown"
    role_lower = raw_role.lower().strip()
    if "marksman" in role_lower: return "Marksman"
    elif "assassin" in role_lower: return "Assassin"
    elif "fighter" in role_lower: return "Fighter"
    elif "mage" in role_lower: return "Mage"
    elif "tank" in role_lower: return "Tank"
    elif "support" in role_lower: return "Support"
    return raw_role.capitalize()

def get_aliases_and_keywords(name, role):
    """Generate search aliases and keywords for high-efficiency typotolerance searches."""
    name_lower = name.lower()
    role_lower = role.lower()
    
    aliases = []
    keywords = f"{name_lower} {role_lower}"
    
    # Common player nickname aliases and key archetypes
    if "miya" in name_lower:
        aliases = ["elf", "archer", "bow"]
        keywords += " gold lane physical scaling attack speed moon bless"
    elif "tigreal" in name_lower:
        aliases = ["tig", "knight", "shield"]
        keywords += " roam tank crowd control push set initiation sacred hammer"
    elif "saber" in name_lower:
        aliases = ["assassin", "ninja", "slash"]
        keywords += " jungle physical pen armor shred burst triple sweep raw execution"
    
    return aliases, keywords

def extract_heroes_from_tips(tips, hero_name_map, current_hero_id):
    if not tips:
        return []
    # Standardize spaces and clean HTML
    tips_clean = re.sub(r'<br\s*/?>', ' ', tips)
    tips_clean = re.sub(r'</?p>', '', tips_clean).strip()
    
    # Split by comma and see if they look like a list of names
    parts = [p.strip() for p in tips_clean.split(',')]
    extracted = []
    
    for p in parts:
        p_lower = p.lower()
        if p_lower in hero_name_map:
            h_id = hero_name_map[p_lower]
            if h_id != current_hero_id:
                extracted.append({
                    "id": h_id,
                    "name": p
                })
                
    if extracted:
        return extracted
        
    # Fallback: scan the entire text for any hero names in our map
    for h_name, h_id in hero_name_map.items():
        if h_id == current_hero_id:
            continue
        pattern = r'\b' + re.escape(h_name) + r'\b'
        if re.search(pattern, tips_clean.lower()):
            extracted.append({
                "id": h_id,
                "name": h_name.capitalize()
            })
            
    return extracted

def get_matchup_reason(hero_name, target_name, target_role, general_desc, relation_type):
    if not general_desc:
        if relation_type == 'synergy':
            return f"Official synergy partner with high teamfight value alongside {target_name}."
        elif relation_type == 'weak_against':
            return f"Vulnerable to {target_name}'s high pressure and counterplay."
        else:
            return f"Counters {target_name} effectively by outplaying their skill kit."

    # Clean inputs for checking
    desc_lower = general_desc.lower()
    target_name_lower = target_name.lower()
    target_role_lower = target_role.lower()

    # If the target hero name is explicitly mentioned in the description (with word boundaries)
    if re.search(rf"\b{re.escape(target_name_lower)}\b", desc_lower, re.IGNORECASE):
        return general_desc

    # Role keywords check (singular/plural) with word boundaries
    role_keywords = {
        "tank": ["tank", "tanks"],
        "assassin": ["assassin", "assassins"],
        "mage": ["mage", "mages"],
        "support": ["support", "supports"],
        "marksman": ["marksman", "marksmen"],
        "fighter": ["fighter", "fighters"]
    }
    keywords = role_keywords.get(target_role_lower, [target_role_lower])
    if any(re.search(rf"\b{re.escape(kw.lower())}s?\b", desc_lower, re.IGNORECASE) for kw in keywords):
        return general_desc

    # Fallback to dynamic matchup-specific description
    if relation_type == 'synergy':
        return f"Combines high utility, excellent lane pressure, and perfect teamfight synergy with {target_name}."
    elif relation_type == 'weak_against':
        return f"Highly vulnerable to {target_name}'s gap closers, target locks, and early game burst potential."
    else:
        return f"Excels against {target_name} in early game lane trades and isolates them effectively in teamfights."

def compile_data():
    """Execute main compiler transformation processes."""
    print("=" * 60)
    print(f"       MYTHICIQ STATIC COMPILER RUN (GAME: {GAME_VERSION} | DATA REV: {DATA_REVISION})       ")
    print("=" * 60)
    
    # Load avatar map generated from official Moonton API
    avatar_map = {}
    avatar_map_path = os.path.join("data", "avatar_map.json")
    if os.path.exists(avatar_map_path):
        try:
            with open(avatar_map_path, 'r', encoding='utf-8') as f:
                avatar_map = json.load(f)
            print(f"Loaded {len(avatar_map)} avatar mappings from Moonton API map.")
        except Exception as e:
            print(f"Error loading avatar_map.json: {e}")

    # Load hero meta stats snapshot for real rates & fallback avatar/cover images
    meta_stats = []
    meta_stats_path = os.path.join("src", "data", "hero_meta_stats.json")
    if os.path.exists(meta_stats_path):
        try:
            with open(meta_stats_path, 'r', encoding='utf-8') as f:
                meta_stats = json.load(f)
            print(f"Loaded {len(meta_stats)} hero meta stats for real rates.")
        except Exception as e:
            print(f"Error loading hero_meta_stats.json: {e}")

    # Build stable ID lookup first; localized names are not reliable join keys.
    id_to_meta = {}
    name_to_meta = {}
    for m in meta_stats:
        if m.get("id") is not None:
            id_to_meta[int(m["id"])] = m
        if "name" in m:
            name_to_meta[m["name"].lower().strip()] = m

    # Try importing hero matchup overrides
    import sys
    sys.path.append(os.path.join(os.path.dirname(__file__), "scripts"))
    try:
        from hero_matchup_overrides import HERO_MATCHUPS
        print(f"Successfully loaded {len(HERO_MATCHUPS)} high-fidelity matchup overrides.")
    except Exception as e:
        print(f"Warning: could not import hero_matchup_overrides: {e}")
        HERO_MATCHUPS = {}

    # Load mirrored local asset manifest to translate online URLs to local offline relative paths
    manifest = {}
    manifest_path = os.path.join("public", "assets", "manifest.json")
    if os.path.exists(manifest_path):
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
            print(f"Loaded {len(manifest)} local asset mappings from manifest.json.")
        except Exception as e:
            print(f"Error loading manifest.json: {e}")

    def resolve_local(url):
        if not url:
            return ""
        url = sanitize_url(url)
        if url.startswith("/"):
            return url
        # 1. Exact match in manifest
        if url in manifest:
            return manifest[url]
        # 2. Check without query parameters
        clean_url = url.split("?")[0]
        if clean_url in manifest:
            return manifest[clean_url]
        # 3. Domain-agnostic match: compare filename in manifest keys
        filename = clean_url.split("/")[-1]
        if filename:
            for m_key, m_val in manifest.items():
                m_clean = m_key.split("?")[0]
                m_filename = m_clean.split("/")[-1]
                if m_filename and m_filename == filename:
                    return m_val
        # 4. Physical file search on disk fallback
        if filename:
            basename_no_ext = os.path.splitext(filename)[0]
            for root_dir in ["heroes", "misc", "items", "spells", "talents", "emblems", "banners"]:
                local_candidate = os.path.join("public", "assets", root_dir, f"{basename_no_ext}.webp")
                if os.path.exists(local_candidate):
                    return f"/assets/{root_dir}/{basename_no_ext}.webp"
        return url

    total_heroes_count = 0
    
    for lang in LANGUAGES:
        lang_raw_dir = os.path.join(RAW_DIR, lang)
        if not os.path.exists(lang_raw_dir):
            print(f"Skipping language {lang.upper()}: Raw directory does not exist.")
            continue
            
        hero_files = [f for f in os.listdir(lang_raw_dir) if f.endswith(".json")]
        if not hero_files:
            print(f"Skipping language {lang.upper()}: No raw hero profiles found.")
            continue
            
        setup_directories(lang)
        print(f"\nCompiling static assets for [{lang.upper()}] ({len(hero_files)} heroes)...")
        
        # In-memory structures
        roster_index = []
        draft_matrix = {}
        search_index = []
        
        # Mappings for compiling references
        hero_id_map = {}
        hero_name_map = {}
        
        loaded_raw = []
        for h_file in hero_files:
            try:
                with open(os.path.join(lang_raw_dir, h_file), 'r', encoding='utf-8') as f:
                    raw_hero = json.load(f)
                loaded_raw.append(raw_hero)
                
                h_id = int(raw_hero.get("heroid"))
                h_name = raw_hero.get("name", "Unknown").strip()
                
                hero_id_map[str(h_id)] = h_name
                hero_name_map[h_name.lower()] = h_id
            except Exception as e:
                print(f"  - Error reading {h_file}: {e}")
                
        if lang == 'en':
            total_heroes_count = len(loaded_raw)
            
        # 1. First Pass: Create lightweight Roster Index and individual Hero Files
        for raw in loaded_raw:
            h_id = int(raw.get("heroid"))
            name = raw.get("name", "Unknown").strip()
            role = map_role(raw.get("type", "Unknown"))
            
            # Map stats
            durability = int(raw.get("alive", 0))
            offense = int(raw.get("phy", 0))
            magic = int(raw.get("mag", 0))
            difficulty = int(raw.get("diff", 0))
            
            h_id_str = str(h_id)
            h_name_lower = name.lower().strip()
            meta = id_to_meta.get(h_id) or name_to_meta.get(h_name_lower, {})

            # Resolve Avatar URL (Local clean WebP prioritised > Moonton API map > Raw key > meta stats)
            avatar_file = f"Hero{h_id:02d}1-icon.webp"
            local_avatar_path = os.path.join("public", "assets", "heroes", avatar_file)
            if os.path.exists(local_avatar_path):
                avatar_url = f"/assets/heroes/{avatar_file}"
            else:
                avatar_url = ""
                if h_id_str in avatar_map:
                    avatar_url = sanitize_url(avatar_map[h_id_str])
                if not avatar_url:
                    avatar_url = sanitize_url(raw.get("key", ""))
                if not avatar_url or "placehold" in avatar_url:
                    avatar_url = sanitize_url(meta.get("avatar_url", ""))
                avatar_url = resolve_local(avatar_url)

            # Resolve Cover URL (Local WebP banner > Raw cover > meta stats cover > avatar fallback)
            banner_file = f"hero_{h_id}.webp"
            local_banner_path = os.path.join("public", "assets", "banners", banner_file)
            if os.path.exists(local_banner_path):
                cover_url = f"/assets/banners/{banner_file}"
            else:
                cover_url = sanitize_url(raw.get("cover_picture", ""))
                if not cover_url or "placehold" in cover_url:
                    cover_url = sanitize_url(meta.get("cover_thumb", ""))
                if not cover_url or "placehold" in cover_url:
                    cover_url = avatar_url
                cover_url = resolve_local(cover_url)

            # Resolve transparent banner if available
            banner_transparent_file = f"hero_{h_id}_transparent.webp"
            local_banner_transparent_path = os.path.join("public", "assets", "banners", banner_transparent_file)
            if os.path.exists(local_banner_transparent_path):
                cover_transparent_url = f"/assets/banners/{banner_transparent_file}"
            else:
                cover_transparent_url = cover_url

            # Esport winrates / pickrates / banrates (meta stats > mathematical fallback)
            win_rate = 50.0 + (h_id % 5) * 0.9
            pick_rate = 5.0 + (h_id % 8) * 1.5
            ban_rate = 1.0 + (h_id % 12) * 2.2
            tier = 'A'
            
            if meta:
                win_rate = meta.get("win_rate", win_rate)
                pick_rate = meta.get("pick_rate", pick_rate)
                ban_rate = meta.get("ban_rate", ban_rate)
                tier = meta.get("tier", 'A')

            official_battle = meta.get("battle_status", {})
            if official_battle:
                durability = int(official_battle.get("durability", durability))
                offense = int(official_battle.get("offense", offense))
                magic = int(official_battle.get("control_effect", magic))
                difficulty = int(official_battle.get("difficulty", difficulty))
                
            # Append to Lightweight Roster Index
            roster_index.append({
                "id": h_id,
                "name": name,
                "role": role,
                "roles": meta.get("roles", [role]),
                "lane": meta.get("lane", "Unknown"),
                "specialties": meta.get("specialties", []),
                "avatar_url": avatar_url,
                "cover_thumb": cover_url,
                "cover_transparent": cover_transparent_url,
                "win_rate": win_rate,
                "pick_rate": pick_rate,
                "ban_rate": ban_rate,
                "rank_stats": meta.get("rank_stats", {}),
                "history": meta.get("history", {}),
                "tier": tier,
                "battle_status": {
                    "durability": durability,
                    "offense": offense,
                    "control_effect": magic,
                    "difficulty": difficulty
                },
                "stats_rank": meta.get("stats_rank"),
                "stats_updated_at": meta.get("stats_updated_at")
            })
            
            # Compile individual skills
            skills = []
            raw_skills = raw.get("skill", {}).get("skill", [])
            for s_idx, s in enumerate(raw_skills):
                skills.append({
                    "name": s.get("name", f"Skill {s_idx}").strip(),
                    "icon": resolve_local(s.get("icon", "")),
                    "description": clean_html(s.get("des", "")),
                    "tips": clean_html(s.get("tips", ""))
                })
                
            # Compile Builds
            gear_raw = raw.get("gear", {}).get("out_pack", [])
            items = []
            for item in gear_raw[:6]:
                equip_data = item.get("equip", {})
                items.append({
                    "id": int(item.get("equipment_id", 0)),
                    "name": equip_data.get("name", "").strip(),
                    "icon": resolve_local(equip_data.get("icon", "")),
                    "des": clean_html(" ".join(equip_data.get("des", [])) if isinstance(equip_data.get("des", []), list) else str(equip_data.get("des", "")))
                })
                
            spells_list = []
            battle_first = raw.get("item", {}).get("battle_first", {}).get("icon", "")
            battle_second = raw.get("item", {}).get("battle_second", {}).get("icon", "")
            if battle_first: spells_list.append(resolve_local(battle_first))
            if battle_second: spells_list.append(resolve_local(battle_second))
            
            build_tips = clean_html(raw.get("gear", {}).get("out_pack_tips", "") or raw.get("item", {}).get("tips", ""))
            
            builds = {
                "spells": spells_list,
                "items": items,
                "tips": build_tips
            }
            
            # Compile Matchups
            match_best = raw.get("counters", {}).get("best", {}) or {}
            match_cnt = raw.get("counters", {}).get("counters", {}) or {}
            match_cntby = raw.get("counters", {}).get("countered", {}) or {}
            
            best_name = (match_best.get("name") or "").strip()
            cnt_name = (match_cnt.get("name") or "").strip()
            cntby_name = (match_cntby.get("name") or "").strip()
            
            matchups = {
                "synergy": {
                    "id": hero_name_map.get(best_name.lower(), 0),
                    "name": best_name,
                    "icon": resolve_local(match_best.get("icon", "")),
                    "tips": clean_html(match_best.get("best_mate_tips", ""))
                },
                "counters": {
                    "id": hero_name_map.get(cnt_name.lower(), 0),
                    "name": cnt_name,
                    "icon": resolve_local(match_cnt.get("icon", "")),
                    "tips": clean_html(match_cnt.get("restrain_hero_tips", ""))
                },
                "countered_by": {
                    "id": hero_name_map.get(cntby_name.lower(), 0),
                    "name": cntby_name,
                    "icon": resolve_local(match_cntby.get("icon", "")),
                    "tips": clean_html(match_cntby.get("by_restrain_tips", ""))
                }
            }
            
            # Export Detailed Single Hero File public/data/patches/version/lang/heroes/[id].json
            hero_details = {
                "id": h_id,
                "name": name,
                "role": role,
                "durability": durability,
                "offense": offense,
                "magic": magic,
                "control_effect": magic,
                "difficulty": difficulty,
                "battle_status": {
                    "durability": durability,
                    "offense": offense,
                    "control_effect": magic,
                    "difficulty": difficulty
                },
                "win_rate": win_rate,
                "pick_rate": pick_rate,
                "ban_rate": ban_rate,
                "rank_stats": meta.get("rank_stats", {}),
                "history": meta.get("history", {}),
                "lane": meta.get("lane", "Unknown"),
                "roles": meta.get("roles", [role]),
                "specialties": meta.get("specialties", []),
                "stats_rank": meta.get("stats_rank"),
                "stats_updated_at": meta.get("stats_updated_at"),
                "avatar_url": avatar_url,
                "cover_url": cover_url,
                "cover_thumb": cover_url,
                "cover_transparent": cover_transparent_url,
                "skills": skills,
                "builds": builds,
                "matchups": matchups
            }
            
            hero_file_path = os.path.join(PATCHES_DIR, lang, "heroes", f"{h_id}.json")
            with open(hero_file_path, 'w', encoding='utf-8') as f:
                json.dump(hero_details, f, ensure_ascii=False, separators=(',', ':'))
                
            # Compile Search indexes
            aliases, keywords = get_aliases_and_keywords(name, role)
            search_index.append({
                "id": h_id,
                "name": name,
                "role": role,
                "normalized_name": name.lower(),
                "aliases": aliases,
                "keywords": keywords
            })
            
            # Initialize Draft Counter-Picker Matrix nodes mapped by integer IDs
            draft_matrix[str(h_id)] = {
                "strong_against": [],
                "weak_against": [],
                "synergy": []
            }
            
        # 2. Second Pass: Integrate official high-fidelity matchups and relations
        print("Integrating official high-fidelity matchups and relations...")
        
        # Load official matchups and relations
        official_matchups = {}
        matchups_path = os.path.join("data", "official_matchups.json")
        if os.path.exists(matchups_path):
            try:
                with open(matchups_path, 'r', encoding='utf-8') as f:
                    official_matchups = json.load(f)
                print(f"  - Loaded {len(official_matchups)} official matchups.")
            except Exception as e:
                print(f"Error loading official_matchups.json: {e}")
            
        official_relations = {}
        relations_path = os.path.join("data", "official_relations.json")
        if os.path.exists(relations_path):
            try:
                with open(relations_path, 'r', encoding='utf-8') as f:
                    official_relations = json.load(f)
                print(f"  - Loaded {len(official_relations)} official relationship texts.")
            except Exception as e:
                print(f"Error loading official_relations.json: {e}")

        for h_key, node in draft_matrix.items():
            h_id_int = int(h_key)
            name = hero_id_map.get(h_key, "Unknown").strip()
            
            # Fetch official relation descriptions
            rel = official_relations.get(h_key, {})
            synergy_desc = rel.get("synergy_desc", "").strip()
            strong_desc = rel.get("strong_desc", "").strip()
            weak_desc = rel.get("weak_desc", "").strip()
            
            # Fetch official matchups
            matchup = official_matchups.get(h_key)
            
            # Apply high-fidelity overrides if available
            if HERO_MATCHUPS and name in HERO_MATCHUPS:
                override = HERO_MATCHUPS[name]
                if not matchup:
                    matchup = {"selected_rank": 101, "counters": [], "teammates": []}
                if "counters" in override:
                    override_ids = {x["heroid"] for x in override["counters"]}
                    filtered_counters = [x for x in matchup.get("counters", []) if x["heroid"] not in override_ids]
                    matchup["counters"] = override["counters"] + filtered_counters
                if "teammates" in override:
                    override_ids = {x["heroid"] for x in override["teammates"]}
                    filtered_teammates = [x for x in matchup.get("teammates", []) if x["heroid"] not in override_ids]
                    matchup["teammates"] = override["teammates"] + filtered_teammates
            
            if matchup:
                # Synergy -> teammates (both positive and negative)
                for item in matchup.get("teammates", []):
                    ref_id = item["heroid"]
                    if str(ref_id) not in hero_id_map:
                        continue
                    ref_name = hero_id_map[str(ref_id)]
                    ref_role = next((h["role"] for h in roster_index if h["id"] == ref_id), "Unknown")
                    score = item["score"]
                    reason = get_matchup_reason(name, ref_name, ref_role, synergy_desc, 'synergy')
                    node["synergy"].append({
                        "id": ref_id,
                        "name": ref_name,
                        "reason": reason,
                        "score": score
                    })
                
                # Weak Against -> counters (both positive and negative)
                for item in matchup.get("counters", []):
                    ref_id = item["heroid"]
                    if str(ref_id) not in hero_id_map:
                        continue
                    ref_name = hero_id_map[str(ref_id)]
                    ref_role = next((h["role"] for h in roster_index if h["id"] == ref_id), "Unknown")
                    score = item["score"]
                    reason = get_matchup_reason(name, ref_name, ref_role, weak_desc, 'weak_against')
                    node["weak_against"].append({
                        "id": ref_id,
                        "name": ref_name,
                        "reason": reason,
                        "score": score
                    })
                
                # Strong Against -> bottom counters (score < 0, converted to positive for backwards compatibility)
                sorted_counters = sorted(matchup.get("counters", []), key=lambda x: x["score"])
                for item in sorted_counters:
                    ref_id = item["heroid"]
                    if str(ref_id) not in hero_id_map:
                        continue
                    score = item["score"]
                    if score >= 0:
                        continue
                    ref_name = hero_id_map[str(ref_id)]
                    ref_role = next((h["role"] for h in roster_index if h["id"] == ref_id), "Unknown")
                    reason = get_matchup_reason(name, ref_name, ref_role, strong_desc, 'strong_against')
                    node["strong_against"].append({
                        "id": ref_id,
                        "name": ref_name,
                        "reason": reason,
                        "score": abs(score)
                    })
            
            # Bulletproof fallbacks if matchups are empty or less than 3
            # A. Synergy Fallback
            if len(node["synergy"]) < 3:
                h_role = next((h["role"] for h in roster_index if h["id"] == h_id_int), "Fighter")
                target_role = "Support" if h_role in ["Marksman", "Mage", "Assassin"] else "Marksman"
                existing = {x["id"] for x in node["synergy"]}
                candidates = [h for h in roster_index if h["id"] != h_id_int and h["role"] == target_role and h["id"] not in existing][:3 - len(node["synergy"])]
                for idx, c in enumerate(candidates):
                    score = round(3.80 - (len(node["synergy"]) + idx) * 0.4, 2)
                    if score < 0.5: score = 0.80
                    reason = get_matchup_reason(name, c["name"], c["role"], synergy_desc, 'synergy')
                    node["synergy"].append({
                        "id": c["id"],
                        "name": c["name"],
                        "reason": reason,
                        "score": score
                    })
                    
            # B. Strong Against Fallback
            if len(node["strong_against"]) < 3:
                h_role = next((h["role"] for h in roster_index if h["id"] == h_id_int), "Fighter")
                target_role = "Marksman" if h_role in ["Assassin", "Fighter"] else "Tank"
                existing = {x["id"] for x in node["strong_against"]}
                candidates = [h for h in roster_index if h["id"] != h_id_int and h["role"] == target_role and h["id"] not in existing][:3 - len(node["strong_against"])]
                for idx, c in enumerate(candidates):
                    score = round(3.26 - (len(node["strong_against"]) + idx) * 0.5, 2)
                    if score < 0.5: score = 0.70
                    reason = get_matchup_reason(name, c["name"], c["role"], strong_desc, 'strong_against')
                    node["strong_against"].append({
                        "id": c["id"],
                        "name": c["name"],
                        "reason": reason,
                        "score": score
                    })
                    
            # C. Weak Against Fallback
            if len(node["weak_against"]) < 3:
                h_role = next((h["role"] for h in roster_index if h["id"] == h_id_int), "Fighter")
                target_role = "Assassin" if h_role in ["Marksman", "Mage"] else "Support"
                existing = {x["id"] for x in node["weak_against"]}
                candidates = [h for h in roster_index if h["id"] != h_id_int and h["role"] == target_role and h["id"] not in existing][:3 - len(node["weak_against"])]
                for idx, c in enumerate(candidates):
                    score = round(-2.52 + (len(node["weak_against"]) + idx) * 0.4, 2)
                    if score > -0.5: score = -0.80
                    reason = get_matchup_reason(name, c["name"], c["role"], weak_desc, 'weak_against')
                    node["weak_against"].append({
                        "id": c["id"],
                        "name": c["name"],
                        "reason": reason,
                        "score": score
                    })

        # Rewrite/update individual hero JSON files with finalized draft matrix & meta relationships
        for h_key, node in draft_matrix.items():
            hero_file_path = os.path.join(PATCHES_DIR, lang, "heroes", f"{h_key}.json")
            if os.path.exists(hero_file_path):
                with open(hero_file_path, 'r', encoding='utf-8') as f:
                    hero_details = json.load(f)
                
                # Fetch avatar/meta info for items
                def build_relationship_item(item):
                    match_hero = next((h for h in roster_index if h["id"] == item["id"]), None)
                    return {
                        "id": item["id"],
                        "name": item["name"],
                        "reason": item["reason"],
                        "score": item["score"],
                        "win_rate": match_hero["win_rate"] if match_hero else 50.0,
                        "icon": match_hero["avatar_url"] if match_hero else ""
                    }
                
                # Build meta_relationships (Optimized with slice and filters to prevent file bloat)
                hero_details["meta_relationships"] = {
                    "compatibility": [build_relationship_item(x) for x in node["synergy"] if x["score"] > 0][:6],
                    "best_counters": [build_relationship_item(x) for x in node["strong_against"]][:6],
                    "most_countered_by": [build_relationship_item(x) for x in node["weak_against"] if x["score"] > 0][:6]
                }
                
                # Update matchups fallback
                primary_synergy = node["synergy"][0] if node["synergy"] else None
                primary_counter = node["strong_against"][0] if node["strong_against"] else None
                primary_countered_by = node["weak_against"][0] if node["weak_against"] else None
                
                hero_details["matchups"] = {
                    "synergy": {
                        "id": primary_synergy["id"] if primary_synergy else 0,
                        "name": primary_synergy["name"] if primary_synergy else "",
                        "icon": next((h["avatar_url"] for h in roster_index if h["id"] == primary_synergy["id"]), "") if primary_synergy else "",
                        "tips": primary_synergy["reason"] if primary_synergy else ""
                    },
                    "counters": {
                        "id": primary_counter["id"] if primary_counter else 0,
                        "name": primary_counter["name"] if primary_counter else "",
                        "icon": next((h["avatar_url"] for h in roster_index if h["id"] == primary_counter["id"]), "") if primary_counter else "",
                        "tips": primary_counter["reason"] if primary_counter else ""
                    },
                    "countered_by": {
                        "id": primary_countered_by["id"] if primary_countered_by else 0,
                        "name": primary_countered_by["name"] if primary_countered_by else "",
                        "icon": next((h["avatar_url"] for h in roster_index if h["id"] == primary_countered_by["id"]), "") if primary_countered_by else "",
                        "tips": primary_countered_by["reason"] if primary_countered_by else ""
                    }
                }
                
                with open(hero_file_path, 'w', encoding='utf-8') as f:
                    json.dump(hero_details, f, ensure_ascii=False, separators=(',', ':'))

        # 3. Third Pass: Write minified collective outputs
        lang_dir = os.path.join(PATCHES_DIR, lang)
        
        # Save heroes/index.json
        with open(os.path.join(lang_dir, "heroes", "index.json"), 'w', encoding='utf-8') as f:
            json.dump(roster_index, f, separators=(',', ':'))
            
        # Save draft_matrix.json
        with open(os.path.join(lang_dir, "draft_matrix.json"), 'w', encoding='utf-8') as f:
            json.dump(draft_matrix, f, separators=(',', ':'))
            
        # Save search_index.json
        with open(os.path.join(lang_dir, "search_index.json"), 'w', encoding='utf-8') as f:
            json.dump(search_index, f, separators=(',', ':'))
            
        print(f"  - Cleaned split-files compiled and minified successfully inside: {lang_dir}")
        
    # Export Patch Metadata index -> public/data/meta/current_patch.json
    #
    # The revision is only bumped when the compiled payload actually changed.
    # Stamping the compile timestamp unconditionally made every daily run look
    # like a new patch, so every installed app re-downloaded all 133 hero files
    # each day for byte-identical data — a lot of chances for a partial seed to
    # go wrong, for no benefit.
    meta_path = os.path.join(META_DIR, "current_patch.json")
    content_hash = hash_compiled_payload()

    previous_meta = {}
    if os.path.exists(meta_path):
        try:
            with open(meta_path, 'r', encoding='utf-8') as f:
                previous_meta = json.load(f)
        except (json.JSONDecodeError, OSError):
            previous_meta = {}

    unchanged = (
        previous_meta.get("content_hash") == content_hash
        and previous_meta.get("current_patch") == GAME_VERSION
        and previous_meta.get("total_heroes") == total_heroes_count
    )

    if unchanged:
        data_revision = previous_meta.get("data_revision", DATA_REVISION)
        last_updated = previous_meta.get("last_updated_time", datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"))
        print(f"\n[PATCH REGISTER] Compiled payload is byte-identical to the last run. Keeping data revision {data_revision} (no client re-seed triggered).")
    else:
        data_revision = DATA_REVISION
        last_updated = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        print(f"\n[PATCH REGISTER] Global patch metadata successfully registered: game v{GAME_VERSION}, data revision {data_revision} ({total_heroes_count} heroes).")

    patch_meta = {
        "current_patch": GAME_VERSION,
        "data_revision": data_revision,
        "last_updated_time": last_updated,
        "total_heroes": total_heroes_count,
        "content_hash": content_hash
    }
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(patch_meta, f, separators=(',', ':'))

    # Mirror English draft_matrix.json to src/data/fallback_matrix.json (with lightweight slicing to prevent bundle bloat)
    en_matrix_path = os.path.join(PUBLIC_DATA_DIR, "patches", GAME_VERSION, "en", "draft_matrix.json")
    if os.path.exists(en_matrix_path):
        with open(en_matrix_path, 'r', encoding='utf-8') as f:
            en_matrix = json.load(f)
        
        # Keep static fallback lightweight (max 6 entries) to prevent static JS bundle size crash
        lightweight_matrix = {}
        for h_id, node in en_matrix.items():
            lightweight_matrix[h_id] = {
                "strong_against": node.get("strong_against", [])[:6],
                "weak_against": node.get("weak_against", [])[:6],
                "synergy": node.get("synergy", [])[:6]
            }
            
        fallback_matrix_path = os.path.join("src", "data", "fallback_matrix.json")
        os.makedirs(os.path.dirname(fallback_matrix_path), exist_ok=True)
        with open(fallback_matrix_path, 'w', encoding='utf-8') as f:
            json.dump(lightweight_matrix, f, indent=2)
        print(f"Successfully mirrored lightweight English draft matrix to: {fallback_matrix_path}")

if __name__ == "__main__":
    compile_data()
