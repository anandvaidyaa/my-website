/* ======================================================================
   DEPLOY RUSH — a release incident simulator (fictional practice)
   The player runs a release through stages with real prerequisites, in any order those allow,
   inside a release window. Each scenario has its own trap. Incidents respect the state of the
   deployment (rolling back production only means something once production has changed), every
   rejected action says why, earlier choices change later ones, and the run ends with a
   post-incident review of each decision.
   ====================================================================== */
var DR_ACTIONS = {
    validate: { label: "Validate change", mins: 4, needs: [], what: "Review the diff and check it builds a coherent change." },
    test: { label: "Run tests", mins: 8, needs: ["validate"], what: "Unit and integration tests against the change." },
    build: { label: "Build artifact", mins: 6, needs: ["validate"], what: "Package once. Every later stage ships this exact artifact." },
    scan: { label: "Security scan", mins: 5, needs: ["build"], what: "Check the artifact and its dependencies for known vulnerabilities." },
    migrate: { label: "Database migration", mins: 6, needs: ["build"], what: "Change the schema. Code that's running must work before and after." },
    staging: { label: "Deploy to staging", mins: 5, needs: ["build", "test", "scan"], what: "Install the artifact in a production-like environment." },
    smoke: { label: "Smoke tests", mins: 4, needs: ["staging"], what: "A few end-to-end checks of the critical paths." },
    canary: { label: "Canary 10%", mins: 8, needs: ["smoke"], what: "Send a tenth of real traffic to the new version and watch its metrics." },
    promote: { label: "Promote to 100%", mins: 6, needs: ["canary"], what: "Move all traffic to the new version." },
    verify: { label: "Verify health", mins: 5, needs: ["promote"], what: "Confirm error rate and latency are healthy after the full release." },
    contract: { label: "Drop the old column", mins: 4, needs: ["verify"], what: "Optional: remove the column nothing reads any more (the 'contract' step)." }
};
var DR_PIPE = ["validate", "test", "build", "scan", "staging", "smoke", "canary", "promote", "verify"];
var DR_SCENARIOS = [
    { id: "cart", title: "Cart: a rounding fix", brief: "A one-line change to how prices round. Small change, busy service.", actions: DR_PIPE, window: 75 },
    { id: "orders", title: "Orders: rename a column", brief: "v42 reads shipping_address instead of ship_to. The running version, v41, still reads ship_to.",
        actions: ["validate", "test", "build", "scan", "migrate", "staging", "smoke", "canary", "promote", "verify", "contract"], needs: { staging: ["migrate"] }, window: 85 },
    { id: "search", title: "Search: a heavier ranking model", brief: "Better results from a bigger model. The question is how fast it answers.", actions: DR_PIPE, window: 80 },
    { id: "payments", title: "Payments: retries behind a flag", brief: "New retry logic ships switched off behind the PAYMENTS_RETRY_V2 flag, and is switched on after the rollout.", actions: DR_PIPE, window: 80 }
];
var DR_BLACKOUT = { id: "blackout", title: "Recover checkout", brief: "Checkout v42 went to 100% an hour ago behind the CHECKOUT_V2 flag. Errors just jumped to 9%.",
    actions: ["verify"], needs: { verify: [] }, window: 40, live: true };

