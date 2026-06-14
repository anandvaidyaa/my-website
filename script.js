// Mobile Menu Toggle
const menuIcon = document.getElementById('menu-icon');
const navLinks = document.getElementById('nav-links');

menuIcon.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const icon = menuIcon.querySelector('i');
    if (navLinks.classList.contains('active')) {
        icon.classList.remove('bx-menu');
        icon.classList.add('bx-x');
    } else {
        icon.classList.remove('bx-x');
        icon.classList.add('bx-menu');
    }
});

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuIcon.querySelector('i').classList.remove('bx-x');
        menuIcon.querySelector('i').classList.add('bx-menu');
    });
});

// Navbar Scroll Effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Advanced Scroll Reveal & Stagger Animation Logic
const revealElements = document.querySelectorAll('.reveal');
const staggerContainers = document.querySelectorAll('.reveal-stagger');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

revealElements.forEach(el => revealObserver.observe(el));

const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const items = entry.target.querySelectorAll('.reveal-item');
            items.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('active');
                }, index * 100);
            });
            staggerObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: "0px 0px -100px 0px" });

staggerContainers.forEach(container => staggerObserver.observe(container));

// Typing Effect for Hero Section
const typedRoleElement = document.querySelector('.typed-role');
const roles = [
    "Scalable Web Apps.",
    "Azure Cloud Solutions.",
    "Seamless APIs.",
    "Performant UIs."
];

let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingDelay = 100;

function typeEffect() {
    if (!typedRoleElement) return;
    const currentRole = roles[roleIndex];
    
    if (isDeleting) {
        typedRoleElement.textContent = currentRole.substring(0, charIndex - 1);
        charIndex--;
        typingDelay = 50;
    } else {
        typedRoleElement.textContent = currentRole.substring(0, charIndex + 1);
        charIndex++;
        typingDelay = 100;
    }
    
    if (!isDeleting && charIndex === currentRole.length) {
        typingDelay = 1500;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex++;
        if (roleIndex >= roles.length) {
            roleIndex = 0;
        }
        typingDelay = 500;
    }
    
    setTimeout(typeEffect, typingDelay);
}

// --- Cyber Preloader Logic ---
const loadingSteps = [
    "ESTABLISHING SECURE PROTOCOLS...",
    "CONNECTING TO CLOUD WORKSPACE...",
    "VERIFYING METRIC PIPELINES...",
    "TELEMETRY STREAM CONNECTED"
];

const preloaderLogs = [
    ">> CONNECTING TO AP-SOUTH-1 GATEWAY... OK",
    ">> AUTHENTICATING CLOUD PRINCIPAL... VERIFIED",
    ">> PARSING AZURE BICEP TEMPLATE WORKSPACES...",
    ">> DEPLOYING WEB-APP RESOURCES TO RESOURCE-GROUP: RG-ANAND-PROD...",
    ">> INITIALIZING DATABASE INSTANCE (COSMOSDB-PRIMARY)... SUCCESS",
    ">> MAPPING REST APIM ROUTE POLICIES...",
    ">> SYNCING AZURE FUNCTION APP WORKSPACES... ACTIVE",
    ">> VERIFYING SECURITY CERTIFICATES... NOMINAL",
    ">> ENFORCING TLS 1.3 PROTOCOLS... ACTIVE",
    ">> PIPELINES NOMINAL. BOOT SEQUENCE COMPLETE."
];

const preloader = document.getElementById('preloader');
const loaderText = document.querySelector('.loader-text');

let loadStepIdx = 0;
function runLoaderSequence() {
    if (!preloader) return;
    if (loadStepIdx < loadingSteps.length) {
        if (loaderText) {
            loaderText.textContent = loadingSteps[loadStepIdx];
        }
        loadStepIdx++;
        setTimeout(runLoaderSequence, 450);
    }
}

let bootLogIdx = 0;
function runPreloaderBoot() {
    const logBody = document.getElementById('preloader-boot-log');
    if (logBody && bootLogIdx < preloaderLogs.length) {
        const p = document.createElement('p');
        p.className = "mock-log-line";
        const currentText = preloaderLogs[bootLogIdx];
        p.textContent = currentText;
        
        // Color coding
        if (currentText.includes('OK') || currentText.includes('SUCCESS') || currentText.includes('VERIFIED') || currentText.includes('NOMINAL')) {
            p.style.color = "#27c93f"; // bright green
        } else if (currentText.includes('ACTIVE') || currentText.includes('COMPLETE')) {
            p.style.color = "#00d2ff"; // accent blue
        } else if (currentText.includes('CONNECTING') || currentText.includes('PARSING') || currentText.includes('INITIALIZING')) {
            p.style.color = "#cbd5e1"; // slate
        }
        
        logBody.appendChild(p);
        logBody.scrollTop = logBody.scrollHeight;
        bootLogIdx++;
        setTimeout(runPreloaderBoot, Math.random() * 120 + 80);
    } else {
        setTimeout(exitPreloader, 400);
    }
}

function exitPreloader() {
    if (!preloader) return;
    preloader.classList.add('hide-terminal');
    setTimeout(() => {
        preloader.classList.add('hidden');
        document.body.style.overflowY = 'auto';
        window.scrollTo(0, 0);
        
        setTimeout(() => {
            const heroContent = document.querySelector('.hero-content');
            const heroImage = document.querySelector('.hero-image-wrapper');
            if (heroContent) heroContent.classList.add('active');
            if (heroImage) heroImage.classList.add('active');
            setTimeout(typeEffect, 500);
            initHeroDashboard();
        }, 200);
        
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 1400);
    }, 500);
}

// Disable scroll restoration on page refresh and force scroll to top
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Start boot sequence immediately on load
window.addEventListener('DOMContentLoaded', () => {
    window.scrollTo(0, 0);
    document.body.style.overflowY = 'hidden';
    runLoaderSequence();
    setTimeout(runPreloaderBoot, 200);
});
window.addEventListener('load', () => {
    window.scrollTo(0, 0);
});
// --- Custom Cursor ---
const cursorDot = document.querySelector('[data-cursor-dot]');
const cursorOutline = document.querySelector('[data-cursor-outline]');

// Create cursor text element and append it on load
const cursorText = document.createElement('span');
cursorText.className = 'cursor-text';
if (cursorOutline) {
    cursorOutline.appendChild(cursorText);
}

const defaultCursorIcon = "<i class='bx bx-bolt-circle' style='font-size:1.6rem; color: var(--accent);'></i>";

// Function to reset cursor to default state
function resetCursorToDefault() {
    if (cursorOutline) {
        cursorOutline.classList.remove('cursor-hover-text');
        const txt = cursorOutline.querySelector('.cursor-text');
        if (txt) {
            txt.innerHTML = defaultCursorIcon;
            txt.style.opacity = '1';
        }
    }
}

// Initialize on page load
resetCursorToDefault();

// Smooth cursor interpolation via requestAnimationFrame
let mouseX = 0, mouseY = 0;
let outlineX = 0, outlineY = 0;

window.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (cursorDot) {
        cursorDot.style.left = `${mouseX}px`;
        cursorDot.style.top = `${mouseY}px`;
    }
});

function animateCursor() {
    if (cursorOutline) {
        outlineX += (mouseX - outlineX) * 0.12;
        outlineY += (mouseY - outlineY) * 0.12;
        cursorOutline.style.left = `${outlineX}px`;
        cursorOutline.style.top = `${outlineY}px`;
    }
    requestAnimationFrame(animateCursor);
}
animateCursor();

// Clickables cursor focus lock
let activeClickable = null;

function handleClickableEnter(clickable) {
    if (activeClickable === clickable) return;
    activeClickable = clickable;
    
    if (cursorOutline) {
        cursorOutline.style.setProperty('display', 'none', 'important');
    }
    if (cursorDot) {
        cursorDot.style.setProperty('display', 'none', 'important');
    }
}

function handleClickableLeave(clickable) {
    if (activeClickable !== clickable) return;
    activeClickable = null;
    
    if (cursorOutline) {
        cursorOutline.style.removeProperty('display');
    }
    if (cursorDot) {
        cursorDot.style.removeProperty('display');
    }
}

// Event Delegation for hover using mouseover/mouseout
document.addEventListener('mouseover', (e) => {
    const selector = 'a, button, input, textarea, select, [role="button"], .skill-interactive, .arch-node, .dash-tab, .dash-res-card, .sidebar-dot, .diag-action-btn, .metric-close-btn, .skill-tooltip-close';
    const clickable = e.target.closest ? e.target.closest(selector) : null;
    if (clickable) {
        handleClickableEnter(clickable);
    }
});

document.addEventListener('mouseout', (e) => {
    const selector = 'a, button, input, textarea, select, [role="button"], .skill-interactive, .arch-node, .dash-tab, .dash-res-card, .sidebar-dot, .diag-action-btn, .metric-close-btn, .skill-tooltip-close';
    const clickable = e.target.closest ? e.target.closest(selector) : null;
    if (clickable) {
        const related = e.relatedTarget ? (e.relatedTarget.closest ? e.relatedTarget.closest(selector) : null) : null;
        if (related !== clickable) {
            handleClickableLeave(clickable);
        }
    }
});

// Magnetic Buttons Effect
const magneticElements = document.querySelectorAll('.btn, .social-links a, .theme-toggle-btn');
magneticElements.forEach(elem => {
    elem.addEventListener('mousemove', (e) => {
        const rect = elem.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        elem.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });
    
    elem.addEventListener('mouseleave', () => {
        elem.style.transform = 'translate(0px, 0px)';
    });
});

// Section specific cursor icons
const sections = document.querySelectorAll('section');
sections.forEach(sec => {
    sec.addEventListener('mouseenter', () => {
        if (!cursorOutline) return;
        
        // Only apply section cursor if we are NOT currently hovering a clickable element
        const isHoveringClickable = document.querySelector('a:hover, button:hover, input:hover, textarea:hover, .skill-interactive:hover, .arch-node:hover, .dash-tab:hover, .dash-res-card:hover, .sidebar-dot:hover');
        if (isHoveringClickable) return;
        
        const txt = cursorOutline.querySelector('.cursor-text');
        if (!txt) return;
        
        cursorOutline.classList.add('cursor-hover-text');
        txt.style.opacity = '1';
        
        if (sec.id === 'home') {
            txt.innerHTML = "<i class='bx bx-infinite' style='font-size:1.5rem;'></i>";
        } else if (sec.id === 'about') {
            txt.innerHTML = "<i class='bx bx-bolt-circle' style='font-size:1.5rem;'></i>";
        } else if (sec.id === 'projects') {
            txt.innerHTML = "<i class='bx bx-git-branch' style='font-size:1.5rem;'></i>";
        } else if (sec.id === 'experience') {
            txt.innerHTML = "<i class='bx bx-briefcase' style='font-size:1.5rem;'></i>";
        } else if (sec.id === 'education') {
            txt.innerHTML = "<i class='bx bxs-graduation' style='font-size:1.5rem;'></i>";
        } else if (sec.id === 'contact') {
            txt.innerHTML = "<i class='bx bx-broadcast' style='font-size:1.5rem;'></i>";
        } else {
            resetCursorToDefault();
        }
    });
    
    sec.addEventListener('mouseleave', () => {
        resetCursorToDefault();
    });
});

