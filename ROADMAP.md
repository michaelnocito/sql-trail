# SQL Trail Roadmap

Build order (each phase ends in something playtestable):

1. **Engine core** — trail loop, resources, seeded events, sql.js grader with tests, gray-box stops 1–3. ✅ shipped
2. **Mobile tap-token builder + full curriculum** — validate tap-building early, then author stops 4–9 (~45 stop questions + ~15 forage pool) and the 3-part capstone.
3. **Metrics + Journey Report + persistence** — Supabase run storage, dual auth (recovery code or email), cross-run trend charts.
4. **Strategy dials + forage minigame + morale** — burn-rate dashboard at forts, timed forage queries.
5. **Leaderboard, share cards, CRT polish** — global Supabase leaderboard, LinkedIn-sized share cards.

## Shelved: SQL General Store (future spin-off game)

All writing — DDL (CREATE/ALTER/DROP) **and** DML (INSERT/UPDATE/DELETE) — is out of SQL Trail's curriculum. SQL Trail is a pure query game: reading data is the interview skill, and it keeps the difficulty ramp honest. Writing gets its own advanced game. Concept: **run your general store on the trail**. You open a trading post at a fort and build the business from an empty database: design the schema (CREATE TABLE, keys, constraints), stock inventory (INSERT), run the shop day to day (UPDATE prices, DELETE spoilage, purchase orders, sales, restocks), and read your own books to survive the season. Covers DDL, DML, constraints and keys, indexes, transactions, and the inventory/orders patterns interviews love. Shares the SQL Trail engine, editor (the grader's write-statement support is already built and tested), and Object Explorer.

## MVP cut order

MVP cut order if scope pressure hits (cut last → first): curriculum & grading → metrics/Journey Report → persistence+auth → strategy dials → forage minigame → leaderboard → share cards → morale.
