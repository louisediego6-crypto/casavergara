

const CVR_DURATION_OPTIONS = {
  "3hr": {
    key: "3hr",
    label: "3-Hour Quick Stay",
    shortLabel: "3 hrs",
    hours: 3,
    checkInTime: "08:00",
    checkOutTime: "11:00",
    checkInLabel: "8:00 AM",
    checkOutLabel: "11:00 AM",
    spansMidnight: false,
    roomRateMultiplier: 0.18,
    eventRateMultiplier: 0.4,
    description: "Short same-day use. Default check-in 8:00 AM (flexible arrival time available); check-out is exactly 3 hours after your actual check-in.",
  },
  "12hr": {
    key: "12hr",
    label: "12-Hour Day Tour",
    shortLabel: "12 hrs",
    hours: 12,
    checkInTime: "08:00",
    checkOutTime: "20:00",
    checkInLabel: "8:00 AM",
    checkOutLabel: "8:00 PM",
    spansMidnight: false,
    roomRateMultiplier: 0.57,
    eventRateMultiplier: 1.0,
    description: "Same-day use. Default check-in 8:00 AM (flexible arrival time available); check-out is exactly 12 hours after your actual check-in.",
  },
  "24hr": {
    key: "24hr",
    label: "24-Hour Overnight",
    shortLabel: "24 hrs",
    hours: 24,
    checkInTime: "14:00",
    checkOutTime: "14:00",
    checkInLabel: "2:00 PM",
    checkOutLabel: "2:00 PM (next day)",
    spansMidnight: true,
    roomRateMultiplier: 1.0,
    eventRateMultiplier: 1.35,
    description: "Full-day/overnight use. Default check-in 2:00 PM (flexible arrival time available); check-out is exactly 24 hours after your actual check-in.",
  },
  extended: {
    key: "extended",
    label: "Multi-Day / Extended Stay",
    shortLabel: "Multi-day",
    hours: null,
    checkInTime: "14:00",
    checkOutTime: "12:00",
    checkInLabel: "2:00 PM",
    checkOutLabel: "12:00 NN",
    spansMidnight: true,
    minNights: 2,
    maxNights: 14,
    roomRateMultiplier: null,
    eventRateMultiplier: null,
    description: "For stays/events longer than one night. Both the check-in and check-out time are flexible; check-out lands on the chosen day (2-14 nights later) at your requested time, or 12:00 NN by default. Billed at the package's standard per-night rate.",
  },
};

const CVR_OVERTIME_PENALTY_PERCENT_PER_HOUR = 10;
const CVR_OVERTIME_PENALTY_MAX_PERCENT = 100;

function cvrDurationOptionsList() {
  return Object.values(CVR_DURATION_OPTIONS);
}

function cvrGetDurationOption(durationKey) {
  return CVR_DURATION_OPTIONS[durationKey] || null;
}

function cvrRoundToNearest50(amount) {
  return Math.round(Number(amount) / 50) * 50;
}

function cvrClampExtendedNights(nights) {
  const opt = CVR_DURATION_OPTIONS.extended;
  const n = Math.round(Number(nights));
  if (!Number.isFinite(n)) return opt.minNights;
  return Math.min(opt.maxNights, Math.max(opt.minNights, n));
}

function cvrRoomDurationRate(pricePerNight, durationKey, nights) {
  if (durationKey === "extended") return cvrRoomExtendedRate(pricePerNight, nights);
  const opt = cvrGetDurationOption(durationKey);
  if (!opt) return 0;
  return Math.max(0, cvrRoundToNearest50(Number(pricePerNight || 0) * opt.roomRateMultiplier));
}

function cvrRoomExtendedRate(pricePerNight, nights) {
  const n = cvrClampExtendedNights(nights);
  return Math.max(0, cvrRoundToNearest50(Number(pricePerNight || 0) * n));
}

function cvrEventDurationRate(basePrice, durationKey, nights) {
  if (durationKey === "extended") return cvrEventExtendedRate(basePrice, nights);
  const opt = cvrGetDurationOption(durationKey);
  if (!opt || opt.eventRateMultiplier == null) return 0;
  return Math.max(0, cvrRoundToNearest50(Number(basePrice || 0) * opt.eventRateMultiplier));
}

function cvrEventExtendedRate(basePrice, nights) {
  const n = cvrClampExtendedNights(nights);
  return Math.max(0, cvrRoundToNearest50(Number(basePrice || 0) * n));
}

