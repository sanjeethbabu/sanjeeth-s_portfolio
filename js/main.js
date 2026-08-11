import { initScene } from "./three-scene.js";

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    /* ---------- 3D background ---------- */
    const sceneHost = document.getElementById("scene");
    if (sceneHost) {
      initScene(sceneHost);
    }

    /* ---------- Navigation ---------- */
    const nav = document.querySelector(".nav");
    const navToggle = document.getElementById("navToggle");
    const navLinks = document.getElementById("navLinks");
    const scrollTopBtn = document.getElementById("scrollTop");
    const progressBar = document.getElementById("scrollProgress");

    function onScroll() {
      const scrolled = window.scrollY > 10;
      nav.classList.toggle("scrolled", scrolled);
      scrollTopBtn.classList.toggle("visible", window.scrollY > 500);

      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      if (progressBar) progressBar.style.width = pct + "%";
    }

    function closeMenu() {
      navToggle.classList.remove("open");
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }

    navToggle.addEventListener("click", function () {
      const open = navLinks.classList.toggle("open");
      navToggle.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    navLinks.querySelectorAll("a").forEach((link) =>
      link.addEventListener("click", closeMenu)
    );

    scrollTopBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* ---------- Reveal on scroll ---------- */
    const revealEls = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      revealEls.forEach((el) => io.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add("visible"));
    }

    /* ---------- 3D tilt on cards ---------- */
    const tiltables = document.querySelectorAll(".tilt");
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    tiltables.forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        if (reducedMotion) return;
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--rx", (-py * 8).toFixed(2) + "deg");
        card.style.setProperty("--ry", (px * 10).toFixed(2) + "deg");
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });

    /* ---------- Typewriter effect ---------- */
    const typeEl = document.getElementById("typewriter");
    if (typeEl) {
      const phrases = [
        "Data Engineer",
        "PySpark Developer",
        "Databricks Specialist",
        "ETL Pipeline Builder",
        "AI Automation Engineer",
      ];
      let phraseIndex = 0;
      let charIndex = 0;
      let deleting = false;
      const speed = 80;
      const pause = 1800;

      function type() {
        const current = phrases[phraseIndex];
        if (!deleting) {
          charIndex++;
          typeEl.textContent = current.slice(0, charIndex);
          if (charIndex === current.length) {
            deleting = true;
            setTimeout(type, pause);
            return;
          }
        } else {
          charIndex--;
          typeEl.textContent = current.slice(0, charIndex);
          if (charIndex === 0) {
            deleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
          }
        }
        setTimeout(type, deleting ? speed / 2 : speed);
      }
      type();
    }

    /* ---------- Animated counters ---------- */
    const counters = document.querySelectorAll("[data-count]");
    if (counters.length && "IntersectionObserver" in window) {
      const cio = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseFloat(el.dataset.count);
            const decimals = parseInt(el.dataset.decimals || "0", 10);
            const suffix = el.dataset.suffix || "";
            const duration = 1600;
            const start = performance.now();

            function tick(now) {
              const p = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - p, 3);
              el.textContent = (target * eased).toFixed(decimals) + suffix;
              if (p < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
            cio.unobserve(el);
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((el) => cio.observe(el));
    }

    /* ---------- Footer year ---------- */
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });
})();
