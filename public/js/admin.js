

function parseReservationAmount(r) {
  if (typeof r.totalNumeric === "number" && Number.isFinite(r.totalNumeric)) return r.totalNumeric;
  const n = parseFloat(String(r.totalAmount || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function isVerifiedReservation(r) {
  return /approv|paid|verified/i.test(String(r.paymentStatus || ""));
}

function mostCommonCurrency(rec) {
  const counts = {};
  rec.forEach((r) => {
    const c = r.currency || "";
    if (c) counts[c] = (counts[c] || 0) + 1;
  });
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : "PHP";
}

function fmtCurrencyReport(amount, currency) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}

function buildMonthlyTrend(rec, months = 6) {
  const now = new Date();
  const buckets = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString(undefined, { month: "short" }), revenue: 0, bookings: 0 });
  }
  const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
  rec.forEach((r) => {
    const raw = r.checkIn || r.preferredDate || r.createdAt || r.dateCreated;
    const d = raw ? new Date(raw) : null;
    if (!d || Number.isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const b = byKey[key];
    if (!b) return;
    b.bookings += 1;
    if (isVerifiedReservation(r)) b.revenue += parseReservationAmount(r);
  });
  return {
    labels: buckets.map((b) => b.label),
    revenue: buckets.map((b) => Math.round(b.revenue)),
    bookings: buckets.map((b) => b.bookings),
  };
}