// Theme Toggle Logic
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('i') : null;

const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'light') {
    document.body.classList.add('light-mode');
    if (themeIcon) themeIcon.classList.replace('bx-sun', 'bx-moon');
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        let theme = 'dark';
        
        if (document.body.classList.contains('light-mode')) {
            if (themeIcon) themeIcon.classList.replace('bx-sun', 'bx-moon');
            theme = 'light';
            if (window.vantaEffect) {
                window.vantaEffect.setOptions({
                    backgroundColor: 0xf1f5f9,
                    color: 0x0f172a
                });
            }
        } else {
            if (themeIcon) themeIcon.classList.replace('bx-moon', 'bx-sun');
            if (window.vantaEffect) {
                window.vantaEffect.setOptions({
                    backgroundColor: 0x0b0f19,
                    color: 0x00d2ff
                });
            }
        }
        localStorage.setItem('theme', theme);
    });
}

// Back to Top Button
const backToTopBtn = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
    if (!backToTopBtn) return;
    if (window.scrollY > 500) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
});

if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    backToTopBtn.addEventListener('mousemove', (e) => {
        const rect = backToTopBtn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        backToTopBtn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.1)`;
    });
    
    backToTopBtn.addEventListener('mouseleave', () => {
        backToTopBtn.style.transform = 'translate(0px, 0px) scale(1)';
    });
}

// --- Timeline Scroll-Drawing Logic ---
const timeline = document.querySelector('.timeline');
const progressLine = document.querySelector('.timeline-line-progress');
const timelineItems = document.querySelectorAll('.timeline-item');

function animateTimeline() {
    if (!timeline || !progressLine) return;
    const timelineRect = timeline.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    const startPoint = windowHeight * 0.8;
    const endPoint = windowHeight * 0.2;
    
    let progress = 0;
    
    if (timelineRect.top < startPoint) {
        const totalHeight = timelineRect.height;
        const scrolled = startPoint - timelineRect.top;
        progress = scrolled / (totalHeight + (startPoint - endPoint) * 0.2);
        progress = Math.min(Math.max(progress, 0), 1);
    }
    
    progressLine.style.height = `${progress * 100}%`;
    
    timelineItems.forEach(item => {
        const itemRect = item.getBoundingClientRect();
        const triggerY = itemRect.top + itemRect.height * 0.3;
        if (triggerY < startPoint) {
            item.classList.add('active-progress');
        } else {
            item.classList.remove('active-progress');
        }
    });
}

window.addEventListener('scroll', animateTimeline);
window.addEventListener('resize', animateTimeline);
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(animateTimeline, 1200);
});

// --- Mouse-Reactive Badge Parallax ---
const heroSection = document.querySelector('.hero');
const badgeTop = document.querySelector('.badge-top');
const badgeBottom = document.querySelector('.badge-bottom');

if (heroSection && badgeTop && badgeBottom) {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) {
        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const deviationX = (x / rect.width) - 0.5;
            const deviationY = (y / rect.height) - 0.5;
            
            badgeTop.style.transform = `translate(${deviationX * -40}px, ${deviationY * -40}px)`;
            badgeBottom.style.transform = `translate(${deviationX * 40}px, ${deviationY * 40}px)`;
        });
        
        heroSection.addEventListener('mouseleave', () => {
            badgeTop.style.transform = 'translate(0px, 0px)';
            badgeBottom.style.transform = 'translate(0px, 0px)';
        });
    }
}

// --- Interactive Digital Particle Click Burst ---
document.addEventListener('click', (e) => {
    if (e.target.closest('a, button, #menu-icon, .wt-tab-close, .arch-node, .btn-simulate-build')) return;
    
    let container = document.getElementById('click-particles-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'click-particles-container';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100vw';
        container.style.height = '100vh';
        container.style.pointerEvents = 'none';
        container.style.zIndex = '99999';
        document.body.appendChild(container);
    }
    
    const x = e.clientX;
    const y = e.clientY;
    
    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'click-particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 80 + 40;
        const xTranslation = Math.cos(angle) * velocity;
        const yTranslation = Math.sin(angle) * velocity;
        
        const size = Math.random() * 5 + 3;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        const colors = ['#00d2ff', '#7c6bff', '#27c93f'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        particle.style.setProperty('--tx', `${xTranslation}px`);
        particle.style.setProperty('--ty', `${yTranslation}px`);
        
        container.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 800);
    }
});


/* ==========================================================================
   NEW ELITE INTERACTIVE SCRIPT LOGIC
   ========================================================================== */

const siteLoadTime = Date.now();

// 1. Fluent Card Spotlight Coordinates Tracker
// 2. Cybernetic Sidebar Scroll Progress & Dot Navigation
const progressCircle = document.querySelector('.progress-ring-circle');
const scrollPercentText = document.getElementById('scroll-percent');
const sidebarDotNav = document.querySelector('.sidebar-telemetry');

function updateScrollProgress() {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight <= 0) return;
    const progress = Math.min(Math.max(window.scrollY / totalHeight, 0), 1);
    const percent = Math.round(progress * 100);
    
    if (scrollPercentText) {
        scrollPercentText.textContent = `${percent}%`;
    }
    
    if (progressCircle) {
        const radius = progressCircle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        const strokeOffset = circumference - progress * circumference;
        progressCircle.style.strokeDashoffset = strokeOffset;
    }
}

window.addEventListener('scroll', updateScrollProgress);
window.addEventListener('resize', updateScrollProgress);

// Sidebar Navigation DOT Highlight Observer
const sectionObserverOptions = {
    root: null,
    rootMargin: "-25% 0px -25% 0px",
    threshold: 0.1
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            document.querySelectorAll('.sidebar-dot').forEach(dot => {
                if (dot.getAttribute('data-section') === sectionId) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }
    });
}, sectionObserverOptions);

document.querySelectorAll('section[id]').forEach(sec => {
    sectionObserver.observe(sec);
});

// // 3. Visual Telemetry Dashboard Animation
// Real-time Wave Canvas Heartbeat Loop
function initTelemetryChart() {
    const canvas = document.getElementById('telemetry-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = canvas.parentElement.offsetWidth;
    let height = canvas.height = canvas.parentElement.offsetHeight;
    
    window.addEventListener('resize', () => {
        if (canvas.parentElement) {
            width = canvas.width = canvas.parentElement.offsetWidth;
            height = canvas.height = canvas.parentElement.offsetHeight;
        }
    });
    
    let offset = 0;
    
    function draw() {
        ctx.clearRect(0, 0, width, height);
        
        const isLight = document.body.classList.contains('light-mode');
        ctx.strokeStyle = isLight ? '#0284c7' : '#00d2ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Scale factor based on simulated traffic rate
        const scale = (window.telemetryRate || 24) / 24;
        
        for (let x = 0; x < width; x++) {
            const y = height / 2 + 
                      Math.sin(x * 0.02 + offset) * (12 * Math.min(2.5, scale)) + 
                      Math.sin(x * 0.05 - offset * 1.3) * (4 * Math.min(2.5, scale));
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        if (!isLight) {
            ctx.shadowBlur = 6;
            ctx.shadowColor = '#00d2ff';
        } else {
            ctx.shadowBlur = 0;
        }
        
        offset += 0.04 * Math.min(3, scale);
        requestAnimationFrame(draw);
    }
    draw();
}

// Telemetry Event pills logic
function pushTelemetryEvent(source, message) {
    const stream = document.getElementById('telemetry-event-stream');
    if (!stream) return;
    
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    const pill = document.createElement('div');
    pill.className = `event-pill ${source}`;
    
    let tagText = source.toUpperCase();
    if (tagText === 'FUNC') tagText = 'FUNCTION';
    
    pill.innerHTML = `
        <span class="pill-tag">${tagText}</span>
        <span class="pill-time">${timeStr}</span>
        <span class="pill-msg">${message}</span>
    `;
    
    stream.appendChild(pill);
    stream.scrollTop = stream.scrollHeight;
    
    while (stream.children.length > 4) {
        stream.removeChild(stream.firstChild);
    }
}

const saasEvents = [
    { s: "apim", m: "POST /orders 200 OK" },
    { s: "apim", m: "GET /shipping/rates 200 OK" },
    { s: "func", m: "Ingested Order event successfully" },
    { s: "func", m: "DHL API carrier request complete" },
    { s: "cosmos", m: "Upsert order record committed (1.8ms)" },
    { s: "cosmos", m: "CosmosDB partition read complete (1.2ms)" },
    { s: "apim", m: "Auth verification: MSI check success" }
];

window.telemetryRate = 24;
window.activeIncident = false;
window.activeSpike = false;
window.selectedNode = null;
window.activeTabs = { client: 'telemetry', apim: 'telemetry', func: 'telemetry', cosmos: 'telemetry' };

const nodeDiagnosticsData = {
    client: {
        title: "Microsoft.Web/clientApp",
        name: "Client App (Mobile/Web)",
        status: "ONLINE",
        cpu: 12,
        memory: 45,
        errorRate: 0,
        stats: [
            { label: "Active Sessions", val: "128 clients" },
            { label: "Platform OS", val: "iOS / Android / Web" },
            { label: "Avg Latency", val: "42 ms" },
            { label: "App Version", val: "v2.1.0-build.8" }
        ],
        actionText: "Send Simulated Order"
    },
    apim: {
        title: "Microsoft.ApiManagement/service",
        name: "Azure APIM Gateway",
        status: "ACTIVE (NOMINAL)",
        cpu: 28,
        memory: 64,
        errorRate: 0,
        stats: [
            { label: "Gateway SKU", val: "Developer tier" },
            { label: "Cache Hit Rate", val: "84.2%" },
            { label: "SSL Policy", val: "TLS 1.3 Cipher" },
            { label: "Errors (24h)", val: "0.00%" }
        ],
        actionText: "Flush APIM Cache"
    },
    func: {
        title: "Microsoft.Web/sites (Functions)",
        name: "Azure Functions",
        status: "AUTO-SCALE (OK)",
        cpu: 18,
        memory: 52,
        errorRate: 0,
        stats: [
            { label: "Runtime Env", val: ".NET 8.0 Isolated" },
            { label: "Active Instances", val: "12 instances" },
            { label: "Avg Execution", val: "18.4 ms" },
            { label: "Function Plan", val: "Flex Consumption" }
        ],
        actionText: "Restart App Worker"
    },
    cosmos: {
        title: "Microsoft.DocumentDB/databaseAccounts",
        name: "Azure Cosmos DB",
        status: "PROVISIONED (OK)",
        cpu: 8,
        memory: 22,
        errorRate: 0,
        stats: [
            { label: "Autoscale Limit", val: "400 - 4000 RU/s" },
            { label: "Read Latency", val: "1.2 ms" },
            { label: "Write Latency", val: "1.8 ms" },
            { label: "Primary Region", val: "ap-south-1 (India)" }
        ],
        actionText: "Run Index Optimization"
    }
};

function runTelemetryEventStream() {
    let delay = 2000;
    if (window.telemetryRate) {
        // Fast rate speeds up events, slow rate slows them down
        delay = (Math.random() * 1500 + 1000) / (window.telemetryRate / 24);
    }
    
    // Choose events based on incident state
    let event;
    if (window.activeIncident) {
        const warningEvents = [
            { s: "cosmos", m: "CosmosDB primary region write timeout warning" },
            { s: "cosmos", m: "Request Charges (RU) elevated: 42.8 RUs" },
            { s: "func", m: "WARNING: Function execution execution-delay threshold exceeded" },
            { s: "apim", m: "HTTP 504 Gateway Timeout on /orders payload sync" }
        ];
        event = warningEvents[Math.floor(Math.random() * warningEvents.length)];
    } else {
        event = saasEvents[Math.floor(Math.random() * saasEvents.length)];
    }
    
    pushTelemetryEvent(event.s, event.m);
    
    const rateEl = document.getElementById('telemetry-throughput');
    if (rateEl) {
        // Fluctuates around window.telemetryRate
        const fluctuation = Math.floor(Math.random() * 7) - 3;
        const currentRate = Math.max(1, window.telemetryRate + fluctuation);
        rateEl.textContent = `${currentRate} req/s`;
    }
    
    setTimeout(runTelemetryEventStream, delay);
}

// Global Diagnostics Panel Initialization
function initDiagnosticsPanel() {
    // Traffic slider setup
    const slider = document.getElementById('traffic-rate-slider');
    const sliderVal = document.getElementById('traffic-rate-val');
    if (slider && sliderVal) {
        slider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            window.telemetryRate = val;
            sliderVal.textContent = `${val} req/s`;
            
            // Also update telemetry rate displayed in other places
            const rateEl = document.getElementById('telemetry-throughput');
            if (rateEl) rateEl.textContent = `${val} req/s`;
        });
    }
    
    // Bind click to list services in Cluster Health overview
    document.querySelectorAll('.diag-service-row').forEach(row => {
        row.addEventListener('click', () => {
            const service = row.getAttribute('data-service');
            if (service) {
                selectNode(service);
            }
        });
    });
    
    // Incident buttons
    const btnInject = document.getElementById('btn-inject-incident');
    if (btnInject) {
        btnInject.addEventListener('click', injectTelemetryIncident);
    }
    
    const btnSpike = document.getElementById('btn-trigger-spike');
    if (btnSpike) {
        btnSpike.addEventListener('click', triggerLoadSpike);
    }
}

// Unified Node Selection (from Flowchart or Cluster Overview List)
function selectNode(nodeName) {
    window.selectedNode = nodeName;
    
    // Remove highlight from all nodes, add to current
    const archNodes = document.querySelectorAll('.arch-node');
    archNodes.forEach(n => {
        if (n.getAttribute('data-node') === nodeName) {
            n.classList.add('active-selected');
        } else {
            n.classList.remove('active-selected');
        }
    });
    
    // Trigger glowing packet animation along path lines
    const archFlowContainer = document.getElementById('telemetry-flow');
    if (archFlowContainer) {
        const lines = archFlowContainer.querySelectorAll('.arch-line');
        lines.forEach((line, index) => {
            setTimeout(() => {
                line.classList.add('active-ping');
                setTimeout(() => {
                    line.classList.remove('active-ping');
                }, 1200);
            }, index * 180);
        });
    }
    
    // Push event log trace
    pushTelemetryEvent(nodeName === 'cosmos' ? 'cosmos' : (nodeName === 'apim' ? 'apim' : 'func'), `Manual diagnostic probe connected to resource [${nodeName.toUpperCase()}]`);
    
    // Render Diagnostics Panel
    updateDiagnosticsPanel(nodeName);
}

// Bind flowchart nodes click
const archNodes = document.querySelectorAll('.arch-node');
const archFlowContainer = document.getElementById('telemetry-flow');

if (archFlowContainer) {
    archNodes.forEach(node => {
        node.addEventListener('click', () => {
            const nodeName = node.getAttribute('data-node') || "client";
            selectNode(nodeName);
        });
    });
}

function updateDiagnosticsPanel(nodeName) {
    const diagPanel = document.getElementById('arch-diagnostics');
    if (!diagPanel) return;
    
    const data = nodeDiagnosticsData[nodeName];
    if (!data) return;
    
    // Get active tab or default to 'telemetry'
    const activeTab = window.activeTabs[nodeName] || 'telemetry';
    
    diagPanel.innerHTML = `
        <div class="diag-selected-view">
            <div class="diag-selected-header">
                <button class="diag-back-btn" onclick="showGlobalOverview()"><i class='bx bx-arrow-back'></i> Overview</button>
                <div class="diag-header-info">
                    <div class="diag-selected-title">${data.name}</div>
                    <div class="diag-selected-sub">${data.title}</div>
                </div>
            </div>
            
            <div class="diag-selected-tabs">
                <button class="diag-tab-btn ${activeTab === 'telemetry' ? 'active' : ''}" id="tab-btn-telemetry" onclick="switchDiagTab('${nodeName}', 'telemetry')">Telemetry</button>
                <button class="diag-tab-btn ${activeTab === 'console' ? 'active' : ''}" id="tab-btn-console" onclick="switchDiagTab('${nodeName}', 'console')">PowerShell</button>
                <button class="diag-tab-btn ${activeTab === 'settings' ? 'active' : ''}" id="tab-btn-settings" onclick="switchDiagTab('${nodeName}', 'settings')">Config</button>
            </div>
            
            <div class="diag-tab-content" id="diag-tab-content-area">
                <!-- Renders the active tab content -->
            </div>
        </div>
    `;
    
    renderTabContent(nodeName, activeTab);
}

window.showGlobalOverview = function() {
    window.selectedNode = null;
    
    // Remove active highlights from all flow nodes
    const archNodes = document.querySelectorAll('.arch-node');
    archNodes.forEach(n => {
        n.classList.remove('active-selected');
    });
    
    const diagPanel = document.getElementById('arch-diagnostics');
    if (!diagPanel) return;
    
    const alertCount = window.activeIncident ? 1 : 0;
    const alertClass = window.activeIncident ? 'red-text' : 'green-text';
    const slaText = window.activeIncident ? '98.42%' : '99.98%';
    const statusText = window.activeIncident ? '<span class="led led-yellow"></span> DEGRADED' : '<span class="led led-green"></span> ACTIVE';
    const statusColor = window.activeIncident ? '#e0a106' : '#27c93f';
    
    diagPanel.innerHTML = `
        <div class="diag-global-dashboard">
            <div class="diag-global-header">
                <div class="diag-global-title"><i class='bx bx-network-chart'></i> Cluster Health</div>
                <span class="diag-global-status" style="color: ${statusColor};">${statusText}</span>
            </div>
            <div class="diag-metrics-mini">
                <div class="diag-metric-box">
                    <span class="diag-metric-lbl">SYSTEM SLA</span>
                    <span class="diag-metric-val">${slaText}</span>
                </div>
                <div class="diag-metric-box">
                    <span class="diag-metric-lbl">ACTIVE ALERTS</span>
                    <span class="diag-metric-val ${alertClass}" id="diag-active-alerts">${alertCount}</span>
                </div>
            </div>
            <div class="diag-slider-group">
                <div class="slider-header">
                    <span>Simulated Traffic Rate</span>
                    <span class="slider-val" id="traffic-rate-val">${window.telemetryRate} req/s</span>
                </div>
                <input type="range" id="traffic-rate-slider" min="5" max="120" value="${window.telemetryRate}" class="diag-range-slider">
            </div>
            <div class="diag-services-list">
                <div class="diag-service-row" data-service="client">
                    <span class="dot-led" style="background-color: #27c93f; box-shadow: 0 0 8px #27c93f;"></span>
                    <span class="service-name">Client App</span>
                    <span class="service-stat">Avg Latency: 42ms</span>
                </div>
                <div class="diag-service-row" data-service="apim">
                    <span class="dot-led" style="background-color: #27c93f; box-shadow: 0 0 8px #27c93f;"></span>
                    <span class="service-name">APIM Gateway</span>
                    <span class="service-stat">Cache hit: 84.2%</span>
                </div>
                <div class="diag-service-row" data-service="func">
                    <span class="dot-led" style="background-color: #27c93f; box-shadow: 0 0 8px #27c93f;"></span>
                    <span class="service-name">Azure Function</span>
                    <span class="service-stat">12 active inst</span>
                </div>
                <div class="diag-service-row" data-service="cosmos">
                    <span class="dot-led" style="background-color: ${window.activeIncident ? '#ff5f56' : '#27c93f'}; box-shadow: 0 0 8px ${window.activeIncident ? '#ff5f56' : '#27c93f'};"></span>
                    <span class="service-name">Cosmos DB</span>
                    <span class="service-stat">${window.activeIncident ? '240ms latency' : '1.8ms R / 1.2ms W'}</span>
                </div>
            </div>
            <div class="diag-actions-row">
                <button class="diag-action-btn btn-inject" id="btn-inject-incident">
                    <i class='bx bx-error-alt'></i> ${window.activeIncident ? 'Clear Incident' : 'Inject DB Lag'}
                </button>
                <button class="diag-action-btn btn-spike" id="btn-trigger-spike">
                    <i class='bx bx-pulse'></i> ${window.activeSpike ? 'Spike Active...' : 'Trigger Spike'}
                </button>
            </div>
        </div>
    `;
    
    initDiagnosticsPanel();
};

window.switchDiagTab = function(nodeName, tabName) {
    window.activeTabs[nodeName] = tabName;
    
    // Update active state on tab buttons
    const tabs = ['telemetry', 'console', 'settings'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-btn-${t}`);
        if (btn) {
            if (t === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
    
    renderTabContent(nodeName, tabName);
};

let telemetryTabInterval = null;
function startTelemetryTabFluc(nodeName) {
    if (telemetryTabInterval) clearInterval(telemetryTabInterval);
    
    telemetryTabInterval = setInterval(() => {
        const cpuValEl = document.getElementById('diag-cpu-val');
        const cpuFillEl = document.getElementById('diag-cpu-fill');
        
        if (cpuValEl && cpuFillEl) {
            const baseCpu = nodeDiagnosticsData[nodeName].cpu || 15;
            const currentCpu = Math.max(2, baseCpu + Math.floor(Math.random() * 9) - 4);
            cpuValEl.textContent = `${currentCpu}%`;
            cpuFillEl.style.width = `${currentCpu}%`;
        } else {
            clearInterval(telemetryTabInterval);
        }
    }, 1500);
}

function renderTabContent(nodeName, tabName) {
    const contentArea = document.getElementById('diag-tab-content-area');
    if (!contentArea) return;
    
    const data = nodeDiagnosticsData[nodeName];
    if (!data) return;
    
    if (tabName === 'telemetry') {
        let statsHTML = '';
        data.stats.forEach(s => {
            statsHTML += `
                <div class="diag-stat-item">
                    <span class="diag-stat-label">${s.label}</span>
                    <span class="diag-stat-val">${s.val}</span>
                </div>
            `;
        });
        
        contentArea.innerHTML = `
            <div class="diag-content">
                <div class="diag-stats-grid">
                    ${statsHTML}
                </div>
                
                <div class="diag-meter-group">
                    <div class="diag-meter-header">
                        <span class="diag-meter-lbl">Node CPU Load</span>
                        <span class="diag-meter-val" id="diag-cpu-val">${data.cpu}%</span>
                    </div>
                    <div class="diag-meter-bar">
                        <div class="diag-meter-fill" id="diag-cpu-fill" style="width: ${data.cpu}%"></div>
                    </div>
                </div>
                
                <div class="diag-meter-group">
                    <div class="diag-meter-header">
                        <span class="diag-meter-lbl">Node Memory Pool</span>
                        <span class="diag-meter-val">${data.memory}%</span>
                    </div>
                    <div class="diag-meter-bar">
                        <div class="diag-meter-fill" style="width: ${data.memory}%; background-color: var(--accent-secondary);"></div>
                    </div>
                </div>
                
                <button class="diag-btn-ping" onclick="triggerNodeAction('${nodeName}', this)">
                    <i class='bx bx-play-circle'></i> ${data.actionText}
                </button>
            </div>
        `;
        
        startTelemetryTabFluc(nodeName);
        
    } else if (tabName === 'console') {
        contentArea.innerHTML = `
            <div class="diag-powershell" id="ps-console">
                <div class="ps-header">Windows PowerShell<br>Copyright (C) Microsoft Corporation. All rights reserved.</div>
                <div class="ps-line"><span class="ps-prompt">PS C:\\azure\\${nodeName}></span> Ready. Enter diagnostic command below.</div>
            </div>
            <div class="ps-controls">
                <button class="ps-btn" onclick="runConsoleCommand('${nodeName}', 'status')">Get-Status</button>
                <button class="ps-btn" onclick="runConsoleCommand('${nodeName}', 'test')">Test-NetConnection</button>
                <button class="ps-btn" onclick="runConsoleCommand('${nodeName}', 'restart')">Restart-Service</button>
                <button class="ps-btn" style="opacity: 0.6;" onclick="clearConsole()">Clear-Host</button>
            </div>
        `;
        
    } else if (tabName === 'settings') {
        const verboseChecked = data.verboseLogging ? 'checked' : '';
        const autoscaleChecked = data.enableAutoscale !== false ? 'checked' : '';
        const cacheChecked = data.enableCaching !== false ? 'checked' : '';
        
        let customSetting = '';
        if (nodeName === 'apim') {
            customSetting = `
                <div class="diag-config-item" onclick="toggleCheckbox('config-cache')">
                    <input type="checkbox" id="config-cache" ${cacheChecked} onchange="toggleConfigSetting('${nodeName}', 'enableCaching', this)">
                    <label>Enable APIM API Caching</label>
                </div>
                <div class="diag-config-desc">Leverages redis edge caching to reduce runtime load on backend compute.</div>
            `;
        } else if (nodeName === 'func') {
            customSetting = `
                <div class="diag-config-item" onclick="toggleCheckbox('config-scale')">
                    <input type="checkbox" id="config-scale" ${autoscaleChecked} onchange="toggleConfigSetting('${nodeName}', 'enableAutoscale', this)">
                    <label>Enable Dynamic Scaling (KEDA)</label>
                </div>
                <div class="diag-config-desc">Allows Function App instances to scale automatically based on HTTP traffic length.</div>
            `;
        } else {
            customSetting = `
                <div class="diag-config-item" style="opacity: 0.6; cursor: not-allowed;">
                    <input type="checkbox" checked disabled>
                    <label>Enforce Encryption-at-Rest</label>
                </div>
                <div class="diag-config-desc">Enterprise policy configuration is locked by infrastructure security admins.</div>
            `;
        }
        
        contentArea.innerHTML = `
            <div class="diag-config-list">
                <div class="diag-config-item" onclick="toggleCheckbox('config-verbose')">
                    <input type="checkbox" id="config-verbose" ${verboseChecked} onchange="toggleConfigSetting('${nodeName}', 'verboseLogging', this)">
                    <label>Verbose Application Logs</label>
                </div>
                <div class="diag-config-desc">Enable detailed execution trace recording in Azure Application Insights.</div>
                
                ${customSetting}
                
                <div class="diag-config-item" style="opacity: 0.6; cursor: not-allowed;">
                    <input type="checkbox" checked disabled>
                    <label>Enforce Managed Identity (MSI)</label>
                </div>
                <div class="diag-config-desc">OAuth 2.0 system token credentials are automatically secured.</div>
            </div>
        `;
    }
}

window.toggleCheckbox = function(id) {
    const el = document.getElementById(id);
    if (el && !el.disabled) {
        el.checked = !el.checked;
        el.dispatchEvent(new Event('change'));
    }
};

window.toggleConfigSetting = function(nodeName, settingKey, checkbox) {
    const data = nodeDiagnosticsData[nodeName];
    if (!data) return;
    
    data[settingKey] = checkbox.checked;
    
    if (nodeName === 'apim' && settingKey === 'enableCaching') {
        const cacheStat = data.stats.find(s => s.label === "Cache Hit Rate");
        if (cacheStat) {
            cacheStat.val = checkbox.checked ? "98.5%" : "0.0% (Disabled)";
        }
        pushTelemetryEvent('apim', `APIM cache config updated: Caching ${checkbox.checked ? 'ENABLED' : 'DISABLED'}`);
    } else if (nodeName === 'func' && settingKey === 'enableAutoscale') {
        const scaleStat = data.stats.find(s => s.label === "Active Instances");
        const planStat = data.stats.find(s => s.label === "Function Plan");
        if (scaleStat) {
            scaleStat.val = checkbox.checked ? "12 instances" : "1 instance (Static)";
        }
        if (planStat) {
            planStat.val = checkbox.checked ? "Flex Consumption" : "Dedicated App Plan";
        }
        pushTelemetryEvent('func', `Function scale setting updated: Autoscale ${checkbox.checked ? 'ENABLED' : 'DISABLED'}`);
    } else if (settingKey === 'verboseLogging') {
        pushTelemetryEvent(nodeName === 'cosmos' ? 'cosmos' : (nodeName === 'apim' ? 'apim' : 'func'), `${nodeName.toUpperCase()} verbosity updated: ${checkbox.checked ? 'VERBOSE' : 'STANDARD'}`);
    }
};

window.clearConsole = function() {
    const consoleEl = document.getElementById('ps-console');
    if (consoleEl) {
        consoleEl.innerHTML = `
            <div class="ps-header">Windows PowerShell<br>Copyright (C) Microsoft Corporation. All rights reserved.</div>
        `;
    }
};

window.runConsoleCommand = function(nodeName, cmdType) {
    const consoleEl = document.getElementById('ps-console');
    if (!consoleEl) return;
    
    const buttons = document.querySelectorAll('.ps-btn');
    buttons.forEach(btn => btn.disabled = true);
    
    const lines = [];
    const promptStr = `<span class="ps-prompt">PS C:\\azure\\${nodeName}></span> `;
    
    if (cmdType === 'status') {
        lines.push({ text: promptStr + `Get-ResourceStatus`, delay: 0 });
        lines.push({ text: `Querying resource state...`, delay: 300 });
        lines.push({ text: `Resource Type : ${nodeDiagnosticsData[nodeName].title}`, delay: 700 });
        lines.push({ text: `Resource Name : ${nodeDiagnosticsData[nodeName].name}`, delay: 900 });
        
        nodeDiagnosticsData[nodeName].stats.forEach((s, idx) => {
            lines.push({ text: `${s.label.padEnd(14)}: ${s.val}`, delay: 1100 + idx * 100 });
        });
        
        lines.push({ text: `Status        : <span class="ps-success">ONLINE (HEALTHY)</span>`, delay: 1600 });
    } else if (cmdType === 'test') {
        lines.push({ text: promptStr + `Test-NetConnection -Port 443`, delay: 0 });
        lines.push({ text: `Resolving DNS endpoint credentials...`, delay: 400 });
        
        let targetHost = "management.azure.com";
        if (nodeName === 'client') targetHost = "apim-gateway.anandvaidya.in";
        else if (nodeName === 'apim') targetHost = "functions-worker.azurewebsites.net";
        else if (nodeName === 'func') targetHost = "cosmosdb-server.documents.azure.com";
        else if (nodeName === 'cosmos') targetHost = "ap-south-1.documents.azure.com";
        
        lines.push({ text: `ComputerName  : ${targetHost}`, delay: 900 });
        lines.push({ text: `RemoteAddress : 13.107.246.10`, delay: 1100 });
        
        const latencyVal = nodeName === 'cosmos' ? '1.2 ms' : (nodeName === 'func' ? '18 ms' : '42 ms');
        lines.push({ text: `Interface     : WAN-Interface-Ethernet`, delay: 1300 });
        lines.push({ text: `PingSucceeded : <span class="ps-success">True</span>`, delay: 1600 });
        lines.push({ text: `RoundTripTime : ${latencyVal}`, delay: 1800 });
    } else if (cmdType === 'restart') {
        lines.push({ text: promptStr + `Restart-Service -Force`, delay: 0 });
        lines.push({ text: `<span class="ps-warning">WARNING: Stopping service worker daemon...</span>`, delay: 400 });
        lines.push({ text: `Shutdown request sent. Service stopped successfully.`, delay: 800 });
        lines.push({ text: `Starting warm-up cycle for cold boot...`, delay: 1300 });
        lines.push({ text: `Probing health endpoints... response 200 OK`, delay: 1800 });
        lines.push({ text: `Service worker restarted successfully. Status: <span class="ps-success">ACTIVE</span>`, delay: 2200 });
        
        setTimeout(() => {
            pushTelemetryEvent(nodeName === 'cosmos' ? 'cosmos' : (nodeName === 'apim' ? 'apim' : 'func'), `Resource worker successfully restarted at node [${nodeName.toUpperCase()}]`);
        }, 2200);
    }
    
    lines.forEach((l, idx) => {
        setTimeout(() => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'ps-line';
            lineDiv.innerHTML = l.text;
            consoleEl.appendChild(lineDiv);
            consoleEl.scrollTop = consoleEl.scrollHeight;
            
            if (idx === lines.length - 1) {
                buttons.forEach(btn => btn.disabled = false);
            }
        }, l.delay);
    });
};

