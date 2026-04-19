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

MISSING_STAT_PATTERNS = [
    # Ability Haste: "15 Ability Haste" — "Ultimate/Basic Ability Haste" eşleşmez çünkü araya kelime girer
    (r'(\d+)\s+Ability Haste', 'FlatAbilityHaste', False),
    # Omnivamp: "10% Omnivamp" — pasif metin ("grants 10% Omnivamp until...") eşleşmesin
    (r'(\d+)%\s*Omnivamp(?!\s+(?:until|for|while|when|after|during))', 'PercentOmnivampMod', True),
    # Tenacity: "20% Tenacity"
    (r'(\d+)%\s*Tenacity(?!\s+(?:until|for|while|when|after|during))', 'PercentTenacityMod', True),
    # Lethality: "18 Lethality"
    (r'(\d+)\s+Lethality', 'FlatPhysicalLethality', False),
    # Magic Pen %: "40% Magic Penetration" — önce % kontrol et
    (r'(\d+)%\s*Magic Penetration', 'PercentMagicPenetrationMod', True),
    # Magic Pen flat: "12 Magic Penetration"
    (r'(\d+)\s+Magic Penetration', 'FlatMagicPenetrationMod', False),
    # Armor Pen %: "30% Armor Penetration"
    (r'(\d+)%\s*Armor Penetration', 'PercentArmorPenetrationMod', True),
    # Crit Damage: "30% Critical Strike Damage"
    (r'(\d+)%\s*Critical Strike Damage', 'PercentCritDamageMod', True),
]

def extract_missing_stats(description, existing_stats):
    extra = {}
    for pattern, key, is_percent in MISSING_STAT_PATTERNS:
        if key in existing_stats:
            continue
        m = re.search(pattern, description)
        if m:
            val = int(m.group(1))
            extra[key] = val / 100 if is_percent else val
    return extra

def process_items():
    latest_version = get_latest_version()
    print(f"Checking latest patch: {latest_version}")

    items_url = DATA_URL_TEMPLATE.format(latest_version)
    response = requests.get(items_url)
    response.raise_for_status()
    raw_data = response.json()["data"]

    for item_id, item in raw_data.items():
        name = item.get("name", "")
        if "Ornn" in str(item) or "ornn" in name.lower():
            print(f"ID: {item_id} | {name}")
            print(json.dumps(item, indent=2)[:500])
            print("---")


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

        raw_description = item["description"]
        clean_desc = clean_description(raw_description)
        base_stats = item.get("stats", {})
        extra_stats = extract_missing_stats(clean_desc, base_stats)
        merged_stats = {**base_stats, **extra_stats}

        processed_item = {
            "id": item_id,
            "name": item["name"],
            "description": clean_desc,
            "gold": total_gold,
            "stats": merged_stats,
            "tags": tags,
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