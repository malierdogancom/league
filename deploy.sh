#!/bin/bash
set -e
cd /home/mali/apps/league

git pull --quiet

.venv/bin/python scripts/update_data.py

# Değişiklik varsa commit et ve /var/www/league'e kopyala
if git diff --quiet public/data/; then
  echo "$(date): No data changes."
else
  git config user.name 'server-cron'
  git config user.email 'mali@okul-server'
  git add public/data/
  git commit -m "Auto-update DDragon item data"
  git push
  cp -r public/. /var/www/league/
  echo "$(date): Data updated and deployed."
fi
