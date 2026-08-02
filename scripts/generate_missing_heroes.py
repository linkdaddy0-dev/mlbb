import os
import json

# Target languages
LANGUAGES = ['en', 'id', 'es', 'pt', 'ru', 'tr', 'tl']
RAW_DIR = os.path.join("data", "raw")

# Metadata definitions for the missing heroes based on official_relations
MISSING_HEROES = {
    125: {
        "name": "Zhuxin",
        "role": "Mage",
        "durability": 5,
        "offense": 4,
        "magic": 8,
        "difficulty": 6,
        "best": "Tigreal",
        "counters": "Layla",
        "countered": "Saber"
    },
    126: {
        "name": "Suyou",
        "role": "Assassin",
        "durability": 6,
        "offense": 8,
        "magic": 3,
        "difficulty": 7,
        "best": "Angela",
        "counters": "Miya",
        "countered": "Khufra"
    },
    127: {
        "name": "Lukas",
        "role": "Fighter",
        "durability": 7,
        "offense": 8,
        "magic": 3,
        "difficulty": 6,
        "best": "Atlas",
        "counters": "Hanabi",
        "countered": "Fanny"
    },
    128: {
        "name": "Kalea",
        "role": "Fighter",
        "durability": 8,
        "offense": 6,
        "magic": 4,
        "difficulty": 5,
        "best": "Eudora",
        "counters": "Layla",
        "countered": "Diggie"
    },
    129: {
        "name": "Zetian",
        "role": "Mage",
        "durability": 5,
        "offense": 3,
        "magic": 9,
        "difficulty": 7,
        "best": "Floryn",
        "counters": "Balmond",
        "countered": "Valentina"
    },
    130: {
        "name": "Obsidia",
        "role": "Marksman",
        "durability": 4,
        "offense": 9,
        "magic": 2,
        "difficulty": 6,
        "best": "Angela",
        "counters": "Hayabusa",
        "countered": "Bruno"
    },
    131: {
        "name": "Sora",
        "role": "Fighter",
        "durability": 6,
        "offense": 8,
        "magic": 4,
        "difficulty": 7,
        "best": "Tigreal",
        "counters": "Layla",
        "countered": "Fanny"
    },
    132: {
        "name": "Marcel",
        "role": "Support",
        "durability": 8,
        "offense": 4,
        "magic": 6,
        "difficulty": 5,
        "best": "Hanabi",
        "counters": "Layla",
        "countered": "Ling"
    },
    133: {
        "name": "Hirara",
        "role": "Assassin",
        "durability": 4,
        "offense": 9,
        "magic": 2,
        "difficulty": 9,
        "best": "Angela",
        "counters": "Layla",
        "countered": "Khufra",
        "skills": [
            {
                "name": "Twin Fans: Ukifune",
                "icon": "https://akmweb.youngjoygame.com/web/gms/image/1d4439a2ab14e995b99fd8934adb34ee.svg",
                "des": "Hirara utilizes her twin fans to execute drag-to-merge combo skills. Casting combo skills consumes Crimson Energy charges.",
                "tips": "Energy management is critical; always monitor your Crimson Energy count."
            },
            {
                "name": "Kaerazu",
                "icon": "https://akmweb.youngjoygame.com/web/gms/image/1d4439a2ab14e995b99fd8934adb34ee.svg",
                "des": "Hirara strikes with her primary fan, unleashing a flame wave that deals physical damage to enemies in a fan-shaped area.",
                "tips": "Use this skill for fast jungle clearing and poke damage."
            },
            {
                "name": "Meisen-e",
                "icon": "https://akmweb.youngjoygame.com/web/gms/image/1d4439a2ab14e995b99fd8934adb34ee.svg",
                "des": "Hirara dashes in the target direction, dealing physical damage to enemies along the path.",
                "tips": "This is your main mobility tool; use it to dodge key crowd control skills."
            },
            {
                "name": "Infernal Torrent",
                "icon": "https://akmweb.youngjoygame.com/web/gms/image/1d4439a2ab14e995b99fd8934adb34ee.svg",
                "des": "Hirara merges her twin fans, dashing forward and spinning to deal heavy circular burst damage to all nearby enemies.",
                "tips": "Initiate with this combo when the enemy team is grouped to maximize AoE burst."
            }
        ]
    }
}

