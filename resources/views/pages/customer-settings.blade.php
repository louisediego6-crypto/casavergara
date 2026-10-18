@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Casa Vergara - Account settings</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../css/style.css?v=20261004f" rel="stylesheet">
  <link href="../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../css/laravel-ui.css?v=20261018b" rel="stylesheet">
  <script>
    (function () {
      try {
        var raw = localStorage.getItem("cvrCustomerSession");
        var s = raw ? JSON.parse(raw) : null;
        if (!s || !s.email) window.location.replace("login.html");
      } catch (err) {
        window.location.replace("login.html");
      }
    })();
  </script>
</head>
<body id="customerSettingsRoot">
  <div id="site-navbar"></div>

  <section class="section-pad pb-5">
    <div class="container" style="max-width:900px;">
      <nav class="mb-4" aria-label="breadcrumb">
        <ol class="breadcrumb small mb-0">
          <li class="breadcrumb-item"><a href="customer-dashboard.html" class="text-decoration-none">Dashboard</a></li>
          <li class="breadcrumb-item active" aria-current="page">Settings</li>
        </ol>
      </nav>

      <div class="soft-card p-4 p-md-5 customer-settings-card">
        <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
          <div>
            <h1 class="h3 text-brand mb-1"><i class="bi bi-gear me-2 text-primary"></i>Account settings</h1>
            <p class="text-muted-brand small mb-0">Update your profile photo, display name, and password.</p>
          </div>
          <a href="customer-dashboard.html" class="btn btn-outline-secondary btn-sm"><i class="bi bi-arrow-left me-1"></i>Back to dashboard</a>
        </div>

        <div class="row g-4">
          <div class="col-lg-4">
            <h2 class="h6 text-brand mb-3">Profile picture</h2>
            <div id="settingsPhotoAlert" class="alert d-none small mb-3" role="alert"></div>
            <div class="settings-photo-frame mb-3">
              <img id="settingsPhotoPreview" class="settings-photo-preview rounded-circle object-fit-cover d-none" width="120" height="120" alt="" onerror="this.classList.add('d-none'); document.getElementById('settingsPhotoPlaceholder')?.classList.remove('d-none');">
              <div id="settingsPhotoPlaceholder" class="settings-photo-placeholder rounded-circle d-flex align-items-center justify-content-center text-white fw-semibold">
                <i class="bi bi-person fs-1 opacity-75" aria-hidden="true"></i>
              </div>
            </div>
            <input type="file" id="settingsPhotoFile" class="d-none" accept="*/*">
            <div class="d-flex flex-wrap gap-2">
              <button type="button" class="btn btn-brand btn-sm" id="settingsPhotoPickBtn"><i class="bi bi-upload me-1"></i>Upload photo</button>
              <button type="button" class="btn btn-outline-secondary btn-sm d-none" id="removeCustomerPhotoBtn">Remove</button>
            </div>
            <p class="small text-muted-brand mt-2 mb-0">All file types are supported &mdash; JPG, PNG, GIF, WebP, HEIC, SVG, PDF and more, up to 5MB. Non-image files are saved to your profile but shown as a placeholder.</p>
          </div>

          <div class="col-lg-8">
            <div class="mb-4 pb-4 border-bottom border-light-subtle">
              <h2 class="h6 text-brand mb-3">Profile details</h2>
              <div id="settingsNameAlert" class="alert d-none small mb-3" role="alert"></div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label small text-brand mb-1" for="settingsFirstName">First name</label>
                  <input type="text" class="form-control" id="settingsFirstName" autocomplete="given-name">
                </div>
                <div class="col-md-6">
                  <label class="form-label small text-brand mb-1" for="settingsLastName">Last name</label>
                  <input type="text" class="form-control" id="settingsLastName" autocomplete="family-name">
                </div>
                <div class="col-md-6">
                  <label class="form-label small text-brand mb-1" for="settingsPhone">Phone number</label>
                  <input type="tel" class="form-control" id="settingsPhone" autocomplete="tel" placeholder="09XXXXXXXXX">
                </div>
              </div>
              <button type="button" class="btn btn-accent mt-3" id="saveCustomerNameBtn">Save changes</button>
            </div>

            <div>
              <h2 class="h6 text-brand mb-3">Password</h2>
              <div id="settingsPasswordAlert" class="alert d-none small mb-3" role="alert"></div>
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label small text-brand mb-1" for="settingsCurrentPassword">Current password</label>
                  <input type="password" class="form-control" id="settingsCurrentPassword" autocomplete="current-password">
                </div>
                <div class="col-md-6">
                  <label class="form-label small text-brand mb-1" for="settingsNewPassword">New password</label>
                  <input type="password" class="form-control" id="settingsNewPassword" autocomplete="new-password" minlength="6">
                </div>
                <div class="col-md-6">
                  <label class="form-label small text-brand mb-1" for="settingsConfirmPassword">Confirm new password</label>
                  <input type="password" class="form-control" id="settingsConfirmPassword" autocomplete="new-password" minlength="6">
                </div>
              </div>
              <button type="button" class="btn btn-outline-primary mt-3" id="saveCustomerPasswordBtn">Update password</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div id="site-footer"></div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../js/main.js?v=20260925a"></script>
  <script>
    renderNavbar("");
    renderFooter();
  </script>
</body>
</html>

@endverbatim