window.injectTelemetryIncident = function() {
    window.activeIncident = !window.activeIncident;
    
    if (window.activeIncident) {
        nodeDiagnosticsData.cosmos.stats.find(s => s.label === "Read Latency").val = "240 ms (HIGH)";
        nodeDiagnosticsData.cosmos.stats.find(s => s.label === "Write Latency").val = "380 ms (HIGH)";
        nodeDiagnosticsData.cosmos.status = "DEGRADED (LATENCY)";
        
        pushTelemetryEvent('cosmos', 'WARNING: Cosmos DB latency spike detected (240ms) - replication lag high');
        pushTelemetryEvent('func', 'ALERT: Database response timeout on Cosmos DB upsert');
        
        const cosmosMetricVal = document.querySelector('.telemetry-metric:nth-child(4) .metric-val');
        if (cosmosMetricVal) {
            cosmosMetricVal.textContent = '240 ms';
            cosmosMetricVal.style.color = '#ff5f56';
        }
        
        const alertCountEl = document.getElementById('diag-active-alerts');
        if (alertCountEl) {
            alertCountEl.textContent = '1';
            alertCountEl.className = 'diag-metric-val red-text';
        }
    } else {
        nodeDiagnosticsData.cosmos.stats.find(s => s.label === "Read Latency").val = "1.2 ms";
        nodeDiagnosticsData.cosmos.stats.find(s => s.label === "Write Latency").val = "1.8 ms";
        nodeDiagnosticsData.cosmos.status = "PROVISIONED (OK)";
        
        pushTelemetryEvent('cosmos', 'RECOVERY: Cosmos DB connection latency normalized (1.2ms)');
        
        const cosmosMetricVal = document.querySelector('.telemetry-metric:nth-child(4) .metric-val');
        if (cosmosMetricVal) {
            cosmosMetricVal.textContent = '1.8 ms';
            cosmosMetricVal.style.color = '#27c93f';
        }
        
        const alertCountEl = document.getElementById('diag-active-alerts');
        if (alertCountEl) {
            alertCountEl.textContent = '0';
            alertCountEl.className = 'diag-metric-val green-text';
        }
    }
    
    if (window.selectedNode) {
        updateDiagnosticsPanel(window.selectedNode);
    } else {
        showGlobalOverview();
    }
};

