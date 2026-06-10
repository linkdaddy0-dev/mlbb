import requests
import json
import os

def main():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json"
    }

    url = "https://api.gms.moontontech.com/api/gms/source/2713644/2777391"
    all_records = []
    
    print("Fetching all paginated GMS records...")
    for page in range(1, 5):
        print(f"Fetching page {page}...")
        try:
            r = requests.post(url, headers=headers, json={"pageIndex": page, "pageSize": 500}, timeout=20)
            if r.status_code == 200:
                recs = r.json().get("data", {}).get("records", [])
                all_records.extend(recs)
                print(f"Page {page} Success! Got {len(recs)} records.")
            else:
                print(f"Page {page} failed with status: {r.status_code}")
                return
        except Exception as e:
            print(f"Page {page} error: {e}")
            return
            
    print(f"Total GMS records fetched: {len(all_records)}")
    
    # We will build a mapping: main_heroid -> rank -> camp_type -> sub_heroes list
    # We want to support '101' primarily, but if it doesn't exist, we can fallback to other ranks like '9' (Mythic) or '8' (Legend).
    gms_data = {}
    
    for rec in all_records:
        d = rec.get("data", {})
        main_id = d.get("main_heroid")
        br = d.get("big_rank")
        ct = d.get("camp_type")
        sub_heroes = d.get("sub_hero", [])
        
        if main_id is None or br is None or ct is None:
            continue
            
        main_id = int(main_id)
        br = str(br)
        ct = int(ct)
        
        if main_id not in gms_data:
            gms_data[main_id] = {}
        if br not in gms_data[main_id]:
            gms_data[main_id][br] = {}
            
        # Clean sub_heroes list
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
                
        # Sort sub_heroes by increase_win_rate descending
        cleaned_sub.sort(key=lambda x: x["increase_win_rate"], reverse=True)
        gms_data[main_id][br][ct] = cleaned_sub
        
    print(f"Processed matchups for {len(gms_data)} distinct main heroes.")
    
    # Save the raw processed dictionary
    os.makedirs("data", exist_ok=True)
    with open("data/official_matchups_raw.json", "w", encoding="utf-8") as f:
        json.dump(gms_data, f, indent=2)
    print("Saved raw data to data/official_matchups_raw.json")
    
    # Now let's build the final high-fidelity matchups map for compiling
    # For each hero, we want to extract:
    # - counters: top 10 from big_rank '101' (or '9' or '8') camp_type 0
    # - teammates: top 10 from big_rank '101' (or '9' or '8') camp_type 1
    final_matchups = {}
    
    # Ranks to try in priority order
    rank_priority = ["101", "9", "8", "7", "6", "5"]
    
    for main_id, ranks in gms_data.items():
        # Find the best available rank rank category
        selected_rank = None
        for r_id in rank_priority:
            if r_id in ranks and 0 in ranks[r_id] and 1 in ranks[r_id]:
                selected_rank = r_id
                break
                
        if selected_rank is None:
            # Try to find any rank with at least one camp_type
            for r_id in ranks:
                if 0 in ranks[r_id] or 1 in ranks[r_id]:
                    selected_rank = r_id
                    break
                    
        if selected_rank is None:
            continue
            
        counters = ranks[selected_rank].get(0, [])
        teammates = ranks[selected_rank].get(1, [])
        
        # We can also find "strong_against" if we look at camp_type 0 but sorted in ascending order (negative increase_win_rate means the opponent lost more against the main hero, wait, or is it where main hero counters the opponent?)
        # Let's think: if Miya counters an opponent, the opponent's win rate would decrease when matched against Miya. So increase_win_rate would be negative!
        # So we can sort camp_type 0 ascendingly to find the heroes that the main hero counters (strong_against)!
        # Let's verify: In Miya's Record 11 (big_rank 101, camp_type 1, wait, camp_type 0),
        # the lowest increase_win_rate is Moskov (-7.63%), Melissa (-7.49%), Irithel (-7.32%).
        # Wait! Moskov, Melissa, Irithel are all marksmen. Miya is good against them or they are good against Miya?
        # Actually, let's see. If camp_type 0 has positive increase_win_rate for Masha (3.02%) and Saber (2.59%), these are Miya's COUNTERS (Miya is weak against Masha and Saber).
        # So the positive increase_win_rate values in camp_type 0 represent the heroes that counter the main hero.
        # Thus, the negative increase_win_rate values in camp_type 0 represent the heroes that the main hero counters (strong against)!
        # Wait, let's verify this mathematically. If Masha's win rate increases by 3.02% when playing against Miya, then Masha counters Miya.
        # If Moskov's win rate decreases by 7.63% when playing against Miya, then Miya counters Moskov!
        # Yes! That is absolutely logical and correct!
        # So:
        # - counters (weak_against): camp_type 0, sorted by increase_win_rate descending (positive values)
        # - strong_against: camp_type 0, sorted by increase_win_rate ascending (negative values)
        # - teammates: camp_type 1, sorted by increase_win_rate descending (positive values)
        
        strong_against = sorted(counters, key=lambda x: x["increase_win_rate"])
        
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
        
    print(f"Assembled high-fidelity matchups for {len(final_matchups)} heroes.")
    with open("data/official_matchups.json", "w", encoding="utf-8") as f:
        json.dump(final_matchups, f, indent=2)
    print("Saved final compiled matchups to data/official_matchups.json")

if __name__ == "__main__":
    main()
