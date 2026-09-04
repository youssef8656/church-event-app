const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');
const eventService = require('../services/event.service');
const pointsService = require('../services/points.service');

// GET /api/users/me/profile
const myProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const currentDay = await eventService.getCurrentEventDay();

  const [user, teamAssignment, roomAssignment, rank, tasks] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true, role: true, createdAt: true },
    }),
    prisma.teamAssignment.findUnique({
      where: { userId_eventDayId: { userId, eventDayId: currentDay.id } },
      include: { team: true },
    }),
    prisma.roomAssignment.findFirst({
      where: { userId, active: true },
      include: { room: { include: { assignments: { where: { active: true }, include: { user: true } } } } },
    }),
    pointsService.getUserRank(userId),
    prisma.taskAssignment.findMany({
      where: { userId },
      include: { task: true },
      orderBy: { task: { dueAt: 'asc' } },
    }),
  ]);

  res.json({
    user,
    eventDay: currentDay,
    team: teamAssignment ? { id: teamAssignment.team.id, name: teamAssignment.team.name, colorHex: teamAssignment.team.colorHex } : null,
    room: roomAssignment
      ? {
          id: roomAssignment.room.id,
          label: roomAssignment.room.label,
          roommates: roomAssignment.room.assignments
            .filter((a) => a.userId !== userId)
            .map((a) => ({ id: a.user.id, fullName: a.user.fullName })),
        }
      : null,
    points: rank ? rank.points : 0,
    rank: rank ? rank.rank : null,
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.task.title,
      description: t.task.description,
      points: t.task.points,
      dueAt: t.task.dueAt,
      status: t.status,
    })),
  });
});

module.exports = { myProfile };