window.triggerLoadSpike = function() {
    if (window.activeSpike) return;
    window.activeSpike = true;
    
    pushTelemetryEvent('client', 'SIMULATION: Automated load-test spike initiated');
    pushTelemetryEvent('apim', 'TRAFFIC: APIM requests spiking - 120 req/s threshold hit');
    
    const originalRate = window.telemetryRate;
    const targetRate = 120;
    
    nodeDiagnosticsData.func.stats.find(s => s.label === "Active Instances").val = "48 instances (SCALED)";
    nodeDiagnosticsData.func.cpu = 88;
    nodeDiagnosticsData.func.status = "AUTO-SCALE (PEAK)";
    
    let currentRate = originalRate;
    const rampUpInterval = setInterval(() => {
        if (currentRate < targetRate) {
            currentRate += 10;
            if (currentRate > targetRate) currentRate = targetRate;
            window.telemetryRate = currentRate;
            
            const slider = document.getElementById('traffic-rate-slider');
            const sliderVal = document.getElementById('traffic-rate-val');
            if (slider) slider.value = currentRate;
            if (sliderVal) sliderVal.textContent = `${currentRate} req/s`;
        } else {
            clearInterval(rampUpInterval);
            
            setTimeout(() => {
                pushTelemetryEvent('func', 'AUTO-SCALE: Peak capacity handled. Scaled workers active.');
                
                const rampDownInterval = setInterval(() => {
                    if (currentRate > originalRate) {
                        currentRate -= 15;
                        if (currentRate < originalRate) currentRate = originalRate;
                        window.telemetryRate = currentRate;
                        
                        const slider = document.getElementById('traffic-rate-slider');
                        const sliderVal = document.getElementById('traffic-rate-val');
                        if (slider) slider.value = currentRate;
                        if (sliderVal) sliderVal.textContent = `${currentRate} req/s`;
                    } else {
                        clearInterval(rampDownInterval);
                        
                        nodeDiagnosticsData.func.stats.find(s => s.label === "Active Instances").val = "12 instances";
                        nodeDiagnosticsData.func.cpu = 18;
                        nodeDiagnosticsData.func.status = "AUTO-SCALE (OK)";
                        
                        pushTelemetryEvent('client', 'SIMULATION: Load-test complete. System normalized.');
                        
                        window.activeSpike = false;
                        
                        if (window.selectedNode) {
                            updateDiagnosticsPanel(window.selectedNode);
                        } else {
                            showGlobalOverview();
                        }
                    }
                }, 200);
            }, 4000);
        }
    }, 50);
    
    if (window.selectedNode) {
        updateDiagnosticsPanel(window.selectedNode);
    } else {
        showGlobalOverview();
    }
};

