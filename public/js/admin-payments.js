

function cvrProofStatusClass(status) {
  return typeof getStatusChipClass === "function" ? getStatusChipClass(status) : "chip-yellow";
}

function cvrEscapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

let cvrLatestPaymentProofs = [];
window.getAdminPaymentProofs = () => cvrLatestPaymentProofs;

async function initAdminSubmittedProofs() {
  const tableBody = document.getElementById("submittedProofsTableBody");
  if (!tableBody) return;

  const countWaiting = document.getElementById("proofCountWaiting");
  const countApproved = document.getElementById("proofCountApproved");
  const countRejected = document.getElementById("proofCountRejected");
  const kpiTotal = document.getElementById("paymentKpiTotal");
  const kpiWaiting = document.getElementById("paymentKpiWaiting");
  const kpiVerified = document.getElementById("paymentKpiVerified");
  const kpiRejected = document.getElementById("paymentKpiRejected");

  const render = async () => {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted-brand py-4">Loading submissions…</td></tr>`;

    const { body } = await cvrApiGet("admin/payments-list");
    if (!body?.success) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">${cvrEscapeHtml(body?.message || "Could not load submissions.")}</td></tr>`;
      cvrLatestPaymentProofs = [];
      if (kpiTotal) kpiTotal.textContent = "—";
      if (kpiWaiting) kpiWaiting.textContent = "—";
      if (kpiVerified) kpiVerified.textContent = "—";
      if (kpiRejected) kpiRejected.textContent = "—";
      return;
    }

    const proofs = body.data?.proofs || [];
    const counts = body.data?.counts || {};
    cvrLatestPaymentProofs = proofs;

    if (countWaiting) countWaiting.textContent = counts.waiting ?? 0;
    if (countApproved) countApproved.textContent = counts.approved ?? 0;
    if (countRejected) countRejected.textContent = counts.rejected ?? 0;

    if (kpiTotal) kpiTotal.textContent = proofs.length;
    if (kpiWaiting) kpiWaiting.textContent = counts.waiting ?? 0;
    if (kpiVerified) kpiVerified.textContent = counts.approved ?? 0;
    if (kpiRejected) kpiRejected.textContent = counts.rejected ?? 0;

    if (!proofs.length) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted-brand py-4">No proof of payment submitted yet.</td></tr>`;
      return;
    }

    tableBody.innerHTML = proofs
      .map((proof) => {
        const submitted = proof.createdAt ? new Date(proof.createdAt.replace(" ", "T")).toLocaleString() : "—";

        const fileType = (proof.fileType || "").toLowerCase();
        const fileName = (proof.fileName || "").toLowerCase();
        const isImage = fileType.startsWith("image/") || /\.(jpe?g|png|gif|webp|bmp|tiff?|heic|heif)$/.test(fileName);
        const isPdf = fileType.includes("pdf") || fileName.endsWith(".pdf");
        const isWord = fileType.includes("word") || /\.docx?$/.test(fileName);
        const isExcel = fileType.includes("sheet") || fileType.includes("excel") || /\.xlsx?$/.test(fileName);
        const isPpt = fileType.includes("presentation") || fileType.includes("powerpoint") || /\.pptx?$/.test(fileName);
        const isArchive = /\.(zip|rar|7z)$/.test(fileName);

        let thumb;
        if (isImage) {
          thumb = `<img src="${cvrEscapeHtml(proof.fileUrl)}" alt="Proof of payment" style="width:52px;height:52px;object-fit:cover;border-radius:8px;">`;
        } else if (isPdf) {
          thumb = `<i class="bi bi-file-earmark-pdf fs-4 text-danger"></i>`;
        } else if (isWord) {
          thumb = `<i class="bi bi-file-earmark-word fs-4 text-primary"></i>`;
        } else if (isExcel) {
          thumb = `<i class="bi bi-file-earmark-excel fs-4 text-success"></i>`;
        } else if (isPpt) {
          thumb = `<i class="bi bi-file-earmark-ppt fs-4 text-warning"></i>`;
        } else if (isArchive) {
          thumb = `<i class="bi bi-file-earmark-zip fs-4 text-secondary"></i>`;
        } else {
          thumb = `<i class="bi bi-file-earmark-text fs-4 text-muted-brand"></i>`;
        }
        return `
          <tr data-proof-id="${proof.id}">
            <td>
              <div class="fw-semibold">${cvrEscapeHtml(proof.reservationId)}</div>
              <div class="small text-muted-brand">${cvrEscapeHtml(proof.packageName || "")}</div>
            </td>
            <td>
              <div>${cvrEscapeHtml(proof.customerName || "Guest")}</div>
              <div class="small text-muted-brand">${cvrEscapeHtml(proof.email || "")}</div>
            </td>
            <td class="small">${cvrEscapeHtml(submitted)}</td>
            <td class="small">${cvrEscapeHtml(proof.amount || "—")}<div class="small text-muted-brand">${cvrEscapeHtml(proof.paymentMethod || "")}</div></td>
            <td>
              <a href="${cvrEscapeHtml(proof.fileUrl)}" target="_blank" rel="noopener" class="d-inline-flex align-items-center gap-2 text-decoration-none">
                ${thumb}<span class="small">View</span>
              </a>
            </td>
            <td><span class="status-chip ${cvrProofStatusClass(proof.status)}">${cvrEscapeHtml(proof.status)}</span></td>
            <td>
              <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-sm btn-outline-success proof-action-btn" data-action="Approved">Approve</button>
                <button class="btn btn-sm btn-outline-danger proof-action-btn" data-action="Rejected">Reject</button>
                <button class="btn btn-sm btn-outline-secondary proof-delete-btn" title="Delete submission" aria-label="Delete submission"><i class="bi bi-trash3"></i></button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    tableBody.querySelectorAll(".proof-action-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const row = button.closest("tr");
        const id = Number(row?.dataset.proofId || 0);
        const status = button.dataset.action;
        if (!id) return;

        const guest = row?.querySelector("td:nth-child(2) div")?.textContent?.trim() || "the guest";
        const reference = row?.querySelector("td:nth-child(1) .fw-semibold")?.textContent?.trim() || "";

        let note = "";
        if (status === "Rejected") {

          const result = await window.cvrConfirmModal({
            title: "Reject payment",
            message: `${guest}'s receipt for ${reference} will be rejected, ${guest} will be emailed, and the submission will be permanently removed from this list. This cannot be undone.`,
            confirmText: "Reject & remove",
            icon: "bi-x-octagon",
            withReason: true,
            reasonLabel: "Reason for rejecting (emailed to the guest)",
            reasonPlaceholder: "e.g. The receipt is unreadable — please upload a clearer photo.",
          });
          if (!result.confirmed) return;
          note = result.reason;
        }

        button.disabled = true;
        const { body } = await cvrApiPost("admin/payments-update", { id, status, note });
        button.disabled = false;

        if (!body?.success) {
          cvrToast(body?.message || "Could not update this submission.", "danger");
          return;
        }
        cvrToast(
          status === "Approved"
            ? "Payment verified — the guest has been emailed."
            : "Payment rejected — the guest has been emailed and the submission removed.",
          "success",
        );
        render();
      });
    });

    tableBody.querySelectorAll(".proof-delete-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const row = button.closest("tr");
        const id = Number(row?.dataset.proofId || 0);
        if (!id) return;

        const reference = row?.querySelector("td:nth-child(1) .fw-semibold")?.textContent?.trim() || "";
        const { confirmed } = await window.cvrConfirmModal({
          title: "Delete payment submission",
          message: `The receipt submitted for ${reference || "this reservation"} will be permanently deleted, including the uploaded file. This cannot be undone.`,
          confirmText: "Delete submission",
          icon: "bi-trash3",
        });
        if (!confirmed) return;

        button.disabled = true;
        const { body } = await cvrApiPost("admin/payments-delete", { id });
        button.disabled = false;

        if (!body?.success) {
          cvrToast(body?.message || "Could not delete this submission.", "danger");
          return;
        }
        cvrToast("Payment submission deleted.", "success");
        render();
      });
    });
  };

  render();
}

document.addEventListener("DOMContentLoaded", initAdminSubmittedProofs);