function cvrBuildScheduledWindow(dateStr, durationKey, nights, customCheckInTime, customCheckOutTime) {
  const opt = cvrGetDurationOption(durationKey);
  if (!dateStr || !opt) return null;

  const isExtended = opt.key === "extended";
  const extendedNights = isExtended ? cvrClampExtendedNights(nights) : null;

  const useCustomInTime = cvrIsCustomCheckInTimeAllowed(customCheckInTime);
  const effectiveCheckInTime = useCustomInTime ? customCheckInTime : opt.checkInTime;

  const [inH, inM] = effectiveCheckInTime.split(":").map(Number);

  const checkInDate = new Date(`${dateStr}T00:00:00`);
  checkInDate.setHours(inH, inM, 0, 0);

  let checkOutDate;
  let useCustomOutTime = false;
  let effectiveCheckOutTime = opt.checkOutTime;

  if (isExtended) {

    useCustomOutTime = cvrIsCustomCheckOutTimeAllowed(customCheckOutTime);
    effectiveCheckOutTime = useCustomOutTime ? customCheckOutTime : opt.checkOutTime;
    const [outH, outM] = effectiveCheckOutTime.split(":").map(Number);
    checkOutDate = new Date(checkInDate.getTime());
    checkOutDate.setDate(checkOutDate.getDate() + extendedNights);
    checkOutDate.setHours(outH, outM, 0, 0);
  } else {

    checkOutDate = new Date(checkInDate.getTime() + opt.hours * 60 * 60 * 1000);
  }

  const checkOutTime = `${String(checkOutDate.getHours()).padStart(2, "0")}:${String(checkOutDate.getMinutes()).padStart(2, "0")}`;

  const isoDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  const dayOffset = Math.round(
    (new Date(isoDate(checkOutDate) + "T00:00:00").getTime() -
      new Date(isoDate(checkInDate) + "T00:00:00").getTime()) /
      86400000
  );
  const nextDaySuffix = dayOffset === 1 ? " (next day)" : dayOffset > 1 ? ` (+${dayOffset} days)` : "";

  return {
    durationKey: opt.key,
    nights: isExtended ? extendedNights : 1,
    checkInDateOnly: isoDate(checkInDate),
    checkOutDateOnly: isoDate(checkOutDate),
    scheduledCheckIn: checkInDate.toISOString(),
    scheduledCheckOut: checkOutDate.toISOString(),
    customCheckInTime: useCustomInTime ? effectiveCheckInTime : null,
    customCheckOutTime: useCustomOutTime ? effectiveCheckOutTime : null,
    checkInLabel: cvrFormatTime12(effectiveCheckInTime),
    checkOutTime,
    checkOutLabel: isExtended
      ? `${cvrFormatTime12(checkOutTime)} (after ${extendedNights} night${extendedNights !== 1 ? "s" : ""})`
      : `${cvrFormatTime12(checkOutTime)}${nextDaySuffix}`,
  };
}

function cvrBuildFixedWindow(dateStr, checkInTime, checkOutTime) {
  if (!dateStr || typeof checkInTime !== "string" || typeof checkOutTime !== "string") return null;
  const [inH, inM] = checkInTime.split(":").map(Number);
  const [outH, outM] = checkOutTime.split(":").map(Number);
  if (![inH, inM, outH, outM].every(Number.isFinite)) return null;

  const checkInDate = new Date(`${dateStr}T00:00:00`);
  checkInDate.setHours(inH, inM, 0, 0);

  const spansMidnight = outH * 60 + outM <= inH * 60 + inM;
  const checkOutDate = new Date(checkInDate.getTime());
  if (spansMidnight) checkOutDate.setDate(checkOutDate.getDate() + 1);
  checkOutDate.setHours(outH, outM, 0, 0);

  const isoDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  return {
    nights: 1,
    checkInDateOnly: isoDate(checkInDate),
    checkOutDateOnly: isoDate(checkOutDate),
    scheduledCheckIn: checkInDate.toISOString(),
    scheduledCheckOut: checkOutDate.toISOString(),
    customCheckInTime: null,
    customCheckOutTime: null,
    checkInLabel: cvrFormatTime12(checkInTime),
    checkOutTime,
    checkOutLabel: `${cvrFormatTime12(checkOutTime)}${spansMidnight ? " (next day)" : ""}`,
  };
}

