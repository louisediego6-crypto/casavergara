@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Casa Vergara - Reservation Payment Status</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../css/style.css?v=20261004f" rel="stylesheet">
  <link href="../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../css/laravel-ui.css?v=20261018b" rel="stylesheet">
</head>
<body>
  <div id="site-navbar"></div>
  <section class="section-pad bg-light reservation-status-page">
    <div class="container">
      <div class="soft-card overflow-hidden mb-4 reservation-success-card">
        <div id="reservationStatusHero" class="p-5 text-center text-white" style="background:linear-gradient(135deg,#0c3b5d,#328bc3);">
          <div class="display-5 mb-3"><i id="reservationStatusHeroIcon" class="bi bi-hourglass-split"></i></div>
          <h1 class="fw-bold" id="reservationStatusHeroTitle">Reservation Submitted</h1>
          <p class="mb-3" id="reservationStatusHeroSubtitle">Your payment proof is now queued for manual verification</p>
          <div class="d-inline-block px-4 py-2 rounded-3" style="background:rgba(255,255,255,.15)">
            <small class="d-block">Reservation Number</small><strong id="reservationStatusId" class="text-warning">—</strong>
          </div>
        </div>
      </div>
      <div class="row g-4 reservation-status-layout">
        <div class="col-lg-8">
          <div class="soft-card p-4 mb-4 reservation-status-panel">
            <h5 class="text-brand mb-3">Your booking</h5>
            <div class="d-flex gap-3 flex-column flex-sm-row">
              <img id="statusRoomImage" src="../images/booking-photo-2.png" alt="" style="width:120px;height:120px;object-fit:cover;border-radius:12px;" class="flex-shrink-0">
              <div>
                <h6 class="text-brand mb-2" id="statusRoomTitle">—</h6>
                <p class="small text-muted-brand mb-2" id="statusRoomDesc">—</p>
              </div>
            </div>
          </div>
          <div class="soft-card p-4 reservation-status-panel">
            <h5 class="text-brand mb-3">Stay &amp; event details</h5>
            <div class="row g-3">
              <div class="col-md-6"><strong>Check-in / event date:</strong> <span id="statusCheckIn">—</span></div>
              <div class="col-md-6"><strong>Check-out:</strong> <span id="statusCheckOut">—</span></div>
              <div class="col-md-6"><strong>Event time:</strong> <span id="statusEventTime">—</span></div>
              <div class="col-md-6"><strong>Guests:</strong> <span id="statusGuests">—</span></div>
              <div class="col-md-6"><strong>Duration:</strong> <span id="statusNights">—</span></div>
              <div class="col-md-6"><strong>Motif / theme:</strong> <span id="statusMotif">—</span></div>
              <div class="col-12"><strong>Add-ons:</strong> <span id="statusAddOns">—</span></div>
              <div class="col-12"><strong>Special requests:</strong> <span id="statusSpecialRequests">—</span></div>
              <div class="col-md-6"><strong>Date reserved:</strong> <span id="reservationDateReserved">—</span></div>
              <div class="col-md-6"><strong>Proof of payment:</strong> <span id="reservationProofText">No proof uploaded yet.</span></div>
            </div>
          </div>
          <div class="soft-card p-4 reservation-status-panel d-none" id="statusQuotationPanel">
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h5 class="text-brand mb-0">Official quotation</h5>
              <span id="statusQuotationStatus" class="status-chip chip-yellow">—</span>
            </div>
            <div id="statusQuotationBreakdown"></div>
            <a href="#" id="statusQuotationLink" class="btn btn-sm btn-outline-primary mt-3">Open full quotation</a>
          </div>
          <div class="soft-card p-4 reservation-status-panel d-none" id="statusCheckoutPanel">
            <h5 class="text-brand mb-3">Check out</h5>
            <p class="small text-muted-brand mb-3" id="statusCheckoutInfo">—</p>
            <button type="button" id="statusCheckoutBtn" class="btn btn-brand btn-sm">
              <i class="bi bi-door-open me-1"></i>Check out now
            </button>
          </div>
          <div class="soft-card p-4 reservation-status-panel d-none" id="statusActionPanel">
            <h5 class="text-brand mb-3">Manage booking</h5>
            <p class="small text-muted-brand mb-3">You can edit or request a reschedule before payment is verified.</p>
            <div class="d-flex flex-wrap gap-2">
              <a href="#" id="statusEditBtn" class="btn btn-outline-primary btn-sm">Edit reservation</a>
              <a href="#" id="statusRescheduleBtn" class="btn btn-outline-secondary btn-sm">Request reschedule</a>
            </div>
          </div>
          <div class="soft-card p-4 reservation-status-panel d-none" id="statusCancelPanel">
            <h5 class="text-brand mb-3">Cancel booking</h5>
            <p class="small text-muted-brand mb-3" id="statusCancelInfo">Changed your mind? You can cancel this reservation.</p>
            <button type="button" id="statusCancelBtn" class="btn btn-outline-danger btn-sm">
              <i class="bi bi-x-circle me-1"></i>Cancel booking
            </button>
          </div>
          <div class="soft-card p-4 reservation-status-panel d-none" id="statusCancelledPanel">
            <h5 class="text-danger mb-2"><i class="bi bi-x-circle me-1"></i>Booking cancelled</h5>
            <p class="small text-muted-brand mb-0" id="statusCancelledInfo">—</p>
          </div>
        </div>
        <div class="col-lg-4 reservation-status-side">
          <div class="soft-card p-4 mb-4 reservation-status-action-card">
            <h5 class="text-brand">Payment Status</h5>
            <div class="small mb-2">Current: <span id="reservationPaymentStatusChip" class="status-chip">Pending Payment</span></div>
            <ul class="small text-muted-brand ps-3 payment-status-list mb-0">
              <li>Pending Payment — reservation created</li>
              <li>Waiting for Verification — proof submitted</li>
              <li>Approved / Verified — payment approved by admin</li>
              <li>Rejected — upload a valid receipt again</li>
            </ul>
            <div id="reservationReceiptWrap" class="d-none mt-3">
              <button type="button" id="downloadReceiptBtn" class="btn btn-brand w-100">
                <i class="bi bi-receipt me-2"></i>Download Receipt
              </button>
              <small class="text-muted-brand d-block mt-2">Receipt becomes available after payment approval.</small>
            </div>
            <div id="statusQuickNav" class="d-flex flex-column gap-2 mt-3"></div>
          </div>
          <div class="soft-card p-4 reservation-status-payment-card">
            <h5 class="text-brand">Payment summary</h5>
            <div class="d-flex justify-content-between small"><span>Package subtotal</span><span id="statusPaySubtotal">—</span></div>
            <div class="d-flex justify-content-between small d-none" id="statusPayAddOnsRow"><span>Add-ons</span><span id="statusPayAddOns">—</span></div>
            <hr><div class="d-flex justify-content-between"><strong>Total package price</strong><strong id="statusPayTotal">—</strong></div>
            <div class="d-flex justify-content-between small mt-2"><span>Downpayment (<span id="statusDownpaymentPercent">50</span>%)</span><span id="statusDownpaymentAmount">—</span></div>
            <div class="d-flex justify-content-between small text-muted-brand"><span>Balance due before <span id="statusBalanceLabel">check-in</span></span><span id="statusBalanceAmount">—</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>
  <div id="site-footer"></div>
  <script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../js/duration-pricing.js?v=20260924d"></script>
  <script src="../js/booking-data.js?v=20260924d"></script>
  <script src="../js/main.js?v=20260925a"></script>
  <script>renderNavbar(""); renderFooter();</script>
</body>
</html>

@endverbatim
