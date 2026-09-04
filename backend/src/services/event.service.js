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
 * client. Falls back to the closest day if today is outside the event range
 * (useful for testing/staging before/after the real dates), and admins can
 * always explicitly pass an eventDayId to bypass this for management screens.
 */
async function getCurrentEventDay() {
  const event = await getActiveEvent();
  const days = await prisma.eventDay.findMany({
    where: { eventId: event.id },
    orderBy: { dayNumber: 'asc' },
  });
  if (days.length === 0) throw ApiError.notFound('Event has no days configured');

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const exact = days.find((d) => sameCalendarDay(d.date, todayMidnight));
  if (exact) return exact;

  // Outside event range: clamp to first day if before event, last day if after.
  if (todayMidnight < days[0].date) return days[0];
  return days[days.length - 1];
}

function sameCalendarDay(a, b) {
  const da = new Date(a);
  return (
    da.getFullYear() === b.getFullYear() &&
    da.getMonth() === b.getMonth() &&
    da.getDate() === b.getDate()
  );
}

module.exports = { getActiveEvent, getCurrentEventDay };
