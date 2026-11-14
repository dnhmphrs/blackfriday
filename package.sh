#!/bin/sh
# Builds src/black-friday.zip, the file to upload to the Chrome Web Store. Only what the
# manifest uses goes in: of the designs in src/designs/, just the one it names.
set -e
cd "$(dirname "$0")/src"
rm -f black-friday.zip
files=$(node -e '
  const m = require("./manifest.json");
  const list = ["manifest.json", m.background.service_worker, ...m.content_scripts.flatMap((c) => c.js), ...Object.values(m.icons)];
  console.log([...new Set(list)].join("\n"));
')
# shellcheck disable=SC2086
zip -X -q black-friday.zip $files
echo "src/black-friday.zip:"
unzip -l black-friday.zip
