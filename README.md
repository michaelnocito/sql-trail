# SQL Trail

An unapologetic Oregon Trail homage that trains data analysts for interview-grade SQL.

Travel a fixed 9-stop trail. At every rest stop, SQL challenges decide your supplies, health, and survival. Seeded events and a fixed question set mean every run is comparable: the real opponent is your own last Journey Report.

**Play:** https://michaelnocito.github.io/sql-trail/

## How it works

- All SQL runs client-side in [sql.js](https://sql.js.org/) (SQLite compiled to WebAssembly). Every challenge gets a fresh database.
- Grading is set-match with partial credit: right shape but wrong rows earns half rations.
- Escalating hints: the first is free, the rest cost food.
- Permadeath. Whole party dead means a tombstone and a fresh start.

## Status

Phase 1 gray-box: stops 1–3 playable (CREATE/INSERT, SELECT/WHERE/ORDER BY, UPDATE/DELETE), resource simulation, seeded events, local run history. See [ROADMAP.md](ROADMAP.md).

## Development

```
npm install
npm test        # grader + engine tests
```

Static site, no build step. Open `index.html` or serve the folder.

Companion product: [Analyst Prep Kit](https://michaelnocito.github.io/analyst-prep-kit/)
