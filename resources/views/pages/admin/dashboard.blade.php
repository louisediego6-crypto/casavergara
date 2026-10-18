@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Dashboard - Casa Vergara</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../../css/style.css?v=20260926c" rel="stylesheet">
  <link href="../../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../../css/laravel-ui.css?v=20261018b" rel="stylesheet">
  <link href="../../css/admin-modern.css?v=20261018a" rel="stylesheet">
</head>
<body>
  <div class="admin-wrap admin-page admin-dashboard-page">
    <div id="admin-sidebar"></div>
    <main class="admin-main">
      <div class="admin-page-head mb-4">
        <h1 class="h2 text-brand mb-1">Dashboard</h1>
        <p class="text-muted-brand mb-0">Overview of reservations and manual payment verification</p>
      </div>
      <div class="row g-3 mb-4 admin-kpi-grid">
        <div class="col-md-6 col-xl-3"><div class="soft-card p-3"><small class="text-muted-brand">Total Bookings</small><h3 class="text-brand mb-0" id="dashKpiBookings">0</h3></div></div>
        <div class="col-md-6 col-xl-3"><div class="soft-card p-3"><small class="text-muted-brand">Verified Payments</small><h3 class="text-brand mb-0" id="dashKpiVerified">0</h3></div></div>
        <div class="col-md-6 col-xl-3"><div class="soft-card p-3"><small class="text-muted-brand">Pending payment</small><h3 class="text-brand mb-0" id="dashKpiPending">0</h3></div></div>
        <div class="col-md-6 col-xl-3"><div class="soft-card p-3"><small class="text-muted-brand">Awaiting verification</small><h3 class="text-brand mb-0" id="dashKpiWaiting">0</h3></div></div>
      </div>
      <div class="row g-4 mb-4 admin-chart-grid">
        <div class="col-lg-6"><div class="soft-card p-3 admin-chart-card"><h6 class="text-brand">Revenue Overview</h6><div style="height:280px"><canvas id="revenueChart"></canvas></div></div></div>
        <div class="col-lg-6"><div class="soft-card p-3 admin-chart-card"><h6 class="text-brand">Bookings Overview</h6><div style="height:280px"><canvas id="bookingChart"></canvas></div></div></div>
      </div>

      <div class="soft-card p-4 mb-4" id="adminDashboardReports">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
          <div>
            <h6 class="text-brand mb-1">Download reports</h6>
            <p class="text-muted-brand small mb-0">Uses live reservation data saved in your browser. Choose filters, then Excel (preview &amp; print), DOCX or PDF.</p>
          </div>
          <div id="dashReportStatus" class="small fw-semibold d-none" role="status"></div>
        </div>
        <div class="row g-3 mb-4">
          <div class="col-md-3">
            <label class="form-label small text-muted-brand mb-1" for="dashReportDateFrom">From (check-in)</label>
            <input type="date" class="form-control form-control-sm" id="dashReportDateFrom">
          </div>
          <div class="col-md-3">
            <label class="form-label small text-muted-brand mb-1" for="dashReportDateTo">To (check-in)</label>
            <input type="date" class="form-control form-control-sm" id="dashReportDateTo">
          </div>
          <div class="col-md-3">
            <label class="form-label small text-muted-brand mb-1" for="dashReportPayStatus">Payment status</label>
            <select class="form-select form-select-sm" id="dashReportPayStatus">
              <option value="all">All</option>
              <option value="Pending Payment">Pending Payment</option>
              <option value="Waiting for Verification">Waiting for Verification</option>
              <option value="Approved">Approved</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label small text-muted-brand mb-1" for="dashReportRoom">Room / event</label>
            <select class="form-select form-select-sm" id="dashReportRoom">
              <option value="all">All</option>
            </select>
          </div>
        </div>
        <div class="row g-3">
          <div class="col-md-6 col-xl-3">
            <div class="border rounded-3 p-3 h-100 bg-light-subtle">
              <div class="fw-semibold text-brand mb-2 small">Reservation reports</div>
              <div class="d-flex gap-2 flex-wrap">
                <button type="button" class="btn btn-sm btn-outline-success dash-report-btn" data-report="reservation" data-format="xlsx"><i class="bi bi-file-earmark-excel me-1"></i>Excel</button>
                <button type="button" class="btn btn-sm btn-outline-primary dash-report-btn" data-report="reservation" data-format="docx">DOCX</button>
                <button type="button" class="btn btn-sm btn-outline-primary dash-report-btn" data-report="reservation" data-format="pdf">PDF</button>
              </div>
            </div>
          </div>
          <div class="col-md-6 col-xl-3">
            <div class="border rounded-3 p-3 h-100 bg-light-subtle">
              <div class="fw-semibold text-brand mb-2 small">Booking reports</div>
              <div class="d-flex gap-2 flex-wrap">
                <button type="button" class="btn btn-sm btn-outline-success dash-report-btn" data-report="booking" data-format="xlsx"><i class="bi bi-file-earmark-excel me-1"></i>Excel</button>
                <button type="button" class="btn btn-sm btn-outline-primary dash-report-btn" data-report="booking" data-format="docx">DOCX</button>
                <button type="button" class="btn btn-sm btn-outline-primary dash-report-btn" data-report="booking" data-format="pdf">PDF</button>
              </div>
            </div>
          </div>
          <div class="col-md-6 col-xl-3">
            <div class="border rounded-3 p-3 h-100 bg-light-subtle">
              <div class="fw-semibold text-brand mb-2 small">Payment records</div>
              <div class="d-flex gap-2 flex-wrap">
                <button type="button" class="btn btn-sm btn-outline-success dash-report-btn" data-report="payment" data-format="xlsx"><i class="bi bi-file-earmark-excel me-1"></i>Excel</button>
                <button type="button" class="btn btn-sm btn-outline-primary dash-report-btn" data-report="payment" data-format="docx">DOCX</button>
                <button type="button" class="btn btn-sm btn-outline-primary dash-report-btn" data-report="payment" data-format="pdf">PDF</button>
              </div>
            </div>
          </div>
          <div class="col-md-6 col-xl-3">
            <div class="border rounded-3 p-3 h-100 bg-light-subtle">
              <div class="fw-semibold text-brand mb-2 small">Schedule reports</div>
              <div class="d-flex gap-2 flex-wrap">
                <button type="button" class="btn btn-sm btn-outline-success dash-report-btn" data-report="schedule" data-format="xlsx"><i class="bi bi-file-earmark-excel me-1"></i>Excel</button>
                <button type="button" class="btn btn-sm btn-outline-primary dash-report-btn" data-report="schedule" data-format="docx">DOCX</button>
                <button type="button" class="btn btn-sm btn-outline-primary dash-report-btn" data-report="schedule" data-format="pdf">PDF</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="soft-card p-3 admin-table-card">
        <h6 class="text-brand">Recent reservations (payment verification)</h6>
        <div class="table-responsive">
          <table class="table align-middle">
            <thead><tr><th>ID</th><th>Guest</th><th>Room</th><th>Check-in</th><th class="admin-only-action">Amount</th><th>Payment status</th></tr></thead>
            <tbody id="dashRecentReservationsBody">
              <tr><td colspan="6" class="text-muted-brand small py-3">Loading…</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="../../js/main.js?v=20260926b"></script>
  <script src="../../js/admin-export.js?v=20261001c"></script>
  <script src="../../js/admin.js?v=20260830i"></script>
  <script>
    renderAdminSidebar("dashboard"); applyStaffDashboardRestrictions(); initDashboardCharts(); initDashboardFromData(); initDashboardReportDownloads();

    cvrSyncReservationsFromServer();
  </script>
</body>
</html>

@endverbatim
