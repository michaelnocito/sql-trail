# SQL Trail — cloud ledger setup (one-time)

Run this once in the Supabase SQL Editor (project `liiivtbyyawueboeavmw`, the same
one the Analyst Prep Kit and playtest tracker use). It creates the two Batch 5
tables. Safe to re-run.

Design notes:
- `trail_runs` is public-read (it feeds the global leaderboard) and public-insert.
  No update/delete policies exist, so rows are append-only from the browser.
- `trail_players` is **insert-only**: players may leave an email tied to their
  recovery code, but nothing can read emails back out through the API. Look
  codes up in the dashboard if someone loses theirs.

```sql
CREATE TABLE IF NOT EXISTS trail_runs (
  id BIGSERIAL PRIMARY KEY,
  player_code TEXT NOT NULL,
  player_name TEXT NOT NULL DEFAULT 'Pioneer',
  game_version TEXT NOT NULL,
  build INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  days INTEGER NOT NULL DEFAULT 0,
  health INTEGER NOT NULL DEFAULT 0,
  food INTEGER NOT NULL DEFAULT 0,
  coin INTEGER NOT NULL DEFAULT 0,
  hints INTEGER NOT NULL DEFAULT 0,
  finished BOOLEAN NOT NULL DEFAULT FALSE,
  towns JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trail_runs_player ON trail_runs(player_code);
CREATE INDEX IF NOT EXISTS idx_trail_runs_board ON trail_runs(game_version, score DESC);

CREATE TABLE IF NOT EXISTS trail_players (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE trail_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trail_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trail_runs public read" ON trail_runs;
DROP POLICY IF EXISTS "trail_runs public insert" ON trail_runs;
CREATE POLICY "trail_runs public read" ON trail_runs FOR SELECT USING (true);
CREATE POLICY "trail_runs public insert" ON trail_runs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "trail_players insert only" ON trail_players;
CREATE POLICY "trail_players insert only" ON trail_players FOR INSERT WITH CHECK (true);
-- deliberately NO select policy on trail_players: emails are write-only via the API
```
