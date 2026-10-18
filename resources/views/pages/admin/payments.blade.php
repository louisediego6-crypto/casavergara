@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <title>Admin Payment Verification - Casa Vergara</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../../css/style.css?v=20260926c" rel="stylesheet">
  <link href="../../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../../css/laravel-ui.css?v=20261018b" rel="stylesheet">
  <link href="../../css/admin-modern.css?v=20261018a" rel="stylesheet">
</head>
<body>
  <div class="admin-wrap admin-page admin-payments-page">
    <div id="admin-sidebar"></div>
    <main class="admin-main">
      <div class="d-flex justify-content-between align-items-center mb-4 admin-page-head flex-wrap gap-3">
        <div>
          <h1 class="h2 text-brand mb-1">Payment Verification</h1>
          <p class="text-muted-brand mb-0">Review uploaded receipts and approve or reject payment proofs</p>
        </div>
      </div>

      <div class="soft-card p-3 mb-4">
        <h6 class="text-brand mb-3">Export payment records</h6>
        <p class="text-muted-brand small mb-3">Filters apply to the <strong>date submitted</strong>. Exports use the exact same submissions shown in the table below, and always download — even when no submission matches the filters.</p>
        <div class="row g-3 align-items-end">
          <div class="col-md-3">
            <label class="form-label small text-muted-brand mb-1" for="paymentExportDateFrom">Submitted from</label>
            <input type="date" class="form-control" id="paymentExportDateFrom">
          </div>
          <div class="col-md-3">
            <label class="form-label small text-muted-brand mb-1" for="paymentExportDateTo">Submitted to</label>
            <input type="date" class="form-control" id="paymentExportDateTo">
          </div>
          <div class="col-md-3">
            <label class="form-label small text-muted-brand mb-1" for="paymentExportPayFilter">Payment status</label>
            <select class="form-select" id="paymentExportPayFilter">
              <option value="all">All</option>
              <option value="Waiting for Verification">Waiting for Verification</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div class="col-md-3 d-flex flex-column gap-2 align-items-stretch">
            <span id="paymentExportStatus" class="small fw-semibold d-none" role="status"></span>
            <div class="d-flex gap-2 flex-wrap">
              <button type="button" class="btn btn-outline-primary flex-grow-1" id="paymentExportPdfBtn"><i class="bi bi-file-earmark-pdf me-1"></i>PDF</button>
              <button type="button" class="btn btn-brand flex-grow-1" id="paymentExportDocxBtn"><i class="bi bi-filetype-docx me-1"></i>DOCX</button>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4 admin-kpi-grid">
        <div class="col-md-3"><div class="soft-card p-3"><small>Total Submissions</small><h3 class="text-brand" id="paymentKpiTotal">—</h3></div></div>
        <div class="col-md-3"><div class="soft-card p-3"><small>Waiting for Verification</small><h3 class="text-primary" id="paymentKpiWaiting">—</h3></div></div>
        <div class="col-md-3"><div class="soft-card p-3"><small>Verified</small><h3 class="text-success" id="paymentKpiVerified">—</h3></div></div>
        <div class="col-md-3"><div class="soft-card p-3"><small>Rejected</small><h3 class="text-danger" id="paymentKpiRejected">—</h3></div></div>
      </div>
      <div class="soft-card p-3 admin-table-card mb-4">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div>
            <h6 class="text-brand mb-1">Payment Verification</h6>
            <p class="text-muted-brand small mb-0">Receipts guests uploaded on the QR payment page — any file type is supported (image, PDF, Word, Excel, archive). Approving or rejecting emails the guest automatically.</p>
          </div>
          <div class="d-flex gap-3 small">
            <span class="text-primary">Waiting: <strong id="proofCountWaiting">0</strong></span>
            <span class="text-success">Approved: <strong id="proofCountApproved">0</strong></span>
            <span class="text-danger">Rejected: <strong id="proofCountRejected">0</strong></span>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>Reservation</th>
                <th>Guest</th>
                <th>Submitted</th>
                <th>Amount</th>
                <th>Receipt</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="submittedProofsTableBody"></tbody>
          </table>
        </div>
        <small class="text-muted-brand d-block mt-2">All uploaded file types are accepted and served from secure server storage (/uploads/payments), visible only to signed-in staff accounts. Use “View” to open or download any receipt file.</small>
      </div>
      <div class="soft-card p-3 mt-4 admin-payment-security-note">
        <h6 class="text-brand mb-2">Upload Security Policy</h6>
        <ul class="small text-muted-brand mb-0 ps-3">
          <li>All file types are supported — photos (JPG, PNG, HEIC, WEBP), PDF, Word, Excel, and archive files.</li>
          <li>Maximum upload size is 5MB per file.</li>
          <li>Filenames are sanitized and stored under secure server storage before metadata is saved.</li>
          <li>Only executable/script file types (.exe, .bat, .php, .js, and similar) are blocked for security.</li>
        </ul>
      </div>
    </main>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
  <script src="../../js/main.js?v=20260926b"></script>
  <script src="../../js/admin-export.js?v=20260830i"></script>
  <script src="../../js/admin-payments.js?v=20260830i"></script>
  <script src="../../js/admin.js?v=20260830i"></script>
  <script>
    renderAdminSidebar("payments");
    initAdminPaymentsExport();
  </script>
</body>
</html>

@endverbatim
