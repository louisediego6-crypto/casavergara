@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Notifications - Admin - Casa Vergara</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../../css/style.css?v=20260926c" rel="stylesheet">
  <link href="../../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../../css/laravel-ui.css?v=20261018b" rel="stylesheet">
  <link href="../../css/admin-modern.css?v=20261018a" rel="stylesheet">
</head>
<body>
  <div class="admin-wrap admin-page admin-notifications-page">
    <div id="admin-sidebar"></div>
    <main class="admin-main">
      <div class="d-flex justify-content-between align-items-center mb-4 admin-page-head flex-wrap gap-3">
        <div>
          <h1 class="h2 text-brand mb-1"><i class="bi bi-bell me-2"></i>Notifications</h1>
          <p class="text-muted-brand mb-0">Contact-form replies and site updates addressed to your account.</p>
        </div>
        <button type="button" class="btn btn-outline-secondary btn-sm" id="adminNotifMarkAllBtn">
          <i class="bi bi-check2-all me-1"></i>Mark all as read
        </button>
      </div>

      <div class="soft-card p-4">
        <div id="adminNotifPageList">
          <p class="small text-muted-brand mb-0">Loading…</p>
        </div>
      </div>
    </main>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../../js/main.js?v=20260926b"></script>
  <script>
    renderAdminSidebar("notifications");
    initAdminNotificationsPage();
  </script>
</body>
</html>

@endverbatim
