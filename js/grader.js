// Grader: runs player SQL against a fresh sql.js DB and compares result sets.
// Set match (row order ignored unless the question tests ORDER BY), with
// partial-credit tiers that scale the reward (GDD §5).
(function (root) {
  'use strict';

  const TIER = { FULL: 'full', PARTIAL: 'partial', FAIL: 'fail' };

  // --- Sandbox guards (GDD directive 3) ---
  const BANNED = /\b(ATTACH|DETACH|PRAGMA|VACUUM|REINDEX)\b/i;
  const DDL_DML = /^\s*(CREATE|INSERT|UPDATE|DELETE|ALTER|DROP|REPLACE)\b/i;
  const ROW_CAP = 500;

  // Strip comments, then reject multiple statements.
  function stripComments(sql) {
    return sql.replace(/--[^\n]*/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');
  }

  function validate(sql, allowWrite) {
    const clean = stripComments(sql).trim();
    if (!clean) return 'Empty query.';
    if (BANNED.test(clean)) return 'That statement type is not allowed on the trail.';
    // Single-statement enforcement: no semicolon except optionally trailing.
    const body = clean.endsWith(';') ? clean.slice(0, -1) : clean;
    if (body.includes(';')) return 'One statement at a time, pioneer.';
    if (!allowWrite && DDL_DML.test(body)) {
      return 'Only SELECT is allowed at this stop.';
    }
    return null;
  }

  // Normalize a cell so 1 and 1.0 and "1" from different paths compare sanely.
  function normCell(v) {
    if (v === null || v === undefined) return '␀NULL';
    if (typeof v === 'number') {
      // Collapse float noise (0.30000000000000004 vs 0.3).
      return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e9) / 1e9);
    }
    return String(v);
  }

  function normRows(values) {
    return values.map(r => r.map(normCell));
  }

  function rowKey(r) { return JSON.stringify(r); }

  function sortRows(rows) {
    return rows.slice().sort((a, b) => (rowKey(a) < rowKey(b) ? -1 : rowKey(a) > rowKey(b) ? 1 : 0));
  }

  // Snapshot the schema of a live db: [{table, columns: [{name, type}]}].
  // Feeds the Object Explorer so player-created tables appear immediately.
  function snapshotSchema(db) {
    const out = [];
    const res = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    if (!res.length) return out;
    for (const [t] of res[0].values) {
      const info = db.exec(`PRAGMA table_info("${String(t).replace(/"/g, '""')}")`);
      out.push({
        table: t,
        columns: info.length ? info[0].values.map(r => ({ name: r[1], type: r[2] || '' })) : [],
      });
    }
    return out;
  }

  // Execute one statement; returns {columns, values} of the last SELECT, or null.
  function runOne(db, sql) {
    const res = db.exec(sql);
    if (!res.length) return { columns: [], values: [] };
    const last = res[res.length - 1];
    return { columns: last.columns, values: last.values.slice(0, ROW_CAP + 1) };
  }

  // Compare player result vs expected result.
  // orderMatters: compare in sequence; otherwise compare as multisets.
  function compareResults(player, expected, orderMatters) {
    const p = normRows(player.values);
    const e = normRows(expected.values);

    if (player.columns.length !== expected.columns.length) {
      return { tier: TIER.FAIL, reason: 'wrong-shape', overlap: 0 };
    }

    const pCmp = orderMatters ? p : sortRows(p);
    const eCmp = orderMatters ? e : sortRows(e);

    if (pCmp.length === eCmp.length &&
        pCmp.every((r, i) => rowKey(r) === rowKey(eCmp[i]))) {
      return { tier: TIER.FULL, reason: 'exact', overlap: 1 };
    }

    // Right shape, wrong rows: partial credit scaled by row overlap.
    const eKeys = new Map();
    for (const r of e) eKeys.set(rowKey(r), (eKeys.get(rowKey(r)) || 0) + 1);
    let hit = 0;
    for (const r of p) {
      const k = rowKey(r);
      if (eKeys.get(k) > 0) { hit++; eKeys.set(k, eKeys.get(k) - 1); }
    }
    const overlap = e.length ? hit / e.length : 0;

    if (overlap >= 0.5) {
      // Special case: right rows, wrong order, when order is the tested concept.
      if (orderMatters && overlap === 1 && p.length === e.length) {
        return { tier: TIER.PARTIAL, reason: 'wrong-order', overlap };
      }
      return { tier: TIER.PARTIAL, reason: 'partial-rows', overlap };
    }
    return { tier: TIER.FAIL, reason: 'wrong-rows', overlap };
  }

  // Grade one question. Each call gets a FRESH db built from seedSql.
  // question: { type: 'select'|'write', answer, check?, orderMatters? }
  //   select: compare player's SELECT result vs answer's result.
  //   write:  run player's DDL/DML, then run `check` SELECT and compare vs
  //           the check result after running `answer` on a second fresh db.
  function grade(SQL, seedSql, question, playerSql) {
    const allowWrite = question.type === 'write';
    const vErr = validate(playerSql, allowWrite);
    if (vErr) return { tier: TIER.FAIL, reason: 'rejected', error: vErr, overlap: 0 };

    const dbP = new SQL.Database();
    const dbE = new SQL.Database();
    try {
      dbP.exec(seedSql);
      dbE.exec(seedSql);
      let playerRes, expectedRes, rowsAffected = null;
      if (allowWrite) {
        dbP.exec(playerSql);
        rowsAffected = dbP.getRowsModified();
        dbE.exec(question.answer);
        playerRes = runOne(dbP, question.check);
        expectedRes = runOne(dbE, question.check);
      } else {
        playerRes = runOne(dbP, playerSql);
        expectedRes = runOne(dbE, question.answer);
      }
      if (playerRes.values.length > ROW_CAP) {
        return { tier: TIER.FAIL, reason: 'row-cap', error: `Result exceeds ${ROW_CAP} rows.`, overlap: 0 };
      }
      const cmp = compareResults(playerRes, expectedRes, !!question.orderMatters);
      cmp.playerRes = playerRes;
      cmp.rowsAffected = rowsAffected;
      cmp.schemaAfter = snapshotSchema(dbP);
      // Shape of the right answer (never its values) — fuels diagnostic coaching.
      cmp.expectedShape = { rows: expectedRes.values.length, cols: expectedRes.columns.length, columns: expectedRes.columns };
      return cmp;
    } catch (e) {
      return { tier: TIER.FAIL, reason: 'sql-error', error: e.message, overlap: 0 };
    } finally {
      dbP.close();
      dbE.close();
    }
  }

  const Grader = { grade, validate, compareResults, normRows, snapshotSchema, TIER, ROW_CAP };
  if (typeof module !== 'undefined' && module.exports) module.exports = Grader;
  else root.TrailGrader = Grader;
})(typeof self !== 'undefined' ? self : this);
