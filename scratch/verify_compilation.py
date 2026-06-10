import json
import os
import re
import sys

# Import the get_matchup_reason function from compile_data
sys.path.append(os.getcwd())
try:
    from compile_data import get_matchup_reason
except ImportError as e:
    print(f"Error importing compile_data: {e}")
    sys.exit(1)

def run_unit_tests():
    print("=== RUNNING UNIT TESTS ON get_matchup_reason ===")
    
    miya_weak_desc = "Miya is countered by heroes with a lot of AOE damage, such as Pharsa and Yve, because they can still hit her while she is concealed."
    miya_synergy_desc = "Miya works well with Tanks who have powerful CC abilities like Belerick and Tigreal since their CCs give her more opportunities to dish out damage."
    
    # 1. Counter Tests
    # Pharsa (Mage) should match because of name
    res_pharsa = get_matchup_reason("Miya", "Pharsa", "Mage", miya_weak_desc, "weak_against")
    assert res_pharsa == miya_weak_desc, f"Pharsa failed: expected general desc, got '{res_pharsa}'"
    
    # Yve (Mage) should match because of name
    res_yve = get_matchup_reason("Miya", "Yve", "Mage", miya_weak_desc, "weak_against")
    assert res_yve == miya_weak_desc, f"Yve failed: expected general desc, got '{res_yve}'"
    
    # Other Mages (e.g. Odette) should NOT match because "mage" in "damage" is now prevented by word boundaries
    res_odette = get_matchup_reason("Miya", "Odette", "Mage", miya_weak_desc, "weak_against")
    assert "Highly vulnerable to" in res_odette, f"Odette failed: expected fallback, got '{res_odette}'"
    
    # 2. Teammate Tests
    # Tigreal (Tank) should match because of name and role
    res_tigreal = get_matchup_reason("Miya", "Tigreal", "Tank", miya_synergy_desc, "synergy")
    assert res_tigreal == miya_synergy_desc, f"Tigreal failed: expected general desc, got '{res_tigreal}'"
    
    # Belerick (Tank) should match because of name and role
    res_belerick = get_matchup_reason("Miya", "Belerick", "Tank", miya_synergy_desc, "synergy")
    assert res_belerick == miya_synergy_desc, f"Belerick failed: expected general desc, got '{res_belerick}'"
    
    # Gloo (Tank) should match because "Tanks" is in description, and Gloo's role is Tank (word boundary matches tanks)
    res_gloo = get_matchup_reason("Miya", "Gloo", "Tank", miya_synergy_desc, "synergy")
    assert res_gloo == miya_synergy_desc, f"Gloo failed: expected general desc, got '{res_gloo}'"
    
    # Harith (Mage) should NOT match because "mage" doesn't match "damage" due to word boundaries
    res_harith = get_matchup_reason("Miya", "Harith", "Mage", miya_synergy_desc, "synergy")
    assert "Combines high utility" in res_harith, f"Harith failed: expected fallback, got '{res_harith}'"
    
    # 3. Collision Tests
    # Vale should NOT match Valentina
    valentina_desc = "Valentina is great at copying ultimates."
    res_vale = get_matchup_reason("Hero", "Vale", "Mage", valentina_desc, "synergy")
    assert "Combines high utility" in res_vale, f"Vale/Valentina collision failed: expected fallback, got '{res_vale}'"
    
    # Mage should NOT match damage
    damage_desc = "Deals heavy damage."
    res_mage_damage = get_matchup_reason("Hero", "Aurora", "Mage", damage_desc, "synergy")
    assert "Combines high utility" in res_mage_damage, f"Mage/damage collision failed: expected fallback, got '{res_mage_damage}'"
    
    # Tank should NOT match tankiness
    tankiness_desc = "Has high tankiness."
    res_tank_tankiness = get_matchup_reason("Hero", "Akai", "Tank", tankiness_desc, "synergy")
    assert "Combines high utility" in res_tank_tankiness, f"Tank/tankiness collision failed: expected fallback, got '{res_tank_tankiness}'"

    print(">>> All unit tests PASSED successfully!\n")

def verify_json_files():
    print("=== VERIFYING COMPILED JSON ASSETS ===")
    
    # Verify Miya's compiled file
    miya_json_path = "public/data/patches/1.8.84/en/heroes/1.json"
    if not os.path.exists(miya_json_path):
        print(f"Error: {miya_json_path} does not exist. Run compile_data.py first.")
        sys.exit(1)
        
    with open(miya_json_path, 'r', encoding='utf-8') as f:
        miya_data = json.load(f)
        
    compat = miya_data.get("meta_relationships", {}).get("compatibility", [])
    
    # Check Gloo is Tank -> should have Tigreal/Belerick message
    gloo_match = next((x for x in compat if x["name"] == "Gloo"), None)
    if gloo_match:
        assert "Tanks who have powerful CC" in gloo_match["reason"], f"Gloo logic failed in JSON: {gloo_match['reason']}"
        
    # Check Harith is Mage -> should NOT have Tigreal/Belerick message
    harith_match = next((x for x in compat if x["name"] == "Harith"), None)
    if harith_match:
        assert "Tanks who have powerful CC" not in harith_match["reason"], f"Harith logic failed in JSON: {harith_match['reason']}"
        assert "Combines high utility" in harith_match["reason"], f"Harith reason mismatch: {harith_match['reason']}"

    # Verify fallback_matrix.json
    matrix_path = "src/data/fallback_matrix.json"
    with open(matrix_path, 'r', encoding='utf-8') as f:
        matrix = json.load(f)
        
    miya_node = matrix.get("1", {})
    miya_synergies = miya_node.get("synergy", [])
    
    gloo_mat = next((x for x in miya_synergies if x["name"] == "Gloo"), None)
    if gloo_mat:
        assert "Tanks who have powerful CC" in gloo_mat["reason"], f"Gloo logic failed in fallback matrix: {gloo_mat['reason']}"
        
    harith_mat = next((x for x in miya_synergies if x["name"] == "Harith"), None)
    if harith_mat:
        assert "Tanks who have powerful CC" not in harith_mat["reason"], f"Harith logic failed in fallback matrix: {harith_mat['reason']}"

    print(">>> All compiled JSON asset checks PASSED successfully!\n")

if __name__ == "__main__":
    run_unit_tests()
    if len(sys.argv) > 1 and sys.argv[1] == "--json-only":
        verify_json_files()
    else:
        # Check if assets are ready, if so verify them
        if os.path.exists("public/data/patches/1.8.84/en/heroes/1.json"):
            verify_json_files()
