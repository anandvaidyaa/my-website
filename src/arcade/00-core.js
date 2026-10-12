/* ==========================================================================
   After Hours — core: helpers, seeded randomness, the operator profile, sound
   The arcade is bundled from src/arcade/*.js (in name order) into one private scope
   by `npm run build:js` (terser --enclose). Nothing here reaches the network.
   ========================================================================== */
"use strict";

var $ = function (sel, root) { return (root || document).querySelector(sel); };
var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
var reduceQ = window.matchMedia("(prefers-reduced-motion: reduce)");
var NS = "http://www.w3.org/2000/svg";
var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

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
function button(cls, parent, text) {
    var b = el("button", cls, parent, text);
    b.type = "button";
    return b;
}
function shuffle(a, rand) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
}
function fmt(n) { return Math.round(n).toLocaleString("en-IN"); }

/* ---------------- Seeded randomness ----------------
   Every run draws from its own seeded generator, so a run can be replayed exactly.
   `?arcade-seed=42` fixes the seed (used by the automated gameplay tests). */
function rng(seed) {
    var a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        var t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
var SEED_PARAM = (function () {
    try { var v = new URLSearchParams(window.location.search).get("arcade-seed"); return v ? (parseInt(v, 10) || 1) : 0; } catch (e) { return 0; }
})();
function newSeed() { return SEED_PARAM || Math.floor(Math.random() * 1e9) + 1; }

/* ---------------- The operator profile (this browser only) ----------------
   Best scores, missions reached, challenges, and the sound setting. Kept in localStorage when it
   is available, in memory otherwise. No identifiers, nothing sent anywhere. */
var PROFILE_KEY = "afterhours.profile.v1";
var store = (function () {
    try { var k = "__ah_probe"; window.localStorage.setItem(k, "1"); window.localStorage.removeItem(k); return window.localStorage; } catch (e) { return null; }
})();
function blankProfile() { return { best: {}, reached: {}, total: 0, ch: {}, plays: 0, sound: false, sky: ["dusk"] }; }
var profile = (function () {
    var p = blankProfile();
    if (!store) return p;
    try {
        var raw = JSON.parse(store.getItem(PROFILE_KEY) || "null");
        if (raw && typeof raw === "object") {
            Object.keys(p).forEach(function (k) {
                if (raw[k] !== undefined && typeof raw[k] === typeof p[k] && Array.isArray(raw[k]) === Array.isArray(p[k])) p[k] = raw[k];
            });
        } else {
            var old = JSON.parse(store.getItem("afterhours.best.v1") || "null");   // the first arcade's bests
            if (old && typeof old === "object") p.best = old;
        }
    } catch (e) { /* a damaged profile starts fresh */ }
    return p;
})();
function saveProfile() {
    if (!store) return;
    try { store.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) { /* session-only */ }
}

/* Challenges: earned once, for things actually done in play */
var CHALLENGES = {
    "first-packet": "Packet Pilot: first mission cleared",
    "first-bugs": "Bug Hunter 404: first investigation closed",
    "first-deploy": "Deploy Rush: first release resolved safely",
    "first-stack": "Cloud Stack: first mission completed",
    "clean": "A mission with zero errors",
    "precision": "Five perfect placements in a row",
    "recovery": "Recovered from a critical incident",
    "objective": "Completed an optional objective",
    "diagnosis": "Both diagnoses right in one investigation",
    "blackout": "Survived the Systems Blackout"
};
function award(id) {
    if (!CHALLENGES[id] || profile.ch[id]) return false;
    profile.ch[id] = 1;
    saveProfile();
    return true;
}
function firsts() { return ["packet", "bugs", "deploy", "stack"].filter(function (g) { return profile.ch["first-" + g]; }).length; }
function challengeCount() { return Object.keys(CHALLENGES).filter(function (k) { return profile.ch[k]; }).length; }
// Ranks follow real milestones, in order
var RANKS = [
    { name: "Visitor", next: "Clear a mission in any room to become a Signal Scout." },
    { name: "Signal Scout", test: function () { return firsts() >= 1; }, next: "Clear a mission in all four rooms to become a Systems Operator." },
    { name: "Systems Operator", test: function () { return firsts() === 4; }, next: "Recover from a critical incident and complete an optional objective to become an Incident Specialist." },
    { name: "Incident Specialist", test: function () { return firsts() === 4 && profile.ch.recovery && profile.ch.objective; }, next: "Survive the Systems Blackout to become a Night Architect." },
    { name: "Night Architect", test: function () { return !!profile.ch.blackout; }, next: "Every rank earned. The facility is yours after hours." }
];
function rankIndex() { var r = 0; RANKS.forEach(function (k, i) { if (i && k.test()) r = i; }); return r; }

/* ---------------- Sound: tiny synthesised cues, off until the player turns them on ---------------- */
var audio = { ac: null };
var SFX = {
    tick: [[1400, 0.03, "square", 0.02]],
    route: [[520, 0.05, "triangle", 0.04], [780, 0.06, "triangle", 0.04]],
    deliver: [[660, 0.06, "sine", 0.05], [990, 0.1, "sine", 0.05]],
    drop: [[160, 0.18, "sawtooth", 0.035]],
    alert: [[440, 0.1, "square", 0.03], [0, 0.06], [440, 0.1, "square", 0.03]],
    success: [[523, 0.08, "sine", 0.05], [659, 0.08, "sine", 0.05], [784, 0.16, "sine", 0.05]],
    fail: [[392, 0.12, "triangle", 0.05], [294, 0.22, "triangle", 0.05]],
    precise: [[1568, 0.08, "sine", 0.04]],
    hit: [[880, 0.035, "square", 0.025]]
};
function sfx(name) {
    if (!profile.sound || !SFX[name]) return;
    try {
        if (!audio.ac) audio.ac = new (window.AudioContext || window.webkitAudioContext)();
        var ac = audio.ac, t = ac.currentTime;
        if (ac.state === "suspended") ac.resume();
        SFX[name].forEach(function (n) {
            if (n[0]) {
                var o = ac.createOscillator(), g = ac.createGain();
                o.type = n[2];
                o.frequency.value = n[0];
                g.gain.setValueAtTime(0.0001, t);
                g.gain.linearRampToValueAtTime(n[3], t + 0.01);
                g.gain.exponentialRampToValueAtTime(0.0001, t + n[1]);
                o.connect(g);
                g.connect(ac.destination);
                o.start(t);
                o.stop(t + n[1] + 0.03);
            }
            t += n[1];
        });
    } catch (e) { /* no audio: every cue is also shown on screen */ }
}
