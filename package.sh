#!/bin/sh
# Builds black-friday.zip, the file to upload to the Chrome Web Store, from src/.
set -e
cd "$(dirname "$0")/src"
rm -f ../black-friday.zip
zip -X -q -r ../black-friday.zip manifest.json content.js banner.css images icons
cd ..
unzip -l black-friday.zip
