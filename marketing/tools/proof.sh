#!/bin/sh
# One finished-looking frame of a composition, for judging it.
#   tools/proof.sh <comp> <format> <frame> [vhs amount 0..1 | clean]
#   -> out/proofs/<comp>-<format>-f<frame>.png
set -e
cd "$(dirname "$0")/.."
comp="$1"; fmt="$2"; frame="${3:-12}"; amount="${4:-1.0}"
name="proof-$comp-$fmt"
mkdir -p out/proofs
node render.mjs "$comp" "format=$fmt" "$name" --workers 1 --from "$frame" --to "$((frame + 1))" >/dev/null
out="out/proofs/$comp-$fmt-f$frame.png"
if [ "$amount" = "clean" ]; then cp "frames/$name/raw/$(printf '%04d' "$frame").png" "$out"; else python3 vhs.py "$name" --amount "$amount" --still "$frame" "$out" >/dev/null; fi
echo "$out"
