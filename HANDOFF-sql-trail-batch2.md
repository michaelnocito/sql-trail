# HANDOFF — SQL Trail: build Batch 2

**You are the receiving chat.** This handoff is your work order: pick up SQL Trail and build Batch 2. Start executing immediately; do not re-plan what is already decided.

## Project

SQL Trail: an Oregon Trail homage that trains data analysts for interview-grade SQL. Pure query game (all writes are shelved to a future "SQL General Store" spin-off — see ROADMAP.md).

- **Live:** https://michaelnocito.github.io/sql-trail/ (public repo `michaelnocito/sql-trail`, GitHub Pages from main)
- **Local:** `C:\Users\Mike\Projects\sql-trail`
- **GDD:** `C:\Users\Mike\Downloads\SQL_TRAIL_GDD.md` (NOT committed — keep it out of the public repo)
- **Stack:** static site, no build step. sql.js 1.10.2 + CodeMirror 5.65.16 from cdnjs. Tests: `npm test` (node, sql.js dev dep).

## State at handoff (build 14)

Shipped and live-verified: engine (js/engine.js), grader with sandbox + partial credit + write support kept for the spin-off (js/grader.js), seeded RNG (js/rng.js), stops 1-3 content (content/content.js: SELECT fundamentals / WHERE-ORDER BY / aggregates+GROUP BY+HAVING), CodeMirror editor with VS Code-dark colors + schema autocomplete, per-question schema strip (NOT a full object explorer — Mike rejected that as friction), Results/Messages output tabs, hint ladder (hint 3 = full answer with Copy + Paste-into-editor), travel animation, river crossings, arrival vignettes, arrival-condition scoring, cause-of-death flavor, icons, local run history.

## Standing rules (violating these caused rework — do not repeat)

1. **Deploy protocol:** every push bumps `BUILD` in index.html AND `version.json` together, and you verify the LIVE url (curl a marker + check pages build status) before saying "live". Open tabs self-update from version.json.
2. Commit as `Michael Nocito <hello.michaelnocito@gmail.com>`, no AI trailers. Push without asking.
3. Difficulty starts LOW and ramps. No DDL/DML anywhere in the curriculum.
4. Players must see only applicable info (schema strip shows just the question's tables). No overfitted panels.
5. Test steps in replies are labeled `<task><letter>` (e.g. 013a, 013b). End-of-task replies short; live URL + local path always included.
6. Retro CRT look stays; emoji icons are the graphical upgrade budget.
7. Workflow: build the batch → Mike tests → his feedback goes into ROADMAP.md at the applicable batch → update this handoff (rename for the next batch) → new chat takes the next batch.

## Your task: Batch 2 (from ROADMAP.md)

1. **First:** check ROADMAP.md Batch 1 for any feedback Mike filed from his build-14 test; address blockers before new work.
2. **Tap-token query builder** (MVP scope, mobile is non-negotiable per GDD §10.5): a "Build" tab beside free-text entry — buttons for keywords, the current question's tables/columns, operators, values; assembles into the same editor/grader path. Validate at stop 1-2 difficulty first; if tap-building is miserable, stop and report rather than shipping a bad version.
3. **Stop 4 curriculum — JOINs:** 5 interview-grade questions (inner + left, multi-table) against the existing schema (fort_inventory × supplies is the natural join surface; consider adding a small third table if needed for a 3-way join). Same shape as existing stops in content/content.js. All canonical answers must self-grade to full (the test suite checks this automatically).
4. **Move the gray-box boundary:** `run.stop > 3` → `> 4` in afterTravel/doTravel logic.
5. Tests green (`npm test`), live-verify, bump build, update ROADMAP.md statuses, then rewrite this handoff as HANDOFF-sql-trail-batch3.md for the next chat.

## Memory

Session memory lives at `C:\Users\Mike\.claude\projects\C--Users-Mike\memory\project_sql_trail_state.md` — keep it current as you ship.
