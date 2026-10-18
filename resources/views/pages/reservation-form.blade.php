@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Casa Vergara - Reservation Details</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../css/style.css?v=20261004f" rel="stylesheet">
  <link href="../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../css/laravel-ui.css?v=20261018b" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
</head>
<body>
  <div id="site-navbar"></div>
  <section class="section-pad bg-light reservation-form-page">
    <div class="container">
      <a href="booking.html" class="text-decoration-none small text-primary reservation-back-link"><i class="bi bi-arrow-left"></i> Back to booking</a>
      <h1 class="display-6 fw-bold text-brand mt-2 mb-2 reservation-title">Complete Your Reservation</h1>
      <p class="text-muted-brand small mb-4" id="reservationFlowHint">Review your selected package and enter your details below.</p>

      <div id="reservationFormAlert" class="alert d-none mb-4" role="alert"></div>
      <div id="reservationModeBanner" class="alert alert-info d-none mb-4" role="status"></div>
      <div id="reservationNoPending" class="alert alert-warning d-none">
        No package or event selected. <a href="booking.html">Return to bookings</a> to choose a room or event.
      </div>

      <div class="row g-4 reservation-layout" id="reservationFormLayout">
        <div class="col-lg-8">
          <div class="soft-card p-4 mb-4 reservation-panel" id="selectedPackagePanel">
            <h4 class="text-brand mb-3">Selected package</h4>
            <div class="row g-3 align-items-start">
              <div class="col-sm-4">
                <img id="summaryPackageImage" src="" alt="" class="img-fluid rounded-3 shadow-sm w-100" style="max-height:180px;object-fit:cover;">
              </div>
              <div class="col-sm-8">
                <h5 class="text-brand mb-1" id="summaryPackageTitle">—</h5>
                <p class="small text-muted-brand mb-2" id="summaryPackageTagline"></p>
                <p class="small mb-2" id="summaryPackageDescription"></p>
                <div class="small text-muted-brand" id="summaryPackageMeta"></div>
                <div class="mt-2 small" id="summaryPackageInclusions"></div>
              </div>
            </div>
          </div>

          <div class="soft-card p-4 mb-4 reservation-panel d-none" id="eventSummaryPanel">
            <h4 class="text-brand mb-3">Event details</h4>
            <ul class="list-unstyled small mb-0" id="eventSummaryList"></ul>
          </div>

          <div class="soft-card p-4 mb-4 reservation-panel">
            <h4 class="text-brand mb-3">Guest information</h4>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label" for="resFirstName">First name <span class="text-danger">*</span></label>
                <input id="resFirstName" class="form-control" placeholder="Juan" autocomplete="given-name" required>
              </div>
              <div class="col-md-6">
                <label class="form-label" for="resLastName">Last name <span class="text-danger">*</span></label>
                <input id="resLastName" class="form-control" placeholder="Dela Cruz" autocomplete="family-name" required>
              </div>
              <div class="col-md-6">
                <label class="form-label" for="resEmail">Email <span class="text-danger">*</span></label>
                <input id="resEmail" type="email" class="form-control" placeholder="you@example.com" autocomplete="email" required>
              </div>
              <div class="col-md-6">
                <label class="form-label" for="resPhone">Contact number <span class="text-danger">*</span></label>
                <input id="resPhone" type="tel" class="form-control" placeholder="+63 900 000 0000" autocomplete="tel" required>
              </div>
            </div>
          </div>

          <input type="hidden" id="resEventTime" value="">

          <div class="soft-card p-4 mb-4 reservation-panel" id="packageOptionsPanel">
            <h4 class="text-brand mb-2">Package options &amp; add-ons</h4>
            <p class="small text-muted-brand mb-3" id="packageOptionsIntro">Included features and optional paid add-ons for your selected package.</p>
            <div id="packageInclusionsList" class="small mb-3"></div>
            <div id="packageAddOnsList" class="vstack gap-2"></div>
          </div>

          <div class="soft-card p-4 reservation-panel" id="stayDetailsPanel">
            <h4 class="text-brand mb-3">Stay details</h4>
            <p class="small text-muted-brand mb-3" id="stayDatesHint">Choose your arrival date and time. Your check-out time follows automatically — exactly 3, 12, or 24 hours after check-in — so the full duration is always fulfilled. See the schedule below.</p>
            <p class="small text-muted-brand mb-3 d-none" id="eventStayDateHint"></p>
            <div class="row g-4 align-items-start" id="stayDetailsFieldsRow">
              <div class="col-md-6" id="resGuestCountWrap">
                <label class="form-label" for="resGuestCount">Number of guests <span class="text-danger">*</span></label>
                <input id="resGuestCount" type="number" min="1" class="form-control" value="2">
              </div>
              <div class="col-12 d-none" id="eventDateRescheduleWrap">
                <label class="form-label">Event date <span class="text-danger">*</span></label>
                <p class="small text-muted-brand mb-2">Select a new date. Dates with an existing event booking cannot be selected.</p>
                <input type="hidden" id="resEventDate" value="">
                <div id="cvrEventRescheduleMount" class="cvr-fp-mount rounded-3 border bg-white"></div>
              </div>
              <div class="col-12" id="roomDateCalendarsWrap">
                <div class="cvr-stay-calendars-wrap">
                  <div class="cvr-cal-pair-grid" role="group" aria-label="Stay dates">
                    <div class="cvr-date-col">
                      <label class="form-label cvr-date-label mb-2">Arrival date <span class="text-danger">*</span></label>
                      <input type="hidden" id="resCheckIn" name="checkIn" value="" required>
                      <div id="cvrFpCheckInMount" class="cvr-fp-mount rounded-3 border bg-white"></div>
                    </div>
                    <div class="cvr-date-col d-none">
                      <input type="hidden" id="resCheckOut" name="checkOut" value="" required>
                      <div id="cvrFpCheckOutMount" class="cvr-fp-mount rounded-3 border bg-white"></div>
                    </div>
                  </div>
                  <div class="cvr-calendar-legend d-flex flex-wrap align-items-center justify-content-center justify-content-md-start gap-3 small text-muted-brand">
                    <span class="d-inline-flex align-items-center gap-2"><span class="cvr-legend-swatch cvr-legend-available"></span> Available</span>
                    <span class="d-inline-flex align-items-center gap-2"><span class="cvr-legend-swatch cvr-legend-booked"></span> Booked (not selectable)</span>
                    <span class="d-inline-flex align-items-center gap-2"><span class="cvr-legend-swatch cvr-legend-blocked"></span> Blocked / maintenance</span>
                    <span class="d-inline-flex align-items-center gap-2"><span class="cvr-legend-swatch cvr-legend-holiday"></span> PH holiday</span>
                  </div>
                </div>
              </div>
              <div class="col-md-6" id="cvrResCheckInTimeWrap">
                <label class="form-label cvr-time-label-row mb-2" for="cvrResCheckInHour">Arrival time <span class="cvr-time-flex-badge">Flexible</span></label>
                <div class="cvr-time-picker-group" role="group" aria-label="Preferred arrival time">
                  <select id="cvrResCheckInHour" class="form-select" aria-label="Arrival hour">
                    <option value="" selected>Hr</option>
                    <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                    <option value="4">4</option><option value="5">5</option><option value="6">6</option>
                    <option value="7">7</option><option value="8">8</option><option value="9">9</option>
                    <option value="10">10</option><option value="11">11</option><option value="12">12</option>
                  </select>
                  <span class="cvr-time-picker-sep">:</span>
                  <select id="cvrResCheckInMinute" class="form-select" aria-label="Arrival minute">
                    <option value="" selected>Min</option>
                    <option value="0">00</option>
                    <option value="15">15</option>
                    <option value="30">30</option>
                    <option value="45">45</option>
                  </select>
                  <select id="cvrResCheckInMeridiem" class="form-select" aria-label="Arrival AM or PM">
                    <option value="" selected>--</option>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
                <small class="text-muted-brand d-block mt-1" id="cvrResCheckInTimeHint">Pick your own arrival time, or leave blank to use the default. Check-out shifts with it to fulfill the full duration.</small>
                <div class="small text-danger mt-1 d-none" id="cvrResCheckInTimeError"></div>
              </div>
              <div class="col-md-6" id="resCheckOutTimeWrap">
                <label class="form-label mb-2">Fixed schedule</label>
                <input type="hidden" id="resCheckOutTime" name="checkOutTime" value="">
                <div class="alert alert-secondary py-2 px-3 mb-1" id="resFixedScheduleBox">
                  <div class="fw-semibold text-brand" id="resDurationLabel">—</div>
                  <div class="small" id="resScheduleTimes">—</div>
                </div>
                <p class="small text-danger mb-0" id="resOvertimePolicy"><i class="bi bi-alarm me-1"></i>This check-in/out time is strict. Staying past check-out is billed as overtime at 10% of the total per hour late (rounded up), capped at 100% of the total.</p>
              </div>
              <div class="col-12">
                <label class="form-label" for="resSpecialRequests">Special requests &amp; setup preferences</label>
                <textarea id="resSpecialRequests" class="form-control" rows="4" placeholder="Additional decorations, dietary needs, accessibility, late arrival, custom motif details, etc."></textarea>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-4 reservation-summary-col">
          <div class="soft-card p-4 position-sticky reservation-summary-card" style="top:90px;">
            <h4 class="text-brand">Booking summary</h4>
            <hr>
            <p class="mb-1 fw-semibold" id="summarySidebarTitle">—</p>
            <p class="small text-muted-brand mb-2" id="summarySidebarDates">—</p>
            <div id="summaryAddOnsLines" class="small mb-2"></div>
            <div class="d-flex justify-content-between small"><span>Package subtotal</span><span id="summaryLineRoom">—</span></div>
            <div class="d-flex justify-content-between small d-none" id="summaryLineAddOnsRow"><span>Add-ons</span><span id="summaryLineAddOns">—</span></div>
            <hr>
            <div class="d-flex justify-content-between align-items-center mb-3">
              <strong>Total</strong>
              <span class="h4 mb-0 text-warning" id="summaryLineTotal">—</span>
            </div>
            <button id="submitReservationBtn" type="button" class="btn btn-brand w-100 py-2">Review &amp; confirm</button>
            <small class="d-block text-center text-muted-brand mt-2">You will review all details before payment</small>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="modal fade" id="reservationConfirmModal" tabindex="-1" aria-labelledby="reservationConfirmModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable modal-fullscreen-sm-down">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title text-brand" id="reservationConfirmModalLabel">Confirm your reservation</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p class="small text-muted-brand">Please review every detail below. You can go back to make changes before proceeding to payment.</p>
          <div id="resConfirmChangeSummary" class="alert alert-warning d-none small mb-3" role="status"></div>
          <div id="resConfirmSummaryBody" class="res-confirm-summary"></div>
        </div>
        <div class="modal-footer flex-wrap gap-2">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Go back &amp; edit</button>
          <button type="button" class="btn btn-brand" id="resConfirmProceedBtn">Confirm &amp; view quotation</button>
        </div>
      </div>
    </div>
  </div>

  <div id="site-footer"></div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../js/duration-pricing.js?v=20260924d"></script>
  <script src="../js/booking-data.js?v=20260924d"></script>
  <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
  <script src="../js/ph-holidays.js?v=20260830i"></script>
  <script src="../js/reservation-calendar.js?v=20260830i"></script>
  <script src="../js/main.js?v=20260925a"></script>
  <script>
    (async () => {

      await window.CVRBookingCatalog?.catalogReady;
      renderNavbar("booking");
      renderFooter();
      initReservationFormPage();
    })();
  </script>
</body>
</html>
@endverbatim
