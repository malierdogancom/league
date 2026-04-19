import json
import requests
import os
import re

VERSIONS_URL = "https://ddragon.leagueoflegends.com/api/versions.json"
DATA_URL_TEMPLATE = "https://ddragon.leagueoflegends.com/cdn/{}/data/en_US/item.json"

DATA_DIR = "public/data"
ARAM_FILE = os.path.join(DATA_DIR, "aram_data.json")
SR_FILE = os.path.join(DATA_DIR, "sr_data.json")

def get_latest_version():
    response = requests.get(VERSIONS_URL)
    response.raise_for_status()
    return response.json()[0]

def clean_description(text):
    # Riot'un description alanındaki HTML taglerini (<stats>, <mainText> vb.) temizler
    clean_html = re.compile('<.*?>')
    return re.sub(clean_html, '', text)

def process_items():
    latest_version = get_latest_version()
    print(f"Checking latest patch: {latest_version}")

    items_url = DATA_URL_TEMPLATE.format(latest_version)
    response = requests.get(items_url)
    response.raise_for_status()
    raw_data = response.json()["data"]

    aram_items = []
    sr_items = []

    for item_id, item in raw_data.items():
        # Sadece satın alınabilir eşyalar
        if item.get("inStore") == False:
            continue
        
        tags = item.get("tags", [])
        is_ornn = item.get("requiredAlly") == "Ornn"
        is_boots = "Boots" in tags
        
        # Eğer 'into' varsa ve Ornn veya Ayakkabı DEĞİLSE atla (yani alt bileşenleri ele)
        if "into" in item and not (is_ornn or is_boots):
            continue
            
        # Altın eşiği: Sadece Boots veya fiyatı 1500 üzeri olanlar
        total_gold = item.get("gold", {}).get("total", 0)
        if total_gold < 1500 and not is_boots and not is_ornn:
            continue

        processed_item = {
            "id": item_id,
            "name": item["name"],
            "description": clean_description(item["description"]),
            "gold": total_gold,
            "stats": item.get("stats", {}),
            "tags": tags,
            "isOrnn": is_ornn,
            "image_url": f"https://ddragon.leagueoflegends.com/cdn/{latest_version}/img/item/{item['image']['full']}"
        }

        # Harita kontrolü
        maps = item.get("maps", {})
        if maps.get("12") == True:  # ARAM
            aram_items.append(processed_item)
        if maps.get("11") == True:  # Summoner's Rift
            sr_items.append(processed_item)

    # Klasör yoksa oluştur
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # Veriyi versiyon etiketiyle sar
    aram_output = {"version": latest_version, "items": aram_items}
    sr_output = {"version": latest_version, "items": sr_items}

    with open(ARAM_FILE, "w", encoding="utf-8") as f:
        json.dump(aram_output, f, ensure_ascii=False, indent=2)
        
    with open(SR_FILE, "w", encoding="utf-8") as f:
        json.dump(sr_output, f, ensure_ascii=False, indent=2)

    print(f"Process complete. ARAM: {len(aram_items)} items, SR: {len(sr_items)} items.")

if __name__ == "__main__":
    process_items()