window.triggerNodeAction = function(nodeName, button) {
    if (!button) return;
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Running Action...`;
    
    pushTelemetryEvent(nodeName === 'cosmos' ? 'cosmos' : (nodeName === 'apim' ? 'apim' : 'func'), `Resource action executed for [${nodeName.toUpperCase()}]`);
    
    setTimeout(() => {
        button.innerHTML = `<i class='bx bx-check-circle' style='color:#27c93f;'></i> Action Completed ✔`;
        setTimeout(() => {
            button.disabled = false;
            button.innerHTML = originalText;
        }, 1500);
    }, 1200);
};

// Start visual telemetry loops on load
document.addEventListener('DOMContentLoaded', () => {
    initTelemetryChart();
    setTimeout(runTelemetryEventStream, 1000);
    initDiagnosticsPanel();
});


// 4. Hero Section - SaaS Dashboard Loops & Control Panel
function runMetricFluctuations() {
    const cpuValEl = document.getElementById('cpu-val');
    const cpuGauge = document.getElementById('cpu-gauge');
    const ramValEl = document.getElementById('ram-val');
    const ramGauge = document.getElementById('ram-gauge');
    
    if (cpuValEl && cpuGauge) {
        const cpu = Math.floor(Math.random() * 16) + 8;
        cpuValEl.textContent = `${cpu}%`;
        const offset = ((100 - cpu) / 100) * 163.3;
        cpuGauge.style.strokeDashoffset = offset;
    }
    if (ramValEl && ramGauge) {
        const ram = Math.floor(Math.random() * 6) + 42;
        ramValEl.textContent = `${ram}%`;
        const offset = ((100 - ram) / 100) * 163.3;
        ramGauge.style.strokeDashoffset = offset;
    }
    
    setTimeout(runMetricFluctuations, 2000);
}

let latencyData = Array(20).fill(15);
function initHeroLatencyChart() {
    const canvas = document.getElementById('dash-latency-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = canvas.parentElement.offsetWidth;
    let height = canvas.height = 80;
    
    window.addEventListener('resize', () => {
        if (canvas.parentElement) {
            width = canvas.width = canvas.parentElement.offsetWidth;
            height = canvas.height = 80;
        }
    });
    
    function drawLatency() {
        ctx.clearRect(0, 0, width, height);
        
        const newVal = Math.floor(Math.random() * 18) + 10;
        latencyData.push(newVal);
        latencyData.shift();
        
        const isLight = document.body.classList.contains('light-mode');
        
        ctx.beginPath();
        ctx.moveTo(0, height);
        
        const step = width / (latencyData.length - 1);
        for (let i = 0; i < latencyData.length; i++) {
            const y = height - (latencyData[i] / 50) * height * 0.8 - 5;
            ctx.lineTo(i * step, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        
        const fillGrad = ctx.createLinearGradient(0, 0, 0, height);
        if (isLight) {
            fillGrad.addColorStop(0, 'rgba(2, 132, 199, 0.2)');
            fillGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
        } else {
            fillGrad.addColorStop(0, 'rgba(0, 210, 255, 0.2)');
            fillGrad.addColorStop(1, 'rgba(0, 210, 255, 0)');
        }
        ctx.fillStyle = fillGrad;
        ctx.fill();
        
        ctx.beginPath();
        for (let i = 0; i < latencyData.length; i++) {
            const y = height - (latencyData[i] / 50) * height * 0.8 - 5;
            if (i === 0) ctx.moveTo(i * step, y);
            else ctx.lineTo(i * step, y);
        }
        ctx.strokeStyle = isLight ? '#0284c7' : '#00d2ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        setTimeout(drawLatency, 300);
    }
    drawLatency();
}

// --- PowerShell Terminal CLI Variables & Text Data ---
const helpText = `
Supported commands:
  neofetch     - Show system information & portfolio ASCII badge
  about        - Learn about Anand Vaidya
  skills       - Inspect technical skill matrix
  experience   - Show professional experience timeline
  projects     - List key cloud engineering projects
  education    - Detail education history
  contact      - Output contact coordinates
  clear        - Clear the terminal console screen
  help         - Show this help overview
`;

const aboutText = `
Anand Vaidya — Cloud Engineer & Azure Developer
Location: Vadodara, Gujarat, India

An expert Cloud Engineer specializing in building robust web applications,
scalable serverless pipelines, and automating business workflows.
He focuses on cost optimization, secure deployments, and zero-downtime CI/CD.
`;

const skillsText = `
<div style="line-height: 1.6; font-family: var(--font-mono);">
  <span style="color: #00d2ff; font-weight: bold;">Technical Skill Matrix:</span><br>
  Cloud Infrastructure  <span style="color: #27c93f;">[████████████] 100%</span>  (Azure, IaC, Bicep, APIM)<br>
  DevOps / CI/CD        <span style="color: #ffbd2e;">[██████████░░] 85%</span>   (Azure DevOps, Docker, GitHub)<br>
  Backend Services      <span style="color: #ffbd2e;">[██████████░░] 85%</span>   (ASP.NET Core, C#, Node.js)<br>
  Databases             <span style="color: #ffbd2e;">[█████████░░░] 75%</span>   (Cosmos DB, MSSQL, Redis)<br>
  Frontend Interfaces   <span style="color: #7c6bff;">[████████░░░░] 65%</span>   (HTML, CSS, JS, React)
</div>
`;

const experienceText = `
<div style="line-height: 1.6; font-family: var(--font-mono);">
  <span style="color: #00d2ff; font-weight: bold;">Professional Experience:</span><br><br>
  <span style="color: #27c93f; font-weight: bold;">1. Cloud Engineer @ FSP</span> (Jan 2026 - Present)<br>
     - Designing enterprise serverless architectures.<br>
     - Automating complex multi-channel order flows.<br><br>
  <span style="color: #cbd5e1; font-weight: bold;">2. Associate Software Engineer @ FSP</span> (Jun 2024 - Dec 2025)<br>
     - Developed web applications &amp; customized ERP pipelines.<br>
     - Reduced manual workflow latency from 2.4 hours to 4.2 seconds.
</div>
`;

const projectsText = `
<div style="line-height: 1.6; font-family: var(--font-mono);">
  <span style="color: #00d2ff; font-weight: bold;">Featured Cloud Projects:</span><br><br>
  <span style="color: #27c93f; font-weight: bold;">1. E-Commerce Integration Pipeline</span> (Azure Functions, APIM, CosmosDB)<br>
     - Automated order sync between Shopify, Amazon, and Walmart.<br><br>
  <span style="color: #27c93f; font-weight: bold;">2. Infrastructure as Code Template Library</span> (Bicep, GitHub Actions)<br>
     - Standardization of Azure resource provisioning.<br><br>
  <span style="color: #27c93f; font-weight: bold;">3. Dynamic API Gateway Policy Manager</span> (Azure APIM, ASP.NET Core)<br>
     - Centralized routing, caching, and token validation.
</div>
`;

const educationText = `
<div style="line-height: 1.6; font-family: var(--font-mono);">
  <span style="color: #00d2ff; font-weight: bold;">Education History:</span><br><br>
  Bachelor of Technology in Computer Science &amp; Engineering<br>
  Parul University, Vadodara, Gujarat (2020 - 2024)<br>
  CGPA: <span style="color: #27c93f;">8.35 / 10.0</span>
</div>
`;

const contactText = `
<div style="line-height: 1.6; font-family: var(--font-mono);">
  <span style="color: #00d2ff; font-weight: bold;">Contact Coordinates:</span><br>
  Email      : <a href="mailto:anand.svaidya24@gmail.com" style="color: #27c93f; text-decoration: underline;">anand.svaidya24@gmail.com</a><br>
  LinkedIn   : <a href="https://linkedin.com/in/vaidya-anand" target="_blank" style="color: #27c93f; text-decoration: underline;">linkedin.com/in/vaidya-anand</a><br>
  GitHub     : <a href="https://github.com/anandvaidyaa" target="_blank" style="color: #27c93f; text-decoration: underline;">github.com/anandvaidyaa</a><br>
  Phone      : +91-9913013470<br>
  Location   : Vadodara, Gujarat, India<br><br>
  * Type <span style="color: #ffbd2e;">contact --send</span> to open your email client immediately,
    or click the navigation sidebar to jump to the contact form.
</div>
`;

const neofetchText = `
<div style="display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 24px; font-family: var(--font-mono); margin: 8px 0;">
  <pre style="color: #00d2ff; font-weight: bold; margin: 0; line-height: 1.25;">
   /\\___/\\
  /   _   \\
 /   / \\   \\
|   |   |   |
 \\   \\_/   /
  \\___/\\___/
  </pre>
  <div style="line-height: 1.45;">
    <span style="color: #27c93f; font-weight: bold;">anand@windows-terminal</span><br>
    <span style="color: rgba(255,255,255,0.15);">----------------------</span><br>
    <span style="color: #7c6bff; font-weight: bold;">OS:</span> Windows 11 Pro build 22631<br>
    <span style="color: #7c6bff; font-weight: bold;">Host:</span> Custom-PC (Vadodara, India)<br>
    <span style="color: #7c6bff; font-weight: bold;">Kernel:</span> Windows NT 10.0.22631<br>
    <span style="color: #7c6bff; font-weight: bold;">Uptime:</span> 2 hours, 18 mins<br>
    <span style="color: #7c6bff; font-weight: bold;">Shell:</span> PowerShell 7.4.2<br>
    <span style="color: #7c6bff; font-weight: bold;">Terminal:</span> Windows Terminal v1.20<br>
    <span style="color: #7c6bff; font-weight: bold;">Processor:</span> AMD Ryzen 7 5800X (8) @ 3.80GHz<br>
    <span style="color: #7c6bff; font-weight: bold;">Cloud:</span> Azure Cloud-Connect Integration
  </div>
</div>
`;

let cmdHistory = [];
let historyIdx = -1;

window.switchHeroTab = function(tab) {
    const tabs = document.querySelectorAll('.dash-tab');
    const panels = document.querySelectorAll('.dash-panel');
    tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tab));
    panels.forEach(p => p.classList.toggle('active', p.id === `panel-${tab}`));
    if (tab === 'cli') {
        const input = document.getElementById('terminal-input');
        if (input) input.focus();
    }
};

function writePrompt(container) {
    const promptLine = document.createElement('div');
    promptLine.className = 'terminal-prompt-line';
    promptLine.innerHTML = `<span style="color: #27c93f;">PS C:\\Users\\anand\\portfolio&gt;</span> <span class="terminal-cmd-text"></span><span class="terminal-cursor"></span>`;
    container.appendChild(promptLine);
    container.scrollTop = container.scrollHeight;
}

function printOutput(content, isHtml = false) {
    const terminalBody = document.getElementById('terminal-body');
    if (!terminalBody) return;
    const outputDiv = document.createElement('div');
    outputDiv.className = 'terminal-output-block';
    outputDiv.style.margin = '4px 0 10px 0';
    if (isHtml) {
        outputDiv.innerHTML = content;
    } else {
        const pre = document.createElement('pre');
        pre.style.fontFamily = 'inherit';
        pre.style.fontSize = 'inherit';
        pre.style.margin = '0';
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.color = '#e2e8f0';
        pre.textContent = content;
        outputDiv.appendChild(pre);
    }
    terminalBody.appendChild(outputDiv);
}

function executeCommand(cmdText) {
    const terminalBody = document.getElementById('terminal-body');
    if (!terminalBody) return;
    
    // 1. Remove active cursor from current prompt
    const activePromptLine = terminalBody.querySelector('.terminal-prompt-line:last-child');
    if (activePromptLine) {
        const cursor = activePromptLine.querySelector('.terminal-cursor');
        if (cursor) cursor.remove();
    }
    
    const sanitizedCmd = cmdText.trim();
    if (sanitizedCmd !== "") {
        if (cmdHistory.length === 0 || cmdHistory[cmdHistory.length - 1] !== sanitizedCmd) {
            cmdHistory.push(sanitizedCmd);
        }
    }
    historyIdx = -1;
    
    // 2. Parse command
    const lowerCmd = sanitizedCmd.toLowerCase();
    
    if (lowerCmd === '') {
        writePrompt(terminalBody);
        return;
    }
    
    switch(lowerCmd) {
        case 'help':
            printOutput(helpText, true);
            break;
        case 'about':
            printOutput(aboutText, true);
            break;
        case 'skills':
            printOutput(skillsText, true);
            break;
        case 'experience':
            printOutput(experienceText, true);
            break;
        case 'projects':
            printOutput(projectsText, true);
            break;
        case 'education':
            printOutput(educationText, true);
            break;
        case 'contact':
            printOutput(contactText, true);
            break;
        case 'contact --send':
            printOutput("Opening default email client...", false);
            window.location.href = "mailto:anand.svaidya24@gmail.com?subject=Contact%20from%20Portfolio&body=Hi%20Anand,";
            break;
        case 'neofetch':
            printOutput(neofetchText, true);
            break;
        case 'clear':
            terminalBody.innerHTML = "";
            break;
        default:
            printOutput(`<span style="color: #ff5f56;">Command '${sanitizedCmd}' not recognized. Type 'help' for support.</span>`, true);
    }
    
    // 3. Write new prompt
    writePrompt(terminalBody);
}

function updateCurrentPromptText(text) {
    const terminalBody = document.getElementById('terminal-body');
    if (!terminalBody) return;
    const activePromptLine = terminalBody.querySelector('.terminal-prompt-line:last-child');
    if (activePromptLine) {
        const textSpan = activePromptLine.querySelector('.terminal-cmd-text');
        if (textSpan) textSpan.textContent = text;
    }
}

function initTerminal() {
    const terminalBody = document.getElementById('terminal-body');
    const terminalInput = document.getElementById('terminal-input');
    if (!terminalBody) return;
    
    terminalBody.innerHTML = `
<div style="color: #cbd5e1; font-family: var(--font-mono); font-size: 0.82rem; line-height: 1.4; margin-bottom: 15px;">
Windows PowerShell<br>
Copyright (C) Microsoft Corporation. All rights reserved.<br><br>
Try the new cross-platform PowerShell <a href="https://aka.ms/pscore6" target="_blank" style="color: #00d2ff; text-decoration: underline;">https://aka.ms/pscore6</a><br><br>
Type <span style="color: #27c93f; font-weight: bold;">help</span> to see list of available commands.
</div>
    `;
    writePrompt(terminalBody);
    
    // Auto-type 'neofetch' demo on initial load
    setTimeout(() => {
        if (terminalInput && terminalBody) {
            let cmdName = "neofetch";
            let index = 0;
            
            // Only type if the input is currently empty
            if (terminalInput.value === "") {
                function typeInitial() {
                    if (index < cmdName.length) {
                        // Check again in case user started typing in between
                        if (terminalInput.value.length === index) {
                            terminalInput.value += cmdName[index];
                            updateCurrentPromptText(terminalInput.value);
                            index++;
                            setTimeout(typeInitial, 120);
                        }
                    } else {
                        setTimeout(() => {
                            if (terminalInput.value === cmdName) {
                                executeCommand(cmdName);
                                terminalInput.value = "";
                            }
                        }, 400);
                    }
                }
                typeInitial();
            }
        }
    }, 1500);
    
    if (terminalInput) {
        terminalInput.addEventListener('input', (e) => {
            updateCurrentPromptText(e.target.value);
        });
        
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = terminalInput.value;
                executeCommand(cmd);
                terminalInput.value = "";
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (cmdHistory.length > 0) {
                    if (historyIdx === -1) {
                        historyIdx = cmdHistory.length - 1;
                    } else if (historyIdx > 0) {
                        historyIdx--;
                    }
                    terminalInput.value = cmdHistory[historyIdx];
                    updateCurrentPromptText(cmdHistory[historyIdx]);
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (cmdHistory.length > 0) {
                    if (historyIdx !== -1 && historyIdx < cmdHistory.length - 1) {
                        historyIdx++;
                        terminalInput.value = cmdHistory[historyIdx];
                        updateCurrentPromptText(cmdHistory[historyIdx]);
                    } else {
                        historyIdx = -1;
                        terminalInput.value = "";
                        updateCurrentPromptText("");
                    }
                }
            }
        });
        
        // Auto focus on console click
        terminalBody.addEventListener('click', () => {
            terminalInput.focus();
        });
    }
}

window.runHeroTerminalCmd = function(cmdName) {
    const terminalInput = document.getElementById('terminal-input');
    const terminalBody = document.getElementById('terminal-body');
    if (!terminalInput || !terminalBody) return;
    
    // Clear current typing if any
    terminalInput.value = "";
    updateCurrentPromptText("");
    
    // Disable action buttons temporarily during simulated typing
    const buttons = document.querySelectorAll('.terminal-action-btn');
    buttons.forEach(b => b.disabled = true);
    
    let index = 0;
    function typeChar() {
        if (index < cmdName.length) {
            terminalInput.value += cmdName[index];
            updateCurrentPromptText(terminalInput.value);
            index++;
            setTimeout(typeChar, 50);
        } else {
            setTimeout(() => {
                executeCommand(cmdName);
                terminalInput.value = "";
                buttons.forEach(b => b.disabled = false);
            }, 150);
        }
    }
    typeChar();
};

function initHeroDashboard() {
    runMetricFluctuations();
    initHeroLatencyChart();
    initTerminal();
}

window.toggleRes = function(res) {
    const card = document.querySelector(`.dash-res-card[data-resource="${res}"]`);
    if (!card) return;
    card.classList.toggle('active');
    
    const isActive = card.classList.contains('active');
    const msg = isActive 
        ? `Resource [${res.toUpperCase()}] status: ACTIVE (OK)` 
        : `Resource [${res.toUpperCase()}] status: STANDBY`;
    
    pushTelemetryEvent(res === 'db' ? 'cosmos' : (res === 'apim' ? 'apim' : 'func'), msg);
};


// 5. Projects - Visual CI/CD Pipelines
const pipelineStages = ["build", "test", "release", "deploy"];
const pipelineLogs = {
    1: [
        "Compiling Shopify, Amazon, and Walmart sync schemas...",
        "Running Unit tests. 42 tests passed.",
        "Compiling release zip package: ordersync-prod-v2.zip",
        "Deploying ZIP package to Azure Function App..."
    ],
    2: [
        "Transpiling Azure Bicep templates to ARM main.json...",
        "Validating subnet, vault, and app settings constraints...",
        "Running IaC dry-run checks... OK",
        "Creating resource deployment template in East US..."
    ],
    3: [
        "Validating APIM route XML schemas...",
        "Running rate limits and token validation tests...",
        "Packaging APIM endpoints definition metadata...",
        "Applying active API gateway policy mappings..."
    ]
};

window.simulatePipeline = function(index, button) {
    const wrapper = document.getElementById(`pipeline-wrapper-${index}`);
    if (!wrapper || !button) return;
    
    if (wrapper.classList.contains('active')) {
        wrapper.classList.remove('active');
        button.innerHTML = "<i class='bx bx-play-circle'></i> Run Pipeline Simulation";
        resetPipelineVisuals(index);
        return;
    }
    
    wrapper.classList.add('active');
    button.disabled = true;
    button.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Running Pipeline...";
    button.style.color = "var(--accent)";
    button.style.borderColor = "var(--accent)";
    
    resetPipelineVisuals(index);
    
    let currentStage = 0;
    const logs = pipelineLogs[index];
    
    function runNextStage() {
        if (currentStage < pipelineStages.length) {
            const stageName = pipelineStages[currentStage];
            const stageEl = document.getElementById(`stage-${index}-${stageName}`);
            const statusEl = document.getElementById(`pipeline-status-${index}`);
            
            if (stageEl) {
                stageEl.classList.add('active');
            }
            if (statusEl) {
                statusEl.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> ${logs[currentStage]}`;
            }
            
            if (currentStage > 0) {
                const prevConnector = document.getElementById(`connector-${index}-${currentStage}`);
                if (prevConnector) {
                    const fill = prevConnector.querySelector('.connector-progress');
                    if (fill) fill.style.width = "100%";
                }
            }
            
            setTimeout(() => {
                if (stageEl) {
                    stageEl.classList.remove('active');
                    stageEl.classList.add('success');
                    const dot = stageEl.querySelector('.stage-dot');
                    if (dot) dot.innerHTML = "<i class='bx bx-check'></i>";
                }
                
                currentStage++;
                setTimeout(runNextStage, 600);
            }, 1200);
        } else {
            const finalConnector = document.getElementById(`connector-${index}-3`);
            if (finalConnector) {
                const fill = finalConnector.querySelector('.connector-progress');
                if (fill) fill.style.width = "100%";
            }
            
            const statusEl = document.getElementById(`pipeline-status-${index}`);
            if (statusEl) {
                statusEl.innerHTML = `<i class='bx bx-check-circle' style='color:#27c93f;'></i> [SUCCESS] Pipeline execution finished!`;
                statusEl.style.color = "#27c93f";
            }
            
            button.disabled = false;
            button.innerHTML = "<i class='bx bx-check-circle' style='color:#27c93f;'></i> Pipeline Complete ✔";
            button.style.borderColor = "#27c93f";
            button.style.color = "#27c93f";
        }
    }
    
    setTimeout(runNextStage, 300);
};

