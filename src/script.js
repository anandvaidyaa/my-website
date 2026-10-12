/* ==========================================================================
   Anand Vaidya — portfolio interactions
   Plain JavaScript, no dependencies. Edit this file, then `npm run build`.
   Every module is optional: the page is fully readable without JavaScript.
   ========================================================================== */
(function () {
    "use strict";

    var doc = document.documentElement;
    var $ = function (sel, root) { return (root || document).querySelector(sel); };
    var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
    var mq = function (q) { return window.matchMedia(q); };
    var reduceMotion = mq("(prefers-reduced-motion: reduce)");
    var finePointer = mq("(hover: hover) and (pointer: fine)");

    var store = {
        get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
        set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
    };

    function onChange(query, fn) {
        if (query.addEventListener) query.addEventListener("change", fn);
        else if (query.addListener) query.addListener(fn);
    }

    // Shared polite live region for short announcements ("Copied", theme changes)
    var announcer = document.createElement("p");
    announcer.className = "sr-only";
    announcer.setAttribute("role", "status");
    document.body.appendChild(announcer);
    function announce(msg) {
        announcer.textContent = "";
        window.setTimeout(function () { announcer.textContent = msg; }, 50);
    }

    /* ---------------- Theme ---------------- */
    function initTheme() {
        var btn = $("#theme-toggle");
        var meta = $("#meta-theme-color");

        function apply(theme, persist) {
            doc.setAttribute("data-theme", theme);
            if (meta) meta.setAttribute("content", theme === "light" ? "#f4f6fb" : "#070a12");
            if (btn) btn.setAttribute("aria-label", theme === "light" ? "Switch to dark theme" : "Switch to light theme");
            if (persist) store.set("theme", theme);
        }

        apply(doc.getAttribute("data-theme") === "light" ? "light" : "dark", false);

        if (btn) {
            btn.addEventListener("click", function () {
                var next = doc.getAttribute("data-theme") === "light" ? "dark" : "light";
                apply(next, true);
                announce(next === "light" ? "Light theme" : "Dark theme");
            });
        }

        // Follow the OS setting until the visitor makes an explicit choice
        onChange(mq("(prefers-color-scheme: light)"), function (e) {
            if (!store.get("theme")) apply(e.matches ? "light" : "dark", false);
        });
    }

    /* ---------------- In-page scrolling that survives lazy layout ----------------
       Sections use content-visibility:auto, so the browser only knows their real
       height once they render. Scroll, then re-measure and correct until settled. */
    function scrollToId(id, smooth) {
        var target = document.getElementById(id);
        if (!target) return false;
        var headerH = ($("#site-header") || {}).offsetHeight || 0;
        var attempts = 0;

        function go(behavior) {
            var top = target.getBoundingClientRect().top + window.scrollY - headerH - 8;
            window.scrollTo({ top: Math.max(0, top), behavior: behavior });
        }
        // Re-measure until the target stays put for two consecutive checks. The moment the visitor
        // scrolls, taps or types, stand down: never pull them back to where they no longer want to be.
        var stable = 0, cancelled = false;
        var INPUTS = ["wheel", "touchstart", "keydown", "pointerdown"];
        function cancel() { cancelled = true; INPUTS.forEach(function (ev) { window.removeEventListener(ev, cancel, true); }); }
        INPUTS.forEach(function (ev) { window.addEventListener(ev, cancel, { capture: true, passive: true }); });
        window.setTimeout(cancel, 4000);
        function settle() {
            if (cancelled) return;
            var off = target.getBoundingClientRect().top - headerH - 8;
            if (Math.abs(off) > 2) { stable = 0; go("instant"); }
            else stable++;
            if (stable < 2 && attempts++ < 12) window.setTimeout(settle, 80);
            else cancel();
        }

        // "auto" would inherit CSS smooth scrolling, so use "instant" explicitly
        var useSmooth = smooth && !reduceMotion.matches;
        go(useSmooth ? "smooth" : "instant");
        if (useSmooth && "onscrollend" in window) {
            window.addEventListener("scrollend", function done() {
                window.removeEventListener("scrollend", done);
                settle();
            });
        } else {
            window.setTimeout(settle, useSmooth ? 900 : 60);
        }
        return true;
    }

    function initAnchors() {
        document.addEventListener("click", function (e) {
            var a = e.target.closest && e.target.closest('a[href^="#"]');
            if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
            var id = a.getAttribute("href").slice(1);
            if (!id) return;
            // Let the menu handler close the overlay first, then scroll
            window.setTimeout(function () {
                if (scrollToId(id, true) && history.pushState) history.pushState(null, "", "#" + id);
                var target = document.getElementById(id);
                if (target) {
                    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
                    target.focus({ preventScroll: true });
                }
            }, 0);
            e.preventDefault();
        });

        // Deep links such as /#contact on first load
        if (location.hash.length > 1) {
            var id = decodeURIComponent(location.hash.slice(1));
            window.addEventListener("load", function () { scrollToId(id, false); });
        }
    }

    /* ---------------- Navigation ---------------- */
    function initNav() {
        var header = $("#site-header");
        var toggle = $("#nav-toggle");
        var menu = $("#mobile-menu");
        var inertTargets = [$("#main"), $(".site-footer")];

        function setOpen(open) {
            if (!toggle || !menu) return;
            toggle.setAttribute("aria-expanded", String(open));
            toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
            menu.hidden = !open;
            header.classList.toggle("is-open", open);
            document.body.style.overflow = open ? "hidden" : "";
            inertTargets.forEach(function (el) { if (el) el.inert = open; });
            if (open) {
                var first = $("a", menu);
                if (first) first.focus();
            }
        }

        if (toggle && menu) {
            toggle.addEventListener("click", function () {
                setOpen(toggle.getAttribute("aria-expanded") !== "true");
            });
            menu.addEventListener("click", function (e) {
                if (e.target.closest("a, [data-quick]")) setOpen(false);
            });
            document.addEventListener("keydown", function (e) {
                if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
                    setOpen(false);
                    toggle.focus();
                }
            });
            onChange(mq("(min-width: 900px)"), function (e) { if (e.matches) setOpen(false); });
        }

        // Highlight the section currently in view
        var links = $$(".nav__links a");
        if (!links.length || !("IntersectionObserver" in window)) return;
        var byId = {};
        links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                links.forEach(function (a) { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
                var link = byId[entry.target.id];
                if (link) { link.classList.add("is-active"); link.setAttribute("aria-current", "location"); }
            });
        }, { rootMargin: "-45% 0px -50% 0px" });

        $$("main section[id]").forEach(function (s) { io.observe(s); });
    }

    /* ---------------- Motion system: scroll-linked scenes ----------------
       One passive scroll listener and at most one animation frame per scroll tick drive every
       scroll-linked effect. A scene is measured only while it is near the viewport (measuring one
       inside a content-visibility:auto section would force that section to lay out), every read
       happens before any write, and scenes write only transforms, opacity and leaf custom
       properties. Progress follows the scroll position 1:1, with no smoothing, so nothing trails
       behind the visitor and scrolling back up replays everything in reverse. */
    var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
    var range = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };
    var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
    var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var px = function (v) { return v.toFixed(1) + "px"; };
    var move = function (el, x, y, extra) {
        if (el) el.style.transform = "translate3d(" + px(x) + "," + px(y) + ",0)" + (extra || "");
    };
    var onResizeFns = [];
    var settleFns = [];   // run once scrolling pauses (see initScroll)

    /* Anything that masks content plays to the end once it is in view, and only resets after it
       has left the screen again below. Scrubbing is kept for the sculpture; content never stays
       half-revealed when the visitor pauses or jumps to an anchor. */
    function membraneAt(el, top, vh) {
        if (!el.classList.contains("has-membrane")) el.classList.add("has-membrane");
        if (top < vh * 0.88 && !el.classList.contains("is-in")) {
            el.classList.add("is-in");
            window.clearTimeout(el._open);
            el._open = window.setTimeout(function () { el.classList.add("is-open"); }, 1250);
        } else if (top > vh && el.classList.contains("is-in")) {
            window.clearTimeout(el._open);
            el.classList.remove("is-in", "is-open");
        }
    }
    function membraneOff(el) {
        window.clearTimeout(el._open);
        el.classList.remove("has-membrane", "is-in", "is-open");
    }

    var scrolling = false;
    function initScroll() {
        var header = $("#site-header");
        var bar = $(".scroll-progress span");
        var ticking = false;
        var vw = 0, vh = 0, wide = false;
        var scenes = [];
        var near = [];

        // A scene: `el` is watched, and `write(p, rect, y, still)` runs while it is near the viewport.
        // p runs 0 -> 1 while the element crosses the viewport (enters at the bottom, leaves at the top).
        // `essential` scenes (progress indicators) keep running when reduced motion is on.
        function scene(el, write, opts) {
            if (!el) return;
            opts = opts || {};
            scenes.push({ el: el, write: write, measure: opts.measure !== false, essential: !!opts.essential, reset: opts.reset });
        }

        function lit(el, on) {
            if (el.classList.contains("is-lit") !== on) el.classList.toggle("is-lit", on);
        }

        /* --- Hero: the opening scene and its exit --- */
        var hero = $(".hero");
        if (hero) {
            var head = $(".hero__head", hero);
            var lines = $$(".hero__title .mask", hero);
            var echo = $(".hero__echo", hero);
            var sculpture = $("#sculpture");
            var spin = $("#sculpture-spin");
            var hud = $(".hud", hero);
            var sticker = $(".sticker", hero);
            var mesh = $(".mesh", hero);
            var cue = $(".scroll-cue", hero);
            var heroH = 1;
            var heroParts = [hero, head, echo, spin, hud, sticker, mesh].concat(lines);
            var letters = [];
            // One letter of the name: offset in em, rotation, vertical stretch
            var letterAt = function (el, x, y, r, sy) {
                if (!el) return;
                el.style.translate = x || y ? x.toFixed(3) + "em " + y.toFixed(3) + "em" : "";
                el.style.rotate = r ? r.toFixed(2) + "deg" : "";
                el.style.scale = sy !== 1 ? "1 " + sy.toFixed(3) : "";
            };
            var bump = function (p, a, b) { return Math.sin(Math.PI * range(p, a, b)); };

            scene(hero, function (_, __, y, still) {
                var p = clamp(y / heroH, 0, 1);
                if (cue) cue.style.setProperty("--hero-p", p.toFixed(3));
                if (still) return;
                var k = wide ? 1 : 0.55;
                // The name's two lines part like a curtain from the first scroll, while the name is
                // still on screen; the outline echo behind them stays on a deeper, slower layer.
                var split = easeOut(range(p, 0, 0.38)) * vw * 0.06 * k;
                move(head, 0, -y * 0.05 * k);
                if (head) head.style.opacity = (1 - range(p, 0.25, 0.7) * 0.8).toFixed(3);
                move(lines[0], -split, 0);
                move(lines[1], split, 0);
                move(echo, split * 0.35, y * 0.24 * k);
                if (echo) echo.style.opacity = (1 - range(p, 0.05, 0.55)).toFixed(3);
                // The sculpture is the background: it lags, then turns away as the page moves on
                if (sculpture) sculpture.style.translate = "0 " + px(y * 0.12 * k);
                var turn = easeInOut(range(p, 0, 0.9));
                if (spin) spin.style.transform = "rotateY(" + (turn * 38 * k).toFixed(2) + "deg) rotateX(" + (-turn * 12 * k).toFixed(2) + "deg)";
                // Glass panels and labels are closest to the viewer, so they travel fastest
                move(hud, -p * 24 * k, -y * 0.2 * k);
                move(sticker, -p * 36 * k, -y * 0.3 * k, " rotate(" + (-p * 14).toFixed(2) + "deg)");
                move(mesh, 0, y * 0.3);
                // The typographic incident: four letters come loose from the name — one lifts off the
                // baseline, one sinks, one stretches, one turns to outline — then fall back into line
                if (!letters.length) letters = $$(".hero__title .letter", hero);
                if (letters.length > 9) {
                    var n1 = bump(p, 0.01, 0.17), d1 = bump(p, 0.03, 0.2), i1 = bump(p, 0.05, 0.24), y1 = bump(p, 0.04, 0.26);
                    letterAt(letters[1], 0.05 * n1, -0.16 * n1, -10 * n1, 1);
                    letterAt(letters[4], 0.1 * d1, 0.09 * d1, 7 * d1, 1);
                    letterAt(letters[7], 0, 0, 0, 1 + 0.34 * i1);
                    letterAt(letters[9], 0.06 * y1, 0, -4 * y1, 1);
                    if (letters[9].classList.contains("is-hollow") !== y1 > 0.3) letters[9].classList.toggle("is-hollow", y1 > 0.3);
                }
                // As About arrives, the whole opening folds back into depth along the top of the screen
                var fold = easeInOut(range(p, 0.3, 1));
                hero.style.transform = fold > 0.001 ? "perspective(1600px) rotateX(" + (-fold * 24 * k).toFixed(2) + "deg) scale(" + (1 - fold * 0.06).toFixed(4) + ")" : "";
            }, {
                measure: false,
                essential: true,
                reset: function () {
                    heroParts.forEach(function (el) { if (el) { el.style.transform = ""; el.style.opacity = ""; } });
                    if (sculpture) sculpture.style.translate = "";
                    letters.forEach(function (l) { letterAt(l, 0, 0, 0, 1); l.classList.remove("is-hollow"); });
                }
            });
            onResizeFns.push(function () { heroH = hero.offsetHeight || 1; });
        }

        /* --- Scroll-linked type bands, alternating direction --- */
        $$("[data-band]").forEach(function (b, i) {
            var track = $(".band__track", b) || b;
            var dir = i % 2 ? 1 : -1;
            scene(b, function (p) {
                var q = clamp(p, -0.2, 1.2);
                track.style.transform = "translate3d(" + px(dir * (q * 480) - (dir > 0 ? 480 : 0)) + ",0,0)";
            }, { reset: function () { track.style.transform = ""; } });
        });

        /* --- About: the outline word fills in; the heading opens through a glass-membrane mask --- */
        var about = $("#about");
        if (about) {
            var mega = $(".mega", about);
            var membrane = $("[data-membrane]", about);
            var tOff = null;
            onResizeFns.push(function () { tOff = null; });
            scene(about, function (p, r) {
                var k = wide ? 1 : 0.6;
                if (mega) {
                    mega.style.setProperty("--fill", (range(p, 0.12, 0.42) * 100).toFixed(1) + "%");
                    move(mega, (0.3 - p) * 160 * k, 0);
                }
                if (membrane) {
                    if (tOff === null) tOff = membrane.getBoundingClientRect().top - r.top;
                    membraneAt(membrane, r.top + tOff, vh);
                }
            }, {
                reset: function () {
                    if (mega) { mega.style.transform = ""; mega.style.removeProperty("--fill"); }
                    if (membrane) membraneOff(membrane);
                }
            });
        }

        /* --- Skills: a bus line runs down the stack and lights each layer as it reaches it --- */
        var layersEl = $("#stack-layers");
        if (layersEl) {
            var layerEls = $$(".layer", layersEl);
            scene(layersEl, function (p, r) {
                var prog = clamp((vh * 0.62 - r.top) / r.height, 0, 1);
                layersEl.style.setProperty("--spine", prog.toFixed(4));
                var reach = prog * r.height;
                layerEls.forEach(function (l) { lit(l, reach >= l.offsetTop + 24); });
            }, { essential: true });
        }

        /* --- Experience: the line draws itself; a comet rides its tip and lights each milestone --- */
        var timeline = $(".timeline");
        if (timeline) {
            var comet = $(".timeline__comet");
            var jobs = $$(".job", timeline);
            var jobBox = null;
            onResizeFns.push(function () { jobBox = null; });
            scene(timeline, function (p, r, y, still) {
                var prog = clamp((vh * 0.7 - r.top) / r.height, 0, 1);
                timeline.style.setProperty("--progress", prog.toFixed(4));
                var reach = prog * r.height;
                if (!jobBox) jobBox = jobs.map(function (j) { return [j.offsetTop, Math.min(j.offsetHeight, 460)]; });
                jobs.forEach(function (j, i) {
                    var on = reach >= jobBox[i][0] + 4;
                    lit(j, on);
                    if (still) return;
                    // When the line reaches a milestone its frame opens from the rail side and plays
                    // to the end (a CSS transition on --jk); it closes again only when scrolled back past
                    // (it opens once the card is well on screen, so a card never waits hidden in view)
                    if (!j.classList.contains("has-k")) j.classList.add("has-k");
                    var top = r.top + jobBox[i][0], shown = j.classList.contains("is-shown");
                    if (!shown && top < vh * 0.95) {
                        j.classList.add("is-shown");
                        window.clearTimeout(j._framed);
                        j._framed = window.setTimeout(function () { j.classList.add("is-framed"); }, 1000);
                    } else if (shown && top > vh) {
                        window.clearTimeout(j._framed);
                        j.classList.remove("is-shown", "is-framed");
                    }
                });
                if (comet && !still) {
                    move(comet, 0, reach);
                    comet.style.opacity = prog > 0.002 && prog < 0.998 ? "1" : "0";
                }
            }, {
                essential: true,
                reset: function () { jobs.forEach(function (j) { window.clearTimeout(j._framed); j.classList.remove("has-k", "is-shown", "is-framed"); }); }
            });
        }

        /* --- Projects: frames swing into view, flatten at centre stage, and tip away as they leave --- */
        $$(".case").forEach(function (c) {
            var lens = $(".case__lens", c);
            var no = $(".case__no", c);
            var flip = c.classList.contains("case--flip");
            var stack = c.classList.contains("case--stack");
            scene(c, function (p) {
                var t = clamp(p, 0, 1);
                var arrive = 1 - easeOut(range(t, 0.06, 0.5));
                var leave = range(t, 0.62, 1);
                if (no) {
                    no.style.setProperty("--fill", (range(t, 0.14, 0.42) * 100).toFixed(1) + "%");
                    move(no, 0, (t - 0.5) * -90 * (wide ? 1 : 0.5));
                }
                if (!lens) return;
                var ry = 0, rx, ly = 0;
                if (!wide) {
                    rx = 9 * arrive;
                } else if (stack) {
                    rx = 4 + 12 * arrive - 4 * leave;
                    ly = (0.5 - t) * 50;
                } else {
                    ry = (flip ? 1 : -1) * (4 + 16 * arrive - 3 * leave);
                    rx = 3 + 6 * arrive - 5 * leave;
                    ly = (0.5 - t) * 60;
                }
                lens.style.setProperty("--ry", ry.toFixed(2) + "deg");
                lens.style.setProperty("--rx", rx.toFixed(2) + "deg");
                lens.style.setProperty("--ly", px(ly));
            }, {
                reset: function () {
                    if (no) { no.style.transform = ""; no.style.removeProperty("--fill"); }
                    if (lens) ["--ry", "--rx", "--ly"].forEach(function (k) { lens.style.removeProperty(k); });
                }
            });

            var kind = Object.keys(CASE_MASKS).filter(function (k) { return c.classList.contains(k); })[0];
            var frame = $(".case__frame", c), title = $(".case__title", c), words = [];
            if (!kind) return;
            // Measured on the frame's untransformed container: the lens tilts with the scroll (it would
            // lag a frame behind) and Chrome reports a fully clipped element as off-screen
            // While scrolling, the opening follows the scroll; when the visitor pauses with the frame
            // part-open, it settles fully open (and stays open until it has left the screen below)
            var settled = false, settleT = 0;
            if (frame && lens) scene(lens.parentElement, function (p, r) {
                if (!c.classList.contains("is-scrolly")) c.classList.add("is-scrolly");
                if (r.top > vh && settled) { settled = false; window.clearTimeout(settleT); c.classList.remove("is-settled", "is-settling"); }
                var o = caseOpen(r.top, vh);
                if (!settled && !scrolling && o < 1 && r.top < vh - 1) {
                    settled = true;
                    c.classList.add("is-settled", "is-settling");
                    frame.style.clipPath = casePoly(CASE_MASKS[kind](1));
                    frame.style.setProperty("--o", "1");
                    settleT = window.setTimeout(function () { c.classList.remove("is-settling"); frame.style.clipPath = "none"; }, 750);
                    return;
                }
                if (settled) return;
                frame.style.clipPath = o >= 1 ? "none" : casePoly(CASE_MASKS[kind](o));
                frame.style.setProperty("--o", o.toFixed(3));
                frame.style.setProperty("--edge", Math.sin(Math.PI * range(o, 0.3, 1)).toFixed(3));
            }, {
                reset: function () {
                    settled = false;
                    window.clearTimeout(settleT);
                    c.classList.remove("is-scrolly", "is-settled", "is-settling");
                    frame.style.clipPath = "";
                    frame.style.removeProperty("--o");
                    frame.style.removeProperty("--edge");
                }
            });
            // Each title has its own entrance, armed while it is below the screen and played once in
            // view (styles in "Cinematic pass"): the order platform's words close ranks like channels
            // converging, the pipeline's step up in discrete stages, the gateway's stay an outline
            // until let through
            if (title) scene(title, function (p, r) {
                if (!words.length) {
                    words = $$(".w", title);
                    words.forEach(function (w, i) { w.style.setProperty("--wo", (i - (words.length - 1) / 2).toFixed(2)); w.style.setProperty("--wn", i); });
                }
                if (r.top > vh && !title.classList.contains("is-armed")) title.classList.add("is-armed");
                else if (r.top < vh * 0.9 && title.classList.contains("is-armed")) title.classList.remove("is-armed");
            }, { reset: function () { title.classList.remove("is-armed"); } });
        });

        // Track which scenes are near the viewport
        if ("IntersectionObserver" in window) {
            var nio = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    var i = near.indexOf(e.target);
                    if (e.isIntersecting && i < 0) near.push(e.target);
                    if (!e.isIntersecting && i > -1) near.splice(i, 1);
                });
                request();
            }, { rootMargin: "160px 0px" });
            scenes.forEach(function (s) { nio.observe(s.el); });
        } else {
            near = scenes.map(function (s) { return s.el; });
        }

        var wasStill = reduceMotion.matches;
        function update() {
            ticking = false;
            var still = reduceMotion.matches;
            if (still !== wasStill) {
                wasStill = still;
                if (still) scenes.forEach(function (s) { if (s.reset) s.reset(); });
            }
            // Read everything first …
            var y = window.scrollY;
            var max = doc.scrollHeight - vh;
            var active = scenes.filter(function (s) { return (s.essential || !still) && near.indexOf(s.el) > -1; });
            var rects = active.map(function (s) { return s.measure ? s.el.getBoundingClientRect() : null; });
            // … then write
            if (bar) bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ")";
            if (header) header.classList.toggle("is-scrolled", y > 12);
            active.forEach(function (s, i) {
                var r = rects[i];
                s.write(r ? (vh - r.top) / (vh + r.height) : 0, r, y, still);
            });
        }

        function request() {
            if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
        }

        function resize() {
            vw = window.innerWidth;
            vh = window.innerHeight;
            wide = vw >= 900;
            onResizeFns.forEach(function (fn) { fn(); });
            request();
        }

        window.addEventListener("scroll", request, { passive: true });
        // Scrolling, or paused? (Synthetic scroll events from the settle step don't count.)
        var idleT = 0;
        window.addEventListener("scroll", function (e) {
            if (!e.isTrusted) return;
            scrolling = true;
            window.clearTimeout(idleT);
            idleT = window.setTimeout(function () {
                scrolling = false;
                request();
                // Let the sculpture and fragment catch up with anything that settled
                window.requestAnimationFrame(function () { window.dispatchEvent(new Event("scroll")); });
            }, 240);
        }, { passive: true });
        window.addEventListener("resize", resize, { passive: true });
        onChange(reduceMotion, request);
        // First measurement in a frame, not synchronously during boot
        window.requestAnimationFrame(resize);
    }

    /* Project frames open from a fragment, each in a shape that fits its subject.
       Shapes are in unit coordinates over the frame (with a margin for its shadow and offset border). */
    var CASE_MASKS = {
        // Three channels, one model: a faceted wedge opens from the corner where the fragment waited
        "case--cyan": function (o) {
            var c = 2 * easeOut(o), b = 0.12 * Math.sin(Math.PI * o);
            var c1 = Math.min(c, 1), c2 = Math.max(c - 1, 0), m = Math.min(c / 2 + b, 1);
            return [[0, 0], [c1, 0], [c1, c2], [m, m], [c2, c1], [0, c1]];
        },
        // A deployment pipeline: four stages are promoted one after another, left to right
        "case--lime": function (o) {
            var h = [0, 1, 2, 3].map(function (i) { return easeOut(range(o, i * 0.16, i * 0.16 + 0.52)); });
            return [[0, 1], [0, 1 - h[0]], [0.25, 1 - h[0]], [0.25, 1 - h[1]], [0.5, 1 - h[1]], [0.5, 1 - h[2]],
                [0.75, 1 - h[2]], [0.75, 1 - h[3]], [1, 1 - h[3]], [1, 1]];
        },
        // A gateway: the frame opens from a centre slit like a checkpoint barrier, top first
        "case--magenta": function (o) {
            var a = 0.5 * easeOut(range(o, 0, 0.75)), b = 0.5 * easeOut(range(o, 0.12, 1));
            return [[0.5 - a, 0], [0.5 + a, 0], [0.5 + b, 1], [0.5 - b, 1]];
        }
    };
    function casePoly(pts) {
        return "polygon(" + pts.map(function (q) { return (-8 + q[0] * 116).toFixed(2) + "% " + (-8 + q[1] * 123).toFixed(2) + "%"; }).join(",") + ")";
    }
    // How far a project frame has opened, from where its top edge is (shared with the fragment)
    function caseOpen(top, vh) { return range((vh - top) / vh, 0.1, 0.62); }

    /* Desktop storytelling for the featured case study: as each part of the write-up
       (problem, architecture, decisions) reaches the middle of the screen, the diagram
       beside it highlights the matching components. */
    function initFeature() {
        var c = $(".case--featured");
        if (!c || !("IntersectionObserver" in window)) return;
        var facts = $$("[data-stage]", c);
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                c.setAttribute("data-stage", e.target.getAttribute("data-stage"));
                facts.forEach(function (f) { f.classList.toggle("is-current", f === e.target); });
            });
        }, { rootMargin: "-42% 0px -48% 0px" });
        facts.forEach(function (f) { io.observe(f); });
    }

    /* ---------------- Living Topology ----------------
       The portfolio's signature: five folded glass ribbons. Each ribbon is a cubic spine with a
       width that twists through zero (that is what folds it). Scroll position picks a scene and
       how far it has progressed; the ribbons' spines, widths and folds are interpolated between
       scene states, so the silhouette really changes shape and every scroll position maps to
       exactly one picture (scrolling back up plays it in reverse).
         Emergence (hero) -> Expansion (about) -> Branching (skills, architecture)
         -> Trajectory (experience) -> Fragmentation (projects) -> Stillness -> Convergence (contact)
       In the hero the shards wake and gather, a contour traces the form, and the blossom folds
       through itself to show its inner surface. One shard is played by #frag (see topoFragment).
       Decorative only: aria-hidden, no pointer events, nothing depends on it. */
    var TOPO_SCENES = [["home", "A"], ["about", "B"], ["skills", "C"], ["architecture", "C"], ["experience", "D"],
        ["projects", "E"], ["decisions", "F"], ["credentials", "F"], ["faq", "F"], ["console", "F"], ["contact", "G"]];

    function topoStates() {
        var C = 500;
        var polar = function (r, deg) { var a = deg * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
        var J = [0, 9, -6, 14, -11], R = [290, 250, 320, 232, 270], W = [78, 64, 86, 58, 70];
        var straight = function (a, b, bend) {
            var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * bend, ny = dx / l * bend;
            return [a, [a[0] + dx / 3 + nx, a[1] + dy / 3 + ny], [a[0] + 2 * dx / 3 - nx, a[1] + 2 * dy / 3 - ny], b];
        };
        var rib = function (spine, w, fold, phase, taper) { return { s: spine, w: w, f: fold, p: phase, t: taper }; };
        var S = {};
        // A — Emergence: a compact folded blossom, asymmetric, with negative space at its heart
        S.A = { r: [], n: [], g: [] };
        // B — Expansion: the folds open, spines stretch and swing, the centre hollows out
        S.B = { r: [], n: [], g: [] };
        for (var i = 0; i < 5; i++) {
            var a = -90 + i * 72 + J[i];
            S.A.r.push(rib([polar(46, a), polar(170, a - 30), polar(R[i] * 0.8, a + 70), polar(R[i], a + 38)], W[i], 1.35, i * 0.12, 0.9));
            S.B.r.push(rib([polar(118, a + 22), polar(270, a - 28), polar(R[i] * 1.22, a + 117), polar(R[i] * 1.46, a + 77)], W[i] * 1.32, 2.15, i * 0.12 + 0.3, 0.85));
        }
        // C — Branching: ribbons thin into paths from a hub to five nodes
        var N = [[500, 500], [168, 250], [826, 186], [876, 650], [430, 884], [128, 640]];
        S.C = { r: [], n: N.map(function (p) { return [p[0], p[1], 1]; }), g: [] };
        for (i = 0; i < 5; i++) S.C.r.push(rib(straight(N[0], N[i + 1], i % 2 ? 26 : -26), 15, 0.6, 0.5, 0.6));
        // D — Trajectory: one purposeful route, milestones at the joins
        var Q = [[560, 36], [372, 228], [628, 430], [392, 640], [612, 826], [500, 984]];
        S.D = { r: [], n: Q.slice(1).map(function (p) { return [p[0], p[1], 0.9]; }).concat([[500, 500, 0]]), g: [] };
        for (i = 0; i < 5; i++) S.D.r.push(rib([Q[i], [Q[i][0], Q[i][1] + 95], [Q[i + 1][0], Q[i + 1][1] - 95], Q[i + 1]], 5, 0, 0, 0.5));
        // E — Fragmentation: the structure breaks into twisted shards around the frame
        var F = [[58, 170], [948, 140], [958, 760], [44, 830], [940, 470]], FA = [80, 110, 260, 100, 290];
        S.E = { r: [], n: [], g: [] };
        for (i = 0; i < 5; i++) S.E.r.push(rib([polar(0, 0).map(function (v, k) { return F[i][k] - 55 * (k ? Math.sin(FA[i] * Math.PI / 180) : Math.cos(FA[i] * Math.PI / 180)); }),
            [F[i][0] - 18, F[i][1] + 14], [F[i][0] + 18, F[i][1] - 14],
            [F[i][0] + 55 * Math.cos(FA[i] * Math.PI / 180), F[i][1] + 55 * Math.sin(FA[i] * Math.PI / 180)]], 34, 0.8, i * 0.2, 1));
        // F — Stillness: the blossom again, folded small (the camera keeps it quiet)
        S.F = { r: S.A.r.map(function (r) { return rib(r.s.map(function (p) { return [C + (p[0] - C) * 0.62, C + (p[1] - C) * 0.62]; }), r.w * 0.62, r.f, r.p, r.t); }), n: [], g: [] };
        // G — Convergence: the ribbons draw the logo — the "A" and its ring
        var M = function (x, y) { return [C + (x - 20) * 22, C + (y - 20) * 22]; };
        var k = 1.3333 * 18.5;
        S.G = { r: [
            rib([M(11, 28), M(13.5, 22.3), M(16, 16.7), M(18.5, 11)], 13, 0, 0, 0.35),
            rib([M(21.5, 11), M(24, 16.7), M(26.5, 22.3), M(29, 28)], 13, 0, 0, 0.35),
            rib([M(14.5, 21), M(18.2, 21), M(21.8, 21), M(25.5, 21)], 11, 0, 0, 0.35),
            rib([M(20, 1.5), M(20 - k, 1.5), M(20 - k, 38.5), M(20, 38.5)], 10, 0, 0, 0.3),
            rib([M(20, 38.5), M(20 + k, 38.5), M(20 + k, 1.5), M(20, 1.5)], 10, 0, 0, 0.3)
        ], n: [], g: [] };
        // Nodes and crystal shards: same count in every state (hidden ones sit at the hub)
        var hub = [C, C, 0];
        ["A", "B", "E", "F", "G"].forEach(function (s) { while (S[s].n.length < 6) S[s].n.push(hub.slice()); });
        while (S.D.n.length < 6) S.D.n.push(hub.slice());
        var shard = function (r, deg, sc, o, spin) { var p = polar(r, deg); return [p[0], p[1], sc, o, spin]; };
        S.A.g = [shard(120, -40, 1, 0.9, 10), shard(150, 60, 0.8, 0.8, 70), shard(96, 170, 0.9, 0.9, -20), shard(160, 230, 0.7, 0.8, 40), shard(70, 300, 0.6, 0.7, 0), shard(190, 120, 0.5, 0.6, 90)];
        S.B.g = [shard(330, -50, 1.2, 0.85, 40), shard(390, 48, 1, 0.7, 110), shard(250, 170, 1.1, 0.9, 10), shard(420, 222, 0.9, 0.7, 80), shard(210, 300, 0.8, 0.6, 30), shard(360, 130, 0.7, 0.6, 140)];
        S.E.g = [[70, 420, 1.5, 0.8, 60], [934, 300, 1.3, 0.75, 200], [56, 640, 1.2, 0.7, 120], [952, 620, 1.4, 0.75, 30], [40, 60, 1, 0.6, 260], [962, 940, 1.1, 0.6, 180]];
        ["C", "D", "F", "G"].forEach(function (s) { S[s].g = S.A.g.map(function (g) { return [C, C, 0.2, 0, g[4]]; }); });
        return S;
    }

    // Where the sculpture sits on screen in each state (desktop / small screens)
    function topoCamera(state, vw, vh, small) {
        var cam = {
            A: small ? [0.5, 0.5, 620, -8, 0.95] : [0.73, 0.5, 1180, -8, 1],
            B: small ? [0.84, 0.28, 400, 24, 0.5] : [0.8, 0.46, 820, 24, 0.6],
            C: small ? [0.9, 0.6, 520, 0, 0.3] : [0.95, 0.62, 760, 0, 0.3],
            D: small ? [0.94, 0.5, 680, 0, 0.3] : [0.9, 0.5, vh * 1.05, 0, 0.42],
            E: small ? [0.5, 0.5, 820, 0, 0.18] : [0.5, 0.5, vw * 1.04, 0, 0.42],
            F: small ? [0.9, 0.14, 210, 40, 0.24] : [0.9, 0.2, 360, 40, 0.3],
            G: small ? [0.86, 0.15, 140, 0, 0.8] : [0.8, 0.32, 200, 0, 1]
        }[state];
        return { x: cam[0] * vw, y: cam[1] * vh, size: cam[2], rot: cam[3], alpha: cam[4] };
    }

    function lerpDeep(a, b, t) {
        if (typeof a === "number") return a + (b - a) * t;
        if (Array.isArray(a)) return a.map(function (v, i) { return lerpDeep(v, b[i], t); });
        var o = {};
        Object.keys(a).forEach(function (k) { o[k] = lerpDeep(a[k], b[k], t); });
        return o;
    }

    function bez(s, t) {
        var u = 1 - t;
        return [u * u * u * s[0][0] + 3 * u * u * t * s[1][0] + 3 * u * t * t * s[2][0] + t * t * t * s[3][0],
            u * u * u * s[0][1] + 3 * u * u * t * s[1][1] + 3 * u * t * t * s[2][1] + t * t * t * s[3][1]];
    }
    function bezD(s, t) {
        var u = 1 - t;
        return [3 * u * u * (s[1][0] - s[0][0]) + 6 * u * t * (s[2][0] - s[1][0]) + 3 * t * t * (s[3][0] - s[2][0]),
            3 * u * u * (s[1][1] - s[0][1]) + 6 * u * t * (s[2][1] - s[1][1]) + 3 * t * t * (s[3][1] - s[2][1])];
    }
    var fx = function (v) { return Math.round(v * 10) / 10; };
    // Closed outline of a folded ribbon: offset the spine by a width that twists through zero
    function ribbonD(r, n) {
        var L = [], Rr = [];
        for (var i = 0; i <= n; i++) {
            var t = i / n, p = bez(r.s, t), d = bezD(r.s, t), l = Math.hypot(d[0], d[1]) || 1;
            var w = r.w * Math.pow(Math.sin(Math.PI * t), r.t) * Math.cos(Math.PI * (r.f * t + r.p));
            var nx = -d[1] / l * w, ny = d[0] / l * w;
            L.push([p[0] + nx, p[1] + ny]);
            Rr.push([p[0] - nx, p[1] - ny]);
        }
        var pts = L.concat(Rr.reverse());
        var d2 = "M" + fx(pts[0][0]) + " " + fx(pts[0][1]);
        for (i = 1; i < pts.length - 1; i++) {
            var m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
            d2 += "Q" + fx(pts[i][0]) + " " + fx(pts[i][1]) + " " + fx(m[0]) + " " + fx(m[1]);
        }
        return d2 + "Z";
    }
    var spineD = function (s) { return "M" + s.map(function (p) { return fx(p[0]) + " " + fx(p[1]); }).join(" ").replace(/^(\S+ \S+) /, "$1C"); };

    // Build the SVG once; the same markup serves the homepage and the case-study emblem
    function topoBuild(svg) {
        var NS = "http://www.w3.org/2000/svg";
        var mk = function (tag, cls, parent) { var e = document.createElementNS(NS, tag); if (cls) e.setAttribute("class", cls); parent.appendChild(e); return e; };
        var g = { rib: [], inner: [], sheen: [], spine: [], light: [], node: [], shard: [] };
        var gR = mk("g", "topo__ribbons", svg), gI = mk("g", "topo__inners", svg), gS = mk("g", "topo__sheens", svg);
        var gP = mk("g", "topo__spines", svg), gL = mk("g", "topo__lights", svg);
        var gN = mk("g", "topo__nodes", svg), gG = mk("g", "topo__shards", svg);
        for (var i = 0; i < 5; i++) {
            var r = mk("path", "topo__rib topo__rib--" + i, gR);
            r.setAttribute("pathLength", "1");
            g.rib.push(r);
            g.inner.push(mk("path", "topo__inner", gI));
            g.sheen.push(mk("path", "topo__sheen", gS));
            g.spine.push(mk("path", "topo__spine", gP));
            var l = mk("path", "topo__light", gL);
            l.setAttribute("pathLength", "1");
            g.light.push(l);
        }
        for (i = 0; i < 6; i++) { var c = mk("circle", "topo__node", gN); c.setAttribute("r", "7"); g.node.push(c); }
        for (i = 0; i < 6; i++) { var sh = mk("polygon", "topo__shard", gG); sh.setAttribute("points", "0,-22 15,10 -11,16"); g.shard.push(sh); }
        return g;
    }
    // `inner`: also draw the inner surface (only the hero's fold shows it)
    function topoPaint(g, st, n, inner) {
        st.r.forEach(function (r, i) {
            var d = ribbonD(r, n);
            g.rib[i].setAttribute("d", d);
            if (inner) g.inner[i].setAttribute("d", d);
            g.sheen[i].setAttribute("d", d);
            var sd = spineD(r.s);
            g.spine[i].setAttribute("d", sd);
            g.light[i].setAttribute("d", sd);
        });
        st.n.forEach(function (p, i) {
            g.node[i].setAttribute("cx", fx(p[0]));
            g.node[i].setAttribute("cy", fx(p[1]));
            g.node[i].style.opacity = p[2].toFixed(3);
        });
        st.g.forEach(function (s, i) {
            g.shard[i].setAttribute("transform", "translate(" + fx(s[0]) + " " + fx(s[1]) + ") rotate(" + fx(s[4]) + ") scale(" + s[2].toFixed(3) + ")");
            g.shard[i].style.opacity = s[3].toFixed(3);
        });
    }

    // The impossible fold: the blossom twists against itself (inner points turn one way, outer
    // points the other) while its folds roll over, so the silhouette changes and the inner
    // surface shows. Works on a fresh copy of the state.
    function topoFold(st, fold) {
        if (!fold) return st;
        st.r.forEach(function (r) {
            r.p += fold * 0.55;
            r.s = r.s.map(function (pt) {
                var dx = pt[0] - 500, dy = pt[1] - 500, a = fold * (Math.hypot(dx, dy) / 300 - 0.55) * 1.05;
                var c = Math.cos(a), sn = Math.sin(a);
                return [500 + dx * c - dy * sn, 500 + dx * sn + dy * c];
            });
        });
        return st;
    }
    // The awakening: as scrolling begins the shards tremble (keyed to the scroll position, so it is
    // repeatable), then drift towards one another
    function topoWake(st, f, y) {
        var wake = range(f, 0, 0.05) * (1 - range(f, 0.16, 0.26));
        var gather = Math.sin(Math.PI * range(f, 0.04, 0.3)) * 0.3;
        st.g.forEach(function (s, i) {
            s[0] = 500 + (s[0] - 500) * (1 - gather) + wake * 6 * Math.sin(y * 0.31 + i * 1.9);
            s[1] = 500 + (s[1] - 500) * (1 - gather) + wake * 6 * Math.cos(y * 0.27 + i * 2.3);
        });
        return st;
    }
    // A point in the sculpture's own coordinates -> the screen, through the camera
    function topoToScreen(cam, p) {
        var s = cam.size / 1000, a = cam.rot * Math.PI / 180, dx = (p[0] - 500) * s, dy = (p[1] - 500) * s;
        return [cam.x + dx * Math.cos(a) - dy * Math.sin(a), cam.y + dx * Math.sin(a) + dy * Math.cos(a)];
    }

    // A ribbon along a gently bent line from a to b (sculpture coordinates)
    function topoLine(a, b, bend, w, f, p, t) {
        var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * bend, ny = dx / l * bend;
        return { s: [a, [a[0] + dx / 3 + nx, a[1] + dy / 3 + ny], [a[0] + 2 * dx / 3 + nx, a[1] + 2 * dy / 3 + ny], b], w: w, f: f, p: p || 0, t: t == null ? 0.6 : t };
    }
    function topoState(r, n) {
        n = n.slice();
        while (n.length < 6) n.push([500, 500, 0]);
        return { r: r, n: n, g: [0, 1, 2, 3, 4, 5].map(function () { return [500, 500, 0.2, 0, 0]; }) };
    }

    /* Sequence B: around each project the ribbons assemble into a frame of their own, built for its
       subject. Sculpture units: the visual spans 150..850 across; its height follows its aspect. */
    function topoFrameState(kind, aspect, mirror) {
        var hy = 350 * clamp(aspect, 0.3, 1.2), L = 124, R = 876, T = 474 - hy, B = 526 + hy;
        var edge = function (a, b, w, f) { return topoLine(a, b, 0, w || 9, f || 0.25, 0, 0.22); };
        var st;
        if (kind === "case--lime") {
            // A pipeline: four stages promoted in turn beneath the visual, the release line above it
            var r = [0, 1, 2, 3].map(function (k) { return edge([L + k * 188 + 10, B + 64 - k * 22], [L + (k + 1) * 188 - 10, B + 64 - k * 22], 11, 0.15); });
            r.push(edge([L, T], [R, T]));
            st = topoState(r, [0, 1, 2, 3].map(function (k) { return [L + (k + 1) * 188 - 10, B + 64 - k * 22, k === 2 ? 1 : 0.7]; }));
        } else if (kind === "case--magenta") {
            // A gateway: two pillars and a lintel; the request comes in on the left, the answer leaves right
            // (kept tight to the visual: the pillars hug its sides and the answer drops away beneath it)
            st = topoState([edge([L - 4, T], [L - 4, B + 50], 15, 0.2), edge([R + 4, T], [R + 4, B + 50], 15, 0.2),
                edge([L - 40, T], [R + 40, T], 10), topoLine([L - 330, 470], [L - 4, 470], 30, 11, 1.4, 0.2, 0.8),
                topoLine([R + 4, 540], [R - 180, B + 230], 70, 11, 1.4, 0.2, 0.8)], [[L - 4, 470, 1], [R + 4, 540, 1]]);
        } else {
            // Many channels, one model: two channels sweep in and converge on the visual's left edge
            st = topoState([edge([L - 30, T], [R + 30, T]), edge([R + 30, B], [L - 30, B]), edge([R, T - 30], [R, B + 30]),
                topoLine([L - 320, T - 50], [L, 500], 60, 12, 1.2, 0.2, 0.8), topoLine([L - 320, B + 50], [L, 500], -60, 12, 1.2, 0.2, 0.8)],
                [[L, 500, 1], [L - 320, T - 50, 0.8], [L - 320, B + 50, 0.8]]);
        }
        st.g = [[L, T], [R, T], [R, B], [L, B], [L, 500], [R, 500]].map(function (q) { return [q[0], q[1], 0.3, 0, 0]; });
        // A visual on the right of the screen gets its arrivals from the right, away from the text
        if (mirror) {
            var mx = function (q) { return [1000 - q[0], q[1]].concat(q.slice(2)); };
            st.r.forEach(function (r) { r.s = r.s.map(mx); });
            st.n = st.n.map(mx);
            st.g = st.g.map(mx);
        }
        return st;
    }
    // Where the sculpture is through the gallery: assembled around the project nearest the middle of
    // the screen, falling apart into fragments between projects, re-forming around the next
    function topoProjects(S, rects, kinds, vw, vh, small, after, camAfter) {
        var camE = topoCamera("E", vw, vh, small), vc = vh / 2, n = rects.length;
        var smooth = function (t) { return t * t * (3 - 2 * t); };
        var cams = rects.map(function (r) { return { x: r.left + r.width / 2, y: r.top + r.height / 2, size: r.width / 0.7, rot: 0, alpha: small ? 0.36 : 0.62 }; });
        var shape = function (i) { return topoFrameState(kinds[i], rects[i].height / rects[i].width, cams[i].x > vw * 0.55); };
        var a, A, B, CA, CB, key;
        if (vc <= cams[0].y) {
            a = smooth(range((vh * 1.1 - cams[0].y) / (vh * 0.6), 0, 1)); A = S.E; CA = camE; B = shape(0); CB = cams[0]; key = "in";
        } else if (vc >= cams[n - 1].y) {
            a = smooth(range((vc - cams[n - 1].y) / (vh * 0.6), 0, 1)); A = shape(n - 1); CA = cams[n - 1]; B = after; CB = camAfter; key = "out";
        } else {
            var i = 0;
            while (vc > cams[i + 1].y) i++;
            var u = (vc - cams[i].y) / (cams[i + 1].y - cams[i].y);
            if (u < 0.5) { a = smooth(range(u, 0.28, 0.5)); A = shape(i); CA = cams[i]; B = S.E; CB = camE; key = i + "r"; }
            else { a = smooth(range(u, 0.5, 0.72)); A = S.E; CA = camE; B = shape(i + 1); CB = cams[i + 1]; key = (i + 1) + "a"; }
        }
        return { st: lerpDeep(A, B, a), cam: lerpDeep(CA, CB, a), key: key + a.toFixed(3) + rects.map(function (r) { return (r.height / r.width).toFixed(2); }).join() };
    }

    /* Case studies: each project has its own sculpture beside the story, changing with how far the
       visitor has read. A metaphor for the documented architecture, not a diagram of it. */
    function caseSculptureStates(kind) {
        var R = topoLine, st = topoState;
        if (kind === "lime") {
            var step = function (k) { return R([140 + k * 170, 780 - k * 120], [290 + k * 170, 780 - k * 120], 0, 18, 0.15, 0, 0.25); };
            return [
                // manual releases: steps drift apart, and one change rolls back
                st([R([120, 240], [360, 420], 90, 22, 2, 0.3), R([480, 180], [560, 460], -70, 20, 1.7, 0.5), R([200, 640], [440, 560], 60, 22, 2.4, 0.1), R([620, 620], [860, 720], -80, 20, 1.9, 0.7), R([760, 420], [640, 260], 50, 18, 1.5, 0.2)], []),
                // the stages assemble: build and test first
                st([step(0), step(1), R([520, 420], [700, 300], 60, 18, 1.2, 0.3), R([620, 620], [860, 700], -60, 18, 1.4, 0.6), R([760, 380], [680, 240], 40, 16, 1, 0.2)], [[290, 780, 1], [460, 660, 1]]),
                // environments from templates; production waits at an approval gate
                st([step(0), step(1), step(2), R([712, 300], [728, 170], 0, 14, 0.2, 0, 0.3), R([840, 420], [880, 300], 20, 16, 1, 0.2)], [[290, 780, 1], [460, 660, 1], [630, 540, 1], [720, 300, 1]]),
                // released: every stage in line
                st([step(0), step(1), step(2), step(3), R([810, 300], [900, 300], 0, 10, 0.2, 0, 0.3)], [[290, 780, 1], [460, 660, 1], [630, 540, 1], [800, 420, 1], [900, 300, 1]])
            ];
        }
        if (kind === "magenta") return [
            // a label request arrives at the gateway
            st([R([60, 500], [380, 500], 20, 16, 0.6, 0.2), R([440, 240], [440, 760], 0, 22, 0.25, 0, 0.2), R([560, 240], [560, 760], 0, 22, 0.25, 0, 0.2), R([700, 420], [760, 420], 0, 8, 0.3, 0), R([700, 580], [760, 580], 0, 8, 0.3, 0)], [[380, 500, 1]]),
            // checked at the door (token, scope, rate limit): the gateway closes on it
            st([R([60, 500], [500, 500], 0, 16, 2.2, 0.2), R([470, 260], [470, 740], 0, 24, 0.25, 0, 0.2), R([530, 260], [530, 740], 0, 24, 0.25, 0, 0.2), R([700, 420], [760, 420], 0, 8, 0.3, 0), R([700, 580], [760, 580], 0, 8, 0.3, 0)], [[500, 500, 1]]),
            // routed to the right carrier
            st([R([60, 500], [900, 500], 0, 14, 0.5, 0.2), R([430, 240], [430, 760], 0, 20, 0.25, 0, 0.2), R([570, 240], [570, 760], 0, 20, 0.25, 0, 0.2), R([570, 500], [900, 250], -40, 12, 0.5, 0.1), R([570, 500], [900, 750], 40, 12, 0.5, 0.1)], [[900, 250, 1], [900, 500, 1], [900, 750, 1], [500, 500, 0.6]]),
            // and the answer comes back the same way
            st([R([60, 500], [900, 500], 0, 10, 0.3, 0.2), R([430, 240], [430, 760], 0, 20, 0.25, 0, 0.2), R([570, 240], [570, 760], 0, 20, 0.25, 0, 0.2), R([570, 500], [900, 250], -40, 8, 0.3, 0.1), R([900, 560], [60, 600], -60, 14, 1.2, 0.5)], [[900, 250, 0.6], [900, 500, 1], [900, 750, 0.6], [60, 600, 1]])
        ];
        return [
            // channels out of step: three twisted feeds that never meet
            st([R([90, 180], [380, 300], 70, 26, 1.8, 0.2), R([60, 520], [360, 470], -60, 24, 2.2, 0.6), R([110, 820], [390, 700], 80, 26, 1.6, 0.4), R([560, 440], [620, 560], 30, 12, 0.6, 0), R([720, 500], [780, 520], 0, 8, 0.3, 0)], [[380, 300, 0.5], [360, 470, 0.5], [390, 700, 0.5]]),
            // the signals converge on one integration layer
            st([R([90, 180], [500, 500], 40, 16, 0.8, 0.2), R([60, 520], [500, 500], -20, 16, 0.8, 0.2), R([110, 820], [500, 500], -40, 16, 0.8, 0.2), R([500, 500], [640, 500], 0, 22, 1.2, 0, 0.4), R([640, 500], [700, 500], 0, 10, 0.3, 0)], [[500, 500, 1], [90, 180, 0.6], [60, 520, 0.6], [110, 820, 0.6]]),
            // normalised once, in one place
            st([R([200, 300], [500, 500], 20, 10, 0.4, 0.2), R([180, 500], [500, 500], 0, 10, 0.4, 0.2), R([200, 700], [500, 500], -20, 10, 0.4, 0.2), R([500, 500], [700, 500], 0, 30, 2, 0, 0.35), R([700, 500], [760, 500], 0, 12, 0.3, 0)], [[500, 500, 1], [700, 500, 1]]),
            // and every channel shows the same inventory
            st([R([200, 320], [500, 500], 20, 9, 0.3, 0.2), R([200, 680], [500, 500], -20, 9, 0.3, 0.2), R([620, 500], [900, 260], -30, 14, 0.5, 0.1), R([620, 500], [930, 500], 0, 14, 0.5, 0.1), R([620, 500], [900, 740], 30, 14, 0.5, 0.1)], [[500, 500, 1], [620, 500, 1], [900, 260, 1], [930, 500, 1], [900, 740, 1]])
        ];
    }
    function initCaseSculpture() {
        var cs = $(".cs"), story = $(".cs-story"), hero = $(".cs-hero"), nav = $(".cs-nav"), chapters = $$(".cs-story .chapter");
        var kind = cs && ["cyan", "lime", "magenta"].filter(function (k) { return cs.classList.contains("cs--" + k); })[0];
        if (!kind || !story || !nav || reduceMotion.matches) return;
        var host = document.createElement("div");
        host.className = "topo topo--case";
        host.setAttribute("aria-hidden", "true");
        host.setAttribute("data-scene", "C");   // signals run along its paths
        host.innerHTML = '<svg viewBox="0 0 1000 1000" width="1000" height="1000" focusable="false"></svg>';
        document.body.insertBefore(host, $("main"));
        var g = topoBuild($("svg", host)), states = caseSculptureStates(kind), wideQ = window.matchMedia("(min-width: 1100px)");
        var last = "", ticking = false, heroH = hero ? hero.offsetHeight : 1;
        function frame() {
            ticking = false;
            var vh = window.innerHeight, vw = window.innerWidth, r = story.getBoundingClientRect();
            var p = clamp((vh * 0.5 - r.top) / (r.height || 1), 0, 1), s = p * 3, i = Math.min(Math.floor(s), 2);
            var t = range(s - i, 0.35, 0.85);
            t = t * t * (3 - 2 * t);
            var key = i + ":" + t.toFixed(3);
            if (key !== last) { last = key; topoPaint(g, lerpDeep(states[i], states[i + 1], t), 30); }
            host.style.setProperty("--light", (-p * 3).toFixed(4));
            if (!wideQ.matches) {
                // Phones: no spare column, so it becomes each chapter's emblem, beside the chapter's
                // number as the heading arrives, in the state for that point of the story
                var best = null, bd = 1e9;
                chapters.forEach(function (c) {
                    var top = c.getBoundingClientRect().top, d = Math.abs(top - vh * 0.3);
                    if (top > -vh * 0.5 && top < vh && d < bd) { bd = d; best = top; }
                });
                var sz = Math.min(vw * 0.62, 280);
                if (best === null) { host.style.opacity = "0"; return; }
                host.style.transform = "translate3d(" + px(vw - sz * 0.38 - 500) + "," + px(best + 120 - 500) + ",0) scale(" + (sz / 1000).toFixed(4) + ")";
                host.style.opacity = (0.6 * range(best + 120, -40, 140) * (1 - range(best, vh * 0.8, vh))).toFixed(3);
                return;
            }
            var nr = nav.getBoundingClientRect();
            // It lives in the empty column beneath the sticky chapter list, never behind the text,
            // and bows out before the footer
            var free = vh - nr.bottom, size = Math.min(nr.width * 1.3, free * 1.05);
            host.style.transform = "translate3d(" + px(nr.left + nr.width / 2 - 500) + "," + px(nr.bottom + free / 2 - 500) + ",0) scale(" + (Math.max(size, 1) / 1000).toFixed(4) + ")";
            host.style.opacity = (0.8 * range(free, 160, 320) * range(window.scrollY / heroH, 0.35, 0.9) * range(r.bottom / vh, 0.55, 0.85)).toFixed(3);
        }
        function request() { if (!ticking) { ticking = true; window.requestAnimationFrame(frame); } }
        window.addEventListener("scroll", request, { passive: true });
        window.addEventListener("resize", function () { heroH = hero ? hero.offsetHeight : 1; request(); }, { passive: true });
        request();
    }


    /* The fragment: one shard of the sculpture with a mind of its own. Three appearances, all set
       by the scroll position, so scrolling back replays them in reverse:
         hero     — trembles with the others, pulls back, then escapes off the right edge
         about    — re-enters from the left, overshoots its place, pauses, settles as a new shape
                    (the section label is tugged along as it passes, then snaps back)
         projects — arrives early at the first project's frame and waits; the frame opens from it
         contact  — returns, is pushed back once by the monogram, then slots in as its keystone */
    var FRAG_TRI = [[0, -22], [15, 10], [2, 13], [-11, 16]];
    var FRAG_KITE = [[0, -24], [13, -3], [0, 15], [-12, -3]];
    var FRAG_KEY = [[0, -15], [10, 0], [0, 15], [-10, 0]];
    var qbez = function (a, c, b, t) { var u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; };
    var mix2 = function (a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
    var easeOutBack = function (x) { return 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2); };
    var capLen = function (v, max) { var l = Math.hypot(v[0], v[1]); return l > max ? [v[0] / l * max, v[1] / l * max] : v; };

    function topoFragment() {
        var el = $("#frag");
        if (!el) return null;
        var body = $(".frag__body", el), facet = $(".frag__facet", el);
        var head = $("#about .about__head"), kicker = head && $(".kicker", head);
        var frame = $(".case--featured .case__side");   // the frame's untransformed container
        var archNode = $('#arch-stage [data-node="functions"]'), archStage = $("#arch-stage");
        var hud = $(".hud p");
        var lastFrag = "", lastKick = "", lastReport = "";

        // The hero's HUD notices the escape
        function report(text, state) {
            if (!hud || text === lastReport) return;
            lastReport = text;
            var node = hud.lastChild;
            if (!node || node.nodeType !== 3) { node = document.createTextNode(""); hud.appendChild(node); }
            node.textContent = text;
            hud.setAttribute("data-state", state || "");
        }

        return {
            read: function (cur) {
                return {
                    head: cur === 1 && head ? head.getBoundingClientRect() : null,
                    arch: cur === 3 && archNode && archStage.hasAttribute("data-layout") ? archNode.getBoundingClientRect() : null,
                    frame: cur === 5 && frame ? frame.getBoundingClientRect() : null,
                    settled: cur === 5 && frame ? frame.closest(".case").classList.contains("is-settled") : false
                };
            },
            write: function (c, rd) {
                var cur = c.current, f = c.f, cam = c.cam, vw = c.vw, vh = c.vh, sm = c.small;
                var slot = c.st.g[2], sc = cam.size / 1000, home = topoToScreen(cam, slot);
                var o = { p: home, r: cam.rot + slot[4], s: slot[2] * sc, shape: FRAG_TRI, op: 0, glow: 0 };
                var kick = null;

                if (cur === 0) {
                    // Pulls back, then slips out of the composition and off the right edge
                    var pull = Math.sin(Math.PI * range(f, 0.14, 0.24)) * 0.06;
                    // (the exit is in screen space, so it stays in view while the hero scrolls away)
                    var go = range(f, 0.22, 0.56), out = [vw + 80, vh * 0.34];
                    var p0 = qbez(home, [home[0] + vw * 0.12, Math.max(home[1], vh * 0.2)], out, go * go);
                    o.p = [p0[0] - (out[0] - home[0]) * pull, p0[1] - (out[1] - home[1]) * pull];
                    o.r += go * go * 320;
                    o.s *= 1 + 0.8 * go;   // it comes forward as it leaves
                    o.op = 1;
                    if (go >= 1) report("shard-03 → #about", "ok");
                    else if (go > 0.04) report("shard-03 detached", "alert");
                    else report("engineering in progress", "");
                } else if (cur === 1) {
                    var q = range(f, 0, 0.34);
                    var over = [home[0] + (sm ? 30 : 92), home[1] - (sm ? 24 : 50)];
                    var p1, rr = 0, shape = FRAG_TRI;
                    if (q < 0.55) {
                        // A confident, predetermined route…
                        var e = easeOut(q / 0.55);
                        p1 = qbez([-70, vh * 0.22], [vw * 0.4, -vh * 0.06], over, e);
                        rr = -240 * (1 - e);
                    } else if (q < 0.7) {
                        // …past its place. It stops, and looks around
                        p1 = over;
                        rr = 16 * Math.sin((q - 0.55) / 0.15 * Math.PI * 2);
                    } else {
                        // …turns back and settles in, as a new shape
                        var b = (q - 0.7) / 0.3;
                        p1 = mix2(over, home, easeOutBack(b));
                        shape = lerpDeep(FRAG_TRI, FRAG_KITE, easeInOut(b));
                    }
                    // Then, as the sculpture becomes a network, it rides out to one of the network's
                    // nodes and stays there as a marker
                    var merge = easeInOut(range(c.t, 0.35, 0.85)), mark = sm ? 0.4 : 0.5;
                    var flight = 1.1 * sc * (1 + 0.7 * Math.sin(Math.PI * range(q, 0, 0.75)));
                    o.p = merge > 0 ? mix2(p1, topoToScreen(cam, c.st.n[1]), merge) : p1;
                    o.r += rr * (1 - merge); o.shape = shape;
                    o.s = flight + (mark - flight) * merge;
                    o.op = q > 0 ? 1 : 0;
                    o.glow = Math.max(Math.max(0, 1 - Math.abs(q - 0.96) * 12), merge * 0.9);
                    if (rd.head) {
                        var K = [rd.head.left + 40, rd.head.top + 12], lim = sm ? 34 : 64;
                        if (q < 0.6) {
                            var w = range(q, 0.14, 0.55);
                            kick = capLen([(p1[0] - K[0]) * 0.2 * w, (p1[1] - K[1]) * 0.2 * w], lim);
                        } else {
                            var s2 = range(q, 0.6, 0.78), base = capLen([(over[0] - K[0]) * 0.2, (over[1] - K[1]) * 0.2], lim);
                            var spring = Math.cos(s2 * Math.PI * 2.5) * (1 - s2) * (1 - s2);
                            kick = [base[0] * spring, base[1] * spring];
                        }
                    }
                } else if (cur === 2) {
                    // Skills: a quiet marker on its network node
                    o.p = topoToScreen(cam, c.st.n[1]);
                    o.s = sm ? 0.4 : 0.5; o.shape = FRAG_KITE; o.op = 1; o.glow = 0.9;
                } else if (cur === 3) {
                    // Architecture: it takes a shortcut, straight across, onto the real diagram and marks
                    // the compute node; it leaves to the right as the section ends
                    var from = topoToScreen(cam, c.st.n[1]), k3 = 0;
                    o.p = from;
                    if (rd.arch) {
                        var to = [rd.arch.right - 6, rd.arch.top + 6], lv = range(f, 0.86, 1);
                        k3 = easeInOut(range(f, 0.02, 0.2));
                        o.p = mix2(mix2(from, to, k3), [vw + 60, to[1] - 90], lv * lv);
                    }
                    o.r = cam.rot + 360 * k3;
                    o.s = sm ? 0.4 : 0.5; o.shape = FRAG_KITE; o.op = 1;
                    o.glow = Math.max(0.7, Math.sin(Math.PI * k3));
                } else if (cur === 5 && rd.frame) {
                    // Arrives before the first project does, and waits where its frame will be. (On
                    // narrow screens the frame sits below the text, so it arrives just in time instead
                    // of waiting over the words.)
                    var fr = rd.frame, corner = [Math.max(fr.left, 24), Math.min(fr.top, vh * 0.9)];
                    var en = easeOut(sm ? range((vh * 1.3 - fr.top) / (vh * 0.4), 0, 1) : range(f, 0, 0.04));
                    var ab = rd.settled ? 1 : range(caseOpen(fr.top, vh), 0, 0.22);
                    o.p = qbez([vw + 60, vh * 0.25], [vw * 0.75, vh], corner, en);
                    o.r = -60 * (1 - en) + 10 * Math.sin(c.y * 0.018) * en * (1 - ab);
                    o.s = (sm ? 0.85 : 1.25) * (1 - 0.7 * ab);
                    o.shape = FRAG_KITE;
                    o.op = f > 0 && en > 0 ? 1 - ab : 0;
                    o.glow = Math.sin(Math.PI * ab);
                } else if (cur >= 9) {
                    // The return: it tries to go straight in, is pushed back, lines itself up, and fits
                    var q3 = cur === 9 ? range(f, 0.5, 1) * 0.55 : 0.55 + range(f, 0, 0.25) * 0.45;
                    var T = topoToScreen(cam, [500, 286]), u = sm ? 0.6 : 1, fit = sc * 1.5;
                    var A1 = [T[0] - 12 * u, T[1] - 56 * u], p3, r3 = 0, s3 = 0.8, sh3 = FRAG_KITE;
                    if (q3 < 0.45) {
                        var e3 = easeOut(q3 / 0.45);
                        p3 = qbez([-60, vh * 0.62], [vw * 0.45, vh * 0.98], A1, e3);
                        r3 = -180 * (1 - e3);
                    } else if (q3 < 0.6) {
                        var h3 = Math.sin(Math.PI * (q3 - 0.45) / 0.15);
                        p3 = mix2(A1, [T[0] - 2 * u, T[1] - 18 * u], h3);
                        r3 = 22 * h3;
                    } else if (q3 < 0.74) {
                        p3 = A1;
                        r3 = 22 * (1 - easeInOut((q3 - 0.6) / 0.14));
                    } else {
                        var b3 = easeInOut((q3 - 0.74) / 0.26);
                        p3 = mix2(A1, T, b3);
                        sh3 = lerpDeep(FRAG_KITE, FRAG_KEY, b3);
                        s3 = 0.8 + (fit - 0.8) * b3;
                    }
                    o.p = p3; o.r = cam.rot + r3; o.s = s3; o.shape = sh3;
                    o.op = q3 > 0 ? 1 : 0;
                    o.glow = cur === 10 ? Math.sin(Math.PI * range(f, 0.2, 0.42)) : 0;
                }

                // Write only what changed
                var pts = o.shape.map(function (q) { return fx(q[0]) + "," + fx(q[1]); });
                var str = o.op <= 0.001 ? "off" : [fx(o.p[0]), fx(o.p[1]), o.r.toFixed(1), o.s.toFixed(3), o.op.toFixed(2), o.glow.toFixed(2), pts.join(" ")].join("|");
                if (str !== lastFrag) {
                    lastFrag = str;
                    if (str === "off") el.style.opacity = "0";
                    else {
                        el.style.transform = "translate3d(" + px(o.p[0]) + "," + px(o.p[1]) + ",0) rotate(" + o.r.toFixed(2) + "deg) scale(" + o.s.toFixed(3) + ")";
                        el.style.opacity = o.op.toFixed(3);
                        el.style.setProperty("--glow", o.glow.toFixed(3));
                        body.setAttribute("points", pts.join(" "));
                        facet.setAttribute("points", pts[0] + " " + pts[2]);
                    }
                }
                var ks = kick ? px(kick[0]) + " " + px(kick[1]) : "";
                if (kicker && ks !== lastKick) {
                    lastKick = ks;
                    kicker.style.translate = ks;
                    kicker.style.rotate = kick ? (-kick[0] / 16).toFixed(2) + "deg" : "";
                }
            }
        };
    }

    function initTopology() {
        var host = $("#topo");
        var emblems = $$(".topo--emblem svg");
        var S = topoStates();
        // Case studies: the blossom as an emblem (continuity between pages). As the opening scrolls
        // away it folds through itself and shows its inner surface, like the homepage hero.
        emblems.forEach(function (svg) {
            var eg = topoBuild(svg), em = svg.parentNode, hero = em.closest(".cs-hero");
            topoPaint(eg, S.A, 30);
            if (!hero || reduceMotion.matches) return;
            var heroH = hero.offsetHeight || 1, lastFold = "", tick = false;
            var paint = function () {
                tick = false;
                var fold = Math.sin(Math.PI * range(clamp(window.scrollY / heroH, 0, 1), 0, 0.9));
                if (fold.toFixed(3) === lastFold) return;
                lastFold = fold.toFixed(3);
                topoPaint(eg, topoFold(lerpDeep(S.A, S.A, 0), fold), 30, true);
                em.style.setProperty("--inner", lastFold);
            };
            window.addEventListener("scroll", function () {
                if (!tick && window.scrollY < heroH * 1.3) { tick = true; window.requestAnimationFrame(paint); }
            }, { passive: true });
            window.addEventListener("resize", function () { heroH = hero.offsetHeight || 1; }, { passive: true });
        });
        initCaseSculpture();
        if (!host) return;
        var svg = $("svg", host);
        var g = topoBuild(svg);
        var sheenGrad = $("#topo-sheen-grad", host);
        var anchors = TOPO_SCENES.map(function (sc) { return document.getElementById(sc[0]); });
        var portrait = $(".blob-portrait"), orbit = $(".contact__orbit");
        var sides = $$(".case__side"), frames = sides.map(function (s) { return $(".case__frame", s); }), kinds = sides.map(function (s) { var c = s.closest(".case"); return Object.keys(CASE_MASKS).filter(function (k) { return c.classList.contains(k); })[0]; });
        var current = 0, ticking = false, last = "", lastVars = "";
        var vw = window.innerWidth, vh = window.innerHeight, small = vw < 900;

        // Reduced motion: one still picture in the opening, which scrolls away with it (no fragment)
        if (reduceMotion.matches) {
            host.classList.add("topo--static");
            topoPaint(g, S.A, 30);
            var r0 = portrait ? portrait.getBoundingClientRect() : null;
            var size0 = small ? 440 : 700;
            host.style.transform = "translate3d(" + px((r0 ? r0.left + r0.width / 2 : vw * 0.73) - 500) + "," + px((r0 ? r0.top + r0.height / 2 + window.scrollY : vh * 0.5) - 500) + ",0) scale(" + (size0 / 1000).toFixed(3) + ")";
            host.classList.add("is-born");
            return;
        }
        var fragment = topoFragment();

        if ("IntersectionObserver" in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) { if (e.isIntersecting) { current = anchors.indexOf(e.target); request(); } });
            }, { rootMargin: "-50% 0px -50% 0px" });
            anchors.forEach(function (a) { if (a) io.observe(a); });
        }

        function frame() {
            ticking = false;
            var y = window.scrollY;
            // Read: progress through the current scene, and where the attached objects are
            var a = anchors[current];
            var r = a ? a.getBoundingClientRect() : { top: 0, height: 1 };
            var f = current === 0 ? clamp(y / (r.height || 1), 0, 1) : clamp((vh / 2 - r.top) / (r.height || 1), 0, 1);
            var pr = current <= 1 && portrait ? portrait.getBoundingClientRect() : null;
            var or = current >= 9 && orbit ? orbit.getBoundingClientRect() : null;
            var reads = fragment ? fragment.read(current) : null;
            // Phones: where the next section begins (the only open stage between full-width cards)
            var seam = small && anchors[current + 1] ? anchors[current + 1].getBoundingClientRect().top : null;

            // Which two states, and how far between them (scenes hold, then morph late)
            var key = TOPO_SCENES[current][1];
            var next = TOPO_SCENES[Math.min(current + 1, TOPO_SCENES.length - 1)][1];
            // Projects: the ribbons assemble around each real project visual in turn
            var comp = null;
            if ((key === "E" || next === "E") && sides.length) {
                // the visual's box: its column's corner, the frame's untransformed size
                var boxes = sides.map(function (s, i) { var r2 = s.getBoundingClientRect(); return { left: r2.left, top: r2.top, width: frames[i].offsetWidth, height: frames[i].offsetHeight }; });
                comp = topoProjects(S, boxes, kinds, vw, vh, small, S.F, topoCamera("F", vw, vh, small));
            }
            var t = current === 0 ? range(f, 0.02, 0.92) : range(f, 0.55, 1);
            t = t * t * (3 - 2 * t);
            // Geometry, camera and membranes usually move together. Into the network they are
            // staged: the membranes peel away, the form slides into the margin, the inner paths
            // stretch into a network, its nodes light one by one, and the paths fill as glass again.
            var tg = t, tc = t, mem = 1;
            if (key === "B" && next === "C") {
                mem = 1 - range(t, 0, 0.35) + range(t, 0.75, 1);
                tc = easeInOut(range(t, 0, 0.55));
                tg = range(t, 0.3, 1);
                tg = tg * tg * (3 - 2 * tg);
            }
            var camA = comp && key === "E" ? comp.cam : topoCamera(key, vw, vh, small);
            var camB = comp && next === "E" ? comp.cam : topoCamera(next, vw, vh, small);
            var SA = comp && key === "E" ? comp.st : S[key], SB = comp && next === "E" ? comp.st : S[next];
            // The opening is attached to the portrait; the ending to the contact orbit
            if (pr && key === "A") {
                camA.x = pr.left + pr.width / 2;
                // (on phones the portrait scrolls away early; the sculpture stays for the fold and the escape)
                camA.y = small ? Math.max(pr.top + pr.height / 2, vh * 0.34) : pr.top + pr.height / 2;
            }
            if (or && or.width) {
                var gx = or.left + or.width / 2, gy = or.top + or.height / 2;
                if (next === "G") { camB.x = gx; camB.y = gy; }
                if (key === "G") { camA.x = gx; camA.y = gy; }
            }
            var cam = lerpDeep(camA, camB, tc);
            var st = key === next ? SA : lerpDeep(SA, SB, tg);
            if (comp && key === "E") { cam = comp.cam; st = comp.st; t = 0; }
            // Phones have no empty margins, so the sculpture keeps a quiet corner while you read and
            // takes the stage, larger and brighter, while it changes shape between sections
            else if (small && key !== next && key !== "A") {
                var stage = Math.sin(Math.PI * t);
                // It rides the seam between the two sections, the one place no card covers it
                var sy = seam === null ? vh * 0.5 : clamp(seam, vh * 0.15, vh * 0.85);
                cam = lerpDeep(cam, { x: vw * 0.5, y: sy, size: vw * 1.2, rot: cam.rot, alpha: 0.6 }, stage * 0.9);
                // on stage the ribbons fill out and keep their glass, so the change reads at phone size
                st.r.forEach(function (r) { r.w *= 1 + 1.6 * stage; });
                mem = Math.max(mem, 0.6 * stage + mem * (1 - stage));
            }
            if (key === "B" && next === "C") st.n.forEach(function (n, i) { n[2] = S.C.n[i][2] * range(t, 0.5 + i * 0.07, 0.68 + i * 0.07); });
            // The hero's own beats: the shards wake and gather, then the blossom folds through itself
            var fold = 0;
            if (current === 0) {
                fold = Math.sin(Math.PI * range(f, 0.1, 0.62));
                st = topoWake(topoFold(st, fold), f, y);
            }
            var stateKey = key + next + t.toFixed(3) + (current === 0 ? f.toFixed(4) : "") + (comp ? comp.key : "");

            // Write: camera every frame (cheap, composited); geometry only when it changes
            host.style.transform = "translate3d(" + px(cam.x - 500) + "," + px(cam.y - 500) + ",0) rotate(" + cam.rot.toFixed(2) + "deg) scale(" + (cam.size / 1000).toFixed(4) + ")";
            host.style.opacity = cam.alpha.toFixed(3);
            if (stateKey !== last) {
                last = stateKey;
                topoPaint(g, st, small ? 22 : 34, fold > 0);
                host.setAttribute("data-scene", t < 0.5 ? key : next);
            }
            // Light travels along the paths as the story moves on; in the opening a contour
            // traces the form, and the inner surface shows while it folds
            var story = current + f;
            var vars = [(-story * 0.55).toFixed(4), fold.toFixed(3), (current === 0 ? 0.12 + 0.88 * range(f, 0, 0.35) : 1).toFixed(3), mem.toFixed(3)];
            if (vars.join() !== lastVars) {
                lastVars = vars.join();
                host.style.setProperty("--light", vars[0]);
                host.style.setProperty("--inner", vars[1]);
                host.style.setProperty("--trace", vars[2]);
                host.style.setProperty("--mem", vars[3]);
            }
            if (sheenGrad) sheenGrad.setAttribute("gradientTransform", "rotate(" + (story * 38).toFixed(1) + " .5 .5)");
            if (fragment) fragment.write({ current: current, f: f, t: t, y: y, st: st, cam: cam, vw: vw, vh: vh, small: small }, reads);
        }
        function request() { if (!ticking) { ticking = true; window.requestAnimationFrame(frame); } }
        window.addEventListener("scroll", request, { passive: true });
        window.addEventListener("resize", function () { vw = window.innerWidth; vh = window.innerHeight; small = vw < 900; last = ""; request(); }, { passive: true });
        request();
        // The opening: contours trace the form, then the membranes fill in
        window.requestAnimationFrame(function () { host.classList.add("is-born"); });
        window.setTimeout(function () { host.classList.add("is-settled"); }, 3200);
    }

    /* ---------------- Reveal on scroll + split headings ---------------- */
    function splitWords(el) {
        var index = 0;
        el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
        (function walk(node) {
            Array.prototype.slice.call(node.childNodes).forEach(function (child) {
                if (child.nodeType === 3) {
                    var frag = document.createDocumentFragment();
                    child.textContent.split(/(\s+)/).forEach(function (part) {
                        if (!part) return;
                        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
                        var outer = document.createElement("span");
                        var inner = document.createElement("span");
                        outer.className = "w";
                        outer.setAttribute("aria-hidden", "true");
                        inner.textContent = part;
                        inner.style.setProperty("--wi", index++);
                        outer.appendChild(inner);
                        frag.appendChild(outer);
                    });
                    child.parentNode.replaceChild(frag, child);
                } else if (child.nodeType === 1) {
                    walk(child);
                }
            });
        })(el);
        el.classList.add("split");
        // Group the words into the lines they actually wrap onto, so each line rises as one layer
        // just after the line above it (measured in the next frame, alongside normal layout)
        window.requestAnimationFrame(function () {
            var top = null, line = -1, wi = 0;
            $$(".w", el).forEach(function (w) {
                var t = w.offsetTop;
                if (top === null || t > top + 4) { top = t; line++; wi = 0; }
                w.firstChild.style.setProperty("--li", line);
                w.firstChild.style.setProperty("--wi", wi++);
            });
        });
    }

    function initReveal() {
        var items = $$(".reveal");
        if (!("IntersectionObserver" in window) || reduceMotion.matches) {
            items.forEach(function (el) { el.classList.add("is-visible"); });
            return;
        }

        // Stagger siblings inside a group
        $$(".reveal-stagger, .principles, .cred__grid, .contact__cards, .stack__layers, .cases, .decisions, .results, .cs-results").forEach(function (group) {
            $$(":scope > .reveal", group).forEach(function (el, i) { el.style.setProperty("--i", i % 6); });
        });

        // Headings are split into words just before they scroll in (not at boot),
        // so page load never has to re-lay-out every heading at once.
        var splitter = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                splitter.unobserve(entry.target);
                if (!entry.target.classList.contains("split") && !entry.target.closest(".is-visible") && !entry.target.hasAttribute("data-membrane")) splitWords(entry.target);
            });
        }, { rootMargin: "0px 0px 400px 0px" });
        $$(".section-title, .contact__title, .case__title, .chapter__title").forEach(function (h) { splitter.observe(h); });

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var el = entry.target;
                    io.unobserve(el);
                    // one frame later, so a freshly split heading can animate in
                    window.requestAnimationFrame(function () { el.classList.add("is-visible"); });
                }
            });
        }, { threshold: 0.12, rootMargin: "100% 0px -8% 0px" }); // top: reveal what a fast scroll jumped past

        items.forEach(function (el) { io.observe(el); });
    }

    /* ---------------- Hero: pause off-screen, ambient pointer glow ---------------- */
    function initHero() {
        var hero = $(".hero");
        if (!hero) return;

        if ("IntersectionObserver" in window) {
            new IntersectionObserver(function (entries) {
                hero.classList.toggle("is-offscreen", !entries[0].isIntersecting);
            }).observe(hero);
        }

        // The name is split into letters: they wobble on hover and come loose on the first scroll
        // (the h1 keeps a plain-text accessible name)
        var title = $("#hero-title");
        if (title && !reduceMotion.matches) {
            title.setAttribute("aria-label", title.textContent.replace(/\s+/g, " ").trim());
            $$(".hero__word", hero).forEach(function (word) {
                word.innerHTML = word.textContent.split("").map(function (c) { return '<span class="letter" aria-hidden="true">' + c + "</span>"; }).join("");
            });
        }

        if (!finePointer.matches || reduceMotion.matches) return;
        var glow = $(".cursor-glow", hero);
        var hud = $("#hud-ptr");
        var eyes = $("#cloudlet .cloudlet__eyes");
        var cloudlet = $("#cloudlet");
        var raf = 0, px = 0, py = 0;
        hero.addEventListener("pointermove", function (e) {
            px = e.clientX; py = e.clientY;
            if (raf) return;
            raf = window.requestAnimationFrame(function () {
                raf = 0;
                var r = hero.getBoundingClientRect();
                var nx = (px - r.left) / r.width - 0.5;
                var ny = (py - r.top) / r.height - 0.5;
                hero.style.setProperty("--px", (nx * 2).toFixed(3));
                hero.style.setProperty("--py", (ny * 2).toFixed(3));
                glow.style.setProperty("--cx", (px - r.left) + "px");
                glow.style.setProperty("--cy", (py - r.top) + "px");
                hero.classList.add("has-pointer");
                if (hud) hud.textContent = "x " + String(Math.round(px)).padStart(3, "0") + " · y " + String(Math.round(py - r.top)).padStart(3, "0");
                if (eyes && cloudlet) {
                    var c = cloudlet.getBoundingClientRect();
                    var dx = px - (c.left + c.width / 2), dy = py - (c.top + c.height / 2);
                    var d = Math.max(1, Math.hypot(dx, dy));
                    eyes.style.transform = "translate(" + (dx / d * 3).toFixed(2) + "px," + (dy / d * 2.5).toFixed(2) + "px)";
                }
            });
        });
        hero.addEventListener("pointerleave", function () {
            hero.classList.remove("has-pointer");
            hero.style.setProperty("--px", "0");
            hero.style.setProperty("--py", "0");
        });
    }

    /* ---------------- Micro-interactions: magnetic buttons, card tilt ---------------- */
    function initPointerFx() {
        if (!finePointer.matches || reduceMotion.matches) return;

        $$(".magnetic").forEach(function (el) {
            el.addEventListener("pointermove", function (e) {
                var r = el.getBoundingClientRect();
                el.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + "px");
                el.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + "px");
            });
            el.addEventListener("pointerleave", function () {
                el.style.setProperty("--mx", "0px");
                el.style.setProperty("--my", "0px");
            });
        });

        $$(".tilt").forEach(function (el) {
            var raf = 0, ev = null;
            function frame() {
                raf = 0;
                var r = el.getBoundingClientRect();
                var x = (ev.clientX - r.left) / r.width;
                var y = (ev.clientY - r.top) / r.height;
                var k = Math.min(1, 420 / r.width); // big cards tilt less
                el.style.transform = "perspective(1000px) rotateX(" + ((0.5 - y) * 5 * k).toFixed(2) + "deg) rotateY(" + ((x - 0.5) * 6 * k).toFixed(2) + "deg)";
                el.style.setProperty("--px", (x * 100).toFixed(1) + "%");
                el.style.setProperty("--py", (y * 100).toFixed(1) + "%");
            }
            el.addEventListener("pointermove", function (e) {
                ev = e;
                if (!raf) raf = window.requestAnimationFrame(frame);
            });
            el.addEventListener("pointerleave", function () {
                if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
                el.style.transform = "";
            });
        });
    }

    /* ---------------- Run decorative animations only while visible ---------------- */
    function initInView() {
        if (!("IntersectionObserver" in window)) return;
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                var el = entry.target;
                el.classList.toggle("in-view", entry.isIntersecting);
                // SMIL packets in the architecture diagram
                var svg = el.querySelector("svg.arch__edges");
                if (svg && svg.pauseAnimations) {
                    if (entry.isIntersecting) svg.unpauseAnimations(); else svg.pauseAnimations();
                }
            });
        }, { rootMargin: "100px 0px" });
        $$(".case, .arch__stage, .contact").forEach(function (el) { io.observe(el); });
    }

    /* ---------------- Skills inspector ---------------- */
    function initSkills() {
        var inspector = $("#skill-inspector");
        var nameEl = $("#inspector-name");
        var body = $("#inspector-body");
        var stack = $(".stack");
        var skills = $$(".skill");
        if (!inspector || !skills.length) return;

        var narrow = mq("(max-width: 899px)");
        var WORK = {
            orders: ["/projects/multi-channel-order-processing/", "Case study: multi-channel order processing"],
            pipeline: ["/projects/zero-downtime-deployment-pipeline/", "Case study: zero-downtime deployment pipeline"],
            carrier: ["/projects/carrier-shipping-integration/", "Case study: carrier & shipping gateway"],
            fsp: ["#job-fsp", "Cloud Engineer, FSP Consulting"],
            atharva: ["#job-atharva", "Junior Developer, Atharva IT Services"],
            parul: ["#job-parul", "LMS Administrator Intern, Parul University"]
        };

        // A tiny hub-and-spoke diagram: the selected technology and what it works with
        function graph(hub, related) {
            var NS = "http://www.w3.org/2000/svg";
            var W = 300, H = related.length ? 150 : 70, cx = W / 2, cy = related.length ? 72 : 35;
            var svg = document.createElementNS(NS, "svg");
            svg.setAttribute("viewBox", "0 0 " + W + " " + H);
            svg.setAttribute("class", "inspector__graph");
            svg.setAttribute("aria-hidden", "true");
            function el(tag, attrs, parent) {
                var n = document.createElementNS(NS, tag);
                Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
                (parent || svg).appendChild(n);
                return n;
            }
            var spots = [[-1, -0.62], [1, -0.62], [-1, 0.62], [1, 0.62], [0, -1], [0, 1]];
            related.slice(0, 6).forEach(function (name, i) {
                var sx = cx + spots[i][0] * 62, sy = cy + spots[i][1] * 50;
                el("line", { x1: cx, y1: cy, x2: sx, y2: sy });
                var g = el("g", { "class": "g-sat", style: "--k:" + i });
                el("circle", { cx: sx, cy: sy, r: 4 }, g);
                var t = el("text", { x: sx + (spots[i][0] < 0 ? -8 : spots[i][0] > 0 ? 8 : 0), y: sy + (spots[i][0] === 0 ? (spots[i][1] < 0 ? -9 : 15) : 3.5), "text-anchor": spots[i][0] < 0 ? "end" : spots[i][0] > 0 ? "start" : "middle" }, g);
                var label = name.replace("&amp;", "&").replace("Azure ", "");
                t.textContent = label.length > 13 ? label.slice(0, 12) + "…" : label;
                var full = document.createElementNS(NS, "title");
                full.textContent = name.replace("&amp;", "&");
                g.appendChild(full);
            });
            var hubG = el("g", { "class": "g-hub" });
            if (!reduceMotion.matches) el("circle", { cx: cx, cy: cy, r: 7, "class": "g-pulse" }, hubG);
            el("circle", { cx: cx, cy: cy, r: 7 }, hubG);
            var ht = el("text", { x: cx, y: cy + (related.length ? 24 : 22), "text-anchor": "middle" }, hubG);
            ht.textContent = hub;
            return svg;
        }

        function block(title, text) {
            var wrap = document.createElement("div");
            var h = document.createElement("h4");
            var p = document.createElement("p");
            wrap.className = "inspector__block";
            h.textContent = title;
            p.textContent = text;
            wrap.appendChild(h);
            wrap.appendChild(p);
            return wrap;
        }

        function select(btn, fromUser) {
            skills.forEach(function (b) {
                var on = b === btn;
                b.classList.toggle("is-selected", on);
                b.setAttribute("aria-pressed", String(on));
            });

            var layer = btn.closest(".layer");
            var layerTitle = $(".layer__title", layer).textContent.replace(/^\s*L\d\s*/, "").trim();

            nameEl.textContent = btn.textContent.trim();
            body.textContent = "";
            body.appendChild(graph(btn.textContent.trim(), (btn.getAttribute("data-related") || "").split("|").filter(Boolean)));
            body.appendChild(block("What it is", btn.getAttribute("data-desc")));
            body.appendChild(block("How I’ve used it", btn.getAttribute("data-use")));
            var related = (btn.getAttribute("data-related") || "").split("|").filter(Boolean);
            if (related.length) {
                var rel = block("Works with", "");
                var relList = document.createElement("div");
                relList.className = "inspector__related";
                related.forEach(function (name) {
                    var target = skills.filter(function (b) { return b.textContent.trim() === name; })[0];
                    if (!target) return;
                    var chip = document.createElement("button");
                    chip.type = "button";
                    chip.textContent = name;
                    chip.addEventListener("click", function () { select(target, true); target.focus({ preventScroll: true }); });
                    relList.appendChild(chip);
                });
                rel.replaceChild(relList, rel.lastChild);
                body.appendChild(rel);
            }
            var work = (btn.getAttribute("data-work") || "").split("|").filter(Boolean);
            if (work.length) {
                var wb = block("Where I used it", "");
                var wl = document.createElement("div");
                wl.className = "inspector__work";
                work.forEach(function (k) {
                    var w = WORK[k];
                    if (!w) return;
                    var a = document.createElement("a");
                    a.href = w[0];
                    a.textContent = w[1];
                    wl.appendChild(a);
                });
                wb.replaceChild(wl, wb.lastChild);
                body.appendChild(wb);
            }
            var meta = document.createElement("p");
            meta.className = "inspector__layer";
            meta.textContent = "Layer: " + layerTitle;
            body.appendChild(meta);
            $$(".layer").forEach(function (l) { l.classList.toggle("is-active", l === layer); });

            if (fromUser) {
                inspector.classList.remove("is-updating");
                void inspector.offsetWidth; // restart the entrance animation
                inspector.classList.add("is-updating");
            }

            if (narrow.matches) {
                layer.parentNode.insertBefore(inspector, layer.nextSibling);
                if (fromUser) inspector.scrollIntoView({ block: "nearest", behavior: reduceMotion.matches ? "auto" : "smooth" });
            }
        }

        skills.forEach(function (b) {
            b.setAttribute("aria-pressed", "false");
            b.setAttribute("aria-controls", "skill-inspector");
            b.addEventListener("click", function () { select(b, true); });
        });

        onChange(narrow, function (e) {
            if (!e.matches) stack.appendChild(inspector);
        });

        if (!narrow.matches) {
            var initial = skills.filter(function (b) { return b.textContent.trim() === "Azure Functions"; })[0] || skills[0];
            select(initial, false);
        }
    }

    /* ---------------- Architecture explorer ---------------- */
    function initArchitecture() {
        var stage = $("#arch-stage");
        var svg = $("#arch-edges");
        if (!stage || !svg) return;

        var SVGNS = "http://www.w3.org/2000/svg";
        var nodes = {};
        $$(".arch-node", stage).forEach(function (n) { nodes[n.getAttribute("data-node")] = n; });
        var details = {};
        $$(".arch-detail").forEach(function (d) { details[d.getAttribute("data-detail")] = d; });
        var segs = $$(".arch__toolbar .seg");

        var EDGES = [
            ["clients", "apim", "request"],
            ["apim", "functions", "request"],
            ["functions", "logicapps", "request"],
            ["functions", "data", "request"],
            ["logicapps", "data", "request"],
            ["identity", "apim", "identity"],
            ["identity", "functions", "identity"],
            ["identity", "logicapps", "identity"],
            ["cicd", "iac", "delivery"],
            ["iac", "apim", "delivery"],
            ["iac", "functions", "delivery"],
            ["iac", "logicapps", "delivery"],
            ["iac", "data", "delivery"]
        ];

        // Node centres as percentages of the stage
        var LAYOUTS = {
            wide: {
                w: 1000, h: 600,
                pos: {
                    clients: [11, 50], apim: [36, 50], functions: [61, 50],
                    logicapps: [88, 27], data: [88, 73],
                    identity: [61, 12], iac: [61, 88], cicd: [33, 88]
                }
            },
            narrow: {
                w: 360, h: 640,
                pos: {
                    clients: [27, 6], identity: [74, 6],
                    apim: [27, 26], functions: [62, 44],
                    logicapps: [27, 64], data: [74, 64],
                    cicd: [27, 92], iac: [74, 92]
                }
            }
        };

        var state = { flow: "all", node: null, layout: null };
        var edgeEls = [];

        function curve(a, b, L) {
            var ax = a[0] * L.w / 100, ay = a[1] * L.h / 100;
            var bx = b[0] * L.w / 100, by = b[1] * L.h / 100;
            var dx = bx - ax, dy = by - ay;
            if (Math.abs(dx) >= Math.abs(dy)) {
                return "M" + ax + " " + ay + " C" + (ax + dx / 2) + " " + ay + " " + (ax + dx / 2) + " " + by + " " + bx + " " + by;
            }
            return "M" + ax + " " + ay + " C" + ax + " " + (ay + dy / 2) + " " + bx + " " + (ay + dy / 2) + " " + bx + " " + by;
        }

        function render(layoutName) {
            var L = LAYOUTS[layoutName];
            state.layout = layoutName;
            stage.setAttribute("data-layout", layoutName);
            stage.style.setProperty("--arch-ratio", L.w + " / " + L.h);
            svg.setAttribute("viewBox", "0 0 " + L.w + " " + L.h);
            svg.setAttribute("preserveAspectRatio", "none");
            while (svg.firstChild) svg.removeChild(svg.firstChild);
            edgeEls = [];

            Object.keys(nodes).forEach(function (id) {
                var p = L.pos[id];
                nodes[id].style.setProperty("--x", p[0]);
                nodes[id].style.setProperty("--y", p[1]);
            });

            EDGES.forEach(function (e, i) {
                var path = document.createElementNS(SVGNS, "path");
                path.setAttribute("d", curve(L.pos[e[0]], L.pos[e[1]], L));
                path.setAttribute("class", "edge edge--" + e[2]);
                path.id = "arch-edge-" + i;
                path.style.setProperty("--n", i);
                svg.appendChild(path);

                var packet = null;
                if (!reduceMotion.matches) {
                    packet = document.createElementNS(SVGNS, "circle");
                    packet.setAttribute("r", layoutName === "wide" ? "4" : "4.5");
                    packet.setAttribute("class", "packet packet--" + e[2]);
                    var motion = document.createElementNS(SVGNS, "animateMotion");
                    motion.setAttribute("dur", (2.4 + (i % 4) * 0.45) + "s");
                    motion.setAttribute("repeatCount", "indefinite");
                    motion.setAttribute("begin", (-(i * 0.37) % 2.4).toFixed(2) + "s");
                    var mpath = document.createElementNS(SVGNS, "mpath");
                    mpath.setAttribute("href", "#arch-edge-" + i);
                    motion.appendChild(mpath);
                    packet.appendChild(motion);
                    svg.appendChild(packet);
                }
                edgeEls.push({ from: e[0], to: e[1], kind: e[2], path: path, packet: packet });
            });
            paint();
        }

        function paint() {
            var activeNodes = {};
            var anyFocus = !!state.node || state.flow !== "all";

            edgeEls.forEach(function (e) {
                var hot = state.node
                    ? (e.from === state.node || e.to === state.node)
                    : (state.flow !== "all" && e.kind === state.flow);
                if (hot) { activeNodes[e.from] = true; activeNodes[e.to] = true; }
                e.path.classList.toggle("is-hot", hot);
                e.path.classList.toggle("is-dim", anyFocus && !hot);
                if (e.packet) e.packet.classList.toggle("is-dim", anyFocus && !hot);
            });

            Object.keys(nodes).forEach(function (id) {
                var n = nodes[id];
                n.classList.toggle("is-active", state.node === id);
                n.classList.toggle("is-dim", anyFocus && !activeNodes[id]);
                n.setAttribute("aria-pressed", String(state.node === id));
            });

            segs.forEach(function (s) {
                var on = !state.node && s.getAttribute("data-flow") === state.flow;
                s.classList.toggle("is-active", on);
                s.setAttribute("aria-pressed", String(on));
            });

            var key = state.node || "overview";
            Object.keys(details).forEach(function (k) {
                details[k].classList.toggle("is-active", k === key);
            });
        }

        function selectNode(id, fromUser) {
            state.node = state.node === id ? null : id;
            if (state.node) state.flow = "all";
            paint();
            if (fromUser && state.layout === "narrow") {
                $("#arch-panel").scrollIntoView({ block: "nearest", behavior: reduceMotion.matches ? "auto" : "smooth" });
            }
        }

        var order = ["clients", "apim", "functions", "logicapps", "data", "identity", "iac", "cicd"];
        Object.keys(nodes).forEach(function (id) {
            var n = nodes[id];
            n.addEventListener("click", function () { selectNode(id, true); });
            n.addEventListener("keydown", function (e) {
                var i = order.indexOf(id);
                var next = null;
                if (e.key === "ArrowRight" || e.key === "ArrowDown") next = order[(i + 1) % order.length];
                if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = order[(i - 1 + order.length) % order.length];
                if (e.key === "Escape") { state.node = null; paint(); }
                if (next) { e.preventDefault(); nodes[next].focus(); }
            });
        });

        segs.forEach(function (s) {
            s.addEventListener("click", function () {
                state.flow = s.getAttribute("data-flow");
                state.node = null;
                paint();
            });
        });

        function pickLayout() {
            var name = stage.clientWidth >= 560 ? "wide" : "narrow";
            if (name !== state.layout) render(name);
        }

        if ("ResizeObserver" in window) new ResizeObserver(pickLayout).observe(stage.parentNode);
        else window.addEventListener("resize", pickLayout, { passive: true });
        pickLayout();

        // Progressive assembly the first time the diagram comes into view
        order.forEach(function (id, i) { nodes[id].style.setProperty("--n", i); });
        function assemble() {
            var paths = $$(".edge", svg);
            paths.forEach(function (pth) { pth.setAttribute("pathLength", "1"); });
            stage.classList.add("is-assembling", "is-drawing");
            window.requestAnimationFrame(function () { stage.classList.add("is-assembled"); });
            window.setTimeout(function () {
                stage.classList.remove("is-drawing", "is-assembling");
                $$(".edge", svg).forEach(function (pth) { pth.removeAttribute("pathLength"); });
            }, 2200);
        }
        if (reduceMotion.matches || !("IntersectionObserver" in window)) {
            stage.classList.add("is-assembled");
        } else {
            var aio = new IntersectionObserver(function (entries) {
                if (entries[0].isIntersecting) { aio.disconnect(); assemble(); }
            }, { threshold: 0.3 });
            aio.observe(stage);
        }
    }

    /* ---------------- Terminal ---------------- */
    function initTerminal() {
        var out = $("#term-out");
        var form = $("#term-form");
        var input = $("#term-input");
        if (!out || !form || !input) return;

        var history = [];
        var hIndex = -1;

        function line(parts) {
            var p = document.createElement("p");
            (Array.isArray(parts) ? parts : [parts]).forEach(function (part) {
                if (typeof part === "string") {
                    p.appendChild(document.createTextNode(part));
                } else if (part.href) {
                    var a = document.createElement("a");
                    a.href = part.href;
                    a.textContent = part.t;
                    if (/^https?:/.test(part.href)) { a.target = "_blank"; a.rel = "noopener"; }
                    p.appendChild(a);
                } else {
                    var s = document.createElement("span");
                    s.className = part.c;
                    s.textContent = part.t;
                    p.appendChild(s);
                }
            });
            out.appendChild(p);
        }
        var h = function (t) { return { c: "t-h", t: t }; };
        var a = function (t) { return { c: "t-accent", t: t }; };
        var m = function (t) { return { c: "t-muted", t: t }; };
        var ok = function (t) { return { c: "t-ok", t: t }; };

        var SECTIONS = ["about", "skills", "architecture", "experience", "projects", "credentials", "faq", "contact"];

        var COMMANDS = {
            help: function () {
                line(h("Available commands"));
                [
                    ["whoami", "who I am"],
                    ["skills", "the stack, by layer"],
                    ["experience", "roles and dates"],
                    ["projects", "selected case studies"],
                    ["education", "degree and certifications"],
                    ["contact", "how to reach me"],
                    ["ls", "list page sections"],
                    ["open <section>", "jump to a section"],
                    ["theme", "toggle light / dark"],
                    ["clear", "clear the screen"]
                ].forEach(function (r) { line(["  ", a(r[0] + "            ".slice(r[0].length)), m(r[1])]); });
            },
            whoami: function () {
                line(h("Anand Vaidya"));
                line("Azure Cloud Engineer at FSP Consulting · Vadodara, India");
                line("Serverless integrations, secure APIs and automated infrastructure on Microsoft Azure.");
            },
            skills: function () {
                [
                    ["Azure", "App Services, Managed Identities, Azure AD B2C"],
                    ["Serverless", "Azure Functions, Logic Apps"],
                    ["APIs & data", "API Management, OAuth 2.0, Cosmos DB, SQL Server"],
                    ["IaC", "Azure Bicep, ARM Templates"],
                    ["DevOps", "Azure DevOps, CI/CD pipelines, Docker"],
                    ["Code", "ASP.NET Core & C#, JavaScript, Python"]
                ].forEach(function (r) { line([a((r[0] + ":            ").slice(0, 13)), r[1]]); });
            },
            experience: function () {
                line([ok("Apr 2025 – now  "), h("Cloud Engineer"), " · FSP Consulting"]);
                line([m("                   "), "Event-driven Azure architecture; processing latency hours → seconds."]);
                line([ok("Feb 2023 – Mar 2025 "), h("Junior Developer"), " · Atharva IT Services"]);
                line([m("                   "), ".NET Core integration for Shopify, Amazon and Walmart."]);
                line([ok("Sep 2021 – Aug 2022 "), h("LMS Administrator Intern"), " · Parul University"]);
            },
            projects: function () {
                line([a("01 "), h("Multi-Channel Order Processing Platform")]);
                line(m("   Azure Functions + Cosmos DB · sync 5 min → <2 s · $150k+ quarterly revenue recovered"));
                line([a("02 "), h("Zero-Downtime Cloud Deployment Pipeline")]);
                line(m("   Bicep + Azure DevOps · deployments 2 days → 15 min"));
                line([a("03 "), h("Carrier & Shipping Integration Layer")]);
                line(m("   API Management + OAuth 2.0 · 40+ hours/week of dispatch work saved"));
            },
            education: function () {
                line([h("B.Tech. Computer Science & Engineering"), " · Parul University (2019–2023)"]);
                line(m("   First Class with Distinction"));
                line([h("Microsoft Certified: Azure AI Fundamentals"), " (AI-900) · May 2025"]);
            },
            contact: function () {
                line(["email     ", { href: "mailto:anand.svaidya24@gmail.com", t: "anand.svaidya24@gmail.com" }]);
                line(["linkedin  ", { href: "https://www.linkedin.com/in/vaidya-anand", t: "linkedin.com/in/vaidya-anand" }]);
                line(["github    ", { href: "https://github.com/anandvaidyaa", t: "github.com/anandvaidyaa" }]);
                line(["phone     ", { href: "tel:+919913013470", t: "+91-9913013470" }]);
            },
            ls: function () { line(SECTIONS.map(function (s) { return s + "/"; }).join("  ")); },
            open: function (arg) {
                var id = (arg || "").replace(/\/$/, "");
                if (id === "education") id = "credentials";
                var target = SECTIONS.indexOf(id) > -1 ? document.getElementById(id) : null;
                if (!target) { line([m("usage: open <section>  — try "), a("ls")]); return; }
                line(ok("→ opening " + id));
                scrollToId(id, true);
            },
            // Not in `help`: for the curious
            play: function () {
                line(ok("→ after hours. the lights are still on downstairs."));
                scrollToId("arcade", true);
            },
            theme: function () {
                var t = $("#theme-toggle");
                if (t) t.click();
                line(ok("theme: " + doc.getAttribute("data-theme")));
            },
            sudo: function () { line([m("Permission denied. This incident will be reported to the Managed Identity. (psst: try "), a("cloud"), m(")")]); },
            cloud: function () { line(ok("opening the control plane…")); openEgg(); },
            secrets: function () {
                line(m("Some things on this page only appear if you look closer. Try a keyboard shortcut with K in it."));
                document.dispatchEvent(new CustomEvent("av:hint"));
            },
            ping: function () { line([ok("pong"), m(" · static site, zero servers harmed")]); },
            clear: function () { out.textContent = ""; }
        };
        COMMANDS.about = COMMANDS.whoami;

        function run(raw) {
            var cmd = raw.trim();
            if (!cmd) return;
            history.push(cmd);
            hIndex = history.length;
            line([{ c: "t-prompt", t: "$ " }, { c: "t-cmd", t: cmd }]);
            var parts = cmd.split(/\s+/);
            var fn = COMMANDS[parts[0].toLowerCase()];
            if (fn) fn(parts.slice(1).join(" "));
            else line([m("command not found: "), parts[0], m(" — type "), a("help")]);
            out.scrollTop = out.scrollHeight;
        }

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            run(input.value);
            input.value = "";
        });

        input.addEventListener("keydown", function (e) {
            if (e.key === "ArrowUp" && history.length) {
                e.preventDefault();
                hIndex = Math.max(0, hIndex - 1);
                input.value = history[hIndex];
            } else if (e.key === "ArrowDown" && history.length) {
                e.preventDefault();
                hIndex = Math.min(history.length, hIndex + 1);
                input.value = history[hIndex] || "";
            }
        });

        $$(".term__chips button").forEach(function (b) {
            b.addEventListener("click", function () { run(b.getAttribute("data-cmd")); });
        });

        // Seed the screen so it never looks empty (no focus steal, no scroll). Deferred until the
        // terminal is near the viewport so measuring its output doesn't force layout during load.
        whenNear("#console", function () { if (!history.length) run("whoami"); });
    }

    /* ---------------- Recruiter quick view ----------------
       A native modal dialog (focus trap, Esc and focus return come from the browser).
       The same facts are on the page, so nothing depends on opening it. */
    function initQuickView() {
        var dlg = $("#quick-view");
        if (!dlg || !dlg.showModal) return;
        var opener = null;
        $$("[data-quick]").forEach(function (b) {
            b.addEventListener("click", function () {
                opener = b;
                // let the mobile menu finish closing before the dialog takes focus
                window.setTimeout(function () { if (!dlg.open) dlg.showModal(); }, 0);
            });
        });
        dlg.addEventListener("click", function (e) {
            // a click on the backdrop (the dialog element itself) or on a close control
            if (e.target === dlg || e.target.closest("[data-qv-close]")) dlg.close();
        });
        dlg.addEventListener("close", function () {
            if (opener && document.contains(opener) && opener.offsetParent !== null) opener.focus({ preventScroll: true });
        });
    }

    /* ---------------- Contact: copy + mailto form ---------------- */
    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
        return new Promise(function (resolve, reject) {
            var ta = document.createElement("textarea");
            ta.value = text;
            ta.setAttribute("readonly", "");
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand("copy") ? resolve() : reject(); } catch (err) { reject(err); }
            document.body.removeChild(ta);
        });
    }

    function initContact() {
        $$(".copy-btn").forEach(function (btn) {
            var label = btn.getAttribute("aria-label");
            btn.addEventListener("click", function () {
                copyText(btn.getAttribute("data-copy")).then(function () {
                    btn.classList.add("is-copied");
                    btn.setAttribute("aria-label", "Copied");
                    announce("Email address copied");
                    window.setTimeout(function () {
                        btn.classList.remove("is-copied");
                        btn.setAttribute("aria-label", label);
                    }, 2000);
                }, function () { announce("Copy failed — the address is anand.svaidya24@gmail.com"); });
            });
        });

        var form = $("#contact-form");
        if (!form) return;
        var status = $("#form-status");
        var fields = [
            { el: $("#form-subject"), err: $("#err-subject"), msg: "Please add a subject." },
            { el: $("#form-message"), err: $("#err-message"), msg: "Please write a short message (at least 10 characters).", min: 10 }
        ];

        function validate(f) {
            var v = f.el.value.trim();
            var bad = !v || (f.min && v.length < f.min);
            f.el.setAttribute("aria-invalid", String(!!bad));
            f.err.textContent = bad ? f.msg : "";
            return !bad;
        }

        fields.forEach(function (f) {
            f.el.addEventListener("blur", function () { if (f.el.value) validate(f); });
            f.el.addEventListener("input", function () { if (f.el.getAttribute("aria-invalid") === "true") validate(f); });
        });

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var okAll = fields.map(validate).every(Boolean);
            if (!okAll) {
                status.className = "cform__status";
                status.textContent = "Please fix the highlighted fields.";
                (fields.filter(function (f) { return f.el.getAttribute("aria-invalid") === "true"; })[0] || fields[0]).el.focus();
                return;
            }
            var href = "mailto:anand.svaidya24@gmail.com?subject=" + encodeURIComponent(fields[0].el.value.trim()) +
                "&body=" + encodeURIComponent(fields[1].el.value.trim());
            window.location.href = href;
            status.className = "cform__status is-ok";
            status.textContent = "";
            status.appendChild(document.createTextNode("Your email app should open with this message ready to send. Nothing happened? Email "));
            var link = document.createElement("a");
            link.href = "mailto:anand.svaidya24@gmail.com";
            link.textContent = "anand.svaidya24@gmail.com";
            status.appendChild(link);
            status.appendChild(document.createTextNode(" directly."));
        });
    }

    /* ---------------- Small celebratory bursts ---------------- */
    var BURST_COLORS = ["#2ad4f0", "#7b5cff", "#ff4fd8", "#c6ff3d", "#6b95ff"];
    function burst(x, y, count) {
        if (reduceMotion.matches || !document.body.animate) return;
        for (var i = 0; i < (count || 14); i++) {
            var bit = document.createElement("span");
            var size = 6 + Math.random() * 8;
            var shape = i % 3;
            bit.className = "burst-bit";
            bit.style.width = bit.style.height = size + "px";
            bit.style.background = BURST_COLORS[i % BURST_COLORS.length];
            bit.style.borderRadius = shape === 0 ? "50%" : "2px";
            if (shape === 2) bit.style.clipPath = "polygon(50% 0, 100% 100%, 0 100%)";
            document.body.appendChild(bit);
            var ang = Math.random() * Math.PI * 2;
            var dist = 50 + Math.random() * 90;
            var anim = bit.animate([
                { transform: "translate(" + x + "px," + y + "px) scale(1) rotate(0deg)", opacity: 1 },
                { transform: "translate(" + (x + Math.cos(ang) * dist) + "px," + (y + Math.sin(ang) * dist + 30) + "px) scale(.4) rotate(" + (Math.random() * 540 - 270) + "deg)", opacity: 0 }
            ], { duration: 700 + Math.random() * 500, easing: "cubic-bezier(.22,1,.36,1)" });
            anim.onfinish = (function (el) { return function () { el.remove(); }; })(bit);
        }
    }
    function centerOf(el) {
        var r = el.getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2];
    }

    /* ---------------- Easter eggs ---------------- */
    function openEgg() {
        var dlg = $("#egg");
        if (!dlg || dlg.open) return;
        if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
        document.dispatchEvent(new CustomEvent("av:secret", { detail: "controlplane" }));
        var c = centerOf(dlg);
        burst(c[0], c[1] - 120, 22);
    }

    function initEggs() {
        // Orb: cycles through materials
        var orb = $("#orb");
        var MATERIALS = ["glass", "chrome", "iris", "lime"];
        var mi = 0;
        if (orb) {
            orb.setAttribute("data-material", "glass");
            orb.addEventListener("click", function () {
                mi = (mi + 1) % MATERIALS.length;
                orb.setAttribute("data-material", MATERIALS[mi]);
                orb.classList.remove("is-poked");
                void orb.offsetWidth;
                orb.classList.add("is-poked");
                var c = centerOf(orb);
                burst(c[0], c[1], 10);
                announce("The orb is now " + MATERIALS[mi]);
            });
        }

        // Satellite: changes orbit
        var sat = $("#satellite");
        var sculpture = $("#sculpture");
        if (sat && sculpture) {
            sat.addEventListener("click", function () {
                sculpture.classList.toggle("is-alt");
                var c = centerOf(sat);
                burst(c[0], c[1], 6);
                announce(sculpture.classList.contains("is-alt") ? "Satellite moved to a polar orbit" : "Satellite back in its usual orbit");
            });
        }

        // Sparkle in the About section
        var spark = $("#spark");
        if (spark) spark.addEventListener("click", function () { var c = centerOf(spark); burst(c[0], c[1], 18); });

        // Control plane: footer cloud, typing "cloud", or the terminal
        var footerEgg = $("#footer-egg");
        if (footerEgg) footerEgg.addEventListener("click", openEgg);
        var typed = "";
        document.addEventListener("keydown", function (e) {
            var t = e.target;
            if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            var k = (e.key || "").toLowerCase();
            if (k.length === 1) {
                typed = (typed + k).slice(-5);
                if (typed === "cloud") { typed = ""; openEgg(); }
            }
        });

        // The footer wakes up when you reach it
        var footer = $("#site-footer");
        if (footer && "IntersectionObserver" in window) {
            var fio = new IntersectionObserver(function (entries) {
                if (entries[0].isIntersecting) { footer.classList.add("is-awake"); fio.disconnect(); }
            }, { threshold: 0.35 });
            fio.observe(footer);
        } else if (footer) {
            footer.classList.add("is-awake");
        }
    }

    /* ---------------- Chapter lighting ---------------- */
    function initChapters() {
        var atmo = $("#atmo");
        if (!atmo || !("IntersectionObserver" in window)) return;
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) atmo.setAttribute("data-chapter", en.target.getAttribute("data-chapter"));
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        $$("[data-chapter]").forEach(function (el) { io.observe(el); });
    }

    /* ---------------- Custom cursor (fine pointers, motion allowed; native cursor stays) ---------------- */
    function initCursor() {
        if (!finePointer.matches || reduceMotion.matches) return;
        var root = document.createElement("div");
        root.className = "cursor";
        root.setAttribute("aria-hidden", "true");
        var ring = document.createElement("div");
        var label = document.createElement("span");
        var dot = document.createElement("div");
        ring.className = "cursor__ring";
        label.className = "cursor__label";
        dot.className = "cursor__dot";
        ring.appendChild(label);
        root.appendChild(ring);
        root.appendChild(dot);
        document.body.appendChild(root);
        var x = -100, y = -100, rx = -100, ry = -100, running = false, still = 0, on = false, state = "";

        function frame() {
            rx += (x - rx) * 0.2;
            ry += (y - ry) * 0.2;
            ring.style.transform = "translate3d(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px,0)";
            dot.style.transform = "translate3d(" + x + "px," + y + "px,0)";
            if (Math.abs(x - rx) + Math.abs(y - ry) < 0.3 && ++still > 10) { running = false; return; }
            window.requestAnimationFrame(frame);
        }
        function wake() { still = 0; if (!running) { running = true; window.requestAnimationFrame(frame); } }

        window.addEventListener("pointermove", function (e) {
            if (e.pointerType !== "mouse") return;
            x = e.clientX; y = e.clientY;
            if (!on) { on = true; root.classList.add("is-on"); }
            wake();
        }, { passive: true });
        document.documentElement.addEventListener("mouseleave", function () { on = false; root.classList.remove("is-on"); });

        var LABELS = [[".case__frame", "VIEW"], [".case__link, .next-card", "OPEN"], [".arch-node", "EXPLORE"], [".skill", "INSPECT"]];
        document.addEventListener("pointerover", function (e) {
            var t = e.target;
            if (!t || !t.closest) return;
            var txt = t.closest("input, textarea");
            var lbl = "";
            var dc = t.closest("[data-cursor]");
            if (dc) lbl = dc.getAttribute("data-cursor");
            else for (var i = 0; i < LABELS.length && !lbl; i++) if (t.closest(LABELS[i][0])) lbl = LABELS[i][1];
            var hover = !lbl && t.closest("a, button, summary, label, [role=button]");
            var next = txt ? "is-text" : lbl ? "is-label" : hover ? "is-hover" : "";
            if (next !== state) {
                if (state) root.classList.remove(state);
                if (next) root.classList.add(next);
                state = next;
            }
            if (lbl && label.textContent !== lbl) label.textContent = lbl;
        });
    }

    /* ---------------- Lazy init: run a module when its section approaches the viewport ---------------- */
    function whenNear(selector, fn) {
        var el = $(selector);
        if (!el) return;
        if (!("IntersectionObserver" in window) || location.hash) { fn(); return; }
        var io = new IntersectionObserver(function (entries) {
            if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); safe(fn); }
        }, { rootMargin: "1200px 0px" });
        io.observe(el);
    }

    /* ---------------- Easter-egg module (lazy, optional, isolated) ---------------- */
    var eggsLoaded = false;
    function loadEggs() {
        if (eggsLoaded) return;
        eggsLoaded = true;
        var css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "/eggs.min.css?v=dev";
        document.head.appendChild(css);
        var js = document.createElement("script");
        js.src = "/eggs.min.js?v=dev";
        js.defer = true;
        document.head.appendChild(js);
    }

    /* ---------------- After Hours: the arcade loads only near the end of the page ---------------- */
    var arcadeLoaded = false;
    function loadArcade() {
        if (arcadeLoaded || !$("#arcade")) return;
        arcadeLoaded = true;
        var css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "/arcade.min.css?v=dev";
        document.head.appendChild(css);
        var js = document.createElement("script");
        js.src = "/arcade.min.js?v=dev";
        js.defer = true;
        document.head.appendChild(js);
    }
    function initArcade() {
        var arcade = $("#arcade");
        if (!arcade) return;
        whenNear("#arcade", loadArcade);
        // A Play pressed before the games have arrived is remembered and opened once they do
        arcade.addEventListener("click", function (e) {
            var b = e.target.closest && e.target.closest("[data-play]");
            if (!b || arcade.classList.contains("is-ready")) return;
            window.__arcadeQueue = b.getAttribute("data-play");
            loadArcade();
        });
    }

    /* ---------------- Boot ---------------- */
    function safe(fn) {
        try { fn(); } catch (err) { if (window.console) console.error(err); }
    }

    // Each non-critical module runs in its own task so none blocks input for long
    var idle = window.requestIdleCallback
        ? function (fn) { window.requestIdleCallback(fn, { timeout: 600 }); }
        : function (fn) { window.setTimeout(fn, 16); };

    function queue(fns) {
        if (!fns.length) return;
        idle(function () {
            safe(fns[0]);
            queue(fns.slice(1));
        });
    }

    function boot() {
        var year = $("#year");
        if (year) year.textContent = String(new Date().getFullYear());

        [initTheme, initNav, initAnchors, initScroll, initReveal, initQuickView].forEach(safe);
        queue([initHero, initTopology, initArcade, initFeature, initChapters, initInView, initPointerFx, initSkills, initContact, initEggs, initCursor, initTerminal]);
        whenNear("#architecture", initArchitecture);

        // Start ambient motion once the page has finished loading
        function ready() { window.setTimeout(function () { idle(function () { var h = $(".hero"); if (h) h.classList.add("is-ready"); }); }, 1800); }
        if (document.readyState === "complete") ready();
        else window.addEventListener("load", ready);

        // Easter eggs load on the first interaction (or ~7 s after load). Keys pressed before the
        // module arrives are kept in memory only, so a secret typed right away still counts.
        var early = window.__avEarlyKeys = [];
        function remember(e) {
            if (window.__avEggs) { document.removeEventListener("keydown", remember, true); return; }
            early.push({ key: e.key, ctrl: e.ctrlKey, meta: e.metaKey, shift: e.shiftKey, alt: e.altKey, typing: !!(e.target && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))) });
            if (early.length > 12) early.shift();
        }
        document.addEventListener("keydown", remember, true);
        ["keydown", "pointerdown", "touchstart", "scroll"].forEach(function (type) {
            window.addEventListener(type, loadEggs, { once: true, passive: true });
        });
        function eggsLater() { window.setTimeout(function () { idle(loadEggs); }, 7000); }
        if (document.readyState === "complete") eggsLater();
        else window.addEventListener("load", eggsLater);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();
