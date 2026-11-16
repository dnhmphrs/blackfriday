#!/bin/sh
# One finished-looking frame of a composition, for judging it.
#   tools/proof.sh <comp> <format[&more=query]> <frame> [vhs amount 0..1 | clean]
#   -> out/proofs/<comp>-<format...>-f<frame>.png   (anything odd in the name becomes "_")
set -e
cd "$(dirname "$0")/.."
comp="$1"; fmt="$2"; frame="${3:-12}"; amount="${4:-1.0}"
name="proof-$(printf '%s' "$comp-$fmt" | tr -c 'A-Za-z0-9._-' '_')"
mkdir -p out/proofs
node render.mjs "$comp" "format=$fmt" "$name" --workers 1 --from "$frame" --to "$((frame + 1))" >/dev/null
out="out/proofs/${name#proof-}-f$frame.png"
if [ "$amount" = "clean" ]; then cp "frames/$name/raw/$(printf '%04d' "$frame").png" "$out"; else python3 vhs.py "$name" --amount "$amount" --still "$frame" "$out" >/dev/null; fi
echo "$out"
