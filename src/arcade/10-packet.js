/* ======================================================================
   PACKET PILOT — keep a live network delivering
   Five missions, each with its own topology and one new idea. Packets wear a live preview badge
   (✓ arrives / ✕ wrong place / ! will be dropped) computed from the current switch positions,
   so the player plans ahead instead of reacting. Hazards are scripted, announced in advance and
   never cut a destination off.
   ====================================================================== */
var PP_SHAPE = { A: "circle", B: "square", C: "triangle" };
var PP_MISSIONS = [
    { id: "connect", title: "Establish the connection",
        brief: "One router, two destinations. Each packet wears a badge: ✓ if the current route delivers it, ✕ if it doesn't. Switch the router before the packet arrives.",
        nodes: { S: [70, 225], R1: [330, 225], A: [720, 110], B: [720, 340] },
        edges: { S: ["R1"], R1: ["A", "B"] }, spawn: 2500, speed: 140, inflight: 1, goal: 5,
        opt: { kind: "clean", text: "Deliver all five without an error" } },
    { id: "parallel", title: "Manage parallel traffic",
        brief: "Two sources feed one core router. With several packets in flight, set the route for whichever arrives first, then the next.",
        nodes: { S: [60, 110], S2: [60, 340], R1: [250, 225], R2: [480, 110], R3: [480, 340], A: [730, 60], B: [730, 225], C: [730, 390] },
        sources: ["S", "S2"], edges: { S: ["R1"], S2: ["R1"], R1: ["R2", "R3"], R2: ["A", "B"], R3: ["B", "C"] },
        spawn: 1700, speed: 145, inflight: 3, goal: 8,
        opt: { kind: "combo", combo: 5, text: "Reach a ×5 delivery streak" } },
    { id: "congestion", title: "Survive a congestion event",
        brief: "The short links carry one packet at a time (marked 1/1). A full link makes packets queue at its router, and a queue that waits too long drops. When the burst hits, spread traffic over the long way round.",
        nodes: { S: [50, 225], R1: [190, 225], R2: [400, 110], R3: [400, 340], R4: [580, 225], A: [750, 90], B: [750, 360] },
        edges: { S: ["R1"], R1: ["R2", "R3"], R2: ["A", "R4"], R3: ["B", "R4"], R4: ["A", "B"] },
        cap: { "R2>A": 1, "R3>B": 1 }, spawn: 1700, burst: [9000, 22000, 720], speed: 150, inflight: 6, goal: 12,
        opt: { kind: "nocongestion", text: "Lose nothing to congestion" } },
    { id: "failover", title: "Reroute around a failing node",
        brief: "Router 2 is degrading. When it starts flashing it has two and a half seconds left: send everything through routers 3 and 4 before it goes dark.",
        nodes: { S: [50, 225], R1: [190, 225], R2: [400, 100], R3: [400, 340], R4: [590, 230], A: [750, 80], B: [750, 225], C: [750, 380] },
        edges: { S: ["R1"], R1: ["R2", "R3"], R2: ["A", "B"], R3: ["R4", "C"], R4: ["A", "B"] },
        spawn: 1750, speed: 150, inflight: 3, goal: 9,
        hazards: [{ kind: "router", id: "R2", at: 10000, warn: 2500, dur: Infinity, text: "Router 2 is failing" }],
        opt: { kind: "nofault", text: "Lose nothing at the failing router" } },
    { id: "emergency", title: "Network emergency",
        brief: "Critical packets (◆, double outline) count double, for good and bad. Links will flicker and a router will drop out for a while. Every hazard is announced, and every destination always has a route.",
        nodes: { S: [50, 110], S2: [50, 340], R1: [210, 110], R2: [210, 340], R3: [440, 110], R4: [440, 340], A: [750, 60], B: [750, 225], C: [750, 390] },
        sources: ["S", "S2"], edges: { S: ["R1"], S2: ["R2"], R1: ["R3", "R4"], R2: ["R3", "R4"], R3: ["A", "B", "C"], R4: ["A", "B", "C"] },
        crit: 0.35, spawn: 1450, speed: 155, inflight: 4, goal: 12,
        hazards: [
            { kind: "link", id: "R3>B", at: 9000, warn: 2200, dur: 6000, text: "Link 3→B is unstable" },
            { kind: "router", id: "R3", at: 20000, warn: 2500, dur: 7000, text: "Router 3 is rebooting" },
            { kind: "link", id: "R1>R4", at: 31000, warn: 2200, dur: 6000, text: "Link 1→4 is unstable" }],
        opt: { kind: "allcrit", text: "Deliver every critical packet" } }
];
// The Systems Blackout opens with this one
var PP_BLACKOUT = { id: "restore", title: "Restore the network",
    brief: "Router 2 is already dark. Critical traffic is waiting. Route around it and get six packets home.",
    nodes: PP_MISSIONS[3].nodes, edges: PP_MISSIONS[3].edges, crit: 0.4, spawn: 1600, speed: 150, inflight: 3, goal: 6,
    hazards: [{ kind: "router", id: "R2", at: 0, warn: 0, dur: Infinity, text: "Router 2 is down" }],
    opt: { kind: "allcrit", text: "Deliver every critical packet" } };

