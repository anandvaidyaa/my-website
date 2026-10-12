/* ======================================================================
   CLOUD STACK — build a tower above the skyline
   Arcade rules you can see: a live overlap preview shows exactly what will survive the drop,
   the overhang is cut off, a perfect drop keeps the width. Wind and special platforms arrive
   as the tower rises, each announced with its rule before it's dropped. Integrity points absorb
   a few mistakes; a full miss brings the tower down.
   ====================================================================== */
var CS_NAMES = ["Front Door", "API Management", "App Service", "Functions", "Logic Apps", "Service Bus", "Cosmos DB", "Key Vault", "Storage", "Event Grid", "Monitor", "VNet"];
var CS_RULES = {
    plain: { tag: "", rule: "" },
    narrow: { tag: "NARROW", rule: "Arrives at 70% width" },
    reinforced: { tag: "REINFORCED", rule: "Perfect window doubled (12 px)" },
    glass: { tag: "GLASS", rule: "Land within 8 px or it cracks: −1 integrity" },
    keystone: { tag: "KEYSTONE", rule: "A perfect drop restores 1 integrity" }
};
var CS_MODES = [
    { id: "target", title: "Reach 15 layers", goal: 15, integrity: 3, windFrom: 10, specials: { from: 5, kinds: ["narrow", "reinforced"] },
        brief: "Fifteen layers. From layer 5 some platforms have special rules, and from layer 10 the wind picks up." },
    { id: "precision", title: "Precision run", goal: 12, integrity: 3, imperfect: 3, windFrom: 99, specials: null,
        brief: "Twelve layers with at most three imperfect drops. The fourth imperfect drop ends the run." },
    { id: "skyline", title: "Skyline: build to 30", goal: 30, integrity: 3, windFrom: 8, specials: { from: 4, kinds: ["narrow", "reinforced", "glass"], keystone: 10 },
        brief: "The full climb. Glass platforms crack if you're careless, keystones every ten layers repair the structure, and the wind keeps rising." }
];
var CS_BLACKOUT = { id: "rebuild", title: "Rebuild the tower", goal: 8, integrity: 2, windFrom: 4, specials: { from: 2, kinds: ["glass", "reinforced"] },
    brief: "Eight layers to bring the facility back online. Two integrity points. Glass platforms on the way." };
var CS_SKIES = { dusk: "Dusk", lights: "City lights (layer 10)", aurora: "Aurora (layer 20)", crown: "Night crown (layer 30)" };

