/* ======================================================================
   BUG HUNTER 404 — a debugging investigation in a corrupted lab
   Each sector starts corrupted. Defects that stay alive push corruption up; resolving them brings
   it down; the sector is restored at 0%. Defects behave differently (hop, leak, race), some are
   camouflaged, and some things that look odd are intended behaviour. A limited diagnostic pulse
   reveals them, and a short-lived log clue names the root cause, which then counts double.
   Between sectors, an optional diagnosis question (fictional, educational) earns a multiplier.
   ====================================================================== */
var BH_TYPES = {
    glitch: { label: "Glitch: a fast-moving defect, tap it before it hops", hp: 1, pts: 15, cure: 9, drift: 0.6 },
    leak: { label: "Memory leak: three hits, and it grows while it lives", hp: 3, pts: 30, cure: 16, drift: 1.4 },
    race: { label: "Race condition: critical, two hits", hp: 2, pts: 50, cure: 26, drift: 2.4 },
    feature: { label: "Intended behaviour: not a bug, leave it alone" },
    clue: { label: "Log fragment: tap to reveal the root cause" }
};
var BH_NAMES = { glitch: "glitches", leak: "memory leaks", race: "race conditions" };
var BH_SECTORS = [
    { name: "Input validation", time: 45000, mix: { glitch: 0.62, feature: 0.2, clue: 0.18 }, spawn: [1050, 720], camo: 0 },
    { name: "Memory", time: 45000, mix: { glitch: 0.36, leak: 0.3, feature: 0.19, clue: 0.15 }, spawn: [980, 640], camo: 0.25 },
    { name: "Concurrency", time: 50000, mix: { glitch: 0.3, leak: 0.2, race: 0.26, feature: 0.14, clue: 0.1 }, spawn: [940, 600], camo: 0.3 }
];
var BH_BLACKOUT = [{ name: "Blackout: the critical defect", time: 42000, mix: { glitch: 0.25, leak: 0.2, race: 0.35, feature: 0.1, clue: 0.1 }, spawn: [900, 620], camo: 0.2 }];
var BH_QUICK = [{ name: "Quick 30 s", time: 30000, mix: { glitch: 0.55, leak: 0.25, feature: 0.2 }, spawn: [800, 420], camo: 0, quick: true }];
var BH_DIAG = [
    { q: "TypeError: Cannot read properties of undefined (reading 'sku')\n    at mapOrder (orders.js:42)",
        opts: [["An optional field is missing and the code doesn't check for it", 1], ["The server ran out of memory", 0], ["A DNS lookup failed", 0]],
        why: "'Cannot read properties of undefined' means an object you expected wasn't there. Line 42 reads .sku from something undefined: guard the optional field." },
    { q: "HTTP 429 Too Many Requests\nretry-after: 30\n(the client retried 40 times in 2 seconds)",
        opts: [["The client retries immediately instead of backing off", 1], ["The TLS certificate expired", 0], ["A database index is missing", 0]],
        why: "429 means 'slow down'. Retrying instantly makes it worse: honour Retry-After and back off exponentially." },
    { q: "Order #1042: stock shows 1 on two channels after the last unit sold on one.",
        opts: [["Two writers update stock without a version check (a race)", 1], ["The page's CSS hides the update", 0], ["A timezone conversion error", 0]],
        why: "Both channels read 1 before either wrote 0. An optimistic-concurrency check (a version or ETag) makes the second write fail and retry." },
    { q: "ERROR: deadlock detected\nProcess 81 waits for ShareLock on transaction 772; blocked by process 64.",
        opts: [["Two transactions lock the same rows in opposite order", 1], ["The disk is full", 0], ["The connection string is wrong", 0]],
        why: "Each transaction holds a lock the other needs. Lock rows in a consistent order, or keep transactions shorter." },
    { q: "Works on my machine. In production:\nKeyError: 'PAYMENTS_URL'",
        opts: [["The setting exists locally but not in production's configuration", 1], ["Production has a slower CPU", 0], ["The browser cache is stale", 0]],
        why: "The code reads a setting production doesn't have. Declare configuration per environment and validate it at start-up." }
];

