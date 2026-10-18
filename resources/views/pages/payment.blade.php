@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Casa Vergara - Payment</title>
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
  <section class="section-pad bg-light payment-page">
    <div class="container">
      <a href="quotation.html" class="text-decoration-none small text-primary payment-back-link"><i class="bi bi-chevron-left"></i> Back to Quotation</a>
      <h1 class="display-6 fw-bold text-brand mt-2 mb-3 payment-title">Payment Instructions</h1>
      <div class="d-flex justify-content-center align-items-center gap-3 mb-4 payment-stepper">
        <div class="text-center">
          <span class="badge rounded-pill bg-secondary p-2">1</span><div class="small text-muted-brand mt-1">Room</div>
        </div>
        <div class="bg-secondary" style="height:3px;width:70px;"></div>
        <div class="text-center">
          <span class="badge rounded-pill bg-secondary p-2">2</span><div class="small text-muted-brand mt-1">Details</div>
        </div>
        <div class="bg-secondary" style="height:3px;width:70px;"></div>
        <div class="text-center">
          <span class="badge rounded-pill bg-warning p-2 text-dark">3</span><div class="small text-muted-brand mt-1">Upload Proof</div>
        </div>
      </div>
      <div class="row g-4 payment-layout">
        <div class="col-lg-8">
          <div class="soft-card p-4 mb-4 payment-panel">
            <h5 class="text-brand mb-3">Scan the Resort QR Code</h5>
            <div class="row g-4 align-items-center">
              <div class="col-md-5 text-center">
                <div class="payment-qr-wrap p-3 border rounded-4">

                  <img
                    id="paymentQrImage"
                    src=""
                    alt="Casa Vergara Resort payment QR code"
                    class="img-fluid payment-qr-image rounded-3 d-none"
                  >
                  <div id="paymentQrPlaceholder" class="text-muted-brand small py-5">
                    <i class="bi bi-qr-code d-block fs-1 mb-2"></i>
                    The resort's payment QR code is not available yet. Please contact us for payment details.
                  </div>
                </div>

                <small id="paymentQrLabel" class="text-muted-brand d-block mt-2">Accepted wallets: GCash and compatible e-wallet apps</small>
              </div>
              <div class="col-md-7">
                <h6 class="text-brand mb-3">How to pay</h6>
                <ol class="small text-muted-brand payment-instructions mb-0">
                  <li>Open your e-wallet app and tap <strong>Scan QR</strong>.</li>
                  <li>Scan the Casa Vergara Resort QR code.</li>
                  <li>Enter the exact amount shown in your booking summary.</li>
                  <li>Complete payment and save a screenshot or PDF receipt.</li>
                  <li>Upload the proof below to submit for admin verification.</li>
                </ol>
              </div>
            </div>
          </div>

          <div class="soft-card p-4 payment-panel">
            <div id="paymentTermsDoc"></div>
            <div class="form-check mb-3 mt-3">
              <input class="form-check-input" type="checkbox" id="paymentTermsAccept" required>
              <label class="form-check-label small" for="paymentTermsAccept">I have read and agree to the Terms &amp; Conditions above.</label>
            </div>
          </div>

          <div class="soft-card p-4 payment-panel" id="paymentUploadPanel">
            <h5 class="text-brand mb-3">Upload Proof of Payment</h5>
            <p class="small text-muted-brand mb-3" id="paymentTermsGateHint">Accept the Terms &amp; Conditions above to enable payment upload.</p>
            <form id="proofUploadForm" novalidate>
              <div class="mb-3">
                <label for="proofFile" class="form-label fw-semibold">Payment Receipt File</label>
                <input id="proofFile" name="proofFile" type="file" class="form-control" required>
                <small id="proofFileName" class="text-muted-brand d-block mt-2">No file chosen</small>
              </div>
              <div class="payment-upload-note small text-muted-brand rounded-3 p-3 mb-3">
                <div class="fw-semibold text-brand mb-1">Upload rules</div>
                <ul class="mb-0 ps-3">
                  <li>All file types are supported (photos, PDF, Word, Excel, and more)</li>
                  <li>Maximum file size: 5MB</li>
                  <li>Files are validated before submission</li>
                </ul>
              </div>
              <button type="submit" class="btn btn-brand w-100" id="proofSubmitBtn" disabled>Submit Proof of Payment</button>
              <div id="proofUploadMessage" aria-live="polite"></div>
            </form>
          </div>
        </div>
        <div class="col-lg-4 payment-summary-col">
          <div class="soft-card p-4 mb-3 payment-summary-card">
            <h5 class="text-brand">Official quotation</h5>
            <p class="small text-muted-brand">Payment must match the accepted quotation total below.</p>
            <div id="paymentQuotationBreakdown" class="mb-3"></div>
            <hr>
            <h5 class="text-brand">Payment summary</h5>
            <hr>
            <div class="d-flex justify-content-between small mb-1"><span>Reservation ID</span><strong id="paymentReservationId">—</strong></div>
            <div class="d-flex justify-content-between small mb-1"><span>Package</span><span id="payRoomName" class="text-end ps-2">—</span></div>
            <div class="d-flex justify-content-between small mb-1"><span id="payNightsLabel">Stay</span><span id="payLineNights">—</span></div>
            <div class="d-flex justify-content-between small mb-1"><span>Subtotal</span><span id="paySubtotal">—</span></div>
            <div class="d-flex justify-content-between small mb-1 d-none" id="payAddOnsRow"><span>Add-ons</span><span id="payAddOns">—</span></div>
            <div id="payDetailLines" class="small text-muted-brand mb-2"></div>
            <hr>
            <div class="d-flex justify-content-between small mb-1"><span>Total package price</span><span id="payPackageTotal">—</span></div>
            <div class="d-flex justify-content-between small text-muted-brand mb-2"><span>Balance due later</span><span id="payBalanceDue">—</span></div>
            <div class="d-flex justify-content-between mb-2"><strong>Downpayment to Pay Now (<span id="payDownpaymentPercent">50</span>%)</strong><strong class="text-brand" id="payTotal">—</strong></div>
            <div class="small">Payment Status: <span class="status-chip chip-yellow">Pending Payment</span></div>
          </div>
          <div class="soft-card p-3 payment-note-card" style="background:#eef6fd;border-color:#d5e9fa;">
            <div class="d-flex gap-2 align-items-start">
              <i class="bi bi-shield-check text-primary"></i>
              <div>
                <div class="fw-semibold text-brand small">Manual Verification</div>
                <small class="text-muted-brand">After upload, status changes to <strong>Waiting for Verification</strong>. Admin will approve or reject after review.</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  <div id="site-footer"></div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../js/duration-pricing.js?v=20260924d"></script>
  <script src="../js/booking-data.js?v=20260924d"></script>
  <script src="../js/main.js?v=20260925a"></script>
  <script src="../js/legal-doc.js?v=20260830i"></script>
  <script>renderNavbar("booking"); renderFooter();</script>
</body>
</html>

@endverbatim
