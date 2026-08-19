#!/usr/bin/env bash
# Fails if dist/ contains book material, em dashes, or the employer name while book.enabled is false.
set -u
cd "$(dirname "$0")/.."
ENABLED=$(node -e "console.log(require('./build.js').loadSiteConfig().book.enabled)")
fail=0
if [ "$ENABLED" != "true" ]; then
  for t in "Apress" "forthcoming (book|title|with|from)" "Chapter [0-9]" "CXO Playbook" "ARAA" "Beachhead" "Absorption Pyramid" "Complexity Appropriateness" "Strategic Congruence" "Corporate Immune" "Product-System Gap" "Smallest Governable" "Five Voices" "Time to Takeoff" "Moment Matrix"; do
    hits=$(grep -rlE --include=*.html -- "$t" dist | wc -l | tr -d ' ')
    if [ "$hits" != "0" ]; then echo "FAIL book term '$t' in $hits file(s)"; grep -rlE --include=*.html -- "$t" dist | head -5; fail=1; fi
  done
fi
em=$(grep -rl $'\xe2\x80\x94' content | wc -l | tr -d ' ')
if [ "$em" != "0" ]; then echo "FAIL em dash in $em content file(s)"; grep -rl $'\xe2\x80\x94' content; fail=1; fi
emp=$(grep -rli "deutsche bank" dist content | wc -l | tr -d ' ')
if [ "$emp" != "0" ]; then echo "FAIL employer name present"; fail=1; fi
[ $fail -eq 0 ] && echo "check-no-book: OK"
exit $fail
