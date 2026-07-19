// SQL Trail content bundle — versioned so metrics compare like with like.
// Roguelite reboot (0.2.0): each town posts 3 job "cards" drawn from a tiered
// pool; the player takes one. Trail-themed tables shaped like real business
// schemas (GDD §7).
(function (root) {
  'use strict';

  const GAME_VERSION = '0.4.0'; // 0.4: 2-member party w/ individual deaths + review-card drafts (new era, new seeds)

  // Shared world schema seeded fresh for every challenge.
  const SEED_SQL = `
CREATE TABLE supplies (
  item TEXT PRIMARY KEY,
  category TEXT NOT NULL,        -- food | gear | medicine
  qty INTEGER NOT NULL,
  unit_cost REAL
);
INSERT INTO supplies VALUES
 ('flour','food',200,0.20),
 ('bacon','food',80,0.55),
 ('dried apples','food',40,0.35),
 ('coffee','food',25,0.90),
 ('wagon wheel','gear',3,22.00),
 ('wagon axle','gear',2,18.50),
 ('wagon tongue','gear',1,16.00),
 ('medicine kit','medicine',2,12.75),
 ('bandages','medicine',6,1.10);

CREATE TABLE party (
  member_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  health INTEGER NOT NULL
);
INSERT INTO party VALUES
 (1,'You','leader',100),
 (2,'Ada','scout',95);

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
 (3,'Fort Kearny','wagon wheel','gear',25.00,4),
 (4,'Fort Laramie','flour','food',0.35,300),
 (5,'Fort Laramie','medicine kit','medicine',15.00,3),
 (6,'Fort Laramie','oxen shoe','gear',4.50,20),
 (7,'Fort Bridger','coffee','food',1.20,40),
 (8,'Fort Bridger','wagon axle','gear',21.00,2),
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

CREATE TABLE ledger (
  txn_id INTEGER PRIMARY KEY,
  txn_date TEXT NOT NULL,        -- ISO dates, 1848 season
  fort TEXT NOT NULL,
  item TEXT NOT NULL,
  kind TEXT NOT NULL,            -- buy | sell
  amount REAL NOT NULL
);
INSERT INTO ledger VALUES
 (1,'1848-05-04','Fort Kearny','flour','buy',12.50),
 (2,'1848-05-11','Fort Kearny','bacon','buy',9.00),
 (3,'1848-05-19','Fort Kearny','rope','sell',4.00),
 (4,'1848-06-02','Fort Laramie','flour','buy',10.50),
 (5,'1848-06-09','Fort Laramie','medicine kit','buy',15.00),
 (6,'1848-06-15','Fort Laramie','dried apples','sell',6.50),
 (7,'1848-06-27','Fort Laramie','oxen shoe','buy',9.00),
 (8,'1848-07-08','Fort Bridger','coffee','buy',8.40),
 (9,'1848-07-16','Fort Bridger','bandages','buy',3.00),
 (10,'1848-07-23','Fort Bridger','spare canvas','sell',11.00),
 (11,'1848-08-05','Fort Bridger','wagon axle','buy',21.00),
 (12,'1848-08-14','Fort Bridger','coffee','sell',5.20);
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

  // Which tier of cards each town drafts. Full trail: 9 towns, 9 tiers.
  const TOWN_TIER = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9 };

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
    { id: 'whr-in', tier: 2, concept: 'WHERE / ORDER BY', title: 'Gear and Potions',
      story: "The blacksmith and the doc are arguing over shelf space. Settle it: items whose category is 'gear' or 'medicine'. Use IN before they draw.",
      prompt: "List item and category for supplies whose category is 'gear' or 'medicine' — use IN.",
      answer: "SELECT item, category FROM supplies WHERE category IN ('gear','medicine')", reward: { food: 30, coin: 6 } },
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

    // ---- Tier 5: Subqueries + CTEs ----
    { id: 'sub-avg', tier: 5, concept: 'Subqueries + CTEs', title: 'Fancier Than Average',
      story: "A dandy in a silk vest wants only the finest goods — anything pricier than the average. He'll pay handsomely for the list.",
      prompt: 'Return item and unit_cost for supplies costing more than the average unit_cost. Use a subquery for the average.',
      answer: 'SELECT item, unit_cost FROM supplies WHERE unit_cost > (SELECT AVG(unit_cost) FROM supplies)', reward: { food: 54, coin: 14 } },
    { id: 'sub-in', tier: 5, concept: 'Subqueries + CTEs', title: 'The Laramie List',
      story: 'A rider heading to Fort Laramie offers to haul your restock order — but only for things the fort actually sells. Check first.',
      prompt: 'Return item and qty for supplies whose item appears in fort_inventory at Fort Laramie. Use IN with a subquery.',
      answer: "SELECT item, qty FROM supplies WHERE item IN (SELECT item FROM fort_inventory WHERE fort = 'Fort Laramie')", reward: { food: 54, coin: 14 } },
    { id: 'sub-max', tier: 5, concept: 'Subqueries + CTEs', title: 'The Priciest Thing on the Trail',
      story: "Campfire argument: what's the single most expensive item any fort sells? Settle it with data before someone settles it with fists.",
      prompt: 'From fort_inventory, return the item, fort, and price of the row with the highest price. Use a subquery for the max.',
      answer: 'SELECT item, fort, price FROM fort_inventory WHERE price = (SELECT MAX(price) FROM fort_inventory)', reward: { food: 56, coin: 15 } },
    { id: 'sub-notin', tier: 5, concept: 'Subqueries + CTEs', title: 'Irreplaceable',
      story: "The insurance man (yes, they had those) will only cover what can't be re-bought on the trail. Find your supplies no fort stocks.",
      prompt: 'Return the supplies items that appear in NO fort_inventory row. Use NOT IN with a subquery.',
      answer: 'SELECT item FROM supplies WHERE item NOT IN (SELECT item FROM fort_inventory)', reward: { food: 56, coin: 15 } },

    // ---- Tier 6: CASE + conditional aggregation ----
    { id: 'case-label', tier: 6, concept: 'CASE + conditional aggregation', title: 'Paint the Barrels',
      story: "Edgar wants every barrel painted by stock level so he can stop opening them to check: over 50 is 'plenty', over 10 is 'low', the rest 'critical'.",
      prompt: "Return item, qty, and a CASE column: qty > 50 → 'plenty', qty > 10 → 'low', else 'critical'.",
      answer: "SELECT item, qty, CASE WHEN qty > 50 THEN 'plenty' WHEN qty > 10 THEN 'low' ELSE 'critical' END AS stock_level FROM supplies", reward: { food: 60, coin: 16 } },
    { id: 'case-price', tier: 6, concept: 'CASE + conditional aggregation', title: 'Dear or Fair',
      story: "A newspaperman is writing an exposé on fort prices. Tag every fort item 'dear' if it costs over 10 dollars, 'fair' otherwise.",
      prompt: "From fort_inventory, return item, price, and a CASE column: price > 10 → 'dear', else 'fair'.",
      answer: "SELECT item, price, CASE WHEN price > 10 THEN 'dear' ELSE 'fair' END AS verdict FROM fort_inventory", reward: { food: 60, coin: 16 } },
    { id: 'case-count', tier: 6, concept: 'CASE + conditional aggregation', title: 'Count the Big Piles',
      story: 'The quartermaster wants one row per category with a count of items over 30 qty — conditional counting, the analyst party trick.',
      prompt: 'Per category, count items with qty > 30. Return category and the count. Use SUM(CASE ...).',
      answer: 'SELECT category, SUM(CASE WHEN qty > 30 THEN 1 ELSE 0 END) AS big_items FROM supplies GROUP BY category', reward: { food: 62, coin: 17 } },
    { id: 'case-net', tier: 6, concept: 'CASE + conditional aggregation', title: 'The Fort Books',
      story: "Each fort's ledger mixes buys and sells. The banker wants ONE net number per fort: sells count positive, buys negative.",
      prompt: "From ledger, return fort and the net amount (sell = +amount, buy = −amount) per fort. Use SUM(CASE ...).",
      answer: "SELECT fort, SUM(CASE WHEN kind = 'sell' THEN amount ELSE -amount END) AS net FROM ledger GROUP BY fort", reward: { food: 64, coin: 18 } },

    // ---- Tier 7: Window functions ----
    { id: 'win-rank', tier: 7, concept: 'Window functions', title: 'The Price Podium',
      story: 'The forts are holding an unofficial "most outrageous price" contest. Rank every fort item by price, highest first, without losing any rows.',
      prompt: 'From fort_inventory, return item, price, and a RANK() over price descending (name it price_rank).',
      answer: 'SELECT item, price, RANK() OVER (ORDER BY price DESC) AS price_rank FROM fort_inventory', reward: { food: 66, coin: 18 } },
    { id: 'win-part', tier: 7, concept: 'Window functions', title: 'Best in Each Fort',
      story: 'Every fort claims its own top-shelf item. Number the items WITHIN each fort by price so #1 in each fort is obvious.',
      prompt: 'From fort_inventory, return fort, item, price, and ROW_NUMBER() partitioned by fort, ordered by price descending (name it rn).',
      answer: 'SELECT fort, item, price, ROW_NUMBER() OVER (PARTITION BY fort ORDER BY price DESC) AS rn FROM fort_inventory', reward: { food: 68, coin: 19 } },
    { id: 'win-run', tier: 7, concept: 'Window functions', title: 'The Running Tab',
      story: "The season's spending crept up on everybody. Show each ledger date and amount with the running total so far — the line that makes bankers sweat.",
      prompt: 'From ledger, return txn_date, amount, and a running SUM of amount ordered by txn_date (name it running_total).',
      answer: 'SELECT txn_date, amount, SUM(amount) OVER (ORDER BY txn_date) AS running_total FROM ledger', reward: { food: 68, coin: 19 } },
    { id: 'win-avg', tier: 7, concept: 'Window functions', title: 'Above the House Average',
      story: "Is that flour a ripoff FOR THAT FORT? Show each item's price beside its own fort's average price so anyone can compare at a glance.",
      prompt: "From fort_inventory, return fort, item, price, and AVG(price) over the fort's rows (name it fort_avg).",
      answer: 'SELECT fort, item, price, AVG(price) OVER (PARTITION BY fort) AS fort_avg FROM fort_inventory', reward: { food: 70, coin: 20 } },

    // ---- Tier 8: Date & string functions ----
    { id: 'date-month', tier: 8, concept: 'Date & string functions', title: 'The Monthly Reckoning',
      story: "Winter's coming and the banker wants the ledger by month, not by squint. Total the amounts per month of txn_date.",
      prompt: "From ledger, return the month (strftime('%m', txn_date)) and SUM(amount) per month.",
      answer: "SELECT strftime('%m', txn_date) AS month, SUM(amount) FROM ledger GROUP BY strftime('%m', txn_date)", reward: { food: 72, coin: 20 } },
    { id: 'date-range', tier: 8, concept: 'Date & string functions', title: 'The Summer Audit',
      story: 'An auditor with impressive sideburns only cares about June and July. Pull the ledger rows in that window.',
      prompt: "From ledger, return txn_date, item, and amount for dates BETWEEN '1848-06-01' AND '1848-07-31'.",
      answer: "SELECT txn_date, item, amount FROM ledger WHERE txn_date BETWEEN '1848-06-01' AND '1848-07-31'", reward: { food: 72, coin: 20 } },
    { id: 'str-upper', tier: 8, concept: 'Date & string functions', title: 'Stencil the Crates',
      story: 'New crate stencils only come in capital letters. Print every supply item in UPPER case with its qty so the painter can get to work.',
      prompt: 'From supplies, return UPPER(item) (name it label) and qty.',
      answer: 'SELECT UPPER(item) AS label, qty FROM supplies', reward: { food: 74, coin: 21 } },
    { id: 'str-like', tier: 8, concept: 'Date & string functions', title: 'Anything Wagon',
      story: "The wheelwright will fix 'anything with wagon in the name.' Hold him to it — find every supply item containing 'wagon'.",
      prompt: "From supplies, return the items whose name contains 'wagon'. Use LIKE.",
      answer: "SELECT item FROM supplies WHERE item LIKE '%wagon%'", reward: { food: 74, coin: 21 } },

    // ---- Tier 9: Capstone (multi-concept business questions) ----
    { id: 'cap-monthly', tier: 9, concept: 'Capstone', title: 'The Season in One Table',
      story: "The wagon company's investors want the whole season: net money per month (sells positive, buys negative). One query, one table, no excuses.",
      prompt: "From ledger, return the month (strftime('%m', txn_date)) and the net amount (sell = +, buy = −) per month.",
      answer: "SELECT strftime('%m', txn_date) AS month, SUM(CASE WHEN kind = 'sell' THEN amount ELSE -amount END) AS net FROM ledger GROUP BY strftime('%m', txn_date)", reward: { food: 80, coin: 25 } },
    { id: 'cap-top', tier: 9, concept: 'Capstone', title: 'Every Fort’s Crown Jewel',
      story: 'One item per fort: the most expensive thing it sells. The trick is keeping just the #1 row from each fort — windows inside a subquery.',
      prompt: 'From fort_inventory, return fort, item, price for the single priciest item per fort. Use ROW_NUMBER() in a subquery and keep rn = 1.',
      answer: 'SELECT fort, item, price FROM (SELECT fort, item, price, ROW_NUMBER() OVER (PARTITION BY fort ORDER BY price DESC) AS rn FROM fort_inventory) WHERE rn = 1', reward: { food: 84, coin: 26 } },
    { id: 'cap-value', tier: 9, concept: 'Capstone', title: 'Which Forts Matter',
      story: "HQ will only resupply forts holding serious inventory. Join the ledgers, value each fort's stock (price × stock), and keep the ones over 200 dollars.",
      prompt: 'Join fort_inventory to forts. Return fort and SUM(price * stock) as inventory_value, only for forts where that sum exceeds 200.',
      answer: 'SELECT f.fort, SUM(f.price * f.stock) AS inventory_value FROM fort_inventory f JOIN forts t ON f.fort = t.fort GROUP BY f.fort HAVING SUM(f.price * f.stock) > 200', reward: { food: 84, coin: 26 } },
    { id: 'cap-audit', tier: 9, concept: 'Capstone', title: 'The Final Audit',
      story: "Before Oregon, one last audit: for every supply a fort sells, show your qty and the best price any fort offers — the buy-list that gets you through winter.",
      prompt: 'For supplies that appear in fort_inventory, return item, qty, and the minimum fort price for that item (name it best_price). Use a correlated subquery.',
      answer: 'SELECT s.item, s.qty, (SELECT MIN(f.price) FROM fort_inventory f WHERE f.item = s.item) AS best_price FROM supplies s WHERE s.item IN (SELECT item FROM fort_inventory)', reward: { food: 88, coin: 28 } },
  ];

  // Forage minigame cards: easy, timed, graded against SEED_SQL + FORAGE_SQL.
  const FORAGE_CARDS = [
    { id: 'forage-edible', concept: 'Forage', title: 'Safe to Eat',
      prompt: 'From forage, return plant and lbs for the edible plants (edible = 1).',
      answer: 'SELECT plant, lbs FROM forage WHERE edible = 1', baseFood: 30 },
    { id: 'forage-berry', concept: 'Forage', title: 'Berry Run',
      prompt: "From forage, return the plants that are berries AND edible.",
      answer: "SELECT plant FROM forage WHERE kind = 'berry' AND edible = 1", baseFood: 30 },
    { id: 'forage-haul', concept: 'Forage', title: 'Weigh the Haul',
      prompt: 'From forage, return the total lbs of all edible plants — one number.',
      answer: 'SELECT SUM(lbs) FROM forage WHERE edible = 1', baseFood: 30 },
  ];

  // Fort general stores (towns with a fort): food price per lb + doctor visit.
  const STORES = {
    2: { foodPrice: 0.35, doctor: 15 },
    4: { foodPrice: 0.45, doctor: 20 },
    7: { foodPrice: 0.60, doctor: 25 },
  };

  // Seeded trader offers at fixed towns: accept or walk away.
  const TRADERS = {
    3: { text: 'A trader eyes your flour barrels. "25 lbs of food for $20, friend. My mules eat better than I do."',
         effects: { food: -25, coin: 20 }, need: { food: 25 } },
    6: { text: 'A westbound family sells surplus cheap: "35 lbs of food for $15 — the wagon is too heavy for the pass."',
         effects: { food: 35, coin: -15 }, need: { coin: 15 } },
  };

  // Talk-to-people flavor lines (seeded pick per town).
  const TOWN_TALK = [
    'An old-timer squints at your wagon: "SELECT before you WHERE, and check your food twice."',
    'The barber claims he once GROUPed BY hat size. Nobody asks him to elaborate.',
    'A kid runs past yelling that the ferry man cheats. The ferry man agrees, cheerfully.',
    '"Rained six days straight east of here," says a woman patching canvas. "Cover your flour."',
    'The blacksmith taps your wheel: "She\'ll hold. Your queries, though — qualify your columns."',
    'A preacher warns against Cartesian products. His sermon has no ON clause either.',
    'Two clerks argue whether HAVING comes before ORDER BY. A third quietly wins money on it.',
    'The general store cat has opinions about your rations. All of them are "more bacon."',
    '"Trail\'s kinder to folks who read their own ledgers," says a granny knitting by the well.',
    'A surveyor shows off his map: "Everything joins on something, friend. Everything."',
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
    'food': '🌾', 'gear': '🔧', 'medicine': '💊',
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
    FORAGE_CARDS, STORES, TRADERS, TOWN_TALK,
    EVENTS, EPITAPHS, ITEM_ICONS, VIGNETTES, RIVERS, DEATH_CAUSES,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = CONTENT;
  else root.TrailContent = CONTENT;
})(typeof self !== 'undefined' ? self : this);
