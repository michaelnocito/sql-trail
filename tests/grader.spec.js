// Grader + engine + builder tests. Run: npm test
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
  check('rejects DML on select stop', g(sel('SELECT 1'), 'DELETE FROM supplies').reason === 'rejected');
  check('rejects empty', g(sel('SELECT 1'), '  -- just a comment').reason === 'rejected');

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
  check('sql error caught', g(sel('SELECT 1'), 'SELEKT 1').reason === 'sql-error');

  console.log('card pool: content answers self-grade to full');
  check('pool has 36 cards', Content.CARD_POOL.length === 36, String(Content.CARD_POOL.length));
  check('four cards per tier 1-9', [1,2,3,4,5,6,7,8,9].every(t => Content.CARD_POOL.filter(c => c.tier === t).length === 4));
  check('every town has a tier', [1,2,3,4,5,6,7,8,9].every(t => Content.TOWN_TIER[t] === t));
  check('every card carries a story + reward',
    Content.CARD_POOL.every(c => c.story && c.reward && typeof c.reward.food === 'number' && typeof c.reward.coin === 'number'));
  check('curriculum is read-only', Content.CARD_POOL.every(c => c.type !== 'write'));
  for (const c of Content.CARD_POOL) {
    const r = g(c, c.answer);
    check(`card ${c.id} canonical answer = full`, r.tier === 'full', r.reason + (r.error ? ': ' + r.error : ''));
  }

  console.log('tap-token builder covers every card');
  const schema = (() => { const db = new SQL.Database(); db.exec(seed); const s = Grader.snapshotSchema(db); db.close(); return s; })();
  for (const c of Content.CARD_POOL) {
    const text = (c.answer + ' ' + c.prompt).toLowerCase();
    const rel = schema.filter(t => text.includes(t.table.toLowerCase()));
    const pad = Builder.padFor(c, rel.length ? rel : schema);
    const up = ' ' + c.answer.toUpperCase() + ' ';
    const missingKw = Builder.KEYWORDS.filter(k =>
      k !== 'AS' && new RegExp('\\b' + k.replace(/ /g, '\\s+') + '\\b').test(up) && !pad.keywords.includes(k));
    const missingVals = (c.answer.match(/'[^']*'/g) || []).filter(v => !pad.values.includes(v));
    check(`card ${c.id} pad covers its answer`, !missingKw.length && !missingVals.length, [...missingKw, ...missingVals].join(', '));
  }
  // Unaliased tap-builder JOIN queries must still grade to full.
  const tapJoins = {
    'join-inner': 'SELECT supplies.item, fort_inventory.fort, fort_inventory.price FROM supplies JOIN fort_inventory ON supplies.item = fort_inventory.item',
    'join-anti': 'SELECT supplies.item FROM supplies LEFT JOIN fort_inventory ON supplies.item = fort_inventory.item WHERE fort_inventory.item IS NULL',
    'join-three': 'SELECT supplies.item, fort_inventory.fort, fort_inventory.price, forts.miles FROM supplies JOIN fort_inventory ON supplies.item = fort_inventory.item JOIN forts ON fort_inventory.fort = forts.fort ORDER BY forts.miles, supplies.item',
  };
  for (const id of Object.keys(tapJoins)) {
    const card = Content.CARD_POOL.find(c => c.id === id);
    const r = g(card, tapJoins[id]);
    check(`card ${id} unaliased tap query = full`, r.tier === 'full', r.reason + (r.error ? ': ' + r.error : ''));
  }

  console.log('forage cards self-grade against seed+forage schema');
  for (const c of Content.FORAGE_CARDS) {
    const r = Grader.grade(SQL, seed + Content.FORAGE_SQL, c, c.answer);
    check(`forage ${c.id} canonical answer = full`, r.tier === 'full', r.reason + (r.error ? ': ' + r.error : ''));
  }
  check('stores and traders reference real towns',
    Object.keys(Content.STORES).concat(Object.keys(Content.TRADERS)).every(t => Content.TOWN_TIER[+t]));

  console.log('engine: three resources + roguelite rewards');
  const run = Engine.newRun(Content, ['You', 'Ada', 'Edgar', 'Codd'], { food: 30 });
  check('food dollars convert to lbs', run.food === Math.floor(30 / Engine.FOOD_PRICE));
  check('remainder stays coin', run.coin === Engine.START.coin - 30);
  check('health starts full, no other resources', run.health === 100 && run.money === undefined && run.parts === undefined && run.morale === undefined);
  const run2 = Engine.newRun(Content, ['A','B','C','D'], { food: 30 });
  check('event schedule deterministic',
    JSON.stringify(run.schedule.map(e => e.id)) === JSON.stringify(run2.schedule.map(e => e.id)));
  Engine.travelLeg(run);
  check('travel consumes food and advances town', run.stop === 1 && run.food < Math.floor(30 / Engine.FOOD_PRICE));

  const rA = Engine.crossRiver(run, 2, 'ford', Content.RIVERS[2]);
  const runB = Engine.newRun(Content, ['A','B','C','D'], { food: 30 }); Engine.travelLeg(runB);
  const rB = Engine.crossRiver(runB, 2, 'ford', Content.RIVERS[2]);
  check('river outcome deterministic per version', rA.text === rB.text);
  const ferryRun = Engine.newRun(Content, ['A','B','C','D'], { food: 0 });
  const coinBefore = ferryRun.coin, dayBefore = ferryRun.day;
  Engine.crossRiver(ferryRun, 2, 'ferry', Content.RIVERS[2]);
  check('ferry spends coin', ferryRun.coin === coinBefore - Content.RIVERS[2].ferry);
  check('ferry costs a day (safety trades time)', ferryRun.day === dayBefore + 1);

  const soloRun = Engine.newRun(Content, ['A','B'], { food: 30 });
  const duoDays = Engine.legDays(soloRun);
  soloRun.party[1].health = 0; soloRun.party[1].dead = true;
  check('lone survivor travels 2 days faster per leg', Engine.legDays(soloRun) === duoDays - 2);
  check('legDays never drops below 1', Engine.legDays(soloRun, 'grueling') >= 1);

  const shapeCard = Content.CARD_POOL.find(c => c.id === 'sel-cols');
  const shapeR = Grader.grade(SQL, Content.SEED_SQL, shapeCard, 'SELECT item FROM supplies');
  check('grade exposes expected shape for coaching',
    shapeR.expectedShape && shapeR.expectedShape.cols === 2 && shapeR.expectedShape.rows === 9
    && shapeR.expectedShape.columns.join(',') === 'item,qty');

  const bonus = Engine.arrivalBonus(run);
  check('arrival bonus is health/food/coin', bonus.parts.length === 3 && bonus.parts[0].label === 'Health' && bonus.parts[0].value === Math.round(run.health * 3));

  const card = { concept: 'x', reward: { food: 40, coin: 10 } };
  const full = Engine.recordAnswer(run, 1, card, 'full', 0, 5000);
  check('full credit pays food+coin+score', full.food === 40 && full.coin === 10 && run.metrics.score === 100);
  const helped = Engine.recordAnswer(run, 1, card, 'full', 2, 5000);
  check('two misses halve the reward', helped.food === 20 && helped.coin === 5);
  const missed = Engine.recordAnswer(run, 1, card, 'fail', 3, 5000);
  check('an unsolved card pays nothing', missed.food === 0 && missed.coin === 0);
  const typedClean = Engine.recordAnswer(run, 1, card, 'full', 0, 5000, 'type');
  check('typing pays a 25% premium', typedClean.food === 50 && typedClean.coin === 13);
  const typedMiss = Engine.recordAnswer(run, 1, card, 'full', 2, 5000, 'type');
  check('typed misses sting less (15% each)', typedMiss.food === 38 && typedMiss.coin === 10);

  console.log('two-member party (individual health)');
  const duo = Engine.newRun(Content, ['A','B','C','D'], { food: 30 });
  check('party capped at two members', duo.party.length === 2 && duo.party[0].name === 'A' && duo.party[1].name === 'B');
  check('members start at 100 each', duo.party.every(m => m.health === 100 && !m.dead));
  Engine.applyEffects(duo, { health: -10 });
  const hurt = duo.party.filter(m => m.health < 100);
  check('misfortune hits ONE member at double strength', hurt.length === 1 && hurt[0].health === 80);
  check('derived party health is the average', duo.health === 90);

  const dyingRun = Engine.newRun(Content, ['A','B','C','D'], { food: 30 });
  dyingRun.party[0].health = 5; dyingRun.party[1].health = 5;
  Engine.applyEffects(dyingRun, { health: -10 });
  check('one member dies, run continues', dyingRun.metrics.deaths === 1 && dyingRun.dead === false && Engine.living(dyingRun).length === 1);
  const grave = dyingRun.graves[0];
  check('death carves a grave with name+cause+stop', !!grave && !!grave.name && !!grave.cause && grave.stop >= 1);
  check('death log names the member and cause', /💀 [AB] has died of .+\./.test(dyingRun.log[dyingRun.log.length - 1].text));
  Engine.applyEffects(dyingRun, { health: -10 }); // survivor takes it solo (no doubling)
  check('party dies when the last member falls', dyingRun.dead === true && dyingRun.metrics.deaths === 2 && dyingRun.graves.length === 2);
  check('death causes are seeded/deterministic', Engine.deathCause(dyingRun, 'A') === Engine.deathCause(dyingRun, 'A'));
  const healRun = Engine.newRun(Content, ['A','B','C','D'], { food: 30 });
  healRun.party[0].health = 40; healRun.party[1].health = 40;
  Engine.applyEffects(healRun, { health: 25 });
  check('healing lifts every living member', healRun.party.every(m => m.health === 65));
  const br = Engine.burnRate(run);
  check('burn rate reports lbs/leg and legs left', br.lbsPerLeg > 0 && typeof br.legsOfFood === 'number');

  console.log('cloud ledger (Batch 5)');
  const Cloud = require('../js/cloud.js');
  const RNG = require('../js/rng.js');
  check('recovery code format', Cloud.validCode(Cloud.newCode()));
  check('seeded code deterministic', Cloud.newCode(RNG.fromVersion('x')) === Cloud.newCode(RNG.fromVersion('x')));
  check('validCode rejects junk', !Cloud.validCode('howdy') && !Cloud.validCode('OXEN-RIVER') && !Cloud.validCode(''));
  check('normCode uppercases and trims', Cloud.normCode('  oxen-river-1847 ') === 'OXEN-RIVER-1847');
  const cRun = Engine.newRun(Content, ['Mike','A','B','C'], { food: 30 });
  Engine.recordAnswer(cRun, 1, { concept: 'JOINs', reward: { food: 10, coin: 5 } }, 'full', 1, 4000);
  const row = Cloud.runRow(cRun, true, 23);
  check('runRow carries score/version/build', row.score === cRun.metrics.score && row.game_version === cRun.version && row.build === 23 && row.finished === true);
  check('runRow names the leader', row.player_name === 'Mike');
  check('runRow flattens per-town rows', row.towns.length === 1 && row.towns[0].concept === 'JOINs' && row.towns[0].correct === true && row.towns[0].time_s === 4);
  const board = Cloud.bestPerPlayer([
    { player_code: 'A-A-1', score: 900 }, { player_code: 'B-B-1', score: 800 }, { player_code: 'A-A-1', score: 700 }]);
  check('leaderboard keeps best run per player', board.length === 2 && board[0].score === 900 && board[1].score === 800);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
