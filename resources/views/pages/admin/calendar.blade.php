@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking calendar - Casa Vergara Admin</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../../css/style.css?v=20260926c" rel="stylesheet">
  <link href="../../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../../css/laravel-ui.css?v=20261018b" rel="stylesheet">
  <link href="../../css/admin-modern.css?v=20261018a" rel="stylesheet">
</head>
<body class="booking-cal-body">
  <div class="admin-wrap admin-page booking-cal-wrap">
    <div id="admin-sidebar"></div>

    <main class="admin-main booking-cal-main">
      <header class="booking-cal-topbar">
        <div class="booking-cal-topbar-left">
          <div>
            <h1 class="booking-cal-title">Booking calendar</h1>
            <p class="booking-cal-subtitle mb-0">Month view · live from guest reservations + manual holds</p>
          </div>
        </div>
        <div class="booking-cal-topbar-center">
          <div class="booking-cal-month-nav">
            <button type="button" class="booking-cal-icon-btn" id="calendarPrevBtn" aria-label="Previous month"><i class="bi bi-chevron-left"></i></button>
            <span class="booking-cal-month-label" id="calendarMonthLabel">March 2026</span>
            <button type="button" class="booking-cal-icon-btn" id="calendarNextBtn" aria-label="Next month"><i class="bi bi-chevron-right"></i></button>
          </div>
          <button type="button" class="btn btn-sm btn-outline-secondary ms-2" id="bookingCalTodayBtn">Today</button>
        </div>
        <div class="booking-cal-topbar-right">
          <div class="btn-group booking-cal-view-toggle" role="group" aria-label="Calendar view">
            <input type="radio" class="btn-check" name="bookingCalView" id="bookingCalViewDefault" value="default" checked autocomplete="off">
            <label class="btn btn-outline-secondary btn-sm" for="bookingCalViewDefault">Default</label>
            <input type="radio" class="btn-check" name="bookingCalView" id="bookingCalViewHeatmap" value="heatmap" autocomplete="off">
            <label class="btn btn-outline-secondary btn-sm" for="bookingCalViewHeatmap">Heatmap</label>
          </div>
          <button type="button" class="btn btn-sm btn-outline-secondary" id="bookingCalRefreshBtn" title="Refresh"><i class="bi bi-arrow-clockwise"></i></button>
          <button type="button" class="btn btn-sm btn-outline-secondary" id="bookingCalExportBtn" title="Export JSON"><i class="bi bi-download"></i></button>
          <button type="button" class="btn btn-sm btn-brand" id="calendarAddBookingBtn"><i class="bi bi-plus-lg me-1"></i>Add booking</button>
        </div>
      </header>

      <div class="booking-cal-workspace">
        <aside class="booking-cal-aside" aria-label="Filters and mini calendar">
          <div class="booking-cal-card booking-cal-aside-block">
            <h2 class="booking-cal-aside-heading">Navigate</h2>
            <div class="booking-cal-mini-head">
              <button type="button" class="booking-cal-mini-nav" id="bookingCalMiniPrev" aria-label="Mini calendar previous month"><i class="bi bi-chevron-left"></i></button>
              <span id="bookingCalMiniMonthLabel" class="booking-cal-mini-month">April 2026</span>
              <button type="button" class="booking-cal-mini-nav" id="bookingCalMiniNext" aria-label="Mini calendar next month"><i class="bi bi-chevron-right"></i></button>
            </div>
            <div class="booking-cal-mini-dow" aria-hidden="true">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>
            <div class="booking-cal-mini-grid" id="bookingCalMiniGrid"></div>
          </div>

          <div class="booking-cal-card booking-cal-aside-block">
            <h2 class="booking-cal-aside-heading">Filters</h2>
            <div class="mb-3">
              <label class="form-label booking-cal-filter-label" for="calendarStatusFilter">Status</label>
              <select id="calendarStatusFilter" class="form-select form-select-sm booking-cal-select">
                <option value="all">All statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label booking-cal-filter-label" for="calendarBookingTypeFilter">Event type</label>
              <select id="calendarBookingTypeFilter" class="form-select form-select-sm booking-cal-select">
                <option value="all">All types</option>
                <option value="room">Room stay</option>
                <option value="event">Event</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label booking-cal-filter-label" for="calendarSpaceFilter">Space / room</label>
              <select id="calendarSpaceFilter" class="form-select form-select-sm booking-cal-select">
                <option value="all">All spaces</option>
              </select>
            </div>
            <div class="mb-0">
              <label class="form-label booking-cal-filter-label" for="calendarPaymentFilter">Payment</label>
              <select id="calendarPaymentFilter" class="form-select form-select-sm booking-cal-select">
                <option value="all">All payments</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div class="booking-cal-card booking-cal-aside-block booking-cal-legend-card">
            <h2 class="booking-cal-aside-heading">Legend</h2>
            <ul class="booking-cal-legend-list list-unstyled small mb-0">
              <li><span class="booking-cal-legend-swatch booking-cal-legend-swatch--confirmed"></span>Confirmed</li>
              <li><span class="booking-cal-legend-swatch booking-cal-legend-swatch--pending"></span>Pending</li>
              <li><span class="booking-cal-legend-swatch booking-cal-legend-swatch--cancelled"></span>Cancelled</li>
              <li><span class="booking-cal-legend-swatch booking-cal-legend-swatch--checkin"></span>Check-in day</li>
              <li><span class="booking-cal-legend-swatch booking-cal-legend-swatch--checkout"></span>Check-out day</li>
              <li><span class="booking-cal-legend-swatch booking-cal-legend-swatch--conflict"></span>Overlap / double booking</li>
              <li><span class="booking-cal-legend-swatch" style="background:#d96b1e;"></span>PH official holiday</li>
            </ul>
          </div>
        </aside>

        <section class="booking-cal-stage" aria-label="Month calendar">
          <div class="booking-cal-card booking-cal-grid-card">
            <div class="booking-cal-dow-row" aria-hidden="true">
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            <div class="booking-cal-main-grid" id="calendarGrid" aria-live="polite"></div>
          </div>
        </section>
      </div>
    </main>
  </div>

  <div class="modal fade" id="calendarBookingModal" tabindex="-1" aria-labelledby="calendarBookingModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content booking-cal-modal">
        <div class="modal-header border-0 pb-0">
          <div>
            <h5 class="modal-title booking-cal-modal-title" id="calendarBookingModalLabel">Day details</h5>
            <p class="text-muted-brand small mb-0" id="calendarSelectedDateText"></p>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body pt-2">
          <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <span class="small text-muted-brand">Reservations and manual calendar entries for this date.</span>
            <button type="button" class="btn btn-sm btn-brand" id="calendarShowAddFormBtn">Add booking</button>
          </div>
          <div id="calendarBookingList" class="d-grid gap-2 mb-3"></div>
          <div class="booking-cal-form-card d-none" id="calendarBookingFormWrap">
            <h6 class="text-brand mb-3" id="calendarFormTitle">Add booking</h6>
            <form id="calendarBookingForm" class="row g-3">
              <input type="hidden" id="calendarEditBookingId">
              <div class="col-md-6">
                <label for="calendarFormType" class="form-label small">Type</label>
                <select id="calendarFormType" class="form-select" required>
                  <option value="room">Room</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <div class="col-md-6">
                <label for="calendarFormTitleInput" class="form-label small">Room / event name</label>
                <input id="calendarFormTitleInput" type="text" class="form-control" placeholder="e.g. Deluxe Villa" required>
              </div>
              <div class="col-md-6">
                <label for="calendarFormDate" class="form-label small">Date</label>
                <input id="calendarFormDate" type="date" class="form-control" required>
              </div>
              <div class="col-md-6">
                <label for="calendarFormEndDate" class="form-label small">Check-out (rooms)</label>
                <input id="calendarFormEndDate" type="date" class="form-control">
              </div>
              <div class="col-md-4">
                <label for="calendarFormGuests" class="form-label small">Guests</label>
                <input id="calendarFormGuests" type="number" min="1" class="form-control" value="2">
              </div>
              <div class="col-md-4">
                <label for="calendarFormStatus" class="form-label small">Booking status</label>
                <select id="calendarFormStatus" class="form-select">
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div class="col-md-4">
                <label for="calendarFormPaymentStatus" class="form-label small">Payment</label>
                <select id="calendarFormPaymentStatus" class="form-select">
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div class="col-12">
                <label for="calendarFormNotes" class="form-label small">Notes</label>
                <textarea id="calendarFormNotes" class="form-control" rows="2" placeholder="Optional"></textarea>
              </div>
              <div class="col-12 d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-outline-secondary" id="calendarCancelFormBtn">Cancel</button>
                <button type="submit" class="btn btn-brand">Save booking</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../../js/main.js?v=20260926b"></script>
  <script src="../../js/duration-pricing.js?v=20260924d"></script>
  <script src="../../js/booking-data.js?v=20260924d"></script>
  <script src="../../js/ph-holidays.js?v=20260830i"></script>
  <script src="../../js/admin-calendar.js?v=20260830i"></script>
  <script>
    renderAdminSidebar("calendar");
    initAdminCalendarPage();
  </script>
</body>
</html>

@endverbatim
