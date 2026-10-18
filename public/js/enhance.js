

(function () {
  "use strict";

  function ensureProgressBar() {
    let bar = document.getElementById("cvProgressBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "cvProgressBar";
      document.body.appendChild(bar);
    }
    return bar;
  }

  function startProgress() {
    const bar = ensureProgressBar();
    bar.style.transition = "none";
    bar.style.width = "0%";
    bar.classList.add("is-active");

    void bar.offsetWidth;
    bar.style.transition = "";
    requestAnimationFrame(() => { bar.style.width = "72%"; });
  }

  function finishProgress() {
    const bar = document.getElementById("cvProgressBar");
    if (!bar) return;
    bar.style.width = "100%";
    window.setTimeout(() => {
      bar.classList.remove("is-active");
      bar.style.width = "0%";
    }, 300);
  }

  function isPlainLeftClick(e) {
    return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
  }

  function handleLinkClick(e) {
    const link = e.target.closest("a[href]");
    if (!link || !isPlainLeftClick(e)) return;

    const href = link.getAttribute("href") || "";
    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("javascript:") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      link.hasAttribute("data-bs-toggle") ||
      link.hasAttribute("download") ||
      link.target === "_blank" ||
      link.origin !== window.location.origin
    ) {
      return;
    }

    if (!/\.html(\?|#|$)/i.test(href) && href !== "/" ) return;

    e.preventDefault();
    startProgress();
    document.body.classList.add("cv-leaving");
    window.setTimeout(() => {
      window.location.href = href;
    }, 180);
  }

  window.addEventListener("pageshow", function () {
    document.body.classList.remove("cv-leaving");
    finishProgress();
  });

  function handleRipple(e) {
    const btn = e.target.closest(".btn");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement("span");
    ripple.className = "cv-ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
    ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
    btn.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 650);
  }

  const REVEAL_SELECTOR = [
    "section",
    ".card", ".figma-card", ".room-card", ".booking-room-card",
    ".package-card", ".pricing-card", ".review-card", ".faq-item",
    ".stat-card", ".admin-card", ".table-responsive", ".alert",
  ].join(", ");

  let revealObserver = null;

  function primeReveal(el) {
    if (!el || el.dataset.cvRevealed) return;

    if (el.closest(".modal, .dropdown-menu, .toast")) return;
    el.dataset.cvRevealed = "1";
    el.classList.add("cv-reveal");
    revealObserver.observe(el);
  }

  function initRevealObserver() {
    if (!("IntersectionObserver" in window)) return;
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const delay = Math.min(i * 0.06, 0.3);
            entry.target.style.setProperty("--cv-delay", delay + "s");
            entry.target.classList.add("cv-in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );

    document.querySelectorAll(REVEAL_SELECTOR).forEach(primeReveal);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches(REVEAL_SELECTOR)) primeReveal(node);
          node.querySelectorAll && node.querySelectorAll(REVEAL_SELECTOR).forEach(primeReveal);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    ensureProgressBar();
    document.addEventListener("click", handleLinkClick, true);
    document.addEventListener("pointerdown", handleRipple);
    initRevealObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
