import os
import json
import requests

def map_lane_to_road_id(lane_str):
    if not lane_str:
        return None
    lane = lane_str.lower()
    parts = [p.strip() for p in lane.split('/')]
    primary = parts[0]
    
    if "exp" in primary: return 1
    if "gold" in primary: return 2
    if "mid" in primary: return 3
    if "roam" in primary: return 4
    if "jungle" in primary or "jungler" in primary: return 5
    
    if len(parts) > 1:
        secondary = parts[1]
        if "exp" in secondary: return 1
        if "gold" in secondary: return 2
        if "mid" in secondary: return 3
        if "roam" in secondary: return 4
        if "jungle" in secondary or "jungler" in secondary: return 5
        
    return None

def main():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "Origin": "https://www.mobilelegends.com",
        "Referer": "https://www.mobilelegends.com/"
    }

    # 1. Fetch Rankings Data (Project 2669606)
    # Sources: 1d (2756567), 7d (2756569), 30d (2756570)
    periods = {
        "1d": "2756567",
        "7d": "2756569",
        "30d": "2756570"
    }
    ranks_list = ["101", "9", "8", "7", "6", "5"]
    
    # Structure: main_heroid -> period -> rank -> {win_rate, pick_rate, ban_rate}
    rankings_history = {}
    rankings_rank_stats = {}

    print("=== Fetching Rankings Data (Project 2669606) ===")
    for period, source_id in periods.items():
        url = f"https://api.gms.moontontech.com/api/gms/source/2669606/{source_id}"
        print(f"\nProcessing period: {period} (Source: {source_id})")
        for rank in ranks_list:
            print(f"  Fetching rank: {rank}...")
            payload = {
                "pageIndex": 1,
                "pageSize": 500,
                "filters": [
                    {"field": "bigrank", "operator": "eq", "value": rank},
                    {"field": "match_type", "operator": "eq", "value": "0"}
                ]
            }
            try:
                r = requests.post(url, headers=headers, json=payload, timeout=25)
                if r.status_code == 200:
                    records = r.json().get("data", {}).get("records", [])
                    print(f"    Success! Got {len(records)} records.")
                    for rec in records:
                        d = rec.get("data", {})
                        main_id = d.get("main_heroid")
                        if main_id is None:
                            continue
                        main_id = int(main_id)
                        
                        wr = float(d.get("main_hero_win_rate", 0)) * 100
                        pr = float(d.get("main_hero_appearance_rate", 0)) * 100
                        br = float(d.get("main_hero_ban_rate", 0)) * 100
                        
                        if main_id not in rankings_history:
                            rankings_history[main_id] = {}
                        if period not in rankings_history[main_id]:
                            rankings_history[main_id][period] = {}
                            
                        rankings_history[main_id][period][rank] = {
                            "win_rate": round(wr, 2),
                            "pick_rate": round(pr, 2),
                            "ban_rate": round(br, 2)
                        }

                        if period == "7d":
                            if main_id not in rankings_rank_stats:
                                rankings_rank_stats[main_id] = {}
                            rankings_rank_stats[main_id][rank] = {
                                "win_rate": round(wr, 2),
                                "pick_rate": round(pr, 2),
                                "ban_rate": round(br, 2)
                            }
                else:
                    print(f"    Failed with status: {r.status_code}")
            except Exception as e:
                print(f"    Error: {e}")

    # 2. Fetch Guide Overall Data (Project 2713644 Source 2755183 & 2777391)
    # We will also collect matchups data here
    # main_heroid -> rank -> camp_type -> sub_heroes list
    matchups_gms_data = {}
    guide_overall_stats = {}

    print("\n=== Fetching Guide Overall & Matchups Data ===")
    
    # A. Synergy/Teammates (Source 2755183)
    synergy_url = "https://api.gms.moontontech.com/api/gms/source/2713644/2755183"
    print("Fetching Guide Synergy Teammates (Source: 2755183)...")
    payload = {
        "pageIndex": 1,
        "pageSize": 500,
        "filters": [
            {"field": "bigrank", "operator": "eq", "value": "101"},
            {"field": "match_type", "operator": "eq", "value": "1"}
        ]
    }
    try:
        r = requests.post(synergy_url, headers=headers, json=payload, timeout=25)
        if r.status_code == 200:
            records = r.json().get("data", {}).get("records", [])
            print(f"  Success! Got {len(records)} guide overall records.")
            for rec in records:
                d = rec.get("data", {})
                main_id = d.get("main_heroid")
                if main_id is None:
                    continue
                main_id = int(main_id)
                
                wr = float(d.get("main_hero_win_rate", 0)) * 100
                pr = float(d.get("main_hero_appearance_rate", 0)) * 100
                br = float(d.get("main_hero_ban_rate", 0)) * 100
                
                guide_overall_stats[main_id] = {
                    "win_rate": round(wr, 2),
                    "pick_rate": round(pr, 2),
                    "ban_rate": round(br, 2)
                }

                # Extract teammates list
                sub_heroes = d.get("sub_hero", [])
                cleaned_sub = []
                for sh in sub_heroes:
                    sh_id = sh.get("heroid")
                    inc = sh.get("increase_win_rate")
                    h_wr = sh.get("hero_win_rate")
                    if sh_id is not None and inc is not None:
                        cleaned_sub.append({
                            "heroid": int(sh_id),
                            "increase_win_rate": float(inc),
                            "hero_win_rate": float(h_wr) if h_wr is not None else 0.0
                        })
                cleaned_sub.sort(key=lambda x: x["increase_win_rate"], reverse=True)
                
                if main_id not in matchups_gms_data:
                    matchups_gms_data[main_id] = {}
                if "101" not in matchups_gms_data[main_id]:
                    matchups_gms_data[main_id]["101"] = {}
                matchups_gms_data[main_id]["101"][1] = cleaned_sub
        else:
            print(f"  Failed with status: {r.status_code}")
    except Exception as e:
        print(f"  Error: {e}")

    # B. Counters (Source 2777391)
    counters_url = "https://api.gms.moontontech.com/api/gms/source/2713644/2777391"
    print("Fetching Guide Counters (Source: 2777391)...")
    counters_payload = {
        "pageIndex": 1,
        "pageSize": 500,
        "filters": [
            {"field": "big_rank", "operator": "eq", "value": "101"}
        ]
    }
    try:
        r = requests.post(counters_url, headers=headers, json=counters_payload, timeout=25)
        if r.status_code == 200:
            records = r.json().get("data", {}).get("records")
            if records is None:
                records = []
            print(f"  Success! Got {len(records)} guide relations records.")
            counter_records_processed = 0
            for rec in records:
                d = rec.get("data", {})
                main_id = d.get("main_heroid")
                if main_id is None:
                    continue
                main_id = int(main_id)
                
                # Only process records representing counters (camp_type = 0)
                camp_type = d.get("camp_type")
                if camp_type is None or int(camp_type) != 0:
                    continue
                
                # Extract counters list
                sub_heroes = d.get("sub_hero", [])
                cleaned_sub = []
                for sh in sub_heroes:
                    sh_id = sh.get("heroid")
                    inc = sh.get("increase_win_rate")
                    h_wr = sh.get("hero_win_rate")
                    if sh_id is not None and inc is not None:
                        cleaned_sub.append({
                            "heroid": int(sh_id),
                            "increase_win_rate": float(inc),
                            "hero_win_rate": float(h_wr) if h_wr is not None else 0.0
                        })
                cleaned_sub.sort(key=lambda x: x["increase_win_rate"], reverse=True)
                
                if main_id not in matchups_gms_data:
                    matchups_gms_data[main_id] = {}
                if "101" not in matchups_gms_data[main_id]:
                    matchups_gms_data[main_id]["101"] = {}
                matchups_gms_data[main_id]["101"][0] = cleaned_sub
                counter_records_processed += 1
            print(f"  Processed {counter_records_processed} counters records.")
        else:
            print(f"  Failed with status: {r.status_code}")
    except Exception as e:
        print(f"  Error: {e}")

    # 3. Fetch Guide Road Stats (Project 2713644 Source 2777027)
    # Dictionary mapping (heroid, real_road) -> total_win_rate
    road_win_rates = {}
    print("\n=== Fetching Guide Road Stats (Project 2713644 Source 2777027) ===")
    
    # We fetch page 1 and page 2 to ensure we get all lane records (since max pageSize is 500)
    for page in [1, 2]:
        print(f"Fetching page {page}...")
        road_payload = {
            "pageIndex": page,
            "pageSize": 500,
            "filters": [
                {"field": "big_rank", "operator": "eq", "value": "101"}
            ]
        }
        try:
            road_url = "https://api.gms.moontontech.com/api/gms/source/2713644/2777027"
            r = requests.post(road_url, headers=headers, json=road_payload, timeout=25)
            if r.status_code == 200:
                records = r.json().get("data", {}).get("records", [])
                print(f"  Success! Got {len(records)} records from page {page}.")
                for rec in records:
                    d = rec.get("data", {})
                    heroid = d.get("heroid")
                    real_road = d.get("real_road")
                    total_win_rate = d.get("total_win_rate")
                    if heroid is not None and real_road is not None and total_win_rate is not None:
                        road_win_rates[(int(heroid), int(real_road))] = round(float(total_win_rate) * 100, 2)
            else:
                print(f"  Failed with status: {r.status_code}")
        except Exception as e:
            print(f"  Error: {e}")

    # Save the raw processed dictionary of matchups
    os.makedirs("data", exist_ok=True)
    with open("data/official_matchups_raw.json", "w", encoding="utf-8") as f:
        json.dump(matchups_gms_data, f, indent=2)
    print("\nSaved raw matchups data to data/official_matchups_raw.json")

    # Compile matchups
    final_matchups = {}
    rank_priority = ["5", "6", "7", "8", "9", "101"]
    for main_id, ranks in matchups_gms_data.items():
        selected_rank = None
        for r_id in rank_priority:
            if r_id in ranks and 0 in ranks[r_id] and 1 in ranks[r_id]:
                selected_rank = r_id
                break
        if selected_rank is None:
            for r_id in ranks:
                if 0 in ranks[r_id] or 1 in ranks[r_id]:
                    selected_rank = r_id
                    break
        if selected_rank is None:
            continue
            
        counters = ranks[selected_rank].get(0, [])
        teammates = ranks[selected_rank].get(1, [])
        
        final_matchups[str(main_id)] = {
            "selected_rank": selected_rank,
            "counters": [
                {"heroid": c["heroid"], "score": round(c["increase_win_rate"] * 100, 2)}
                for c in counters
            ],
            "teammates": [
                {"heroid": t["heroid"], "score": round(t["increase_win_rate"] * 100, 2)}
                for t in teammates
            ]
        }
    with open("data/official_matchups.json", "w", encoding="utf-8") as f:
        json.dump(final_matchups, f, indent=2)
    print("Saved compiled matchups to data/official_matchups.json")

    # Update hero_meta_stats.json
    meta_stats_path = "src/data/hero_meta_stats.json"
    if os.path.exists(meta_stats_path):
        try:
            with open(meta_stats_path, "r", encoding="utf-8") as f:
                meta_stats = json.load(f)
            
            name_map = {}
            if os.path.exists("scratch/gms_hero_map.json"):
                with open("scratch/gms_hero_map.json", "r", encoding="utf-8") as f:
                    name_map = json.load(f)
            
            # Create a reverse map: name.lower().strip() -> int(gms_hero_id)
            name_to_id = {val.lower().strip(): int(key) for key, val in name_map.items()}
            
            updated_count = 0
            for hero_entry in meta_stats:
                h_name = hero_entry.get("name", "").lower().strip()
                hero_id = name_to_id.get(h_name)
                if hero_id is None:
                    continue
                
                # Assign ID inside the entry (useful for stable compilation mapping)
                hero_entry["id"] = hero_id
                
                # A. Update rankings history (Project 2669606)
                if hero_id in rankings_history:
                    hero_entry["history"] = rankings_history[hero_id]
                if hero_id in rankings_rank_stats:
                    hero_entry["rank_stats"] = rankings_rank_stats[hero_id]
                
                # B. Update overall root stats using guide overall (Source 2755183) & road stats (Source 2777027)
                overall = guide_overall_stats.get(hero_id)
                if overall:
                    hero_entry["pick_rate"] = overall["pick_rate"]
                    hero_entry["ban_rate"] = overall["ban_rate"]
                    
                    # Resolve lane specific road win rate
                    lane_str = hero_entry.get("lane")
                    road_id = map_lane_to_road_id(lane_str)
                    
                    road_wr = road_win_rates.get((hero_id, road_id)) if road_id else None
                    if road_wr is not None:
                        hero_entry["win_rate"] = road_wr
                    else:
                        hero_entry["win_rate"] = overall["win_rate"]
                        
                updated_count += 1
                    
            with open(meta_stats_path, "w", encoding="utf-8") as f:
                json.dump(meta_stats, f, indent=2)
            print(f"Updated {updated_count} heroes stats inside src/data/hero_meta_stats.json.")
        except Exception as e:
            print(f"Error updating hero_meta_stats.json: {e}")

if __name__ == "__main__":
    main()
