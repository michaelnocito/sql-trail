// Tap-token query builder (Batch 2). Pure logic, no DOM: padFor() derives the
// token pad for a question, assemble() turns a tapped token sequence into SQL.
// index.html renders the pad and feeds the assembled text into the same
// editor/grader path as typing — the builder never grades anything itself.
(function (root) {
  'use strict';

  // AS is deliberately absent: the grader ignores column aliases, so tap
  // players never need it. Multi-word keywords are single tokens.
  const KEYWORDS = ['SELECT', 'DISTINCT', 'FROM', 'JOIN', 'LEFT JOIN', 'ON',
    'WHERE', 'AND', 'OR', 'IN', 'IS NULL', 'GROUP BY', 'HAVING',
    'ORDER BY', 'ASC', 'DESC'];
  // Always on the pad so early questions still ask for real recall, not a
  // one-button answer key.
  const CORE = ['SELECT', 'FROM', 'WHERE', 'ORDER BY'];
  const FUNCS = ['COUNT(*)', 'SUM(', 'MIN(', 'MAX(', 'AVG('];
  const OPS = ['*', ',', '=', '>', '<', '(', ')'];

  // Build the token pad for one question.
  // tables: [{table, columns:[{name}]}] — the question's relevant tables only
  // (same source as the schema strip, so the pad never shows more than the
  // strip does).
  function padFor(q, tables) {
    const up = ' ' + q.answer.toUpperCase() + ' ';
    const keywords = KEYWORDS.filter(k =>
      CORE.includes(k) || new RegExp('\\b' + k.replace(/ /g, '\\s+') + '\\b').test(up));
    const funcs = FUNCS.filter(f => up.includes(f.slice(0, f.indexOf('(') + 1)));
    // Multi-table questions get qualified column tokens (table.column) so
    // ambiguous names like item are never a trap; single-table stays plain.
    const qualify = tables.length > 1;
    const columns = [];
    for (const t of tables) {
      for (const c of t.columns) columns.push(qualify ? `${t.table}.${c.name}` : c.name);
    }
    // Literals come from the canonical answer: strings first, then numbers
    // from what's left (so 30 inside 'Fort 30' would not double-count).
    const strings = q.answer.match(/'[^']*'/g) || [];
    const rest = q.answer.replace(/'[^']*'/g, ' ');
    const numbers = (rest.match(/(?<![\w.])\d+(\.\d+)?(?![\w.])/g) || []);
    const values = [...new Set([...strings, ...numbers])];
    const ops = OPS.filter(o => (o === ',' || o === '=') ? true : rest.includes(o));
    return {
      keywords, funcs, ops, values,
      tables: tables.map(t => t.table),
      columns: [...new Set(columns)],
    };
  }

  // Join tapped tokens into SQL text. No space after '(' or before ',' / ')'.
  function assemble(tokens) {
    let out = '';
    for (const t of tokens) {
      if (!out) { out = t; continue; }
      if (t === ',' || t === ')') out += t;
      else if (out.endsWith('(')) out += t;
      else out += ' ' + t;
    }
    return out;
  }

  const Builder = { padFor, assemble, KEYWORDS, FUNCS, OPS };
  if (typeof module !== 'undefined' && module.exports) module.exports = Builder;
  else root.TrailBuilder = Builder;
})(typeof self !== 'undefined' ? self : this);