function cloudStack(ctx) {
    var MD = ctx.missionDef, rand = ctx.rand;
    var view = el("div", "cs-view cs-sky--" + (ctx.opts.sky || "dusk"), ctx.field);
    var sky = el("div", "cs-skyline", view);
    sky.setAttribute("aria-hidden", "true");
    // a seeded skyline: towers of different heights with lit windows
    var city = svgEl("svg", { viewBox: "0 0 400 120", preserveAspectRatio: "none" }, sky);
    for (var bx = 0; bx < 400;) {
        var bw = 14 + Math.floor(rand() * 26), bh = 30 + Math.floor(rand() * 80);
        svgEl("rect", { class: "cs-bldg", x: bx, y: 120 - bh, width: bw - 2, height: bh }, city);
        for (var wy = 120 - bh + 6; wy < 116; wy += 9) for (var wx = bx + 3; wx < bx + bw - 5; wx += 6) if (rand() < 0.35) svgEl("rect", { class: "cs-win", x: wx, y: wy, width: 2, height: 3 }, city);
        bx += bw;
    }
    var world = el("div", "cs-world", view);
    var wind = el("p", "cs-wind", view, "");
    var banner = el("p", "cs-banner", view, "");
    banner.setAttribute("aria-hidden", "true");
    el("p", "cs-hint", view, "Tap, click, Space or Enter to drop · the bright band shows what will survive");
    var ghost = el("div", "cs-ghost", world);
    var W = view.clientWidth || 600, BH = 28, BASE_W = Math.round(W * 0.46);
    var tower = [], score = 0, streak = 0, bestStreak = 0, imperfect = 0, integrity = MD.integrity, moving = null, dir = 1, over = false, cam = 0;
    var windT = 0, milestones = { 10: "lights", 20: "aurora", 30: "crown" };

    function block(x, w, i, cls) {
        var b = el("div", "cs-block " + (cls || ""), world);
        b.style.left = x + "px";
        b.style.width = w + "px";
        b.style.bottom = (i * BH) + "px";
        b.style.setProperty("--h", (190 + i * 17) % 360);
        return b;
    }
    var base = { x: (W - BASE_W) / 2, w: BASE_W, el: block((W - BASE_W) / 2, BASE_W, 0, "cs-block--base") };
    base.el.textContent = "platform";
    tower.push(base);

    function kindFor(i) {
        var sp = MD.specials;
        if (!sp || i < sp.from) return "plain";
        if (sp.keystone && i % sp.keystone === 0) return "keystone";
        return rand() < 0.38 ? sp.kinds[Math.floor(rand() * sp.kinds.length)] : "plain";
    }
    function windNow() { return tower.length - 1 >= MD.windFrom ? 0.25 + Math.min(0.6, (tower.length - MD.windFrom) * 0.04) : 0; }
    function hud() {
        var o = { Mode: (ctx.mission + 1) + " · " + MD.title, Height: (tower.length - 1) + " / " + MD.goal, Score: fmt(score), Streak: "×" + streak,
            Integrity: new Array(integrity + 1).join("▮") + new Array(MD.integrity - integrity + 1).join("▯") };
        if (MD.imperfect) o.Imperfect = imperfect + " / " + MD.imperfect;
        if (moving && moving.kind !== "plain") o.Rule = CS_RULES[moving.kind].tag + ": " + CS_RULES[moving.kind].rule;
        ctx.hud(o);
    }
    function next() {
        var top = tower[tower.length - 1], i = tower.length, kind = kindFor(i);
        var w = kind === "narrow" ? Math.max(36, Math.round(top.w * 0.7)) : top.w;
        dir = i % 2 ? 1 : -1;
        // it enters already partly over the tower: an early press is never an instant loss
        moving = { x: dir > 0 ? top.x - w * 0.55 : top.x + top.w - w * 0.45, w: w, i: i, kind: kind };
        moving.el = block(moving.x, w, i, "cs-block--moving cs-block--" + kind);
        el("span", "cs-name", moving.el, w > 80 ? CS_NAMES[i % CS_NAMES.length] : "");
        if (kind !== "plain") el("span", "cs-tag", moving.el, CS_RULES[kind].tag);
        moving.pct = el("span", "cs-pct", moving.el, "");
        if (kind !== "plain") ctx.say("Next: " + CS_RULES[kind].tag.toLowerCase() + " platform. " + CS_RULES[kind].rule + ".", kind === "glass" ? "warn" : "info");
        var want = Math.max(0, (i + 3) * BH - view.clientHeight * 0.55);
        if (want !== cam) { cam = want; world.style.transform = "translate3d(0," + cam + "px,0)"; sky.style.transform = "translate3d(0," + (cam * 0.25).toFixed(1) + "px,0)"; }
        hud();
    }
    function speed() { return 135 + Math.min(tower.length, 28) * 9; }
    function overlap(m, top) { var l = Math.max(m.x, top.x), r = Math.min(m.x + m.w, top.x + top.w); return { l: l, r: r, ov: r - l }; }
    function show(text, tone) {
        banner.textContent = text;
        banner.className = "cs-banner is-" + tone;
        void banner.offsetWidth;
        banner.classList.add("is-on");
    }
    function drop() {
        if (!moving || over) return;
        var top = tower[tower.length - 1], m = moving, k = m.kind;
        moving = null;
        ghost.style.opacity = "0";
        var o = overlap(m, top);
        if (o.ov <= 0) return collapse("The " + (CS_NAMES[m.i % CS_NAMES.length] || "next") + " layer missed the one below completely.");
        // How far off: a narrower block is judged by how much of it overhangs, a full-width one by
        // how far its edge is from the edge below
        var off = m.w < top.w ? m.w - o.ov : Math.abs(m.x - top.x);
        var win = k === "reinforced" ? 12 : 5, placed, perfect = off <= win;
        m.el.classList.remove("cs-block--moving");
        m.pct.remove();
        if (perfect) {
            streak++;
            bestStreak = Math.max(bestStreak, streak);
            if (m.w < top.w) placed = { x: clamp(m.x, top.x, top.x + top.w - m.w), w: m.w, el: m.el };
            else {
                var w = Math.min(BASE_W, top.w + (streak >= 3 ? 8 : 0));
                placed = { x: top.x - (w - top.w) / 2, w: w, el: m.el };
            }
            score += 10 + 10 * streak;
            m.el.classList.add("is-perfect");
            sfx("precise");
            show(streak >= 3 ? "PERFECT ×" + streak : "PERFECT", "good");
            if (streak >= 5) ctx.challenge("precision");
            if (k === "keystone" && integrity < MD.integrity) { integrity++; ctx.say("✓ Keystone set perfectly: +1 integrity.", "good"); }
        } else {
            streak = 0;
            if (MD.imperfect) imperfect++;
            placed = { x: o.l, w: o.ov, el: m.el };
            score += 10 + Math.round(10 * o.ov / top.w);
            var cutX = m.x < o.l ? m.x : o.r, cutW = m.w - o.ov;
            if (cutW > 0.5) {
                var cut = block(cutX, cutW, m.i, "cs-block--cut " + (m.x < o.l ? "is-left" : "is-right"));
                ctx.after(700, function () { cut.remove(); });
            }
            sfx("hit");
            if (o.ov < top.w * 0.2) { show("NEAR MISS", "warn"); ctx.shake(); sfx("alert"); ctx.react("alert"); }
            if (k === "glass" && off > 8) { integrity--; m.el.classList.add("is-cracked"); ctx.say("✕ Glass platform cracked: " + Math.round(off) + " px off (8 allowed). −1 integrity.", "bad"); show("CRACKED", "bad"); }
        }
        placed.el.style.left = placed.x + "px";
        placed.el.style.width = placed.w + "px";
        if (placed.w <= 80) { var nm = $(".cs-name", placed.el); if (nm) nm.textContent = ""; }
        tower.push(placed);
        var h = tower.length - 1;
        if (milestones[h]) {
            view.classList.add("cs-sky--" + milestones[h]);
            ctx.unlockSky(milestones[h]);
            ctx.say("✓ Milestone: layer " + h + ". The skyline changes: " + CS_SKIES[milestones[h]].replace(/ \(.*/, "").toLowerCase() + ".", "good");
            sfx("success");
        }
        if (integrity <= 0) return collapse("Integrity ran out: too many cracked glass platforms.");
        if (MD.imperfect && imperfect > MD.imperfect) return collapse("That was imperfect drop number " + imperfect + "; the run allows " + MD.imperfect + ".");
        if (h >= MD.goal) {
            over = true;
            view.classList.add("is-complete");
            ctx.react("happy");
            return ctx.after(700, function () {
                ctx.end({ score: score + 300 + integrity * 50, won: true, message: MD.title + ": complete with " + integrity + " integrity left and a best streak of " + bestStreak + ".",
                    report: [h + " layers, " + (MD.imperfect ? imperfect + " imperfect drops, " : "") + "best perfect streak " + bestStreak + "."],
                    clean: integrity === MD.integrity && !imperfect, objective: bestStreak >= 5 || (MD.imperfect && imperfect === 0), recovered: MD.id === "rebuild" });
            });
        }
        hud();
        next();
    }
    function collapse(why) {
        over = true;
        moving = null;
        ghost.style.opacity = "0";
        ctx.say("✕ " + why, "bad");
        sfx("fail");
        ctx.react("sad");
        ctx.shake();
        tower.slice(1).forEach(function (t, k) {
            t.el.style.setProperty("--k", k);
            t.el.style.setProperty("--dx", ((k % 2 ? 1 : -1) * (20 + (k * 7) % 40)) + "px");
            t.el.classList.add("is-down");
        });
        $$(".cs-block--moving", world).forEach(function (b) { b.classList.add("is-miss"); });
        ctx.after(ctx.reduced ? 300 : 1100, function () {
            ctx.end({ score: score, won: false, message: "The tower came down at layer " + (tower.length - 1) + ".", report: ["What happened: " + why, "Watch the bright band on the block below: it's exactly what will survive the drop."] });
        });
    }
    ctx.on(view, "pointerdown", function (e) { if (!e.button) { e.preventDefault(); drop(); } });
    ctx.on(ctx.stage, "keydown", function (e) {
        if ((e.key === " " || e.key === "Enter") && !e.target.closest("button")) { e.preventDefault(); drop(); }
    });
    next();
    return {
        tick: function (dt) {
            if (!moving || over) return;
            // wind makes the platform surge and slacken; the indicator shows how hard it's blowing
            var wnd = windNow();
            windT += dt / 1000;
            var gust = 1 + wnd * Math.sin(windT * 2.1);
            moving.x += dir * speed() * gust * dt / 1000;
            // it swings slightly past either edge of the tower: a full miss is possible at the
            // extremes, but the platform spends most of its travel over the tower
            var top = tower[tower.length - 1], lo = top.x - moving.w * 1.08, hi = top.x + top.w + moving.w * 0.08;
            lo = Math.max(lo, -moving.w * 0.5); hi = Math.min(hi, W - moving.w * 0.5);
            if (moving.x > hi) { moving.x = hi; dir = -1; }
            if (moving.x < lo) { moving.x = lo; dir = 1; }
            moving.el.style.left = moving.x.toFixed(1) + "px";
            var o = overlap(moving, top);
            ghost.style.left = o.l.toFixed(1) + "px";
            ghost.style.width = Math.max(0, o.ov).toFixed(1) + "px";
            ghost.style.bottom = ((tower.length - 1) * BH) + "px";
            ghost.style.opacity = "1";
            moving.pct.textContent = Math.max(0, Math.round(o.ov / top.w * 100)) + "%";
            wind.textContent = wnd ? "wind " + (gust > 1 ? "⟶" : "⟵") + " " + (wnd * 10).toFixed(0) : "";
        }
    };
}