function bugHunter(ctx) {
    var rand = ctx.rand, mode = ctx.missionDef.id;
    var SECTORS = mode === "quick" ? BH_QUICK : mode === "blackout" ? BH_BLACKOUT : BH_SECTORS;
    var COLS = ctx.small ? 4 : 6, ROWS = ctx.small ? 5 : 4;
    var root = el("div", "bh", ctx.field);
    root.style.setProperty("--cols", COLS);
    root.style.setProperty("--rows", ROWS);
    var board = el("div", "bh-board", root);
    var deco = el("div", "bh-deco", board);
    deco.setAttribute("aria-hidden", "true");
    var GLYPHS = ["{ }", "</>", "0x1F", "::", "//", "[ ]", "=>", "#!", "&&", "?.", "!=", "%s"];
    for (var d = 0; d < COLS * ROWS; d++) el("span", "", deco, GLYPHS[d % GLYPHS.length]);
    var slots = [];
    for (var s = 0; s < COLS * ROWS; s++) slots.push(el("div", "bh-slot", board));
    var tools = el("div", "bh-tools", root);
    var pulseBtn = button("btn btn--glass bh-pulse", tools, "Diagnostic pulse");
    var rootEl = el("p", "bh-root", tools, "Root cause: unknown");
    var diag = el("div", "bh-diag", root);
    diag.hidden = true;

    var sector = 0, S, sectorStart = 0, corruption = 100, live = [], nextSpawn = 0, rootType = null, rootKnown = false;
    var score = 0, streak = 0, bestStreak = 0, hits = 0, misses = 0, escaped = 0, pulses = 2, bonusMult = 0, diagRight = 0, diagAsked = 0;
    var pulseUntil = 0, paused = false, finished = false, questions = shuffle(BH_DIAG, rand);

    function mult() { return 1 + Math.min(3, Math.floor(streak / 4)) + bonusMult; }
    function startSector(now) {
        S = SECTORS[sector];
        sectorStart = now; corruption = S.quick ? 0 : 100; nextSpawn = now + 500;
        live.forEach(function (b) { b.el.remove(); });
        live = [];
        var real = Object.keys(S.mix).filter(function (k) { return BH_TYPES[k].cure; });
        rootType = real[Math.floor(rand() * real.length)];
        rootKnown = false;
        rootEl.textContent = S.quick ? "Quick play: score as much as you can" : "Root cause: unknown. Catch a log fragment (ⓘ) to find it.";
        root.classList.toggle("is-quick", !!S.quick);
        if (!S.quick) ctx.say("Sector " + (sector + 1) + " · " + S.name + ": corruption at 100%. Bring it to zero.", "warn");
        paintPulse();
    }
    function paintPulse() {
        pulseBtn.textContent = "Diagnostic pulse (" + pulses + ")";
        pulseBtn.disabled = pulses <= 0 || !!S.quick;
        pulseBtn.hidden = !!S.quick;
    }
    function pickType() {
        var r = rand(), acc = 0, keys = Object.keys(S.mix);
        for (var i = 0; i < keys.length; i++) { acc += S.mix[keys[i]]; if (r < acc) return keys[i]; }
        return keys[0];
    }
    function freeSlot() {
        var free = slots.filter(function (sl) { return !sl.firstChild; });
        return free.length ? free[Math.floor(rand() * free.length)] : null;
    }
    var ICON = {
        glitch: '<svg viewBox="0 0 60 60" aria-hidden="true"><path class="bh-legs" d="M14 22l-8-6M14 30H4M14 38l-8 6M46 22l8-6M46 30h10M46 38l8 6"/><polygon points="30,8 47,18 47,42 30,52 13,42 13,18"/><circle cx="24" cy="26" r="3"/><circle cx="36" cy="26" r="3"/></svg>',
        leak: '<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M30 6C42 22 48 30 48 38a18 18 0 0 1-36 0c0-8 6-16 18-32z"/><path class="bh-drip" d="M30 30v10"/></svg>',
        race: '<svg viewBox="0 0 60 60" aria-hidden="true"><polygon points="30,4 36,22 55,22 40,33 46,52 30,41 14,52 20,33 5,22 24,22"/><path d="M26 28l8 8M34 28l-8 8"/></svg>',
        feature: '<svg viewBox="0 0 60 60" aria-hidden="true"><rect x="10" y="12" width="40" height="36" rx="8"/><path d="M20 30l7 7 13-14"/></svg>',
        clue: '<svg viewBox="0 0 60 60" aria-hidden="true"><rect x="8" y="14" width="44" height="32" rx="4"/><path d="M16 24h20M16 31h28M16 38h14"/></svg>'
    };
    function spawn(now) {
        var slot = freeSlot();
        if (!slot) return;
        var type = pickType(), T = BH_TYPES[type];
        if (type === "clue" && (rootKnown || live.some(function (x) { return x.type === "clue"; }))) type = "glitch", T = BH_TYPES.glitch;
        var camo = T.cure && rand() < S.camo;
        var b = button("bh-bug bh-bug--" + type + (camo ? " is-camo" : "") + (rootKnown && type === rootType ? " is-root" : ""), slot);
        b.innerHTML = ICON[type] + (camo ? '<span class="bh-camo" aria-hidden="true">' + GLYPHS[Math.floor(rand() * GLYPHS.length)] + "</span>" : "") +
            (T.hp > 1 ? '<i class="bh-pips">' + new Array(T.hp + 1).join("<b></b>") + "</i>" : "") +
            (type === "feature" ? "<span>intended</span>" : type === "clue" ? "<span>ⓘ log</span>" : "") +
            '<em class="bh-roottag" aria-hidden="true">◎ root</em>';
        var bug = { el: b, type: type, hp: T.hp || 1, camo: camo, born: now, hop: now + (sector >= 2 ? 520 : 720), life: type === "glitch" ? 5200 : type === "feature" ? 3600 : type === "clue" ? 2600 : 1e9 };
        b._bug = bug;
        label(bug);
        live.push(bug);
    }
    function label(bug) {
        var revealed = !bug.camo || pulseUntil > ctx.now();
        bug.el.setAttribute("aria-label", revealed ? BH_TYPES[bug.type].label + (rootKnown && bug.type === rootType ? " (root cause)" : "") : "Suspicious symbol");
    }
    function remove(bug) { bug.dead = true; bug.el.remove(); }
    function burst(target, text, tone) {
        var r = target.getBoundingClientRect(), fr = board.getBoundingClientRect();
        var f = el("span", "bh-float is-" + tone, board, text);
        f.style.left = (r.left - fr.left + r.width / 2) + "px";
        f.style.top = (r.top - fr.top) + "px";
        ctx.after(850, function () { f.remove(); });
        if (ctx.reduced || tone !== "good") return;
        for (var i = 0; i < 6; i++) {
            var sp = el("i", "bh-spark", board);
            sp.style.left = f.style.left;
            sp.style.top = (r.top - fr.top + r.height / 2) + "px";
            sp.style.setProperty("--a", (i * 60 + rand() * 30) + "deg");
            ctx.after(500, (function (n) { return function () { n.remove(); }; })(sp));
        }
    }
    function hit(bug) {
        if (bug.dead || finished || diagOpen()) return;
        if (bug.type === "feature") {
            misses++; streak = 0;
            corruption = Math.min(100, corruption + 8);
            score = Math.max(0, score - 20);
            burst(bug.el, "✕ that was intended behaviour", "bad");
            ctx.say("✕ Not a bug: that was intended behaviour. Breaking it added corruption.", "bad");
            sfx("drop"); ctx.react("alert");
            return remove(bug);
        }
        if (bug.type === "clue") {
            rootKnown = true;
            hits++;
            rootEl.textContent = "Root cause: " + BH_NAMES[rootType] + " (◎ counts double)";
            burst(bug.el, "ⓘ logs point to " + BH_NAMES[rootType], "good");
            ctx.say("ⓘ The logs agree: most errors come from " + BH_NAMES[rootType] + ". Those count double now.", "good");
            sfx("precise");
            live.forEach(function (x) { if (x.type === rootType) { x.el.classList.add("is-root"); label(x); } });
            return remove(bug);
        }
        bug.hp--;
        hits++;
        sfx("hit");
        if (bug.hp > 0) { bug.el.classList.add("is-cracked"); bug.el.style.setProperty("--hp", bug.hp); return; }
        streak++;
        bestStreak = Math.max(bestStreak, streak);
        var T = BH_TYPES[bug.type], isRoot = rootKnown && bug.type === rootType;
        var pts = Math.round(T.pts * mult() * (isRoot ? 1.5 : 1));
        score += pts;
        if (!S.quick) corruption = Math.max(0, corruption - T.cure * (isRoot ? 2 : 1));
        burst(bug.el, "+" + pts + (isRoot ? " ◎ root" : "") + " · " + (bug.type === "race" ? "race closed" : bug.type === "leak" ? "leak freed" : "glitch fixed"), "good");
        remove(bug);
    }
    ctx.on(board, "pointerdown", function (e) {
        if ((e.button && e.button !== 0) || finished || diagOpen()) return;
        var b = e.target.closest && e.target.closest(".bh-bug");
        if (b && b._bug) { e.preventDefault(); hit(b._bug); }
        else { misses++; streak = 0; }
    });
    ctx.on(board, "click", function (e) {
        var b = e.target.closest && e.target.closest(".bh-bug");
        if (b && b._bug && e.detail === 0) hit(b._bug);   // keyboard: Enter or Space on a defect
    });
    function pulse() {
        if (pulses <= 0 || S.quick || finished || diagOpen()) return;
        pulses--;
        pulseUntil = ctx.now() + 4000;
        root.classList.add("is-pulse");
        live.forEach(label);
        ctx.say("◌ Pulse: camouflaged defects revealed, intended behaviour marked, for four seconds.", "good");
        sfx("precise");
        ctx.after(4000, function () { root.classList.remove("is-pulse"); live.forEach(label); });
        paintPulse();
    }
    ctx.on(pulseBtn, "click", pulse);
    ctx.on(ctx.stage, "keydown", function (e) { if ((e.key === "d" || e.key === "D") && !e.target.closest("button:not(.bh-bug)")) { e.preventDefault(); pulse(); } });

    function diagOpen() { return !diag.hidden; }
    function diagnose(next) {
        var Q = questions[diagAsked++];
        if (!Q) return next();
        diag.hidden = false;
        diag.textContent = "";
        el("p", "bh-diag__k", diag, "Diagnose before the next sector · optional · fictional example");
        el("pre", "bh-diag__q", diag, Q.q);
        var opts = el("div", "bh-diag__opts", diag);
        shuffle(Q.opts, rand).forEach(function (o) {
            var b = button("btn btn--glass", opts, o[0]);
            b.addEventListener("click", function () {
                $$("button", opts).forEach(function (x) { x.disabled = true; });
                var ok = !!o[1];
                b.classList.add(ok ? "is-right" : "is-wrong");
                if (ok) { diagRight++; bonusMult++; pulses++; score += 150; sfx("success"); }
                else sfx("fail");
                el("p", "bh-diag__why", diag, (ok ? "✓ Right. " : "✕ Not quite. ") + Q.why + (ok ? " (+150, +1 multiplier, +1 pulse)" : ""));
                var go = button("btn btn--primary", diag, "Enter the next sector");
                go.addEventListener("click", function () { diag.hidden = true; next(); });
                go.focus({ preventScroll: true });
            });
        });
        var skip = button("btn btn--link bh-diag__skip", diag, "Skip the diagnosis");
        skip.addEventListener("click", function () { diag.hidden = true; next(); });
        $("button", opts).focus({ preventScroll: true });
    }
    function sectorDone(now) {
        var left = Math.max(0, S.time - (now - sectorStart));
        score += 300 + Math.round(left / 1000) * 5;
        live.forEach(remove);
        live = [];
        root.classList.add("is-restored");
        ctx.say("✓ Sector " + (sector + 1) + " restored with " + Math.round(left / 1000) + " s left.", "good");
        sfx("success"); ctx.react("happy");
        if (sector + 1 >= SECTORS.length) return finish(true);
        paused = true;
        ctx.after(900, function () {
            root.classList.remove("is-restored");
            diagnose(function () { sector++; paused = false; startSector(ctx.now()); });
        });
    }
    function finish(won) {
        if (finished) return;
        finished = true;
        var acc = hits + misses ? Math.round(hits / (hits + misses) * 100) : 100;
        if (S.quick) {
            return ctx.end({ score: score, won: true, message: "Quick round over: " + acc + "% accuracy, best streak " + bestStreak + ".",
                report: [hits + " hits, " + misses + " misses, " + escaped + " escaped."] });
        }
        var worst = live.filter(function (b) { return BH_TYPES[b.type].cure; }).map(function (b) { return b.type; }).sort().pop();
        ctx.end({ score: score, won: won,
            message: won ? "System restored. " + (SECTORS.length > 1 ? "All three sectors clean" : "Critical defect isolated") + ", " + acc + "% accuracy." : "Time ran out in sector " + (sector + 1) + " with corruption at " + Math.round(corruption) + "%.",
            report: won ? ["Diagnoses: " + diagRight + " of " + diagAsked + " correct. Best streak " + bestStreak + "."]
                : ["What kept corruption up: " + (worst ? BH_NAMES[worst] + " left alive (they add corruption every second)." : "too few defects resolved.") + " Use the pulse to find camouflaged ones, and catch the ⓘ log early: root-cause fixes count double."],
            clean: won && misses === 0, objective: won && diagRight >= 2, diagnoses: diagRight, recovered: won && SECTORS.length === 1 });
    }
    function hud(now) {
        var left = Math.max(0, Math.ceil((S.time - (now - sectorStart)) / 1000));
        var o = {};
        if (!S.quick) { o.Sector = (sector + 1) + " / " + SECTORS.length + " · " + S.name; o.Corruption = Math.round(corruption) + "%"; }
        o.Time = left + " s";
        o.Score = fmt(score);
        o.Streak = "×" + mult();
        ctx.hud(o);
        root.style.setProperty("--corrupt", (corruption / 100).toFixed(2));
    }
    startSector(0);
    hud(0);
    return {
        tick: function (dt, now) {
            if (finished || paused) return;
            if (now - sectorStart >= S.time) { hud(now); return finish(false); }
            if (now >= nextSpawn && live.length < 5) {
                spawn(now);
                var k = clamp((now - sectorStart) / S.time, 0, 1);
                nextSpawn = now + S.spawn[0] + (S.spawn[1] - S.spawn[0]) * k;
            }
            live.forEach(function (b) {
                if (b.dead) return;
                if (now - b.born > b.life) {
                    if (BH_TYPES[b.type].cure) { escaped++; corruption = Math.min(100, corruption + 6); }
                    return remove(b);
                }
                if (b.type === "glitch" && now >= b.hop) {
                    var to = freeSlot();
                    if (to) { to.appendChild(b.el); b.el.classList.remove("is-hop"); void b.el.offsetWidth; b.el.classList.add("is-hop"); }
                    b.hop = now + (sector >= 2 ? 520 : 720);
                }
                // Live defects push corruption up (a leak more, the longer it lives)
                var drift = BH_TYPES[b.type].drift;
                if (!S.quick && drift) corruption = Math.min(100, corruption + drift * (b.type === "leak" ? 1 + (now - b.born) / 6000 : 1) * dt / 1000);
                if (b.type === "leak") b.el.style.setProperty("--grow", Math.min(1.35, 1 + (now - b.born) / 20000).toFixed(3));
            });
            live = live.filter(function (b) { return !b.dead; });
            if (!S.quick && corruption <= 0) return sectorDone(now);
            hud(now);
        }
    };
}
