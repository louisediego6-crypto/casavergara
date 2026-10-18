@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Terms & Conditions - Casa Vergara Resort</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../css/style.css?v=20261004f" rel="stylesheet">
  <link href="../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../css/laravel-ui.css?v=20261018b" rel="stylesheet">
  <link href="../css/casa-refresh.css?v=20261018a" rel="stylesheet">
</head>
<body>
  <div id="site-navbar"></div>

  <header class="legal-hero">
    <div class="container">
      <div class="legal-shell">
        <nav aria-label="Breadcrumb" class="legal-rise" style="--i:0">
          <ol class="legal-crumbs">
            <li><a href="landing.html">Home</a></li>
            <li aria-current="page">Terms &amp; Conditions</li>
          </ol>
        </nav>
        <h1 class="legal-rise" style="--i:1">Terms &amp; Conditions</h1>
        <p class="legal-hero-lead legal-rise" style="--i:2">The booking rules for rooms and events at Casa Vergara Resort, including payments, changes, and cancellations.</p>
        <div class="legal-switch legal-rise" style="--i:3">
          <a href="user-manual.html"><i class="bi bi-book" aria-hidden="true"></i>User Manual</a>
          <a href="sitemap.html"><i class="bi bi-diagram-3" aria-hidden="true"></i>Site Map</a>
          <a href="terms.html" aria-current="page"><i class="bi bi-file-earmark-text" aria-hidden="true"></i>Terms &amp; Conditions</a>
          <a href="privacy.html"><i class="bi bi-shield-check" aria-hidden="true"></i>Privacy Policy</a>
        </div>
      </div>
    </div>
  </header>

  <main class="legal-main">
    <div class="container">
      <div class="legal-shell">
        <div class="legal-tabs" id="cvrTermsTabs" role="tablist" aria-label="Booking type" data-active="room">
          <span class="legal-tabs-thumb" aria-hidden="true"></span>
          <button type="button" role="tab" id="tabRoom" aria-selected="true" aria-controls="cvrLegalDoc" data-doc-type="room"><i class="bi bi-house-door" aria-hidden="true"></i>Room Bookings</button>
          <button type="button" role="tab" id="tabEvent" aria-selected="false" aria-controls="cvrLegalDoc" tabindex="-1" data-doc-type="event"><i class="bi bi-calendar-event" aria-hidden="true"></i>Event Bookings</button>
        </div>

        <div id="cvrLegalDoc" role="tabpanel" aria-live="polite"></div>
      </div>
    </div>
  </main>

  <div id="site-footer"></div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../js/main.js?v=20260925a"></script>
  <script src="../js/legal-doc.js?v=20261018b"></script>
  <script>
    renderNavbar("");
    renderFooter();

    const tabsEl = document.getElementById("cvrTermsTabs");
    const tabBtns = Array.from(tabsEl.querySelectorAll("[data-doc-type]"));
    let currentType = null;

    function selectTab(type, opts) {
      if (type === currentType) return;
      currentType = type;
      tabsEl.setAttribute("data-active", type);
      tabBtns.forEach((btn) => {
        const on = btn.getAttribute("data-doc-type") === type;
        btn.setAttribute("aria-selected", on ? "true" : "false");
        btn.tabIndex = on ? 0 : -1;
        if (on && opts && opts.focus) btn.focus();
      });
      cvrLoadLegalDoc(type, "cvrLegalDoc", undefined, { page: true });

      // if the reader was part-way down the other document, bring them back to the top of this one
      if (opts && opts.scroll) {
        const top = tabsEl.getBoundingClientRect().top + window.scrollY - 96;
        if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
      }
    }

    tabsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-doc-type]");
      if (btn) selectTab(btn.getAttribute("data-doc-type"), { scroll: true });
    });

    tabsEl.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      const next = e.key === "ArrowRight" || e.key === "End" ? "event" : "room";
      selectTab(next, { focus: true, scroll: true });
    });

    const requestedType = new URLSearchParams(window.location.search).get("type");
    selectTab(requestedType === "event" ? "event" : "room");
  </script>
</body>
</html>

@endverbatim
