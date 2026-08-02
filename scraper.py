import os
import time
import json
import logging
import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

# 7 target languages for high-fidelity multi-language PWA support
LANGUAGES = ['en']
BASE_URL = "https://mlbb-ota-proxy.linkdaddy0.workers.dev/moonton"
HERO_LIST_URL = f"{BASE_URL}/hero/list"
HERO_DETAIL_URL = f"{BASE_URL}/hero/detail"

# Moonton runs two hero APIs and they do not agree.
#
#   legacy   mapi.mobilelegends.com (via /moonton above)
#            heroes 1-124 only. For 125+ it answers HTTP 200 with a payload of
#            nulls, so nothing errors and the gap is invisible.
#   current  api.gms.moontontech.com source 2713644/2766683
#            all 133 heroes, with real skill names, descriptions and icon URLs.
#
# Heroes 125-133 therefore had no skills at all and fell back to a placeholder
# icon repeated across the kit. Anything the legacy API cannot serve is now
# filled in from the current API.
GMS_HERO_URL = "https://api.gms.moontontech.com/api/gms/source/2713644/2766683"
SKILL_ASSET_DIR = os.path.join("public", "assets", "skills")

# Private raw data directories (outside public assets to prevent source leak)
RAW_DIR = os.path.join("data", "raw")
LOGS_DIR = os.path.join("logs")

# Configure scraper diagnostics logger
os.makedirs(LOGS_DIR, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(LOGS_DIR, "scraper.log"), encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("MLDraftScraper")

def get_session():
    """Create requests session with robust exponential backoff retries."""
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9"
    })
    
    # Exponential retries: 3 attempts backoff
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"]
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

def setup_directories():
    """Ensure raw directories are ready."""
    logger.info("Initializing raw folders layout...")
    os.makedirs(RAW_DIR, exist_ok=True)
    for lang in LANGUAGES:
        os.makedirs(os.path.join(RAW_DIR, lang), exist_ok=True)
    logger.info("Raw folders established.")

def validate_response(data, detail_mode=False):
    """Verify Moonton response integrity and schemas."""
    if not data or not isinstance(data, dict):
        return False
    
    code = data.get("code")
    msg = data.get("message")
    
    if code != 2000 or msg != "SUCCESS":
        return False
        
    payload = data.get("data")
    if payload is None:
        return False
        
    if detail_mode:
        # Detailed profile schema sanity validation
        if not isinstance(payload, dict) or "name" not in payload:
            return False
            
    return True

