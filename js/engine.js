// Engine: trail state machine with THREE resources (food, coin, health — the
// party is one shared health bar now), seeded events, and roguelite card
// rewards. Pure logic, no DOM; index.html renders it, tests drive it headless.
(function (root) {
  'use strict';

  const RNG = (typeof module !== 'undefined' && module.exports)
    ? require('./rng.js') : root.TrailRNG;

  const PACE = { steady: 1.0, strenuous: 1.25, grueling: 1.5 };   // miles multiplier
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
      health: START.health,        // single shared party health bar (0-100)
      party: partyNames.slice(0, 4).map(n => ({ name: n })),
      schedule: buildEventSchedule(content),
      log: [],
      followUp: [],                // concepts the trail had to hand the player
      metrics: { perStop: [], hints: 0, deaths: 0, score: 0 },
      dead: false,
    };
  }

  // Seeded by version+day so the same run always writes the same fate.
  function deathCause(run) {
    const causes = run.causes || ['dysentery', 'typhoid fever', 'cholera', 'a snakebite', 'exhaustion'];
    const rand = RNG.fromVersion(`${run.version}:death:${run.day}`);
    return causes[Math.floor(rand() * causes.length)];
  }

  function checkDeaths(run) {
    if (!run.dead && run.health <= 0) {
      run.health = 0;
      run.dead = true;
      run.metrics.deaths = run.party.length;
      run.log.push({ day: run.day, text: `💀 The party has succumbed to ${deathCause(run)}.` });
    }
  }

  function applyEffects(run, e) {
    if (e.coin) run.coin = Math.max(0, run.coin + e.coin);
    if (e.food) run.food = Math.max(0, run.food + e.food);
    if (e.health) run.health = Math.min(100, run.health + e.health); // may go <=0 → death
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
      text = `The ferry carries you across the ${river.name} without incident. -$${river.ferry}.`;
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

  // Travel one leg toward the next town. Returns the event that fired.
  function travelLeg(run) {
    const days = Math.round(LEG_DAYS / PACE[run.pace]);
    const eaten = Math.round(days * RATIONS[run.rations]);
    run.day += days;

    if (run.food >= eaten) {
      run.food -= eaten;
    } else {
      run.food = 0;
      run.health -= 12; // starvation drains the party
      run.log.push({ day: run.day, text: 'The larder ran dry on this leg. The party weakens.' });
    }
    if (run.pace === 'grueling') run.health -= 6;
    if (run.rations === 'bare-bones') run.health -= 4;

    const event = run.schedule[run.stop];
    if (event) {
      run.log.push({ day: run.day, text: (event.icon ? event.icon + ' ' : '') + event.text });
      applyEffects(run, event.effects);
    }
    checkDeaths(run);
    run.stop += 1;
    return event;
  }

  // Roguelite reward: FULL credit pays the card's bounty, reduced 25% per miss.
  // Anything short of full pays nothing (the escalating-help penalties already bit).
  function recordAnswer(run, townId, card, tier, misses, timeMs) {
    let food = 0, coin = 0, score = 0;
    if (tier === 'full') {
      const mult = Math.max(0, 1 - 0.25 * misses);
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
    const perLeg = Math.round(Math.round(LEG_DAYS / PACE[run.pace]) * RATIONS[run.rations]);
    const legs = perLeg > 0 ? run.food / perLeg : Infinity;
    return { lbsPerLeg: perLeg, legsOfFood: Math.round(legs * 10) / 10 };
  }

  const Engine = {
    PACE, RATIONS, START, FOOD_PRICE, LEG_DAYS,
    newRun, travelLeg, recordAnswer, applyEffects, crossRiver, arrivalBonus, deathCause, burnRate,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
  else root.TrailEngine = Engine;
})(typeof self !== 'undefined' ? self : this);
