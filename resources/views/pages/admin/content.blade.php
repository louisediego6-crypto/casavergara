@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Site Content - Admin - Casa Vergara</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../../css/style.css?v=20260830i" rel="stylesheet">
  <link href="../../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../../css/laravel-ui.css?v=20261018b" rel="stylesheet">
  <link href="../../css/admin-modern.css?v=20261018a" rel="stylesheet">
</head>
<body>
  <div class="admin-wrap admin-page admin-content-page">
    <div id="admin-sidebar"></div>
    <main class="admin-main">
      <div class="d-flex justify-content-between align-items-center mb-4 admin-page-head flex-wrap gap-3">
        <div>
          <h1 class="h2 text-brand mb-1"><i class="bi bi-images me-2"></i>Site Content</h1>
          <p class="text-muted-brand mb-0">Edit the headline text and photos guests see on the website — no code required. Changes appear on the live site as soon as they're saved.</p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <a class="btn btn-outline-primary" href="../landing.html" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right me-1"></i>View homepage</a>
        </div>
      </div>

      <div id="contentAlert" class="alert d-none small" role="alert"></div>

      <div id="contentLoading" class="text-center text-muted-brand py-5">
        <div class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>Loading content…
      </div>

      <div id="contentSections" class="d-none"></div>
      <div id="contentEmpty" class="soft-card p-4 text-center text-muted-brand d-none">
        No editable content fields have been set up yet. Run <code>database/migration_site_content.sql</code> to add them.
      </div>
    </main>
  </div>

  <template id="contentFieldTextTpl">
    <div class="col-12 content-field" data-field-type="text">
      <label class="form-label small text-muted-brand mb-1 content-field-label"></label>
      <div class="d-flex gap-2 align-items-start">
        <input type="text" class="form-control content-field-input" maxlength="255">
        <button type="button" class="btn btn-brand content-field-save flex-shrink-0" disabled>
          <span class="admin-btn-label">Save</span>
          <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
        </button>
      </div>
    </div>
  </template>

  <template id="contentFieldTextareaTpl">
    <div class="col-12 content-field" data-field-type="textarea">
      <label class="form-label small text-muted-brand mb-1 content-field-label"></label>
      <textarea class="form-control content-field-input" rows="3"></textarea>
      <div class="d-flex justify-content-end mt-2">
        <button type="button" class="btn btn-brand content-field-save" disabled>
          <span class="admin-btn-label">Save</span>
          <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
        </button>
      </div>
    </div>
  </template>

  <template id="contentFieldImageTpl">
    <div class="col-md-6 col-lg-4 content-field" data-field-type="image">
      <label class="form-label small text-muted-brand mb-1 content-field-label"></label>
      <div class="content-field-photo-wrap position-relative mb-2">
        <img class="content-field-photo img-fluid rounded-3 border w-100" alt="" style="aspect-ratio:16/10;object-fit:cover;">
        <div class="content-field-photo-busy position-absolute top-0 start-0 w-100 h-100 d-none align-items-center justify-content-center bg-dark bg-opacity-50 rounded-3">
          <span class="spinner-border spinner-border-sm text-white" role="status" aria-hidden="true"></span>
        </div>
      </div>
      <input type="file" class="form-control form-control-sm content-field-file" accept="image/jpeg,image/png,image/webp">
      <div class="form-text">JPG, PNG or WEBP, up to 5 MB. Uploading replaces the live photo immediately.</div>
    </div>
  </template>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../../js/main.js?v=20260924d"></script>
  <script src="../../js/admin-content.js?v=20260924a"></script>
  <script>renderAdminSidebar("content"); initAdminContentPage();</script>
</body>
</html>

@endverbatim
