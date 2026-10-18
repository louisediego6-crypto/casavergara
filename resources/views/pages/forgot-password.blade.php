@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Casa Vergara - Reset Password</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../css/style.css?v=20261004f" rel="stylesheet">
  <link href="../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../css/laravel-ui.css?v=20261018b" rel="stylesheet">
</head>
<body class="login-bg">
  <main class="form-shell">
    <div class="auth-card card shadow-lg p-4 p-md-5 border-0 rounded-5" style="max-width:560px;background:rgba(255,255,255,.96);">

      <div class="text-center mb-4">
        <img src="../images/logo.png" alt="Casa Vergara" class="brand-logo mb-2">
        <h2 class="text-brand mb-1">Reset Your Password</h2>
        <p class="text-muted-brand mb-0" id="fpSubtitle">Enter your email to receive a verification code</p>
      </div>

      <div class="d-flex justify-content-center align-items-center gap-3 mb-4 payment-stepper" id="fpStepper">
        <div class="text-center">
          <span class="badge rounded-pill bg-warning p-2 text-dark" id="fpStepBadge1">1</span>
          <div class="small text-muted-brand mt-1">Email</div>
        </div>
        <div class="bg-secondary" style="height:3px;width:60px;" id="fpStepBar1"></div>
        <div class="text-center">
          <span class="badge rounded-pill bg-secondary p-2" id="fpStepBadge2">2</span>
          <div class="small text-muted-brand mt-1">Code</div>
        </div>
        <div class="bg-secondary" style="height:3px;width:60px;" id="fpStepBar2"></div>
        <div class="text-center">
          <span class="badge rounded-pill bg-secondary p-2" id="fpStepBadge3">3</span>
          <div class="small text-muted-brand mt-1">New Password</div>
        </div>
      </div>

      <div id="fpAlert" class="alert alert-success d-none small" role="alert"></div>

      <form id="fpEmailForm" class="cvr-auth-fade" novalidate>
        <div class="mb-3">
          <label class="form-label text-brand" for="fpEmail">Email Address</label>
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-envelope"></i></span>
            <input class="form-control" id="fpEmail" name="email" type="email" autocomplete="email" placeholder="you@example.com" required>
          </div>
          <div class="form-text">We'll email a 6-digit code to verify it's you.</div>
        </div>

        <button type="submit" class="btn btn-brand w-100 py-2" id="fpSendCodeBtn">
          Send Code
          <i class="bi bi-arrow-right ms-1"></i>
        </button>
      </form>

      <form id="fpCodeForm" class="d-none cvr-auth-fade" novalidate>
        <p class="small text-muted-brand mb-3">
          Enter the 6-digit code we sent to <strong id="fpCodeEmailLabel"></strong>.
        </p>

        <div class="mb-3">
          <label class="form-label text-brand d-block mb-2" for="fpCode">Verification Code</label>
          <div class="cvr-otp-boxes" id="fpCodeBoxes">
            <input type="text" inputmode="numeric" maxlength="1" class="form-control text-center cvr-otp-box" data-idx="0" autocomplete="one-time-code" aria-label="Digit 1" autofocus>
            <input type="text" inputmode="numeric" maxlength="1" class="form-control text-center cvr-otp-box" data-idx="1" aria-label="Digit 2">
            <input type="text" inputmode="numeric" maxlength="1" class="form-control text-center cvr-otp-box" data-idx="2" aria-label="Digit 3">
            <input type="text" inputmode="numeric" maxlength="1" class="form-control text-center cvr-otp-box" data-idx="3" aria-label="Digit 4">
            <input type="text" inputmode="numeric" maxlength="1" class="form-control text-center cvr-otp-box" data-idx="4" aria-label="Digit 5">
            <input type="text" inputmode="numeric" maxlength="1" class="form-control text-center cvr-otp-box" data-idx="5" aria-label="Digit 6">
          </div>
          <input type="hidden" id="fpCode" name="code" value="">
          <div class="form-text mt-2">Enter the 6-digit code from your email.</div>
        </div>

        <button type="submit" class="btn btn-brand w-100 py-2" id="fpVerifyCodeBtn">
          Verify Code
          <i class="bi bi-arrow-right ms-1"></i>
        </button>

        <div class="d-flex justify-content-between mt-3 small">
          <button type="button" class="btn btn-link p-0 text-decoration-none" id="fpBackToEmail">
            <i class="bi bi-chevron-left"></i> Change email
          </button>
          <button type="button" class="btn btn-link p-0 text-decoration-none" id="fpResendCode">
            Resend code
          </button>
        </div>
      </form>

      <form id="fpResetForm" class="d-none cvr-auth-fade" novalidate>
        <div class="mb-3">
          <label class="form-label text-brand" for="fpNewPassword">New Password</label>
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-lock"></i></span>
            <input class="form-control" id="fpNewPassword" name="newPassword" type="password" autocomplete="new-password" placeholder="At least 6 characters" required>
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label text-brand" for="fpConfirmPassword">Confirm New Password</label>
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-lock-fill"></i></span>
            <input class="form-control" id="fpConfirmPassword" name="confirmPassword" type="password" autocomplete="new-password" placeholder="Re-enter your new password" required>
          </div>
        </div>

        <button type="submit" class="btn btn-brand w-100 py-2" id="fpResetBtn">
          Reset Password
          <i class="bi bi-check2 ms-1"></i>
        </button>
      </form>

      <div id="fpSuccessPanel" class="d-none text-center cvr-auth-fade">
        <i class="bi bi-check-circle text-success" style="font-size:3rem;"></i>
        <p class="mt-3 mb-4 text-muted-brand">Your password has been reset. You can now sign in with your new password.</p>
        <a href="login.html" class="btn btn-brand w-100 py-2">
          Back to Sign In
          <i class="bi bi-arrow-right ms-1"></i>
        </a>
      </div>

      <p class="text-center mt-4 mb-0 small" id="fpBackToLoginRow">
        Remembered your password?
        <a href="login.html" class="text-decoration-none">Sign In</a>
      </p>

      <p class="text-center mt-3 mb-0 small text-muted-brand">
        &copy; 2026 Casa Vergara Resort. All rights reserved.
      </p>

    </div>
  </main>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

  <script src="../js/main.js?v=20260925a"></script>

  <script src="../js/forgot-password.js?v=20260830i"></script>
</body>
</html>

@endverbatim