function deployRush(ctx) {
    var SC = ctx.missionDef;
    var root = el("div", "dr", ctx.field);
    var head = el("div", "dr-head", root);
    el("p", "dr-tag", head, "Fictional practice · nothing here touches real systems");
    el("h4", "dr-title", head, SC.title);
    el("p", "dr-brief", head, SC.brief);
    var main = el("div", "dr-main", root);
    var map = el("ol", "dr-map", main);
    map.setAttribute("aria-label", "Release stages");
    var side = el("div", "dr-side", main);
    var statusDl = el("dl", "dr-status", side);
    var info = el("p", "dr-info", side, "Choose a stage to run. Stages unlock when what they need is done.");
    var logEl = el("ol", "dr-log", side);
    logEl.setAttribute("aria-label", "Event log");
    logEl.setAttribute("aria-live", "polite");
    var inc = el("div", "dr-incident", root);
    inc.hidden = true;
    inc.setAttribute("role", "group");
    var closeBtn = button("btn btn--primary dr-close", root, "Close the release ✓");
    closeBtn.hidden = true;

    var st = { done: {}, newOn: SC.live ? 100 : 0, prodChanged: !!SC.live, err: SC.live ? 9 : 0.4, p95: 180, minutes: 0, impact: 0, flags: {}, decisions: [], running: null, outcome: null };
    var needs = function (a) { return (SC.needs && SC.needs[a]) || DR_ACTIONS[a].needs; };
    var nodes = {}, finished = false, incident = null;

    function log(text, tone) {
        var li = el("li", "is-" + (tone || "info"), null, "T+" + st.minutes + "m  " + text);
        logEl.insertBefore(li, logEl.firstChild);
        while (logEl.children.length > 8) logEl.lastChild.remove();
    }
    function advance(mins) {
        // customer impact accrues while users on the new version see elevated errors
        // (a schema change that breaks the running version hurts everyone, not just the canary)
        st.impact += mins * Math.max(0, st.err - 0.5) * (st.flags.allAffected ? 1 : st.newOn / 100);
        st.minutes += mins;
        if (st.minutes > SC.window && !finished) end("timeout");
    }
    function bar(v, max, mark) { return '<span class="dr-bar"><i style="width:' + clamp(v / max * 100, 0, 100).toFixed(0) + '%"></i>' + (mark ? '<b style="left:' + (mark / max * 100) + '%"></b>' : "") + "</span>"; }
    function health() { return clamp(100 - st.decisions.filter(function (d) { return d.v === "unsafe"; }).length * 25 - st.impact * 2, 0, 100); }
    function paint() {
        SC.actions.forEach(function (a) {
            var n = nodes[a], miss = needs(a).filter(function (x) { return !st.done[x]; });
            var state = st.done[a] ? "done" : st.running === a ? "running" : miss.length ? "locked" : "ready";
            n.className = "dr-node is-" + state + (DR_ACTIONS[a].optional ? " is-optional" : "");
            $(".dr-node__state", n).textContent = state === "done" ? "✓ done" : state === "running" ? "… running" : state === "locked" ? "locked" : "▶ ready";
            n.setAttribute("aria-label", DR_ACTIONS[a].label + ", " + DR_ACTIONS[a].mins + " minutes, " + (state === "locked" ? "needs " + miss.map(function (x) { return DR_ACTIONS[x].label; }).join(" and ") : state));
        });
        var h = health();
        statusDl.innerHTML =
            "<div><dt>Production</dt><dd>" + (st.newOn ? "v42 on " + st.newOn + "% · v41 on " + (100 - st.newOn) + "%" : "v41 (unchanged)") + "</dd></div>" +
            "<div><dt>Error rate</dt><dd>" + st.err.toFixed(1) + "% " + (st.err > 1 ? "⚠ above 1%" : "✓") + bar(st.err, 10, 1) + "</dd></div>" +
            "<div><dt>p95 latency</dt><dd>" + Math.round(st.p95) + " ms " + (st.p95 > 300 ? "⚠ over 300 ms" : "✓") + bar(st.p95, 500, 300) + "</dd></div>" +
            "<div><dt>Release health</dt><dd>" + Math.round(h) + "% " + bar(h, 100) + "</dd></div>" +
            "<div><dt>Release window</dt><dd>" + st.minutes + " of " + SC.window + " min" + bar(st.minutes, SC.window) + "</dd></div>";
        closeBtn.hidden = !(st.done.verify && !incident && !finished);
        ctx.hud({ Scenario: (ctx.mission + 1) + " · " + SC.title, Time: st.minutes + " / " + SC.window + " min", Health: Math.round(h) + "%", Errors: st.err.toFixed(1) + "%" });
    }
    // The map: each stage is a real button; locked ones explain what they're waiting for
    SC.actions.forEach(function (a) {
        var li = el("li", "", map);
        var b = button("dr-node", li);
        b.setAttribute("data-act", a);
        el("span", "dr-node__label", b, DR_ACTIONS[a].label);
        el("span", "dr-node__mins", b, DR_ACTIONS[a].mins + " min");
        el("span", "dr-node__state", b, "");
        nodes[a] = b;
    });
    ctx.on(map, "click", function (e) { var b = e.target.closest("[data-act]"); if (b) act(b.getAttribute("data-act")); });
    ctx.on(map, "focusin", function (e) { var b = e.target.closest("[data-act]"); if (b) info.textContent = DR_ACTIONS[b.getAttribute("data-act")].label + ": " + DR_ACTIONS[b.getAttribute("data-act")].what; });
    ctx.on(map, "mouseover", function (e) { var b = e.target.closest && e.target.closest("[data-act]"); if (b) info.textContent = DR_ACTIONS[b.getAttribute("data-act")].label + ": " + DR_ACTIONS[b.getAttribute("data-act")].what; });
    ctx.on(closeBtn, "click", function () { if (!finished) end(st.flags.mitigated ? "mitigated" : st.flags.rolledBack ? "rolled-back" : "shipped"); });

    function reject(text) {
        info.textContent = "✕ " + text;
        log("rejected: " + text, "bad");
        ctx.say("✕ " + text, "bad");
        sfx("tick");
        var n = info;
        n.classList.remove("is-shake");
        void n.offsetWidth;
        n.classList.add("is-shake");
    }
    function act(a) {
        if (finished) return;
        if (incident) return reject("Resolve the open incident first.");
        if (st.running) return reject("Wait for " + DR_ACTIONS[st.running].label.toLowerCase() + " to finish.");
        if (st.done[a]) return reject(DR_ACTIONS[a].label + " is already done.");
        var miss = needs(a).filter(function (x) { return !st.done[x]; });
        if (miss.length) return reject(DR_ACTIONS[a].label + " needs " + miss.map(function (x) { return DR_ACTIONS[x].label.toLowerCase(); }).join(" and ") + " first.");
        if (a === "migrate" && SC.id === "orders" && !st.flags.strategy) return chooseMigration();
        st.running = a;
        info.textContent = DR_ACTIONS[a].label + ": " + DR_ACTIONS[a].what;
        sfx("tick");
        paint();
        ctx.after(ctx.reduced ? 250 : 650, function () {
            st.running = null;
            st.done[a] = true;
            advance(DR_ACTIONS[a].mins);
            if (finished) return;
            if (a === "canary") { st.newOn = 10; st.prodChanged = true; }
            if (a === "promote") { st.newOn = 100; st.prodChanged = true; }
            log("✓ " + DR_ACTIONS[a].label + " (" + DR_ACTIONS[a].mins + " min)", "good");
            hook(a);
            paint();
        });
    }

    /* ---------------- Incidents ---------------- */
    function rollbackOpt(why, after) {
        return { label: "Roll back production", check: function () { return st.prodChanged ? null : "Production hasn't changed yet, so there's nothing to roll back."; },
            v: "safe", why: why, apply: function () { st.newOn = 0; st.err = 0.4; st.p95 = 180; advance(6); (after || function () { end("rolled-back"); })(); } };
    }
    function open(spec) {
        incident = spec;
        sfx("alert");
        ctx.react("alert");
        ctx.flash("bad");
        root.classList.add("is-incident");
        log("⚠ " + spec.text, "bad");
        inc.hidden = false;
        inc.textContent = "";
        el("p", "dr-incident__k", inc, spec.kind || "Incident");
        el("p", "dr-incident__q", inc, spec.text);
        var opts = el("div", "dr-incident__opts", inc);
        spec.options.forEach(function (o) {
            var b = button("btn btn--glass", opts, o.label);
            b.addEventListener("click", function () { decide(o); });
        });
        el("p", "dr-incident__note", inc, "Each option has a consequence. Fictional scenario.");
        paint();
        $("button", opts).focus({ preventScroll: true });
    }
    function decide(o) {
        if (!incident || finished) return;
        var bad = o.check && o.check();
        if (bad) {
            // Not possible in the current state: explained, costs a little time, incident stays open
            st.decisions.push({ q: incident.text, a: o.label, v: "invalid", why: bad });
            advance(3);
            return reject(bad);
        }
        st.decisions.push({ q: incident.text, a: o.label, v: o.v, why: o.why });
        log((o.v === "unsafe" ? "✕ " : o.v === "cautious" ? "~ " : "✓ ") + o.label + ": " + o.why, o.v === "unsafe" ? "bad" : "good");
        ctx.say((o.v === "unsafe" ? "✕ " : "✓ ") + o.why, o.v === "unsafe" ? "bad" : "good");
        sfx(o.v === "unsafe" ? "drop" : "success");
        var keep = o.stay;
        if (!keep) { incident = null; inc.hidden = true; root.classList.remove("is-incident"); }
        o.apply();
        if (keep && !finished) { advance(0); }
        paint();
    }
    function chooseMigration() {
        open({ kind: "Decision", text: "How should the migration change the schema? v41 is serving all traffic and reads ship_to.", options: [
            { label: "Expand: add shipping_address, keep ship_to, copy the data", v: "safe", why: "Expand/contract keeps v41 working: it can still read ship_to while v42 rolls out.",
                apply: function () { st.flags.strategy = "expand"; act("migrate"); } },
            { label: "Rename ship_to to shipping_address in place", v: "unsafe", why: "v41 still reads ship_to. Renaming it breaks the running version the moment the migration runs.",
                apply: function () { st.flags.strategy = "rename"; act("migrate"); } }
        ] });
    }
    function hook(a) {
        var id = SC.id;
        if (id === "cart" && a === "test") open({ text: "Tests: 2 failures in price rounding (0.5 rounds down).", options: [
            { label: "Fix the code and re-run the tests", v: "safe", why: "The tests caught a real bug before users did. Fixed and re-run (+10 min).", apply: function () { advance(10); log("✓ Tests pass after the fix", "good"); } },
            { label: "Mark the tests as flaky and continue", v: "unsafe", why: "Skipping a failing test ships a known bug.", apply: function () { st.flags.regression = true; } },
            rollbackOpt("") ] });
        if (id === "cart" && a === "canary" && st.flags.regression) { st.err = 6.8; open({ text: "Canary error rate 6.8% (baseline 0.4%): carts total incorrectly.", options: [
            { label: "Roll back the canary", v: "safe", why: "Only 10% of traffic saw it, and the rollback ends that within minutes.", apply: function () { st.flags.recovered = true; st.newOn = 0; st.err = 0.4; advance(4); end("rolled-back"); } },
            { label: "Promote anyway: it's only 10%", v: "unsafe", why: "Promoting a version with a 6.8% error rate takes it from 10% of users to all of them.", apply: function () { st.newOn = 100; advance(10); end("outage"); } },
            { label: "Wait 10 minutes and watch", v: "unsafe", stay: true, why: "The errors are deterministic; waiting only lets more customers hit them (+10 min).", apply: function () { advance(10); } } ] }); }
        if (id === "orders" && a === "migrate" && st.flags.strategy === "rename") { st.err = 9; st.prodChanged = true; st.flags.allAffected = true; open({ text: "v41 (all traffic) is failing: column ship_to not found. Error rate 9%.", options: [
            { label: "Re-add ship_to to restore compatibility", v: "safe", why: "Putting the old column back makes v41 work again immediately; then continue with expand/contract.", apply: function () { advance(4); st.err = 0.4; st.flags.allAffected = false; st.flags.recovered = true; st.flags.strategy = "expand"; } },
            { label: "Roll back the app", v: "invalid", check: function () { return "The app is still v41, and v41 is what's failing: the schema change broke it, not a deploy."; } },
            { label: "Push v42 to everyone right now", v: "unsafe", why: "Skipping staging and canary under pressure ships untested code to every user.", apply: function () { st.newOn = 100; st.err = 0.4; st.done.staging = st.done.smoke = st.done.canary = st.done.promote = true; st.flags.rushed = true; advance(6); } } ] }); }
        if (id === "search" && a === "canary") { st.p95 = 410; open({ text: "Canary p95 latency 410 ms (baseline 180 ms, objective 300 ms). Error rate is normal.", options: [
            { label: "Pause the rollout and investigate", v: "safe", why: "Holding at 10% limits the impact while you find out why.", apply: function () { advance(5); searchCause(); } },
            { label: "Promote to 100%: no errors", v: "unsafe", why: "Latency is a failure too: every user gets responses over the 300 ms objective.", apply: function () { st.newOn = 100; advance(6); end("outage"); } },
            { label: "Roll back the canary", v: "cautious", why: "Safe, but you'll ship nothing today without knowing the cause.", apply: function () { st.newOn = 0; st.p95 = 180; advance(4); end("rolled-back"); } } ] }); }
        if (id === "payments" && a === "build" && !st.flags.retried) open({ text: "The build agent timed out after 10 minutes. The same commit built fine an hour ago.", options: [
            { label: "Retry the build", v: "safe", why: "A transient infrastructure failure: retrying is the sensible first move (+6 min).", apply: function () { st.flags.retried = true; advance(6); log("✓ Build succeeded on retry", "good"); } },
            rollbackOpt(""),
            { label: "Deploy last night's artifact instead", v: "unsafe", why: "Last night's artifact doesn't contain this change: you'd test and ship different code.", apply: function () { end("failed"); } } ] });
        if (id === "payments" && a === "verify") { st.err = 2.9; open({ text: "Three minutes after switching PAYMENTS_RETRY_V2 on, payment errors rose to 2.9%.", options: [
            { label: "Turn the PAYMENTS_RETRY_V2 flag off", v: "safe", why: "The flag disables the new code path in seconds, with no redeploy. Mitigate first, investigate after.", apply: function () { st.err = 0.4; st.flags.recovered = true; st.flags.mitigated = true; advance(2); log("✓ Flag off: errors back to 0.4%", "good"); } },
            rollbackOpt("Rolling back works too, but it takes longer than switching off the flag.", function () { st.flags.recovered = true; end("rolled-back"); }),
            { label: "It's under 3%: leave it", v: "unsafe", why: "2.9% of payments failing is thousands of customers an hour.", apply: function () { advance(15); end("outage"); } } ] }); }
    }
    function searchCause() {
        open({ kind: "Finding", text: "The new instances started with an empty cache. p95 is falling about 20 ms a minute as it warms.", options: [
            { label: "Warm the cache, then resume the rollout", v: "safe", why: "Pre-warming fixes the cause; latency is back under the objective.", apply: function () { st.p95 = 190; st.flags.recovered = true; advance(6); log("✓ Cache warm: p95 190 ms", "good"); } },
            { label: "Roll back the canary anyway", v: "cautious", why: "Safe, but the cause is now known and fixable.", apply: function () { st.newOn = 0; st.p95 = 180; advance(4); end("rolled-back"); } },
            { label: "Promote to 100% while it warms", v: "unsafe", why: "Ninety per cent more traffic on cold caches makes latency worse before it gets better.", apply: function () { st.newOn = 100; st.p95 = 520; advance(6); end("outage"); } } ] });
    }
    if (SC.live) ctx.after(400, function () { open({ text: "Checkout errors at 9% since v42 went to 100%. The new path is behind the CHECKOUT_V2 flag.", options: [
        { label: "Turn the CHECKOUT_V2 flag off", v: "safe", why: "Switching the flag off removes the failing path in seconds. Verify, then investigate.", apply: function () { st.err = 0.4; st.flags.mitigated = true; st.flags.recovered = true; advance(2); } },
        rollbackOpt("A rollback is safe here, but slower than the flag.", function () { st.flags.recovered = true; st.flags.rolledBack = true; log("✓ Rolled back to v41. Verify, then close.", "good"); }),
        { label: "Restart the pods", v: "invalid", check: function () { return "Restarting runs the same failing code: the errors come back."; } },
        { label: "Ship a hotfix straight to production", v: "unsafe", why: "An untested hotfix during an incident risks a second outage.", apply: function () { advance(15); end("outage"); } } ] }); });

    function end(outcome) {
        if (finished) return;
        finished = true;
        inc.hidden = true;
        var base = { shipped: 700, mitigated: 650, "rolled-back": 450, timeout: 150, failed: 50, outage: 0 }[outcome];
        var safe = st.decisions.filter(function (d) { return d.v === "safe"; }).length, unsafe = st.decisions.filter(function (d) { return d.v === "unsafe"; }).length;
        var invalid = st.decisions.filter(function (d) { return d.v === "invalid"; }).length, cautious = st.decisions.filter(function (d) { return d.v === "cautious"; }).length;
        var score = Math.max(0, base + safe * 120 + cautious * 40 - unsafe * 150 - invalid * 60 + Math.max(0, SC.window - st.minutes) * 4 - Math.round(st.impact * 8) + (st.done.contract ? 150 : 0));
        var won = outcome === "shipped" || outcome === "mitigated" || outcome === "rolled-back";
        var label = { shipped: "Shipped safely", mitigated: "Mitigated in production", "rolled-back": "Rolled back safely", timeout: "Release window closed", failed: "Release failed", outage: "Outage" }[outcome];
        var report = ["Outcome: " + label + ". Time used " + st.minutes + " of " + SC.window + " min. Customer impact " + st.impact.toFixed(1) + " error-minutes."];
        st.decisions.forEach(function (d) { report.push((d.v === "safe" ? "✓ " : d.v === "cautious" ? "~ " : "✕ ") + d.a + ": " + d.why); });
        if (st.flags.rushed) report.push("✕ Staging and canary were skipped to ship v42.");
        if (st.done.contract) report.push("✓ Contract step done: the old column is gone.");
        sfx(won ? "success" : "fail");
        ctx.end({ score: score, won: won, message: label + ".", report: report, outcome: outcome,
            clean: won && unsafe === 0 && invalid === 0, objective: !!st.done.contract || (won && unsafe === 0 && SC.id !== "orders" && SC.id !== "blackout"), recovered: !!st.flags.recovered && won });
    }
    paint();
    return {};
}
