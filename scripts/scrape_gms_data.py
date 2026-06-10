import os
import time
import json
import requests

LANGUAGES = ['en', 'id', 'es', 'pt', 'ru', 'tr', 'tl']
RAW_DIR = os.path.join("data", "raw")
MISSING_HERO_IDS = [127, 128, 129, 130, 131, 132]

# Standard spell/build configurations by role class for new heroes with empty recommendmasterplan
SPELLS_BY_ROLE = {
    "Marksman": {
        "first": "https://img.mobilelegends.com/group1/M00/00/06/rB_-LVo8_haATKt0AABH0pUQqEg1474122", # Inspire
        "second": "https://img.mobilelegends.com/group1/M00/00/05/rB_-LVo8_dGAFBn4AABQ7mzW4KI9082406", # Flicker
        "tips": "Flicker is recommended for high mobility; Inspire is great for maximum attack speed."
    },
    "Assassin": {
        "first": "https://img.mobilelegends.com/group1/M00/00/06/rB_-LVo8_k2ADx6dAABFn4q9Ntc1737750", # Retribution
        "second": "https://img.mobilelegends.com/group1/M00/00/06/rB_-LVpAyeqAJzS_AAAFNn9p9k842600", # Execute
        "tips": "Retribution is essential for jungle role; Execute is ideal for secure kills."
    },
    "Tank": {
        "first": "https://img.mobilelegends.com/group1/M00/00/05/rB_-LVo8_dGAFBn4AABQ7mzW4KI9082406", # Flicker
        "second": "https://img.mobilelegends.com/group1/M00/00/06/rB_-LVo8_hCAf6YVAAAFj0D9k1Y338166", # Petrify
        "tips": "Flicker is essential for surprise sets; Petrify is great for extra crowd control."
    },
    "Support": {
        "first": "https://img.mobilelegends.com/group1/M00/00/06/rB_-LVo8_mWAWl9qAAAFz8p7p9I3621440", # Aegis
        "second": "https://img.mobilelegends.com/group1/M00/00/06/rB_-LVo8_iCAeZ55AAAFz8p7p9I3621440", # Revitalize
        "tips": "Aegis is great for shielding allies; Revitalize is ideal for sustain."
    },
    "Mage": {
        "first": "https://img.mobilelegends.com/group1/M00/00/05/rB_-LVo8_dGAFBn4AABQ7mzW4KI9082406", # Flicker
        "second": "https://img.mobilelegends.com/group1/M00/00/06/rB_-LVo8_kCASzSAAAFn4q9Ntc1737750", # Flameshot
        "tips": "Flameshot is great for long range secures; Flicker is key for escapes."
    },
    "Fighter": {
        "first": "https://img.mobilelegends.com/group1/M00/00/05/rB_-LVo8_dGAFBn4AABQ7mzW4KI9082406", # Flicker
        "second": "https://img.mobilelegends.com/group1/M00/00/06/rB_-LVpAye2AJzSAAAFn4q9Ntc1737750", # Vengeance
        "tips": "Vengeance is great for frontline tankiness; Flicker is excellent for gap closing."
    }
}

