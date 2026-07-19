# HANDOFF — SQL Trail: build Batch 5 (persistence + social)

**You are the receiving chat.** This handoff is your work order: pick up SQL Trail and build Batch 5. Start executing immediately; do not re-plan what is already decided.

## Project

SQL Trail: an Oregon Trail homage that trains data analysts for interview-grade SQL — now a full-trail roguelite. Pure query game (writes shelved to the "SQL General Store" spin-off — see ROADMAP.md).

- **Live:** https://michaelnocito.github.io/sql-trail/ (public repo `michaelnocito/sql-trail`, GitHub Pages from main)
- **Local:** C:\Users\Mike\Projects\sql-trail
- **GDD:** C:\Users\Mike\Downloads\SQL_TRAIL_GDD.md (NOT committed — keep it out of the public repo)
- **Stack:** static site, no build step. sql.js 1.10.2 + CodeMirror 5.65.16 from cdnjs. Tests: `npm test` (node, sql.js dev dep), 109 green.

## State at handoff (build 22, GAME_VERSION 0.3.0)

The full game loop is DONE and live-verified: 9 towns, roguelite draw-3-pick-1 card draft per town (CARD_POOL: 36 cards, 4 per tier 1-9, each with funny story + reward), 3 resources (Food/Coin/Health — one shared party bar), escalating help (1st miss free + funny line, 2nd −10 health + half the answer filled, 3rd −18 health/−10 food + answer handed over + Trail Journal entry with Analyst Prep Kit link), win celebrations (confetti/banner), rivers 2/5/8, fort stores 2/4/7 (food + doctor), seeded traders 3/6, timed forage minigame (any town, once), burn-rate readout, town gossip, victory report at Oregon with canvas share-card PNG download. Hybrid retro-modern skin: paper + dusty brown, .crt green callouts, aged wanted-poster SVG backdrop (all original art). Tap-token Build tab for mobile (forage is type-only for now).

## Standing rules (violating these caused rework — do not repeat)

1. **Deploy protocol:** every push bumps BUILD in index.html AND version.json together (BUILD version-stamps local script URLs), and you verify the LIVE url (curl a marker + pages build status) before saying "live".
2. Commit as Michael Nocito <hello.michaelnocito@gmail.com>, no AI trailers. Push without asking.
3. No DDL/DML anywhere in the curriculum. Difficulty ramps by town tier.
4. Players see only applicable info; test steps labeled <task><letter>; replies short; live URL + local path always included.
5. All art stays ORIGINAL homage (no MECC/Oregon Trail assets).
6. Workflow: build the batch → Mike tests → feedback into ROADMAP.md at the applicable batch → update this handoff → new chat takes the next batch.

## Your task: Batch 5 (from ROADMAP.md — persistence + social)

⚠️ Needs the Supabase project credentials (anon key + URL) from the Analyst Prep Kit — get them from `assets/supabase_auth_sync.js` in the analyst-prep-kit repo (see memory: project_playtest_tracker / project_sql_prep_kit_state). If keys or RLS setup need Mike's dashboard access, stop and ask before improvising.

1. Supabase run storage: save each finished/dead run (score, days, health, food, coin, help count, per-town rows, version, build).
2. Dual auth reusing the APK pattern: recovery code (OXEN-RIVER-1847 style) + optional email.
3. Journey Report trend charts across runs (small canvas/SVG sparklines — no chart libs).
4. Global leaderboard (top scores per GAME_VERSION; version-scope so metrics compare like with like).
5. Final CRT polish pass (cheap wins only).
6. Tests green, live-verify, bump build, update ROADMAP.md, rewrite this handoff for whatever remains.

## Memory

Session memory: C:\Users\Mike\.claude\projects\C--Users-Mike\memory\project_sql_trail_state.md — keep it current as you ship.
