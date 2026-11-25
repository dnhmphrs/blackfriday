#!/bin/sh
# Run the smoke test in every browser found in a folder (and in Playwright's own Chromium), one
# after the other, and print one line for each.
#   test/smoke-all.sh <folder> [label]
# The folder holds Chrome for Testing builds unpacked as chrome-<version>/chrome-linux64/chrome
# (https://storage.googleapis.com/chrome-for-testing-public/<version>/linux64/chrome-linux64.zip)
# and, if wanted, Edge unpacked from its .deb as edge/opt/microsoft/msedge/msedge.
cd "$(dirname "$0")/.."
DIR="$1"; LABEL="${2:-run}"
LOG="test/shots/smoke-$LABEL.log"; mkdir -p test/shots; : > "$LOG"
run() { node test/smoke.mjs "$LABEL-$1" $2 >> "$LOG" 2>&1; grep "passed" "$LOG" | tail -1; }
run chromium ""
for b in "$DIR"/chrome-*/chrome-linux64/chrome; do [ -x "$b" ] && run "chrome-$(echo "$b" | sed 's#.*/chrome-\([0-9]*\)\..*#\1#')" "$b"; done
[ -x "$DIR/edge/opt/microsoft/msedge/msedge" ] && run edge "$DIR/edge/opt/microsoft/msedge/msedge"
echo "full log: $LOG"
