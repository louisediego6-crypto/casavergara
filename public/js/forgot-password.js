

(function () {
  const emailForm   = document.getElementById("fpEmailForm");
  const codeForm    = document.getElementById("fpCodeForm");
  const resetForm   = document.getElementById("fpResetForm");
  const successPanel = document.getElementById("fpSuccessPanel");
  const backToLoginRow = document.getElementById("fpBackToLoginRow");
  const subtitle    = document.getElementById("fpSubtitle");
  const alertEl     = document.getElementById("fpAlert");

  const stepBadge1 = document.getElementById("fpStepBadge1");
  const stepBadge2 = document.getElementById("fpStepBadge2");
  const stepBadge3 = document.getElementById("fpStepBadge3");
  const stepBar1   = document.getElementById("fpStepBar1");
  const stepBar2   = document.getElementById("fpStepBar2");

  if (!emailForm) return;

  const showFpPanel = createCvrPanelSwitcher(
    { email: emailForm, code: codeForm, reset: resetForm, success: successPanel },
    (which) => backToLoginRow.classList.toggle("d-none", which === "success")
  );
  let fpStarted = false;

  let state = {
    email: "",
    code: "",
    blocked: false,
  };

  function applyOtpBlock(message) {
    state.blocked = true;
    showAlert(message, "danger");
    ["fpSendCodeBtn", "fpVerifyCodeBtn", "fpResendCode", "fpCode", "fpEmail"].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.disabled = true;
    });
    codeBoxes().forEach(function (b) {
      b.disabled = true;
    });
  }

  function clearOtpBlock() {
    state.blocked = false;
    ["fpSendCodeBtn", "fpVerifyCodeBtn", "fpResendCode", "fpCode", "fpEmail"].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.disabled = false;
    });
    codeBoxes().forEach(function (b) {
      b.disabled = false;
    });
  }

  function showAlert(message, type) {
    if (!message) {
      alertEl.classList.add("d-none");
      return;
    }
    alertEl.textContent = message;
    alertEl.classList.remove("d-none", "alert-success", "alert-danger");
    alertEl.classList.add(type === "danger" ? "alert-danger" : "alert-success");
  }

  function setBadgeState(badge, bar, state) {

    badge.classList.remove("bg-secondary", "bg-warning", "bg-success", "text-dark");
    if (state === "done") {
      badge.classList.add("bg-success");
      badge.innerHTML = '<i class="bi bi-check-lg"></i>';
      if (bar) bar.classList.remove("bg-secondary"), bar.classList.add("bg-success");
    } else if (state === "active") {
      badge.classList.add("bg-warning", "text-dark");
    } else {
      badge.classList.add("bg-secondary");
    }
  }

  function goToStep(step) {
    if (!state.blocked) clearOtpBlock();
    showAlert(null);

    const stepKey = { 1: "email", 2: "code", 3: "reset", 4: "success" }[step];
    showFpPanel(stepKey, { immediate: !fpStarted });
    fpStarted = true;

    if (step === 1) {
      subtitle.textContent = "Enter your email to receive a verification code";
      setBadgeState(stepBadge1, null, "active");
      stepBadge1.textContent = "1";
      setBadgeState(stepBadge2, stepBar1, "pending");
      stepBadge2.textContent = "2";
      setBadgeState(stepBadge3, stepBar2, "pending");
      stepBadge3.textContent = "3";
    } else if (step === 2) {
      subtitle.textContent = "Check your inbox for the code";
      setBadgeState(stepBadge1, null, "done");
      setBadgeState(stepBadge2, stepBar1, "active");
      stepBadge2.textContent = "2";
      setBadgeState(stepBadge3, stepBar2, "pending");
      stepBadge3.textContent = "3";
      document.getElementById("fpCodeEmailLabel").textContent = state.email;
      writeCode("");
      setTimeout(() => {
        const firstBox = document.querySelector("#fpCodeBoxes input");
        if (firstBox) firstBox.focus();
      }, 260);
    } else if (step === 3) {
      subtitle.textContent = "Choose a new password";
      setBadgeState(stepBadge1, null, "done");
      setBadgeState(stepBadge2, stepBar1, "done");
      setBadgeState(stepBadge3, stepBar2, "active");
      stepBadge3.textContent = "3";
      document.getElementById("fpNewPassword").value = "";
      document.getElementById("fpConfirmPassword").value = "";
    } else if (step === 4) {
      subtitle.textContent = "All set!";
      setBadgeState(stepBadge1, null, "done");
      setBadgeState(stepBadge2, stepBar1, "done");
      setBadgeState(stepBadge3, stepBar2, "done");
    }
  }

  function setLoading(button, loading, defaultHtml) {
    if (loading) {
      button.dataset.defaultHtml = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Please wait…';
    } else {
      button.disabled = false;
      button.innerHTML = defaultHtml || button.dataset.defaultHtml || button.innerHTML;
    }
  }

  function codeBoxes() {
    return Array.from(document.querySelectorAll("#fpCodeBoxes input"));
  }
  function readCode() {
    return codeBoxes().map((b) => b.value).join("");
  }
  function syncHiddenCode() {
    document.getElementById("fpCode").value = readCode();
  }
  function writeCode(val) {
    const digits = (val || "").replace(/\D/g, "").slice(0, 6).split("");
    codeBoxes().forEach((b, i) => {
      b.value = digits[i] || "";
    });
    syncHiddenCode();
  }
  function setupCodeBoxes() {
    const boxes = codeBoxes();
    boxes.forEach((box, idx) => {
      box.addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "").slice(0, 1);
        syncHiddenCode();
        if (this.value && idx < boxes.length - 1) {
          boxes[idx + 1].focus();
        }
      });
      box.addEventListener("keydown", function (e) {
        if (e.key === "Backspace" && !this.value && idx > 0) {
          boxes[idx - 1].focus();
        }
      });
      box.addEventListener("paste", function (e) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData("text");
        writeCode(text);
        const filled = text.replace(/\D/g, "").slice(0, 6).length;
        boxes[Math.min(filled, boxes.length - 1)].focus();
      });
    });
  }
  setupCodeBoxes();

  emailForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("fpEmail").value.trim();
    if (!email) return;

    const btn = document.getElementById("fpSendCodeBtn");
    setLoading(btn, true);

    const { body } = await cvrApiPost("auth/forgot-password", { email });

    setLoading(btn, false);

    if (body.success) {
      state.email = email;
      goToStep(2);
      cvrToast(body.message || "Code sent. Check your inbox.", "success");
    } else if (body.otpBlocked) {
      applyOtpBlock(body.message || "This account is temporarily blocked from receiving reset codes.");
    } else {
      showAlert(body.message || "Something went wrong. Please try again.", "danger");
    }
  });

  codeForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const code = document.getElementById("fpCode").value.trim();
    if (code.length !== 6) {
      showAlert("Enter the 6-digit code from your email.", "danger");
      return;
    }

    const btn = document.getElementById("fpVerifyCodeBtn");
    setLoading(btn, true);

    const { body } = await cvrApiPost("auth/verify-reset-code", {
      email: state.email,
      code,
    });

    setLoading(btn, false);

    if (body.success) {
      state.code = code;
      goToStep(3);
    } else if (body.otpBlocked) {
      applyOtpBlock(body.message || "Too many incorrect codes. Password reset is locked for 24 hours.");
    } else {
      showAlert(body.message || "That code is incorrect.", "danger");
      writeCode("");
    }
  });

  document.getElementById("fpBackToEmail").addEventListener("click", function () {
    if (state.blocked) return;
    goToStep(1);
  });

  document.getElementById("fpResendCode").addEventListener("click", async function () {
    if (!state.email) return;
    const btn = this;
    setLoading(btn, true, "Resend code");

    const { body } = await cvrApiPost("auth/forgot-password", { email: state.email });

    setLoading(btn, false, "Resend code");

    if (body.success) {
      cvrToast("A new code has been sent to your email.", "success");
    } else if (body.otpBlocked) {
      applyOtpBlock(body.message || "This account is temporarily blocked from receiving reset codes.");
    } else {
      showAlert(body.message || "Could not resend the code. Please try again.", "danger");
    }
  });

  resetForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const newPassword = document.getElementById("fpNewPassword").value;
    const confirmPassword = document.getElementById("fpConfirmPassword").value;

    if (newPassword.length < 6) {
      showAlert("New password must be at least 6 characters.", "danger");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert("New password and confirmation do not match.", "danger");
      return;
    }

    const btn = document.getElementById("fpResetBtn");
    setLoading(btn, true);

    const { body } = await cvrApiPost("auth/reset-password", {
      email: state.email,
      code: state.code,
      newPassword,
      confirmPassword,
    });

    setLoading(btn, false);

    if (body.success) {
      goToStep(4);
      cvrToast("Password reset successfully!", "success");
    } else if (body.otpBlocked) {
      goToStep(2);
      applyOtpBlock(body.message || "Too many incorrect codes. Password reset is locked for 24 hours.");
    } else {
      showAlert(body.message || "Could not reset your password. Please try again.", "danger");
    }
  });

  const prefillEmail = new URLSearchParams(window.location.search).get("email");
  if (prefillEmail) {
    document.getElementById("fpEmail").value = prefillEmail;
  }

  goToStep(1);
})();
