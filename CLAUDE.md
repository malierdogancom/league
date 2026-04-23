# CLAUDE.md — League

## Proje Özeti
League of Legends item explorer. `league.malierdogan.com` adresinde yayınlanır.
- **Subdomain:** league.malierdogan.com
- **GitHub Org:** github.com/malierdogancom/league
- **Firebase Hosting:** `portfolio-mali-erdogan` projesi, site: `league-mali`

## Tech Stack
- **Frontend:** Vanilla HTML, CSS, JavaScript (framework yok)
- **Backend:** Python script (veri güncelleme)
- **Data Source:** Riot DDragon API (`https://ddragon.leagueoflegends.com`)
- **Node:** Gerekmez
- **Python:** 3.10

## Proje Yapısı
```
public/           ← Firebase'e deploy edilen statik dosyalar
  index.html      ← Ana sayfa (LoL Item Explorer UI)
  app.js          ← Tüm frontend mantığı
  style.css       ← Stiller
  favicon.svg
  data/           ← Python scripti tarafından otomatik güncellenen JSON veriler
scripts/
  update_data.py  ← DDragon'dan veri çeken Python scripti
requirements.txt  ← Python bağımlılıkları
firebase.json     ← hosting site: league-mali, public: public
.firebaserc       ← default project: portfolio-mali-erdogan
```

## Firebase Yapısı
- **Project ID:** `portfolio-mali-erdogan`
- **Hosting:** Site ID: `league-mali` (target değil, doğrudan site ID)
- **Firestore:** Hayır
- **Storage:** Hayır
- **Auth:** Hayır
- Tamamen statik hosting — Firebase SDK yok

## CI/CD Süreci
**İki workflow var:**

### 1. `main.yml` — Veri güncelleme + deploy
- **Trigger:** Çarşamba/Perşembe her 4 saatte bir (patch günleri), diğer günler günde 1 kez (hotfix), main'e push, manuel
- Çalışır: Python scripti DDragon'dan veri çeker → `public/data/` güncellenir → değişiklik varsa commit atar → Firebase'e deploy eder
- **Secret:** `FIREBASE_SERVICE_ACCOUNT_PORTFOLIO_MALI_ERDOGAN` (org secret)

### 2. `firebase-hosting-pull-request.yml` — PR preview
- PR açıldığında preview channel deploy eder

## Build & Deploy
Bu site framework'süz — build adımı yok:
```bash
# Manuel deploy:
firebase deploy --only hosting --project portfolio-mali-erdogan --non-interactive
```

## Veri Güncelleme (Manuel)
```bash
pip install -r requirements.txt
python scripts/update_data.py
# public/data/ güncellenir, değişiklikleri commit et ve push et
```

## Bilinen Kısıtlar
- Framework yok — Next.js, React, vb. kullanılmıyor
- CI/CD deploy `firebase deploy --only hosting` ile yapılıyor (target değil, `firebase.json`'daki `site` alanı ile)
- Diğer sitelerden farklı: deployment action olarak `FirebaseExtended/action-hosting-deploy` değil, `firebase-tools` CLI kullanıyor

---

## Yeni Subdomain Ekleme Rehberi

(Bkz. `portfolio` reposundaki `CLAUDE.md` → Yeni Subdomain Ekleme Rehberi bölümü — adımlar aynı)
