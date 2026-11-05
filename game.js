(() => {
  "use strict";

  // ================= config =================
  const ATTRS = [
    { key: "pac", label: "Pace",      icon: "⚡" },
    { key: "sho", label: "Shooting",  icon: "🎯" },
    { key: "pas", label: "Passing",   icon: "🧭" },
    { key: "dri", label: "Dribbling", icon: "🌀" },
    { key: "def", label: "Defending", icon: "🛡️" },
    { key: "phy", label: "Physical",  icon: "💪" },
    { key: "men", label: "Mentality", icon: "🧠" },
    { key: "hgt", label: "Height",    icon: "📏" },
  ];

  const POSITIONS = {
    ST: { name: "Striker",       group: "FW", color: "#ff5d73", w: { pac: 0.14, sho: 0.32, pas: 0.07, dri: 0.15, def: 0.01, phy: 0.12, men: 0.12, hgt: 0.07 }, goals: 1.0,  assists: 0.45 },
    W:  { name: "Winger",        group: "FW", color: "#ff9f43", w: { pac: 0.24, sho: 0.18, pas: 0.13, dri: 0.27, def: 0.02, phy: 0.05, men: 0.10, hgt: 0.01 }, goals: 0.65, assists: 0.75 },
    AM: { name: "Attacking Mid", group: "MF", color: "#feca57", w: { pac: 0.08, sho: 0.18, pas: 0.28, dri: 0.25, def: 0.03, phy: 0.05, men: 0.12, hgt: 0.01 }, goals: 0.45, assists: 0.9 },
    CM: { name: "Central Mid",   group: "MF", color: "#1dd1a1", w: { pac: 0.07, sho: 0.10, pas: 0.27, dri: 0.15, def: 0.17, phy: 0.12, men: 0.12, hgt: 0.00 }, goals: 0.22, assists: 0.55 },
    FB: { name: "Full Back",     group: "DF", color: "#54a0ff", w: { pac: 0.24, sho: 0.02, pas: 0.15, dri: 0.12, def: 0.27, phy: 0.10, men: 0.10, hgt: 0.00 }, goals: 0.06, assists: 0.4 },
    CB: { name: "Centre Back",   group: "DF", color: "#a55eea", w: { pac: 0.10, sho: 0.01, pas: 0.09, dri: 0.03, def: 0.38, phy: 0.18, men: 0.13, hgt: 0.08 }, goals: 0.08, assists: 0.08 },
  };
  const GROUP_POS = { FW: "ST", MF: "CM", DF: "CB", GK: "CB" };

  // Grades: S (best) down to F. Same ladder for stats, overall, seasons and the whole career.
  const GRADES = [
    { g: "S", min: 90 }, { g: "A", min: 84 }, { g: "B", min: 77 }, { g: "C", min: 70 },
    { g: "D", min: 62 }, { g: "E", min: 54 }, { g: "F", min: -Infinity },
  ];
  const gradeOf = (v) => GRADES.find((x) => v >= x.min).g;

  const CAREER_GRADES = [
    { g: "S", min: 440, title: "GOAT conversation",      blurb: "They'll be arguing about you in pubs for a century." },
    { g: "A", min: 320, title: "All-time great",         blurb: "A statue outside the stadium is a formality." },
    { g: "B", min: 230, title: "Club legend",            blurb: "Your shirt number gets retired somewhere." },
    { g: "C", min: 175, title: "Top-flight regular",     blurb: "A solid, respected career at the top level." },
    { g: "D", min: 135, title: "Journeyman pro",         blurb: "Nine clubs, eleven agents, one great goal on YouTube." },
    { g: "E", min: 105, title: "Lower-league cult hero", blurb: "The away end still sings your name." },
    { g: "F", min: -Infinity, title: "Sunday League hero", blurb: "The pub team has never been happier." },
  ];
  const careerGrade = (legacy) => CAREER_GRADES.find((x) => legacy >= x.min);

  const FLAGS = {
    ARG: "🇦🇷", POR: "🇵🇹", FRA: "🇫🇷", NOR: "🇳🇴", BRA: "🇧🇷", SWE: "🇸🇪", POL: "🇵🇱", EGY: "🇪🇬",
    ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", NED: "🇳🇱", URU: "🇺🇾", CIV: "🇨🇮", ESP: "🇪🇸", CRO: "🇭🇷", BEL: "🇧🇪", ITA: "🇮🇹",
    GER: "🇩🇪", MAR: "🇲🇦", DEN: "🇩🇰",
  };

  // Fictional clubs by level.
  const CLUBS = [
    ["Ashvale Rovers", "Kettering Pier FC", "Dunmore Athletic", "Saltmarsh Town"],
    ["Hollowmere United", "Port Carran", "Brackley City", "Westbury Wanderers"],
    ["Sporting Lavanda", "FC Nordhafen", "Olympique Varenne", "Calder Albion"],
    ["Inter Valdora", "Borussia Steinfeld", "Athletic Montoro", "Racing Albareda"],
    ["Real Castellón Imperial", "AC Milvane", "Royal Eastbridge", "Bayern Kronach"],
  ];
  const CLUB_LEVEL = ["Semi-pro", "2nd division", "Top flight", "Champions League side", "European giant"];

  const FIRST = ["Leo", "Mateo", "Rafa", "Kai", "Luca", "Theo", "Santi", "Joel", "Nico", "Dani", "Ivan", "Tomas", "Ollie", "Marco", "Yuri", "Aaron"];
  const LAST = ["Varela", "Okafor", "Lindqvist", "Moreau", "Castelli", "Brandt", "Duarte", "Kovač", "Halloran", "Mensah", "Ferreira", "Novak", "Ashby", "Rossi", "Delgado", "Haugen"];

  const SKIPS_PER_GAME = 2;

  // ================= rng =================
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
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const gauss = () => { let u = 0, v = 0; while (!u) u = rng(); while (!v) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  // ================= photos (Wikipedia, loaded in the browser) =================
  const PHOTO_CACHE_KEY = "bf-photos-v1";
  const photos = (() => { try { return JSON.parse(localStorage.getItem(PHOTO_CACHE_KEY)) || {}; } catch { return {}; } })();
  const wikiTitle = (p) => p.wiki || p.name;

  async function loadPhotos() {
    const missing = window.PLAYERS.filter((p) => !(p.name in photos));
    for (let i = 0; i < missing.length; i += 45) {
      const batch = missing.slice(i, i + 45);
      const url = "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1" +
        "&prop=pageimages&piprop=thumbnail&pithumbsize=400&pilimit=50&titles=" +
        encodeURIComponent(batch.map(wikiTitle).join("|"));
      try {
        const res = await fetch(url);
        const data = await res.json();
        const q = data.query || {};
        const alias = {};
        for (const n of q.normalized || []) alias[n.from] = n.to;
        for (const r of q.redirects || []) alias[r.from] = r.to;
        const resolve = (t) => { let x = t; for (let k = 0; k < 3 && alias[x]; k++) x = alias[x]; return x; };
        const byTitle = {};
        for (const pg of Object.values(q.pages || {})) if (pg.thumbnail) byTitle[pg.title] = pg.thumbnail.source;
        for (const p of batch) photos[p.name] = byTitle[resolve(wikiTitle(p))] || null;
      } catch { /* offline or blocked: initials avatars stay */ }
    }
    try { localStorage.setItem(PHOTO_CACHE_KEY, JSON.stringify(photos)); } catch {}
    refreshAvatars();
  }

  function refreshAvatars() {
    // Swap initials for photos once they arrive, without re-rendering game state.
    document.querySelectorAll(".avatar[data-player]").forEach((node) => {
      const p = window.PLAYERS.find((x) => x.name === node.dataset.player);
      if (p && photos[p.name] && !node.querySelector("img")) node.outerHTML = avatar(p, node.dataset.size);
    });
  }

  function initialsHtml(p) {
    const initials = p.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("");
    const hue = hashString(p.name) % 360;
    return `<span class="avatar-initials" style="background:linear-gradient(135deg,hsl(${hue} 60% 42%),hsl(${(hue + 50) % 360} 60% 24%))">${initials}</span>`;
  }

  function avatar(p, size = "md") {
    const src = photos[p.name];
    const inner = src
      ? `<img src="${src}" alt="${escapeHtml(p.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.outerHTML=this.parentNode.dataset.fallback">`
      : initialsHtml(p);
    return `<span class="avatar ${size}" data-size="${size}" data-player="${escapeHtml(p.name)}" data-fallback="${escapeHtml(initialsHtml(p))}">${inner}</span>`;
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  // ================= state =================
  const state = {
    mode: "random", position: null, deck: [], current: null,
    build: {}, skipsLeft: SKIPS_PER_GAME, history: [], name: "", number: 9,
  };

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  function show(screen) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === screen));
    window.scrollTo(0, 0);
  }

  // ================= ratings =================
  const heightScore = (cm) => clamp(Math.round((cm - 160) * 2.4 + 15), 1, 99);
  const fmtAttr = (key, v) => (key === "hgt" ? `${v}<small>cm</small>` : v);
  const attrScore = (key, v) => (key === "hgt" ? heightScore(v) : v);
  const badge = (g, extra = "") => `<span class="grade g-${g} ${extra}">${g}</span>`;

  function overallOf(getVal, posKey) {
    const w = POSITIONS[posKey].w;
    let sum = 0;
    for (const a of ATTRS) sum += attrScore(a.key, getVal(a.key)) * w[a.key];
    return clamp(Math.round(sum), 1, 99);
  }
  const buildOverall = (build, posKey) => overallOf((k) => build[k].value, posKey);
  const playerOverall = (p, posKey) => overallOf((k) => p[k], posKey);

  function projectedOverall(build, posKey) {
    // Weighted average of filled slots only, to show progress while drafting.
    const w = POSITIONS[posKey].w;
    let sum = 0, wsum = 0;
    for (const a of ATTRS) if (build[a.key]) { sum += attrScore(a.key, build[a.key].value) * w[a.key]; wsum += w[a.key]; }
    return wsum ? Math.round(sum / wsum) : null;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  // ================= start =================
  const randomName = () => `${pick(FIRST)} ${pick(LAST)}`;

  function renderStart() {
    const grid = $("#positions");
    grid.innerHTML = "";
    for (const [key, p] of Object.entries(POSITIONS)) {
      const top = Object.entries(p.w).sort((a, b) => b[1] - a[1]).slice(0, 3)
        .map(([k]) => ATTRS.find((a) => a.key === k).label).join(" · ");
      const b = el("button", "pos-btn", `<span class="pos-key">${key}</span><span class="pos-name">${p.name}</span><span class="pos-keys">${top}</span>`);
      b.style.setProperty("--pos", p.color);
      b.addEventListener("click", () => startGame(key));
      grid.appendChild(b);
    }
    document.querySelectorAll("[name=mode]").forEach((r) => {
      r.checked = r.value === state.mode;
      r.onchange = () => { state.mode = r.value; };
    });
    $("#daily-date").textContent = todayKey();
    const nameInput = $("#player-name");
    if (!nameInput.value) nameInput.value = randomName();
    $("#grade-legend").innerHTML = GRADES.map((x, i) => {
      const hi = i === 0 ? 99 : GRADES[i - 1].min - 1;
      const lo = x.min === -Infinity ? 0 : x.min;
      return `<div class="legend-item">${badge(x.g)}<span>${lo}–${hi}</span></div>`;
    }).join("");
  }

  function startGame(posKey) {
    rng = state.mode === "daily" ? mulberry32(hashString("bf-" + todayKey() + "-" + posKey)) : Math.random;
    state.position = posKey;
    state.deck = shuffle(window.PLAYERS);
    state.build = {};
    state.history = [];
    state.skipsLeft = SKIPS_PER_GAME;
    state.name = ($("#player-name").value || "").trim().slice(0, 40) || randomName();
    state.number = pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 17, 19, 23]);
    document.documentElement.style.setProperty("--pos", POSITIONS[posKey].color);
    nextCard();
    show("draft");
  }

  // ================= draft =================
  function nextCard() {
    state.current = state.deck.pop();
    renderDraft();
  }

  function renderDraft() {
    const p = state.current;
    const pos = POSITIONS[state.position];
    const filled = Object.keys(state.build).length;
    $("#draft-pos").textContent = pos.name;
    $("#draft-name").textContent = state.name;
    $("#draft-round").textContent = `Pick ${filled + 1} of ${ATTRS.length}`;
    $("#draft-progress").style.width = `${(filled / ATTRS.length) * 100}%`;
    $("#skip-btn").textContent = `Skip player (${state.skipsLeft})`;
    $("#skip-btn").disabled = state.skipsLeft <= 0;

    const fit = playerOverall(p, state.position);
    const own = playerOverall(p, GROUP_POS[p.pos]);
    const cardGrade = gradeOf(own);

    const card = $("#dealt");
    card.className = `card tier-${cardGrade}`;
    card.innerHTML = `
      <div class="card-top">
        <div class="card-photo">${avatar(p, "xl")}<span class="card-ovr">${badge(cardGrade, "lg")}<b>${own}</b></span></div>
        <div class="card-id">
          <div class="card-name">${escapeHtml(p.name)}</div>
          <div class="card-meta"><span class="flag">${FLAGS[p.nat] || "🏳️"}</span> ${p.nat} · <span class="role">${p.pos}</span> · ${p.hgt} cm</div>
          <div class="card-fit">As your ${pos.name.toLowerCase()}: ${badge(gradeOf(fit))} <b>${fit}</b></div>
          <div class="card-hint">Tap one stat to take it</div>
        </div>
      </div>`;
    const stats = el("div", "card-stats");
    for (const a of ATTRS) {
      const taken = state.build[a.key] != null;
      const v = p[a.key];
      const sc = attrScore(a.key, v);
      const g = gradeOf(sc);
      const weight = Math.round(pos.w[a.key] * 100);
      const b = el("button", `stat g-${g}${taken ? " taken" : ""}`,
        `<span class="stat-icon">${a.icon}</span>
         <span class="stat-main"><span class="stat-label">${a.label}</span><span class="stat-weight">${taken ? "already filled" : weight ? weight + "% of OVR" : "no OVR impact"}</span></span>
         <span class="stat-val">${fmtAttr(a.key, v)}</span>${badge(g)}
         <span class="stat-bar"><i style="width:${sc}%"></i></span>`);
      b.disabled = taken;
      b.title = taken ? "Already filled" : `Take ${a.label} from ${p.name}`;
      b.addEventListener("click", () => takeAttr(a.key));
      stats.appendChild(b);
    }
    card.appendChild(stats);

    renderBuild($("#build"), state.build, true);
    const proj = filled === ATTRS.length ? buildOverall(state.build, state.position) : projectedOverall(state.build, state.position);
    $("#build-ovr").innerHTML = proj == null ? "—" : `${badge(gradeOf(proj))} <b>${proj}</b>`;

    $("#passed").innerHTML = state.history.length
      ? state.history.map((h) => `<span class="chip${h.took ? "" : " skipped"}">${avatar(h.player, "xs")}${escapeHtml(h.player.name.split(" ").slice(-1)[0])}<em>${h.took ? ATTRS.find((a) => a.key === h.took).label : "skipped"}</em></span>`).join("")
      : `<span class="muted">Nobody yet.</span>`;
  }

  function renderBuild(container, build, live) {
    container.innerHTML = "";
    for (const a of ATTRS) {
      const slot = build[a.key];
      if (!slot) {
        container.appendChild(el("div", "slot", `<span class="slot-icon">${a.icon}</span><span class="slot-label">${a.label}</span><span class="slot-from muted">${live ? "empty" : ""}</span><span class="slot-val muted">—</span>`));
        continue;
      }
      const g = gradeOf(attrScore(a.key, slot.value));
      container.appendChild(el("div", `slot filled g-${g}`,
        `${avatar(slot.player, "sm")}<span class="slot-label">${a.label}</span><span class="slot-from">${escapeHtml(slot.player.name)}</span><span class="slot-val">${fmtAttr(a.key, slot.value)}</span>${badge(g)}`));
    }
  }

  function takeAttr(key) {
    state.build[key] = { value: state.current[key], player: state.current };
    state.history.push({ player: state.current, took: key });
    if (Object.keys(state.build).length === ATTRS.length) return finish();
    nextCard();
  }

  function skip() {
    if (state.skipsLeft <= 0) return;
    state.skipsLeft--;
    state.history.push({ player: state.current, took: null });
    nextCard();
  }

  // ================= career sim =================
  function levelFor(r) {
    if (r >= 88) return 4;
    if (r >= 82) return 3;
    if (r >= 75) return 2;
    if (r >= 66) return 1;
    return 0;
  }

  function ageCurve(age) {
    if (age < 21) return -9 + (age - 17) * 2.2;
    if (age <= 24) return -2.5 + (age - 21) * 0.8;
    if (age <= 29) return 0;
    if (age <= 32) return -(age - 29) * 1.6;
    return -4.8 - (age - 32) * 3;
  }

  function transferFee(rating, age) {
    const fee = Math.pow(Math.max(rating - 55, 1), 2.4) * 0.012 * (age < 24 ? 1.5 : age > 30 ? 0.4 : 1);
    return { m: fee, label: fee < 1 ? `€${Math.max(50, Math.round(fee * 1000))}k` : `€${Math.round(fee)}m` };
  }

  function simulate(build, posKey) {
    const pos = POSITIONS[posKey];
    const base = buildOverall(build, posKey);
    const v = (k) => attrScore(k, build[k].value);
    const durability = (v("phy") * 0.6 + v("men") * 0.4) / 100;
    const clutch = v("men") / 100;
    const seasons = [];
    const tally = { apps: 0, goals: 0, assists: 0, league: 0, cup: 0, cl: 0, worldCup: 0, continental: 0, ballonDor: 0, caps: 0, intlGoals: 0, injuryWeeks: 0, clubs: new Set() };
    let club = null, level = -1, retired = false;

    for (let age = 18; age <= 38 && !retired; age++) {
      const rating = clamp(Math.round(base + ageCurve(age) + gauss() * 2.2), 35, 99);
      let newLevel = levelFor(rating);
      // Hysteresis: a small dip doesn't get you relegated to a lower-level club straight away.
      if (level >= 0 && newLevel < level && levelFor(rating + 3) >= level) newLevel = level;

      let moved = null;
      if (!club || newLevel !== level || rng() < 0.08) {
        const options = CLUBS[newLevel].filter((c) => c !== club);
        const next = pick(options);
        if (club) moved = transferFee(rating, age);
        club = next; level = newLevel; tally.clubs.add(club);
      }

      const injury = rng() > durability + 0.25 ? randInt(3, 20) : 0;
      tally.injuryWeeks += injury;
      const apps = clamp(Math.round(randInt(32, 54) * (rating >= 60 ? 1 : 0.6) - injury * 1.2), 4, 58);

      const attackFactor = Math.pow(Math.max(rating - 50, 1) / 45, 2.2);
      const headers = pos.group === "DF" ? (v("hgt") / 99) * rand(0, 3) : 0;
      const goals = Math.max(0, Math.round(apps * pos.goals * attackFactor * (v("sho") / 85) * rand(0.75, 1.25) + headers));
      const assists = Math.max(0, Math.round(apps * 0.28 * pos.assists * attackFactor * (v("pas") / 85) * rand(0.7, 1.3)));

      const honours = [];
      if (rng() < [0, 0.03, 0.06, 0.18, 0.42][level] * (0.8 + clutch * 0.4)) { honours.push("League"); tally.league++; }
      if (rng() < [0.02, 0.04, 0.07, 0.12, 0.2][level] * (0.7 + clutch * 0.6)) { honours.push("Cup"); tally.cup++; }
      if (rng() < [0, 0, 0.005, 0.06, 0.18][level] * (0.6 + clutch * 0.8)) { honours.push("Champions League"); tally.cl++; }
      if (age >= 20 && (age - 18) % 2 === 0 && rating >= 80) {
        const wc = (age - 18) % 4 === 2;
        if (rng() < (wc ? 0.1 : 0.12) * (0.5 + clutch)) {
          honours.push(wc ? "World Cup" : "Continental Cup");
          if (wc) tally.worldCup++; else tally.continental++;
        }
      }
      const statBoost = pos.group === "DF" ? 0.3 : (goals + assists) / 30;
      if (rating >= 91 && rng() < (rating - 89) * 0.09 + statBoost * 0.08 + honours.length * 0.05) { honours.push("Ballon d'Or"); tally.ballonDor++; }

      if (rating >= 74 && age >= 19) {
        const caps = randInt(4, 11);
        tally.caps += caps;
        tally.intlGoals += Math.round(caps * pos.goals * attackFactor * 0.5 * rand(0.5, 1.5));
      }

      tally.apps += apps; tally.goals += goals; tally.assists += assists;
      const s = { age, rating, club, level, apps, goals, assists, injury, honours, moved };
      s.note = seasonNote(s, pos);
      seasons.push(s);

      if (age >= 33 && (rating < 74 || rng() < (age - 32) * 0.17)) retired = true;
    }

    const legacy = Math.round(
      base * 1.1 + (pos.group === "DF" ? 20 : 0) +
      tally.goals * (pos.group === "DF" ? 0.4 : 0.12) + tally.assists * 0.1 +
      tally.league * 6 + tally.cup * 2 + tally.cl * 14 + tally.worldCup * 22 + tally.continental * 10 + tally.ballonDor * 28 +
      tally.caps * 0.12 + seasons.length * 1.5
    );
    return { base, seasons, tally, legacy };
  }

  function seasonNote(s, pos) {
    if (s.honours.includes("Ballon d'Or")) return "Crowned best player in the world.";
    if (s.honours.includes("World Cup")) return "Lifted the World Cup.";
    if (s.honours.includes("Champions League")) return "Champions of Europe.";
    if (s.injury >= 15) return `Missed ${s.injury} weeks injured.`;
    if (pos.group !== "DF" && s.goals >= 35) return "Golden Boot-level season.";
    if (s.assists >= 18) return "Creative masterclass all year.";
    if (s.moved && s.moved.m >= 80) return "Record-breaking transfer.";
    if (s.honours.includes("League")) return "League champions.";
    if (s.age <= 19 && s.rating >= 75) return "Wonderkid breakthrough.";
    if (s.age >= 34) return "Veteran leadership.";
    return "";
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

  // ================= results =================
  function finish() {
    const result = simulate(state.build, state.position);
    state.result = result;
    const cg = careerGrade(result.legacy);
    const t = result.tally;
    const pos = POSITIONS[state.position];
    const ovrG = gradeOf(result.base);

    $("#res-mosaic").innerHTML = ATTRS.map((a) => `<div class="tile" title="${a.label}: ${escapeHtml(state.build[a.key].player.name)}">${avatar(state.build[a.key].player, "fill")}<span>${a.icon}</span></div>`).join("");
    $("#res-number").textContent = state.number;
    $("#res-name").textContent = state.name;
    $("#res-pos").textContent = pos.name;
    $("#res-ovr").innerHTML = `${badge(ovrG, "lg")}<b>${result.base}</b><small>OVR</small>`;
    $("#res-career-grade").className = `career-grade g-${cg.g}`;
    $("#res-career-grade").innerHTML = `<span class="cg-letter">${cg.g}</span><span class="cg-label">Career grade</span>`;
    $("#res-title").textContent = cg.title;
    $("#res-blurb").textContent = cg.blurb;
    const sim = closestReal(state.build, state.position);
    $("#res-similar").innerHTML = `${avatar(sim, "xs")} <b>${escapeHtml(sim.name)}</b>`;
    $("#res-hero").className = `res-hero tier-${cg.g}`;

    renderBuild($("#res-build"), state.build, false);
    renderRadar($("#res-radar"), state.build);

    const peak = result.seasons.reduce((a, b) => (b.rating > a.rating ? b : a));
    const best = result.seasons.reduce((a, b) => (b.goals + b.assists > a.goals + a.assists ? b : a));
    const stats = [
      ["⚽", "Goals", t.goals], ["🅰️", "Assists", t.assists], ["👟", "Appearances", t.apps], ["📈", "Goals per game", (t.goals / Math.max(t.apps, 1)).toFixed(2)],
      ["🏆", "League titles", t.league], ["🥇", "Domestic cups", t.cup], ["⭐", "Champions Leagues", t.cl], ["🌍", "World Cups", t.worldCup],
      ["🏅", "Continental Cups", t.continental], ["🎖️", "Ballon d'Ors", t.ballonDor], ["🧢", "Int'l caps", t.caps], ["🥅", "Int'l goals", t.intlGoals],
      ["🔁", "Clubs", t.clubs.size], ["🩹", "Weeks injured", t.injuryWeeks], ["⛰️", `Peak OVR (age ${peak.age})`, peak.rating], ["🔥", `Best season (age ${best.age})`, `${best.goals}G ${best.assists}A`],
    ];
    $("#res-stats").innerHTML = stats.map(([i, k, v]) => `<div class="tally"><div class="tally-icon">${i}</div><div class="tally-val">${v}</div><div class="tally-label">${k}</div></div>`).join("");
    $("#res-legacy").innerHTML = `Legacy score <b>${result.legacy}</b> · retired at ${result.seasons[result.seasons.length - 1].age} after ${result.seasons.length} seasons`;

    renderChart($("#res-chart"), result.seasons);

    const body = $("#res-seasons tbody");
    body.innerHTML = "";
    for (const s of result.seasons) {
      const tr = el("tr", s.honours.length ? "has-honours" : "");
      tr.innerHTML = `<td>${s.age}</td><td class="nowrap">${badge(gradeOf(s.rating))} <b>${s.rating}</b></td>
        <td><div class="club">${escapeHtml(s.club)}</div><div class="club-level lvl-${s.level}">${CLUB_LEVEL[s.level]}${s.moved ? ` · <span class="fee">↗ ${s.moved.label}</span>` : ""}</div></td>
        <td>${s.apps}${s.injury ? `<div class="inj" title="${s.injury} weeks injured">🩹 ${s.injury}w</div>` : ""}</td><td>${s.goals}</td><td>${s.assists}</td>
        <td>${s.honours.map((h) => `<span class="honour h-${h.replace(/[^a-z]/gi, "")}">${h}</span>`).join(" ")}${s.note ? `<div class="note">${s.note}</div>` : ""}</td>`;
      body.appendChild(tr);
    }
    $("#copy-btn").textContent = "Copy result";
    show("results");
  }

  function renderRadar(container, build) {
    const R = 82, cx = 120, cy = 112;
    const pt = (i, r) => {
      const ang = -Math.PI / 2 + (i / ATTRS.length) * Math.PI * 2;
      return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r];
    };
    let rings = "";
    for (const f of [0.25, 0.5, 0.75, 1]) rings += `<polygon class="ring" points="${ATTRS.map((_, i) => pt(i, R * f).join(",")).join(" ")}"/>`;
    const spokes = ATTRS.map((_, i) => { const [x, y] = pt(i, R); return `<line class="ring" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`; }).join("");
    const vals = ATTRS.map((a) => attrScore(a.key, build[a.key].value));
    const shape = vals.map((v, i) => pt(i, (R * v) / 99).join(",")).join(" ");
    const dots = vals.map((v, i) => { const [x, y] = pt(i, (R * v) / 99); return `<circle class="dot g-${gradeOf(v)}" cx="${x}" cy="${y}" r="4"/>`; }).join("");
    const labels = ATTRS.map((a, i) => { const [x, y] = pt(i, R + 18); return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${a.label.slice(0, 3).toUpperCase()}</text>`; }).join("");
    container.innerHTML = `<svg viewBox="0 0 240 224" role="img" aria-label="Attribute radar">${rings}${spokes}<polygon class="shape" points="${shape}"/>${dots}${labels}</svg>`;
  }

  function renderChart(container, seasons) {
    const W = 640, H = 190, padL = 12, padR = 30, padT = 10, padB = 24;
    const minA = seasons[0].age, maxA = seasons[seasons.length - 1].age;
    const x = (a) => padL + ((a - minA) / Math.max(maxA - minA, 1)) * (W - padL - padR);
    const lo = Math.max(30, Math.min(60, Math.min(...seasons.map((s) => s.rating)) - 4));
    const y = (r) => padT + ((100 - r) / (100 - lo)) * (H - padT - padB);
    const bands = GRADES.map((g, i) => {
      const top = i === 0 ? 100 : GRADES[i - 1].min;
      const bot = Math.max(g.min, lo);
      if (top <= lo) return "";
      return `<rect class="band g-${g.g}" x="${padL}" width="${W - padL - padR}" y="${y(top)}" height="${y(bot) - y(top)}"/><text class="band-label g-${g.g}" x="${W - padR + 8}" y="${(y(top) + y(bot)) / 2}" dominant-baseline="middle">${g.g}</text>`;
    }).join("");
    const line = seasons.map((s) => `${x(s.age)},${y(s.rating)}`).join(" ");
    const dots = seasons.map((s) => `<circle class="dot g-${gradeOf(s.rating)}" cx="${x(s.age)}" cy="${y(s.rating)}" r="${s.honours.length ? 6 : 4}"><title>Age ${s.age}: ${s.rating}${s.honours.length ? " — " + s.honours.join(", ") : ""}</title></circle>`).join("");
    const xl = seasons.filter((_, i) => i % 2 === 0).map((s) => `<text class="axis" x="${x(s.age)}" y="${H - 6}" text-anchor="middle">${s.age}</text>`).join("");
    container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Rating by age">${bands}<polyline class="line" points="${line}"/>${dots}${xl}</svg>`;
  }

  function shareText() {
    const r = state.result, t = r.tally, cg = careerGrade(r.legacy);
    return [
      `⚽ Build-a-Footballer${state.mode === "daily" ? " (Daily " + todayKey() + ")" : ""}`,
      `${state.name} #${state.number} · ${POSITIONS[state.position].name} · ${r.base} OVR (${gradeOf(r.base)})`,
      `Career grade: ${cg.g} — ${cg.title}`,
      `${t.goals} goals · ${t.assists} assists · ${t.league} leagues · ${t.cl} UCL · ${t.worldCup} WC · ${t.ballonDor} Ballon d'Or`,
      ATTRS.map((a) => `${a.icon}${gradeOf(attrScore(a.key, state.build[a.key].value))}`).join(" "),
    ].join("\n");
  }

  // ================= wire up =================
  $("#skip-btn").addEventListener("click", skip);
  $("#again-btn").addEventListener("click", () => { $("#player-name").value = randomName(); renderStart(); show("start"); });
  $("#resim-btn").addEventListener("click", finish);
  $("#reroll-name").addEventListener("click", () => { $("#player-name").value = randomName(); });
  $("#copy-btn").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(shareText()); $("#copy-btn").textContent = "Copied!"; }
    catch { $("#copy-btn").textContent = "Copy failed"; }
  });

  renderStart();
  show("start");
  loadPhotos();
})();
