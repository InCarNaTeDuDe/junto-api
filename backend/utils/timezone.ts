/**
 * Timezone & Daylight Saving Time (DST) Utility
 * Leverages native Intl.DateTimeFormat (backed by the full IANA TZ database)
 * to handle daylight saving time shifts, leap years, and regional offsets concisely.
 */

/**
 * Returns date in YYYY-MM-DD format for a given date and IANA timezone.
 */
export function getLocalDateString(
  date: Date | string | number = new Date(),
  timeZone = "Asia/Kolkata",
): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date));
  } catch {
    return new Date(date).toISOString().slice(0, 10);
  }
}

/**
 * Checks whether a candidate timestamp/date falls on "today" in the specified timezone.
 */
export function isTodayInTimezone(
  candidate: Date | string | number | undefined | null,
  timeZone = "Asia/Kolkata",
): boolean {
  if (!candidate) return false;
  const d = new Date(candidate);
  if (isNaN(d.getTime())) return false;
  return (
    getLocalDateString(d, timeZone) === getLocalDateString(new Date(), timeZone)
  );
}

/**
 * Extracts client timezone from Express request headers, query, or body.
 */
export function getClientTimezone(req: any): string {
  const tz =
    req?.headers?.["x-timezone"] ||
    req?.query?.timezone ||
    req?.query?.tz ||
    req?.body?.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "Asia/Kolkata";

  try {
    // Validate IANA timezone string
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return String(tz);
  } catch {
    return "Asia/Kolkata";
  }
}

/**
 * Checks whether an activity or ticket matches today in the client's timezone.
 */
export function isActivityMatchingToday(
  activity: any,
  timeZone = "Asia/Kolkata",
): boolean {
  if (!activity) return false;
  return (
    isTodayInTimezone(activity.datetime, timeZone) ||
    isTodayInTimezone(activity.createdAt, timeZone)
  );
}

/**
 * Checks whether a ride matches today in the client's timezone.
 */
export function isRideMatchingToday(
  ride: any,
  timeZone = "Asia/Kolkata",
): boolean {
  if (!ride) return false;

  // Active or in-progress trips are always relevant for today
  if (
    ride.status === "in_progress" ||
    ride.status === "both_travelling" ||
    ride.isDriverTravelling
  ) {
    return true;
  }

  // Check date or createdAt fields
  if (ride.date && isTodayInTimezone(ride.date, timeZone)) return true;
  if (ride.createdAt && isTodayInTimezone(ride.createdAt, timeZone))
    return true;

  // Check departure time string
  if (ride.time) {
    const parsed = new Date(ride.time);
    if (!isNaN(parsed.getTime()) && isTodayInTimezone(parsed, timeZone)) {
      return true;
    }

    try {
      const now = new Date();
      const usFmt = new Intl.DateTimeFormat("en-US", {
        timeZone,
        month: "short",
        day: "numeric",
      }).format(now);
      const inFmt = new Intl.DateTimeFormat("en-IN", {
        timeZone,
        day: "numeric",
        month: "short",
      }).format(now);
      const s = String(ride.time);
      if (
        s.includes(usFmt) ||
        s.includes(inFmt) ||
        s.toLowerCase().includes("today")
      ) {
        return true;
      }
    } catch {}
  }

  return false;
}
