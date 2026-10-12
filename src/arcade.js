/* ==========================================================================
   After Hours — the arcade at the bottom of the homepage
   Loaded by script.js only when the visitor approaches the arcade (or presses Play).
   Four small games share one controller: a single session runs at a time, on one game clock,
   so pausing, exiting or switching stops every timer, frame loop and listener the game made.
   Personal bests stay in this browser (localStorage, if available); nothing is sent anywhere.
   ========================================================================== */
(function () {
    "use strict";

    var $ = function (sel, root) { return (root || document).querySelector(sel); };
    var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
    var reduceQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    var NS = "http://www.w3.org/2000/svg";
    var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
    var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
    function el(tag, cls, parent, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        if (parent) parent.appendChild(n);
        return n;
    }
    function svgEl(tag, attrs, parent) {
        var n = document.createElementNS(NS, tag);
        Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
        if (parent) parent.appendChild(n);
        return n;
    }
    function shuffle(a) {
        a = a.slice();
        for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
    }

    /* ---------------- Personal bests (this browser only) ---------------- */
    var BEST_KEY = "afterhours.best.v1";
    var memBest = {};
    function readBest() {
        try {
            var v = JSON.parse(window.localStorage.getItem(BEST_KEY) || "{}");
            return v && typeof v === "object" ? v : {};
        } catch (e) { return memBest; }
    }
    function saveBest(id, score) {
        var all = readBest(), prev = +all[id] || 0;
        if (score <= prev) return false;
        all[id] = Math.round(score);
        memBest = all;
        try { window.localStorage.setItem(BEST_KEY, JSON.stringify(all)); } catch (e) { /* session-only */ }
        return true;
    }

    /* ======================================================================
       GAME 1 — Packet Pilot: flip routers so every packet reaches its destination
       ====================================================================== */
    // Destinations are told apart by letter and shape, never by colour alone
    var PP_SHAPE = { A: "circle", B: "square", C: "triangle" };
    var PP_LEVELS = [
        { nodes: { S: [70, 225], R1: [330, 225], A: [720, 120], B: [720, 330] },
          edges: { S: ["R1"], R1: ["A", "B"] }, spawn: 2600, speed: 150, inflight: 1, goal: 4 },
        { nodes: { S: [60, 225], R1: [250, 225], R2: [480, 120], R3: [480, 330], A: [730, 60], B: [730, 225], C: [730, 390] },
          edges: { S: ["R1"], R1: ["R2", "R3"], R2: ["A", "B"], R3: ["B", "C"] }, spawn: 2500, speed: 160, inflight: 2, goal: 5 },
        { nodes: { S: [50, 225], R1: [190, 225], R2: [390, 105], R3: [390, 345], R4: [560, 225], A: [740, 70], B: [740, 225], C: [740, 380] },
          edges: { S: ["R1"], R1: ["R2", "R3"], R2: ["A", "R4"], R3: ["R4", "C"], R4: ["A", "B", "C"] },
          spawn: 2300, speed: 170, inflight: 2, goal: 6, fail: ["R2", "R3"] },
        { nodes: { S: [50, 225], R1: [190, 225], R2: [390, 105], R3: [390, 345], R4: [560, 225], A: [740, 70], B: [740, 225], C: [740, 380] },
          edges: { S: ["R1"], R1: ["R2", "R3"], R2: ["A", "R4"], R3: ["R4", "C"], R4: ["A", "B", "C"] },
          spawn: 1900, speed: 185, inflight: 3, goal: 7, fail: ["R2", "R3"], block: ["R2>A", "R3>C", "R2>R4", "R3>R4"] },
        { nodes: { S: [50, 225], R1: [190, 225], R2: [390, 105], R3: [390, 345], R4: [560, 225], A: [740, 70], B: [740, 225], C: [740, 380] },
          edges: { S: ["R1"], R1: ["R2", "R3"], R2: ["A", "R4"], R3: ["R4", "C"], R4: ["A", "B", "C"] },
          spawn: 1550, speed: 200, inflight: 3, goal: 8, fail: ["R2", "R3"], block: ["R2>A", "R3>C", "R2>R4", "R3>R4"] }
    ];

    function packetPilot(ctx) {
        var field = ctx.field, portrait = ctx.small;
        var W = portrait ? 450 : 800, H = portrait ? 800 : 450;
        var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, class: "pp", role: "group", "aria-label": "Network" }, field);
        var gEdges = svgEl("g", { class: "pp-edges" }, svg), gNodes = svgEl("g", { class: "pp-nodes" }, svg), gPk = svgEl("g", { class: "pp-packets" }, svg);
        var level = 0, L, pos, sw, nodesEl, edgesEl, routers, packets, failed, blocked, warn;
        var score = 0, errors = 0, delivered = 0, toggles = 0, nextSpawn = 0, nextHazard = 0, MAX_ERR = 5;
        var xy = function (p) { return portrait ? [p[1], p[0]] : [p[0], p[1]]; };

        function hud() { ctx.hud({ Score: score, Level: (level + 1) + " / " + PP_LEVELS.length, Delivered: delivered + " / " + L.goal, Errors: errors + " / " + MAX_ERR }); }
        function edgeId(a, b) { return a + ">" + b; }
        function build() {
            L = PP_LEVELS[level];
            gEdges.textContent = ""; gNodes.textContent = ""; gPk.textContent = "";
            pos = {}; sw = {}; nodesEl = {}; edgesEl = {}; packets = []; failed = null; blocked = null; warn = null;
            Object.keys(L.nodes).forEach(function (k) { pos[k] = xy(L.nodes[k]); });
            routers = Object.keys(L.edges).filter(function (k) { return k !== "S"; });
            Object.keys(L.edges).forEach(function (a) {
                sw[a] = 0;
                L.edges[a].forEach(function (b) {
                    var p = svgEl("path", { class: "pp-edge", d: "M" + pos[a][0] + " " + pos[a][1] + "L" + pos[b][0] + " " + pos[b][1] }, gEdges);
                    edgesEl[edgeId(a, b)] = p;
                });
            });
            Object.keys(L.nodes).forEach(function (k) {
                var kind = k === "S" ? "src" : PP_SHAPE[k] ? "dst" : "rtr";
                var g = svgEl("g", { class: "pp-node pp-node--" + kind, transform: "translate(" + pos[k][0] + " " + pos[k][1] + ")" }, gNodes);
                if (kind === "rtr") {
                    var n = routers.indexOf(k) + 1;
                    g.setAttribute("tabindex", "0");
                    g.setAttribute("role", "button");
                    g.setAttribute("data-router", k);
                    svgEl("circle", { class: "pp-hit", r: 42 }, g);
                    svgEl("circle", { class: "pp-body", r: 24 }, g);
                    var t = svgEl("text", { class: "pp-label", y: 5 }, g); t.textContent = String(n);
                } else if (kind === "dst") {
                    shape(g, PP_SHAPE[k], 26, "pp-body");
                    var td = svgEl("text", { class: "pp-label", y: 6 }, g); td.textContent = k;
                } else {
                    svgEl("rect", { class: "pp-body", x: -26, y: -26, width: 52, height: 52, rx: 12 }, g);
                    var ts = svgEl("text", { class: "pp-label", y: 5 }, g); ts.textContent = "IN";
                }
                nodesEl[k] = g;
            });
            nextSpawn = ctx.now() + 700;
            nextHazard = ctx.now() + 5000;
            paintSwitches();
            hud();
        }
        function shape(g, kind, r, cls) {
            if (kind === "circle") return svgEl("circle", { class: cls, r: r }, g);
            if (kind === "square") return svgEl("rect", { class: cls, x: -r * 0.86, y: -r * 0.86, width: r * 1.72, height: r * 1.72, rx: 5 }, g);
            return svgEl("polygon", { class: cls, points: "0," + (-r) + " " + (r * 0.95) + "," + (r * 0.75) + " " + (-r * 0.95) + "," + (r * 0.75) }, g);
        }
        function target(a) { return L.edges[a][sw[a]]; }
        function paintSwitches() {
            Object.keys(edgesEl).forEach(function (id) {
                var ab = id.split(">"), on = target(ab[0]) === ab[1];
                edgesEl[id].classList.toggle("is-on", on);
                edgesEl[id].classList.toggle("is-blocked", blocked === id);
                edgesEl[id].classList.toggle("is-warn", warn && warn.id === id);
            });
            routers.forEach(function (r) {
                var g = nodesEl[r];
                g.classList.toggle("is-failed", failed === r);
                g.classList.toggle("is-warn", !!(warn && warn.id === r));
                g.setAttribute("aria-label", "Router " + (routers.indexOf(r) + 1) + ": sending to " + label(target(r)) + (failed === r ? " (failed node)" : "") + ". Press to switch.");
            });
        }
        function label(k) { return PP_SHAPE[k] ? "destination " + k : "router " + (routers.indexOf(k) + 1); }
        function toggle(r) {
            if (!L.edges[r]) return;
            sw[r] = (sw[r] + 1) % L.edges[r].length;
            toggles++;
            paintSwitches();
            ctx.sound && ctx.sound("tick");
        }
        ctx.on(svg, "click", function (e) { var g = e.target.closest && e.target.closest("[data-router]"); if (g) toggle(g.getAttribute("data-router")); });
        ctx.on(svg, "keydown", function (e) {
            var g = e.target.closest && e.target.closest("[data-router]");
            if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggle(g.getAttribute("data-router")); }
        });
        ctx.on(ctx.stage, "keydown", function (e) {
            var n = parseInt(e.key, 10);
            if (n >= 1 && n <= routers.length) { e.preventDefault(); toggle(routers[n - 1]); }
        });

        function spawn() {
            var dests = Object.keys(L.nodes).filter(function (k) { return PP_SHAPE[k]; });
            var d = pick(dests);
            var g = svgEl("g", { class: "pp-packet pp-packet--" + d }, gPk);
            shape(g, PP_SHAPE[d], 13, "pp-pk");
            var t = svgEl("text", { class: "pp-pk-label", y: 4 }, g); t.textContent = d;
            packets.push({ dest: d, from: "S", to: "R1", t: 0, g: g, toggles: toggles });
        }
        function feedback(text, at, good) {
            var f = svgEl("text", { class: "pp-float " + (good ? "is-good" : "is-bad"), x: at[0], y: at[1] - 34 }, svg);
            f.textContent = text;
            ctx.after(900, function () { f.remove(); });
        }
        function lose(p, why) {
            errors++; score = Math.max(0, score - 40);
            feedback(why, pos[p.to], false);
            ctx.say(why);
            p.g.remove(); p.dead = true;
            if (errors >= MAX_ERR) ctx.end({ score: score, won: false, message: "Five packets went astray. The network's been here before; it recovers." });
        }
        function arrive(p) {
            var n = p.to;
            if (PP_SHAPE[n]) {
                if (n === p.dest) {
                    var bonus = Math.max(0, 40 - 10 * (toggles - p.toggles));
                    score += 100 * (level + 1) + bonus; delivered++;
                    feedback("+" + (100 * (level + 1) + bonus) + (bonus ? " efficient" : ""), pos[n], true);
                } else return lose(p, "Wrong destination: " + p.dest + " packet reached " + n);
                p.g.remove(); p.dead = true;
                if (delivered >= L.goal) levelUp();
                return;
            }
            if (failed === n) return lose(p, "Dropped at failed router " + (routers.indexOf(n) + 1));
            var next = target(n);
            if (blocked === edgeId(n, next)) return lose(p, "Dropped on a blocked link");
            p.from = n; p.to = next; p.t = 0;
        }
        function levelUp() {
            score += 200;
            if (level + 1 >= PP_LEVELS.length) return ctx.end({ score: score, won: true, message: "All five networks certified. Every packet found its way home." });
            level++; delivered = 0;
            ctx.say("Level " + (level + 1) + ": " + ["", "more routes online", "routers start failing — route around them", "links get blocked too", "peak traffic"][level]);
            ctx.after(250, build);
        }
        function hazard() {
            // Hazards are announced (dashed, pulsing) 1.5 s before they bite, and never cut a destination off
            if (!L.fail) return;
            var useBlock = L.block && Math.random() < 0.5;
            var id = useBlock ? pick(L.block) : pick(L.fail.filter(function (r) { return r !== failed; }));
            failed = null; blocked = null;
            warn = { id: id };
            paintSwitches();
            ctx.after(1500, function () {
                warn = null;
                if (useBlock) blocked = id; else failed = id;
                paintSwitches();
                ctx.after(6000, function () { if (failed === id) failed = null; if (blocked === id) blocked = null; paintSwitches(); });
            });
        }

        build();
        return {
            tick: function (dt, now) {
                if (now >= nextSpawn) {
                    if (packets.filter(function (p) { return !p.dead; }).length < L.inflight) spawn();
                    nextSpawn = now + L.spawn;
                }
                if (L.fail && now >= nextHazard) { hazard(); nextHazard = now + 9000; }
                packets.forEach(function (p) {
                    if (p.dead) return;
                    var a = pos[p.from], b = pos[p.to], len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
                    p.t += L.speed * dt / 1000 / len;
                    if (p.t >= 1) { p.t = 1; p.g.setAttribute("transform", "translate(" + b[0] + " " + b[1] + ")"); arrive(p); return; }
                    p.g.setAttribute("transform", "translate(" + (a[0] + (b[0] - a[0]) * p.t).toFixed(1) + " " + (a[1] + (b[1] - a[1]) * p.t).toFixed(1) + ")");
                });
                packets = packets.filter(function (p) { return !p.dead; });
                hud();
            }
        };
    }

    /* ======================================================================
       GAME 2 — Bug Hunter 404: squash bugs before the countdown ends
       ====================================================================== */
    function bugHunter(ctx) {
        var field = ctx.field, small = ctx.small;
        var COLS = small ? 4 : 6, ROWS = small ? 5 : 4, DURATION = 30000;
        var board = el("div", "bh", field);
        board.style.setProperty("--cols", COLS);
        board.style.setProperty("--rows", ROWS);
        // Scenery: inert glyphs behind the slots
        var deco = el("div", "bh-deco", board);
        deco.setAttribute("aria-hidden", "true");
        for (var d = 0; d < COLS * ROWS; d++) el("span", "", deco, pick(["{ }", "</>", "0x1F", "::", "//", "[ ]", "=>", "#!"]));
        var slots = [];
        for (var s = 0; s < COLS * ROWS; s++) slots.push(el("div", "bh-slot", board));
        var score = 0, hits = 0, misses = 0, combo = 0, escaped = 0, nextSpawn = 400;
        var live = [];
        var TYPES = {
            bug: { pts: 10, hp: 1, label: "Bug: squash it" },
            armored: { pts: 25, hp: 2, label: "Armoured bug: two hits" },
            hotfix: { pts: 40, hp: 1, label: "Hotfix bonus: quick, catch it" },
            feature: { pts: -15, hp: 1, label: "Not a bug, it's a feature: leave it" }
        };
        function hud(now) {
            ctx.hud({ Score: score, Time: Math.max(0, Math.ceil((DURATION - now) / 1000)) + " s", Accuracy: (hits + misses ? Math.round(hits / (hits + misses) * 100) : 100) + "%", Combo: "×" + mult() });
        }
        function mult() { return combo >= 8 ? 3 : combo >= 4 ? 2 : 1; }
        function spawn(now) {
            var free = slots.filter(function (sl) { return !sl.firstChild; });
            if (!free.length) return;
            var p = now / DURATION, r = Math.random(), type = "bug";
            if (p > 0.25 && r < 0.14) type = "feature";
            else if (p > 0.33 && r < 0.3) type = "armored";
            else if (r > 0.92) type = "hotfix";
            var T = TYPES[type];
            var b = el("button", "bh-bug bh-bug--" + type, pick(free));
            b.type = "button";
            b.setAttribute("aria-label", T.label);
            b.innerHTML = type === "feature"
                ? '<svg viewBox="0 0 60 60" aria-hidden="true"><rect x="10" y="12" width="40" height="36" rx="8"/><path d="M20 30l7 7 13-14"/></svg><span>feature</span>'
                : '<svg viewBox="0 0 60 60" aria-hidden="true"><path class="bh-legs" d="M14 22l-8-6M14 30H4M14 38l-8 6M46 22l8-6M46 30h10M46 38l8 6"/><polygon points="30,8 47,18 47,42 30,52 13,42 13,18"/><circle cx="24" cy="26" r="3"/><circle cx="36" cy="26" r="3"/></svg>' + (type === "armored" ? '<i class="bh-pips"><b></b><b></b></i>' : type === "hotfix" ? "<span>+40</span>" : "");
            var life = (type === "hotfix" ? 1100 : 1900) - 700 * p;
            var bug = { el: b, type: type, hp: T.hp, die: now + life };
            live.push(bug);
            b._bug = bug;
        }
        function burst(target, text, good) {
            var r = target.getBoundingClientRect(), fr = board.getBoundingClientRect();
            var f = el("span", "bh-float " + (good ? "is-good" : "is-bad"), board, text);
            f.style.left = (r.left - fr.left + r.width / 2) + "px";
            f.style.top = (r.top - fr.top) + "px";
            ctx.after(800, function () { f.remove(); });
            if (ctx.reduced || !good) return;
            for (var i = 0; i < 6; i++) {
                var sp = el("i", "bh-spark", board);
                sp.style.left = f.style.left;
                sp.style.top = (r.top - fr.top + r.height / 2) + "px";
                sp.style.setProperty("--a", (i * 60 + Math.random() * 30) + "deg");
                ctx.after(500, (function (n) { return function () { n.remove(); }; })(sp));
            }
        }
        function remove(bug) { bug.dead = true; bug.el.remove(); }
        function hit(bug) {
            if (bug.dead) return;
            if (bug.type === "feature") {
                misses++; combo = 0; score = Math.max(0, score - 15);
                burst(bug.el, "−15 · it was a feature", false);
                ctx.say("That one was a feature, not a bug.");
                remove(bug);
                return;
            }
            bug.hp--;
            if (bug.hp > 0) { bug.el.classList.add("is-cracked"); bug.el.setAttribute("aria-label", "Armoured bug: one more hit"); hits++; return; }
            hits++; combo++;
            var pts = TYPES[bug.type].pts * mult();
            score += pts;
            burst(bug.el, "+" + pts + " · " + pick(["ERR_404 resolved", "0x1F fixed", "segfault patched", "null checked", "race closed"]), true);
            remove(bug);
        }
        ctx.on(board, "pointerdown", function (e) {
            if (e.button && e.button !== 0) return;
            var b = e.target.closest && e.target.closest(".bh-bug");
            if (b && b._bug) { e.preventDefault(); b._handled = true; hit(b._bug); }
            else { misses++; combo = 0; }
        });
        // Keyboard: bugs are real buttons (Enter or Space)
        ctx.on(board, "click", function (e) {
            var b = e.target.closest && e.target.closest(".bh-bug");
            if (b && b._bug && e.detail === 0) hit(b._bug);
        });
        hud(0);
        return {
            tick: function (dt, now) {
                if (now >= DURATION) {
                    hud(DURATION);
                    var acc = hits + misses ? Math.round(hits / (hits + misses) * 100) : 100;
                    ctx.end({ score: score, won: score > 0, message: score >= 400 ? "Inbox zero. The on-call phone stays silent tonight. (" + acc + "% accuracy)" : escaped > hits ? "Some bugs escaped to production. They usually do. (" + acc + "% accuracy)" : "Triage complete. " + acc + "% accuracy." });
                    return;
                }
                if (now >= nextSpawn) { spawn(now); nextSpawn = now + 850 - 420 * (now / DURATION); }
                live.forEach(function (b) {
                    if (!b.dead && now >= b.die) { if (b.type !== "feature") { escaped++; combo = 0; } remove(b); }
                });
                live = live.filter(function (b) { return !b.dead; });
                hud(now);
            }
        };
    }

    /* ======================================================================
       GAME 3 — Deploy Rush: assemble a valid pipeline, then handle what goes wrong
       Fictional scenarios for practice, not a description of any real pipeline.
       ====================================================================== */
    var DR_STAGES = {
        source: ["Source", "Pull the commit that triggered the release. Everything starts from version control."],
        build: ["Build", "Compile and package once. Every later stage uses this same artifact."],
        test: ["Unit tests", "Run automated tests against the build. A failure stops the release here."],
        scan: ["Security scan", "Check the code and its dependencies for known vulnerabilities before anything ships."],
        infra: ["Provision infra", "Apply the infrastructure-as-code templates so the environment matches what's in source."],
        approve: ["Approval", "A person signs off before production changes."],
        deploy: ["Deploy", "Roll the tested artifact out to production."],
        health: ["Health check", "Confirm the new version is healthy. If it isn't, roll back."]
    };
    var DR_ORDER = ["source", "build", "test", "scan", "infra", "approve", "deploy", "health"];
    var DR_LEVELS = [
        { stages: ["source", "build", "test", "deploy"], incidents: 0 },
        { stages: ["source", "build", "test", "scan", "deploy", "health"], incidents: 1 },
        { stages: DR_ORDER, incidents: 1 },
        { stages: DR_ORDER, incidents: 2 }
    ];
    // Each incident has one sound response; the others explain why they don't work
    var DR_INCIDENTS = {
        build: ["The build agent timed out. The same commit built fine an hour ago.", [
            ["Retry the build", true, "A transient failure: retrying is the sensible first move."],
            ["Roll back production", false, "Nothing has reached production yet, so a rollback changes nothing."],
            ["Skip the build", false, "Without a build there is no artifact to deploy."]]],
        test: ["Two unit tests fail: prices ending in .5 round the wrong way.", [
            ["Fix the code and re-run", true, "The tests caught a real bug before users did."],
            ["Disable the failing tests", false, "Known-broken code ships, and the bug reaches production."],
            ["Re-run without changes", false, "The failure is deterministic. Re-running only wastes time."]]],
        scan: ["Critical vulnerability found in a third-party dependency.", [
            ["Upgrade the dependency and re-scan", true, "Patched before it shipped."],
            ["Approve the release anyway", false, "The vulnerable dependency goes live."],
            ["Re-run the scan", false, "Same dependency, same finding."]]],
        deploy: ["The rollout finished, but the error rate on the new version jumped to 12%.", [
            ["Roll back to the previous version", true, "Restore service first; investigate after."],
            ["Redeploy the same version", false, "Same artifact, same errors."],
            ["Leave it running", false, "Customers keep hitting errors."]]],
        health: ["The health check fails: /health returns 503 after the release.", [
            ["Roll back", true, "The previous version is back and healthy."],
            ["Wait and hope", false, "Hope is not a rollback strategy. The outage continues."],
            ["Mark it healthy manually", false, "The check was right. Users find out the hard way."]]]
    };

    function deployRush(ctx) {
        var root = el("div", "dr", ctx.field);
        var info = el("p", "dr-info", root, "Pick the stages in the order a release should run them. Select a stage to see what it does.");
        info.setAttribute("aria-live", "polite");
        var pipe = el("ol", "dr-pipe", root);
        pipe.setAttribute("aria-label", "Your pipeline");
        var tray = el("div", "dr-tray", root);
        tray.setAttribute("aria-label", "Available stages");
        var actions = el("div", "dr-actions", root);
        var runBtn = el("button", "btn btn--primary dr-run", actions, "Run pipeline");
        runBtn.type = "button";
        var clearBtn = el("button", "btn btn--glass dr-clear", actions, "Clear");
        clearBtn.type = "button";
        var note = el("p", "dr-note", root, "Fictional scenarios for practice, not a real pipeline.");
        var decide = el("div", "dr-decide", root);
        decide.hidden = true;
        var level = 0, L, slots, score = 0, failedReleases = 0, invalidRuns = 0, running = false, incidents, MAX_FAIL = 3;

        function hud() { ctx.hud({ Score: score, Level: (level + 1) + " / " + DR_LEVELS.length, "Failed releases": failedReleases + " / " + MAX_FAIL }); }
        function setup() {
            L = DR_LEVELS[level];
            slots = L.stages.map(function () { return null; });
            pipe.textContent = ""; tray.textContent = "";
            decide.hidden = true; running = false; invalidRuns = 0;
            root.classList.remove("is-running", "is-done", "is-broken");
            L.stages.forEach(function (id, i) {
                var li = el("li", "dr-slot", pipe);
                li.setAttribute("data-i", i);
                el("span", "dr-slot__n", li, String(i + 1));
                var b = el("button", "dr-chip dr-chip--placed", li);
                b.type = "button"; b.hidden = true;
            });
            shuffle(L.stages).forEach(function (id) {
                var b = el("button", "dr-chip", tray, DR_STAGES[id][0]);
                b.type = "button";
                b.setAttribute("data-stage", id);
            });
            // Which stages will misbehave this time (only ones present in this level)
            var possible = Object.keys(DR_INCIDENTS).filter(function (k) { return L.stages.indexOf(k) > -1; });
            incidents = shuffle(possible).slice(0, L.incidents);
            paint();
            hud();
        }
        function paint() {
            $$(".dr-slot", pipe).forEach(function (li, i) {
                var b = $(".dr-chip--placed", li), id = slots[i];
                b.hidden = !id;
                if (id) { b.textContent = DR_STAGES[id][0]; b.setAttribute("aria-label", "Step " + (i + 1) + ": " + DR_STAGES[id][0] + ". Press to remove."); b.setAttribute("data-stage", id); }
                li.classList.remove("is-ok", "is-bad", "is-run", "is-fail");
                li.classList.toggle("is-empty", !id);
            });
            $$(".dr-chip", tray).forEach(function (b) { b.hidden = slots.indexOf(b.getAttribute("data-stage")) > -1; });
            runBtn.disabled = slots.indexOf(null) > -1 || running;
        }
        function explain(id) { info.textContent = DR_STAGES[id][0] + " — " + DR_STAGES[id][1]; }
        ctx.on(tray, "click", function (e) {
            var b = e.target.closest(".dr-chip");
            if (!b || running) return;
            var id = b.getAttribute("data-stage"), i = slots.indexOf(null);
            explain(id);
            if (i < 0) return;
            slots[i] = id;
            paint();
            var nextChip = $(".dr-chip:not([hidden])", tray);
            if (nextChip && document.activeElement === b) nextChip.focus(); else if (!nextChip) runBtn.focus();
        });
        ctx.on(pipe, "click", function (e) {
            var b = e.target.closest(".dr-chip--placed");
            if (!b || running) return;
            var i = +b.closest(".dr-slot").getAttribute("data-i");
            explain(slots[i]);
            slots[i] = null;
            paint();
        });
        ctx.on(clearBtn, "click", function () { if (!running) { slots = slots.map(function () { return null; }); paint(); } });
        ctx.on(runBtn, "click", function () { if (!running) validate(); });

        function validate() {
            var lis = $$(".dr-slot", pipe), firstBad = -1;
            slots.forEach(function (id, i) {
                var ok = id === L.stages[i];
                lis[i].classList.add(ok ? "is-ok" : "is-bad");
                if (!ok && firstBad < 0) firstBad = i;
            });
            if (firstBad > -1) {
                invalidRuns++;
                score = Math.max(0, score - 30);
                var id = slots[firstBad], should = L.stages[firstBad];
                var reason = DR_ORDER.indexOf(id) > DR_ORDER.indexOf(should)
                    ? DR_STAGES[should][0] + " has to happen before " + DR_STAGES[id][0] + "."
                    : DR_STAGES[id][0] + " is too early: " + DR_STAGES[L.stages[firstBad - 1] || should][0] + " comes first.";
                info.textContent = "Pipeline rejected at step " + (firstBad + 1) + ". " + reason + " (−30)";
                ctx.say("Pipeline rejected: " + reason);
                hud();
                return;
            }
            run(0);
        }
        function run(i) {
            running = true;
            root.classList.add("is-running");
            root.classList.remove("is-broken");
            paint();
            var lis = $$(".dr-slot", pipe);
            lis.forEach(function (li, k) { li.classList.toggle("is-run", k < i); });
            if (i >= slots.length) return shipped();
            lis[i].classList.add("is-active");
            info.textContent = "Running: " + DR_STAGES[slots[i]][0] + "…";
            ctx.after(ctx.reduced ? 250 : 520, function () {
                lis[i].classList.remove("is-active");
                var k = incidents.indexOf(slots[i]);
                if (k > -1) { incidents.splice(k, 1); return incident(i); }
                lis[i].classList.add("is-run");
                run(i + 1);
            });
        }
        function incident(i) {
            var id = slots[i], inc = DR_INCIDENTS[id];
            var lis = $$(".dr-slot", pipe);
            lis[i].classList.add("is-fail");
            root.classList.add("is-broken");
            info.textContent = "Failure at " + DR_STAGES[id][0] + ". What do you do?";
            decide.hidden = false;
            decide.textContent = "";
            el("p", "dr-decide__q", decide, inc[0]);
            var opts = el("div", "dr-decide__opts", decide);
            shuffle(inc[1]).forEach(function (o) {
                var b = el("button", "btn btn--glass", opts, o[0]);
                b.type = "button";
                b.addEventListener("click", function () { choose(i, id, o); });
            });
            $("button", opts).focus();
        }
        function choose(i, id, o) {
            decide.hidden = true;
            var lis = $$(".dr-slot", pipe);
            if (o[1]) {
                score += 80;
                lis[i].classList.remove("is-fail");
                root.classList.remove("is-broken");
                ctx.say("Good call: " + o[2]);
                // A sound rollback ends this release safely; anything else resumes the run
                if (/^Roll back/.test(o[0]) && (id === "deploy" || id === "health")) {
                    info.textContent = o[2] + " Safe rollback (+80). The fix ships in the next release.";
                    hud();
                    return ctx.after(1400, nextLevel);
                }
                info.textContent = o[2] + " (+80)";
                hud();
                lis[i].classList.add("is-run");
                ctx.after(400, function () { run(i + 1); });
            } else {
                failedReleases++;
                score = Math.max(0, score - 50);
                info.textContent = "Release failed: " + o[2] + " (−50)";
                ctx.say("Release failed. " + o[2]);
                hud();
                if (failedReleases >= MAX_FAIL) return ctx.end({ score: score, won: false, message: "Three failed releases. The post-incident review is scheduled for Monday." });
                running = false;
                root.classList.remove("is-running");
                // Same level, same arrangement: try the run again
                var possible = Object.keys(DR_INCIDENTS).filter(function (k) { return L.stages.indexOf(k) > -1; });
                incidents = shuffle(possible).slice(0, L.incidents);
                paint();
                runBtn.textContent = "Run again";
                runBtn.focus();
            }
        }
        function shipped() {
            running = false;
            root.classList.add("is-done");
            var bonus = invalidRuns === 0 ? 50 : 0;
            score += 150 + bonus;
            info.textContent = "Release shipped. Every stage passed" + (bonus ? ", first try (+50)." : ".");
            ctx.say("Release shipped.");
            hud();
            ctx.after(1500, nextLevel);
        }
        function nextLevel() {
            if (level + 1 >= DR_LEVELS.length) return ctx.end({ score: score, won: true, message: "Four releases out, incidents handled. That's a calm on-call week." });
            level++;
            runBtn.textContent = "Run pipeline";
            setup();
            info.textContent = "Level " + (level + 1) + ": " + L.stages.length + " stages" + (L.incidents ? ", and " + (L.incidents > 1 ? "two things" : "something") + " will go wrong." : ".");
        }
        setup();
        return {};
    }

    /* ======================================================================
       GAME 4 — Cloud Stack: drop each component onto the tower
       Arcade rules, not physics: the overlap with the block below is what survives.
       ====================================================================== */
    var CS_NAMES = ["Front Door", "API Management", "App Service", "Functions", "Logic Apps", "Service Bus", "Cosmos DB", "Key Vault", "Storage", "Event Grid", "Monitor", "VNet"];
    function cloudStack(ctx) {
        var field = ctx.field;
        var view = el("div", "cs-view", field);
        var world = el("div", "cs-world", view);
        var hint = el("p", "cs-hint", view, "Tap, click, or press Space to drop");
        hint.setAttribute("aria-hidden", "true");
        var W = view.clientWidth || 600, BH = 28, BASE_W = Math.round(W * 0.46), MAX_H = 30;
        var tower = [], score = 0, streak = 0, best = 0, moving = null, dir = 1, over = false, cam = 0;
        function block(x, w, i, cls) {
            var b = el("div", "cs-block " + (cls || ""), world);
            b.style.left = x + "px";
            b.style.width = w + "px";
            b.style.bottom = (i * BH) + "px";
            b.style.setProperty("--h", (i * 23) % 360);
            if (w > 70) el("span", "", b, CS_NAMES[i % CS_NAMES.length]);
            return b;
        }
        var base = { x: (W - BASE_W) / 2, w: BASE_W, el: block((W - BASE_W) / 2, BASE_W, 0, "cs-block--base") };
        base.el.textContent = "platform";
        tower.push(base);
        function hud() { ctx.hud({ Height: tower.length - 1 + " / " + MAX_H, Score: score, Streak: streak }); }
        function next() {
            var top = tower[tower.length - 1];
            var i = tower.length;
            dir = i % 2 ? 1 : -1;
            // it enters already partly over the tower, so an early press is never an instant loss
            moving = { x: dir > 0 ? top.x - top.w * 0.55 : top.x + top.w * 0.55, w: top.w, i: i };
            moving.el = block(moving.x, moving.w, i, "cs-block--moving");
            // keep the top of the tower in view
            var want = Math.max(0, (i + 2) * BH - view.clientHeight * 0.6);
            if (want !== cam) { cam = want; world.style.transform = "translate3d(0," + cam + "px,0)"; }
        }
        function speed() { return 140 + Math.min(tower.length, 25) * 10; }
        function drop() {
            if (!moving || over) return;
            var top = tower[tower.length - 1], m = moving;
            moving = null;
            var left = Math.max(m.x, top.x), right = Math.min(m.x + m.w, top.x + top.w), ov = right - left;
            if (ov <= 0) return collapse(m);
            var off = Math.abs(m.x - top.x), placed;
            m.el.classList.remove("cs-block--moving");
            if (off <= 5) {
                // Perfect: snaps exactly onto the block below, and a streak earns a little width back
                streak++;
                var w = Math.min(BASE_W, top.w + (streak >= 3 ? 8 : 0));
                placed = { x: top.x - (w - top.w) / 2, w: w, el: m.el };
                score += 10 + 10 * streak;
                m.el.classList.add("is-perfect");
                ctx.say(streak >= 3 ? "Perfect ×" + streak + ": the stack grows back a little." : "Perfect placement.");
            } else {
                streak = 0;
                placed = { x: left, w: ov, el: m.el };
                score += 10 + Math.round(10 * ov / top.w);
                // the overhang falls away
                var cutX = m.x < top.x ? m.x : right, cutW = m.w - ov;
                var cut = block(cutX, cutW, m.i, "cs-block--cut " + (m.x < top.x ? "is-left" : "is-right"));
                ctx.after(700, function () { cut.remove(); });
            }
            placed.el.style.left = placed.x + "px";
            placed.el.style.width = placed.w + "px";
            if (placed.w <= 70) placed.el.textContent = "";
            tower.push(placed);
            hud();
            if (tower.length - 1 >= MAX_H) { over = true; return ctx.end({ score: score + 200, won: true, message: "Thirty layers, still standing. Ship it." }); }
            next();
        }
        function collapse(m) {
            over = true;
            m.el.classList.add("is-miss");
            ctx.say("Missed the stack. The structure comes down.");
            tower.slice(1).forEach(function (t, k) {
                t.el.style.setProperty("--k", k);
                t.el.style.setProperty("--dx", ((k % 2 ? 1 : -1) * (20 + (k * 7) % 40)) + "px");
                t.el.classList.add("is-down");
            });
            ctx.after(ctx.reduced ? 300 : 1100, function () {
                ctx.end({ score: score, won: false, message: tower.length - 1 > 12 ? "A respectable skyline before it toppled." : "Structural review: the next layer missed the one below." });
            });
        }
        ctx.on(view, "pointerdown", function (e) { if (!e.button) { e.preventDefault(); drop(); } });
        ctx.on(ctx.stage, "keydown", function (e) {
            if ((e.key === " " || e.key === "Enter") && !e.target.closest("button")) { e.preventDefault(); drop(); }
        });
        hud();
        next();
        return {
            tick: function (dt) {
                if (!moving) return;
                moving.x += dir * speed() * dt / 1000;
                var lo = -moving.w * 0.6, hi = W - moving.w * 0.4;
                if (moving.x > hi) { moving.x = hi; dir = -1; }
                if (moving.x < lo) { moving.x = lo; dir = 1; }
                moving.el.style.left = moving.x.toFixed(1) + "px";
            }
        };
    }

    var GAMES = {
        packet: { title: "Packet Pilot", create: packetPilot, keys: "Click or tap a router (or press its number) to switch where it sends packets.",
            goal: "Get every packet to the destination it's labelled for.",
            how: ["Packets leave the IN node and follow the bright links.", "Each router sends traffic one way; switch it before a packet arrives.", "Watch for warnings: failed routers and blocked links drop packets. Five errors ends the run."] },
        bugs: { title: "Bug Hunter 404", create: bugHunter, keys: "Click or tap bugs. Keyboard: Tab to a bug, then Enter.",
            goal: "Squash as many bugs as you can in 30 seconds.",
            how: ["Hexagons are bugs: one hit. Two pips mean an armoured bug: two hits.", "+40 targets are hotfixes: worth chasing.", "Squares marked ‘feature’ aren't bugs. Leave them alone."] },
        deploy: { title: "Deploy Rush", create: deployRush, keys: "Click or tap stages (or Tab and Enter) to build the pipeline.",
            goal: "Ship four releases: order the stages correctly, then handle what goes wrong.",
            how: ["Pick stages in the order a release should run them.", "Run the pipeline. A wrong order is rejected with the reason.", "When a stage fails, choose the sound response. Three failed releases ends the run."] },
        stack: { title: "Cloud Stack", create: cloudStack, keys: "Tap, click, Space or Enter to drop.",
            goal: "Stack thirty layers of cloud architecture without missing.",
            how: ["A component slides above the tower; drop it when it lines up.", "Whatever overhangs is cut off, so the next layer is narrower.", "Perfect drops keep the width, and a streak of them wins a little back."] }
    };

    /* ======================================================================
       The arcade: selector, stage, and the one running session
       ====================================================================== */
    var section = $("#arcade"), shell = $("#arcade-shell"), grid = $("#arcade-grid"), stage = $("#arcade-stage");
    var statusEl = $("#arcade-status"), mascot = $(".arcade__mascot");
    if (!section || !shell || !grid || !stage) return;
    var session = null;

    function setStatus(text, mood) {
        if (statusEl) statusEl.textContent = text;
        if (mascot) { mascot.classList.remove("is-playing", "is-sad", "is-proud"); if (mood) mascot.classList.add("is-" + mood); }
    }
    function paintBest() {
        var b = readBest();
        $$("[data-best-for]", grid).forEach(function (p) {
            var v = +b[p.getAttribute("data-best-for")] || 0;
            p.hidden = !v;
            var n = $("b", p);
            if (n) n.textContent = String(v);
        });
    }

    function Session(id, card) {
        var def = GAMES[id], s = this;
        s.id = id; s.def = def; s.card = card; s.state = "intro";
        s.time = 0; s.timers = []; s.offs = []; s.raf = 0; s.game = null;
        stage.textContent = "";
        stage.setAttribute("aria-label", def.title);
        var bar = el("div", "stage__bar", stage);
        s.back = el("button", "stage__back", bar, "← Back to arcade");
        s.back.type = "button";
        el("h3", "stage__title", bar, def.title);
        s.hudEl = el("dl", "stage__hud", bar);
        var ctrls = el("div", "stage__ctrls", bar);
        s.pauseBtn = el("button", "stage__btn", ctrls, "Pause");
        s.pauseBtn.type = "button";
        s.restartBtn = el("button", "stage__btn", ctrls, "Restart");
        s.restartBtn.type = "button";
        // Quick switch: the selector folded into a compact strip
        var strip = el("div", "stage__switch", bar);
        strip.setAttribute("aria-label", "Switch game");
        Object.keys(GAMES).forEach(function (g) {
            var b = el("button", "stage__chip" + (g === id ? " is-current" : ""), strip, GAMES[g].title);
            b.type = "button";
            if (g === id) b.setAttribute("aria-current", "true");
            b.setAttribute("data-switch", g);
        });
        // The overlay (intro, pause, game over) covers only the play area: the bar's controls,
        // including Back to arcade, stay reachable at all times
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
        s.listen(document, "visibilitychange", function () { if (document.hidden && s.state === "play") s.pause(); });
        if ("IntersectionObserver" in window) {
            s.io = new IntersectionObserver(function (en) { if (!en[0].isIntersecting && s.state === "play") s.pause(); }, { threshold: 0.15 });
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
        var b = +readBest()[this.id] || 0;
        if (b) { var w2 = el("div", "is-best", d); el("dt", "", w2, "Best"); el("dd", "", w2, String(b)); }
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
        var ul = el("ul", "stage__how", c);
        d.how.forEach(function (t) { el("li", "", ul, t); });
        el("p", "stage__keys", c, d.keys + " Pause with P or Esc.");
        var go = el("button", "btn btn--primary", c, "Start");
        go.type = "button";
        go.addEventListener("click", function () { s.start(); });
        s.pauseBtn.disabled = true;
        go.focus({ preventScroll: true });
        setStatus("ready: " + d.title.toLowerCase(), "playing");
    };
    Session.prototype.start = function () {
        var s = this;
        s.stopGame();
        s.field.textContent = "";
        s.say.textContent = "";
        s.overlay.className = "stage__overlay";
        s.overlay.textContent = "";
        s.time = 0; s.timers = [];
        s.gameOffs = [];
        var ctx = {
            field: s.field, stage: stage,
            small: s.field.clientWidth < 560,
            reduced: reduceQ.matches,
            now: function () { return s.time; },
            hud: function (o) { s.hud(o); },
            say: function (t) { s.say.textContent = t; },
            after: function (ms, fn) { s.timers.push({ at: s.time + ms, fn: fn }); },
            on: function (t, ev, fn, opt) { t.addEventListener(ev, fn, opt); s.gameOffs.push(function () { t.removeEventListener(ev, fn, opt); }); },
            end: function (res) { s.end(res); }
        };
        s.game = s.def.create(ctx) || {};
        // Ignore input for a moment: on touch screens the tap that pressed Start is followed by a
        // late mouse event at the same spot, which would otherwise land on the new board
        s.field.classList.add("is-arming");
        s.timers.push({ at: 350, fn: function () { s.field.classList.remove("is-arming"); } });
        s.state = "play";
        s.pauseBtn.disabled = false;
        s.pauseBtn.textContent = "Pause";
        s.pauseBtn.setAttribute("aria-pressed", "false");
        stage.focus({ preventScroll: true });
        setStatus("running: " + s.def.title.toLowerCase(), "playing");
        frame(stage);
        s.loop();
    };
    // One clock per session: game time only advances while playing, so pause freezes everything
    Session.prototype.loop = function () {
        var s = this;
        var last = performance.now();
        function step(now) {
            if (s.state !== "play") return;
            var dt = Math.min(50, now - last);
            last = now;
            s.time += dt;
            var due = s.timers.filter(function (t) { return t.at <= s.time; });
            s.timers = s.timers.filter(function (t) { return t.at > s.time; });
            due.forEach(function (t) { if (s.state === "play" || s.state === "ending") t.fn(); });
            if (s.state === "play" && s.game.tick) s.game.tick(dt, s.time);
            if (s.state === "play") s.raf = window.requestAnimationFrame(step);
        }
        s.raf = window.requestAnimationFrame(step);
    };
    Session.prototype.pause = function () {
        var s = this;
        if (s.state !== "play") return;
        s.state = "paused";
        window.cancelAnimationFrame(s.raf);
        s.pauseBtn.textContent = "Resume";
        s.pauseBtn.setAttribute("aria-pressed", "true");
        var c = s.panel("is-paused", "Paused");
        el("p", "", c, "The game clock is stopped.");
        var row = el("div", "stage__row", c);
        var r = el("button", "btn btn--primary", row, "Resume"); r.type = "button";
        var re = el("button", "btn btn--glass", row, "Restart"); re.type = "button";
        var bk = el("button", "btn btn--link", row, "Back to arcade"); bk.type = "button";
        r.addEventListener("click", function () { s.resume(); });
        re.addEventListener("click", function () { s.start(); });
        bk.addEventListener("click", close);
        r.focus({ preventScroll: true });
        setStatus("paused: " + s.def.title.toLowerCase(), "");
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
        setStatus("running: " + s.def.title.toLowerCase(), "playing");
        s.loop();
    };
    Session.prototype.end = function (res) {
        var s = this;
        if (s.state !== "play") return;
        s.state = "over";
        window.cancelAnimationFrame(s.raf);
        s.timers = [];
        s.pauseBtn.disabled = true;
        var prev = +readBest()[s.id] || 0;
        var isBest = saveBest(s.id, res.score);
        var c = s.panel(res.won ? "is-won" : "is-lost", res.won ? "Run complete" : "Game over");
        var sc = el("p", "stage__score", c);
        el("span", "", sc, "Final score");
        el("b", "", sc, String(Math.round(res.score)));
        el("p", "stage__best", c, isBest ? (prev ? "New personal best (was " + prev + ")." : "First score on the board.") : prev ? "Personal best: " + prev : "No personal best yet. Plenty of time.");
        el("p", "stage__msg", c, res.message);
        var row = el("div", "stage__row", c);
        var again = el("button", "btn btn--primary", row, "Play again"); again.type = "button";
        var other = el("button", "btn btn--glass", row, "Choose another game"); other.type = "button";
        again.addEventListener("click", function () { s.start(); });
        other.addEventListener("click", close);
        again.focus({ preventScroll: true });
        s.hud({});
        paintBest();
        if (isBest) { section.classList.add("is-record"); setStatus("new personal best · " + s.def.title.toLowerCase(), "proud"); }
        else setStatus(res.won ? "run complete · " + s.def.title.toLowerCase() : pick(["incident logged. it happens to the best of us.", "post-mortem scheduled. blameless, of course.", "rollback complete. try again?"]), res.won ? "proud" : "sad");
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
    };

    // Bring the whole stage into view, just under the header, unless it already fits on screen
    // (measured a frame later, once the new contents have laid out)
    function frame(node) {
        window.requestAnimationFrame(function () {
            var r = node.getBoundingClientRect(), head = document.getElementById("site-header");
            var top = head ? head.getBoundingClientRect().bottom + 8 : 8;
            if (r.top < top - 2 || r.bottom > window.innerHeight + 2) {
                window.scrollTo({ top: window.scrollY + r.top - top, behavior: reduceQ.matches ? "auto" : "smooth" });
            }
        });
    }

    // Opening grows the stage out of the chosen card; closing folds it back
    function open(id, card) {
        if (!GAMES[id]) return;
        if (session) session.destroy();
        $$(".toy", grid).forEach(function (t) { t.classList.toggle("is-selected", t === card); });
        section.classList.remove("is-record");
        var from = card ? card.getBoundingClientRect() : null;
        shell.setAttribute("data-view", "game");
        grid.hidden = true;
        stage.hidden = false;
        session = new Session(id, card);
        // Measure before the opening animation transforms it
        var to = stage.getBoundingClientRect();
        if (from && !reduceQ.matches && stage.animate) {
            stage.animate([
                { transformOrigin: "0 0", transform: "translate(" + (from.left - to.left) + "px," + (from.top - to.top) + "px) scale(" + (from.width / to.width) + "," + (from.height / to.height) + ")", opacity: 0.4 },
                { transformOrigin: "0 0", transform: "none", opacity: 1 }
            ], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
        }
        frame(stage);
    }
    function close() {
        if (!session) return;
        var card = session.card;
        session.destroy();
        session = null;
        stage.hidden = true;
        grid.hidden = false;
        shell.setAttribute("data-view", "select");
        paintBest();
        if (card) {
            if (!reduceQ.matches && card.animate) card.animate([{ transform: "scale(.94)", opacity: 0.5 }, { transform: "none", opacity: 1 }], { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" });
            var r = card.getBoundingClientRect();
            if (r.top < 0 || r.bottom > window.innerHeight) card.scrollIntoView({ block: "center", behavior: reduceQ.matches ? "auto" : "smooth" });
            var play = $(".toy__play", card);
            if (play) play.focus({ preventScroll: true });
        }
        if (!/new personal best/.test(statusEl ? statusEl.textContent : "")) setStatus("idle · pick a toy", "");
    }

    grid.addEventListener("click", function (e) {
        var b = e.target.closest("[data-play]");
        if (b) open(b.getAttribute("data-play"), b.closest(".toy"));
    });
    // Previews only animate while the arcade is on screen
    if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) { section.classList.toggle("is-awake", en[0].isIntersecting); }, { rootMargin: "100px 0px" }).observe(section);
    } else section.classList.add("is-awake");
    section.classList.add("is-ready");
    paintBest();
    // A Play pressed before this file arrived
    if (window.__arcadeQueue) { var q = window.__arcadeQueue; window.__arcadeQueue = null; open(q, $('[data-game="' + q + '"]', grid)); }
})();
