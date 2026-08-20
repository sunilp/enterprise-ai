#!/usr/bin/env bash
# Content gate. Fails the build if book material, em dashes, or the employer name
# reach the published output, or if there is nothing to check.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -d dist ] || { echo "FAIL dist/ is missing; nothing to check"; exit 1; }
count=$(find dist -type f \( -name '*.html' -o -name '*.json' -o -name '*.txt' -o -name '*.xml' \) | wc -l | tr -d ' ')
[ "$count" -gt 20 ] || { echo "FAIL dist/ has only $count text file(s); refusing to pass"; exit 1; }

ENABLED=$(node -e "console.log(require('./build.js').loadSiteConfig().book.enabled === true)")
fail=0

scan() { grep -rlE --include='*.html' --include='*.json' --include='*.txt' --include='*.xml' -- "$1" dist || true; }

if [ "$ENABLED" != "true" ]; then
  for t in "Apress" "forthcoming (book|title|with|from)" "Chapter [0-9]" "CXO Playbook" "ARAA" "Beachhead" "Absorption Pyramid" "Complexity Appropriateness" "Strategic Congruence" "Corporate Immune" "Product-System Gap" "Smallest Governable" "Five Voices" "Time to Takeoff" "Moment Matrix"; do
    hits=$(scan "$t")
    if [ -n "$hits" ]; then echo "FAIL book term '$t' in:"; echo "$hits" | head -5; fail=1; fi
  done
fi

em=$(grep -rl $'\xe2\x80\x94' content || true)
if [ -n "$em" ]; then echo "FAIL em dash in content:"; echo "$em"; fail=1; fi

emp=$(grep -rliE 'deutsche[ -]?bank' dist content || true)
if [ -n "$emp" ]; then echo "FAIL employer name in:"; echo "$emp" | head -5; fail=1; fi

if [ $fail -eq 0 ]; then echo "check-no-book: OK ($count files scanned)"; fi
exit $fail
