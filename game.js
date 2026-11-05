(() => {
  "use strict";

  // ---------- config ----------
  const ATTRS = [
    { key: "pac", label: "Pace" },
    { key: "sho", label: "Shooting" },
    { key: "pas", label: "Passing" },
    { key: "dri", label: "Dribbling" },
    { key: "def", label: "Defending" },
    { key: "phy", label: "Physical" },
    { key: "men", label: "Mentality" },
    { key: "hgt", label: "Height" },
  ];

  // Position weights for the overall rating. Height is converted to a 0–99 "aerial" score first.
  const POSITIONS = {
    ST: { name: "Striker",            group: "FW", w: { pac: 0.14, sho: 0.32, pas: 0.07, dri: 0.15, def: 0.01, phy: 0.12, men: 0.12, hgt: 0.07 }, goals: 1.0,  assists: 0.45 },
    W:  { name: "Winger",             group: "FW", w: { pac: 0.24, sho: 0.18, pas: 0.13, dri: 0.27, def: 0.02, phy: 0.05, men: 0.10, hgt: 0.01 }, goals: 0.65, assists: 0.75 },
    AM: { name: "Attacking Mid",      group: "MF", w: { pac: 0.08, sho: 0.18, pas: 0.28, dri: 0.25, def: 0.03, phy: 0.05, men: 0.12, hgt: 0.01 }, goals: 0.45, assists: 0.9 },
    CM: { name: "Central Mid",        group: "MF", w: { pac: 0.07, sho: 0.10, pas: 0.27, dri: 0.15, def: 0.17, phy: 0.12, men: 0.12, hgt: 0.00 }, goals: 0.22, assists: 0.55 },
    FB: { name: "Full Back",          group: "DF", w: { pac: 0.24, sho: 0.02, pas: 0.15, dri: 0.12, def: 0.27, phy: 0.10, men: 0.10, hgt: 0.00 }, goals: 0.06, assists: 0.4 },
    CB: { name: "Centre Back",        group: "DF", w: { pac: 0.10, sho: 0.01, pas: 0.09, dri: 0.03, def: 0.38, phy: 0.18, men: 0.13, hgt: 0.08 }, goals: 0.08, assists: 0.08 },
  };

  const SKIPS_PER_GAME = 2;

  // ---------- rng ----------
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const todayKey = () => new Date().toISOString().slice(0, 10);

  let rng = Math.random;
  const rand = (a, b) => a + rng() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const gauss = () => { let u = 0, v = 0; while (!u) u = rng(); while (!v) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  // ---------- state ----------
  const state = {
    mode: "random",
    position: null,
    deck: [],
    current: null,
    build: {},        // attrKey -> { value, from }
    skipsLeft: SKIPS_PER_GAME,
    round: 0,
  };

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  function show(screen) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === screen));
    window.scrollTo(0, 0);
  }

  // ---------- helpers ----------
  const heightScore = (cm) => clamp(Math.round((cm - 160) * 2.4 + 15), 1, 99);
  const fmtAttr = (key, v) => (key === "hgt" ? `${v} cm` : v);
  const attrScore = (key, v) => (key === "hgt" ? heightScore(v) : v);

  function overall(build, posKey) {
    const w = POSITIONS[posKey].w;
    let sum = 0;
    for (const a of ATTRS) sum += attrScore(a.key, build[a.key].value) * w[a.key];
    return clamp(Math.round(sum), 1, 99);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function colorFor(v) {
    if (v >= 90) return "elite";
    if (v >= 80) return "great";
    if (v >= 70) return "good";
    if (v >= 60) return "ok";
    return "poor";
  }

  // ---------- start ----------
  function renderStart() {
    const grid = $("#positions");
    grid.innerHTML = "";
    for (const [key, p] of Object.entries(POSITIONS)) {
      const b = el("button", "pos-btn", `<span class="pos-key">${key}</span><span>${p.name}</span>`);
      b.addEventListener("click", () => startGame(key));
      grid.appendChild(b);
    }
    document.querySelectorAll("[name=mode]").forEach((r) => {
      r.checked = r.value === state.mode;
      r.onchange = () => { state.mode = r.value; };
    });
    $("#daily-date").textContent = todayKey();
  }

  function startGame(posKey) {
    rng = state.mode === "daily" ? mulberry32(hashString("bf-" + todayKey() + "-" + posKey)) : Math.random;
    state.position = posKey;
    state.deck = shuffle(window.PLAYERS);
    state.build = {};
    state.skipsLeft = SKIPS_PER_GAME;
    state.round = 0;
    nextCard();
    show("draft");
  }

  // ---------- draft ----------
  function nextCard() {
    state.current = state.deck.pop();
    state.round++;
    renderDraft();
  }

  function renderDraft() {
    const p = state.current;
    const filled = Object.keys(state.build).length;
    $("#draft-pos").textContent = POSITIONS[state.position].name;
    $("#draft-round").textContent = `Pick ${filled + 1} of ${ATTRS.length}`;
    $("#skip-btn").textContent = `Skip player (${state.skipsLeft} left)`;
    $("#skip-btn").disabled = state.skipsLeft <= 0;

    // dealt card
    const card = $("#dealt");
    card.innerHTML = "";
    card.appendChild(el("div", "card-head", `<div><div class="card-name">${p.name}</div><div class="card-meta">${p.nat} · ${p.pos}</div></div><div class="card-hint">Tap a stat to take it</div>`));
    const stats = el("div", "card-stats");
    for (const a of ATTRS) {
      const taken = state.build[a.key] != null;
      const v = p[a.key];
      const b = el("button", `stat ${colorFor(attrScore(a.key, v))}${taken ? " taken" : ""}`,
        `<span class="stat-label">${a.label}</span><span class="stat-val">${fmtAttr(a.key, v)}</span>`);
      b.disabled = taken;
      b.title = taken ? "Already filled" : `Take ${a.label} from ${p.name}`;
      b.addEventListener("click", () => takeAttr(a.key));
      stats.appendChild(b);
    }
    card.appendChild(stats);

    renderBuild($("#build"), state.build, true);
    const ovr = Object.keys(state.build).length === ATTRS.length ? overall(state.build, state.position) : null;
    $("#build-ovr").textContent = ovr ?? "—";
  }

  function renderBuild(container, build, live) {
    container.innerHTML = "";
    for (const a of ATTRS) {
      const slot = build[a.key];
      const row = el("div", `slot${slot ? " filled " + colorFor(attrScore(a.key, slot.value)) : ""}`);
      row.innerHTML = slot
        ? `<span class="slot-label">${a.label}</span><span class="slot-from">${slot.from}</span><span class="slot-val">${fmtAttr(a.key, slot.value)}</span>`
        : `<span class="slot-label">${a.label}</span><span class="slot-from">${live ? "empty" : ""}</span><span class="slot-val">—</span>`;
      container.appendChild(row);
    }
  }

  function takeAttr(key) {
    state.build[key] = { value: state.current[key], from: state.current.name };
    if (Object.keys(state.build).length === ATTRS.length) return finish();
    nextCard();
  }

  function skip() {
    if (state.skipsLeft <= 0) return;
    state.skipsLeft--;
    nextCard();
  }

  // ---------- career sim ----------
  const CLUB_TIERS = [
    { min: 88, name: "European giant",       tier: 4 },
    { min: 82, name: "UCL side", tier: 3 },
    { min: 75, name: "Top flight",       tier: 2 },
    { min: 66, name: "2nd division",  tier: 1 },
    { min: 0,  name: "Semi-pro",         tier: 0 },
  ];
  const clubFor = (r) => CLUB_TIERS.find((c) => r >= c.min);

  function ageCurve(age) {
    if (age < 21) return -9 + (age - 17) * 2.2;
    if (age <= 24) return -2.5 + (age - 21) * 0.8;
    if (age <= 29) return 0;
    if (age <= 32) return -(age - 29) * 1.6;
    return -4.8 - (age - 32) * 3;
  }

  function simulate(build, posKey) {
    const pos = POSITIONS[posKey];
    const base = overall(build, posKey);
    const v = (k) => attrScore(k, build[k].value);
    const durability = (v("phy") * 0.6 + v("men") * 0.4) / 100;
    const clutch = v("men") / 100;
    const seasons = [];
    const tally = { apps: 0, goals: 0, assists: 0, league: 0, cl: 0, worldCup: 0, ballonDor: 0, caps: 0 };
    let retired = false;

    for (let age = 18; age <= 38 && !retired; age++) {
      const form = gauss() * 2.2;
      const rating = clamp(Math.round(base + ageCurve(age) + form), 35, 99);
      const club = clubFor(rating);
      const injury = rng() > durability + 0.25 ? randInt(5, 25) : 0;
      const apps = clamp(Math.round(randInt(30, 52) * (rating >= 60 ? 1 : 0.6)) - injury, 4, 55);

      const attackFactor = Math.pow(Math.max(rating - 50, 1) / 45, 2.2);
      const goals = Math.max(0, Math.round(apps * pos.goals * attackFactor * (v("sho") / 85) * rand(0.75, 1.25)));
      const assists = Math.max(0, Math.round(apps * 0.28 * pos.assists * attackFactor * (v("pas") / 85) * rand(0.7, 1.3)));

      const honours = [];
      const leagueOdds = [0.0, 0.03, 0.06, 0.18, 0.42][club.tier];
      if (rng() < leagueOdds * (0.8 + clutch * 0.4)) { honours.push("League title"); tally.league++; }
      const clOdds = [0, 0, 0.005, 0.06, 0.18][club.tier];
      if (rng() < clOdds * (0.6 + clutch * 0.8)) { honours.push("Champions League"); tally.cl++; }
      if (age >= 20 && (age - 18) % 4 === 0 && rating >= 82 && rng() < 0.1 * (0.5 + clutch)) { honours.push("World Cup"); tally.worldCup++; }

      const statBoost = pos.group === "DF" ? 0 : (goals + assists) / 30;
      if (rating >= 91 && rng() < (rating - 89) * 0.09 + statBoost * 0.08 + honours.length * 0.07) { honours.push("Ballon d'Or"); tally.ballonDor++; }

      if (rating >= 74 && age >= 19) tally.caps += randInt(4, 11);

      tally.apps += apps; tally.goals += goals; tally.assists += assists;
      seasons.push({ age, rating, club: club.name, apps, goals, assists, injury, honours });

      if (age >= 33 && (rating < 74 || rng() < (age - 32) * 0.17)) retired = true;
    }

    const legacy = Math.round(
      base * 1.1 +
      tally.goals * (pos.group === "DF" ? 0.4 : 0.12) +
      tally.assists * 0.1 +
      tally.league * 6 + tally.cl * 14 + tally.worldCup * 22 + tally.ballonDor * 28 +
      tally.caps * 0.12 + seasons.length * 1.5
    );
    return { base, seasons, tally, legacy };
  }

  function verdict(legacy) {
    if (legacy >= 420) return ["GOAT conversation", "They'll be arguing about you in pubs for a century."];
    if (legacy >= 300) return ["All-time great", "A statue outside the stadium is a formality."];
    if (legacy >= 220) return ["Club legend", "Your shirt number gets retired somewhere."];
    if (legacy >= 160) return ["Top-flight regular", "A solid, respected career at the top level."];
    if (legacy >= 120) return ["Journeyman pro", "Nine clubs, eleven agents, one great goal on YouTube."];
    return ["Sunday League hero", "The pub team has never been happier."];
  }

  function closestReal(build, posKey) {
    let best = null, bestD = Infinity;
    for (const p of window.PLAYERS) {
      let d = 0;
      for (const a of ATTRS) d += Math.abs(attrScore(a.key, p[a.key]) - attrScore(a.key, build[a.key].value)) * (POSITIONS[posKey].w[a.key] + 0.05);
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  // ---------- results ----------
  function finish() {
    const result = simulate(state.build, state.position);
    state.result = result;
    const [title, blurb] = verdict(result.legacy);
    const t = result.tally;

    $("#res-pos").textContent = POSITIONS[state.position].name;
    $("#res-ovr").textContent = result.base;
    $("#res-ovr").className = "big-ovr " + colorFor(result.base);
    $("#res-title").textContent = title;
    $("#res-blurb").textContent = blurb;
    $("#res-similar").textContent = closestReal(state.build, state.position).name;
    renderBuild($("#res-build"), state.build, false);

    const stats = [
      ["Seasons", result.seasons.length], ["Apps", t.apps], ["Goals", t.goals], ["Assists", t.assists],
      ["League titles", t.league], ["Champions Leagues", t.cl], ["World Cups", t.worldCup], ["Ballon d'Ors", t.ballonDor],
      ["Int'l caps", t.caps], ["Legacy score", result.legacy],
    ];
    const sg = $("#res-stats");
    sg.innerHTML = "";
    for (const [k, v] of stats) sg.appendChild(el("div", "tally", `<div class="tally-val">${v}</div><div class="tally-label">${k}</div>`));

    const body = $("#res-seasons tbody");
    body.innerHTML = "";
    for (const s of result.seasons) {
      const tr = el("tr");
      tr.innerHTML = `<td>${s.age}</td><td><span class="pill ${colorFor(s.rating)}">${s.rating}</span></td><td>${s.club}</td><td>${s.apps}${s.injury ? ' <span class="inj" title="Injured">✚</span>' : ""}</td><td>${s.goals}</td><td>${s.assists}</td><td>${s.honours.map((h) => `<span class="honour">${h}</span>`).join(" ")}</td>`;
      body.appendChild(tr);
    }
    $("#copy-btn").textContent = "Copy result";
    show("results");
  }

  function shareText() {
    const r = state.result, t = r.tally;
    const lines = [
      `⚽ Build-a-Footballer${state.mode === "daily" ? " (Daily " + todayKey() + ")" : ""}`,
      `${POSITIONS[state.position].name} · ${r.base} OVR · ${verdict(r.legacy)[0]}`,
      `${t.goals} goals · ${t.assists} assists · ${t.league} leagues · ${t.cl} UCL · ${t.worldCup} WC · ${t.ballonDor} Ballon d'Or`,
      ...ATTRS.map((a) => `${a.label}: ${state.build[a.key].from}`),
    ];
    return lines.join("\n");
  }

  // ---------- wire up ----------
  $("#skip-btn").addEventListener("click", skip);
  $("#again-btn").addEventListener("click", () => { renderStart(); show("start"); });
  $("#resim-btn").addEventListener("click", finish);
  $("#copy-btn").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(shareText()); $("#copy-btn").textContent = "Copied!"; }
    catch { $("#copy-btn").textContent = "Copy failed"; }
  });

  renderStart();
  show("start");
})();
