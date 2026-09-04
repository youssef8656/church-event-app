const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const settingsService = require('./settings.service');

/**
 * Resolves a scanned QR token to the user it belongs to, WITHOUT leaking
 * any info about invalid tokens beyond "not found" (avoids token enumeration).
 */
async function resolveUserByQrToken(qrToken) {
  const user = await prisma.user.findUnique({ where: { qrToken } });
  if (!user) throw ApiError.notFound('QR code not recognized');
  return user;
}

/**
 * Core check-in flow, called from the scanner endpoint.
 *  1. Resolve user from QR token.
 *  2. Load the meeting (must exist).
 *  3. Reject duplicate check-in for this user+meeting (friendly message,
 *     backed by a DB unique constraint as the real guarantee).
 *  4. Compute points using SERVER time vs meeting.startTime, honoring
 *     per-meeting overrides or falling back to event-wide settings.
 *  5. Record Attendance + a matching PointsTransaction atomically.
 */
async function checkIn({ qrToken, meetingId, scannedById }) {
  const user = await resolveUserByQrToken(qrToken);

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { eventDay: { include: { event: true } } },
  });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  const existing = await prisma.attendance.findUnique({
    where: { userId_meetingId: { userId: user.id, meetingId } },
  });
  if (existing) {
    return {
      alreadyCheckedIn: true,
      user: publicUser(user),
      meeting: publicMeeting(meeting),
      checkInAt: existing.checkInAt,
      pointsAwarded: existing.pointsAwarded,
    };
  }

  const now = new Date(); // authoritative server time — never trust client clocks

  const graceMinutes = meeting.graceMinutes ?? parseInt(
    await settingsService.getSetting(meeting.eventDay.eventId, 'attendance.graceMinutes'), 10
  );
  const attendancePoints = meeting.attendancePoints ?? parseInt(
    await settingsService.getSetting(meeting.eventDay.eventId, 'attendance.points'), 10
  );

  const cutoff = new Date(meeting.startTime.getTime() + graceMinutes * 60 * 1000);
  const qualifiesForPoints = now <= cutoff;
  const pointsAwarded = qualifiesForPoints ? attendancePoints : 0;

  const { attendance } = await prisma.$transaction(async (tx) => {
    const attendance = await tx.attendance.create({
      data: {
        userId: user.id,
        meetingId,
        checkInAt: now,
        pointsAwarded,
        scannedById: scannedById || null,
      },
    });

    if (pointsAwarded > 0) {
      await tx.pointsTransaction.create({
        data: {
          userId: user.id,
          amount: pointsAwarded,
          sourceType: 'ATTENDANCE',
          reason: `Attendance: ${meeting.title}`,
          attendanceId: attendance.id,
        },
      });
    }

    return { attendance };
  });

  return {
    alreadyCheckedIn: false,
    user: publicUser(user),
    meeting: publicMeeting(meeting),
    checkInAt: attendance.checkInAt,
    pointsAwarded: attendance.pointsAwarded,
  };
}

async function getUserAttendanceHistory(userId) {
  const rows = await prisma.attendance.findMany({
    where: { userId },
    include: { meeting: { include: { eventDay: true } } },
    orderBy: { checkInAt: 'desc' },
  });
  return rows.map((r) => ({
    id: r.id,
    date: r.meeting.eventDay.date,
    meetingTitle: r.meeting.title,
    checkInAt: r.checkInAt,
    pointsAwarded: r.pointsAwarded,
  }));
}

function publicUser(user) {
  return { id: user.id, fullName: user.fullName };
}
function publicMeeting(meeting) {
  return { id: meeting.id, title: meeting.title, startTime: meeting.startTime };
}

module.exports = { checkIn, getUserAttendanceHistory, resolveUserByQrToken };
