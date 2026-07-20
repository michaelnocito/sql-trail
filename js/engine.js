// Engine: trail state machine with THREE resources (food, coin, health).
// Health belongs to TWO party members individually — misfortune singles one
// out, so members die (and get gravestones) one at a time. Seeded events,
// roguelite card rewards. Pure logic, no DOM; index.html renders it.
(function (root) {
  'use strict';

  const RNG = (typeof module !== 'undefined' && module.exports)
    ? require('./rng.js') : root.TrailRNG;

  const PACE = { steady: 1.0, strenuous: 1.25, grueling: 1.5 };   // miles multiplier
  // Health cost per leg for pushing the pace. Only the slowest (steady) is free —
  // the middle tier now bites too, so speed always trades against the party's health.
  const PACE_HEALTH = { steady: 0, strenuous: 3, grueling: 6 };
  const RATIONS = { filling: 4, meager: 2.5, 'bare-bones': 1.5 }; // lbs/day
  const LEG_DAYS = 12;               // base days per leg at steady pace
  const START = { coin: 60, food: 0, health: 100 };
  const FOOD_PRICE = 0.3;            // $ per lb at the outfitter

  // Deterministic event schedule: one event per leg, seeded by GAME_VERSION.
  function buildEventSchedule(content) {
    const rand = RNG.fromVersion(content.GAME_VERSION);
    const schedule = [];
    for (let leg = 0; leg < 9; leg++) {
      schedule.push(content.EVENTS[Math.floor(rand() * content.EVENTS.length)]);
    }
    return schedule;
  }

  function newRun(content, partyNames, allocation) {
    // allocation.food = dollars spent on food; the rest stays as coin.
    const foodDollars = Math.max(0, Math.min(allocation.food || 0, START.coin));
    return {
      version: content.GAME_VERSION,
      startedAt: null,             // stamped by the UI (no Date in engine)
      stop: 0,                     // 0 = outfitting done, travelling to town 1
      day: 0,
      pace: 'steady',
      rations: 'meager',
      coin: START.coin - foodDollars,
      food: Math.floor(foodDollars / FOOD_PRICE),
      health: START.health,        // derived: average of the two members below
      // Party of TWO, each with their own health — individual sickness,
      // individual deaths, individual gravestones, like the original.
      party: partyNames.slice(0, 2).map(n => ({ name: n, health: START.health, dead: false })),
      graves: [],                  // {name, cause, day, stop} — filled as members fall
      schedule: buildEventSchedule(content),
      log: [],
      followUp: [],                // concepts the trail had to hand the player
      metrics: { perStop: [], hints: 0, deaths: 0, score: 0 },
      dead: false,
      _hitN: 0,                    // salts the seeded who-gets-hurt pick
    };
  }

  // Seeded per version+day+name so the same run writes the same fates —
  // and yes, dysentery leads the list. Tradition.
  function deathCause(run, name) {
    const causes = run.causes || ['dysentery', 'typhoid fever', 'cholera', 'a snakebite',
      'exhaustion', 'a wagon wheel mishap', 'bad jerky', 'an unindexed full scan'];
    const rand = RNG.fromVersion(`${run.version}:death:${run.day}:${name || ''}`);
    return causes[Math.floor(rand() * causes.length)];
  }

  function living(run) { return run.party.filter(m => !m.dead); }

  // Recompute the derived party bar and bury anyone who hit zero.
  function checkDeaths(run) {
    for (const m of run.party) {
      if (!m.dead && m.health <= 0) {
        m.health = 0; m.dead = true;
        m.cause = deathCause(run, m.name); m.diedDay = run.day; m.diedStop = Math.min(run.stop + 1, 9);
        run.graves.push({ name: m.name, cause: m.cause, day: m.diedDay, stop: m.diedStop });
        run.metrics.deaths += 1;
        run.log.push({ day: run.day, text: `💀 ${m.name} has died of ${m.cause}.` });
      }
    }
    run.health = Math.round(run.party.reduce((t, m) => t + m.health, 0) / run.party.length);
    if (!run.dead && living(run).length === 0) {
      run.dead = true;
      run.log.push({ day: run.day, text: '💀 The whole party lies on the trail.' });
    }
  }

  // Systemic drains (starvation, pace, rations) wear on everyone equally.
  function damageAll(run, d) {
    for (const m of living(run)) m.health = Math.max(0, m.health - d);
    checkDeaths(run);
  }
  function healAll(run, d) {
    for (const m of living(run)) m.health = Math.min(100, m.health + d);
    checkDeaths(run);
  }
  // Misfortune strikes ONE member (seeded), at double strength so the party
  // average moves the same as the old shared bar — but somebody in particular
  // is having a very bad day. This is where individual deaths come from.
  function damageOne(run, d) {
    const alive = living(run);
    if (!alive.length) return;
    run._hitN = (run._hitN || 0) + 1;
    const rand = RNG.fromVersion(`${run.version}:hit:${run.day}:${run._hitN}`);
    const m = alive[Math.floor(rand() * alive.length)];
    const dmg = alive.length > 1 ? d * 2 : d;
    m.health = Math.max(0, m.health - dmg);
    checkDeaths(run);
  }

  function applyEffects(run, e) {
    if (e.coin) run.coin = Math.max(0, run.coin + e.coin);
    if (e.food) run.food = Math.max(0, run.food + e.food);
    if (e.health < 0) damageOne(run, -e.health);
    else if (e.health > 0) healAll(run, e.health);
    if (e.days) run.day += e.days;
    checkDeaths(run);
  }

  // River crossing. Outcome seeded per version+stop+choice, so identical rivers
  // every run — a plannable fact (the analyst-thinking pillar).
  function crossRiver(run, stopId, choice, river) {
    const rand = RNG.fromVersion(`${run.version}:river:${stopId}:${choice}`);
    const roll = rand();
    let text, effects = {};
    if (choice === 'ferry') {
      if (run.coin < river.ferry) return { ok: false, text: `The ferry operator wants $${river.ferry}. You're short.` };
      effects.coin = -river.ferry;
      effects.days = 1; // safety costs time: loading, poling, unloading
      text = `The ferry carries you across the ${river.name} without incident. -$${river.ferry} and a day lost to loading.`;
    } else if (choice === 'caulk') {
      if (roll < 0.8) text = `You caulk the wagon and float the ${river.name} clean. Dry as a ledger.`;
      else { effects = { food: -15 }; text = `The wagon takes on water in the ${river.name}. 15 lbs of food ruined.`; }
    } else { // ford
      if (roll < 0.6) text = `You ford the ${river.name} at the shallows. Nothing lost.`;
      else { effects = { food: -20, health: -8 }; text = `The ${river.name} runs deeper than it looked. Food swept away and the party battered.`; }
    }
    applyEffects(run, effects);
    run.log.push({ day: run.day, text: '🌊 ' + text });
    return { ok: true, text, effects };
  }

  // Arrival-condition bonus: the state you arrive in, scored.
  function arrivalBonus(run) {
    const parts = [
      { label: 'Health', value: Math.round(run.health * 3) },
      { label: 'Food remaining', value: Math.round(run.food / 4) },
      { label: 'Coin on hand', value: run.coin },
    ];
    return { parts, total: parts.reduce((t, p) => t + p.value, 0) };
  }

  // Days one leg takes at a given pace. A lone survivor moves 2 days faster —
  // a lighter wagon and nobody to wait on (grim, but true to the trail).
  function legDays(run, pace) {
    const solo = living(run).length === 1;
    return Math.max(1, Math.round(LEG_DAYS / PACE[pace || run.pace]) - (solo ? 2 : 0));
  }

  // Travel one leg toward the next town. Returns the event that fired.
  function travelLeg(run) {
    const solo = living(run).length === 1;
    const days = legDays(run);
    const eaten = Math.round(days * RATIONS[run.rations]);
    run.day += days;
    if (solo && !run._soloNoted) {
      run._soloNoted = true;
      run.log.push({ day: run.day, text: '🐂 The wagon rides lighter with one aboard — every leg is 2 days quicker now.' });
    }

    if (run.food >= eaten) {
      run.food -= eaten;
    } else {
      run.food = 0;
      damageAll(run, 12); // starvation drains everyone
      run.log.push({ day: run.day, text: 'The larder ran dry on this leg. The party weakens.' });
    }
    if (PACE_HEALTH[run.pace]) damageAll(run, PACE_HEALTH[run.pace]);
    if (run.rations === 'bare-bones') damageAll(run, 4);

    const event = run.schedule[run.stop];
    if (event) {
      run.log.push({ day: run.day, text: (event.icon ? event.icon + ' ' : '') + event.text });
      applyEffects(run, event.effects);
    }
    checkDeaths(run);
    run.stop += 1;
    return event;
  }

  // Roguelite reward: FULL credit pays the card's bounty, reduced per miss.
  // Typing it yourself pays a 25% premium and misses sting less (15% vs 25%) —
  // the tap-builder is the guided road, the keyboard is the pro road.
  function recordAnswer(run, townId, card, tier, misses, timeMs, mode) {
    let food = 0, coin = 0, score = 0;
    if (tier === 'full') {
      const typed = mode === 'type';
      const mult = Math.max(0, (typed ? 1.25 : 1) - (typed ? 0.15 : 0.25) * misses);
      food = Math.round((card.reward.food || 0) * mult);
      coin = Math.round((card.reward.coin || 0) * mult);
      score = 100;
    }
    run.food += food;
    run.coin += coin;
    run.metrics.score += score;
    run.metrics.hints += misses;
    run.metrics.perStop.push({
      stop: townId, concept: card.concept,
      correct: tier === 'full' ? 1 : 0, misses, timeMs: timeMs || 0,
    });
    return { food, coin };
  }

  // Burn-rate readout: at the current pace/rations, how many legs of food are
  // left? The analyst-thinking dashboard number.
  function burnRate(run) {
    const perLeg = Math.round(legDays(run) * RATIONS[run.rations]);
    const legs = perLeg > 0 ? run.food / perLeg : Infinity;
    return { lbsPerLeg: perLeg, legsOfFood: Math.round(legs * 10) / 10 };
  }

  const Engine = {
    PACE, PACE_HEALTH, RATIONS, START, FOOD_PRICE, LEG_DAYS,
    newRun, travelLeg, recordAnswer, applyEffects, crossRiver, arrivalBonus, deathCause, burnRate, living, legDays,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
  else root.TrailEngine = Engine;
})(typeof self !== 'undefined' ? self : this);
