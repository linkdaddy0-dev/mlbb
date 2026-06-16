@echo off
cd /d "%~dp0"
echo ==========================================
echo Starting Automatic Sync and Rebuild...
echo ==========================================
echo.
echo [1/5] Checking python dependencies...
python -m pip install requests
echo.
echo [2/5] Running Moonton scrapers...
python scraper.py
python scripts/scrape_gms_data.py
python scratch/fix_suyou_zhuxin.py
python scripts/scrape_official_matchups.py
python scripts/scrape_official_relations.py
echo.
echo [3/5] Compiling and compressing patch assets...
node scripts/mirror_assets.cjs
python compile_data.py
echo.
echo [4/5] Validating output integrity...
python validate_data.py
echo.
echo [5/5] Rebuilding web assets and syncing Capacitor Android...
call npm run build
call npx cap sync android
echo.
echo ==========================================
echo Sync and Rebuild Completed!
echo ==========================================
