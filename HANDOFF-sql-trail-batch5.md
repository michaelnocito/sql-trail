# HANDOFF — SQL Trail: Batches 5+6 shipped; awaiting Mike's tests + one Supabase step

**You are the receiving chat.** Batch 5 (persistence + social, build 23) and Batch 6 (two-member party, gravestones, review cards — build 24, GAME_VERSION 0.4.0) are BUILT and LIVE. No build work remains — this handoff is for triaging Mike's feedback and finishing activation.

## Batch 6 in one breath (see ROADMAP.md for detail)

Party of TWO, each with individual health; misfortune hits one seeded member at double strength (individual deaths), systemic drains hit both, heals lift both; `run.health` = derived average (tuning unchanged). Member death → banner + persistent gravestone (localStorage, last 60) with seeded funny cause (dysentery first, of course); later runs passing that town show the CRT stone. Tombstone screen = one stone per member. Town drafts: town 1 = 3 fresh; towns 2-9 = 2 fresh + 1 seeded 🔁 Review auto-pick from the previous town's three (recursive, deterministic). 125 tests.

## Project

SQL Trail: Oregon Trail homage that trains interview-grade SQL. Pure query game.

- **Live:** https://michaelnocito.github.io/sql-trail/ (public repo `michaelnocito/sql-trail`, Pages from main)
- **Local:** C:\Users\Mike\Projects\sql-trail (preview server `sql-trail`, port 4233, in root launch.json)
- **GDD:** C:\Users\Mike\Downloads\SQL_TRAIL_GDD.md (never commit — public repo)
- **Stack:** static, no build step. sql.js + CodeMirror from cdnjs. `npm test` = 117 green.

## State (build 23, GAME_VERSION 0.3.0)

Full 9-town roguelite loop (see ROADMAP.md for every shipped batch) **plus Batch 5**:
- `js/cloud.js`: cloud ledger via plain REST to the shared Supabase project (`liiivtbyyawueboeavmw`, publishable key in-file, RLS-safe). Runs post to `trail_runs` on death/victory with a localStorage offline queue (last 20, auto-drains).
- Identity: recovery code `WORD-WORD-YEAR` (auto-generated, localStorage `sql-trail-player-v1`); restore by typing a code on Journey records. Optional email → `trail_players` (insert-only under RLS; emails unreadable via API — dashboard lookup only).
- Journey records: score/days/help sparklines (last 12 local runs), cloud run list, code + restore + email UI.
- Global leaderboard (title / report / records): top 10, best per player, scoped to GAME_VERSION.
- CRT polish: vignette + subtle flicker on .crt panels, phosphor tables.

## ⚠️ Blocking activation step (needs Mike's dashboard)

The `trail_runs` / `trail_players` tables DO NOT EXIST yet. Mike (or Claude driving his browser via claude-in-chrome, as done for the playtest tracker) pastes the SQL from **SUPABASE_SETUP.md** into the Supabase SQL Editor once. Until then the game degrades gracefully (queues + "out of reach" messages). After running it, verify: `curl "https://liiivtbyyawueboeavmw.supabase.co/rest/v1/trail_runs?select=id&limit=1" -H "apikey: <key>" -H "Authorization: Bearer <key>"` returns `[]` not an error.

## Standing rules (violating these caused rework)

1. **Deploy protocol:** every push bumps BUILD in index.html AND version.json together; verify the LIVE url (curl a marker + Pages build status) before saying "live".
2. Commit as Michael Nocito <hello.michaelnocito@gmail.com>, no AI trailers. Push without asking.
3. No DDL/DML in the curriculum (the Supabase setup SQL is infra, not curriculum).
4. Test steps labeled <task><letter>; replies short; live URL + local path always included.
5. All art ORIGINAL homage. 6. Feedback lands in ROADMAP.md at the applicable batch first.

## Mike's test steps (Batch 5 = task 023)

- 023a Run the setup SQL (SUPABASE_SETUP.md) in the Supabase SQL Editor, or ask Claude to drive it.
- 023b Play any run to death or Oregon → Journey Report shows "in the trail ledger under your recovery code".
- 023c Title → Journey records: sparklines appear after 2+ runs; cloud list shows the run from 023b (needs 023a done).
- 023d Copy the code, open the game in a private window, Journey records → enter the code → cloud runs appear there.
- 023e Title → 🏆 Leaderboard: your best run listed, "← you" highlighted.
- 023f Save an email on Journey records → "Filed with the trail boss."
- 023g Older builds/batches still pending Mike's test per ROADMAP.md (builds 14-22 items).

## Mike's test steps (Batch 8 = task 026, build 27 — ledger + triage round)

- 026a Any decision (travel leg, river, store, doctor, trade, forage, talk, job win, 2nd/3rd miss) pops a consequence card the moment it lands: choice + colored chips (⏳ days, 🌾 food, 💰 $, per-member health).
- 026b 📒 Ledger icon (top-right during a run; also on the Journey Report) opens the decision history — every choice, its consequence chips, "Net impact of your choices" totals, and current on-hand resources. Safe-but-slow choices visibly list their day cost.
- 026c Task screen defaults to 👆 Build (guided); ⌨ Type tab says "pro pay (+25%)" and a typed clean solve pays ~25% more than the card's listed reward.
- 026d First "Talk to folks" in a town gifts a little food + coin (and shows in the ledger); later clicks are gossip only.
- 026e Travel screen shows the 🧮 Plan-ahead line: legs to the next general store, lbs it will burn, red warning if you're short.
- 026f Query `SELECT * FROM party` in any job: 2 rows (You, Ada), no morale column.
- 026g Badges/achievements: parked as Batch 9 in ROADMAP.md (research-first, APK SQL kit badge design as base) — confirm that's the right call.

## Mike's test steps (Batch 7 = task 025, build 25 — APK-style walkthrough)

- 025a Take any job: story appears ALONE first ("The job"), then "On to the task ▸" shows just the prompt + editor ("The task") — no trail map, no story, no always-on guide.
- 025b 📖 Trail Guide button toggles the concept blurb; "◂ Re-read the job" goes back to the story.
- 025c Solve a card: the win celebration + results grid open on their OWN payout card with Continue — nothing appended under the editor.
- 025d Miss once or twice: the funny helpline still appears inline on the task screen so you can retry without losing your query.
- 025e Step line "The job · The task · The payout" highlights where you are.

## Mike's test steps (Batch 6 = task 024)

- 024a Outfitter shows two members (Leader + Partner); statbar shows two named health bars.
- 024b Run grueling pace + bare-bones rations until someone gets hurt: only ONE member's bar drops on an event/miss penalty; both drop on starvation legs.
- 024c Let one member die: banner "💀 <name> has died of <cause>", run continues with the survivor, statbar shows ✝.
- 024d Let both die: tombstone shows TWO stones with individual causes/days.
- 024e Start a new run and reach the town where someone died in 024c/d: their CRT gravestone appears on arrival ("a previous run").
- 024f Any town 2+: job board shows two new cards + one 🔁 Review card carrying a concept from the previous town.
- 024g Leaderboard now reads v0.4.0 — old 0.3.0 scores no longer race (by design; new mechanics = new era).

## Next

No planned batches remain. Next chat: triage Mike's feedback into ROADMAP.md, or start the SQL General Store spin-off (see ROADMAP.md "Shelved").

## Memory

Session memory: C:\Users\Mike\.claude\projects\C--Users-Mike\memory\project_sql_trail_state.md — keep it current.
