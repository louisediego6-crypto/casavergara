@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <title>Admin Reservations - Casa Vergara</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../../css/style.css?v=20260926c" rel="stylesheet">
  <link href="../../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../../css/laravel-ui.css?v=20261018b" rel="stylesheet">
  <link href="../../css/admin-modern.css?v=20261018a" rel="stylesheet">
</head>
<body>
  <div class="admin-wrap admin-page admin-reservations-page">
    <div id="admin-sidebar"></div>
    <main class="admin-main">
      <div class="d-flex justify-content-between align-items-center mb-4 admin-page-head flex-wrap gap-3">
        <div><h1 class="h2 text-brand mb-1">Reservations</h1><p class="text-muted-brand mb-0">Manage all resort bookings (live data)</p></div>
        <span class="badge text-bg-light border admin-result-badge" id="reservationResultCount">0 reservations</span>
      </div>
      <div class="soft-card p-3 mb-4 admin-filter-card">
        <div class="row g-3 align-items-end admin-filter-row">
          <div class="col-md-3">
            <label for="reservationSearchInput" class="form-label admin-filter-label">Search</label>
            <input id="reservationSearchInput" class="form-control" placeholder="Search by ID, guest, or room">
          </div>
          <div class="col-md-2">
            <label for="reservationStatusFilter" class="form-label admin-filter-label">Payment status</label>
            <select id="reservationStatusFilter" class="form-select">
              <option value="all">All Statuses</option>
              <option value="Verified">Verified</option>
              <option value="Waiting for Verification">Waiting for Verification</option>
              <option value="Pending Payment">Pending Payment</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div class="col-md-2">
            <label for="reservationRoomTypeFilter" class="form-label admin-filter-label">Room / event</label>
            <select id="reservationRoomTypeFilter" class="form-select">
              <option value="all">All</option>
            </select>
          </div>
          <div class="col-md-2">
            <label for="quotationStatusFilter" class="form-label admin-filter-label">Quotation</label>
            <select id="quotationStatusFilter" class="form-select">
              <option value="all">All quotations</option>
              <option value="Pending Admin Review">Pending Admin Review</option>
              <option value="Approved">Approved</option>
              <option value="Revised">Revised</option>
              <option value="Accepted by Client">Accepted by Client</option>
            </select>
          </div>
          <div class="col-md-2">
            <label for="reservationDateFilter" class="form-label admin-filter-label">Check-in date</label>
            <input id="reservationDateFilter" type="date" class="form-control">
          </div>
          <div class="col-md-1">
            <label for="reservationDateFrom" class="form-label admin-filter-label">From</label>
            <input id="reservationDateFrom" type="date" class="form-control">
          </div>
          <div class="col-md-1">
            <label for="reservationDateTo" class="form-label admin-filter-label">To</label>
            <input id="reservationDateTo" type="date" class="form-control">
          </div>
          <div class="col-12 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <span id="reservationExportStatus" class="small fw-semibold d-none" role="status"></span>
            <div class="d-flex gap-2 flex-wrap ms-md-auto">
              <button type="button" class="btn btn-outline-primary admin-export-btn" id="reservationExportPdfBtn"><i class="bi bi-file-earmark-pdf me-2"></i>Export PDF</button>
              <button type="button" class="btn btn-brand admin-export-btn" id="reservationExportBtn"><i class="bi bi-filetype-docx me-2"></i>Export DOCX</button>
            </div>
          </div>
        </div>
      </div>
      <div class="soft-card p-3 admin-table-card">
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>ID</th><th>Guest</th><th>Room / Event</th><th>Dates</th><th class="admin-only-action">Amount</th><th>Payment Status</th><th>Quotation</th><th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody id="reservationTableBody">
              <tr id="reservationEmptyStateRow" class="d-none">
                <td colspan="8" class="text-center py-5">
                  <div class="reservation-empty-state">
                    <i class="bi bi-inbox fs-3 mb-2 d-block text-muted-brand"></i>
                    <h6 class="text-brand mb-1">No reservations found</h6>
                    <p class="text-muted-brand small mb-0">Try adjusting your search or filter criteria.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>

  <div class="modal fade" id="adminReservationDetailModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable modal-fullscreen-sm-down">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title text-brand">Reservation details</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body" id="adminReservationDetailBody"></div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-outline-primary d-none" id="adminQuoteSaveBtn">Save draft</button>
          <button type="button" class="btn btn-brand d-none" id="adminQuoteApproveBtn">Approve &amp; send quotation</button>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
  <script src="../../js/main.js?v=20260926b"></script>
  <script src="../../js/duration-pricing.js?v=20260924d"></script>
  <script src="../../js/booking-data.js?v=20260924d"></script>
  <script src="../../js/admin-export.js?v=20260830i"></script>
  <script src="../../js/admin-reservations.js?v=20260830i"></script>
  <script>renderAdminSidebar("reservations"); initAdminReservationsPage();</script>
</body>
</html>

@endverbatim