function packetPilot(ctx) {
    var M = ctx.missionDef, rand = ctx.rand, portrait = ctx.small;
    var W = portrait ? 450 : 800, H = portrait ? 800 : 450;
    var xy = function (p) { return portrait ? [p[1], p[0]] : [p[0], p[1]]; };
    var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, class: "pp", role: "group", "aria-label": "Network: " + M.title }, ctx.field);
    var gEdge = svgEl("g", {}, svg), gLoad = svgEl("g", {}, svg), gArrow = svgEl("g", {}, svg);
    var prev = svgEl("path", { class: "pp-preview" }, svg);
    var gNode = svgEl("g", {}, svg), gPk = svgEl("g", {}, svg), gFx = svgEl("g", {}, svg);
    var pos = {}, sw = {}, nodeEl = {}, edgeEl = {}, loadEl = {}, arrowEl = {}, status = {};
    var sources = M.sources || ["S"], routers = [], dests = [];
    var packets = [], losses = [], hazards = (M.hazards || []).map(function (h) { return { h: h, phase: 0 }; });
    var score = 0, errors = 0, delivered = 0, combo = 0, bestCombo = 0, critDone = 0, critLost = 0;
    var lostTo = { wrong: 0, fault: 0, link: 0, congestion: 0 }, nextSpawn = 600, spawnN = 0, finished = false, MAX_ERR = 5;

    Object.keys(M.nodes).forEach(function (k) { pos[k] = xy(M.nodes[k]); if (PP_SHAPE[k]) dests.push(k); });
    routers = Object.keys(M.edges).filter(function (k) { return sources.indexOf(k) < 0; });
    var cap = function (id) { return (M.cap && M.cap[id]) || 3; };
    var name = function (k) { return PP_SHAPE[k] ? k : sources.indexOf(k) > -1 ? "IN" : String(routers.indexOf(k) + 1); };

    // Links
    Object.keys(M.edges).forEach(function (a) {
        sw[a] = 0;
        M.edges[a].forEach(function (b) {
            var id = a + ">" + b;
            edgeEl[id] = svgEl("path", { class: "pp-edge", d: "M" + pos[a][0] + " " + pos[a][1] + "L" + pos[b][0] + " " + pos[b][1] }, gEdge);
            if (M.cap && M.cap[id]) {
                var mx = (pos[a][0] + pos[b][0]) / 2, my = (pos[a][1] + pos[b][1]) / 2;
                loadEl[id] = svgEl("text", { class: "pp-load", x: mx, y: my - 10 }, gLoad);
            }
        });
        if (sources.indexOf(a) < 0) arrowEl[a] = svgEl("polygon", { class: "pp-arrow", points: "-7,-6 7,0 -7,6" }, gArrow);
    });
    // Nodes: routers are real buttons (focusable, Enter/Space, number keys)
    function shape(g, kind, r, cls) {
        if (kind === "circle") return svgEl("circle", { class: cls, r: r }, g);
        if (kind === "square") return svgEl("rect", { class: cls, x: -r * 0.86, y: -r * 0.86, width: r * 1.72, height: r * 1.72, rx: 4 }, g);
        if (kind === "triangle") return svgEl("polygon", { class: cls, points: "0," + (-r) + " " + (r * 0.95) + "," + (r * 0.75) + " " + (-r * 0.95) + "," + (r * 0.75) }, g);
        return svgEl("polygon", { class: cls, points: "0," + (-r) + " " + r + ",0 0," + r + " " + (-r) + ",0" }, g);
    }
    Object.keys(M.nodes).forEach(function (k) {
        var kind = sources.indexOf(k) > -1 ? "src" : PP_SHAPE[k] ? "dst" : "rtr";
        var g = svgEl("g", { class: "pp-node pp-node--" + kind, transform: "translate(" + pos[k][0] + " " + pos[k][1] + ")" }, gNode);
        if (kind === "rtr") {
            g.setAttribute("tabindex", "0");
            g.setAttribute("role", "button");
            g.setAttribute("data-router", k);
            svgEl("circle", { class: "pp-hit", r: 44 }, g);
            svgEl("polygon", { class: "pp-body", points: "0,-27 23,-13 23,13 0,27 -23,13 -23,-13" }, g);
        } else if (kind === "dst") shape(g, PP_SHAPE[k], 27, "pp-body");
        else svgEl("rect", { class: "pp-body", x: -27, y: -21, width: 54, height: 42, rx: 6 }, g);
        svgEl("text", { class: "pp-label", y: 5 }, g).textContent = name(k);
        nodeEl[k] = g;
    });

    function target(a) { return M.edges[a][sw[a]]; }
    function load(id) { return packets.filter(function (p) { return !p.dead && !p.wait && p.from + ">" + p.to === id; }).length; }
    function down(id) { return status[id] === "down"; }
    // Where would this packet end up if nothing changes? (✓ / ✕ / ! for a drop)
    function predict(p) {
        var n = p.wait ? p.at : p.to, path = [n];
        for (var i = 0; i < 8; i++) {
            if (PP_SHAPE[n]) return { v: n === p.dest ? "ok" : "bad", path: path };
            if (down(n)) return { v: "drop", path: path };
            var nx = target(n);
            if (down(n + ">" + nx)) return { v: "drop", path: path };
            n = nx;
            path.push(n);
        }
        return { v: "bad", path: path };
    }
    function paint() {
        Object.keys(edgeEl).forEach(function (id) {
            var ab = id.split(">"), e = edgeEl[id];
            e.classList.toggle("is-on", target(ab[0]) === ab[1]);
            e.classList.toggle("is-warn", status[id] === "warn");
            e.classList.toggle("is-down", status[id] === "down");
            if (loadEl[id]) {
                var l = load(id);
                loadEl[id].textContent = l + "/" + cap(id);
                loadEl[id].classList.toggle("is-full", l >= cap(id));
            }
        });
        Object.keys(arrowEl).forEach(function (a) {
            var b = target(a), p = pos[a], q = pos[b], ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
            arrowEl[a].setAttribute("transform", "translate(" + (p[0] + Math.cos(ang) * 42).toFixed(1) + " " + (p[1] + Math.sin(ang) * 42).toFixed(1) + ") rotate(" + (ang * 180 / Math.PI).toFixed(1) + ")");
        });
        routers.forEach(function (r) {
            var g = nodeEl[r], t = target(r), id = r + ">" + t;
            g.classList.toggle("is-warn", status[r] === "warn");
            g.classList.toggle("is-down", status[r] === "down");
            g.setAttribute("aria-label", "Router " + name(r) + (status[r] === "down" ? " (offline)" : status[r] === "warn" ? " (failing)" : "") +
                ": sending to " + (PP_SHAPE[t] ? "destination " + t : "router " + name(t)) + (loadEl[id] ? ", link " + load(id) + " of " + cap(id) + " busy" : "") + ". Press to switch.");
        });
    }
    function toggle(r) {
        if (!M.edges[r] || finished) return;
        sw[r] = (sw[r] + 1) % M.edges[r].length;
        sfx("route");
        var g = nodeEl[r];
        g.classList.remove("is-flip");
        void g.getBBox();
        g.classList.add("is-flip");
        paint();
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

    function float(text, at, tone) {
        var f = svgEl("text", { class: "pp-float is-" + tone, x: at[0], y: at[1] - 36 }, gFx);
        f.textContent = text;
        ctx.after(900, function () { f.remove(); });
    }
    function spawn() {
        var src = sources[spawnN++ % sources.length], d = dests[Math.floor(rand() * dests.length)], crit = rand() < (M.crit || 0);
        var g = svgEl("g", { class: "pp-packet" + (crit ? " is-crit" : "") }, gPk);
        if (crit) shape(g, PP_SHAPE[d], 18, "pp-ring");
        shape(g, PP_SHAPE[d], 13, "pp-pk");
        svgEl("text", { class: "pp-pk-label", y: 4 }, g).textContent = d;
        var badge = svgEl("text", { class: "pp-badge", y: -21 }, g);
        packets.push({ dest: d, crit: crit, from: src, to: M.edges[src][0], t: 0, g: g, badge: badge, wait: 0 });
    }
    var CAUSE = {
        wrong: function (l) { return "A " + l.dest + " packet reached " + l.where + ". Switch earlier: the badge turns ✓ once its route is right."; },
        fault: function (l) { return "Packets reached router " + l.where + " while it was down. When a router flashes, route around it."; },
        link: function (l) { return "A packet was sent onto link " + l.where + " while it was down. A flickering link is about to fail: switch away during the warning."; },
        congestion: function (l) { return "Packets queued too long at router " + l.where + ". Send some traffic the long way round to spread the load."; }
    };
    function lose(p, cause, where) {
        var hit = p.crit ? 2 : 1;
        errors += hit; combo = 0;
        lostTo[cause]++;
        if (p.crit) critLost++;
        score = Math.max(0, score - (p.crit ? 200 : 50));
        var l = { cause: cause, where: where, dest: p.dest };
        losses.push(l);
        var at = pos[(where || "").split(">")[0]] || pos[p.to];
        float(cause === "wrong" ? "✕ misrouted" : cause === "congestion" ? "✕ queue timeout" : "✕ dropped", at, "bad");
        ctx.say("✕ " + CAUSE[cause](l), "bad");
        sfx("drop");
        ctx.react("alert");
        ctx.shake();
        p.dead = true;
        p.g.remove();
        if (errors >= MAX_ERR && !finished) {
            finished = true;
            var worst = Object.keys(lostTo).sort(function (a, b) { return lostTo[b] - lostTo[a]; })[0];
            ctx.end({ score: score, won: false, message: "The network went down: " + errors + " errors.",
                report: ["What cost the most: " + CAUSE[worst](losses.filter(function (x) { return x.cause === worst; }).pop())].concat(
                    losses.slice(-3).map(function (x) { return "✕ " + x.cause + " at " + x.where + " (" + x.dest + " packet)"; })) });
        }
    }
    function arrive(p, now) {
        var n = p.to;
        if (PP_SHAPE[n]) {
            if (n !== p.dest) return lose(p, "wrong", n);
            combo++;
            bestCombo = Math.max(bestCombo, combo);
            var mult = 1 + Math.min(4, Math.floor(combo / 3)) * 0.5, pts = Math.round((p.crit ? 300 : 100) * mult);
            score += pts; delivered++;
            if (p.crit) critDone++;
            float("+" + pts + (mult > 1 ? " ×" + mult : ""), pos[n], "good");
            nodeEl[n].classList.remove("is-got");
            void nodeEl[n].getBBox();
            nodeEl[n].classList.add("is-got");
            sfx("deliver");
            p.dead = true;
            p.g.remove();
            if (delivered >= M.goal) complete();
            return;
        }
        if (down(n)) return lose(p, "fault", name(n));
        depart(p, n, now);
    }
    function depart(p, n, now) {
        var nx = target(n), id = n + ">" + nx;
        if (down(id)) return lose(p, "link", name(n) + "→" + name(nx));
        if (load(id) >= cap(id)) { if (!p.wait) { p.wait = now; p.at = n; } return; }
        p.wait = 0; p.from = n; p.to = nx; p.t = 0;
    }
    function optOk() {
        var o = M.opt || {};
        if (o.kind === "clean") return errors === 0;
        if (o.kind === "combo") return bestCombo >= o.combo;
        if (o.kind === "nocongestion") return lostTo.congestion === 0;
        if (o.kind === "nofault") return lostTo.fault === 0;
        if (o.kind === "allcrit") return critLost === 0 && critDone > 0;
        return false;
    }
    function complete() {
        if (finished) return;
        finished = true;
        var ok = optOk();
        svg.classList.add("is-stable");
        ctx.say("✓ Network stable. " + delivered + " delivered" + (ok ? ", optional objective complete." : "."), "good");
        sfx("success");
        ctx.react("happy");
        ctx.after(1100, function () {
            ctx.end({ score: score + 300 + (ok ? 200 : 0), won: true,
                message: M.title + ": complete." + (ok ? " Optional objective: " + M.opt.text.toLowerCase() + " ✓" : ""),
                report: ["Delivered " + delivered + ", errors " + errors + ", best streak ×" + bestCombo + (critDone || critLost ? ", critical " + critDone + "/" + (critDone + critLost) : "") + "."],
                clean: errors === 0, objective: ok, recovered: M.id === "failover" || M.id === "emergency" || M.id === "restore" });
        });
    }
    function hud() {
        var o = { Mission: (ctx.mission + 1) + " · " + M.title, Delivered: delivered + " / " + M.goal, Errors: errors + " / " + MAX_ERR, Streak: "×" + combo };
        if (M.cap) o.Queued = packets.filter(function (p) { return !p.dead && p.wait; }).length;
        if (M.crit) o.Critical = critDone + " ✓ " + critLost + " ✕";
        if (M.opt) {
            // objectives that can still be lost read "on track" until the mission is done
            var k = M.opt.kind, open = k === "clean" || k === "nocongestion" || k === "nofault" || k === "allcrit";
            o.Objective = (open ? (optOk() || (k === "allcrit" && !critLost) ? "on track · " : "missed · ") : optOk() ? "✓ " : "○ ") + M.opt.text;
        }
        ctx.hud(o);
    }

    paint();
    hud();
    return {
        tick: function (dt, now) {
            if (finished) return;
            // Hazards: announce, then bite, then (sometimes) recover
            hazards.forEach(function (z) {
                var h = z.h;
                if (z.phase === 0 && now >= h.at - h.warn) {
                    z.phase = 1;
                    if (h.warn) { status[h.id] = "warn"; ctx.say("! " + h.text + ": " + (h.kind === "router" ? "route around router " + name(h.id) : "switch away from it") + ".", "warn"); sfx("alert"); ctx.react("alert"); }
                }
                if (z.phase === 1 && now >= h.at) { z.phase = 2; status[h.id] = "down"; ctx.flash("bad"); if (!h.warn) ctx.say("! " + h.text + ".", "warn"); }
                if (z.phase === 2 && now >= h.at + h.dur) { z.phase = 3; status[h.id] = "ok"; ctx.say("✓ " + h.text.replace(/ is (failing|rebooting|unstable)/, "") + " is back.", "good"); }
            });
            var rate = M.burst && now >= M.burst[0] && now < M.burst[1] ? M.burst[2] : M.spawn;
            if (M.burst && now >= M.burst[0] && now - dt < M.burst[0]) { ctx.say("! Traffic burst: watch the 1/1 links.", "warn"); sfx("alert"); }
            if (now >= nextSpawn) {
                if (packets.filter(function (p) { return !p.dead; }).length < M.inflight) spawn();
                nextSpawn = now + rate;
            }
            packets.forEach(function (p) {
                if (p.dead) return;
                if (p.wait) {
                    if (down(p.at)) return lose(p, "fault", name(p.at));
                    if (now - p.wait > 2400) return lose(p, "congestion", name(p.at));
                    depart(p, p.at, now);
                    if (p.wait) return;
                }
                var a = pos[p.from], b = pos[p.to], len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
                p.t += M.speed * dt / 1000 / len;
                if (p.t >= 1) { p.t = 1; arrive(p, now); }
            });
            packets = packets.filter(function (p) { return !p.dead; });
            // Draw packets, their badges, and the route the next-arriving packet will take
            var focus = null, best = 1e9, qi = {};
            packets.forEach(function (p) {
                var x, y;
                if (p.wait) { qi[p.at] = (qi[p.at] || 0) + 1; x = pos[p.at][0] - 30 + qi[p.at] * 8; y = pos[p.at][1] - 30 - qi[p.at] * 8; p.g.classList.add("is-waiting"); }
                else {
                    var a = pos[p.from], b = pos[p.to];
                    x = a[0] + (b[0] - a[0]) * p.t; y = a[1] + (b[1] - a[1]) * p.t;
                    p.g.classList.remove("is-waiting");
                    var rem = Math.hypot(b[0] - x, b[1] - y);
                    if (!PP_SHAPE[p.to] && rem < best) { best = rem; focus = p; }
                }
                p.g.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ")");
                p.x = x; p.y = y;
                var v = predict(p).v;
                if (p.v !== v) { p.v = v; p.badge.textContent = v === "ok" ? "✓" : v === "bad" ? "✕" : "!"; p.badge.setAttribute("class", "pp-badge is-" + v); }
            });
            if (focus) {
                var pr = predict(focus);
                prev.setAttribute("d", "M" + focus.x.toFixed(1) + " " + focus.y.toFixed(1) + pr.path.map(function (n) { return "L" + pos[n][0] + " " + pos[n][1]; }).join(""));
                prev.setAttribute("class", "pp-preview is-" + pr.v);
            } else prev.setAttribute("d", "");
            paint();
            hud();
        }
    };
}
