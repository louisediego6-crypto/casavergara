function initAdminSettingsPage() {
  const photoFile = document.getElementById("adminPhotoFile");
  const photoPickBtn = document.getElementById("adminPhotoPickBtn");
  const photoPreview = document.getElementById("adminPhotoPreview");
  const photoPlaceholder = document.getElementById("adminPhotoPlaceholder");
  const photoAlert = document.getElementById("adminPhotoAlert");
  const profileName = document.getElementById("adminProfileName");
  const profileEmail = document.getElementById("adminProfileEmail");

  const resortNameInput = document.getElementById("resortNameInput");
  const resortEmailInput = document.getElementById("resortEmailInput");
  const resortPhoneInput = document.getElementById("resortPhoneInput");
  const resortAddressInput = document.getElementById("resortAddressInput");
  const resortInfoSaveBtn = document.getElementById("resortInfoSaveBtn");
  const resortInfoAlert = document.getElementById("resortInfoAlert");
  const resortInfoSavedStamp = document.getElementById("resortInfoSavedStamp");

  const currentPw = document.getElementById("adminCurrentPassword");
  const newPw = document.getElementById("adminNewPassword");
  const confirmPw = document.getElementById("adminConfirmPassword");
  const updatePwBtn = document.getElementById("adminUpdatePasswordBtn");
  const pwAlert = document.getElementById("adminPasswordAlert");

  if (!photoFile || !updatePwBtn) return;

  const showAlert = (el, message, type = "danger") => {
    if (!el) return;
    el.textContent = message;
    el.className = `alert small mb-3 ${type === "danger" ? "text-start" : "text-start"} alert-${type}`;
  };
  const hideAlert = (el) => {
    if (!el) return;
    el.classList.add("d-none");
  };

  const setBusy = (btn, busy) => {
    if (!btn) return;
    btn.disabled = busy;
    btn.querySelector(".spinner-border")?.classList.toggle("d-none", !busy);
  };

  const setPhoto = (avatarUrl, initials) => {
    if (avatarUrl) {
      photoPreview.src = avatarUrl;
      photoPreview.classList.remove("d-none");
      photoPlaceholder?.classList.add("d-none");
    } else {
      photoPreview.classList.add("d-none");
      photoPreview.removeAttribute("src");
      photoPlaceholder?.classList.remove("d-none");
      if (photoPlaceholder) photoPlaceholder.textContent = initials || "A";
    }
  };

  const loadProfile = async () => {
    const { ok, body } = await cvrApiGet("auth/me");
    if (!ok || !body?.success) {

      window.location.href = "../login.html";
      return;
    }
    const user = body.data.user;
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Admin User";
    const initials = (user.firstName?.[0] || "A") + (user.lastName?.[0] || "");
    if (profileName) profileName.textContent = fullName;
    if (profileEmail) profileEmail.textContent = user.email || "";
    setPhoto(user.avatarUrl, initials.toUpperCase());

    if (typeof setCustomerSession === "function" && typeof getCustomerSession === "function") {
      setCustomerSession({ ...getCustomerSession(), avatarUrl: user.avatarUrl || null });
    }
  };

  const loadResortSettings = async () => {
    if (!resortNameInput) return;
    const { ok, body } = await cvrApiGet("admin/settings-get");
    if (!ok || !body?.success) {
      showAlert(resortInfoAlert, body?.message || "Could not load resort information.");
      return;
    }
    const s = body.data.settings;
    resortNameInput.value = s.resortName || "";
    resortEmailInput.value = s.email || "";
    resortPhoneInput.value = s.phone || "";
    resortAddressInput.value = s.address || "";
    if (qrPreview) renderQr(s.paymentQrUrl || null, s.paymentQrLabel || "");
  };

  resortInfoSaveBtn?.addEventListener("click", async () => {
    hideAlert(resortInfoAlert);
    resortInfoSavedStamp?.classList.add("d-none");

    const resortName = resortNameInput.value.trim();
    const email = resortEmailInput.value.trim();
    const phone = resortPhoneInput.value.trim();
    const address = resortAddressInput.value.trim();

    setBusy(resortInfoSaveBtn, true);
    try {
      const { ok, body } = await cvrApiPost("admin/settings-save", { resortName, email, phone, address });
      if (!ok || !body.success) {
        showAlert(resortInfoAlert, body.message || "Could not save resort information.");
        return;
      }
      showAlert(resortInfoAlert, "Resort information saved.", "success");
      if (resortInfoSavedStamp) {
        resortInfoSavedStamp.textContent = `Saved ${new Date().toLocaleTimeString()}`;
        resortInfoSavedStamp.classList.remove("d-none");
      }
    } catch (err) {
      showAlert(resortInfoAlert, "Network error while saving. Please try again.");
    } finally {
      setBusy(resortInfoSaveBtn, false);
    }
  });

  photoPickBtn?.addEventListener("click", () => photoFile.click());

  photoFile.addEventListener("change", async () => {
    hideAlert(photoAlert);
    const file = photoFile.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showAlert(photoAlert, "Photo must be smaller than 2 MB.");
      photoFile.value = "";
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showAlert(photoAlert, "Photo must be a JPG, PNG, or WEBP image.");
      photoFile.value = "";
      return;
    }

    setBusy(photoPickBtn, true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch(`${cvrApiBase()}/admin/upload-avatar`, {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      let body;
      try {
        body = await res.json();
      } catch {
        body = { success: false, message: "Unexpected server response." };
      }
      if (!res.ok || !body.success) {
        showAlert(photoAlert, body.message || "Could not upload photo.");
        return;
      }
      setPhoto(body.data.avatarUrl, null);

      if (typeof setCustomerSession === "function" && typeof getCustomerSession === "function") {
        setCustomerSession({ ...getCustomerSession(), avatarUrl: body.data.avatarUrl });
      }
      showAlert(photoAlert, "Profile photo updated.", "success");
    } catch (err) {
      showAlert(photoAlert, "Network error while uploading. Please try again.");
    } finally {
      setBusy(photoPickBtn, false);
      photoFile.value = "";
    }
  });

  updatePwBtn.addEventListener("click", async () => {
    hideAlert(pwAlert);
    const current = currentPw.value;
    const next = newPw.value;
    const confirm = confirmPw.value;

    if (!current || !next || !confirm) {
      showAlert(pwAlert, "Please fill in all password fields.");
      return;
    }
    if (next.length < 8) {
      showAlert(pwAlert, "New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      showAlert(pwAlert, "New password and confirmation do not match.");
      return;
    }

    setBusy(updatePwBtn, true);
    try {
      const { ok, body } = await cvrApiPost("admin/update-password", {
        currentPassword: current,
        newPassword: next,
        confirmPassword: confirm,
      });
      if (!ok || !body.success) {
        showAlert(pwAlert, body.message || "Could not update password.");
        return;
      }
      showAlert(pwAlert, "Your password has been updated.", "success");
      currentPw.value = "";
      newPw.value = "";
      confirmPw.value = "";
    } catch (err) {
      showAlert(pwAlert, "Network error while updating password. Please try again.");
    } finally {
      setBusy(updatePwBtn, false);
    }
  });

  const qrFile = document.getElementById("paymentQrFile");
  const qrPickBtn = document.getElementById("paymentQrPickBtn");
  const qrRemoveBtn = document.getElementById("paymentQrRemoveBtn");
  const qrSaveLabelBtn = document.getElementById("paymentQrSaveLabelBtn");
  const qrLabelInput = document.getElementById("paymentQrLabelInput");
  const qrPreview = document.getElementById("paymentQrPreview");
  const qrEmpty = document.getElementById("paymentQrEmpty");
  const qrAlert = document.getElementById("paymentQrAlert");
  const qrStatus = document.getElementById("paymentQrStatus");

  const renderQr = (url, label) => {
    if (qrLabelInput && typeof label === "string") qrLabelInput.value = label;
    if (url) {

      qrPreview.src = `${url}?t=${Date.now()}`;
      qrPreview.classList.remove("d-none");
      qrEmpty?.classList.add("d-none");
      qrRemoveBtn?.classList.remove("d-none");
      if (qrStatus) qrStatus.textContent = "QR is live on the payment page";
    } else {
      qrPreview.classList.add("d-none");
      qrPreview.removeAttribute("src");
      qrEmpty?.classList.remove("d-none");
      qrRemoveBtn?.classList.add("d-none");
      if (qrStatus) qrStatus.textContent = "No QR uploaded";
    }
  };

  qrPickBtn?.addEventListener("click", () => qrFile?.click());

  qrFile?.addEventListener("change", async () => {
    hideAlert(qrAlert);
    const file = qrFile.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showAlert(qrAlert, "QR image must be smaller than 3 MB.");
      qrFile.value = "";
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showAlert(qrAlert, "QR image must be a JPG, PNG, or WEBP file.");
      qrFile.value = "";
      return;
    }

    setBusy(qrPickBtn, true);
    try {
      const formData = new FormData();
      formData.append("qr", file);
      formData.append("label", qrLabelInput?.value.trim() || "");
      const { ok, body } = await cvrApiPostForm("admin/payment-qr-upload", formData);
      if (!ok || !body.success) {
        showAlert(qrAlert, body.message || "Could not upload the QR image.");
        return;
      }
      renderQr(body.data.paymentQr.url, body.data.paymentQr.label);
      showAlert(qrAlert, "Payment QR code updated. Guests will see it on the Payment page.", "success");
    } catch (err) {
      showAlert(qrAlert, "Network error while uploading. Please try again.");
    } finally {
      setBusy(qrPickBtn, false);
      qrFile.value = "";
    }
  });

  qrRemoveBtn?.addEventListener("click", async () => {
    hideAlert(qrAlert);
    if (!window.confirm("Remove the payment QR code? Guests will not be able to scan until you upload a new one.")) return;
    setBusy(qrRemoveBtn, true);
    try {
      const { ok, body } = await cvrApiPost("admin/payment-qr-delete", {});
      if (!ok || !body.success) {
        showAlert(qrAlert, body.message || "Could not remove the QR code.");
        return;
      }
      renderQr(null, "");
      showAlert(qrAlert, "Payment QR code removed.", "success");
    } catch (err) {
      showAlert(qrAlert, "Network error while removing. Please try again.");
    } finally {
      setBusy(qrRemoveBtn, false);
    }
  });

  qrSaveLabelBtn?.addEventListener("click", async () => {
    hideAlert(qrAlert);
    setBusy(qrSaveLabelBtn, true);
    try {
      const { ok, body } = await cvrApiPost("admin/settings-save", {
        resortName: resortNameInput.value.trim(),
        email: resortEmailInput.value.trim(),
        phone: resortPhoneInput.value.trim(),
        address: resortAddressInput.value.trim(),
        paymentQrLabel: qrLabelInput?.value.trim() || "",
      });
      if (!ok || !body.success) {
        showAlert(qrAlert, body.message || "Could not save the QR caption.");
        return;
      }
      showAlert(qrAlert, "QR caption saved.", "success");
    } catch (err) {
      showAlert(qrAlert, "Network error while saving. Please try again.");
    } finally {
      setBusy(qrSaveLabelBtn, false);
    }
  });

  const checkinReminderBtn = document.getElementById("checkinReminderSendBtn");
  const checkinReminderAlert = document.getElementById("checkinReminderAlert");

  checkinReminderBtn?.addEventListener("click", async () => {
    hideAlert(checkinReminderAlert);
    setBusy(checkinReminderBtn, true);
    try {
      const { ok, body } = await cvrApiPost("admin/send-checkin-reminders", {});
      if (!ok || !body.success) {
        showAlert(checkinReminderAlert, body.message || "Could not send check-in reminders.");
        return;
      }
      showAlert(checkinReminderAlert, body.message || "Check-in reminders sent.", "success");
    } catch (err) {
      showAlert(checkinReminderAlert, "Network error while sending reminders. Please try again.");
    } finally {
      setBusy(checkinReminderBtn, false);
    }
  });

  const checkoutReminderBtn = document.getElementById("checkoutReminderSendBtn");
  const checkoutReminderAlert = document.getElementById("checkoutReminderAlert");

  checkoutReminderBtn?.addEventListener("click", async () => {
    hideAlert(checkoutReminderAlert);
    setBusy(checkoutReminderBtn, true);
    try {
      const { ok, body } = await cvrApiPost("admin/send-checkout-reminders", {});
      if (!ok || !body.success) {
        showAlert(checkoutReminderAlert, body.message || "Could not send check-out reminders.");
        return;
      }
      showAlert(checkoutReminderAlert, body.message || "Check-out reminders sent.", "success");
    } catch (err) {
      showAlert(checkoutReminderAlert, "Network error while sending reminders. Please try again.");
    } finally {
      setBusy(checkoutReminderBtn, false);
    }
  });

  loadProfile();
  loadResortSettings();
}