function resetPipelineVisuals(index) {
    pipelineStages.forEach((stage, idx) => {
        const stageEl = document.getElementById(`stage-${index}-${stage}`);
        if (stageEl) {
            stageEl.classList.remove('active', 'success');
            const dot = stageEl.querySelector('.stage-dot');
            if (dot) {
                const icons = {
                    build: "bx-code-alt",
                    test: "bx-test-tube",
                    release: "bx-package",
                    deploy: "bx-cloud-upload"
                };
                dot.innerHTML = `<i class='bx ${icons[stage]}'></i>`;
            }
        }
        
        if (idx < 3) {
            const connector = document.getElementById(`connector-${index}-${idx + 1}`);
            if (connector) {
                const fill = connector.querySelector('.connector-progress');
                if (fill) fill.style.width = "0%";
            }
        }
    });
    const statusEl = document.getElementById(`pipeline-status-${index}`);
    if (statusEl) {
        statusEl.style.color = "var(--text-secondary)";
    }
}


// 6. Experience - Telemetry Panels
window.toggleJobTelemetry = function(index, button) {
    const panel = document.getElementById(`job-telemetry-${index}`);
    if (!panel || !button) return;
    
    if (panel.classList.contains('active')) {
        panel.classList.remove('active');
        button.innerHTML = index === 1 ? "<i class='bx bx-pulse'></i> Inspect Cloud Workspace" : "<i class='bx bx-pulse'></i> Inspect Workspace Diagnostics";
        resetJobTelemetry(index);
        return;
    }
    
    panel.classList.add('active');
    button.disabled = true;
    button.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Querying Telemetry...";
    button.style.color = "var(--accent)";
    button.style.borderColor = "var(--accent)";
    
    resetJobTelemetry(index);
    
    setTimeout(() => {
        animateJobGauges(index);
        button.disabled = false;
        button.innerHTML = "<i class='bx bx-check-shield' style='color:#27c93f;'></i> Diagnostics Nominal ✔";
        button.style.borderColor = "#27c93f";
        button.style.color = "#27c93f";
    }, 1500);
};

