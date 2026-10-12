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
        // Re-measure until the target stays put for two consecutive checks
        var stable = 0;
        function settle() {
            var off = target.getBoundingClientRect().top - headerH - 8;
            if (Math.abs(off) > 2) { stable = 0; go("instant"); }
            else stable++;
            if (stable < 2 && attempts++ < 12) window.setTimeout(settle, 80);
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
                if (e.target.closest("a")) setOpen(false);
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
            var heroParts = [head, echo, spin, hud, sticker, mesh].concat(lines);
            var runaway = satelliteRunaway(hero);

            scene(hero, function (_, __, y, still) {
                var p = clamp(y / heroH, 0, 1);
                if (cue) cue.style.setProperty("--hero-p", p.toFixed(3));
                if (still) return;
                runaway(p);
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
            }, {
                measure: false,
                essential: true,
                reset: function () {
                    heroParts.forEach(function (el) { if (el) { el.style.transform = ""; el.style.opacity = ""; } });
                    if (sculpture) sculpture.style.translate = "";
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

        /* --- About: the outline word fills in; a glass prism drifts the wrong way, then settles --- */
        var about = $("#about");
        if (about) {
            var mega = $(".mega", about);
            var prism = $(".about__prism", about);
            scene(about, function (p) {
                var k = wide ? 1 : 0.6;
                if (mega) {
                    mega.style.setProperty("--fill", (range(p, 0.12, 0.42) * 100).toFixed(1) + "%");
                    move(mega, (0.3 - p) * 160 * k, 0);
                }
                if (prism) {
                    var t = range(p, 0.02, 0.45);
                    var y = 150 * (1 - t) * Math.cos(t * 2.3) - range(p, 0.45, 1) * 90;
                    var x = -42 * Math.sin(Math.PI * t);
                    var r = -38 * (1 - t) + 9 * Math.sin(Math.PI * t);
                    move(prism, x * k, y * k, " rotate(" + r.toFixed(2) + "deg)");
                }
            }, {
                reset: function () {
                    if (mega) { mega.style.transform = ""; mega.style.removeProperty("--fill"); }
                    if (prism) prism.style.transform = "";
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
            scene(timeline, function (p, r, y, still) {
                var prog = clamp((vh * 0.7 - r.top) / r.height, 0, 1);
                timeline.style.setProperty("--progress", prog.toFixed(4));
                var reach = prog * r.height;
                jobs.forEach(function (j) { lit(j, reach >= j.offsetTop + 4); });
                if (comet && !still) {
                    move(comet, 0, reach);
                    comet.style.opacity = prog > 0.002 && prog < 0.998 ? "1" : "0";
                }
            }, { essential: true });
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
        window.addEventListener("resize", resize, { passive: true });
        onChange(reduceMotion, request);
        // First measurement in a frame, not synchronously during boot
        window.requestAnimationFrame(resize);
    }

    /* The signature moment: on the first scroll, the hero's satellite falls behind its orbit,
       tumbles, fires its thrusters and snaps back. The HUD files a short incident report. */
    function satelliteRunaway(hero) {
        var sat = $("#satellite");
        var sculpture = $("#sculpture");
        var hudLine = $(".hud p");
        var last = -1e9, home = true, timers = [];
        if (!sat || !sat.animate) return function () {};

        function report(text, state) {
            if (!hudLine) return;
            var node = hudLine.lastChild;
            if (!node || node.nodeType !== 3) { node = document.createTextNode(""); hudLine.appendChild(node); }
            node.textContent = text;
            hudLine.setAttribute("data-state", state || "");
        }

        function go() {
            home = false;
            last = Date.now();
            timers.forEach(window.clearTimeout);
            sat.classList.add("is-adrift");
            if (sculpture) sculpture.classList.add("is-incident");
            report("sat-01 off orbit", "alert");
            sat.animate([
                { translate: "0 0", rotate: "0deg", scale: 1, easing: "cubic-bezier(.3,0,.6,1)" },
                { translate: "-64px 40px", rotate: "-70deg", scale: 1.15, offset: 0.3, easing: "cubic-bezier(.4,0,.6,1)" },
                { translate: "-104px 62px", rotate: "-200deg", scale: 1.25, offset: 0.55, easing: "cubic-bezier(.6,0,.1,1)" },
                { translate: "8px -6px", rotate: "16deg", scale: 1.1, offset: 0.8, easing: "cubic-bezier(.3,0,.3,1)" },
                { translate: "0 0", rotate: "0deg", scale: 1 }
            ], { duration: 2800 });
            timers = [
                window.setTimeout(function () {
                    // Thrusters: a short puff where the satellite turns back
                    report("thrusters · correcting", "alert");
                    var c = centerOf(sat);
                    burst(c[0], c[1], 7);
                }, 1540),
                window.setTimeout(function () {
                    sat.classList.remove("is-adrift");
                    if (sculpture) sculpture.classList.remove("is-incident");
                    report("orbit restored ✓", "ok");
                }, 2300),
                window.setTimeout(function () { report("engineering in progress", ""); }, 4800)
            ];
        }

        return function (p) {
            // Runs on the way down from the top; again only after a return to the top and a pause
            if (p < 0.02) { home = true; return; }
            if (home && p > 0.03 && p < 0.5 && Date.now() - last > 12000 &&
                hero.classList.contains("is-ready") && !hero.classList.contains("is-offscreen")) go();
        };
    }

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
                if (!entry.target.classList.contains("split") && !entry.target.closest(".is-visible")) splitWords(entry.target);
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
        }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

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

        // Letters of the first name wobble on hover (the h1 keeps a plain-text accessible name)
        var title = $("#hero-title");
        var first = $(".hero__word", hero);
        if (title && first && !reduceMotion.matches) {
            title.setAttribute("aria-label", title.textContent.replace(/s+/g, " ").trim());
            first.innerHTML = first.textContent.split("").map(function (c) { return '<span class="letter" aria-hidden="true">' + c + "</span>"; }).join("");
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
        $$(".case, .arch__stage").forEach(function (el) { io.observe(el); });
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

        [initTheme, initNav, initAnchors, initScroll, initReveal].forEach(safe);
        queue([initHero, initFeature, initChapters, initInView, initPointerFx, initSkills, initContact, initEggs, initCursor, initTerminal]);
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
