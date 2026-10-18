@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Casa Vergara - User Manual</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../css/style.css?v=20261004f" rel="stylesheet">
  <link href="../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../css/laravel-ui.css?v=20261018b" rel="stylesheet">
  <link href="../css/casa-refresh.css?v=20261018a" rel="stylesheet">
  <style>
    html { scroll-behavior: smooth; scroll-padding-top: 6rem; }
    .man-hero { text-align: center; max-width: 46rem; margin: 0 auto 2rem; }
    .man-actions { display: flex; gap: .6rem; justify-content: center; flex-wrap: wrap; margin-top: 1.2rem; }
    .man-roles { display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 1rem; margin-bottom: 2.5rem; }
    .man-role { display: flex; gap: .9rem; padding: 1.1rem 1.2rem; text-decoration: none; border-top: 3px solid var(--rc, var(--secondary)); transition: transform .2s, box-shadow .2s; }
    .man-role:hover { transform: translateY(-3px); box-shadow: var(--ui-shadow-hover); }
    .man-role i { font-size: 1.6rem; color: var(--rc, var(--secondary)); }
    .man-role b { display: block; color: var(--primary); font-family: "Playfair Display", serif; font-size: 1.1rem; }
    .man-role span { font-size: .88rem; color: var(--text); }
    .man-layout { display: grid; grid-template-columns: 15rem 1fr; gap: 2rem; align-items: start; }
    .man-toc { position: sticky; top: 6rem; padding: 1.1rem; max-height: calc(100vh - 8rem); overflow: auto; }
    .man-toc h6 { font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; color: var(--secondary); margin: .2rem 0 .5rem; }
    .man-toc ul { list-style: none; padding: 0; margin: 0 0 1rem; }
    .man-toc a { display: block; padding: .32rem .6rem; border-radius: .5rem; font-size: .88rem; color: var(--text); text-decoration: none; border-left: 2px solid transparent; }
    .man-toc a:hover, .man-toc a.active { background: rgba(50,139,195,.1); color: var(--primary); border-left-color: var(--accent); }
    .man-band { display: flex; align-items: center; gap: .8rem; margin: 2.2rem 0 1.2rem; }
    .man-band:first-child { margin-top: 0; }
    .man-band h2 { font-family: "Playfair Display", serif; color: var(--primary); margin: 0; font-size: 1.7rem; }
    .man-band i { width: 2.6rem; height: 2.6rem; border-radius: .8rem; display: grid; place-items: center; background: var(--primary); color: var(--accent); font-size: 1.3rem; }
    .man-step { padding: 1.5rem; margin-bottom: 1.2rem; }
    .man-step-head { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .man-num { flex: none; width: 2.5rem; height: 2.5rem; border-radius: 50%; display: grid; place-items: center; background: linear-gradient(135deg, #e6c43a, #b8920c); color: var(--primary); font-weight: 700; }
    .man-h2 { font-family: "Playfair Display", serif; font-size: 1.3rem; color: var(--primary); margin: 0 0 .2rem; }
    .man-h2 i { color: var(--secondary); margin-right: .3rem; }
    .man-step-body { display: grid; grid-template-columns: 1fr 1fr; gap: 1.4rem; align-items: start; }
    .man-step-body:not(:has(figure)) { grid-template-columns: 1fr; }
    .man-sub { font-size: .75rem; letter-spacing: .08em; text-transform: uppercase; color: var(--secondary); font-family: Inter, sans-serif; margin-bottom: .5rem; }
    .man-dirs { padding-left: 1.2rem; margin: 0 0 1rem; }
    .man-dirs li { margin-bottom: .5rem; line-height: 1.55; }
    .man-dirs li::marker { color: var(--accent); font-weight: 700; }
    .man-tip { display: flex; gap: .7rem; padding: .8rem 1rem; border-radius: .8rem; background: #fdf8e3; border-left: 3px solid var(--accent); font-size: .9rem; }
    .man-tip i { color: #b8920c; }
    .man-fig { margin: 0; }
    .man-fig img { width: 100%; height: auto; border-radius: .8rem; border: 1px solid var(--ui-border-strong); box-shadow: var(--ui-shadow-soft); }
    .man-fig figcaption { font-size: .8rem; color: #6b7a90; margin-top: .4rem; text-align: center; }
    .man-table { width: 100%; font-size: .9rem; }
    .man-table th { background: var(--primary); color: #fff; font-weight: 600; }
    .man-faq { border: 1px solid var(--ui-border-strong); border-radius: .8rem; padding: .8rem 1rem; margin-bottom: .6rem; background: #fff; }
    .man-faq summary { cursor: pointer; font-weight: 600; color: var(--primary); }
    .man-faq p { margin: .6rem 0 0; }
    .man-help { text-align: center; padding: 2rem; margin-top: 2rem; background: linear-gradient(135deg, var(--primary), #14527f); color: #fff; }
    .man-help h3 { font-family: "Playfair Display", serif; color: #fff; }
    @media (max-width: 991px) { .man-layout { grid-template-columns: 1fr; } .man-toc { display: none; } .man-step-body { grid-template-columns: 1fr; } }
    @media print { #site-navbar, #site-footer, .man-toc, .man-actions, #liveChatWidget { display: none !important; } .man-layout { display: block; } .man-step { break-inside: avoid; box-shadow: none; } }
  </style>
</head>
<body>
  <div id="site-navbar"></div>

  <header class="legal-hero">
    <div class="container">
      <div class="legal-shell">
        <nav aria-label="Breadcrumb" class="legal-rise" style="--i:0">
          <ol class="legal-crumbs">
            <li><a href="landing.html">Home</a></li>
            <li aria-current="page">User Manual</li>
          </ol>
        </nav>
        <h1 class="legal-rise" style="--i:1">User Manual</h1>
        <p class="legal-hero-lead legal-rise" style="--i:2">A step-by-step guide to using the Casa Vergara Resort reservation system, with screenshots and simple directions for guests, staff and administrators.</p>
        <div class="legal-switch legal-rise" style="--i:3">
          <a href="user-manual.html" aria-current="page"><i class="bi bi-book" aria-hidden="true"></i>User Manual</a>
          <a href="sitemap.html"><i class="bi bi-diagram-3" aria-hidden="true"></i>Site Map</a>
          <a href="terms.html"><i class="bi bi-file-earmark-text" aria-hidden="true"></i>Terms &amp; Conditions</a>
          <a href="privacy.html"><i class="bi bi-shield-check" aria-hidden="true"></i>Privacy Policy</a>
        </div>
      </div>
    </div>
  </header>

  <div class="legal-main">
    <div class="legal-shell">
      <div class="container">
        <div class="man-actions mb-4">
          <a href="#guest" class="btn btn-brand"><i class="bi bi-play-circle me-1"></i>Start with the guest guide</a>
          <button type="button" class="btn btn-outline-brand" onclick="window.print()"><i class="bi bi-printer me-1"></i>Print / Save as PDF</button>
        </div>

      <div class="man-roles">
        <a class="soft-card man-role" href="#guest" style="--rc:var(--secondary)"><i class="bi bi-person-check"></i><div><b>I'm a guest</b><span>Register, book, pay and track a stay or event.</span></div></a>
        <a class="soft-card man-role" href="#staff" style="--rc:#1f9d76"><i class="bi bi-person-workspace"></i><div><b>I'm staff</b><span>Manage reservations, calendar, chat and messages.</span></div></a>
        <a class="soft-card man-role" href="#a-pay" style="--rc:#7a4fbf"><i class="bi bi-shield-lock"></i><div><b>I'm an admin</b><span>Verify payments, manage users, content and settings.</span></div></a>
      </div>

      <div class="man-layout">
        <aside class="soft-card man-toc" aria-label="On this page">
          <h6>Guests</h6><ul><li><a href="#register">Create your account</a></li><li><a href="#login">Sign in</a></li><li><a href="#browse">Find a room or event</a></li><li><a href="#details">Complete your reservation details</a></li><li><a href="#quotation">Review and accept your quotation</a></li><li><a href="#payment">Pay the downpayment and upload proof</a></li><li><a href="#status">Track your reservation</a></li><li><a href="#dashboard">Use your dashboard</a></li><li><a href="#settings">Update your profile and password</a></li><li><a href="#help">Get help</a></li></ul>
          <h6>Staff &amp; Admin</h6><ul><li><a href="#a-roles">Roles and access</a></li><li><a href="#a-dash">Dashboard and reports</a></li><li><a href="#a-res">Reservations and quotations</a></li><li><a href="#a-cal">Booking calendar</a></li><li><a href="#a-pay">Payment verification</a></li><li><a href="#a-chat">Live chat and messages</a></li><li><a href="#a-content">Site content, users and settings</a></li></ul>
          <h6>Support</h6><ul><li><a href="#faq">Troubleshooting</a></li></ul>
        </aside>

        <main>
          <article class="soft-card man-step" id="overview">
            <div class="man-step-head"><span class="man-num"><i class="bi bi-house-heart"></i></span><div><h2 class="man-h2">How the system works</h2><p class="text-muted-brand mb-0">Book, pay, get confirmed — all online.</p></div></div>
            <div class="man-step-body">
              <div class="man-text">
                <ol class="man-dirs">
                  <li><b>Create an account</b> and verify your email.</li>
                  <li><b>Choose</b> a room or event and your dates.</li>
                  <li><b>Accept the quotation</b> and pay the 50% downpayment by e-wallet.</li>
                  <li><b>Upload your receipt.</b> The resort verifies it and confirms your booking.</li>
                </ol>
                <div class="man-tip"><i class="bi bi-lightbulb"></i><div>Works on phones, tablets and computers. Use an up-to-date browser and keep a working email address handy.</div></div>
              </div>
              <figure class="man-fig"><img src="../images/manual/home.jpg" alt="Casa Vergara home page" loading="lazy" width="1000"><figcaption>Figure 1. The home page. Use the top menu: Home, About Us, Booking, FAQs, Contacts.</figcaption></figure>
            </div>
          </article>

          <div class="man-band" id="guest"><i class="bi bi-person-check"></i><h2>Guest guide</h2></div>
          <article class="soft-card man-step" id="register"><div class="man-step-head"><span class="man-num">1</span><div><h2 class="man-h2"><i class="bi bi-person-plus"></i> Create your account</h2><p class="text-muted-brand mb-0">Everything starts with a free guest account.</p></div></div><div class="man-step-body"><div class="man-text"><h3 class="man-sub">Directions</h3><ol class="man-dirs"><li>Open <b>Log in</b> at the top right, then choose <b>Create Account</b> (or go to the Register page).</li><li>Enter your first name, last name, email, contact number and a password of at least 6 characters.</li><li>Tick <b>I agree to the Terms &amp; Conditions and Privacy Policy</b>, then press <b>Create Account</b>.</li><li>Check your email for a <b>6-digit code</b> and type it into <b>Verify Account</b>. Press <b>Verify Account</b> to finish.</li></ol><div class="man-tip"><i class="bi bi-lightbulb"></i><div>No code? Look in your Spam folder, or press <b>Resend code</b>. Typed the wrong email? Use <b>Use a different email</b>.</div></div></div><figure class="man-fig"><img src="../images/manual/register.jpg" alt="Register page: fill in your details, then verify with the emailed code." loading="lazy" width="1000"><figcaption>Figure 1. Register page: fill in your details, then verify with the emailed code.</figcaption></figure></div></article><article class="soft-card man-step" id="login"><div class="man-step-head"><span class="man-num">2</span><div><h2 class="man-h2"><i class="bi bi-box-arrow-in-right"></i> Sign in (and reset a forgotten password)</h2><p class="text-muted-brand mb-0">Sign in whenever you want to book, pay or check a reservation.</p></div></div><div class="man-step-body"><div class="man-text"><h3 class="man-sub">Directions</h3><ol class="man-dirs"><li>Press <b>Log in</b>, enter your email and password, then press <b>Sign In</b>.</li><li>Tick <b>Remember me</b> only on your own device.</li><li>Forgot your password? Press <b>Forgot password?</b>, enter your email, type the 6-digit code we send, then set a new password.</li></ol><div class="man-tip"><i class="bi bi-lightbulb"></i><div>After several wrong passwords the account is locked for a few minutes. Wait, or reset your password instead.</div></div></div><figure class="man-fig"><img src="../images/manual/login.jpg" alt="Sign-in page with Remember me and Forgot password." loading="lazy" width="1000"><figcaption>Figure 2. Sign-in page with Remember me and Forgot password.</figcaption></figure></div></article><article class="soft-card man-step" id="browse"><div class="man-step-head"><span class="man-num">3</span><div><h2 class="man-h2"><i class="bi bi-door-open"></i> Find a room or event</h2><p class="text-muted-brand mb-0">Use the <b>Booking</b> page to check what is free on your dates.</p></div></div><div class="man-step-body"><div class="man-text"><h3 class="man-sub">Directions</h3><ol class="man-dirs"><li>Open <b>Booking</b> in the top menu.</li><li>Choose a <b>Booking Type</b>: <b>Room Stay</b> or <b>Event Reservation</b>.</li><li>Pick your <b>Check-in Date</b> and a <b>Stay Duration</b>: 3-Hours, 12-Hours, 24-Hours or Multi-Day (2+ nights). Optionally set your own check-in time.</li><li>Press <b>Search</b>, open any room card to see photos, inclusions and rates, then press <b>Book Now</b>.</li><li>For events, also choose the <b>Event Type</b> (Birthday, Reunion, Team Building or Others), number of guests and a preferred date.</li></ol><div class="man-tip"><i class="bi bi-lightbulb"></i><div>On the date picker, dates marked <b>Event booked</b>, <b>Blocked</b> or <b>PH holiday</b> cannot be chosen. Staying past check-out is billed as overtime.</div></div></div><figure class="man-fig"><img src="../images/manual/booking.jpg" alt="The Booking page: type, date, duration, then Search." loading="lazy" width="1000"><figcaption>Figure 3. The Booking page: type, date, duration, then Search.</figcaption></figure></div></article><article class="soft-card man-step" id="details"><div class="man-step-head"><span class="man-num">4</span><div><h2 class="man-h2"><i class="bi bi-journal-check"></i> Complete your reservation details</h2><p class="text-muted-brand mb-0">Tell us who is coming and what you need.</p></div></div><div class="man-step-body"><div class="man-text"><h3 class="man-sub">Directions</h3><ol class="man-dirs"><li>Check the <b>Selected package</b> and <b>Booking summary</b>.</li><li>Fill in <b>Guest information</b>: name, email and contact number.</li><li>Enter the number of guests, arrival date and time, then choose any <b>add-ons</b> and special requests or setup preferences.</li><li>Press <b>Confirm your reservation</b> to receive your quotation.</li></ol><div class="man-tip"><i class="bi bi-lightbulb"></i><div>Check-in is 2:00 PM and check-out is 12:00 NN unless your package says otherwise.</div></div></div></div></article><article class="soft-card man-step" id="quotation"><div class="man-step-head"><span class="man-num">5</span><div><h2 class="man-h2"><i class="bi bi-receipt"></i> Review and accept your quotation</h2><p class="text-muted-brand mb-0">The quotation itemises your package, add-ons and totals.</p></div></div><div class="man-step-body"><div class="man-text"><h3 class="man-sub">Directions</h3><ol class="man-dirs"><li>Read the package, add-ons and <b>Total package price</b>.</li><li>Note the <b>Downpayment due now</b> (50% of the total) and the <b>Balance due later</b>.</li><li>Press <b>Accept quotation</b> to hold your date, then <b>Proceed to payment</b>.</li></ol><div class="man-tip"><i class="bi bi-lightbulb"></i><div>If the resort revises the quotation, the totals update and you will be notified.</div></div></div><figure class="man-fig"><img src="../images/manual/quotation.jpg" alt="Quotation page showing totals, downpayment and balance." loading="lazy" width="1000"><figcaption>Figure 4. Quotation page showing totals, downpayment and balance.</figcaption></figure></div></article><article class="soft-card man-step" id="payment"><div class="man-step-head"><span class="man-num">6</span><div><h2 class="man-h2"><i class="bi bi-credit-card"></i> Pay the downpayment and upload proof</h2><p class="text-muted-brand mb-0">Payment is made by e-wallet, then verified by our team.</p></div></div><div class="man-step-body"><div class="man-text"><h3 class="man-sub">Directions</h3><ol class="man-dirs"><li>Open your e-wallet app (GCash or compatible), tap <b>Scan QR</b> and scan the resort QR code.</li><li>Enter the <b>exact downpayment</b> shown in the payment summary and complete the payment.</li><li>Save a screenshot or PDF receipt.</li><li>Tick the Terms &amp; Conditions box, choose your file under <b>Payment Receipt File</b> (up to 5 MB) and press <b>Submit Proof of Payment</b>.</li></ol><div class="man-tip"><i class="bi bi-lightbulb"></i><div>If the QR is not shown yet, contact the resort for payment details before paying.</div></div></div><figure class="man-fig"><img src="../images/manual/payment.jpg" alt="Payment page: scan the QR, then upload your receipt." loading="lazy" width="1000"><figcaption>Figure 5. Payment page: scan the QR, then upload your receipt.</figcaption></figure></div></article><article class="soft-card man-step" id="status"><div class="man-step-head"><span class="man-num">7</span><div><h2 class="man-h2"><i class="bi bi-activity"></i> Track your reservation</h2><p class="text-muted-brand mb-0">Follow your booking from payment to confirmation.</p></div></div><div class="man-step-body"><div class="man-text"><h3 class="man-sub">Directions</h3><ol class="man-dirs"><li>Open <b>Status</b> from your account menu or dashboard.</li><li>Watch the stages: <b>Pending Payment</b>, <b>Waiting for Verification</b>, then <b>Approved / Verified</b>. If <b>Rejected</b>, upload a valid receipt again.</li><li>Once approved, press <b>Download Receipt</b>.</li><li>Before payment is verified you can <b>Edit reservation</b>, <b>Request reschedule</b> or <b>Cancel booking</b>. After your stay, use <b>Check out now</b>.</li></ol><div class="man-tip"><i class="bi bi-lightbulb"></i><div>You also get an email and a bell notification at every step.</div></div></div><figure class="man-fig"><img src="../images/manual/status.jpg" alt="Reservation status with the payment timeline." loading="lazy" width="1000"><figcaption>Figure 6. Reservation status with the payment timeline.</figcaption></figure></div></article><article class="soft-card man-step" id="dashboard"><div class="man-step-head"><span class="man-num">8</span><div><h2 class="man-h2"><i class="bi bi-grid-1x2"></i> Use your dashboard</h2><p class="text-muted-brand mb-0">Your home base after signing in.</p></div></div><div class="man-step-body"><div class="man-text"><h3 class="man-sub">Directions</h3><ol class="man-dirs"><li>Open <b>Dashboard</b> from the profile menu (your name, top right).</li><li>Use the cards: <b>Reservation</b>, <b>Booking</b>, <b>Payment</b>, <b>Status</b> and <b>Live Chat</b>.</li><li>Read replies and booking updates under <b>Notifications</b> (the bell icon).</li><li>After a stay, leave a rating under <b>My Reviews</b>.</li></ol></div><figure class="man-fig"><img src="../images/manual/dashboard.jpg" alt="Guest dashboard (sample account)." loading="lazy" width="1000"><figcaption>Figure 7. Guest dashboard (sample account).</figcaption></figure></div></article><article class="soft-card man-step" id="settings"><div class="man-step-head"><span class="man-num">9</span><div><h2 class="man-h2"><i class="bi bi-gear"></i> Update your profile and password</h2><p class="text-muted-brand mb-0">Keep your details current.</p></div></div><div class="man-step-body"><div class="man-text"><h3 class="man-sub">Directions</h3><ol class="man-dirs"><li>Open the profile menu, then <b>Settings</b>.</li><li>Upload or remove a <b>Profile picture</b> (up to 5 MB).</li><li>Edit your name and phone, then press <b>Save changes</b>.</li><li>To change your password, enter the current one, the new one twice, then press <b>Update password</b>.</li></ol></div><figure class="man-fig"><img src="../images/manual/settings.jpg" alt="Account settings." loading="lazy" width="1000"><figcaption>Figure 8. Account settings.</figcaption></figure></div></article><article class="soft-card man-step" id="help"><div class="man-step-head"><span class="man-num">10</span><div><h2 class="man-h2"><i class="bi bi-chat-dots"></i> Get help</h2><p class="text-muted-brand mb-0">We are happy to assist with any reservation concern.</p></div></div><div class="man-step-body"><div class="man-text"><h3 class="man-sub">Directions</h3><ol class="man-dirs"><li>Open <b>Contacts</b>, choose a Subject, write your message and press <b>Send message</b>. Replies arrive by email and in your notifications.</li><li>Or use the round <b>Live Chat</b> button at the bottom right of any page.</li><li>You can also call <b>+63 970 323 6544</b> or read the <b>FAQs</b>.</li></ol></div><figure class="man-fig"><img src="../images/manual/contact.jpg" alt="Contact page with message form and live chat." loading="lazy" width="1000"><figcaption>Figure 9. Contact page with message form and live chat.</figcaption></figure></div></article>

          <div class="man-band" id="staff"><i class="bi bi-person-workspace"></i><h2>Staff &amp; admin guide</h2></div>
          <article class="soft-card man-step" id="a-roles">
            <div class="man-step-head"><span class="man-num">1</span><div><h2 class="man-h2"><i class="bi bi-people"></i> Roles and access</h2><p class="text-muted-brand mb-0">Staff sign in on the same Log in page; the menu adapts to the account.</p></div></div>
            <div class="table-responsive"><table class="table man-table align-middle mb-3">
              <thead><tr><th>Area</th><th>Guest</th><th>Staff (Event Manager)</th><th>Admin</th></tr></thead>
              <tbody>
                <tr><td>Book, quote, pay</td><td>Yes</td><td>No</td><td>No</td></tr>
                <tr><td>Reservations, Calendar, Live Chat, Messages</td><td>Own only</td><td>Yes</td><td>Yes</td></tr>
                <tr><td>Reports, Reviews, Packages, FAQs, Team</td><td>No</td><td>View only</td><td>Full</td></tr>
                <tr><td>Payment Verification, Users, Settings</td><td>No</td><td>No</td><td>Yes</td></tr>
              </tbody></table></div>
            <div class="man-tip"><i class="bi bi-lightbulb"></i><div>Staff and admin accounts cannot create bookings. The <b>Staff view / Admin view</b> badge in the top bar confirms your role.</div></div>
          </article>
          <article class="soft-card man-step" id="a-dash"><div class="man-step-head"><span class="man-num">1</span><div><h2 class="man-h2"><i class="bi bi-speedometer2"></i> Dashboard and reports</h2><p class="text-muted-brand mb-0">A quick view of bookings, payments and revenue.</p></div></div><div class="man-step-body"><div class="man-text"><h3 class="man-sub">Directions</h3><ol class="man-dirs"><li>Sign in, then open <b>Dashboard</b> from the sidebar.</li><li>Read the cards: Total Bookings, Verified Payments, Pending payment and Awaiting verification.</li><li>Under <b>Download reports</b>, set the dates, status and room, then export Reservation, Booking, Payment or Schedule reports as Excel, DOCX or PDF.</li></ol></div><figure class="man-fig"><img src="../images/manual/admin-dashboard.jpg" alt="Admin dashboard summary cards." loading="lazy" width="1000"><figcaption>Figure 10. Admin dashboard summary cards.</figcaption></figure></div></article><article class="soft-card man-step" id="a-res"><div class="man-step-head"><span class="man-num">2</span><div><h2 class="man-h2"><i class="bi bi-people"></i> Reservations and quotations</h2><p class="text-muted-brand mb-0">Review every booking and send quotations.</p></div></div><div class="man-step-body"><div class="man-text"><h3 class="man-sub">Directions</h3><ol class="man-dirs"><li>Open <b>Reservations</b>. Search or filter by payment status, room/event, quotation status or check-in date.</li><li>Open a reservation to see its details. Press <b>Save draft</b> to keep edits.</li><li>Press <b>Approve &amp; send quotation</b> when the quote is ready. Quotation statuses: Pending Admin Review, Approved, Revised, Accepted by Client.</li><li>Use <b>Export PDF</b> or <b>Export DOCX</b> for records.</li></ol></div><figure class="man-fig"><img src="../images/manual/admin-reservations.jpg" alt="Reservations list with filters." loading="lazy" width="1000"><figcaption>Figure 11. Reservations list with filters.</figcaption></figure></div></article><article class="soft-card man-step" id="a-cal"><div class="man-step-head"><span class="man-num">3</span><div><h2 class="man-h2"><i class="bi bi-calendar3"></i> Booking calendar</h2><p class="text-muted-brand mb-0">See availability and block dates.</p></div></div><div class="man-step-body"><div class="man-text"><h3 class="man-sub">Directions</h3><ol class="man-dirs"><li>Open <b>Calendar</b> and use the arrows to change month.</li><li>Filter by status, event type, space or payment. Switch to <b>Heatmap</b> for a busy-day view.</li><li>Click a date to see its reservations, or press <b>Add booking</b> to record a manual hold.</li></ol><div class="man-tip"><i class="bi bi-lightbulb"></i><div>Colors mark confirmed, pending, cancelled, check-in/out days, overlaps and PH holidays.</div></div></div><figure class="man-fig"><img src="../images/manual/admin-calendar.jpg" alt="Calendar with filters and legend." loading="lazy" width="1000"><figcaption>Figure 12. Calendar with filters and legend.</figcaption></figure></div></article><article class="soft-card man-step" id="a-pay"><div class="man-step-head"><span class="man-num">4</span><div><h2 class="man-h2"><i class="bi bi-qr-code-scan"></i> Payment verification (admin only)</h2><p class="text-muted-brand mb-0">Approve or reject guest receipts.</p></div></div><div class="man-step-body"><div class="man-text"><h3 class="man-sub">Directions</h3><ol class="man-dirs"><li>Open <b>Payment Verification</b>.</li><li>Filter by date submitted or status (Waiting for Verification, Approved, Rejected).</li><li>Open the uploaded receipt, compare it with the quotation, then <b>Approve</b> or <b>Reject</b>. The guest is emailed automatically.</li></ol></div><figure class="man-fig"><img src="../images/manual/admin-payments.jpg" alt="Payment verification queue." loading="lazy" width="1000"><figcaption>Figure 13. Payment verification queue.</figcaption></figure></div></article><article class="soft-card man-step" id="a-chat"><div class="man-step-head"><span class="man-num">5</span><div><h2 class="man-h2"><i class="bi bi-envelope-paper"></i> Live chat and messages</h2><p class="text-muted-brand mb-0">Answer guests quickly.</p></div></div><div class="man-step-body"><div class="man-text"><h3 class="man-sub">Directions</h3><ol class="man-dirs"><li><b>Live Chat</b> is a shared inbox: pick a conversation on the left and reply.</li><li><b>Contact Messages</b> lists form enquiries. Press Reply, or <b>New message to client</b> to use templates (booking follow-up, payment reminder, thank-you).</li></ol></div></div></article><article class="soft-card man-step" id="a-content"><div class="man-step-head"><span class="man-num">6</span><div><h2 class="man-h2"><i class="bi bi-file-earmark-richtext"></i> Site content, users and settings</h2><p class="text-muted-brand mb-0">Update the website without touching code.</p></div></div><div class="man-step-body"><div class="man-text"><h3 class="man-sub">Directions</h3><ol class="man-dirs"><li><b>Site Content</b> has tabs: Page Text, Photos, Packages, FAQs, Reviews, Legal Content and Our Team. Changes go live immediately. Staff can only view Packages, FAQs and Team.</li><li><b>Users</b> (admin only): Add User, set a role (Customer, Event Manager, Admin) and Suspend or Delete accounts.</li><li><b>Settings</b> (admin only): update Resort Information, upload the <b>Payment QR</b> (JPG, PNG or WEBP, up to 3 MB) and manage reminders.</li></ol><div class="man-tip"><i class="bi bi-lightbulb"></i><div>Always upload the current QR before opening bookings; guests see it on the Payment page.</div></div></div><figure class="man-fig"><img src="../images/manual/admin-content.jpg" alt="Site Content editor." loading="lazy" width="1000"><figcaption>Figure 14. Site Content editor.</figcaption></figure></div></article>

          <div class="man-band" id="faq"><i class="bi bi-life-preserver"></i><h2>Troubleshooting</h2></div>
          <details class="man-faq"><summary>I did not receive my verification code.</summary><p>Check Spam, wait a minute, then press Resend code. Make sure the email address is spelled correctly.</p></details><details class="man-faq"><summary>Why can I not pick a date?</summary><p>The date is already booked, blocked by the resort, or a PH holiday. Choose another date or contact us.</p></details><details class="man-faq"><summary>My receipt upload failed.</summary><p>Use a file of 5 MB or less, accept the Terms &amp; Conditions first, then try again.</p></details><details class="man-faq"><summary>My payment was rejected.</summary><p>Upload a clear receipt that matches the exact downpayment amount. You will be notified once it is re-checked.</p></details><details class="man-faq"><summary>I cannot book while signed in as staff.</summary><p>Staff and admin accounts are view-only for bookings. Use a guest account to make a reservation.</p></details><details class="man-faq"><summary>The page looks broken or outdated.</summary><p>Refresh with Ctrl+F5 (Cmd+Shift+R on Mac), or try another browser.</p></details>

          <div class="man-help soft-card">
            <h3>Still need help?</h3>
            <p class="mb-3">Our team will respond as soon as available.</p>
            <a href="contact.html" class="btn btn-accent me-2">Contact us</a>
            <a href="faq.html" class="btn btn-outline-light">Read the FAQs</a>
          </div>
        </main>
      </div>
    </div>
    </div>
  </div>

  <div id="site-footer"></div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../js/main.js?v=20260926c"></script>
  <script>
    renderNavbar("");
    renderFooter();
    (function () {
      const links = Array.from(document.querySelectorAll(".man-toc a"));
      const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            links.forEach((a) => a.classList.remove("active"));
            map.get(e.target.id)?.classList.add("active");
          }
        });
      }, { rootMargin: "-20% 0px -70% 0px" });
      map.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    })();
  </script>
</body>
</html>

@endverbatim
