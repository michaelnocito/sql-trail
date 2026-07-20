# SQL Trail Roadmap

**Live:** https://michaelnocito.github.io/sql-trail/ · **Current build:** 42 (title screen shows it)

## Workflow (standing)

1. Remaining tasks are batched below.
2. Claude builds the next batch, ships it live, verifies, bumps BUILD + version.json.
3. Mike tests against the numbered test steps and gives feedback.
4. Roadmap is agile: feedback lands in the applicable batch below before anything else happens.
5. Full handoff file (HANDOFF-sql-trail-*.md) is updated; a new chat picks up the next batch from it.

## Batches

### Batch 9 candidates (not started)
- **Free Play mode (classic trail, no SQL)** — Mike 2026-07-20: a mode that moves you down the trail using the ORIGINAL Oregon Trail-style mechanics instead of SQL jobs, so non-SQL players can come have a play. Could be a tab right next to the Build tab, or a better placement if one emerges (recommendation: a mode choice on the title screen / outfitter, since it changes the whole run loop, not just the input method — tabs switch per-question input, this switches what "doing the job" means). Design questions to settle first: what replaces the job for pay (classic mini-events? simple choices? forage-style timing?), does it share the leaderboard (probably its own board or unranked — typed SQL runs shouldn't race dice runs), and does it feed the skill path (no). Research the original game's town/landmark activity loop before building.
- **Badge / achievement system** — research-first; reuse the APK SQL kit badge design as the base (carried from Batch 8 triage).

### Batch 8.13 — 2026-07-20 typography hierarchy + pace penalty escalation (SHIPPED build 41)
1. **Typography / visual hierarchy (research-first pass, closes Batch 8.12 #2).** Research: hierarchy needs a modular type scale with FEW distinct sizes, and headers must differ from body in size AND weight AND spacing; small-caps "eyebrow" labels are the textbook device for marking information categories (Toptal typographic-hierarchy guide, sidebearings.com game-UI type systems, penpot readability guide). Shipped: 1.25-ratio scale (h1 1.9em/2.25 desktop, h2 1.5em/1.6 desktop with heavier weight + more top margin so sections chunk), new `.sect` eyebrow class (uppercase, letterspaced, brown) for in-panel category markers, all `label` group headers (Pace, Rations, Leader, store fields…) restyled as eyebrows (`label.dim` helper sentences exempt), card h3 up to 1.18em, Trail log header converted to `.sect`.
2. **Pace penalty on ALL tiers, escalating (Mike 2026-07-20).** `PACE_HEALTH = {steady:1, strenuous:3, grueling:6}` — every pace now costs health each leg, stepping up with speed (was steady:0 from build 40). Travel comparison table reads the same map, so no UI change needed.

### Batch 8.14 — 2026-07-20 travel-screen guidance fix (SHIPPED build 42)
Mike screenshot feedback on build 41: the "Pick a pace and rations…" line was unreadable (muted brown over the backdrop art) and appeared AFTER the choice it explains. Fixed: the line now sits above the pace/rations panel, and `.nextstep` gets its own paper backing (translucent card bg, brown left rule, full-strength dark ink) so guidance lines stay legible anywhere over the artwork. Applies to every .nextstep site, not just travel.

### Batch 8.12 — 2026-07-20 playtest triage (tracker "SQL Trail", 2 inbox notes)
Two notes from Mike's mobile playtest, triaged one at a time:
1. **Middle pace tier needs a penalty too — only the slowest should be free — SHIPPED build 40.** Previously only `grueling` (fastest) cost health each leg; `steady` and `strenuous` were both free. Now `PACE_HEALTH = {steady:0, strenuous:3, grueling:6}` in engine.js (data-driven, exported), so pushing the pace at all costs the party health and speed always trades against survival. The travel comparison table's "Health cost" column reads from `E.PACE_HEALTH`, so the number the player compares matches what actually gets applied. 131 tests green.
2. **Visual hierarchy / typography — ROADMAP (research first, next candidate).** Mike: all the info is on screen and clean, but hard to orient because "all the title headers are the same size as the text" — no textbook-style scanning of section categories. Wants game-learning-grade visual hierarchy so the eye finds the category of information fast. Needs a research pass (how learning games/textbook UIs size and weight headers vs body, scannable section chunking) before building — do NOT just bump font sizes blindly. This is a SQL-Trail-only chrome item (its own parchment/CRT design system), no cross-game applicability. Candidate for the next build once researched.

### Batch 8.11 — Ledger auto-open on death + Duolingo trail progress (SHIPPED builds 38–39)
- **Build 38** — the 📒 decision ledger auto-opens 2.4s after each character death (after the send-off fx), so the player sees the chain of choices that led there.
- **Build 39** — "🗺️ Trail progress": a Duolingo-style skill path matching the APK SQL kit's pmap pattern (vertical rail, done/current/practiced/upcoming states, nothing locked). Nine towns = nine SQL skills; a skill goes green when solved CLEAN (0 misses) on any run. Persistent store `sql-trail-progress-v1` {concepts:{seen,solved,clean}, bestTown, runs} accumulates across runs; hooks in startRun (runs++), startCard (seen), screenArrival (bestTown), submitAnswer full-credit (solved/clean). Top summary "N of 9 mastered" + green progress bar; tap a stop → its guideBlurb. Entry buttons on title + Journey Report (returns via _progReturn). New CSS: .tpath/.tnode/.tdot/.progbar in parchment palette (green mastered, rust current, gold practiced, dimmed upcoming).

### Batch 8.10 — Top-to-bottom review: 5 low-friction/learning picks (SHIPPED build 37)
Full review (content, graphics, mobile playtest at 375×812). Findings that shipped:
1. **Scroll-to-result** — on mobile in Build mode the result rendered at ~y951 on an 812px screen with no scroll: tapping ▶ Execute appeared to do NOTHING. showResult() brings the result into view (smooth + snap fallback) after every job/forage submit.
2. **Diagnostic coaching (learning)** — wrong-but-valid queries only got a joke line. Grader now exposes expectedShape (rows/cols/names, never values); 🧭 coaching on misses: wrong column names (from SQL errors), wrong column count/names, row count too high/low (with WHERE/join nudge), wrong order → ORDER BY nudge.
3. **Travel rows = 44px tap targets** on coarse pointers/small screens (were 28px).
4. **Trail-map orientation** — 📍 "town X of 9 — Name · N legs to Oregon" now lives OUTSIDE the scrolling strip (was hidden inside it on phones), and a MutationObserver auto-centers the ◆ marker in the strip.
5. **Clean-solve streak (enjoyment)** — 🔥 chip on the payout card at 2+, bonus burst at 3+; cosmetic only, no pay change.
Review notes (not shipped, future candidates): no first-run "how to play" card; store/doctor fine; draft page ~1.3 screens acceptable; no audio.
131 tests (new: grader expectedShape).

### Batch 8.9 — 07-19 live-playtest feedback, builds 32–35 (SHIPPED)
Mike's in-chat feedback, chunked into four one-at-a-time batches per his instruction:
- **Build 32** — full-bleed lake backdrop (rails widened/thickened w/ variance, clear end bumpers, raised trestle-bridge feel via under-deck shadow + pilings); light SQL-editor theme replaces the jarring black terminal; items reskinned off wagon parts (canvas tarp, coil of rope, tin lantern, iron nails, snakebite kit, linen bandages) + LIKE lesson rewritten ('c%'); "Cartesian product" jargon removed from tagline/epitaph/town-talk; travel animation modernized (SVG wagon, spinning wheels, dust, eased roll). Fire + cornfield corner art REMOVED but kept in art/ for later reuse.
- **Build 33** — misses no longer throw confetti (dust/tumbleweed + red edge pulse); fxPulse vignette system (opacity-only, throttled 1/600ms, <3 flashes/s photosensitivity rule, reduced-motion off) — red on any health loss, green on pure windfalls + wins; HP bars traffic-light green/yellow/red (60/30); 5 seeded death send-off animations (ghost, wheel, buzzards, tombstone, hat).
- **Build 34** — pace/rations as tappable comparison TABLES (days/leg, lbs/day, lbs/leg, health cost); forage gets big pulsing countdown pill + "↩ Return to trail" early exit; ferry costs +1 day (label says so); lone survivor travels 2 days/leg faster. 3 new engine tests (130 total).
- **Build 35** — join/capstone canonical answers de-aliased to full table names (tap-builder can now assemble them; half-fill no longer hands out alias syntax the pad lacks); guide mentions aliases as accepted pro shorthand; results tables width:auto so single-value results stop stretching.

### Batch 8.5 — Graphical upgrade: real art backdrop (SHIPPED build 28)
Mike's direction: use his own art (art site michaelnocito.github.io/art) in the same faint-background fashion as the current sketches, non-intrusive to the UI. Remove the amateur-looking "black blotches" (burnt holes) and the placeholder line-art sketches; no Sitting Bull portrait.
- Removed the 7 inline-SVG frontier sketches AND the 3 SVG "burnt hole" blotches from `body::before`.
- Added 3 Nocito originals, processed to faint sepia (paper keyed out to transparency, ink tinted to the existing `#6f4e2e`), stored in `art/`:
  - `bg-lake.png` — "Lake scene" charcoal dock; sepia duotone fading up from the bottom, reads as the trail's horizon (bottom center).
  - `bg-bonfire.png` — "Bonfire" pen sketch, label cropped; trail camp (bottom-left margin).
  - `bg-cornfield.png` — "Fall" pen sketch (scarecrows + signpost + cornfield); harvest/directions (top-right margin).
- Kept the warm paper glow + grain layers. Placement uses clamp() sizes so art hugs the margins on desktop and stays behind cards on mobile. Processing script kept in scratchpad (PIL); source JPGs pulled from the art site.
- 127 tests green; browser-verified home + outfitter screens (art faint, UI cards clean on top).

### Batch 8.6 — Backdrop refine: lake only + railroad tracks (SHIPPED build 29)
Mike's direction: keep only the lake scene; rework its dock to look like railroad tracks.
- Removed `bg-bonfire.png` and `bg-cornfield.png` (files + body::before layers). Only `bg-lake.png` remains as the backdrop.
- Reworked the dock into railroad tracks: two tapered steel rails (dark body + metal-glint highlight) drawn in perspective at ~30%/70% of the dock width, converging toward the waterline; the existing cross-planks read as ties. Drawn at 2× supersample on the source charcoal, then re-run through the same sepia pipeline. Script: scratchpad/make_rails.py.
- Reads as the trail heading west into the mountains. 127 tests green; browser-verified.

### Batch 8.7 — Blended corner art (SHIPPED build 30)
Mike's direction: from the bonfire pic cut out JUST the fire, upper-left, fade the border so it blends in; do the same upper-right with the corn/scarecrow pic.
- `bg-fire.png` — cropped to the flames + embers only (chairs/ground removed), radial-feathered so the edge dissolves; upper-left.
- `bg-cornfield.png` — regenerated from the fall sketch with a rectangular edge-feather (all borders fade); upper-right.
- Both keyed to transparent sepia (#6f4e2e) and added to `body::before` alongside the lake. Feather masks built in numpy (scratchpad/make_corners.py). 127 tests green; browser-verified all three blend borderlessly with the UI clean on top.

### Batch 8.8 — Practice-table reframe + results visibility (SHIPPED build 31)
Mike's call: Option 2 — reframe categories, keep every lesson working; plus fix results rows where item text was invisible.
- Reframe: renamed the practice-table category `parts` → `gear` (broader trail gear; wagons/oxen still fit the fiction), keeping `food` and `medicine` (medicine = the Health resource). 10 quoted `'parts'` literals updated across `supplies`, `fort_inventory`, the `whr-in` question (now `IN ('gear','medicine')`, title "Gear and Potions"), and ITEM_ICONS. Comment updated. All ~12 multi-category lessons still run; item names kept (they're on-theme). Tests are curriculum-agnostic (assert on engine state), 127 green.
- Visibility bug: the query-results grid lives in `.outpane` (dark #0d0d0b) but inherited the light theme's dark ink text with no cell bg on odd rows → item text was dark-on-dark (invisible); only numeric `.gridnum` cells showed. Added a dark-theme grid treatment (light #d7d3c7 text, amber-on-dark headers, subtle zebra). Verified via live computed styles: text rgb(215,211,199) on pane rgb(13,13,11), all rows legible.
- Note: engine resource model was already trimmed (food/coin/health); the reframed tables are the OUTFITTER's practice data, a separate layer. If Mike wants item-level reskinning too (beyond the category), that's a follow-up.

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

### Batch 6 — Two-member party + gravestones + review cards (SHIPPED build 24, GAME_VERSION 0.4.0, awaiting Mike's test)
Mike's direction 2026-07-19: party of TWO with health tied to members (split), individual deaths + individual gravestones you see on later runs (dysentery and friends), and each town draft = 2 new cards + 1 auto-picked review card from the previous town's three.
- **Engine**: party capped at 2, each member has own 0-100 health. Misfortune (events, river spills, miss penalties) strikes ONE seeded member at double strength — that's where individual deaths come from; systemic drains (starvation, grueling pace, bare-bones rations) wear everyone equally; healing (doctor, event boons) lifts all living members. `run.health` stays as the derived average so score/bonus tuning is untouched. Member death → grave {name, cause, day, stop}, logged "💀 Ada has died of dysentery."; run ends when both fall.
- **Death causes** (seeded per version+day+name): dysentery (of course), typhoid, cholera, snakebite, exhaustion, wagon wheel mishap, bad jerky, an unindexed full scan.
- **Gravestones persist** (localStorage, last 60): mid-run death = banner + flash; arriving at a town where a PREVIOUS run's member died shows their CRT gravestone ("HERE LIES ADA — lost to dysentery, day 34, a previous run"). Tombstone screen now carves one stone per member with their individual cause.
- **Review card drafts**: town 1 = 3 fresh tier-1 cards; towns 2-9 = 2 fresh cards at the town's tier + 1 seeded auto-pick from the previous town's three (recursive, deterministic), tagged 🔁 Review on the job board and card screen. Reinforces prior concepts; pays its own (lower-tier) reward.
- Statbar shows both members' named health bars (✝ strikethrough when dead). GAME_VERSION → 0.4.0 (new seeds + new leaderboard era). 125 tests green (10 new party tests replace the shared-bar death test).

### Batch 7 — APK-style single-screen walkthrough (SHIPPED build 25, awaiting Mike's test)
Mike's direction 2026-07-19: make town jobs read like Analyst Prep Kit lessons — single-screen steps that keep focus on the question, with animations/results on their own card, instead of everything stacked on one page.
- Job flow is now a 3-step walkthrough with a step line (The job · The task · The payout):
  1. **The job** — story card alone (badge, story, pay). "On to the task ▸".
  2. **The task** — just the 🎯 prompt, editor/build pad, schema strip, Execute. Trail map gone from this screen; Trail Guide moved behind a 📖 toggle; "◂ Re-read the job" link back. Misses 1-2 stay inline here so the retry loop is uninterrupted.
  3. **The payout** — wins, the handed-over 3rd-miss run, and their celebrations land on their OWN card (headline + results grid + Continue), no scrolling under the editor.
- Job board and forage screens dropped the trail map too (statbar stays everywhere — resources are always visible). Map still lives on travel/arrival/river/extras screens where geography matters.
- Presentation only — grading, rewards, escalating help, and seeds untouched. GAME_VERSION stays 0.4.0. 125 tests green.
- **Build 26 follow-up (Mike's screenshot feedback):** desktop was a skinny 760px column with small type in a wide window. ≥900px now gets a 1020px column, 18px base type, bigger headings/buttons/panels, 17px editor, 200px health bars, taller results pane. Mobile untouched (14px rules unchanged). The override block lives LAST in the stylesheet on purpose — earlier it lost specificity ties to base rules.

### Batch 8 — Decision ledger + 07-19 playtest triage (SHIPPED build 27, awaiting Mike's test)
Mike's direction: consequences must be visible the moment they happen, and a 📒 ledger icon opens the full history of decisions → consequences → net impact. Plus triage of the 5 playtest-tracker inbox items (same day).
- **Consequence strip**: every decision (travel leg, river choice, store buy, doctor, trade, forage, talk, job reward, 2nd/3rd-miss penalties, outfitting) pops a card the moment it lands: what you chose + colored delta chips (⏳ days, 🌾 food, 💰 coin, per-member 🤕/💊 health).
- **📒 Decision ledger**: floating icon during a run (and a Journey Report button) opens the overlay — every decision with its chips, plus a "Net impact of your choices" totals row and current on-hand resources. Safe-but-slow choices now visibly cost days.
- Triage (playtest inbox, all 5 decided):
  1. Build/Type confusion → **fixed**: Build is the default for everyone, tabs relabeled ("👆 Build — guided" / "⌨ Type — pro pay (+25%)"), typing pays 25% more and misses cut the reward 15% instead of 25% (engine recordAnswer mode param).
  2. Talk-to-folks should pay → **fixed**: first chat per town gifts seeded 🌾3-7 + 💰$1-3, logged in the ledger.
  3. Badge/achievement system → **roadmap** (Batch 9 candidate): needs the research-first pass; reuse the APK SQL kit badge design as the base.
  4. Resource forecasting → **fixed**: travel screen "🧮 Plan ahead" line — legs to the next general store, lbs it will burn at current settings, red warning when you're short. Ledger totals feed the same habit.
  5. Stale results tables → **fixed**: seed `party` table now matches the game (2 members, no morale column; Edgar/Codd rows gone). `supplies` keeps parts/medicine rows deliberately — store stock is world data and DISTINCT/category questions need it.
- 127 tests (2 new for the type premium). GAME_VERSION stays 0.4.0 (rewards changed slightly but seeds/curriculum did not; revisit if leaderboard fairness bothers anyone).

## Shelved: SQL General Store (future spin-off game)

All writing — DDL (CREATE/ALTER/DROP) **and** DML (INSERT/UPDATE/DELETE) — is out of SQL Trail's curriculum. SQL Trail is a pure query game: reading data is the interview skill, and it keeps the difficulty ramp honest. Writing gets its own advanced game. Concept: **run your general store on the trail**. You open a trading post at a fort and build the business from an empty database: design the schema (CREATE TABLE, keys, constraints), stock inventory (INSERT), run the shop day to day (UPDATE prices, DELETE spoilage, purchase orders, sales, restocks), and read your own books to survive the season. Covers DDL, DML, constraints and keys, indexes, transactions, and the inventory/orders patterns interviews love. Shares the SQL Trail engine, editor (the grader's write-statement support is already built and tested), and Object Explorer.

## Skipped by design (from the Oregon Trail gap analysis)
Occupations/difficulty tiers (breaks metric comparability) · weather/seasons (cut with departure month) · hunting (non-violent; forage covers it) · fishing (forage covers it) · narrative side quests (wrong size + wrong pillar) · rafting finale (competes with capstone; revisit after Batch 4)

## Deploy protocol
Every deploy bumps `BUILD` in index.html AND `version.json` together. Open tabs self-update (never mid-run). First question when something looks stale: what build does the title screen say?
