import urllib.request
import os

dest_dir = "public/assets/icons"
os.makedirs(dest_dir, exist_ok=True)

assets = {
    # Roles
    "role_tank.png": "https://static.wikia.nocookie.net/mobile-legends/images/f/f0/Tank_Icon.png",
    "role_fighter.png": "https://static.wikia.nocookie.net/mobile-legends/images/1/1a/Fighter_Icon.png",
    "role_assassin.png": "https://static.wikia.nocookie.net/mobile-legends/images/3/3f/Assassin_Icon.png",
    "role_mage.png": "https://static.wikia.nocookie.net/mobile-legends/images/5/53/Mage_Icon.png",
    "role_marksman.png": "https://static.wikia.nocookie.net/mobile-legends/images/1/10/Marksman_Icon.png",
    "role_support.png": "https://static.wikia.nocookie.net/mobile-legends/images/f/ff/Support_Icon.png",
    
    # Lanes
    "lane_gold.png": "https://static.wikia.nocookie.net/mobile-legends/images/e/e0/Icon_Gold_Lane.png",
    "lane_exp.png": "https://static.wikia.nocookie.net/mobile-legends/images/c/c5/Icon_EXP_Lane.png",
    "lane_mid.png": "https://static.wikia.nocookie.net/mobile-legends/images/c/c3/Icon_Mid_Lane.png",
    "lane_jungle.png": "https://static.wikia.nocookie.net/mobile-legends/images/6/6f/Icon_Jungle.png",
    "lane_roam.png": "https://static.wikia.nocookie.net/mobile-legends/images/a/a2/Icon_Roam.png"
}

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

for name, url in assets.items():
    dest_path = os.path.join(dest_dir, name)
    print(f"Downloading {name} from {url}...")
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            with open(dest_path, 'wb') as out_file:
                out_file.write(response.read())
        print(f"Successfully saved to {dest_path}")
    except Exception as e:
        print(f"Error downloading {name}: {e}")

print("Done downloading all assets!")