def map_to_moonton(h_id, meta):
    role = meta["role"]
    name = meta["name"]
    
    # Base spells by role
    spells_by_role = {
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
    
    role_spells = spells_by_role.get(role, spells_by_role["Marksman"])
    
    # Items
    items_by_role = {
        "Marksman": [
            {"id": "2008", "name": "Corrosion Scythe", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/f/f3/Corrosion_Scythe.png", "des": ["Basic Attacks slow targets and grant Attack Speed."]},
            {"id": "2305", "name": "Swift Boots", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/e/e0/Swift_Boots.png", "des": ["Increases Attack Speed and Movement Speed."]},
            {"id": "2006", "name": "Demon Hunter Sword", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/1/1d/Demon_Hunter_Sword.png", "des": ["Basic Attacks deal current enemy HP as extra physical damage."]},
            {"id": "2009", "name": "Golden Staff", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/7/72/Golden_Staff.png", "des": ["Converts critical chance stats into raw attack speed."]},
            {"id": "3002", "name": "Haas' Claws", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/86/Haas%27_Claws.png", "des": ["Grants Physical Lifesteal and attack speed on critical strikes."]},
            {"id": "3001", "name": "Malefic Roar", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/8e/Malefic_Roar.png", "des": ["Boosts Physical Penetration to shred tanks."]}
        ],
        "Fighter": [
            {"id": "2301", "name": "Warrior Boots", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/2/23/Warrior_Boots.png", "des": ["Increases Physical Defense and Movement Speed."]},
            {"id": "2002", "name": "Bloodlust Axe", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/6/66/Bloodlust_Axe.png", "des": ["Grants physical spell lifesteal."]},
            {"id": "2007", "name": "Hunter Strike", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/9/9f/Hunter_Strike.png", "des": ["Deals physical penetration and increases Movement Speed on skill hits."]},
            {"id": "4007", "name": "Oracle", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/2/24/Oracle.png", "des": ["Boosts shield absorption and HP regen effects."]},
            {"id": "2003", "name": "Queen's Wings", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/6/6a/Queen%27s_Wings.png", "des": ["Reduces damage taken when HP is low and grants lifesteal."]},
            {"id": "4005", "name": "Immortality", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/80/Immortality.png", "des": ["Resurrects hero 2.5s after dying, granting shield and HP."]}
        ],
        "Mage": [
            {"id": "2303", "name": "Arcane Boots", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/0/0e/Arcane_Boots.png", "des": ["Increases Magic Penetration and Movement Speed."]},
            {"id": "5002", "name": "Clock of Destiny", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/9/9e/Clock_of_Destiny.png", "des": ["Grants HP and Magic Power stacks over time."]},
            {"id": "5003", "name": "Lightning Truncheon", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/a/a2/Lightning_Truncheon.png", "des": ["Deals extra magic damage echoing to nearby enemies."]},
            {"id": "5001", "name": "Holy Crystal", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/8b/Holy_Crystal.png", "des": ["Massively boosts Magic Power scaling dynamically."]},
            {"id": "5004", "name": "Divine Glaive", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/86/Divine_Glaive.png", "des": ["Increases Magic Penetration, especially against magic def."]},
            {"id": "5005", "name": "Blood Wings", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/1/1b/Blood_Wings.png", "des": ["Grants massive Magic Power and a scaling shield."]}
        ],
        "Support": [
            {"id": "2302", "name": "Demon Shoes", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/2/2f/Demon_Shoes.png", "des": ["Provides massive mana regeneration."]},
            {"id": "4006", "name": "Flask of the Oasis", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/6/67/Flask_of_the_Oasis.png", "des": ["Increases healing/shield effects and grants shield to low-HP allies."]},
            {"id": "4007", "name": "Oracle", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/2/24/Oracle.png", "des": ["Boosts shield absorption and HP regen effects."]},
            {"id": "4005", "name": "Immortality", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/80/Immortality.png", "des": ["Resurrects hero 2.5s after dying, granting shield and HP."]},
            {"id": "4001", "name": "Athena's Shield", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/1/15/Athena%27s_Shield.png", "des": ["Provides massive magic defense and shields against burst magic damage."]},
            {"id": "4002", "name": "Antique Cuirass", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/4/40/Antique_Cuirass.png", "des": ["Reduces enemy physical attack when hit by skills."]}
        ]
    }
    role_items = items_by_role.get(role, items_by_role["Fighter"])

    # Placeholder avatars
    avatar_url = "https://akmweb.youngjoygame.com/web/mlweb/image/res/miya/skill/cef8ef47912cced083381c9cf86f35cb.png"
    
    skills = meta.get("skills")
    if not skills:
        skills = [
            {
                "name": f"{name} Passive",
                "icon": "https://akmweb.youngjoygame.com/web/gms/image/1d4439a2ab14e995b99fd8934adb34ee.svg",
                "des": f"Unique passive ability for {name} designed for competitive match viability.",
                "tips": "Learn to manage passive triggers to dominate early game trades."
            },
            {
                "name": f"{name} Skill 1",
                "icon": "https://akmweb.youngjoygame.com/web/gms/image/1d4439a2ab14e995b99fd8934adb34ee.svg",
                "des": f"Deals damage and applies control or mobility modifiers.",
                "tips": "Spam this skill to farm quickly and harass enemy laners."
            },
            {
                "name": f"{name} Skill 2",
                "icon": "https://akmweb.youngjoygame.com/web/gms/image/1d4439a2ab14e995b99fd8934adb34ee.svg",
                "des": f"Area control utility with slow/stun application.",
                "tips": "Use this skill defensively or to setup ganks with allies."
            },
            {
                "name": f"{name} Ultimate",
                "icon": "https://akmweb.youngjoygame.com/web/gms/image/1d4439a2ab14e995b99fd8934adb34ee.svg",
                "des": f"High impact Ultimate ability turning the tide of teamfights.",
                "tips": "Coordinate Ultimate activation with teammate crowd control set pieces."
            }
        ]

    moonton_format = {
        "cover_picture": avatar_url,
        "gallery_picture": avatar_url,
        "junling": "",
        "cost": "",
        "des": f"A powerful and tactical {role} in the Land of Dawn.",
        "mag": str(meta["magic"] * 10),
        "phy": str(meta["offense"] * 10),
        "alive": str(meta["durability"] * 10),
        "diff": str(meta["difficulty"] * 10),
        "name": name,
        "type": role,
        "skill": {
            "skill": skills
        },
        "item": {
            "main": {"icon": skills[1]["icon"]},
            "secondary": {"icon": skills[2]["icon"]},
            "battle_first": {"icon": role_spells["first"]},
            "battle_second": {"icon": role_spells["second"]},
            "tips": role_spells["tips"]
        },
        "gear": {
            "out_pack": [
                {
                    "equipment_id": int(item["id"]),
                    "equip": {
                        "name": item["name"],
                        "icon": item["icon"],
                        "des": item["des"]
                    }
                } for item in role_items
            ],
            "out_pack_tips": f"Standard builds prioritize cooldown reduction, penetration, and durability for role-specific survival.",
            "verysix": []
        },
        "counters": {
            "best": {
                "heroid": "0",
                "best_mate_tips": f"Works perfectly alongside {meta['best']} to lock targets and win lane engagements.",
                "name": meta["best"],
                "icon": "https://akmweb.youngjoygame.com/web/gms/image/1d4439a2ab14e995b99fd8934adb34ee.svg"
            },
            "counters": {
                "heroid": "0",
                "restrain_hero_tips": f"Counters {meta['counters']} in tactical matchups.",
                "name": meta["counters"],
                "icon": "https://akmweb.youngjoygame.com/web/gms/image/1d4439a2ab14e995b99fd8934adb34ee.svg"
            },
            "countered": {
                "heroid": "0",
                "by_restrain_tips": f"Highly vulnerable to {meta['countered']}'s counter-picks and target suppression.",
                "name": meta["countered"],
                "icon": "https://akmweb.youngjoygame.com/web/gms/image/1d4439a2ab14e995b99fd8934adb34ee.svg"
            }
        },
        "heroid": str(h_id)
    }
    return moonton_format

def has_real_skills(file_path):
    """True when a raw profile already carries genuine, individually named skills."""
    if not os.path.exists(file_path):
        return False
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError):
        return False

    skills = (data.get("skill") or {}).get("skill") or []
    named = [s.get("name") for s in skills if isinstance(s, dict) and s.get("name")]
    # Placeholder profiles repeat one generic name; real kits have distinct ones.
    return len(named) >= 2 and len(set(named)) >= 2


def generate():
    print(f"Generating missing heroes {min(MISSING_HEROES.keys())}-{max(MISSING_HEROES.keys())} in {RAW_DIR} for all languages...")
    for h_id, meta in MISSING_HEROES.items():
        moonton_data = map_to_moonton(h_id, meta)
        for lang in LANGUAGES:
            lang_dir = os.path.join(RAW_DIR, lang)
            os.makedirs(lang_dir, exist_ok=True)
            file_path = os.path.join(lang_dir, f"hero_{h_id}.json")

            # These profiles are synthetic placeholders. scraper.py can now pull
            # the real thing for these heroes from the current GMS API, so never
            # overwrite a file that already has genuine named skills — doing so
            # would put the placeholder icons straight back.
            if has_real_skills(file_path):
                print(f"Keeping scraped profile for {meta['name']} (ID {h_id}) — real skills present.")
                continue

            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(moonton_data, f, indent=2, ensure_ascii=False)
            print(f"Generated hero profile for {meta['name']} (ID {h_id})")

    # Add them to avatar_map.json if they are missing
    avatar_map_path = os.path.join("data", "avatar_map.json")
    if os.path.exists(avatar_map_path):
        try:
            with open(avatar_map_path, 'r', encoding='utf-8') as f:
                avatars = json.load(f)
            updated = False
            for h_id, meta in MISSING_HEROES.items():
                s_id = str(h_id)
                if s_id not in avatars:
                    # Provide default generic avatar link or use Miya's fallback
                    avatars[s_id] = "https://akmweb.youngjoygame.com/web/mlweb/image/res/miya/skill/cef8ef47912cced083381c9cf86f35cb.png"
                    updated = True
            if updated:
                with open(avatar_map_path, 'w', encoding='utf-8') as f:
                    json.dump(avatars, f, indent=2)
                print("Updated avatar_map.json with fallback avatars for missing heroes.")
        except Exception as e:
            print("Error updating avatar_map.json:", e)

    # Add them to src/data/hero_meta_stats.json if they are missing
    meta_stats_path = os.path.join("src", "data", "hero_meta_stats.json")
    if os.path.exists(meta_stats_path):
        try:
            with open(meta_stats_path, 'r', encoding='utf-8') as f:
                meta_stats = json.load(f)
            
            existing_names = {m.get("name", "").lower().strip() for m in meta_stats}
            updated_meta = False
            for h_id, meta in MISSING_HEROES.items():
                name_lower = meta["name"].lower().strip()
                if name_lower not in existing_names:
                    # Map standard lanes
                    lane = "Gold Lane"
                    if meta["role"] == "Fighter": lane = "Exp Lane"
                    elif meta["role"] == "Mage": lane = "Mid Lane"
                    elif meta["role"] == "Support": lane = "Roam Lane"
                    
                    meta_stats.append({
                        "name": meta["name"],
                        "role": meta["role"],
                        "lane": lane,
                        "tier": "A",
                        "win_rate": 50.5,
                        "pick_rate": 8.5,
                        "ban_rate": 2.5,
                        "avatar_url": "https://akmweb.youngjoygame.com/web/mlweb/image/res/miya/skill/cef8ef47912cced083381c9cf86f35cb.png",
                        "cover_thumb": "https://akmweb.youngjoygame.com/web/mlweb/image/res/miya/skill/cef8ef47912cced083381c9cf86f35cb.png"
                    })
                    updated_meta = True
            if updated_meta:
                with open(meta_stats_path, 'w', encoding='utf-8') as f:
                    json.dump(meta_stats, f, indent=2)
                print("Updated hero_meta_stats.json with meta profiles for missing heroes.")
        except Exception as e:
            print("Error updating hero_meta_stats.json:", e)

if __name__ == '__main__':
    generate()
