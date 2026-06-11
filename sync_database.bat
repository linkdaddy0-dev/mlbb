@echo off
title "MLDraft Static Data Compiler & Sync Tool"
echo ===================================================================
echo               MLDRAFT STATIC DATA COMPILER ^& SYNC TOOL
echo ===================================================================
echo.
echo [1/4] Verifying and installing Python dependencies...
python -m pip install requests
echo.
echo [2/4] Harvesting raw multilingual data and GMS rankings...
echo       (Crawls locales, generates missing heroes, scrapes matchups/relations. Please wait...)
echo.
python scraper.py
python scripts/generate_missing_heroes.py
python scripts/scrape_official_matchups.py
python scripts/scrape_official_relations.py
echo.
echo [3/4] Compiling, cleaning and compressing raw outputs...
echo       (Building optimized JSON files inside public/data/compiled/)
echo.
python compile_data.py
echo.
echo [4/4] Executing production diagnostics ^& integrity checks...
python validate_data.py
echo.
echo ===================================================================
echo   COMPILATION COMPLETE! Optimized static assets are ready for Vite.
echo   You can close this window now.
echo ===================================================================
pause

