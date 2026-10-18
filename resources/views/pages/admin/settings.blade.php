@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <title>Admin Settings - Casa Vergara</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../../css/style.css?v=20260926c" rel="stylesheet">
  <link href="../../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../../css/laravel-ui.css?v=20261018b" rel="stylesheet">
  <link href="../../css/admin-modern.css?v=20261018a" rel="stylesheet">
</head>
<body>
  <div class="admin-wrap admin-page admin-settings-page">
    <div id="admin-sidebar"></div>
    <main class="admin-main">
      <div class="admin-page-head settings-hero mb-4">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <span class="settings-eyebrow"><i class="bi bi-sliders me-1"></i>Administration</span>
            <h1 class="h2 text-brand mb-1 mt-2">Settings</h1>
            <p class="text-muted-brand mb-0">Manage your resort profile, payments, and account security.</p>
          </div>
          <button type="button" class="btn btn-outline-primary settings-switch-btn" id="settingsSwitchAccountBtn">
            <i class="bi bi-arrow-left-right me-2"></i>Switch account
          </button>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-8">

          <section class="soft-card admin-settings-card settings-section mb-4">
            <header class="settings-section-head">
              <span class="settings-section-icon"><i class="bi bi-buildings"></i></span>
              <div class="flex-grow-1">
                <h5 class="text-brand mb-1">Resort Information</h5>
                <p class="small text-muted-brand mb-0">Shown across the website, quotations, and guest emails.</p>
              </div>
              <span id="resortInfoSavedStamp" class="settings-stamp small text-muted-brand d-none"></span>
            </header>
            <div class="settings-section-body">
              <div id="resortInfoAlert" class="alert d-none small mb-3" role="alert"></div>
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label" for="resortNameInput">Resort Name</label>
                  <input class="form-control" id="resortNameInput" placeholder="Casa Vergara Resort">
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="resortEmailInput">Email</label>
                  <input type="email" class="form-control" id="resortEmailInput" placeholder="info@casavergara.com">
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="resortPhoneInput">Phone</label>
                  <input class="form-control" id="resortPhoneInput" placeholder="+63 917 123 4567">
                </div>
                <div class="col-12">
                  <label class="form-label" for="resortAddressInput">Address</label>
                  <textarea class="form-control" id="resortAddressInput" rows="2" placeholder="123 Paradise Boulevard, Tropical Island"></textarea>
                </div>
              </div>
            </div>
            <footer class="settings-section-foot">
              <small class="text-muted-brand">Changes go live on the public site immediately.</small>
              <button type="button" class="btn btn-brand" id="resortInfoSaveBtn">
                <span class="admin-btn-label">Save changes</span>
                <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
              </button>
            </footer>
          </section>

          <section class="soft-card admin-settings-card settings-section mb-4" id="paymentQrCard">
            <header class="settings-section-head">
              <span class="settings-section-icon"><i class="bi bi-qr-code"></i></span>
              <div class="flex-grow-1">
                <h5 class="text-brand mb-1">Payment QR Code</h5>
                <p class="small text-muted-brand mb-0">Upload your GCash / e-wallet QR. Guests see it on the Payment page.</p>
              </div>
              <span id="paymentQrStatus" class="settings-stamp small text-muted-brand"></span>
            </header>
            <div class="settings-section-body">
              <div id="paymentQrAlert" class="alert d-none small mb-3" role="alert"></div>
              <div class="row g-4 align-items-start">
                <div class="col-md-5 text-center">
                  <div class="payment-qr-wrap settings-qr-frame p-3">
                    <img id="paymentQrPreview" class="img-fluid payment-qr-image rounded-3 d-none" alt="Current payment QR code">
                    <div id="paymentQrEmpty" class="text-muted-brand small py-5">
                      <i class="bi bi-qr-code d-block fs-1 mb-2"></i>
                      No QR uploaded yet
                    </div>
                  </div>
                </div>
                <div class="col-md-7">
                  <label class="form-label" for="paymentQrLabelInput">Caption shown under the QR</label>
                  <input class="form-control mb-3" id="paymentQrLabelInput" maxlength="150" placeholder="GCash - Casa Vergara Resort - 0917 123 4567">
                  <input type="file" id="paymentQrFile" class="d-none" accept="image/png,image/jpeg,image/webp">
                  <div class="d-flex flex-wrap gap-2">
                    <button type="button" class="btn btn-brand" id="paymentQrPickBtn">
                      <span class="admin-btn-label">Upload QR image</span>
                      <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
                    </button>
                    <button type="button" class="btn btn-outline-secondary" id="paymentQrSaveLabelBtn">
                      <span class="admin-btn-label">Save caption</span>
                      <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
                    </button>
                    <button type="button" class="btn btn-outline-danger d-none" id="paymentQrRemoveBtn">
                      <span class="admin-btn-label">Remove QR</span>
                      <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
                    </button>
                  </div>
                  <small class="text-muted-brand d-block mt-2">JPG, PNG or WEBP - max 3 MB. Uploading replaces the current QR.</small>
                </div>
              </div>
            </div>
          </section>

          <section class="soft-card admin-settings-card settings-section mb-4" id="checkinReminderCard">
            <header class="settings-section-head">
              <span class="settings-section-icon"><i class="bi bi-bell"></i></span>
              <div class="flex-grow-1">
                <h5 class="text-brand mb-1">Check-in Reminders</h5>
                <p class="small text-muted-brand mb-0">Guests get a website notification and email automatically before their check-in date (see php artisan reminders:checkin for the recurring schedule). Use this to send any that are due right now.</p>
              </div>
            </header>
            <div class="settings-section-body">
              <div id="checkinReminderAlert" class="alert d-none small mb-3" role="alert"></div>
              <button type="button" class="btn btn-brand" id="checkinReminderSendBtn">
                <span class="admin-btn-label"><i class="bi bi-send me-1"></i>Send check-in reminders now</span>
                <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
              </button>
            </div>
          </section>

          <section class="soft-card admin-settings-card settings-section mb-4" id="checkoutReminderCard">
            <header class="settings-section-head">
              <span class="settings-section-icon"><i class="bi bi-door-open"></i></span>
              <div class="flex-grow-1">
                <h5 class="text-brand mb-1">Check-out Reminders</h5>
                <p class="small text-muted-brand mb-0">As a guest's fixed check-out time approaches, they get a live in-app toast plus a website notification and email, and admin/staff get a notification too (see php artisan reminders:checkout for the recurring schedule). Use this to send any that are due right now.</p>
              </div>
            </header>
            <div class="settings-section-body">
              <div id="checkoutReminderAlert" class="alert d-none small mb-3" role="alert"></div>
              <button type="button" class="btn btn-brand" id="checkoutReminderSendBtn">
                <span class="admin-btn-label"><i class="bi bi-send me-1"></i>Send check-out reminders now</span>
                <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
              </button>
            </div>
          </section>

          <section class="soft-card admin-settings-card settings-section">
            <header class="settings-section-head">
              <span class="settings-section-icon"><i class="bi bi-shield-lock"></i></span>
              <div class="flex-grow-1">
                <h5 class="text-brand mb-1">Security</h5>
                <p class="small text-muted-brand mb-0">Update the password used to sign in to this admin account.</p>
              </div>
            </header>
            <div class="settings-section-body">
              <div id="adminPasswordAlert" class="alert d-none small mb-3" role="alert"></div>
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label" for="adminCurrentPassword">Current Password</label>
                  <input type="password" class="form-control" id="adminCurrentPassword" autocomplete="current-password">
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="adminNewPassword">New Password</label>
                  <input type="password" class="form-control" id="adminNewPassword" autocomplete="new-password" minlength="8">
                  <small class="text-muted-brand">At least 8 characters.</small>
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="adminConfirmPassword">Confirm New Password</label>
                  <input type="password" class="form-control" id="adminConfirmPassword" autocomplete="new-password" minlength="8">
                </div>
              </div>
            </div>
            <footer class="settings-section-foot">
              <small class="text-muted-brand">You'll stay signed in after updating.</small>
              <button type="button" class="btn btn-brand" id="adminUpdatePasswordBtn">
                <span class="admin-btn-label">Update Password</span>
                <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
              </button>
            </footer>
          </section>
        </div>

        <div class="col-lg-4">
          <div class="settings-side-stack">
            <div class="soft-card p-4 text-center admin-profile-card settings-profile-card">
              <div id="adminPhotoAlert" class="alert d-none small mb-3 text-start" role="alert"></div>
              <div class="settings-photo-frame mx-auto mb-3">
                <img id="adminPhotoPreview" class="settings-photo-preview rounded-circle object-fit-cover d-none" width="84" height="84" alt="">
                <div id="adminPhotoPlaceholder" class="rounded-circle bg-brand text-white d-inline-flex align-items-center justify-content-center" style="width:84px;height:84px;font-size:1.6rem;">A</div>
              </div>
              <h6 class="text-brand mb-1" id="adminProfileName">Admin User</h6>
              <small class="text-muted-brand d-block mb-3" id="adminProfileEmail">admin@casavergara.com</small>
              <input type="file" id="adminPhotoFile" class="d-none" accept="image/jpeg,image/png,image/webp">
              <div class="d-flex flex-wrap gap-2 justify-content-center">
                <button type="button" class="btn btn-outline-primary btn-sm" id="adminPhotoPickBtn">
                  <i class="bi bi-camera me-1"></i><span class="admin-btn-label">Change photo</span>
                  <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
                </button>
              </div>
              <p class="small text-muted-brand mb-0 mt-2">JPG, PNG, or WEBP, up to 2 MB.</p>
            </div>

            <div class="soft-card p-4 settings-links-card">
              <h6 class="text-brand mb-3"><i class="bi bi-lightning-charge me-2"></i>Quick links</h6>
              <a class="settings-quick-link" href="calendar.html"><span><i class="bi bi-calendar3 me-2"></i>Availability calendar</span><i class="bi bi-chevron-right"></i></a>
              <a class="settings-quick-link" href="site-content.html?tab=packages"><span><i class="bi bi-box-seam me-2"></i>Packages &amp; pricing</span><i class="bi bi-chevron-right"></i></a>
              <a class="settings-quick-link" href="payments.html"><span><i class="bi bi-credit-card me-2"></i>Payment verification</span><i class="bi bi-chevron-right"></i></a>
              <a class="settings-quick-link" href="site-content.html?tab=team"><span><i class="bi bi-people me-2"></i>Team members</span><i class="bi bi-chevron-right"></i></a>
              <button type="button" class="settings-quick-link w-100 border-0 bg-transparent text-start" id="settingsSwitchAccountBtnSide">
                <span><i class="bi bi-arrow-left-right me-2"></i>Switch account</span><i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../../js/main.js?v=20260926b"></script>
  <script src="../../js/admin-settings.js?v=20260830i"></script>
  <script>
    renderAdminSidebar("settings");
    initAdminSettingsPage();
    ["settingsSwitchAccountBtn", "settingsSwitchAccountBtnSide"].forEach(function (id) {
      document.getElementById(id)?.addEventListener("click", function () {
        if (typeof openCvrSwitchAccountModal === "function") openCvrSwitchAccountModal();
      });
    });
  </script>
</body>
</html>

@endverbatim
