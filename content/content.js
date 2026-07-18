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
      id: 1, name: 'Independence, MO', theme: 'Outfitting',
      concept: 'INSERT — stock the wagon',
      intro: 'The tables already exist; the outfitter keeps the books. Your job is to stock them. Guided pace: the trail gets harder from here.',
      questions: [
        {
          id: '1-1', type: 'write',
          prompt: "The general store sold you salt pork. Insert a row into supplies: item 'salt pork', category 'food', qty 100, unit_cost 0.45.",
          answer: "INSERT INTO supplies VALUES ('salt pork','food',100,0.45)",
          check: 'SELECT item, category, qty, unit_cost FROM supplies ORDER BY item',
          hints: ['INSERT INTO adds one or more rows to an existing table.',
                  'INSERT INTO table VALUES (v1, v2, ...) — values in column order.',
                  "INSERT INTO supplies VALUES ('salt pork','food',100,___)"],
        },
        {
          id: '1-2', type: 'write',
          prompt: "Insert a fifth party member into party: member_id 5, name 'Boole', role 'hunter', health 100, morale 75.",
          answer: "INSERT INTO party VALUES (5,'Boole','hunter',100,75)",
          check: 'SELECT member_id, name, role, health, morale FROM party ORDER BY member_id',
          hints: ['Rows go in with INSERT INTO; text values need quotes, numbers do not.',
                  'INSERT INTO party VALUES (id, name, role, health, morale)',
                  "INSERT INTO party VALUES (5,'Boole','hunter',100,___)"],
        },
        {
          id: '1-3', type: 'write',
          prompt: "Using explicit column names, insert into supplies only item, category, and qty (unit_cost can stay NULL): item 'rope', category 'parts', qty 2.",
          answer: "INSERT INTO supplies (item, category, qty) VALUES ('rope','parts',2)",
          check: 'SELECT item, category, qty, unit_cost FROM supplies ORDER BY item',
          hints: ['Naming columns in INSERT lets you skip some; skipped columns default to NULL.',
                  'INSERT INTO table (colA, colB, colC) VALUES (a, b, c)',
                  "INSERT INTO supplies (item, category, qty) VALUES ('rope','parts',___)"],
        },
        {
          id: '1-4', type: 'write',
          prompt: "Two purchases, one statement. Insert both rows into supplies with a single INSERT: ('cornmeal','food',60,0.15) and ('lard','food',30,0.40).",
          answer: "INSERT INTO supplies VALUES ('cornmeal','food',60,0.15),('lard','food',30,0.40)",
          check: 'SELECT item, category, qty, unit_cost FROM supplies ORDER BY item',
          hints: ['One INSERT can carry many rows: separate the value groups with commas.',
                  'INSERT INTO table VALUES (row1), (row2)',
                  "INSERT INTO supplies VALUES ('cornmeal','food',60,0.15),('lard',___)"],
        },
        {
          id: '1-5', type: 'write',
          prompt: "Fort Laramie ships you their entire oxen shoe stock (sku 6 in fort_inventory). Insert it into supplies with one INSERT ... SELECT: item, category, stock as qty, price as unit_cost.",
          answer: 'INSERT INTO supplies (item, category, qty, unit_cost) SELECT item, category, stock, price FROM fort_inventory WHERE sku = 6',
          check: 'SELECT item, category, qty, unit_cost FROM supplies ORDER BY item',
          hints: ['INSERT can take its rows from a SELECT instead of a VALUES list.',
                  'INSERT INTO target (cols) SELECT cols FROM source WHERE ...',
                  'INSERT INTO supplies (item, category, qty, unit_cost) SELECT item, category, stock, price FROM fort_inventory WHERE sku = ___'],
        },
      ],
    },
    {
      id: 2, name: 'Fort Kearny', theme: 'First landmark',
      concept: 'SELECT / WHERE / ORDER BY',
      intro: 'Read your own supply data before you trust it. The store clerk certainly will not.',
      questions: [
        {
          id: '2-1', type: 'select',
          prompt: 'Select every column and every row from supplies.',
          answer: 'SELECT * FROM supplies',
          hints: ['SELECT * pulls every column; no WHERE means every row.',
                  'SELECT * FROM table_name',
                  'SELECT * FROM supplies'],
        },
        {
          id: '2-2', type: 'select',
          prompt: "List item and qty for supplies in the 'food' category only.",
          answer: "SELECT item, qty FROM supplies WHERE category='food'",
          hints: ['WHERE filters rows; name only the columns you need.',
                  "SELECT col1, col2 FROM table WHERE col = 'value'",
                  "SELECT item, qty FROM supplies WHERE category='___'"],
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
          prompt: 'Which party members have health below 96? Return name and health.',
          answer: 'SELECT name, health FROM party WHERE health < 96',
          hints: ['Comparison operators (<, >, =) work in WHERE.',
                  'SELECT name, health FROM party WHERE health < number',
                  'SELECT name, health FROM party WHERE health < ___'],
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
      id: 3, name: 'Chimney Rock', theme: 'Consume and repair',
      concept: 'UPDATE / DELETE',
      intro: 'The trail eats supplies. Keep the books honest: update what you used, delete what is gone.',
      questions: [
        {
          id: '3-1', type: 'write',
          prompt: 'The party ate 15 lbs of bacon. Update supplies to reduce bacon qty by 15.',
          answer: "UPDATE supplies SET qty = qty - 15 WHERE item='bacon'",
          check: 'SELECT item, qty FROM supplies ORDER BY item',
          hints: ['UPDATE changes existing rows; WHERE picks which ones.',
                  "UPDATE table SET col = col - n WHERE ...",
                  "UPDATE supplies SET qty = qty - 15 WHERE item='___'"],
        },
        {
          id: '3-2', type: 'write',
          prompt: "A wheel broke and was replaced. Update supplies: reduce 'wagon wheel' qty by 1.",
          answer: "UPDATE supplies SET qty = qty - 1 WHERE item='wagon wheel'",
          check: 'SELECT item, qty FROM supplies ORDER BY item',
          hints: ['Without WHERE, UPDATE hits every row. Always aim it.',
                  'UPDATE supplies SET qty = qty - 1 WHERE item = ...',
                  "UPDATE supplies SET qty = qty - 1 WHERE item='wagon ___'"],
        },
        {
          id: '3-3', type: 'write',
          prompt: "The dried apples spoiled in the rain. Delete the 'dried apples' row from supplies.",
          answer: "DELETE FROM supplies WHERE item='dried apples'",
          check: 'SELECT item FROM supplies ORDER BY item',
          hints: ['DELETE removes whole rows; WHERE decides which.',
                  "DELETE FROM table WHERE col = 'value'",
                  "DELETE FROM supplies WHERE item='dried ___'"],
        },
        {
          id: '3-4', type: 'write',
          prompt: "Edgar rested and recovered. Update party: set Edgar's health to 100.",
          answer: "UPDATE party SET health = 100 WHERE name='Edgar'",
          check: 'SELECT name, health FROM party ORDER BY member_id',
          hints: ['SET assigns a new value; WHERE targets the row.',
                  "UPDATE party SET health = n WHERE name = '...'",
                  "UPDATE party SET health = 100 WHERE name='___'"],
        },
        {
          id: '3-5', type: 'write',
          prompt: 'Trail tax: every food item costs 10% more now. Update supplies to multiply unit_cost by 1.1 for the food category.',
          answer: "UPDATE supplies SET unit_cost = unit_cost * 1.1 WHERE category='food'",
          check: "SELECT item, ROUND(unit_cost,4) AS unit_cost FROM supplies WHERE category='food' ORDER BY item",
          hints: ['An UPDATE can hit many rows at once when WHERE matches a group.',
                  'UPDATE supplies SET unit_cost = unit_cost * 1.1 WHERE ...',
                  "UPDATE supplies SET unit_cost = unit_cost * 1.1 WHERE category='___'"],
        },
      ],
    },
    // Stops 4-9: Phase 2 content. Stubbed so the map renders the full trail.
    { id: 4, name: 'Fort Laramie', theme: 'Tallies', concept: 'Aggregates + GROUP BY / HAVING', questions: [] },
    { id: 5, name: 'Independence Rock', theme: 'Joins', concept: 'JOINs', questions: [] },
    { id: 6, name: 'South Pass', theme: 'Layers', concept: 'Subqueries + CTEs', questions: [] },
    { id: 7, name: 'Fort Bridger', theme: 'Branches', concept: 'CASE + conditional aggregation', questions: [] },
    { id: 8, name: 'Snake River', theme: 'Windows', concept: 'Window functions', questions: [] },
    { id: 9, name: 'Willamette Valley', theme: 'Capstone', concept: 'Multi-step business question', questions: [] },
  ];

  // Seeded event pool: the scheduler draws deterministically per GAME_VERSION.
  // effects are deltas applied to run state.
  const EVENTS = [
    { id: 'river',    text: 'River crossing. The ferry operator charges $40.', effects: { money: -40 } },
    { id: 'axle',     text: 'A wagon axle cracks on rocky ground.', effects: { parts: -1, morale: -5 } },
    { id: 'rain',     text: 'Three days of rain. 20 lbs of food spoils.', effects: { food: -20, morale: -5 } },
    { id: 'fever',    text: 'Ada has a fever. She loses 15 health.', effects: { health: [-0, -15, -0, -0] } },
    { id: 'berries',  text: 'Wild berries near the trail. +10 lbs food.', effects: { food: 10, morale: 5 } },
    { id: 'trader',   text: 'A trader buys your spare rope. +$15.', effects: { money: 15 } },
    { id: 'oxen',     text: 'An ox goes lame. You slow down and lose 2 days.', effects: { days: 2, morale: -5 } },
    { id: 'dust',     text: 'Dust storm. Everyone loses 5 health.', effects: { health: [-5, -5, -5, -5] } },
    { id: 'wheel',    text: 'Wheel shatters in a rut.', effects: { parts: -1 } },
    { id: 'good_water', text: 'Clean spring water. Everyone gains 5 health.', effects: { health: [5, 5, 5, 5], morale: 5 } },
  ];

  const EPITAPHS = [
    'died of a Cartesian product',
    'forgot the WHERE clause',
    'joined the great table in the sky',
    'GROUP BY grief',
    'dropped like a table',
    'never did commit',
  ];

  const CONTENT = { GAME_VERSION, SEED_SQL, FORAGE_SQL, STOPS, EVENTS, EPITAPHS };
  if (typeof module !== 'undefined' && module.exports) module.exports = CONTENT;
  else root.TrailContent = CONTENT;
})(typeof self !== 'undefined' ? self : this);
