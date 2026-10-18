@verbatim
<!doctype html>

<html lang="en">

<head>

  <meta charset="UTF-8" />

  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>Casa Vergara - Sign In</title>

  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">

  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">

  <link href="../css/style.css?v=20261004f" rel="stylesheet">
  <link href="../css/polish.css?v=20261018b" rel="stylesheet">
  <link href="../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../css/laravel-ui.css?v=20261018b" rel="stylesheet">

</head>

<body class="login-bg">

  <main class="form-shell">

    <div
      class="auth-card card shadow-lg p-4 p-md-5 border-0 rounded-5 position-relative"
      style="max-width:560px;background:rgba(255,255,255,.96);"
    >

      <a
        href="landing.html"
        class="cvr-auth-home-btn cvr-fade-toggle"
        id="loginBackToLandingBtn"
        aria-label="Back to home page"
        title="Back to home"
      >
        <i class="bi bi-arrow-left"></i>
      </a>

      <button
        type="button"
        class="btn btn-link p-0 text-brand position-absolute cvr-fade-toggle cvr-fade-hidden"
        style="top:1.5rem; left:1.5rem;"
        id="loginBackToSavedBtn"
        aria-label="Back to saved accounts"
      >
        <i class="bi bi-chevron-left fs-3"></i>
      </button>

      <div class="text-center mb-4">

        <img
          src="../images/logo.png"
          alt="Casa Vergara"
          class="brand-logo mb-2"
        >

        <h2 class="text-brand mb-1">
          Welcome Back
        </h2>

        <p class="text-muted-brand mb-0">
          Sign in to your account
        </p>

      </div>

      <div
        id="customerLoginAlert"
        class="alert alert-success d-none small"
        role="alert"
      ></div>

      <div id="loginPickerPanel" class="d-none cvr-auth-fade">

        <div class="cvr-switch-account-list mb-3" id="loginAccountList"></div>

        <button
          type="button"
          class="btn btn-brand w-100 py-2 fw-semibold"
          id="loginUseAnotherBtn"
        >
          Log into Casa Vergara
        </button>

      </div>

      <div id="loginPasswordPanel" class="d-none cvr-auth-fade">

        <div class="d-flex align-items-center gap-3 mb-3" id="loginPasswordIdentity"></div>

        <div id="loginPasswordAlert" class="alert alert-danger d-none small" role="alert"></div>

        <form id="loginPasswordForm" novalidate>

          <label class="form-label text-brand" for="loginPickedPassword">Password</label>

          <div class="input-group mb-3">
            <span class="input-group-text"><i class="bi bi-lock"></i></span>
            <input
              class="form-control"
              id="loginPickedPassword"
              type="password"
              autocomplete="current-password"
              placeholder="Enter your password"
              required
            >
          </div>

          <label class="d-flex align-items-center gap-2 mb-3 small">
            <input type="checkbox" id="loginPickedRemember" checked>
            Keep me signed in on this browser
          </label>

          <button type="submit" class="btn btn-brand w-100 py-2" id="loginPickedSubmitBtn">
            Sign In
            <i class="bi bi-arrow-right ms-1"></i>
          </button>

          <div class="d-flex justify-content-between mt-3 small">
            <button type="button" class="btn btn-link p-0 text-decoration-none" id="loginPickedBackBtn">
              <i class="bi bi-chevron-left"></i> Not you?
            </button>
            <button type="button" class="btn btn-link p-0 text-decoration-none text-primary" id="loginPickedForgotBtn">
              Forgot password?
            </button>
          </div>

        </form>

      </div>

      <div id="loginFormPanel" class="cvr-auth-fade">

      <form id="customerLoginForm" novalidate>

        <div class="mb-3">

          <label
            class="form-label text-brand"
            for="loginEmail"
          >
            Email Address
          </label>

          <div class="input-group">

            <span class="input-group-text">
              <i class="bi bi-envelope"></i>
            </span>

            <input
              class="form-control"
              id="loginEmail"
              name="email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              required
            >

          </div>

        </div>

        <div class="mb-3">

          <label
            class="form-label text-brand"
            for="loginPassword"
          >
            Password
          </label>

          <div class="input-group">

            <span class="input-group-text">
              <i class="bi bi-lock"></i>
            </span>

            <input
              class="form-control"
              id="loginPassword"
              name="password"
              type="password"
              autocomplete="current-password"
              placeholder="Enter your password"
              required
            >

          </div>

        </div>

        <div class="d-flex justify-content-between mb-3 small">

          <label class="d-flex align-items-center gap-2 mb-0">

            <input
              type="checkbox"
              id="loginRemember"
            >

            Remember me

          </label>

          <button
            type="button"
            class="btn btn-link p-0 text-decoration-none text-primary"
            id="loginForgotBtn"
          >
            Forgot password?
          </button>

        </div>

        <button
          type="submit"
          class="btn btn-brand w-100 py-2"
        >
          Sign In
          <i class="bi bi-arrow-right ms-1"></i>
        </button>

      </form>

      </div>

      <p class="text-center mt-4 mb-0 small">

        Don't have an account?

        <a
          href="register.html"
          class="text-decoration-none"
        >
          Create Account
        </a>

      </p>

      <p class="text-center mt-3 mb-0 small text-muted-brand">

        <a
          href="#"
          data-bs-toggle="modal"
          data-bs-target="#cvrTermsModal"
          class="text-decoration-none text-muted-brand"
        >
          Terms &amp; Conditions
        </a>

        &middot;

        <a
          href="#"
          data-bs-toggle="modal"
          data-bs-target="#cvrPrivacyModal"
          class="text-decoration-none text-muted-brand"
        >
          Privacy Policy
        </a>

      </p>

      <p class="text-center mt-3 mb-0 small text-muted-brand">

        &copy; 2026 Casa Vergara Resort. All rights reserved.

      </p>

    </div>

  </main>

  <div
    class="modal fade"
    id="cvrTermsModal"
    tabindex="-1"
    data-cvr-legal-modal="room"
    aria-labelledby="cvrTermsModalLabel"
    aria-hidden="true"
  >

    <div class="modal-dialog modal-lg modal-dialog-scrollable">

      <div class="modal-content">

        <div class="modal-header">

          <h5
            class="modal-title"
            id="cvrTermsModalLabel"
          >
            Terms &amp; Conditions
          </h5>

          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>

        </div>

        <div class="modal-body">

          <div
            id="cvrLoginTermsModalBody"
            data-cvr-legal-body
          ></div>

        </div>

      </div>

    </div>

  </div>

  <div
    class="modal fade"
    id="cvrPrivacyModal"
    tabindex="-1"
    data-cvr-legal-modal="privacy"
    aria-labelledby="cvrPrivacyModalLabel"
    aria-hidden="true"
  >

    <div class="modal-dialog modal-lg modal-dialog-scrollable">

      <div class="modal-content">

        <div class="modal-header">

          <h5
            class="modal-title"
            id="cvrPrivacyModalLabel"
          >
            Privacy Policy
          </h5>

          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>

        </div>

        <div class="modal-body">

          <div
            id="cvrLoginPrivacyModalBody"
            data-cvr-legal-body
          ></div>

        </div>

      </div>

    </div>

  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

  <script src="../js/main.js?v=20260925a"></script>

  <script src="../js/legal-doc.js?v=20260830i"></script>

  <script>
    cvrInitLegalModals();
  </script>

  <script>

    (function () {

      var alertEl =
        document.getElementById("customerLoginAlert");

      if (!alertEl) return;

      var params =
        new URLSearchParams(window.location.search);

      if (params.get("registered") === "1") {

        alertEl.textContent =
          "Account created successfully. Sign in with your new credentials.";

        alertEl.classList.remove(
          "d-none",
          "alert-danger"
        );

        alertEl.classList.add(
          "alert-success"
        );

      }

      if (params.get("pendingVerification") === "1") {

        alertEl.textContent =
          "Account created! Please check your email for the 6-digit code and verify your account before signing in.";

        alertEl.classList.remove(
          "d-none",
          "alert-danger"
        );

        alertEl.classList.add(
          "alert-success"
        );

      }

      if (params.get("suspended") === "1") {

        var msg =
          "This account has been suspended. Please contact Casa Vergara.";

        alertEl.textContent = msg;

        alertEl.classList.remove(
          "d-none",
          "alert-success"
        );

        alertEl.classList.add(
          "alert-danger"
        );

        if (typeof cvrToast === "function") {

          cvrToast(
            msg,
            "danger"
          );

        }

      }

    })();

  </script>

</body>

</html>

@endverbatim