function animateJobGauges(index) {
    const successValEl = document.getElementById(`job${index}-val-success`);
    const successGauge = document.getElementById(`job${index}-gauge-success`);
    const targetPercent = index === 1 ? 99.8 : 99.9;
    
    let currentPercent = 0;
    const interval = setInterval(() => {
        if (currentPercent < Math.floor(targetPercent)) {
            currentPercent += 3;
            if (successValEl) successValEl.textContent = `${currentPercent}%`;
        } else {
            if (successValEl) successValEl.textContent = `${targetPercent}%`;
            clearInterval(interval);
        }
    }, 30);
    
    if (successGauge) {
        const offset = ((100 - targetPercent) / 100) * 201;
        successGauge.style.strokeDashoffset = offset;
    }
    
    const fillPerf = document.getElementById(`job${index}-fill-perf`);
    if (fillPerf) {
        fillPerf.style.width = "92%";
    }
    
    const shield = document.getElementById(`job${index}-shield`);
    const shieldText = document.getElementById(`job${index}-shield-text`);
    if (shield) {
        shield.className = "bx bxs-shield-alt-2 shield-status-icon verified";
    }
    if (shieldText) {
        shieldText.textContent = index === 1 ? "ZERO-KEYS LEAKED" : "OAUTH 2.0 VALIDATED";
    }
}

function resetJobTelemetry(index) {
    const successValEl = document.getElementById(`job${index}-val-success`);
    const successGauge = document.getElementById(`job${index}-gauge-success`);
    const fillPerf = document.getElementById(`job${index}-fill-perf`);
    const shield = document.getElementById(`job${index}-shield`);
    const shieldText = document.getElementById(`job${index}-shield-text`);
    
    if (successValEl) successValEl.textContent = "0%";
    if (successGauge) successGauge.style.strokeDashoffset = 201;
    if (fillPerf) fillPerf.style.width = "0%";
    if (shield) shield.className = "bx bx-shield-quarter shield-status-icon";
    if (shieldText) shieldText.textContent = "PENDING";
}


