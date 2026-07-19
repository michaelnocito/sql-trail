// SQL Trail content bundle — versioned so metrics compare like with like.
// Roguelite reboot (0.2.0): each town posts 3 job "cards" drawn from a tiered
// pool; the player takes one. Trail-themed tables shaped like real business
// schemas (GDD §7).
(function (root) {
  'use strict';

  const GAME_VERSION = '0.2.0';

  // Shared world schema seeded fresh for every challenge.
  const SEED_SQL = `
CREATE TABLE supplies (
  item TEXT PRIMARY KEY,
  category TEXT NOT NULL,        -- food | parts | medicine
  qty INTEGER NOT NULL,
  unit_cost REAL
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
  health INTEGER NOT NULL,
  morale INTEGER NOT NULL
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

CREATE TABLE forts (
  fort TEXT PRIMARY KEY,
  miles INTEGER NOT NULL,
  founded INTEGER NOT NULL
);
INSERT INTO forts VALUES
 ('Fort Kearny',300,1848),
 ('Fort Laramie',640,1834),
 ('Fort Bridger',1025,1843);
`;

  // Forage table seeded only for a future forage minigame — ships with version.
  const FORAGE_SQL = `
CREATE TABLE forage (
  plant TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  edible INTEGER NOT NULL,
  lbs REAL NOT NULL
);
INSERT INTO forage VALUES
 ('chokecherry','berry',1,2.0),('wild onion','root',1,1.0),
 ('buffalo berry','berry',1,2.5),('death camas','root',0,0.0),
 ('lambsquarter','green',1,0.5),('snakeberry','berry',0,0.0);
`;

  // Towns are just the map + flavor now. Each has a difficulty tier; the town's
  // card draft pulls from CARD_POOL where tier matches. Tiers 5+ (towns 5-9)
  // arrive with later batches.
  const STOPS = [
    { id: 1, name: 'Independence, MO', concept: 'SELECT fundamentals', tier: 1,
      intro: 'The outfitter keeps the books; your job is to read them.' },
    { id: 2, name: 'Fort Kearny', concept: 'WHERE / ORDER BY', tier: 2,
      intro: 'Read your own supply data before you trust it. The clerk certainly will.' },
    { id: 3, name: 'Chimney Rock', concept: 'Aggregates + GROUP BY / HAVING', tier: 3,
      intro: 'One number that summarizes a hundred rows is worth a hundred rows.' },
    { id: 4, name: 'Fort Laramie', concept: 'JOINs', tier: 4,
      intro: 'Two ledgers, one truth. Interview questions live in the space between them.' },
    { id: 5, name: 'Independence Rock', concept: 'Subqueries + CTEs', tier: 5, intro: '' },
    { id: 6, name: 'South Pass', concept: 'CASE + conditional aggregation', tier: 6, intro: '' },
    { id: 7, name: 'Fort Bridger', concept: 'Window functions', tier: 7, intro: '' },
    { id: 8, name: 'Snake River', concept: 'Date & string functions', tier: 8, intro: '' },
    { id: 9, name: 'Willamette Valley', concept: 'Capstone', tier: 9, intro: '' },
  ];

  // Which tier of cards each town drafts. (Towns 5-9 unlock in later batches.)
  const TOWN_TIER = { 1: 1, 2: 2, 3: 3, 4: 4 };

  // The card pool. Each card: id, tier, concept, title, story (funny tie-in),
  // prompt (the actual task), answer (canonical), orderMatters?, reward {food,coin}.
  // A town draws 3 same-tier cards (seeded); the player takes one.
  const CARD_POOL = [
    // ---- Tier 1: SELECT fundamentals ----
    { id: 'sel-all', tier: 1, concept: 'SELECT fundamentals', title: 'The Whole Darn Ledger',
      story: "The outfitter can't read his own handwriting and begs you to read the supply book back to him — every column, every line.",
      prompt: 'Select every column and every row from supplies.',
      answer: 'SELECT * FROM supplies', reward: { food: 24, coin: 4 } },
    { id: 'sel-cols', tier: 1, concept: 'SELECT fundamentals', title: 'Just the Essentials',
      story: "A pushy clerk only cares what you've got and how many. Show him item and qty — nothing else, he's a busy man.",
      prompt: 'From supplies, return only the item and qty columns.',
      answer: 'SELECT item, qty FROM supplies', reward: { food: 24, coin: 4 } },
    { id: 'sel-distinct', tier: 1, concept: 'SELECT fundamentals', title: 'One of Each, Please',
      story: 'A census taker wants to know what KINDS of supplies exist — no, he does not want to hear about all forty barrels of flour.',
      prompt: 'What categories of supplies exist? Return each category once, no repeats.',
      answer: 'SELECT DISTINCT category FROM supplies', reward: { food: 24, coin: 4 } },
    { id: 'sel-calc', tier: 1, concept: 'SELECT fundamentals', title: "What's It All Worth",
      story: "The tax man cometh. He wants each item and its total value — qty times unit cost. Name the column total_value or he'll get suspicious.",
      prompt: 'Return item and qty * unit_cost, naming the computed column total_value.',
      answer: 'SELECT item, qty * unit_cost AS total_value FROM supplies', reward: { food: 26, coin: 5 } },

    // ---- Tier 2: WHERE / ORDER BY ----
    { id: 'whr-food', tier: 2, concept: 'WHERE / ORDER BY', title: 'Grub Only',
      story: "The cook is doing inventory and only trusts you with the food. Item and qty for the 'food' category.",
      prompt: "List item and qty for supplies in the 'food' category only.",
      answer: "SELECT item, qty FROM supplies WHERE category='food'", reward: { food: 30, coin: 6 } },
    { id: 'whr-in', tier: 2, concept: 'WHERE / ORDER BY', title: 'Parts and Potions',
      story: "The blacksmith and the doc are arguing over shelf space. Settle it: items whose category is 'parts' or 'medicine'. Use IN before they draw.",
      prompt: "List item and category for supplies whose category is 'parts' or 'medicine' — use IN.",
      answer: "SELECT item, category FROM supplies WHERE category IN ('parts','medicine')", reward: { food: 30, coin: 6 } },
    { id: 'whr-order', tier: 2, concept: 'WHERE / ORDER BY', title: 'Priciest First', orderMatters: true,
      story: "A trader wants to see what's worth stealing — er, buying — most expensive first. Item and unit_cost, high to low.",
      prompt: 'List item and unit_cost for all supplies, most expensive first.',
      answer: 'SELECT item, unit_cost FROM supplies ORDER BY unit_cost DESC', reward: { food: 30, coin: 6 } },
    { id: 'whr-and', tier: 2, concept: 'WHERE / ORDER BY', title: 'Plenty o’ Grub',
      story: "You only trust a food you've got a lot of. Show the food items with more than 30 on hand. Two conditions, one WHERE.",
      prompt: 'Which food supplies have more than 30 in qty? Return item and qty.',
      answer: "SELECT item, qty FROM supplies WHERE category='food' AND qty > 30", reward: { food: 32, coin: 7 } },

    // ---- Tier 3: Aggregates + GROUP BY / HAVING ----
    { id: 'agg-count', tier: 3, concept: 'Aggregates + GROUP BY / HAVING', title: 'Count the Wagon',
      story: 'Before the mountains, count your blessings — literally. How many different supply items are aboard?',
      prompt: 'How many different supply items are in the wagon? Return a single count.',
      answer: 'SELECT COUNT(*) FROM supplies', reward: { food: 36, coin: 8 } },
    { id: 'agg-sum', tier: 3, concept: 'Aggregates + GROUP BY / HAVING', title: 'Sum of the Larder',
      story: "The cook needs exactly one number: the total units of food on board. Sum the qty for 'food'.",
      prompt: "How many total units of food are on board? Sum qty for the 'food' category.",
      answer: "SELECT SUM(qty) FROM supplies WHERE category='food'", reward: { food: 36, coin: 8 } },
    { id: 'agg-group', tier: 3, concept: 'Aggregates + GROUP BY / HAVING', title: 'Tally by Kind',
      story: 'The quartermaster wants totals per category — one tidy row each, no essays.',
      prompt: 'Total qty per category: return category and the sum of qty for each.',
      answer: 'SELECT category, SUM(qty) FROM supplies GROUP BY category', reward: { food: 38, coin: 8 } },
    { id: 'agg-having', tier: 3, concept: 'Aggregates + GROUP BY / HAVING', title: 'The Big Piles',
      story: 'Only the categories carrying more than 100 total units are worth posting a guard on. Filter on the sum itself.',
      prompt: 'Which categories carry more than 100 total units? Return category and the sum.',
      answer: 'SELECT category, SUM(qty) FROM supplies GROUP BY category HAVING SUM(qty) > 100', reward: { food: 40, coin: 9 } },

    // ---- Tier 4: JOINs ----
    { id: 'join-inner', tier: 4, concept: 'JOINs', title: 'Two Ledgers, One Truth',
      story: "Your ledger and the fort's ledger both mention items. Match them up: item, the fort, and its price there.",
      prompt: 'Which of your supplies does a fort also sell? Join supplies to fort_inventory on item; return item, fort, price.',
      answer: 'SELECT s.item, f.fort, f.price FROM supplies s JOIN fort_inventory f ON s.item = f.item', reward: { food: 44, coin: 10 } },
    { id: 'join-anti', tier: 4, concept: 'JOINs', title: 'Nobody Sells These',
      story: "The blacksmith bets you can't find which of your supplies NO fort can replace. Prove him wrong — LEFT JOIN, and keep the lonely rows.",
      prompt: 'Which supplies can no fort replace? LEFT JOIN supplies to fort_inventory; return items with no match.',
      answer: 'SELECT s.item FROM supplies s LEFT JOIN fort_inventory f ON s.item = f.item WHERE f.item IS NULL', reward: { food: 46, coin: 10 } },
    { id: 'join-min', tier: 4, concept: 'JOINs', title: 'Best Price on the Trail',
      story: 'For each item a fort sells, a savvy pioneer knows the cheapest price anywhere. Find it and name it best_price.',
      prompt: 'For your supplies sold at any fort, return the item and the lowest fort price (name it best_price).',
      answer: 'SELECT s.item, MIN(f.price) AS best_price FROM supplies s JOIN fort_inventory f ON s.item = f.item GROUP BY s.item', reward: { food: 46, coin: 10 } },
    { id: 'join-three', tier: 4, concept: 'JOINs', title: 'Plan the Whole Route', orderMatters: true,
      story: 'Three ledgers now: your supplies, the fort prices, and how far each fort sits up the trail. Lay out the resupply plan in marching order.',
      prompt: 'For supplies sold at forts, return item, fort, price, and miles. Order by miles up the trail, then by item.',
      answer: 'SELECT s.item, f.fort, f.price, t.miles FROM supplies s JOIN fort_inventory f ON s.item = f.item JOIN forts t ON f.fort = t.fort ORDER BY t.miles, s.item', reward: { food: 50, coin: 12 } },
  ];

  // Seeded event pool. Effects are deltas on the three resources (+ days).
  const EVENTS = [
    { id: 'river',   icon: '🌊', text: 'A toll-bridge keeper shakes you down. -$15.', effects: { coin: -15 } },
    { id: 'axle',    icon: '🛞', text: 'A wagon axle cracks; patching it wears everyone down.', effects: { health: -8 } },
    { id: 'rain',    icon: '🌧️', text: 'Three days of rain. 15 lbs of food spoils.', effects: { food: -15 } },
    { id: 'fever',   icon: '🤒', text: 'Fever sweeps the wagon. The party loses ground.', effects: { health: -12 } },
    { id: 'berries', icon: '🫐', text: 'Wild berries near the trail. +10 lbs food.', effects: { food: 10 } },
    { id: 'trader',  icon: '🤝', text: 'A trader buys your spare rope. +$12.', effects: { coin: 12 } },
    { id: 'oxen',    icon: '🐂', text: 'An ox goes lame. You slow down and lose 2 days.', effects: { days: 2 } },
    { id: 'dust',    icon: '🌪️', text: 'A dust storm batters the party.', effects: { health: -8 } },
    { id: 'wheel',   icon: '🛞', text: 'A wheel shatters in a rut; the repair costs sweat.', effects: { health: -5 } },
    { id: 'spring',  icon: '💧', text: 'Clean spring water. The party recovers a little.', effects: { health: 8 } },
  ];

  const ITEM_ICONS = {
    'flour': '🌾', 'bacon': '🥓', 'dried apples': '🍎', 'coffee': '☕',
    'salt pork': '🥩', 'cornmeal': '🌽', 'lard': '🧈', 'rope': '🪢',
    'wagon wheel': '🛞', 'wagon axle': '⚙️', 'wagon tongue': '🪵', 'oxen shoe': '🐂',
    'medicine kit': '💊', 'bandages': '🩹',
    'food': '🌾', 'parts': '🔧', 'medicine': '💊',
    'Fort Kearny': '🏕️', 'Fort Laramie': '🏕️', 'Fort Bridger': '🏕️',
  };

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

  // River crossings before these towns. Seeded per GAME_VERSION.
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

  const CONTENT = {
    GAME_VERSION, SEED_SQL, FORAGE_SQL, STOPS, TOWN_TIER, CARD_POOL,
    EVENTS, EPITAPHS, ITEM_ICONS, VIGNETTES, RIVERS, DEATH_CAUSES,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = CONTENT;
  else root.TrailContent = CONTENT;
})(typeof self !== 'undefined' ? self : this);
