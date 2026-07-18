// Engine: trail state machine, resources, seeded event scheduler, scoring.
// Pure logic, no DOM — index.html renders it, tests drive it headless.
(function (root) {
  'use strict';

  const RNG = (typeof module !== 'undefined' && module.exports)
    ? require('./rng.js') : root.TrailRNG;

  const PACE = { steady: 1.0, strenuous: 1.25, grueling: 1.5 };       // miles multiplier
  const RATIONS = { filling: 3, meager: 2, 'bare-bones': 1 };          // lbs/person/day
  const LEG_DAYS = 12;          // base days per leg at steady pace
  const START = { money: 160, food: 0, parts: 0, medicine: 0 };        // player allocates money at outfitting
  const PRICES = { food: 0.25, parts: 20, medicine: 12 };              // outfitting prices per unit
  const HINT_COST = [0, 10, 25]; // supplies (lbs food) per hint tier

  // Deterministic event schedule: one event per leg, drawn from the pool with
  // a PRNG seeded by GAME_VERSION (GDD §6: seeded random only).
  function buildEventSchedule(content) {
    const rand = RNG.fromVersion(content.GAME_VERSION);
    const schedule = [];
    for (let leg = 0; leg < 9; leg++) {
      schedule.push(content.EVENTS[Math.floor(rand() * content.EVENTS.length)]);
    }
    return schedule;
  }

  function newRun(content, partyNames, allocation) {
    // allocation: dollars into {food, parts, medicine}; remainder stays cash.
    const spent = (allocation.food || 0) + (allocation.parts || 0) + (allocation.medicine || 0);
    if (spent > START.money) throw new Error('Allocation exceeds starting money.');
    return {
      version: content.GAME_VERSION,
      startedAt: null,             // stamped by the UI (no Date in engine)
      stop: 0,                     // 0 = outfitting done, travelling to stop 1
      day: 0,
      pace: 'steady',
      rations: 'meager',
      money: START.money - spent,
      food: Math.floor((allocation.food || 0) / PRICES.food),
      parts: Math.floor((allocation.parts || 0) / PRICES.parts),
      medicine: Math.floor((allocation.medicine || 0) / PRICES.medicine),
      morale: 70,
      party: partyNames.slice(0, 4).map(n => ({ name: n, health: 100, alive: true })),
      schedule: buildEventSchedule(content),
      log: [],
      metrics: {
        perStop: [],               // {stop, correct, attempts, hints, partial, timeMs}
        hints: 0, deaths: 0, backtracks: 0, score: 0,
      },
      dead: false,
    };
  }

  function alive(run) { return run.party.filter(m => m.alive); }

  function applyEffects(run, effects) {
    if (effects.money) run.money = Math.max(0, run.money + effects.money);
    if (effects.food) run.food = Math.max(0, run.food + effects.food);
    if (effects.parts) run.parts = Math.max(0, run.parts + effects.parts);
    if (effects.days) run.day += effects.days;
    if (effects.morale) run.morale = Math.min(100, Math.max(0, run.morale + effects.morale));
    if (effects.health) {
      run.party.forEach((m, i) => {
        if (m.alive) m.health = Math.min(100, m.health + (effects.health[i] || 0));
      });
    }
    checkDeaths(run);
  }

  function checkDeaths(run) {
    for (const m of run.party) {
      if (m.alive && m.health <= 0) {
        m.alive = false;
        m.health = 0;
        run.metrics.deaths++;
        run.log.push({ day: run.day, text: `${m.name} has died.` });
      }
    }
    if (alive(run).length === 0) run.dead = true;
  }

  // Travel one leg toward the next stop. Returns the event that fired.
  function travelLeg(run) {
    const days = Math.round(LEG_DAYS / PACE[run.pace]);
    const eaten = days * RATIONS[run.rations] * alive(run).length;
    run.day += days;

    if (run.food >= eaten) {
      run.food -= eaten;
    } else {
      // Starvation: empty larder drains health (GDD §6).
      run.food = 0;
      run.party.forEach(m => { if (m.alive) m.health -= 10; });
      run.log.push({ day: run.day, text: 'The food ran out on this leg. The party weakens.' });
    }
    // Strenuous pace wears the party; bare-bones rations do too.
    if (run.pace === 'grueling') run.party.forEach(m => { if (m.alive) m.health -= 5; });
    if (run.rations === 'bare-bones') run.party.forEach(m => { if (m.alive) m.health -= 3; });

    const event = run.schedule[run.stop];
    if (event) {
      // Breakdown events consume a part if you have one, else cost days.
      const icon = event.icon ? event.icon + ' ' : '';
      if (event.effects.parts && run.parts <= 0 && event.effects.parts < 0) {
        run.day += 3;
        run.log.push({ day: run.day, text: icon + event.text + ' No spare — you lose 3 days improvising.' });
        applyEffects(run, { ...event.effects, parts: 0, days: 0 });
      } else {
        run.log.push({ day: run.day, text: icon + event.text });
        applyEffects(run, event.effects);
      }
    }
    checkDeaths(run);
    run.stop += 1;
    return event;
  }

  // Morale multiplier on stop rewards (GDD §6).
  function moraleMult(run) { return 0.75 + (run.morale / 100) * 0.5; } // 0.75 - 1.25

  // Record one graded question; returns reward applied.
  function recordAnswer(run, stopId, result, attempts, hintsUsed, timeMs) {
    const base = { full: 40, partial: 20, fail: 0 }[result.tier];   // lbs of food equivalent
    const reward = Math.round(base * moraleMult(run));
    run.food += reward;
    run.money += result.tier === 'full' ? 10 : result.tier === 'partial' ? 5 : 0;
    run.metrics.score += result.tier === 'full' ? 100 : result.tier === 'partial' ? 50 : 0;
    let stopStats = run.metrics.perStop.find(s => s.stop === stopId);
    if (!stopStats) {
      stopStats = { stop: stopId, correct: 0, partial: 0, attempts: 0, hints: 0, timeMs: 0 };
      run.metrics.perStop.push(stopStats);
    }
    stopStats.attempts += attempts;
    stopStats.hints += hintsUsed;
    stopStats.timeMs += timeMs || 0;
    if (result.tier === 'full') stopStats.correct++;
    if (result.tier === 'partial') stopStats.partial++;
    run.metrics.hints += hintsUsed;
    return reward;
  }

  // Failing a whole stop: move on weakened (GDD §5).
  function failStop(run) {
    run.party.forEach(m => { if (m.alive) m.health -= 10; });
    run.food = Math.max(0, run.food - 20);
    run.morale = Math.max(0, run.morale - 10);
    checkDeaths(run);
  }

  function hintCost(tier) { return HINT_COST[tier] || 0; }

  // Burn-rate dashboard math (GDD §6): at current pace/rations, which stop
  // does the food run out at?
  function burnRate(run) {
    const perLeg = Math.round(LEG_DAYS / PACE[run.pace]) * RATIONS[run.rations] * alive(run).length;
    const legsLeft = perLeg > 0 ? run.food / perLeg : Infinity;
    return {
      lbsPerLeg: perLeg,
      runsOutAtStop: run.stop + Math.floor(legsLeft) + 1,
      legsOfFood: Math.round(legsLeft * 10) / 10,
    };
  }

  const Engine = {
    PACE, RATIONS, START, PRICES, LEG_DAYS,
    newRun, travelLeg, recordAnswer, failStop, hintCost, burnRate,
    buildEventSchedule, applyEffects, moraleMult, alive,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
  else root.TrailEngine = Engine;
})(typeof self !== 'undefined' ? self : this);
