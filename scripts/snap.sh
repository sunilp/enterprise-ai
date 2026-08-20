#!/usr/bin/env bash
# usage: scripts/snap.sh <path-under-/enterprise-ai/> <out.png> [width] [height]
HS=/private/tmp/claude-501/-Users-sunilp-Development-sunil-ws-me/9fdf8aa1-c1dd-4bba-89dc-8ae1d8c3d6af/scratchpad/pw-browsers/chromium_headless_shell-1148/chrome-mac/headless_shell
W=${3:-1440}; H=${4:-2400}
"$HS" --headless --disable-gpu --no-sandbox --hide-scrollbars --user-data-dir=$(mktemp -d) --window-size=$W,$H --virtual-time-budget=6000 --screenshot="$2" "http://127.0.0.1:${PORT:-4334}/enterprise-ai/$1" 2>/dev/null