// 7. Contact Form Handler
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const subject = document.getElementById('form-subject').value;
        const message = document.getElementById('form-message').value;
        const submitBtn = document.getElementById('contact-submit-btn');
        const successPanel = document.getElementById('form-success-panel');
        
        if (!submitBtn) return;
        
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        
        setTimeout(() => {
            submitBtn.classList.remove('loading');
            if (successPanel) {
                successPanel.classList.add('active');
            }
            
            setTimeout(() => {
                if (successPanel) {
                    successPanel.classList.remove('active');
                }
                submitBtn.disabled = false;
                
                document.getElementById('form-subject').value = '';
                document.getElementById('form-message').value = '';
                
                const mailtoUrl = `mailto:anand.svaidya24@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
                window.location.href = mailtoUrl;
            }, 2000);
        }, 1500);
    });
}

// 8. Metrics Section Upgrades (Scroll Counters, 3D flips, diagnostics terminal)
const DIAGNOSTIC_SCRIPTS = {
    ha: [
        { text: 'PS C:\\> Resolve-DnsName global.tm.endpoint', type: 'prompt' },
        { text: 'Name: global.tm.endpoint -> 52.170.82.11', type: '' },
        { text: 'PS C:\\> Test-Connection -ComputerName 52.170.82.11 -Count 2', type: 'prompt' },
        { text: 'Reply from East-US: time=12ms [ONLINE]', type: 'success' },
        { text: 'Reply from West-US: time=15ms [ONLINE]', type: 'success' },
        { text: 'PS C:\\> Get-TrafficManagerStatus -Profile TM-Global', type: 'prompt' },
        { text: 'RoutingStatus: Active | MonitorStatus: Online', type: '' },
        { text: 'SUCCESS: HA cluster validation passed. SLA: 99.99%', type: 'success' }
    ],
    iac: [
        { text: 'PS C:\\> az deployment group validate --resource-group rg-portfolio --template-file main.bicep', type: 'prompt' },
        { text: 'Validating template syntax and parameter values...', type: '' },
        { text: 'Validation passed. No compilation errors detected.', type: 'success' },
        { text: 'PS C:\\> az deployment group what-if --resource-group rg-portfolio --template-file main.bicep', type: 'prompt' },
        { text: 'Resource changes: 0 to create, 0 to update, 0 to delete.', type: 'success' },
        { text: 'SUCCESS: Azure deployment state matches Bicep template declarations.', type: 'success' }
    ],
    cicd: [
        { text: 'PS C:\\> dotnet test --collect:"XPlat Code Coverage"', type: 'prompt' },
        { text: 'Passed! - Failed: 0, Passed: 142, Skipped: 0', type: '' },
        { text: 'Code Coverage: 92.8% (Target: 90%)', type: 'success' },
        { text: 'PS C:\\> az pipelines build queue --definition-name portfolio-ci', type: 'prompt' },
        { text: 'Queueing Azure Pipeline execution... [Build ID: 820]', type: '' },
        { text: 'Stage: Build & Test [PASSED] | Stage: Aqua Sec Scan [0 CVEs]', type: 'success' },
        { text: 'SUCCESS: Azure DevOps pipeline run #820 finished successfully.', type: 'success' }
    ],
    sec: [
        { text: 'PS C:\\> Get-AzRoleAssignment -SignInName ManagedIdentity', type: 'prompt' },
        { text: 'RoleDefinitionName: Contributor -> Scope: resource-level', type: '' },
        { text: 'PS C:\\> Test-AzKeyVaultAccess -VaultName portfolio-kv', type: 'prompt' },
        { text: 'AccessPolicy: Verified. SAS tokens blocked.', type: 'success' },
        { text: 'PS C:\\> Test-NetworkIsolation -Subnet private-subnet-1', type: 'prompt' },
        { text: 'PrivateEndpoints: Enforced. Public Access: Disabled', type: 'success' },
        { text: 'SUCCESS: Zero-trust policies audited successfully.', type: 'success' }
    ]
};

function typeMicroTerminal(termEl, lines, button, callback) {
    termEl.innerHTML = ''; // Clear terminal
    let lineIdx = 0;
    
    function addNextLine() {
        if (lineIdx < lines.length) {
            const line = lines[lineIdx];
            const lineDiv = document.createElement('div');
            lineDiv.className = 'term-line ' + (line.type || '');
            lineDiv.textContent = line.text;
            termEl.appendChild(lineDiv);
            
            // Auto scroll to bottom
            const container = termEl.closest('.micro-terminal-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
            
            lineIdx++;
            setTimeout(addNextLine, 250 + Math.random() * 150); // realistic variance
        } else {
            if (button) button.disabled = false;
            if (callback) callback();
        }
    }
    addNextLine();
}

function initMetricCounters() {
    const metricVals = document.querySelectorAll('.metrics-grid .metric-val');
    if (metricVals.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetEl = entry.target;
                const targetVal = parseFloat(targetEl.getAttribute('data-target'));
                const decimals = parseInt(targetEl.getAttribute('data-decimals') || '0', 10);
                const suffix = targetEl.getAttribute('data-suffix') || '';
                
                animateCounter(targetEl, targetVal, decimals, suffix);
                observer.unobserve(targetEl);
            }
        });
    }, { threshold: 0.1 });

    metricVals.forEach(val => observer.observe(val));
}

function animateCounter(el, target, decimals, suffix) {
    const duration = 1500; // ms
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (easeOutQuad)
        const easeProgress = progress * (2 - progress);
        const currentVal = easeProgress * target;
        
        if (decimals === 0) {
            el.textContent = Math.round(currentVal) + suffix;
        } else {
            el.textContent = currentVal.toFixed(decimals) + suffix;
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            if (decimals === 0) {
                el.textContent = Math.round(target) + suffix;
            } else {
                el.textContent = target.toFixed(decimals) + suffix;
            }
        }
    }
    requestAnimationFrame(update);
}

function initMetricCardFlips() {
    const wrappers = document.querySelectorAll('.metric-card-wrapper');
    wrappers.forEach(wrapper => {
        const inner = wrapper.querySelector('.metric-card-inner');
        if (!inner) return;
        
        wrapper.addEventListener('click', (e) => {
            // Check if user clicked close button
            const closeBtn = e.target.closest('.metric-close-btn');
            if (closeBtn) {
                e.stopPropagation();
                inner.classList.remove('flipped');
                return;
            }
            
            // Check if clicked inside back face controls
            const backFace = e.target.closest('.metric-card-back');
            if (backFace) {
                // If it's anything other than closeBtn, don't flip back
                return;
            }
            
            inner.classList.add('flipped');
        });
    });
}

function initMetricDiagnostics() {
    const diagBtns = document.querySelectorAll('.diag-action-btn');
    diagBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop click from propagating to card flip
            
            const metric = btn.getAttribute('data-metric');
            const term = document.getElementById(`term-${metric}`);
            if (!term) return;
            
            btn.disabled = true;
            const originalText = btn.textContent;
            btn.textContent = "Running Audit...";
            
            // Visual feedback on progress bars
            const card = btn.closest('.metric-card-wrapper');
            const bars = card.querySelectorAll('.progress-bar-fill');
            const originalWidths = [];
            
            bars.forEach(bar => {
                originalWidths.push(bar.style.width || '100%');
                bar.style.width = '0%';
            });
            
            setTimeout(() => {
                bars.forEach((bar, idx) => {
                    bar.style.width = originalWidths[idx];
                });
            }, 300);

            const scriptLines = DIAGNOSTIC_SCRIPTS[metric];
            if (scriptLines) {
                typeMicroTerminal(term, scriptLines, btn, () => {
                    btn.textContent = "Audit Complete";
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.disabled = false;
                    }, 2000);
                });
            }
        });
    });
}

// Initialise everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initMetricCounters();
    initMetricCardFlips();
    initMetricDiagnostics();
});

// =============================================
// SKILL TOOLTIP MODAL — Recruiter-Friendly Premium Glassmorphism
// =============================================

(function initSkillTooltipModal() {
    const overlay   = document.getElementById('skill-overlay');
    const closeBtn  = document.getElementById('skill-tooltip-close');
    const iconEl    = document.getElementById('skill-tooltip-icon');
    const nameEl    = document.getElementById('skill-tooltip-name');
    const barEl     = document.getElementById('skill-tooltip-bar');
    const pctEl     = document.getElementById('skill-tooltip-pct');
    const descEl    = document.getElementById('skill-tooltip-desc');
    const useEl     = document.getElementById('skill-tooltip-use');
    const whyEl     = document.getElementById('skill-tooltip-why');

    if (!overlay) return;

    // Icon abbreviation map
    const skillIcons = {
        'Azure Bicep':    'BIC',
        'ARM Templates':  'ARM',
        'Azure Functions':'FN()',
        'Logic Apps':     'LA',
        'App Services':   'APP',
        'Azure DevOps':   'ADO',
        'Docker':         '🐳',
        'CI/CD':          '⚙',
        'Cosmos DB':      'DB',
        'Azure APIM':     'API',
        'SQL Server':     'SQL'
    };

    // Gradient map per skill
    const skillGradients = {
        'Azure Bicep':    'linear-gradient(135deg,#0078d4,#00b4f0)',
        'ARM Templates':  'linear-gradient(135deg,#005ba1,#0078d4)',
        'Azure Functions':'linear-gradient(135deg,#f59e0b,#d97706)',
        'Logic Apps':     'linear-gradient(135deg,#10b981,#059669)',
        'App Services':   'linear-gradient(135deg,#0284c7,#0ea5e9)',
        'Azure DevOps':   'linear-gradient(135deg,#0078d4,#3a7bd5)',
        'Docker':         'linear-gradient(135deg,#0db7ed,#0284c7)',
        'CI/CD':          'linear-gradient(135deg,#8b5cf6,#6d28d9)',
        'Cosmos DB':      'linear-gradient(135deg,#7c3aed,#a855f7)',
        'Azure APIM':     'linear-gradient(135deg,#00d2ff,#3a7bd5)',
        'SQL Server':     'linear-gradient(135deg,#cc2936,#9f1239)'
    };

    // Recruiter-friendly "Why it matters" blurbs
    const skillWhy = {
        'Azure Bicep':     'Shows deep Azure-native IaC expertise — the candidate can spin up entire environments from code, ensuring consistency and auditability across teams.',
        'ARM Templates':   'Demonstrates proficiency with Azure\'s foundational deployment layer — critical for legacy migrations and complex multi-resource orchestrations.',
        'Azure Functions': 'Proves ability to build scalable, cost-efficient serverless solutions — reduces infrastructure overhead and accelerates feature delivery.',
        'Logic Apps':      'Indicates workflow automation skills that bridge business processes with cloud services — reduces manual work and speeds up cross-team collaboration.',
        'App Services':    'Shows hands-on experience with managed hosting — means faster deployments, lower ops burden, and production-ready web apps and APIs.',
        'Azure DevOps':    'Demonstrates end-to-end DevOps maturity — automated pipelines, code reviews, and release management that keep delivery fast and reliable.',
        'Docker':          'Container expertise means the candidate builds portable, environment-consistent applications — essential for modern microservice architectures.',
        'CI/CD':           'Continuous integration and deployment skills translate to faster release cycles, fewer bugs in production, and confident, automated rollouts.',
        'Cosmos DB':       'Global-scale NoSQL experience signals readiness for high-throughput, low-latency data challenges — critical for real-time customer-facing apps.',
        'Azure APIM':      'API gateway expertise shows ability to unify, secure, and monetize APIs — a must-have for enterprise integration strategies.',
        'SQL Server':      'Relational database strength ensures the candidate can handle structured data, complex queries, and transactional integrity in mission-critical systems.'
    };

    // Keys that cause scrolling
    const SCROLL_KEYS = new Set(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ']);

    function blockScroll(e) {
        if (e.target && e.target.closest && e.target.closest('.skill-tooltip-card')) return;
        e.preventDefault();
    }

    function blockScrollKey(e) {
        if (SCROLL_KEYS.has(e.key)) e.preventDefault();
    }

    function openModal(tag) {
        const skill = tag.dataset.skill;
        const level = parseInt(tag.dataset.level) || 80;
        const desc  = tag.dataset.desc  || '';
        const use   = tag.dataset.use   || '';

        nameEl.textContent = skill;
        descEl.textContent = desc;
        useEl.textContent  = use;
        pctEl.textContent  = level + '% Proficiency';
        iconEl.textContent = skillIcons[skill] || skill.slice(0, 3).toUpperCase();
        iconEl.style.background = skillGradients[skill] || 'linear-gradient(135deg,#00d2ff,#3a7bd5)';
        iconEl.style.fontSize   = iconEl.textContent.length > 3 ? '1rem' : '1.1rem';

        // Populate recruiter "Why it matters"
        if (whyEl) {
            whyEl.textContent = skillWhy[skill] || 'This skill demonstrates hands-on cloud engineering expertise that directly impacts delivery speed and system reliability.';
        }

        // Reset bar then animate
        barEl.style.transition = 'none';
        barEl.style.width = '0%';

        // Block scroll via event interception — zero DOM/style changes,
        // so body position, mouse coordinates, and spotlight effects are untouched.
        window.addEventListener('wheel',     blockScroll,    { passive: false });
        window.addEventListener('touchmove', blockScroll,    { passive: false });
        window.addEventListener('keydown',   blockScrollKey, { passive: false });

        overlay.classList.add('active');
        overlay.removeAttribute('aria-hidden');

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                barEl.style.transition = 'width 1s cubic-bezier(0.22,1,0.36,1)';
                barEl.style.width = level + '%';
            });
        });
    }

    function closeModal() {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
        barEl.style.width = '0%';
        // Re-enable scroll
        window.removeEventListener('wheel',     blockScroll);
        window.removeEventListener('touchmove', blockScroll);
        window.removeEventListener('keydown',   blockScrollKey);
    }

    // Wire up all interactive skill tags
    document.querySelectorAll('.skill-tag.skill-interactive').forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(tag);
        });
    });

    // Close on button
    closeBtn.addEventListener('click', closeModal);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
})();



/* Magnetic Buttons */
const magneticButtons = document.querySelectorAll('.btn, .social-links a');
magneticButtons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(px, px)`;
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
    });
});
