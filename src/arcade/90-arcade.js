/* ======================================================================
   The facility: four rooms, the operator profile, the one running session, and the finale
   ====================================================================== */
var GAMES = {
    packet: { title: "Packet Pilot", room: "NOC-01 · Network operations", create: packetPilot, missions: PP_MISSIONS, label: "Mission",
        goal: "Keep the network delivering: get every packet to the destination on its label.",
        how: ["Packets leave IN and follow the bright links. Each router sends traffic one way: press it (or its number) to switch.",
            "Every packet wears a badge: ✓ arrives, ✕ wrong destination, ! will be dropped. The dashed line previews the next packet's whole route.",
            "Hazards flash before they hit. Five errors ends the mission; a critical packet counts as two."],
        keys: "Click or tap a router, or press its number. P or Esc pauses." },
    bugs: { title: "Bug Hunter 404", room: "LAB-404 · Corrupted laboratory", create: bugHunter, label: "Mode",
        missions: [{ id: "investigate", title: "Investigation · 3 sectors" }, { id: "quick", title: "Quick 30 s", free: true }],
        goal: "Bring each sector's corruption to 0% before its timer runs out.",
        how: ["Hexagons hop between cells (one hit). Droplets are memory leaks: three hits, and they grow. Stars are critical race conditions: two hits.",
            "Squares marked 'intended' aren't bugs: hitting one adds corruption. Faint symbols may be camouflaged defects.",
            "The diagnostic pulse (D) reveals everything for four seconds. Catch an ⓘ log to learn the root cause: those fixes count double."],
        keys: "Click or tap defects, or Tab to one and press Enter. D pulses. P or Esc pauses." },
    deploy: { title: "Deploy Rush", room: "REL-7 · Release control", create: deployRush, missions: DR_SCENARIOS, label: "Scenario",
        goal: "Get the release out without an outage, inside the release window.",
        how: ["Run stages in any order their prerequisites allow. A locked stage tells you what it's waiting for.",
            "Watch production: an error rate above 1% or a p95 over 300 ms means users are hurting.",
            "When something breaks, choose a response. Every option has a consequence, and the review at the end explains each call."],
        keys: "Click or tap stages and options. Everything is reachable with Tab and Enter." },
    stack: { title: "Cloud Stack", room: "SKY-30 · Construction deck", create: cloudStack, missions: CS_MODES, label: "Mode",
        goal: "Build the tower to its target without letting it fall.",
        how: ["A platform slides above the tower. The bright band on the block below is exactly what will survive your drop.",
            "Within 5 px is perfect: nothing is trimmed, and three perfects in a row win some width back.",
            "Special platforms show their rule before you drop them. Integrity (▮) absorbs cracked glass."],
        keys: "Tap, click, Space or Enter drops. P or Esc pauses." },
    blackout: { title: "Systems Blackout", room: "ALL ROOMS · Finale", create: blackout, label: "Finale", missions: [{ id: "blackout", title: "Four phases, one run" }],
        goal: "The whole facility is down. Bring it back, one room at a time.",
        how: ["Phase 1: restore the network around a dead router.", "Phase 2: isolate the critical defect.", "Phase 3: choose a safe recovery for a failing release.", "Phase 4: rebuild the tower."],
        keys: "Each phase uses its own room's controls. A failed phase ends the run; you can try again straight away." }
};
var ROOMS = ["packet", "bugs", "deploy", "stack"];

