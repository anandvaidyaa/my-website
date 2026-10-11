/* ==========================================================================
   Anand Vaidya — hidden rooms (easter eggs)
   Lazy-loaded by script.js after the page settles. Isolated from the core site:
   everything here is optional, local-only and safe to delete.
   - No network requests, no analytics. Keystrokes are only compared against a
     few short sequences in memory and never stored or sent anywhere.
   - The only thing persisted is the list of secrets found (localStorage, with an
     in-memory fallback).
   ========================================================================== */
(function () {
    "use strict";
    if (window.__avEggs) return;
    window.__avEggs = true;

    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var coarse = window.matchMedia("(hover: none), (pointer: coarse)");
    var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    var EMAIL = "anand.svaidya24@gmail.com";

    function el(tag, attrs, html) {
        var n = document.createElement(tag);
        Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
        if (html != null) n.innerHTML = html;
        return n;
    }
    function typingTarget(t) {
        return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    }
    function wait(ms) { return new Promise(function (r) { window.setTimeout(r, ms); }); }

    /* ---------------- Discovery system ---------------- */
    var SECRETS = [
        ["devmode", "Developer mode"],
        ["chaos", "Chaos mode"],
        ["cat", "The cloud's guardian"],
        ["terminal", "The hidden terminal"],
        ["constellation", "The constellation"],
        ["card", "Holographic business card"],
        ["glitch", "The name glitch"],
        ["gravity", "Reverse gravity"],
        ["coords", "The coordinates"],
        ["controlplane", "The control plane"]
    ];
    var STORE = "av-secrets";
    var memory = [];
    function load() {
        try { memory = JSON.parse(localStorage.getItem(STORE) || "[]"); } catch (e) { /* storage blocked: session only */ }
        if (!Array.isArray(memory)) memory = [];
        memory = memory.filter(function (id) { return SECRETS.some(function (s) { return s[0] === id; }); });
    }
    function save() { try { localStorage.setItem(STORE, JSON.stringify(memory)); } catch (e) { /* session only */ } }
    function nameOf(id) { return (SECRETS.filter(function (s) { return s[0] === id; })[0] || [id, id])[1]; }
    load();

    var toastBox = el("div", { "class": "egg-toasts", role: "status", "aria-live": "polite" });
    var canPop = typeof toastBox.showPopover === "function";
    if (canPop) toastBox.setAttribute("popover", "manual"); // top layer: stays visible above open dialogs
    document.body.appendChild(toastBox);
    function raiseToasts() {
        if (!canPop) return;
        try { if (toastBox.matches(":popover-open")) toastBox.hidePopover(); toastBox.showPopover(); } catch (e) { /* ignore */ }
    }
    function toast(title, body, tone) {
        var t = el("div", { "class": "egg-toast" + (tone ? " egg-toast--" + tone : "") });
        var h = el("strong"); h.textContent = title;
        var p = el("span"); p.textContent = body || "";
        t.appendChild(el("i", { "aria-hidden": "true" }));
        t.appendChild(h);
        t.appendChild(p);
        toastBox.appendChild(t);
        while (toastBox.children.length > 2) toastBox.removeChild(toastBox.firstChild);
        raiseToasts();
        window.setTimeout(function () { t.classList.add("is-out"); }, 4200);
        window.setTimeout(function () {
            t.remove();
            if (canPop && !toastBox.children.length) { try { toastBox.hidePopover(); } catch (e) { /* ignore */ } }
        }, 4800);
    }

    // Created only once something has been found, so there is never an empty control in the page
    var pill = null;
    function renderPill(bump) {
        if (!memory.length) { if (pill) pill.hidden = true; return; }
        if (!pill) {
            pill = el("button", { "class": "secrets-pill", type: "button" });
            pill.addEventListener("click", function () { openTerminal(["secrets"]); });
            document.body.appendChild(pill);
        }
        pill.hidden = false;
        pill.innerHTML = '<span aria-hidden="true">&#10022;</span> Secrets discovered: <b>' + memory.length + " / " + SECRETS.length + "</b>";
        pill.setAttribute("aria-label", "Secrets discovered: " + memory.length + " of " + SECRETS.length + ". Open the hidden terminal.");
        if (bump) { pill.classList.remove("is-bump"); void pill.offsetWidth; pill.classList.add("is-bump"); }
    }
    renderPill(false);

    function discover(id) {
        if (memory.indexOf(id) > -1) return;
        memory.push(id);
        save();
        renderPill(true);
        toast("Secret found", nameOf(id) + " · " + memory.length + " / " + SECRETS.length);
        if (memory.length === SECRETS.length) window.setTimeout(function () { signature(); }, 1600);
    }
    document.addEventListener("av:secret", function (e) { discover(e.detail); });
    document.addEventListener("av:hint", function () {
        toast("Hint", (isMac ? "⌘" : "Ctrl") + " + Shift + K opens something.", "hint");
    });

    /* ---------------- Particles ---------------- */
    var COLORS = ["#2ad4f0", "#7b5cff", "#ff4fd8", "#c6ff3d", "#6b95ff"];
    function burst(x, y, count, spread) {
        if (reduce.matches || !document.body.animate) return;
        for (var i = 0; i < count; i++) {
            var b = el("span", { "class": "egg-bit", "aria-hidden": "true" });
            var size = 5 + Math.random() * 8;
            b.style.width = b.style.height = size + "px";
            b.style.background = COLORS[i % COLORS.length];
            b.style.borderRadius = i % 3 === 0 ? "50%" : "2px";
            if (i % 3 === 2) b.style.clipPath = "polygon(50% 0,100% 100%,0 100%)";
            document.body.appendChild(b);
            var a = Math.random() * Math.PI * 2, d = (spread || 100) * (.5 + Math.random() * .7);
            b.animate([
                { transform: "translate(" + x + "px," + y + "px)", opacity: 1 },
                { transform: "translate(" + (x + Math.cos(a) * d) + "px," + (y + Math.sin(a) * d + 30) + "px) rotate(" + (Math.random() * 500 - 250) + "deg) scale(.4)", opacity: 0 }
            ], { duration: 800 + Math.random() * 600, easing: "cubic-bezier(.22,1,.36,1)" }).onfinish = (function (n) { return function () { n.remove(); }; })(b);
        }
    }
    function centre(n) { var r = n.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }

    /* ---------------- Dialog helper (native <dialog>: focus trap + Esc) ---------------- */
    function makeDialog(cls, label) {
        var d = el("dialog", { "class": "egg-dialog " + cls, "aria-label": label });
        document.body.appendChild(d);
        d.addEventListener("click", function (e) { if (e.target === d) d.close(); });
        return d;
    }
    function openDialog(d) {
        if (d.open) return;
        d._opener = document.activeElement;
        d.showModal();
        d.addEventListener("close", function back() {
            d.removeEventListener("close", back);
            if (d._opener && d._opener.focus) d._opener.focus({ preventScroll: true });
        });
    }
    function closeButton(text) {
        var b = el("button", { "class": "egg-close", type: "button" }, '<svg class="i" aria-hidden="true"><use href="#i-close"/></svg><span>' + text + "</span>");
        b.addEventListener("click", function () { b.closest("dialog").close(); });
        return b;
    }

    /* ======================================================================
       1. Developer mode — type ANAND
       ====================================================================== */
    var dev = null;
    var DEV_LOG = [
        "mounting /dev/curiosity ............ ok",
        "resolving coffee.supply ............ ok (latency: 1 cup)",
        "az login --identity ................ managed identity, zero passwords",
        "bicep build personality.bicep ...... 0 warnings",
        "func start --event-driven .......... listening",
        "deploying charm to all regions ..... done"
    ];
    function openDevMode() {
        if (!dev) {
            dev = makeDialog("devmode", "Developer mode");
            var sym = ["{ }", "</>", "λ", "∑", "⌘", "∞", "◇", "01", "∈", "∇", "☁", "#"];
            var floaters = sym.map(function (s, i) {
                var x = (i * 37 + 11) % 92 + 3, y = (i * 53 + 7) % 84 + 6; // spread around the panel
                return '<span style="--i:' + i + ";left:" + x + "%;top:" + y + '%">' + s + "</span>";
            }).join("");
            dev.innerHTML =
                '<div class="dm__grid" aria-hidden="true"></div>' +
                '<div class="dm__symbols" aria-hidden="true">' + floaters + "</div>" +
                '<div class="dm__panel">' +
                '<p class="dm__kicker">anand.exe &middot; pid 2023 &middot; ring 0 (of fun)</p>' +
                '<h2 class="dm__title">ANAND.EXE <span>&mdash; DEVELOPER MODE ACTIVATED</span></h2>' +
                '<pre class="dm__log" aria-hidden="true"></pre>' +
                '<dl class="dm__stats">' +
                '<div><dt>Coffee dependency</dt><dd><b class="tone-hot">HIGH</b><i style="--v:.94"></i></dd></div>' +
                '<div><dt>Cloud infrastructure</dt><dd><b class="tone-ok">STABLE</b><i style="--v:.99"></i></dd></div>' +
                '<div><dt>Curiosity engine</dt><dd><b class="tone-ok">RUNNING</b><i style="--v:.88"></i></dd></div>' +
                '<div><dt>Secrets in config files</dt><dd><b class="tone-ok">0</b><i style="--v:0"></i></dd></div>' +
                "</dl>" +
                '<p class="dm__foot">Everything above is a joke. No real system was inspected.</p>' +
                "</div>";
            $(".dm__panel", dev).appendChild(closeButton("Exit developer mode"));
        }
        openDialog(dev);
        discover("devmode");
        var log = $(".dm__log", dev);
        log.textContent = "";
        if (reduce.matches) { log.textContent = DEV_LOG.map(function (l) { return "> " + l; }).join("\n"); return; }
        (async function () {
            for (var i = 0; i < DEV_LOG.length && dev.open; i++) {
                log.textContent += (i ? "\n" : "") + "> ";
                for (var c = 0; c < DEV_LOG[i].length && dev.open; c++) {
                    log.textContent += DEV_LOG[i][c];
                    if (c % 3 === 0) await wait(12);
                }
                await wait(140);
            }
        })();
    }

    /* ======================================================================
       2. Chaos mode — Konami code
       ====================================================================== */
    var chaosTimer = 0;
    function startChaos() {
        discover("chaos");
        var hero = $(".hero");
        document.body.classList.add("is-chaos");
        toast("REALITY.EXE", "has stopped following the design system.", "chaos");
        if (hero && !reduce.matches) {
            var ring = el("div", { "class": "chaos-sats", "aria-hidden": "true" }, "<span></span><span></span><span></span><span></span>");
            hero.appendChild(ring);
            var c = centre(hero.querySelector(".hero__type") || hero);
            burst(c[0], Math.min(c[1], window.innerHeight * .5), 34, 220);
        }
        window.clearTimeout(chaosTimer);
        chaosTimer = window.setTimeout(endChaos, 12000);
    }
    function endChaos() {
        document.body.classList.remove("is-chaos");
        $$(".chaos-sats").forEach(function (n) { n.remove(); });
        toast("Design system restored", "Everything is back on the grid. Mostly.");
    }

    /* ======================================================================
       3. The cat — peeks over the contact form
       ====================================================================== */
    var CAT_SVG =
        '<svg viewBox="0 0 120 96" aria-hidden="true">' +
        '<g class="cat__tail"><path d="M88 78c16 0 22-10 20-22-1-7-7-9-10-5"/></g>' +
        '<path class="cat__body" d="M34 92c-6-16-4-34 6-44l-4-26 16 13c5-1 11-1 16 0l16-13-4 26c10 10 12 28 6 44z"/>' +
        '<path class="cat__inner" d="M41 24l3 12M79 24l-3 12"/>' +
        '<g class="cat__eyes"><ellipse cx="50" cy="56" rx="4.5" ry="5.5"/><ellipse cx="70" cy="56" rx="4.5" ry="5.5"/></g>' +
        '<path class="cat__nose" d="M58 64h4l-2 2.4z"/>' +
        '<path class="cat__whisk" d="M44 66l-14-2M44 69l-13 3M76 66l14-2M76 69l13 3"/>' +
        '<g class="cat__stars"><circle cx="20" cy="18" r="1.6"/><circle cx="104" cy="12" r="1.6"/><circle cx="60" cy="4" r="1.6"/><circle cx="10" cy="44" r="1.2"/><circle cx="112" cy="40" r="1.2"/>' +
        '<path d="M20 18 60 4 104 12M10 44 20 18M104 12 112 40"/></g>' +
        "</svg>";
    var CAT_LINES = [
        "Meow. All pods healthy.",
        "This cat has nine lives and zero single points of failure.",
        "Purring at a steady 60 fps.",
        "Knocked a config file off the table. Redeploying from Bicep.",
        "Cats are naturally serverless: they scale to zero between naps.",
        "Currently guarding the API gateway. Rate limit: one pat per second."
    ];
    function initCat() {
        var form = $("#contact-form");
        if (!form) return;
        var nest = el("div", { "class": "cat-nest" });
        var cat = el("button", { "class": "cat", type: "button", "aria-label": "A small cat is peeking over the form. Pet the cat." }, CAT_SVG);
        var bubble = el("p", { "class": "cat-bubble", role: "status", "aria-live": "polite" });
        nest.appendChild(cat);
        form.appendChild(nest);
        form.appendChild(bubble);
        var clicks = 0, hideT = 0;
        cat.addEventListener("click", function () {
            clicks++;
            var msg;
            if (clicks === 1) { msg = "You found the guardian of the cloud infrastructure."; discover("cat"); }
            else if (clicks === 5) { msg = "The cat drew you a constellation. It looks suspiciously like a cat."; cat.classList.add("is-stargazing"); }
            else msg = CAT_LINES[(clicks + Math.floor(Math.random() * CAT_LINES.length)) % CAT_LINES.length];
            bubble.textContent = msg;
            bubble.classList.add("is-on");
            cat.classList.remove("is-jumping");
            void cat.offsetWidth;
            cat.classList.add("is-jumping");
            if (clicks === 5) { var c = centre(cat); burst(c[0], c[1] - 20, 16, 90); }
            window.clearTimeout(hideT);
            hideT = window.setTimeout(function () { bubble.classList.remove("is-on"); cat.classList.remove("is-stargazing"); }, 4200);
        });
        // Peek only while the contact section is on screen
        if ("IntersectionObserver" in window) {
            new IntersectionObserver(function (en) { nest.classList.toggle("is-awake", en[0].isIntersecting); }).observe(form);
        }
    }

    /* ======================================================================
       4. The hidden terminal — Ctrl/⌘ + Shift + K
       ====================================================================== */
    var term = null, out = null, input = null, termQueue = Promise.resolve();
    function line(text, cls) {
        var p = el("p", cls ? { "class": cls } : {});
        p.textContent = text;
        out.appendChild(p);
        out.scrollTop = out.scrollHeight;
        return p;
    }
    async function typeLine(text, cls) {
        if (reduce.matches) return line(text, cls);
        var p = line("", cls);
        for (var i = 0; i < text.length; i++) {
            p.textContent += text[i];
            if (i % 2 === 0) await wait(9);
        }
        out.scrollTop = out.scrollHeight;
        return p;
    }
    var COMMANDS = {
        help: async function () {
            await typeLine("commands:", "t-h");
            [["about", "who is this"], ["whoami", "who are you, though"], ["skills", "the verified stack"], ["projects", "things that shipped"],
             ["sudo hire anand", "you know you want to"], ["card", "a holographic business card"], ["secrets", "your progress"],
             ["reset", "forget found secrets"], ["clear", "clear the screen"], ["exit", "close this terminal"]]
                .forEach(function (r) { line("  " + (r[0] + "                 ").slice(0, 17) + r[1]); });
        },
        about: async function () {
            await typeLine("Anand Vaidya — Azure Cloud Engineer at FSP Consulting, Vadodara.", "t-h");
            await typeLine("Builds serverless integrations, secure APIs and automated infrastructure on Microsoft Azure.");
            await typeLine("Turns hours of manual processing into seconds. Engineering since Feb 2023.");
        },
        whoami: async function () {
            await typeLine("you: a person who opens hidden terminals on portfolio sites.");
            await typeLine("classification: curious. clearance: granted. snacks: not provided.", "t-muted");
        },
        skills: async function () {
            [["azure", "App Services, Managed Identities, Azure AD B2C"], ["serverless", "Azure Functions, Logic Apps"],
             ["apis & data", "API Management, OAuth 2.0, Cosmos DB, SQL Server"], ["iac", "Azure Bicep, ARM Templates"],
             ["devops", "Azure DevOps, CI/CD pipelines, Docker"], ["code", "ASP.NET Core & C#, JavaScript, Python"]]
                .forEach(function (r) { line((r[0] + ":            ").slice(0, 13) + r[1]); });
        },
        projects: async function () {
            line("01  Multi-Channel Order Processing Platform  · Functions + Cosmos DB", "t-h");
            line("02  Zero-Downtime Cloud Deployment Pipeline  · Bicep + Azure DevOps", "t-h");
            line("03  Carrier & Shipping Integration Layer     · API Management + OAuth 2.0", "t-h");
            var p = line("read the case studies: ");
            var a = el("a", { href: "/#projects" }); a.textContent = "/#projects";
            a.addEventListener("click", function () { term.close(); });
            p.appendChild(a);
        },
        "sudo hire anand": async function () {
            await typeLine("Request received...");
            await wait(260);
            await typeLine("Checking cloud architecture skills... PASSED", "t-ok");
            await typeLine("Checking serverless & IaC experience... PASSED", "t-ok");
            await typeLine("Checking coffee dependency... CRITICAL", "t-hot");
            await wait(200);
            await typeLine("Recommendation: Let's talk.", "t-h");
            var p = line("");
            var a = el("a", { href: "/#contact", "class": "t-cta" }); a.textContent = "Open the contact section →";
            a.addEventListener("click", function () { term.close(); });
            var m = el("a", { href: "mailto:" + EMAIL }); m.textContent = EMAIL;
            p.appendChild(a); p.appendChild(document.createTextNode("  or  ")); p.appendChild(m);
            hiredStamp();
        },
        card: async function () { await typeLine("materialising business card..."); term.close(); openCard(); },
        secrets: async function () {
            await typeLine("secrets discovered: " + memory.length + " / " + SECRETS.length, "t-h");
            SECRETS.forEach(function (s) { line((memory.indexOf(s[0]) > -1 ? "  ✓ " + s[1] : "  · ???"), memory.indexOf(s[0]) > -1 ? "t-ok" : "t-muted"); });
            if (memory.length === SECRETS.length) line("all found. type `signature` to replay the finale.", "t-muted");
            else line("hint: names, stars, crystals, cats and old cheat codes are all worth a closer look.", "t-muted");
        },
        reset: async function () {
            memory = [];
            save();
            renderPill(false);
            await typeLine("secrets forgotten. go explore again.", "t-ok");
        },
        signature: async function () {
            if (memory.length < SECRETS.length) { await typeLine("permission denied: find every secret first.", "t-muted"); return; }
            term.close();
            signature();
        },
        chaos: async function () { await typeLine("nice try. chaos requires the ancient code.", "t-muted"); },
        whereami: async function () { await typeLine("22.31°N · 73.18°E — Vadodara, India. You are on anandvaidya.in."); },
        sudo: async function () { await typeLine("sudo what? (try: sudo hire anand)", "t-muted"); },
        clear: async function () { out.textContent = ""; },
        exit: async function () { term.close(); }
    };
    var WITTY = [
        "command not found. it has been added to the backlog.",
        "that command is still in a feature branch.",
        "404: command escaped to another cloud region.",
        "the cat looked at that command and walked away."
    ];
    function hiredStamp() {
        if (!term) return;
        var s = el("div", { "class": "hire-stamp", "aria-hidden": "true" }, "LET&rsquo;S<br>TALK");
        term.appendChild(s);
        var c = centre(term);
        burst(c[0], c[1], 26, 160);
        window.setTimeout(function () { s.remove(); }, 2600);
    }
    function buildTerminal() {
        term = makeDialog("sterm", "Hidden terminal");
        term.innerHTML =
            '<div class="sterm__bar"><span class="sterm__dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
            '<span class="sterm__title">anand@hidden-room: ~</span></div>' +
            '<div class="sterm__out" role="log" aria-live="polite" tabindex="0"></div>' +
            '<form class="sterm__form" autocomplete="off"><label for="sterm-in">anand@hidden-room:~$</label>' +
            '<input id="sterm-in" type="text" spellcheck="false" autocapitalize="off" aria-label="Hidden terminal command"></form>';
        term.querySelector(".sterm__bar").appendChild(closeButton("Close terminal"));
        out = $(".sterm__out", term);
        input = $("#sterm-in", term);
        var hist = [], hi = 0;
        $(".sterm__form", term).addEventListener("submit", async function (e) {
            e.preventDefault();
            var cmd = input.value.trim().replace(/\s+/g, " ");
            input.value = "";
            if (!cmd) return;
            hist.push(cmd); hi = hist.length;
            // Commands queue up behind any output that is still typing
            termQueue = termQueue.then(async function () {
                line("$ " + cmd, "t-cmd");
                var fn = COMMANDS[cmd.toLowerCase()];
                try {
                    if (fn) await fn();
                    else await typeLine(WITTY[Math.floor(Math.random() * WITTY.length)] + " (type help)", "t-muted");
                } catch (err) { /* keep the shell alive */ }
            });
        });
        input.addEventListener("keydown", function (e) {
            if (e.key === "ArrowUp" && hist.length) { e.preventDefault(); hi = Math.max(0, hi - 1); input.value = hist[hi]; }
            if (e.key === "ArrowDown" && hist.length) { e.preventDefault(); hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ""; }
        });
    }
    async function openTerminal(run) {
        if (!term) buildTerminal();
        if (!term.open) {
            openDialog(term);
            discover("terminal");
            if (!out.childNodes.length) {
                line("hidden-room shell v1.0 — a simulation. nothing here runs on a real system.", "t-muted");
                line("type help to see what it can do.", "t-muted");
            }
        }
        input.focus();
        (run || []).forEach(function (c) { input.value = c; $(".sterm__form", term).requestSubmit(); });
    }

    /* ======================================================================
       5. The constellation — in the FAQ section
       ====================================================================== */
    var STARS = [
        { id: "apim", x: 18, y: 30, name: "API Management", fact: "One front door for every API: tokens checked at the gateway, not in every service.", key: true },
        { id: "func", x: 50, y: 18, name: "Azure Functions", fact: "Event-driven compute that scales out for bursts and down to zero when idle.", key: true },
        { id: "iac", x: 82, y: 38, name: "Bicep / IaC", fact: "Every environment rebuilt from the same code. Portal clicks optional.", key: true },
        { id: "cicd", x: 66, y: 72, name: "CI/CD", fact: "One pipeline took deployments from 2 days to 15 minutes." },
        { id: "mi", x: 34, y: 66, name: "Managed Identity", fact: "Services authenticate as themselves. Secrets stored in config: zero." },
        { id: "cosmos", x: 88, y: 84, name: "Cosmos DB", fact: "Order and inventory state for a sync that went from 5 minutes to under 2 seconds." },
        { id: "logic", x: 10, y: 82, name: "Logic Apps", fact: "Approval flows and carrier dispatch, kept out of the request path." },
        { id: "oauth", x: 40, y: 42, name: "OAuth 2.0", fact: "Short-lived tokens instead of shared credentials." }
    ];
    function initConstellation() {
        var host = $("#constellation");
        if (!host) return;
        var lines = "";
        host.innerHTML =
            '<svg class="cst__sky" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
            '<g class="cst__faint"><path d="M18 30 34 66 66 72 88 84M50 18 40 42 34 66M10 82 34 66M82 38 66 72"/></g>' +
            '<g class="cst__links"></g></svg>' +
            '<p class="cst__hint" aria-hidden="true">&#10022; some stars belong together</p>' +
            '<p class="cst__fact" role="status" aria-live="polite"></p>' +
            '<p class="cst__msg" aria-hidden="true">EVERY GREAT SYSTEM STARTS WITH A CONNECTION</p>';
        var links = $(".cst__links", host), fact = $(".cst__fact", host), picked = [];
        STARS.forEach(function (s) {
            var b = el("button", { type: "button", "class": "cst__star" + (s.key ? " is-key" : ""), style: "--x:" + s.x + ";--y:" + s.y, "aria-label": "Star: " + s.name });
            b.appendChild(el("span", { "aria-hidden": "true" }));
            b.addEventListener("click", function () {
                fact.textContent = s.name + " — " + s.fact;
                b.classList.add("is-lit");
                if (host.classList.contains("is-unlocked")) return;
                if (!s.key) { picked = []; links.innerHTML = ""; $$(".cst__star.is-picked", host).forEach(function (n) { n.classList.remove("is-picked"); }); return; }
                if (picked.indexOf(s) > -1) return;
                picked.push(s);
                b.classList.add("is-picked");
                if (picked.length > 1) {
                    var a = picked[picked.length - 2];
                    var ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    ln.setAttribute("x1", a.x); ln.setAttribute("y1", a.y); ln.setAttribute("x2", s.x); ln.setAttribute("y2", s.y);
                    ln.setAttribute("pathLength", "1");
                    links.appendChild(ln);
                }
                if (picked.length === 3) {
                    var ln2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    ln2.setAttribute("x1", picked[2].x); ln2.setAttribute("y1", picked[2].y); ln2.setAttribute("x2", picked[0].x); ln2.setAttribute("y2", picked[0].y);
                    ln2.setAttribute("pathLength", "1");
                    links.appendChild(ln2);
                    host.classList.add("is-unlocked");
                    fact.textContent = "API Management → Azure Functions → Bicep: the request path, provisioned as code.";
                    var c = centre(host);
                    burst(c[0], c[1], 24, 140);
                    discover("constellation");
                }
            });
            host.appendChild(b);
        });
        if (!coarse.matches && !reduce.matches) {
            host.addEventListener("pointermove", function (e) {
                var r = host.getBoundingClientRect();
                host.style.setProperty("--cx", ((e.clientX - r.left) / r.width - .5).toFixed(3));
                host.style.setProperty("--cy", ((e.clientY - r.top) / r.height - .5).toFixed(3));
            });
            host.addEventListener("pointerleave", function () { host.style.setProperty("--cx", 0); host.style.setProperty("--cy", 0); });
        }
    }

    /* ======================================================================
       6. Holographic business card — double-click the portrait or ID badge
       ====================================================================== */
    var card = null;

    // Clipboard API first, then the legacy fallback; always ends with a visible notice
    function copyEmail() {
        var settled = false;
        function done(ok) {
            if (settled) return;
            settled = true;
            if (ok) toast("Copied", EMAIL + " is on your clipboard.", "ok");
            else toast("Copy it by hand", "The address is " + EMAIL);
        }
        function legacy() {
            if (settled) return;
            var ta = el("textarea", { readonly: "", style: "position:fixed;opacity:0;left:0;top:0" });
            ta.value = EMAIL;
            (card || document.body).appendChild(ta);
            ta.select();
            var ok = false;
            try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
            ta.remove();
            done(ok);
        }
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(EMAIL).then(function () { done(true); }, legacy);
            window.setTimeout(legacy, 900);
        } else {
            legacy();
        }
    }

    function openCard() {
        if (!card) {
            card = makeDialog("bcard-dialog", "Holographic business card");
            card.innerHTML =
                '<div class="bcard" tabindex="-1">' +
                '<div class="bcard__sheen" aria-hidden="true"></div>' +
                '<div class="bcard__top"><svg class="bcard__mark" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18.5"/><path d="M11 28 18.5 11h3L29 28M14.5 21h11"/></svg>' +
                '<span class="bcard__site">anandvaidya.in</span></div>' +
                '<p class="bcard__name">Anand Vaidya</p>' +
                '<p class="bcard__role">Azure Cloud Engineer &middot; FSP Consulting</p>' +
                '<ul class="bcard__links">' +
                '<li><a href="mailto:' + EMAIL + '"><svg class="i" aria-hidden="true"><use href="#i-mail"/></svg>' + EMAIL + "</a></li>" +
                '<li><a href="https://www.linkedin.com/in/vaidya-anand" target="_blank" rel="noopener"><svg class="i" aria-hidden="true"><use href="#i-linkedin"/></svg>in/vaidya-anand</a></li>' +
                '<li><a href="https://github.com/anandvaidyaa" target="_blank" rel="noopener"><svg class="i" aria-hidden="true"><use href="#i-github"/></svg>github.com/anandvaidyaa</a></li>' +
                "</ul>" +
                '<div class="bcard__actions"><button type="button" class="btn btn--primary btn--sm bcard__copy"><svg class="i" aria-hidden="true"><use href="#i-copy"/></svg>Copy email</button></div>' +
                "</div>";
            $(".bcard__actions", card).appendChild(closeButton("Close card"));
            var c = $(".bcard", card);
            $(".bcard__copy", card).addEventListener("click", copyEmail);
            if (!coarse.matches && !reduce.matches) {
                c.addEventListener("pointermove", function (e) {
                    var r = c.getBoundingClientRect();
                    var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
                    c.style.setProperty("--rx", (y * -14).toFixed(2) + "deg");
                    c.style.setProperty("--ry", (x * 18).toFixed(2) + "deg");
                    c.style.setProperty("--sx", ((x + .5) * 100).toFixed(1) + "%");
                });
                c.addEventListener("pointerleave", function () { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); });
            }
        }
        openDialog(card);
        discover("card");
    }
    function initCardTriggers() {
        $$(".blob-portrait, .idcard").forEach(function (t) {
            t.addEventListener("dblclick", function (e) { e.preventDefault(); openCard(); });
            var last = 0; // double-tap on touch screens
            t.addEventListener("pointerup", function (e) {
                if (e.pointerType !== "touch") return;
                var now = Date.now();
                if (now - last < 320) openCard();
                last = now;
            });
        });
    }

    /* ======================================================================
       7. Micro-interactions
       ====================================================================== */
    function initMicro() {
        // Glitch the name: three quick clicks on the headline
        var title = $("#hero-title"), taps = [];
        if (title) title.addEventListener("click", function () {
            var now = Date.now();
            taps = taps.filter(function (t) { return now - t < 1200; }).concat(now);
            if (taps.length >= 3) {
                taps = [];
                title.classList.remove("is-glitch");
                void title.offsetWidth;
                title.classList.add("is-glitch");
                window.setTimeout(function () { title.classList.remove("is-glitch"); }, 900);
                discover("glitch");
            }
        });

        // Reverse gravity on the big crystal
        var shard = $(".shard:not(.shard--sm)");
        if (shard) {
            shard.removeAttribute("aria-hidden");
            shard.setAttribute("role", "button");
            shard.setAttribute("tabindex", "0");
            shard.setAttribute("aria-label", "Reverse the crystal's gravity");
            shard.setAttribute("data-cursor", "FLIP");
            var flip = function () {
                shard.classList.add("is-antigrav");
                var c = centre(shard);
                burst(c[0], c[1], 10, 70);
                discover("gravity");
                window.setTimeout(function () { shard.classList.remove("is-antigrav"); }, 6000);
            };
            shard.addEventListener("click", flip);
            shard.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
        }

        // Coordinates: the HUD's location line opens a note
        var hud = $(".hud");
        if (hud) {
            var rows = $$("p", hud);
            hud.removeAttribute("aria-hidden");
            rows.forEach(function (r, i) { if (i !== 1) r.setAttribute("aria-hidden", "true"); });
            var loc = rows[1];
            if (loc) {
                var btn = el("button", { type: "button", "class": "hud__loc", "aria-expanded": "false", "aria-controls": "coord-note", "data-cursor": "LOCATE" }, loc.innerHTML);
                btn.setAttribute("aria-label", "Coordinates 22.31 north, 73.18 east. Open a note.");
                loc.textContent = "";
                loc.appendChild(btn);
                var note = el("div", { "class": "coord-note glass glass--holo", id: "coord-note", role: "dialog", "aria-label": "A note from these coordinates", hidden: "" },
                    '<p class="coord-note__tag">22.31&deg;N &middot; 73.18&deg;E &middot; Vadodara, India</p>' +
                    "<p>This is where these things get built: one deployment, one pipeline and one cup of coffee at a time. " +
                    "The internet is just other people&rsquo;s computers &mdash; some of them are configured from here.</p>");
                var x = el("button", { type: "button", "class": "coord-note__close", "aria-label": "Close note" }, '<svg class="i" aria-hidden="true"><use href="#i-close"/></svg>');
                note.appendChild(x);
                $("#sculpture").appendChild(note);
                var setOpen = function (open) {
                    note.hidden = !open;
                    btn.setAttribute("aria-expanded", String(open));
                    if (open) { discover("coords"); x.focus(); }
                };
                btn.addEventListener("click", function () { setOpen(note.hidden); });
                x.addEventListener("click", function () { setOpen(false); btn.focus(); });
                document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !note.hidden) { setOpen(false); btn.focus(); } });
                document.addEventListener("click", function (e) { if (!note.hidden && !note.contains(e.target) && e.target !== btn && !btn.contains(e.target)) setOpen(false); });
            }
        }

        // A message for people who scroll all the way down
        var foot = $(".footer__bottom");
        if (foot && "IntersectionObserver" in window) {
            var nb = el("p", { "class": "dev-note" });
            nb.textContent = "psst — you scrolled all the way to the bottom. Most people don’t. Thanks for reading. — A";
            foot.parentNode.insertBefore(nb, foot);
            var io = new IntersectionObserver(function (en) {
                if (en[0].isIntersecting) { nb.classList.add("is-on"); io.disconnect(); }
            }, { threshold: 1 });
            io.observe(foot);
        }
    }

    /* ======================================================================
       10. The architect's signature — after every secret
       ====================================================================== */
    var sig = null;
    function signature() {
        if (!sig) {
            sig = makeDialog("sig", "You found every secret");
            sig.innerHTML =
                '<div class="sig__stage" aria-hidden="true">' +
                '<svg class="sig__sky" viewBox="0 0 200 200">' +
                '<g class="sig__stars"><circle cx="40" cy="60" r="2"/><circle cx="100" cy="30" r="2"/><circle cx="160" cy="70" r="2"/><circle cx="130" cy="150" r="2"/><circle cx="70" cy="140" r="2"/></g>' +
                '<g class="sig__lines"><path pathLength="1" d="M40 60 100 30 160 70 130 150 70 140Z"/></g>' +
                '<g class="sig__mark"><circle cx="100" cy="95" r="34"/><path d="M84 114 97 78h6l13 36M89 103h22"/></g>' +
                "</svg>" + CAT_SVG.replace('<svg viewBox', '<svg class="sig__cat" viewBox') +
                "</div>" +
                '<div class="sig__text"><p>YOU LOOKED CLOSER.</p><p>THAT&rsquo;S HOW GREAT ENGINEERS THINK.</p><p class="sig__by">&mdash; ANAND VAIDYA</p></div>' +
                '<div class="sig__actions"><a class="btn btn--primary" href="/#contact">Let&rsquo;s talk <svg class="i" aria-hidden="true"><use href="#i-arrow-right"/></svg></a></div>';
            $(".sig__actions", sig).appendChild(closeButton("Close"));
            $(".sig__actions a", sig).addEventListener("click", function () { sig.close(); });
        }
        sig.classList.remove("is-playing");
        openDialog(sig);
        void sig.offsetWidth;
        sig.classList.add("is-playing");
        var cst = $("#constellation");
        if (cst) cst.classList.add("is-unlocked");
    }

    /* ---------------- Keyboard: ANAND, Konami, Ctrl/⌘+Shift+K ---------------- */
    var KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
    var ki = 0, typed = "";
    function feed(k, mods, typing) {
        if ((mods.ctrl || mods.meta) && mods.shift && !mods.alt && k === "k") return "terminal";
        if (typing || mods.ctrl || mods.meta || mods.alt) return null;
        if ($("dialog[open]")) return null;
        ki = k === KONAMI[ki] ? ki + 1 : (k === KONAMI[0] ? 1 : 0);
        if (ki === KONAMI.length) { ki = 0; startChaos(); }
        if (k.length === 1 && /[a-z]/.test(k)) {
            typed = (typed + k).slice(-5);
            if (typed === "anand") { typed = ""; openDevMode(); }
        }
        return null;
    }
    document.addEventListener("keydown", function (e) {
        var k = (e.key || "").toLowerCase();
        var r = feed(k, { ctrl: e.ctrlKey, meta: e.metaKey, shift: e.shiftKey, alt: e.altKey }, typingTarget(e.target));
        if (r === "terminal") {
            e.preventDefault();
            if (term && term.open) term.close(); else openTerminal();
        }
    });
    // Replay keys pressed before this module loaded (kept in memory by script.js, never stored)
    (window.__avEarlyKeys || []).forEach(function (e) {
        if (feed((e.key || "").toLowerCase(), { ctrl: e.ctrl, meta: e.meta, shift: e.shift, alt: e.alt }, e.typing) === "terminal") openTerminal();
    });
    window.__avEarlyKeys = [];

    /* ---------------- Boot ---------------- */
    [initCat, initConstellation, initCardTriggers, initMicro].forEach(function (fn) {
        try { fn(); } catch (err) { if (window.console) console.error(err); }
    });
})();
