# SQL Trail Roadmap

**Live:** https://michaelnocito.github.io/sql-trail/ · **Current build:** 22 (title screen shows it)

## Workflow (standing)

1. Remaining tasks are batched below.
2. Claude builds the next batch, ships it live, verifies, bumps BUILD + version.json.
3. Mike tests against the numbered test steps and gives feedback.
4. Roadmap is agile: feedback lands in the applicable batch below before anything else happens.
5. Full handoff file (HANDOFF-sql-trail-*.md) is updated; a new chat picks up the next batch from it.

## Batches

### Roguelite reboot (SHIPPED build 21, awaiting Mike's test)
Mike's direction: too many resources; make it roguelite — at each town, choose between 3 query "cards" (rogue-lite draft), each a funny story tie-in.
Decisions (Mike): **3 resources** (Food/Coin/Health, party = one shared bar), **draw-3-pick-1 once per town**, **ramped by town**.
- Engine rewritten (js/engine.js): food/coin/health only (no parts/medicine/morale/per-member health). Death = health ≤ 0. Rewards pay food+coin per card, −25% per miss. Events remapped to the 3 resources. crossRiver/arrivalBonus/travelLeg all on the new model.
- Content restructured (content/content.js, v0.2.0): CARD_POOL of 16 cards (4 per tier 1-4), each with title + funny story + prompt + answer + reward; TOWN_TIER maps towns 1-4 → tiers 1-4. Towns draw 3 same-tier cards seeded per version+town.
- Flow: arrival → screenDraft (3 job cards, pick one) → screenCard (chosen card, escalating-help mechanic intact) → afterCard → travel/report. Gray-box = towns 1-4.
- UI: single colored health bar in statbar (live-refreshes on reward/penalty), card-draft grid, difficulty pips, reward preview. Outfitter simplified to a single Food-vs-Coin split.
- 63 tests green; browser-verified full 4-town run (draft, win celebration, miss escalation, half-fill, journal, report).
- NEXT tiers 5-7 (subqueries/CASE/windows) = towns 5-7 in Batch 3, same card shape.

### Batch 1 — Era polish (SHIPPED build 14, awaiting Mike's test)
- Landmark arrival vignettes for all 9 stops
- River crossing decisions (Kansas / North Platte / Snake; ford, caulk, ferry; seeded outcomes)
- Arrival-condition score bonus with breakdown in the Journey Report
- Cause-of-death flavor (seeded: dysentery, typhoid, cholera, snakebite, exhaustion)

### Batch 2 — Mobile input + JOINs (SHIPPED build 16, awaiting Mike's test)
- Tap-token query builder: Type/Build tabs above the editor; pad shows keywords, functions, tables, qualified columns, values, operators derived per question; assembles into the same editor/grader path; coarse-pointer devices default to Build
- Stop 4 curriculum: JOINs (5 questions — inner, join+WHERE, LEFT JOIN anti-join, join+GROUP BY/MIN, 3-way join via new `forts` table)
- Gray-box boundary moved from stop 3 to stop 4

### Batch 2.5 — Hybrid retro-modern restyle (SHIPPED build 17, awaiting Mike's test)
Mike's direction: modern white + dusty brown chrome, modern QoL/game-design clarity, retro callouts to the original look. Research: Gameloft 2021 remake pattern (retro as accents inside modern chrome) + retro-UX best practice (retro visuals selective; hierarchy, contrast, responsiveness stay modern).
- Palette: warm paper white + dusty brown UI, rust accents; readable system/serif type; rounded cards, chip statbar, button hierarchy (filled primary vs outline)
- Retro preserved as .crt callouts: trail map, arrival vignettes, river art, travel animation, tombstone, title tagline (green phosphor + scanlines)
- Orientation QoL: 🎯 "Your task" callout per question, question progress dots, "next step" guidance lines on outfitter/travel/arrival screens
- Dark VS Code editor/results/build-pad kept as the "pro tool" zone

