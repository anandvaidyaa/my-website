// Mobile Menu Toggle
const menuIcon = document.getElementById('menu-icon');
const navLinks = document.getElementById('nav-links');

menuIcon.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    // Change icon between menu and x
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

// Scroll Reveal Animation using Intersection Observer
const revealElements = document.querySelectorAll('.reveal');

const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            // Optional: stop observing once revealed
            // observer.unobserve(entry.target);
        }
    });
};

const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
};

const revealObserver = new IntersectionObserver(revealCallback, revealOptions);

revealElements.forEach(el => {
    revealObserver.observe(el);
});

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
    const currentRole = roles[roleIndex];
    
    if (isDeleting) {
        // Remove char
        typedRoleElement.textContent = currentRole.substring(0, charIndex - 1);
        charIndex--;
        typingDelay = 50; // Faster deleting
    } else {
        // Add char
        typedRoleElement.textContent = currentRole.substring(0, charIndex + 1);
        charIndex++;
        typingDelay = 100; // Normal typing
    }
    
    // Logic for next role/direction
    if (!isDeleting && charIndex === currentRole.length) {
        // Pause at end
        typingDelay = 1500;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex++;
        if (roleIndex >= roles.length) {
            roleIndex = 0;
        }
        // Pause before next word
        typingDelay = 500;
    }
    
    setTimeout(typeEffect, typingDelay);
}

// Start typing effect on load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(typeEffect, 1000);
    // Add active class to hero elements for initial fade in
    document.querySelector('.hero-content').classList.add('active');
});

// --- Terminal Preloader Logic ---
const bootLines = [
    "> Initializing Azure Cloud Environment...",
    "> Authenticating Managed Identities... [OK]",
    "> Loading Serverless Functions... [OK]",
    "> Establishing VNET connections... [OK]",
    "> Starting Anand_Vaidya_Portfolio.exe..."
];

const preloaderBody = document.getElementById('preloader-body');
const preloader = document.getElementById('preloader');

let bootLineIndex = 0;
function typeBootLine() {
    if (bootLineIndex < bootLines.length) {
        const p = document.createElement('p');
        p.textContent = bootLines[bootLineIndex];
        
        // Add a slight success color to the [OK] strings
        if (p.textContent.includes('[OK]')) {
            p.innerHTML = p.textContent.replace('[OK]', '<span style="color:#27c93f;">[OK]</span>');
        }

        preloaderBody.appendChild(p);
        bootLineIndex++;
        
        // Random typing delay between 150ms and 350ms
        setTimeout(typeBootLine, Math.random() * 200 + 150);
    } else {
        // Finished booting, wait 500ms then fade out
        setTimeout(() => {
            preloader.classList.add('hidden');
            // Allow scrolling again if you want, or just trigger reveals
            document.body.style.overflowY = 'auto';
            // Wait for fade transition, then remove from DOM
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 800);
        }, 500);
    }
}

// Start boot sequence immediately on load
window.addEventListener('DOMContentLoaded', () => {
    // Lock scroll during boot
    document.body.style.overflowY = 'hidden';
    setTimeout(typeBootLine, 300);
});
// --------------------------------
const cursorDot = document.querySelector('[data-cursor-dot]');
const cursorOutline = document.querySelector('[data-cursor-outline]');

window.addEventListener('mousemove', function(e) {
    const posX = e.clientX;
    const posY = e.clientY;

    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;

    // Add a slight delay to the outline for a smooth trailing effect
    cursorOutline.animate({
        left: `${posX}px`,
        top: `${posY}px`
    }, { duration: 500, fill: "forwards" });
});

// Add hover effect for clickable elements
const clickables = document.querySelectorAll('a, button, .glass-card, .metric-card');
clickables.forEach(clickable => {
    clickable.addEventListener('mouseenter', () => {
        cursorOutline.classList.add('cursor-hover');
    });
    clickable.addEventListener('mouseleave', () => {
        cursorOutline.classList.remove('cursor-hover');
    });
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

// Advanced Dynamic Cursor per Section
const sections = document.querySelectorAll('section');
const cursorText = document.createElement('span');
cursorText.className = 'cursor-text';
cursorOutline.appendChild(cursorText);

sections.forEach(sec => {
    sec.addEventListener('mouseenter', () => {
        if (sec.id === 'experience') {
            cursorText.innerHTML = "<i class='bx bx-briefcase' style='font-size:1.5rem;'></i>";
            cursorOutline.classList.add('cursor-hover-text');
        } else if (sec.id === 'education') {
            cursorText.innerHTML = "<i class='bx bxs-graduation' style='font-size:1.5rem;'></i>";
            cursorOutline.classList.add('cursor-hover-text');
        } else if (sec.id === 'contact') {
            cursorText.innerHTML = "<i class='bx bxs-send' style='font-size:1.5rem;'></i>";
            cursorOutline.classList.add('cursor-hover-text');
        } else {
            cursorOutline.classList.remove('cursor-hover-text');
            cursorText.textContent = '';
        }
    });
});

// Theme Toggle Logic
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = themeToggleBtn.querySelector('i');

// Check for saved user preference, if any, on load of the website
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'light') {
    document.body.classList.add('light-mode');
    themeIcon.classList.replace('bx-sun', 'bx-moon');
    // Ensure Vanta JS gets updated when it loads (we'll also handle it in index.html directly or here)
}

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    let theme = 'dark';
    
    if (document.body.classList.contains('light-mode')) {
        themeIcon.classList.replace('bx-sun', 'bx-moon');
        theme = 'light';
        if (window.vantaEffect) {
            window.vantaEffect.setOptions({
                backgroundColor: 0xf1f5f9,
                color: 0x0f172a
            });
        }
    } else {
        themeIcon.classList.replace('bx-moon', 'bx-sun');
        if (window.vantaEffect) {
            window.vantaEffect.setOptions({
                backgroundColor: 0x0b0f19,
                color: 0x00d2ff
            });
        }
    }
    
    localStorage.setItem('theme', theme);
});
