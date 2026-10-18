@verbatim
<!doctype html>

<html lang="en">

<head>

  <meta charset="UTF-8" />

  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>Casa Vergara - Register</title>

  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">

  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">

  <link href="../css/style.css?v=20261004f" rel="stylesheet">
  <link href="../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../css/laravel-ui.css?v=20261018b" rel="stylesheet">

</head>

<body class="login-bg">

  <main class="form-shell">

    <div
      class="auth-card card shadow-lg p-4 p-md-5 border-0 rounded-5"
      style="max-width:560px;background:rgba(255,255,255,.96);"
    >

      <div class="text-center mb-4">

        <img
          src="../images/logo.png"
          alt="Casa Vergara"
          class="brand-logo mb-2"
        >

        <h2 class="text-brand mb-1">
          Create Account
        </h2>

        <p class="text-muted-brand mb-0">
          Create your guest access
        </p>

      </div>

      <div
        id="customerRegisterAlert"
        class="alert d-none small"
        role="alert"
      ></div>

      <form id="customerRegisterForm" class="cvr-auth-fade" novalidate>

        <div class="row g-2">

          <div class="col-md-6">

            <label
              class="form-label text-brand"
              for="regFirstName"
            >
              First Name
            </label>

            <input
              class="form-control"
              id="regFirstName"
              name="firstName"
              autocomplete="given-name"
              placeholder="First Name"
              required
            >

          </div>

          <div class="col-md-6">

            <label
              class="form-label text-brand"
              for="regLastName"
            >
              Last Name
            </label>

            <input
              class="form-control"
              id="regLastName"
              name="lastName"
              autocomplete="family-name"
              placeholder="Last Name"
              required
            >

            <div id="regNameFeedback" class="small mt-1"></div>

          </div>

          <div class="col-12">

            <label
              class="form-label text-brand"
              for="regEmail"
            >
              Email Address
            </label>

            <div class="input-group">

              <span class="input-group-text">
                <i class="bi bi-envelope"></i>
              </span>

              <input
                type="email"
                class="form-control"
                id="regEmail"
                name="email"
                autocomplete="email"
                placeholder="you@example.com"
                required
              >

            </div>

          </div>

          <div class="col-12">

            <label
              class="form-label text-brand"
              for="regPhone"
            >
              Contact Number
            </label>

            <div class="input-group">

              <span class="input-group-text">
                <i class="bi bi-telephone"></i>
              </span>

              <input
                class="form-control"
                id="regPhone"
                name="phone"
                autocomplete="tel"
                placeholder="+63 9234 5678"
                required
              >

            </div>

            <div id="regPhoneFeedback" class="small mt-1"></div>

          </div>

          <div class="col-12">

            <label
              class="form-label text-brand"
              for="regPassword"
            >
              Password
            </label>

            <div class="input-group">

              <span class="input-group-text">
                <i class="bi bi-lock"></i>
              </span>

              <input
                type="password"
                class="form-control"
                id="regPassword"
                name="password"
                autocomplete="new-password"
                placeholder="At least 6 characters"
                minlength="6"
                required
              >

            </div>

          </div>

          <div class="col-12">

            <label
              class="form-label text-brand"
              for="regPasswordConfirm"
            >
              Confirm Password
            </label>

            <div class="input-group">

              <span class="input-group-text">
                <i class="bi bi-shield-check"></i>
              </span>

              <input
                type="password"
                class="form-control"
                id="regPasswordConfirm"
                name="passwordConfirm"
                autocomplete="new-password"
                placeholder="Confirm your password"
                required
              >

            </div>

          </div>

          <div class="col-12">

            <label class="small d-flex align-items-center gap-2 mt-2 mb-0">

              <input
                type="checkbox"
                id="regTerms"
                class="m-0"
                required
              >

              <span>
                I agree to the Terms &amp; Conditions and Privacy Policy
              </span>

            </label>

          </div>

        </div>

        <button
          type="submit"
          class="btn btn-brand w-100 mt-3 py-2"
        >
          Create Account
          <i class="bi bi-arrow-right ms-1"></i>
        </button>

      </form>

      <div id="regVerifyPanel" class="d-none cvr-auth-fade">

        <div class="text-center mb-4">
          <i class="bi bi-envelope-check text-brand" style="font-size:2.5rem;"></i>
          <h5 class="text-brand mt-2 mb-1">Verify Your Account</h5>
          <p class="small text-muted-brand mb-0">
            We sent a 6-digit code to <strong id="regVerifyEmailLabel"></strong>.
            Enter it below to activate your account.
          </p>
        </div>

        <div id="regVerifyAlert" class="alert d-none small" role="alert"></div>

        <form id="regVerifyForm" novalidate>

          <div class="mb-3">
            <label class="form-label text-brand d-block mb-2">Verification Code</label>

            <div class="cvr-otp-boxes" id="regCodeBoxes">
              <input type="text" inputmode="numeric" maxlength="1" class="form-control text-center cvr-otp-box" data-idx="0" autocomplete="one-time-code" aria-label="Digit 1">
              <input type="text" inputmode="numeric" maxlength="1" class="form-control text-center cvr-otp-box" data-idx="1" aria-label="Digit 2">
              <input type="text" inputmode="numeric" maxlength="1" class="form-control text-center cvr-otp-box" data-idx="2" aria-label="Digit 3">
              <input type="text" inputmode="numeric" maxlength="1" class="form-control text-center cvr-otp-box" data-idx="3" aria-label="Digit 4">
              <input type="text" inputmode="numeric" maxlength="1" class="form-control text-center cvr-otp-box" data-idx="4" aria-label="Digit 5">
              <input type="text" inputmode="numeric" maxlength="1" class="form-control text-center cvr-otp-box" data-idx="5" aria-label="Digit 6">
            </div>

            <input type="hidden" id="regCode" name="code" value="">

            <div class="form-text mt-2">
              Check your Gmail inbox (and the Spam folder) for the code.
            </div>
          </div>

          <button type="submit" class="btn btn-brand w-100 py-2" id="regVerifyBtn">
            Verify Account
            <i class="bi bi-check2 ms-1"></i>
          </button>

          <div class="d-flex justify-content-between mt-3 small">
            <button type="button" class="btn btn-link p-0 text-decoration-none" id="regBackToForm">
              <i class="bi bi-chevron-left"></i> Use a different email
            </button>
            <button type="button" class="btn btn-link p-0 text-decoration-none" id="regResendCode">
              Resend code
            </button>
          </div>

        </form>

      </div>

      <p class="text-center mt-3 mb-0 small" id="regSignInRow">

        Already have an account?

        <a
          href="login.html"
          class="text-decoration-none"
        >
          Sign In
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
            id="cvrRegTermsModalBody"
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
            id="cvrRegPrivacyModalBody"
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

</body>

</html>

@endverbatim
