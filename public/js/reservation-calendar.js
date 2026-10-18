

(function () {

  let serverOccupiedCache = null;
  let serverOccupiedPromise = null;

  function fetchServerOccupied() {
    if (serverOccupiedPromise) return serverOccupiedPromise;

    const getter = typeof window.cvrApiGet === "function"
      ? window.cvrApiGet("content/occupied-dates")
      : fetch("api/content/occupied-dates", { credentials: "same-origin" }).then((res) => ({ ok: res.ok, body: {} }));
    serverOccupiedPromise = Promise.resolve(getter)
      .then((result) => {
        const body = result && result.body ? result.body : result;
        serverOccupiedCache = (body && body.data && Array.isArray(body.data.reservations)) ? body.data.reservations : [];
        return serverOccupiedCache;
      })
      .catch(() => {
        serverOccupiedCache = [];
        return serverOccupiedCache;
      });
    return serverOccupiedPromise;
  }
  window.__cvrFetchServerOccupied = fetchServerOccupied;

  function formatYMD(d) {
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function readReservations() {
    let local = [];
    try {
      local = JSON.parse(localStorage.getItem("cvrReservations") || "[]");
    } catch {
      local = [];
    }

    return local.concat(serverOccupiedCache || []);
  }

  function isReservationCanceled(r) {
    const s = String(r.reservationStatus || "").toLowerCase();
    return s.includes("cancel");
  }

  function getBlockedYmdSet() {
    try {
      const raw = localStorage.getItem("cvrBlockedDates");
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return new Set();
      return new Set(arr.filter((x) => typeof x === "string"));
    } catch {
      return new Set();
    }
  }

  function sameRoom(r, packageId, roomTitle) {
    if (r.bookingType && r.bookingType !== "room") return false;
    if (isReservationCanceled(r)) return false;
    if (r.packageId && packageId) return r.packageId === packageId;
    if (roomTitle && r.roomName) return r.roomName === roomTitle;
    return !!(r.packageId && r.packageId === packageId);
  }

  function getOccupiedRanges(packageId, roomTitle, excludeReservationId) {
    const ranges = [];
    for (const r of readReservations()) {
      if (excludeReservationId && r.id === excludeReservationId) continue;
      if (!sameRoom(r, packageId, roomTitle)) continue;
      if (!r.checkIn || !r.checkOut) continue;
      ranges.push({ start: r.checkIn, end: r.checkOut });
    }
    return ranges;
  }

  function isOccupiedNight(ymd, ranges) {
    return ranges.some(({ start, end }) => start <= ymd && ymd < end);
  }

  function stayOverlaps(ci, co, ranges) {
    for (const { start, end } of ranges) {
      if (ci < end && co > start) return true;
    }
    return false;
  }

  function todayYmd() {
    return formatYMD(new Date());
  }

  function styleHolidayDay(dayElem, d) {
    const ymd = formatYMD(d);
    const holiday = typeof window.getPHHoliday === "function" ? window.getPHHoliday(ymd) : null;
    if (!holiday) return;
    dayElem.classList.add("cvr-cal-day-holiday");
    dayElem.setAttribute("title", `${holiday.name} (${holiday.typeLabel})`);
  }

  window.cvrRoomStayOverlapsExisting = function (packageId, roomName, checkIn, checkOut, excludeReservationId, scheduledCheckIn, scheduledCheckOut) {
    const dur = window.CVRDuration;
    if (dur && scheduledCheckIn && scheduledCheckOut) {
      for (const r of readReservations()) {
        if (excludeReservationId && r.id === excludeReservationId) continue;
        if (!sameRoom(r, packageId, roomName)) continue;
        if (r.scheduledCheckIn && r.scheduledCheckOut) {
          if (dur.windowsOverlap(scheduledCheckIn, scheduledCheckOut, r.scheduledCheckIn, r.scheduledCheckOut)) return true;
        } else if (r.checkIn && r.checkOut) {

          if (checkIn < r.checkOut && checkOut > r.checkIn) return true;
        }
      }
      return false;
    }
    const ranges = getOccupiedRanges(packageId, roomName || "", excludeReservationId || "");
    return stayOverlaps(checkIn, checkOut, ranges);
  };

  window.cvrEventOverlapsExisting = function (scheduledCheckIn, scheduledCheckOut, excludeReservationId) {
    const dur = window.CVRDuration;
    if (!dur || !scheduledCheckIn || !scheduledCheckOut) return false;
    const newStartYmd = formatYMD(new Date(scheduledCheckIn));
    for (const r of readReservations()) {
      if (excludeReservationId && r.id === excludeReservationId) continue;
      if (r.bookingType && r.bookingType !== "event") continue;
      if (isReservationCanceled(r)) continue;
      if (r.scheduledCheckIn && r.scheduledCheckOut) {
        if (dur.windowsOverlap(scheduledCheckIn, scheduledCheckOut, r.scheduledCheckIn, r.scheduledCheckOut)) return true;
      } else if (r.preferredDate) {
        if (r.preferredDate === newStartYmd) return true;
      }
    }
    return false;
  };

  window.initReservationAvailabilityCalendars = async function (opts) {
    const packageId = opts.packageId;
    const roomTitle = opts.roomTitle || "";
    const excludeReservationId = opts.excludeReservationId || "";
    const onChange = typeof opts.onChange === "function" ? opts.onChange : function () {};

    const mountIn = document.getElementById("cvrFpCheckInMount");
    const mountOut = document.getElementById("cvrFpCheckOutMount");
    const hiddenIn = document.getElementById("resCheckIn");
    const hiddenOut = document.getElementById("resCheckOut");
    if (!mountIn || !mountOut || !hiddenIn || !hiddenOut || typeof flatpickr === "undefined") {
      return;
    }

    mountIn.innerHTML = '<p class="text-muted-brand small mb-0">Loading availability…</p>';
    mountOut.innerHTML = '<p class="text-muted-brand small mb-0">Loading availability…</p>';
    await fetchServerOccupied();
    mountIn.innerHTML = "";
    mountOut.innerHTML = "";

    const blocked = getBlockedYmdSet();
    let ranges = getOccupiedRanges(packageId, roomTitle, excludeReservationId);
    let selectedCheckIn = hiddenIn.value || null;

    function styleDayBooked(dayElem, d) {
      const ymd = formatYMD(d);
      const isBooked = isOccupiedNight(ymd, ranges);
      const isBlocked = blocked.has(ymd);
      const isPast = ymd < todayYmd();
      if (isBooked) {
        dayElem.classList.add("cvr-cal-day-booked");
        dayElem.setAttribute("title", "Already booked - not available");
      }
      if (isBlocked) {
        dayElem.classList.add("cvr-cal-day-blocked");
        dayElem.setAttribute("title", "Unavailable (closed / maintenance)");
      }
      if (!isBooked && !isBlocked && !isPast) {
        dayElem.classList.add("cvr-cal-day-available");
        if (!dayElem.getAttribute("title")) dayElem.setAttribute("title", "Available");
      }
    }

    let fpIn;
    let fpOut;

    fpOut = flatpickr(mountOut, {
      inline: true,
      appendTo: mountOut,
      dateFormat: "Y-m-d",
      defaultDate: hiddenOut.value || undefined,
      disable: [
        function (date) {
          const ci = selectedCheckIn || hiddenIn.value;
          const ymd = formatYMD(date);
          if (!ci) return true;
          if (ymd < ci) return true;
          if (blocked.has(ymd)) return true;
          if (ymd === ci) return false;
          return stayOverlaps(ci, ymd, ranges);
        },
      ],
      onChange: function (selectedDates) {
        if (!selectedDates.length) {
          hiddenOut.value = "";
          onChange();
          return;
        }
        const ymd = formatYMD(selectedDates[0]);
        const ci = selectedCheckIn || hiddenIn.value;
        if (!ci || ymd < ci || (ymd !== ci && stayOverlaps(ci, ymd, ranges))) {
          hiddenOut.value = "";
          onChange();
          return;
        }
        hiddenOut.value = ymd;
        onChange();
      },
      onDayCreate: function (_dObj, _dStr, _fp, dayElem) {
        if (dayElem && dayElem.dateObj) {
          styleDayBooked(dayElem, dayElem.dateObj);
          styleHolidayDay(dayElem, dayElem.dateObj);
        }
      },
    });

    fpIn = flatpickr(mountIn, {
      inline: true,
      appendTo: mountIn,
      dateFormat: "Y-m-d",
      minDate: "today",
      defaultDate: hiddenIn.value || undefined,
      disable: [
        function (date) {
          const ymd = formatYMD(date);
          if (ymd < todayYmd()) return true;
          if (blocked.has(ymd)) return true;
          return isOccupiedNight(ymd, ranges);
        },
      ],
      onChange: function (selectedDates) {
        if (!selectedDates.length) {
          hiddenIn.value = "";
          selectedCheckIn = null;
          hiddenOut.value = "";
          fpOut.clear();
          onChange();
          return;
        }
        const d = selectedDates[0];
        selectedCheckIn = formatYMD(d);
        hiddenIn.value = selectedCheckIn;

        const minOut = new Date(d.getTime());
        fpOut.set("minDate", minOut);

        const co = hiddenOut.value;
        if (!co || co < selectedCheckIn || (co !== selectedCheckIn && stayOverlaps(selectedCheckIn, co, ranges))) {
          let candidate = new Date(minOut.getTime());
          for (let i = 0; i < 400; i += 1) {
            const coY = formatYMD(candidate);
            if (
              coY >= selectedCheckIn &&
              !blocked.has(coY) &&
              (coY === selectedCheckIn || !stayOverlaps(selectedCheckIn, coY, ranges))
            ) {
              hiddenOut.value = coY;
              fpOut.setDate(candidate, false);
              break;
            }
            candidate.setDate(candidate.getDate() + 1);
          }
        } else {
          fpOut.setDate(hiddenOut.value, false);
        }
        fpOut.redraw();
        onChange();
      },
      onDayCreate: function (_dObj, _dStr, _fp, dayElem) {
        if (dayElem && dayElem.dateObj) {
          styleDayBooked(dayElem, dayElem.dateObj);
          styleHolidayDay(dayElem, dayElem.dateObj);
        }
      },
    });

    if (hiddenIn.value) {
      selectedCheckIn = hiddenIn.value;
      fpOut.set("minDate", new Date(hiddenIn.value + "T12:00:00"));
    }
    if (hiddenIn.value && hiddenOut.value && hiddenOut.value >= hiddenIn.value) {
      fpOut.setDate(hiddenOut.value, false);
    }
  };

  function isEventDateTaken(ymd, excludeReservationId) {
    for (const r of readReservations()) {
      if (excludeReservationId && r.id === excludeReservationId) continue;
      if (r.bookingType && r.bookingType !== "event") continue;
      if (isReservationCanceled(r)) continue;
      if (!r.preferredDate) continue;
      const start = r.preferredDate;
      const end = r.checkOutDateOnly || r.checkOut || start;
      if (end === start) {
        if (ymd === start) return true;
      } else if (ymd >= start && ymd < end) {
        return true;
      }
    }
    return false;
  }

  window.initEventPreferredDateCalendar = async function (opts = {}) {
    const excludeReservationId = opts.excludeReservationId || "";
    const mountId = opts.mountId || "cvrEventPreferredMount";
    const hiddenId = opts.hiddenId || "eventDate";
    const mount = document.getElementById(mountId);
    const hidden = document.getElementById(hiddenId);
    if (!mount || !hidden || typeof flatpickr === "undefined") return;
    if (mount.querySelector(".flatpickr-calendar")) return;

    mount.innerHTML = '<p class="text-muted-brand small mb-0">Loading availability…</p>';
    await fetchServerOccupied();
    if (mount.querySelector(".flatpickr-calendar")) return;
    mount.innerHTML = "";

    const blocked = getBlockedYmdSet();

    function styleEventDay(dayElem, d) {
      const ymd = formatYMD(d);
      const isBooked = isEventDateTaken(ymd, excludeReservationId);
      const isBlocked = blocked.has(ymd);
      const isPast = ymd < todayYmd();
      if (isBooked) {
        dayElem.classList.add("cvr-cal-day-booked");
        dayElem.setAttribute("title", "Already booked - not available");
      }
      if (isBlocked) {
        dayElem.classList.add("cvr-cal-day-blocked");
        dayElem.setAttribute("title", "Unavailable (closed / maintenance)");
      }
      if (!isBooked && !isBlocked && !isPast) {
        dayElem.classList.add("cvr-cal-day-available");
        if (!dayElem.getAttribute("title")) dayElem.setAttribute("title", "Available");
      }
    }

    flatpickr(mount, {
      inline: true,
      appendTo: mount,
      dateFormat: "Y-m-d",
      minDate: "today",
      defaultDate: hidden.value || undefined,
      disable: [
        function (date) {
          const ymd = formatYMD(date);
          if (ymd < todayYmd()) return true;
          if (blocked.has(ymd)) return true;
          return isEventDateTaken(ymd, excludeReservationId);
        },
      ],
      onChange: function (selectedDates) {
        hidden.value = selectedDates.length ? formatYMD(selectedDates[0]) : "";
        if (typeof opts.onChange === "function") opts.onChange();
      },
      onDayCreate: function (_dObj, _dStr, _fp, dayElem) {
        if (dayElem && dayElem.dateObj) {
          styleEventDay(dayElem, dayElem.dateObj);
          styleHolidayDay(dayElem, dayElem.dateObj);
        }
      },
    });
  };
})();
