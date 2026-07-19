# HANDOFF — SQL Trail: build Batch 3

**You are the receiving chat.** This handoff is your work order: pick up SQL Trail and build Batch 3. Start executing immediately; do not re-plan what is already decided.

## Project

SQL Trail: an Oregon Trail homage that trains data analysts for interview-grade SQL. Pure query game (all writes are shelved to a future "SQL General Store" spin-off — see ROADMAP.md).

- **Live:** https://michaelnocito.github.io/sql-trail/ (public repo `michaelnocito/sql-trail`, GitHub Pages from main)
- **Local:** C:\Users\Mike\Projects\sql-trail
- **GDD:** C:\Users\Mike\Downloads\SQL_TRAIL_GDD.md (NOT committed — keep it out of the public repo)
- **Stack:** static site, no build step. sql.js 1.10.2 + CodeMirror 5.65.16 from cdnjs. Tests: `npm test` (node, sql.js dev dep).

## State at handoff (build 17)

Build 17 added the hybrid retro-modern restyle (Batch 2.5 in ROADMAP.md): modern paper-white + dusty-brown chrome, `.crt` green-phosphor callout panels (trail map, vignettes, river, travel animation, tombstone, title tagline), 🎯 "Your task" objective callouts, question progress dots, `.primary` button hierarchy, "nextstep" guidance lines. Keep new screens consistent with these classes.

Shipped and live-verified: engine (js/engine.js), grader with sandbox + partial credit (js/grader.js), seeded RNG (js/rng.js), tap-token builder logic (js/builder.js — padFor/assemble, index.html renders the Type/Build tabs), stops 1-4 content (content/content.js: SELECT / WHERE-ORDER BY / aggregates / JOINs incl. a 3-way via the `forts` table), CodeMirror editor with autocomplete, per-question schema strip, Results/Messages tabs, hint ladder (hint 3 = full answer), travel animation, river crossings, arrival vignettes, arrival-condition scoring, cause-of-death flavor, local run history. Gray-box boundary is after stop 4.

Builder specifics: pad tokens derive from the question's canonical answer + relevant tables; multi-table questions get qualified `table.column` tokens; AS is deliberately absent (grader ignores column aliases); coarse-pointer devices default to Build, choice persisted in localStorage.

## Standing rules (violating these caused rework — do not repeat)

1. **Deploy protocol:** every push bumps BUILD in index.html AND version.json together (BUILD also version-stamps the local script URLs), and you verify the LIVE url (curl a marker + pages build status) before saying "live".
2. Commit as Michael Nocito <hello.michaelnocito@gmail.com>, no AI trailers. Push without asking.
3. Difficulty starts LOW and ramps. No DDL/DML anywhere in the curriculum.
4. Players must see only applicable info (schema strip shows just the question's tables). No overfitted panels.
5. Test steps in replies are labeled <task><letter> (e.g. 014a, 014b). End-of-task replies short; live URL + local path always included.
6. Retro CRT look stays; emoji icons are the graphical upgrade budget.
7. Workflow: build the batch → Mike tests → his feedback goes into ROADMAP.md at the applicable batch → update this handoff (rename for the next batch) → new chat takes the next batch.

## ⚠️ Model changed at build 21 (roguelite reboot) — read this first

The game is now a roguelite: **3 resources** (Food/Coin/Health, party = one shared health bar), and each town posts **3 job "cards" drawn seeded from a tiered pool; the player takes one**. There are no more fixed per-stop `questions` arrays. Content lives in `content/content.js` as `CARD_POOL` (16 cards, 4 per tier 1-4), each: `{id, tier, concept, title, story (funny tie-in), prompt, answer, orderMatters?, reward:{food,coin}}`. `TOWN_TIER` maps town→tier (1-4 authored). Flow in index.html: `screenDraft` (draw 3) → `startCard`/`screenCard` → `submitAnswer` (escalating help intact, uses `qState.card`) → `afterCard`. Engine rewards via `recordAnswer(run, townId, card, tier, misses, timeMs)`. Tests iterate `CARD_POOL`. So Batch 3 below = **add tiers 5-7 as new cards** (4 per tier) + extend `TOWN_TIER` to {5:5,6:6,7:7} + move the gray-box in `afterCard` (`run.stop >= 4` → `>= 7`). The old "stop 5/6/7 with 3 questions" wording is superseded — same concepts, but authored as cards.

## Your task: Batch 3 (from ROADMAP.md — Curriculum depth)

1. **First:** check ROADMAP.md Batches 1-2 for any feedback Mike filed from his build-16 test; address blockers before new work.
2. **Stop 5 — Subqueries + CTEs** (3 questions), **Stop 6 — CASE + conditional aggregation** (3 questions), **Stop 7 — window functions** (3 questions). THREE per stop is Mike's cap (build 18 feedback; tests enforce it). Hint 3 auto-pastes the answer into the editor — no Copy/Paste buttons. Consider weaving dropped stop 1-4 concepts (IN, DESC, SUM+WHERE, join+WHERE/MIN) into these questions. Watch item: rewards were tuned for 5 questions/stop — if Mike reports starvation, raise the per-answer base reward in js/engine.js recordAnswer. Same shape as existing stops in content/content.js; all canonical answers must self-grade to full (test suite checks automatically) and each pad must cover its answer (also auto-checked). Note: window-function keywords (OVER, PARTITION BY, ROW_NUMBER etc.) are NOT in js/builder.js KEYWORDS/FUNCS yet — extend them, tests will catch gaps.
3. **Gray-box boundary:** move run.stop > 4 → > 7 in afterTravel (index.html) — but note stop 5 has a river (North Platte, RIVERS[5]) that will now fire; sanity-check that flow.
4. Add guideBlurb entries for the three new concepts.
5. Tests green (npm test), live-verify, bump build, update ROADMAP.md statuses, then rewrite this handoff as HANDOFF-sql-trail-batch4.md for the next chat (delete this file).

## Memory

Session memory lives at C:\Users\Mike\.claude\projects\C--Users-Mike\memory\project_sql_trail_state.md — keep it current as you ship.
