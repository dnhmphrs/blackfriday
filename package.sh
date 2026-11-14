#!/bin/sh
# Builds src/black-friday.zip, the file to upload to the Chrome Web Store.
set -e
cd "$(dirname "$0")/src"
rm -f black-friday.zip
zip -r -X -q black-friday.zip . -x '*.zip' -x '.*' -x '*/.*'
echo "src/black-friday.zip:"
unzip -l black-friday.zip
