#!/bin/bash
# Exit on error
set -e

cd /home/ubuntu

echo "=========================================="
echo "Starting Moonton Scraper & Compiler Sync"
echo "=========================================="
date

# 1. Activate pip requests
python3 -m pip install --break-system-packages requests || python3 -m pip install requests

# 2. Run scraper
echo "Running scraper..."
python3 scraper.py

# 3. Compile assets
echo "Compiling assets..."
python3 compile_data.py

# 4. Validate output
echo "Validating integrity..."
python3 validate_data.py

# 5. Copy compiled assets to Nginx web directory
echo "Publishing compiled files to Nginx web directory..."
rsync -av --delete /home/ubuntu/public/data/ /var/www/html/data/

echo "=========================================="
echo "Moonton Sync Completed Successfully!"
echo "=========================================="
date
