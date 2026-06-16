import os
import json
import sqlite3

# Database configuration
DATABASE_FILE = "mldraft.db"
SCHEMA_FILE = "schema.sql"

# Localization compiled files
COMPILED_DIR = os.path.join("data", "compiled")
LOCALES = ['en']

def setup_database():
    """Execute schema.sql to create database tables."""
    print(f"Initializing SQLite database: {DATABASE_FILE}...")
    if not os.path.exists(SCHEMA_FILE):
        print(f"Error: Schema file {SCHEMA_FILE} not found in the root directory!")
        return False
        
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        
        with open(SCHEMA_FILE, 'r', encoding='utf-8') as f:
            schema_sql = f.read()
            
        cursor.executescript(schema_sql)
        conn.commit()
        conn.close()
        print("Database schema loaded successfully.")
        return True
    except Exception as e:
        print(f"Failed to initialize database: {e}")
        return False

def insert_translation(cursor, locale, table_name, record_id, column_name, text):
    """Safely insert localized text into the translations table."""
    if not text:
        return
    query = """
        INSERT OR REPLACE INTO translations (locale, table_name, record_id, column_name, translated_text)
        VALUES (?, ?, ?, ?, ?)
    """
    cursor.execute(query, (locale, table_name, record_id, column_name, text))

def seed_database():
    """Read compiled localized JSON files and seed the database."""
    if not setup_database():
        return
        
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    # Store dynamic equipment items to prevent duplicate inserts
    inserted_equipment = set()
    
    print("\nSeeding data tables...")
    print("-" * 50)
    
    # We will load English data as our primary key base
    heroes_en_file = os.path.join(COMPILED_DIR, "heroes_en.json")
    
    if not os.path.exists(heroes_en_file):
        print(f"Warning: Compiled JSON file not found in {COMPILED_DIR}.")
        print("Please run 'python scraper.py' first to harvest the data from Moonton's servers.")
        conn.close()
        return

    try:
        with open(heroes_en_file, 'r', encoding='utf-8') as f:
            heroes_en = json.load(f)
            
        for index, hero_en in enumerate(heroes_en):
            hero_id = int(hero_en.get("heroid"))
            name = hero_en.get("name")
            role = hero_en.get("type", "Unknown")
            
            # Numeric base ratings
            durability = int(hero_en.get("alive", 0))
            offense = int(hero_en.get("phy", 0))
            magic = int(hero_en.get("mag", 0))
            difficulty = int(hero_en.get("diff", 0))
            
            # Asset URLs
            avatar_url = hero_en.get("key", "")
            if avatar_url.startswith("//"):
                avatar_url = "https:" + avatar_url
            cover_url = hero_en.get("cover_picture", "")
            gallery_url = hero_en.get("gallery_picture", "")
            
            print(f"[{index + 1}/{len(heroes_en)}] Seeding hero: {name} (ID: {hero_id})")
            
            # 1. Insert Base Hero
            cursor.execute("""
                INSERT OR REPLACE INTO heroes (id, name, role, durability, offense, magic, difficulty, avatar_url, cover_url, gallery_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (hero_id, name, role, durability, offense, magic, difficulty, avatar_url, cover_url, gallery_url))
            
            # 2. Insert Skills & localized tips
            skills_en = hero_en.get("skill", {}).get("skill", [])
            
            for s_idx, skill_en in enumerate(skills_en):
                skill_name_en = skill_en.get("name", f"Skill {s_idx}")
                skill_icon = skill_en.get("icon", "")
                skill_des_en = skill_en.get("des", "")
                skill_tips_en = skill_en.get("tips", "")
                
                # Insert dynamic skill base record
                cursor.execute("""
                    INSERT INTO skills (hero_id, skill_index, name_default, icon_url)
                    VALUES (?, ?, ?, ?)
                """, (hero_id, s_idx, skill_name_en, skill_icon))
                skill_db_id = cursor.lastrowid
                
                # Insert English translations
                insert_translation(cursor, 'en', 'skills', skill_db_id, 'name', skill_name_en)
                insert_translation(cursor, 'en', 'skills', skill_db_id, 'description', skill_des_en)
                insert_translation(cursor, 'en', 'skills', skill_db_id, 'tips', skill_tips_en)

            # 3. Insert Equipment & localized descriptions
            gear_en = hero_en.get("gear", {}).get("out_pack", [])
            
            item_ids = [None] * 6
            for g_idx, item_en in enumerate(gear_en[:6]):
                eq_id = int(item_en.get("equipment_id"))
                item_ids[g_idx] = eq_id
                
                eq_name_en = item_en.get("equip", {}).get("name", "")
                eq_icon = item_en.get("equip", {}).get("icon", "")
                eq_des_en_list = item_en.get("equip", {}).get("des", [])
                eq_des_en = " ".join(eq_des_en_list) if isinstance(eq_des_en_list, list) else str(eq_des_en_list)
                
                if eq_id not in inserted_equipment:
                    cursor.execute("""
                        INSERT OR REPLACE INTO equipment (id, name_default, icon_url)
                        VALUES (?, ?, ?)
                    """, (eq_id, eq_name_en, eq_icon))
                    inserted_equipment.add(eq_id)
                    
                # Insert English translations
                insert_translation(cursor, 'en', 'equipment', eq_id, 'name', eq_name_en)
                insert_translation(cursor, 'en', 'equipment', eq_id, 'description', eq_des_en)

            # 4. Insert Recommended Builds (Spells + Items)
            spell_1 = hero_en.get("item", {}).get("battle_first", {}).get("icon", "")
            spell_2 = hero_en.get("item", {}).get("battle_second", {}).get("icon", "")
            build_tips_en = hero_en.get("gear", {}).get("out_pack_tips", "")
            
            cursor.execute("""
                INSERT OR REPLACE INTO hero_builds (hero_id, spell_1_icon, spell_2_icon, item_1_id, item_2_id, item_3_id, item_4_id, item_5_id, item_6_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (hero_id, spell_1, spell_2, item_ids[0], item_ids[1], item_ids[2], item_ids[3], item_ids[4], item_ids[5]))
            
            insert_translation(cursor, 'en', 'hero_builds', hero_id, 'tips', build_tips_en)

            # 5. Insert Matchup Counter Relationships
            matchups_en = hero_en.get("counters", {})
            
            matchup_types = {
                'best': ('synergy', 'best_mate_tips'),
                'counters': ('counter', 'restrain_hero_tips'),
                'countered': ('countered_by', 'by_restrain_tips')
            }
            
            for m_key, (m_type, tip_field) in matchup_types.items():
                m_item_en = matchups_en.get(m_key, {})
                m_name = m_item_en.get("name")
                
                if m_name:
                    m_icon = m_item_en.get("icon", "")
                    if m_icon.startswith("//"):
                        m_icon = "https:" + m_icon
                        
                    m_tip_en = m_item_en.get(tip_field, "")
                    
                    cursor.execute("""
                        INSERT INTO matchups (hero_id, target_hero_name, target_hero_icon, matchup_type)
                        VALUES (?, ?, ?, ?)
                    """, (hero_id, m_name, m_icon, m_type))
                    matchup_db_id = cursor.lastrowid
                    
                    # Insert English translations
                    insert_translation(cursor, 'en', 'matchups', matchup_db_id, 'tips', m_tip_en)

        conn.commit()
        print("-" * 50)
        print("Database seeding completed successfully.")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    seed_database()
