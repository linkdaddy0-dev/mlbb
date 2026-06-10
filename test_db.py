import sqlite3

def run_test_queries():
    print("Connecting to mldraft.db...")
    conn = sqlite3.connect("mldraft.db")
    cursor = conn.cursor()
    
    print("\n[Query 1] Listing all seeded heroes:")
    cursor.execute("SELECT id, name, role FROM heroes;")
    heroes = cursor.fetchall()
    for h in heroes:
        print(f"  - ID: {h[0]}, Name: {h[1]}, Role: {h[2]}")
        
    print("\n[Query 2] Localized skills for Miya (English vs Indonesian):")
    query = """
        SELECT 
            s.skill_index,
            t_en.translated_text AS name_en,
            t_id.translated_text AS name_id
        FROM skills s
        LEFT JOIN translations t_en ON t_en.table_name = 'skills' AND t_en.record_id = s.id AND t_en.locale = 'en' AND t_en.column_name = 'name'
        LEFT JOIN translations t_id ON t_id.table_name = 'skills' AND t_id.record_id = s.id AND t_id.locale = 'id' AND t_id.column_name = 'name'
        WHERE s.hero_id = 1;
    """
    cursor.execute(query)
    skills = cursor.fetchall()
    for s in skills:
        print(f"  - Skill {s[0]}: English='{s[1]}', Indonesian='{s[2]}'")
        
    print("\n[Query 3] Matchup counters and synergies:")
    query = """
        SELECT 
            m.target_hero_name,
            m.matchup_type,
            t_en.translated_text AS tip_en,
            t_id.translated_text AS tip_id
        FROM matchups m
        LEFT JOIN translations t_en ON t_en.table_name = 'matchups' AND t_en.record_id = m.id AND t_en.locale = 'en' AND t_en.column_name = 'tips'
        LEFT JOIN translations t_id ON t_id.table_name = 'matchups' AND t_id.record_id = m.id AND t_id.locale = 'id' AND t_id.column_name = 'tips'
        WHERE m.hero_id = 1;
    """
    cursor.execute(query)
    matchups = cursor.fetchall()
    for m in matchups:
        print(f"  - Target: {m[0]} ({m[1].upper()})")
        print(f"    * English Tip: {m[2][:80]}...")
        print(f"    * Indonesian Tip: {m[3][:80]}...")
        
    conn.close()

if __name__ == "__main__":
    run_test_queries()
