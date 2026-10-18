/* Casa Vergara — refresh layer: reveals the highlights section once, when it scrolls into view. */
(function () {
  "use strict";

  function init() {
    var groups = document.querySelectorAll(".hl-reveal");
    if (!groups.length) return;

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function show(el) { el.classList.add("is-in"); }

    if (reduce || !("IntersectionObserver" in window)) {
      groups.forEach(show);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          show(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });

    groups.forEach(function (g) { io.observe(g); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
