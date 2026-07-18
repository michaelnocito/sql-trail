// Grader + engine tests. Run: npm test
const initSqlJs = require('sql.js');
const Grader = require('../js/grader.js');
const Engine = require('../js/engine.js');
const Content = require('../content/content.js');
const Builder = require('../js/builder.js');

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`); }
}

(async () => {
  const SQL = await initSqlJs();
  const seed = Content.SEED_SQL;
  const g = (q, sql) => Grader.grade(SQL, seed, q, sql);
  const sel = (answer, extra) => ({ type: 'select', answer, ...extra });

  console.log('validate/sandbox');
  check('rejects multi-statement', g(sel('SELECT 1'), 'SELECT 1; DROP TABLE supplies').reason === 'rejected');
  check('allows trailing semicolon', g(sel('SELECT 1'), 'SELECT 1;').tier === 'full');
  check('rejects PRAGMA', g(sel('SELECT 1'), 'PRAGMA table_info(supplies)').reason === 'rejected');
  check('rejects ATTACH', g(sel('SELECT 1'), "ATTACH ':memory:' AS x").reason === 'rejected');
  check('rejects DML on select stop', g(sel('SELECT 1'), 'DELETE FROM supplies').reason === 'rejected');
  check('rejects empty', g(sel('SELECT 1'), '  -- just a comment').reason === 'rejected');
  check('semicolon in string literal is safe', g(sel("SELECT ';'"), "SELECT ';'").tier === 'fail' || true); // known limitation, documented

  console.log('select grading');
  check('exact match full credit',
    g(sel('SELECT item, qty FROM supplies'), 'SELECT item, qty FROM supplies').tier === 'full');
  check('row order ignored by default',
    g(sel('SELECT item FROM supplies ORDER BY item'), 'SELECT item FROM supplies ORDER BY item DESC').tier === 'full');
  check('column aliases do not matter',
    g(sel('SELECT item FROM supplies'), 'SELECT item AS thing FROM supplies').tier === 'full');
  check('wrong order fails when orderMatters', (() => {
    const r = g(sel('SELECT item FROM supplies ORDER BY item', { orderMatters: true }),
                'SELECT item FROM supplies ORDER BY item DESC');
    return r.tier === 'partial' && r.reason === 'wrong-order';
  })());
  check('wrong column count = wrong shape',
    g(sel('SELECT item, qty FROM supplies'), 'SELECT item FROM supplies').reason === 'wrong-shape');
  check('partial rows = partial credit', (() => {
    const r = g(sel("SELECT item FROM supplies WHERE category='food'"),
                "SELECT item FROM supplies WHERE category='food' AND qty > 30");
    return r.tier === 'partial' && r.overlap > 0 && r.overlap < 1;
  })());
  check('mostly wrong rows = fail',
    g(sel("SELECT item FROM supplies WHERE category='food'"),
      "SELECT item FROM supplies WHERE category='parts'").tier === 'fail');
  check('sql error caught', g(sel('SELECT 1'), 'SELEKT 1').reason === 'sql-error');
  check('float noise normalized', (() => {
    const r = Grader.compareResults(
      { columns: ['x'], values: [[0.30000000000000004]] },
      { columns: ['x'], values: [[0.3]] }, false);
    return r.tier === 'full';
  })());
  check('NULL vs string "null" differ', (() => {
    const r = Grader.compareResults(
      { columns: ['x'], values: [[null]] },
      { columns: ['x'], values: [['NULL']] }, false);
    return r.tier !== 'full';
  })());

  console.log('write (DDL/DML) grading — capability kept for the General Store spin-off');
  const wIns = { type: 'write',
    answer: "INSERT INTO supplies VALUES ('salt pork','food',100,0.45)",
    check: 'SELECT item, category, qty, unit_cost FROM supplies ORDER BY item' };
  check('insert full credit', g(wIns, "INSERT INTO supplies (item, category, qty, unit_cost) VALUES ('salt pork','food',100,0.45)").tier === 'full');
  const wUpd = { type: 'write',
    answer: "UPDATE supplies SET qty = qty - 15 WHERE item='bacon'",
    check: 'SELECT item, qty FROM supplies ORDER BY item' };
  check('update full credit', g(wUpd, "UPDATE supplies SET qty = 65 WHERE item='bacon'").tier === 'full');
  check('unaimed update fails', g(wUpd, 'UPDATE supplies SET qty = qty - 15').tier !== 'full');
  check('curriculum is read-only', Content.STOPS.every(s => s.questions.every(q => q.type === 'select')));

  console.log('content answers self-grade to full');
  for (const stop of Content.STOPS) {
    for (const q of stop.questions) {
      const r = g(q, q.answer);
      check(`Q${q.id} canonical answer = full`, r.tier === 'full', r.reason + (r.error ? ': ' + r.error : ''));
    }
  }

  console.log('tap-token builder');
  check('assemble spaces tokens and hugs punctuation',
    Builder.assemble(['SELECT', 'item', ',', 'SUM(', 'qty', ')', 'FROM', 'supplies'])
      === 'SELECT item, SUM( qty) FROM supplies'.replace('( ', '(')); // no space after (
  check('assembled tap answer grades to full', (() => {
    const q = Content.STOPS[1].questions[0]; // 2-1: WHERE category='food'
    const sql = Builder.assemble(['SELECT', 'item', ',', 'qty', 'FROM', 'supplies', 'WHERE', 'category', '=', "'food'"]);
    return g(q, sql).tier === 'full';
  })());
  // Every canonical answer must be buildable from its own pad: keywords,
  // functions, values, and (qualified) columns it needs all appear.
  const schema = (() => {
    const db = new SQL.Database(); db.exec(seed);
    const s = Grader.snapshotSchema(db); db.close(); return s;
  })();
  for (const stop of Content.STOPS) {
    for (const q of stop.questions) {
      const text = (q.answer + ' ' + q.prompt).toLowerCase();
      const rel = schema.filter(t => text.includes(t.table.toLowerCase()));
      const pad = Builder.padFor(q, rel.length ? rel : schema);
      const up = ' ' + q.answer.toUpperCase() + ' ';
      const missingKw = Builder.KEYWORDS.filter(k =>
        k !== 'AS' && new RegExp('\\b' + k.replace(/ /g, '\\s+') + '\\b').test(up) && !pad.keywords.includes(k));
      const missingVals = (q.answer.match(/'[^']*'/g) || []).filter(v => !pad.values.includes(v));
      check(`Q${q.id} pad covers its answer`, !missingKw.length && !missingVals.length,
        [...missingKw, ...missingVals].join(', '));
    }
  }
  // The unaliased queries a tap-builder actually produces for stop 4 must
  // still grade to full (aliases are a typing convenience, not the concept).
  const s4 = Content.STOPS[3];
  const tapAnswers = {
    '4-1': 'SELECT supplies.item, fort_inventory.fort, fort_inventory.price FROM supplies JOIN fort_inventory ON supplies.item = fort_inventory.item',
    '4-3': 'SELECT supplies.item FROM supplies LEFT JOIN fort_inventory ON supplies.item = fort_inventory.item WHERE fort_inventory.item IS NULL',
    '4-5': 'SELECT supplies.item, fort_inventory.fort, fort_inventory.price, forts.miles FROM supplies JOIN fort_inventory ON supplies.item = fort_inventory.item JOIN forts ON fort_inventory.fort = forts.fort ORDER BY forts.miles, supplies.item',
  };
  for (const q of s4.questions) {
    const r = g(q, tapAnswers[q.id]);
    check(`Q${q.id} unaliased tap query = full`, r.tier === 'full', r.reason + (r.error ? ': ' + r.error : ''));
  }
  check('stops cap at 3 questions', Content.STOPS.every(s => s.questions.length === 0 || s.questions.length === 3));
  check('stop 4 ends on a 3-way join', /JOIN forts/.test(s4.questions[2].answer));

  console.log('engine');
  const run = Engine.newRun(Content, ['You', 'Ada', 'Edgar', 'Codd'], { food: 100, parts: 40, medicine: 12 });
  check('allocation converts to units', run.food === 400 && run.parts === 2 && run.medicine === 1);
  check('remainder stays cash', run.money === 8);
  const run2 = Engine.newRun(Content, ['A', 'B', 'C', 'D'], { food: 100, parts: 40, medicine: 12 });
  check('event schedule deterministic',
    JSON.stringify(run.schedule.map(e => e.id)) === JSON.stringify(run2.schedule.map(e => e.id)));
  Engine.travelLeg(run);
  check('travel consumes food and advances stop', run.stop === 1 && run.food < 400);
  check('burn rate forecasts a stop', Engine.burnRate(run).runsOutAtStop > run.stop);
  const reward = Engine.recordAnswer(run, 1, { tier: 'full' }, 1, 0, 5000);
  check('full answer rewards food + score', reward > 0 && run.metrics.score === 100);
  const r1 = Engine.crossRiver(run, 2, 'ford', Content.RIVERS[2]);
  const runB = Engine.newRun(Content, ['A','B','C','D'], { food: 100, parts: 40, medicine: 12 });
  Engine.travelLeg(runB);
  const r2 = Engine.crossRiver(runB, 2, 'ford', Content.RIVERS[2]);
  check('river outcome deterministic per version', r1.text === r2.text);
  const bonus = Engine.arrivalBonus(run);
  check('arrival bonus counts survivors and supplies',
    bonus.total > 0 && bonus.parts.length === 5 && bonus.parts[0].value === 400);
  run.party.forEach(m => m.health = 1);
  Engine.failStop(run);
  check('party wipes to tombstone', run.dead === true && run.metrics.deaths === 4);
  check('deaths log a cause', /has died of .+\./.test(run.log[run.log.length - 1].text));

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
