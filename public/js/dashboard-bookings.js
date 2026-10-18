function initAdminDashboardBookings() {
  const roomBody = document.getElementById("roomReservationsBody");
  const eventBody = document.getElementById("eventReservationsBody");
  if (!roomBody || !eventBody || !window.CVBookingDB) return;

  const statusToChipClass = (status) => {
    if (status === "Approved") return "chip-green";
    if (status === "Completed") return "chip-blue";
    if (status === "Declined") return "chip-red";
    return "chip-yellow";
  };

  const render = () => {
    const bookings = window.CVBookingDB.loadBookings();
    const roomReservations = bookings.filter((item) => item.bookingType === "room");
    const eventReservations = bookings.filter((item) => item.bookingType === "event");
    const approvedCount = bookings.filter((item) => item.status === "Approved").length;

    const totalEl = document.getElementById("kpiTotalBookings");
    const roomEl = document.getElementById("kpiRoomBookings");
    const eventEl = document.getElementById("kpiEventBookings");
    const approvedEl = document.getElementById("kpiApprovedBookings");

    if (totalEl) totalEl.textContent = String(bookings.length);
    if (roomEl) roomEl.textContent = String(roomReservations.length);
    if (eventEl) eventEl.textContent = String(eventReservations.length);
    if (approvedEl) approvedEl.textContent = String(approvedCount);

    roomBody.innerHTML = roomReservations.length
      ? roomReservations
          .map(
            (item) => `
              <tr>
                <td>${item.id}</td>
                <td>${item.roomName || "-"}</td>
                <td>${item.checkInDate || "-"} to ${item.checkOutDate || "-"}</td>
                <td><span class="status-chip ${statusToChipClass(item.status)}">${item.status}</span></td>
                <td class="text-nowrap">
                  <button class="btn btn-sm btn-outline-primary manage-booking-btn" data-id="${item.id}" data-status="Approved">Approve</button>
                  <button class="btn btn-sm btn-outline-secondary manage-booking-btn" data-id="${item.id}" data-status="Completed">Complete</button>
                </td>
              </tr>
            `
          )
          .join("")
      : '<tr><td colspan="5" class="text-muted-brand">No room reservations yet.</td></tr>';

    eventBody.innerHTML = eventReservations.length
      ? eventReservations
          .map(
            (item) => `
              <tr>
                <td>${item.id}</td>
                <td>${item.eventType || "-"}</td>
                <td>${item.eventGuests || "-"}</td>
                <td>${item.preferredDate || "-"}</td>
                <td><span class="status-chip ${statusToChipClass(item.status)}">${item.status}</span></td>
                <td class="text-nowrap">
                  <button class="btn btn-sm btn-outline-primary manage-booking-btn" data-id="${item.id}" data-status="Approved">Approve</button>
                  <button class="btn btn-sm btn-outline-danger manage-booking-btn" data-id="${item.id}" data-status="Declined">Decline</button>
                </td>
              </tr>
            `
          )
          .join("")
      : '<tr><td colspan="6" class="text-muted-brand">No event reservations yet.</td></tr>';

    const actionButtons = document.querySelectorAll(".manage-booking-btn");
    actionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;
        const status = button.dataset.status;
        if (!id || !status) return;
        window.CVBookingDB.updateBookingStatus(id, status);
        render();
      });
    });
  };

  render();
}
