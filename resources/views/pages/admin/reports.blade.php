@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Reports - Casa Vergara</title>
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
  <div class="admin-wrap admin-page admin-reports-page">
    <div id="admin-sidebar"></div>
    <main class="admin-main">
      <div class="d-flex justify-content-between align-items-center mb-4 admin-page-head flex-wrap gap-3">
        <div>
          <h1 class="h2 text-brand mb-1">Reports &amp; analytics</h1>
          <p class="text-muted-brand mb-0">Charts use sample trends; downloads use live reservation data.</p>
        </div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <span id="repReportStatus" class="small fw-semibold d-none" role="status"></span>
          <button type="button" class="btn btn-brand" id="repReportExportMainBtn"><i class="bi bi-download me-2"></i>Quick export (CSV)</button>
        </div>
      </div>

      <div class="soft-card p-4 mb-4" id="adminReportsExportRoot">
        <h6 class="text-brand mb-3">Filtered exports</h6>
        <div class="row g-3 mb-3">
          <div class="col-md-3">
            <label class="form-label small text-muted-brand mb-1" for="repReportDateFrom">From (check-in)</label>
            <input type="date" class="form-control form-control-sm" id="repReportDateFrom">
          </div>
          <div class="col-md-3">
            <label class="form-label small text-muted-brand mb-1" for="repReportDateTo">To (check-in)</label>
            <input type="date" class="form-control form-control-sm" id="repReportDateTo">
          </div>
          <div class="col-md-3">
            <label class="form-label small text-muted-brand mb-1" for="repReportPayStatus">Payment status</label>
            <select class="form-select form-select-sm" id="repReportPayStatus">
              <option value="all">All</option>
              <option value="Pending Payment">Pending Payment</option>
              <option value="Waiting for Verification">Waiting for Verification</option>
              <option value="Approved">Approved</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label small text-muted-brand mb-1" for="repReportRoom">Room / event</label>
            <select class="form-select form-select-sm" id="repReportRoom">
              <option value="all">All</option>
            </select>
          </div>
        </div>
        <div class="row g-3">
          <div class="col-md-6 col-xl-3">
            <div class="border rounded-3 p-3 h-100 bg-light-subtle">
              <div class="fw-semibold text-brand mb-2 small">Reservation reports</div>
              <div class="d-flex gap-2 flex-wrap">
                <button type="button" class="btn btn-sm btn-outline-success rep-report-btn" data-report="reservation" data-format="xlsx"><i class="bi bi-file-earmark-excel me-1"></i>Excel</button>
                <button type="button" class="btn btn-sm btn-outline-primary rep-report-btn" data-report="reservation" data-format="docx">DOCX</button>
                <button type="button" class="btn btn-sm btn-outline-primary rep-report-btn" data-report="reservation" data-format="pdf">PDF</button>
              </div>
            </div>
          </div>
          <div class="col-md-6 col-xl-3">
            <div class="border rounded-3 p-3 h-100 bg-light-subtle">
              <div class="fw-semibold text-brand mb-2 small">Booking reports</div>
              <div class="d-flex gap-2 flex-wrap">
                <button type="button" class="btn btn-sm btn-outline-success rep-report-btn" data-report="booking" data-format="xlsx"><i class="bi bi-file-earmark-excel me-1"></i>Excel</button>
                <button type="button" class="btn btn-sm btn-outline-primary rep-report-btn" data-report="booking" data-format="docx">DOCX</button>
                <button type="button" class="btn btn-sm btn-outline-primary rep-report-btn" data-report="booking" data-format="pdf">PDF</button>
              </div>
            </div>
          </div>
          <div class="col-md-6 col-xl-3">
            <div class="border rounded-3 p-3 h-100 bg-light-subtle">
              <div class="fw-semibold text-brand mb-2 small">Payment records</div>
              <div class="d-flex gap-2 flex-wrap">
                <button type="button" class="btn btn-sm btn-outline-success rep-report-btn" data-report="payment" data-format="xlsx"><i class="bi bi-file-earmark-excel me-1"></i>Excel</button>
                <button type="button" class="btn btn-sm btn-outline-primary rep-report-btn" data-report="payment" data-format="docx">DOCX</button>
                <button type="button" class="btn btn-sm btn-outline-primary rep-report-btn" data-report="payment" data-format="pdf">PDF</button>
              </div>
            </div>
          </div>
          <div class="col-md-6 col-xl-3">
            <div class="border rounded-3 p-3 h-100 bg-light-subtle">
              <div class="fw-semibold text-brand mb-2 small">Schedule reports</div>
              <div class="d-flex gap-2 flex-wrap">
                <button type="button" class="btn btn-sm btn-outline-success rep-report-btn" data-report="schedule" data-format="xlsx"><i class="bi bi-file-earmark-excel me-1"></i>Excel</button>
                <button type="button" class="btn btn-sm btn-outline-primary rep-report-btn" data-report="schedule" data-format="docx">DOCX</button>
                <button type="button" class="btn btn-sm btn-outline-primary rep-report-btn" data-report="schedule" data-format="pdf">PDF</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="soft-card p-4 mb-4" id="repSheetCard">
        <div class="mb-3">
          <h6 class="text-brand mb-1"><i class="bi bi-table me-2"></i>Spreadsheet preview</h6>
          <p class="text-muted-brand small mb-0">Excel-style view of your live data. Pick a report, tick the fields you want, click any cell to inspect it, then print or download. Uses the filters above.</p>
        </div>
        <div id="repSheetHost"></div>
      </div>

      <div class="row g-3 mb-4 admin-kpi-grid">
        <div class="col-md-6 col-xl-3"><div class="soft-card p-3"><small>Total Revenue</small><h3 class="text-brand" id="repKpiRevenue">—</h3></div></div>
        <div class="col-md-6 col-xl-3"><div class="soft-card p-3"><small>Total Bookings</small><h3 class="text-brand" id="repKpiBookings">0</h3></div></div>
        <div class="col-md-6 col-xl-3"><div class="soft-card p-3"><small>Payment Verified Rate</small><h3 class="text-brand" id="repKpiVerifiedRate">—</h3></div></div>
        <div class="col-md-6 col-xl-3"><div class="soft-card p-3"><small>Avg Revenue / Booking</small><h3 class="text-brand" id="repKpiAvgRevenue">—</h3></div></div>
      </div>
      <div class="row g-4 admin-chart-grid">
        <div class="col-lg-8"><div class="soft-card p-3 admin-chart-card"><h6 class="text-brand">Monthly Performance</h6><div style="height:300px"><canvas id="trendChart"></canvas></div></div></div>
        <div class="col-lg-4"><div class="soft-card p-3 admin-chart-card"><h6 class="text-brand">Room Distribution</h6><div style="height:300px"><canvas id="roomChart"></canvas></div></div></div>
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
    renderAdminSidebar("reports");
    initReportsCharts();
    initReportsPageReportDownloads();

    cvrSyncReservationsFromServer();
  </script>
</body>
</html>

@endverbatim
