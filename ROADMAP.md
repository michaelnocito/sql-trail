# SQL Trail Roadmap

**Live:** https://michaelnocito.github.io/sql-trail/ · **Current build:** 14 (title screen shows it)

## Workflow (standing)

1. Remaining tasks are batched below.
2. Claude builds the next batch, ships it live, verifies, bumps BUILD + version.json.
3. Mike tests against the numbered test steps and gives feedback.
4. Roadmap is agile: feedback lands in the applicable batch below before anything else happens.
5. Full handoff file (HANDOFF-sql-trail-*.md) is updated; a new chat picks up the next batch from it.

## Batches

### Batch 1 — Era polish (SHIPPED build 14, awaiting Mike's test)
- Landmark arrival vignettes for all 9 stops
- River crossing decisions (Kansas / North Platte / Snake; ford, caulk, ferry; seeded outcomes)
- Arrival-condition score bonus with breakdown in the Journey Report
- Cause-of-death flavor (seeded: dysentery, typhoid, cholera, snakebite, exhaustion)

### Batch 2 — Mobile input + JOINs (NEXT)
- Tap-token query builder (MVP-scope): validate at stop 1-2 difficulty FIRST, then keep or redesign
- Stop 4 curriculum: JOINs (5 questions, inner/left, multi-table, fort_inventory × supplies patterns)
- Gray-box boundary moves from stop 3 to stop 4

### Batch 3 — Curriculum depth
- Stop 5: subqueries + CTEs (5 questions)
- Stop 6: CASE + conditional aggregation (5 questions)
- Stop 7: window functions (5 questions)

### Batch 4 — Finish the trail
- Stop 8: date & string functions (5 questions)
- Stop 9: capstone (one scenario, 3 chained questions)
- Full-trail run end to end; tombstone/report flows at real length

### Batch 5 — Persistence + accounts
- Supabase run storage (reuse Analyst Prep Kit project + supabase_auth_sync.js)
- Dual auth: recovery code (OXEN-RIVER-1847 style) + optional email
- Journey Report trend charts across runs

### Batch 6 — Analyst-thinking layer
- Burn-rate dashboard UI at forts
- Fort general-store buying screens (money loop)
- Forage minigame (timed easy queries, carry cap)
- Seeded trader encounter (swap resources)

### Batch 7 — Social + ship
- Global leaderboard (Supabase)
- Share cards (canvas PNG, LinkedIn-sized)
- Talk-to-people flavor lines at stops
- Final CRT polish pass

## Shelved: SQL General Store (future spin-off game)

All writing — DDL (CREATE/ALTER/DROP) **and** DML (INSERT/UPDATE/DELETE) — is out of SQL Trail's curriculum. SQL Trail is a pure query game: reading data is the interview skill, and it keeps the difficulty ramp honest. Writing gets its own advanced game. Concept: **run your general store on the trail**. You open a trading post at a fort and build the business from an empty database: design the schema (CREATE TABLE, keys, constraints), stock inventory (INSERT), run the shop day to day (UPDATE prices, DELETE spoilage, purchase orders, sales, restocks), and read your own books to survive the season. Covers DDL, DML, constraints and keys, indexes, transactions, and the inventory/orders patterns interviews love. Shares the SQL Trail engine, editor (the grader's write-statement support is already built and tested), and Object Explorer.

## Skipped by design (from the Oregon Trail gap analysis)
Occupations/difficulty tiers (breaks metric comparability) · weather/seasons (cut with departure month) · hunting (non-violent; forage covers it) · fishing (forage covers it) · narrative side quests (wrong size + wrong pillar) · rafting finale (competes with capstone; revisit after Batch 4)

## Deploy protocol
Every deploy bumps `BUILD` in index.html AND `version.json` together. Open tabs self-update (never mid-run). First question when something looks stale: what build does the title screen say?
