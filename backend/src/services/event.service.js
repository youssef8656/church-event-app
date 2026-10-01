const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

/**
 * Returns the single active Event record. For this app there is one
 * event per deployment/season; if none exists yet, admins must create one
 * via the settings screen before the rest of the app becomes usable.
 */
async function getActiveEvent() {
  const event = await prisma.event.findFirst({ orderBy: { startDate: 'desc' } });
  if (!event) throw ApiError.notFound('No event has been configured yet');
  return event;
}

/**
 * Determines "today" as an EventDay using SERVER time, never trusting the
 * client. Compares using UTC calendar components explicitly — not the
 * server process's local timezone — so this gives the same answer
 * regardless of what timezone the server happens to be configured for,
 * as long as EventDay.date values were themselves stored as UTC midnight
 * (see events.controller.js / seed.js, which now construct dates with an
 * explicit 'Z' suffix for exactly this reason).
 */
async function getCurrentEventDay() {
  const event = await getActiveEvent();
  const days = await prisma.eventDay.findMany({
    where: { eventId: event.id },
    orderBy: { dayNumber: 'asc' },
  });
  if (days.length === 0) throw ApiError.notFound('Event has no days configured');

  const now = new Date();
  const todayMidnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const exact = days.find((d) => sameCalendarDayUTC(new Date(d.date), todayMidnightUTC));
  if (exact) return exact;

  // Outside event range: clamp to first day if before event, last day if after.
  if (todayMidnightUTC < new Date(days[0].date)) return days[0];
  return days[days.length - 1];
}

function sameCalendarDayUTC(a, b) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

module.exports = { getActiveEvent, getCurrentEventDay };