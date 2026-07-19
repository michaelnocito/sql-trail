// Cloud ledger (Batch 5): run storage, recovery codes, leaderboard.
// Same Supabase project as the Analyst Prep Kit / playtest tracker; the key
// below is the browser-safe publishable key (RLS decides what it may do).
// Plain REST — no client library, nothing new to load on the trail.
(function (root) {
  'use strict';

  const SB_URL = 'https://liiivtbyyawueboeavmw.supabase.co';
  const SB_KEY = 'sb_publishable_O-6hDpC3l1KdDtHpcv6JVw_O5dSJQor';
  const PLAYER_KEY = 'sql-trail-player-v1';
  const QUEUE_KEY = 'sql-trail-cloud-queue-v1';

  // Frontier recovery codes: WORD-WORD-YEAR (OXEN-RIVER-1847 style).
  // ~52k combos + a collision just means two wagons share a ledger page.
  const W1 = ['OXEN', 'WAGON', 'PRAIRIE', 'FERRY', 'BISON', 'BANJO', 'CODD', 'SADDLE',
    'LEDGER', 'FORT', 'CANYON', 'MESA', 'WILLOW', 'SIERRA', 'DUSTY', 'RUSTY'];
  const W2 = ['RIVER', 'TRAIL', 'CREEK', 'RIDGE', 'PASS', 'FORK', 'BLUFF', 'MEADOW',
    'SPRING', 'HOLLOW', 'SUMMIT', 'VALLEY', 'GULCH', 'PLAINS', 'CROSSING', 'JUNCTION'];

  function newCode(rand) {
    const r = rand || Math.random;
    return W1[Math.floor(r() * W1.length)] + '-' +
           W2[Math.floor(r() * W2.length)] + '-' +
           (1840 + Math.floor(r() * 60));
  }
  function validCode(s) { return /^[A-Z]+-[A-Z]+-\d{4}$/.test(String(s || '').trim().toUpperCase()); }
  function normCode(s) { return String(s || '').trim().toUpperCase().replace(/\s+/g, ''); }

  // ---------- local player identity ----------
  function getPlayer() {
    let p = null;
    try { p = JSON.parse(localStorage.getItem(PLAYER_KEY)); } catch { /* fresh */ }
    if (!p || !validCode(p.code)) {
      p = { code: newCode(), email: '' };
      try { localStorage.setItem(PLAYER_KEY, JSON.stringify(p)); } catch { /* private mode */ }
    }
    return p;
  }
  function setPlayer(p) {
    try { localStorage.setItem(PLAYER_KEY, JSON.stringify(p)); } catch { /* private mode */ }
  }

  // ---------- REST helpers ----------
  async function api(path, opts) {
    const res = await fetch(SB_URL + '/rest/v1/' + path, Object.assign({
      headers: Object.assign({
        apikey: SB_KEY,
        Authorization: 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
      }, (opts && opts.headers) || {}),
    }, opts || {}));
    if (!res.ok) throw new Error('cloud ' + res.status);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  // Shape one finished/dead run into a ledger row. Pure — tested in node.
  function runRow(run, finished, build) {
    const m = run.metrics || {};
    return {
      player_code: getSafe(() => getPlayer().code) || 'UNKNOWN-TRAIL-0000',
      player_name: String((run.party && run.party[0] && run.party[0].name) || 'Pioneer').slice(0, 12),
      game_version: run.version,
      build: build || 0,
      score: m.score || 0,
      days: run.day,
      health: Math.max(0, run.health),
      food: Math.max(0, run.food),
      coin: Math.max(0, run.coin),
      hints: m.hints || 0,
      finished: !!finished,
      towns: (m.perStop || []).map(s => ({
        stop: s.stop, concept: s.concept, correct: !!s.correct,
        misses: s.misses, time_s: Math.round((s.timeMs || 0) / 1000),
      })),
    };
  }
  function getSafe(f) { try { return f(); } catch { return null; } }

  // ---------- save (with offline queue, playtest-tracker style) ----------
  function loadQueue() { try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; } catch { return []; } }
  function saveQueue(q) { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-20))); } catch { /* full */ } }

  async function saveRun(run, finished, build) {
    const row = runRow(run, finished, build);
    try {
      await api('trail_runs', { method: 'POST', body: JSON.stringify(row), headers: { Prefer: 'return=minimal' } });
      flushQueue(); // a good save means the wire is up — drain stragglers
      return true;
    } catch {
      const q = loadQueue(); q.push(row); saveQueue(q);
      return false;
    }
  }
  async function flushQueue() {
    const q = loadQueue();
    if (!q.length) return;
    const left = [];
    for (const row of q) {
      try { await api('trail_runs', { method: 'POST', body: JSON.stringify(row), headers: { Prefer: 'return=minimal' } }); }
      catch { left.push(row); }
    }
    saveQueue(left);
  }

  // ---------- reads ----------
  function fetchMyRuns(code) {
    return api('trail_runs?player_code=eq.' + encodeURIComponent(normCode(code)) +
      '&select=game_version,build,score,days,health,hints,finished,created_at&order=created_at.asc&limit=200');
  }
  // Top scores for one version so metrics compare like with like; one row per
  // player (their best) so the board isn't one hot streak ten times over.
  async function fetchLeaderboard(version) {
    const rows = await api('trail_runs?game_version=eq.' + encodeURIComponent(version) +
      '&select=player_code,player_name,score,days,hints,finished,created_at&order=score.desc&limit=200');
    return bestPerPlayer(rows).slice(0, 10);
  }
  function bestPerPlayer(rows) {
    const seen = new Set(), out = [];
    for (const r of rows || []) {
      if (seen.has(r.player_code)) continue;
      seen.add(r.player_code); out.push(r);
    }
    return out;
  }

  // Optional email: written so the trail boss can hand a code back if it's
  // lost. INSERT-only table under RLS — nobody can read emails back out.
  async function registerEmail(email) {
    const p = getPlayer();
    p.email = String(email || '').trim();
    setPlayer(p);
    if (!p.email) return false;
    try {
      await api('trail_players', {
        method: 'POST', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ code: p.code, email: p.email }),
      });
      return true;
    } catch { return false; }
  }

  // Adopt a code from another device. Cloud runs stay keyed to it; local
  // history stays local (scores merge on the records screen, not in storage).
  function adoptCode(code) {
    const c = normCode(code);
    if (!validCode(c)) return false;
    const p = getPlayer(); p.code = c; setPlayer(p);
    return true;
  }

  const Cloud = {
    SB_URL, newCode, validCode, normCode, runRow, bestPerPlayer,
    getPlayer, adoptCode, registerEmail, saveRun, flushQueue, fetchMyRuns, fetchLeaderboard,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Cloud;
  else root.TrailCloud = Cloud;
})(typeof self !== 'undefined' ? self : this);