/* ---------------- The finale: the four rooms, chained ---------------- */
function blackout(ctx) {
    var phases = [
        { game: packetPilot, def: PP_BLACKOUT, cls: "packet" },
        { game: bugHunter, def: { id: "blackout", title: "Isolate the critical defect" }, cls: "bugs" },
        { game: deployRush, def: DR_BLACKOUT, cls: "deploy" },
        { game: cloudStack, def: CS_BLACKOUT, cls: "stack" }
    ];
    var k = -1, cur = null, total = 0, token = 0, offs = [], results = [];
    function clearPhase() { offs.forEach(function (off) { off(); }); offs = []; ctx.field.textContent = ""; cur = null; token++; }
    function next() {
        clearPhase();
        k++;
        if (k >= phases.length) return finish();
        var P = phases[k], my = token;
        var host = el("div", "bo-phase stage__field--" + P.cls, ctx.field);
        ctx.stage.setAttribute("data-room", P.cls);
        // the new phase takes keyboard focus (the previous phase's buttons are gone)
        ctx.stage.focus({ preventScroll: true });
        cur = P.game(Object.assign({}, ctx, {
            field: host, missionDef: P.def, mission: k,
            on: function (t, ev, fn, opt) { t.addEventListener(ev, fn, opt); offs.push(function () { t.removeEventListener(ev, fn, opt); }); },
            after: function (ms, fn) { ctx.after(ms, function () { if (my === token) fn(); }); },
            hud: function (o) { ctx.hud(Object.assign({ Phase: (k + 1) + " / 4 · " + P.def.title }, o)); },
            end: function (res) {
                if (my !== token) return;
                results.push(P.def.title + ": " + Math.round(res.score) + (res.won ? " ✓" : " ✕"));
                total += res.score;
                if (!res.won) return ctx.end({ score: total, won: false, message: "The blackout held at phase " + (k + 1) + " (" + P.def.title.toLowerCase() + "). " + res.message, report: results.concat(res.report || []) });
                interlude(P.def.title);
            }
        })) || {};
    }
    function interlude(done) {
        clearPhase();
        var my = token;
        var card = el("div", "bo-interlude", ctx.field);
        el("p", "bo-interlude__k", card, "Phase " + (k + 1) + " of 4 restored");
        el("h4", "", card, done + " ✓");
        el("p", "", card, k + 1 < phases.length ? "Next: " + phases[k + 1].def.title.toLowerCase() + "." : "Final checks…");
        var go = button("btn btn--primary", card, "Continue");
        go.addEventListener("click", function () { if (my === token) next(); });
        go.focus({ preventScroll: true });
        ctx.after(2600, function () { if (my === token) next(); });
        sfx("success");
    }
    function finish() {
        var grade = total >= 4200 ? "S" : total >= 3000 ? "A" : total >= 1800 ? "B" : "C";
        ctx.end({ score: total + 500, won: true, blackout: true, message: "Power restored. Grade " + grade + ". The facility hums back to life.", report: results.concat(["Final grade " + grade + " (S from 4,200 points)."]) });
    }
    next();
    return { tick: function (dt, now) { if (cur && cur.tick) cur.tick(dt, now); } };
}

/* ---------------- The page: rooms, traces, operator panel ---------------- */
var section = $("#arcade"), shell = $("#arcade-shell"), grid = $("#arcade-grid"), stage = $("#arcade-stage");
var statusEl = $("#arcade-status"), mascot = $(".arcade__mascot"), traces = $("#arcade-traces");
var session = null, lastSession = null, moodT = 0;

function setStatus(text) { if (statusEl) statusEl.textContent = text; }
function mood(m, hold) {
    if (!mascot) return;
    mascot.classList.remove("is-playing", "is-sad", "is-proud", "is-alert", "is-happy");
    if (m) mascot.classList.add("is-" + m);
    window.clearTimeout(moodT);
    if (hold) moodT = window.setTimeout(function () { mood(session && session.state === "play" ? "playing" : ""); }, hold);
}
function renderOps() {
    var r = rankIndex(), R = RANKS[r];
    var set = function (id, t) { var n = document.getElementById(id); if (n) n.textContent = t; };
    set("ops-rank", R.name);
    set("ops-total", fmt(profile.total));
    set("ops-ch", challengeCount() + " / " + Object.keys(CHALLENGES).length);
    set("ops-next", R.next);
    var ses = document.getElementById("ops-session");
    if (ses) {
        ses.hidden = !lastSession;
        if (lastSession) ses.textContent = "Last run: " + lastSession;
    }
    var snd = document.getElementById("ops-sound");
    if (snd) { snd.setAttribute("aria-pressed", profile.sound ? "true" : "false"); snd.textContent = profile.sound ? "Sound on" : "Sound off"; }
    var bo = document.getElementById("arcade-blackout");
    if (bo) {
        var open = firsts() === 4;
        bo.disabled = !open;
        bo.classList.toggle("is-open", open);
        $(".blackout__state", bo).textContent = profile.ch.blackout ? "Survived ✓ · play again" : open ? "Unlocked · four phases, one run" : "Locked · clear a mission in each room (" + firsts() + " / 4)";
    }
    ROOMS.forEach(function (g) {
        var p = $('[data-best-for="' + g + '"]', grid);
        if (p) { var v = +profile.best[g] || 0; p.hidden = !v; var b = $("b", p); if (b) b.textContent = fmt(v); }
        var m = $('[data-reached-for="' + g + '"]', grid);
        var total = GAMES[g].missions.filter(function (x) { return !x.free; }).length;
        if (m) { var n = Math.min(+profile.reached[g] || 0, total); m.hidden = !n; m.textContent = n + " / " + total + " cleared"; }
    });
}
// Signal traces that join the rooms (redrawn when the layout changes)
function drawTraces() {
    if (!traces) return;
    var sr = shell.getBoundingClientRect(), pts = $$(".toy", grid).map(function (t) { var r = t.getBoundingClientRect(); return [r.left - sr.left + r.width / 2, r.top - sr.top + 14]; });
    var bo = document.getElementById("arcade-blackout");
    if (bo && !grid.hidden) { var br = bo.getBoundingClientRect(); pts.push([br.left - sr.left + br.width / 2, br.top - sr.top + br.height / 2]); }
    traces.setAttribute("viewBox", "0 0 " + Math.round(sr.width) + " " + Math.round(sr.height));
    var d = pts.map(function (p, i) { if (!i) return "M" + p[0].toFixed(0) + " " + p[1].toFixed(0); var q = pts[i - 1], my = Math.min(p[1], q[1]) - 18; return "C" + q[0].toFixed(0) + " " + my.toFixed(0) + " " + p[0].toFixed(0) + " " + my.toFixed(0) + " " + p[0].toFixed(0) + " " + p[1].toFixed(0); }).join("");
    $$("path", traces).forEach(function (p) { p.setAttribute("d", d); });
}

