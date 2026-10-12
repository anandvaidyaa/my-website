/* ==========================================================================
   Case studies: interactions and scroll choreography
   Plain JavaScript, no dependencies, loaded only on /projects/<slug>/ pages
   after script.js (which handles theme, navigation, reveals and split headings).
   Every module is optional: the page is complete without JavaScript.
   ========================================================================== */
(function () {
    "use strict";

    var $ = function (sel, root) { return (root || document).querySelector(sel); };
    var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
    var mq = function (q) { return window.matchMedia(q); };
    var reduceMotion = mq("(prefers-reduced-motion: reduce)");
    var wideQ = mq("(min-width: 960px)");
    var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
    var range = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };
    var SVGNS = "http://www.w3.org/2000/svg";
    var hasIO = "IntersectionObserver" in window;

    function safe(fn) { try { fn(); } catch (err) { if (window.console) console.error(err); } }
    // Run fn once el comes within reach of the viewport (keeps boot free of layout work)
    function whenNear(el, fn, margin) {
        if (!hasIO) { window.requestAnimationFrame(function () { safe(fn); }); return; }
        var io = new IntersectionObserver(function (entries) {
            if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); safe(fn); }
        }, { rootMargin: (margin || 900) + "px 0px" });
        io.observe(el);
    }
    function svgEl(tag, attrs, parent) {
        var n = document.createElementNS(SVGNS, tag);
        Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
        if (parent) parent.appendChild(n);
        return n;
    }

    /* ---------------- Scroll scenes ----------------
       Same rules as the homepage: one passive listener, one frame per tick, scenes measured
       only near the viewport, reads before writes, progress follows the scroll 1:1. */
    var scenes = [];
    var near = [];
    var ticking = false;
    var vh = window.innerHeight;
    var resizers = [];

    function scene(el, write, opts) {
        if (!el) return;
        opts = opts || {};
        scenes.push({ el: el, write: write, measure: opts.measure !== false, essential: !!opts.essential });
    }
    function update() {
        ticking = false;
        var still = reduceMotion.matches;
        var y = window.scrollY;
        var active = scenes.filter(function (s) { return (s.essential || !still) && near.indexOf(s.el) > -1; });
        var rects = active.map(function (s) { return s.measure ? s.el.getBoundingClientRect() : null; });
        active.forEach(function (s, i) {
            var r = rects[i];
            s.write(r ? (vh - r.top) / (vh + r.height) : 0, r, y);
        });
    }
    function request() { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }
    var nearIO = null;
    // Start tracking an element whose scene was registered after boot
    function watch(el) {
        if (nearIO) nearIO.observe(el);
        else if (near.indexOf(el) < 0) near.push(el);
        request();
    }
    function startScenes() {
        if (hasIO) {
            nearIO = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    var i = near.indexOf(e.target);
                    if (e.isIntersecting && i < 0) near.push(e.target);
                    if (!e.isIntersecting && i > -1) near.splice(i, 1);
                });
                request();
            }, { rootMargin: "200px 0px" });
            scenes.forEach(function (s) { nearIO.observe(s.el); });
        } else {
            near = scenes.map(function (s) { return s.el; });
        }
        window.addEventListener("scroll", request, { passive: true });
        window.addEventListener("resize", function () {
            vh = window.innerHeight;
            resizers.forEach(function (fn) { safe(fn); });
            request();
        }, { passive: true });
        request();
    }

    /* ---------------- Opening: layers drift at their own depth ---------------- */
    function initHero() {
        var hero = $(".cs-hero");
        if (!hero) return;
        // The visual's travelling packets start once the page has loaded and settled,
        // and pause whenever the opening is off-screen
        var svgs = $$("svg.hv__links", hero).filter(function (s) { return s.pauseAnimations; });
        var ready = false, onScreen = true;
        var sync = function () { svgs.forEach(function (s) { if (ready && onScreen && !reduceMotion.matches) s.unpauseAnimations(); else s.pauseAnimations(); }); };
        sync();
        var start = function () { window.setTimeout(function () { ready = true; sync(); }, 1200); };
        if (document.readyState === "complete") start(); else window.addEventListener("load", start);
        if (hasIO) new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; sync(); }).observe(hero);
        var layers = $$("[data-depth]", hero);
        var title = $(".cs-hero__title", hero);
        var ghost = $(".cs-hero__ghost", hero);
        var heroH = 0;
        resizers.push(function () { heroH = hero.offsetHeight || 1; });
        scene(hero, function (_, __, y) {
            if (!heroH) heroH = hero.offsetHeight || 1;
            var p = clamp(y / heroH, 0, 1);
            layers.forEach(function (l) {
                var d = parseFloat(l.getAttribute("data-depth")) || 0;
                l.style.translate = "0 " + (-y * d).toFixed(1) + "px";
            });
            // The title settles back as the story begins
            if (title) {
                title.style.scale = (1 - p * 0.06).toFixed(4);
                title.style.opacity = (1 - range(p, 0.35, 0.9) * 0.6).toFixed(3);
            }
            if (ghost) ghost.style.translate = "0 " + (y * 0.3).toFixed(1) + "px";
        }, { measure: false });
    }

    /* ---------------- Chapters: numbers fill in, navigation tracks reading ---------------- */
    function initChapters() {
        var chapters = $$(".chapter");
        var links = {};
        $$(".cs-nav a[data-nav]").forEach(function (a) { links[a.getAttribute("data-nav")] = a; });

        chapters.forEach(function (ch) {
            var no = $(".chapter__no", ch);
            var link = links[ch.id];
            scene(ch, function (p, r) {
                if (no) {
                    no.style.setProperty("--fill", (range(p, 0.08, 0.32) * 100).toFixed(1) + "%");
                    if (!reduceMotion.matches) no.style.translate = "0 " + ((p - 0.3) * -60).toFixed(1) + "px";
                }
                // How much of this chapter has been read (top of the viewport past its top)
                if (link) link.style.setProperty("--cp", clamp((vh * 0.35 - r.top) / r.height, 0, 1).toFixed(3));
            }, { essential: true });
        });

        if (!hasIO) return;
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                Object.keys(links).forEach(function (id) {
                    var on = id === e.target.id;
                    links[id].classList.toggle("is-current", on);
                    if (on) links[id].setAttribute("aria-current", "location"); else links[id].removeAttribute("aria-current");
                });
            });
        }, { rootMargin: "-35% 0px -60% 0px" });
        chapters.forEach(function (c) { io.observe(c); });
    }

    /* ---------------- Architecture diagram ----------------
       Nodes are real buttons placed by percentage; edges are drawn here from data-edges
       ("from>to:kind:step"). With a steps list, the diagram assembles in story order. */
    function Archx(root) {
        var stage = $(".archx__stage", root);
        var svg = $(".archx__edges", root);
        var resetBtn = $(".archx__reset", root);
        var nodes = {}, order = [], details = {};
        $$(".archx__node", root).forEach(function (n) {
            var id = n.getAttribute("data-node");
            nodes[id] = n;
            order.push(id);
            n.setAttribute("aria-controls", root.id + "-panel");
            n.setAttribute("aria-pressed", "false");
        });
        var panel = $(".archx__panel", root);
        if (panel) panel.id = root.id + "-panel";
        $$(".archx__detail", root).forEach(function (d) { details[d.getAttribute("data-detail")] = d; });

        var edges = (root.getAttribute("data-edges") || "").trim().split(/\s+/).filter(Boolean).map(function (spec) {
            var m = spec.match(/^([\w-]+)>([\w-]+):(\w+):(\d+)$/);
            return m ? { from: m[1], to: m[2], kind: m[3], step: +m[4] } : null;
        }).filter(Boolean);
        var steps = Math.max.apply(null, edges.map(function (e) { return e.step; }).concat([1]));

        var state = { step: steps, selected: null, layout: null, progressive: false };
        var drawn = [];

        function pos(id, narrow) {
            var a = (nodes[id].getAttribute(narrow ? "data-mpos" : "data-pos") || nodes[id].getAttribute("data-pos")).split(",");
            return [parseFloat(a[0]), parseFloat(a[1])];
        }

        function render(narrow) {
            state.layout = narrow ? "narrow" : "wide";
            root.setAttribute("data-layout", state.layout);
            var ratio = (root.getAttribute(narrow ? "data-mratio" : "data-ratio") || "1000/640").split("/");
            var W = 1000, H = 1000 * (+ratio[1] / +ratio[0]);
            stage.style.setProperty("--ratio", ratio[0] + " / " + ratio[1]);
            svg.setAttribute("viewBox", "0 0 " + W + " " + H);
            while (svg.firstChild) svg.removeChild(svg.firstChild);
            drawn = [];
            order.forEach(function (id) {
                var p = pos(id, narrow);
                nodes[id].style.setProperty("--x", p[0]);
                nodes[id].style.setProperty("--y", p[1]);
            });
            var pairs = {};
            edges.forEach(function (e, i) {
                var a = pos(e.from, narrow), b = pos(e.to, narrow);
                var ax = a[0] * W / 100, ay = a[1] * H / 100, bx = b[0] * W / 100, by = b[1] * H / 100;
                var key = [e.from, e.to].sort().join("|");
                var bend = pairs[key] ? -1 : (edges.some(function (o) { return o !== e && o.from === e.to && o.to === e.from; }) ? 1 : 0);
                pairs[key] = true;
                var d;
                if (e.kind === "hook") {
                    // Webhooks travel on their own bus around the outside, so they never cross the request path
                    if (!narrow) d = ax >= W * 0.7 ? "M" + ax + " " + ay + " H" + (W * 0.97) + " V" + by + " H" + bx : "M" + ax + " " + ay + " H" + bx + " V" + by;
                    else d = ay < by ? "M" + ax + " " + ay + " V" + by + " H" + bx : "M" + ax + " " + ay + " H" + (W * 0.03) + " V" + by + " H" + bx;
                } else if (bend) {
                    // Two-way traffic: bow each direction to its own side
                    var dx = bx - ax, dy = by - ay, len = Math.max(1, Math.hypot(dx, dy));
                    var nx = -dy / len * 46 * bend, ny = dx / len * 46 * bend;
                    d = "M" + ax + " " + ay + " C" + (ax + dx / 3 + nx) + " " + (ay + dy / 3 + ny) + " " + (ax + 2 * dx / 3 + nx) + " " + (ay + 2 * dy / 3 + ny) + " " + bx + " " + by;
                } else if (Math.abs(bx - ax) >= Math.abs(by - ay)) {
                    d = "M" + ax + " " + ay + " C" + (ax + (bx - ax) / 2) + " " + ay + " " + (ax + (bx - ax) / 2) + " " + by + " " + bx + " " + by;
                } else {
                    d = "M" + ax + " " + ay + " C" + ax + " " + (ay + (by - ay) / 2) + " " + bx + " " + (ay + (by - ay) / 2) + " " + bx + " " + by;
                }
                var path = svgEl("path", { d: d, id: root.id + "-e" + i, "data-kind": e.kind }, svg);
                var pkt = null;
                if (!reduceMotion.matches) {
                    pkt = svgEl("circle", { r: narrow ? 7 : 5, "class": "archx__pkt" }, svg);
                    var mo = svgEl("animateMotion", { dur: (2.2 + (i % 3) * 0.4) + "s", repeatCount: "indefinite", begin: (-(i * 0.45) % 2.2).toFixed(2) + "s" }, pkt);
                    svgEl("mpath", { href: "#" + root.id + "-e" + i }, mo);
                }
                drawn.push({ e: e, path: path, pkt: pkt });
            });
            paint();
        }

        function paint() {
            var sel = state.selected;
            var showAll = !state.progressive;
            order.forEach(function (id) {
                var n = nodes[id];
                var ns = +n.getAttribute("data-step") || 1;
                var related = !sel || sel === id || edges.some(function (e) { return (e.from === sel && e.to === id) || (e.to === sel && e.from === id); });
                n.classList.toggle("is-hidden", !showAll && ns > state.step);
                n.classList.toggle("is-current", !sel && state.progressive && ns === state.step);
                n.classList.toggle("is-selected", sel === id);
                n.classList.toggle("is-dim", !!sel && !related);
                n.setAttribute("aria-pressed", String(sel === id));
            });
            drawn.forEach(function (d) {
                var hidden = !showAll && d.e.step > state.step;
                var incident = !sel || d.e.from === sel || d.e.to === sel;
                d.path.classList.toggle("is-hidden", hidden);
                d.path.classList.toggle("is-flow", !hidden && incident);
                d.path.classList.toggle("is-dim", !hidden && !incident);
                if (d.pkt) d.pkt.classList.toggle("is-hidden", hidden || !incident);
            });
            var key = sel && details[sel] ? sel : "overview";
            Object.keys(details).forEach(function (k) { details[k].classList.toggle("is-active", k === key); });
            if (resetBtn) resetBtn.hidden = !sel && !state.progressive;
        }

        function select(id) {
            state.selected = state.selected === id ? null : id;
            paint();
        }
        function reset() {
            state.selected = null;
            state.progressive = false;
            state.step = steps;
            paint();
        }

        order.forEach(function (id, i) {
            nodes[id].addEventListener("click", function () { select(id); });
            nodes[id].addEventListener("keydown", function (e) {
                var next = null;
                if (e.key === "ArrowRight" || e.key === "ArrowDown") next = order[(i + 1) % order.length];
                if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = order[(i - 1 + order.length) % order.length];
                if (e.key === "Escape") { state.selected = null; paint(); }
                if (next) { e.preventDefault(); nodes[next].focus(); }
            });
        });
        if (resetBtn) resetBtn.addEventListener("click", reset);

        function pick() {
            var narrow = stage.clientWidth < 440;
            if ((narrow ? "narrow" : "wide") !== state.layout) render(narrow);
        }
        if ("ResizeObserver" in window) new ResizeObserver(pick).observe(root);
        else { resizers.push(pick); window.requestAnimationFrame(pick); }

        return {
            root: root,
            steps: steps,
            // Enter story mode: only components introduced so far are shown
            setStep: function (n) {
                state.progressive = true;
                state.step = clamp(n, 1, steps);
                paint();
            },
            // Leave story mode (the reader asked for everything, or the story is over)
            finish: function () {
                if (!state.progressive) return;
                state.progressive = false;
                state.step = steps;
                paint();
            }
        };
    }

    function initArchitecture() {
        $$("[data-archx]").forEach(function (root) { whenNear(root, function () { wireDiagram(root); }); });
    }
    function wireDiagram(root) {
        (function () {
            var dia = Archx(root);
            var list = $('.steps[data-steps-for="' + root.id + '"]');
            if (!list || !hasIO || reduceMotion.matches) return;
            var items = $$("li[data-step]", list);
            var userReset = false;
            var reset = $(".archx__reset", root);
            if (reset) reset.addEventListener("click", function () { userReset = true; });

            // Desktop: the step in the middle of the screen drives the sticky diagram
            var current = 0;
            var sio = new IntersectionObserver(function (entries) {
                if (!wideQ.matches || userReset) return;
                entries.forEach(function (e) {
                    if (!e.isIntersecting) return;
                    current = +e.target.getAttribute("data-step");
                    items.forEach(function (li) { li.classList.toggle("is-current", li === e.target); });
                    dia.setStep(current);
                });
            }, { rootMargin: "-45% 0px -45% 0px" });
            items.forEach(function (li) { sio.observe(li); });

            // When the diagram first appears: desktop starts at step 1; small screens play
            // the steps through once, since the list sits below the diagram
            var vio = new IntersectionObserver(function (entries) {
                if (!entries[0].isIntersecting) return;
                vio.disconnect();
                if (userReset) return;
                if (wideQ.matches) { if (!current) dia.setStep(1); return; }
                var n = 1;
                dia.setStep(n);
                var t = window.setInterval(function () {
                    if (userReset || wideQ.matches) { window.clearInterval(t); return; }
                    n++;
                    if (n > dia.steps) { window.clearInterval(t); dia.finish(); return; }
                    dia.setStep(n);
                }, 900);
            }, { threshold: 0.35 });
            vio.observe(root);

            // Past the last step, everything stays visible
            scene(list, function (p, r) {
                if (userReset || !wideQ.matches) return;
                if (r.bottom < vh * 0.4) dia.finish();
                else if (current) dia.setStep(current);
            });
            watch(list);
        })();
    }

    /* ---------------- The deployment journey (scroll-linked) ---------------- */
    function initJourney() {
        $$("[data-journey]").forEach(function (list) { whenNear(list, function () { wireJourney(list); }); });
    }
    function wireJourney(list) {
        (function () {
            var root = document.getElementById(list.getAttribute("data-journey"));
            if (!root) return;
            var stageEl = $(".journey__stage", root);
            var path = $(".journey__path", root);
            var done = $(".journey__done", root);
            var capsule = $(".journey__capsule", root);
            var readout = $("[data-readout]", root);
            var stations = $$(".journey__st", root).sort(function (a, b) { return a.getAttribute("data-step") - b.getAttribute("data-step"); });
            var items = $$("li[data-step]", list);
            var VB = [600, 360];
            var L = path.getTotalLength();
            root.style.setProperty("--jl", L.toFixed(1));
            root.style.setProperty("--jo", L.toFixed(1));

            // Where each station sits along the track (nearest point on the path)
            var fracs = stations.map(function (st) {
                var xy = st.getAttribute("data-xy").split(",").map(Number);
                st.style.setProperty("--sx", (xy[0] / VB[0] * 100) + "%");
                st.style.setProperty("--sy", (xy[1] / VB[1] * 100) + "%");
                var best = 0, bestD = Infinity;
                for (var i = 0; i <= 160; i++) {
                    var pt = path.getPointAtLength(L * i / 160);
                    var dd = (pt.x - xy[0]) * (pt.x - xy[0]) + (pt.y - xy[1]) * (pt.y - xy[1]);
                    if (dd < bestD) { bestD = dd; best = i / 160; }
                }
                return best;
            });
            var N = stations.length;
            var lastIdx = -1;

            scene(list, function (p, r) {
                // Station k is reached when step k sits in the middle of the screen
                var t = clamp((vh * 0.55 - r.top) / r.height, 0, 1) * N;
                var s = clamp(t - 0.5, 0, N - 1);
                var i0 = Math.floor(s), i1 = Math.min(N - 1, i0 + 1);
                var frac = fracs[i0] + (fracs[i1] - fracs[i0]) * (s - i0);
                var pt = path.getPointAtLength(frac * L);
                if (capsule) capsule.style.translate = (pt.x / VB[0] * stageEl.clientWidth).toFixed(1) + "px " + (pt.y / VB[1] * stageEl.clientHeight).toFixed(1) + "px";
                root.style.setProperty("--jo", (L * (1 - frac)).toFixed(1));
                list.style.setProperty("--jp", (t / N).toFixed(4));
                var idx = Math.round(s);
                stations.forEach(function (st, k) {
                    st.classList.toggle("is-done", k <= s + 0.02);
                    st.classList.toggle("is-current", k === idx);
                });
                if (idx !== lastIdx) {
                    lastIdx = idx;
                    items.forEach(function (li, k) { li.classList.toggle("is-current", k === idx); });
                    if (readout) readout.textContent = "stage " + (idx + 1) + " / " + N + " · " + stations[idx].textContent.trim().toLowerCase();
                }
            }, { essential: true });
            watch(list);
        })();
    }

    /* ---------------- Environment drift straightens out (pipeline) ---------------- */
    function initDrift() {
        $$("[data-drift]").forEach(function (el) {
            scene(el, function (p) {
                var d = 1 - range(p, 0.3, 0.62);
                el.style.setProperty("--d", d.toFixed(3));
                el.classList.toggle("is-aligned", d < 0.05);
            });
        });
    }

    /* ---------------- Shared helpers for the exhibits ---------------- */
    function centre(el) { var r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
    // A glowing dot travels between elements (skipped with reduced motion)
    function travel(from, to, ms) {
        if (reduceMotion.matches || !document.body.animate) return;
        var a = centre(from), b = centre(to);
        var dot = document.createElement("span");
        dot.className = "sim__pulse";
        document.body.appendChild(dot);
        var anim = dot.animate([
            { transform: "translate(" + a[0] + "px," + a[1] + "px) scale(.6)", opacity: 0 },
            { opacity: 1, offset: 0.15 },
            { transform: "translate(" + b[0] + "px," + b[1] + "px) scale(1)", opacity: 1 }
        ], { duration: ms, easing: "cubic-bezier(.65,0,.35,1)" });
        anim.onfinish = function () { dot.remove(); };
    }
    function segGroup(buttons, attr, onPick) {
        buttons.forEach(function (b) {
            b.addEventListener("click", function () {
                buttons.forEach(function (o) { var on = o === b; o.classList.toggle("is-active", on); o.setAttribute("aria-pressed", String(on)); });
                onPick(b.getAttribute(attr));
            });
        });
    }

    /* ---------------- Exhibit: the sync race (orders) ---------------- */
    function initSync() {
        var sim = $('[data-sim="sync"]');
        if (!sim) return;
        var ch = {};
        $$("[data-ch]", sim).forEach(function (c) { ch[c.getAttribute("data-ch")] = { el: c, stock: $("[data-stock]", c), state: $("[data-state]", c) }; });
        var hub = $(".sim__hub", sim), hubName = $("[data-hub]", sim), clock = $("[data-clock]", sim), log = $("[data-log]", sim);
        var sell = $('[data-act="sell"]', sim), resetBtn = $('[data-act="reset"]', sim);
        var mode = "poll", timers = [], tick = 0;

        function set(name, stock, text, cls) {
            var c = ch[name];
            c.stock.textContent = stock;
            c.state.textContent = text;
            c.el.className = "sim__ch" + (cls ? " " + cls : "");
        }
        function say(msg, tone) { log.textContent = msg; log.className = "sim__log" + (tone ? " is-" + tone : ""); }
        function later(fn, ms) { timers.push(window.setTimeout(fn, ms)); }
        function reset() {
            timers.forEach(window.clearTimeout); timers = [];
            window.clearInterval(tick);
            ["shopify", "amazon", "walmart"].forEach(function (n) { set(n, "1", "in stock", ""); });
            hubName.textContent = mode === "poll" ? "Sync job · every ~5 min" : "Azure Functions · on every change";
            clock.textContent = "—";
            sell.disabled = false;
            say(mode === "poll" ? "Scheduled sync: changes are copied between channels every five minutes or so." : "Event-driven: every change is handled the moment it happens.");
        }

        function run() {
            sell.disabled = true;
            set("shopify", "0", "sold", "is-sold");
            if (mode === "poll") {
                set("amazon", "1", "still shows 1", "is-stale");
                set("walmart", "1", "still shows 1", "is-stale");
                say("Shopify sold the last unit. Amazon and Walmart won’t hear about it until the next scheduled sync.");
                var left = 300, start = Date.now();
                tick = window.setInterval(function () {
                    left = Math.max(0, 300 - Math.round((Date.now() - start) / 1000 * 60));
                    clock.textContent = "next sync in " + Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0");
                }, 100);
                later(function () {
                    set("amazon", "0", "ordered · oversold", "is-over");
                    say("Meanwhile a buyer on Amazon orders the same unit. It was already gone.", "bad");
                }, 1900);
                later(function () {
                    window.clearInterval(tick);
                    clock.textContent = "synced after ~5 min";
                    set("walmart", "0", "synced", "is-synced");
                    say("The scheduled sync finally runs — five minutes later. One order now has to be cancelled.", "bad");
                    sell.disabled = false;
                }, 5100);
            } else {
                var t0 = Date.now();
                tick = window.setInterval(function () { clock.textContent = ((Date.now() - t0) / 1000).toFixed(1) + " s"; }, 50);
                travel(ch.shopify.el, hub, 450);
                later(function () { travel(hub, ch.amazon.el, 500); travel(hub, ch.walmart.el, 500); }, 450);
                later(function () {
                    window.clearInterval(tick);
                    clock.textContent = "synced in " + ((Date.now() - t0) / 1000).toFixed(1) + " s";
                    set("amazon", "0", "synced", "is-synced");
                    set("walmart", "0", "synced", "is-synced");
                    say("Amazon and Walmart were updated in under two seconds — there was nothing left to oversell.", "good");
                    sell.disabled = false;
                }, 1050);
            }
        }

        segGroup($$("[data-mode]", sim), "data-mode", function (m) { mode = m; reset(); });
        sell.addEventListener("click", function () { reset(); run(); });
        resetBtn.addEventListener("click", reset);
        reset();
    }

    /* ---------------- Exhibit: the gateway inspector (carrier) ---------------- */
    function initGate() {
        var sim = $('[data-sim="gate"]');
        if (!sim) return;
        var client = $('[data-g="client"]', sim), carrier = $('[data-g="carrier"]', sim), core = $(".gate__core", sim);
        var cSmall = $("[data-g-client]", sim), kSmall = $("[data-g-carrier]", sim), log = $("[data-log]", sim);
        var checks = {};
        $$("[data-check]", sim).forEach(function (li) { checks[li.getAttribute("data-check")] = li; });
        var order = ["jwt", "scope", "limit", "route"];
        var send = $('[data-act="send"]', sim), resetBtn = $('[data-act="reset"]', sim);
        var name = "FedEx", scenario = "ok", timers = [];

        // Where each scenario stops, and what the caller is told. Status codes are the standard
        // ones for each failure; the whole exhibit is a frontend simulation.
        var STOP = {
            none: { at: "jwt", code: "401 Unauthorized", msg: function () { return "401 Unauthorized at the gateway: the request has no token, so " + name + " is never called — and the carrier’s API keys never leave the gateway."; } },
            scope: { at: "scope", code: "403 Forbidden", msg: function () { return "403 Forbidden: the token is genuine (authentication passed), but it doesn’t grant label creation (authorization failed). " + name + " is never called."; } },
            limit: { at: "limit", code: "429 Too Many Requests", msg: function () { return "429 Too Many Requests: this caller has used its quota for now. The gateway answers with a Retry-After header and protects " + name + "’s limits; the carrier is never called."; } }
        };
        var INTRO = {
            ok: "The request carries a valid OAuth 2.0 token with permission to create labels.",
            none: "The request has no token at all.",
            scope: "The request has a valid token, but without permission to create labels.",
            limit: "This caller has already used its request quota for the minute.",
            down: "Everything is in order on our side, but the carrier is having an outage."
        };

        function say(msg, tone) { log.textContent = msg; log.className = "sim__log" + (tone ? " is-" + tone : ""); }
        function later(fn, ms) { timers.push(window.setTimeout(fn, ms)); }
        function mark(id, cls) { checks[id].className = cls ? "is-" + cls : ""; }
        function reset() {
            timers.forEach(window.clearTimeout); timers = [];
            order.forEach(function (k) { mark(k, ""); });
            client.className = "gate__end"; carrier.className = "gate__end";
            cSmall.textContent = "ready"; kSmall.textContent = "idle";
            send.disabled = false;
            say(INTRO[scenario] + " Send it to watch the gateway’s checks.");
        }
        function finish(text, tone, clientState) {
            cSmall.textContent = clientState;
            client.className = "gate__end" + (tone === "good" ? " is-ok" : "");
            say(text, tone);
            send.disabled = false;
        }

        function run() {
            reset();
            send.disabled = true;
            client.classList.add("is-on");
            cSmall.textContent = "POST /labels";
            say("Request sent to the gateway…");
            travel(client, core, 500);
            var stop = STOP[scenario];
            var t = 500;
            // Walk the gateway's checks in order until one rejects the request
            for (var i = 0; i < order.length; i++) {
                (function (id, k) {
                    later(function () { mark(id, "run"); }, t);
                    t += 520;
                    later(function () {
                        if (stop && stop.at === id) {
                            mark(id, "fail");
                            order.slice(k + 1).forEach(function (rest) { mark(rest, "skip"); });
                            finish(stop.msg(), "bad", stop.code);
                            return;
                        }
                        mark(id, "pass");
                    }, t);
                })(order[i], i);
                if (stop && stop.at === order[i]) return;
            }
            later(function () {
                travel(core, carrier, 500);
                carrier.classList.add("is-on");
                kSmall.textContent = "creating label…";
                say(name + " is creating the label. Its API keys stay at the gateway, out of the dispatch app.");
            }, t);
            if (scenario === "down") {
                later(function () {
                    carrier.className = "gate__end";
                    kSmall.textContent = "503 Service Unavailable";
                    travel(carrier, client, 600);
                }, t + 800);
                later(function () {
                    finish(name + " answered 503 Service Unavailable. The gateway passes the error back to dispatch with a request ID for tracing, so the request can be retried later. Nothing is retried in this simulation.", "bad", "503 from " + name);
                }, t + 1400);
                return;
            }
            later(function () {
                carrier.className = "gate__end is-ok";
                kSmall.textContent = "label created";
                travel(carrier, client, 600);
            }, t + 700);
            later(function () {
                cSmall.textContent = "label received";
                client.className = "gate__end is-ok";
                say("Label created through " + name + " — no portal, no clicks.", "good");
            }, t + 1300);
            later(function () {
                kSmall.textContent = "webhook: in transit";
                travel(carrier, client, 600);
            }, t + 2200);
            later(function () {
                finish("Label created through " + name + " — no portal, no clicks. Then " + name + " pushed a tracking update by webhook: nobody had to check.", "good", "tracking: in transit");
            }, t + 2800);
        }

        segGroup($$("[data-carrier]", sim), "data-carrier", function (c) {
            name = c;
            $$("[data-carrier-name]", sim).forEach(function (n) { n.textContent = c; });
            reset();
        });
        segGroup($$("[data-scenario]", sim), "data-scenario", function (v) { scenario = v; reset(); });
        send.addEventListener("click", run);
        resetBtn.addEventListener("click", reset);
        reset();
    }

    /* ---------------- Code: highlighting, copy, tabs ---------------- */
    var LANGS = {
        csharp: [[/\/\/[^\n]*/, "c"], [/"(?:[^"\\\n]|\\.)*"/, "s"], [/\b(?:public|private|async|await|return|if|var|bool|string|new|static|class|void)\b/, "k"], [/\[[A-Z]\w*(?=\()/, "a"], [/\b[A-Z]\w*\b/, "t"], [/\b\d+(?:\.\d+)?\b/, "n"]],
        bicep: [[/\/\/[^\n]*/, "c"], [/'(?:[^'\\\n]|\\.)*'/, "s"], [/\b(?:param|resource|var|output|module|existing|parent|if|for|in)\b/, "k"], [/\b\d+(?:\.\d+)?\b/, "n"], [/\b[a-zA-Z]+(?=:)/, "a"]],
        yaml: [[/#[^\n]*/, "c"], [/'[^'\n]*'|"[^"\n]*"/, "s"], [/(?:^|\n)\s*-?\s*[\w.-]+(?=:)/, "a"], [/\$\([\w.]+\)/, "t"], [/\b\d+\b/, "n"]],
        xml: [[/<!--[\s\S]*?-->/, "c"], [/"[^"\n]*"|'[^'\n]*'/, "s"], [/<\/?[\w-]+|\/?>/, "k"], [/[\w-]+(?==)/, "a"]]
    };
    function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    function highlight(code, lang) {
        var rules = LANGS[lang];
        if (!rules) return;
        var src = code.textContent;
        var re = new RegExp(rules.map(function (r) { return "(" + r[0].source + ")"; }).join("|"), "g");
        var out = "", last = 0, m;
        while ((m = re.exec(src))) {
            if (!m[0]) { re.lastIndex++; continue; }
            var k = 1;
            while (m[k] === undefined) k++;
            out += esc(src.slice(last, m.index)) + '<span class="tok-' + rules[k - 1][1] + '">' + esc(m[0]) + "</span>";
            last = m.index + m[0].length;
        }
        code.innerHTML = out + esc(src.slice(last));
    }
    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
        return new Promise(function (resolve, reject) {
            var ta = document.createElement("textarea");
            ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
            document.body.appendChild(ta); ta.select();
            try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); }
            ta.remove();
        });
    }
    function initCode() {
        $$("figure.code").forEach(function (fig) { whenNear(fig, function () { wireCode(fig); }, 1200); });
        initTabs();
    }
    function wireCode(fig) {
        if (fig.__wired) return;
        fig.__wired = true;
        (function () {
            var code = $("code", fig), pre = $("pre", fig), cap = $("figcaption", fig);
            if (!code) return;
            var raw = code.textContent;
            safe(function () { highlight(code, fig.getAttribute("data-lang")); });
            // Scrollable code must be reachable by keyboard
            pre.setAttribute("tabindex", "0");
            var file = $(".code__file", fig);
            pre.setAttribute("aria-label", (file ? file.textContent : "Code") + " (illustrative)");
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "code__copy";
            btn.textContent = "Copy";
            btn.setAttribute("aria-label", "Copy " + (file ? file.textContent : "code"));
            btn.addEventListener("click", function () {
                copyText(raw).then(function () {
                    btn.textContent = "Copied"; btn.classList.add("is-copied");
                    window.setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("is-copied"); }, 1800);
                }, function () { btn.textContent = "Select and copy"; });
            });
            (cap || fig).appendChild(btn);
        })();
    }
    function initTabs() {
        $$("[data-tabs]").forEach(function (box) {
            var tabs = $$('[role="tab"]', box);
            function show(tab, focus) {
                tabs.forEach(function (t) {
                    var on = t === tab;
                    t.setAttribute("aria-selected", String(on));
                    t.tabIndex = on ? 0 : -1;
                    var panel = document.getElementById(t.getAttribute("aria-controls"));
                    panel.hidden = !on;
                    // Code in a panel that was hidden never "approached" the viewport: wire it now
                    var fig = on && $("figure.code", panel);
                    if (fig && box.classList.contains("is-wired")) wireCode(fig);
                });
                if (focus) tab.focus();
            }
            tabs.forEach(function (t, i) {
                t.addEventListener("click", function () { show(t); });
                t.addEventListener("keydown", function (e) {
                    var n = null;
                    if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
                    if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
                    if (e.key === "Home") n = tabs[0];
                    if (e.key === "End") n = tabs[tabs.length - 1];
                    if (n) { e.preventDefault(); show(n, true); }
                });
            });
            show(tabs[0]);
            whenNear(box, function () { box.classList.add("is-wired"); $$("[role=tabpanel]:not([hidden]) figure.code", box).forEach(wireCode); }, 1200);
        });
    }

    /* ---------------- Count-ups on results ---------------- */
    function initCount() {
        var els = $$("[data-count]");
        if (!els.length || !hasIO || reduceMotion.matches) return;
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                io.unobserve(e.target);
                var el = e.target, to = +el.getAttribute("data-count"), pre = el.getAttribute("data-prefix") || "", suf = el.getAttribute("data-suffix") || "";
                var final = el.textContent, t0 = performance.now();
                (function step(now) {
                    var k = clamp((now - t0) / 1300, 0, 1);
                    el.textContent = pre + Math.round(to * (1 - Math.pow(1 - k, 3))) + suf;
                    if (k < 1) window.requestAnimationFrame(step); else el.textContent = final;
                })(t0);
            });
        }, { threshold: 0.6 });
        els.forEach(function (el) { io.observe(el); });
    }

    function boot() {
        [initHero, initChapters, initArchitecture, initJourney, initDrift, initSync, initGate, initCode, initCount].forEach(safe);
        startScenes();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();