function buildRoomDistribution(rec, max = 5) {
  const counts = {};
  rec.forEach((r) => {
    const name = String(r.roomName || r.eventType || "Other").trim() || "Other";
    counts[name] = (counts[name] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, max);
  const rest = sorted.slice(max).reduce((sum, [, c]) => sum + c, 0);
  if (rest > 0) top.push(["Other", rest]);
  return { labels: top.map(([n]) => n), data: top.map(([, c]) => c) };
}

function initDashboardCharts() {
  const revenueCanvas = document.getElementById("revenueChart");
  const bookingCanvas = document.getElementById("bookingChart");

  if (!bookingCanvas || !window.Chart) return;

  const render = () => {
    const rec = typeof getStoredReservations === "function" ? getStoredReservations() : [];
    const { labels, revenue, bookings } = buildMonthlyTrend(rec);

    if (window.__cvrRevenueChart) window.__cvrRevenueChart.destroy();
    if (window.__cvrBookingChart) window.__cvrBookingChart.destroy();

    if (revenueCanvas) {
      window.__cvrRevenueChart = new Chart(revenueCanvas, {
        type: "line",
        data: {
          labels,
          datasets: [{ label: "Revenue", data: revenue, borderColor: "#328bc3", tension: 0.35, fill: false }],
        },
        options: { responsive: true, maintainAspectRatio: false },
      });
    }

    window.__cvrBookingChart = new Chart(bookingCanvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{ label: "Bookings", data: bookings, backgroundColor: "#0c3b5d" }],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  };

  render();
  if (!window.__cvrDashboardChartsSyncBound) {
    window.__cvrDashboardChartsSyncBound = true;
    document.addEventListener("cvr-reservations-synced", render);
  }
}

function initReportsCharts() {
  const trend = document.getElementById("trendChart");
  const room = document.getElementById("roomChart");
  if (!trend || !room || !window.Chart) return;

  const render = () => {
    const rec = typeof getStoredReservations === "function" ? getStoredReservations() : [];
    const el = (id) => document.getElementById(id);

    const verified = rec.filter(isVerifiedReservation);
    const currency = mostCommonCurrency(rec);
    const totalRevenue = verified.reduce((sum, r) => sum + parseReservationAmount(r), 0);
    const verifiedRate = rec.length ? Math.round((verified.length / rec.length) * 100) : 0;
    const avgPerBooking = verified.length ? totalRevenue / verified.length : 0;

    if (el("repKpiRevenue")) el("repKpiRevenue").textContent = rec.length ? fmtCurrencyReport(totalRevenue, currency) : "—";
    if (el("repKpiBookings")) el("repKpiBookings").textContent = String(rec.length);
    if (el("repKpiVerifiedRate")) el("repKpiVerifiedRate").textContent = rec.length ? `${verifiedRate}%` : "—";
    if (el("repKpiAvgRevenue")) el("repKpiAvgRevenue").textContent = verified.length ? fmtCurrencyReport(avgPerBooking, currency) : "—";

    const { labels, revenue, bookings } = buildMonthlyTrend(rec);
    const { labels: roomLabels, data: roomData } = buildRoomDistribution(rec);

    if (window.__cvrTrendChart) window.__cvrTrendChart.destroy();
    if (window.__cvrRoomChart) window.__cvrRoomChart.destroy();

    const trendDatasets = [
      { label: "Revenue", data: revenue, backgroundColor: "#0c3b5d" },
      { label: "Bookings", data: bookings, backgroundColor: "#d9b312" },
    ];

    window.__cvrTrendChart = new Chart(trend, {
      type: "bar",
      data: { labels, datasets: trendDatasets },
      options: { responsive: true, maintainAspectRatio: false },
    });

    window.__cvrRoomChart = new Chart(room, {
      type: "doughnut",
      data: {
        labels: roomLabels.length ? roomLabels : ["No bookings yet"],
        datasets: [{ data: roomLabels.length ? roomData : [1], backgroundColor: ["#0c3b5d", "#328bc3", "#d9b312", "#3d4963", "#242f38", "#8a97a6"] }],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  };

  render();
  if (!window.__cvrReportsChartsSyncBound) {
    window.__cvrReportsChartsSyncBound = true;
    document.addEventListener("cvr-reservations-synced", render);
  }
}

function populateReportRoomSelect(selectEl, records) {
  if (!selectEl) return;
  const names = new Set();
  (records || []).forEach((r) => {
    const n = (r.roomName || r.eventType || "").trim();
    if (n) names.add(n);
  });
  const cur = selectEl.value;
  selectEl.innerHTML = `<option value="all">All</option>`;
  [...names].sort((a, b) => a.localeCompare(b)).forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    selectEl.appendChild(opt);
  });
  if ([...names].includes(cur)) selectEl.value = cur;
}

function initDashboardFromData() {
  const rec = typeof getStoredReservations === "function" ? getStoredReservations() : [];
  const payVerified = rec.filter((r) => /approv|paid|verified/i.test(String(r.paymentStatus || ""))).length;
  const payPending = rec.filter((r) => String(r.paymentStatus || "").includes("Pending Payment")).length;
  const payWait = rec.filter((r) => String(r.paymentStatus || "").includes("Waiting")).length;

  const el = (id) => document.getElementById(id);
  if (el("dashKpiBookings")) el("dashKpiBookings").textContent = String(rec.length);
  if (el("dashKpiVerified")) el("dashKpiVerified").textContent = String(payVerified);
  if (el("dashKpiPending")) el("dashKpiPending").textContent = String(payPending);
  if (el("dashKpiWaiting")) el("dashKpiWaiting").textContent = String(payWait);

  populateReportRoomSelect(el("dashReportRoom"), rec);

  const tbody = el("dashRecentReservationsBody");
  if (!tbody) return;
  if (!rec.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-muted-brand small py-3">No reservations saved yet.</td></tr>`;
    return;
  }
  const fmt = (d) => {
    if (!d) return "—";
    const x = new Date(d);
    return Number.isNaN(x.getTime()) ? String(d) : x.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };
  const chip = (s) => {
    const t = String(s || "").toLowerCase();
    if (t.includes("pending payment")) return "chip-yellow";
    if (t.includes("waiting")) return "chip-blue";
    if (t.includes("approv") || t.includes("paid")) return "chip-green";
    if (t.includes("reject")) return "chip-red";
    return "chip-yellow";
  };
  tbody.innerHTML = rec
    .slice(0, 8)
    .map(
      (r) => `<tr>
      <td>${String(r.id || "")}</td>
      <td>${String(r.customerName || "")}</td>
      <td>${String(r.roomName || r.eventType || "")}</td>
      <td>${fmt(r.checkIn || r.preferredDate)}</td>
      <td class="admin-only-action">${String(r.totalAmount || "")}</td>
      <td><span class="status-chip ${chip(r.paymentStatus)}">${String(r.paymentStatus || "")}</span></td>
    </tr>`
    )
    .join("");

  if (!window.__cvrDashboardSyncBound) {
    window.__cvrDashboardSyncBound = true;
    document.addEventListener("cvr-reservations-synced", () => initDashboardFromData());
  }
}