function cvrFormatTime12(hhmm) {
  if (!hhmm || typeof hhmm !== "string" || !hhmm.includes(":")) return "";
  const [hStr, mStr] = hhmm.split(":");
  let h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "";
  const meridiem = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, "0")} ${meridiem}`;
}

function cvrParse12HourTime(hour12, minute, meridiem) {
  const h = Number(hour12);
  const m = Number(minute);
  const mer = String(meridiem || "").toUpperCase();
  if (!Number.isFinite(h) || h < 1 || h > 12) return null;
  if (!Number.isFinite(m) || m < 0 || m > 59) return null;
  if (mer !== "AM" && mer !== "PM") return null;
  let h24 = h % 12;
  if (mer === "PM") h24 += 12;
  return `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const CVR_CUSTOM_CHECKIN_MIN_MINUTES = 0;
const CVR_CUSTOM_CHECKIN_MAX_MINUTES = 23 * 60 + 59;

function cvrIsCustomCheckInTimeAllowed(hhmm) {
  if (typeof hhmm !== "string") return false;
  const match = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return false;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) return false;
  const total = h * 60 + m;
  return total >= CVR_CUSTOM_CHECKIN_MIN_MINUTES && total <= CVR_CUSTOM_CHECKIN_MAX_MINUTES;
}

const cvrIsCustomCheckOutTimeAllowed = cvrIsCustomCheckInTimeAllowed;

function cvrWindowsOverlap(aStartIso, aEndIso, bStartIso, bEndIso) {
  const aStart = new Date(aStartIso).getTime();
  const aEnd = new Date(aEndIso).getTime();
  const bStart = new Date(bStartIso).getTime();
  const bEnd = new Date(bEndIso).getTime();
  if ([aStart, aEnd, bStart, bEnd].some((n) => Number.isNaN(n))) return false;
  return aStart < bEnd && aEnd > bStart;
}

function cvrOvertimeHours(scheduledCheckOutIso, actualCheckoutIso) {
  if (!scheduledCheckOutIso || !actualCheckoutIso) return 0;
  const scheduled = new Date(scheduledCheckOutIso).getTime();
  const actual = new Date(actualCheckoutIso).getTime();
  if (Number.isNaN(scheduled) || Number.isNaN(actual) || actual <= scheduled) return 0;
  const ms = actual - scheduled;
  return Math.ceil(ms / (60 * 60 * 1000));
}

function cvrOvertimePenalty(totalRate, overtimeHours) {
  const total = Number(totalRate) || 0;
  const hours = Math.max(0, Number(overtimeHours) || 0);
  if (hours <= 0 || total <= 0) return 0;
  const rawPercent = CVR_OVERTIME_PENALTY_PERCENT_PER_HOUR * hours;
  const cappedPercent = Math.min(rawPercent, CVR_OVERTIME_PENALTY_MAX_PERCENT);
  return Math.round(total * (cappedPercent / 100) * 100) / 100;
}

function cvrLiveOvertimeStatus(scheduledCheckOutIso, totalRate, now = new Date()) {
  const hours = cvrOvertimeHours(scheduledCheckOutIso, now.toISOString());
  const penalty = cvrOvertimePenalty(totalRate, hours);
  return { overtimeHours: hours, penaltyAmount: penalty, isLate: hours > 0 };
}

window.CVRDuration = {
  OPTIONS: CVR_DURATION_OPTIONS,
  PENALTY_PERCENT_PER_HOUR: CVR_OVERTIME_PENALTY_PERCENT_PER_HOUR,
  PENALTY_MAX_PERCENT: CVR_OVERTIME_PENALTY_MAX_PERCENT,
  CUSTOM_CHECKIN_MIN_MINUTES: CVR_CUSTOM_CHECKIN_MIN_MINUTES,
  CUSTOM_CHECKIN_MAX_MINUTES: CVR_CUSTOM_CHECKIN_MAX_MINUTES,
  list: cvrDurationOptionsList,
  get: cvrGetDurationOption,
  roomRate: cvrRoomDurationRate,
  extendedRate: cvrRoomExtendedRate,
  clampExtendedNights: cvrClampExtendedNights,
  eventRate: cvrEventDurationRate,
  eventExtendedRate: cvrEventExtendedRate,
  buildWindow: cvrBuildScheduledWindow,
  buildFixedWindow: cvrBuildFixedWindow,
  windowsOverlap: cvrWindowsOverlap,
  overtimeHours: cvrOvertimeHours,
  overtimePenalty: cvrOvertimePenalty,
  liveOvertimeStatus: cvrLiveOvertimeStatus,
  formatTime12: cvrFormatTime12,
  parse12HourTime: cvrParse12HourTime,
  isCustomCheckInTimeAllowed: cvrIsCustomCheckInTimeAllowed,
  isCustomCheckOutTimeAllowed: cvrIsCustomCheckOutTimeAllowed,
};