### Aged wanted-poster backdrop (SHIPPED build 19, awaiting Mike's test)
Mike's direction: fill the beige empty space with a faded, old, burnt-hole wanted-poster background + western-brown frontier sketches, all copyright-safe.
- All ORIGINAL inline-SVG line art (no third-party/MECC assets): covered wagon, two wagon wheels, ox skull, gravestone cross, saguaro cactus, mountain range + sun. Western-brown stroke (#6f4e2e) at low opacity.
- Burnt holes: 3 scorch marks via feTurbulence-displaced radial gradients (charred dark center → rust ring → fade).
- Aged paper: sepia stain blotches, poster-edge vignette, grayscale grain, all layered on body::before (z-index -1, above paper fill, under content). Opacity .8 desktop / .5 mobile; hidden in print.
- Verified in browser: art renders (data URIs + turbulence filters OK), cards keep text fully readable.

### Feedback shipped between batches (build 18, 2026-07-18)
Mike: 5 questions per stop was too many; hint 3 should just paste.
- All stops trimmed to 3 questions (SELECT */DISTINCT/computed · WHERE/AND/WHERE+ORDER BY · COUNT/GROUP BY/HAVING · inner/LEFT anti-join/3-way). Dropped concepts (IN, ORDER BY DESC solo, SUM+WHERE, join+WHERE, join+MIN) can resurface in stops 5-9 questions.
- Hint 3 auto-pastes the canonical answer into the editor; Copy/Paste buttons removed.
- Watch item: stop rewards were tuned for 5 questions — with 3, food income per stop drops ~40%; check survivability in Mike's next full run.

### Batches 3+4+6+7(partial) — Full trail + analyst layer (SHIPPED build 22, awaiting Mike's test)
"All remaining build items" pass, 2026-07-19. Everything client-side shipped:
- **Card tiers 5-9** (4 cards each, funny stories): subqueries (tier 5, subquery-style canonical answers — tap-building WITH/CTEs is miserable; CTE mentioned in concept label), CASE + conditional agg (6), window functions (7), date & string via new `ledger` table with 1848 dates (8), capstone multi-concept (9). TOWN_TIER now 1-9; gray-box GONE — full trail to Oregon, victory report + celebration at town 9.
- **Builder vocabulary extended**: NOT IN, LIKE, BETWEEN, CASE/WHEN/THEN/ELSE/END, OVER, PARTITION BY; funcs ROW_NUMBER()/RANK() OVER (, STRFTIME(, UPPER(, LOWER(, LENGTH(, SUBSTR(.
- **Town extras screen** after each job: fort general store (towns 2/4/7: food by the $ at rising prices, doctor +25 health), seeded trader offers (towns 3/6, accept/decline), forage minigame (any town, once: easy query against a 60s clock, lbs scale with time left; graded vs SEED+FORAGE schema).
- **Burn-rate readout** on the travel screen (lbs/leg + legs of food at current pace/rations).
- **Talk to folks** on the job board: seeded gossip lines (10-line pool, cycles per click).
- **Share card**: canvas 1200×630 PNG download on the Journey Report (original line-art wagon, score/days/health, URL).
- 109 tests green; browser-verified scripted 9-town run (rivers 2/5/8 ferry, store buy, trades, forage wins, victory report, no console errors). GAME_VERSION 0.3.0.
- Note: forage minigame is TYPE-mode only for now (no tap pad); fine on desktop, revisit for mobile if Mike flags it.

### Batch 5 — Persistence + social (SHIPPED build 23, awaiting Mike's test + ⚠️ one dashboard step)
All client code live 2026-07-19; **the two Supabase tables don't exist yet** — Mike pastes SUPABASE_SETUP.md's SQL into the Supabase SQL Editor once (same project as APK/playtest tracker). Until then everything degrades gracefully: runs queue in localStorage (last 20) and auto-drain the moment the tables exist; the leaderboard/cloud panels show friendly "out of reach" lines.
- **Cloud run storage** (js/cloud.js, plain REST like the playtest tracker — no supabase-js): every finished/dead run posts to `trail_runs` (score, days, health, food, coin, hints, finished, per-town rows, version, build). Fire-and-forget from saveHistory() with an offline queue.
- **Identity = frontier recovery code** (OXEN-RIVER-1847 style, auto-generated, localStorage). Enter it on another device to adopt that ledger page. Optional email goes to `trail_players`, an **insert-only** table under RLS (no select policy) so emails can never be read back via the API — Mike looks codes up in the dashboard if someone loses one. (The APK's full email+password auth was skipped: a leaderboard game doesn't need accounts, and this keeps zero secrets client-side.)
- **Trend sparklines** on Journey records: score / days / help across the last 12 local runs, phosphor-green canvas, no chart libs.
- **Global leaderboard** (title, report, records): top 10, best run per player, scoped to the current GAME_VERSION so scores only race their own era; your row highlighted.
- **CRT polish**: tube vignette + subtle flicker on all .crt panels (honors prefers-reduced-motion), phosphor-styled tables inside CRT callouts.
- Fix riding along: tombstone → Journey Report can no longer double-book a run in history.
- 117 tests green (8 new for cloud.js pure parts); browser-verified records/report/leaderboard screens incl. offline fallbacks.

## Shelved: SQL General Store (future spin-off game)

All writing — DDL (CREATE/ALTER/DROP) **and** DML (INSERT/UPDATE/DELETE) — is out of SQL Trail's curriculum. SQL Trail is a pure query game: reading data is the interview skill, and it keeps the difficulty ramp honest. Writing gets its own advanced game. Concept: **run your general store on the trail**. You open a trading post at a fort and build the business from an empty database: design the schema (CREATE TABLE, keys, constraints), stock inventory (INSERT), run the shop day to day (UPDATE prices, DELETE spoilage, purchase orders, sales, restocks), and read your own books to survive the season. Covers DDL, DML, constraints and keys, indexes, transactions, and the inventory/orders patterns interviews love. Shares the SQL Trail engine, editor (the grader's write-statement support is already built and tested), and Object Explorer.

## Skipped by design (from the Oregon Trail gap analysis)
Occupations/difficulty tiers (breaks metric comparability) · weather/seasons (cut with departure month) · hunting (non-violent; forage covers it) · fishing (forage covers it) · narrative side quests (wrong size + wrong pillar) · rafting finale (competes with capstone; revisit after Batch 4)

## Deploy protocol
Every deploy bumps `BUILD` in index.html AND `version.json` together. Open tabs self-update (never mid-run). First question when something looks stale: what build does the title screen say?
