// SQL Trail content bundle — versioned so metrics compare like with like.
// Phase 1: stops 1-3 live, stops 4-9 stubbed. Trail-themed tables shaped like
// real business schemas (GDD §7).
(function (root) {
  'use strict';

  const GAME_VERSION = '0.1.0';

  // Shared world schema seeded fresh for every challenge.
  const SEED_SQL = `
CREATE TABLE supplies (
  item TEXT PRIMARY KEY,
  category TEXT NOT NULL,        -- food | parts | medicine
  qty INTEGER NOT NULL,
  unit_cost REAL                 -- nullable: question 1-5 inserts without it
);
INSERT INTO supplies VALUES
 ('flour','food',200,0.20),
 ('bacon','food',80,0.55),
 ('dried apples','food',40,0.35),
 ('coffee','food',25,0.90),
 ('wagon wheel','parts',3,22.00),
 ('wagon axle','parts',2,18.50),
 ('wagon tongue','parts',1,16.00),
 ('medicine kit','medicine',2,12.75),
 ('bandages','medicine',6,1.10);

CREATE TABLE party (
  member_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  health INTEGER NOT NULL,       -- 0-100
  morale INTEGER NOT NULL        -- 0-100
);
INSERT INTO party VALUES
 (1,'You','leader',100,80),
 (2,'Ada','scout',95,85),
 (3,'Edgar','cook',90,70),
 (4,'Codd','navigator',100,90);

CREATE TABLE fort_inventory (
  sku INTEGER PRIMARY KEY,
  fort TEXT NOT NULL,
  item TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  stock INTEGER NOT NULL
);
INSERT INTO fort_inventory VALUES
 (1,'Fort Kearny','flour','food',0.25,500),
 (2,'Fort Kearny','bacon','food',0.60,120),
 (3,'Fort Kearny','wagon wheel','parts',25.00,4),
 (4,'Fort Laramie','flour','food',0.35,300),
 (5,'Fort Laramie','medicine kit','medicine',15.00,3),
 (6,'Fort Laramie','oxen shoe','parts',4.50,20),
 (7,'Fort Bridger','coffee','food',1.20,40),
 (8,'Fort Bridger','wagon axle','parts',21.00,2),
 (9,'Fort Bridger','bandages','medicine',1.50,25);
`;

  // Forage table seeded only for the forage minigame (Phase 4) — kept here so
  // the schema ships with the version.
  const FORAGE_SQL = `
CREATE TABLE forage (
  plant TEXT PRIMARY KEY,
  kind TEXT NOT NULL,            -- berry | root | green
  edible INTEGER NOT NULL,       -- 1 yes, 0 no
  lbs REAL NOT NULL
);
INSERT INTO forage VALUES
 ('chokecherry','berry',1,2.0),('wild onion','root',1,1.0),
 ('buffalo berry','berry',1,2.5),('death camas','root',0,0.0),
 ('lambsquarter','green',1,0.5),('snakeberry','berry',0,0.0);
`;

  // Question fields: id, prompt, type ('select'|'write'), answer, check (write
  // only), orderMatters, hints [free concept, structure, near-answer].
  const STOPS = [
    {
      id: 1, name: 'Independence, MO', theme: 'Read the ledger',
      concept: 'SELECT fundamentals',
      intro: 'The outfitter keeps the books; your job is to read them. Guided pace: the trail gets harder from here.',
      questions: [
        {
          id: '1-1', type: 'select',
          prompt: 'Select every column and every row from supplies.',
          answer: 'SELECT * FROM supplies',
          hints: ['SELECT * pulls every column; no WHERE means every row.',
                  'SELECT * FROM table_name',
                  'SELECT * FROM supplies'],
        },
        {
          id: '1-2', type: 'select',
          prompt: 'From supplies, return only the item and qty columns.',
          answer: 'SELECT item, qty FROM supplies',
          hints: ['Name the columns you want, separated by commas.',
                  'SELECT col1, col2 FROM table',
                  'SELECT item, ___ FROM supplies'],
        },
        {
          id: '1-3', type: 'select',
          prompt: 'What categories of supplies exist? Return each category once, no repeats.',
          answer: 'SELECT DISTINCT category FROM supplies',
          hints: ['DISTINCT collapses duplicate values in the result.',
                  'SELECT DISTINCT column FROM table',
                  'SELECT DISTINCT ___ FROM supplies'],
        },
        {
          id: '1-4', type: 'select',
          prompt: 'From fort_inventory, return fort, item, and price for every row.',
          answer: 'SELECT fort, item, price FROM fort_inventory',
          hints: ['Same idea, different table: pick your columns.',
                  'SELECT colA, colB, colC FROM fort_inventory',
                  'SELECT fort, item, ___ FROM fort_inventory'],
        },
        {
          id: '1-5', type: 'select',
          prompt: 'What is each supply worth in total? Return item and qty * unit_cost (name the computed column total_value).',
          answer: 'SELECT item, qty * unit_cost AS total_value FROM supplies',
          hints: ['You can do arithmetic between columns right in the SELECT list; AS names the result.',
                  'SELECT item, colA * colB AS new_name FROM table',
                  'SELECT item, qty * ___ AS total_value FROM supplies'],
        },
      ],
    },
    {
      id: 2, name: 'Fort Kearny', theme: 'First landmark',
      concept: 'WHERE / ORDER BY',
      intro: 'Read your own supply data before you trust it. The store clerk certainly will not.',
      questions: [
        {
          id: '2-1', type: 'select',
          prompt: "List item and qty for supplies in the 'food' category only.",
          answer: "SELECT item, qty FROM supplies WHERE category='food'",
          hints: ['WHERE filters rows; name only the columns you need.',
                  "SELECT col1, col2 FROM table WHERE col = 'value'",
                  "SELECT item, qty FROM supplies WHERE category='___'"],
        },
        {
          id: '2-2', type: 'select',
          prompt: "List item and category for supplies whose category is 'parts' or 'medicine' — use IN.",
          answer: "SELECT item, category FROM supplies WHERE category IN ('parts','medicine')",
          hints: ['IN matches a value against a list.',
                  "WHERE column IN ('a','b')",
                  "SELECT item, category FROM supplies WHERE category IN ('parts','___')"],
        },
        {
          id: '2-3', type: 'select', orderMatters: true,
          prompt: 'List item and unit_cost for all supplies, most expensive first.',
          answer: 'SELECT item, unit_cost FROM supplies ORDER BY unit_cost DESC',
          hints: ['ORDER BY sorts the result; DESC flips it to high-to-low.',
                  'SELECT ... FROM ... ORDER BY column DESC',
                  'SELECT item, unit_cost FROM supplies ORDER BY unit_cost ___'],
        },
        {
          id: '2-4', type: 'select',
          prompt: 'Which food supplies have more than 30 in qty? Return item and qty. Two conditions, one WHERE.',
          answer: "SELECT item, qty FROM supplies WHERE category='food' AND qty > 30",
          hints: ['AND requires both conditions to be true.',
                  "WHERE conditionA AND conditionB",
                  "SELECT item, qty FROM supplies WHERE category='food' AND qty > ___"],
        },
        {
          id: '2-5', type: 'select', orderMatters: true,
          prompt: "From fort_inventory, list item and price at 'Fort Kearny', cheapest first.",
          answer: "SELECT item, price FROM fort_inventory WHERE fort='Fort Kearny' ORDER BY price ASC",
          hints: ['Combine WHERE and ORDER BY: filter first, then sort.',
                  "SELECT ... WHERE fort = '...' ORDER BY price ASC",
                  "SELECT item, price FROM fort_inventory WHERE fort='Fort Kearny' ORDER BY ___"],
        },
      ],
    },
    {
      id: 3, name: 'Chimney Rock', theme: 'Tallies',
      concept: 'Aggregates + GROUP BY / HAVING',
      intro: 'One number that summarizes a hundred rows is worth a hundred rows. Count the wagon before the mountains do.',
      questions: [
        {
          id: '3-1', type: 'select',
          prompt: 'How many different supply items are in the wagon? Return a single count.',
          answer: 'SELECT COUNT(*) FROM supplies',
          hints: ['COUNT(*) counts rows.',
                  'SELECT COUNT(*) FROM table',
                  'SELECT COUNT(*) FROM ___'],
        },
        {
          id: '3-2', type: 'select',
          prompt: "How many total units of food are on board? Sum qty for the 'food' category.",
          answer: "SELECT SUM(qty) FROM supplies WHERE category='food'",
          hints: ['SUM totals a column; WHERE still filters first.',
                  'SELECT SUM(column) FROM table WHERE ...',
                  "SELECT SUM(qty) FROM supplies WHERE category='___'"],
        },
        {
          id: '3-3', type: 'select',
          prompt: 'Total qty per category: return category and the sum of qty for each.',
          answer: 'SELECT category, SUM(qty) FROM supplies GROUP BY category',
          hints: ['GROUP BY makes one result row per group; aggregates run inside each group.',
                  'SELECT group_col, SUM(col) FROM table GROUP BY group_col',
                  'SELECT category, SUM(qty) FROM supplies GROUP BY ___'],
        },
        {
          id: '3-4', type: 'select',
          prompt: 'How many items does each fort stock? From fort_inventory, return fort and a count per fort.',
          answer: 'SELECT fort, COUNT(*) FROM fort_inventory GROUP BY fort',
          hints: ['Same pattern, different table: one row per fort.',
                  'SELECT fort, COUNT(*) FROM fort_inventory GROUP BY fort',
                  'SELECT fort, COUNT(*) FROM fort_inventory GROUP BY ___'],
        },
        {
          id: '3-5', type: 'select',
          prompt: 'Which categories carry more than 100 total units? Return category and the sum — filter on the aggregate.',
          answer: 'SELECT category, SUM(qty) FROM supplies GROUP BY category HAVING SUM(qty) > 100',
          hints: ['WHERE filters rows before grouping; HAVING filters groups after aggregating.',
                  'GROUP BY col HAVING SUM(col) > n',
                  'SELECT category, SUM(qty) FROM supplies GROUP BY category HAVING SUM(qty) > ___'],
        },
      ],
    },
    // Stops 4-9: Phase 2 content. Stubbed so the map renders the full trail.
    { id: 4, name: 'Fort Laramie', theme: 'Joins', concept: 'JOINs', questions: [] },
    { id: 5, name: 'Independence Rock', theme: 'Layers', concept: 'Subqueries + CTEs', questions: [] },
    { id: 6, name: 'South Pass', theme: 'Branches', concept: 'CASE + conditional aggregation', questions: [] },
    { id: 7, name: 'Fort Bridger', theme: 'Windows', concept: 'Window functions', questions: [] },
    { id: 8, name: 'Snake River', theme: 'Cleanup', concept: 'Date & string functions', questions: [] },
    { id: 9, name: 'Willamette Valley', theme: 'Capstone', concept: 'Multi-step business question', questions: [] },
  ];

  // Seeded event pool: the scheduler draws deterministically per GAME_VERSION.
  // effects are deltas applied to run state.
  const EVENTS = [
    { id: 'river',    icon: '🌊', text: 'River crossing. The ferry operator charges $40.', effects: { money: -40 } },
    { id: 'axle',     icon: '🛞', text: 'A wagon axle cracks on rocky ground.', effects: { parts: -1, morale: -5 } },
    { id: 'rain',     icon: '🌧️', text: 'Three days of rain. 20 lbs of food spoils.', effects: { food: -20, morale: -5 } },
    { id: 'fever',    icon: '🤒', text: 'Ada has a fever. She loses 15 health.', effects: { health: [-0, -15, -0, -0] } },
    { id: 'berries',  icon: '🫐', text: 'Wild berries near the trail. +10 lbs food.', effects: { food: 10, morale: 5 } },
    { id: 'trader',   icon: '🤝', text: 'A trader buys your spare rope. +$15.', effects: { money: 15 } },
    { id: 'oxen',     icon: '🐂', text: 'An ox goes lame. You slow down and lose 2 days.', effects: { days: 2, morale: -5 } },
    { id: 'dust',     icon: '🌪️', text: 'Dust storm. Everyone loses 5 health.', effects: { health: [-5, -5, -5, -5] } },
    { id: 'wheel',    icon: '🛞', text: 'Wheel shatters in a rut.', effects: { parts: -1 } },
    { id: 'good_water', icon: '💧', text: 'Clean spring water. Everyone gains 5 health.', effects: { health: [5, 5, 5, 5], morale: 5 } },
  ];

  // Item icons shown next to values in result grids (simple graphical wins).
  const ITEM_ICONS = {
    'flour': '🌾', 'bacon': '🥓', 'dried apples': '🍎', 'coffee': '☕',
    'salt pork': '🥩', 'cornmeal': '🌽', 'lard': '🧈', 'rope': '🪢',
    'wagon wheel': '🛞', 'wagon axle': '⚙️', 'wagon tongue': '🪵', 'oxen shoe': '🐂',
    'medicine kit': '💊', 'bandages': '🩹',
    'food': '🌾', 'parts': '🔧', 'medicine': '💊',
    'Fort Kearny': '🏕️', 'Fort Laramie': '🏕️', 'Fort Bridger': '🏕️',
  };

  // Arrival flavor per stop (Batch 1: landmark vignettes).
  const VIGNETTES = {
    1: { art: '  🏘️ ⛺ 🐂🐂\n ═══════════', flavor: 'Independence hums with outfitters, oxen, and bad advice.' },
    2: { art: '  🏕️ 🇺🇸\n ▄▄█▄▄▄█▄▄', flavor: 'Fort Kearny: the first landmark. The trail is real now.' },
    3: { art: '    ▲\n   ███\n  ▁███▁', flavor: 'Chimney Rock rises from the plain like a stone exclamation mark.' },
    4: { art: '  🏕️ ⚒️\n ▄█▄▄█▄▄█▄', flavor: 'Fort Laramie. Blacksmiths, traders, and prices that climb like the mountains ahead.' },
    5: { art: '   ⬭\n ▂▄████▄▂', flavor: 'Independence Rock. Carve your name; thousands already did.' },
    6: { art: ' ⛰️    ⛰️\n   ➡️\n▔▔▔▔▔▔▔▔', flavor: 'South Pass: the gentle gate through the Rockies.' },
    7: { art: '  🏕️ 🐴\n ▄▄█▄█▄▄', flavor: 'Fort Bridger. Last good resupply before the dry country.' },
    8: { art: ' 🌊🌊🌊\n ~~~~~~~~', flavor: 'The Snake River winds below. Respect it.' },
    9: { art: ' 🌲🌾🌲\n 🏡🌲🌾', flavor: 'The Willamette Valley. Green, wide, and yours — if the books balance.' },
  };

  // River crossings before these stops (Batch 1). Outcomes are seeded per
  // GAME_VERSION so every run faces identical rivers.
  const RIVERS = {
    2: { name: 'Kansas River', ferry: 25 },
    5: { name: 'North Platte River', ferry: 30 },
    8: { name: 'Snake River', ferry: 40 },
  };

  const DEATH_CAUSES = ['dysentery', 'typhoid fever', 'cholera', 'a snakebite', 'exhaustion'];

  const EPITAPHS = [
    'died of a Cartesian product',
    'forgot the WHERE clause',
    'joined the great table in the sky',
    'GROUP BY grief',
    'dropped like a table',
    'never did commit',
  ];

  const CONTENT = { GAME_VERSION, SEED_SQL, FORAGE_SQL, STOPS, EVENTS, EPITAPHS, ITEM_ICONS, VIGNETTES, RIVERS, DEATH_CAUSES };
  if (typeof module !== 'undefined' && module.exports) module.exports = CONTENT;
  else root.TrailContent = CONTENT;
})(typeof self !== 'undefined' ? self : this);