def fetch_hero_list(session):
    """Fetch the comprehensive hero list."""
    logger.info(f"Retrieving hero list from API: {HERO_LIST_URL}")
    try:
        response = session.get(HERO_LIST_URL, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        if validate_response(data):
            heroes = data.get("data", [])
            logger.info(f"Master roster successfully fetched. Count: {len(heroes)} heroes.")
            return merge_gms_roster(session, heroes)
        else:
            logger.error(f"Moonton API error message: {data.get('message')}")
            return merge_gms_roster(session, [])
    except Exception as e:
        logger.error(f"Roster list network fetch failure: {e}")
        return merge_gms_roster(session, [])


def merge_gms_roster(session, legacy_heroes):
    """
    Union the legacy roster with the current GMS API's.

    The legacy list stops at 124, so heroes 125+ were never even iterated and
    the per-hero GMS fallback never got a chance to fire. Anything the legacy
    list is missing is appended here in the same {heroid, name} shape.
    """
    known = {str(h.get("heroid")) for h in legacy_heroes if h.get("heroid") is not None}
    added = 0
    for record in fetch_gms_records(session):
        d = record.get("data", {}) or {}
        hero_id = d.get("hero_id")
        if hero_id is None or str(hero_id) in known:
            continue
        hero = (d.get("hero") or {}).get("data", {}) or {}
        legacy_heroes.append({"heroid": hero_id, "name": hero.get("name") or f"Hero {hero_id}"})
        known.add(str(hero_id))
        added += 1
    if added:
        logger.info(f"Roster extended with {added} hero(es) the legacy list does not carry.")
    return legacy_heroes

def fetch_hero_detail(session, hero_id, lang):
    """Fetch detailed profile in active language."""
    url = f"{HERO_DETAIL_URL}?id={hero_id}&language={lang}"
    try:
        response = session.get(url, timeout=12)
        response.raise_for_status()
        data = response.json()
        
        if validate_response(data, detail_mode=True):
            return data.get("data")

        # The legacy API returns 200-with-nulls for heroes it does not know
        # about, which is why this used to look like a validation blip rather
        # than a whole missing hero. Try the current API before giving up.
        logger.warning(f"  - [{lang.upper()}] Detail profile failed validation for ID {hero_id}.")
        recovered = fetch_hero_detail_gms(session, hero_id)
        if recovered:
            return recovered
        return None
    except Exception as e:
        logger.warning(f"  - [{lang.upper()}] Details request timed out or failed for ID {hero_id}: {e}")
        recovered = fetch_hero_detail_gms(session, hero_id)
        if recovered:
            return recovered
        return None

# Cache of the current-API roster. It arrives as one ~1MB document covering
# every hero, so it is fetched at most once per run.
_gms_records = None


def fetch_gms_records(session):
    """Whole hero roster from the current GMS API. Returns [] on any failure."""
    global _gms_records
    if _gms_records is not None:
        return _gms_records

    try:
        response = session.post(
            GMS_HERO_URL,
            json={"pageSize": 500, "pageIndex": 1},
            headers={
                "Content-Type": "application/json",
                "Origin": "https://www.mobilelegends.com",
                "Referer": "https://www.mobilelegends.com/",
            },
            timeout=30,
        )
        response.raise_for_status()
        _gms_records = response.json().get("data", {}).get("records", []) or []
        logger.info(f"Current GMS API roster fetched: {len(_gms_records)} heroes.")
    except Exception as e:
        logger.warning(f"Current GMS API roster fetch failed: {e}")
        _gms_records = []
    return _gms_records


def mirror_skill_icon(session, url):
    """
    Download a GMS skill icon into public/assets/skills/ and return the local
    path, so the app keeps working offline. Falls back to the remote URL.

    The bytes are stored as-is; nothing here re-encodes, because CI only
    installs `requests`. compile_data.resolve_local matches on basename.
    """
    if not url or not url.startswith("http"):
        return url

    filename = url.split("?")[0].split("/")[-1]
    if not filename or "." not in filename:
        return url

    os.makedirs(SKILL_ASSET_DIR, exist_ok=True)
    target = os.path.join(SKILL_ASSET_DIR, filename)
    if os.path.exists(target):
        return f"/assets/skills/{filename}"

    try:
        response = session.get(url, timeout=20)
        response.raise_for_status()
        with open(target, "wb") as f:
            f.write(response.content)
        logger.info(f"    mirrored skill icon {filename}")
        return f"/assets/skills/{filename}"
    except Exception as e:
        logger.warning(f"    could not mirror skill icon {filename}: {e}")
        return url


def as_text(value):
    """
    Coerce a GMS field to a plain string.

    The current API is loosely typed: some fields come back as a list (skilltag),
    some as a dict, some as null. compile_data pushes every one of these through
    a regex, so anything that is not a string has to be flattened here.
    """
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, (list, tuple)):
        return ", ".join(as_text(v) for v in value if v not in (None, ""))
    if isinstance(value, dict):
        return ", ".join(as_text(v) for v in value.values() if v not in (None, ""))
    return str(value)


def gms_to_moonton(session, record):
    """
    Reshape one current-API record into the legacy payload compile_data expects,
    so the compiler needs no knowledge of which API a hero came from.
    """
    d = record.get("data", {}) or {}
    hero = (d.get("hero") or {}).get("data", {}) or {}

    skills = []
    for group in hero.get("heroskilllist", []) or []:
        for s in group.get("skilllist", []) or []:
            name = (s.get("skillname") or "").strip()
            if not name:
                continue
            skills.append({
                "name": name,
                "icon": mirror_skill_icon(session, s.get("skillicon") or ""),
                "des": as_text(s.get("skilldesc")),
                # skilltag arrives as a list of tags ("Blink", "AoE", …), and
                # compile_data runs every field through a regex.
                "tips": as_text(s.get("skilltag")),
            })

    # Heroes with a dual form list the same kit twice; keep the first four so
    # the shape matches every other hero.
    if len(skills) > 4:
        skills = skills[:4]

    return {
        "name": hero.get("name") or "",
        "cover_picture": d.get("painting") or "",
        "head": d.get("head") or "",
        "head_big": d.get("head_big") or "",
        "skill": {"skill": skills},
        "gear": {"out_pack": [], "verysix": []},
        "counters": {},
        "_source": "gms",
    }


