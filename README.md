# League — league.malierdogan.com

A League of Legends item explorer for filtering, sorting, and comparing items by stats and gold efficiency.

## What It Does

- **Item Browser:** Filter items by map (Summoner's Rift / ARAM) and category (Legendary/Epic, Boots)
- **Stat Sorting:** Sort items by any stat (AD, AP, health, armor, etc.) to quickly find the best-in-slot for a specific stat
- **Tag Filtering:** Filter by item tags (e.g., damage, tank, support) to narrow down options
- **Build Simulator:** Add up to 6 items to a build slot — see total stats and combined gold cost
- **Search:** Find items by name instantly
- **Live Patch Data:** Item data is pulled from Riot's DDragon API and auto-updated on patch days

## Why It Was Built

Playing League, it was hard to quickly answer questions like "which item gives the most AP per gold?" or "what are all the items that give both armor and health?" instead of clicking through the in-game shop one by one. This tool makes it easy to sort and compare all items by any stat combination.

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (no framework)
- **Data Source:** Riot DDragon API (`https://ddragon.leagueoflegends.com`)
- **Data Update:** Python script (`scripts/update_data.py`) fetches and processes item data
- **Hosting:** Firebase Hosting (site: `league-mali`)

## Data Update Schedule

The Python script runs automatically via GitHub Actions:
- **Wednesday & Thursday** (patch days): every 4 hours — catches DDragon delays
- **Other days:** once daily at 12:00 UTC — catches hotfixes

On each run, if data changed, it commits the updated files to `public/data/` and redeploys to Firebase.

## Deployment

Push to `main` → GitHub Actions runs the data fetcher → deploys to Firebase automatically.

Manual update:
```bash
pip install -r requirements.txt
python scripts/update_data.py   # fetches latest DDragon data → public/data/
firebase deploy --only hosting --project portfolio-mali-erdogan
```
