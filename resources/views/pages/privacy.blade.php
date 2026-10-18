@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Privacy Policy - Casa Vergara Resort</title>
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
            <li aria-current="page">Privacy Policy</li>
          </ol>
        </nav>
        <h1 class="legal-rise" style="--i:1">Privacy Policy</h1>
        <p class="legal-hero-lead legal-rise" style="--i:2">How we collect, use, and protect your information when you book with Casa Vergara Resort.</p>
        <div class="legal-switch legal-rise" style="--i:3">
          <a href="user-manual.html"><i class="bi bi-book" aria-hidden="true"></i>User Manual</a>
          <a href="sitemap.html"><i class="bi bi-diagram-3" aria-hidden="true"></i>Site Map</a>
          <a href="terms.html"><i class="bi bi-file-earmark-text" aria-hidden="true"></i>Terms &amp; Conditions</a>
          <a href="privacy.html" aria-current="page"><i class="bi bi-shield-check" aria-hidden="true"></i>Privacy Policy</a>
        </div>
      </div>
    </div>
  </header>

  <main class="legal-main">
    <div class="container">
      <div class="legal-shell">
        <div id="cvrLegalDoc"></div>
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
    cvrLoadLegalDoc("privacy", "cvrLegalDoc", "How we handle your data", { page: true });
  </script>
</body>
</html>

@endverbatim