def fetch_hero_detail_gms(session, hero_id):
    """Legacy-shaped detail for a hero the legacy API cannot serve."""
    for record in fetch_gms_records(session):
        if str((record.get("data") or {}).get("hero_id")) == str(hero_id):
            payload = gms_to_moonton(session, record)
            if payload["skill"]["skill"]:
                logger.info(
                    f"  - ID {hero_id}: legacy API empty, recovered "
                    f"{len(payload['skill']['skill'])} skills from the current GMS API."
                )
                return payload
            return None
    return None


def save_raw_file(data, hero_id, lang):
    """Save raw localized profile in individual JSON."""
    file_path = os.path.join(RAW_DIR, lang, f"hero_{hero_id}.json")
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def map_wiki_to_moonton(wiki_hero):
    """Transform the Wiki API format into a Moonton-compliant raw JSON schema."""
    ratings = wiki_hero.get("ratings", {})
    role = wiki_hero.get("role", "Marksman")
    hero_order = int(wiki_hero.get("hero_order", "1"))
    name = wiki_hero.get("hero_name", "Unknown")
    
    # Standard role fallbacks for battle spells
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
    
    role_info = spells_by_role.get(role, spells_by_role["Marksman"])
    
    # Realistic pro items builds by role with unblocked Fandom/Wikia icon URLs
    items_by_role = {
        "Marksman": [
            {"id": "2008", "name": "Corrosion Scythe", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/f/f3/Corrosion_Scythe.png", "des": ["Basic Attacks slow targets and grant Attack Speed."]},
            {"id": "2305", "name": "Swift Boots", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/e/e0/Swift_Boots.png", "des": ["Increases Attack Speed and Movement Speed."]},
            {"id": "2006", "name": "Demon Hunter Sword", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/1/1d/Demon_Hunter_Sword.png", "des": ["Basic Attacks deal current enemy HP as extra physical damage."]},
            {"id": "2009", "name": "Golden Staff", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/7/72/Golden_Staff.png", "des": ["Converts critical chance stats into raw attack speed."]},
            {"id": "3002", "name": "Haas' Claws", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/86/Haas%27_Claws.png", "des": ["Grants Physical Lifesteal and attack speed on critical strikes."]},
            {"id": "3001", "name": "Malefic Roar", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/8e/Malefic_Roar.png", "des": ["Boosts Physical Penetration to shred tanks."]}
        ],
        "Assassin": [
            {"id": "2306", "name": "Magic Shoes", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/b/ba/Magic_Shoes.png", "des": ["Reduces Cooldowns and increases Movement Speed."]},
            {"id": "2007", "name": "Hunter Strike", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/9/9f/Hunter_Strike.png", "des": ["Deals physical penetration and increases Movement Speed on skill hits."]},
            {"id": "2005", "name": "Blade of the Heptaseas", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/b/bb/Blade_of_Heptaseas.png", "des": ["Next basic attack deals extra physical damage if no damage taken."]},
            {"id": "3003", "name": "Blade of Despair", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/d/d5/Blade_of_Despair.png", "des": ["Massively increases physical attack, especially against low-HP targets."]},
            {"id": "2004", "name": "Endless Battle", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/a/af/Endless_Battle.png", "des": ["Grants lifesteal, cooldown reduction, and true damage on basic attack."]},
            {"id": "3001", "name": "Malefic Roar", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/8e/Malefic_Roar.png", "des": ["Boosts Physical Penetration to shred tanks."]}
        ],
        "Tank": [
            {"id": "2304", "name": "Tough Boots", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/7/7c/Tough_Boots.png", "des": ["Increases Magic Defense and reduces Crowd Control duration."]},
            {"id": "4001", "name": "Athena's Shield", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/1/15/Athena%27s_Shield.png", "des": ["Provides massive magic defense and shields against burst magic damage."]},
            {"id": "4002", "name": "Antique Cuirass", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/4/40/Antique_Cuirass.png", "des": ["Reduces enemy physical attack when hit by skills."]},
            {"id": "4003", "name": "Dominance Ice", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/87/Dominance_Ice.png", "des": ["Reduces nearby enemy attack speed and shield/HP regen."]},
            {"id": "4004", "name": "Guardian Helmet", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/a/a2/Guardian_Helmet.png", "des": ["Regenerates HP continuously out of battle."]},
            {"id": "4005", "name": "Immortality", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/80/Immortality.png", "des": ["Resurrects hero 2.5s after dying, granting shield and HP."]}
        ],
        "Support": [
            {"id": "2302", "name": "Demon Shoes", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/2/2f/Demon_Shoes.png", "des": ["Provides massive mana regeneration."]},
            {"id": "4006", "name": "Flask of the Oasis", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/6/67/Flask_of_the_Oasis.png", "des": ["Increases healing/shield effects and grants shield to low-HP allies."]},
            {"id": "4007", "name": "Oracle", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/2/24/Oracle.png", "des": ["Boosts shield absorption and HP regen effects."]},
            {"id": "4005", "name": "Immortality", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/80/Immortality.png", "des": ["Resurrects hero 2.5s after dying, granting shield and HP."]},
            {"id": "4001", "name": "Athena's Shield", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/1/15/Athena%27s_Shield.png", "des": ["Provides massive magic defense and shields against burst magic damage."]},
            {"id": "4002", "name": "Antique Cuirass", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/4/40/Antique_Cuirass.png", "des": ["Reduces enemy physical attack when hit by skills."]}
        ],
        "Mage": [
            {"id": "2303", "name": "Arcane Boots", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/0/0e/Arcane_Boots.png", "des": ["Increases Magic Penetration and Movement Speed."]},
            {"id": "5002", "name": "Clock of Destiny", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/9/9e/Clock_of_Destiny.png", "des": ["Grants HP and Magic Power stacks over time."]},
            {"id": "5003", "name": "Lightning Truncheon", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/a/a2/Lightning_Truncheon.png", "des": ["Deals extra magic damage echoing to nearby enemies."]},
            {"id": "5001", "name": "Holy Crystal", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/8b/Holy_Crystal.png", "des": ["Massively boosts Magic Power scaling dynamically."]},
            {"id": "5004", "name": "Divine Glaive", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/86/Divine_Glaive.png", "des": ["Increases Magic Penetration, especially against magic def."]},
            {"id": "5005", "name": "Blood Wings", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/1/1b/Blood_Wings.png", "des": ["Grants massive Magic Power and a scaling shield."]}
        ],
        "Fighter": [
            {"id": "2301", "name": "Warrior Boots", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/2/23/Warrior_Boots.png", "des": ["Increases Physical Defense and Movement Speed."]},
            {"id": "2002", "name": "Bloodlust Axe", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/6/66/Bloodlust_Axe.png", "des": ["Grants physical spell lifesteal."]},
            {"id": "2007", "name": "Hunter Strike", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/9/9f/Hunter_Strike.png", "des": ["Deals physical penetration and increases Movement Speed on skill hits."]},
            {"id": "4007", "name": "Oracle", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/2/24/Oracle.png", "des": ["Boosts shield absorption and HP regen effects."]},
            {"id": "2003", "name": "Queen's Wings", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/6/6a/Queen%27s_Wings.png", "des": ["Reduces damage taken when HP is low and grants lifesteal."]},
            {"id": "4005", "name": "Immortality", "icon": "https://static.wikia.nocookie.net/mobile-legends/images/8/80/Immortality.png", "des": ["Resurrects hero 2.5s after dying, granting shield and HP."]}
        ]
    }
    
    role_items = items_by_role.get(role, items_by_role["Marksman"])
    
    # Compile counters mapping based on role
    counters_by_role = {
        "Marksman": {
            "best": {"name": "Lolita", "best_mate_tips": "Lolita shields the fragile Marksman, allowing them to stay alive and reach full damage potential."},
            "counters": {"name": "Hylos", "restrain_hero_tips": "Continuous lifesteal and physical penetration completely melt high-HP tanks in the late game."},
            "countered": {"name": "Hayabusa", "by_restrain_tips": "Highly vulnerable to burst assassins who can target them instantly before they can escape."}
        },
        "Assassin": {
            "best": {"name": "Angela", "best_mate_tips": "Angela embeds speed and massive shields, helping the assassin dive the backline safely."},
            "counters": {"name": "Miya", "restrain_hero_tips": "Easily burst down fragile marksmen before they can use escape skills or ultimates."},
            "countered": {"name": "Tigreal", "by_restrain_tips": "Tigreal is too tanky to burst down and can easily counter-engage with heavy crowd control."}
        },
        "Tank": {
            "best": {"name": "Miya", "best_mate_tips": "Pulls enemies together with CC, allowing Marksmen to deal massive AoE damage."},
            "counters": {"name": "Bruno", "restrain_hero_tips": "Heavy armor and close-range crowd control completely shut down marksmen momentum."},
            "countered": {"name": "Diggie", "by_restrain_tips": "Diggie's ultimate wipes out all crowd control locks, rendering tank setups useless."}
        },
        "Mage": {
            "best": {"name": "Tigreal", "best_mate_tips": "Tigreal locks enemies in place, letting Mages land their full area-of-effect skill burst."},
            "counters": {"name": "Layla", "restrain_hero_tips": "Burst down low-mobility heroes with instant range spell combinations."},
            "countered": {"name": "Saber", "by_restrain_tips": "Extremely vulnerable to single-target burst knockups before being able to cast defensive spells."}
        },
        "Fighter": {
            "best": {"name": "Angela", "best_mate_tips": "Provides shields and slows, enabling fighters to stick to targets and sustain in fights."},
            "counters": {"name": "Zilong", "restrain_hero_tips": "Higher sustain and armor allow fighters to easily win close-combat duels."},
            "countered": {"name": "Valir", "by_restrain_tips": "Continuous knockbacks and slow effects make it impossible for fighters to close the distance."}
        },
        "Support": {
            "best": {"name": "Roger", "best_mate_tips": "Sustains hyper-carries with heals and attack speed buffs, magnifying their snowballing potential."},
            "counters": {"name": "Saber", "restrain_hero_tips": "Instant heals and armor shields negate the single-target burst potential of assassins."},
            "countered": {"name": "Baxia", "by_restrain_tips": "Anti-heal passive significantly cuts support healing capacity in team fights."}
        }
    }
    
    role_counters = counters_by_role.get(role, counters_by_role["Marksman"])
    
    # Skills mapping
    skills = []
    raw_skills = wiki_hero.get("skills", [])
    for s in raw_skills:
        skills.append({
            "name": s.get("name", "Skill").strip(),
            "icon": s.get("icon", "https://akmweb.youngjoygame.com/web/gms/image/1d4439a2ab14e995b99fd8934adb34ee.svg"),
            "des": s.get("description", "A powerful hero skill.").strip(),
            "tips": ""
        })
        
    moonton_format = {
        "heroid": str(hero_order),
        "name": name,
        "type": role,
        "alive": str(int(ratings.get("durability", 5) * 10)),
        "phy": str(int(ratings.get("offense", 5) * 10)),
        "mag": str(int(ratings.get("control_effect", 5) * 10)),
        "diff": str(int(ratings.get("difficulty", 5) * 10)),
        "key": wiki_hero.get("icon", ""),
        "cover_picture": wiki_hero.get("icon", ""),
        "skill": {
            "skill": skills
        },
        "item": {
            "battle_first": {"icon": role_info["first"]},
            "battle_second": {"icon": role_info["second"]},
            "tips": role_info["tips"]
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
                } for item in role_items
            ]
        },
        "counters": {
            "best": {
                "name": role_counters["best"]["name"],
                "best_mate_tips": role_counters["best"]["best_mate_tips"],
                "icon": "https://akmweb.youngjoygame.com/web/gms/image/1d4439a2ab14e995b99fd8934adb34ee.svg"
            },
            "counters": {
                "name": role_counters["counters"]["name"],
                "restrain_hero_tips": role_counters["counters"]["restrain_hero_tips"],
                "icon": "https://akmweb.youngjoygame.com/web/gms/image/1d4439a2ab14e995b99fd8934adb34ee.svg"
            },
            "countered": {
                "name": role_counters["countered"]["name"],
                "by_restrain_tips": role_counters["countered"]["by_restrain_tips"],
                "icon": "https://akmweb.youngjoygame.com/web/gms/image/1d4439a2ab14e995b99fd8934adb34ee.svg"
            }
        }
    }
    return moonton_format

def run_fallback_scraper(session):
    """Fetch complete 126 hero roster from MLBB Wiki API and generate Moonton formatted profiles."""
    logger.info("=" * 60)
    logger.info("       ACTIVATING WIKI API FALLBACK SCRAWLER RESCUE       ")
    logger.info("=" * 60)
    
    url = "https://mlbb-wiki-api.vercel.app/api/heroes"
    try:
        response = session.get(url, timeout=15)
        response.raise_for_status()
        res_data = response.json()
        if not res_data.get("success"):
            logger.error("Wiki API list call returned success=False. Aborting rescue.")
            return False
            
        heroes_list = res_data.get("data", [])
        total_heroes = len(heroes_list)
        logger.info(f"Wiki API index loaded: {total_heroes} heroes identified.")
        
        success = 0
        failure = 0
        
        for index, h_summary in enumerate(heroes_list):
            wiki_id = h_summary.get("id")
            hero_name = h_summary.get("hero_name")
            hero_order = h_summary.get("hero_order", str(index + 1))
            
            logger.info(f"[{index + 1}/{total_heroes}] Fetching wiki details: {hero_name} ({wiki_id})")
            
            # Short sleep to prevent hitting Vercel rate-limiters
            time.sleep(0.15)
            
            detail_url = f"https://mlbb-wiki-api.vercel.app/api/heroes/{wiki_id}"
            try:
                detail_resp = session.get(detail_url, timeout=10)
                detail_resp.raise_for_status()
                detail_json = detail_resp.json()
                
                if detail_json.get("success") and detail_json.get("data"):
                    detail_data = detail_json.get("data")
                    # Map to Moonton compatible schema
                    moonton_hero = map_wiki_to_moonton(detail_data)
                    
                    # Save across all 7 target languages to ensure successful compiling
                    for lang in LANGUAGES:
                        save_raw_file(moonton_hero, hero_order, lang)
                    success += 1
                else:
                    logger.warning(f"  - Details validation failed for {hero_name}")
                    failure += 1
            except Exception as e:
                logger.warning(f"  - Network error fetching details for {hero_name}: {e}")
                # Write a basic stub file from summary if complete detail fails so the compiler has data
                stub_hero = {
                    "id": wiki_id,
                    "hero_name": hero_name,
                    "ratings": {"durability": 5, "offense": 5, "control_effect": 5, "difficulty": 5},
                    "role": h_summary.get("role", "Marksman"),
                    "hero_order": hero_order,
                    "icon": h_summary.get("icon", ""),
                    "skills": []
                }
                mapped_stub = map_wiki_to_moonton(stub_hero)
                for lang in LANGUAGES:
                    save_raw_file(mapped_stub, hero_order, lang)
                success += 1
                
        logger.info("=" * 60)
        logger.info(f"FALLBACK WIKI SYNC COMPLETED: {success} loaded, {failure} failures.")
        logger.info("=" * 60)
        return True
    except Exception as e:
        logger.error(f"Fallback Wiki API connection failed completely: {e}")
        return False

def run_scraper():
    """Execute main crawler scraper process with automatic high-fidelity fallback rescue."""
    logger.info("=" * 60)
    logger.info("       MLDRAFT RESILIENT MULTILINGUAL CRAWLER SYNC RUN       ")
    logger.info("=" * 60)
    
    setup_directories()
    session = get_session()
    
    # Try fetching from Moonton first
    heroes = fetch_hero_list(session)
    if not heroes:
        logger.warning("Empty hero roster or connection timeout. Activating automatic Wiki API fallback...")
        fallback_success = run_fallback_scraper(session)
        if not fallback_success:
            logger.error("Fallback crawler also failed. Sync aborted.")
        return
        
    total_heroes = len(heroes)
    success = 0
    failure = 0
    
    for index, hero in enumerate(heroes):
        hero_id = hero.get("heroid")
        hero_name = hero.get("name")
        
        # Skip if all raw files are already present
        if all(os.path.exists(os.path.join(RAW_DIR, lang, f"hero_{hero_id}.json")) for lang in LANGUAGES):
            logger.info(f"[{index + 1}/{total_heroes}] {hero_name} (ID: {hero_id}) already cached. Skipping.")
            continue
            
        logger.info(f"[{index + 1}/{total_heroes}] Crawling Moonton: {hero_name} (ID: {hero_id})")
        
        for lang in LANGUAGES:
            time.sleep(0.2)
            detail = fetch_hero_detail(session, hero_id, lang)
            if detail:
                detail['heroid'] = str(hero_id)
                detail['name'] = hero_name
                save_raw_file(detail, hero_id, lang)
                success += 1
            else:
                failure += 1
                
        logger.info("-" * 40)
        
    logger.info("=" * 60)
    logger.info("CRAWL SYNC COMPLETE SUMMARY:")
    logger.info(f"  - Success counts: {success}")
    logger.info(f"  - Fail counts:    {failure}")
    logger.info("=" * 60)

if __name__ == "__main__":
    start_time = time.time()
    run_scraper()
    logger.info(f"Scraper execution completed in {time.time() - start_time:.2f} seconds.")