ITEMS_BY_ROLE = {
    "Marksman": [
        {"id": 2008, "name": "Corrosion Scythe", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/f/f3/Corrosion_Scythe.png", "des": ["Basic Attacks slow targets and grant Attack Speed."]},
        {"id": 2305, "name": "Swift Boots", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/e/e0/Swift_Boots.png", "des": ["Increases Attack Speed and Movement Speed."]},
        {"id": 2006, "name": "Demon Hunter Sword", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/1/1d/Demon_Hunter_Sword.png", "des": ["Basic Attacks deal current enemy HP as extra physical damage."]},
        {"id": 2009, "name": "Golden Staff", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/7/72/Golden_Staff.png", "des": ["Converts critical chance stats into raw attack speed."]},
        {"id": 3002, "name": "Haas' Claws", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/86/Haas%27_Claws.png", "des": ["Grants Physical Lifesteal and attack speed on critical strikes."]},
        {"id": 3001, "name": "Malefic Roar", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/8e/Malefic_Roar.png", "des": ["Boosts Physical Penetration to shred tanks."]}
    ],
    "Fighter": [
        {"id": 2301, "name": "Warrior Boots", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/2/23/Warrior_Boots.png", "des": ["Increases Physical Defense and Movement Speed."]},
        {"id": 2002, "name": "Bloodlust Axe", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/6/66/Bloodlust_Axe.png", "des": ["Grants physical spell lifesteal."]},
        {"id": 2007, "name": "Hunter Strike", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/9/9f/Hunter_Strike.png", "des": ["Deals physical penetration and increases Movement Speed on skill hits."]},
        {"id": 4007, "name": "Oracle", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/2/24/Oracle.png", "des": ["Boosts shield absorption and HP regen effects."]},
        {"id": 2208, "name": "Queen's Wings", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/6/6a/Queen%27s_Wings.png", "des": ["Reduces damage taken when HP is low and grants lifesteal."]},
        {"id": 4005, "name": "Immortality", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/80/Immortality.png", "des": ["Resurrects hero 2.5s after dying, granting shield and HP."]}
    ],
    "Mage": [
        {"id": 2303, "name": "Arcane Boots", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/0/0e/Arcane_Boots.png", "des": ["Increases Magic Penetration and Movement Speed."]},
        {"id": 5002, "name": "Clock of Destiny", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/9/9e/Clock_of_Destiny.png", "des": ["Grants HP and Magic Power stacks over time."]},
        {"id": 5003, "name": "Lightning Truncheon", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/a/a2/Lightning_Truncheon.png", "des": ["Deals extra magic damage echoing to nearby enemies."]},
        {"id": 5001, "name": "Holy Crystal", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/8b/Holy_Crystal.png", "des": ["Massively boosts Magic Power scaling dynamically."]},
        {"id": 5004, "name": "Divine Glaive", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/86/Divine_Glaive.png", "des": ["Increases Magic Penetration, especially against magic def."]},
        {"id": 5005, "name": "Blood Wings", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/1/1b/Blood_Wings.png", "des": ["Grants massive Magic Power and a scaling shield."]}
    ],
    "Support": [
        {"id": 2302, "name": "Demon Shoes", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/2/2f/Demon_Shoes.png", "des": ["Provides massive mana regeneration."]},
        {"id": 4006, "name": "Flask of the Oasis", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/6/67/Flask_of_the_Oasis.png", "des": ["Increases healing/shield effects and grants shield to low-HP allies."]},
        {"id": 4007, "name": "Oracle", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/2/24/Oracle.png", "des": ["Boosts shield absorption and HP regen effects."]},
        {"id": 4005, "name": "Immortality", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/80/Immortality.png", "des": ["Resurrects hero 2.5s after dying, granting shield and HP."]},
        {"id": 4001, "name": "Athena's Shield", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/1/15/Athena%27s_Shield.png", "des": ["Provides massive magic defense and shields against burst magic damage."]},
        {"id": 4002, "name": "Antique Cuirass", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/4/40/Antique_Cuirass.png", "des": ["Reduces enemy physical attack when hit by skills."]}
    ]
}

def clean_html(text):
    """Strip basic HTML formatting tags to match cleaner style."""
    if not text:
        return ""
    import re
    return re.sub(r'<[^>]*>', '', text).strip()

def map_role(raw_role):
    """Normalize raw role classifications."""
    if not raw_role:
        return "Fighter"
    r = raw_role.strip().capitalize()
    if r in ["Marksman", "Assassin", "Tank", "Support", "Mage", "Fighter"]:
        return r
    return "Fighter"

def main():
    print("=" * 60)
    print("       MLDRAFT HIGH-FIDELITY OFFICIAL GMS SCRAPER SYNC RUN       ")
    print("=" * 60)
    
    # 1. Load mappings to resolve relationships
    hero_map = {}
    if os.path.exists("scratch/gms_hero_map.json"):
        with open("scratch/gms_hero_map.json", "r", encoding="utf-8") as f:
            hero_map = json.load(f)
        print(f"Loaded {len(hero_map)} name mappings from gms_hero_map.json")
        
    avatar_map = {}
    if os.path.exists("data/avatar_map.json"):
        with open("data/avatar_map.json", "r", encoding="utf-8") as f:
            avatar_map = json.load(f)
        print(f"Loaded {len(avatar_map)} avatar mappings from avatar_map.json")

    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json"
    })
    
    url = "https://mlbb-ota-proxy.linkdaddy0.workers.dev/gms/api/gms/source/2713644/2766683"
    
    # We will fetch GMS records localized for each language
    localized_data = {}
    for lang in LANGUAGES:
        print(f"Fetching GMS data for locale: [{lang.upper()}] ...")
        # GMS language selection headers
        headers = {
            "X-Lang": lang,
            "Accept-Language": lang
        }
        try:
            r = session.post(url, headers=headers, json={"pageSize": 500}, timeout=25)
            if r.status_code == 200:
                records = r.json().get("data", {}).get("records", [])
                localized_data[lang] = {int(rec.get("data", {}).get("hero_id")): rec for rec in records if rec.get("data", {}).get("hero_id") is not None}
                print(f"  - [{lang.upper()}] Retrieved {len(records)} hero records.")
            else:
                print(f"  - [{lang.upper()}] Failed with status {r.status_code}")
        except Exception as e:
            print(f"  - [{lang.upper()}] Request failed: {e}")
            
    # English acts as our master reference
    en_records = localized_data.get("en", {})
    if not en_records:
        print("Error: Could not retrieve English GMS reference dataset. Scraper execution aborted.")
        return
        
    # We will also auto-resolve target names/avatars using en_records if not in standard map
    def resolve_target(t_id):
        s_id = str(t_id)
        name = hero_map.get(s_id)
        if not name and t_id in en_records:
            name = en_records[t_id].get("data", {}).get("hero", {}).get("data", {}).get("name")
        if not name:
            name = "Miya" # Safe default fallback if ID is 0 or completely undefined
        
        avatar = avatar_map.get(s_id)
        if not avatar and t_id in en_records:
            avatar = en_records[t_id].get("data", {}).get("head")
        if not avatar:
            avatar = "https://akmweb.youngjoygame.com/web/mlweb/image/res/miya/skill/cef8ef47912cced083381c9cf86f35cb.png"
        return name, avatar

    # Ensure output directories exist
    for lang in LANGUAGES:
        os.makedirs(os.path.join(RAW_DIR, lang), exist_ok=True)
        
    # Update local avatar mapping for the missing heroes
    avatars_updated = False
    for h_id in MISSING_HERO_IDS:
        if h_id in en_records:
            avatar_url = en_records[h_id].get("data", {}).get("head")
            if avatar_url:
                avatar_map[str(h_id)] = avatar_url
                avatars_updated = True
                
    if avatars_updated:
        with open("data/avatar_map.json", "w", encoding="utf-8") as f:
            json.dump(avatar_map, f, indent=2)
        print("Successfully synchronized data/avatar_map.json with real GMS heads.")

    print("\nProcessing and generating localized raw JSON files...")
    print("-" * 60)

    for h_id in MISSING_HERO_IDS:
        if h_id not in en_records:
            print(f"Warning: Hero ID {h_id} is completely missing in GMS en database. Skipping.")
            continue
            
        # Get baseline info from English
        en_hero = en_records[h_id].get("data", {})
        en_details = en_hero.get("hero", {}).get("data", {})
        h_name = en_details.get("name", "Unknown")
        
        # Mapped properties
        role = map_role(en_details.get("sortlabel", ["Fighter"])[0])
        spells = SPELLS_BY_ROLE.get(role, SPELLS_BY_ROLE["Fighter"])
        items = ITEMS_BY_ROLE.get(role, ITEMS_BY_ROLE["Fighter"])
        
        abilityshow = en_details.get("abilityshow", ["50", "50", "50", "50"])
        alive = abilityshow[0] if len(abilityshow) > 0 else "50"
        phy = abilityshow[1] if len(abilityshow) > 1 else "50"
        mag = abilityshow[2] if len(abilityshow) > 2 else "50"
        diff = abilityshow[3] if len(abilityshow) > 3 else "50"
        
        painting = en_hero.get("painting") or en_hero.get("head_big") or ""
        
        print(f"Re-creating hero {h_name} (ID: {h_id}) role: {role}...")
        
        # Process every language
        for lang in LANGUAGES:
            lang_records = localized_data.get(lang, {})
            # Fallback to English GMS record if localized record is missing for that hero
            lang_hero = lang_records.get(h_id, en_records[h_id]).get("data", {})
            lang_details = lang_hero.get("hero", {}).get("data", {})
            
            # Localized story/description
            des = clean_html(lang_details.get("story", f"A powerful and tactical {role} in the Land of Dawn."))
            
            # Localized Skills
            skills_list = []
            gms_skills = lang_details.get("heroskilllist", [{}])[0].get("skilllist", [])
            for idx, s in enumerate(gms_skills[:4]):
                skills_list.append({
                    "name": s.get("skillname", f"{h_name} Skill {idx}").strip(),
                    "icon": s.get("skillicon", "https://akmweb.youngjoygame.com/web/gms/image/1d4439a2ab14e995b99fd8934adb34ee.svg"),
                    "des": clean_html(s.get("skilldesc", "A powerful hero skill.")),
                    "tips": clean_html(s.get("skillcd&cost", ""))
                })
                
            # If GMS contains less than 4 skills, fill with placeholder matching skill structures
            while len(skills_list) < 4:
                idx = len(skills_list)
                skills_list.append({
                    "name": f"{h_name} Skill {idx}",
                    "icon": "https://akmweb.youngjoygame.com/web/gms/image/1d4439a2ab14e995b99fd8934adb34ee.svg",
                    "des": "A high-fidelity hero ability.",
                    "tips": ""
                })
                
            # Relations / Counters (We resolve target IDs from this language's GMS relation node)
            rel = lang_hero.get("relation", {})
            
            # 1. Best Mate (Synergy)
            assist_ids = rel.get("assist", {}).get("target_hero_id", [])
            assist_id = next((x for x in assist_ids if x != 0), 0)
            best_mate_name, best_mate_icon = resolve_target(assist_id)
            best_mate_tips = clean_html(rel.get("assist", {}).get("desc", ""))
            if not best_mate_tips:
                best_mate_tips = f"Works perfectly alongside {best_mate_name} to win lane trades and teamfights."
                
            # 2. Counter Target (Counters)
            strong_ids = rel.get("strong", {}).get("target_hero_id", [])
            strong_id = next((x for x in strong_ids if x != 0), 0)
            strong_name, strong_icon = resolve_target(strong_id)
            strong_tips = clean_html(rel.get("strong", {}).get("desc", ""))
            if not strong_tips:
                strong_tips = f"Counters {strong_name} in team fights."
                
            # 3. Countered By
            weak_ids = rel.get("weak", {}).get("target_hero_id", [])
            weak_id = next((x for x in weak_ids if x != 0), 0)
            weak_name, weak_icon = resolve_target(weak_id)
            weak_tips = clean_html(rel.get("weak", {}).get("desc", ""))
            if not weak_tips:
                weak_tips = f"Vulnerable to {weak_name}'s high pressure and counterplay."
                
            # Formulate final Moonton compatible schema
            moonton_format = {
                "cover_picture": painting,
                "gallery_picture": painting,
                "junling": "",
                "cost": "",
                "des": des,
                "mag": mag,
                "phy": phy,
                "alive": alive,
                "diff": diff,
                "name": lang_details.get("name", h_name),
                "type": role,
                "skill": {
                    "skill": skills_list,
                    "item": {
                        "main": {"icon": skills_list[1]["icon"]},
                        "secondary": {"icon": skills_list[2]["icon"]},
                        "battle_first": {"icon": spells["first"]},
                        "battle_second": {"icon": spells["second"]},
                        "tips": spells["tips"]
                    }
                },
                "gear": {
                    "out_pack": [
                        {
                            "equipment_id": item["id"],
                            "equip": {
                                "name": item["name"],
                                "icon": item["icon"],
                                "des": item["des"]
                            }
                        } for item in items
                    ],
                    "out_pack_tips": "Standard builds prioritize cooldown reduction, penetration, and durability for role-specific survival.",
                    "verysix": []
                },
                "counters": {
                    "best": {
                        "heroid": str(assist_id) if assist_id != 0 else None,
                        "best_mate_tips": best_mate_tips,
                        "name": best_mate_name if assist_id != 0 else None,
                        "icon": best_mate_icon
                    },
                    "counters": {
                        "heroid": str(strong_id) if strong_id != 0 else None,
                        "restrain_hero_tips": strong_tips,
                        "name": strong_name if strong_id != 0 else None,
                        "icon": strong_icon
                    },
                    "countered": {
                        "heroid": str(weak_id) if weak_id != 0 else None,
                        "by_restrain_tips": weak_tips,
                        "name": weak_name if weak_id != 0 else None,
                        "icon": weak_icon
                    }
                },
                "heroid": str(h_id)
            }
            
            # Write to localized raw profile file
            dest_file = os.path.join(RAW_DIR, lang, f"hero_{h_id}.json")
            with open(dest_file, "w", encoding="utf-8") as out:
                json.dump(moonton_format, out, indent=2, ensure_ascii=False)
                
        print(f"  - Completed localized Raw JSON profiles for {h_name}")
        
    # 4. Now compile translation files heroes_en.json and heroes_id.json
    print("\nRegenerating compiled translation files inside data/compiled/...")
    print("-" * 60)
    
    compiled_out_dir = os.path.join("data", "compiled")
    os.makedirs(compiled_out_dir, exist_ok=True)
    
    for c_lang in ['en', 'id']:
        lang_dir = os.path.join(RAW_DIR, c_lang)
        merged_list = []
        for file in os.listdir(lang_dir):
            if file.endswith(".json") and file.startswith("hero_"):
                try:
                    with open(os.path.join(lang_dir, file), "r", encoding="utf-8") as f:
                        hero_data = json.load(f)
                        merged_list.append(hero_data)
                except Exception as ex:
                    print(f"Error loading {file} for compilation: {ex}")
                    
        # Sort array by integer hero ID
        merged_list.sort(key=lambda x: int(x.get("heroid", 0)))
        
        c_path = os.path.join(compiled_out_dir, f"heroes_{c_lang}.json")
        with open(c_path, "w", encoding="utf-8") as out_f:
            json.dump(merged_list, out_f, indent=2, ensure_ascii=False)
        print(f"  - Compiled heroes_{c_lang}.json successfully. Total heroes inside: {len(merged_list)}")
        
    print("\nScrape sync process successfully finished!")
    print("=" * 60)

if __name__ == "__main__":
    main()
