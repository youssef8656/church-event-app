const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');
const eventService = require('../services/event.service');
const pointsService = require('../services/points.service');

// GET /api/home
// Single call that powers the Home page: event info, today's announcements,
// today's program, current team, points/rank, top-5 + team leaderboards,
// and unread notifications. Kept as one endpoint to avoid a waterfall of
// requests on mobile connections at the venue.
const homeFeed = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const event = await eventService.getActiveEvent();
  const currentDay = await eventService.getCurrentEventDay();

  const [
    announcements,
    program,
    teamAssignment,
    individualTop5,
    myRank,
    teamLeaderboardToday,
    teamLeaderboardCumulative,
    unreadNotifications,
  ] = await Promise.all([
    prisma.announcement.findMany({
      where: { isPublished: true },
      orderBy: [{ isPinned: 'desc' }, { priority: 'desc' }, { publishedAt: 'desc' }],
      take: 5,
    }),
    prisma.programItem.findMany({
      where: { eventDayId: currentDay.id },
      orderBy: [{ sortOrder: 'asc' }, { time: 'asc' }],
    }),
    prisma.teamAssignment.findUnique({
      where: { userId_eventDayId: { userId, eventDayId: currentDay.id } },
      include: { team: true },
    }),
    pointsService.getIndividualLeaderboard({ limit: 5 }),
    pointsService.getUserRank(userId),
    pointsService.getTeamLeaderboard({ eventDayId: currentDay.id, scope: 'TODAY' }),
    pointsService.getTeamLeaderboard({ eventDayId: currentDay.id, scope: 'CUMULATIVE' }),
    prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const isInTop5 = myRank && individualTop5.some((r) => r.userId === userId);

  res.json({
    event: { id: event.id, name: event.name, startDate: event.startDate, endDate: event.endDate },
    eventDay: { id: currentDay.id, dayNumber: currentDay.dayNumber, date: currentDay.date },
    announcements,
    program,
    team: teamAssignment
      ? { id: teamAssignment.team.id, name: teamAssignment.team.name, colorHex: teamAssignment.team.colorHex }
      : null,
    points: myRank ? myRank.points : 0,
    rank: myRank ? myRank.rank : null,
    leaderboard: {
      top5: individualTop5,
      myRank: isInTop5 ? null : myRank, // only surface separately if outside top 5
    },
    teamLeaderboard: {
      today: teamLeaderboardToday,
      cumulative: teamLeaderboardCumulative,
    },
    notifications: unreadNotifications,
  });
});

module.exports = { homeFeed };
