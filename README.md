# The Enterprise AI Operating System

The management system for enterprise AI, by Sunil Prakash. Live at https://sunilprakash.com/enterprise-ai/

Seven disciplines (Diagnose, Prepare, Govern, Design, Operate, Organize, Sustain), each a hub page owning a question the leadership team has to answer. Every reading page opens with an executive summary: the decision, the cost of skipping it, the metric. Plus the Readiness Diagnostic, proof artifacts (case studies, decision records, checklists), and role-based reading paths.

## Structure

- `content/` markdown pages. Each page carries `discipline:` (one of the seven keys) or `group:` (start | proof | reference), `order:`, `dek:`, and `summary: {decide, cost, metric}`.
- `content/disciplines/<key>.md` hub pages (`layout: hub`, `permalink: <key>`).
- `content/index.md` the cover (`layout: cover`).
- `layouts/` cover, hub, standard, tool, showcase, book. `partials/` head, nav, footer, summary-box, newsletter-cta, book-strip.
- `css/` paper.css (tokens, type, layout, nav), blocks.css (signature blocks), pages.css (page types), print.css.
- `js/core/` site.js, nav.js, share.js, tool.js. `js/pages/` homepage, framework, capability-stack. `js/tools/` readiness.
- `build.js` generator; `site.config.json` holds the book switch (`{ "book": { "enabled": false } }`).
- `scripts/` check-no-book.sh (content gate), snap.sh (screenshots), make-icons.js, migrate-frontmatter.js, apply-patches.js.

## Build

```bash
npm ci
npm run build     # node build.js && scripts/check-no-book.sh
npm test          # node --test tests/*.test.js
npm run serve     # dev server with live reload
```

Deploys to GitHub Pages from `main` via `.github/workflows/deploy.yml`.

## Content rules

Plain voice, no em dashes, no unsourced numbers, no employer names. Structure-only rule: nothing from the author's book manuscript appears on the site before publication; the seven discipline names are the only shared structure. `scripts/check-no-book.sh` runs on every build.

## Design

Paper and ink. Cream ground `#f5f1e8`, ink `#16130e`, bronze accent `#7a5c1e`; obsidian `#0b0a08` with gold `#c8b48c` only inside board panels (metric strip, scorecards). Fraunces display, IBM Plex Sans body, IBM Plex Mono labels. Motion limited to opt-in reveal and chart draw-in, off under reduced motion.
