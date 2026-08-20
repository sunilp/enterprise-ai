#!/bin/bash
# Second-eye review of one content page by OpenAI Codex, for the executive audience of
# The Enterprise AI Operating System. Usage: scripts/review-page-with-codex.sh content/path/page.md
# Output: stdout + /Users/sunilp/Development/sunil-ws/me/reviews/enterprise-ai/<basename>-codex-<timestamp>.md
set -euo pipefail
PAGE="${1:?page path required}"
[ -f "$PAGE" ] || { echo "not found: $PAGE" >&2; exit 1; }
command -v codex >/dev/null 2>&1 || { echo "codex CLI not found" >&2; exit 1; }
OUT_DIR=/Users/sunilp/Development/sunil-ws/me/reviews/enterprise-ai
mkdir -p "$OUT_DIR"
OUT="$OUT_DIR/$(basename "$PAGE" .md)-codex-$(date +%Y%m%d-%H%M%S).md"

read -r -d '' PROMPT <<'PROMPT_END' || true
You are a senior editor reviewing one page of a web publication by Sunil Prakash: "The Enterprise AI Operating System" at sunilprakash.com/enterprise-ai/, an executive playbook for CXOs (board members, CEOs, CIO/CTOs, CDO/CAIOs, CFO/CROs) on how to run enterprise AI as a management system. The site is organized in seven disciplines (Diagnose, Prepare, Govern, Design, Operate, Organize, Sustain). Each page carries YAML frontmatter with a `dek` (one-line summary) and a `summary` block (decide / cost / metric) that renders as an executive summary box at the top of the page. Review the frontmatter copy as carefully as the body.

Honest, specific, second-pair-of-eyes review. No padding, no encouragement, no hedging. Specificity beats politeness.

Voice rules (violations are defects):
- No em dashes (U+2014). " -- " is tolerated but flag it if it appears more than a few times.
- No AI-writing tells: "dive into", "delve", "leverage" (verb), "robust" (adjective), "fundamentally", "in essence", "in today's world", "let's explore", "it's important to note", "navigate the complexities", "in conclusion", "at the end of the day", "moving forward", "harness", "unlock", "supercharge", "game-changer", "seamless", "not just X but Y".
- Direct and opinionated; no "perhaps", "arguably", "it could be argued".
- Strategist voice, not developer voice. No "I built X".
- No employer name. The author works at a global bank; if a specific bank is named, flag it.
- No invented or unsourced numbers. Every statistic needs an inline attribution (firm and year). Flag any number without one, any attribution that looks wrong, and any two numbers that contradict each other.
- The site must not contain material from the author's unpublished book manuscript. You cannot see the manuscript; flag only copy that references a book, chapters, a publisher, or says "forthcoming".

Audience: time-poor executives who own budgets, risk, and outcomes. They reward clarity, judgement, and concreteness; they dislike jargon, vendor language, and lists that could apply to anything.

Review criteria. Cite line numbers or quoted phrases. Each finding must be actionable.
1. Executive summary (frontmatter dek + summary): is "decide" a real decision, "cost" a real consequence, "metric" a real measure? Does it match the body?
2. Opening: does the first paragraph earn the next one for a CXO?
3. Argument: clear thesis, ordered points, no logical gaps, no unsupported claims.
4. Concreteness: where is it generic? Where would a specific example, number, or decision sharpen it?
5. Factual claims and numbers: anything unverifiable, overstated, stale (it is 2026), misattributed, or inconsistent with another number on the page.
6. Voice violations: quote them with line numbers.
7. Length and pacing: what to cut.
8. Links and calls to action: sensible, not excessive.

Output format. Use exactly this structure, nothing before it:

**What is working** (2-4 items with line references)

**Concrete weaknesses** (3-6 items, each with a line reference and a one-sentence reason)

**Voice violations found** (quoted phrases with line numbers, or "none found")

**Numbers and claims to check** (each with line number and why, or "none")

**Suggested cuts**

**Suggested additions**

**Overall verdict** (ship as-is / light edits / major revisions, one sentence why)

**Triage** (one line per actionable item, most important first, max 8, format: SEVERITY(high|med|low) | line or field | finding | suggested fix)

Below is the page (frontmatter, then markdown body). Review it.

---

PROMPT_END

CONTENT=$(cat "$PAGE")
echo "Reviewing: $PAGE -> $OUT"
codex exec "${PROMPT}

${CONTENT}" 2>&1 < /dev/null | tee "$OUT"
echo "Saved: $OUT"