/* ---------------- A session: one game, one clock ---------------- */
function Session(id, card) {
    var def = GAMES[id], s = this;
    s.id = id; s.def = def; s.card = card; s.state = "intro";
    s.time = 0; s.timers = []; s.offs = []; s.gameOffs = []; s.raf = 0; s.game = null;
    var avail = def.missions.map(function (m, i) { return m.free || i <= (+profile.reached[id] || 0); });
    s.mission = Math.min(+profile.reached[id] || 0, def.missions.length - 1);
    while (s.mission > 0 && !avail[s.mission]) s.mission--;
    if (def.missions[s.mission].free) s.mission = 0;
    stage.textContent = "";
    stage.setAttribute("aria-label", def.title);
    stage.setAttribute("data-room", id);
    var bar = el("div", "stage__bar", stage);
    s.back = button("stage__back", bar, "← Back to arcade");
    var tt = el("div", "stage__titles", bar);
    el("p", "stage__room", tt, def.room);
    el("h3", "stage__title", tt, def.title);
    s.hudEl = el("dl", "stage__hud", bar);
    var ctrls = el("div", "stage__ctrls", bar);
    s.pauseBtn = button("stage__btn", ctrls, "Pause");
    s.restartBtn = button("stage__btn", ctrls, "Restart");
    var strip = el("div", "stage__switch", bar);
    strip.setAttribute("aria-label", "Switch room");
    ROOMS.forEach(function (g) {
        var b = button("stage__chip" + (g === id ? " is-current" : ""), strip, GAMES[g].title);
        if (g === id) b.setAttribute("aria-current", "true");
        b.setAttribute("data-switch", g);
    });
    var cur = $(".is-current", strip);   // keep the current room's chip in view on narrow screens
    if (cur) requestAnimationFrame(function () { strip.scrollLeft = Math.max(0, cur.offsetLeft - strip.offsetLeft - 16); });
    var play = el("div", "stage__play", stage);
    s.field = el("div", "stage__field stage__field--" + id, play);
    s.overlay = el("div", "stage__overlay", play);
    s.say = el("p", "stage__say", stage);
    s.say.setAttribute("role", "status");
    s.listen(bar, "click", function (e) {
        var b = e.target.closest("button");
        if (!b) return;
        if (b === s.back) close();
        else if (b === s.pauseBtn) { if (s.state === "play") s.pause(); else if (s.state === "paused") s.resume(); }
        else if (b === s.restartBtn) s.start();
        else if (b.getAttribute("data-switch") && b.getAttribute("data-switch") !== id) open(b.getAttribute("data-switch"), $('[data-game="' + b.getAttribute("data-switch") + '"]', grid));
    });
    s.listen(stage, "keydown", function (e) {
        if ((e.key === "Escape" || e.key === "p" || e.key === "P") && (s.state === "play" || s.state === "paused")) {
            e.preventDefault();
            if (s.state === "play") s.pause(); else s.resume();
        }
    });
    s.listen(document, "visibilitychange", function () { if (document.hidden && s.state === "play") s.pause("The tab was hidden, so the game paused."); });
    if ("IntersectionObserver" in window) {
        // (not in the first second after Start, while the stage resizes and scrolls itself into view)
        s.io = new IntersectionObserver(function (en) { if (!en[0].isIntersecting && s.state === "play" && performance.now() > s.grace) s.pause("The game scrolled out of view, so it paused."); }, { threshold: 0.15 });
        s.io.observe(stage);
    }
    s.hud({});
    s.intro();
}
Session.prototype.listen = function (t, ev, fn, opt) {
    t.addEventListener(ev, fn, opt);
    this.offs.push(function () { t.removeEventListener(ev, fn, opt); });
};
Session.prototype.hud = function (o) {
    var d = this.hudEl;
    d.textContent = "";
    Object.keys(o).forEach(function (k) {
        var w = el("div", "", d);
        el("dt", "", w, k);
        el("dd", "", w, String(o[k]));
    });
};
Session.prototype.panel = function (cls, heading) {
    var o = this.overlay;
    o.textContent = "";
    o.className = "stage__overlay is-on " + cls;
    var card = el("div", "stage__card", o);
    el("h4", "", card, heading);
    return card;
};
Session.prototype.intro = function () {
    var s = this, d = s.def, c = s.panel("is-intro", d.title);
    el("p", "stage__goal", c, d.goal);
    // Mission choice: unlocked ones are selectable, the rest say what opens them
    if (d.missions.length > 1) {
        var list = el("div", "stage__missions", c);
        list.setAttribute("role", "group");
        list.setAttribute("aria-label", d.label + "s");
        d.missions.forEach(function (m, i) {
            var ok = m.free || i <= (+profile.reached[s.id] || 0);
            var b = button("stage__mission" + (i === s.mission ? " is-picked" : ""), list, "");
            el("span", "", b, d.label + " " + (i + 1));
            el("b", "", b, m.title);
            if (!ok) el("i", "", b, "locked · clear " + d.label.toLowerCase() + " " + i);
            b.disabled = !ok;
            b.setAttribute("aria-pressed", i === s.mission ? "true" : "false");
            b.addEventListener("click", function () {
                s.mission = i;
                $$(".stage__mission", list).forEach(function (x, j) { x.classList.toggle("is-picked", j === i); x.setAttribute("aria-pressed", j === i ? "true" : "false"); });
                brief.textContent = m.brief || "";
            });
        });
    }
    var brief = el("p", "stage__brief", c, d.missions[s.mission].brief || "");
    var ul = el("ul", "stage__how", c);
    d.how.forEach(function (t) { el("li", "", ul, t); });
    if (s.id === "stack" && profile.sky.length > 1) {
        var skies = el("div", "stage__skies", c);
        el("span", "", skies, "Skyline: ");
        profile.sky.forEach(function (k) {
            var b = button("stage__sky" + (k === (s.sky || "dusk") ? " is-picked" : ""), skies, CS_SKIES[k].replace(/ \(.*/, ""));
            b.setAttribute("aria-pressed", k === (s.sky || "dusk") ? "true" : "false");
            b.addEventListener("click", function () { s.sky = k; $$(".stage__sky", skies).forEach(function (x) { x.classList.toggle("is-picked", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); });
        });
    }
    el("p", "stage__keys", c, d.keys);
    var go = button("btn btn--primary", c, "Start");
    go.addEventListener("click", function () { s.start(); });
    s.pauseBtn.disabled = true;
    go.focus({ preventScroll: true });
    setStatus("ready · " + d.room.toLowerCase());
    mood("playing");
};
Session.prototype.start = function () {
    var s = this;
    s.stopGame();
    s.field.textContent = "";
    s.say.textContent = "";
    s.say.className = "stage__say";
    s.overlay.className = "stage__overlay";
    s.overlay.textContent = "";
    s.time = 0; s.timers = []; s.gameOffs = []; s.earned = [];
    s.grace = performance.now() + 1000;
    s.seed = newSeed();
    var ctx = {
        field: s.field, stage: stage, small: s.field.clientWidth < 560, reduced: reduceQ.matches,
        rand: rng(s.seed), seed: s.seed, mission: s.mission, missionDef: s.def.missions[s.mission], opts: { sky: s.sky },
        now: function () { return s.time; },
        hud: function (o) { s.hud(o); },
        say: function (t, tone) { s.say.textContent = t; s.say.className = "stage__say is-" + (tone || "info"); },
        after: function (ms, fn) { s.timers.push({ at: s.time + ms, fn: fn }); },
        on: function (t, ev, fn, opt) { t.addEventListener(ev, fn, opt); s.gameOffs.push(function () { t.removeEventListener(ev, fn, opt); }); },
        end: function (res) { s.end(res); },
        react: function (m) { mood(m, 1400); },
        shake: function () { if (reduceQ.matches) return; stage.classList.remove("is-shake"); void stage.offsetWidth; stage.classList.add("is-shake"); },
        flash: function (tone) { stage.classList.remove("is-flash-good", "is-flash-bad"); void stage.offsetWidth; stage.classList.add("is-flash-" + tone); },
        challenge: function (id) { if (award(id)) s.earned.push(id); },
        unlockSky: function (k) { if (profile.sky.indexOf(k) < 0) { profile.sky.push(k); saveProfile(); } }
    };
    s.game = s.def.create(ctx) || {};
    // On touch screens the tap that pressed Start is followed by a late mouse event at the same
    // spot; ignore input for a moment so it can't land on the new board
    s.field.classList.add("is-arming");
    s.timers.push({ at: 350, fn: function () { s.field.classList.remove("is-arming"); } });
    s.state = "play";
    s.pauseBtn.disabled = false;
    s.pauseBtn.textContent = "Pause";
    s.pauseBtn.setAttribute("aria-pressed", "false");
    stage.focus({ preventScroll: true });
    setStatus("running · " + s.def.title.toLowerCase());
    frame(stage);
    s.loop();
};
// One clock per session: game time only moves while playing, so pausing freezes everything
Session.prototype.loop = function () {
    var s = this, last = performance.now();
    function step(now) {
        if (s.state !== "play") return;
        var dt = Math.min(50, now - last);
        last = now;
        s.time += dt;
        var due = s.timers.filter(function (t) { return t.at <= s.time; });
        s.timers = s.timers.filter(function (t) { return t.at > s.time; });
        due.forEach(function (t) { if (s.state === "play") t.fn(); });
        if (s.state === "play" && s.game.tick) s.game.tick(dt, s.time);
        if (s.state === "play") s.raf = window.requestAnimationFrame(step);
    }
    s.raf = window.requestAnimationFrame(step);
};
Session.prototype.pause = function (why) {
    var s = this;
    if (s.state !== "play") return;
    s.state = "paused";
    window.cancelAnimationFrame(s.raf);
    s.pauseBtn.textContent = "Resume";
    s.pauseBtn.setAttribute("aria-pressed", "true");
    var c = s.panel("is-paused", "Paused");
    el("p", "", c, (why ? why + " " : "") + "The game clock is stopped until you resume.");
    var row = el("div", "stage__row", c);
    var r = button("btn btn--primary", row, "Resume");
    var re = button("btn btn--glass", row, "Restart");
    var bk = button("btn btn--link", row, "Back to arcade");
    r.addEventListener("click", function () { s.resume(); });
    re.addEventListener("click", function () { s.start(); });
    bk.addEventListener("click", close);
    r.focus({ preventScroll: true });
    setStatus("paused · " + s.def.title.toLowerCase());
    mood("");
};
Session.prototype.resume = function () {
    var s = this;
    if (s.state !== "paused") return;
    s.state = "play";
    s.overlay.className = "stage__overlay";
    s.overlay.textContent = "";
    s.pauseBtn.textContent = "Pause";
    s.pauseBtn.setAttribute("aria-pressed", "false");
    stage.focus({ preventScroll: true });
    setStatus("running · " + s.def.title.toLowerCase());
    mood("playing");
    s.loop();
};
Session.prototype.end = function (res) {
    var s = this;
    if (s.state !== "play") return;
    s.state = "over";
    window.cancelAnimationFrame(s.raf);
    s.timers = [];
    s.pauseBtn.disabled = true;
    var before = rankIndex(), m = s.def.missions[s.mission];
    var prev = +profile.best[s.id] || 0, isBest = res.score > prev;
    if (isBest) profile.best[s.id] = Math.round(res.score);
    profile.total += Math.round(res.score);
    profile.plays++;
    if (res.won && !m.free) {
        profile.reached[s.id] = Math.max(+profile.reached[s.id] || 0, Math.min(s.mission + 1, s.def.missions.length - 1));
        if (ROOMS.indexOf(s.id) > -1 && award("first-" + s.id)) s.earned.push("first-" + s.id);
    }
    if (res.won && res.clean && award("clean")) s.earned.push("clean");
    if (res.won && res.objective && award("objective")) s.earned.push("objective");
    if (res.recovered && award("recovery")) s.earned.push("recovery");
    if (res.diagnoses >= 2 && award("diagnosis")) s.earned.push("diagnosis");
    if (res.blackout && award("blackout")) s.earned.push("blackout");
    saveProfile();
    var after = rankIndex();
    lastSession = s.def.title + (s.def.missions.length > 1 ? " · " + m.title : "") + " · " + (res.won ? "cleared" : "lost") + " · " + fmt(res.score) + " pts" + (s.earned.length ? " · " + s.earned.length + " new challenge" + (s.earned.length > 1 ? "s" : "") : "");

    var c = s.panel(res.won ? "is-won" : "is-lost", res.won ? "Run complete" : "Run lost");
    var sc = el("p", "stage__score", c);
    el("span", "", sc, "Final score");
    el("b", "", sc, fmt(res.score));
    el("p", "stage__best", c, isBest ? (prev ? "New personal best (was " + fmt(prev) + ")." : "First score on the board.") : prev ? "Personal best: " + fmt(prev) : "No personal best yet.");
    el("p", "stage__msg", c, res.message);
    if (res.report && res.report.length) {
        el("p", "stage__rk", c, res.won ? "Review" : "Post-incident review");
        var ul = el("ul", "stage__report", c);
        res.report.forEach(function (t) { el("li", /^✕/.test(t) ? "is-bad" : /^✓/.test(t) ? "is-good" : "", ul, t); });
    }
    if (s.earned.length) {
        var ch = el("ul", "stage__earned", c);
        s.earned.forEach(function (id) { el("li", "", ch, "✦ " + CHALLENGES[id]); });
    }
    if (after > before) el("p", "stage__rank", c, "Rank up: " + RANKS[after].name);
    var row = el("div", "stage__row", c);
    var nextMission = res.won && s.mission + 1 < s.def.missions.length && !s.def.missions[s.mission + 1].free;
    if (nextMission) {
        var nx = button("btn btn--primary", row, "Next " + s.def.label.toLowerCase() + " →");
        nx.addEventListener("click", function () { s.mission++; s.start(); });
    }
    var again = button(nextMission ? "btn btn--glass" : "btn btn--primary", row, "Play again");
    var other = button("btn btn--glass", row, "Choose another game");
    again.addEventListener("click", function () { s.start(); });
    other.addEventListener("click", close);
    (nextMission ? row.firstChild : again).focus({ preventScroll: true });
    s.hud({});
    renderOps();
    if (res.blackout) { section.classList.remove("is-restored"); void section.offsetWidth; section.classList.add("is-restored"); }
    if (isBest || after > before) { section.classList.add("is-record"); setStatus("new record · " + s.def.title.toLowerCase()); mood("proud"); }
    else { setStatus(res.won ? "cleared · " + s.def.title.toLowerCase() : ["incident logged. it happens to the best of us.", "post-mortem scheduled. blameless, of course.", "rollback complete. try again?"][Math.floor(Math.random() * 3)]); mood(res.won ? "happy" : "sad"); }
};
Session.prototype.stopGame = function () {
    window.cancelAnimationFrame(this.raf);
    this.timers = [];
    (this.gameOffs || []).forEach(function (off) { off(); });
    this.gameOffs = [];
    if (this.game && this.game.destroy) this.game.destroy();
    this.game = null;
};
Session.prototype.destroy = function () {
    this.state = "closed";
    this.stopGame();
    this.offs.forEach(function (off) { off(); });
    this.offs = [];
    if (this.io) this.io.disconnect();
    stage.textContent = "";
    stage.removeAttribute("data-room");
};

// Bring the whole stage into view, just under the header, unless it already fits on screen.
// `measured` is its untransformed box taken before the opening animation; otherwise it is
// measured two frames later, once the new contents have laid out.
function frame(node, measured) {
    var go = function (r) {
        var head = document.getElementById("site-header"), top = head ? head.getBoundingClientRect().bottom + 8 : 8;
        if (r.top < top - 2 || r.bottom > window.innerHeight + 2) window.scrollTo({ top: window.scrollY + r.top - top, behavior: reduceQ.matches ? "auto" : "smooth" });
    };
    if (measured) return go(measured);
    window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { go(node.getBoundingClientRect()); }); });
}
// Opening grows the stage out of the chosen room; closing folds it back
function open(id, card) {
    if (!GAMES[id]) return;
    if (session) session.destroy();
    $$(".toy", grid).forEach(function (t) { t.classList.toggle("is-selected", t === card); });
    section.classList.remove("is-record");
    var from = card ? card.getBoundingClientRect() : null;
    shell.setAttribute("data-view", "game");
    grid.hidden = true;
    var bo = document.getElementById("arcade-blackout");
    if (bo) bo.hidden = true;
    stage.hidden = false;
    session = new Session(id, card);
    var to = stage.getBoundingClientRect();
    if (from && from.width && !reduceQ.matches && stage.animate) {
        stage.animate([
            { transformOrigin: "0 0", transform: "translate(" + (from.left - to.left) + "px," + (from.top - to.top) + "px) scale(" + (from.width / to.width) + "," + (from.height / to.height) + ")", opacity: 0.4 },
            { transformOrigin: "0 0", transform: "none", opacity: 1 }
        ], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
    frame(stage, to);
}
function close() {
    if (!session) return;
    var card = session.card;
    session.destroy();
    session = null;
    stage.hidden = true;
    grid.hidden = false;
    var bo = document.getElementById("arcade-blackout");
    if (bo) bo.hidden = false;
    shell.setAttribute("data-view", "select");
    renderOps();
    drawTraces();
    if (card) {
        if (!reduceQ.matches && card.animate) card.animate([{ transform: "scale(.94)", opacity: 0.5 }, { transform: "none", opacity: 1 }], { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" });
        var r = card.getBoundingClientRect();
        if (r.top < 0 || r.bottom > window.innerHeight) card.scrollIntoView({ block: "center", behavior: reduceQ.matches ? "auto" : "smooth" });
        var playBtn = $("[data-play]", card);
        if (playBtn) playBtn.focus({ preventScroll: true });
    }
    if (!section.classList.contains("is-record")) setStatus("idle · pick a room");
    mood("");
}

/* ---------------- Wiring ---------------- */
if (section && shell && grid && stage) {
    section.addEventListener("click", function (e) {
        var b = e.target.closest && e.target.closest("[data-play]");
        if (b && !b.disabled) open(b.getAttribute("data-play"), b.closest(".toy") || b);
        var snd = e.target.closest && e.target.closest("#ops-sound");
        if (snd) { profile.sound = !profile.sound; saveProfile(); renderOps(); sfx("success"); }
        var skip = e.target.closest && e.target.closest(".boot__skip");
        if (skip) section.classList.add("is-woken");
    });
    // The facility wakes the first time it's seen: rooms power on, traces light (never blocks play)
    var woke = false;
    if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) {
            var on = en[0].isIntersecting;
            section.classList.toggle("is-awake", on);
            if (on && !woke) {
                woke = true;
                drawTraces();
                section.classList.add("is-waking");
                window.setTimeout(function () { section.classList.add("is-woken"); }, reduceQ.matches ? 0 : 2600);
            }
        }, { rootMargin: "0px 0px -20% 0px" }).observe(section);
    } else section.classList.add("is-awake", "is-woken");
    // The room under the pointer leans toward it; on touch, the touched room's trace pulses
    if (window.matchMedia("(pointer: fine)").matches && !reduceQ.matches) {
        section.addEventListener("pointermove", function (e) {
            var r = section.getBoundingClientRect();
            section.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
            section.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
        }, { passive: true });
    }
    grid.addEventListener("pointerdown", function (e) {
        var t = e.target.closest && e.target.closest(".toy");
        if (!t) return;
        t.classList.remove("is-touched");
        void t.offsetWidth;
        t.classList.add("is-touched");
    }, { passive: true });
    if ("ResizeObserver" in window) new ResizeObserver(function () { if (!grid.hidden) drawTraces(); }).observe(shell);
    section.classList.add("is-ready");
    renderOps();
    drawTraces();
    // A Play pressed before this file arrived
    if (window.__arcadeQueue) { var q = window.__arcadeQueue; window.__arcadeQueue = null; open(q, $('[data-game="' + q + '"]', grid)); }
}
