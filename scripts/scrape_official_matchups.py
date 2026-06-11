import os
import json
import requests

def main():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "Origin": "https://www.mobilelegends.com",
        "Referer": "https://www.mobilelegends.com/"
    }

    base_url = "https://api.gms.moontontech.com/api/gms/source/2669606/"
    periods = {
        "1d": "2756567",
        "7d": "2756569",
        "30d": "2756570"
    }
    ranks_list = ["101", "9", "8", "7", "6", "5"]

    # We will build a nested map of stats:
    # main_heroid -> period -> rank -> {win_rate, pick_rate, ban_rate}
    hero_stats_map = {}
    
    # We will also collect matchups (using 7d period by default)
    # main_heroid -> rank -> camp_type -> sub_heroes list
    matchups_gms_data = {}

    for period, source_id in periods.items():
        url = f"{base_url}{source_id}"
        print(f"\n=== Fetching rankings for period: {period} (Source: {source_id}) ===")
        for rank in ranks_list:
            print(f"  Fetching rank: {rank}...")
            payload = {
                "pageIndex": 1,
                "pageSize": 500,
                "filters": [
                    {"field": "bigrank", "operator": "eq", "value": rank},
                    {"field": "match_type", "operator": "eq", "value": 0}
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
                        
                        # Extract stats
                        wr = float(d.get("main_hero_win_rate", 0)) * 100
                        pr = float(d.get("main_hero_appearance_rate", 0)) * 100
                        br = float(d.get("main_hero_ban_rate", 0))
                        
                        if main_id not in hero_stats_map:
                            hero_stats_map[main_id] = {}
                        if period not in hero_stats_map[main_id]:
                            hero_stats_map[main_id][period] = {}
                            
                        # Save stats
                        hero_stats_map[main_id][period][rank] = {
                            "win_rate": round(wr, 2),
                            "pick_rate": round(pr, 2),
                            "ban_rate": round(br, 2)
                        }

                        # Matchups (only collected for matchups file, we use 7d as the baseline)
                        if period == "7d":
                            ct = d.get("camp_type")
                            if ct is not None:
                                ct = int(ct)
                                sub_heroes = d.get("sub_hero", [])
                                
                                if main_id not in matchups_gms_data:
                                    matchups_gms_data[main_id] = {}
                                if rank not in matchups_gms_data[main_id]:
                                    matchups_gms_data[main_id][rank] = {}
                                    
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
                                matchups_gms_data[main_id][rank][ct] = cleaned_sub
                else:
                    print(f"    Failed with status: {r.status_code}")
            except Exception as e:
                print(f"    Error: {e}")

    print(f"\nScraped stats for {len(hero_stats_map)} distinct heroes.")

    # Save the raw processed dictionary of matchups
    os.makedirs("data", exist_ok=True)
    with open("data/official_matchups_raw.json", "w", encoding="utf-8") as f:
        json.dump(matchups_gms_data, f, indent=2)
    print("Saved raw matchups data to data/official_matchups_raw.json")

    # Compile matchups
    final_matchups = {}
    rank_priority = ["101", "9", "8", "7", "6", "5"]
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
            
            meta_by_name = {h.get("name", "").lower().strip(): h for h in meta_stats}
            updated_count = 0
            
            for main_id, periods_data in hero_stats_map.items():
                s_id = str(main_id)
                h_name = name_map.get(s_id)
                if not h_name:
                    continue
                
                name_lower = h_name.lower().strip()
                if name_lower in meta_by_name:
                    hero_entry = meta_by_name[name_lower]
                    
                    # Update root stats (we use '7d' period and rank '101' as baseline)
                    baseline = periods_data.get("7d", {}).get("101")
                    if not baseline:
                        # Fallback to whatever is available
                        for p_id in ["7d", "30d", "1d"]:
                            if p_id in periods_data and "101" in periods_data[p_id]:
                                baseline = periods_data[p_id]["101"]
                                break
                    if not baseline and periods_data:
                        first_p = list(periods_data.values())[0]
                        if first_p:
                            baseline = list(first_p.values())[0]
                            
                    if baseline:
                        hero_entry["win_rate"] = baseline["win_rate"]
                        hero_entry["pick_rate"] = baseline["pick_rate"]
                        hero_entry["ban_rate"] = baseline["ban_rate"]
                    
                    # Update rank_stats (using '7d' as default rank stats mapping)
                    default_rank_stats = periods_data.get("7d", {})
                    if not default_rank_stats and periods_data:
                        default_rank_stats = list(periods_data.values())[0]
                    hero_entry["rank_stats"] = default_rank_stats
                    
                    # Update full history (period -> rank -> stats)
                    hero_entry["history"] = periods_data
                    updated_count += 1
                    
            with open(meta_stats_path, "w", encoding="utf-8") as f:
                json.dump(meta_stats, f, indent=2)
            print(f"Updated {updated_count} heroes stats inside src/data/hero_meta_stats.json from new GMS rankings.")
        except Exception as e:
            print(f"Error updating hero_meta_stats.json: {e}")

if __name__ == "__main__":
    main()
